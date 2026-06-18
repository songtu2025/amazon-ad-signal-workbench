import asyncio
import json
from datetime import date, timedelta
from pathlib import Path

import pytest

from app.models.snapshots import SnapshotCreateRequest
from app.services import snapshot_request
from app.services.snapshot_request import (
    SnapshotRequestFailed,
    SnapshotRequestNotReady,
    build_snapshot_failure_result,
    request_api_snapshot,
)


GERPGO_ENV_KEYS = [
    "GERPGO_BASE_URL",
    "GERPGO_APP_ID",
    "GERPGO_APP_KEY",
    "GERPGO_ACCESS_TOKEN",
    "GERPGO_MARKET_IDS",
]


def clear_gerpgo_env(monkeypatch) -> None:
    for key in GERPGO_ENV_KEYS:
        monkeypatch.delenv(key, raising=False)


def test_request_api_snapshot_rejects_missing_config_without_secret_values(tmp_path: Path, monkeypatch) -> None:
    clear_gerpgo_env(monkeypatch)

    with pytest.raises(SnapshotRequestNotReady) as error:
        asyncio.run(
            request_api_snapshot(
                SnapshotCreateRequest(market_id=1, days=7, count=10, max_pages=1),
                project_root=tmp_path,
                snapshot_root=tmp_path / "snapshots",
            )
        )

    assert error.value.missing == ["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"]
    assert "secret" not in str(error.value).lower()


