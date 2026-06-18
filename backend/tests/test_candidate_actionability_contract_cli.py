import importlib.util
import json
import sys
from pathlib import Path


def load_contract_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "inspect_candidate_actionability_contract.py"
    spec = importlib.util.spec_from_file_location("inspect_candidate_actionability_contract_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["inspect_candidate_actionability_contract_script"] = module
    spec.loader.exec_module(module)
    return module


def ready_candidate() -> dict:
    return {
        "signal_id": "sig-ready",
        "signal_category": "advertised_product_efficiency",
        "object_type": "advertised_product",
        "object_id": "ad-product:B016EXMW02",
        "object_label": "B016EXMW02",
        "shop_id": "market:1",
        "market_id": 1,
        "data_sources": [{"source_type": "积加API"}, {"source_type": "ABA导出"}],
        "evidence_drilldown": {
            "boundary": "广告 ASIN 是复核对象，搜索词和广告位只作为上下文，不能自动归因。",
            "business_evidence_blocks": [
                {"block_id": "manual_action_path", "label": "人工动作路径", "value": "加入复盘"},
                {"block_id": "review_metrics", "label": "复盘指标", "value": "7/14 天看花费、订单、ACOS"},
            ],
        },
        "manual_action_preview": {
            "will_write": False,
            "signal_id": "sig-ready",
            "action_type": "add_to_review",
            "object_type": "advertised_product",
            "object_id": "B016EXMW02",
            "object_label": "B016EXMW02",
            "review_windows": ["7d", "14d"],
        },
    }


def blocked_candidate() -> dict:
    return {
        "signal_id": "sig-blocked",
        "signal_category": "advertised_product_efficiency",
        "object_type": "advertised_product",
        "object_id": "",
        "object_label": "B016EXMW02",
        "shop_id": "market:1",
        "market_id": 1,
        "data_sources": [],
        "evidence_drilldown": {
            "business_evidence_blocks": [
                {"block_id": "manual_action_path", "label": "人工动作路径", "value": "加入复盘"}
            ],
        },
        "manual_action_preview": {
            "will_write": False,
            "signal_id": "sig-blocked",
            "action_type": "add_to_review",
            "object_type": "advertised_product",
            "object_id": "",
            "object_label": "B016EXMW02",
            "review_windows": ["7d"],
        },
    }


def test_contract_marks_ready_candidate_when_core_landing_fields_exist(monkeypatch) -> None:
    module = load_contract_script()
    monkeypatch.setattr(
        module,
        "build_review_candidates_payload",
        lambda selected_market_id=None, product_scope_id=None: {
            "candidate_count": 1,
            "candidates": [ready_candidate()],
        },
    )

    payload = module.build_candidate_actionability_contract_payload(selected_market_id=1)

    assert payload["status"] == "ready"
    assert payload["candidate_count"] == 1
    assert payload["ready_contract_count"] == 1
    assert payload["blocked_contract_count"] == 0
    contract = payload["contracts"][0]
    assert contract["can_enter_manual_action"] is True
    assert contract["gaps"] == []
    assert contract["source_types"] == ["积加API", "ABA导出"]
    assert contract["review_windows"] == ["7d", "14d"]
    assert contract["has_manual_action_path"] is True
    assert contract["has_review_metrics"] is True
    assert contract["has_attribution_boundary"] is True


def test_contract_blocks_candidate_when_evidence_or_review_contract_is_missing(monkeypatch) -> None:
    module = load_contract_script()
    monkeypatch.setattr(
        module,
        "build_review_candidates_payload",
        lambda selected_market_id=None, product_scope_id=None: {
            "candidate_count": 1,
            "candidates": [blocked_candidate()],
        },
    )

    payload = module.build_candidate_actionability_contract_payload(selected_market_id=1)

    assert payload["status"] == "needs_contract_fix"
    assert payload["candidate_count"] == 1
    assert payload["ready_contract_count"] == 0
    assert payload["blocked_contract_count"] == 1
    contract = payload["contracts"][0]
    assert contract["can_enter_manual_action"] is False
    assert "missing_stable_object_id" in contract["gaps"]
    assert "missing_evidence_source" in contract["gaps"]
    assert "missing_review_windows" in contract["gaps"]
    assert "missing_review_metrics" in contract["gaps"]
    assert "missing_attribution_boundary" in contract["gaps"]


def test_contract_cli_outputs_json(monkeypatch, capsys) -> None:
    module = load_contract_script()
    monkeypatch.setattr(
        module,
        "build_review_candidates_payload",
        lambda selected_market_id=None, product_scope_id=None: {
            "candidate_count": 1,
            "candidates": [ready_candidate()],
        },
    )

    exit_code = module.main(["--market-id", "1", "--product-scope-id", "parent_asin:B00K4W4AAA"])

    assert exit_code == 0
    output = json.loads(capsys.readouterr().out)
    assert output["selected_market_id"] == 1
    assert output["selected_product_scope_id"] == "parent_asin:B00K4W4AAA"
    assert output["status"] == "ready"
