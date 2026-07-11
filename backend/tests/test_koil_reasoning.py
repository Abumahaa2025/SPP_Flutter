"""Tests for Property Knowledge + Koil Reasoning engines."""

from adapters.koil.import_snapshot import snapshot_from_deep
from adapters.koil.property_knowledge_engine import build_property_knowledge
from adapters.koil.koil_reasoning_engine import run_koil_reasoning


def _sample_deep():
    return {
        "lifecycle": {
            "departed": [
                {
                    "unit": "20",
                    "tenant": "أحمد",
                    "departed_month": 3,
                    "departed_year": 2026,
                    "reason": "استبدال — محمد",
                }
            ],
            "newcomers": [{"unit": "20", "tenant": "محمد", "arrived_month": 3, "arrived_year": 2026}],
            "active": [{"unit": "20", "tenant": "محمد"}],
            "month_count": 3,
        },
        "annual": {"totalExpected": 15000, "totalCollected": 10000},
        "unique_unit_stats": {"unique_units": 2, "apartment_count": 2, "shop_count": 0},
        "parsed_rolls": [
            {
                "ok": True,
                "month": 1,
                "year": 2026,
                "rows": [{"unit": "20", "tenant": "أحمد", "rent": 5000, "is_late": True, "phone": "0501111111", "contract": "C-20"}],
            },
            {
                "ok": True,
                "month": 2,
                "year": 2026,
                "rows": [{"unit": "20", "tenant": "أحمد", "rent": 5000, "is_late": True, "phone": "0501111111", "contract": "C-20"}],
            },
            {
                "ok": True,
                "month": 3,
                "year": 2026,
                "rows": [{"unit": "20", "tenant": "محمد", "rent": 5000, "is_paid": True, "phone": "0502222222", "contract": "C-21"}],
            },
        ],
        "payment_ledger": {
            "ledger": {},
            "late_tenants": [
                {
                    "tenant": "أحمد",
                    "unit": "20",
                    "phone": "0501111111",
                    "contract": "C-20",
                    "late_month_count": 2,
                    "total_unpaid": 10000,
                    "months": [
                        {"month": 1, "year": 2026, "due": 5000, "remaining": 5000, "status": "unpaid"},
                        {"month": 2, "year": 2026, "due": 5000, "remaining": 5000, "status": "unpaid"},
                    ],
                }
            ],
            "merge_count": 0,
        },
        "late_by_month": {},
        "late_tenants": [],
        "quality_log": [],
        "parse_errors": [],
        "files_without_content": [],
        "file_classifications": [],
        "expense_rolls": [],
    }


def test_koil_reasoning_from_knowledge():
    snap = snapshot_from_deep(_sample_deep())
    knowledge = build_property_knowledge(snap, "ar")
    reasoning = run_koil_reasoning(knowledge, "ar")

    assert reasoning["version"] == "koil-reasoning-v1"
    assert len(reasoning["what_happened"]) >= 1
    assert any("متأخر" in w["text"] or "تغيّر" in w["text"] for w in reasoning["what_happened"])
    assert len(reasoning["recommendations"]) >= 1
    assert reasoning["brief"].startswith("كويل")


def test_tenant_change_detected():
    knowledge = build_property_knowledge(snapshot_from_deep(_sample_deep()), "ar")
    changes = knowledge["lifecycle"]["tenant_changes"]
    assert any(c.get("type") == "replacement" for c in changes)
