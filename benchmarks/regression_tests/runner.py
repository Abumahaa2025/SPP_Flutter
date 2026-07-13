"""Run SPP benchmark levels 1–3 against portfolio and Koil engines."""

from _future_ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List

REPO = Path(file_).resolve().parents[2]
_BACKEND = _REPO / "backend"

if str(_REPO) not in sys.path:
    sys.path.insert(0, str(_REPO))

if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from beta_seed import beta_dataset  # noqa: E402
from adapters.upload_analysis.portfolio_engine import (  # noqa: E402
    analyze_upload_portfolio,
)
from benchmarks.regression_tests.assertions import (  # noqa: E402
    assert_brief,
    assert_koil,
    assert_metrics,
    assert_sections,
)
from benchmarks.regression_tests.loader import (  # noqa: E402
    BENCHMARKS_ROOT,
    expected_path,
    files_from_manifest,
    golden_files_dir,
    golden_files_present,
    list_client_variants,
    list_golden_files,
    load_json,
)


def _analyze(
    manifest: dict,
    files_meta: List[dict],
) -> dict:
    """Run the local portfolio engine in QA mode."""
    lang = manifest.get("lang") or "ar"
    context = beta_dataset("owner")

    return analyze_upload_portfolio(
        files_meta,
        context,
        lang=lang,
    )


def run_suite(
    manifest_path: Path,
    expected: dict,
) -> Dict[str, Any]:
    """Run one benchmark manifest and apply all regression assertions."""
    errors: List[str] = []

    manifest, files_meta = files_from_manifest(
        manifest_path
    )

    output = _analyze(
        manifest,
        files_meta,
    )

    metrics_rules = (
        expected.get("metrics")
        or manifest.get("metrics")
        or {}
    )

    koil_rules = (
        expected.get("koil")
        or manifest.get("koil")
        or {}
    )

    section_rules = (
        expected.get("sections")
        or {}
    )

    required_section_keys = (
        section_rules.get("required_keys")
        or []
    )

    assert_metrics(
        output.get("metrics") or {},
        metrics_rules,
        errors,
    )

    assert_koil(
        output.get("koil_reasoning") or {},
        koil_rules,
        errors,
    )

    assert_sections(
        output.get("executive_report") or {},
        required_section_keys,
        errors,
    )

    assert_brief(
        output.get("success_message") or "",
        koil_rules.get("brief_prefix") or "كويل",
        errors,
        lang=manifest.get("lang") or "ar",
    )

    return {
        "name": manifest_path.parent.name,
        "passed": len(errors) == 0,
        "skipped": False,
        "errors": errors,
        "metrics": output.get("metrics"),
        "koil_brief": (
            output.get("koil_reasoning")
            or {}
        ).get("brief"),
        "success_message": output.get(
            "success_message"
        ),
    }


def run_level1() -> Dict[str, Any]:
    """
    Run the synthetic benchmark when its dataset exists.

    The repository currently does not contain
    benchmarks/synthetic_benchmark/manifest.json.
    Missing optional QA fixtures must not crash all regression levels.
    """
    manifest_path = (
        BENCHMARKS_ROOT
        / "synthetic_benchmark"
        / "manifest.json"
    )

    if not manifest_path.is_file():
        return {
            "name": "synthetic_benchmark",
            "passed": True,
            "skipped": True,
            "errors": [],
            "warning": (
                "Synthetic benchmark skipped: "
                "benchmarks/synthetic_benchmark/"
                "manifest.json is not present."
            ),
        }

    manifest = load_json(
        manifest_path
    )

    return run_suite(
        manifest_path,
        manifest,
    )


def run_level2() -> Dict[str, Any]:
    """Run the real Golden Benchmark when its imported files exist."""
    if not golden_files_present():
        return {
            "name": "golden_benchmark",
            "passed": True,
            "skipped": True,
            "errors": [],
            "warning": (
                "Golden Benchmark skipped: "
                "the Golden library set is not ready."
            ),
        }

    expected = load_json(
        expected_path()
    )

    golden_parent = golden_files_dir().parent
    golden_subdirectory = golden_files_dir().name

    relative_files = [
        f"{golden_subdirectory}/{path.name}"
        for path in list_golden_files()
    ]

    manifest = {
        **expected,
        "lang": "ar",
        "files": relative_files,
    }

    runtime_manifest = (
        golden_parent
        / "_runtime_manifest.json"
    )

    runtime_manifest.write_text(
        json.dumps(
            manifest,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    try:
        return run_suite(
            runtime_manifest,
            expected,
        )
    finally:
        runtime_manifest.unlink(
            missing_ok=True
        )


def run_level3() -> List[Dict[str, Any]]:
    """Run all available client-layout regression variants."""
    results: List[Dict[str, Any]] = []

    for manifest_path in list_client_variants():
        manifest = load_json(
            manifest_path
        )

        results.append(
            run_suite(
                manifest_path,
                manifest,
            )
        )

    return results


def run_all(
    levels: List[int] | None = None,
) -> Dict[str, Any]:
    """Run requested benchmark levels and return one aggregate result."""
    requested_levels = levels or [1, 2, 3]

    report: Dict[str, Any] = {
        "levels": {},
        "passed": True,
    }

    if 1 in requested_levels:
        level1 = run_level1()

        report["levels"]["1_synthetic"] = (
            level1
        )

        report["passed"] = (
            report["passed"]
            and level1["passed"]
        )

    if 2 in requested_levels:
        level2 = run_level2()

        report["levels"]["2_golden"] = (
            level2
        )

        report["passed"] = (
            report["passed"]
            and level2["passed"]
        )

    if 3 in requested_levels:
        level3 = run_level3()

        report["levels"]["3_clients"] = (
            level3
        )

        clients_passed = all(
            result.get("passed") is True
            for result in level3
        )

        report["passed"] = (
            report["passed"]
            and clients_passed
        )

    return report
