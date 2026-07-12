"""Property Knowledge Engine — canonical facts from import snapshot (any client)."""

from __future__ import annotations

from typing import Any, Dict, List, Literal

from adapters.upload_analysis.intake_classifier import month_label

Lang = Literal["ar", "en"]


def _f(v: Any, default: float = 0.0) -> float:
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return default


def _tenant_key(name: str) -> str:
    return "".join((name or "").lower().split())


def _ml(month: int, year: int, lang: Lang) -> str:
    base = month_label(int(month or 0), lang)
    if year:
        return f"{base} {year}".strip()
    return base


def _normalize_late_tenant(row: dict) -> dict:
    months = row.get("months") or []
    unpaid = [m for m in months if (m.get("status") or "") in ("unpaid_confirmed", "partial", "unpaid")]
    return {
        "tenant": row.get("tenant") or row.get("Tenant") or "—",
        "unit": row.get("unit") or "—",
        "phone": (row.get("phone") or "").strip(),
        "contract": (row.get("contract") or "").strip(),
        "late_month_count": int(row.get("lateMonthCount") or row.get("late_month_count") or len(unpaid)),
        "total_unpaid": _f(row.get("totalUnpaid") or row.get("total_unpaid")),
        "months": unpaid,
        "has_partial": any((m.get("status") or "") == "partial" for m in unpaid),
        "consecutive_late": _count_consecutive_late(unpaid),
    }


def _count_consecutive_late(unpaid: List[dict]) -> int:
    if not unpaid:
        return 0
    sorted_m = sorted(unpaid, key=lambda m: (int(m.get("year") or 0), int(m.get("month") or 0)))
    best = cur = 1
    for i in range(1, len(sorted_m)):
        prev = sorted_m[i - 1]
        cur_m = sorted_m[i]
        pk = int(prev.get("year") or 0) * 100 + int(prev.get("month") or 0)
        ck = int(cur_m.get("year") or 0) * 100 + int(cur_m.get("month") or 0)
        if ck - pk == 1 or (prev.get("month") == 12 and cur_m.get("month") == 1 and int(cur_m.get("year") or 0) == int(prev.get("year") or 0) + 1):
            cur += 1
            best = max(best, cur)
        else:
            cur = 1
    return best


def _detect_tenant_changes(departed: List[dict], newcomers: List[dict]) -> List[dict]:
    changes: List[dict] = []
    for d in departed:
        reason = d.get("reason") or ""
        if "استبدال" in reason or "replacement" in reason.lower():
            new_t = reason.split("—")[-1].strip() if "—" in reason else ""
            changes.append(
                {
                    "unit": d.get("unit"),
                    "from_tenant": d.get("tenant"),
                    "to_tenant": new_t or None,
                    "month": d.get("departedMonth") or d.get("departed_month"),
                    "year": d.get("departedYear") or d.get("departed_year"),
                    "type": "replacement",
                }
            )
        else:
            changes.append(
                {
                    "unit": d.get("unit"),
                    "from_tenant": d.get("tenant"),
                    "to_tenant": None,
                    "month": d.get("departedMonth") or d.get("departed_month"),
                    "year": d.get("departedYear") or d.get("departed_year"),
                    "type": "departure",
                }
            )
    for n in newcomers:
        changes.append(
            {
                "unit": n.get("unit"),
                "from_tenant": None,
                "to_tenant": n.get("tenant"),
                "month": n.get("arrivedMonth") or n.get("arrived_month"),
                "year": n.get("arrivedYear") or n.get("arrived_year"),
                "type": "arrival",
            }
        )
    return changes


def _collection_by_month(monthly: List[dict]) -> List[dict]:
    out = []
    for m in monthly:
        expected = _f(m.get("expected") or m.get("rent"))
        collected = _f(m.get("collected"))
        rate = round(collected / expected * 100, 1) if expected else 0.0
        out.append(
            {
                "month": int(m.get("month") or 0),
                "year": int(m.get("year") or 0),
                "expected": expected,
                "collected": collected,
                "late_count": int(m.get("lateCount") or m.get("late_count") or 0),
                "collection_rate_pct": rate,
            }
        )
    out.sort(key=lambda x: x["year"] * 100 + x["month"])
    return out


