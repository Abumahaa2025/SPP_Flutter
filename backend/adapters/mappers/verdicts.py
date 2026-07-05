"""Dynamic Brain Verdicts from live Sheets-mapped portfolio data."""

from __future__ import annotations

from typing import Dict, List, Optional

from adapters.mappers.brain_copy import (
    contract_renewal_action,
    contract_renewal_guidance,
    contract_sort_key,
    days_until,
    decision_action_ar,
    decision_detail_ar,
    decision_title_ar,
    fmt_money_ar,
    renewal_headline,
    sanitize_brain_text,
)

_PRIORITY = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def _sorted_decisions(decisions: List[dict], kind: Optional[str] = None) -> List[dict]:
    rows = [d for d in decisions if not kind or d.get("kind") == kind]
    return sorted(rows, key=lambda d: _PRIORITY.get(d.get("priority", "low"), 9))


def _weakest(properties: List[dict]) -> Optional[dict]:
    return min(properties, key=lambda p: p.get("health_score", 100)) if properties else None


def _strongest_revenue(properties: List[dict]) -> Optional[dict]:
    return max(properties, key=lambda p: p.get("monthly_revenue", 0)) if properties else None


def _property_map(properties: List[dict]) -> Dict[str, dict]:
    return {p["id"]: p for p in properties if p.get("id")}


def _tenant_map(tenants: List[dict]) -> Dict[str, dict]:
    return {t["id"]: t for t in tenants if t.get("id")}


def _expiring_contracts(contracts: List[dict]) -> List[dict]:
    rows = [c for c in contracts if c.get("status") == "expiring"]
    rows.sort(key=lambda c: contract_sort_key(c.get("end", "")))
    return rows


def _verdict(headline: str, why: str, action: str, route: str) -> Dict[str, str]:
    return {
        "headline": sanitize_brain_text(headline),
        "why": sanitize_brain_text(why),
        "action": sanitize_brain_text(action),
        "route": route,
    }


def _tenant_name(tenant_id: str, tenants: Dict[str, dict]) -> str:
    tenant = tenants.get(tenant_id) or {}
    return str(tenant.get("name") or tenant.get("unit") or "")


def _property_label(prop_id: str, props: Dict[str, dict]) -> str:
    prop = props.get(prop_id) or {}
    return str(prop.get("name") or prop.get("address") or "الوحدة")


def _trim_action(decision: dict) -> str:
    text = decision_action_ar(decision)
    clean = " ".join(text.split())
    if len(clean) <= 120:
        return clean or "راجع التفاصيل"
    return clean[:119].rstrip() + "…"


