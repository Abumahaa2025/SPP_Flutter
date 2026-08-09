"""Bridge to SPP_Official GAS Smart Import engines.

This module adapts GAS Smart Property reports to the application's
PortfolioAnalysis response shape without fabricating missing readings.
"""

from _future_ import annotations

import logging
import uuid
from typing import Any, Dict, List, Literal, Optional

from .gas_client import GasClientError
from .live_data import get_gas_client
from .upload_analysis.intake_classifier import month_label
from .upload_analysis.late_report_format import (
    build_late_payments_view_model,
    build_late_section_items,
)
from .upload_analysis.portfolio_engine import analyze_upload_portfolio
from .koil import (
    apply_koil_to_executive_report,
    apply_understanding_to_executive_report,
    build_property_knowledge,
    deep_stub_from_gas,
    reasoning_to_smart_decisions,
    run_koil_reasoning,
    run_koil_understanding,
    snapshot_from_gas_report,
)

logger = logging.getLogger(_name_)

Lang = Literal["ar", "en"]

_import_sessions: Dict[str, Dict[str, Any]] = {}


def gas_import_available() -> bool:
    return get_gas_client().configured


def _to_gas_files_meta(files: List[dict]) -> List[dict]:
    out: List[dict] = []

    for file_item in files:
        out.append(
            {
                "name": file_item.get("name") or "",
                "mime": (
                    file_item.get("mimeType")
                    or file_item.get("mime")
                    or ""
                ),
                "mimeType": file_item.get("mimeType") or "",
                "size": file_item.get("size"),
                "textSnippet": (
                    file_item.get("textSnippet")
                    or file_item.get("contentPreview")
                    or ""
                ),
                "parsedFromExcel": bool(
                    file_item.get("parsedFromExcel")
                ),
            }
        )

    return out


def _item(label: str, value: str) -> dict:
    return {
        "label": str(label or "—"),
        "value": str(value or "—"),
    }


def _sec(key: str, title: str, items: List[dict]) -> dict:
    return {
        "key": key,
        "title": title,
        "items": items,
    }


def _as_list(value: Any) -> List[dict]:
    if not isinstance(value, list):
        return []

    return [
        item
        for item in value
        if isinstance(item, dict)
    ]


def _first_list(*values: Any) -> List[dict]:
    for value in values:
        items = _as_list(value)
        if items:
            return items

    return []


def _safe_float(value: Any, default: float = 0.0) -> float:
    if value in (None, ""):
        return default

    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip()

    if not text:
        return default

    text = (
        text.replace(",", "")
        .replace("ر.س", "")
        .replace("ريال", "")
        .strip()
    )

    try:
        return float(text)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(_safe_float(value, float(default)))
    except (TypeError, ValueError):
        return default


def _amount(row: dict) -> float:
    for key in (
        "amount",
        "cost",
        "total",
        "totalCost",
        "expense",
        "maintenanceCost",
        "value",
    ):
        value = row.get(key)

        if value not in (None, ""):
            return _safe_float(value)

    return 0.0


def _normalized_status(value: Any) -> str:
    return str(value or "").strip().lower()


def _contract_status(row: dict) -> str:
    return _normalized_status(
        row.get("status")
        or row.get("contractStatus")
        or row.get("state")
    )


def _maintenance_status(row: dict) -> str:
    return _normalized_status(
        row.get("status")
        or row.get("maintenanceStatus")
        or row.get("state")
    )


def _contract_tenant(row: dict) -> str:
    return str(
        row.get("tenant")
        or row.get("tenantName")
        or row.get("name")
        or "—"
    )


def _contract_unit(row: dict) -> str:
    return str(
        row.get("unit")
        or row.get("unitNo")
        or row.get("unitNumber")
        or row.get("propertyUnit")
        or "—"
    )


def _contract_end_date(row: dict) -> str:
    return str(
        row.get("endDate")
        or row.get("contractEnd")
        or row.get("expiryDate")
        or row.get("expirationDate")
        or "—"
    )


def _maintenance_type(row: dict, lang: Lang) -> str:
    return str(
        row.get("type")
        or row.get("category")
        or row.get("description")
        or ("صيانة" if lang == "ar" else "Maintenance")
    )


