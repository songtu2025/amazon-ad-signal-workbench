from pathlib import Path

import asyncio
import pytest
from datetime import date

import app.services.gerpgo_snapshot as gerpgo_snapshot
from app.services.gerpgo_snapshot import (
    GerpgoConfig,
    GerpgoSnapshotClient,
    build_snapshot_payload,
    check_snapshot_readiness,
    create_gerpgo_snapshot,
    load_gerpgo_config,
    probe_gerpgo_market_access,
    query_gerpgo_rate_limit_rule,
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


def test_build_snapshot_payload_normalizes_search_terms_and_manifest() -> None:
    payload = build_snapshot_payload(
        snapshot_id="gerpgo_market_1_20260614_010000",
        market_id=1,
        shop_name="rivbos",
        marketplace_code="US",
        start_date="2026-06-08",
        end_date="2026-06-14",
        created_at="2026-06-14T01:00:00",
        raw_payloads={
            "market_names": [{"data": [{"marketId": 1, "marketName": "rivbos US", "countryCode": "US"}]}],
            "sales_performance": [
                {"data": [{"marketId": 1, "asin": "B000TEST01", "msku": "MSKU-1", "sku": "SKU-1", "productName": "儿童太阳镜"}]}
            ],
            "sp_advertised_products": [
                {
                    "data": [
                        {
                            "marketId": 1,
                            "campaignId": "C-1",
                            "campaignName": "SP 测试活动",
                            "groupId": "G-1",
                            "groupName": "多商品广告组",
                            "adId": "AD-1",
                            "asin": "B000TEST01",
                            "msku": "MSKU-1",
                            "impressions": 100,
                            "clicks": 10,
                            "cost": 12.5,
                            "adsOrders": 1,
                            "adsSales": 39.9,
                        }
                    ]
                }
            ],
            "sp_search_targeting_terms": [
                {
                    "data": [
                        {
                            "id": "targeting-row",
                            "marketId": 1,
                            "campaignId": "C-1",
                            "campaignName": "SP 测试活动",
                            "groupId": "G-1",
                            "groupName": "多商品广告组",
                            "targetId": "T-1",
                            "targetingText": "B000TEST01",
                            "query": "kids sunglasses",
                            "impressions": 1200,
                            "clicks": 52,
                            "cost": 38.6,
                            "adsOrders": 0,
                            "adsSales": 0,
                        }
                    ]
                }
            ],
            "sp_search_keyword_terms": [
                {
                    "data": [
                        {
                            "id": "keyword-row",
                            "marketId": 1,
                            "campaignId": "C-1",
                            "campaignName": "SP 测试活动",
                            "groupId": "G-1",
                            "groupName": "多商品广告组",
                            "keywordId": "K-1",
                            "keywordText": "kids polarized sunglasses",
                            "searchTerm": "polarized kids sunglasses",
                            "impressions": 600,
                            "clicks": 24,
                            "cost": 10.2,
                            "adsOrders": 3,
                            "adsSales": 90.0,
                        }
                    ]
                }
            ],
            "sp_placements": [
                {
                    "data": [
                        {
                            "marketId": 1,
                            "campaignId": "C-1",
                            "campaignName": "SP 测试活动",
                            "placement": "Top of Search",
                            "impressions": 500,
                            "clicks": 20,
                            "cost": 25.0,
                            "adsOrders": 1,
                            "adsSales": 20.0,
                        }
                    ]
                }
            ],
        },
    )

    manifest = payload["manifest"]
    normalized = payload["normalized"]

    assert manifest["status"] == "success"
    assert manifest["row_counts"]["ad_search_term_daily_metrics"] == 2
    assert manifest["row_counts"]["advertised_products"] == 1
    assert manifest["row_counts"]["ad_placement_daily_metrics"] == 1
    assert normalized["shops"] == [{"id": "1", "shop_name": "rivbos"}]
    assert normalized["ad_campaigns"] == [{"campaign_id": "C-1", "campaign_name": "SP 测试活动", "market_id": 1}]
    assert normalized["ad_groups"] == [
        {"campaign_id": "C-1", "ad_group_id": "G-1", "ad_group_name": "多商品广告组", "market_id": 1}
    ]
    assert normalized["ad_search_term_daily_metrics"][0]["search_term"] == "kids sunglasses"
    assert normalized["ad_search_term_daily_metrics"][0]["spend"] == 38.6
    assert normalized["ad_search_term_daily_metrics"][1]["keyword_id"] == "K-1"


def test_build_snapshot_payload_reads_sales_rows_from_paged_data_object() -> None:
    payload = build_snapshot_payload(
        snapshot_id="gerpgo_market_1_20260614_020000",
        market_id=1,
        shop_name="rivbos",
        marketplace_code="US",
        start_date="2026-06-08",
        end_date="2026-06-14",
        created_at="2026-06-14T02:00:00",
        raw_payloads={
            "market_names": [{"data": "rivbos:US"}],
            "sales_performance": [
                {
                    "data": {
                        "total": 1,
                        "page": 1,
                        "rows": [
                            {
                                "marketId": 1,
                                "asin": "B07XZ4PMVR",
                                "variationAsin": "B00K4W4AAA",
                                "msku": "003-1 sky blue",
                                "sku": "RBK003-1 sky blue",
                                "productName": "RBK003-RBK003-1 天蓝",
                                "orders": 12,
                                "unitsOrdered": 13,
                                "orderProductSales": 239.4,
                                "adsOrders": 1,
                                "adsSpend": 8.6,
                                "adsSales": 19.95,
                                "sessions": 220,
                                "pageViews": 350,
                            }
                        ],
                    }
                }
            ],
            "sp_advertised_products": [],
            "sp_search_targeting_terms": [],
            "sp_search_keyword_terms": [],
            "sp_placements": [],
        },
    )

    assert payload["manifest"]["row_counts"]["sales_products"] == 1
    assert payload["manifest"]["row_counts"]["sales_product_daily_metrics"] == 1
    assert payload["normalized"]["sales_products"] == [
        {
            "id": "1:003-1 sky blue",
            "market_id": 1,
            "asin": "B07XZ4PMVR",
            "parent_asin": "B00K4W4AAA",
            "msku": "003-1 sky blue",
            "sku": "RBK003-1 sky blue",
            "product_name": "RBK003-RBK003-1 天蓝",
            "brand": None,
            "category": None,
        }
    ]
    assert payload["normalized"]["sales_product_daily_metrics"] == [
        {
            "id": "1:003-1 sky blue:2026-06-08:2026-06-14",
            "market_id": 1,
            "asin": "B07XZ4PMVR",
            "parent_asin": "B00K4W4AAA",
            "msku": "003-1 sky blue",
            "sku": "RBK003-1 sky blue",
            "product_name": "RBK003-RBK003-1 天蓝",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "sessions": 220,
            "page_views": 350,
            "orders": 12,
            "units": 13,
            "sales": 239.4,
            "ad_orders": 1,
            "ad_spend": 8.6,
            "ad_sales": 19.95,
        }
    ]

def test_check_snapshot_readiness_reports_missing_market_id_and_credentials() -> None:
    result = check_snapshot_readiness(GerpgoConfig())

    assert result["ready"] is False
    assert result["missing"] == ["GERPGO_MARKET_IDS", "GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"]
    assert result["market_id"] is None


def test_check_snapshot_readiness_accepts_access_token_without_exposing_secret() -> None:
    result = check_snapshot_readiness(GerpgoConfig(access_token="secret-token", market_ids=[1]))

    assert result["ready"] is True
    assert result["missing"] == []
    assert result["market_id"] == 1
    assert result["auth_mode"] == "access_token"
    assert "secret-token" not in str(result)


def test_query_gerpgo_rate_limit_rule_returns_documented_token_rule() -> None:
    rule = query_gerpgo_rate_limit_rule("/open/api_token")

    assert rule["status"] == "confirmed"
    assert rule["limit_text"] == "每 1 秒 10 次"
    assert rule["min_interval_seconds"] == 0.1
    assert "open.gerpgo.com/document" in rule["source_url"]


def test_query_gerpgo_rate_limit_rule_marks_sales_rule_as_conservative() -> None:
    rule = query_gerpgo_rate_limit_rule("/operation/sts/salesAnalysis/page")

    assert rule["status"] == "conservative"
    assert rule["min_interval_seconds"] >= 5.2
    assert "未查到公开单接口限流规则" in rule["note"]


def test_client_refuses_unknown_api_without_rate_limit_rule(monkeypatch) -> None:
    async def fail_get_access_token(self):
        raise AssertionError("不应在查询限流规则前获取 token")

    monkeypatch.setattr(GerpgoSnapshotClient, "get_access_token", fail_get_access_token)
    client = GerpgoSnapshotClient(GerpgoConfig(access_token="secret-token", market_ids=[1]))

    with pytest.raises(RuntimeError, match="未查询到积加 API 限流规则"):
        asyncio.run(client.post("/operation/unknown/path", {}))


def test_client_waits_by_rate_limit_rule_before_post(monkeypatch) -> None:
    sleeps: list[float] = []
    requests: list[dict[str, object]] = []

    async def fake_sleep(seconds):
        sleeps.append(seconds)

    class FakeResponse:
        status_code = 200

        def json(self):
            return {"code": 0, "data": []}

    class FakeAsyncClient:
        def __init__(self, timeout):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, traceback):
            return None

        async def post(self, url, json=None, headers=None):
            requests.append({"url": url, "json": json, "headers": headers})
            return FakeResponse()

    monkeypatch.setattr(gerpgo_snapshot.asyncio, "sleep", fake_sleep)
    monkeypatch.setattr(gerpgo_snapshot.httpx, "AsyncClient", FakeAsyncClient)
    client = GerpgoSnapshotClient(GerpgoConfig(access_token="secret-token", market_ids=[1]))

    result = asyncio.run(client.post("/operation/ads/adsSpProduct/query", {"marketId": 1}))

    assert result == {"code": 0, "data": []}
    assert sleeps == [1.25]
    assert requests[0]["url"].endswith("/open/operation/ads/adsSpProduct/query")
    assert requests[0]["headers"] == {"accessToken": "secret-token"}


