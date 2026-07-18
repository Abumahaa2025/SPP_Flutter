"""Gate Normalizer — Gap 5.

Normalizes the existing run_consistency_gate() output into ONE authoritative
persisted shape with entity-aware blocking. Applies the gate to all live
SPP intelligence outputs.

This module does NOT create a second consistency engine. It:
  1. Takes the raw gate output from run_consistency_gate() and normalizes it.
  2. Enriches conflicts with entity metadata (tenant_name, unit_label, etc.).
  3. Determines entity-level blocking (not global) so unrelated decisions
     remain executable.
  4. Applies the gate to unified decisions, briefing, verdicts, executive brain.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

GATE_VERSION = "consistency-gate-v1"

# Confidence caps per status.
CONFIDENCE_CAPS = {
    "ok": 100,
    "warning": 70,
    "blocked_for_review": 50,
}

# Severity mapping for conflict codes.
# "high" = blocks the affected entity's decisions
# "medium" = warning (lower confidence but doesn't block)
# "low" = informational
CONFLICT_SEVERITY: Dict[str, str] = {
    "low_classification_confidence": "high",  # source integrity → global
    "paid_marked_overdue": "high",
    "ledger_board_mismatch": "high",  # portfolio totals → global
    "monthly_summary_mismatch": "medium",
    "false_tenant_turnover": "high",
    # New Gap 5 conflict codes:
    "departed_and_active": "high",
    "duplicate_tenant_unit": "high",
    "collected_exceeds_due": "medium",
    "negative_value": "high",
    "duplicate_payment": "high",
    "closed_and_open_maintenance": "medium",
    "expired_and_active_contract": "high",
    "filename_only_lifecycle": "high",  # source integrity → global
    "unknown_tenant_unit_reference": "medium",
    "executive_total_mismatch": "high",  # portfolio totals → global
}

# Conflict codes that cause GLOBAL blocking (not entity-specific).
GLOBAL_CONFLICT_CODES = {
    "low_classification_confidence",
    "ledger_board_mismatch",
    "filename_only_lifecycle",
    "executive_total_mismatch",
}


def normalize_gate_output(
    raw_gate: Dict[str, Any],
    deep: Optional[Dict[str, Any]] = None,
    knowledge: Optional[Dict[str, Any]] = None,
    analysis_id: str = "",
) -> Dict[str, Any]:
    """Normalize the raw run_consistency_gate() output into the authoritative shape.

    Args:
        raw_gate: the dict returned by run_consistency_gate().
        deep: the analyze_statements_deep() output (for entity enrichment).
        knowledge: the property_knowledge dict (for tenant/unit lookup).
        analysis_id: the import's analysis_id.

    Returns:
        Dict matching the authoritative gate shape (section 2 of the spec).
    """
    raw_gate = raw_gate or {}
    deep = deep or {}
    knowledge = knowledge or {}
    raw_conflicts = raw_gate.get("conflicts") or []
    raw_status = raw_gate.get("decision_status") or "ok"

    # Normalize conflicts: enrich with entity metadata + severity.
    normalized_conflicts: List[Dict[str, Any]] = []
    for c in raw_conflicts:
        if not isinstance(c, dict):
            continue
        code = str(c.get("code") or "unknown")
        severity = CONFLICT_SEVERITY.get(code, "medium")
        # Extract entity refs from the raw conflict.
        unit = str(c.get("unit") or "")
        tenant = str(c.get("tenant") or "")
        file = str(c.get("file") or "")
        # Try to enrich tenant from knowledge if we have a unit.
        if unit and not tenant:
            for card in (knowledge.get("tenants") or []):
                if str(card.get("unit") or "") == unit:
                    tenant = str(card.get("tenant") or "")
                    break
        # Determine entity_type.
        entity_type = "unit"
        if code in GLOBAL_CONFLICT_CODES:
            entity_type = "portfolio"
        elif code in ("closed_and_open_maintenance",):
            entity_type = "maintenance"
        elif code in ("expired_and_active_contract",):
            entity_type = "contract"
        elif tenant:
            entity_type = "tenant"
        elif unit:
            entity_type = "unit"
        elif file:
            entity_type = "file"
        normalized_conflicts.append({
            "code": code,
            "severity": severity,
            "entity_type": entity_type,
            "entity_id": unit or tenant or file or code,
            "tenant_name": tenant or None,
            "unit_label": unit or None,
            "message": str(c.get("detail") or c.get("message") or ""),
            "evidence": [f"code={code}", f"unit={unit}", f"tenant={tenant}"],
            "source_files": [file] if file else [],
            "requires_review": severity in ("high", "medium"),
        })

    # Determine final status: ok | warning | blocked_for_review.
    has_high = any(c["severity"] == "high" for c in normalized_conflicts)
    has_medium = any(c["severity"] == "medium" for c in normalized_conflicts)
    if raw_status == "blocked_for_review" or has_high:
        status = "blocked_for_review"
    elif has_medium:
        status = "warning"
    else:
        status = "ok"

    confidence_cap = CONFIDENCE_CAPS.get(status, 100)

    # Build blocking_reasons (only for high-severity conflicts).
    blocking_reasons = [
        c["message"] for c in normalized_conflicts if c["severity"] == "high"
    ]
    # Build warnings (medium severity).
    warnings = [
        c["message"] for c in normalized_conflicts if c["severity"] == "medium"
    ]

    # Build affected_outputs list.
    affected_outputs: List[str] = []
    if status != "ok":
        affected_outputs = [
            "briefing", "verdicts", "executive_brain",
            "unified_smart_decisions", "executive_report",
        ]
        if status == "blocked_for_review":
            affected_outputs.extend(["portfolio_memory_narratives", "executive_intelligence"])

    # Build review_actions.
    review_actions: List[str] = []
    if status == "blocked_for_review":
        review_actions = [
            "راجع التعارضات قبل أي تحصيل أو إنذار",
            "أكمل مراجعة الأشهر غير المؤكدة",
            "تحقق من هويات المستأجرين على الوحدات المتعارضة",
        ]
    elif status == "warning":
        review_actions = [
            "راجع التحذيرات قبل الاعتماد النهائي",
        ]

    return {
        "version": GATE_VERSION,
        "status": status,
        "confidence_cap": confidence_cap,
        "blocking_reasons": blocking_reasons,
        "warnings": warnings,
        "conflicts": normalized_conflicts,
        "affected_outputs": affected_outputs,
        "review_actions": review_actions,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "analysis_id": analysis_id,
    }


def _entity_keys_for_decision(decision: Dict[str, Any]) -> Set[str]:
    """Extract all entity identity keys a decision references.

    Returns a set of strings like {"tenant:C", "unit:103", "property:prop_1"}.
    """
    keys: Set[str] = set()
    tenant = (decision.get("tenant_name") or decision.get("tenant_id") or "").strip().lower()
    unit = (decision.get("unit_label") or decision.get("unit_id") or "").strip().lower()
    prop = (decision.get("property_id") or "").strip().lower()
    if tenant:
        keys.add(f"tenant:{tenant}")
    if unit:
        keys.add(f"unit:{unit}")
    if prop:
        keys.add(f"property:{prop}")
    return keys


def _entity_keys_for_conflict(conflict: Dict[str, Any]) -> Set[str]:
    """Extract entity identity keys from a gate conflict."""
    keys: Set[str] = set()
    # Global conflicts affect all entities.
    if conflict.get("code") in GLOBAL_CONFLICT_CODES:
        return {"__global__"}
    tenant = (conflict.get("tenant_name") or "").strip().lower()
    unit = (conflict.get("unit_label") or "").strip().lower()
    entity_id = (conflict.get("entity_id") or "").strip().lower()
    if tenant:
        keys.add(f"tenant:{tenant}")
    if unit:
        keys.add(f"unit:{unit}")
    if entity_id and not keys:
        keys.add(f"entity:{entity_id}")
    return keys


def is_entity_blocked(
    decision: Dict[str, Any],
    normalized_gate: Dict[str, Any],
) -> bool:
    """Check if a specific decision is blocked by the gate.

    Entity-aware: a conflict for tenant A/unit 101 does NOT block an
    unrelated decision for unit 205. Only GLOBAL_CONFLICT_CODES cause
    global blocking.
    """
    gate = normalized_gate or {}
    if gate.get("status") == "ok":
        return False
    conflicts = gate.get("conflicts") or []
    if not conflicts:
        return False
    # Only high-severity conflicts cause blocking.
    blocking_conflicts = [c for c in conflicts if c.get("severity") == "high"]
    if not blocking_conflicts:
        return False  # warnings don't block, they just lower confidence
    decision_keys = _entity_keys_for_decision(decision)
    if not decision_keys:
        # Decision has no entity refs — block only if global conflict exists.
        return any(c.get("code") in GLOBAL_CONFLICT_CODES for c in blocking_conflicts)
    for conflict in blocking_conflicts:
        conflict_keys = _entity_keys_for_conflict(conflict)
        if "__global__" in conflict_keys:
            return True  # global conflict blocks everything
        if decision_keys & conflict_keys:
            return True  # entity overlap → block this decision
    return False


def apply_gate_to_unified_decisions(
    decisions: List[Dict[str, Any]],
    normalized_gate: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Apply the authoritative gate to unified smart decisions.

    For each decision:
      - If the decision's entity is blocked by a high-severity conflict:
        - blocked_by_gate = True
        - confidence_before_gate = original confidence
        - confidence_after_gate = min(confidence, gate.confidence_cap)
        - requires_confirmation = True
        - gate_status = "blocked_for_review"
        - gate_conflict_codes = list of relevant conflict codes
        - gate_evidence = list of conflict messages
        - action gets "[مراجعة]" prefix if it's an operational action
      - If the decision's entity has a warning:
        - gate_status = "warning"
        - confidence_after_gate = min(confidence, 70)
        - evidence preserved
      - If no conflict touches the decision:
        - gate_status = "ok"
        - confidence_after_gate = confidence (unchanged)
    """
    gate = normalized_gate or {}
    gate_status = gate.get("status", "ok")
    confidence_cap = gate.get("confidence_cap", 100)
    conflicts = gate.get("conflicts") or []
    warning_conflicts = [c for c in conflicts if c.get("severity") == "medium"]
    blocking_conflicts = [c for c in conflicts if c.get("severity") == "high"]

    out: List[Dict[str, Any]] = []
    for d in decisions:
        d = dict(d)  # shallow copy
        original_confidence = int(d.get("confidence", 70))
        d["confidence_before_gate"] = original_confidence
        d["requires_confirmation"] = d.get("requires_confirmation", True)

        if is_entity_blocked(d, gate):
            # Blocked: cap confidence, force review.
            d["blocked_by_gate"] = True
            d["gate_status"] = "blocked_for_review"
            d["confidence_after_gate"] = min(original_confidence, confidence_cap)
            d["requires_confirmation"] = True
            # Attach relevant conflict codes + evidence.
            decision_keys = _entity_keys_for_decision(d)
            relevant: List[Dict[str, Any]] = []
            for c in blocking_conflicts:
                conflict_keys = _entity_keys_for_conflict(c)
                if "__global__" in conflict_keys or (decision_keys & conflict_keys):
                    relevant.append(c)
            d["gate_conflict_codes"] = [c.get("code", "") for c in relevant]
            d["gate_evidence"] = [c.get("message", "") for c in relevant]
            # Add review prefix to operational actions.
            if d.get("kind") in ("contact_late_tenant", "follow_up_departed_tenant", "onboard_new_tenant", "maintenance"):
                action = d.get("action", "")
                if "[مراجعة]" not in action:
                    d["action"] = f"[مراجعة] {action} — يحتاج مراجعة قبل التنفيذ"
        elif gate_status == "warning" or gate_status == "blocked_for_review":
            # Not directly blocked, but gate is not OK — check for warnings
            # touching this entity.
            decision_keys = _entity_keys_for_decision(d)
            has_warning = False
            for c in warning_conflicts:
                conflict_keys = _entity_keys_for_conflict(c)
                if "__global__" in conflict_keys or (decision_keys & conflict_keys):
                    has_warning = True
                    break
            if has_warning:
                d["blocked_by_gate"] = False
                d["gate_status"] = "warning"
                d["confidence_after_gate"] = min(original_confidence, 70)
                d["gate_conflict_codes"] = []
                d["gate_evidence"] = []
            elif gate_status == "blocked_for_review":
                # Gate is blocked globally but this decision is not entity-blocked.
                # Still cap confidence (global caution) but don't block.
                d["blocked_by_gate"] = False
                d["gate_status"] = "ok"
                d["confidence_after_gate"] = original_confidence
                d["gate_conflict_codes"] = []
                d["gate_evidence"] = []
            else:
                d["blocked_by_gate"] = False
                d["gate_status"] = "ok"
                d["confidence_after_gate"] = original_confidence
                d["gate_conflict_codes"] = []
                d["gate_evidence"] = []
        else:
            d["blocked_by_gate"] = False
            d["gate_status"] = "ok"
            d["confidence_after_gate"] = original_confidence
            d["gate_conflict_codes"] = []
            d["gate_evidence"] = []
        out.append(d)
    return out


