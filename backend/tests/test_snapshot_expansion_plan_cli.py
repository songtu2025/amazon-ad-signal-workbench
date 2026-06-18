import importlib.util
import json
import sys
from pathlib import Path
from types import SimpleNamespace


def load_snapshot_expansion_plan_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "inspect_snapshot_expansion_plan.py"
    spec = importlib.util.spec_from_file_location("inspect_snapshot_expansion_plan_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["inspect_snapshot_expansion_plan_script"] = module
    spec.loader.exec_module(module)
    return module


def test_snapshot_expansion_plan_builds_30_day_command_after_expansion(monkeypatch) -> None:
    module = load_snapshot_expansion_plan_script()

    monkeypatch.setattr(
        module,
        "inspect_api_snapshot",
        lambda: {
            "status": "ready",
            "has_snapshot": True,
            "ready_for_signals": True,
            "snapshot_id": "snapshot-7d",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "signal_row_count": 42,
            "row_counts": {
                "advertised_products": 2,
                "ad_search_term_daily_metrics": 20,
                "ad_placement_daily_metrics": 10,
            },
            "issues": [],
        },
    )
    monkeypatch.setattr(
        module,
        "load_snapshot_readiness",
        lambda selected_market_id=None: SimpleNamespace(
            model_dump=lambda mode="json": {
                "ready": True,
                "can_request_api": True,
                "missing": [],
                "next_action": None,
                "market_id": selected_market_id,
                "auth_mode": "access_token",
            }
        ),
    )
    monkeypatch.setattr(
        module,
        "build_analysis_depth_payload",
        lambda selected_market_id=None: {
            "status": "needs_depth",
            "depth_score": 46,
            "coverage_gaps": ["真实 API 可分析行数偏少", "广告商品覆盖偏少"],
        },
    )

    payload = module.build_snapshot_expansion_plan_payload(
        selected_market_id=1,
        target_days=[14, 30],
        count=50,
        max_pages=3,
    )

    assert payload["will_write"] is False
    assert payload["will_request_api"] is False
    assert payload["status"] == "ready_to_expand"
    assert payload["current_snapshot"]["window_days"] == 7
    assert payload["cli_capabilities"]["supported_request_days"] == [7, 14, 30]

    target_14 = next(item for item in payload["target_windows"] if item["days"] == 14)
    assert target_14["supported_by_current_cli"] is True
    assert target_14["mode"] == "direct_snapshot"
    assert target_14["proposed_command"] == (
        "python scripts\\run_snapshot_pipeline.py --market-id 1 --days 14 --count 50 --max-pages 3"
    )

    target_30 = next(item for item in payload["target_windows"] if item["days"] == 30)
    assert target_30["supported_by_current_cli"] is True
    assert target_30["mode"] == "direct_snapshot"
    assert target_30["proposed_command"] == (
        "python scripts\\run_snapshot_pipeline.py --market-id 1 --days 30 --count 50 --max-pages 3"
    )

    assert "当前最新快照窗口不足 14 天" in payload["blocking_gaps"]
    assert "当前最新快照窗口不足 30 天" in payload["blocking_gaps"]
    assert "现有快照 CLI 不支持直接拉取 30 天" not in payload["blocking_gaps"]
    assert "广告商品覆盖偏少" in payload["coverage_gaps"]
    assert "人工确认后先执行 14 天快照命令" in payload["next_action"]


def test_snapshot_expansion_plan_reports_missing_config(monkeypatch) -> None:
    module = load_snapshot_expansion_plan_script()

    monkeypatch.setattr(
        module,
        "inspect_api_snapshot",
        lambda: {
            "status": "missing",
            "has_snapshot": False,
            "ready_for_signals": False,
            "snapshot_id": None,
            "signal_row_count": 0,
            "row_counts": {},
            "issues": ["NO_API_SNAPSHOT"],
        },
    )
    monkeypatch.setattr(
        module,
        "load_snapshot_readiness",
        lambda selected_market_id=None: SimpleNamespace(
            model_dump=lambda mode="json": {
                "ready": False,
                "can_request_api": False,
                "missing": ["GERPGO_ACCESS_TOKEN"],
                "next_action": "只允许在新项目 .env 或进程环境变量中补齐积加凭据",
                "market_id": selected_market_id,
                "auth_mode": "missing",
            }
        ),
    )
    monkeypatch.setattr(
        module,
        "build_analysis_depth_payload",
        lambda selected_market_id=None: {"status": "needs_depth", "coverage_gaps": ["没有可用 API 快照"]},
    )

    payload = module.build_snapshot_expansion_plan_payload(selected_market_id=1)

    assert payload["status"] == "not_ready"
    assert payload["config"]["can_request_api"] is False
    assert payload["config"]["missing"] == ["GERPGO_ACCESS_TOKEN"]
    assert payload["target_windows"][0]["proposed_command"] is None
    assert "补齐积加凭据" in payload["next_action"]


def test_snapshot_expansion_plan_cli_main_accepts_market_and_targets(monkeypatch, capsys) -> None:
    module = load_snapshot_expansion_plan_script()
    captured: dict[str, object] = {}

    def fake_payload(*, selected_market_id=None, target_days=None, count=50, max_pages=3, force=False):
        captured["selected_market_id"] = selected_market_id
        captured["target_days"] = target_days
        captured["count"] = count
        captured["max_pages"] = max_pages
        captured["force"] = force
        return {"status": "ready_to_expand", "target_days": target_days}

    monkeypatch.setattr(module, "build_snapshot_expansion_plan_payload", fake_payload)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "inspect_snapshot_expansion_plan.py",
            "--market-id",
            "2",
            "--target-days",
            "14",
            "30",
            "--count",
            "40",
            "--max-pages",
            "2",
            "--force",
        ],
    )

    module.main()

    assert captured["selected_market_id"] == 2
    assert captured["target_days"] == [14, 30]
    assert captured["count"] == 40
    assert captured["max_pages"] == 2
    assert captured["force"] is True
    assert json.loads(capsys.readouterr().out)["status"] == "ready_to_expand"