def test_client_waits_by_token_rate_limit_rule_before_get_access_token(monkeypatch) -> None:
    sleeps: list[float] = []
    requests: list[dict[str, object]] = []

    async def fake_sleep(seconds):
        sleeps.append(seconds)

    class FakeResponse:
        status_code = 200

        def raise_for_status(self):
            return None

        def json(self):
            return {"code": 0, "data": {"accessToken": "new-token"}}

    class FakeAsyncClient:
        def __init__(self, timeout):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, traceback):
            return None

        async def post(self, url, json=None, headers=None):
            requests.append({"url": url, "json": json, "headers": headers})
            return FakeResponse()

    monkeypatch.setattr(gerpgo_snapshot.asyncio, "sleep", fake_sleep)
    monkeypatch.setattr(gerpgo_snapshot.httpx, "AsyncClient", FakeAsyncClient)
    client = GerpgoSnapshotClient(GerpgoConfig(app_id="app-id", app_key="app-key", market_ids=[1]))

    token = asyncio.run(client.get_access_token())

    assert token == "new-token"
    assert sleeps == [0.1]
    assert requests[0]["url"].endswith("/open/api_token")
    assert requests[0]["json"] == {"appId": "app-id", "appKey": "app-key"}


def test_probe_gerpgo_market_access_returns_safe_market_summary(monkeypatch) -> None:
    async def fake_post(self, path, payload):
        assert path == "/middle/base/marketNames/query"
        assert payload == {"markerIds": [1]}
        return {
            "code": 0,
            "data": [
                {
                    "marketId": 1,
                    "marketName": "rivbos US",
                    "countryCode": "US",
                    "accessToken": "secret-token",
                }
            ],
        }

    monkeypatch.setattr(GerpgoSnapshotClient, "post", fake_post)

    result = asyncio.run(probe_gerpgo_market_access(GerpgoConfig(access_token="secret-token", market_ids=[1]), 1))

    assert result == {
        "status": "ready",
        "api_name": "market_names",
        "market_id": 1,
        "row_count": 1,
        "market": {"market_id": 1, "market_name": "rivbos US", "country": "US"},
        "message": "积加 API 轻量探测通过",
    }
    assert "secret-token" not in str(result)


