"""Single production entry for portfolio upload analysis.

Production uploads must never silently fall back to beta/demo seed data.
"""

from _future_ import annotations

from typing import Any, Dict, List, Literal, Optional

from adapters.gas_import_bridge import analyze_upload_with_gas_fallback

Lang = Literal["ar", "en"]


def get_empty_portfolio_context() -> Dict[str, Any]:
    """Return a clean production context with no demo or beta data."""
    return {
        "settings": {},
        "properties": [],
        "tenants": [],
        "contracts": [],
        "decisions": [],
        "reports": [],
    }


def _normalize_context(ctx: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Normalize caller context without injecting beta seed data."""
    if ctx is None:
        return get_empty_portfolio_context()

    if not isinstance(ctx, dict):
        raise TypeError("Portfolio analysis context must be a dictionary.")

    return {
        "settings": ctx.get("settings") or {},
        "properties": ctx.get("properties") or [],
        "tenants": ctx.get("tenants") or [],
        "contracts": ctx.get("contracts") or [],
        "decisions": ctx.get("decisions") or [],
        "reports": ctx.get("reports") or [],
    }


def _validate_files(files: List[dict]) -> None:
    if not isinstance(files, list):
        raise TypeError("files must be a list.")

    if not files:
        raise ValueError("No files were provided for portfolio analysis.")

    for index, file_item in enumerate(files):
        if not isinstance(file_item, dict):
            raise TypeError(f"File item at index {index} must be a dictionary.")


def run_production_portfolio_analysis(
    files: List[dict],
    lang: Lang = "ar",
    ctx: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Universal Import production pipeline.

    GAS Smart Property is used when configured; otherwise the Python
    portfolio engine is used.

    Beta/demo seed data is never injected into production analysis.
    """
    _validate_files(files)
    production_context = _normalize_context(ctx)

    payload = analyze_upload_with_gas_fallback(
        files,
        production_context,
        lang,
    )

    if not isinstance(payload, dict):
        raise RuntimeError("Portfolio analysis engine returned an invalid payload.")

    intake_meta = payload.get("intake_meta")
    engine = (
        intake_meta.get("engine")
        if isinstance(intake_meta, dict)
        else None
    ) or "unknown"

    pipeline = payload.get("pipeline")
    if not isinstance(pipeline, dict):
        pipeline = {}
        payload["pipeline"] = pipeline

    pipeline.update(
        {
            "entry": "production",
            "engine": engine,
            "context_source": "provided" if ctx is not None else "empty",
            "beta_seed_used": False,
        }
    )

    return payload
