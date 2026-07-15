"""Build Emergent Briefing from live Sheets-mapped domain data only."""

from __future__ import annotations

from typing import Any, Dict, List

from adapters.mappers.brain_copy import (
    contract_expiry_phrase,
    contract_renewal_action,
    contract_sort_key,
    days_until,
    decision_action_ar,
    decision_detail_ar,
    decision_title_ar,
    fmt_money_ar,
    polish_decisions,
    salutation_ar,
    sanitize_brain_text,
)

_PRIORITY = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def _owner_first_name(settings: Dict[str, Any]) -> str:
    for key in ("clientName", "propertyName"):
        raw = str(settings.get(key) or "").strip()
        if raw:
            return raw.split()[0]
    return ""


def _sorted_decisions(decisions: List[dict]) -> List[dict]:
    return sorted(decisions, key=lambda d: _PRIORITY.get(d.get("priority", "low"), 9))


def build_briefing(
    settings: Dict[str, Any],
    properties: List[dict],
    tenants: List[dict],
    contracts: List[dict],
    decisions: List[dict],
    reports: List[dict],
    sensor_alerts: List[dict] | None = None,
) -> Dict[str, Any]:
    sensor_alerts = sensor_alerts or []

    portfolio_value = sum(float(p.get("monthly_revenue", 0)) for p in properties) * 12
    avg_health = round(sum(p.get("health_score", 0) for p in properties) / max(len(properties), 1))
    occupancy = round(100 * sum(p.get("occupancy", 0) for p in properties) / max(len(properties), 1))

    ranked = _sorted_decisions(decisions)
    critical = [d for d in ranked if d.get("priority") in ("critical", "high")]
    attention_props = sorted(
        [p for p in properties if p.get("health_score", 100) < 80],
        key=lambda p: p.get("health_score", 0),
    )
    expiring = [c for c in contracts if c.get("status") == "expiring"]
    vacant = [p for p in properties if p.get("occupancy", 0) < 0.5]
    financial = [d for d in ranked if d.get("kind") == "financial"]
    overdue = [c for c in expiring if (days_until(c.get("end", "")) or 1) < 0]

    if critical:
        headline = f"ابدأ بمعالجة {len(critical)} قرارات عاجلة اليوم."
    elif overdue:
        headline = f"عالج {len(overdue)} عقداً متأخراً عن التجديد فوراً."
    elif expiring:
        headline = f"راجع {len(expiring)} عقداً في نافذة التجديد."
    elif attention_props:
        headline = f"عالج {len(attention_props)} وحدة ضعيفة الصحة أولاً."
    elif vacant:
        headline = f"سوّق {len(vacant)} وحدة شاغرة الآن."
    else:
        headline = f"لا قرارات عاجلة — راقب الإشغال عند {occupancy}%."

    lines: List[str] = []

    if ranked:
        top = ranked[0]
        lines.append(
            f"افعل الآن: {decision_title_ar(top)} — {decision_detail_ar(top, contracts).rstrip('.')}."
        )

    if len(critical) > 1:
        titles = " · ".join(decision_title_ar(d) for d in critical[1:3])
        if titles:
            lines.append(f"بعدها: {titles}.")

    if financial:
        late = financial[0]
        lines.append(
            f"التحصيل: {decision_title_ar(late)} — {decision_detail_ar(late, contracts).rstrip('.')}."
        )

    if attention_props:
        names = "، ".join(p["name"] for p in attention_props[:3])
        lines.append(f"راجع صحة: {names} — خطّط لتدخل خلال الأسبوع.")

    if expiring:
        nearest = min(expiring, key=lambda c: contract_sort_key(c.get("end", "")))
        end_days = days_until(nearest.get("end", ""))
        guidance = contract_expiry_phrase(end_days)
        action = contract_renewal_action(end_days)
        lines.append(f"التجديدات ({len(expiring)}): {guidance} — {action}.")

    if vacant:
        names = "، ".join(p.get("name", "") for p in vacant[:3])
        lines.append(f"الشواغر: أطلق تسويق {names}.")

    if reports:
        r = reports[0]
        highlight = sanitize_brain_text(str(r.get("highlight") or "")).rstrip(".")
        if highlight:
            lines.append(f"راجع التقرير: {sanitize_brain_text(str(r.get('title', '')))} — {highlight}.")

    lines.append(
        f"لمحة: صحة {avg_health} · إشغال {occupancy}% · "
        f"إيراد سنوي {fmt_money_ar(portfolio_value)} ريال · {len(tenants)} مستأجر."
    )

    # Executive voice stays short (test contract + UI): 2–6 lines, always keep the snapshot last.
    if len(lines) > 6:
        snap = lines[-1]
        lines = lines[:-1][:5] + [snap]

    return {
        "salutation": salutation_ar(),
        "owner_name": _owner_first_name(settings),
        "headline": headline,
        "narrative": lines,
        "portfolio_annual_revenue": portfolio_value,
        "avg_health": avg_health,
        "occupancy": occupancy,
        "properties_count": len(properties),
        "tenants_count": len(tenants),
        "expiring_contracts": len(expiring),
        "decisions": polish_decisions(ranked, contracts),
        "sensor_alerts": sensor_alerts[:3],
    }
