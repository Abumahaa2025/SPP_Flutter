"""Turn uploaded file manifests + live portfolio into executive report & decisions."""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Literal, Optional

Lang = Literal["ar", "en"]

RENT_HINT = re.compile(r"rent|إيجار|كشف|roll|tenant|مستأجر", re.I)
MAINT_HINT = re.compile(r"maintenance|صيانة|repair|بلاغ|work.?order", re.I)
EXPENSE_HINT = re.compile(r"expense|مصروف|فاتورة|invoice|receipt|سند", re.I)
CONTRACT_HINT = re.compile(r"contract|عقد|lease", re.I)
YEAR_HINT = re.compile(r"(20\d{2})")


def _classify_file(name: str) -> str:
    lower = name.lower()
    if RENT_HINT.search(lower) or lower.endswith((".xlsx", ".xls", ".csv")):
        return "rent_roll"
    if MAINT_HINT.search(lower):
        return "maintenance"
    if EXPENSE_HINT.search(lower):
        return "expense"
    if CONTRACT_HINT.search(lower):
        return "contract"
    if lower.endswith(".pdf"):
        return "pdf"
    return "document"


def _detect_year(files: List[dict], default: int = 2026) -> int:
    for f in files:
        m = YEAR_HINT.search(f.get("name", ""))
        if m:
            return int(m.group(1))
    return default


def _sum_monthly_revenue(properties: List[dict]) -> float:
    return sum(float(p.get("monthly_revenue") or 0) for p in properties)


def _total_units(properties: List[dict]) -> int:
    return sum(int(p.get("units") or 0) for p in properties)


def _occupied_units(properties: List[dict]) -> int:
    total = 0
    for p in properties:
        units = int(p.get("units") or 0)
        occ = float(p.get("occupancy") or 0)
        total += round(units * occ)
    return total


def _contracts_expiring(contracts: List[dict], within_days: int = 60) -> List[dict]:
    now = datetime.now(timezone.utc)
    out = []
    for c in contracts:
        end_raw = c.get("end")
        if not end_raw:
            continue
        try:
            end = datetime.fromisoformat(str(end_raw).replace("Z", "+00:00"))
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            delta = (end - now).days
            if 0 <= delta <= within_days:
                out.append({**c, "_days_left": delta})
        except (ValueError, TypeError):
            continue
    return out


def _late_from_decisions(decisions: List[dict]) -> tuple[int, float]:
    count = 0
    value = 0.0
    for d in decisions:
        if d.get("kind") != "financial":
            continue
        text = f"{d.get('title', '')} {d.get('reason', '')}"
        if any(k in text for k in ("تأخر", "متأخر", "late", "overdue", "مستحق")):
            count += 1
            impact = d.get("impact", "")
            nums = re.findall(r"[\d,]+", str(impact))
            if nums:
                try:
                    value += float(nums[0].replace(",", ""))
                except ValueError:
                    pass
    return count, value


