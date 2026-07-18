"""Canonical portfolio pipeline — single entry for server and executive brain."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from adapters.canonical.emit import emit_contracts, emit_decisions, emit_properties, emit_tenants
from adapters.canonical.models import CanonicalPortfolio
from adapters.canonical.portfolio import build_portfolio, build_portfolio_from_upload_analysis
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


# ===========================================================================
# Gap 2 — Upload analysis → canonical portfolio + memory graph + insights
#
# Single entry point that:
#   1. Builds a CanonicalPortfolio from upload-analysis outputs
#      (property_knowledge + metrics + analysis_id).
#   2. Runs build_memory_graph() on the portfolio.
#   3. Runs generate_insights() on the portfolio + memory graph.
#   4. Surfaces canonical_warnings (unresolved records from the import).
#
# Returns a dict with:
#   canonical_portfolio_summary — shape stable for API response + ai_state
#   property_memory             — same shape as /api/portfolio-memory response
#   executive_intelligence      — same shape as /api/intelligence response
#   canonical_warnings          — list of {code, ...detail} dicts
#
# This is purely additive - existing portfolio_from_bundles() and
# legacy_api_payload() are unchanged.
# ===========================================================================


def upload_analysis_to_canonical(
    *,
    property_knowledge: Dict[str, Any],
    metrics: Optional[Dict[str, Any]] = None,
    analysis_id: str = "",
) -> Dict[str, Any]:
    """Convert upload-analysis outputs into canonical portfolio + memory + insights.

    Args:
        property_knowledge: the full PK dict from analyze_upload_portfolio().
        metrics: the upload metrics dict (used for settings synthesis).
        analysis_id: the import's analysis_id (preserved in every entity's raw).

    Returns:
        Dict with keys:
            canonical_portfolio_summary: {version, source, analysis_id,
                units_count, assets_count, life_events_count,
                maintenance_count, ingest_sources, settings}
            property_memory: {summary, assets[]} - same shape as
                /api/portfolio-memory response
            executive_intelligence: {insights[], count} - same shape as
                /api/intelligence response
            canonical_warnings: list of {code, ...detail} dicts

    Degrades gracefully: if any step fails, returns empty defaults so the
    upload analysis response is never broken by a canonical bridge error.
    """
    from adapters.canonical.ingest import warnings_from_property_knowledge

    # Default empty result - used if any step fails.
    empty_result: Dict[str, Any] = {
        "canonical_portfolio_summary": {
            "version": "canonical-v1",
            "source": "upload_analysis",
            "analysis_id": analysis_id,
            "units_count": 0,
            "assets_count": 0,
            "life_events_count": 0,
            "maintenance_count": 0,
            "ingest_sources": [],
            "settings": {},
            "error": None,
        },
        "property_memory": {"summary": {}, "assets": []},
        "executive_intelligence": {"insights": [], "count": 0},
        "canonical_warnings": [],
    }

    try:
        portfolio = build_portfolio_from_upload_analysis(
            property_knowledge=property_knowledge,
            metrics=metrics,
            analysis_id=analysis_id,
        )
    except Exception as exc:
        empty_result["canonical_portfolio_summary"]["error"] = f"build_portfolio_failed: {exc}"
        return empty_result

    try:
        memory_graph = build_memory_graph(portfolio)
    except Exception as exc:
        empty_result["canonical_portfolio_summary"]["error"] = f"memory_graph_failed: {exc}"
        # Still return the portfolio summary even if memory graph fails.
        empty_result["canonical_portfolio_summary"].update({
            "units_count": len(portfolio.units),
            "assets_count": len(portfolio.assets),
            "life_events_count": len(portfolio.life_events),
            "maintenance_count": len(portfolio.maintenance),
            "ingest_sources": portfolio.ingest_sources,
            "settings": {
                "portfolio_name": portfolio.settings.portfolio_name,
                "currency": portfolio.settings.currency,
                "locale": portfolio.settings.locale,
                "owner_id": portfolio.settings.owner_id,
            },
        })
        return empty_result

    try:
        insights = generate_insights(portfolio, memory_graph)
    except Exception:
        # Insights failing is non-fatal - return empty insights but keep
        # the portfolio + memory.
        insights = []

    try:
        warnings = warnings_from_property_knowledge(property_knowledge)
    except Exception:
        warnings = []

    return {
        "canonical_portfolio_summary": {
            "version": "canonical-v1",
            "source": "upload_analysis",
            "analysis_id": analysis_id,
            "units_count": len(portfolio.units),
            "assets_count": len(portfolio.assets),
            "life_events_count": len(portfolio.life_events),
            "maintenance_count": len(portfolio.maintenance),
            "ingest_sources": portfolio.ingest_sources,
            "settings": {
                "portfolio_name": portfolio.settings.portfolio_name,
                "currency": portfolio.settings.currency,
                "locale": portfolio.settings.locale,
                "owner_id": portfolio.settings.owner_id,
                "city": portfolio.settings.city,
                "country": portfolio.settings.country,
            },
            "error": None,
        },
        "property_memory": memory_graph_to_dict(memory_graph),
        "executive_intelligence": {
            "insights": insights_to_api(insights),
            "count": len(insights),
        },
        "canonical_warnings": warnings,
    }
