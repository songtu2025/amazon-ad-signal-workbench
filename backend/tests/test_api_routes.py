import json
from pathlib import Path
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api import routes
from app.main import app
from app.models.product_scope import ProductScopeCoverage, ProductScopeSummary
from app.models.snapshots import MarketOption, SnapshotCreateResult, SnapshotReadiness, SnapshotStatus
from app.models.signals import (
    AdObjectRef,
    AiSignal,
    ConfidenceLevel,
    DataSourceRef,
    EvidencePackage,
    FreshnessStatus,
    MetricSnapshot,
    ObjectType,
    SignalPriority,
    SignalType,
    SuggestedAction,
)
from app.services import signal_triage as signal_triage_service
from app.services import snapshot_store
from app.services.snapshot_request import SnapshotRequestNotReady


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def test_health_route_identifies_current_project() -> None:
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ai-ads-signal-workbench"}


def test_root_route_is_not_frontend_entrypoint() -> None:
    response = TestClient(app).get("/")

    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}
    assert "http://127.0.0.1:5175/" not in response.text


def test_snapshot_readiness_route_returns_model(monkeypatch) -> None:
    monkeypatch.setattr(
        routes,
        "load_snapshot_readiness",
        lambda: SnapshotReadiness(
            ready=False,
            can_request_api=False,
            missing=["GERPGO_MARKET_IDS"],
            market_id=None,
            auth_mode="missing",
            has_snapshot=False,
            snapshot_status="missing",
            snapshot_id=None,
            reason="缺少积加 API 配置，不能拉取真实快照",
        ),
    )

    response = TestClient(app).get("/api/snapshot/readiness")

    assert response.status_code == 200
    payload = response.json()
    assert payload["can_request_api"] is False
    assert payload["missing"] == ["GERPGO_MARKET_IDS"]
    assert "access_token" not in str(payload).lower()


def test_search_intents_route_returns_review_queue_fields(monkeypatch) -> None:
    captured: dict[str, object] = {}

    def fake_build_search_intent_summaries(*, selected_market_id=None, product_scope_id=None):
        captured["selected_market_id"] = selected_market_id
        captured["product_scope_id"] = product_scope_id
        return [
            {
                "intent_label": "规则语义：儿童太阳镜",
                "search_terms": ["baby sunglasses"],
                "metrics": {
                    "impressions": 0,
                    "clicks": 8,
                    "cost": 4,
                    "orders": 2,
                    "sales": 32,
                    "acos": 0.125,
                    "cvr": 0.25,
                    "cpc": 0.5,
                },
                "insight": "需要观察",
                "semantic_source": "规则语义",
                "aba_match_count": 1,
                "top_search_terms": [
                    {
                        "search_term": "baby sunglasses",
                        "normalized_query": "baby sunglasses",
                        "clicks": 8,
                        "cost": 4,
                        "orders": 2,
                        "sales": 32,
                        "acos": 0.125,
                        "aba_rank": 120,
                        "aba_period": "2026-06-07 至 2026-06-13",
                        "source_row_count": 1,
                    }
                ],
            }
        ]

    monkeypatch.setattr(routes, "build_search_intent_summaries", fake_build_search_intent_summaries)

    response = TestClient(app).get("/api/search-intents?market_id=1&product_scope_id=parent_asin:B00K4W4AAA")

    assert response.status_code == 200
    payload = response.json()
    assert captured == {"selected_market_id": 1, "product_scope_id": "parent_asin:B00K4W4AAA"}
    assert payload[0]["semantic_source"] == "规则语义"
    assert payload[0]["aba_match_count"] == 1
    assert payload[0]["top_search_terms"][0]["search_term"] == "baby sunglasses"
    assert payload[0]["top_search_terms"][0]["aba_rank"] == 120


def test_product_scope_route_passes_market_id_query(monkeypatch) -> None:
    captured: dict[str, object] = {}

    def fake_build_product_scope_summary(*, selected_market_id=None):
        captured["selected_market_id"] = selected_market_id
        return ProductScopeSummary(
            has_snapshot=False,
            market_id=selected_market_id,
            options=[],
            coverage=ProductScopeCoverage(boundary="测试经营入口口径"),
        )

    monkeypatch.setattr(routes, "build_product_scope_summary", fake_build_product_scope_summary)

    response = TestClient(app).get("/api/product-scope?market_id=1")

    assert response.status_code == 200
    assert captured == {"selected_market_id": 1}
    assert response.json()["market_id"] == 1


def test_snapshot_readiness_route_passes_market_id_query(monkeypatch) -> None:
    captured: dict[str, object] = {}

    def fake_load_snapshot_readiness(*, selected_market_id=None):
        captured["selected_market_id"] = selected_market_id
        return SnapshotReadiness(
            ready=False,
            can_request_api=False,
            missing=["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"],
            market_id=selected_market_id,
            auth_mode="missing",
            has_snapshot=False,
            snapshot_status="missing",
            snapshot_id=None,
            reason="缺少积加 API 配置，不能拉取真实快照",
        )

    monkeypatch.setattr(routes, "load_snapshot_readiness", fake_load_snapshot_readiness)

    response = TestClient(app).get("/api/snapshot/readiness?market_id=1")

    assert response.status_code == 200
    payload = response.json()
    assert captured["selected_market_id"] == 1
    assert payload["market_id"] == 1
    assert payload["missing"] == ["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"]


def test_market_options_route_returns_safe_filter_options(monkeypatch) -> None:
    monkeypatch.setattr(
        routes,
        "load_market_options",
        lambda: [
            MarketOption(
                market_id=1,
                shop_name="rivbos",
                marketplace_code="US",
                country="US",
                source="snapshot",
                has_snapshot=True,
                snapshot_id="snapshot-1",
            )
        ],
        raising=False,
    )

    response = TestClient(app).get("/api/market-options")

    assert response.status_code == 200
    payload = response.json()
    assert payload == [
        {
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "country": "US",
            "source": "snapshot",
            "has_snapshot": True,
            "snapshot_id": "snapshot-1",
        }
    ]
    assert "access_token" not in str(payload).lower()
    assert "app_key" not in str(payload).lower()


def test_snapshot_create_route_returns_manual_request_result(monkeypatch) -> None:
    async def fake_request_api_snapshot(request):
        return SnapshotCreateResult(
            status="reused",
            snapshot_dir="D:/tmp/snapshots/gerpgo_market_1_test",
            snapshot_id="gerpgo_market_1_test",
            market_id=request.market_id,
            shop_name="rivbos",
            marketplace_code="US",
            start_date="2026-06-08",
            end_date="2026-06-14",
            row_counts={"ad_search_term_daily_metrics": 2},
            message="已复用本地快照",
        )

    monkeypatch.setattr(routes, "request_api_snapshot", fake_request_api_snapshot)
    monkeypatch.setattr(
        routes,
        "inspect_api_snapshot",
        lambda: {
            "status": "ready",
            "has_snapshot": True,
            "ready_for_signals": True,
            "snapshot_id": "gerpgo_market_1_test",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "snapshot_status": "success",
            "signal_row_count": 2,
            "row_counts": {"ad_search_term_daily_metrics": 2},
            "api_list": ["sp_search_targeting_terms"],
            "normalized_tables": [],
            "issues": [],
        },
    )

    response = TestClient(app).post("/api/snapshot/create", json={"market_id": 1, "days": 7})

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "reused"
    assert payload["snapshot_id"] == "gerpgo_market_1_test"
    assert payload["row_counts"] == {"ad_search_term_daily_metrics": 2}
    assert payload["inspection"]["ready_for_signals"] is True
    assert payload["inspection"]["signal_row_count"] == 2


def test_snapshot_create_route_returns_not_ready_without_secret_values(monkeypatch) -> None:
    async def fake_request_api_snapshot(request):
        raise SnapshotRequestNotReady(
            missing=["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"],
            market_id=request.market_id,
        )

    monkeypatch.setattr(routes, "request_api_snapshot", fake_request_api_snapshot)

    response = TestClient(app).post("/api/snapshot/create", json={"market_id": 1, "days": 7})

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "not_ready"
    assert payload["can_request_api"] is False
    assert payload["market_id"] == 1
    assert payload["missing"] == ["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"]
    assert "secret-token" not in str(payload).lower()
    assert "real-app-key" not in str(payload).lower()


def test_snapshot_probe_route_returns_not_ready_without_secret_values(monkeypatch) -> None:
    monkeypatch.setattr(routes, "load_gerpgo_config", lambda project_root: object(), raising=False)
    monkeypatch.setattr(
        routes,
        "check_snapshot_readiness",
        lambda config, selected_market_id: {
            "ready": False,
            "missing": ["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"],
            "next_action": "在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照",
            "market_id": selected_market_id,
        },
        raising=False,
    )

    response = TestClient(app).post("/api/snapshot/probe", json={"market_id": 1})

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "not_ready"
    assert payload["can_request_api"] is False
    assert payload["market_id"] == 1
    assert payload["missing"] == ["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"]
    assert payload["next_action"] == "在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照"
    assert "secret-token" not in str(payload).lower()
    assert "real-app-key" not in str(payload).lower()