def test_request_api_snapshot_reuses_existing_snapshot_without_credentials(tmp_path: Path, monkeypatch) -> None:
    clear_gerpgo_env(monkeypatch)
    end = date.today()
    start = end - timedelta(days=6)
    snapshot_dir = tmp_path / "snapshots" / "gerpgo_market_1_existing"
    snapshot_dir.mkdir(parents=True)
    (snapshot_dir / "manifest.json").write_text(
        json.dumps(
            {
                "snapshot_id": "gerpgo_market_1_existing",
                "source": "gerpgo",
                "market_id": 1,
                "shop_name": "rivbos",
                "marketplace_code": "US",
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
                "created_at": f"{end.isoformat()}T08:00:00",
                "status": "success",
                "row_counts": {"ad_search_term_daily_metrics": 2},
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    async def fail_if_api_requested(**kwargs):
        raise AssertionError("已有同周期成功快照时不应请求积加 API")

    monkeypatch.setattr(snapshot_request, "create_gerpgo_snapshot", fail_if_api_requested)

    result = asyncio.run(
        request_api_snapshot(
            SnapshotCreateRequest(market_id=1, days=7, count=10, max_pages=1),
            project_root=tmp_path,
            snapshot_root=tmp_path / "snapshots",
        )
    )

    assert result.status == "reused"
    assert result.snapshot_id == "gerpgo_market_1_existing"
    assert result.market_id == 1
    assert result.message == "已复用本地快照"
    assert result.row_counts == {"ad_search_term_daily_metrics": 2}


def test_request_api_snapshot_does_not_reuse_existing_when_sales_pages_need_expansion(tmp_path: Path, monkeypatch) -> None:
    clear_gerpgo_env(monkeypatch)
    monkeypatch.setenv("GERPGO_MARKET_IDS", "1")
    monkeypatch.setenv("GERPGO_ACCESS_TOKEN", "secret-token")
    end = date.today()
    start = end - timedelta(days=29)
    snapshot_dir = tmp_path / "snapshots" / "gerpgo_market_1_existing"
    snapshot_dir.mkdir(parents=True)
    (snapshot_dir / "manifest.json").write_text(
        json.dumps(
            {
                "snapshot_id": "gerpgo_market_1_existing",
                "source": "gerpgo",
                "market_id": 1,
                "shop_name": "rivbos",
                "marketplace_code": "US",
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
                "created_at": f"{end.isoformat()}T08:00:00",
                "status": "success",
                "request_options": {"count": 50, "max_pages": 3, "sales_max_pages": 3},
                "row_counts": {"sales_products": 150},
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    captured: dict[str, object] = {}

    async def fake_create_gerpgo_snapshot(**kwargs):
        captured.update(kwargs)
        return {
            "status": "success",
            "snapshot_dir": str(tmp_path / "snapshots" / "gerpgo_market_1_expanded"),
            "manifest": {
                "snapshot_id": "gerpgo_market_1_expanded",
                "market_id": 1,
                "shop_name": "rivbos",
                "marketplace_code": "US",
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
                "row_counts": {"sales_products": 209},
                "status": "success",
            },
        }

    monkeypatch.setattr(snapshot_request, "create_gerpgo_snapshot", fake_create_gerpgo_snapshot)

    result = asyncio.run(
        request_api_snapshot(
            SnapshotCreateRequest(market_id=1, days=30, count=50, max_pages=3, sales_max_pages=5),
            project_root=tmp_path,
            snapshot_root=tmp_path / "snapshots",
        )
    )

    assert captured["sales_max_pages"] == 5
    assert captured["max_pages"] == 3
    assert result.status == "success"
    assert result.snapshot_id == "gerpgo_market_1_expanded"


def test_request_api_snapshot_delegates_to_gerpgo_snapshot(tmp_path: Path, monkeypatch) -> None:
    clear_gerpgo_env(monkeypatch)
    monkeypatch.setenv("GERPGO_MARKET_IDS", "1")
    monkeypatch.setenv("GERPGO_ACCESS_TOKEN", "secret-token")
    captured: dict[str, object] = {}

    async def fake_create_gerpgo_snapshot(**kwargs):
        captured.update(kwargs)
        return {
            "status": "success",
            "snapshot_dir": str(tmp_path / "snapshots" / "gerpgo_market_1_test"),
            "manifest": {
                "snapshot_id": "gerpgo_market_1_test",
                "market_id": 1,
                "shop_name": "rivbos",
                "marketplace_code": "US",
                "start_date": "2026-06-08",
                "end_date": "2026-06-14",
                "row_counts": {"ad_search_term_daily_metrics": 2},
                "status": "success",
            },
        }

    monkeypatch.setattr(snapshot_request, "create_gerpgo_snapshot", fake_create_gerpgo_snapshot)

    result = asyncio.run(
        request_api_snapshot(
            SnapshotCreateRequest(market_id=1, days=7, count=10, max_pages=1, force=False),
            project_root=tmp_path,
            snapshot_root=tmp_path / "snapshots",
        )
    )

    assert captured["market_id"] == 1
    assert captured["days"] == 7
    assert captured["count"] == 10
    assert captured["max_pages"] == 1
    assert captured["sales_max_pages"] is None
    assert captured["force"] is False
    assert result.status == "success"
    assert result.snapshot_id == "gerpgo_market_1_test"
    assert result.row_counts == {"ad_search_term_daily_metrics": 2}
    assert "secret-token" not in result.model_dump_json()


def test_request_api_snapshot_preserves_safe_failure_reason(tmp_path: Path, monkeypatch) -> None:
    clear_gerpgo_env(monkeypatch)
    monkeypatch.setenv("GERPGO_MARKET_IDS", "1")
    monkeypatch.setenv("GERPGO_ACCESS_TOKEN", "secret-token")

    async def fake_create_gerpgo_snapshot(**kwargs):
        raise RuntimeError("积加 API 未返回目标店铺站点，已停止完整快照拉取")

    monkeypatch.setattr(snapshot_request, "create_gerpgo_snapshot", fake_create_gerpgo_snapshot)

    with pytest.raises(SnapshotRequestFailed) as error:
        asyncio.run(
            request_api_snapshot(
                SnapshotCreateRequest(market_id=1, days=7, count=10, max_pages=1),
                project_root=tmp_path,
                snapshot_root=tmp_path / "snapshots",
            )
        )

    result = build_snapshot_failure_result(error.value)

    assert error.value.market_id == 1
    assert str(error.value) == "积加 API 未返回目标店铺站点，已停止完整快照拉取"
    assert result.message == "积加 API 未返回目标店铺站点，已停止完整快照拉取"
    assert "secret-token" not in result.model_dump_json()


def test_request_api_snapshot_redacts_unsafe_failure_reason(tmp_path: Path, monkeypatch) -> None:
    clear_gerpgo_env(monkeypatch)
    monkeypatch.setenv("GERPGO_MARKET_IDS", "1")
    monkeypatch.setenv("GERPGO_ACCESS_TOKEN", "secret-token")

    async def fake_create_gerpgo_snapshot(**kwargs):
        raise RuntimeError("积加 HTTP 请求失败 401: accessToken=secret-token")

    monkeypatch.setattr(snapshot_request, "create_gerpgo_snapshot", fake_create_gerpgo_snapshot)

    with pytest.raises(SnapshotRequestFailed) as error:
        asyncio.run(
            request_api_snapshot(
                SnapshotCreateRequest(market_id=1, days=7, count=10, max_pages=1),
                project_root=tmp_path,
                snapshot_root=tmp_path / "snapshots",
            )
        )

    result = build_snapshot_failure_result(error.value)

    assert str(error.value) == "积加 API 请求失败，已保留当前本地快照状态"
    assert "secret-token" not in result.model_dump_json()