def apply_gate_to_briefing(
    brief: Dict[str, Any],
    normalized_gate: Dict[str, Any],
) -> Dict[str, Any]:
    """Apply the gate to the briefing response.

    When blocked:
      - Claims about departures/late tenants are rephrased as review requirements.
      - Headline changes to a review prompt.
      - ai_reasoning block includes gate_status + conflict info.
    """
    gate = normalized_gate or {}
    if gate.get("status") == "ok":
        return brief
    brief = dict(brief)
    gate_status = gate.get("status", "ok")
    conflicts = gate.get("conflicts") or []
    conflict_codes = [c.get("code", "") for c in conflicts]

    if gate_status == "blocked_for_review":
        # Rephrase headline as a review requirement.
        brief["headline"] = "راجع تعارضات البيانات قبل الإجراءات التنفيذية."
        # Replace any definitive departure/late claims in the narrative
        # with review language.
        narrative = brief.get("narrative") or []
        new_narrative: List[str] = []
        for line in narrative:
            if any(w in line for w in ("غادر", "متأخر مؤكد", "تواصل مع", "أرسل تذكير")):
                # Replace with review language.
                new_narrative.append(
                    "توجد مؤشرات تحتاج مراجعة — لا يمكن تأكيد المغادرة أو المتأخرات حتى تُحل التعارضات."
                )
            else:
                new_narrative.append(line)
        brief["narrative"] = new_narrative
    elif gate_status == "warning":
        # Add caution language to the headline.
        headline = brief.get("headline", "")
        if "تحذير" not in headline and "مراجعة" not in headline:
            brief["headline"] = f"{headline} (تحذير: راجع تعارضات البيانات)"

    # Attach gate info to ai_reasoning block.
    ai_r = brief.get("ai_reasoning") or {}
    ai_r["gate_status"] = gate_status
    ai_r["gate_conflict_codes"] = conflict_codes
    ai_r["gate_conflict_count"] = len(conflicts)
    ai_r["gate_confidence_cap"] = gate.get("confidence_cap", 100)
    brief["ai_reasoning"] = ai_r
    return brief


