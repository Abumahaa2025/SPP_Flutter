"""SPP Backend — AI Operating System for Real Estate.

Modular AI layer (currently GPT-5.2 via Emergent Universal Key) powering:
- AI Employee daily briefing
- AI Decisions
- Property Health
- Predictive Maintenance
- Unified Brain chat
"""

from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
import time
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

from adapters.live_data import domain_source, get_gas_client, resolve_domain, beta_mode_enabled
from adapters.executive.brain import build_executive_brain
from adapters.canonical.pipeline import (
    insights_to_api,
    legacy_api_payload,
    memory_graph_to_dict,
    portfolio_from_bundles,
)
from adapters.executive_intelligence.engine import generate_insights
from adapters.mappers.briefing import build_briefing
from adapters.mappers.verdicts import build_verdicts
from adapters.mappers.contracts import map_contracts_from_app_data, reconcile_contracts
from adapters.mappers.decisions import map_decisions_from_app_data
from adapters.mappers.notifications import map_notifications_from_app_data
from adapters.mappers.properties import map_properties_from_app_data
from adapters.mappers.reports import map_reports_from_app_data
from adapters.mappers.tenants import map_tenants_from_app_data
from beta_seed import beta_dataset, verify_beta_login, BETA_ACCOUNTS
from adapters.upload_analysis import analyze_upload_portfolio
from adapters.gas_import_bridge import (
    analyze_upload_with_gas_fallback,
    apply_gas_import,
    create_gas_owner_pdf,
    gas_import_available,
)

# In-memory portfolio for beta builds when Mongo is unavailable
_memory_db: Dict[str, List[dict]] = {}

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------------------------------------------------------------------------
# Mongo (optional — required only when SPP_*_SOURCE=mongo without GAS)
# ---------------------------------------------------------------------------
_mongo_client: Optional[AsyncIOMotorClient] = None
_mongo_available = False
_MONGO_TIMEOUT_MS = 3000


def _get_db():
    global _mongo_client
    name = os.environ.get("DB_NAME", "spp")
    if _mongo_client is None:
        url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        _mongo_client = AsyncIOMotorClient(
            url,
            serverSelectionTimeoutMS=_MONGO_TIMEOUT_MS,
            connectTimeoutMS=_MONGO_TIMEOUT_MS,
        )
    return _mongo_client[name]


async def _mongo_ping() -> bool:
    try:
        await _get_db().command("ping")
        return True
    except Exception:
        return False


def _gas_live_mode() -> bool:
    if beta_mode_enabled():
        return False
    gas = get_gas_client()
    if not gas.configured:
        return False
    if os.environ.get("SPP_DATA_SOURCE", "mongo").lower() in ("gas", "hybrid"):
        return True
    for domain in ("PROPERTIES", "TENANTS", "CONTRACTS", "DECISIONS", "REPORTS", "ALERTS"):
        if domain_source(domain) in ("gas", "hybrid"):
            return True
    return False

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="SPP — Smart Property Platform")
api_router = APIRouter(prefix="/api")

# ---------------------------------------------------------------------------
# AI Layer (swappable). Currently OpenAI GPT-5.2 via Emergent LLM key.
# ---------------------------------------------------------------------------
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
AI_PROVIDER = "openai"
AI_MODEL = "gpt-5.2"

SPP_SYSTEM_PROMPT = (
    "You are the AI Employee inside SPP (Smart Property Platform), an AI Operating "
    "System for real estate. You think like a seasoned property advisor. "
    "Your voice is calm, confident, and premium — think Superhuman meets Linear. "
    "Never present raw data — always answer 'what should the owner do next'. "
    "Prefer short, elegant sentences. No emojis. No filler."
)


def get_llm_chat(session_id: str, system_message: str = SPP_SYSTEM_PROMPT):
    """Factory so we can later swap provider/model without touching callers."""
    from emergentintegrations.llm.chat import LlmChat  # local import: keeps startup fast
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model(AI_PROVIDER, AI_MODEL)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class Property(BaseModel):
    id: str
    name: str
    address: str
    city: str
    kind: str  # villa | apartment | penthouse | office
    units: int
    occupancy: float  # 0..1
    monthly_revenue: float
    health_score: int  # 0..100
    hero_image: str
    tenant_ids: List[str] = []
    owner_id: str


class Owner(BaseModel):
    id: str
    name: str
    portfolio_value: float
    properties: int


class Tenant(BaseModel):
    id: str
    name: str
    property_id: str
    unit: str
    since: str
    rent: float
    reliability: int  # 0..100


class Contract(BaseModel):
    id: str
    tenant_id: str
    property_id: str
    start: str
    end: str
    monthly_rent: float
    status: str  # active | expiring | renewed


