"""Bridge to SPP_Official GAS Smart Import engines — no logic rewrite, format adapter only."""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Literal, Optional

from .gas_client import GasClientError
from .live_data import get_gas_client
from .upload_analysis.intake_classifier import month_label
from .upload_analysis.portfolio_engine import analyze_upload_portfolio

logger = logging.getLogger(__name__)

Lang = Literal["ar", "en"]

_import_sessions: Dict[str, Dict[str, Any]] = {}


def gas_import_available() -> bool:
    return get_gas_client().configured


def _to_gas_files_meta(files: List[dict]) -> List[dict]:
    out: List[dict] = []
    for f in files:
        out.append(
            {
                "name": f.get("name") or "",
                "mime": f.get("mimeType") or f.get("mime") or "",
                "mimeType": f.get("mimeType") or "",
                "size": f.get("size"),
                "textSnippet": f.get("textSnippet") or f.get("contentPreview") or "",
                "parsedFromExcel": bool(f.get("parsedFromExcel")),
            }
        )
    return out


def _item(label: str, value: str) -> dict:
    return {"label": label, "value": value}


def _sec(key: str, title: str, items: List[dict]) -> dict:
    return {"key": key, "title": title, "items": items}


def _labels(lang: Lang) -> Dict[str, str]:
    if lang == "ar":
        return {
            "report_title": "تقرير أداء العقارات {year}",
            "files": "تصنيف الملفات المرفوعة",
            "months": "ربط الأشهر والمقارنة",
            "moved_out": "من غادر",
            "moved_in": "من دخل / جدد",
            "late": "المتأخرات — بالاسم والوحدة",
            "late_tenants": "المستأجرون المتأخرون",
            "units_summary": "ملخص الوحدات",
            "quality": "سجل المراجعة والأخطاء",
            "revenue": "الإيرادات والتحصيل",
            "expenses": "المصروفات والصيانة",
            "contracts": "العقود المنتهية والقريبة",
            "portfolio": "صافي الربح والمحفظة",
            "success": "تم تحليل كشوف العقار وربط {months} أشهر.",
            "prompt": "تم التحليل — ماذا تريد أن تفعل؟",
            "opt_update": "اعتماد في المحفظة",
            "opt_review": "مراجعة قبل الاعتماد",
            "opt_cancel": "إلغاء",
            "what_now": "ماذا تريد أن أفعل الآن؟",
        }
    return {
        "report_title": "Property Performance Report {year}",
        "files": "Uploaded file classification",
        "months": "Month linking & comparison",
        "moved_out": "Departed tenants",
        "moved_in": "New / renewed tenants",
        "late": "Late payments — by name & unit",
        "late_tenants": "Late tenants",
        "units_summary": "Units summary",
        "quality": "Review log & warnings",
        "revenue": "Revenue & collection",
        "expenses": "Expenses & maintenance",
        "contracts": "Expired & expiring contracts",
        "portfolio": "Net profit & portfolio",
        "success": "Analyzed {months} linked months from property statements.",
        "prompt": "Analysis complete — what would you like to do?",
        "opt_update": "Apply to portfolio",
        "opt_review": "Review before applying",
        "opt_cancel": "Cancel",
        "what_now": "What should I do now?",
    }