def _classify_uploaded_file(file_item: dict) -> str:
    explicit_category = (
        file_item.get("category")
        or file_item.get("detectedCategory")
        or file_item.get("fileType")
    )

    if explicit_category:
        return str(explicit_category)

    name = str(file_item.get("name") or "").lower()

    if any(
        word in name
        for word in (
            "maintenance",
            "صيانة",
            "expense",
            "expenses",
            "مصروف",
        )
    ):
        return "maintenance"

    if any(
        word in name
        for word in (
            "contract",
            "contracts",
            "عقد",
            "عقود",
        )
    ):
        return "contracts"

    if any(
        word in name
        for word in (
            "payment",
            "payments",
            "rent",
            "إيجار",
            "ايجار",
            "سداد",
            "تحصيل",
        )
    ):
        return "rent_roll"

    return "unknown"


def _labels(lang: Lang) -> Dict[str, str]:
    if lang == "ar":
        return {
            "report_title": "تقرير أداء العقارات {year}",
            "files": "تصنيف الملفات المرفوعة",
            "months": "ربط الأشهر والمقارنة",
            "moved_out": "من غادر",
            "moved_in": "من دخل / جدد",
            "late": "المتأخرات — شهرًا بشهر",
            "late_tenants": "المتأخرات — شهرًا بشهر",
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
        "late": "Late payments — by month",
        "late_tenants": "Late payments — by month",
        "units_summary": "Units summary",
        "quality": "Review log & warnings",
        "revenue": "Revenue & collection",
        "expenses": "Expenses & maintenance",
        "contracts": "Expired & expiring contracts",
        "portfolio": "Net profit & portfolio",
        "success": (
            "Analyzed {months} linked months from property statements."
        ),
        "prompt": (
            "Analysis complete — what would you like to do?"
        ),
        "opt_update": "Apply to portfolio",
        "opt_review": "Review before applying",
        "opt_cancel": "Cancel",
        "what_now": "What should I do now?",
    }


def _compute_analysis_confidence(
    *,
    parse_errors: List[str],
    files_without_content: List[str],
    merge_count: int,
    late_tenants: List[dict],
    unique_units: int,
) -> float:
    score = 100.0

    score -= len(parse_errors) * 8
    score -= len(files_without_content) * 12
    score -= min(15, merge_count * 2)

    if unique_units <= 0:
        score -= 25

    missing_contract = sum(
        1
        for tenant in late_tenants
        if not str(tenant.get("contract") or "").strip()
    )

    missing_phone = sum(
        1
        for tenant in late_tenants
        if not str(tenant.get("phone") or "").strip()
    )

    if late_tenants:
        score -= min(
            10,
            round(
                (missing_contract / len(late_tenants)) * 8
            ),
        )
        score -= min(
            8,
            round(
                (missing_phone / len(late_tenants)) * 6
            ),
        )

    return round(
        max(40.0, min(100.0, score)),
        1,
    )


