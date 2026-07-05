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