def map_gas_report_to_portfolio(
    gas_payload: dict,
    files: List[dict],
    lang: Lang = "ar",
) -> Dict[str, Any]:
    """Adapt GAS runSmartPropertyImportPipeline response → app PortfolioAnalysis shape."""
    report = gas_payload.get("report") or gas_payload
    batch_id = gas_payload.get("batchId") or report.get("batchId") or str(uuid.uuid4())
    labels = _labels(lang)

    lc = report.get("lifecycle") or {}
    ann = report.get("annual") or {}
    dr = report.get("detailedReport") or {}
    stats = report.get("stats") or {}
    pb = dr.get("paymentBoard") or {}

    year = int(dr.get("year") or lc.get("lastYear") or ann.get("year") or 2026)
    month_count = int(lc.get("monthCount") or dr.get("monthCount") or 0)
    departed = lc.get("departed") or []
    active = lc.get("active") or []
    newcomers = lc.get("newcomers") or []
    late_rows = (pb.get("late") or []) + (pb.get("pending") or [])
    late_tenants_detailed = pb.get("lateTenants") or []
    quality_log = report.get("qualityLog") or []

    unique_units = int(
        dr.get("uniqueUnits")
        or stats.get("uniqueUnits")
        or stats.get("units")
        or len(active)
    )
    apartment_count = int(dr.get("apartmentCount") or stats.get("apartmentCount") or 0)
    shop_count = int(dr.get("shopCount") or stats.get("shopCount") or 0)
    total_unpaid = float(pb.get("totalUnpaidAllMonths") or sum(float(x.get("totalUnpaid") or x.get("rent") or 0) for x in late_tenants_detailed) or sum(float(x.get("rent") or 0) for x in late_rows))
    late_tenant_count = int(pb.get("lateTenantCount") or len(late_tenants_detailed) or len(late_rows))
    occupied = len(active)
    vacant = max(0, unique_units - occupied)
    occupancy_pct = round(occupied / unique_units * 100, 1) if unique_units else 0

    expected = float(ann.get("totalExpected") or 0)
    collected = float(ann.get("totalCollected") or 0)
    total_expenses = float(dr.get("expenseTotal") or ann.get("maintenanceCost") or 0)
    remaining = max(0, expected - collected)
    net_profit = collected - total_expenses
    collection_rate = dr.get("collectionRate") or (
        f"{round(collected / expected * 100)}%" if expected else "—"
    )

    file_items = []
    for f in files:
        name = f.get("name") or "—"
        tag = "Excel" if f.get("parsedFromExcel") else ("CSV" if f.get("textSnippet") else "—")
        file_items.append(_item(name, tag))

    month_items = []
    for m in dr.get("monthlyBreakdown") or report.get("monthlyRolls") or []:
        ml = month_label(int(m.get("month") or 0), lang) if m.get("month") else str(m.get("month") or "—")
        if lang == "ar":
            month_items.append(
                _item(
                    ml,
                    f"إيجار {m.get('expected', m.get('rent', 0)):,} · محصل {m.get('collected', 0):,} · "
                    f"متأخر {m.get('lateCount', 0)}",
                )
            )
        else:
            month_items.append(
                _item(
                    ml,
                    f"rent {m.get('expected', m.get('rent', 0)):,} · coll. {m.get('collected', 0):,} · "
                    f"late {m.get('lateCount', 0)}",
                )
            )

    departed_items = []
    for d in departed[:12]:
        ml = month_label(int(d.get("departedMonth") or 0), lang)
        departed_items.append(
            _item(
                f"{d.get('tenant')} — {d.get('unit')}",
                f"{ml} {d.get('departedYear', '')} · {float(d.get('rent') or 0):,.0f} ر.س · {d.get('reason', '')}",
            )
        )
    if not departed_items:
        departed_items.append(
            _item("—", "لا مغادرين مكتشفين بين الأشهر المرفوعة" if lang == "ar" else "No departures detected")
        )

    moved_in_items = []
    for n in newcomers[:12]:
        ml = month_label(int(n.get("arrivedMonth") or 0), lang)
        moved_in_items.append(
            _item(
                f"{n.get('tenant')} — {n.get('unit')}",
                f"دخل {ml} {n.get('arrivedYear', '')} · {float(n.get('rent') or 0):,.0f} ر.س",
            )
        )

    late_items = []
    for lt in late_tenants_detailed[:20]:
        months_txt = lt.get("monthLabels") or ""
        late_items.append(
            _item(
                f"{lt.get('tenant')} — {lt.get('unit')}",
                f"{lt.get('lateMonthCount', 0)} أشهر · {float(lt.get('totalUnpaid') or 0):,.0f} ر.س · "
                f"عقد {lt.get('contract') or '—'} · {lt.get('phone') or 'بدون جوال'}"
                + (f" · {months_txt}" if months_txt and lang == "ar" else ""),
            )
        )
    if not late_items:
        for lt in late_rows[:15]:
            late_items.append(
                _item(
                    f"{lt.get('tenant')} — {lt.get('unit')}",
                    f"{float(lt.get('rent') or 0):,.0f} ر.س · {lt.get('phone') or 'بدون جوال'}",
                )
            )
    if not late_items:
        late_items.append(
            _item("—", "لا متأخرات في الأشهر المحلّلة" if lang == "ar" else "No late rows in parsed months")
        )

    units_summary_items = [
        _item("الوحدات السكنية" if lang == "ar" else "Residential units", str(apartment_count or max(0, unique_units - shop_count))),
        _item("المحلات" if lang == "ar" else "Commercial units", str(shop_count)),
        _item("إجمالي الوحدات" if lang == "ar" else "Total units", str(unique_units)),
        _item("المشغول" if lang == "ar" else "Occupied", str(occupied)),
        _item("الشاغر" if lang == "ar" else "Vacant", str(vacant)),
        _item("نسبة الإشغال" if lang == "ar" else "Occupancy", f"{occupancy_pct}%"),
        _item("المتأخرون" if lang == "ar" else "Late tenants", str(late_tenant_count)),
        _item("إجمالي المتأخرات" if lang == "ar" else "Total overdue", f"{total_unpaid:,.0f} ر.س"),
    ]

    quality_items = [_item("—", "لا ملاحظات" if lang == "ar" else "No warnings")]
    if quality_log:
        quality_items = [_item(f"#{i + 1}", str(w)) for i, w in enumerate(quality_log[:12])]

    expense_items = [_item("إجمالي المصروفات" if lang == "ar" else "Total expenses", f"{total_expenses:,.0f}")]
    for r in (dr.get("maintenanceLog") or [])[:6]:
        expense_items.append(
            _item(r.get("description") or "صيانة", f"{float(r.get('amount') or 0):,.0f}")
        )

    executive_report = {
        "title": labels["report_title"].format(year=year),
        "year": year,
        "sections": [
            _sec("files", labels["files"], file_items),
            _sec("units_summary", labels["units_summary"], units_summary_items),
            _sec("months", labels["months"], month_items or [_item("—", "—")]),
            _sec("departed", labels["moved_out"], departed_items),
            _sec("moved_in", labels["moved_in"], moved_in_items or [_item("—", "—")]),
            _sec("late_tenants", labels["late_tenants"], late_items),
            _sec("late", labels["late"], late_items[:8]),
            _sec(
                "revenue",
                labels["revenue"],
                [
                    _item("إجمالي الإيجارات" if lang == "ar" else "Total rent", f"{expected:,.0f}"),
                    _item("المحصل" if lang == "ar" else "Collected", f"{collected:,.0f}"),
                    _item("المتبقي" if lang == "ar" else "Remaining", f"{remaining:,.0f}"),
                    _item("نسبة التحصيل" if lang == "ar" else "Collection rate", str(collection_rate)),
                ],
            ),
            _sec("expenses", labels["expenses"], expense_items),
            _sec("contracts", labels["contracts"], [_item("—", "—")]),
            _sec("quality", labels["quality"], quality_items),
            _sec(
                "portfolio",
                labels["portfolio"],
                [
                    _item("صافي الربح" if lang == "ar" else "Net profit", f"{net_profit:,.0f}"),
                    _item("الإيراد المحصل" if lang == "ar" else "Collected revenue", f"{collected:,.0f}"),
                    _item("المصروفات" if lang == "ar" else "Expenses", f"{total_expenses:,.0f}"),
                    _item(
                        "مؤجرة / شاغرة" if lang == "ar" else "Occupied / vacant",
                        f"{occupied} / {vacant}",
                    ),
                ],
            ),
        ],
    }

    smart_decisions: List[dict] = []
    for lt in (late_tenants_detailed or late_rows)[:4]:
        months_n = lt.get("lateMonthCount") or 1
        amount = float(lt.get("totalUnpaid") or lt.get("rent") or 0)
        smart_decisions.append(
            {
                "id": f"late_{lt.get('unit')}_{lt.get('tenant')}",
                "priority": "critical",
                "title": (
                    f"{lt.get('tenant')} — وحدة {lt.get('unit')} — {months_n} أشهر · {amount:,.0f} ر.س"
                    if lang == "ar"
                    else f"{lt.get('tenant')} — unit {lt.get('unit')} — {months_n} mo · {amount:,.0f}"
                ),
                "action": "إرسال تذكير تحصيل + مراجعة العقد" if lang == "ar" else "Send collection reminder",
            }
        )
    if departed:
        d0 = departed[0]
        ml = month_label(int(d0.get("departedMonth") or 0), lang)
        smart_decisions.append(
            {
                "id": "vacancy_fill",
                "priority": "medium",
                "title": (
                    f"وحدة {d0.get('unit')} شاغرة منذ {ml}"
                    if lang == "ar"
                    else f"Unit {d0.get('unit')} vacant since {ml}"
                ),
                "action": "تسريع التسويق وتحديث الإشغال" if lang == "ar" else "Accelerate marketing",
            }
        )
    smart_decisions.append(
        {
            "id": "ud_pdf",
            "priority": "low",
            "title": "إنشاء تقرير PDF تنفيذي بالأسماء والأرقام" if lang == "ar" else "Generate executive PDF",
            "action": "create_pdf",
        }
    )

    month_cmp = []
    for m in dr.get("monthlyBreakdown") or []:
        month_cmp.append(
            {
                "month": month_label(int(m.get("month") or 0), lang),
                "revenue": int(m.get("expected") or m.get("rent") or 0),
                "expenses": int(m.get("expenses") or 0),
            }
        )

    analysis_id = batch_id
    _import_sessions[analysis_id] = {
        "batch_id": batch_id,
        "files_meta": _to_gas_files_meta(files),
        "source": "gas",
        "lang": lang,
        "gas_mode": gas_payload.get("mode"),
    }

    return {
        "analysis_id": analysis_id,
        "success_message": report.get("headline") or labels["success"].format(months=month_count),
        "prompt_message": labels["prompt"],
        "what_now_message": labels["what_now"],
        "prompt_options": [
            {"key": "update", "label": labels["opt_update"]},
            {"key": "review", "label": labels["opt_review"]},
            {"key": "cancel", "label": labels["opt_cancel"]},
        ],
        "metrics": {
            "properties": int(stats.get("properties") or 1),
            "units": unique_units,
            "tenants": len(active),
            "occupancy_pct": occupancy_pct,
            "occupied_units": occupied,
            "vacant_units": vacant,
            "residential_units": apartment_count or max(0, unique_units - shop_count),
            "commercial_units": shop_count,
            "total_revenue_annual": round(expected),
            "collected": round(collected),
            "remaining": round(remaining),
            "total_expenses": round(total_expenses),
            "contracts_expired": 0,
            "contracts_expiring_soon": 0,
            "late_tenants": late_tenant_count,
            "late_value": round(total_unpaid),
            "maintenance_open": len(dr.get("maintenanceLog") or []),
            "maintenance_done": max(0, month_count - 1),
            "net_profit": round(net_profit),
            "balance": round(net_profit * 0.4),
            "files_analyzed": len(files),
            "months_linked": month_count,
            "departed_count": len(departed),
            "newcomers_count": len(newcomers),
            "collection_rate_pct": round(collected / expected * 100) if expected else 0,
        },
        "executive_report": executive_report,
        "month_comparison": month_cmp,
        "expense_by_type": [],
        "smart_decisions": smart_decisions[:8],
        "next_actions": [
            {"key": "update_portfolio", "icon": "database", "route": "/portfolio"},
            {"key": "send_alerts", "icon": "bell", "route": "/notifications"},
            {"key": "create_pdf", "icon": "file-text", "route": "/reports"},
            {"key": "compare_months", "icon": "bar-chart-2", "route": "/insights"},
            {"key": "profit_analysis", "icon": "trending-up", "route": "/insights"},
            {"key": "forecast_expenses", "icon": "activity", "route": "/intelligence"},
            {"key": "show_risks", "icon": "alert-triangle", "route": "/health"},
            {"key": "improvement_plan", "icon": "target", "route": "/hub"},
        ],
        "linked_files": [{"name": f.get("name"), "category": "rent_roll", "category_label": f.get("name"), "month": None, "confidence": 90} for f in files],
        "intake_meta": {
            "engine": "smart_property_gas",
            "synthetic_fallback": False,
            "parse_errors": report.get("parseErrors") or [],
            "files_without_content": report.get("filesWithoutContent") or [],
            "quality_log": quality_log,
            "gas_mode": gas_payload.get("mode"),
            "employee_brief": report.get("employeeBrief"),
        },
    }