class Decision(BaseModel):
    id: str
    priority: str  # critical | high | medium | low
    kind: str  # maintenance | financial | tenant | opportunity
    title: str
    reason: str
    impact: str
    recommended_action: str
    confidence: int  # 0..100
    property_id: Optional[str] = None
    created_at: str


class TimelineEvent(BaseModel):
    id: str
    property_id: str
    kind: str
    title: str
    subtitle: str
    at: str


class Sensor(BaseModel):
    id: str
    property_id: str
    kind: str  # temperature | humidity | leak | occupancy | energy | air_quality
    label: str
    value: float
    unit: str
    status: str  # nominal | attention | critical
    trend: str  # up | down | flat


class Notification(BaseModel):
    id: str
    title: str
    body: str
    priority: str
    at: str
    read: bool = False


class ChatMessage(BaseModel):
    id: str
    role: str
    text: str
    at: str


class ChatRequest(BaseModel):
    session_id: str
    text: str


# ---------------------------------------------------------------------------
# Seed data — feels alive on first launch
# ---------------------------------------------------------------------------
def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def _seed_dataset() -> Dict[str, List[dict]]:
    now = datetime.now(timezone.utc)

    owners = [
        {"id": "own_1", "name": "Alexander Vale", "portfolio_value": 24_800_000, "properties": 4},
    ]

    properties = [
        {
            "id": "prop_1",
            "name": "Marina Crest Residences",
            "address": "12 Harbour Row",
            "city": "Dubai Marina",
            "kind": "penthouse",
            "units": 3,
            "occupancy": 1.0,
            "monthly_revenue": 68_500,
            "health_score": 92,
            "hero_image": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
            "tenant_ids": ["ten_1", "ten_2"],
            "owner_id": "own_1",
        },
        {
            "id": "prop_2",
            "name": "Onyx Sky Loft",
            "address": "88 Emerald Ave",
            "city": "Downtown",
            "kind": "apartment",
            "units": 8,
            "occupancy": 0.875,
            "monthly_revenue": 42_200,
            "health_score": 78,
            "hero_image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
            "tenant_ids": ["ten_3"],
            "owner_id": "own_1",
        },
        {
            "id": "prop_3",
            "name": "The Palm Villa",
            "address": "Frond H, Palm",
            "city": "Palm Jumeirah",
            "kind": "villa",
            "units": 1,
            "occupancy": 1.0,
            "monthly_revenue": 55_000,
            "health_score": 88,
            "hero_image": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
            "tenant_ids": ["ten_4"],
            "owner_id": "own_1",
        },
        {
            "id": "prop_4",
            "name": "Aurum Office Tower",
            "address": "1 Gold Boulevard",
            "city": "Business Bay",
            "kind": "office",
            "units": 14,
            "occupancy": 0.71,
            "monthly_revenue": 96_000,
            "health_score": 64,
            "hero_image": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200",
            "tenant_ids": [],
            "owner_id": "own_1",
        },
    ]

    tenants = [
        {"id": "ten_1", "name": "Priya Kapoor", "property_id": "prop_1", "unit": "PH-01", "since": "2023-06-01", "rent": 24_000, "reliability": 98},
        {"id": "ten_2", "name": "Marcus Reed", "property_id": "prop_1", "unit": "PH-02", "since": "2024-02-15", "rent": 22_500, "reliability": 92},
        {"id": "ten_3", "name": "Sana Al-Farsi", "property_id": "prop_2", "unit": "12B", "since": "2022-09-01", "rent": 8_400, "reliability": 87},
        {"id": "ten_4", "name": "Leon Costa", "property_id": "prop_3", "unit": "Villa", "since": "2021-04-10", "rent": 55_000, "reliability": 95},
    ]

    contracts = [
        {"id": "ct_1", "tenant_id": "ten_1", "property_id": "prop_1", "start": "2023-06-01", "end": "2028-06-01", "monthly_rent": 24_000, "status": "active"},
        {"id": "ct_2", "tenant_id": "ten_2", "property_id": "prop_1", "start": "2024-02-15", "end": _iso(now + timedelta(days=34))[:10], "monthly_rent": 22_500, "status": "expiring"},
        {"id": "ct_3", "tenant_id": "ten_3", "property_id": "prop_2", "start": "2022-09-01", "end": _iso(now + timedelta(days=58))[:10], "monthly_rent": 8_400, "status": "expiring"},
        {"id": "ct_4", "tenant_id": "ten_4", "property_id": "prop_3", "start": "2021-04-10", "end": "2029-04-10", "monthly_rent": 55_000, "status": "active"},
    ]

    decisions = [
        {
            "id": "d_1", "priority": "high", "kind": "maintenance",
            "title": "HVAC on Marina Crest is trending toward failure",
            "reason": "Compressor cycle variance up 34% over 21 days. Historical pattern predicts breakdown within 9–14 days.",
            "impact": "Prevents ≈ AED 42,000 emergency service + 2 tenant complaints.",
            "recommended_action": "Schedule preventive service for Thursday morning.",
            "confidence": 92, "property_id": "prop_1",
            "created_at": _iso(now - timedelta(hours=2)),
        },
        {
            "id": "d_2", "priority": "critical", "kind": "financial",
            "title": "Aurum Office Tower yield below target for 3 months",
            "reason": "Occupancy 71% vs market 84%. Two competing towers dropped rate 8%.",
            "impact": "Recover ≈ AED 168,000 annualized revenue.",
            "recommended_action": "Approve a 6% incentive on new leases and re-list two floors.",
            "confidence": 88, "property_id": "prop_4",
            "created_at": _iso(now - timedelta(hours=5)),
        },
        {
            "id": "d_3", "priority": "medium", "kind": "tenant",
            "title": "Marcus Reed contract renewal window opens",
            "reason": "Contract expires in 34 days. Tenant reliability 92, on-time 24 of 24 months.",
            "impact": "Retention avoids ≈ AED 60,000 vacancy + turnover cost.",
            "recommended_action": "Send renewal offer with 4% increase, locked 24 months.",
            "confidence": 95, "property_id": "prop_1",
            "created_at": _iso(now - timedelta(hours=9)),
        },
        {
            "id": "d_4", "priority": "low", "kind": "opportunity",
            "title": "Palm Villa comparables suggest higher rent",
            "reason": "3 comparable villas leased 8–11% above your rate in last 60 days.",
            "impact": "Uplift ≈ AED 5,000 per month at next renewal.",
            "recommended_action": "Plan rate review for renewal cycle in Q1.",
            "confidence": 76, "property_id": "prop_3",
            "created_at": _iso(now - timedelta(days=1)),
        },
    ]

    timeline = [
        {"id": "t_1", "property_id": "prop_1", "kind": "ai", "title": "AI detected HVAC drift", "subtitle": "Compressor variance rising", "at": _iso(now - timedelta(hours=2))},
        {"id": "t_2", "property_id": "prop_4", "kind": "financial", "title": "Occupancy dipped below 75%", "subtitle": "Third consecutive month", "at": _iso(now - timedelta(days=2))},
        {"id": "t_3", "property_id": "prop_1", "kind": "tenant", "title": "Rent received", "subtitle": "Priya Kapoor · AED 24,000", "at": _iso(now - timedelta(days=3))},
        {"id": "t_4", "property_id": "prop_3", "kind": "maintenance", "title": "Pool service completed", "subtitle": "Villa · scheduled", "at": _iso(now - timedelta(days=5))},
    ]

    sensors = [
        {"id": "s_1", "property_id": "prop_1", "kind": "temperature", "label": "PH-01 Living", "value": 23.4, "unit": "°C", "status": "nominal", "trend": "flat"},
        {"id": "s_2", "property_id": "prop_1", "kind": "humidity", "label": "PH-01 Living", "value": 58, "unit": "%", "status": "attention", "trend": "up"},
        {"id": "s_3", "property_id": "prop_1", "kind": "energy", "label": "Main Meter", "value": 42.6, "unit": "kWh", "status": "nominal", "trend": "down"},
        {"id": "s_4", "property_id": "prop_2", "kind": "leak", "label": "12B Kitchen", "value": 0, "unit": "", "status": "nominal", "trend": "flat"},
        {"id": "s_5", "property_id": "prop_3", "kind": "occupancy", "label": "Villa", "value": 3, "unit": "people", "status": "nominal", "trend": "flat"},
        {"id": "s_6", "property_id": "prop_4", "kind": "air_quality", "label": "Floor 8", "value": 71, "unit": "AQI", "status": "attention", "trend": "up"},
    ]

    notifications = [
        {"id": "n_1", "title": "HVAC action recommended", "body": "SPP suggests preventive service on Marina Crest.", "priority": "high", "at": _iso(now - timedelta(hours=2)), "read": False},
        {"id": "n_2", "title": "Contract expiring in 34 days", "body": "Marcus Reed · Marina Crest PH-02", "priority": "medium", "at": _iso(now - timedelta(hours=9)), "read": False},
        {"id": "n_3", "title": "Occupancy alert", "body": "Aurum Office Tower below target.", "priority": "critical", "at": _iso(now - timedelta(hours=5)), "read": False},
    ]

    reports = [
        {"id": "r_1", "kind": "monthly", "title": "October Portfolio Review", "subtitle": "AI-authored · 4 properties",
         "highlight": "Revenue up 6.2% MoM · 1 intervention prevented",
         "created_at": _iso(now - timedelta(days=2)), "pages": 12, "accent": "gold"},
        {"id": "r_2", "kind": "financial", "title": "Q3 Yield & Cashflow", "subtitle": "AI analysis",
         "highlight": "Yield 7.4% · above market by 0.9pt",
         "created_at": _iso(now - timedelta(days=10)), "pages": 8, "accent": "emerald"},
        {"id": "r_3", "kind": "compliance", "title": "Compliance & Safety Audit", "subtitle": "Green API + sensor sweep",
         "highlight": "100% checks passed · next review in 90 days",
         "created_at": _iso(now - timedelta(days=18)), "pages": 6, "accent": "emerald"},
        {"id": "r_4", "kind": "tenant", "title": "Tenant Reliability Ledger", "subtitle": "AI scoring",
         "highlight": "3 of 4 tenants scoring above 90",
         "created_at": _iso(now - timedelta(days=24)), "pages": 4, "accent": "gold"},
    ]

    knowledge = [
        {"id": "k_1", "topic": "Getting started",
         "title": "How SPP thinks about your portfolio",
         "body": "SPP watches sensor drift, service history, occupancy patterns and market data — then proposes one clear action.",
         "reading_minutes": 3},
        {"id": "k_2", "topic": "Predictive Maintenance",
         "title": "Why prevention beats emergency repairs",
         "body": "Ninety percent of costly failures leave a signal weeks in advance. SPP surfaces those signals.",
         "reading_minutes": 4},
        {"id": "k_3", "topic": "Contracts",
         "title": "The renewal window playbook",
         "body": "How to price, propose and lock a renewal without leaving revenue on the table.",
         "reading_minutes": 5},
        {"id": "k_4", "topic": "Virtual Sensors",
         "title": "What sensors matter most for residential",
         "body": "Temperature, humidity, occupancy and leak sensors deliver 80% of predictive value.",
         "reading_minutes": 4},
        {"id": "k_5", "topic": "Tenant Experience",
         "title": "Reducing churn through response time",
         "body": "Tenants who receive a same-day acknowledgement renew 41% more often.",
         "reading_minutes": 3},
    ]

    guides = [
        {"id": "g_1", "title": "Install your first virtual sensor", "duration": "6 min",
         "kind": "video", "level": "Essential", "chapters": 4,
         "poster": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80"},
        {"id": "g_2", "title": "Connect Home Assistant to SPP", "duration": "9 min",
         "kind": "video", "level": "Intermediate", "chapters": 5,
         "poster": "https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&q=80"},
        {"id": "g_3", "title": "Automate tenant renewals with the Brain", "duration": "5 min",
         "kind": "video", "level": "Essential", "chapters": 3,
         "poster": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80"},
        {"id": "g_4", "title": "Wire Green API to SPP notifications", "duration": "8 min",
         "kind": "video", "level": "Advanced", "chapters": 6,
         "poster": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80"},
    ]

    return {
        "owners": owners, "properties": properties, "tenants": tenants,
        "contracts": contracts, "decisions": decisions, "timeline": timeline,
        "sensors": sensors, "notifications": notifications,
        "reports": reports, "knowledge": knowledge, "guides": guides,
    }


async def _reseed_if_empty():
    if beta_mode_enabled():
        logger.info("Beta mode — auto-seed disabled; use /api/beta/login.")
        return
    if not _mongo_available:
        return
    if not _demo_mode_enabled():
        logger.info("Demo seed skipped — SPP_DEMO_MODE is off (default: empty portfolio).")
        return
    try:
        if await _get_db().properties.count_documents({}) > 0:
            return
        data = _seed_dataset()
        for coll, rows in data.items():
            if rows:
                await _get_db()[coll].insert_many([dict(r) for r in rows])
    except Exception as exc:
        logger.warning("Mongo reseed skipped: %s", exc)


def _demo_mode_enabled() -> bool:
    return os.getenv("SPP_DEMO_MODE", "false").lower() in ("1", "true", "yes")


def _use_memory_store() -> bool:
    return beta_mode_enabled() and not _mongo_available


def _memory_find(collection: str, query: Optional[dict] = None) -> List[dict]:
    rows = _memory_db.get(collection, [])
    if not query:
        return list(rows)
    return [r for r in rows if all(r.get(k) == v for k, v in query.items())]


def _memory_find_one(collection: str, query: Optional[dict] = None) -> Optional[dict]:
    matches = _memory_find(collection, query)
    return matches[0] if matches else None


def _memory_insert_all(data: Dict[str, List[dict]]) -> None:
    global _memory_db
    _memory_db = {k: [dict(r) for r in v] for k, v in data.items()}


def _memory_clear() -> None:
    global _memory_db
    _memory_db = {}


async def _clear_all_collections():
    if _use_memory_store() or (beta_mode_enabled() and not _mongo_available):
        _memory_clear()
        return
    if not _mongo_available:
        return
    cols = [
        "owners", "properties", "tenants", "contracts", "decisions", "timeline",
        "sensors", "notifications", "reports", "knowledge", "guides",
    ]
    for c in cols:
        await _get_db()[c].delete_many({})


async def _load_demo_seed(persona: str = "owner"):
    data = beta_dataset(persona) if beta_mode_enabled() else _seed_dataset()
    if _mongo_available:
        await _clear_all_collections()
        for coll, rows in data.items():
            if rows:
                await _get_db()[coll].insert_many([dict(r) for r in rows])
    elif _use_memory_store() or beta_mode_enabled():
        _memory_insert_all(data)
    else:
        raise HTTPException(503, "Database unavailable for demo load")


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def _safe_mongo_find(
    collection: str,
    query: Optional[dict] = None,
    *,
    sort: Optional[tuple] = None,
) -> List[dict]:
    if _use_memory_store():
        rows = _memory_find(collection, query)
        if sort:
            key, direction = sort
            rows = sorted(rows, key=lambda r: r.get(key, ""), reverse=direction < 0)
        return rows
    if not _mongo_available:
        return []
    try:
        cursor = _get_db()[collection].find(query or {}, {"_id": 0})
        if sort:
            cursor = cursor.sort(sort[0], sort[1])
        return [_strip_id(doc) async for doc in cursor]
    except Exception as exc:
        logger.warning("Mongo read %s failed: %s", collection, exc)
        return []


async def _safe_mongo_find_one(collection: str, query: Optional[dict] = None) -> Optional[dict]:
    if _use_memory_store():
        return _memory_find_one(collection, query)
    if not _mongo_available:
        return None
    try:
        doc = await _get_db()[collection].find_one(query or {}, {"_id": 0})
        return _strip_id(doc) if doc else None
    except Exception as exc:
        logger.warning("Mongo find_one %s failed: %s", collection, exc)
        return None


def _gas_memory_bundle() -> Optional[Dict[str, Any]]:
    gas = get_gas_client()
    if not gas.configured:
        return None
    try:
        return gas.get_memory_lite()
    except Exception as exc:
        logger.debug("GAS memory lite unavailable: %s", exc)
        return None


def _gas_canonical_context() -> Dict[str, Any]:
    """Single GAS load → canonical model → legacy API shapes + memory + intelligence."""
    gas = get_gas_client()
    dashboard = gas.get_dashboard_lite()
    decisions_bundle = gas.get_decisions_lite()
    memory_bundle = _gas_memory_bundle()

    portfolio = portfolio_from_bundles(
        dashboard=dashboard,
        decisions=decisions_bundle,
        memory=memory_bundle,
    )
    health = (dashboard or {}).get("propertyHealth") or {}
    base_health = int(health.get("score") or 75)
    payload = legacy_api_payload(portfolio, base_health=base_health, merge_intelligence=True)
    reports = map_reports_from_app_data(dashboard)

    return {
        "settings": (dashboard or {}).get("settings") or {},
        "properties": payload["properties"],
        "tenants": payload["tenants"],
        "contracts": payload["contracts"],
        "decisions": payload["decisions"],
        "reports": reports,
        "memory": payload["memory"],
        "portfolio": payload["portfolio"],
    }


def _gas_properties() -> List[dict]:
    return map_properties_from_app_data(get_gas_client().get_properties_lite())


def _gas_tenants() -> List[dict]:
    return map_tenants_from_app_data(get_gas_client().get_tenants_lite())


def _gas_contracts() -> List[dict]:
    gas = get_gas_client()
    for loader in (gas.get_contracts_lite, gas.get_properties_lite, gas.get_dashboard_lite):
        contracts = map_contracts_from_app_data(loader())
        if contracts:
            return contracts
    return []


def _gas_decisions() -> List[dict]:
    return map_decisions_from_app_data(get_gas_client().get_decisions_lite())


def _gas_reports() -> List[dict]:
    return map_reports_from_app_data(get_gas_client().get_reports_lite())


def _gas_notifications() -> List[dict]:
    return map_notifications_from_app_data(get_gas_client().get_alerts_lite())


async def _mongo_properties() -> List[dict]:
    return await _safe_mongo_find("properties")


async def _mongo_tenants() -> List[dict]:
    return await _safe_mongo_find("tenants")


async def _mongo_contracts() -> List[dict]:
    return await _safe_mongo_find("contracts")


async def _mongo_decisions() -> List[dict]:
    return await _safe_mongo_find("decisions", sort=("created_at", -1))


async def _mongo_reports() -> List[dict]:
    return await _safe_mongo_find("reports", sort=("created_at", -1))


async def _mongo_notifications() -> List[dict]:
    return await _safe_mongo_find("notifications", sort=("at", -1))


async def _list_properties_live() -> List[dict]:
    return await resolve_domain("PROPERTIES", _gas_properties, _mongo_properties)


async def _list_tenants_live() -> List[dict]:
    return await resolve_domain("TENANTS", _gas_tenants, _mongo_tenants)


async def _list_contracts_live() -> List[dict]:
    return await resolve_domain("CONTRACTS", _gas_contracts, _mongo_contracts)


async def _list_decisions_live() -> List[dict]:
    return await resolve_domain("DECISIONS", _gas_decisions, _mongo_decisions)


async def _list_reports_live() -> List[dict]:
    return await resolve_domain("REPORTS", _gas_reports, _mongo_reports)


async def _list_notifications_live() -> List[dict]:
    return await resolve_domain("ALERTS", _gas_notifications, _mongo_notifications)


async def _get_property_live(pid: str) -> Optional[dict]:
    props = await _list_properties_live()
    for prop in props:
        if prop.get("id") == pid:
            return prop
    return None


_portfolio_cache: Optional[Dict[str, Any]] = None
_portfolio_cache_at: float = 0.0
_PORTFOLIO_CACHE_TTL_SEC = 25.0


async def _portfolio_live_context() -> Dict[str, Any]:
    """Load portfolio domains in parallel; short TTL cache avoids duplicate GAS round-trips."""
    global _portfolio_cache, _portfolio_cache_at
    now = time.time()
    if _portfolio_cache and (now - _portfolio_cache_at) < _PORTFOLIO_CACHE_TTL_SEC:
        return _portfolio_cache

    if beta_mode_enabled():
        props = _memory_find("properties")
        if props:
            ctx = {
                "settings": {},
                "properties": props,
                "tenants": _memory_find("tenants"),
                "contracts": _memory_find("contracts"),
                "decisions": _memory_find("decisions"),
                "reports": _memory_find("reports"),
            }
        else:
            data = beta_dataset("owner")
            ctx = {
                "settings": {},
                "properties": data.get("properties", []),
                "tenants": data.get("tenants", []),
                "contracts": data.get("contracts", []),
                "decisions": data.get("decisions", []),
                "reports": data.get("reports", []),
            }
    elif not _gas_live_mode():
        ctx = await asyncio.to_thread(_gas_canonical_context)
    else:
        props, decisions, tenants, contracts, reports = await asyncio.gather(
            _list_properties_live(),
            _list_decisions_live(),
            _list_tenants_live(),
            _list_contracts_live(),
            _list_reports_live(),
        )
        contracts = reconcile_contracts(contracts, decisions, tenants, props)

        settings: Dict[str, Any] = {}
        gas = get_gas_client()
        if gas.configured and not beta_mode_enabled():
            try:
                settings = await asyncio.to_thread(
                    lambda: (gas.get_dashboard_lite() or {}).get("settings") or {}
                )
            except Exception as exc:
                logger.warning("GAS portfolio settings skipped: %s", exc)

        ctx = {
            "settings": settings,
            "properties": props,
            "tenants": tenants,
            "contracts": contracts,
            "decisions": decisions,
            "reports": reports,
        }

    _portfolio_cache = ctx
    _portfolio_cache_at = now
    return _portfolio_cache


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"app": "SPP", "status": "online"}


@api_router.get("/briefing")
async def briefing():
    """The AI Employee's morning briefing — the heart of the home screen."""
    ctx = await _portfolio_live_context()
    return build_briefing(
        ctx["settings"],
        ctx["properties"],
        ctx["tenants"],
        ctx["contracts"],
        ctx["decisions"],
        ctx["reports"],
    )


@api_router.get("/executive")
async def executive_brain():
    """Executive Brain V2 — daily agenda, ranked decisions, opportunities."""
    ctx = await _portfolio_live_context()
    return build_executive_brain(
        ctx["settings"],
        ctx["properties"],
        ctx["tenants"],
        ctx["contracts"],
        ctx["decisions"],
        ctx["reports"],
    )


@api_router.get("/portfolio-memory")
async def portfolio_memory():
    """Portfolio Memory graph — canonical asset life profiles."""
    ctx = await _portfolio_live_context()
    memory = ctx.get("memory")
    if memory is None:
        portfolio = portfolio_from_bundles()
        from adapters.portfolio_memory.graph import build_memory_graph

        memory = build_memory_graph(portfolio)
    return memory_graph_to_dict(memory)


@api_router.get("/intelligence")
async def executive_intelligence():
    """Executive Intelligence — pattern-based insights from canonical memory."""
    ctx = await _portfolio_live_context()
    portfolio = ctx.get("portfolio")
    memory = ctx.get("memory")
    if portfolio is None:
        return {"insights": [], "count": 0}
    insights = generate_insights(portfolio, memory)
    return {"insights": insights_to_api(insights), "count": len(insights)}


@api_router.get("/properties")
async def list_properties():
    ctx = await _portfolio_live_context()
    return ctx["properties"]


@api_router.get("/properties/{pid}")
async def get_property(pid: str):
    ctx = await _portfolio_live_context()
    for prop in ctx["properties"]:
        if prop.get("id") == pid:
            return prop
    doc = await _safe_mongo_find_one("properties", {"id": pid})
    if not doc:
        raise HTTPException(404, "property not found")
    return doc


@api_router.get("/decisions")
async def list_decisions():
    ctx = await _portfolio_live_context()
    return ctx["decisions"]


@api_router.get("/tenants")
async def list_tenants():
    ctx = await _portfolio_live_context()
    return ctx["tenants"]


@api_router.get("/contracts")
async def list_contracts():
    ctx = await _portfolio_live_context()
    return ctx["contracts"]


@api_router.get("/timeline")
async def list_timeline():
    return await _safe_mongo_find("timeline", sort=("at", -1))


@api_router.get("/sensors")
async def list_sensors():
    return await _safe_mongo_find("sensors")


@api_router.get("/notifications")
async def list_notifications():
    return await _list_notifications_live()


@api_router.get("/reports")
async def list_reports():
    ctx = await _portfolio_live_context()
    return ctx["reports"]


@api_router.get("/knowledge")
async def list_knowledge():
    return await _safe_mongo_find("knowledge")


@api_router.get("/guides")
async def list_guides():
    return await _safe_mongo_find("guides")


@api_router.get("/owner")
async def get_owner():
    doc = await _safe_mongo_find_one("owners")
    return doc or {"id": "own_1", "name": "", "portfolio_value": 0, "properties": 0}


class BetaLoginRequest(BaseModel):
    email: str
    password: str


@api_router.get("/beta/info")
async def beta_info():
    """Public beta metadata — no secrets."""
    return {
        "beta": beta_mode_enabled(),
        "personas": [
            {"id": "owner", "email": "demo.owner@spp.beta", "label": "Owner"},
            {"id": "tenant", "email": "demo.tenant@spp.beta", "label": "Tenant"},
            {"id": "technician", "email": "demo.tech@spp.beta", "label": "Technician"},
        ],
        "data_source": "fictional_beta_seed",
        "gas_disabled": beta_mode_enabled(),
    }


@api_router.post("/beta/login")
async def beta_login(req: BetaLoginRequest):
    """Beta tester login — loads fictional portfolio, never Google Sheets."""
    if not beta_mode_enabled():
        raise HTTPException(404, "Beta mode is not enabled on this server")
    persona = verify_beta_login(req.email, req.password)
    if not persona:
        raise HTTPException(401, "Invalid beta credentials")
    await _load_demo_seed(persona)
    global _portfolio_cache, _portfolio_cache_at
    _portfolio_cache = None
    _portfolio_cache_at = 0.0
    return {"ok": True, "persona": persona, "email": req.email.strip().lower()}


@api_router.post("/demo/load")
async def load_demo():
    """Load sample portfolio — opt-in only, never default."""
    await _load_demo_seed("owner")
    global _portfolio_cache, _portfolio_cache_at
    _portfolio_cache = None
    _portfolio_cache_at = 0.0
    return {"ok": True, "mode": "demo", "beta": beta_mode_enabled()}


@api_router.post("/demo/clear")
async def clear_demo():
    """Remove all seeded data — return to empty portfolio."""
    await _clear_all_collections()
    global _portfolio_cache, _portfolio_cache_at
    _portfolio_cache = None
    _portfolio_cache_at = 0.0
    return {"ok": True, "mode": "empty"}


@api_router.get("/verdicts")
async def verdicts():
    """Contextual AI verdicts — one Brain speaking on every surface."""
    ctx = await _portfolio_live_context()
    notifications = await _list_notifications_live()
    return build_verdicts(
        ctx["properties"],
        ctx["tenants"],
        ctx["contracts"],
        ctx["decisions"],
        ctx["reports"],
        notifications,
    )


@api_router.post("/chat")
async def chat(req: ChatRequest):
    """Non-streaming chat endpoint — Unified Brain."""
    now = _iso(datetime.now(timezone.utc))
    user_msg = {"id": str(uuid.uuid4()), "session_id": req.session_id, "role": "user", "text": req.text, "at": now}
    try:
        from emergentintegrations.llm.chat import UserMessage  # type: ignore
        if not EMERGENT_LLM_KEY:
            raise HTTPException(500, "AI key not configured")
        chat_obj = get_llm_chat(session_id=req.session_id)
        reply = await chat_obj.send_message(UserMessage(text=req.text))
    except HTTPException:
        raise
    except ModuleNotFoundError:
        reply = "I couldn't reach the Brain just now. Try again in a moment."
    except Exception as e:
        msg = str(e).lower()
        if "budget" in msg or "quota" in msg:
            reply = (
                "The AI Employee is momentarily paused — your Emergent Universal Key "
                "balance has run out. Top up in Profile → Universal Key → Add Balance "
                "and I'll be right back."
            )
        else:
            reply = "I couldn't reach the Brain just now. Try again in a moment."
    msg = {"id": str(uuid.uuid4()), "session_id": req.session_id, "role": "assistant", "text": reply, "at": now}
    if _use_memory_store():
        bucket = _memory_db.setdefault("chat_messages", [])
        bucket.extend([dict(user_msg), dict(msg)])
    elif _mongo_available:
        try:
            await _get_db().chat_messages.insert_many([dict(user_msg), dict(msg)])
        except Exception as exc:
            logger.warning("Chat history not saved (Mongo unavailable): %s", exc)
    return {"reply": reply, "at": now}


@api_router.get("/chat/{session_id}")
async def chat_history(session_id: str):
    return await _safe_mongo_find(
        "chat_messages", {"session_id": session_id}, sort=("at", 1)
    )


# ---------------------------------------------------------------------------
# Upload → portfolio analysis (additive — files + live domain)
# ---------------------------------------------------------------------------
class UploadFileMeta(BaseModel):
    name: str
    mimeType: Optional[str] = None
    size: Optional[int] = None
    textSnippet: Optional[str] = None


class UploadPortfolioRequest(BaseModel):
    files: List[UploadFileMeta]
    lang: str = "ar"


class UploadApplyRequest(BaseModel):
    analysis_id: str
    files: Optional[List[UploadFileMeta]] = None


class UploadPdfRequest(BaseModel):
    analysis_id: Optional[str] = None


_last_applied_analysis: Optional[str] = None


@api_router.post("/upload/portfolio-analysis")
async def upload_portfolio_analysis(req: UploadPortfolioRequest):
    """Analyze uploaded files — GAS Smart Property engines when configured."""
    if not req.files:
        raise HTTPException(400, "No files provided")
    lang = "ar" if req.lang.startswith("ar") else "en"
    ctx = await _portfolio_live_context()
    payload = await asyncio.to_thread(
        analyze_upload_with_gas_fallback,
        [f.model_dump() for f in req.files],
        ctx,
        lang,  # type: ignore[arg-type]
    )
    return payload


@api_router.post("/upload/apply-analysis")
async def upload_apply_analysis(req: UploadApplyRequest):
    """Commit import to portfolio — GAS commitSmartPropertyImportBatch when configured."""
    global _last_applied_analysis
    files_dump = [f.model_dump() for f in req.files] if req.files else None

    if gas_import_available():
        try:
            result = await asyncio.to_thread(
                apply_gas_import,
                req.analysis_id,
                files_dump,
            )
            _last_applied_analysis = req.analysis_id
            return {
                "ok": True,
                "analysis_id": req.analysis_id,
                "applied_at": _iso(datetime.now(timezone.utc)),
                "gas": True,
                "commit": result.get("result"),
            }
        except Exception as exc:
            logger.warning("GAS apply failed: %s", exc)
            raise HTTPException(
                502,
                {"ok": False, "error": str(exc), "analysis_id": req.analysis_id, "gas": True},
            ) from exc

    _last_applied_analysis = req.analysis_id
    return {"ok": True, "analysis_id": req.analysis_id, "applied_at": _iso(datetime.now(timezone.utc))}


@api_router.post("/upload/create-pdf")
async def upload_create_pdf(req: UploadPdfRequest):
    """Create owner PDF via GAS createOwnerReportPdf_."""
    if not gas_import_available():
        raise HTTPException(503, "PDF requires GAS Smart Property backend")
    try:
        result = await asyncio.to_thread(create_gas_owner_pdf, req.analysis_id)
        return result
    except Exception as exc:
        raise HTTPException(502, str(exc)) from exc


@api_router.get("/upload/last-applied")
async def upload_last_applied():
    return {"analysis_id": _last_applied_analysis}


# ---------------------------------------------------------------------------
# App wiring
# ---------------------------------------------------------------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def _startup():
    global _mongo_available
    _mongo_available = await _mongo_ping()
    if beta_mode_enabled():
        logger.info("SPP BETA MODE — Google Sheets disabled; fictional seed only.")
        if not _mongo_available:
            logger.info("Mongo unavailable — using in-memory beta store.")
    if _mongo_available:
        await _reseed_if_empty()
        logger.info("Mongo connected — seed check complete.")
    elif _gas_live_mode():
        logger.warning("Mongo unavailable — starting with GAS/hybrid live data.")
    else:
        logger.warning("Mongo unavailable and GAS not configured — some endpoints may return empty data.")
    logger.info("SPP backend ready.")


@app.on_event("shutdown")
async def shutdown_db_client():
    if _mongo_client:
        _mongo_client.close()