def map_gas_report_to_portfolio(
    gas_payload: dict,
    files: List[dict],
    lang: Lang = "ar",
) -> Dict[str, Any]:
    """Adapt GAS Smart Property response to PortfolioAnalysis shape."""

    report = gas_payload.get("report") or gas_payload

    if not isinstance(report, dict):
        raise GasClientError(
            "GAS returned an invalid report payload"
        )

    batch_id = (
        gas_payload.get("batchId")
        or report.get("batchId")
        or str(uuid.uuid4())
    )

    labels = _labels(lang)

    lifecycle = report.get("lifecycle") or {}
    annual = report.get("annual") or {}
    detailed_report = report.get("detailedReport") or {}
    stats = report.get("stats") or {}
    payment_board = (
        detailed_report.get("paymentBoard")
        or report.get("paymentBoard")
        or {}
    )

    if not isinstance(lifecycle, dict):
        lifecycle = {}

    if not isinstance(annual, dict):
        annual = {}

    if not isinstance(detailed_report, dict):
        detailed_report = {}

    if not isinstance(stats, dict):
        stats = {}

    if not isinstance(payment_board, dict):
        payment_board = {}

    year = _safe_int(
        detailed_report.get("year")
        or lifecycle.get("lastYear")
        or annual.get("year")
        or 2026,
        2026,
    )

    month_count = _safe_int(
        lifecycle.get("monthCount")
        or detailed_report.get("monthCount")
        or 0
    )

    departed = _as_list(lifecycle.get("departed"))
    active = _as_list(lifecycle.get("active"))
    newcomers = _as_list(lifecycle.get("newcomers"))

    late_rows = (
        _as_list(payment_board.get("late"))
        + _as_list(payment_board.get("pending"))
    )

    late_tenants_detailed = _as_list(
        payment_board.get("lateTenants")
    )

    parse_errors = [
        str(error)
        for error in (
            report.get("parseErrors")
            or []
        )
    ]

    files_without_content = [
        str(name)
        for name in (
            report.get("filesWithoutContent")
            or []
        )
    ]

    quality_log = [
        str(item)
        for item in (
            report.get("qualityLog")
            or []
        )
    ]

    quality_log.extend(
        f"Parse error: {error}"
        for error in parse_errors
    )

    quality_log.extend(
        f"File without readable content: {name}"
        for name in files_without_content
    )

    contract_board = (
        detailed_report.get("contractBoard")
        or report.get("contractBoard")
        or annual.get("contractBoard")
        or {}
    )

    if not isinstance(contract_board, dict):
        contract_board = {}

    contracts_all = _first_list(
        contract_board.get("contracts"),
        detailed_report.get("contracts"),
        report.get("contracts"),
    )

    contracts_expired_rows = _first_list(
        contract_board.get("expired"),
        detailed_report.get("expiredContracts"),
        report.get("expiredContracts"),
    )

    contracts_expiring_rows = _first_list(
        contract_board.get("expiringSoon"),
        contract_board.get("nearExpiry"),
        detailed_report.get("expiringContracts"),
        report.get("expiringContracts"),
    )

    expired_statuses = {
        "expired",
        "contract_expired",
        "منتهي",
        "منتهية",
        "منتهى",
    }

    expiring_statuses = {
        "expiring",
        "expiring_soon",
        "near_expiry",
        "near expiry",
        "قريب الانتهاء",
        "قرب الانتهاء",
        "سينتهي قريباً",
        "سينتهي قريبا",
    }

    if not contracts_expired_rows:
        contracts_expired_rows = [
            row
            for row in contracts_all
            if _contract_status(row) in expired_statuses
        ]

    if not contracts_expiring_rows:
        contracts_expiring_rows = [
            row
            for row in contracts_all
            if _contract_status(row) in expiring_statuses
        ]

    maintenance_rows = _first_list(
        detailed_report.get("maintenanceLog"),
        report.get("maintenanceLog"),
        detailed_report.get("maintenance"),
        report.get("maintenance"),
    )

    completed_maintenance_statuses = {
        "done",
        "completed",
        "closed",
        "finished",
        "مكتملة",
        "مكتمل",
        "مغلقة",
        "منتهية",
        "تمت",
    }

    maintenance_done_rows = [
        row
        for row in maintenance_rows
        if _maintenance_status(row)
        in completed_maintenance_statuses
    ]

    maintenance_open_rows = [
        row
        for row in maintenance_rows
        if row not in maintenance_done_rows
    ]

    unique_units = _safe_int(
        detailed_report.get("uniqueUnits")
        or stats.get("uniqueUnits")
        or stats.get("units")
        or len(active)
    )

    apartment_count = _safe_int(
        detailed_report.get("apartmentCount")
        or stats.get("apartmentCount")
        or 0
    )

    shop_count = _safe_int(
        detailed_report.get("shopCount")
        or stats.get("shopCount")
        or 0
    )

    confidence = _compute_analysis_confidence(
        parse_errors=parse_errors,
        files_without_content=files_without_content,
        merge_count=_safe_int(
            payment_board.get("mergeCount")
        ),
        late_tenants=late_tenants_detailed,
        unique_units=unique_units,
    )

    total_unpaid = _safe_float(
        payment_board.get("totalUnpaidAllMonths")
    )

    if total_unpaid <= 0:
        total_unpaid = sum(
            _safe_float(
                tenant.get("totalUnpaid")
                or tenant.get("rent")
            )
            for tenant in late_tenants_detailed
        )

    if total_unpaid <= 0:
        total_unpaid = sum(
            _safe_float(row.get("rent"))
            for row in late_rows
        )

    late_tenant_count = _safe_int(
        payment_board.get("lateTenantCount")
        or len(late_tenants_detailed)
        or len(late_rows)
    )

    occupied = len(active)
    vacant = max(0, unique_units - occupied)

    occupancy_pct = (
        round(
            occupied / unique_units * 100,
            1,
        )
        if unique_units
        else 0
    )

    expected = _safe_float(
        annual.get("totalExpected")
        or detailed_report.get("totalExpected")
    )

    collected = _safe_float(
        annual.get("totalCollected")
        or detailed_report.get("totalCollected")
    )

    total_expenses = _safe_float(
        detailed_report.get("expenseTotal")
        or annual.get("maintenanceCost")
    )

    if total_expenses <= 0:
        total_expenses = sum(
            _amount(row)
            for row in maintenance_rows
        )

    remaining = max(
        0.0,
        expected - collected,
    )

    net_profit = collected - total_expenses

    if expected > 0:
        collection_rate_pct = round(
            collected / expected * 100
        )
        collection_rate = f"{collection_rate_pct}%"
    else:
        collection_rate_pct = 0
        collection_rate = "—"

    file_items: List[dict] = []

    for file_item in files:
        name = file_item.get("name") or "—"
        category = _classify_uploaded_file(file_item)

        if file_item.get("parsedFromExcel"):
            format_label = "Excel"
        elif file_item.get("textSnippet"):
            format_label = "CSV / Text"
        else:
            format_label = "—"

        file_items.append(
            _item(
                str(name),
                f"{category} · {format_label}",
            )
        )

    month_items: List[dict] = []

    monthly_breakdown = _first_list(
        detailed_report.get("monthlyBreakdown"),
        report.get("monthlyRolls"),
    )

    for month_row in monthly_breakdown:
        month_number = _safe_int(
            month_row.get("month")
        )

        month_name = (
            month_label(month_number, lang)
            if month_number
            else str(month_row.get("month") or "—")
        )

        month_expected = _safe_float(
            month_row.get("expected")
            or month_row.get("rent")
        )

        month_collected = _safe_float(
            month_row.get("collected")
        )

        month_late = _safe_int(
            month_row.get("lateCount")
        )

        if lang == "ar":
            value = (
                f"إيجار {month_expected:,.0f} · "
                f"محصل {month_collected:,.0f} · "
                f"متأخر {month_late}"
            )
        else:
            value = (
                f"rent {month_expected:,.0f} · "
                f"collected {month_collected:,.0f} · "
                f"late {month_late}"
            )

        month_items.append(
            _item(month_name, value)
        )

    departed_items: List[dict] = []

    for departed_row in departed[:12]:
        departed_month = _safe_int(
            departed_row.get("departedMonth")
        )

        month_name = (
            month_label(departed_month, lang)
            if departed_month
            else "—"
        )

        tenant_name = (
            departed_row.get("tenant")
            or departed_row.get("tenantName")
            or "—"
        )

        unit_name = (
            departed_row.get("unit")
            or departed_row.get("unitNo")
            or "—"
        )

        rent_value = _safe_float(
            departed_row.get("rent")
        )

        reason = str(
            departed_row.get("reason")
            or ""
        )

        departed_year = str(
            departed_row.get("departedYear")
            or ""
        )

        departed_items.append(
            _item(
                f"{tenant_name} — {unit_name}",
                (
                    f"{month_name} {departed_year} · "
                    f"{rent_value:,.0f} ر.س"
                    + (f" · {reason}" if reason else "")
                ),
            )
        )

    if not departed_items:
        departed_items.append(
            _item(
                "—",
                (
                    "لا توجد مغادرات مؤكدة بين الأشهر المرفوعة"
                    if lang == "ar"
                    else "No confirmed departures detected"
                ),
            )
        )

    moved_in_items: List[dict] = []

    for newcomer in newcomers[:12]:
        arrived_month = _safe_int(
            newcomer.get("arrivedMonth")
        )

        month_name = (
            month_label(arrived_month, lang)
            if arrived_month
            else "—"
        )

        tenant_name = (
            newcomer.get("tenant")
            or newcomer.get("tenantName")
            or "—"
        )

        unit_name = (
            newcomer.get("unit")
            or newcomer.get("unitNo")
            or "—"
        )

        arrived_year = str(
            newcomer.get("arrivedYear")
            or ""
        )

        rent_value = _safe_float(
            newcomer.get("rent")
        )

        if lang == "ar":
            value = (
                f"دخل {month_name} {arrived_year} · "
                f"{rent_value:,.0f} ر.س"
            )
        else:
            value = (
                f"Entered {month_name} {arrived_year} · "
                f"{rent_value:,.0f}"
            )

        moved_in_items.append(
            _item(
                f"{tenant_name} — {unit_name}",
                value,
            )
        )

    if not moved_in_items:
        moved_in_items.append(
            _item(
                "—",
                (
                    "لا توجد حالات دخول أو تجديد مؤكدة"
                    if lang == "ar"
                    else "No confirmed entries or renewals"
                ),
            )
        )

    late_by_month = (
        payment_board.get("lateByMonth")
        or {}
    )

    if not isinstance(late_by_month, dict):
        late_by_month = {}

    late_payments = build_late_payments_view_model(
        late_by_month=late_by_month,
        late_tenants_detailed=late_tenants_detailed,
        total_unpaid=total_unpaid,
        late_tenant_count=late_tenant_count,
        lang=lang,
    )

    late_items = build_late_section_items(
        late_by_month=late_by_month,
        late_tenants_detailed=late_tenants_detailed,
        total_unpaid=total_unpaid,
        late_tenant_count=late_tenant_count,
        lang=lang,
    )

    import_snapshot = snapshot_from_gas_report(
        report,
        batch_id,
        files,
    )

    koil_understanding = run_koil_understanding(
        files,
        deep_stub_from_gas(report, files),
        lang,
    )

    property_knowledge = build_property_knowledge(
        import_snapshot,
        lang,
    )

    koil_reasoning = run_koil_reasoning(
        property_knowledge,
        lang,
    )

    units_summary_items = [
        _item(
            (
                "الوحدات السكنية"
                if lang == "ar"
                else "Residential units"
            ),
            str(
                apartment_count
                or max(
                    0,
                    unique_units - shop_count,
                )
            ),
        ),
        _item(
            (
                "المحلات"
                if lang == "ar"
                else "Commercial units"
            ),
            str(shop_count),
        ),
        _item(
            (
                "إجمالي الوحدات"
                if lang == "ar"
                else "Total units"
            ),
            str(unique_units),
        ),
        _item(
            (
                "المشغول"
                if lang == "ar"
                else "Occupied"
            ),
            str(occupied),
        ),
        _item(
            (
                "الشاغر"
                if lang == "ar"
                else "Vacant"
            ),
            str(vacant),
        ),
        _item(
            (
                "نسبة الإشغال"
                if lang == "ar"
                else "Occupancy"
            ),
            f"{occupancy_pct}%",
        ),
        _item(
            (
                "المتأخرون المؤكدون"
                if lang == "ar"
                else "Confirmed late tenants"
            ),
            str(late_tenant_count),
        ),
        _item(
            (
                "إجمالي المتأخرات المؤكدة"
                if lang == "ar"
                else "Confirmed overdue total"
            ),
            f"{total_unpaid:,.0f} ر.س",
        ),
        _item(
            (
                "ثقة التحليل"
                if lang == "ar"
                else "Analysis confidence"
            ),
            f"{confidence}%",
        ),
    ]

    if quality_log:
        quality_items = [
            _item(
                f"#{index + 1}",
                warning,
            )
            for index, warning in enumerate(
                quality_log[:20]
            )
        ]
    else:
        quality_items = [
            _item(
                "—",
                (
                    "لا توجد ملاحظات مؤكدة"
                    if lang == "ar"
                    else "No confirmed warnings"
                ),
            )
        ]

    expense_items: List[dict] = [
        _item(
            (
                "إجمالي المصروفات"
                if lang == "ar"
                else "Total expenses"
            ),
            f"{total_expenses:,.0f}",
        )
    ]

    for maintenance_row in maintenance_rows[:10]:
        maintenance_name = _maintenance_type(
            maintenance_row,
            lang,
        )

        maintenance_amount = _amount(
            maintenance_row
        )

        maintenance_status = (
            maintenance_row.get("status")
            or maintenance_row.get("state")
            or ""
        )

        value = f"{maintenance_amount:,.0f}"

        if maintenance_status:
            value += f" · {maintenance_status}"

        expense_items.append(
            _item(
                maintenance_name,
                value,
            )
        )

    contract_items: List[dict] = []

    for contract in contracts_expired_rows[:8]:
        tenant = _contract_tenant(contract)
        unit = _contract_unit(contract)
        end_date = _contract_end_date(contract)

        contract_items.append(
            _item(
                f"{tenant} — {unit}",
                (
                    f"منتهي · {end_date}"
                    if lang == "ar"
                    else f"Expired · {end_date}"
                ),
            )
        )

    for contract in contracts_expiring_rows[:8]:
        tenant = _contract_tenant(contract)
        unit = _contract_unit(contract)
        end_date = _contract_end_date(contract)

        contract_items.append(
            _item(
                f"{tenant} — {unit}",
                (
                    f"قريب الانتهاء · {end_date}"
                    if lang == "ar"
                    else f"Expiring soon · {end_date}"
                ),
            )
        )

    if not contract_items:
        contract_items = [
            _item(
                "—",
                (
                    "لم تصل بيانات عقود مؤكدة"
                    if lang == "ar"
                    else "No confirmed contract data"
                ),
            )
        ]

    executive_report = {
        "title": labels["report_title"].format(
            year=year
        ),
        "year": year,
        "sections": [
            _sec(
                "files",
                labels["files"],
                file_items
                or [_item("—", "—")],
            ),
            _sec(
                "units_summary",
                labels["units_summary"],
                units_summary_items,
            ),
            _sec(
                "months",
                labels["months"],
                month_items
                or [_item("—", "—")],
            ),
            _sec(
                "departed",
                labels["moved_out"],
                departed_items,
            ),
            _sec(
                "moved_in",
                labels["moved_in"],
                moved_in_items,
            ),
            _sec(
                "late_tenants",
                labels["late_tenants"],
                late_items,
            ),
            _sec(
                "revenue",
                labels["revenue"],
                [
                    _item(
                        (
                            "إجمالي الإيجارات"
                            if lang == "ar"
                            else "Total rent"
                        ),
                        f"{expected:,.0f}",
                    ),
                    _item(
                        (
                            "المحصل"
                            if lang == "ar"
                            else "Collected"
                        ),
                        f"{collected:,.0f}",
                    ),
                    _item(
                        (
                            "المتبقي"
                            if lang == "ar"
                            else "Remaining"
                        ),
                        f"{remaining:,.0f}",
                    ),
                    _item(
                        (
                            "نسبة التحصيل"
                            if lang == "ar"
                            else "Collection rate"
                        ),
                        collection_rate,
                    ),
                ],
            ),
            _sec(
                "expenses",
                labels["expenses"],
                expense_items,
            ),
            _sec(
                "contracts",
                labels["contracts"],
                contract_items,
            ),
            _sec(
                "quality",
                labels["quality"],
                quality_items,
            ),
            _sec(
                "portfolio",
                labels["portfolio"],
                [
                    _item(
                        (
                            "صافي الربح"
                            if lang == "ar"
                            else "Net profit"
                        ),
                        f"{net_profit:,.0f}",
                    ),
                    _item(
                        (
                            "الإيراد المحصل"
                            if lang == "ar"
                            else "Collected revenue"
                        ),
                        f"{collected:,.0f}",
                    ),
                    _item(
                        (
                            "المصروفات"
                            if lang == "ar"
                            else "Expenses"
                        ),
                        f"{total_expenses:,.0f}",
                    ),
                    _item(
                        (
                            "مؤجرة / شاغرة"
                            if lang == "ar"
                            else "Occupied / vacant"
                        ),
                        f"{occupied} / {vacant}",
                    ),
                ],
            ),
        ],
    }

    executive_report = (
        apply_understanding_to_executive_report(
            executive_report,
            koil_understanding,
            lang,
        )
    )

    executive_report = (
        apply_koil_to_executive_report(
            executive_report,
            koil_reasoning,
            lang,
        )
    )

    smart_decisions: List[dict] = (
        reasoning_to_smart_decisions(
            koil_reasoning,
            lang,
        )
    )

    smart_decisions.append(
        {
            "id": "ud_pdf",
            "priority": "low",
            "title": (
                "إنشاء تقرير PDF تنفيذي بالأسماء والأرقام"
                if lang == "ar"
                else "Generate executive PDF"
            ),
            "action": "create_pdf",
        }
    )

    month_comparison: List[dict] = []

    for month_row in monthly_breakdown:
        month_number = _safe_int(
            month_row.get("month")
        )

        month_name = (
            month_label(month_number, lang)
            if month_number
            else str(month_row.get("month") or "—")
        )

        month_comparison.append(
            {
                "month": month_name,
                "revenue": round(
                    _safe_float(
                        month_row.get("expected")
                        or month_row.get("rent")
                    )
                ),
                "expenses": round(
                    _safe_float(
                        month_row.get("expenses")
                    )
                ),
            }
        )

    expense_by_type_map: Dict[str, float] = {}

    for maintenance_row in maintenance_rows:
        expense_type = _maintenance_type(
            maintenance_row,
            lang,
        )

        expense_amount = _amount(
            maintenance_row
        )

        if expense_amount <= 0:
            continue

        expense_by_type_map[expense_type] = (
            expense_by_type_map.get(
                expense_type,
                0.0,
            )
            + expense_amount
        )

    expense_by_type = [
        {
            "type": expense_type,
            "amount": round(amount),
        }
        for expense_type, amount
        in expense_by_type_map.items()
    ]

    analysis_id = str(batch_id)

    _import_sessions[analysis_id] = {
        "batch_id": batch_id,
        "files_meta": _to_gas_files_meta(files),
        "source": "gas",
        "lang": lang,
        "gas_mode": gas_payload.get("mode"),
    }

    property_count = _safe_int(
        stats.get("properties")
        or detailed_report.get("propertyCount")
        or report.get("propertyCount")
        or 0
    )

    linked_files = [
        {
            "name": file_item.get("name"),
            "category": _classify_uploaded_file(
                file_item
            ),
            "category_label": (
                file_item.get("categoryLabel")
                or file_item.get("name")
                or "—"
            ),
            "month": file_item.get("month"),
            "confidence": _safe_int(
                file_item.get("confidence")
                or 90
            ),
        }
        for file_item in files
    ]

    return {
        "analysis_id": analysis_id,
        "success_message": (
            koil_reasoning.get("brief")
            or report.get("headline")
            or labels["success"].format(
                months=month_count
            )
        ),
        "prompt_message": labels["prompt"],
        "what_now_message": labels["what_now"],
        "prompt_options": [
            {
                "key": "update",
                "label": labels["opt_update"],
            },
            {
                "key": "review",
                "label": labels["opt_review"],
            },
            {
                "key": "cancel",
                "label": labels["opt_cancel"],
            },
        ],
        "metrics": {
            "properties": property_count,
            "units": unique_units,
            "tenants": len(active),
            "occupancy_pct": occupancy_pct,
            "occupied_units": occupied,
            "vacant_units": vacant,
            "residential_units": (
                apartment_count
                or max(
                    0,
                    unique_units - shop_count,
                )
            ),
            "commercial_units": shop_count,
            "total_revenue_annual": round(expected),
            "collected": round(collected),
            "remaining": round(remaining),
            "total_expenses": round(total_expenses),
            "contracts_expired": len(
                contracts_expired_rows
            ),
            "contracts_expiring_soon": len(
                contracts_expiring_rows
            ),
            "late_tenants": late_tenant_count,
            "late_value": round(total_unpaid),
            "maintenance_open": len(
                maintenance_open_rows
            ),
            "maintenance_done": len(
                maintenance_done_rows
            ),
            "net_profit": round(net_profit),
            "balance": round(net_profit * 0.4),
            "files_analyzed": len(files),
            "months_linked": month_count,
            "departed_count": len(departed),
            "newcomers_count": len(newcomers),
            "collection_rate_pct": (
                collection_rate_pct
            ),
            "analysis_confidence_pct": confidence,
        },
        "executive_report": executive_report,
        "late_payments": late_payments,
        "property_knowledge": property_knowledge,
        "koil_understanding": koil_understanding,
        "koil_reasoning": koil_reasoning,
        "month_comparison": month_comparison,
        "expense_by_type": expense_by_type,
        "smart_decisions": smart_decisions[:8],
        "next_actions": [
            {
                "key": "update_portfolio",
                "icon": "database",
                "route": "/portfolio",
            },
            {
                "key": "send_alerts",
                "icon": "bell",
                "route": "/notifications",
            },
            {
                "key": "create_pdf",
                "icon": "file-text",
                "route": "/reports",
            },
            {
                "key": "compare_months",
                "icon": "bar-chart-2",
                "route": "/insights",
            },
            {
                "key": "profit_analysis",
                "icon": "trending-up",
                "route": "/insights",
            },
            {
                "key": "forecast_expenses",
                "icon": "activity",
                "route": "/intelligence",
            },
            {
                "key": "show_risks",
                "icon": "alert-triangle",
                "route": "/health",
            },
            {
                "key": "improvement_plan",
                "icon": "target",
                "route": "/hub",
            },
        ],
        "linked_files": linked_files,
        "intake_meta": {
            "engine": "smart_property_gas",
            "synthetic_fallback": False,
            "parse_errors": parse_errors,
            "files_without_content": (
                files_without_content
            ),
            "quality_log": quality_log,
            "gas_mode": gas_payload.get("mode"),
            "employee_brief": (
                koil_reasoning.get("brief")
                or report.get("employeeBrief")
            ),
            "koil_version": koil_reasoning.get(
                "version"
            ),
        },
    }


