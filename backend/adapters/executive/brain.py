"""Executive Brain V2 orchestrator."""

from __future__ import annotations

from typing import Any, Dict, List

from adapters.executive.agenda import build_executive_agenda
from adapters.executive.daily_brief import build_daily_executive_brief
from adapters.executive.opportunities import discover_opportunities
from adapters.executive.ranking import agenda_caps, build_ranked_items


def build_executive_brain(
    settings: Dict[str, Any],
    properties: List[dict],
    tenants: List[dict],
    contracts: List[dict],
    decisions: List[dict],
    reports: List[dict] | None = None,
) -> Dict[str, Any]:
    """Full executive package: brief + agenda + ranked queue + opportunities."""
    reports = reports or []
    unit_count = len(properties)
    tenant_count = len(tenants)
    n = max(unit_count, 1)
    annual_revenue = sum(float(p.get("monthly_revenue") or 0) for p in properties) * 12
    avg_health = round(sum(p.get("health_score", 0) for p in properties) / n)
    occupancy_pct = round(100 * sum(p.get("occupancy", 0) for p in properties) / n)
    expiring = sum(1 for c in contracts if c.get("status") == "expiring")

    ranked = build_ranked_items(properties, tenants, contracts, decisions)
    opportunities = discover_opportunities(properties, tenants, contracts, decisions)
    agenda = build_executive_agenda(ranked, opportunities, unit_count)
    daily_brief = build_daily_executive_brief(
        settings, agenda, ranked, opportunities, unit_count, tenant_count
    )

    return {
        "version": "executive-v2",
        "portfolio": {
            "units": unit_count,
            "tenants": tenant_count,
            "contracts_tracked": len(contracts),
            "open_decisions": len(decisions),
            "avg_health": avg_health,
            "occupancy_pct": occupancy_pct,
            "annual_revenue_aed": round(annual_revenue),
            "expiring_contracts": expiring,
        },
        "daily_brief": daily_brief,
        "agenda": agenda,
        "ranked_decisions": ranked[:50],
        "opportunities": opportunities,
        "meta": {
            "ranking_factors": [
                "urgency",
                "rent_value",
                "contract_status",
                "financial_impact",
                "property_health",
                "priority",
            ],
            "agenda_caps": agenda_caps(unit_count),
        },
    }