def run_gas_import_analysis(files: List[dict], lang: Lang = "ar") -> Dict[str, Any]:
    gas = get_gas_client()
    if not gas.configured:
        raise GasClientError("GAS not configured")

    files_meta = _to_gas_files_meta(files)
    payload = gas.post_action("runSmartPropertyImportPipeline", {"filesMeta": files_meta})
    if not payload or payload.get("ok") is False:
        raise GasClientError(payload.get("error") or "فشل تحليل الملفات في GAS")

    return map_gas_report_to_portfolio(payload, files, lang=lang)


def apply_gas_import(
    analysis_id: str,
    files: Optional[List[dict]] = None,
) -> Dict[str, Any]:
    session = _import_sessions.get(analysis_id) or {}
    batch_id = session.get("batch_id") or analysis_id
    files_meta = _to_gas_files_meta(files) if files else (session.get("files_meta") or [])

    gas = get_gas_client()
    result = gas.post_action(
        "commitSmartPropertyImportBatch",
        {"batchId": batch_id, "filesMeta": files_meta},
    )
    if not result or result.get("ok") is False:
        raise GasClientError(result.get("error") or "فشل اعتماد المحفظة")

    commit_result = result.get("result") or {}
    return {
        "ok": True,
        "analysis_id": analysis_id,
        "batch_id": batch_id,
        "result": commit_result,
        "report": result.get("report"),
        "units_created": commit_result.get("unitsCreated"),
        "units_updated": commit_result.get("unitsUpdated"),
        "payments_added": commit_result.get("paymentsAdded"),
    }


def create_gas_owner_pdf() -> Dict[str, Any]:
    gas = get_gas_client()
    data = gas.post_action("createOwnerReportPdf", {})
    url = (data or {}).get("url") if isinstance(data, dict) else None
    if not url:
        raise GasClientError("لم يُرجع GAS رابط PDF")
    return {"ok": True, "url": url}


def analyze_upload_with_gas_fallback(
    files: List[dict],
    ctx: Dict[str, Any],
    lang: Lang = "ar",
) -> Dict[str, Any]:
    """Prefer GAS Smart Property engines; fall back to local Python port when GAS unavailable."""
    if gas_import_available():
        try:
            return run_gas_import_analysis(files, lang=lang)
        except GasClientError as exc:
            logger.warning("GAS import failed, falling back to Python engine: %s", exc)

    payload = analyze_upload_portfolio(files, ctx, lang=lang)
    analysis_id = payload.get("analysis_id") or str(uuid.uuid4())
    _import_sessions[analysis_id] = {
        "batch_id": analysis_id,
        "files_meta": _to_gas_files_meta(files),
        "source": "python",
        "lang": lang,
    }
    return payload