def run_gas_import_analysis(
    files: List[dict],
    lang: Lang = "ar",
) -> Dict[str, Any]:
    gas = get_gas_client()

    if not gas.configured:
        raise GasClientError("GAS not configured")

    files_meta = _to_gas_files_meta(files)

    payload = gas.post_action(
        "runSmartPropertyImportPipeline",
        {
            "filesMeta": files_meta,
        },
    )

    if not payload:
        raise GasClientError(
            "لم يرجع GAS نتيجة تحليل"
        )

    if payload.get("ok") is False:
        raise GasClientError(
            payload.get("error")
            or "فشل تحليل الملفات في GAS"
        )

    return map_gas_report_to_portfolio(
        payload,
        files,
        lang=lang,
    )


def apply_gas_import(
    analysis_id: str,
    files: Optional[List[dict]] = None,
) -> Dict[str, Any]:
    session = _import_sessions.get(
        analysis_id
    ) or {}

    batch_id = (
        session.get("batch_id")
        or analysis_id
    )

    files_meta = (
        _to_gas_files_meta(files)
        if files
        else session.get("files_meta")
        or []
    )

    gas = get_gas_client()

    if not gas.configured:
        raise GasClientError(
            "GAS not configured"
        )

    result = gas.post_action(
        "commitSmartPropertyImportBatch",
        {
            "batchId": batch_id,
            "filesMeta": files_meta,
        },
    )

    if not result:
        raise GasClientError(
            "لم يرجع GAS نتيجة اعتماد"
        )

    if result.get("ok") is False:
        raise GasClientError(
            result.get("error")
            or "فشل اعتماد المحفظة"
        )

    commit_result = result.get("result") or {}

    return {
        "ok": True,
        "analysis_id": analysis_id,
        "batch_id": batch_id,
        "result": commit_result,
        "report": result.get("report"),
        "units_created": commit_result.get(
            "unitsCreated"
        ),
        "units_updated": commit_result.get(
            "unitsUpdated"
        ),
        "payments_added": commit_result.get(
            "paymentsAdded"
        ),
    }