def test_snapshot_probe_route_returns_safe_market_summary(monkeypatch) -> None:
    saved: dict[str, object] = {}
    monkeypatch.setattr(routes, "load_gerpgo_config", lambda project_root: object(), raising=False)
    monkeypatch.setattr(
        routes,
        "check_snapshot_readiness",
        lambda config, selected_market_id: {"ready": True, "missing": [], "market_id": selected_market_id},
        raising=False,
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

    monkeypatch.setattr(routes, "probe_gerpgo_market_access", fake_probe_gerpgo_market_access, raising=False)
    monkeypatch.setattr(
        routes,
        "save_probe_market_option",
        lambda *, market_id, market: saved.update({"market_id": market_id, "market": market}),
        raising=False,
    )

    response = TestClient(app).post("/api/snapshot/probe", json={"market_id": 1})

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["can_request_api"] is True
    assert payload["api_name"] == "market_names"
    assert payload["market_id"] == 1
    assert payload["row_count"] == 1
    assert payload["market"] == {"market_id": 1, "market_name": "rivbos US", "country": "US"}
    assert saved == {"market_id": 1, "market": {"market_id": 1, "market_name": "rivbos US", "country": "US"}}
    assert "secret-token" not in str(payload).lower()
    assert "real-app-key" not in str(payload).lower()


def test_snapshot_probe_route_does_not_cache_unmatched_market(monkeypatch) -> None:
    saved: dict[str, object] = {}
    monkeypatch.setattr(routes, "load_gerpgo_config", lambda project_root: object(), raising=False)
    monkeypatch.setattr(
        routes,
        "check_snapshot_readiness",
        lambda config, selected_market_id: {"ready": True, "missing": [], "market_id": selected_market_id},
        raising=False,
    )

    async def fake_probe_gerpgo_market_access(config, market_id):
        return {
            "status": "not_ready",
            "api_name": "market_names",
            "market_id": market_id,
            "row_count": 0,
            "market": None,
            "next_action": "检查新项目 .env 中 Gerpgo 凭据、market_id 和开放平台接口权限后重新手动拉取快照",
            "message": "积加 API 未返回目标店铺站点",
        }

    monkeypatch.setattr(routes, "probe_gerpgo_market_access", fake_probe_gerpgo_market_access, raising=False)
    monkeypatch.setattr(
        routes,
        "save_probe_market_option",
        lambda *, market_id, market: saved.update({"market_id": market_id, "market": market}),
        raising=False,
    )

    response = TestClient(app).post("/api/snapshot/probe", json={"market_id": 1})

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "not_ready"
    assert payload["can_request_api"] is True
    assert payload["market_id"] == 1
    assert payload["row_count"] == 0
    assert payload["market"] is None
    assert payload["next_action"] == "检查新项目 .env 中 Gerpgo 凭据、market_id 和开放平台接口权限后重新手动拉取快照"
    assert saved == {}


def make_api_manual_action_signal(signal_id: str, asin: str) -> AiSignal:
    return AiSignal(
        id=signal_id,
        signal_type=SignalType.OPPORTUNITY,
        signal_category="advertised_product_opportunity",
        priority=SignalPriority.P1,
        confidence=ConfidenceLevel.MEDIUM,
        shop_id="shop-rivbos",
        shop_name="rivbos",
        market_id=1,
        marketplace="US",
        object_type=ObjectType.ADVERTISED_PRODUCT,
        severity=4,
        summary=f"{asin} 广告商品机会",
        why="用于验证人工点击后读回合同",
        evidence=EvidencePackage(
            period_days=7,
            primary_object=AdObjectRef(
                object_type=ObjectType.ADVERTISED_PRODUCT,
                object_id=f"snapshot-1:ad-product:1:{asin}",
                label=asin,
                asin=asin,
            ),
            metrics=MetricSnapshot(cost=10, orders=2),
        ),
        evidence_count=1,
        data_sources=[
            DataSourceRef(
                source_type="api",
                source_name="snapshot",
                snapshot_id="snapshot-1",
                market_id=1,
                source_table="advertised_products",
            )
        ],
        freshness_status=FreshnessStatus.API_SNAPSHOT,
        detected_at="2026-06-16T10:00:00+08:00",
        uncertainty="测试不确定性",
        suggested_action=SuggestedAction(action_type="manual_review", title="人工复核", description="人工处理"),
        risk="测试风险",
    )


def make_api_search_term_context_signal(signal_id: str, search_term: str) -> AiSignal:
    return AiSignal(
        id=signal_id,
        signal_type=SignalType.OPPORTUNITY,
        signal_category="long_tail_search_term_opportunity",
        priority=SignalPriority.P2,
        confidence=ConfidenceLevel.MEDIUM,
        shop_id="market:1",
        shop_name="rivbos",
        market_id=1,
        marketplace="US",
        object_type=ObjectType.SEARCH_TERM,
        severity=3,
        summary=f"{search_term} 长尾词机会",
        why="用于验证 SearchTerm 人工动作后复盘待办能读回语义组和 ABA 上下文",
        evidence=EvidencePackage(
            period_days=30,
            primary_object=AdObjectRef(
                object_type=ObjectType.SEARCH_TERM,
                object_id=f"gerpgo_market_1_20260616_120443:{search_term}",
                label=search_term,
                search_term=search_term,
                intent_label="规则语义：海滩出行用品",
            ),
            metrics=MetricSnapshot(cost=3.2, orders=2, sales=36),
        ),
        evidence_count=6,
        data_sources=[
            DataSourceRef(
                source_type="积加API",
                source_name="积加API快照",
                snapshot_id="gerpgo_market_1_20260616_120443",
                market_id=1,
                source_table="ad_search_term_daily_metrics",
                source_record_id=f"row:{search_term}",
                start_date="2026-05-18",
                end_date="2026-06-16",
            ),
            DataSourceRef(
                source_type="ABA导出",
                source_name="ABA搜索词报表-000049101-20260616173512.xlsx",
                source_file="ABA搜索词报表-000049101-20260616173512.xlsx",
                market_id=1,
                source_table="aba_search_term_snapshots",
                source_record_id="aba:beach-essentials",
                start_date="2026-06-07",
                end_date="2026-06-13",
            ),
        ],
        freshness_status=FreshnessStatus.API_SNAPSHOT,
        detected_at="2026-06-16T12:04:43+08:00",
        uncertainty="ABA 短语包含匹配仅作为同类 SearchTerm 市场热度背景",
        suggested_action=SuggestedAction(action_type="manual_review", title="加入机会观察", description="人工判断是否小流量测试"),
        risk="样本量仍小，不自动加词或调价",
    )


def test_manual_action_api_write_then_readback_uses_same_object_identity(monkeypatch, tmp_path: Path) -> None:
    action_root = tmp_path / "manual_actions"
    review_root = tmp_path / "review_records"
    signals = [
        make_api_manual_action_signal("sig-api-observe", "B016EXMW02"),
        make_api_manual_action_signal("sig-api-handled", "B06VW5SQ97"),
        make_api_manual_action_signal("sig-api-add-to-review", "B07BS9754Q"),
        make_api_manual_action_signal("sig-api-ignore", "B00IGNOREME"),
    ]
    signals_by_id = {signal.id: signal for signal in signals}

    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", action_root)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", review_root)
    monkeypatch.setattr(routes, "_current_signals", lambda selected_market_id=None: signals)
    preflight_evidence_by_object_id: dict[str, list[dict[str, str | None]]] = {}

    def fake_build_manual_action_preflight_payload(**kwargs):
        object_id = str(kwargs.get("expected_object_id") or "")
        action_type = str(kwargs.get("expected_action_type") or "add_to_review")
        evidence_snapshot = preflight_evidence_by_object_id.get(object_id, [])
        return {
            "status": "ready_for_explicit_manual_write",
            "target": {"object_type": "advertised_product", "object_id": object_id, "action_type": action_type},
            "evidence_snapshot_preview": {
                "status": "ready",
                "will_write": False,
                "will_save_on_authorized_write": True,
                "item_count": len(evidence_snapshot),
                "items": evidence_snapshot,
            },
            "blockers": [],
        }

    monkeypatch.setattr(routes, "build_manual_action_preflight_payload", fake_build_manual_action_preflight_payload)

    client = TestClient(app)
    for signal_id, action_type in [
        ("sig-api-observe", "observe"),
        ("sig-api-handled", "handled"),
        ("sig-api-add-to-review", "add_to_review"),
    ]:
        signal = signals_by_id[signal_id]
        evidence_snapshot = [
            {
                "label": "广告商品覆盖",
                "value": "覆盖 raw 投放行 2/2 / 证据行 2 条",
                "detail": "覆盖率 100.0%",
                "source": "advertised_products",
                }
            ]
        if signal_id == "sig-api-add-to-review":
            evidence_snapshot = [
                *evidence_snapshot,
                {"label": "广告聚合指标", "value": "花费 79.28 / 订单 32 / 销售额 309.57", "source": "advertised_products"},
                {"label": "主要花费来源", "value": "RBK004-AUTO / 花费占比 69.1%", "source": "advertised_products"},
                {
                    "label": "搜索词市场背景",
                    "value": "同广告组搜索词 18 条 / ABA Top1000 匹配 1 条",
                    "source": "ad_search_term_daily_metrics + ABA导出",
                },
                {
                    "label": "上下文边界",
                    "value": "搜索词 18 条 / 广告位 0 条",
                    "detail": "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。",
                    "source": "business_rule",
                    },
                ]
        object_id = signal.evidence.primary_object.asin or ""
        preflight_evidence_by_object_id[object_id] = evidence_snapshot
        created = client.post(
            f"/api/signals/{signal_id}/manual-actions?market_id=1",
            json={
                "action_type": action_type,
                "action_note": "隔离合同测试",
                "operator_name": "本地运营",
                "expected_product_scope_id": "parent_asin:B00K4W4AAA",
                "expected_object_type": "advertised_product",
                "expected_object_id": object_id,
                "expected_can_auto_change_rules": False,
                "expected_can_auto_execute_ads": False,
                "evidence_snapshot": evidence_snapshot,
            },
        )

        assert created.status_code == 200
        action = created.json()
        assert action["signal_id"] == signal_id
        assert action["action_type"] == action_type
        assert action["shop_id"] == signal.shop_id
        assert action["market_id"] == signal.market_id
        assert action["object_type"] == "advertised_product"
        assert action["object_id"] == signal.evidence.primary_object.asin
        assert action["evidence_snapshot"][0]["label"] == "广告商品覆盖"
        assert action["evidence_snapshot"][0]["source"] == "advertised_products"
        if signal_id == "sig-api-add-to-review":
            assert [item["label"] for item in action["evidence_snapshot"]] == [
                "广告商品覆盖",
                "广告聚合指标",
                "主要花费来源",
                "搜索词市场背景",
                "上下文边界",
            ]

        signal_todos = client.get(f"/api/signals/{signal_id}/review-todos?market_id=1")
        assert signal_todos.status_code == 200
        todos = signal_todos.json()
        assert {todo["review_window"] for todo in todos} == {"7d", "14d"}
        assert {todo["action_id"] for todo in todos} == {action["id"]}
        assert {todo["object_id"] for todo in todos} == {signal.evidence.primary_object.asin}
        assert {todo["shop_id"] for todo in todos} == {signal.shop_id}
        assert {todo["market_id"] for todo in todos} == {signal.market_id}
        assert {todo["evidence_snapshot"][0]["label"] for todo in todos} == {"广告商品覆盖"}
        if signal_id == "sig-api-add-to-review":
            assert {todo["evidence_snapshot"][4]["label"] for todo in todos} == {"上下文边界"}
            assert {todo["evidence_snapshot"][4]["source"] for todo in todos} == {"business_rule"}

        records = client.get(
            f"/api/signals/{signal_id}/review-records?market_id=1&object_type=advertised_product&object_id={signal.evidence.primary_object.asin}"
        )
        assert records.status_code == 200
        assert records.json() == []

    ignore_signal = signals_by_id["sig-api-ignore"]
    ignore_object_id = ignore_signal.evidence.primary_object.asin or ""
    ignore_evidence_snapshot = [{"label": "人工确认判断依据", "value": "忽略本次但保留当时证据", "source": "manual_preflight"}]
    preflight_evidence_by_object_id[ignore_object_id] = ignore_evidence_snapshot
    ignored = client.post(
        "/api/signals/sig-api-ignore/manual-actions?market_id=1",
        json={
            "action_type": "ignore",
            "action_note": "隔离合同测试",
            "operator_name": "本地运营",
            "expected_object_type": "advertised_product",
            "expected_object_id": ignore_object_id,
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
            "evidence_snapshot": ignore_evidence_snapshot,
        },
    )
    assert ignored.status_code == 200
    assert ignored.json()["object_id"] == "B00IGNOREME"
    assert ignored.json()["evidence_snapshot"][0]["label"] == "人工确认判断依据"

    ignored_todos = client.get("/api/signals/sig-api-ignore/review-todos?market_id=1")
    assert ignored_todos.status_code == 200
    assert ignored_todos.json() == []

    all_todos = client.get("/api/review-todos?market_id=1")
    assert all_todos.status_code == 200
    global_todos = all_todos.json()
    assert len(global_todos) == 6
    assert {todo["signal_id"] for todo in global_todos} == {
        "sig-api-observe",
        "sig-api-handled",
        "sig-api-add-to-review",
    }
    assert {todo["review_window"] for todo in global_todos} == {"7d", "14d"}
    assert "sig-api-ignore" not in {todo["signal_id"] for todo in global_todos}


