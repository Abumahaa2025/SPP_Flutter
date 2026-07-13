"""Deep property statement intake — classify, parse, link months, lifecycle."""

from _future_ import annotations

import re
from typing import Dict, List, Tuple

from .intake_classifier import classify_file
from .intake_lifecycle import (
    build_annual_stats,
    build_late_payments_by_month,
    build_lifecycle,
    build_monthly_index,
    build_tenant_payment_ledger,
    build_unique_unit_stats,
    costliest_units,
    find_late_tenants,
    maintenance_frequency,
)
from .intake_parser import (
    align_ambiguous_units_across_parsed_rolls,
    parse_expense_text,
    parse_rent_roll_text,
)


_MIN_CONTENT_LENGTH = 10


def _file_name(file_item: dict) -> str:
    return str(file_item.get("name") or "").strip()


def _file_snippet(file_item: dict) -> str:
    return str(
        file_item.get("textSnippet")
        or file_item.get("contentPreview")
        or ""
    ).strip()


def _is_supported_tabular_file(file_item: dict) -> bool:
    name = _file_name(file_item).lower()
    return name.endswith((".xlsx", ".xls", ".csv"))


def _is_rent_file(file_item: dict, classification) -> bool:
    name = _file_name(file_item).lower()

    if classification.doc_type in ("rent_roll", "comprehensive"):
        return True

    has_rent_keyword = bool(
        re.search(r"(?:كشف|rent|إيجار|ايجار|roll|تحصيل|سداد)", name)
    )
    has_expense_keyword = bool(
        re.search(r"(?:صيان|مصروف|expense|maint)", name)
    )

    return has_rent_keyword and not has_expense_keyword


def _is_expense_file(classification) -> bool:
    return classification.doc_type in ("maintenance", "expense")


def _append_parse_error(
    errors: List[dict],
    file_name: str,
    message: str,
) -> None:
    errors.append(
        {
            "file_name": file_name or "—",
            "error": message or "فشل التحليل",
        }
    )


def _append_unreadable_file(
    unreadable_files: List[dict],
    file_name: str,
) -> None:
    unreadable_files.append(
        {
            "file_name": file_name or "—",
            "reason": (
                "لم أقرأ محتوى الملف — أعد الرفع أو جرّب ملفًا أصغر"
            ),
        }
    )


def _apply_detected_period(
    parsed: dict,
    classification,
) -> dict:
    if not parsed.get("month"):
        parsed["month"] = classification.month

    if not parsed.get("year"):
        parsed["year"] = classification.year

    return parsed


def _dedupe_rolls_by_period(
    parsed_rolls: List[dict],
) -> List[dict]:
    """
    Keep the latest uploaded roll for each exact year/month.

    Important:
    January 2025 and January 2026 are different periods and must never
    overwrite one another.
    """
    known_periods: Dict[Tuple[int, int], dict] = {}
    unknown_periods: List[dict] = []

    for parsed_roll in parsed_rolls:
        year = int(parsed_roll.get("year") or 0)
        month = int(parsed_roll.get("month") or 0)

        if year > 0 and 1 <= month <= 12:
            known_periods[(year, month)] = parsed_roll
        else:
            # Do not merge statements whose period could not be confirmed.
            unknown_periods.append(parsed_roll)

    ordered_known = [
        known_periods[key]
        for key in sorted(known_periods.keys())
    ]

    return ordered_known + unknown_periods