def apply_gate_to_verdicts(
    verdicts: Dict[str, Any],
    normalized_gate: Dict[str, Any],
) -> Dict[str, Any]:
    """Apply the gate to the verdicts response.

    Each affected verdict gets:
      - gate_status
      - confidence (capped if blocked)
      - conflict_codes
      - requires_review
      - evidence (from the gate)
    """
    gate = normalized_gate or {}
    if gate.get("status") == "ok":
        return verdicts
    verdicts = dict(verdicts)
    gate_status = gate.get("status", "ok")
    conflicts = gate.get("conflicts") or []
    confidence_cap = gate.get("confidence_cap", 100)

    for key, verdict in verdicts.items():
        if not isinstance(verdict, dict):
            continue
        # Check if this verdict is entity-blocked.
        # Build a pseudo-decision for entity matching.
        pseudo = {
            "tenant_name": verdict.get("tenant"),
            "unit_label": verdict.get("unit"),
            "property_id": None,
        }
        blocked = is_entity_blocked(pseudo, gate)
        if blocked:
            verdict["gate_status"] = "blocked_for_review"
            verdict["requires_review"] = True
            # Cap confidence.
            original_conf = verdict.get("confidence", 70)
            verdict["confidence"] = min(original_conf, confidence_cap)
            # Attach relevant conflict codes.
            decision_keys = _entity_keys_for_decision(pseudo)
            relevant_codes: List[str] = []
            relevant_evidence: List[str] = []
            for c in conflicts:
                if c.get("severity") != "high":
                    continue
                conflict_keys = _entity_keys_for_conflict(c)
                if "__global__" in conflict_keys or (decision_keys & conflict_keys):
                    relevant_codes.append(c.get("code", ""))
                    relevant_evidence.append(c.get("message", ""))
            verdict["conflict_codes"] = relevant_codes
            verdict["evidence"] = relevant_evidence
        elif gate_status == "blocked_for_review":
            # Not directly blocked but gate is globally blocked.
            verdict["gate_status"] = "ok"
            verdict["requires_review"] = False
        elif gate_status == "warning":
            verdict["gate_status"] = "warning"
            verdict["requires_review"] = False
    return verdicts


