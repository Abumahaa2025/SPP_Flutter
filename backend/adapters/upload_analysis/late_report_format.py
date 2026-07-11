"""Structured late-payments view model + legacy flat rows for executive report."""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from .intake_classifier import month_label

Lang = Literal["ar", "en"]

_STATUS_LABELS_AR = {
    "unpaid": "غير مدفوع",
    "partial": "سداد جزئي",
    "pending": "لم يُسدد",
}
_STATUS_LABELS_EN = {
    "unpaid": "Unpaid",
    "partial": "Partial payment",
    "pending": "Not paid",
}


def _item(label: str, value: str) -> dict:
    return {"label": label, "value": value}


def _status_label(status: str, lang: Lang) -> str:
    labels = _STATUS_LABELS_AR if lang == "ar" else _STATUS_LABELS_EN
    return labels.get(status or "pending", status or "—")


def _month_display(mb: dict, lang: Lang) -> str:
    ml = mb.get("monthLabel") or mb.get("month_label") or month_label(int(mb.get("month") or 0), lang)
    yr = mb.get("year")
    if yr and str(yr) not in str(ml):
        return f"{ml} {yr}".strip()
    return str(ml)


def _sort_month_items(items: List[dict]) -> List[dict]:
    return sorted(
        items,
        key=lambda it: (
            -float(it.get("amount") or it.get("remaining") or 0),
            str(it.get("unit") or ""),
            str(it.get("tenant") or ""),
        ),
    )


def _normalize_tenant_entry(it: dict, lang: Lang) -> dict:
    due = float(it.get("rent") or it.get("due") or it.get("amount") or 0)
    paid = float(it.get("paid") or 0)
    remaining = float(it.get("amount") or it.get("remaining") or max(0, due - paid))
    status = str(it.get("status") or "pending")
    return {
        "tenant": str(it.get("tenant") or "—"),
        "unit": str(it.get("unit") or "—"),
        "contract": str(it.get("contract") or "").strip(),
        "phone": str(it.get("phone") or "").strip(),
        "due": round(due, 2),
        "paid": round(paid, 2),
        "remaining": round(remaining, 2),
        "status": status,
        "status_label": _status_label(status, lang),
    }


def _sort_tenant_totals(rows: List[dict]) -> List[dict]:
    def oldest_key(row: dict) -> int:
        om = row.get("oldest_month") or {}
        y = int(om.get("year") or row.get("oldest_year") or 9999)
        m = int(om.get("month") or row.get("oldest_month_num") or 99)
        return y * 100 + m

    return sorted(
        rows,
        key=lambda r: (
            -int(r.get("late_month_count") or 0),
            -float(r.get("total_unpaid") or 0),
            oldest_key(r),
        ),
    )


