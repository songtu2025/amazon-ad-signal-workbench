from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_ROOT = PROJECT_ROOT / "scripts"
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(SCRIPTS_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

from inspect_review_readiness import build_review_readiness_payload  # noqa: E402
from app.services.signal_triage import build_signal_triage_payload  # noqa: E402


CONTRACT_FIELDS = [
    "status",
    "earliest_due_date",
    "next_object_type",
    "next_object_id",
    "forbidden_actions",
]


def build_review_wait_contract_payload(
    *,
    selected_market_id: int | None = None,
    product_scope_id: str | None = None,
    api_url: str | None = None,
) -> dict[str, Any]:
    readiness = build_review_readiness_payload(selected_market_id=selected_market_id)
    triage = build_signal_triage_payload(
        selected_market_id=selected_market_id,
        top=5,
        product_scope_id=product_scope_id,
    )

    source_summaries = {
        "review_readiness": _contract_summary(readiness.get("review_wait_summary")),
        "signal_triage_service": _contract_summary(
            ((triage.get("review_status") or {}).get("review_wait_summary"))
        ),
    }
    if api_url:
        source_summaries["runtime_api"] = _runtime_api_contract_summary(api_url)

    baseline = source_summaries["review_readiness"]
    mismatches = _mismatches(baseline, source_summaries)

    return {
        "status": "ok" if not mismatches else "mismatch",
        "selected_market_id": selected_market_id,
        "selected_product_scope_id": product_scope_id,
        "baseline_source": "review_readiness",
        "baseline": baseline,
        "sources": {
            name: {
                "summary": summary,
                "matches_baseline": not any(item["source"] == name for item in mismatches),
            }
            for name, summary in source_summaries.items()
        },
        "mismatches": mismatches,
    }


def _contract_summary(summary: Any) -> dict[str, Any]:
    if not isinstance(summary, dict):
        summary = {}
    return {field: summary.get(field) for field in CONTRACT_FIELDS}


def _runtime_api_contract_summary(api_url: str) -> dict[str, Any]:
    try:
        with urllib.request.urlopen(api_url, timeout=5) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        return {**{field: None for field in CONTRACT_FIELDS}, "error": f"{type(exc).__name__}: {exc}"}
    return _contract_summary(((payload.get("review_status") or {}).get("review_wait_summary")))


def _mismatches(baseline: dict[str, Any], sources: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    mismatches: list[dict[str, Any]] = []
    for source_name, summary in sources.items():
        if source_name == "review_readiness":
            continue
        for field in CONTRACT_FIELDS:
            if summary.get(field) != baseline.get(field):
                mismatches.append(
                    {
                        "source": source_name,
                        "field": field,
                        "expected": baseline.get(field),
                        "actual": summary.get(field),
                    }
                )
    return mismatches


def main() -> None:
    parser = argparse.ArgumentParser(description="只读核对复盘等待摘要在脚本、服务和可选运行中 API 之间是否一致。")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--product-scope-id", default=None)
    parser.add_argument("--api-url", default=None)
    args = parser.parse_args()

    payload = build_review_wait_contract_payload(
        selected_market_id=args.market_id,
        product_scope_id=args.product_scope_id,
        api_url=args.api_url,
    )
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    if payload["status"] != "ok":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
