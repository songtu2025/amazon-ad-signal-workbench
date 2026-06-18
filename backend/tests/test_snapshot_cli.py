import argparse
import asyncio
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path


def load_create_snapshot_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "create_api_snapshot.py"
    spec = importlib.util.spec_from_file_location("create_api_snapshot_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["create_api_snapshot_script"] = module
    spec.loader.exec_module(module)
    return module


def test_create_api_snapshot_cli_returns_not_ready_without_credentials() -> None:
    project_root = Path(__file__).resolve().parents[2]
    env = os.environ.copy()
    for key in ["GERPGO_ACCESS_TOKEN", "GERPGO_APP_ID", "GERPGO_APP_KEY", "GERPGO_MARKET_IDS"]:
        env.pop(key, None)
    env["GERPGO_SKIP_DOTENV"] = "1"

    result = subprocess.run(
        [
            sys.executable,
            "scripts/create_api_snapshot.py",
            "--market-id",
            "1",
            "--count",
            "1",
            "--max-pages",
            "1",
        ],
        cwd=project_root,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0
    payload = json.loads(result.stdout)
    assert payload["status"] == "not_ready"
    assert payload["readiness"]["market_id"] == 1
    assert payload["readiness"]["missing"] == ["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"]
    assert payload["readiness"]["next_action"] == "在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照"
    assert "access_token_value" not in result.stdout.lower()
    assert result.stderr == ""


def test_create_api_snapshot_check_config_returns_next_action_without_credentials() -> None:
    project_root = Path(__file__).resolve().parents[2]
    env = os.environ.copy()
    for key in ["GERPGO_ACCESS_TOKEN", "GERPGO_APP_ID", "GERPGO_APP_KEY", "GERPGO_MARKET_IDS"]:
        env.pop(key, None)
    env["GERPGO_SKIP_DOTENV"] = "1"

    result = subprocess.run(
        [
            sys.executable,
            "scripts/create_api_snapshot.py",
            "--market-id",
            "1",
            "--check-config",
        ],
        cwd=project_root,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0
    payload = json.loads(result.stdout)
    assert payload["status"] == "not_ready"
    assert payload["readiness"]["next_action"] == "在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照"
    assert "access_token_value" not in result.stdout.lower()
    assert result.stderr == ""


def test_create_api_snapshot_parse_args_accepts_30_days_and_sales_max_pages(monkeypatch) -> None:
    module = load_create_snapshot_script()
    monkeypatch.setattr(
        sys,
        "argv",
        ["create_api_snapshot.py", "--market-id", "1", "--days", "30", "--sales-max-pages", "5"],
    )

    args = module.parse_args()

    assert args.market_id == 1
    assert args.days == 30
    assert args.sales_max_pages == 5


def test_create_api_snapshot_check_rate_limits_prints_rules_without_credentials() -> None:
    project_root = Path(__file__).resolve().parents[2]
    env = os.environ.copy()
    for key in ["GERPGO_ACCESS_TOKEN", "GERPGO_APP_ID", "GERPGO_APP_KEY", "GERPGO_MARKET_IDS"]:
        env.pop(key, None)
    env["GERPGO_SKIP_DOTENV"] = "1"

    result = subprocess.run(
        [sys.executable, "scripts/create_api_snapshot.py", "--check-rate-limits"],
        cwd=project_root,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0
    payload = json.loads(result.stdout)
    assert payload["status"] == "ready"
    assert payload["request_policy"] == "请求积加 API 前必须先查询限流规则"
    assert payload["rules"]["/open/api_token"]["status"] == "confirmed"
    assert payload["rules"]["/operation/sts/salesAnalysis/page"]["status"] == "conservative"
    assert result.stderr == ""


def test_create_api_snapshot_probe_api_returns_not_ready_without_credentials() -> None:
    project_root = Path(__file__).resolve().parents[2]
    env = os.environ.copy()
    for key in ["GERPGO_ACCESS_TOKEN", "GERPGO_APP_ID", "GERPGO_APP_KEY", "GERPGO_MARKET_IDS"]:
        env.pop(key, None)
    env["GERPGO_SKIP_DOTENV"] = "1"

    result = subprocess.run(
        [
            sys.executable,
            "scripts/create_api_snapshot.py",
            "--market-id",
            "1",
            "--probe-api",
        ],
        cwd=project_root,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0
    payload = json.loads(result.stdout)
    assert payload["status"] == "not_ready"
    assert payload["readiness"]["market_id"] == 1
    assert payload["readiness"]["next_action"] == "在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照"
    assert "access_token_value" not in result.stdout.lower()
    assert result.stderr == ""


def test_create_api_snapshot_probe_api_success(monkeypatch, capsys) -> None:
    module = load_create_snapshot_script()
    saved: dict[str, object] = {}

    monkeypatch.setattr(
        module,
        "parse_args",
        lambda: argparse.Namespace(
            market_id=1,
            days=7,
            count=1,
            max_pages=1,
            force=False,
            check_config=False,
            probe_api=True,
        ),
    )
    monkeypatch.setattr(module, "load_gerpgo_config", lambda project_root: object())
    monkeypatch.setattr(
        module,
        "check_snapshot_readiness",
        lambda config, selected_market_id: {"ready": True, "missing": [], "market_id": selected_market_id},
    )

    async def fake_probe_gerpgo_market_access(config, market_id):
        return {
            "status": "ready",
            "api_name": "market_names",
            "market_id": market_id,
            "row_count": 1,
            "market": {"market_id": market_id, "market_name": "rivbos US", "country": "US"},
            "message": "积加 API 轻量探测通过",
        }

    monkeypatch.setattr(module, "probe_gerpgo_market_access", fake_probe_gerpgo_market_access)
    monkeypatch.setattr(
        module,
        "save_probe_market_option",
        lambda *, market_id, market: saved.update({"market_id": market_id, "market": market}),
        raising=False,
    )

    asyncio.run(module.main())

    payload = json.loads(capsys.readouterr().out)
    assert payload["status"] == "ready"
    assert payload["api_name"] == "market_names"
    assert payload["market_id"] == 1
    assert payload["row_count"] == 1
    assert payload["market"]["country"] == "US"
    assert saved == {"market_id": 1, "market": {"market_id": 1, "market_name": "rivbos US", "country": "US"}}


def test_create_api_snapshot_probe_config_markets_returns_per_market_results(monkeypatch, capsys) -> None:
    module = load_create_snapshot_script()
    cache_write_count = 0

    monkeypatch.setattr(
        module,
        "parse_args",
        lambda: argparse.Namespace(
            market_id=None,
            days=7,
            count=1,
            max_pages=1,
            force=False,
            check_config=False,
            probe_api=False,
            probe_config_markets=True,
        ),
    )
    monkeypatch.setattr(module, "load_gerpgo_config", lambda project_root: argparse.Namespace(market_ids=[1, 2]))
    monkeypatch.setattr(
        module,
        "check_snapshot_readiness",
        lambda config, selected_market_id: {"ready": True, "missing": [], "market_id": selected_market_id},
    )

    async def fake_probe_gerpgo_market_access(config, market_id):
        if market_id == 2:
            return {
                "status": "ready",
                "api_name": "market_names",
                "market_id": market_id,
                "row_count": 1,
                "market": {"market_id": market_id, "market_name": "rivbos US", "country": "US"},
                "message": "积加 API 轻量探测通过",
            }
        return {
            "status": "not_ready",
            "api_name": "market_names",
            "market_id": market_id,
            "row_count": 0,
            "market": None,
            "message": "积加 API 未返回目标店铺站点",
        }

    def fake_save_probe_market_option(**kwargs):
        nonlocal cache_write_count
        cache_write_count += 1

    monkeypatch.setattr(module, "probe_gerpgo_market_access", fake_probe_gerpgo_market_access)
    monkeypatch.setattr(module, "save_probe_market_option", fake_save_probe_market_option, raising=False)

    asyncio.run(module.main())

    payload = json.loads(capsys.readouterr().out)
    assert payload["status"] == "partial"
    assert payload["api_name"] == "market_names"
    assert payload["candidate_market_ids"] == [1, 2]
    assert payload["ready_count"] == 1
    assert payload["not_ready_count"] == 1
    assert payload["failed_count"] == 0
    assert [result["status"] for result in payload["results"]] == ["not_ready", "ready"]
    assert cache_write_count == 0


def test_create_api_snapshot_probe_config_markets_returns_not_ready_without_market_ids(monkeypatch, capsys) -> None:
    module = load_create_snapshot_script()

    monkeypatch.setattr(
        module,
        "parse_args",
        lambda: argparse.Namespace(
            market_id=None,
            days=7,
            count=1,
            max_pages=1,
            force=False,
            check_config=False,
            probe_api=False,
            probe_config_markets=True,
        ),
    )
    monkeypatch.setattr(module, "load_gerpgo_config", lambda project_root: argparse.Namespace(market_ids=[]))
    monkeypatch.setattr(
        module,
        "check_snapshot_readiness",
        lambda config, selected_market_id: {
            "ready": False,
            "missing": ["GERPGO_MARKET_IDS"],
            "market_id": None,
            "next_action": "在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照",
        },
    )

    async def fail_if_called(config, market_id):
        raise AssertionError("没有候选 market_id 时不应请求积加 API")

    monkeypatch.setattr(module, "probe_gerpgo_market_access", fail_if_called)

    asyncio.run(module.main())

    payload = json.loads(capsys.readouterr().out)
    assert payload["status"] == "not_ready"
    assert payload["api_name"] == "market_names"
    assert payload["candidate_market_ids"] == []
    assert payload["results"] == []
    assert payload["ready_count"] == 0
    assert payload["not_ready_count"] == 0
    assert payload["readiness"]["missing"] == ["GERPGO_MARKET_IDS"]


def test_create_api_snapshot_cli_success_prints_inspection(monkeypatch, capsys) -> None:
    module = load_create_snapshot_script()

    monkeypatch.setattr(
        module,
        "parse_args",
        lambda: argparse.Namespace(
            market_id=1,
            days=7,
            count=1,
            max_pages=1,
            force=False,
            check_config=False,
            probe_api=False,
        ),
    )
    monkeypatch.setattr(module, "load_gerpgo_config", lambda project_root: object())
    monkeypatch.setattr(
        module,
        "check_snapshot_readiness",
        lambda config, selected_market_id: {"ready": True, "missing": [], "market_id": selected_market_id},
    )

    async def fake_create_gerpgo_snapshot(**kwargs):
        return {
            "status": "reused",
            "snapshot_dir": "D:/tmp/snapshots/gerpgo_market_1_test",
            "manifest": {
                "snapshot_id": "gerpgo_market_1_test",
                "status": "success",
                "market_id": 1,
                "row_counts": {"ad_search_term_daily_metrics": 2},
            },
        }

    monkeypatch.setattr(module, "create_gerpgo_snapshot", fake_create_gerpgo_snapshot)
    monkeypatch.setattr(
        module,
        "inspect_api_snapshot",
        lambda: {
            "status": "ready",
            "has_snapshot": True,
            "ready_for_signals": True,
            "snapshot_id": "gerpgo_market_1_test",
            "signal_row_count": 2,
            "row_counts": {"ad_search_term_daily_metrics": 2},
            "normalized_tables": [],
            "issues": [],
        },
    )

    asyncio.run(module.main())

    payload = json.loads(capsys.readouterr().out)
    assert payload["status"] == "reused"
    assert payload["inspection"]["ready_for_signals"] is True
    assert payload["inspection"]["signal_row_count"] == 2
