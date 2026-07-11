"""Format late-payment ledger into executive-report rows — month-by-month, universal rules."""

from __future__ import annotations

from typing import List, Literal, Optional

from .intake_classifier import month_label

Lang = Literal["ar", "en"]


def _item(label: str, value: str) -> dict:
    return {"label": label, "value": value}


def build_late_section_items(
    late_by_month: Optional[dict],
    late_tenants_detailed: List[dict],
    total_unpaid: float,
    late_tenant_count: int,
    lang: Lang = "ar",
    max_month_rows: int = 60,
) -> List[dict]:
    """One row per late tenant per month + summary totals (fits existing UI sections)."""
    items: List[dict] = []
    if lang == "ar":
        items.append(_item("عدد المتأخرين", str(late_tenant_count)))
        items.append(_item("إجمالي المتأخرات", f"{total_unpaid:,.0f} ر.س"))
    else:
        items.append(_item("Late tenants", str(late_tenant_count)))
        items.append(_item("Total overdue", f"{total_unpaid:,.0f} SAR"))

    months = (late_by_month or {}).get("months") or []
    row_budget = max_month_rows

    if months:
        for mb in months:
            if row_budget <= 0:
                break
            ml = mb.get("monthLabel") or mb.get("month_label") or month_label(
                int(mb.get("month") or 0), lang
            )
            yr = mb.get("year")
            if yr and lang == "ar" and str(yr) not in str(ml):
                ml = f"{ml} {yr}"
            elif yr and lang == "en" and str(yr) not in str(ml):
                ml = f"{ml} {yr}"
            late_n = int(mb.get("lateCount") or len(mb.get("items") or []))
            month_total = float(mb.get("monthTotal") or mb.get("month_total") or 0)
            if lang == "ar":
                items.append(_item(f"── {ml} ──", f"{late_n} متأخر · {month_total:,.0f} ر.س"))
            else:
                items.append(_item(f"── {ml} ──", f"{late_n} late · {month_total:,.0f} SAR"))
            row_budget -= 1

            for it in mb.get("items") or []:
                if row_budget <= 0:
                    break
                contract = (it.get("contract") or "").strip() or "—"
                phone = (it.get("phone") or "").strip() or ("بدون جوال" if lang == "ar" else "no phone")
                amt = float(it.get("amount") or it.get("remaining") or it.get("rent") or 0)
                label = f"{it.get('tenant') or '—'} · {it.get('unit') or '—'}"
                if lang == "ar":
                    value = f"عقد {contract} · {phone} · {amt:,.0f} ر.س"
                else:
                    value = f"contract {contract} · {phone} · {amt:,.0f} SAR"
                items.append(_item(label, value))
                row_budget -= 1

        if late_tenants_detailed:
            if lang == "ar":
                items.append(_item("── إجمالي لكل مستأجر ──", f"{len(late_tenants_detailed)} مستأجر"))
            else:
                items.append(_item("── Per-tenant totals ──", f"{len(late_tenants_detailed)} tenants"))
            for lt in late_tenants_detailed[:25]:
                contract = (lt.get("contract") or "").strip() or "—"
                phone = (lt.get("phone") or "").strip() or ("بدون جوال" if lang == "ar" else "no phone")
                total = float(lt.get("totalUnpaid") or lt.get("total_unpaid") or lt.get("rent") or 0)
                months_n = int(lt.get("lateMonthCount") or lt.get("late_month_count") or 0)
                label = f"{lt.get('tenant') or '—'} · {lt.get('unit') or '—'}"
                if lang == "ar":
                    value = f"{months_n} أشهر · {total:,.0f} ر.س · عقد {contract} · {phone}"
                else:
                    value = f"{months_n} mo · {total:,.0f} SAR · contract {contract} · {phone}"
                items.append(_item(label, value))
        return items

    for lt in late_tenants_detailed[:20]:
        contract = (lt.get("contract") or "").strip() or "—"
        phone = (lt.get("phone") or "").strip() or ("بدون جوال" if lang == "ar" else "no phone")
        months_n = int(lt.get("lateMonthCount") or lt.get("late_month_count") or 0)
        total = float(lt.get("totalUnpaid") or lt.get("total_unpaid") or lt.get("rent") or 0)
        months_txt = lt.get("monthLabels") or lt.get("month_labels") or ""
        label = f"{lt.get('tenant') or '—'} · {lt.get('unit') or '—'}"
        if lang == "ar":
            value = f"{months_n} أشهر · {total:,.0f} ر.س · عقد {contract} · {phone}"
        else:
            value = f"{months_n} mo · {total:,.0f} SAR · contract {contract} · {phone}"
        if months_txt:
            value += f" · {months_txt}"
        items.append(_item(label, value))

    if len(items) <= 2:
        items.append(
            _item("—", "لا متأخرات في الأشهر المحلّلة" if lang == "ar" else "No late rows in parsed months")
        )
    return items