def test_probe_gerpgo_market_access_accepts_text_market_name_response(monkeypatch) -> None:
    async def fake_post(self, path, payload):
        assert path == "/middle/base/marketNames/query"
        assert payload == {"markerIds": [1]}
        return {"code": 200, "data": "rivbos:US"}

    monkeypatch.setattr(GerpgoSnapshotClient, "post", fake_post)

    result = asyncio.run(probe_gerpgo_market_access(GerpgoConfig(access_token="secret-token", market_ids=[1]), 1))

    assert result == {
        "status": "ready",
        "api_name": "market_names",
        "market_id": 1,
        "row_count": 1,
        "market": {"market_id": 1, "market_name": "rivbos", "country": "US"},
        "message": "积加 API 轻量探测通过",
    }
    assert "secret-token" not in str(result)


def test_probe_gerpgo_market_access_requires_matching_market_row(monkeypatch) -> None:
    async def fake_post(self, path, payload):
        assert path == "/middle/base/marketNames/query"
        assert payload == {"markerIds": [1]}
        return {"code": 0, "data": []}

    monkeypatch.setattr(GerpgoSnapshotClient, "post", fake_post)

    result = asyncio.run(probe_gerpgo_market_access(GerpgoConfig(access_token="secret-token", market_ids=[1]), 1))

    assert result["status"] == "not_ready"
    assert result["api_name"] == "market_names"
    assert result["market_id"] == 1
    assert result["row_count"] == 0
    assert result["market"] is None
    assert result["next_action"] == "检查新项目 .env 中 Gerpgo 凭据、market_id 和开放平台接口权限后重新手动拉取快照"
    assert "secret-token" not in str(result)


