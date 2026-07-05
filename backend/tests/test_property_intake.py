"""Tests for property statement intake engine."""

from adapters.upload_analysis.portfolio_engine import analyze_upload_portfolio
from beta_seed import beta_dataset


def test_six_month_rent_files_produces_named_details():
    files = [
        {"name": "كشف_إيجار_شهر_1_2026.xlsx"},
        {"name": "كشف_إيجار_شهر_2_2026.xlsx"},
        {"name": "كشف_إيجار_شهر_3_2026.xlsx"},
        {"name": "كشف_إيجار_شهر_4_2026.xlsx"},
        {"name": "كشف_إيجار_شهر_5_2026.xlsx"},
        {"name": "كشف_إيجار_شهر_6_2026.xlsx"},
        {"name": "كشف_صيانة_ومصروفات_2026.xlsx"},
    ]
    ctx = beta_dataset("owner")
    out = analyze_upload_portfolio(files, ctx, lang="ar")

    assert out["metrics"]["months_linked"] >= 6
    assert out["metrics"]["late_tenants"] >= 1
    sections = {s["key"]: s for s in out["executive_report"]["sections"]}
    assert "departed" in sections
    assert len(sections["late"]["items"]) >= 1
    assert any("—" in i["label"] for i in sections["late"]["items"])
    assert len(out["month_comparison"]) >= 6
    assert out["intake_meta"]["engine"] == "property_intake_v2"


def test_csv_snippet_parsed():
    csv = "وحدة,مستأجر,إيجار,حالة\n101,أحمد,5000,مسدد\n102,سعد,4500,متأخر\n"
    files = [{"name": "كشف_شهر_3.csv", "textSnippet": csv}]
    ctx = beta_dataset("owner")
    out = analyze_upload_portfolio(files, ctx, lang="ar")
    assert out["metrics"]["files_analyzed"] == 1
    assert out["executive_report"]["sections"]