def _contract_gaps(active: List[dict], late: List[dict]) -> dict:
    missing_phone = []
    missing_contract = []
    for row in active + late:
        unit = row.get("unit") or "—"
        tenant = row.get("tenant") or "—"
        if not (row.get("phone") or "").strip():
            missing_phone.append({"unit": unit, "tenant": tenant})
        if not (row.get("contract") or "").strip():
            missing_contract.append({"unit": unit, "tenant": tenant})
    return {
        "missing_phone": missing_phone,
        "missing_contract": missing_contract,
    }


def build_property_knowledge(snapshot: dict, lang: Lang = "ar") -> dict:
    """Build structured property knowledge from any import snapshot."""
    snapshot = snapshot or {}
    lc = snapshot.get("lifecycle") or {}
    stats = snapshot.get("stats") or {}
    pb = snapshot.get("payment_board") or {}
    ann = snapshot.get("annual") or {}

    departed = lc.get("departed") or []
    active = lc.get("active") or []
    newcomers = lc.get("newcomers") or lc.get("newInLastMonth") or []

    late_raw = snapshot.get("late_tenants") or pb.get("lateTenants") or []
    late_tenants = [_normalize_late_tenant(x) for x in late_raw if x]

    collection = _collection_by_month(snapshot.get("monthly_breakdown") or [])
    tenant_changes = _detect_tenant_changes(departed, newcomers)

    units_needing_review = 0
    for w in snapshot.get("quality_log") or []:
        if "مراجعة" in str(w) or "review" in str(w).lower():
            units_needing_review += 1

    period_from = period_to = None
    if collection:
        period_from = _ml(collection[0]["month"], collection[0]["year"], lang)
        period_to = _ml(collection[-1]["month"], collection[-1]["year"], lang)

    return {
        "meta": {
            "source": snapshot.get("source"),
            "batch_id": snapshot.get("batch_id"),
            "lang": lang,
            "month_count": int(lc.get("monthCount") or lc.get("month_count") or len(collection)),
            "period_from": period_from,
            "period_to": period_to,
            "files_count": int(snapshot.get("files_count") or 0),
        },
        "units": {
            "total": int(stats.get("uniqueUnits") or stats.get("unique_units") or 0),
            "residential": int(stats.get("apartmentCount") or stats.get("apartment_count") or 0),
            "commercial": int(stats.get("shopCount") or stats.get("shop_count") or 0),
            "active_count": len(active),
            "needs_review_count": units_needing_review,
        },
        "collection": {
            "by_month": collection,
            "total_expected": _f(ann.get("totalExpected") or ann.get("total_expected")),
            "total_collected": _f(ann.get("totalCollected") or ann.get("total_collected")),
            "total_unpaid": _f(pb.get("totalUnpaidAllMonths") or pb.get("total_unpaid")),
        },
        "late": {
            "tenant_count": len(late_tenants),
            "tenants": late_tenants,
            "total_unpaid": sum(t["total_unpaid"] for t in late_tenants),
        },
        "lifecycle": {
            "departed_count": len(departed),
            "newcomers_count": len(newcomers),
            "tenant_changes": tenant_changes,
            "departed": departed[:50],
            "newcomers": newcomers[:50],
            "active": active[:100],
        },
        "contracts": _contract_gaps(active, late_tenants),
        "quality": {
            "warnings": list(snapshot.get("quality_log") or [])[:20],
            "parse_errors": list(snapshot.get("parse_errors") or [])[:10],
            "files_without_content": list(snapshot.get("files_without_content") or [])[:10],
            "merge_count": int(pb.get("mergeCount") or pb.get("merge_count") or 0),
        },
        "maintenance": {
            "entries": (snapshot.get("maintenance_log") or [])[:20],
            "total": sum(_f(x.get("amount")) for x in (snapshot.get("maintenance_log") or [])),
        },
    }