def build_verdicts(
    properties: List[dict],
    tenants: List[dict],
    contracts: List[dict],
    decisions: List[dict],
    reports: List[dict],
    notifications: List[dict],
) -> Dict[str, Optional[Dict[str, str]]]:
    """One recommendation per surface — derived only from live domain rows."""
    props_by_id = _property_map(properties)
    tenants_by_id = _tenant_map(tenants)
    ranked = _sorted_decisions(decisions)
    urgent = [d for d in ranked if d.get("priority") in ("critical", "high")]
    maintenance = _sorted_decisions(decisions, "maintenance")
    financial = _sorted_decisions(decisions, "financial")
    tenant_decisions = _sorted_decisions(decisions, "tenant")
    expiring = _expiring_contracts(contracts)
    weakest = _weakest(properties)
    top_rev = _strongest_revenue(properties)
    vacant = [p for p in properties if p.get("occupancy", 0) < 0.5]
    critical_props = [p for p in properties if p.get("health_score", 100) < 80]
    notif_ranked = sorted(
        notifications,
        key=lambda n: _PRIORITY.get(n.get("priority", "medium"), 9),
    )

    out: Dict[str, Optional[Dict[str, str]]] = {}

    if len(urgent) >= 2:
        a, b = urgent[0], urgent[1]
        out["home"] = _verdict(
            headline=f"عالج {len(urgent)} قرارات عاجلة الآن.",
            why=f"ابدأ بـ {decision_title_ar(a)} ثم {decision_title_ar(b)}.",
            action=_trim_action(a),
            route="/",
        )
    elif urgent:
        d = urgent[0]
        out["home"] = _verdict(
            headline=decision_title_ar(d),
            why=decision_detail_ar(d, contracts),
            action=_trim_action(d),
            route="/maintenance" if d.get("kind") == "maintenance" else "/",
        )
    elif expiring:
        c = expiring[0]
        name = _tenant_name(c.get("tenant_id", ""), tenants_by_id)
        subject = name or _property_label(c.get("property_id", ""), props_by_id)
        end_days = days_until(c.get("end", ""))
        out["home"] = _verdict(
            headline=renewal_headline(subject, end_days),
            why=contract_renewal_guidance(end_days),
            action=contract_renewal_action(end_days),
            route="/contracts",
        )
    elif properties:
        occ = round(100 * sum(p.get("occupancy", 0) for p in properties) / len(properties))
        out["home"] = _verdict(
            headline="لا قرارات عاجلة اليوم.",
            why=f"راقب الإشغال عند {occ}% — المحفظة مستقرة.",
            action="راجع المحفظة",
            route="/portfolio",
        )
    else:
        out["home"] = None

    if weakest:
        out["portfolio"] = _verdict(
            headline=f"عالج {weakest.get('name')} أولاً.",
            why="الصحة الأضعف في المحفظة — راجع التحصيل أو الصيانة قبل بقية الوحدات.",
            action="افتح الوحدة واتخذ قراراً",
            route=f"/property/{weakest['id']}",
        )
    else:
        out["portfolio"] = None

    renewal_focus = next(
        (c for c in expiring if (days_until(c.get("end", "")) or 999) <= 30),
        None,
    )
    if renewal_focus:
        name = _tenant_name(renewal_focus.get("tenant_id", ""), tenants_by_id)
        unit = _property_label(renewal_focus.get("property_id", ""), props_by_id)
        end_days = days_until(renewal_focus.get("end", ""))
        subject = name or unit
        out["insights"] = _verdict(
            headline=renewal_headline(subject, end_days),
            why=contract_renewal_guidance(end_days),
            action=contract_renewal_action(end_days),
            route="/contracts",
        )
    elif top_rev and properties:
        out["insights"] = _verdict(
            headline=f"راجع تسعير {top_rev.get('name')}.",
            why="أعلى وحدة إيراداً — تحقق من إمكانية رفع الإيجار أو تجديد العقد.",
            action="افتح التحليلات",
            route="/insights",
        )
    elif reports:
        r = reports[0]
        out["insights"] = _verdict(
            headline=str(r.get("title") or "تقرير المحفظة"),
            why=str(r.get("highlight") or r.get("subtitle") or ""),
            action="افتح التقارير",
            route="/reports",
        )
    else:
        out["insights"] = None

    if weakest and weakest.get("health_score", 100) < 85:
        linked = next((d for d in ranked if d.get("property_id") == weakest.get("id")), None)
        why = decision_detail_ar(linked, contracts) if linked else ""
        if not why:
            why = "الصحة منخفضة — خطّط لتدخل خلال الأسبوع."
        out["health"] = _verdict(
            headline=f"عالج {weakest.get('name')} أولاً.",
            why=why,
            action="افتح الصحة واتخذ قراراً",
            route="/health",
        )
    elif properties:
        out["health"] = _verdict(
            headline="الصحة العامة مقبولة.",
            why=f"لا حاجة لتدخل عاجل — راقب {len(critical_props)} وحدة تحت المستهدف.",
            action="اعرض الترتيب",
            route="/health",
        )
    else:
        out["health"] = None

    if maintenance:
        m = maintenance[0]
        out["maintenance"] = _verdict(
            headline=decision_title_ar(m),
            why=decision_detail_ar(m, contracts),
            action=_trim_action(m),
            route="/maintenance",
        )
    else:
        out["maintenance"] = None

    low_health = sorted(critical_props, key=lambda p: p.get("health_score", 0))[:2]
    if low_health:
        names = "، ".join(p.get("name", "") for p in low_health)
        out["sensors"] = _verdict(
            headline=f"راجع {len(low_health)} وحدة ضعيفة الإشارة.",
            why=f"{names} — خطّط لتدخل قبل تفاقم المشكلة.",
            action="راجع الصحة",
            route="/health",
        )
    else:
        out["sensors"] = None

    renewal_tenant = None
    renewal_days: Optional[int] = None
    if expiring:
        c = expiring[0]
        renewal_tenant = tenants_by_id.get(c.get("tenant_id", ""))
        renewal_days = days_until(c.get("end", ""))
    if not renewal_tenant and tenants:
        renewal_tenant = min(tenants, key=lambda t: t.get("reliability", 100))
    if renewal_tenant:
        why = contract_renewal_guidance(renewal_days) if renewal_days is not None else (
            "راجع ملف المستأجر وخطّط للتجديد."
        )
        out["tenants"] = _verdict(
            headline=f"تواصل مع {renewal_tenant.get('name')} بخصوص التجديد.",
            why=why,
            action=contract_renewal_action(renewal_days) if renewal_days is not None else (
                "جهّز عرض التجديد"
            ),
            route="/tenants",
        )
    else:
        out["tenants"] = None

    if expiring:
        c = expiring[0]
        name = _tenant_name(c.get("tenant_id", ""), tenants_by_id)
        unit = _property_label(c.get("property_id", ""), props_by_id)
        end_days = days_until(c.get("end", ""))
        subject = name or unit
        out["contracts"] = _verdict(
            headline=renewal_headline(subject, end_days),
            why=contract_renewal_guidance(end_days),
            action=contract_renewal_action(end_days),
            route="/contracts",
        )
    else:
        out["contracts"] = None

    if notif_ranked:
        n = notif_ranked[0]
        out["notifications"] = _verdict(
            headline=str(n.get("title") or "تنبيه"),
            why=str(n.get("body") or ""),
            action="افتح الإشعارات",
            route="/notifications",
        )
    elif financial:
        f = financial[0]
        out["notifications"] = _verdict(
            headline=decision_title_ar(f),
            why=decision_detail_ar(f, contracts),
            action=_trim_action(f),
            route="/",
        )
    else:
        out["notifications"] = None

    if reports:
        r = reports[0]
        out["reports"] = _verdict(
            headline=str(r.get("title") or "تقرير جاهز"),
            why=str(r.get("highlight") or r.get("subtitle") or ""),
            action="اقرأ التقرير",
            route="/reports",
        )
    else:
        out["reports"] = None

    if tenant_decisions:
        t = tenant_decisions[0]
        out["knowledge"] = _verdict(
            headline=decision_title_ar(t),
            why=decision_detail_ar(t, contracts),
            action=_trim_action(t),
            route="/contracts",
        )
    else:
        out["knowledge"] = None

    if vacant:
        out["guides"] = _verdict(
            headline=f"{len(vacant)} وحدة شاغرة تحتاج تسويق.",
            why="، ".join(p.get("name", "") for p in vacant[:3]),
            action="افتح المحفظة",
            route="/portfolio",
        )
    else:
        out["guides"] = None

    if properties:
        out["owner"] = _verdict(
            headline="راجع أولويات المحفظة.",
            why=(
                f"{'عالج ' + str(len(urgent)) + ' قراراً عاجلاً' if urgent else 'لا قرارات عاجلة'} · "
                f"{'راجع ' + str(len(expiring)) + ' تجديداً' if expiring else 'التجديدات تحت السيطرة'}."
            ),
            action="افتح لوحة المالك",
            route="/owner",
        )
    else:
        out["owner"] = None

    return out
