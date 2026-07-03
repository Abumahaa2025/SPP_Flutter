"""Map SPP_Official getAppData → Emergent ContractT[]."""

from __future__ import annotations

from typing import Any, Dict, List

from adapters.mappers.common import contract_id, tenant_id, unit_property_id


def _status(unit: Dict[str, Any]) -> str:
    resolved = str(unit.get("contractStatusResolved") or unit.get("contractStatus") or "")
    days_left = unit.get("daysLeft")

    if "منتهي" in resolved:
        return "expiring"
    if resolved == "قريب الانتهاء":
        return "expiring"
    if isinstance(days_left, (int, float)) and 0 <= days_left <= 45:
        return "expiring"
    if "تجديد" in resolved or "renewed" in resolved.lower():
        return "renewed"
    return "active"


def _contract_rows(app_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    dashboard = app_data.get("dashboard") or {}
    rows: List[Dict[str, Any]] = []
    seen = set()

    for source in (
        dashboard.get("units") or [],
        dashboard.get("nearContracts") or [],
        dashboard.get("expiredContracts") or [],
        dashboard.get("latePayments") or [],
    ):
        for unit in source:
            key = str(unit.get("unit") or "") + "|" + str(unit.get("tenant") or "")
            if key in seen:
                continue
            seen.add(key)
            if str(unit.get("tenant") or "").strip():
                rows.append(unit)

    return rows


def map_contracts_from_app_data(app_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    contracts: List[Dict[str, Any]] = []

    for index, unit in enumerate(_contract_rows(app_data)):
        tenant = str(unit.get("tenant") or "").strip()
        unit_name = str(unit.get("unit") or "")
        contracts.append(
            {
                "id": contract_id(str(unit.get("contractNo") or ""), index),
                "tenant_id": tenant_id(tenant, unit_name),
                "property_id": unit_property_id(unit_name),
                "start": "2023-01-01",
                "end": str(unit.get("expiryDate") or "2028-01-01"),
                "monthly_rent": float(unit.get("rent") or 0),
                "status": _status(unit),
            }
        )

    return contracts
