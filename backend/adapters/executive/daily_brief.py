"""Daily executive brief — what / why / outcome."""

from __future__ import annotations

from typing import Any, Dict, List

from adapters.mappers.brain_copy import fmt_money_ar, salutation_ar


def _owner_first_name(settings: Dict[str, Any]) -> str:
    for key in ("clientName", "propertyName"):
        raw = str(settings.get(key) or "").strip()
        if raw:
            return raw.split()[0]
    return ""


def _sum_impact(items: List[dict]) -> float:
    return sum(float(i.get("impact_aed") or 0) for i in items)


def build_daily_executive_brief(
    settings: Dict[str, Any],
    agenda: Dict[str, List[dict]],
    ranked_items: List[dict],
    opportunities: List[dict],
    unit_count: int,
    tenant_count: int,
) -> Dict[str, Any]:
    now = agenda.get("now") or []
    today = agenda.get("today") or []
    week = agenda.get("this_week") or []
    focus = now[:2] or today[:2] or week[:1]

    if not focus:
        return {
            "salutation": salutation_ar(),
            "owner_name": _owner_first_name(settings),
            "what": "لا قرارات عاجلة — راقب المحفظة واستغل الوقت للتخطيط.",
            "why": f"المحفظة ({unit_count} وحدة) مستقرة حالياً دون إجراء فوري.",
            "outcome": "تحافظ على التدفق النقدي وتتجنب تدخل غير ضروري.",
            "focus_count": 0,
            "recoverable_aed": 0,
        }

    actions = " · ".join(i.get("action", "") for i in focus[:3] if i.get("action"))
    titles = " · ".join(i.get("title", "") for i in focus[:3] if i.get("title"))
    recoverable = _sum_impact(now) + _sum_impact(today) * 0.5
    opp_hint = ""
    if opportunities:
        opp_hint = f" فرصة إضافية: {opportunities[0].get('title', '')}."

    what = f"ابدأ بـ {len(now) or len(today)} إجراءً: {actions or titles}."
    why = (
        f"هذه العناصر الأعلى تأثيراً على {unit_count} وحدة و{tenant_count} مستأجر"
        f" — مرتبة حسب المال والعقد والصحة.{opp_hint}"
    )
    outcome = (
        f"تتوقع استعادة أو حماية ≈ {fmt_money_ar(recoverable)} ريال "
        f"عند إغلاق قائمة اليوم."
    )

    return {
        "salutation": salutation_ar(),
        "owner_name": _owner_first_name(settings),
        "what": what.strip(),
        "why": why.strip(),
        "outcome": outcome.strip(),
        "focus_count": len(now) + len(today),
        "recoverable_aed": round(recoverable),
    }
