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


def build_executive_brief(
    knowledge: dict,
    reasoning: dict,
    gate: Optional[dict] = None,
    lang: Lang = "ar",
) -> dict:
    """One-screen owner brief — derived only from Property Knowledge + Koil reasoning."""
    knowledge = knowledge or {}
    reasoning = reasoning or {}
    gate = gate or {}
    ar = lang == "ar"

    units = knowledge.get("units") or {}
    late = knowledge.get("late") or {}
    coll = knowledge.get("collection") or {}
    maint = knowledge.get("maintenance") or {}
    lc = knowledge.get("lifecycle") or {}
    meta = knowledge.get("meta") or {}
    quality = knowledge.get("quality") or {}
    contracts = knowledge.get("contracts") or {}

    total_units = int(units.get("total") or 0)
    late_n = int(late.get("tenant_count") or 0)
    unpaid = float(late.get("total_unpaid") or coll.get("total_unpaid") or 0)
    collected = float(coll.get("total_collected") or 0)
    expected = float(coll.get("total_expected") or 0)
    rate = round(collected / expected * 100) if expected else 0
    maint_total = float(maint.get("total") or 0)
    maint_count = int(maint.get("count") or len(maint.get("entries") or []))
    period = ""
    if meta.get("period_from") and meta.get("period_to"):
        period = f"{meta['period_from']} → {meta['period_to']}"

    if gate.get("decision_status") == "blocked_for_review":
        status = (
            f"العقار يحتاج مراجعة قبل أي إجراء تحصيل — اكتُشفت تعارضات في البيانات ({period or 'الفترة'})."
            if ar
            else f"Property needs review before collection actions — data conflicts found ({period or 'period'})."
        )
    elif late_n == 0 and unpaid <= 0:
        status = (
            f"الوضع مستقر خلال {period or 'الفترة'}: لا متأخرات مؤكدة على {total_units} وحدة."
            if ar
            else f"Stable through {period or 'the period'}: no confirmed arrears across {total_units} units."
        )
    elif late_n <= 2:
        status = (
            f"تحصيل جيد عمومًا ({rate}%) مع {late_n} حالة متأخرات مؤكدة تحتاج متابعة."
            if ar
            else f"Collection mostly healthy ({rate}%) with {late_n} confirmed arrears to follow up."
        )
    else:
        status = (
            f"ضغط تحصيل: {late_n} مستأجرين بمتأخرات مؤكدة بقيمة {unpaid:,.0f} ر.س خلال {period or 'الفترة'}."
            if ar
            else f"Collection pressure: {late_n} tenants with confirmed arrears totaling {unpaid:,.0f} SAR."
        )

    risks = sorted(
        reasoning.get("risks") or [],
        key=lambda r: {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(str(r.get("severity") or "medium"), 9),
    )
    recs = sorted(
        reasoning.get("recommendations") or [],
        key=lambda r: {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(str(r.get("priority") or "medium"), 9),
    )
    top_risk = (risks[0].get("text") if risks else None) or (
        "لا مخاطر مؤكدة الآن" if ar else "No confirmed risks now"
    )
    top_action = (recs[0].get("action") if recs else None) or (
        "لا إجراء عاجل — راجع الملخص فقط" if ar else "No urgent action — review the brief only"
    )

    key_numbers = []
    if total_units:
        key_numbers.append(
            {
                "label": "الوحدات" if ar else "Units",
                "value": str(total_units),
            }
        )
    key_numbers.append(
        {
            "label": "التحصيل" if ar else "Collection",
            "value": f"{rate}%" if expected else "—",
        }
    )
    if unpaid > 0 or late_n:
        key_numbers.append(
            {
                "label": "متأخرات مؤكدة" if ar else "Confirmed arrears",
                "value": f"{unpaid:,.0f} ر.س" if ar else f"{unpaid:,.0f} SAR",
            }
        )
    elif maint_total > 0:
        key_numbers.append(
            {
                "label": "صيانة/مصروفات" if ar else "Maintenance",
                "value": f"{maint_total:,.0f} ر.س" if ar else f"{maint_total:,.0f} SAR",
            }
        )
    key_numbers = key_numbers[:3]

    needs_review: List[str] = []
    for c in (gate.get("conflicts") or [])[:4]:
        if c.get("detail"):
            needs_review.append(str(c["detail"]))
    for a in (reasoning.get("what_happened") or []):
        pass
    # Ambiguities / quality
    for w in (quality.get("warnings") or [])[:3]:
        needs_review.append(str(w))
    miss_p = len((contracts.get("missing_phone") or []))
    miss_c = len((contracts.get("missing_contract") or []))
    if miss_p:
        needs_review.append(
            f"{miss_p} مستأجر بلا جوال ظاهر" if ar else f"{miss_p} tenants missing phone"
        )
    if miss_c:
        needs_review.append(
            f"{miss_c} مستأجر بلا رقم عقد ظاهر" if ar else f"{miss_c} tenants missing contract"
        )
    # Unknown payment months aren't in PK directly — skip
    if not needs_review:
        needs_review.append("لا يوجد ما يحتاج مراجعتك الآن" if ar else "Nothing needs your review now")

    conf = float(reasoning.get("confidence") or 80)
    gate_status = str(gate.get("decision_status") or "ok")
    level = _confidence_level(conf, gate_status, lang)

    return {
        "property_status": status,
        "top_risk": top_risk,
        "top_action": top_action,
        "key_numbers": key_numbers,
        "confidence": conf,
        "confidence_level": level,
        "needs_review": needs_review[:5],
        "decision_status": gate_status,
        "period": period,
        "meta": {
            "units": total_units,
            "late_tenants": late_n,
            "maintenance_count": maint_count,
            "maintenance_total": maint_total,
            "collection_rate_pct": rate,
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
