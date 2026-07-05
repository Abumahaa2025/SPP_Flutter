"""Link monthly rent rolls — lifecycle, MoM deltas, annual stats."""

from __future__ import annotations

from typing import Any, Dict, List, Tuple


def month_sort_key(year: int, month: int) -> int:
    return (year or 0) * 100 + (month or 0)


def build_monthly_index(parsed_rolls: List[dict]) -> dict:
    by_key: Dict[str, dict] = {}
    for pr in parsed_rolls:
        if not pr.get("ok") or not pr.get("rows"):
            continue
        mk = month_sort_key(pr.get("year", 0), pr.get("month", 0))
        if not mk:
            mk = 900000 + parsed_rolls.index(pr)
        key = str(mk)
        if key not in by_key:
            by_key[key] = {
                "year": pr.get("year"),
                "month": pr.get("month"),
                "file_name": pr.get("file_name", ""),
                "rows": [],
                "units": {},
            }
        for r in pr["rows"]:
            unit = r.get("unit") or ""
            if not unit:
                continue
            by_key[key]["rows"].append(r)
            by_key[key]["units"][unit] = r
    keys = sorted(by_key.keys(), key=lambda k: int(k))
    return {"by_key": by_key, "keys": keys, "month_count": len(keys)}


def _tenant_key(name: str) -> str:
    return "".join((name or "").lower().split())


def build_lifecycle(monthly_index: dict) -> dict:
    keys = monthly_index.get("keys") or []
    by_key = monthly_index.get("by_key") or {}
    timeline: Dict[str, dict] = {}
    departed: List[dict] = []
    newcomers: List[dict] = []
    active: List[dict] = []
    seen_dep: set = set()
    seen_new: set = set()
    unit_months: Dict[str, List[dict]] = {}

    for k in keys:
        snap = by_key[k]
        for unit, row in (snap.get("units") or {}).items():
            unit_months.setdefault(unit, []).append(
                {"month": snap["month"], "year": snap["year"], "row": row}
            )

    for unit, seq in unit_months.items():
        for i, cur in enumerate(seq):
            row = cur["row"]
            tenant = row.get("tenant") or unit
            tid = f"{unit}|{_tenant_key(tenant)}"
            if tid not in timeline:
                timeline[tid] = {
                    "unit": unit,
                    "tenant": tenant,
                    "phone": row.get("phone", ""),
                    "contract": row.get("contract", ""),
                    "rent": row.get("rent", 0),
                    "first_month": cur["month"],
                    "first_year": cur["year"],
                    "last_month": cur["month"],
                    "last_year": cur["year"],
                    "months_present": 0,
                    "had_late": False,
                    "total_rent": 0.0,
                    "paid_rent": 0.0,
                }
            t = timeline[tid]
            t["last_month"] = cur["month"]
            t["last_year"] = cur["year"]
            t["months_present"] += 1
            if row.get("phone"):
                t["phone"] = row["phone"]
            if row.get("contract"):
                t["contract"] = row["contract"]
            if row.get("rent"):
                t["rent"] = row["rent"]
            if row.get("is_late"):
                t["had_late"] = True
            t["total_rent"] += float(row.get("rent") or 0)
            if row.get("is_paid"):
                t["paid_rent"] += float(row.get("rent") or 0)

            if i > 0:
                prev = seq[i - 1]["row"]
                prev_t = prev.get("tenant") or unit
                if _tenant_key(prev_t) != _tenant_key(tenant):
                    dep_k = f"{unit}|{_tenant_key(prev_t)}|{cur['month']}/{cur['year']}"
                    if dep_k not in seen_dep:
                        seen_dep.add(dep_k)
                        departed.append(
                            {
                                "unit": unit,
                                "tenant": prev_t,
                                "phone": prev.get("phone", ""),
                                "contract": prev.get("contract", ""),
                                "rent": prev.get("rent", 0),
                                "departed_month": cur["month"],
                                "departed_year": cur["year"],
                                "reason": f"استبدال — {tenant}" if tenant else "غادر — وحدة شاغرة",
                                "had_late": prev.get("is_late", False),
                                "stay_months": i,
                            }
                        )
                    if tenant:
                        new_k = f"{unit}|{_tenant_key(tenant)}|{cur['month']}/{cur['year']}"
                        if new_k not in seen_new:
                            seen_new.add(new_k)
                            newcomers.append(
                                {
                                    "unit": unit,
                                    "tenant": tenant,
                                    "phone": row.get("phone", ""),
                                    "contract": row.get("contract", ""),
                                    "rent": row.get("rent", 0),
                                    "arrived_month": cur["month"],
                                    "arrived_year": cur["year"],
                                }
                            )

    new_in_last: List[dict] = []
    if keys:
        last = by_key[keys[-1]]
        prev = by_key[keys[-2]] if len(keys) > 1 else None
        for unit, row in (last.get("units") or {}).items():
            tenant = row.get("tenant") or unit
            tid = f"{unit}|{_tenant_key(tenant)}"
            t2 = timeline.get(tid, {})
            active.append(
                {
                    "unit": unit,
                    "tenant": tenant,
                    "phone": row.get("phone") or t2.get("phone", ""),
                    "contract": row.get("contract") or t2.get("contract", ""),
                    "rent": row.get("rent") or t2.get("rent", 0),
                    "since_month": t2.get("first_month") or last["month"],
                    "since_year": t2.get("first_year") or last["year"],
                    "stay_months": t2.get("months_present") or 1,
                    "is_late": row.get("is_late", False),
                    "is_paid": row.get("is_paid", False),
                    "pay_status": "مسدد" if row.get("is_paid") else ("متأخر" if row.get("is_late") else "لم يسدد"),
                }
            )
        if prev:
            for unit, cur_row in (last.get("units") or {}).items():
                prev_row = (prev.get("units") or {}).get(unit)
                cur_t = cur_row.get("tenant") or unit
                prev_t = (prev_row or {}).get("tenant") or ""
                if _tenant_key(cur_t) != _tenant_key(prev_t):
                    new_in_last.append(
                        {
                            "unit": unit,
                            "tenant": cur_t,
                            "rent": cur_row.get("rent", 0),
                            "arrived_month": last["month"],
                            "arrived_year": last["year"],
                            "replaced": prev_t or "شاغرة",
                        }
                    )

    return {
        "timeline": timeline,
        "departed": departed,
        "active": active,
        "newcomers": newcomers,
        "new_in_last_month": new_in_last,
        "last_month": by_key[keys[-1]]["month"] if keys else 0,
        "last_year": by_key[keys[-1]]["year"] if keys else 0,
        "month_count": len(keys),
    }


