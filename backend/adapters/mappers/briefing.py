"""Build Emergent Briefing from live mapped domain data."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List


def build_briefing(
    app_data: Dict[str, Any],
    properties: List[dict],
    tenants: List[dict],
    contracts: List[dict],
    decisions: List[dict],
    sensor_alerts: List[dict] | None = None,
) -> Dict[str, Any]:
    sensor_alerts = sensor_alerts or []
    settings = app_data.get("settings") or {}

    portfolio_value = sum(p.get("monthly_revenue", 0) for p in properties) * 12
    avg_health = round(sum(p.get("health_score", 0) for p in properties) / max(len(properties), 1))
    occupancy = round(100 * sum(p.get("occupancy", 0) for p in properties) / max(len(properties), 1))

    critical = [d for d in decisions if d.get("priority") in ("critical", "high")]
    attention_props = [p for p in properties if p.get("health_score", 100) < 80]
    expiring = [c for c in contracts if c.get("status") == "expiring"]

    hour = datetime.now(timezone.utc).hour
    if hour < 12:
        salutation = "Good morning"
    elif hour < 18:
        salutation = "Good afternoon"
    else:
        salutation = "Good evening"

    if not critical:
        headline = "All properties stable. Nothing urgent today."
    elif len(critical) == 1:
        headline = "1 action needs your attention."
    else:
        headline = f"{len(critical)} actions need your attention."

    lines: List[str] = []
    if critical:
        top = critical[0]
        impact = (top.get("impact") or "").rstrip(".")
        title = (top.get("title") or "").rstrip(".")
        if impact:
            lines.append(f"I reviewed your portfolio overnight. {title} — {impact}.")
        else:
            lines.append(f"I reviewed your portfolio overnight. {title}.")
    else:
        lines.append("I reviewed your portfolio overnight. Everything is stable.")

    if attention_props:
        names = ", ".join(p["name"] for p in attention_props[:2])
        lines.append(f"{names} are trending below target — worth a decision this week.")
    if expiring:
        lines.append(
            f"{len(expiring)} contract{'s' if len(expiring) > 1 else ''} enter the renewal window in the next 34 days."
        )
    lines.append(
        f"Portfolio health is {avg_health}. Occupancy sits at {occupancy}% across {len(properties)} properties."
    )

    owner_name = (settings.get("clientName") or "Owner").split()[0]

    return {
        "salutation": salutation,
        "owner_name": owner_name,
        "headline": headline,
        "narrative": lines,
        "portfolio_annual_revenue": portfolio_value,
        "avg_health": avg_health,
        "occupancy": occupancy,
        "properties_count": len(properties),
        "tenants_count": len(tenants),
        "expiring_contracts": len(expiring),
        "decisions": decisions[:4],
        "sensor_alerts": sensor_alerts[:3],
    }
