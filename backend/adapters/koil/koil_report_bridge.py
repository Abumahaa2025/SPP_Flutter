"""Map Koil reasoning → executive report sections + smart decisions."""

from __future__ import annotations

import re
from typing import Any, Dict, List, Literal, Optional

Lang = Literal["ar", "en"]


def humanize_evidence(evidence: Optional[List[Any]], lang: Lang = "ar") -> List[str]:
    """Turn technical tokens into property-manager language for the owner."""
    ar = lang == "ar"
    out: List[str] = []
    for raw in evidence or []:
        s = str(raw).strip()
        if not s:
            continue
        # Already human Arabic source lines
        if s.startswith("المصدر:") or s.lower().startswith("source:"):
            out.append(s)
            continue
        s = re.sub(r"\bunit=([^\s,|]+)", r"الوحدة \1" if ar else r"unit \1", s, flags=re.I)
        s = re.sub(r"\btenant=([^\s,|]+)", r"المستأجر \1" if ar else r"tenant \1", s, flags=re.I)
        s = re.sub(
            r"\bmonth=(\d{1,2})/(\d{4})",
            lambda m: f"شهر {m.group(1)}/{m.group(2)}" if ar else f"month {m.group(1)}/{m.group(2)}",
            s,
            flags=re.I,
        )
        s = re.sub(r"\bconsecutive=\d+", "", s, flags=re.I)
        s = re.sub(r"\bfrom=([^\s,|]+)", r"من \1" if ar else r"from \1", s, flags=re.I)
        s = re.sub(r"\bto=([^\s,|]+)", r"إلى \1" if ar else r"to \1", s, flags=re.I)
        s = re.sub(r"\bdeparted=\d+", "", s, flags=re.I)
        s = re.sub(r"[·|]{2,}", "·", s)
        s = re.sub(r"\s{2,}", " ", s).strip(" ·|")
        if s:
            out.append(s)
    return out[:8]


def _fmt_evidence(evidence: Optional[List[Any]], lang: Lang = "ar") -> str:
    parts = humanize_evidence(evidence, lang)
    if not parts:
        return ""
    prefix = "المصدر" if lang == "ar" else "Source"
    return f"{prefix}: " + " · ".join(parts[:6])


def _item(label: str, value: str, evidence: Optional[List[Any]] = None, lang: Lang = "ar") -> dict:
    ev_list = humanize_evidence(evidence, lang)
    display = value
    ev_line = _fmt_evidence(ev_list, lang)
    if ev_line:
        display = f"{value}\n{ev_line}"
    out: Dict[str, Any] = {"label": label, "value": display}
    if ev_list:
        out["evidence"] = ev_list[:8]
    return out


def _sec(key: str, title: str, items: List[dict], summary: str = "") -> dict:
    out: Dict[str, Any] = {"key": key, "title": title, "items": items}
    if summary:
        out["summary"] = summary
    return out


def _confidence_level(score: float, gate_status: str, lang: Lang) -> str:
    ar = lang == "ar"
    if gate_status == "blocked_for_review":
        return "يحتاج مراجعتك" if ar else "Needs your review"
    if score >= 85:
        return "مؤكد" if ar else "Confirmed"
    if score >= 70:
        return "مرجح" if ar else "Likely"
    return "يحتاج مراجعتك" if ar else "Needs your review"


def _status_tier(
    late_n: int,
    unpaid: float,
    rate: float,
    gate_blocked: bool,
    review_n: int,
) -> str:
    """جيدة | تحتاج متابعة | حرجة — owner-facing only."""
    if gate_blocked:
        return "تحتاج متابعة"
    if late_n >= 5 or unpaid >= 30_000 or (rate and rate < 70):
        return "حرجة"
    if late_n >= 1 or unpaid > 0 or review_n >= 2 or (rate and rate < 85):
        return "تحتاج متابعة"
    return "جيدة"


