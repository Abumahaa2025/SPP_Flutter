"""Map Koil reasoning → executive report sections + smart decisions."""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

Lang = Literal["ar", "en"]


def _fmt_evidence(evidence: Optional[List[Any]], lang: Lang = "ar") -> str:
    parts = [str(x).strip() for x in (evidence or []) if str(x).strip()]
    if not parts:
        return ""
    prefix = "دليل" if lang == "ar" else "Evidence"
    return f"{prefix}: " + " · ".join(parts[:6])


def _item(label: str, value: str, evidence: Optional[List[Any]] = None, lang: Lang = "ar") -> dict:
    ev_list = [str(x).strip() for x in (evidence or []) if str(x).strip()]
    # value includes evidence so older APKs still show it in the report row
    display = value
    ev_line = _fmt_evidence(ev_list, lang)
    if ev_line:
        display = f"{value}\n{ev_line}"
    out: Dict[str, Any] = {"label": label, "value": display}
    if ev_list:
        out["evidence"] = ev_list[:8]
    return out


def _sec(key: str, title: str, items: List[dict]) -> dict:
    return {"key": key, "title": title, "items": items}


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
