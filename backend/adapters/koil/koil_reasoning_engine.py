"""Koil Reasoning Engine v1 — rule-based inference from Property Knowledge."""

from __future__ import annotations

from typing import Dict, List, Literal

from adapters.upload_analysis.intake_classifier import month_label

Lang = Literal["ar", "en"]

PRIORITY = {"critical": 0, "high": 1, "medium": 2, "low": 3, "improvement": 4}


def _fact(text: str, evidence: List[str], fact_id: str) -> dict:
    return {"id": fact_id, "text": text, "evidence": evidence}


def _risk(severity: str, text: str, evidence: List[str], risk_id: str) -> dict:
    return {"id": risk_id, "severity": severity, "text": text, "evidence": evidence}


def _rec(priority: str, action: str, reason: str, evidence: List[str], rec_id: str, action_key: str = "") -> dict:
    return {
        "id": rec_id,
        "priority": priority,
        "action": action,
        "reason": reason,
        "evidence": evidence,
        "action_key": action_key,
    }


def run_koil_reasoning(knowledge: dict, lang: Lang = "ar") -> dict:
    """Derive what/why/risks/recommendations from Property Knowledge — no static filler."""
    knowledge = knowledge or {}
    ar = lang == "ar"
    what: List[dict] = []
    why: List[dict] = []
    risks: List[dict] = []
    recs: List[dict] = []

    units = knowledge.get("units") or {}
    late = knowledge.get("late") or {}
    lc = knowledge.get("lifecycle") or {}
    coll = knowledge.get("collection") or {}
    contracts = knowledge.get("contracts") or {}
    quality = knowledge.get("quality") or {}

    for i, ch in enumerate(lc.get("tenant_changes") or []):
        unit = ch.get("unit") or "—"
        m = int(ch.get("month") or 0)
        y = int(ch.get("year") or 0)
        ml = f"{month_label(m, lang)} {y}".strip() if m else "—"
        if ch.get("type") == "replacement":
            txt = (
                f"تغيّر مستأجر الوحدة {unit}: {ch.get('from_tenant')} ← {ch.get('to_tenant')} في {ml}"
                if ar
                else f"Unit {unit} tenant changed: {ch.get('from_tenant')} → {ch.get('to_tenant')} ({ml})"
            )
            ev = [f"unit={unit}", f"month={m}/{y}", f"from={ch.get('from_tenant')}", f"to={ch.get('to_tenant')}"]
        elif ch.get("type") == "arrival":
            txt = (
                f"دخل مستأجر جديد: {ch.get('to_tenant')} — الوحدة {unit} ({ml})"
                if ar
                else f"New tenant {ch.get('to_tenant')} — unit {unit} ({ml})"
            )
            ev = [f"unit={unit}", f"tenant={ch.get('to_tenant')}", f"month={m}/{y}"]
        else:
            txt = (
                f"غادر مستأجر الوحدة {unit}: {ch.get('from_tenant')} ({ml})"
                if ar
                else f"Tenant departed unit {unit}: {ch.get('from_tenant')} ({ml})"
            )
            ev = [f"unit={unit}", f"tenant={ch.get('from_tenant')}", f"month={m}/{y}"]
        what.append(_fact(txt, ev, f"change_{i}"))

    late_n = int(late.get("tenant_count") or 0)
    if late_n:
        total_u = late.get("total_unpaid") or 0
        txt = (
            f"يوجد {late_n} مستأجر{'ين' if late_n > 1 else ''} متأخر — إجمالي {total_u:,.0f} ر.س"
            if ar
            else f"{late_n} late tenant(s) — total {total_u:,.0f} SAR"
        )
        what.append(_fact(txt, [f"late_count={late_n}", f"total_unpaid={total_u}"], "late_summary"))

    by_month = coll.get("by_month") or []
    if len(by_month) >= 2:
        prev, cur = by_month[-2], by_month[-1]
        drop = prev.get("collection_rate_pct", 0) - cur.get("collection_rate_pct", 0)
        if drop >= 5:
            ml = f"{month_label(cur['month'], lang)} {cur['year']}"
            txt = (
                f"انخفض التحصيل في {ml}: {prev.get('collection_rate_pct')}% → {cur.get('collection_rate_pct')}%"
                if ar
                else f"Collection dropped in {ml}: {prev.get('collection_rate_pct')}% → {cur.get('collection_rate_pct')}%"
            )
            what.append(
                _fact(
                    txt,
                    [
                        f"month={cur['month']}/{cur['year']}",
                        f"prev_rate={prev.get('collection_rate_pct')}",
                        f"cur_rate={cur.get('collection_rate_pct')}",
                        f"late_in_month={cur.get('late_count')}",
                    ],
                    "collection_drop",
                )
            )

    if int(lc.get("departed_count") or 0):
        n = lc["departed_count"]
        what.append(
            _fact(
                f"غادر {n} مستأجر{'ين' if n > 1 else ''} خلال الفترة المحلّلة" if ar else f"{n} tenant(s) departed",
                [f"departed_count={n}"],
                "departures",
            )
        )

    if int(units.get("needs_review_count") or 0):
        n = units["needs_review_count"]
        what.append(
            _fact(
                f"يوجد {n} وحدة/سجل يحتاج مراجعة بيانات" if ar else f"{n} unit(s) need data review",
                list(quality.get("warnings") or [])[:3],
                "review_needed",
            )
        )

    if not what:
        what.append(
            _fact(
                "التحصيل مستقر ولا تغيّرات حرجة مكتشفة في الفترة" if ar else "Stable period — no critical changes detected",
                [f"months={len(by_month)}"],
                "stable",
            )
        )

    for lt in late.get("tenants") or []:
        if lt.get("consecutive_late", 0) >= 2:
            txt = (
                f"{lt.get('tenant')} — {lt.get('unit')}: متأخر {lt.get('consecutive_late')} أشهر متتالية (تراكم {lt.get('total_unpaid'):,.0f} ر.س)"
                if ar
                else f"{lt.get('tenant')} — {lt.get('unit')}: {lt.get('consecutive_late')} consecutive late months"
            )
            why.append(_fact(txt, [f"unit={lt.get('unit')}", f"consecutive={lt.get('consecutive_late')}"], f"why_consec_{lt.get('unit')}"))
        if lt.get("has_partial"):
            txt = (
                f"{lt.get('tenant')} — {lt.get('unit')}: سداد جزئي في بعض الأشهر — قد يكون لمتأخرات قديمة"
                if ar
                else f"{lt.get('tenant')} — {lt.get('unit')}: partial payments detected"
            )
            why.append(_fact(txt, [f"unit={lt.get('unit')}", "status=partial"], f"why_partial_{lt.get('unit')}"))

    for ch in lc.get("tenant_changes") or []:
        if ch.get("type") == "replacement":
            why.append(
                _fact(
                    f"الوحدة {ch.get('unit')}: تغيّر المستأجر أثناء الفترة — راجع العقد والتحصيل السابق"
                    if ar
                    else f"Unit {ch.get('unit')}: mid-period tenant change",
                    [f"unit={ch.get('unit')}", f"from={ch.get('from_tenant')}", f"to={ch.get('to_tenant')}"],
                    f"why_change_{ch.get('unit')}",
                )
            )

    for row in contracts.get("missing_contract") or []:
        why.append(
            _fact(
                f"الوحدة {row.get('unit')} ({row.get('tenant')}): بيانات العقد غير مكتملة"
                if ar
                else f"Unit {row.get('unit')}: incomplete contract data",
                [f"unit={row.get('unit')}", "contract=missing"],
                f"why_nocontract_{row.get('unit')}",
            )
        )

    if quality.get("parse_errors"):
        why.append(
            _fact(
                f"بعض الملفات لم تُقرأ بالكامل ({len(quality['parse_errors'])} خطأ)" if ar else "Some files had parse errors",
                [str(e) for e in quality["parse_errors"][:2]],
                "why_parse",
            )
        )

    for lt in sorted(late.get("tenants") or [], key=lambda x: (-x.get("consecutive_late", 0), -x.get("total_unpaid", 0))):
        consec = lt.get("consecutive_late") or lt.get("late_month_count") or 0
        sev = "critical" if consec >= 4 else ("high" if consec >= 2 else "medium")
        if consec >= 2 or lt.get("total_unpaid", 0) >= 10000:
            txt = (
                f"{lt.get('tenant')} — {lt.get('unit')}: متأخر {consec} أشهر · {lt.get('total_unpaid'):,.0f} ر.س"
                if ar
                else f"{lt.get('tenant')} — unit {lt.get('unit')}: {consec} late months"
            )
            risks.append(_risk(sev, txt, [f"unit={lt.get('unit')}", f"months={consec}", f"amount={lt.get('total_unpaid')}"], f"risk_late_{lt.get('unit')}"))

        if not lt.get("phone"):
            risks.append(
                _risk(
                    "high",
                    f"متأخر بدون جوال: {lt.get('tenant')} — {lt.get('unit')}" if ar else f"Late tenant without phone: {lt.get('unit')}",
                    [f"unit={lt.get('unit')}", "phone=missing"],
                    f"risk_nophone_{lt.get('unit')}",
                )
            )
        if not lt.get("contract"):
            risks.append(
                _risk(
                    "medium",
                    f"متأخر بدون رقم عقد: {lt.get('tenant')} — {lt.get('unit')}" if ar else f"Late tenant without contract: {lt.get('unit')}",
                    [f"unit={lt.get('unit')}", "contract=missing"],
                    f"risk_nocontract_{lt.get('unit')}",
                )
            )

    if units.get("needs_review_count"):
        risks.append(
            _risk(
                "medium",
                f"{units['needs_review_count']} وحدة بأسماء عامة — هوية غير مؤكدة 100%" if ar else "Ambiguous unit labels detected",
                list(quality.get("warnings") or [])[:2],
                "risk_ambiguous_units",
            )
        )

    if quality.get("files_without_content"):
        risks.append(
            _risk(
                "high",
                f"{len(quality['files_without_content'])} ملف لم يُقرأ — البيانات ناقصة" if ar else "Unread files — incomplete data",
                [str(x.get("fileName") or x.get("file_name") or x) for x in quality["files_without_content"][:3]],
                "risk_unread_files",
            )
        )

    if not risks:
        risks.append(_risk("low", "لا مخاطر حرجة مكتشفة في هذه الدفعة" if ar else "No critical risks in this batch", [], "risk_none"))

    for lt in sorted(late.get("tenants") or [], key=lambda x: (-x.get("consecutive_late", 0), -x.get("total_unpaid", 0)))[:8]:
        unit = lt.get("unit")
        tenant = lt.get("tenant")
        phone = lt.get("phone")
        consec = lt.get("consecutive_late") or lt.get("late_month_count") or 0
        pri = "critical" if consec >= 4 else ("high" if consec >= 2 else "medium")
        if phone:
            recs.append(
                _rec(
                    pri,
                    f"تواصل مع {tenant} — الوحدة {unit} ({phone})" if ar else f"Contact {tenant} — unit {unit}",
                    f"متأخر {consec} أشهر · {lt.get('total_unpaid'):,.0f} ر.س" if ar else f"{consec} late months",
                    [f"phone={phone}", f"unit={unit}"],
                    f"rec_contact_{unit}",
                    "whatsapp:remind",
                )
            )
        else:
            recs.append(
                _rec(
                    pri,
                    f"أضف رقم جوال — {tenant} · الوحدة {unit}" if ar else f"Add phone for {tenant} — unit {unit}",
                    "لا يمكن التواصل تلقائيًا بدون جوال" if ar else "Cannot automate outreach without phone",
                    [f"unit={unit}"],
                    f"rec_addphone_{unit}",
                    "edit:tenant",
                )
            )
        if not lt.get("contract"):
            recs.append(
                _rec(
                    "medium",
                    f"راجع/rقم العقد — {tenant} · الوحدة {unit}" if ar else f"Review contract — unit {unit}",
                    "بيانات العقد ناقصة للمتأخر" if ar else "Missing contract on late tenant",
                    [f"unit={unit}"],
                    f"rec_contract_{unit}",
                    "page:contracts",
                )
            )

    if units.get("needs_review_count"):
        recs.append(
            _rec(
                "medium",
                "راجع ترقيم الوحدات ذات الأسماء العامة (محل/مكتب…)" if ar else "Review ambiguous commercial unit labels",
                "هوية الوحدة غير مؤكدة بالكامل" if ar else "Unit identity needs confirmation",
                list(quality.get("warnings") or [])[:1],
                "rec_review_units",
                "import:review",
            )
        )

    if lc.get("departed_count"):
        recs.append(
            _rec(
                "medium",
                f"راجع {lc.get('departed_count')} وحدة بعد مغادرة المستأجر" if ar else "Review units after tenant departures",
                "تأكد من التسليم والصيانة قبل مستأجر جديد" if ar else "Verify handover and maintenance",
                [f"departed={lc.get('departed_count')}"],
                "rec_departed",
                "page:units",
            )
        )

    recs.sort(key=lambda r: PRIORITY.get(r.get("priority") or "low", 9))
    risks.sort(key=lambda r: PRIORITY.get(r.get("severity") or "low", 9))

    meta = knowledge.get("meta") or {}
    period = ""
    if meta.get("period_from") and meta.get("period_to"):
        period = f"{meta['period_from']} → {meta['period_to']}"
    top_rec = recs[0]["action"] if recs else ("لا إجراء عاجل" if ar else "No urgent action")
    brief = (
        f"كويل · {period}: {what[0]['text'] if what else '—'}. الأولوية: {top_rec}"
        if ar
        else f"Koil · {period}: {what[0]['text'] if what else '—'}. Priority: {top_rec}"
    )

    return {
        "version": "koil-reasoning-v1",
        "brief": brief,
        "what_happened": what[:12],
        "why": why[:10],
        "risks": risks[:10],
        "recommendations": recs[:12],
        "confidence": _reasoning_confidence(knowledge),
    }


def _reasoning_confidence(knowledge: dict) -> float:
    score = 85.0
    q = knowledge.get("quality") or {}
    score -= len(q.get("parse_errors") or []) * 8
    score -= len(q.get("files_without_content") or []) * 10
    if not (knowledge.get("late") or {}).get("tenants"):
        score -= 5
    if int((knowledge.get("units") or {}).get("total") or 0) <= 0:
        score -= 20
    return round(max(40.0, min(98.0, score)), 1)