def build_executive_brief(
    knowledge: dict,
    reasoning: dict,
    gate: Optional[dict] = None,
    lang: Lang = "ar",
    metrics: Optional[dict] = None,
) -> dict:
    """Owner decision brief — Property Knowledge only. No client-specific rules."""
    knowledge = knowledge or {}
    reasoning = reasoning or {}
    gate = gate or {}
    metrics = metrics or {}
    ar = lang == "ar"

    units = knowledge.get("units") or {}
    late = knowledge.get("late") or {}
    coll = knowledge.get("collection") or {}
    maint = knowledge.get("maintenance") or {}
    lc = knowledge.get("lifecycle") or {}
    meta = knowledge.get("meta") or {}
    quality = knowledge.get("quality") or {}
    contracts = knowledge.get("contracts") or {}

    total_units = int(units.get("total") or metrics.get("units") or 0)
    active = int(units.get("active_count") or metrics.get("occupied_units") or 0)
    occupancy = (
        round(float(metrics.get("occupancy_pct") or 0))
        if metrics.get("occupancy_pct") is not None
        else (round(active / total_units * 100) if total_units else 0)
    )
    late_n = int(late.get("tenant_count") or metrics.get("late_tenants") or 0)
    unpaid = float(late.get("total_unpaid") or coll.get("total_unpaid") or metrics.get("late_value") or 0)
    collected = float(coll.get("total_collected") or metrics.get("collected") or 0)
    expected = float(coll.get("total_expected") or metrics.get("total_revenue_annual") or 0)
    rate = int(metrics.get("collection_rate_pct") or 0) or (
        round(collected / expected * 100) if expected else 0
    )
    maint_total = float(maint.get("total") or metrics.get("total_expenses") or 0)
    maint_count = int(maint.get("count") or len(maint.get("entries") or []) or 0)
    expired_n = int(metrics.get("contracts_expired") or 0)
    expiring_n = int(metrics.get("contracts_expiring_soon") or 0)

    period = ""
    if meta.get("period_from") and meta.get("period_to"):
        period = f"{meta['period_from']} → {meta['period_to']}"

    gate_blocked = gate.get("decision_status") == "blocked_for_review"

    # --- Needs review (unit-first, cautious) ---
    needs_review: List[str] = []
    for c in (gate.get("conflicts") or [])[:3]:
        if c.get("detail"):
            needs_review.append(str(c["detail"]))
    for ch in (lc.get("tenant_changes") or [])[:4]:
        unit = ch.get("unit") or "—"
        needs_review.append(
            f"الوحدة {unit}: يحتمل وجود تغيير ويحتاج مراجعتك"
            if ar
            else f"Unit {unit}: possible change — needs your review"
        )
    for row in (contracts.get("missing_phone") or [])[:2]:
        needs_review.append(
            f"الوحدة {row.get('unit')}: بيانات الجوال تحتاج مراجعة"
            if ar
            else f"Unit {row.get('unit')}: phone data needs review"
        )
    for row in (contracts.get("missing_contract") or [])[:2]:
        needs_review.append(
            f"الوحدة {row.get('unit')}: بيانات العقد تحتاج مراجعة"
            if ar
            else f"Unit {row.get('unit')}: contract data needs review"
        )
    for w in (quality.get("warnings") or [])[:2]:
        needs_review.append(str(w))
    # Dedupe preserve order
    seen: set = set()
    uniq_review: List[str] = []
    for line in needs_review:
        if line in seen:
            continue
        seen.add(line)
        uniq_review.append(line)
    needs_review = uniq_review[:5]
    if not needs_review:
        needs_review = ["لا يوجد ما يحتاج مراجعتك الآن" if ar else "Nothing needs your review now"]

    status_label = _status_tier(late_n, unpaid, float(rate), gate_blocked, len([x for x in needs_review if "لا يوجد" not in x and "Nothing" not in x]))
    if ar:
        status_map = {
            "جيدة": f"حالة العقار: جيدة — التحصيل {rate}% ولا ضغط تحصيل مؤكد.",
            "تحتاج متابعة": f"حالة العقار: تحتاج متابعة — راقب المتأخرات المؤكدة والمراجعات.",
            "حرجة": f"حالة العقار: حرجة — أولوية التحصيل والمراجعة قبل أي قرار آخر.",
        }
        if gate_blocked:
            property_status = "حالة العقار: تحتاج متابعة — تعارض في البيانات يمنع توصيات التحصيل الآلية."
        else:
            property_status = status_map.get(status_label, status_map["تحتاج متابعة"])
        if period:
            property_status = f"{property_status} ({period})"
    else:
        property_status = f"Status: {status_label}" + (f" ({period})" if period else "")

    # --- Top 3 decisions today ---
    decisions: List[str] = []
    for lt in (late.get("tenants") or [])[:2]:
        name = lt.get("tenant") or "—"
        unit = lt.get("unit") or "—"
        phone = (lt.get("phone") or "").strip()
        if phone:
            decisions.append(
                f"تواصل مع المستأجر ({name}) — الوحدة {unit}"
                if ar
                else f"Contact tenant ({name}) — unit {unit}"
            )
        else:
            decisions.append(
                f"راجع بيانات التواصل للمستأجر ({name}) — الوحدة {unit}"
                if ar
                else f"Review contact for ({name}) — unit {unit}"
            )
    if expiring_n or expired_n:
        decisions.append(
            f"راجع العقود ({expired_n} منتهية · {expiring_n} قريبة من الانتهاء)"
            if ar
            else f"Review contracts ({expired_n} expired · {expiring_n} expiring)"
        )
    if maint_count > 0 and maint_total > 0:
        decisions.append(
            f"راجع الصيانة/المصروفات ({maint_count} سجل · {maint_total:,.0f} ر.س) واعتمد ما يلزم"
            if ar
            else f"Review maintenance ({maint_count} rows · {maint_total:,.0f} SAR) and approve as needed"
        )
    for r in sorted(
        reasoning.get("recommendations") or [],
        key=lambda x: {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(str(x.get("priority") or "medium"), 9),
    ):
        action = (r.get("action") or "").strip()
        if action and action not in decisions:
            decisions.append(action)
        if len(decisions) >= 3:
            break
    decisions = decisions[:3]
    if not decisions:
        decisions = [
            "لا إجراء عاجل اليوم — راجع الأرقام فقط" if ar else "No urgent action today — review figures only"
        ]

    key_numbers = [
        {"label": "الوحدات" if ar else "Units", "value": str(total_units or "—")},
        {"label": "نسبة الإشغال" if ar else "Occupancy", "value": f"{occupancy}%"},
        {"label": "التحصيل" if ar else "Collection", "value": f"{rate}%" if expected or rate else "—"},
        {
            "label": "المتأخرات المؤكدة" if ar else "Confirmed arrears",
            "value": f"{unpaid:,.0f} ر.س" if ar else f"{unpaid:,.0f} SAR",
        },
        {
            "label": "الصيانة" if ar else "Maintenance",
            "value": f"{maint_count} · {maint_total:,.0f}" if maint_count else ("—" if not maint_total else f"{maint_total:,.0f}"),
        },
        {
            "label": "العقود المنتهية" if ar else "Expired contracts",
            "value": str(expired_n),
        },
    ]

    conf = float(reasoning.get("confidence") or 80)
    if gate_blocked:
        conf = min(conf, 60)
    gate_status = str(gate.get("decision_status") or "ok")
    level = _confidence_level(conf, gate_status, lang)

    # Keep legacy fields for older clients
    top_action = decisions[0] if decisions else "—"
    top_risk = (
        (f"{late_n} متأخر مؤكد · {unpaid:,.0f} ر.س" if late_n else "لا متأخرات مؤكدة")
        if ar
        else (f"{late_n} confirmed late · {unpaid:,.0f}" if late_n else "No confirmed arrears")
    )

    return {
        "title": "تقرير كويل التنفيذي" if ar else "Koil executive report",
        "status_label": status_label,
        "property_status": property_status,
        "decisions_today": decisions,
        "key_numbers": key_numbers,
        "needs_review": needs_review,
        "confidence": conf,
        "confidence_level": level,
        "decision_status": gate_status,
        "period": period,
        "top_risk": top_risk,
        "top_action": top_action,
        "meta": {
            "units": total_units,
            "occupancy_pct": occupancy,
            "late_tenants": late_n,
            "maintenance_count": maint_count,
            "maintenance_total": maint_total,
            "collection_rate_pct": rate,
            "contracts_expired": expired_n,
        },
    }


def _labels(lang: Lang) -> dict:
    if lang == "ar":
        return {
            "koil_brief": "كويل — الملخص التنفيذي",
            "koil_what": "ماذا حدث؟",
            "koil_why": "لماذا استنتجت ذلك؟",
            "koil_risks": "المخاطر حسب الأولوية",
            "koil_recommendations": "التوصيات العملية",
        }
    return {
        "koil_brief": "Koil — Executive brief",
        "koil_what": "What happened?",
        "koil_why": "Why did I conclude that?",
        "koil_risks": "Risks by priority",
        "koil_recommendations": "Practical recommendations",
    }


_SEV_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
_SEV_AR = {
    "critical": "حرج",
    "high": "مرتفع",
    "medium": "متوسط",
    "low": "منخفض",
}
_PRI_AR = {
    "critical": "حرج",
    "high": "مهم",
    "medium": "متوسط",
    "low": "لاحقاً",
    "urgent": "عاجل",
}


def koil_sections(reasoning: dict, lang: Lang = "ar") -> List[dict]:
    reasoning = reasoning or {}
    labels = _labels(lang)
    sections: List[dict] = []

    brief_items = [
        _item("كويل" if lang == "ar" else "Koil", reasoning.get("brief") or "—", lang=lang),
        _item(
            "ثقة الاستنتاج" if lang == "ar" else "Reasoning confidence",
            f"{reasoning.get('confidence', '—')}%",
            lang=lang,
        ),
    ]
    sections.append(_sec("koil_brief", labels["koil_brief"], brief_items))

    what_items = [
        _item(
            f"#{i + 1}",
            f.get("text") or "—",
            evidence=f.get("evidence"),
            lang=lang,
        )
        for i, f in enumerate(reasoning.get("what_happened") or [])
    ] or [_item("—", "—", lang=lang)]
    sections.append(_sec("koil_what", labels["koil_what"], what_items))

    why_items = [
        _item(
            f"#{i + 1}",
            f.get("text") or "—",
            evidence=f.get("evidence"),
            lang=lang,
        )
        for i, f in enumerate(reasoning.get("why") or [])
    ] or [
        _item(
            "—",
            "لا أسباب إضافية مكتشفة" if lang == "ar" else "No additional causes",
            lang=lang,
        )
    ]
    sections.append(_sec("koil_why", labels["koil_why"], why_items))

    risks = sorted(
        reasoning.get("risks") or [],
        key=lambda r: _SEV_ORDER.get(str(r.get("severity") or "medium"), 9),
    )
    risk_items = []
    for r in risks:
        sev = str(r.get("severity") or "—")
        sev_label = _SEV_AR.get(sev, sev) if lang == "ar" else sev
        risk_items.append(
            _item(
                f"[{sev_label}]",
                r.get("text") or "—",
                evidence=r.get("evidence"),
                lang=lang,
            )
        )
    if not risk_items:
        risk_items = [_item("—", "—", lang=lang)]
    sections.append(_sec("koil_risks", labels["koil_risks"], risk_items))

    recs = sorted(
        reasoning.get("recommendations") or [],
        key=lambda r: _SEV_ORDER.get(str(r.get("priority") or "medium"), 9),
    )
    rec_items = []
    for r in recs:
        pri = str(r.get("priority") or "—")
        pri_label = _PRI_AR.get(pri, pri) if lang == "ar" else pri
        action = r.get("action") or "—"
        reason = r.get("reason") or ""
        text = action if not reason else f"{action} — {reason}"
        rec_items.append(
            _item(
                f"[{pri_label}]",
                text,
                evidence=r.get("evidence"),
                lang=lang,
            )
        )
    if not rec_items:
        rec_items = [_item("—", "—", lang=lang)]
    sections.append(_sec("koil_recommendations", labels["koil_recommendations"], rec_items))

    return sections


def apply_koil_to_executive_report(
    executive_report: dict,
    reasoning: dict,
    lang: Lang = "ar",
    insert_after_keys: tuple = (
        "koil_understanding_ambiguities",
        "koil_understanding_relationships",
        "koil_understanding_files",
        "koil_understanding_summary",
        "files",
    ),
) -> dict:
    """Insert Koil reasoning sections into executive report (after understanding)."""
    executive_report = dict(executive_report or {})
    sections = list(executive_report.get("sections") or [])
    koil = koil_sections(reasoning, lang)

    insert_idx = 0
    for key in insert_after_keys:
        for i, sec in enumerate(sections):
            if sec.get("key") == key:
                insert_idx = max(insert_idx, i + 1)

    for i, ks in enumerate(koil):
        sections.insert(insert_idx + i, ks)

    executive_report["sections"] = sections
    return executive_report


def understanding_sections(understanding: dict, lang: Lang = "ar") -> List[dict]:
    understanding = understanding or {}
    if lang == "ar":
        titles = {
            "summary": "كويل — ماذا فهمت من الملفات؟",
            "files": "فهم كل ملف",
            "relationships": "كيف ربطت الأشهر؟",
            "ambiguities": "ما يحتاج مراجعتك",
        }
        mode_label = "وضع الفهم"
    else:
        titles = {
            "summary": "Koil — What I understood from the files",
            "files": "Per-file understanding",
            "relationships": "How months link",
            "ambiguities": "Needs your review",
        }
        mode_label = "Understanding mode"

    sections: List[dict] = []
    mode = understanding.get("mode") or "rules"
    mode_ar = (
        "ذكاء معزّز"
        if mode == "ai_enhanced" and lang == "ar"
        else ("AI enhanced" if mode == "ai_enhanced" else ("قواعد" if lang == "ar" else "Rules"))
    )

    summary_items = [
        _item("كويل" if lang == "ar" else "Koil", understanding.get("portfolio_summary") or "—", lang=lang),
        _item(mode_label, mode_ar, lang=lang),
        _item(
            "ثقة الفهم" if lang == "ar" else "Understanding confidence",
            f"{understanding.get('confidence', '—')}%",
            lang=lang,
        ),
    ]
    sections.append(_sec("koil_understanding_summary", titles["summary"], summary_items))

    file_items = []
    for f in understanding.get("files") or []:
        notes = " · ".join(f.get("notes") or []) or "—"
        file_items.append(
            _item(
                f.get("name") or "—",
                f"{f.get('understood_as') or '—'} ({f.get('confidence', '—')}%)",
                evidence=[notes] if notes and notes != "—" else None,
                lang=lang,
            )
        )
    if not file_items:
        file_items = [_item("—", "—", lang=lang)]
    sections.append(_sec("koil_understanding_files", titles["files"], file_items[:8]))

    rel_items = [
        _item(
            f"#{i + 1}",
            r.get("text") or "—",
            evidence=r.get("evidence"),
            lang=lang,
        )
        for i, r in enumerate(understanding.get("relationships") or [])
    ] or [
        _item(
            "—",
            "لا علاقات إضافية" if lang == "ar" else "No extra relationships",
            lang=lang,
        )
    ]
    sections.append(_sec("koil_understanding_relationships", titles["relationships"], rel_items[:8]))

    amb_items = [
        _item(
            "!" if a.get("needs_review") else "·",
            a.get("text") or "—",
            lang=lang,
        )
        for a in (understanding.get("ambiguities") or [])
    ] or [
        _item(
            "—",
            "لا غموض — جاهز للمراجعة" if lang == "ar" else "Clear — ready to review",
            lang=lang,
        )
    ]
    sections.append(_sec("koil_understanding_ambiguities", titles["ambiguities"], amb_items[:8]))

    return sections


def apply_understanding_to_executive_report(
    executive_report: dict,
    understanding: dict,
    lang: Lang = "ar",
    insert_before_key: str = "files",
) -> dict:
    """Place file-understanding block at the top of the report (before raw file list)."""
    executive_report = dict(executive_report or {})
    sections = list(executive_report.get("sections") or [])
    block = understanding_sections(understanding, lang)

    insert_idx = 0
    for i, sec in enumerate(sections):
        if sec.get("key") == insert_before_key:
            insert_idx = i
            break

    for i, us in enumerate(block):
        sections.insert(insert_idx + i, us)

    executive_report["sections"] = sections
    return executive_report


def reasoning_to_smart_decisions(reasoning: dict, lang: Lang = "ar") -> List[dict]:
    """Map Koil recommendations → smart_decisions for existing app UI."""
    out: List[dict] = []
    recs = sorted(
        reasoning.get("recommendations") or [],
        key=lambda r: _SEV_ORDER.get(str(r.get("priority") or "medium"), 9),
    )
    for r in recs:
        pri = r.get("priority") or "medium"
        if pri == "critical":
            sp = "critical"
        elif pri in ("high", "urgent"):
            sp = "high"
        elif pri == "medium":
            sp = "medium"
        else:
            sp = "low"
        evidence = [str(x) for x in (r.get("evidence") or []) if str(x).strip()]
        action = r.get("reason") or ""
        if evidence:
            prefix = "دليل" if lang == "ar" else "Evidence"
            action = f"{action} · {prefix}: " + " · ".join(evidence[:4]) if action else f"{prefix}: " + " · ".join(evidence[:4])
        out.append(
            {
                "id": r.get("id") or f"koil_{len(out)}",
                "priority": sp,
                "title": r.get("action") or "—",
                "action": action,
            }
        )
    return out[:8]
