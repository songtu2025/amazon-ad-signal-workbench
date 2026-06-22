import importlib.util
import json
import sys
from pathlib import Path


def load_review_todo_void_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "apply_review_todo_void_once.py"
    spec = importlib.util.spec_from_file_location("apply_review_todo_void_once_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["apply_review_todo_void_once_script"] = module
    spec.loader.exec_module(module)
    return module


def write_legacy_action(action_root: Path) -> None:
    action_root.mkdir(parents=True, exist_ok=True)
    payload = {
        "id": "manual-action-legacy-gap",
        "signal_id": "sig-legacy-gap",
        "action_type": "add_to_review",
        "operator_name": "本地运营",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "manual_status": "pending",
        "shop_id": "market:1",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "search_term:1:beach essentials",
        "object_label": "beach essentials",
        "evidence_snapshot": [],
    }
    (action_root / "manual_actions.jsonl").write_text(json.dumps(payload, ensure_ascii=False) + "\n", encoding="utf-8")


def write_boundary_gap_action(action_root: Path) -> None:
    action_root.mkdir(parents=True, exist_ok=True)
    payload = {
        "id": "manual-action-boundary-gap",
        "signal_id": "sig-boundary-gap",
        "action_type": "add_to_review",
        "operator_name": "本地运营",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "manual_status": "pending",
        "shop_id": "market:1",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "search_term:1:beach essentials",
        "object_label": "beach essentials",
        "evidence_snapshot": [
            {"label": "排查路径", "value": "Parent -> 广告 ASIN -> 广告组 -> 搜索词"},
            {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
        ],
    }
    (action_root / "manual_actions.jsonl").write_text(json.dumps(payload, ensure_ascii=False) + "\n", encoding="utf-8")


def write_complete_evidence_action(action_root: Path) -> None:
    action_root.mkdir(parents=True, exist_ok=True)
    payload = {
        "id": "manual-action-complete-evidence",
        "signal_id": "sig-complete-evidence",
        "action_type": "add_to_review",
        "operator_name": "本地运营",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "manual_status": "pending",
        "shop_id": "market:1",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "search_term:1:beach essentials",
        "object_label": "beach essentials",
        "evidence_snapshot": [
            {"label": "排查路径", "value": "Parent -> 广告 ASIN -> 广告组 -> 搜索词"},
            {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
            {"label": "搜索词边界", "value": "beach essentials 不能自动归因到单个广告 ASIN"},
            {"label": "广告位边界", "value": "广告位证据缺口不能自动归因"},
            {"label": "投放词证据", "value": "beach essentials 同广告组投放词上下文完整"},
            {"label": "广告组合流判断", "value": "beach essentials 已串联 Parent -> 广告 ASIN -> 广告组"},
            {"label": "ABA 背景", "value": "beach essentials ABA 背景已记录"},
            {"label": "证据缺口", "value": "beach essentials 当前缺口已说明"},
            {"label": "动作边界", "value": "beach essentials 仅建议人工加入复盘"},
        ],
    }
    (action_root / "manual_actions.jsonl").write_text(json.dumps(payload, ensure_ascii=False) + "\n", encoding="utf-8")


def write_search_term_baseline_only_action(action_root: Path) -> None:
    action_root.mkdir(parents=True, exist_ok=True)
    payload = {
        "id": "manual-action-search-term-baseline-only",
        "signal_id": "sig-search-term-baseline-only",
        "action_type": "add_to_review",
        "operator_name": "本地运营",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "manual_status": "pending",
        "shop_id": "market:1",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "search_term:1:beach essentials",
        "object_label": "beach essentials",
        "evidence_snapshot": [
            {"label": "排查路径", "value": "Parent -> 广告 ASIN -> 广告组 -> beach essentials"},
            {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
            {"label": "搜索词边界", "value": "beach essentials 不能自动归因到单个广告 ASIN"},
            {"label": "广告位边界", "value": "beach essentials 缺少广告位归因证据"},
        ],
    }
    (action_root / "manual_actions.jsonl").write_text(json.dumps(payload, ensure_ascii=False) + "\n", encoding="utf-8")


def write_object_mismatch_action(action_root: Path) -> None:
    action_root.mkdir(parents=True, exist_ok=True)
    payload = {
        "id": "manual-action-object-mismatch",
        "signal_id": "sig-object-mismatch",
        "action_type": "add_to_review",
        "operator_name": "本地运营",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "manual_status": "pending",
        "shop_id": "market:1",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "search_term:1:beach essentials",
        "object_label": "beach essentials",
        "evidence_snapshot": [
            {"label": "排查路径", "value": "Parent -> 广告 ASIN -> 广告组 -> 搜索词"},
            {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
            {"label": "搜索词边界", "value": "boys sunglasses 只能说明同广告组上下文"},
            {"label": "广告位边界", "value": "boys sunglasses 缺少广告位归因证据"},
        ],
    }
    (action_root / "manual_actions.jsonl").write_text(json.dumps(payload, ensure_ascii=False) + "\n", encoding="utf-8")


def test_review_todo_void_cli_dry_run_does_not_write(tmp_path: Path) -> None:
    module = load_review_todo_void_script()
    action_root = tmp_path / "manual_actions"
    write_legacy_action(action_root)

    payload = module.build_review_todo_void_payload(
        selected_market_id=1,
        action_id="manual-action-legacy-gap",
        expected_object_type="search_term",
        expected_object_id="search_term:1:beach essentials",
        action_root=action_root,
    )

    assert payload["status"] == "dry_run_ready"
    assert payload["will_write"] is False
    assert payload["current_todo_count"] == 2
    assert payload["required_authorization_code"] == "VOID_TODO:manual-action-legacy-gap:all"
    assert not (action_root / "review_todo_decisions.jsonl").exists()


def test_review_todo_void_cli_allows_boundary_gap_todos(tmp_path: Path) -> None:
    module = load_review_todo_void_script()
    action_root = tmp_path / "manual_actions"
    write_boundary_gap_action(action_root)

    payload = module.build_review_todo_void_payload(
        selected_market_id=1,
        action_id="manual-action-boundary-gap",
        expected_object_type="search_term",
        expected_object_id="search_term:1:beach essentials",
        action_root=action_root,
    )

    assert payload["status"] == "dry_run_ready"
    assert payload["current_todo_count"] == 2
    assert not (action_root / "review_todo_decisions.jsonl").exists()


def test_review_todo_void_cli_allows_search_term_todos_with_only_baseline_evidence(tmp_path: Path) -> None:
    module = load_review_todo_void_script()
    action_root = tmp_path / "manual_actions"
    write_search_term_baseline_only_action(action_root)

    payload = module.build_review_todo_void_payload(
        selected_market_id=1,
        action_id="manual-action-search-term-baseline-only",
        expected_object_type="search_term",
        expected_object_id="search_term:1:beach essentials",
        action_root=action_root,
    )

    assert payload["status"] == "dry_run_ready"
    assert payload["current_todo_count"] == 2
    assert payload["blockers"] == []
    assert not (action_root / "review_todo_decisions.jsonl").exists()


def test_review_todo_void_cli_blocks_complete_evidence_todos(tmp_path: Path) -> None:
    module = load_review_todo_void_script()
    action_root = tmp_path / "manual_actions"
    write_complete_evidence_action(action_root)

    payload = module.build_review_todo_void_payload(
        selected_market_id=1,
        action_id="manual-action-complete-evidence",
        expected_object_type="search_term",
        expected_object_id="search_term:1:beach essentials",
        action_root=action_root,
    )

    assert payload["status"] == "blocked"
    assert payload["blockers"][0]["code"] == "review_todo_has_required_evidence"
    assert "对象引用" in payload["blockers"][0]["message"]
    assert not (action_root / "review_todo_decisions.jsonl").exists()


def test_review_todo_void_cli_allows_object_mismatch_todos(tmp_path: Path) -> None:
    module = load_review_todo_void_script()
    action_root = tmp_path / "manual_actions"
    write_object_mismatch_action(action_root)

    payload = module.build_review_todo_void_payload(
        selected_market_id=1,
        action_id="manual-action-object-mismatch",
        expected_object_type="search_term",
        expected_object_id="search_term:1:beach essentials",
        action_root=action_root,
    )

    assert payload["status"] == "dry_run_ready"
    assert payload["will_write"] is False
    assert payload["current_todo_count"] == 2
    assert not (action_root / "review_todo_decisions.jsonl").exists()


def test_review_todo_void_cli_blocks_execute_without_authorization(tmp_path: Path) -> None:
    module = load_review_todo_void_script()
    action_root = tmp_path / "manual_actions"
    write_legacy_action(action_root)

    payload = module.build_review_todo_void_payload(
        selected_market_id=1,
        action_id="manual-action-legacy-gap",
        execute=True,
        authorization_code="wrong",
        action_root=action_root,
    )

    assert payload["status"] == "blocked"
    assert payload["will_write"] is False
    assert payload["blockers"][0]["code"] == "missing_or_invalid_authorization_code"
    assert not (action_root / "review_todo_decisions.jsonl").exists()


def test_review_todo_void_cli_executes_with_authorization_and_hides_todos(tmp_path: Path) -> None:
    module = load_review_todo_void_script()
    action_root = tmp_path / "manual_actions"
    write_legacy_action(action_root)

    payload = module.build_review_todo_void_payload(
        selected_market_id=1,
        action_id="manual-action-legacy-gap",
        reason="历史动作缺少 evidence_snapshot。",
        execute=True,
        authorization_code="VOID_TODO:manual-action-legacy-gap:all",
        action_root=action_root,
    )

    assert payload["status"] == "written_and_verified"
    assert payload["will_write"] is True
    assert payload["post_write_todo_count"] == 0
    assert payload["written_record"]["decision_type"] == "void_legacy_missing_evidence"
    assert payload["written_record"]["review_window"] is None
    assert "不保存 review_records" in payload["forbidden_effects"]
    assert (action_root / "review_todo_decisions.jsonl").exists()