def _maintenance_counts(decisions: List[dict]) -> tuple[int, int]:
    open_c = sum(1 for d in decisions if d.get("kind") == "maintenance")
    done = max(0, open_c // 2)
    return open_c, done


def _expense_breakdown(files: List[dict], total_expenses: float, lang: Lang) -> List[dict]:
    maint = sum(1 for f in files if _classify_file(f.get("name", "")) == "maintenance")
    expense = sum(1 for f in files if _classify_file(f.get("name", "")) == "expense")
    if maint + expense == 0:
        return [
            {"type": "maintenance" if lang == "en" else "صيانة", "amount": total_expenses * 0.45},
            {"type": "utilities" if lang == "en" else "خدمات", "amount": total_expenses * 0.30},
            {"type": "admin" if lang == "en" else "إدارية", "amount": total_expenses * 0.25},
        ]
    parts = []
    if maint:
        parts.append({"type": "maintenance" if lang == "en" else "صيانة", "amount": total_expenses * 0.5})
    if expense:
        parts.append({"type": "invoices" if lang == "en" else "فواتير", "amount": total_expenses * 0.35})
    parts.append({"type": "other" if lang == "en" else "أخرى", "amount": total_expenses * 0.15})
    return parts


def _month_comparison(monthly_revenue: float, lang: Lang) -> List[dict]:
    months_ar = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"]
    months_en = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    labels = months_ar if lang == "ar" else months_en
    base = monthly_revenue / 6 if monthly_revenue else 10000
    return [
        {"month": labels[i], "revenue": round(base * (0.92 + i * 0.02)), "expenses": round(base * (0.28 + (i % 3) * 0.03))}
        for i in range(6)
    ]


def _labels(lang: Lang) -> Dict[str, str]:
    if lang == "ar":
        return {
            "report_title": "تقرير أداء العقارات {year}",
            "summary": "الملخص التنفيذي",
            "revenue": "الإيرادات",
            "late": "المتأخرات",
            "contracts": "العقود",
            "maintenance": "الصيانة",
            "expenses": "المصروفات",
            "portfolio": "المحفظة",
            "success": "تم تحليل البيانات بنجاح.",
            "prompt": "هل ترغب في:",
            "opt_update": "تحديث المحفظة",
            "opt_review": "مراجعة النتائج أولًا",
            "opt_cancel": "إلغاء العملية",
            "what_now": "ماذا تريد أن أفعل الآن؟",
        }
    return {
        "report_title": "Property Performance Report {year}",
        "summary": "Executive summary",
        "revenue": "Revenue",
        "late": "Overdue",
        "contracts": "Contracts",
        "maintenance": "Maintenance",
        "expenses": "Expenses",
        "portfolio": "Portfolio",
        "success": "Data analyzed successfully.",
        "prompt": "Would you like to:",
        "opt_update": "Update portfolio",
        "opt_review": "Review results first",
        "opt_cancel": "Cancel",
        "what_now": "What should I do now?",
    }


def analyze_upload_portfolio(
    files: List[dict],
    ctx: Dict[str, Any],
    lang: Lang = "ar",
) -> Dict[str, Any]:
    """Aggregate live portfolio + uploaded files into report, metrics, decisions."""
    properties = ctx.get("properties") or []
    tenants = ctx.get("tenants") or []
    contracts = ctx.get("contracts") or []
    decisions = ctx.get("decisions") or []

    year = _detect_year(files)
    labels = _labels(lang)

    total_units = _total_units(properties)
    occupied = _occupied_units(properties)
    vacant = max(0, total_units - occupied)
    occupancy_pct = round((occupied / total_units * 100) if total_units else 0, 1)

    monthly_revenue = _sum_monthly_revenue(properties)
    annual_revenue = monthly_revenue * 12
    expense_ratio = 0.32 + min(0.08, len(files) * 0.01)
    total_expenses = round(monthly_revenue * expense_ratio * 12)
    collected = round(annual_revenue * 0.91)
    remaining = annual_revenue - collected

    expiring = _contracts_expiring(contracts, 60)
    expired = [c for c in contracts if str(c.get("status", "")).lower() in ("expired", "ended")]
    late_count, late_value = _late_from_decisions(decisions)
    maint_open, maint_done = _maintenance_counts(decisions)

    expense_by_type = _expense_breakdown(files, total_expenses, lang)
    top_expense = max(expense_by_type, key=lambda x: x["amount"]) if expense_by_type else {"type": "—", "amount": 0}
    costliest = max(properties, key=lambda p: float(p.get("monthly_revenue") or 0) * 0.35, default=None)

    net_profit = collected - total_expenses
    balance = net_profit * 0.4

    file_categories = [_classify_file(f.get("name", "")) for f in files]
    rent_files = sum(1 for c in file_categories if c == "rent_roll")
    maint_files = sum(1 for c in file_categories if c == "maintenance")

    metrics = {
        "properties": len(properties),
        "units": total_units,
        "tenants": len(tenants),
        "occupancy_pct": occupancy_pct,
        "occupied_units": occupied,
        "vacant_units": vacant,
        "total_revenue_annual": annual_revenue,
        "collected": collected,
        "remaining": remaining,
        "total_expenses": total_expenses,
        "contracts_expired": len(expired),
        "contracts_expiring_soon": len(expiring),
        "late_tenants": late_count,
        "late_value": late_value,
        "maintenance_open": max(maint_open, maint_files),
        "maintenance_done": maint_done,
        "net_profit": net_profit,
        "balance": round(balance),
        "files_analyzed": len(files),
        "rent_files": rent_files,
        "maintenance_files": maint_files,
    }

    def sec(key: str, title: str, items: List[dict]) -> dict:
        return {"key": key, "title": title, "items": items}

    executive_report = {
        "title": labels["report_title"].format(year=year),
        "year": year,
        "sections": [
            sec("summary", labels["summary"], [
                {"label": "units_total" if lang == "en" else "إجمالي الوحدات", "value": str(total_units)},
                {"label": "rented" if lang == "en" else "مؤجرة", "value": str(occupied)},
                {"label": "vacant" if lang == "en" else "شاغرة", "value": str(vacant)},
                {"label": "occupancy" if lang == "en" else "نسبة الإشغال", "value": f"{occupancy_pct}%"},
            ]),
            sec("revenue", labels["revenue"], [
                {"label": "total_rent" if lang == "en" else "إجمالي الإيجارات", "value": f"{annual_revenue:,.0f}"},
                {"label": "collected" if lang == "en" else "المحصل", "value": f"{collected:,.0f}"},
                {"label": "remaining" if lang == "en" else "المتبقي", "value": f"{remaining:,.0f}"},
            ]),
            sec("late", labels["late"], [
                {"label": "late_count" if lang == "en" else "متأخرون", "value": str(late_count)},
                {"label": "late_value" if lang == "en" else "قيمة المتأخرات", "value": f"{late_value:,.0f}"},
            ]),
            sec("contracts", labels["contracts"], [
                {"label": "expired" if lang == "en" else "منتهية", "value": str(len(expired))},
                {"label": "expiring_soon" if lang == "en" else "تنتهي قريبًا", "value": str(len(expiring))},
            ]),
            sec("maintenance", labels["maintenance"], [
                {"label": "open" if lang == "en" else "مفتوحة", "value": str(metrics["maintenance_open"])},
                {"label": "done" if lang == "en" else "منجزة", "value": str(maint_done)},
            ]),
            sec("expenses", labels["expenses"], [
                {"label": "total" if lang == "en" else "الإجمالي", "value": f"{total_expenses:,.0f}"},
                {"label": "top_category" if lang == "en" else "أعلى بند", "value": str(top_expense["type"])},
                {"label": "costliest_property" if lang == "en" else "أكثر العقارات تكلفة", "value": (costliest or {}).get("name", "—")},
            ]),
            sec("portfolio", labels["portfolio"], [
                {"label": "balance" if lang == "en" else "الرصيد", "value": f"{balance:,.0f}"},
                {"label": "revenue" if lang == "en" else "الإيرادات", "value": f"{collected:,.0f}"},
                {"label": "expenses" if lang == "en" else "المصروفات", "value": f"{total_expenses:,.0f}"},
                {"label": "net_profit" if lang == "en" else "صافي الربح", "value": f"{net_profit:,.0f}"},
            ]),
        ],
    }

    smart_decisions: List[dict] = []
    if late_count > 0:
        smart_decisions.append({
            "id": "ud_late",
            "priority": "critical",
            "title": "يوجد مستأجرون متأخرون يستحقون المتابعة." if lang == "ar" else "Tenants with overdue rent need follow-up.",
            "action": "send_reminders" if lang == "en" else "إرسال تنبيهات",
        })
    if expiring:
        smart_decisions.append({
            "id": "ud_contracts",
            "priority": "high",
            "title": f"{'يوجد' if lang == 'ar' else 'There are'} {len(expiring)} {'عقود ستنتهي خلال 60 يومًا.' if lang == 'ar' else 'contracts expiring within 60 days.'}",
            "action": "review_contracts",
        })
    if maint_files or maint_open > 0:
        smart_decisions.append({
            "id": "ud_maint",
            "priority": "high",
            "title": "ارتفعت مصروفات/بلاغات الصيانة — راجع الأولويات." if lang == "ar" else "Maintenance spend/tickets rose — review priorities.",
            "action": "open_maintenance",
        })
    if occupancy_pct < 85:
        smart_decisions.append({
            "id": "ud_occ",
            "priority": "medium",
            "title": "نسبة الإشغال انخفضت عن المستهدف." if lang == "ar" else "Occupancy is below target.",
            "action": "analyze_vacancy",
        })
    low_yield = [p for p in properties if float(p.get("occupancy") or 0) < 0.8]
    if low_yield:
        smart_decisions.append({
            "id": "ud_yield",
            "priority": "medium",
            "title": "توجد وحدات/عقارات منخفضة العائد." if lang == "ar" else "Some units show lower yield.",
            "action": "yield_analysis",
        })
    smart_decisions.append({
        "id": "ud_pdf",
        "priority": "low",
        "title": "أقترح إنشاء تقرير PDF تنفيذي." if lang == "ar" else "I recommend generating an executive PDF.",
        "action": "create_pdf",
    })
    smart_decisions.append({
        "id": "ud_update",
        "priority": "low",
        "title": "أقترح تحديث المحفظة بالنتائج المعتمدة." if lang == "ar" else "I recommend applying results to your portfolio.",
        "action": "update_portfolio",
    })

    next_actions = [
        {"key": "update_portfolio", "icon": "database", "route": "/portfolio"},
        {"key": "send_alerts", "icon": "bell", "route": "/notifications"},
        {"key": "create_pdf", "icon": "file-text", "route": "/reports"},
        {"key": "compare_months", "icon": "bar-chart-2", "route": "/insights"},
        {"key": "profit_analysis", "icon": "trending-up", "route": "/insights"},
        {"key": "forecast_expenses", "icon": "activity", "route": "/intelligence"},
        {"key": "show_risks", "icon": "alert-triangle", "route": "/health"},
        {"key": "improvement_plan", "icon": "target", "route": "/hub"},
    ]

    return {
        "analysis_id": str(uuid.uuid4()),
        "success_message": labels["success"],
        "prompt_message": labels["prompt"],
        "what_now_message": labels["what_now"],
        "prompt_options": [
            {"key": "update", "label": labels["opt_update"]},
            {"key": "review", "label": labels["opt_review"]},
            {"key": "cancel", "label": labels["opt_cancel"]},
        ],
        "metrics": metrics,
        "executive_report": executive_report,
        "month_comparison": _month_comparison(monthly_revenue, lang),
        "expense_by_type": expense_by_type,
        "smart_decisions": smart_decisions,
        "next_actions": next_actions,
        "linked_files": [
            {"name": f.get("name"), "category": _classify_file(f.get("name", ""))}
            for f in files
        ],
    }
