import importlib.util
import sys
from pathlib import Path


def load_smoke_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "smoke_review_wait_contract.py"
    spec = importlib.util.spec_from_file_location("smoke_review_wait_contract_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["smoke_review_wait_contract_script"] = module
    spec.loader.exec_module(module)
    return module


def wait_summary(object_id: str = "B016EXMVZS") -> dict[str, object]:
    return {
        "status": "waiting_review_window",
        "earliest_due_date": "2026-06-22",
        "next_object_type": "advertised_product",
        "next_object_id": object_id,
        "forbidden_actions": [
            "不拉取快照",
            "不保存复盘结论",
            "不自动改规则",
            "不自动执行广告动作",
        ],
    }


def test_review_wait_contract_smoke_passes_when_sources_match(monkeypatch) -> None:
    module = load_smoke_script()
    summary = wait_summary()

    monkeypatch.setattr(
        module,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {"review_wait_summary": summary},
    )
    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "review_status": {"review_wait_summary": summary}
        },
    )

    payload = module.build_review_wait_contract_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
    )

    assert payload["status"] == "ok"
    assert payload["baseline"]["earliest_due_date"] == "2026-06-22"
    assert payload["baseline"]["next_object_id"] == "B016EXMVZS"
    assert payload["sources"]["review_readiness"]["matches_baseline"] is True
    assert payload["sources"]["signal_triage_service"]["matches_baseline"] is True
    assert payload["mismatches"] == []


def test_review_wait_contract_smoke_reports_mismatch(monkeypatch) -> None:
    module = load_smoke_script()

    monkeypatch.setattr(
        module,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {"review_wait_summary": wait_summary()},
    )
    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "review_status": {"review_wait_summary": wait_summary("aba_search_term_snapshot")}
        },
    )

    payload = module.build_review_wait_contract_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
    )

    assert payload["status"] == "mismatch"
    assert payload["mismatches"] == [
        {
            "source": "signal_triage_service",
            "field": "next_object_id",
            "expected": "B016EXMVZS",
            "actual": "aba_search_term_snapshot",
        }
    ]
