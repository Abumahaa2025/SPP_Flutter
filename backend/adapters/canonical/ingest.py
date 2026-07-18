"""Ingest arbitrary adapter payloads into canonical records."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from adapters.canonical.models import (
    CanonicalAsset,
    CanonicalLifeEvent,
    CanonicalMaintenance,
    CanonicalSettings,
    CanonicalUnit,
)
from adapters.normalize.dates import days_until, parse_date
from adapters.normalize.enums import (
    contract_status,
    contract_status_from_expiry,
    maintenance_status,
    payment_status,
    priority_level,
)
from adapters.normalize.money import parse_money
from adapters.normalize.text import clean_text, normalize_unit_label, stable_id


def settings_from_bundle(bundle: Dict[str, Any]) -> CanonicalSettings:
    raw = bundle.get("settings") or {}
    name = (
        clean_text(raw.get("propertyName"))
        or clean_text(raw.get("portfolioName"))
        or clean_text(raw.get("clientName"))
        or clean_text(raw.get("name"))
        or "Portfolio"
    )
    return CanonicalSettings(
        portfolio_name=name,
        city=clean_text(raw.get("city") or raw.get("propertyCity")),
        country=clean_text(raw.get("country") or raw.get("propertyCountry")),
        currency=clean_text(raw.get("currency") or raw.get("defaultCurrency") or "USD").upper()[:3]
        or "USD",
        owner_id=stable_id(clean_text(raw.get("ownerId") or raw.get("clientId") or name), prefix="own"),
        locale=clean_text(raw.get("locale") or raw.get("language") or "en")[:5] or "en",
        raw=dict(raw),
    )


def unit_from_row(row: Dict[str, Any], *, source: str = "dashboard") -> CanonicalUnit:
    label = clean_text(row.get("unit") or row.get("unitNo") or row.get("unit_name") or row.get("name"))
    if not label:
        label = clean_text(row.get("id") or "unit")
    norm = normalize_unit_label(label)
    unit_id = stable_id(norm, prefix="unit")
    tenant = clean_text(row.get("tenant") or row.get("tenantName") or row.get("tenant_name"))
    expiry = parse_date(row.get("expiryDate") or row.get("endDate") or row.get("contractEnd"))
    days_left = row.get("daysLeft")
    if days_left is not None and str(days_left).strip() != "":
        try:
            days_left_val: Optional[float] = float(days_left)
        except (TypeError, ValueError):
            days_left_val = None
    else:
        days_left_val = float(days_until(expiry)) if expiry else None

    c_status = contract_status(
        row.get("contractStatusResolved"),
        row.get("contractStatus"),
        row.get("status"),
        days_left=days_left_val,
    )
    if c_status == "active" and expiry:
        c_status = contract_status_from_expiry(expiry)

    p_status = payment_status(row.get("payStatus"), row.get("paymentStatus"), row.get("lateText"))

    return CanonicalUnit(
        unit_id=unit_id,
        label=label,
        tenant_name=tenant,
        monthly_rent=parse_money(row.get("rent") or row.get("monthlyRent") or row.get("amount")),
        contract_status="vacant" if not tenant else c_status,
        payment_status=p_status,
        expiry_date=expiry,
        days_to_expiry=int(days_left_val) if days_left_val is not None else days_until(expiry),
        contract_no=clean_text(row.get("contractNo") or row.get("contract_id")),
        source=source,
        raw=dict(row),
    )


def units_from_dashboard(bundle: Dict[str, Any]) -> List[CanonicalUnit]:
    dash = bundle.get("dashboard") or {}
    seen: set[str] = set()
    units: List[CanonicalUnit] = []

    for source_name, rows in (
        ("units", dash.get("units") or []),
        ("nearContracts", dash.get("nearContracts") or []),
        ("expiredContracts", dash.get("expiredContracts") or []),
        ("latePayments", dash.get("latePayments") or []),
    ):
        for row in rows:
            if not isinstance(row, dict):
                continue
            u = unit_from_row(row, source=source_name)
            key = u.unit_id + "|" + stable_id(u.tenant_name or "")
            if key in seen:
                continue
            seen.add(key)
            units.append(u)

    return units


def maintenance_from_bundle(bundle: Dict[str, Any]) -> List[CanonicalMaintenance]:
    out: List[CanonicalMaintenance] = []
    for item in bundle.get("maintenanceRequests") or []:
        if not isinstance(item, dict):
            continue
        unit_label = clean_text(item.get("unit") or item.get("unitNo"))
        unit_id = stable_id(normalize_unit_label(unit_label), prefix="unit") if unit_label else None
        ticket = clean_text(item.get("ticketNo") or item.get("id") or unit_label or "ticket")
        out.append(
            CanonicalMaintenance(
                ticket_id=stable_id(ticket, prefix="mnt"),
                unit_id=unit_id,
                title=clean_text(item.get("type") or item.get("title") or "Maintenance"),
                status=maintenance_status(item.get("status")),
                priority=priority_level(item.get("risk") or item.get("priority")),
                description=clean_text(item.get("description") or item.get("reason")),
                raw=dict(item),
            )
        )
    return out


def asset_from_row(row: Dict[str, Any]) -> CanonicalAsset:
    name = clean_text(row.get("name") or row.get("assetName") or row.get("id"))
    asset_id = clean_text(row.get("id")) or stable_id(name, prefix="asset")
    unit_label = clean_text(row.get("unit") or row.get("unitNo"))
    unit_id = stable_id(normalize_unit_label(unit_label), prefix="unit") if unit_label else None
    return CanonicalAsset(
        asset_id=asset_id,
        name=name or asset_id,
        asset_type=clean_text(row.get("type") or row.get("assetType") or "other").lower() or "other",
        unit_id=unit_id,
        location=clean_text(row.get("location")),
        install_date=parse_date(row.get("installDate") or row.get("purchaseDate")),
        warranty_end=parse_date(row.get("warrantyEnd")),
        lifespan_years=float(row.get("lifespanYears") or row.get("lifespan") or 0) or 0.0,
        total_cost=parse_money(row.get("totalCost") or row.get("cost")),
        fault_count=int(row.get("faultCount") or row.get("faultCountStored") or 0),
        status=clean_text(row.get("status") or "operational"),
        raw=dict(row),
    )


def assets_from_memory_bundle(bundle: Dict[str, Any]) -> List[CanonicalAsset]:
    assets = bundle.get("assets") or []
    return [asset_from_row(a) for a in assets if isinstance(a, dict) and clean_text(a.get("name") or a.get("id"))]


def life_events_from_memory_bundle(bundle: Dict[str, Any]) -> List[CanonicalLifeEvent]:
    events: List[CanonicalLifeEvent] = []
    for row in bundle.get("events") or []:
        if not isinstance(row, dict):
            continue
        asset_id = clean_text(row.get("assetId") or row.get("asset_id"))
        if not asset_id:
            continue
        events.append(
            CanonicalLifeEvent(
                event_id=stable_id(asset_id, row.get("date"), row.get("eventType"), prefix="evt"),
                asset_id=asset_id,
                event_type=clean_text(row.get("eventType") or row.get("type") or "note"),
                occurred_at=parse_date(row.get("date")) or clean_text(row.get("date")) or "",
                description=clean_text(row.get("description")),
                cost=parse_money(row.get("cost")),
                raw=dict(row),
            )
        )
    return events


# ===========================================================================
# Gap 2 — Upload analysis → canonical bridge
#
# These helpers convert real upload-analysis outputs (property_knowledge,
# tenant_cards, maintenance entries, lifecycle) into the existing
# CanonicalUnit / CanonicalAsset / CanonicalLifeEvent / CanonicalMaintenance
# models. They use the same normalize/* utilities as the existing helpers
# so unit identity is stable across GAS, demo, and upload sources.
#
# Provenance is preserved in two ways:
#   1. CanonicalUnit.source = "upload_analysis"
#   2. CanonicalUnit.raw["analysis_id"] = the import's analysis_id
#   3. CanonicalAsset.raw["analysis_id"] = the import's analysis_id
#   4. CanonicalLifeEvent.raw["analysis_id"] = the import's analysis_id
#
# No new canonical model is created. These helpers produce the SAME
# CanonicalPortfolio that build_portfolio() produces from GAS bundles -
# just from a different source.
# ===========================================================================


def settings_from_upload_analysis(
    metrics: Dict[str, Any],
    property_knowledge: Dict[str, Any],
    analysis_id: str = "",
) -> CanonicalSettings:
    """Build CanonicalSettings from upload metrics + property_knowledge.meta.

    The upload pipeline doesn't have a 'settings' bundle like GAS does, so
    we synthesize one from the import metadata. Currency defaults to SAR
    (the project's primary market); locale defaults to Arabic.
    """
    meta = property_knowledge.get("meta") or {}
    portfolio_name = (
        clean_text(meta.get("portfolio_name"))
        or clean_text(metrics.get("portfolio_name"))
        or "Imported Portfolio"
    )
    currency = (
        clean_text(meta.get("currency"))
        or clean_text(metrics.get("currency"))
        or "SAR"
    ).upper()[:3] or "SAR"
    return CanonicalSettings(
        portfolio_name=portfolio_name,
        city=clean_text(meta.get("city")) or "",
        country=clean_text(meta.get("country")) or "",
        currency=currency,
        owner_id="owner_imported",
        locale=clean_text(meta.get("locale") or meta.get("lang") or "ar")[:5] or "ar",
        raw={
            "source": "upload_analysis",
            "analysis_id": analysis_id,
            "period_from": meta.get("period_from"),
            "period_to": meta.get("period_to"),
            "month_count": meta.get("month_count"),
            "files_count": meta.get("files_count"),
            "metrics": dict(metrics),
        },
    )


def unit_from_tenant_card(
    card: Dict[str, Any],
    analysis_id: str = "",
) -> CanonicalUnit:
    """Convert a Property Knowledge tenant card to a CanonicalUnit.

    Tenant cards are the canonical source of truth from the import pipeline -
    each card holds the full payment ledger for one tenant on one unit.
    We map the card to a CanonicalUnit using the existing unit_from_row()
    helper (which handles unit/tenant/rent/expiry normalization), then
    enrich with card-specific fields (confirmed_arrears → payment_status,
    contract → contract_no) and provenance.
    """
    # Reuse the existing normalizer so unit identity matches GAS path.
    unit = unit_from_row(card, source="upload_analysis")
    # Enrich with tenant-card-specific signals.
    try:
        arrears = float(card.get("confirmed_arrears") or 0)
    except (TypeError, ValueError):
        arrears = 0.0
    if arrears > 0:
        unit.payment_status = "late"
    contract_no = clean_text(card.get("contract"))
    if contract_no:
        unit.contract_no = contract_no
    # Preserve provenance for downstream debugging + memory linking.
    unit.raw = {
        "analysis_id": analysis_id,
        "source": "property_knowledge.tenant_cards",
        "tenant_card": dict(card),
    }
    return unit


def units_from_property_knowledge(
    property_knowledge: Dict[str, Any],
    analysis_id: str = "",
) -> List[CanonicalUnit]:
    """Build CanonicalUnit[] from property_knowledge.tenants (tenant cards)."""
    cards = property_knowledge.get("tenants") or []
    units: List[CanonicalUnit] = []
    seen: set[str] = set()
    for card in cards:
        if not isinstance(card, dict):
            continue
        unit = unit_from_tenant_card(card, analysis_id=analysis_id)
        # Dedupe by unit_id + tenant_name (same as units_from_dashboard).
        key = unit.unit_id + "|" + stable_id(unit.tenant_name or "")
        if key in seen:
            continue
        seen.add(key)
        units.append(unit)
    return units


def assets_from_maintenance_entries(
    entries: List[Dict[str, Any]],
    analysis_id: str = "",
) -> List[CanonicalAsset]:
    """Build CanonicalAsset[] by grouping maintenance entries by (unit, description).

    Each unique (unit, description) pair becomes one CanonicalAsset with:
      - fault_count = number of entries in the group
      - total_cost = sum of amounts
      - asset_type = "other" (uploads don't carry asset type info)
      - warranty_end = first non-empty warranty_end in the group (rare)
      - status = "operational" if all entries are closed, else "needs_attention"

    This grouping is what enables the repeat_repair Executive Intelligence
    insight: 3+ entries on the same (unit, description) → fault_count >= 3.
    """
    groups: Dict[str, Dict[str, Any]] = {}
    order: List[str] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        unit_label = clean_text(entry.get("unit"))
        if not unit_label:
            continue
        unit_id = stable_id(normalize_unit_label(unit_label), prefix="unit")
        description = clean_text(entry.get("description") or entry.get("category") or "maintenance")
        # Stable group key: unit_id + normalized description.
        desc_key = stable_id(description)
        group_key = f"{unit_id}|{desc_key}"
        if group_key not in groups:
            groups[group_key] = {
                "unit_id": unit_id,
                "unit_label": unit_label,
                "name": description,
                "entries": [],
                "warranty_end": None,
            }
            order.append(group_key)
        groups[group_key]["entries"].append(entry)
        # Capture warranty_end if any entry has it (rare in uploads).
        warranty = entry.get("warranty_end") or entry.get("warrantyEnd")
        if warranty and not groups[group_key]["warranty_end"]:
            groups[group_key]["warranty_end"] = parse_date(warranty)

    assets: List[CanonicalAsset] = []
    for group_key in order:
        g = groups[group_key]
        entries = g["entries"]
        total_cost = sum(parse_money(e.get("amount") or e.get("cost")) for e in entries)
        # If all entries are closed, asset is operational; otherwise needs attention.
        all_closed = all(
            str(e.get("status") or "").lower() in ("closed", "done", "مكتمل", "completed")
            for e in entries
        )
        asset_id = stable_id(g["unit_id"] + "_" + g["name"], prefix="asset")
        assets.append(
            CanonicalAsset(
                asset_id=asset_id,
                name=g["name"],
                asset_type="other",
                unit_id=g["unit_id"],
                location=g["unit_label"],
                install_date=None,
                warranty_end=g["warranty_end"],
                lifespan_years=0.0,
                # NOTE: total_cost is set to 0 here intentionally.
                # build_memory_graph() computes AssetProfile.total_cost as
                # asset.total_cost + sum(life_event.cost). Since we create
                # one life event per maintenance entry with cost=amount,
                # setting asset.total_cost=0 avoids double-counting. The
                # full cost is still tracked in raw["entries"] for provenance.
                total_cost=0.0,
                fault_count=len(entries),
                status="operational" if all_closed else "needs_attention",
                raw={
                    "analysis_id": analysis_id,
                    "source": "property_knowledge.maintenance.entries",
                    "unit_label": g["unit_label"],
                    "entries": [dict(e) for e in entries],
                    "entries_total_cost": total_cost,  # preserve for consumers
                },
            )
        )
    return assets


def life_events_from_maintenance_entries(
    entries: List[Dict[str, Any]],
    assets: List[CanonicalAsset],
    analysis_id: str = "",
) -> List[CanonicalLifeEvent]:
    """Build CanonicalLifeEvent[] from maintenance entries.

    Each maintenance entry becomes one life event of type 'maintenance',
    linked to the matching CanonicalAsset (grouped by unit+description).
    Also adds lifecycle.tenant_changes as 'contract' events.
    """
    # Build a lookup: (unit_id, description) → asset_id
    asset_lookup: Dict[str, str] = {}
    for asset in assets:
        desc_key = stable_id(asset.name)
        asset_lookup[f"{asset.unit_id}|{desc_key}"] = asset.asset_id

    events: List[CanonicalLifeEvent] = []
    for i, entry in enumerate(entries):
        if not isinstance(entry, dict):
            continue
        unit_label = clean_text(entry.get("unit"))
        if not unit_label:
            continue
        unit_id = stable_id(normalize_unit_label(unit_label), prefix="unit")
        description = clean_text(entry.get("description") or entry.get("category") or "maintenance")
        desc_key = stable_id(description)
        asset_id = asset_lookup.get(f"{unit_id}|{desc_key}", f"asset_{unit_id}_{desc_key}")
        # Best-effort occurred_at: try file_name's month/year, else empty.
        occurred_at = ""
        file_name = entry.get("file_name") or ""
        if file_name:
            # Try to extract a date from the file name (e.g. "كشف شهر 1 2026.csv")
            parsed = parse_date(file_name)
            occurred_at = parsed or file_name
        event_id = stable_id(asset_id, str(i), entry.get("amount"), prefix="evt")
        events.append(
            CanonicalLifeEvent(
                event_id=event_id,
                asset_id=asset_id,
                event_type="maintenance",
                occurred_at=occurred_at,
                description=description,
                cost=parse_money(entry.get("amount") or entry.get("cost")),
                unit_id=unit_id,
                raw={
                    "analysis_id": analysis_id,
                    "source": "property_knowledge.maintenance.entries",
                    "entry": dict(entry),
                },
            )
        )
    return events


def life_events_from_lifecycle(
    lifecycle: Dict[str, Any],
    analysis_id: str = "",
) -> List[CanonicalLifeEvent]:
    """Build CanonicalLifeEvent[] from lifecycle.tenant_changes.

    Each tenant change (departure / arrival / replacement) becomes a life
    event of type 'contract'. These are NOT linked to a specific asset -
    they're unit-level events. asset_id is set to a synthetic per-unit
    value so they group correctly in the memory graph.
    """
    events: List[CanonicalLifeEvent] = []
    changes = lifecycle.get("tenant_changes") or []
    for i, change in enumerate(changes):
        if not isinstance(change, dict):
            continue
        unit_label = clean_text(change.get("unit"))
        if not unit_label:
            continue
        unit_id = stable_id(normalize_unit_label(unit_label), prefix="unit")
        change_type = change.get("type") or "change"
        from_t = change.get("from_tenant") or "—"
        to_t = change.get("to_tenant") or "—"
        description = f"Tenant {change_type}: {from_t} → {to_t}"
        # Synthetic asset_id per unit so events group by unit in memory graph.
        asset_id = f"unit_event_{unit_id}"
        month = change.get("month")
        year = change.get("year")
        occurred_at = ""
        if year and month:
            try:
                occurred_at = f"{int(year):04d}-{int(month):02d}"
            except (TypeError, ValueError):
                occurred_at = ""
        event_id = stable_id(asset_id, str(i), change_type, prefix="evt")
        events.append(
            CanonicalLifeEvent(
                event_id=event_id,
                asset_id=asset_id,
                event_type="contract",
                occurred_at=occurred_at,
                description=description,
                cost=0.0,
                unit_id=unit_id,
                raw={
                    "analysis_id": analysis_id,
                    "source": "property_knowledge.lifecycle.tenant_changes",
                    "change": dict(change),
                },
            )
        )
    return events


def maintenance_from_property_knowledge(
    property_knowledge: Dict[str, Any],
    analysis_id: str = "",
) -> List[CanonicalMaintenance]:
    """Build CanonicalMaintenance[] from property_knowledge.maintenance.entries.

    Only entries that are NOT closed become CanonicalMaintenance records
    (closed entries are still in life_events for history, but don't appear
    as open work items).
    """
    entries = (property_knowledge.get("maintenance") or {}).get("entries") or []
    out: List[CanonicalMaintenance] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        status_raw = str(entry.get("status") or "").lower()
        if status_raw in ("closed", "done", "مكتمل", "completed"):
            continue  # closed items don't appear as open maintenance
        unit_label = clean_text(entry.get("unit"))
        unit_id = stable_id(normalize_unit_label(unit_label), prefix="unit") if unit_label else None
        ticket = clean_text(entry.get("request_id") or entry.get("ticketNo") or entry.get("id"))
        if not ticket:
            ticket = stable_id(unit_label or "", entry.get("description") or "", prefix="mnt")
        out.append(
            CanonicalMaintenance(
                ticket_id=stable_id(ticket, prefix="mnt"),
                unit_id=unit_id,
                title=clean_text(entry.get("description") or entry.get("category") or "Maintenance"),
                status="open",
                priority=priority_level(entry.get("priority") or entry.get("risk") or "medium"),
                description=clean_text(entry.get("description")),
                raw={
                    "analysis_id": analysis_id,
                    "source": "property_knowledge.maintenance.entries",
                    "entry": dict(entry),
                },
            )
        )
    return out


def warnings_from_property_knowledge(
    property_knowledge: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Surface unresolved records as canonical_warnings[].

    Aggregates:
      - property_knowledge.quality.parse_errors[]
      - property_knowledge.quality.files_without_content[]
      - property_knowledge.quality.warnings[]
      - property_knowledge.contracts.missing_phone[]
      - property_knowledge.contracts.missing_contract[]

    Each warning is a dict with {code, ...detail} so the caller can render
    or filter by category.
    """
    out: List[Dict[str, Any]] = []
    quality = property_knowledge.get("quality") or {}
    for pe in quality.get("parse_errors") or []:
        if not isinstance(pe, dict):
            continue
        out.append({
            "code": "parse_error",
            "file": pe.get("file_name") or pe.get("file"),
            "detail": pe.get("error") or "parse failed",
        })
    for fw in quality.get("files_without_content") or []:
        if not isinstance(fw, dict):
            continue
        out.append({
            "code": "file_without_content",
            "file": fw.get("file_name") or fw.get("file"),
            "detail": fw.get("reason") or "file content not read",
        })
    for w in quality.get("warnings") or []:
        out.append({
            "code": "warning",
            "detail": str(w),
        })
    contracts = property_knowledge.get("contracts") or {}
    for mp in contracts.get("missing_phone") or []:
        if not isinstance(mp, dict):
            continue
        out.append({
            "code": "missing_phone",
            "unit": mp.get("unit"),
            "tenant": mp.get("tenant"),
            "detail": f"missing phone for {mp.get('tenant', '—')} on unit {mp.get('unit', '—')}",
        })
    for mc in contracts.get("missing_contract") or []:
        if not isinstance(mc, dict):
            continue
        out.append({
            "code": "missing_contract",
            "unit": mc.get("unit"),
            "tenant": mc.get("tenant"),
            "detail": f"missing contract number for {mc.get('tenant', '—')} on unit {mc.get('unit', '—')}",
        })
    return out