def test_create_gerpgo_snapshot_stops_when_market_name_does_not_match(monkeypatch, tmp_path: Path) -> None:
    requested_paths: list[str] = []

    async def fake_post(self, path, payload):
        requested_paths.append(path)
        if path == "/middle/base/marketNames/query":
            assert payload == {"markerIds": [1]}
            return {"code": 0, "data": []}
        raise AssertionError(f"不应继续请求 {path}")

    monkeypatch.setattr(GerpgoSnapshotClient, "post", fake_post)

    with pytest.raises(RuntimeError, match="积加 API 未返回目标店铺站点"):
        asyncio.run(
            create_gerpgo_snapshot(
                config=GerpgoConfig(access_token="secret-token", market_ids=[1]),
                market_id=1,
                days=7,
                count=1,
                max_pages=1,
                snapshot_root=tmp_path,
            )
        )

    assert requested_paths == ["/middle/base/marketNames/query"]
    assert list(tmp_path.iterdir()) == []


def test_create_gerpgo_snapshot_accepts_text_market_name_response(monkeypatch, tmp_path: Path) -> None:
    requested_paths: list[str] = []

    async def fake_post(self, path, payload):
        requested_paths.append(path)
        if path == "/middle/base/marketNames/query":
            assert payload == {"markerIds": [1]}
            return {"code": 200, "data": "rivbos:US"}
        return {"code": 200, "data": []}

    monkeypatch.setattr(GerpgoSnapshotClient, "post", fake_post)

    result = asyncio.run(
        create_gerpgo_snapshot(
            config=GerpgoConfig(access_token="secret-token", market_ids=[1]),
            market_id=1,
            days=7,
            count=1,
            max_pages=1,
            snapshot_root=tmp_path,
        )
    )

    manifest = result["manifest"]
    assert result["status"] == "success"
    assert manifest["shop_name"] == "rivbos"
    assert manifest["marketplace_code"] == "US"
    assert requested_paths[0] == "/middle/base/marketNames/query"


def test_create_gerpgo_snapshot_accepts_30_day_window(monkeypatch, tmp_path: Path) -> None:
    requests: list[tuple[str, dict]] = []

    async def fake_post(self, path, payload):
        requests.append((path, payload))
        if path == "/middle/base/marketNames/query":
            return {"code": 200, "data": "rivbos:US"}
        return {"code": 200, "data": []}

    monkeypatch.setattr(GerpgoSnapshotClient, "post", fake_post)

    result = asyncio.run(
        create_gerpgo_snapshot(
            config=GerpgoConfig(access_token="secret-token", market_ids=[1]),
            market_id=1,
            days=30,
            count=1,
            max_pages=1,
            snapshot_root=tmp_path,
        )
    )

    manifest = result["manifest"]
    assert result["status"] == "success"
    assert _window_days(manifest["start_date"], manifest["end_date"]) == 30
    ranged_payloads = [payload for path, payload in requests if path != "/middle/base/marketNames/query"]
    assert ranged_payloads
    for payload in ranged_payloads:
        start = payload.get("beginDate") or payload.get("startDataDate")
        end = payload.get("endDate") or payload.get("endDataDate")
        assert _window_days(start, end) == 30


