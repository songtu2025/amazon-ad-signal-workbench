import asyncio
import importlib.util
import json
import sys
from pathlib import Path

from app.models.snapshots import SnapshotCreateResult
from app.services.snapshot_request import SnapshotRequestNotReady


def load_snapshot_pipeline_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "run_snapshot_pipeline.py"
    spec = importlib.util.spec_from_file_location("run_snapshot_pipeline_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["run_snapshot_pipeline_script"] = module
    spec.loader.exec_module(module)
    return module


def test_snapshot_pipeline_returns_not_ready_and_scans_data_quality(monkeypatch) -> None:
    module = load_snapshot_pipeline_script()

    async def fake_request_api_snapshot(request):
        raise SnapshotRequestNotReady(
            ["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"],
            request.market_id,
        )

    monkeypatch.setattr(module, "request_api_snapshot", fake_request_api_snapshot)
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
            "normalized_tables": [],
            "issues": ["NO_API_SNAPSHOT"],
        },
    )
    monkeypatch.setattr(
        module,
        "build_signal_scan_payload",
        lambda selected_market_id=None: {
            "selected_market_id": selected_market_id,
            "ready_for_signals": False,
            "signal_row_count": 0,
            "signal_count": 1,
            "signals": [{"id": "sig-data-quality-api-snapshot-missing"}],
        },
    )

    payload = asyncio.run(module.build_snapshot_pipeline_payload(market_id=1, count=1, max_pages=1))

    assert payload["pipeline_status"] == "not_ready"
    assert payload["create"]["status"] == "not_ready"
    assert payload["create"]["can_request_api"] is False
    assert payload["create"]["market_id"] == 1
    assert payload["create"]["missing"] == ["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"]
    assert payload["inspection"]["issues"] == ["NO_API_SNAPSHOT"]
    assert payload["signal_scan"]["selected_market_id"] == 1
    assert payload["signal_scan"]["signals"][0]["id"] == "sig-data-quality-api-snapshot-missing"
    assert "secret" not in json.dumps(payload, ensure_ascii=False).lower()


def test_snapshot_pipeline_returns_failed_and_keeps_inspection_and_signal_scan(monkeypatch) -> None:
    module = load_snapshot_pipeline_script()

    async def fake_request_api_snapshot(request):
        raise RuntimeError("积加 HTTP 请求失败 401: accessToken=secret-token")

    monkeypatch.setattr(module, "request_api_snapshot", fake_request_api_snapshot)
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
            "normalized_tables": [],
            "issues": ["NO_API_SNAPSHOT"],
        },
    )
    monkeypatch.setattr(
        module,
        "build_signal_scan_payload",
        lambda selected_market_id=None: {
            "selected_market_id": selected_market_id,
            "ready_for_signals": False,
            "signal_row_count": 0,
            "signal_count": 1,
            "signals": [{"id": "sig-data-quality-api-snapshot-missing"}],
        },
    )

    payload = asyncio.run(module.build_snapshot_pipeline_payload(market_id=1, count=1, max_pages=1))

    assert payload["pipeline_status"] == "failed"
    assert payload["create"]["status"] == "failed"
    assert payload["create"]["can_request_api"] is True
    assert payload["create"]["market_id"] == 1
    assert payload["create"]["next_action"] == "检查新项目 .env 中 Gerpgo 凭据、market_id 和开放平台接口权限后重新手动拉取快照"
    assert payload["inspection"]["issues"] == ["NO_API_SNAPSHOT"]
    assert payload["signal_scan"]["selected_market_id"] == 1
    assert payload["signal_scan"]["signals"][0]["id"] == "sig-data-quality-api-snapshot-missing"
    assert "secret-token" not in json.dumps(payload, ensure_ascii=False).lower()


def test_snapshot_pipeline_success_runs_create_inspect_and_scan(monkeypatch) -> None:
    module = load_snapshot_pipeline_script()
    captured: dict[str, object] = {}

    async def fake_request_api_snapshot(request):
        captured["request"] = request
        return SnapshotCreateResult(
            status="reused",
            snapshot_dir="D:/tmp/snapshots/gerpgo_market_1_test",
            snapshot_id="gerpgo_market_1_test",
            market_id=1,
            shop_name="rivbos",
            marketplace_code="US",
            row_counts={"ad_search_term_daily_metrics": 2},
            message="已复用本地快照",
        )

    monkeypatch.setattr(module, "request_api_snapshot", fake_request_api_snapshot)
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
    monkeypatch.setattr(
        module,
        "build_signal_scan_payload",
        lambda selected_market_id=None: {
            "selected_market_id": selected_market_id,
            "ready_for_signals": True,
            "signal_row_count": 2,
            "signal_count": 1,
            "signals": [{"id": "sig-waste-test"}],
        },
    )

    payload = asyncio.run(module.build_snapshot_pipeline_payload(market_id=1, count=10, max_pages=1, force=True))

    assert captured["request"].market_id == 1
    assert captured["request"].count == 10
    assert captured["request"].force is True
    assert payload["pipeline_status"] == "completed"
    assert payload["create"]["status"] == "reused"
    assert payload["create"]["snapshot_id"] == "gerpgo_market_1_test"
    assert payload["inspection"]["ready_for_signals"] is True
    assert payload["signal_scan"]["selected_market_id"] == 1
    assert payload["signal_scan"]["ready_for_signals"] is True


def test_snapshot_pipeline_parse_args_accepts_30_days(monkeypatch) -> None:
    module = load_snapshot_pipeline_script()
    monkeypatch.setattr(sys, "argv", ["run_snapshot_pipeline.py", "--market-id", "1", "--days", "30"])

    args = module.parse_args()

    assert args.market_id == 1
    assert args.days == 30