def build_annual_stats(parsed_rolls: List[dict], lifecycle: dict) -> dict:
    expected = 0.0
    collected = 0.0
    for pr in parsed_rolls:
        for r in pr.get("rows") or []:
            rent = float(r.get("rent") or 0)
            expected += rent
            if r.get("is_paid"):
                collected += rent
    return {
        "total_expected": round(expected),
        "total_collected": round(collected),
        "month_count": lifecycle.get("month_count") or 0,
        "departed_count": len(lifecycle.get("departed") or []),
        "active_count": len(lifecycle.get("active") or []),
        "newcomers_count": len(lifecycle.get("newcomers") or []),
    }


def build_month_comparison(parsed_rolls: List[dict], expense_rolls: List[dict], lang: str) -> List[dict]:
    from .intake_classifier import month_label

    index = build_monthly_index(parsed_rolls)
    exp_by_month: Dict[int, float] = {}
    for er in expense_rolls:
        for r in er.get("rows") or []:
            m = extract_month_from_expense(er, r)
            exp_by_month[m] = exp_by_month.get(m, 0) + float(r.get("amount") or 0)

    out: List[dict] = []
    prev_rev = 0.0
    for k in index["keys"]:
        snap = index["by_key"][k]
        month = int(snap.get("month") or 0)
        rev = sum(float(r.get("rent") or 0) for r in snap.get("rows") or [])
        coll = sum(float(r.get("rent") or 0) for r in snap.get("rows") or [] if r.get("is_paid"))
        exp = exp_by_month.get(month, round(rev * 0.28))
        delta = round(rev - prev_rev) if prev_rev else 0
        out.append(
            {
                "month": month_label(month, lang),
                "month_num": month,
                "revenue": round(rev),
                "collected": round(coll),
                "expenses": round(exp),
                "delta_revenue": delta,
                "late_count": sum(1 for r in snap.get("rows") or [] if r.get("is_late")),
                "paid_count": sum(1 for r in snap.get("rows") or [] if r.get("is_paid")),
            }
        )
        prev_rev = rev
    return out


def extract_month_from_expense(er: dict, row: dict) -> int:
    from .intake_classifier import extract_month

    return extract_month(er.get("file_name") or "")


def find_late_tenants(parsed_rolls: List[dict]) -> List[dict]:
    late: List[dict] = []
    seen: set = set()
    for pr in parsed_rolls:
        for r in pr.get("rows") or []:
            if not r.get("is_late"):
                continue
            k = f"{r.get('unit')}|{r.get('tenant')}|{pr.get('month')}"
            if k in seen:
                continue
            seen.add(k)
            late.append(
                {
                    "unit": r.get("unit"),
                    "tenant": r.get("tenant"),
                    "rent": r.get("rent"),
                    "month": pr.get("month"),
                    "year": pr.get("year"),
                    "phone": r.get("phone", ""),
                }
            )
    return late


def maintenance_frequency(expense_rolls: List[dict]) -> List[Tuple[str, int, float]]:
    freq: Dict[str, List[float]] = {}
    for er in expense_rolls:
        for r in er.get("rows") or []:
            desc = (r.get("description") or "صيانة").strip()
            freq.setdefault(desc, []).append(float(r.get("amount") or 0))
    ranked = sorted(freq.items(), key=lambda x: (-len(x[1]), -sum(x[1])))
    return [(d, len(amts), round(sum(amts))) for d, amts in ranked[:8]]


def costliest_units(expense_rolls: List[dict], parsed_rolls: List[dict]) -> List[Tuple[str, float]]:
    totals: Dict[str, float] = {}
    for er in expense_rolls:
        for r in er.get("rows") or []:
            u = r.get("unit") or "عام"
            totals[u] = totals.get(u, 0) + float(r.get("amount") or 0)
    for pr in parsed_rolls:
        for r in pr.get("rows") or []:
            if r.get("is_late"):
                u = r.get("unit") or "?"
                totals[u] = totals.get(u, 0) + float(r.get("rent") or 0) * 0.5
    return sorted(totals.items(), key=lambda x: -x[1])[:5]