def test_create_gerpgo_snapshot_can_expand_sales_pages_without_expanding_ad_pages(monkeypatch, tmp_path: Path) -> None:
    requests: list[tuple[str, dict]] = []

    async def fake_sleep(seconds: float) -> None:
        return None

    async def fake_post(self, path, payload):
        requests.append((path, payload))
        if path == "/middle/base/marketNames/query":
            return {"code": 200, "data": "rivbos:US"}
        if path == "/operation/sts/salesAnalysis/page":
            return {
                "code": 200,
                "data": {
                    "total": 3,
                    "page": payload["page"],
                    "rows": [
                        {
                            "asin": f"B0CHILD{payload['page']}",
                            "sku": f"SKU-{payload['page']}",
                            "variationAsin": "B00K4W4AAA",
                        }
                    ],
                },
            }
        return {"code": 200, "data": [{"nextId": ""}]}

    monkeypatch.setattr(GerpgoSnapshotClient, "post", fake_post)
    monkeypatch.setattr(gerpgo_snapshot.asyncio, "sleep", fake_sleep)

    result = asyncio.run(
        create_gerpgo_snapshot(
            config=GerpgoConfig(access_token="secret-token", market_ids=[1]),
            market_id=1,
            days=30,
            count=1,
            max_pages=1,
            sales_max_pages=3,
            snapshot_root=tmp_path,
        )
    )

    assert result["status"] == "success"
    sales_pages = [payload["page"] for path, payload in requests if path == "/operation/sts/salesAnalysis/page"]
    ad_paths = [path for path, _ in requests if path.startswith("/operation/ads/")]
    assert sales_pages == [1, 2, 3]
    assert ad_paths == [
        "/operation/ads/adsSpProduct/query",
        "/operation/ads/spSearchTargetingReport/page",
        "/operation/ads/spSearchKeywordsReport/page",
        "/operation/ads/adsSpPlacement/page",
    ]
    assert result["manifest"]["request_options"] == {"count": 1, "max_pages": 1, "sales_max_pages": 3}


def test_check_snapshot_readiness_rejects_placeholder_values() -> None:
    result = check_snapshot_readiness(GerpgoConfig(access_token="your_access_token", market_ids=[1]))

    assert result["ready"] is False
    assert result["missing"] == ["VALID_GERPGO_ACCESS_TOKEN"]


def _window_days(start_date: str, end_date: str) -> int:
    return (date.fromisoformat(end_date) - date.fromisoformat(start_date)).days + 1


def test_load_gerpgo_config_reads_new_project_env_file(tmp_path: Path, monkeypatch) -> None:
    clear_gerpgo_env(monkeypatch)
    (tmp_path / ".env").write_text(
        "\n".join(
            [
                "GERPGO_BASE_URL=https://example.test/api",
                "GERPGO_ACCESS_TOKEN=secret-token",
                "GERPGO_MARKET_IDS=1,2",
            ]
        ),
        encoding="utf-8",
    )

    config = load_gerpgo_config(tmp_path)

    assert config.base_url == "https://example.test/api"
    assert config.access_token == "secret-token"
    assert config.market_ids == [1, 2]


def test_load_gerpgo_config_process_env_overrides_env_file(tmp_path: Path, monkeypatch) -> None:
    clear_gerpgo_env(monkeypatch)
    (tmp_path / ".env").write_text("GERPGO_ACCESS_TOKEN=file-token\nGERPGO_MARKET_IDS=1", encoding="utf-8")
    monkeypatch.setenv("GERPGO_ACCESS_TOKEN", "process-token")

    config = load_gerpgo_config(tmp_path)

    assert config.access_token == "process-token"
    assert config.market_ids == [1]


def test_invalid_market_ids_returns_structured_not_ready(tmp_path: Path, monkeypatch) -> None:
    clear_gerpgo_env(monkeypatch)
    (tmp_path / ".env").write_text("GERPGO_ACCESS_TOKEN=secret-token\nGERPGO_MARKET_IDS=abc", encoding="utf-8")

    config = load_gerpgo_config(tmp_path)
    result = check_snapshot_readiness(config)

    assert result["ready"] is False
    assert result["missing"] == ["VALID_GERPGO_MARKET_IDS"]
    assert result["market_id"] is None
    assert "secret-token" not in str(result)