def build_late_payments_view_model(
    late_by_month: Optional[dict],
    late_tenants_detailed: List[dict],
    total_unpaid: float,
    late_tenant_count: int,
    lang: Lang = "ar",
) -> dict:
    """Structured payload for mobile late-payments UI (collapsible cards)."""
    months_out: List[dict] = []
    lbm = late_by_month or {}

    for mb in lbm.get("months") or []:
        label = _month_display(mb, lang)
        year = int(mb.get("year") or 0)
        month = int(mb.get("month") or 0)
        tenants = [_normalize_tenant_entry(it, lang) for it in _sort_month_items(mb.get("items") or [])]
        months_out.append(
            {
                "key": f"{year}-{month}",
                "label": label,
                "year": year,
                "month": month,
                "tenant_count": len(tenants),
                "month_total": round(float(mb.get("monthTotal") or mb.get("month_total") or 0), 2),
                "tenants": tenants,
            }
        )

    tenant_totals: List[dict] = []
    for lt in late_tenants_detailed or []:
        unpaid_months = []
        for m in lt.get("months") or []:
            st = m.get("status") or "pending"
            if st in ("paid", "not_due"):
                continue
            ml = month_label(int(m.get("month") or 0), lang)
            yr = m.get("year")
            if yr:
                ml = f"{ml} {yr}"
            unpaid_months.append(
                {
                    "label": ml,
                    "amount": round(float(m.get("remaining") or m.get("due") or 0), 2),
                    "year": int(m.get("year") or 0),
                    "month": int(m.get("month") or 0),
                }
            )
        if not unpaid_months and lt.get("monthLabels"):
            # Legacy GAS string fallback — keep totals even without month objects
            unpaid_months = [{"label": lt.get("monthLabels"), "amount": float(lt.get("totalUnpaid") or lt.get("total_unpaid") or 0)}]

        om = lt.get("oldestMonth") or lt.get("oldest_month") or (unpaid_months[0] if unpaid_months else {})
        tenant_totals.append(
            {
                "tenant": str(lt.get("tenant") or "—"),
                "unit": str(lt.get("unit") or "—"),
                "contract": str(lt.get("contract") or "").strip(),
                "phone": str(lt.get("phone") or "").strip(),
                "late_month_count": int(lt.get("lateMonthCount") or lt.get("late_month_count") or len(unpaid_months)),
                "total_unpaid": round(float(lt.get("totalUnpaid") or lt.get("total_unpaid") or 0), 2),
                "months": unpaid_months,
                "oldest_month": om,
            }
        )

    tenant_totals = _sort_tenant_totals(tenant_totals)

    top = tenant_totals[0] if tenant_totals else None
    oldest = None
    if tenant_totals:
        oldest_row = min(
            tenant_totals,
            key=lambda r: (
                int((r.get("oldest_month") or {}).get("year") or 9999) * 100
                + int((r.get("oldest_month") or {}).get("month") or 99)
            ),
        )
        om = oldest_row.get("oldest_month") or {}
        oldest_label = month_label(int(om.get("month") or 0), lang)
        if om.get("year"):
            oldest_label = f"{oldest_label} {om.get('year')}"
        oldest = {
            "tenant": oldest_row.get("tenant"),
            "unit": oldest_row.get("unit"),
            "month_label": oldest_label or "—",
            "total_unpaid": oldest_row.get("total_unpaid"),
        }

    return {
        "summary": {
            "total_unpaid": round(float(total_unpaid), 2),
            "late_tenant_count": int(late_tenant_count or len(tenant_totals)),
            "top_tenant": (
                {
                    "tenant": top.get("tenant"),
                    "unit": top.get("unit"),
                    "total_unpaid": top.get("total_unpaid"),
                    "late_month_count": top.get("late_month_count"),
                }
                if top
                else None
            ),
            "oldest_tenant": oldest,
        },
        "months": months_out,
        "tenant_totals": tenant_totals,
    }


def build_late_section_items(
    late_by_month: Optional[dict],
    late_tenants_detailed: List[dict],
    total_unpaid: float,
    late_tenant_count: int,
    lang: Lang = "ar",
    max_month_rows: int = 60,
) -> List[dict]:
    """Legacy flat rows — kept for PDF/backward compatibility."""
    vm = build_late_payments_view_model(
        late_by_month, late_tenants_detailed, total_unpaid, late_tenant_count, lang
    )
    items: List[dict] = []
    s = vm["summary"]
    if lang == "ar":
        items.append(_item("عدد المتأخرين", str(s["late_tenant_count"])))
        items.append(_item("إجمالي المتأخرات", f"{s['total_unpaid']:,.0f} ر.س"))
    else:
        items.append(_item("Late tenants", str(s["late_tenant_count"])))
        items.append(_item("Total overdue", f"{s['total_unpaid']:,.0f} SAR"))

    if not vm["months"] and not vm["tenant_totals"]:
        items.append(
            _item("—", "لا متأخرات في الأشهر المحلّلة" if lang == "ar" else "No late rows in parsed months")
        )
    return items
