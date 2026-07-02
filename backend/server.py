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
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------------------------------------------------------------------------
# Mongo
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

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
            "hero_image": "https://images.unsplash.com/photo-1527576539890-dfa815648363?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHwzfHxkYXJrJTIwY2luZW1hdGljJTIwbW9kZXJuJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc4MzAyOTc1MXww&ixlib=rb-4.1.0&q=85",
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
        {"id": "ct_1", "tenant_id": "ten_1", "property_id": "prop_1", "start": "2023-06-01", "end": "2026-06-01", "monthly_rent": 24_000, "status": "active"},
        {"id": "ct_2", "tenant_id": "ten_2", "property_id": "prop_1", "start": "2024-02-15", "end": "2026-02-15", "monthly_rent": 22_500, "status": "expiring"},
        {"id": "ct_3", "tenant_id": "ten_3", "property_id": "prop_2", "start": "2022-09-01", "end": "2025-09-01", "monthly_rent": 8_400, "status": "expiring"},
        {"id": "ct_4", "tenant_id": "ten_4", "property_id": "prop_3", "start": "2021-04-10", "end": "2027-04-10", "monthly_rent": 55_000, "status": "active"},
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

    return {
        "owners": owners, "properties": properties, "tenants": tenants,
        "contracts": contracts, "decisions": decisions, "timeline": timeline,
        "sensors": sensors, "notifications": notifications,
    }


async def _reseed_if_empty():
    if await db.properties.count_documents({}) > 0:
        return
    data = _seed_dataset()
    for coll, rows in data.items():
        if rows:
            await db[coll].insert_many([dict(r) for r in rows])


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"app": "SPP", "status": "online"}


@api_router.get("/briefing")
async def briefing():
    """The AI Employee's morning briefing — the heart of the home screen."""
    props = [_strip_id(p) async for p in db.properties.find({}, {"_id": 0})]
    decisions = [_strip_id(d) async for d in db.decisions.find({}, {"_id": 0}).sort("created_at", -1)]
    sensors = [_strip_id(s) async for s in db.sensors.find({}, {"_id": 0})]

    portfolio_value = sum(p["monthly_revenue"] for p in props) * 12
    avg_health = round(sum(p["health_score"] for p in props) / max(len(props), 1))
    occupancy = round(100 * sum(p["occupancy"] for p in props) / max(len(props), 1))

    critical = [d for d in decisions if d["priority"] in ("critical", "high")]
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

    return {
        "salutation": salutation,
        "owner_name": "Alexander",
        "headline": headline,
        "portfolio_annual_revenue": portfolio_value,
        "avg_health": avg_health,
        "occupancy": occupancy,
        "properties_count": len(props),
        "decisions": decisions[:4],
        "sensor_alerts": [s for s in sensors if s["status"] != "nominal"][:3],
    }


@api_router.get("/properties")
async def list_properties():
    return [_strip_id(p) async for p in db.properties.find({}, {"_id": 0})]


@api_router.get("/properties/{pid}")
async def get_property(pid: str):
    doc = await db.properties.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "property not found")
    return doc


@api_router.get("/decisions")
async def list_decisions():
    return [_strip_id(d) async for d in db.decisions.find({}, {"_id": 0}).sort("created_at", -1)]


@api_router.get("/tenants")
async def list_tenants():
    return [_strip_id(t) async for t in db.tenants.find({}, {"_id": 0})]


@api_router.get("/contracts")
async def list_contracts():
    return [_strip_id(c) async for c in db.contracts.find({}, {"_id": 0})]


@api_router.get("/timeline")
async def list_timeline():
    return [_strip_id(t) async for t in db.timeline.find({}, {"_id": 0}).sort("at", -1)]


@api_router.get("/sensors")
async def list_sensors():
    return [_strip_id(s) async for s in db.sensors.find({}, {"_id": 0})]


@api_router.get("/notifications")
async def list_notifications():
    return [_strip_id(n) async for n in db.notifications.find({}, {"_id": 0}).sort("at", -1)]


@api_router.post("/chat")
async def chat(req: ChatRequest):
    """Non-streaming chat endpoint — Unified Brain."""
    from emergentintegrations.llm.chat import UserMessage
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "AI key not configured")
    now = _iso(datetime.now(timezone.utc))
    user_msg = {"id": str(uuid.uuid4()), "session_id": req.session_id, "role": "user", "text": req.text, "at": now}
    try:
        chat_obj = get_llm_chat(session_id=req.session_id)
        reply = await chat_obj.send_message(UserMessage(text=req.text))
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
    await db.chat_messages.insert_many([dict(user_msg), dict(msg)])
    return {"reply": reply, "at": now}


@api_router.get("/chat/{session_id}")
async def chat_history(session_id: str):
    return [_strip_id(m) async for m in db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("at", 1)]


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
    await _reseed_if_empty()
    logger.info("SPP backend ready.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
