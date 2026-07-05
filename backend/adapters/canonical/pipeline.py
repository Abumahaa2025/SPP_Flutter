"""Canonical portfolio pipeline — single entry for server and executive brain."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from adapters.canonical.emit import emit_contracts, emit_decisions, emit_properties, emit_tenants
from adapters.canonical.models import CanonicalPortfolio
from adapters.canonical.portfolio import build_portfolio
from adapters.executive_intelligence.engine import ExecutiveInsight, generate_insights, insights_to_decisions
from adapters.portfolio_memory.graph import MemoryGraph, build_memory_graph


def portfolio_from_bundles(
    *,
    dashboard: Optional[Dict[str, Any]] = None,
    decisions: Optional[Dict[str, Any]] = None,
    memory: Optional[Dict[str, Any]] = None,
) -> CanonicalPortfolio:
    return build_portfolio(
        dashboard_bundle=dashboard,
        decisions_bundle=decisions,
        memory_bundle=memory,
    )


def legacy_api_payload(
    portfolio: CanonicalPortfolio,
    *,
    base_health: int = 75,
    merge_intelligence: bool = True,
) -> Dict[str, Any]:
    """Emit backward-compatible API dicts + optional intelligence-enriched decisions."""
    memory_graph = build_memory_graph(portfolio)
    decisions = emit_decisions(portfolio)
    if merge_intelligence:
        insights = generate_insights(portfolio, memory_graph)
        intel_decisions = insights_to_decisions(insights)
        seen = {d["id"] for d in decisions}
        for d in intel_decisions:
            if d["id"] not in seen:
                decisions.append(d)
                seen.add(d["id"])

    contracts = emit_contracts(portfolio)
    from adapters.mappers.contracts import reconcile_contracts

    props = emit_properties(portfolio, base_health=base_health)
    tenants = emit_tenants(portfolio)
    contracts = reconcile_contracts(contracts, decisions, tenants, props)

    return {
        "portfolio": portfolio,
        "memory": memory_graph,
        "properties": props,
        "tenants": tenants,
        "contracts": contracts,
        "decisions": decisions,
    }


def memory_graph_to_dict(graph: MemoryGraph) -> Dict[str, Any]:
    return {
        "summary": graph.summary,
        "assets": [
            {
                "asset_id": p.asset.asset_id,
                "name": p.asset.name,
                "type": p.asset.asset_type,
                "unit_id": p.linked_unit_id,
                "risk": p.risk,
                "fault_count": p.fault_count,
                "total_cost": p.total_cost,
                "life_pct": p.life_pct,
                "warranty_days": p.warranty_days,
                "age_years": p.age_years,
            }
            for p in graph.profiles
        ],
    }


def insights_to_api(insights: List[ExecutiveInsight]) -> List[Dict[str, Any]]:
    return [
        {
            "id": i.insight_id,
            "scenario": i.scenario,
            "headline": i.headline,
            "why": i.why,
            "action": i.action,
            "impact": i.impact,
            "likely_outcome": i.likely_outcome,
            "confidence": i.confidence,
            "priority": i.priority,
            "route": i.route,
            "unit_id": i.unit_id,
            "property_id": i.property_id,
        }
        for i in insights
    ]