def analyze_statements_deep(
    files: List[dict],
    ctx: dict,
) -> dict:
    parsed_rolls: List[dict] = []
    expense_rolls: List[dict] = []
    parse_errors: List[dict] = []
    files_without_content: List[dict] = []
    file_classifications: List[dict] = []

    for file_item in files:
        classification = classify_file(file_item)
        file_name = classification.name or _file_name(file_item)
        snippet = _file_snippet(file_item)

        file_classifications.append(
            {
                "name": file_name,
                "category": classification.doc_type,
                "category_ar": classification.doc_type_label_ar,
                "category_en": classification.doc_type_label_en,
                "confidence": classification.confidence,
                "month": classification.month,
                "year": classification.year,
                "reasons": classification.reasons,
            }
        )

        is_expense = _is_expense_file(classification)
        is_rent = _is_rent_file(file_item, classification)
        is_tabular = _is_supported_tabular_file(file_item)

        if len(snippet) <= _MIN_CONTENT_LENGTH:
            if is_expense or is_rent or is_tabular:
                _append_unreadable_file(
                    files_without_content,
                    file_name,
                )
            continue

        if is_expense:
            expense_result = parse_expense_text(
                snippet,
                file_item,
            )

            if expense_result.get("ok"):
                expense_rolls.append(expense_result)
            else:
                _append_parse_error(
                    parse_errors,
                    file_name,
                    str(
                        expense_result.get("error")
                        or "فشل تحليل ملف الصيانة أو المصروفات"
                    ),
                )

            continue

        if is_rent:
            rent_result = parse_rent_roll_text(
                snippet,
                file_item,
            )
            rent_result = _apply_detected_period(
                rent_result,
                classification,
            )

            if rent_result.get("ok"):
                parsed_rolls.append(rent_result)
            else:
                _append_parse_error(
                    parse_errors,
                    file_name,
                    str(
                        rent_result.get("error")
                        or "فشل تحليل كشف الإيجارات"
                    ),
                )

            continue

        # Last safe attempt for an unclassified readable file.
        fallback_result = parse_rent_roll_text(
            snippet,
            file_item,
        )
        fallback_result = _apply_detected_period(
            fallback_result,
            classification,
        )

        if (
            fallback_result.get("ok")
            and int(fallback_result.get("row_count") or 0) > 0
        ):
            parsed_rolls.append(fallback_result)
        elif fallback_result.get("error"):
            _append_parse_error(
                parse_errors,
                file_name,
                str(fallback_result.get("error")),
            )

    parsed_rolls = _dedupe_rolls_by_period(parsed_rolls)

    align_ambiguous_units_across_parsed_rolls(
        parsed_rolls
    )

    monthly_index = build_monthly_index(
        parsed_rolls
    )
    lifecycle = build_lifecycle(
        monthly_index
    )
    annual = build_annual_stats(
        parsed_rolls,
        lifecycle,
    )
    unique_stats = build_unique_unit_stats(
        monthly_index
    )
    payment_ledger = build_tenant_payment_ledger(
        parsed_rolls
    )

    quality_log: List[str] = []

    merge_count = int(
        payment_ledger.get("merge_count") or 0
    )

    if merge_count:
        quality_log.append(
            f"تم دمج {merge_count} سجلًا مكررًا للمستأجر/الشهر."
        )

    for parse_error in parse_errors:
        quality_log.append(
            "خطأ في "
            f"{parse_error.get('file_name')}: "
            f"{parse_error.get('error')}"
        )

    for unreadable_file in files_without_content:
        quality_log.append(
            f"لم يُقرأ: {unreadable_file.get('file_name')}"
        )

    if expense_rolls:
        expense_total = sum(
            float(expense.get("total") or 0)
            for expense in expense_rolls
        )

        annual["expense_from_rolls"] = round(
            expense_total
        )
        annual["maintenance_cost"] = round(
            expense_total
        )

    return {
        "parsed_rolls": parsed_rolls,
        "expense_rolls": expense_rolls,
        "parse_errors": parse_errors,
        "files_without_content": files_without_content,
        "file_classifications": file_classifications,
        "monthly_index": monthly_index,
        "lifecycle": lifecycle,
        "annual": annual,
        "late_tenants": find_late_tenants(
            parsed_rolls
        ),
        "late_by_month": build_late_payments_by_month(
            payment_ledger
        ),
        "payment_ledger": payment_ledger,
        "unique_unit_stats": unique_stats,
        "quality_log": quality_log,
        "maintenance_freq": maintenance_frequency(
            expense_rolls
        ),
        "costliest_units": costliest_units(
            expense_rolls,
            parsed_rolls,
        ),
        "used_synthetic": False,
        "pipeline_meta": {
            "context_received": isinstance(ctx, dict),
            "files_received": len(files),
            "rent_rolls_parsed": len(parsed_rolls),
            "expense_rolls_parsed": len(expense_rolls),
            "period_key": "year_month",
            "synthetic_data_used": False,
        },
    }