def test_review_todo_void_api_removes_legacy_todos_and_blocks_review_record(monkeypatch, tmp_path: Path) -> None:
    action_root = tmp_path / "manual_actions"
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", action_root)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path / "review_records")
    action_root.mkdir(parents=True, exist_ok=True)
    action_payload = {
        "id": "manual-action-legacy-gap",
        "signal_id": "sig-legacy-gap",
        "action_type": "add_to_review",
        "action_note": "历史旧动作缺证据快照",
        "operator_name": "本地运营",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "manual_status": "pending",
        "snapshot_id": "snapshot-old",
        "shop_id": "market:1",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "search_term:1:beach essentials",
        "object_label": "beach essentials",
        "evidence_snapshot": [],
    }
    (action_root / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    client = TestClient(app)

    before_response = client.get("/api/review-todos", params={"market_id": 1})
    assert before_response.status_code == 200
    assert [todo["review_window"] for todo in before_response.json()] == ["7d", "14d"]

    void_response = client.post(
        "/api/review-todos/void",
        params={"market_id": 1},
        json={
            "action_id": "manual-action-legacy-gap",
            "reason": "历史动作缺少 evidence_snapshot，不能进入 ReviewRecord。",
            "operator_name": "本地运营",
            "expected_object_type": "search_term",
            "expected_object_id": "search_term:1:beach essentials",
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )
    assert void_response.status_code == 200
    decision = void_response.json()
    assert decision["decision_type"] == "void_legacy_missing_evidence"
    assert decision["action_id"] == "manual-action-legacy-gap"
    assert decision["review_window"] is None
    assert decision["can_auto_change_rules"] is False
    assert decision["can_auto_execute_ads"] is False

    after_response = client.get("/api/review-todos", params={"market_id": 1})
    assert after_response.status_code == 200
    assert after_response.json() == []

    monkeypatch.setattr(
        routes,
        "build_review_effect_result",
        lambda *args, **kwargs: SimpleNamespace(status="ready"),
    )
    save_response = client.post(
        "/api/signals/sig-legacy-gap/review-records",
        params={"market_id": 1, "review_window": "7d"},
        json={
            "review_note": "不能保存已作废旧待办",
            "reviewer_name": "本地运营",
            "expected_action_id": "manual-action-legacy-gap",
            "expected_object_type": "search_term",
            "expected_object_id": "search_term:1:beach essentials",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": [
                {"label": "排查路径", "value": "搜索词 -> 广告活动 / 广告组"},
                {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
                {"label": "Parent ASIN入口", "value": "当前 Parent ASIN B00K4W4AAA 下只复核广告搜索词表现"},
                {"label": "广告 ASIN承接", "value": "广告 ASIN B016EXMVZS / B016EXMW02 承接该搜索词上下文"},
                {"label": "搜索词边界", "value": "beach essentials 只说明同广告组搜索词上下文"},
                {"label": "广告位边界", "value": "广告位证据缺口不能自动归因"},
                {"label": "广告组合流判断", "value": "beach essentials 已串联广告组问题定位"},
                {"label": "同组投放商品表现", "value": "B016EXMVZS 与 B016EXMW02 同组投放表现已回看"},
                {"label": "逐投放上下文", "value": "广告组 RBK004-beach essentials-精准 / 投放词 beach essentials"},
                {"label": "投放词证据", "value": "beach essentials / 1 个"},
                {"label": "ABA 背景", "value": "ABA 排名 208"},
                {"label": "证据缺口", "value": "缺少主推策略和投放词维护状态"},
                {"label": "需要补证", "value": "补齐投放词维护状态、广告商品承接和主推策略"},
                {"label": "动作边界", "value": "只允许人工留痕和复盘"},
            ],
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )
    assert save_response.status_code == 409
    assert save_response.json()["detail"] == "review_record_preflight_mismatch"


def test_review_effect_route_uses_snapshot_rows_for_matching_search_term_only(
    monkeypatch,
    tmp_path: Path,
) -> None:
    action_root = tmp_path / "manual_actions"
    action_root.mkdir(parents=True)
    action_payload = {
        "id": "manual-action-beach-essentials-route",
        "signal_id": "sig-opportunity-search-term-1-beach-essentials",
        "action_type": "add_to_review",
        "action_note": "加入复盘",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "pending",
        "snapshot_id": "snapshot-before",
        "shop_id": "market:1",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "search_term:1:beach essentials",
        "object_label": "beach essentials",
        "evidence_snapshot": [
            {"label": "排查路径", "value": "Parent ASIN B00K4W4AAA -> beach essentials"},
            {"label": "搜索词边界", "value": "beach essentials 只说明同广告组搜索词上下文"},
            {"label": "动作边界", "value": "只允许人工留痕和复盘"},
        ],
    }
    (action_root / "manual_actions.jsonl").write_text(
        json.dumps(action_payload, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    signal_rows = [
        {
            "market_id": 1,
            "object_type": "search_term",
            "source_table": "ad_search_term_daily_metrics",
            "search_term": "beach essentials",
            "start_date": "2026-06-01",
            "end_date": "2026-06-07",
            "cost": 41,
            "orders": 2,
            "sales": 160,
        },
        {
            "market_id": 1,
            "object_type": "search_term",
            "source_table": "ad_search_term_daily_metrics",
            "search_term": "beach essentials",
            "start_date": "2026-06-09",
            "end_date": "2026-06-15",
            "cost": 30,
            "orders": 4,
            "sales": 200,
        },
        {
            "market_id": 1,
            "object_type": "search_term",
            "source_table": "ad_search_term_daily_metrics",
            "search_term": "pool towels",
            "start_date": "2026-06-09",
            "end_date": "2026-06-15",
            "cost": 999,
            "orders": 99,
            "sales": 9999,
        },
        {
            "market_id": 1,
            "object_type": "advertised_product",
            "source_table": "ad_product_daily_metrics",
            "asin": "B016EXMW02",
            "search_term": "beach essentials",
            "start_date": "2026-06-09",
            "end_date": "2026-06-15",
            "cost": 888,
            "orders": 88,
            "sales": 8888,
        },
        {
            "market_id": 1,
            "object_type": "placement",
            "source_table": "ad_placement_daily_metrics",
            "placement": "Top of Search",
            "search_term": "beach essentials",
            "start_date": "2026-06-09",
            "end_date": "2026-06-15",
            "cost": 777,
            "orders": 77,
            "sales": 7777,
        },
    ]
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", action_root)
    monkeypatch.setattr(routes, "load_signal_rows_from_success_snapshots", lambda: signal_rows)

    response = TestClient(app).get(
        "/api/signals/sig-opportunity-search-term-1-beach-essentials/review-effect",
        params={"market_id": 1, "review_window": "7d"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["object_type"] == "search_term"
    assert payload["object_id"] == "search_term:1:beach essentials"
    assert payload["before_metrics"]["cost"] == 41
    assert payload["before_metrics"]["orders"] == 2
    assert payload["after_metrics"]["cost"] == 30
    assert payload["after_metrics"]["orders"] == 4
    assert payload["after_metrics"]["sales"] == 200


def test_review_record_rejects_evidence_snapshot_object_mismatch(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path / "manual_actions")
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path / "review_records")
    monkeypatch.setattr(
        routes,
        "build_review_effect_result",
        lambda *args, **kwargs: SimpleNamespace(status="ready"),
    )
    client = TestClient(app)

    response = client.post(
        "/api/signals/sig-opportunity-search-term-1-beach-essentials/review-records",
        params={"market_id": 1, "review_window": "7d"},
        json={
            "review_note": "对象不一致不能保存",
            "reviewer_name": "本地运营",
            "expected_object_type": "search_term",
            "expected_object_id": "search_term:1:beach essentials",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": [
                {"label": "排查路径", "value": "搜索词 -> 广告活动 / 广告组"},
                {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
                {"label": "Parent ASIN入口", "value": "当前 Parent ASIN B00K4W4AAA 下只复核广告搜索词表现"},
                {"label": "广告 ASIN承接", "value": "广告 ASIN B016EXMVZS / B016EXMW02 承接该搜索词上下文"},
                {"label": "搜索词边界", "value": "boys sunglasses 只说明同广告组搜索词上下文"},
                {"label": "广告位边界", "value": "广告位证据缺口不能自动归因"},
                {"label": "广告组合流判断", "value": "boys sunglasses 已串联广告组问题定位"},
                {"label": "同组投放商品表现", "value": "B016EXMVZS 与 B016EXMW02 同组投放表现已回看"},
                {"label": "逐投放上下文", "value": "广告组 RBK004-boys sunglasses-精准 / 投放词 boys sunglasses"},
                {"label": "投放词证据", "value": "boys sunglasses / 1 个"},
                {"label": "ABA 背景", "value": "ABA 未命中"},
                {"label": "证据缺口", "value": "缺少主推策略和投放词维护状态"},
                {"label": "需要补证", "value": "补齐投放词维护状态、广告商品承接和主推策略"},
                {"label": "动作边界", "value": "只允许人工留痕和复盘"},
                {"label": "人工确认判断依据", "value": "boys sunglasses 产生 3 单，可进入人工扩量复核"},
            ],
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "review_record_evidence_snapshot_object_mismatch"


def test_review_record_rejects_search_term_snapshot_without_action_boundary(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path / "manual_actions")
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path / "review_records")
    monkeypatch.setattr(
        routes,
        "build_review_effect_result",
        lambda *args, **kwargs: SimpleNamespace(status="ready"),
    )
    client = TestClient(app)

    response = client.post(
        "/api/signals/sig-opportunity-search-term-1-beach-essentials/review-records",
        params={"market_id": 1, "review_window": "7d"},
        json={
            "review_note": "缺动作边界不能保存",
            "reviewer_name": "本地运营",
            "expected_object_type": "search_term",
            "expected_object_id": "search_term:1:beach essentials",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": [
                {"label": "排查路径", "value": "搜索词 -> 广告活动 / 广告组"},
                {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
                {"label": "Parent ASIN入口", "value": "当前 Parent ASIN B00K4W4AAA 下只复核广告搜索词表现"},
                {"label": "广告 ASIN承接", "value": "广告 ASIN B016EXMVZS / B016EXMW02 承接该搜索词上下文"},
                {"label": "搜索词边界", "value": "beach essentials 只说明同广告组搜索词上下文"},
                {"label": "广告位边界", "value": "广告位证据缺口不能自动归因"},
                {"label": "广告组合流判断", "value": "beach essentials 已串联广告组问题定位"},
                {"label": "同组投放商品表现", "value": "B016EXMVZS 与 B016EXMW02 同组投放表现已回看"},
                {"label": "逐投放上下文", "value": "广告组 RBK004-beach essentials-精准 / 投放词 beach essentials"},
                {"label": "投放词证据", "value": "beach essentials / 1 个"},
                {"label": "ABA 背景", "value": "ABA 排名 208"},
                {"label": "证据缺口", "value": "缺少主推策略和投放词维护状态"},
                {"label": "需要补证", "value": "补齐投放词维护状态、广告商品承接和主推策略"},
            ],
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "review_record_missing_action_boundary"


def test_review_record_rejects_search_term_snapshot_without_required_evidence(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path / "manual_actions")
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path / "review_records")
    monkeypatch.setattr(
        routes,
        "build_review_effect_result",
        lambda *args, **kwargs: SimpleNamespace(status="ready"),
    )
    client = TestClient(app)

    response = client.post(
        "/api/signals/sig-opportunity-search-term-1-beach-essentials/review-records",
        params={"market_id": 1, "review_window": "7d"},
        json={
            "review_note": "缺需要补证不能保存",
            "reviewer_name": "本地运营",
            "expected_object_type": "search_term",
            "expected_object_id": "search_term:1:beach essentials",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": [
                {"label": "排查路径", "value": "搜索词 -> 广告活动 / 广告组"},
                {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
                {"label": "Parent ASIN入口", "value": "当前 Parent ASIN B00K4W4AAA 下只复核广告搜索词表现"},
                {"label": "广告 ASIN承接", "value": "广告 ASIN B016EXMVZS / B016EXMW02 承接该搜索词上下文"},
                {"label": "搜索词边界", "value": "beach essentials 只说明同广告组搜索词上下文"},
                {"label": "广告位边界", "value": "广告位证据缺口不能自动归因"},
                {"label": "广告组合流判断", "value": "beach essentials 已串联广告组问题定位"},
                {"label": "同组投放商品表现", "value": "B016EXMVZS 与 B016EXMW02 同组投放表现已回看"},
                {"label": "逐投放上下文", "value": "广告组 RBK004-beach essentials-精准 / 投放词 beach essentials"},
                {"label": "投放词证据", "value": "beach essentials / 1 个"},
                {"label": "ABA 背景", "value": "ABA 排名 208"},
                {"label": "证据缺口", "value": "缺少主推策略和投放词维护状态"},
                {"label": "动作边界", "value": "只允许人工留痕和复盘"},
            ],
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "review_record_missing_required_evidence"


def test_review_record_rejects_search_term_snapshot_without_ad_context_rows(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path / "manual_actions")
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path / "review_records")
    monkeypatch.setattr(
        routes,
        "build_review_effect_result",
        lambda *args, **kwargs: SimpleNamespace(status="ready"),
    )
    client = TestClient(app)

    response = client.post(
        "/api/signals/sig-opportunity-search-term-1-beach-essentials/review-records",
        params={"market_id": 1, "review_window": "7d"},
        json={
            "review_note": "缺逐投放上下文不能保存",
            "reviewer_name": "本地运营",
            "expected_object_type": "search_term",
            "expected_object_id": "search_term:1:beach essentials",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": [
                {"label": "排查路径", "value": "搜索词 -> 广告活动 / 广告组"},
                {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
                {"label": "Parent ASIN入口", "value": "当前 Parent ASIN B00K4W4AAA 下只复核广告搜索词表现"},
                {"label": "广告 ASIN承接", "value": "广告 ASIN B016EXMVZS / B016EXMW02 承接该搜索词上下文"},
                {"label": "搜索词边界", "value": "beach essentials 只说明同广告组搜索词上下文"},
                {"label": "广告位边界", "value": "广告位证据缺口不能自动归因"},
                {"label": "广告组合流判断", "value": "beach essentials 已串联广告组问题定位"},
                {"label": "同组投放商品表现", "value": "B016EXMVZS 与 B016EXMW02 同组投放表现已回看"},
                {"label": "投放词证据", "value": "beach essentials / 1 个"},
                {"label": "ABA 背景", "value": "ABA 排名 208"},
                {"label": "证据缺口", "value": "缺少主推策略和投放词维护状态"},
                {"label": "需要补证", "value": "补齐投放词维护状态、广告商品承接和主推策略"},
                {"label": "动作边界", "value": "只允许人工留痕和复盘"},
            ],
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "review_record_missing_ad_context_rows"


def test_review_record_rejects_search_term_snapshot_without_ad_group_synthesis(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path / "manual_actions")
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path / "review_records")
    monkeypatch.setattr(
        routes,
        "build_review_effect_result",
        lambda *args, **kwargs: SimpleNamespace(status="ready"),
    )
    client = TestClient(app)

    response = client.post(
        "/api/signals/sig-opportunity-search-term-1-beach-essentials/review-records",
        params={"market_id": 1, "review_window": "7d"},
        json={
            "review_note": "缺广告组问题定位不能保存",
            "reviewer_name": "本地运营",
            "expected_object_type": "search_term",
            "expected_object_id": "search_term:1:beach essentials",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": [
                {"label": "排查路径", "value": "搜索词 -> 广告活动 / 广告组"},
                {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
                {"label": "Parent ASIN入口", "value": "当前 Parent ASIN B00K4W4AAA 下只复核广告搜索词表现"},
                {"label": "广告 ASIN承接", "value": "广告 ASIN B016EXMVZS / B016EXMW02 承接该搜索词上下文"},
                {"label": "搜索词边界", "value": "beach essentials 只说明同广告组搜索词上下文"},
                {"label": "广告位边界", "value": "广告位证据缺口不能自动归因"},
                {"label": "投放词证据", "value": "beach essentials / 1 个"},
                {"label": "ABA 背景", "value": "ABA 排名 208"},
                {"label": "证据缺口", "value": "缺少主推策略和投放词维护状态"},
                {"label": "需要补证", "value": "补齐投放词维护状态、广告商品承接和主推策略"},
                {"label": "动作边界", "value": "只允许人工留痕和复盘"},
            ],
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "review_record_missing_ad_group_synthesis"


def test_review_record_rejects_advertised_product_snapshot_without_ad_product_coverage(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path / "manual_actions")
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path / "review_records")
    monkeypatch.setattr(
        routes,
        "build_review_effect_result",
        lambda *args, **kwargs: SimpleNamespace(status="ready"),
    )
    client = TestClient(app)

    response = client.post(
        "/api/signals/sig-ad-product/review-records",
        params={"market_id": 1, "review_window": "7d"},
        json={
            "review_note": "缺广告商品覆盖不能保存",
            "reviewer_name": "本地运营",
            "expected_object_type": "advertised_product",
            "expected_object_id": "B016EXMW02",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": [
                {"label": "排查路径", "value": "Parent 经营盘子 -> 广告 ASIN -> 广告组"},
                {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
                {"label": "搜索词边界", "value": "搜索词只说明同广告组上下文"},
                {"label": "广告位边界", "value": "广告位证据缺口不能自动归因"},
                {"label": "广告组合流判断", "value": "B016EXMW02 已串联广告组容器判断"},
                {"label": "证据缺口", "value": "缺少主推策略和广告位证据"},
                {"label": "需要补证", "value": "补齐广告位和投放词维护状态"},
                {"label": "动作边界", "value": "只允许人工留痕和复盘"},
            ],
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "review_record_missing_ad_product_coverage"


def test_beach_essentials_manual_action_api_roundtrip_reads_back_evidence_snapshot(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path / "manual_actions")
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path / "review_records")
    client = TestClient(app)

    preflight_response = client.get(
        "/api/manual-action/preflight",
        params={
            "market_id": 1,
            "top": 5,
            "product_scope_id": "parent_asin:B00K4W4AAA",
            "expected_object_id": "search_term:1:beach essentials",
            "expected_object_type": "search_term",
            "action_type": "add_to_review",
            "expect_written": "false",
        },
    )

    assert preflight_response.status_code == 200
    preflight = preflight_response.json()
    assert preflight["status"] == "ready_for_explicit_manual_write"
    assert preflight["will_write"] is False
    assert preflight["target"]["signal_id"] == "sig-opportunity-search-term-1-beach-essentials"
    assert preflight["target"]["object_type"] == "search_term"
    assert preflight["target"]["object_id"] == "search_term:1:beach essentials"
    assert preflight["evidence_snapshot_preview"]["item_count"] == 32
    assert preflight["evidence_snapshot_preview"]["items"][0]["label"] == "排查路径"
    assert preflight["evidence_snapshot_preview"]["items"][1]["label"] == "AI 准入"
    assert preflight["evidence_snapshot_preview"]["items"][2]["label"] == "搜索词"
    assert "搜索词 -> 广告活动 / 广告组" in preflight["evidence_snapshot_preview"]["items"][0]["value"]
    assert "ready_for_manual_confirmation" in preflight["evidence_snapshot_preview"]["items"][1]["value"]
    assert "不会自动执行广告动作" in preflight["evidence_snapshot_preview"]["items"][1]["detail"]
    snapshot_items = preflight["evidence_snapshot_preview"]["items"]
    assert {
        "搜索词边界",
        "搜索词表现分组",
        "搜索词表现判断",
        "广告位边界",
        "Parent ASIN入口",
        "广告 ASIN承接",
        "广告位活动级背景",
        "广告组合流判断",
        "同组投放商品表现",
        "逐投放上下文",
        "人工确认判断依据",
        "能证明的事实",
        "不能证明的边界",
        "人工下一步",
        "诊断证据缺口",
        "需要补证",
        "投放词证据",
        "ABA 背景",
        "证据缺口",
        "动作边界",
    }.issubset(
        {item["label"] for item in snapshot_items}
    )
    snapshot_by_label = {item["label"]: item for item in snapshot_items}
    assert "beach essentials" in snapshot_by_label["搜索词"]["value"]
    assert "search_term:1:beach essentials" in snapshot_by_label["搜索词"]["value"]
    assert "人工确认和 7/14 天复盘对象是这个具体 SearchTerm" in snapshot_by_label["搜索词"]["detail"]
    assert snapshot_by_label["搜索词表现分组"]["value"] == "规则语义：海滩出行用品"
    assert snapshot_by_label["搜索词表现分组"]["source"] == "规则语义"
    assert "不能替代顶部诊断入口" in snapshot_by_label["搜索词表现分组"]["detail"]
    assert "扩量复核" in snapshot_by_label["搜索词表现判断"]["value"]
    assert "订单" in snapshot_by_label["搜索词表现判断"]["value"]
    assert "ACOS" in snapshot_by_label["搜索词表现判断"]["value"]
    assert snapshot_by_label["搜索词表现判断"]["source"] == "ad_search_term_daily_metrics"
    assert "只用于人工复核优先级" in snapshot_by_label["搜索词表现判断"]["detail"]
    assert "不自动加词" in snapshot_by_label["搜索词表现判断"]["detail"]
    assert "beach essentials" in snapshot_by_label["广告组合流判断"]["value"]
    assert "RBK004-beach essentials-精准" in snapshot_by_label["广告组合流判断"]["value"]
    assert "RBK004-扩展-beach essentials" in snapshot_by_label["广告组合流判断"]["value"]
    assert "B016EXMVZS" in snapshot_by_label["广告组合流判断"]["value"]
    assert "B07BS9754Q" in snapshot_by_label["广告组合流判断"]["value"]
    assert "B016EXMW02" in snapshot_by_label["广告组合流判断"]["value"]
    assert "广告组级广告位 0 条 / 同广告活动广告位 6 条" in snapshot_by_label["广告组合流判断"]["value"]
    assert "自动归因到单个广告 ASIN" in snapshot_by_label["广告组合流判断"]["detail"]
    assert "B016EXMVZS" in snapshot_by_label["同组投放商品表现"]["value"]
    assert "B016EXMW02" in snapshot_by_label["同组投放商品表现"]["value"]
    assert "RBK004-beach essentials-精准" in snapshot_by_label["逐投放上下文"]["value"]
    assert "RBK004-扩展-beach essentials" in snapshot_by_label["逐投放上下文"]["value"]
    assert "投放词 beach essentials" in snapshot_by_label["逐投放上下文"]["value"]
    assert "不能自动归因到单个广告 ASIN" in snapshot_by_label["逐投放上下文"]["detail"]
    assert "不能自动归因到单个 ASIN" in snapshot_by_label["搜索词边界"]["detail"]
    assert "广告位" in snapshot_by_label["广告位边界"]["value"]
    assert "不能自动归因到单个搜索词或广告 ASIN" in snapshot_by_label["广告位边界"]["detail"]
    assert "Top of Search on-Amazon" in snapshot_by_label["广告位活动级背景"]["value"]
    assert "Detail Page on-Amazon" in snapshot_by_label["广告位活动级背景"]["value"]
    assert "只有 campaign_id" in snapshot_by_label["广告位活动级背景"]["detail"]
    assert "不能替代广告组级广告位归因" in snapshot_by_label["广告位活动级背景"]["detail"]
    assert "beach essentials" in snapshot_by_label["投放词证据"]["value"]
    assert "ABA" in snapshot_by_label["ABA 背景"]["value"]
    assert "不得自动加词" in snapshot_by_label["动作边界"]["detail"]

    created_response = client.post(
        f"/api/signals/{preflight['target']['signal_id']}/manual-actions",
        params={"market_id": 1},
        json={
            "action_type": "add_to_review",
            "action_note": "加入复盘",
            "operator_name": "本地运营",
            "expected_product_scope_id": "parent_asin:B00K4W4AAA",
            "expected_object_type": preflight["target"]["object_type"],
            "expected_object_id": preflight["target"]["object_id"],
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
            "evidence_snapshot": preflight["evidence_snapshot_preview"]["items"],
        },
    )

    assert created_response.status_code == 200
    action = created_response.json()
    assert action["signal_id"] == "sig-opportunity-search-term-1-beach-essentials"
    assert action["object_type"] == "search_term"
    assert action["object_id"] == "search_term:1:beach essentials"
    assert action["shop_id"] == "market:1"
    assert action["market_id"] == 1
    assert action["action_note"] == "加入复盘"
    assert action["operator_name"] == "本地运营"
    assert len(action["evidence_snapshot"]) == 32
    assert action["evidence_snapshot"][0]["label"] == "排查路径"
    assert action["evidence_snapshot"][1]["label"] == "AI 准入"
    assert action["evidence_snapshot"][2]["label"] == "搜索词"
    assert "search_term:1:beach essentials" in action["evidence_snapshot"][2]["value"]
    assert {item["label"] for item in action["evidence_snapshot"]}.issuperset(
        {
            "搜索词",
            "搜索词表现分组",
            "搜索词表现判断",
            "广告组合流判断",
            "Parent ASIN入口",
            "广告 ASIN承接",
            "同组投放商品表现",
            "逐投放上下文",
            "搜索词边界",
            "广告位边界",
            "广告位活动级背景",
            "投放词证据",
            "ABA 背景",
            "证据缺口",
            "需要补证",
            "动作边界",
        }
    )

    todos_response = client.get(
        f"/api/signals/{preflight['target']['signal_id']}/review-todos",
        params={"market_id": 1},
    )

    assert todos_response.status_code == 200
    todos = todos_response.json()
    assert [todo["review_window"] for todo in todos] == ["7d", "14d"]
    assert {todo["action_id"] for todo in todos} == {action["id"]}
    assert {todo["object_id"] for todo in todos} == {"search_term:1:beach essentials"}
    assert [len(todo["evidence_snapshot"]) for todo in todos] == [32, 32]
    assert [todo["evidence_snapshot"][0]["label"] for todo in todos] == ["排查路径", "排查路径"]
    assert [todo["evidence_snapshot"][1]["label"] for todo in todos] == ["AI 准入", "AI 准入"]
    assert {todo["evidence_snapshot"][2]["label"] for todo in todos} == {"搜索词"}
    assert {todo["evidence_snapshot"][3]["label"] for todo in todos} == {"搜索词表现分组"}
    assert {todo["evidence_snapshot"][4]["label"] for todo in todos} == {"搜索词表现判断"}
    assert {todo["evidence_snapshot"][5]["label"] for todo in todos} == {"Parent ASIN入口"}
    assert {todo["evidence_snapshot"][6]["label"] for todo in todos} == {"广告 ASIN承接"}
    assert {todo["evidence_snapshot"][7]["label"] for todo in todos} == {"广告组合流判断"}
    assert {todo["evidence_snapshot"][8]["label"] for todo in todos} == {"同组投放商品表现"}
    assert {todo["evidence_snapshot"][9]["label"] for todo in todos} == {"逐投放上下文"}
    assert {todo["evidence_snapshot"][10]["label"] for todo in todos} == {"投放词证据"}
    assert {todo["evidence_snapshot"][11]["label"] for todo in todos} == {"搜索词边界"}
    assert {todo["evidence_snapshot"][12]["label"] for todo in todos} == {"广告位边界"}
    assert {todo["evidence_snapshot"][13]["label"] for todo in todos} == {"广告位活动级背景"}
    assert {todo["evidence_snapshot"][14]["label"] for todo in todos} == {"ABA 背景"}
    assert {
        "自动归因到单个广告 ASIN" in todo["evidence_snapshot"][7]["detail"] for todo in todos
    } == {True}

    post_write_response = client.get(
        "/api/manual-action/preflight",
        params={
            "market_id": 1,
            "top": 5,
            "product_scope_id": "parent_asin:B00K4W4AAA",
            "expected_object_id": action["object_id"],
            "expected_object_type": action["object_type"],
            "action_type": action["action_type"],
            "expect_written": "true",
        },
    )

    assert post_write_response.status_code == 200
    post_write = post_write_response.json()
    assert post_write["status"] == "post_write_verified"
    assert post_write["post_write_checks"]["target_review_windows"] == ["7d", "14d"]
    assert post_write["post_write_checks"]["target_manual_action_evidence_snapshot_counts"] == [
        {
            "signal_id": "sig-opportunity-search-term-1-beach-essentials",
            "object_type": "search_term",
            "object_id": "search_term:1:beach essentials",
            "evidence_snapshot_count": 32,
        }
    ]
    assert {
        item["review_window"]: item["evidence_snapshot_count"]
        for item in post_write["post_write_checks"]["target_review_todo_evidence_snapshot_counts"]
    } == {"7d": 32, "14d": 32}
    assert post_write["post_write_checks"]["target_review_record_count"] == 0
    assert "不执行广告动作" in post_write["forbidden_effects"]


def test_beach_essentials_manual_action_post_write_readback_distinguishes_action_types(
    monkeypatch, tmp_path: Path
) -> None:
    client = TestClient(app)

    for action_type, expected_review_todos in [
        ("observe", 2),
        ("handled", 2),
        ("add_to_review", 2),
        ("ignore", 0),
    ]:
        monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path / action_type / "manual_actions")
        monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path / action_type / "review_records")

        preflight_response = client.get(
            "/api/manual-action/preflight",
            params={
                "market_id": 1,
                "top": 5,
                "product_scope_id": "parent_asin:B00K4W4AAA",
                "expected_object_id": "search_term:1:beach essentials",
                "expected_object_type": "search_term",
                "action_type": action_type,
                "expect_written": "false",
            },
        )
        assert preflight_response.status_code == 200
        preflight = preflight_response.json()
        assert preflight["status"] == "ready_for_explicit_manual_write"
        assert preflight["target"]["action_type"] == action_type
        assert preflight["expected_after_write"]["target_manual_action_count"] == 1
        assert preflight["expected_after_write"]["target_review_todo_count"] == expected_review_todos
        assert preflight["evidence_snapshot_preview"]["items"][0]["label"] == "排查路径"
        assert preflight["evidence_snapshot_preview"]["items"][1]["label"] == "AI 准入"
        assert {
            "广告组合流判断",
            "搜索词表现分组",
            "搜索词表现判断",
            "同组投放商品表现",
            "逐投放上下文",
            "广告位活动级背景",
            "人工确认判断依据",
            "不能证明的边界",
            "人工下一步",
            "诊断证据缺口",
            "需要补证",
            "投放词证据",
            "ABA 背景",
            "证据缺口",
            "动作边界",
        }.issubset(
            {item["label"] for item in preflight["evidence_snapshot_preview"]["items"]}
        )

        created_response = client.post(
            f"/api/signals/{preflight['target']['signal_id']}/manual-actions",
            params={"market_id": 1},
            json={
                "action_type": action_type,
                "action_note": f"隔离读回测试：{action_type}",
                "operator_name": "本地运营",
                "expected_product_scope_id": "parent_asin:B00K4W4AAA",
                "expected_object_type": preflight["target"]["object_type"],
                "expected_object_id": preflight["target"]["object_id"],
                "expected_can_auto_change_rules": False,
                "expected_can_auto_execute_ads": False,
                "evidence_snapshot": preflight["evidence_snapshot_preview"]["items"],
            },
        )
        assert created_response.status_code == 200
        action = created_response.json()
        assert action["action_type"] == action_type
        assert action["object_type"] == "search_term"
        assert action["object_id"] == "search_term:1:beach essentials"
        assert len(action["evidence_snapshot"]) == 32
        assert {item["label"] for item in action["evidence_snapshot"]}.issuperset(
            {
                "搜索词",
                "搜索词表现分组",
                "搜索词表现判断",
                "广告组合流判断",
                "Parent ASIN入口",
                "广告 ASIN承接",
                "同组投放商品表现",
                "逐投放上下文",
                "搜索词边界",
                "广告位边界",
                "广告位活动级背景",
                "投放词证据",
                "ABA 背景",
                "证据缺口",
                "需要补证",
                "动作边界",
            }
        )
        snapshot_by_label = {item["label"]: item for item in action["evidence_snapshot"]}
        assert "beach essentials" in snapshot_by_label["搜索词"]["value"]
        assert "search_term:1:beach essentials" in snapshot_by_label["搜索词"]["value"]
        assert snapshot_by_label["搜索词表现分组"]["value"] == "规则语义：海滩出行用品"
        assert "不能替代顶部诊断入口" in snapshot_by_label["搜索词表现分组"]["detail"]
        assert "扩量复核" in snapshot_by_label["搜索词表现判断"]["value"]
        assert "只用于人工复核优先级" in snapshot_by_label["搜索词表现判断"]["detail"]
        assert "beach essentials" in snapshot_by_label["广告组合流判断"]["value"]
        assert "RBK004-beach essentials-精准" in snapshot_by_label["广告组合流判断"]["value"]
        assert "RBK004-扩展-beach essentials" in snapshot_by_label["广告组合流判断"]["value"]
        assert "B016EXMVZS" in snapshot_by_label["广告组合流判断"]["value"]
        assert "B07BS9754Q" in snapshot_by_label["广告组合流判断"]["value"]
        assert "B016EXMW02" in snapshot_by_label["广告组合流判断"]["value"]
        assert "广告组级广告位 0 条 / 同广告活动广告位 6 条" in snapshot_by_label["广告组合流判断"]["value"]
        assert "自动归因到单个广告 ASIN" in snapshot_by_label["广告组合流判断"]["detail"]
        assert "B016EXMVZS" in snapshot_by_label["同组投放商品表现"]["value"]
        assert "RBK004-beach essentials-精准" in snapshot_by_label["逐投放上下文"]["value"]
        assert "不能替代广告组级广告位归因" in snapshot_by_label["广告位活动级背景"]["detail"]

        todos_response = client.get(
            f"/api/signals/{preflight['target']['signal_id']}/review-todos",
            params={"market_id": 1},
        )
        assert todos_response.status_code == 200
        todos = todos_response.json()
        assert len(todos) == expected_review_todos
        if expected_review_todos:
            assert [todo["review_window"] for todo in todos] == ["7d", "14d"]
            assert {todo["action_type"] for todo in todos} == {action_type}
            assert {todo["action_id"] for todo in todos} == {action["id"]}
            assert [len(todo["evidence_snapshot"]) for todo in todos] == [32, 32]
            assert {todo["evidence_snapshot"][2]["label"] for todo in todos} == {"搜索词"}
            assert {todo["evidence_snapshot"][3]["label"] for todo in todos} == {"搜索词表现分组"}
            assert {todo["evidence_snapshot"][4]["label"] for todo in todos} == {"搜索词表现判断"}
            assert {todo["evidence_snapshot"][5]["label"] for todo in todos} == {"Parent ASIN入口"}
            assert {todo["evidence_snapshot"][6]["label"] for todo in todos} == {"广告 ASIN承接"}
            assert {todo["evidence_snapshot"][7]["label"] for todo in todos} == {"广告组合流判断"}
            assert {todo["evidence_snapshot"][8]["label"] for todo in todos} == {"同组投放商品表现"}
            assert {todo["evidence_snapshot"][9]["label"] for todo in todos} == {"逐投放上下文"}
            assert {todo["evidence_snapshot"][10]["label"] for todo in todos} == {"投放词证据"}
            assert {todo["evidence_snapshot"][11]["label"] for todo in todos} == {"搜索词边界"}
            assert {todo["evidence_snapshot"][12]["label"] for todo in todos} == {"广告位边界"}
            assert {todo["evidence_snapshot"][13]["label"] for todo in todos} == {"广告位活动级背景"}
            assert {todo["evidence_snapshot"][14]["label"] for todo in todos} == {"ABA 背景"}

        post_write_response = client.get(
            "/api/manual-action/preflight",
            params={
                "market_id": 1,
                "top": 5,
                "product_scope_id": "parent_asin:B00K4W4AAA",
                "expected_object_id": action["object_id"],
                "expected_object_type": action["object_type"],
                "action_type": action["action_type"],
                "expect_written": "true",
            },
        )
        assert post_write_response.status_code == 200
        post_write = post_write_response.json()
        assert post_write["status"] == "post_write_verified"
        assert post_write["target"]["action_type"] == action_type
        assert post_write["current_counts"]["target_manual_action_count"] == 1
        assert post_write["current_counts"]["target_review_todo_count"] == expected_review_todos
        assert post_write["expected_after_write"]["target_manual_action_count"] == 1
        assert post_write["expected_after_write"]["target_review_todo_count"] == expected_review_todos
        assert post_write["post_write_checks"]["target_review_record_count"] == 0
        assert post_write["post_write_checks"]["target_review_windows"] == (
            ["7d", "14d"] if expected_review_todos else []
        )
        assert [
            item["evidence_snapshot_count"]
            for item in post_write["post_write_checks"]["target_manual_action_evidence_snapshot_counts"]
        ] == [32]
        assert "不执行广告动作" in post_write["forbidden_effects"]


def test_manual_action_api_rejects_action_without_evidence_snapshot(monkeypatch, tmp_path: Path) -> None:
    action_root = tmp_path / "manual_actions"
    review_root = tmp_path / "review_records"
    signals = [make_api_manual_action_signal("sig-api-add-to-review", "B07BS9754Q")]

    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", action_root)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", review_root)
    monkeypatch.setattr(routes, "_current_signals", lambda selected_market_id=None: signals)

    client = TestClient(app)
    for action_type in ("add_to_review", "ignore"):
        response = client.post(
            "/api/signals/sig-api-add-to-review/manual-actions?market_id=1",
            json={
                "action_type": action_type,
                "action_note": "空证据不应进入人工留痕",
                "operator_name": "本地运营",
                "expected_can_auto_change_rules": False,
                "expected_can_auto_execute_ads": False,
            },
        )

        assert response.status_code == 409
        assert response.json()["detail"] == "manual_action_missing_evidence_snapshot"
    assert not (action_root / "manual_actions.jsonl").exists()


def test_manual_action_api_rejects_evidence_snapshot_that_does_not_match_preflight(
    monkeypatch, tmp_path: Path
) -> None:
    action_root = tmp_path / "manual_actions"
    review_root = tmp_path / "review_records"
    signals = [make_api_manual_action_signal("sig-api-add-to-review", "B07BS9754Q")]
    expected_evidence_snapshot = [
        {"label": "广告商品覆盖", "value": "覆盖 B07BS9754Q 投放行 2/2", "source": "advertised_products"},
        {"label": "广告聚合指标", "value": "花费 79.28 / 订单 32 / 销售额 309.57", "source": "advertised_products"},
        {"label": "主要花费来源", "value": "RBK004-AUTO / 花费占比 69.1%", "source": "advertised_products"},
        {"label": "搜索词市场背景", "value": "同广告组搜索词 18 条 / ABA Top1000 匹配 1 条", "source": "ad_search_term_daily_metrics + ABA导出"},
        {"label": "上下文边界", "value": "搜索词 18 条 / 广告位 0 条", "source": "business_rule"},
    ]

    def fake_build_manual_action_preflight_payload(**kwargs):
        return {
            "status": "ready_for_explicit_manual_write",
            "target": {
                "object_type": "advertised_product",
                "object_id": "B07BS9754Q",
                "action_type": str(kwargs.get("expected_action_type") or "add_to_review"),
            },
            "evidence_snapshot_preview": {
                "status": "ready",
                "will_write": False,
                "will_save_on_authorized_write": True,
                "item_count": len(expected_evidence_snapshot),
                "items": expected_evidence_snapshot,
            },
            "blockers": [],
        }

    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", action_root)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", review_root)
    monkeypatch.setattr(routes, "_current_signals", lambda selected_market_id=None: signals)
    monkeypatch.setattr(routes, "build_manual_action_preflight_payload", fake_build_manual_action_preflight_payload)

    client = TestClient(app)
    for action_type in ("add_to_review", "ignore"):
        response = client.post(
            "/api/signals/sig-api-add-to-review/manual-actions?market_id=1",
            json={
                "action_type": action_type,
                "action_note": "加入复盘" if action_type == "add_to_review" else "忽略本次",
                "operator_name": "本地运营",
                "expected_product_scope_id": "parent_asin:B00K4W4AAA",
                "expected_object_type": "advertised_product",
                "expected_object_id": "B07BS9754Q",
                "expected_can_auto_change_rules": False,
                "expected_can_auto_execute_ads": False,
                "evidence_snapshot": [{"label": "前端旧证据", "value": "不应写入人工留痕", "source": "stale_frontend"}],
            },
        )

        assert response.status_code == 409
        assert response.json()["detail"] == "manual_action_evidence_snapshot_mismatch"
    assert not (action_root / "manual_actions.jsonl").exists()


def test_search_term_manual_action_api_readback_preserves_aba_review_context(monkeypatch, tmp_path: Path) -> None:
    action_root = tmp_path / "manual_actions"
    review_root = tmp_path / "review_records"
    current_signal_id = "sig-long-tail-opportunity-beach-current"
    old_signal_id = "sig-long-tail-opportunity-beach-old"
    signals = [
        make_api_search_term_context_signal(current_signal_id, "beach essentials for toddlers 1-3"),
        make_api_search_term_context_signal(old_signal_id, "beach essentials for kids"),
    ]

    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", action_root)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", review_root)
    monkeypatch.setattr(routes, "_current_signals", lambda selected_market_id=None: signals)

    evidence_snapshot = [
        {"label": "语义组", "value": "规则语义：海滩出行用品", "source": "规则语义"},
        {"label": "搜索词", "value": "beach essentials for toddlers 1-3", "source": "积加API"},
        {"label": "ABA语义参考词", "value": "beach essentials", "source": "ABA导出"},
        {"label": "ABA语义参考排名", "value": "208", "source": "ABA导出"},
        {"label": "ABA周期", "value": "2026-06-07 至 2026-06-13", "source": "ABA导出"},
        {
            "label": "ABA匹配边界",
            "value": "短语包含匹配，仅作为同类 SearchTerm 市场热度背景，不代表精确搜索词份额或本店广告归因。",
            "source": "ABA导出",
        },
    ]

    old_object_id = "gerpgo_market_1_20260616_120443:beach essentials for kids"
    current_object_id = "gerpgo_market_1_20260616_120443:beach essentials for toddlers 1-3"
    old_evidence_snapshot = [
        {**item, "value": "beach essentials for kids"}
        if item.get("value") == "beach essentials for toddlers 1-3"
        else item
        for item in evidence_snapshot
    ]
    preflight_evidence_by_object_id = {
        old_object_id: old_evidence_snapshot,
        current_object_id: evidence_snapshot,
    }

    def fake_build_search_term_preflight_payload(**kwargs):
        object_id = str(kwargs.get("expected_object_id") or "")
        action_type = str(kwargs.get("expected_action_type") or "add_to_review")
        preflight_evidence_snapshot = preflight_evidence_by_object_id.get(object_id, [])
        return {
            "status": "ready_for_explicit_manual_write",
            "target": {"object_type": "search_term", "object_id": object_id, "action_type": action_type},
            "evidence_snapshot_preview": {
                "status": "ready",
                "will_write": False,
                "will_save_on_authorized_write": True,
                "item_count": len(preflight_evidence_snapshot),
                "items": preflight_evidence_snapshot,
            },
            "blockers": [],
        }

    monkeypatch.setattr(routes, "build_manual_action_preflight_payload", fake_build_search_term_preflight_payload)

    client = TestClient(app)
    old_created = client.post(
        f"/api/signals/{old_signal_id}/manual-actions?market_id=1",
        json={
            "action_type": "observe",
            "action_note": "历史同类 SearchTerm 观察",
            "operator_name": "本地运营",
            "expected_product_scope_id": "parent_asin:B00K4W4AAA",
            "expected_object_type": "search_term",
            "expected_object_id": old_object_id,
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
            "evidence_snapshot": [
                {**item, "value": "beach essentials for kids"} if item["label"] == "搜索词" else item for item in evidence_snapshot
            ],
        },
    )
    current_created = client.post(
        f"/api/signals/{current_signal_id}/manual-actions?market_id=1",
        json={
            "action_type": "add_to_review",
            "action_note": "加入 7/14 天复盘",
            "operator_name": "本地运营",
            "expected_product_scope_id": "parent_asin:B00K4W4AAA",
            "expected_object_type": "search_term",
            "expected_object_id": current_object_id,
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
            "evidence_snapshot": evidence_snapshot,
        },
    )

    assert old_created.status_code == 200
    assert current_created.status_code == 200
    current_action = current_created.json()
    assert current_action["object_type"] == "search_term"
    assert current_action["object_id"] == "search_term:1:beach essentials for toddlers 1-3"
    assert [item["label"] for item in current_action["evidence_snapshot"]] == [
        "语义组",
        "搜索词",
        "ABA语义参考词",
        "ABA语义参考排名",
        "ABA周期",
        "ABA匹配边界",
    ]

    todo_response = client.get(f"/api/signals/{current_signal_id}/review-todos?market_id=1")
    all_todo_response = client.get("/api/review-todos?market_id=1")

    assert todo_response.status_code == 200
    todos = todo_response.json()
    assert {todo["review_window"] for todo in todos} == {"7d", "14d"}
    assert {todo["action_id"] for todo in todos} == {current_action["id"]}
    assert {todo["evidence_snapshot"][2]["label"] for todo in todos} == {"ABA语义参考词"}
    assert {todo["evidence_snapshot"][5]["label"] for todo in todos} == {"ABA匹配边界"}
    context = todos[0]["review_context"]
    assert context["search_intent_label"] == "规则语义：海滩出行用品"
    assert context["search_term"] == "beach essentials for toddlers 1-3"
    assert context["aba_reference_term"] == "beach essentials"
    assert context["aba_reference_rank"] == "208"
    assert context["aba_period"] == "2026-06-07 至 2026-06-13"
    assert "短语包含匹配" in context["aba_match_boundary"]
    assert context["repeat_search_intent_count"] == 2
    assert context["repeat_aba_reference_count"] == 2
    assert context["can_auto_change_rules"] is False
    assert context["can_auto_execute_ads"] is False

    assert all_todo_response.status_code == 200
    all_todos = all_todo_response.json()
    current_global_todos = [todo for todo in all_todos if todo["signal_id"] == current_signal_id]
    assert len(current_global_todos) == 2
    assert {todo["review_context"]["aba_reference_term"] for todo in current_global_todos} == {"beach essentials"}


def test_signal_triage_route_reads_review_status_from_route_runtime_roots(monkeypatch, tmp_path: Path) -> None:
    action_root = tmp_path / "manual_actions"
    review_root = tmp_path / "review_records"
    action_root.mkdir(parents=True)
    action_payload = {
        "id": "manual-action-route-root",
        "signal_id": "sig-route-root-isolation",
        "action_type": "add_to_review",
        "action_note": "隔离运行态测试",
        "operator_name": "本地运营",
        "acted_at": "2026-06-16T00:00:00+00:00",
        "manual_status": "pending",
        "snapshot_id": "snapshot-route-root",
        "shop_id": "shop-rivbos",
        "market_id": 98765,
        "object_type": "advertised_product",
        "object_id": "B00ROUTEROOT",
        "object_label": "B00ROUTEROOT",
    }
    (action_root / "manual_actions.jsonl").write_text(
        json.dumps(action_payload, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", action_root)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", review_root)
    monkeypatch.setattr(signal_triage_service, "load_signal_rows_from_success_snapshots", lambda: [])
    monkeypatch.setattr(
        signal_triage_service,
        "load_snapshot_status",
        lambda: SnapshotStatus(has_snapshot=False, status="missing"),
    )
    monkeypatch.setattr(
        signal_triage_service,
        "build_review_candidates_payload",
        lambda **kwargs: {
            "candidates": [],
            "candidate_count": 0,
            "signal_row_count": 0,
            "signal_count": 0,
            "excluded_count": 0,
            "excluded_summary": {},
            "candidate_layers": [],
            "recommended_candidate": None,
            "manual_action_preview": None,
            "snapshot": {},
            "selected_product_scope_id": None,
        },
    )

    response = TestClient(app).get("/api/signal-triage?market_id=98765")

    assert response.status_code == 200
    review_status = response.json()["review_status"]
    assert review_status["manual_action_count"] == 1
    assert review_status["not_ready_count"] == 2
    assert review_status["review_record_count"] == 0
    assert review_status["rule_improvement"]["can_auto_execute_ads"] is False


def test_signal_triage_rule_feedback_after_saving_ready_review_record(monkeypatch, tmp_path: Path) -> None:
    action_root = tmp_path / "manual_actions"
    review_root = tmp_path / "review_records"
    action_root.mkdir(parents=True)
    evidence_snapshot = [
        {
            "label": "排查路径",
            "value": "Parent 经营盘子 -> 广告 ASIN -> 广告组 -> 投放词 / 搜索词 / 广告位",
            "detail": "保存复盘前必须回看原始广告诊断路径。",
            "source": "business_rule",
        },
        {
            "label": "AI 准入",
            "value": "可进入人工确认 / ready_for_manual_confirmation / 候选 1 个 / 允许人工留痕",
            "detail": "准入只证明允许人工留痕，不代表系统会自动执行广告动作。",
            "source": "actionability_status",
        },
        {
            "label": "搜索词边界",
            "value": "搜索词只说明同广告组上下文，不能自动归因到单个广告 ASIN。",
            "detail": "保存复盘前必须确认未自动加词、否词或调价。",
            "source": "search_term_metrics",
        },
        {
            "label": "广告位边界",
            "value": "广告组级广告位 0 条 / 同广告活动广告位 4 条。",
            "detail": "活动级广告位只能作背景，不能替代广告组级证据。",
            "source": "placement_metrics",
        },
        {
            "label": "广告商品覆盖",
            "value": "覆盖 advertised_product B00READYASIN 的处理前后指标",
            "detail": "用于验证规则反馈只来自当前广告商品和当前复盘窗口。",
            "source": "ad_product_daily_metrics",
        },
        {
            "label": "广告组合流判断",
            "value": "B00READYASIN 必须按广告组容器回看投放词、搜索词和广告位上下文。",
            "detail": "不能把搜索词或广告位证据自动归因到单个广告 ASIN。",
            "source": "diagnosis_contract",
        },
        {
            "label": "同组投放商品表现",
            "value": "B00READYASIN 与同组广告 ASIN 表现已回看。",
            "detail": "只说明同广告组内广告商品承接差异，不能自动归因到单个广告 ASIN。",
            "source": "advertised_products + ad_product_daily_metrics",
        },
        {
            "label": "证据缺口",
            "value": "缺少广告组级广告位证据和主推策略确认。",
            "detail": "复盘时不能把广告 ASIN 指标扩展成自动归因依据。",
            "source": "diagnosis_contract",
        },
        {
            "label": "需要补证",
            "value": "补齐广告位、投放词维护状态和主推策略。",
            "detail": "复盘时必须回看当时还缺哪些业务事实。",
            "source": "diagnosis_contract",
        },
        {
            "label": "动作边界",
            "value": "只允许记录观察、标记已处理、加入复盘或忽略本次。",
            "detail": "不得自动调价、自动暂停、自动加词或自动否词。",
            "source": "business_rule",
        },
    ]
    action_payload = {
        "id": "manual-action-ready-review",
        "signal_id": "sig-ready-rule-feedback",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before-review",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "advertised_product",
        "object_id": "B00READYASIN",
        "object_label": "B00READYASIN",
        "evidence_snapshot": evidence_snapshot,
    }
    (action_root / "manual_actions.jsonl").write_text(
        json.dumps(action_payload, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    signal_rows = [
        {
            "market_id": 1,
            "object_type": "advertised_product",
            "source_table": "ad_product_daily_metrics",
            "asin": "B00READYASIN",
            "start_date": "2026-06-01",
            "end_date": "2026-06-07",
            "cost": 100,
            "orders": 1,
            "sales": 50,
        },
        {
            "market_id": 1,
            "object_type": "advertised_product",
            "source_table": "ad_product_daily_metrics",
            "asin": "B00READYASIN",
            "start_date": "2026-06-09",
            "end_date": "2026-06-15",
            "cost": 70,
            "orders": 6,
            "sales": 240,
        },
    ]

    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", action_root)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", review_root)
    monkeypatch.setattr(routes, "load_signal_rows_from_success_snapshots", lambda: signal_rows)
    monkeypatch.setattr(signal_triage_service, "load_signal_rows_from_success_snapshots", lambda: signal_rows)
    monkeypatch.setattr(
        signal_triage_service,
        "load_snapshot_status",
        lambda: SnapshotStatus(has_snapshot=True, status="success", snapshot_id="snapshot-with-review"),
    )
    monkeypatch.setattr(
        signal_triage_service,
        "build_review_candidates_payload",
        lambda **kwargs: {
            "candidates": [],
            "candidate_count": 0,
            "signal_row_count": len(signal_rows),
            "signal_count": 0,
            "excluded_count": 0,
            "excluded_summary": {},
            "candidate_layers": [],
            "recommended_candidate": None,
            "manual_action_preview": None,
            "snapshot": {},
            "selected_product_scope_id": None,
        },
    )

    client = TestClient(app)
    effect_response = client.get("/api/signals/sig-ready-rule-feedback/review-effect?review_window=7d&market_id=1")
    assert effect_response.status_code == 200
    assert effect_response.json()["status"] == "ready"

    before_triage = client.get("/api/signal-triage?market_id=1")
    assert before_triage.status_code == 200
    before_review_status = before_triage.json()["review_status"]
    assert before_review_status["ready_count"] >= 1
    assert before_review_status["review_record_count"] == 0
    assert before_review_status["rule_improvement"]["status"] == "ready_for_manual_review_record"

    saved = client.post(
        "/api/signals/sig-ready-rule-feedback/review-records?review_window=7d&market_id=1",
        json={
            "review_note": "确认处理有效，沉淀为规则反馈",
            "reviewer_name": "本地运营",
            "expected_action_id": "manual-action-ready-review",
            "expected_object_type": "advertised_product",
            "expected_object_id": "B00READYASIN",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": evidence_snapshot,
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )
    assert saved.status_code == 200
    saved_record = saved.json()
    assert saved_record["signal_id"] == "sig-ready-rule-feedback"
    assert saved_record["object_id"] == "B00READYASIN"
    assert saved_record["result"] == "improved"
    assert saved_record["evidence_snapshot"][0]["label"] == "排查路径"
    assert saved_record["evidence_snapshot"][1]["label"] == "AI 准入"

    after_triage = client.get("/api/signal-triage?market_id=1")
    assert after_triage.status_code == 200
    after_review_status = after_triage.json()["review_status"]
    assert after_review_status["review_record_count"] == 1
    assert after_review_status["review_feedback"]["total"] == 1
    feedback_record = after_review_status["review_feedback"]["records"][0]
    assert feedback_record["evidence_snapshot_count"] == 10
    assert feedback_record["diagnosis_snapshot"]["label"] == "排查路径"
    assert feedback_record["ai_admission_snapshot"]["label"] == "AI 准入"
    assert feedback_record["ai_admission_snapshot"]["source"] == "actionability_status"
    assert after_review_status["rule_improvement"]["status"] == "saved_feedback"
    assert after_review_status["rule_improvement"]["can_auto_execute_ads"] is False


def test_snapshot_pipeline_route_returns_not_ready_with_signal_scan(monkeypatch) -> None:
    async def fake_request_api_snapshot(request):
        raise SnapshotRequestNotReady(
            missing=["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"],
            market_id=request.market_id,
        )

    monkeypatch.setattr(routes, "request_api_snapshot", fake_request_api_snapshot)
    monkeypatch.setattr(
        routes,
        "inspect_api_snapshot",
        lambda: {
            "status": "missing",
            "has_snapshot": False,
            "ready_for_signals": False,
            "snapshot_id": None,
            "source": None,
            "market_id": None,
            "shop_name": None,
            "marketplace_code": None,
            "start_date": None,
            "end_date": None,
            "created_at": None,
            "snapshot_status": None,
            "signal_row_count": 0,
            "row_counts": {},
            "api_list": [],
            "normalized_tables": [],
            "issues": ["NO_API_SNAPSHOT"],
        },
    )
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_snapshot_status", lambda: SnapshotStatus(has_snapshot=False, status="missing"))

    def fake_load_snapshot_readiness(*, selected_market_id=None):
        return SnapshotReadiness(
            ready=False,
            can_request_api=False,
            missing=["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"],
            market_id=selected_market_id,
            auth_mode="missing",
            has_snapshot=False,
            snapshot_status="missing",
            snapshot_id=None,
            reason="缺少积加 API 配置，不能拉取真实快照",
        )

    monkeypatch.setattr(routes, "load_snapshot_readiness", fake_load_snapshot_readiness)

    response = TestClient(app).post("/api/snapshot/pipeline", json={"market_id": 1, "days": 7})

    assert response.status_code == 200
    payload = response.json()
    assert payload["pipeline_status"] == "not_ready"
    assert payload["create"]["status"] == "not_ready"
    assert payload["create"]["market_id"] == 1
    assert payload["create"]["next_action"] == "在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照"
    assert payload["inspection"]["status"] == "missing"
    assert payload["signal_scan"]["ready_for_signals"] is False
    assert payload["signal_scan"]["signal_count"] == 1
    assert payload["signal_scan"]["signals"][0]["market_id"] == 1
    assert payload["signal_scan"]["signals"][0]["evidence"]["source_rows"][0]["missing"] == [
        "GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"
    ]
    assert "secret-token" not in str(payload).lower()
    assert "real-app-key" not in str(payload).lower()


def test_snapshot_pipeline_route_returns_failed_with_signal_scan(monkeypatch) -> None:
    async def fake_request_api_snapshot(request):
        raise RuntimeError("积加 HTTP 请求失败 401: appKey=real-app-key")

    monkeypatch.setattr(routes, "request_api_snapshot", fake_request_api_snapshot)
    monkeypatch.setattr(
        routes,
        "inspect_api_snapshot",
        lambda: {
            "status": "missing",
            "has_snapshot": False,
            "ready_for_signals": False,
            "snapshot_id": None,
            "source": None,
            "market_id": None,
            "shop_name": None,
            "marketplace_code": None,
            "start_date": None,
            "end_date": None,
            "created_at": None,
            "snapshot_status": None,
            "signal_row_count": 0,
            "row_counts": {},
            "api_list": [],
            "normalized_tables": [],
            "issues": ["NO_API_SNAPSHOT"],
        },
    )
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_snapshot_status", lambda: SnapshotStatus(has_snapshot=False, status="missing"))

    def fake_load_snapshot_readiness(*, selected_market_id=None):
        return SnapshotReadiness(
            ready=True,
            can_request_api=True,
            missing=[],
            market_id=selected_market_id,
            auth_mode="access_token",
            has_snapshot=False,
            snapshot_status="missing",
            snapshot_id=None,
            reason="配置已就绪，但尚无成功快照",
        )

    monkeypatch.setattr(routes, "load_snapshot_readiness", fake_load_snapshot_readiness)

    response = TestClient(app).post("/api/snapshot/pipeline", json={"market_id": 1, "days": 7})

    assert response.status_code == 200
    payload = response.json()
    assert payload["pipeline_status"] == "failed"
    assert payload["create"]["status"] == "failed"
    assert payload["create"]["can_request_api"] is True
    assert payload["create"]["market_id"] == 1
    assert payload["create"]["next_action"] == "检查新项目 .env 中 Gerpgo 凭据、market_id 和开放平台接口权限后重新手动拉取快照"
    assert payload["inspection"]["status"] == "missing"
    assert payload["signal_scan"]["ready_for_signals"] is False
    assert payload["signal_scan"]["signal_count"] == 1
    assert payload["signal_scan"]["signals"][0]["market_id"] == 1
    assert "real-app-key" not in str(payload).lower()
    assert "secret-token" not in str(payload).lower()


def test_signal_scan_summary_route_returns_scan_boundaries(monkeypatch) -> None:
    monkeypatch.setattr(
        routes,
        "load_signal_rows_from_latest_snapshot",
        lambda: [
            {"source_table": "advertised_products", "ad_group_id": "group-1", "asin": "B000TEST01"},
            {"source_table": "ad_search_term_daily_metrics", "ad_group_id": "group-1", "search_term": "kids sunglasses"},
        ],
    )
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [{"normalized_query": "kids sunglasses"}])
    monkeypatch.setattr(
        routes,
        "load_promotion_strategy_profiles",
        lambda: [{"ad_group_id": "group-1", "asin": "B000TEST01", "strategy_role": "main_push"}],
    )
    monkeypatch.setattr(
        routes,
        "inspect_api_snapshot",
        lambda: {
            "ready_for_signals": True,
            "signal_row_count": 2,
            "row_counts": {"advertised_products": 1, "ad_search_term_daily_metrics": 1},
        },
    )
    monkeypatch.setattr(routes, "_current_signals", lambda selected_market_id=None: [])

    response = TestClient(app).get("/api/signal-scan/summary?market_id=1")

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary_text"] == "本次扫描 2 行真实 API 数据，命中 0 类 AI 信号。"
    assert payload["scanned_tables"][0]["name"] == "advertised_products"
    assert "主推款策略" in payload["suppressed_reasons"][0]
    assert "不能自动归因到单个 ASIN" in payload["attribution_boundaries"][0]


def test_signal_triage_route_returns_readonly_summary(monkeypatch) -> None:
    captured: dict[str, object] = {}

    def fake_build_signal_triage_payload(*, selected_market_id=None, top=5, product_scope_id=None):
        captured["selected_market_id"] = selected_market_id
        captured["top"] = top
        captured["product_scope_id"] = product_scope_id
        return {
            "status": "ready_for_manual_confirmation",
            "selected_market_id": selected_market_id,
            "selected_product_scope_id": product_scope_id,
            "snapshot": {
                "snapshot_id": "gerpgo_market_1_20260615_125325",
                "status": "success",
                "start_date": "2026-05-17",
                "end_date": "2026-06-15",
            },
            "signal_status": {
                "signal_row_count": 702,
                "signal_count": 137,
                "candidate_count": 135,
                "excluded_count": 2,
                "excluded_summary": {"cross_object": 2},
            },
            "candidate_mix": {
                "by_object_type": {"advertised_product": 13, "sales_product": 95},
                "by_priority": {"P0": 112, "P1": 13},
            },
            "recommended_candidate": {
                "signal_id": "sig-ad-product",
                "object_type": "advertised_product",
                "stable_object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
            },
            "manual_action_preview": {
                "will_write": False,
                "signal_id": "sig-ad-product",
                "action_type": "add_to_review",
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "review_windows": ["7d", "14d"],
            },
            "review_status": {"ready_count": 0, "not_ready_count": 4},
            "blockers": [{"code": "no_ready_review_effect", "message": "当前没有 处理前后指标可复核待办。"}],
            "next_action": "优先让运营人工确认 B016EXMW02；不要自动执行广告动作。",
        }

    monkeypatch.setattr(routes, "build_signal_triage_payload", fake_build_signal_triage_payload, raising=False)

    response = TestClient(app).get("/api/signal-triage?market_id=1&top=3&product_scope_id=parent_asin%3AB00K4W4AAA")

    assert response.status_code == 200
    payload = response.json()
    assert captured == {"selected_market_id": 1, "top": 3, "product_scope_id": "parent_asin:B00K4W4AAA"}
    assert payload["status"] == "ready_for_manual_confirmation"
    assert payload["selected_product_scope_id"] == "parent_asin:B00K4W4AAA"
    assert payload["signal_status"]["candidate_count"] == 135
    assert payload["recommended_candidate"]["stable_object_id"] == "B016EXMW02"
    assert payload["manual_action_preview"]["will_write"] is False
    assert payload["review_status"]["ready_count"] == 0
    assert "不要自动执行广告动作" in payload["next_action"]
    assert "access_token" not in str(payload).lower()
    assert "app_key" not in str(payload).lower()


def test_review_evidence_repair_route_returns_readonly_preview(monkeypatch) -> None:
    captured: dict[str, object] = {}

    def fake_build_review_evidence_repair_payload(
        *,
        selected_market_id=None,
        product_scope_id=None,
        top=5,
        action_root=None,
        review_root=None,
    ):
        captured.update(
            {
                "selected_market_id": selected_market_id,
                "product_scope_id": product_scope_id,
                "top": top,
                "action_root": action_root,
                "review_root": review_root,
            }
        )
        return {
            "status": "blocked_by_legacy_evidence_gap",
            "will_write": False,
            "requires_explicit_authorization": True,
            "counts": {
                "manual_actions": 17,
                "review_todos": 10,
                "legacy_action_gap_count": 5,
                "preview_rebuildable_count": 0,
                "recreatable_count": 0,
            },
            "items": [
                {
                    "action_id": "manual-action-legacy",
                    "object_type": "advertised_product",
                    "object_id": "B016EXMVZS",
                    "review_windows": ["7d", "14d"],
                    "can_patch_legacy_record": False,
                    "will_write": False,
                }
            ],
            "forbidden_effects": ["不保存 review_records", "不执行广告动作"],
            "next_action": "先人工确认作废旧待办或补录策略。",
        }

    monkeypatch.setattr(routes, "build_review_evidence_repair_payload", fake_build_review_evidence_repair_payload, raising=False)

    response = TestClient(app).get("/api/review-evidence-repair?market_id=1&top=3&product_scope_id=parent_asin%3AB00K4W4AAA")

    assert response.status_code == 200
    payload = response.json()
    assert captured == {
        "selected_market_id": 1,
        "product_scope_id": "parent_asin:B00K4W4AAA",
        "top": 3,
        "action_root": routes.MANUAL_ACTION_ROOT,
        "review_root": routes.REVIEW_RECORD_ROOT,
    }
    assert payload["status"] == "blocked_by_legacy_evidence_gap"
    assert payload["will_write"] is False
    assert payload["items"][0]["can_patch_legacy_record"] is False
    assert "不执行广告动作" in payload["forbidden_effects"]


def test_manual_action_preflight_route_returns_readonly_validation(monkeypatch) -> None:
    captured: dict[str, object] = {}

    def fake_build_manual_action_preflight_payload(
        *,
        selected_market_id=None,
        product_scope_id=None,
        expected_object_id=None,
        expected_object_type=None,
        expected_action_type=None,
        top=5,
        expect_written=False,
        action_root=None,
        review_root=None,
    ):
        captured.update(
            {
                "selected_market_id": selected_market_id,
                "product_scope_id": product_scope_id,
                "expected_object_id": expected_object_id,
                "expected_object_type": expected_object_type,
                "expected_action_type": expected_action_type,
                "top": top,
                "expect_written": expect_written,
                "action_root": action_root,
                "review_root": review_root,
            }
        )
        return {
            "status": "ready_for_explicit_manual_write",
            "mode": "pre_write",
            "will_write": False,
            "requires_explicit_authorization": True,
            "selected_market_id": selected_market_id,
            "selected_product_scope_id": product_scope_id,
            "target": {
                "signal_id": "sig-b06",
                "action_type": "add_to_review",
                "object_type": "sales_product",
                "object_id": "B06VW5SQ97",
                "shop_id": "rivbos",
                "market_id": selected_market_id,
                "review_windows": ["7d", "14d"],
            },
            "current_counts": {
                "manual_action_count": 0,
                "target_manual_action_count": 0,
                "target_review_todo_count": 0,
                "review_record_count": 0,
                "target_review_record_count": 0,
            },
            "expected_after_write": {
                "manual_action_count": 1,
                "target_manual_action_count": 1,
                "target_review_todo_count": 2,
                "review_record_count": 0,
                "target_review_record_count": 0,
            },
            "post_write_checks": {
                "target_manual_action_count": 0,
                "target_manual_action_identities": [],
                "target_review_todo_count": 0,
                "target_review_todo_identities": [],
                "target_review_windows": [],
                "target_review_record_count": 0,
                "target_review_record_identities": [],
            },
            "blockers": [],
            "forbidden_effects": ["不请求积加 API", "不保存 review_records", "不执行广告动作"],
            "next_action": "等待明确人工授权后，才可执行一次人工留痕写入。",
        }

    monkeypatch.setattr(routes, "build_manual_action_preflight_payload", fake_build_manual_action_preflight_payload, raising=False)

    response = TestClient(app).get(
        "/api/manual-action/preflight"
        "?market_id=1"
        "&top=3"
        "&product_scope_id=parent_asin%3AB00K4W4AAA"
        "&expected_object_id=B06VW5SQ97"
        "&expected_object_type=sales_product"
        "&action_type=add_to_review"
        "&expect_written=false"
    )

    assert response.status_code == 200
    payload = response.json()
    assert captured["selected_market_id"] == 1
    assert captured["product_scope_id"] == "parent_asin:B00K4W4AAA"
    assert captured["expected_object_id"] == "B06VW5SQ97"
    assert captured["expected_object_type"] == "sales_product"
    assert captured["expected_action_type"] == "add_to_review"
    assert captured["top"] == 3
    assert captured["expect_written"] is False
    assert captured["action_root"] == routes.MANUAL_ACTION_ROOT
    assert captured["review_root"] == routes.REVIEW_RECORD_ROOT
    assert payload["will_write"] is False
    assert payload["requires_explicit_authorization"] is True
    assert payload["target"]["object_id"] == "B06VW5SQ97"
    assert payload["expected_after_write"]["target_review_todo_count"] == 2
    assert "不执行广告动作" in payload["forbidden_effects"]
    assert "access_token" not in str(payload).lower()
    assert "app_key" not in str(payload).lower()


def test_snapshot_inspection_route_returns_ready_state_without_secret_values(monkeypatch) -> None:
    monkeypatch.setattr(
        routes,
        "inspect_api_snapshot",
        lambda: {
            "status": "partial",
            "has_snapshot": True,
            "ready_for_signals": True,
            "snapshot_id": "snapshot-ready",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "created_at": "2026-06-14T10:00:00+08:00",
            "snapshot_status": "success",
            "signal_row_count": 3,
            "row_counts": {"ad_search_term_daily_metrics": 3},
            "api_list": ["sp_search_targeting_terms"],
            "normalized_tables": [
                {
                    "name": "ad_search_term_daily_metrics",
                    "exists": True,
                    "manifest_row_count": 3,
                    "actual_row_count": 3,
                    "matches_manifest": True,
                    "path": "D:/local/snapshot/normalized/ad_search_term_daily_metrics.json",
                }
            ],
            "issues": ["ROW_COUNT_MISMATCH:ad_placement_daily_metrics"],
        },
    )

    response = TestClient(app).get("/api/snapshot/inspection")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "partial"
    assert payload["ready_for_signals"] is True
    assert payload["snapshot_id"] == "snapshot-ready"
    assert payload["signal_row_count"] == 3
    assert payload["normalized_tables"][0]["name"] == "ad_search_term_daily_metrics"
    assert payload["issues"] == ["ROW_COUNT_MISMATCH:ad_placement_daily_metrics"]
    assert "access_token" not in str(payload).lower()
    assert "app_key" not in str(payload).lower()


def test_signals_route_reports_missing_api_snapshot_as_data_quality_signal(monkeypatch) -> None:
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_snapshot_status", lambda: SnapshotStatus(has_snapshot=False, status="missing"))
    monkeypatch.setattr(
        routes,
        "load_snapshot_readiness",
        lambda: SnapshotReadiness(
            ready=False,
            can_request_api=False,
            missing=["GERPGO_MARKET_IDS", "GERPGO_ACCESS_TOKEN"],
            market_id=None,
            auth_mode="missing",
            has_snapshot=False,
            snapshot_status="missing",
            snapshot_id=None,
            reason="缺少积加 API 配置，不能拉取真实快照",
        ),
    )

    response = TestClient(app).get("/api/signals")

    assert response.status_code == 200
    signals = response.json()
    assert len(signals) == 1
    signal = signals[0]
    assert signal["id"] == "sig-data-quality-api-snapshot-missing"
    assert signal["signal_type"] == "anomaly"
    assert signal["signal_category"] == "data_quality"
    assert signal["priority"] == "P1"
    assert signal["object_type"] == "cross"
    assert signal["freshness_status"] == "stale"
    assert "真实 API 快照" in signal["summary"]
    assert signal["suggested_action"]["requires_manual_confirmation"] is True
    assert signal["data_sources"][0]["source_type"] == "积加API"
    assert "GERPGO_MARKET_IDS" in str(signal["evidence"]["facts"])
    assert "GERPGO_ACCESS_TOKEN" in str(signal["evidence"]["facts"])
    assert "secret-token" not in str(signal).lower()


def test_signals_route_passes_market_id_to_data_quality_readiness(monkeypatch) -> None:
    captured: dict[str, object] = {}

    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_snapshot_status", lambda: SnapshotStatus(has_snapshot=False, status="missing"))

    def fake_load_snapshot_readiness(*, selected_market_id=None):
        captured["selected_market_id"] = selected_market_id
        return SnapshotReadiness(
            ready=False,
            can_request_api=False,
            missing=["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"],
            market_id=selected_market_id,
            auth_mode="missing",
            has_snapshot=False,
            snapshot_status="missing",
            snapshot_id=None,
            reason="缺少积加 API 配置，不能拉取真实快照",
        )

    monkeypatch.setattr(routes, "load_snapshot_readiness", fake_load_snapshot_readiness)

    response = TestClient(app).get("/api/signals?market_id=1")

    assert response.status_code == 200
    signals = response.json()
    assert captured["selected_market_id"] == 1
    assert signals[0]["market_id"] == 1
    assert signals[0]["evidence"]["source_rows"][0]["missing"] == [
        "GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"
    ]


def test_signals_route_reports_empty_success_snapshot_as_data_quality_signal(monkeypatch) -> None:
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(
        routes,
        "load_snapshot_status",
        lambda: SnapshotStatus(
            has_snapshot=True,
            snapshot_id="empty-snapshot",
            source="gerpgo",
            market_id=1,
            shop_name="rivbos",
            marketplace_code="US",
            start_date="2026-06-08",
            end_date="2026-06-14",
            status="success",
            row_counts={"ad_search_term_daily_metrics": 0, "ad_placement_daily_metrics": 0},
            api_list=["sp_search_targeting_terms", "sp_placements"],
        ),
    )
    monkeypatch.setattr(
        routes,
        "load_snapshot_readiness",
        lambda: SnapshotReadiness(
            ready=True,
            can_request_api=True,
            missing=[],
            market_id=1,
            auth_mode="access_token",
            has_snapshot=True,
            snapshot_status="success",
            snapshot_id="empty-snapshot",
            shop_name="rivbos",
            marketplace_code="US",
            reason="已有成功快照",
        ),
    )

    response = TestClient(app).get("/api/signals")

    assert response.status_code == 200
    signals = response.json()
    assert len(signals) == 1
    signal = signals[0]
    assert signal["id"] == "sig-data-quality-api-snapshot-empty"
    assert signal["signal_category"] == "data_quality"
    assert signal["priority"] == "P1"
    assert signal["shop_name"] == "rivbos"
    assert signal["market_id"] == 1
    assert signal["marketplace"] == "US"
    assert signal["data_sources"][0]["snapshot_id"] == "empty-snapshot"
    assert signal["suggested_action"]["requires_manual_confirmation"] is True
    assert "ad_search_term_daily_metrics" in str(signal["evidence"]["facts"])
    assert "ad_placement_daily_metrics" in str(signal["evidence"]["facts"])


def test_signals_route_returns_explainable_signals_from_api_snapshot(tmp_path, monkeypatch) -> None:
    snapshot_dir = tmp_path / "gerpgo_market_1_api_route_snapshot"
    write_json(
        snapshot_dir / "manifest.json",
        {
            "snapshot_id": "api-route-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_id": "shop-rivbos",
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "created_at": "2026-06-14T10:00:00+08:00",
            "status": "success",
            "api_list": ["sp_search_targeting_terms"],
            "row_counts": {"ad_search_term_daily_metrics": 1},
        },
    )
    write_json(
        snapshot_dir / "normalized" / "ad_search_term_daily_metrics.json",
        [
            {
                "id": "search-row-1",
                "source_report_type": "targeting",
                "campaign_name": "RBK004 Auto",
                "ad_group_name": "RBK004 mixed group",
                "asin": "B0TESTASIN",
                "msku": "RBK004",
                "product_name": "RBK004 儿童太阳镜",
                "search_term": "kids sunglasses",
                "intent_label": "儿童太阳镜",
                "placement": "Rest of Search",
                "impressions": 1200,
                "clicks": 52,
                "cost": 48.5,
                "orders": 0,
                "sales": 0,
            }
        ],
    )
    monkeypatch.setattr(
        routes,
        "load_signal_rows_from_latest_snapshot",
        lambda: snapshot_store.load_signal_rows_from_latest_snapshot(tmp_path),
    )

    response = TestClient(app).get("/api/signals")

    assert response.status_code == 200
    signals = response.json()
    signal = next(item for item in signals if item["id"].startswith("sig-waste-"))
    assert signal["shop_id"] == "shop-rivbos"
    assert signal["shop_name"] == "rivbos"
    assert signal["market_id"] == 1
    assert signal["marketplace"] == "US"
    assert signal["freshness_status"] == "api_snapshot"
    assert signal["suggested_action"]["requires_manual_confirmation"] is True
    assert signal["data_sources"] == [
        {
            "source_type": "积加API",
            "source_name": "积加API快照",
            "snapshot_id": "api-route-snapshot",
            "api_name": "sp_search_targeting_terms",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "search-row-1",
            "source_file": None,
            "market_id": 1,
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
        }
    ]


def test_signals_route_uses_main_push_strategy_profile(monkeypatch) -> None:
    rows = [
        {
            "row_id": "ad-product-low",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-1",
            "ad_group_name": "多商品广告组",
            "asin": "B000TEST01",
            "msku": "MSKU-1",
            "product_name": "广告商品 A",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "ad-product-low",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 1200,
            "clicks": 12,
            "cost": 20,
            "orders": 2,
            "sales": 40,
        },
        {
            "row_id": "ad-product-high",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-1",
            "ad_group_name": "多商品广告组",
            "asin": "B000TEST02",
            "msku": "MSKU-2",
            "product_name": "广告商品 B",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "ad-product-high",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 7600,
            "clicks": 80,
            "cost": 80,
            "orders": 12,
            "sales": 240,
        },
    ]
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: rows)
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(
        routes,
        "load_promotion_strategy_profiles",
        lambda: [
            {
                "market_id": 1,
                "ad_group_id": "group-1",
                "asin": "B000TEST02",
                "strategy_role": "main_push",
                "strategy_label": "主推款",
                "start_date": "2026-06-01",
                "end_date": "2026-06-30",
            }
        ],
    )
    monkeypatch.setattr(
        routes,
        "load_snapshot_status",
        lambda: SnapshotStatus(has_snapshot=True, status="success", row_counts={"advertised_products": 2}),
    )
    monkeypatch.setattr(
        routes,
        "load_snapshot_readiness",
        lambda selected_market_id=None: SnapshotReadiness(
            ready=True,
            can_request_api=True,
            missing=[],
            market_id=selected_market_id or 1,
            reason="真实快照可用",
        ),
    )

    response = TestClient(app).get("/api/signals?market_id=1")

    assert response.status_code == 200
    signal_ids = {item["id"] for item in response.json()}
    assert "sig-ad-group-spend-concentration-group-1" not in signal_ids


def test_cors_allows_local_vite_fallback_port() -> None:
    response = TestClient(app).options(
        "/api/snapshot/readiness",
        headers={"Origin": "http://127.0.0.1:5176", "Access-Control-Request-Method": "GET"},
    )

    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5176"