def apply_gate_to_executive_brain(
    brain: Dict[str, Any],
    normalized_gate: Dict[str, Any],
) -> Dict[str, Any]:
    """Apply the gate to the executive brain response.

    When blocked:
      - Blocked items move to a dedicated `review_queue` (not in now/today agenda).
      - `daily_brief` separates confirmed facts / warnings / items requiring review.
      - `data_confidence` block is added to the executive report.
    """
    gate = normalized_gate or {}
    if gate.get("status") == "ok":
        # Even when OK, add the data_confidence block for transparency.
        brain = dict(brain)
        brain["data_confidence"] = {
            "status": "ok",
            "confidence": 100,
            "confirmed_facts_count": len(brain.get("ranked_decisions") or []),
            "warnings_count": 0,
            "blocked_items_count": 0,
            "conflicts": [],
        }
        return brain

    brain = dict(brain)
    gate_status = gate.get("status", "ok")
    confidence_cap = gate.get("confidence_cap", 100)
    conflicts = gate.get("conflicts") or []

    # Separate ranked_decisions into executable + review.
    ranked = brain.get("ranked_decisions") or []
    executable: List[Dict[str, Any]] = []
    review_queue: List[Dict[str, Any]] = []
    for item in ranked:
        # Check if this item is entity-blocked.
        pseudo = {
            "tenant_name": (item.get("unified_decision") or item.get("lifecycle_decision") or {}).get("tenant_name"),
            "unit_label": (item.get("unified_decision") or item.get("lifecycle_decision") or {}).get("unit_label"),
            "property_id": item.get("property_id"),
        }
        if is_entity_blocked(pseudo, gate):
            # Move to review queue.
            review_item = dict(item)
            review_item["gate_status"] = "blocked_for_review"
            review_item["requires_review"] = True
            review_item["original_tier"] = item.get("tier", "follow_up")
            review_item["tier"] = "review"
            # Attach conflict codes.
            decision_keys = _entity_keys_for_decision(pseudo)
            relevant_codes: List[str] = []
            for c in conflicts:
                if c.get("severity") != "high":
                    continue
                conflict_keys = _entity_keys_for_conflict(c)
                if "__global__" in conflict_keys or (decision_keys & conflict_keys):
                    relevant_codes.append(c.get("code", ""))
            review_item["gate_conflict_codes"] = relevant_codes
            review_queue.append(review_item)
        else:
            executable.append(item)

    brain["ranked_decisions"] = executable
    brain["review_queue"] = review_queue

    # Rebuild agenda: blocked items removed from now/today/week.
    agenda = brain.get("agenda") or {}
    if isinstance(agenda, dict):
        for tier in ("now", "today", "this_week"):
            if tier in agenda:
                agenda[tier] = [
                    item for item in (agenda[tier] or [])
                    if not is_entity_blocked(
                        {
                            "tenant_name": (item.get("unified_decision") or item).get("tenant_name"),
                            "unit_label": (item.get("unified_decision") or item).get("unit_label"),
                            "property_id": item.get("property_id"),
                        },
                        gate,
                    )
                ]
        brain["agenda"] = agenda

    # Update daily_brief to separate confirmed / warnings / review.
    db = brain.get("daily_brief") or {}
    if isinstance(db, dict):
        db["confirmed_facts"] = f"{len(executable)} قرار قابل للتنفيذ"
        db["warnings"] = gate.get("warnings") or []
        db["items_requiring_review"] = f"{len(review_queue)} قرار يحتاج مراجعة"
        if review_queue:
            db["what"] = f"راجع {len(review_queue)} قرار محظور قبل التنفيذ."
            db["why"] = "بوابة الاتساق رصدت تعارضات — راجع قبل الإجراءات التنفيذية."
        brain["daily_brief"] = db

    # Add data_confidence block.
    brain["data_confidence"] = {
        "status": gate_status,
        "confidence": confidence_cap,
        "confirmed_facts_count": len(executable),
        "warnings_count": len([c for c in conflicts if c.get("severity") == "medium"]),
        "blocked_items_count": len(review_queue),
        "conflicts": [c.get("code", "") for c in conflicts],
    }

    return brain
