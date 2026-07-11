"""Map Koil reasoning → executive report sections + smart decisions."""

from __future__ import annotations

from typing import Dict, List, Literal

Lang = Literal["ar", "en"]


def _item(label: str, value: str) -> dict:
    return {"label": label, "value": value}


def _sec(key: str, title: str, items: List[dict]) -> dict:
    return {"key": key, "title": title, "items": items}


def _labels(lang: Lang) -> dict:
    if lang == "ar":
        return {
            "koil_brief": "كويل — الملخص التنفيذي",
            "koil_what": "ماذا حدث؟",
            "koil_why": "لماذا حدث؟",
            "koil_risks": "ما المخاطر؟",
            "koil_recommendations": "ماذا أوصي اليوم؟",
        }
    return {
        "koil_brief": "Koil — Executive brief",
        "koil_what": "What happened?",
        "koil_why": "Why did it happen?",
        "koil_risks": "What are the risks?",
        "koil_recommendations": "What do I recommend today?",
    }


def koil_sections(reasoning: dict, lang: Lang = "ar") -> List[dict]:
    reasoning = reasoning or {}
    labels = _labels(lang)
    sections: List[dict] = []

    brief_items = [_item("كويل" if lang == "ar" else "Koil", reasoning.get("brief") or "—")]
    brief_items.append(
        _item(
            "ثقة الاستنتاج" if lang == "ar" else "Reasoning confidence",
            f"{reasoning.get('confidence', '—')}%",
        )
    )
    sections.append(_sec("koil_brief", labels["koil_brief"], brief_items))

    what_items = [
        _item(f"#{i + 1}", f.get("text") or "—")
        for i, f in enumerate(reasoning.get("what_happened") or [])
    ] or [_item("—", "—")]
    sections.append(_sec("koil_what", labels["koil_what"], what_items))

    why_items = [
        _item(f"#{i + 1}", f.get("text") or "—")
        for i, f in enumerate(reasoning.get("why") or [])
    ] or [_item("—", "لا أسباب إضافية مكتشفة" if lang == "ar" else "No additional causes")]
    sections.append(_sec("koil_why", labels["koil_why"], why_items))

    risk_items = []
    for r in reasoning.get("risks") or []:
        sev = r.get("severity") or "—"
        risk_items.append(_item(f"[{sev}]", r.get("text") or "—"))
    if not risk_items:
        risk_items = [_item("—", "—")]
    sections.append(_sec("koil_risks", labels["koil_risks"], risk_items))

    rec_items = []
    for r in reasoning.get("recommendations") or []:
        pri = r.get("priority") or "—"
        rec_items.append(
            _item(
                f"[{pri}] {r.get('action') or '—'}",
                r.get("reason") or "—",
            )
        )
    if not rec_items:
        rec_items = [_item("—", "—")]
    sections.append(_sec("koil_recommendations", labels["koil_recommendations"], rec_items))

    return sections


def apply_koil_to_executive_report(
    executive_report: dict,
    reasoning: dict,
    lang: Lang = "ar",
    insert_after_keys: tuple = ("files",),
) -> dict:
    """Prepend Koil reasoning sections to executive report (backend-only)."""
    executive_report = dict(executive_report or {})
    sections = list(executive_report.get("sections") or [])
    koil = koil_sections(reasoning, lang)

    insert_idx = 0
    for key in insert_after_keys:
        for i, sec in enumerate(sections):
            if sec.get("key") == key:
                insert_idx = i + 1
                break

    for i, ks in enumerate(koil):
        sections.insert(insert_idx + i, ks)

    executive_report["sections"] = sections
    return executive_report


def reasoning_to_smart_decisions(reasoning: dict, lang: Lang = "ar") -> List[dict]:
    """Map Koil recommendations → smart_decisions for existing app UI."""
    out: List[dict] = []
    for r in reasoning.get("recommendations") or []:
        pri = r.get("priority") or "medium"
        if pri == "critical":
            sp = "critical"
        elif pri in ("high", "urgent"):
            sp = "high"
        elif pri == "medium":
            sp = "medium"
        else:
            sp = "low"
        out.append(
            {
                "id": r.get("id") or f"koil_{len(out)}",
                "priority": sp,
                "title": r.get("action") or "—",
                "action": r.get("reason") or "",
            }
        )
    return out[:8]