def create_gas_owner_pdf(
    analysis_id: Optional[str] = None,
) -> Dict[str, Any]:
    gas = get_gas_client()

    if not gas.configured:
        raise GasClientError(
            "GAS not configured"
        )

    params: Dict[str, Any] = {}

    if analysis_id:
        session = _import_sessions.get(
            analysis_id
        ) or {}

        params["batchId"] = (
            session.get("batch_id")
            or analysis_id
        )

    data = gas.post_action(
        "createOwnerReportPdf",
        params,
    )

    url = (
        data.get("url")
        if isinstance(data, dict)
        else None
    )

    if not url:
        raise GasClientError(
            "لم يُرجع GAS رابط PDF"
        )

    return {
        "ok": True,
        "url": url,
    }


def analyze_upload_with_gas_fallback(
    files: List[dict],
    ctx: Dict[str, Any],
    lang: Lang = "ar",
) -> Dict[str, Any]:
    """Use GAS when available, otherwise use the local Python engine."""

    if gas_import_available():
        try:
            return run_gas_import_analysis(
                files,
                lang=lang,
            )
        except GasClientError as exc:
            logger.warning(
                (
                    "GAS import failed; falling back "
                    "to Python engine: %s"
                ),
                exc,
            )
        except Exception:
            logger.exception(
                (
                    "Unexpected GAS import failure; "
                    "falling back to Python engine"
                )
            )

    payload = analyze_upload_portfolio(
        files,
        ctx,
        lang=lang,
    )

    if not isinstance(payload, dict):
        raise RuntimeError(
            "Python portfolio engine returned an invalid payload"
        )

    analysis_id = str(
        payload.get("analysis_id")
        or uuid.uuid4()
    )

    payload["analysis_id"] = analysis_id

    intake_meta = payload.get("intake_meta")

    if not isinstance(intake_meta, dict):
        intake_meta = {}
        payload["intake_meta"] = intake_meta

    intake_meta.setdefault(
        "engine",
        "python_portfolio",
    )

    intake_meta.setdefault(
        "synthetic_fallback",
        False,
    )

    pipeline = payload.get("pipeline")

    if not isinstance(pipeline, dict):
        pipeline = {}
        payload["pipeline"] = pipeline

    pipeline.update(
        {
            "source": "python",
            "gas_attempted": gas_import_available(),
        }
    )

    _import_sessions[analysis_id] = {
        "batch_id": analysis_id,
        "files_meta": _to_gas_files_meta(files),
        "source": "python",
        "lang": lang,
    }

    return payload
