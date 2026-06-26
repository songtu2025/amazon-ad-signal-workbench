import json
from datetime import UTC, datetime
from pathlib import Path

from fastapi.testclient import TestClient

from app.api import routes
from app.main import app
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
    SignalStatus,
    SignalType,
    SuggestedAction,
)
from app.services import manual_actions
from app.services.manual_actions import build_review_todos, load_manual_actions, save_manual_action


def minimal_evidence_snapshot(label: str = "广告商品覆盖") -> list[dict[str, str]]:
    return [
        {
            "label": label,
            "value": "覆盖 raw 投放行 2/2 / 证据行 2 条",
            "detail": "用于验证复盘类人工动作必须携带点击时证据快照。",
            "source": "test_evidence",
        }
    ]


def diagnosis_evidence_snapshot() -> list[dict[str, str]]:
    return [
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
            "label": "Parent ASIN入口",
            "value": "Parent ASIN B00K4W4AAA 下只复核有广告数据的搜索词表现。",
            "detail": "Parent ASIN 是经营入口，不能把搜索词聚合当成独立经营对象。",
            "source": "diagnosis_contract + sales_performance",
        },
        {
            "label": "广告 ASIN承接",
            "value": "广告 ASIN B016EXMVZS / B016EXMW02 承接 kids sunglasses 搜索词上下文。",
            "detail": "广告 ASIN 只说明投放承接范围，不能把搜索词自动归因到单个 ASIN。",
            "source": "diagnosis_contract + advertised_products",
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
            "label": "广告组合流判断",
            "value": "kids sunglasses 已串联广告组、投放词、搜索词和广告位边界。",
            "detail": "不能自动归因到单个广告 ASIN，不能自动加词、否词、调价或调整广告位。",
            "source": "diagnosis_contract",
        },
        {
            "label": "同组投放商品表现",
            "value": "B016EXMVZS 花费 22.78 / 订单 11；B016EXMW02 花费 18.41 / 订单 7",
            "detail": "只说明同广告组内广告商品承接差异，不能把搜索词自动归因到单个广告 ASIN。",
            "source": "advertised_products + ad_product_daily_metrics",
        },
        {
            "label": "逐投放上下文",
            "value": "优先复核广告组 RBK004-kids sunglasses-精准 / 投放词 kids sunglasses / 订单 0 / 花费 10",
            "detail": "每行只证明该搜索词在对应广告活动、广告组和投放词下的广告表现。",
            "source": "ad_search_term_daily_metrics",
        },
        {
            "label": "投放词证据",
            "value": "sunglasses for kids / 1 个",
            "detail": "用于确认用户搜索词是否已有投放词承接。",
            "source": "ad_search_term_daily_metrics",
        },
        {
            "label": "ABA 背景",
            "value": "未匹配 ABA Top1000",
            "detail": "ABA 只能作为站点级市场背景。",
            "source": "diagnosis_contract + ABA导出",
        },
        {
            "label": "证据缺口",
            "value": "缺少广告组级广告位证据和人工主推策略确认。",
            "detail": "复盘时不能把当前证据扩展成自动归因依据。",
            "source": "diagnosis_contract",
        },
        {
            "label": "需要补证",
            "value": "补齐投放词维护状态、广告商品承接和主推策略。",
            "detail": "复盘时必须回看当时还缺哪些业务事实。",
            "source": "diagnosis_contract",
        },
        {
            "label": "动作边界",
            "value": "只允许记录观察、标记已处理、加入复盘或忽略本次。",
            "detail": "不得自动加词、自动否词、自动调价、自动暂停或开启广告。",
            "source": "business_rule",
        },
        *minimal_evidence_snapshot("广告商品覆盖"),
    ]


def diagnosis_without_ai_admission_snapshot() -> list[dict[str, str]]:
    return [
        {
            "label": "排查路径",
            "value": "Parent 经营盘子 -> 广告 ASIN -> 广告组 -> 投放词 / 搜索词 / 广告位",
            "detail": "保存复盘前必须回看原始广告诊断路径。",
            "source": "business_rule",
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
        *minimal_evidence_snapshot("广告商品覆盖"),
    ]


def diagnosis_without_label_snapshot(label: str) -> list[dict[str, str]]:
    return [item for item in diagnosis_evidence_snapshot() if item["label"] != label]


def diagnosis_evidence_snapshot_for_other_object() -> list[dict[str, str]]:
    return [
        {
            key: value.replace("kids sunglasses", "boys sunglasses") if isinstance(value, str) else value
            for key, value in item.items()
        }
        for item in diagnosis_evidence_snapshot()
    ]


def search_term_full_review_chain_snapshot() -> list[dict[str, str]]:
    return [
        {
            "label": "排查路径",
            "value": "Parent ASIN -> 广告 ASIN -> 广告组 -> 投放词 -> SearchTerm -> 广告位",
            "detail": "保存复盘前必须回看 Parent ASIN 广告搜索词表现复核链。",
            "source": "business_rule",
        },
        {
            "label": "AI 准入",
            "value": "可进入人工确认 / ready_for_manual_confirmation / 允许人工留痕",
            "detail": "准入只证明允许人工留痕，不代表系统会自动执行广告动作。",
            "source": "actionability_status",
        },
        {
            "label": "搜索词表现分组",
            "value": "规则语义：儿童太阳镜",
            "detail": "搜索词表现分组只用于 Parent ASIN 下广告 SearchTerm 表现聚合，不是人工动作对象。",
            "source": "规则语义",
        },
        {
            "label": "Parent ASIN入口",
            "value": "Parent ASIN B00K4W4AAA 下只复核有广告数据的搜索词表现。",
            "detail": "Parent ASIN 是经营入口，不能把搜索词聚合当成独立经营对象。",
            "source": "diagnosis_contract + sales_performance",
        },
        {
            "label": "广告 ASIN承接",
            "value": "广告 ASIN B016EXMVZS / B016EXMW02 承接 kids sunglasses 搜索词上下文。",
            "detail": "广告 ASIN 只说明投放承接范围，不能把搜索词自动归因到单个 ASIN。",
            "source": "diagnosis_contract + advertised_products",
        },
        {
            "label": "广告组合流判断",
            "value": "同广告组广告 ASIN 2 个；搜索词不能自动归因到单个广告 ASIN。",
            "detail": "复盘时必须回看广告组、广告 ASIN、投放词、搜索词和广告位边界。",
            "source": "diagnosis_contract",
        },
        {
            "label": "同组投放商品表现",
            "value": "B016EXMVZS 花费 22.78 / 订单 11；B016EXMW02 花费 18.41 / 订单 7",
            "detail": "只说明同广告组内广告商品承接差异，不能把搜索词自动归因到单个广告 ASIN。",
            "source": "advertised_products + ad_product_daily_metrics",
        },
        {
            "label": "逐投放上下文",
            "value": "优先复核广告组 RBK004-kids sunglasses-精准 / 投放词 kids sunglasses / 订单 0 / 花费 10",
            "detail": "每行只证明该搜索词在对应广告活动、广告组和投放词下的广告表现。",
            "source": "ad_search_term_daily_metrics",
        },
        {
            "label": "投放词证据",
            "value": "kids sunglasses / 1 个",
            "detail": "用于确认用户搜索词是否已有投放词承接。",
            "source": "ad_search_term_daily_metrics",
        },
        {
            "label": "搜索词边界",
            "value": "kids sunglasses 只说明同广告组搜索词上下文。",
            "detail": "不能自动加词、否词或调价。",
            "source": "ad_search_term_daily_metrics + business_rule",
        },
        {
            "label": "广告位边界",
            "value": "广告组级广告位 0 条 / 同广告活动广告位 4 条。",
            "detail": "活动级广告位只能作背景，不能替代广告组级证据。",
            "source": "ad_placement_daily_metrics + business_rule",
        },
        {
            "label": "ABA 背景",
            "value": "未匹配 ABA Top1000",
            "detail": "ABA 只能作为站点级市场背景。",
            "source": "diagnosis_contract + ABA导出",
        },
        {
            "label": "证据缺口",
            "value": "缺少广告组级广告位证据和人工主推策略确认。",
            "detail": "复盘时不能把当前证据扩展成自动归因依据。",
            "source": "diagnosis_contract",
        },
        {
            "label": "需要补证",
            "value": "补齐投放词维护状态、广告商品承接和主推策略。",
            "detail": "复盘时必须回看当时还缺哪些业务事实。",
            "source": "diagnosis_contract",
        },
        {
            "label": "动作边界",
            "value": "只允许记录观察、标记已处理、加入复盘或忽略本次。",
            "detail": "不得自动加词、自动否词、自动调价、自动暂停或开启广告。",
            "source": "business_rule",
        },
    ]


def placement_evidence_snapshot() -> list[dict[str, str]]:
    return [
        *diagnosis_evidence_snapshot(),
        {
            "label": "广告位表现",
            "value": "Top of Search：花费 90，订单 1，ACOS 偏高。",
            "detail": "广告位表现只能说明流量位置层级，不自动归因到单个搜索词、广告组或广告 ASIN。",
            "source": "ad_placement_daily_metrics",
        },
    ]


def placement_without_label_snapshot(label: str) -> list[dict[str, str]]:
    return [item for item in placement_evidence_snapshot() if item["label"] != label]


def ad_product_review_rows() -> list[dict[str, object]]:
    return [
        {
            "market_id": 1,
            "object_type": "advertised_product",
            "source_table": "advertised_products",
            "asin": "B016EXMW02",
            "start_date": "2026-06-01",
            "end_date": "2026-06-07",
            "cost": 80,
            "orders": 1,
            "sales": 50,
        },
        {
            "market_id": 1,
            "object_type": "advertised_product",
            "source_table": "advertised_products",
            "asin": "B016EXMW02",
            "start_date": "2026-06-09",
            "end_date": "2026-06-15",
            "cost": 60,
            "orders": 5,
            "sales": 200,
        },
    ]


def placement_review_rows() -> list[dict[str, object]]:
    return [
        {
            "market_id": 1,
            "object_type": "placement",
            "source_table": "ad_placement_daily_metrics",
            "placement": "Top of Search",
            "start_date": "2026-06-01",
            "end_date": "2026-06-07",
            "cost": 90,
            "orders": 1,
            "sales": 30,
        },
        {
            "market_id": 1,
            "object_type": "placement",
            "source_table": "ad_placement_daily_metrics",
            "placement": "Top of Search",
            "start_date": "2026-06-09",
            "end_date": "2026-06-15",
            "cost": 45,
            "orders": 4,
            "sales": 160,
        },
    ]


def route_preflight_payload(
    *,
    object_type: str,
    object_id: str,
    action_type: str,
    evidence_snapshot: list[dict[str, str]],
) -> dict:
    return {
        "status": "ready_for_explicit_manual_write",
        "target": {"object_type": object_type, "object_id": object_id, "action_type": action_type},
        "evidence_snapshot_preview": {
            "status": "ready",
            "will_write": False,
            "will_save_on_authorized_write": True,
            "item_count": len(evidence_snapshot),
            "items": evidence_snapshot,
        },
        "blockers": [],
    }


def make_signal(signal_id: str = "sig-test-manual-action") -> AiSignal:
    return AiSignal(
        id=signal_id,
        signal_type=SignalType.ANOMALY,
        signal_category="search_term_waste",
        priority=SignalPriority.P1,
        confidence=ConfidenceLevel.MEDIUM,
        shop_id="shop-rivbos",
        shop_name="rivbos",
        market_id=1,
        marketplace="US",
        object_type=ObjectType.SEARCH_TERM,
        severity=4,
        summary="测试信号",
        why="用于验证人工处理留痕",
        evidence=EvidencePackage(
            period_days=7,
            primary_object=AdObjectRef(object_type=ObjectType.SEARCH_TERM, object_id="kids sunglasses", label="kids sunglasses"),
            metrics=MetricSnapshot(cost=10, orders=0),
        ),
        evidence_count=1,
        data_sources=[
            DataSourceRef(
                source_type="积加API",
                source_name="积加API快照",
                snapshot_id="snapshot-1",
                market_id=1,
                source_table="ad_search_term_daily_metrics",
            )
        ],
        freshness_status=FreshnessStatus.API_SNAPSHOT,
        detected_at="2026-06-14T10:00:00+08:00",
        uncertainty="测试不确定性",
        suggested_action=SuggestedAction(action_type="manual_review", title="人工复核", description="人工处理"),
        risk="测试风险",
    )


def make_advertised_product_signal(signal_id: str = "sig-ad-product-manual-action") -> AiSignal:
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
        severity=3,
        summary="B016EXMW02 advertising product opportunity",
        why="used to verify advertised product manual action identity",
        evidence=EvidencePackage(
            period_days=7,
            primary_object=AdObjectRef(
                object_type=ObjectType.ADVERTISED_PRODUCT,
                object_id="snapshot-1:ad-product:1:28792336180945",
                label="B016EXMW02",
                asin="B016EXMW02",
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
        detected_at="2026-06-14T10:00:00+08:00",
        uncertainty="test uncertainty",
        suggested_action=SuggestedAction(action_type="manual_review", title="manual review", description="manual action"),
        risk="test risk",
    )


def make_sales_product_signal(signal_id: str = "sig-sales-product-manual-action") -> AiSignal:
    return AiSignal(
        id=signal_id,
        signal_type=SignalType.OPPORTUNITY,
        signal_category="sales_product_opportunity",
        priority=SignalPriority.P0,
        confidence=ConfidenceLevel.MEDIUM,
        shop_id="shop-rivbos",
        shop_name="rivbos",
        market_id=1,
        marketplace="US",
        object_type=ObjectType.SALES_PRODUCT,
        severity=4,
        summary="B06VW5SQ97 sales product opportunity",
        why="used to verify sales product manual action identity",
        evidence=EvidencePackage(
            period_days=30,
            primary_object=AdObjectRef(
                object_type=ObjectType.SALES_PRODUCT,
                object_id="snapshot-1:sales:1:826-Dark Blue:2026-05-17:2026-06-15",
                label="RBK004-RBK004-2 深蓝",
                asin="B06VW5SQ97",
                msku="RBK004-RBK004-2",
            ),
            metrics=MetricSnapshot(cost=0, orders=12, sales=120),
        ),
        evidence_count=1,
        data_sources=[
            DataSourceRef(
                source_type="api",
                source_name="snapshot",
                snapshot_id="snapshot-1",
                market_id=1,
                source_table="sales_product_daily_metrics",
            )
        ],
        freshness_status=FreshnessStatus.API_SNAPSHOT,
        detected_at="2026-06-15T10:00:00+08:00",
        uncertainty="test uncertainty",
        suggested_action=SuggestedAction(action_type="manual_review", title="manual review", description="manual action"),
        risk="test risk",
    )


def test_manual_action_store_appends_jsonl_records(tmp_path: Path) -> None:
    record = save_manual_action(
        signal_id="sig-test-manual-action",
        action_type="observe",
        action_note="先观察 7 天",
        operator_name="本地运营",
        snapshot_id="snapshot-1",
        shop_id="shop-rivbos",
        market_id=1,
        object_type="search_term",
        object_id="kids sunglasses",
        object_label="kids sunglasses",
        evidence_snapshot=[
            {
                "label": "广告商品覆盖",
                "value": "覆盖 raw 投放行 2/2 / 证据行 2 条",
                "detail": "覆盖率 100.0%",
                "source": "advertised_products",
            }
        ],
        action_root=tmp_path,
    )

    records = load_manual_actions("sig-test-manual-action", action_root=tmp_path)

    assert record.signal_id == "sig-test-manual-action"
    assert record.action_type == "observe"
    assert record.manual_status == SignalStatus.OBSERVING
    assert record.object_type == "search_term"
    assert record.object_id == "kids sunglasses"
    assert record.object_label == "kids sunglasses"
    assert record.evidence_snapshot[0].label == "广告商品覆盖"
    assert record.evidence_snapshot[0].source == "advertised_products"
    assert records[0].evidence_snapshot[0].value == "覆盖 raw 投放行 2/2 / 证据行 2 条"
    todos = build_review_todos("sig-test-manual-action", action_root=tmp_path)
    assert {todo.review_window for todo in todos} == {"7d", "14d"}
    assert {todo.evidence_snapshot[0].label for todo in todos} == {"广告商品覆盖"}
    assert {todo.evidence_snapshot[0].value for todo in todos} == {"覆盖 raw 投放行 2/2 / 证据行 2 条"}
    assert records == [record]
    assert (tmp_path / "manual_actions.jsonl").exists()


def test_review_todos_extract_search_intent_and_aba_context(tmp_path: Path) -> None:
    action_payloads = [
        {
            "id": "manual-action-beach-old",
            "signal_id": "sig-long-tail-beach-old",
            "action_type": "observe",
            "operator_name": "本地运营",
            "acted_at": "2026-06-01T00:00:00+00:00",
            "manual_status": "observing",
            "snapshot_id": "snapshot-old",
            "shop_id": "market:1",
            "market_id": 1,
            "object_type": "search_term",
            "object_id": "beach essentials for kids",
            "object_label": "beach essentials for kids",
            "evidence_snapshot": [
                {"label": "语义组", "value": "规则语义：海滩出行用品", "source": "规则语义"},
                {"label": "搜索词", "value": "beach essentials for kids", "source": "积加API"},
                {"label": "ABA排名", "value": "208 / 2026-06-07 至 2026-06-13", "source": "ABA导出"},
            ],
        },
        {
            "id": "manual-action-beach-current",
            "signal_id": "sig-long-tail-beach-current",
            "action_type": "add_to_review",
            "operator_name": "本地运营",
            "acted_at": "2026-06-03T00:00:00+00:00",
            "manual_status": "pending",
            "snapshot_id": "snapshot-current",
            "shop_id": "market:1",
            "market_id": 1,
            "object_type": "search_term",
            "object_id": "beach essentials for toddlers 1-3",
            "object_label": "beach essentials for toddlers 1-3",
            "evidence_snapshot": [
                {"label": "语义组", "value": "规则语义：海滩出行用品", "source": "规则语义"},
                {"label": "搜索词", "value": "beach essentials for toddlers 1-3", "source": "积加API"},
                {"label": "ABA语义参考词", "value": "beach essentials", "source": "ABA导出"},
                {"label": "ABA语义参考排名", "value": "208", "source": "ABA导出"},
                {
                    "label": "ABA匹配边界",
                    "value": "短语包含匹配，仅作为同类 SearchTerm 市场热度背景，不代表精确搜索词份额或本店广告归因。",
                    "source": "ABA导出",
                },
            ],
        },
    ]
    (tmp_path / "manual_actions.jsonl").write_text(
        "\n".join(json.dumps(payload, ensure_ascii=False) for payload in action_payloads) + "\n",
        encoding="utf-8",
    )

    todos = build_review_todos(
        "sig-long-tail-beach-current",
        action_root=tmp_path,
        now=datetime(2026, 6, 10, tzinfo=UTC),
    )

    assert {todo.review_window for todo in todos} == {"7d", "14d"}
    context = todos[0].review_context
    assert context.search_intent_label == "规则语义：海滩出行用品"
    assert context.search_term == "beach essentials for toddlers 1-3"
    assert context.aba_reference_term == "beach essentials"
    assert context.aba_reference_rank == "208"
    assert "短语包含" in (context.aba_match_boundary or "")
    assert context.repeat_search_intent_count == 2
    assert context.repeat_aba_reference_count == 1
    assert "同一 Parent ASIN 广告搜索词表现复核已有 2 次人工留痕" in context.repeat_summary
    assert "规则反馈口径" in context.repeat_summary
    assert context.can_auto_change_rules is False
    assert context.can_auto_execute_ads is False


def test_review_todos_infer_search_intent_for_legacy_search_term_action(tmp_path: Path) -> None:
    action_payloads = [
        {
            "id": "manual-action-beach-legacy-1",
            "signal_id": "sig-long-tail-beach-legacy-1",
            "action_type": "observe",
            "operator_name": "本地运营",
            "acted_at": "2026-06-01T00:00:00+00:00",
            "manual_status": "observing",
            "snapshot_id": "snapshot-legacy",
            "shop_id": "market:1",
            "market_id": 1,
            "object_type": "search_term",
            "object_id": "search_term:1:beach essentials for kids",
            "object_label": "beach essentials for kids",
            "evidence_snapshot": [
                {"label": "搜索词", "value": "beach essentials for kids", "source": "积加API"},
            ],
        },
        {
            "id": "manual-action-beach-legacy-2",
            "signal_id": "sig-long-tail-beach-legacy-2",
            "action_type": "add_to_review",
            "operator_name": "本地运营",
            "acted_at": "2026-06-03T00:00:00+00:00",
            "manual_status": "pending",
            "snapshot_id": "snapshot-current",
            "shop_id": "market:1",
            "market_id": 1,
            "object_type": "search_term",
            "object_id": "search_term:1:beach essentials",
            "object_label": "beach essentials",
            "evidence_snapshot": [
                {"label": "搜索词", "value": "beach essentials", "source": "积加API"},
                {
                    "label": "复盘指标",
                    "value": "7/14 天复盘点击、订单、ACOS、CVR、是否重复出现。",
                    "source": "积加API",
                },
            ],
        },
    ]
    (tmp_path / "manual_actions.jsonl").write_text(
        "\n".join(json.dumps(payload, ensure_ascii=False) for payload in action_payloads) + "\n",
        encoding="utf-8",
    )

    todos = build_review_todos(
        "sig-long-tail-beach-legacy-2",
        action_root=tmp_path,
        now=datetime(2026, 6, 10, tzinfo=UTC),
    )

    context = todos[0].review_context
    assert context.search_term == "beach essentials"
    assert context.search_intent_label == "规则语义：海滩出行用品"
    assert context.repeat_search_intent_count == 2
    assert "同一 Parent ASIN 广告搜索词表现复核已有 2 次人工留痕" in context.repeat_summary
    assert context.can_auto_change_rules is False
    assert context.can_auto_execute_ads is False


def test_review_todos_extract_manual_action_path_and_review_metrics(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-search-term-review-metrics",
        "signal_id": "sig-search-term-review-metrics",
        "action_type": "add_to_review",
        "operator_name": "本地运营",
        "acted_at": "2026-06-03T00:00:00+00:00",
        "manual_status": "pending",
        "snapshot_id": "snapshot-current",
        "shop_id": "market:1",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "beach essentials",
        "object_label": "beach essentials",
        "evidence_snapshot": [
            {
                "label": "人工动作路径",
                "value": "人工确认后加入精准关键词候选或小流量观察；本系统只记录处理和复盘，不自动新增关键词、不自动调价、不自动否词。",
                "source": "积加API",
            },
            {
                "label": "复盘指标",
                "value": "7/14 天复盘点击、订单、ACOS、CVR、是否重复出现。",
                "source": "积加API",
            },
        ],
    }
    (tmp_path / "manual_actions.jsonl").write_text(
        json.dumps(action_payload, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    todos = build_review_todos(
        "sig-search-term-review-metrics",
        action_root=tmp_path,
        now=datetime(2026, 6, 10, tzinfo=UTC),
    )

    assert {todo.review_window for todo in todos} == {"7d", "14d"}
    context = todos[0].review_context
    assert context.manual_action_path.startswith("人工确认后加入精准关键词候选")
    assert "7/14 天复盘点击、订单、ACOS" in context.review_metrics
    assert context.can_auto_change_rules is False
    assert context.can_auto_execute_ads is False


def test_latest_manual_status_does_not_cross_market(tmp_path: Path) -> None:
    signal_market_1 = make_signal("sig-shared-data-quality")
    signal_market_2 = make_signal("sig-shared-data-quality").model_copy(update={"market_id": 2, "shop_id": "shop-other"})
    save_manual_action(
        signal_id="sig-shared-data-quality",
        action_type="observe",
        operator_name="本地运营",
        market_id=1,
        action_root=tmp_path,
    )

    enriched = manual_actions.apply_latest_manual_actions([signal_market_1, signal_market_2], action_root=tmp_path)

    assert enriched[0].status == SignalStatus.OBSERVING
    assert enriched[1].status == SignalStatus.PENDING


def test_latest_review_result_does_not_cross_market(tmp_path: Path) -> None:
    signal_market_1 = make_signal("sig-shared-data-quality")
    signal_market_2 = make_signal("sig-shared-data-quality").model_copy(update={"market_id": 2, "shop_id": "shop-other"})
    review_payload = {
        "id": "review-record-fixed",
        "signal_id": "sig-shared-data-quality",
        "action_id": "manual-action-fixed",
        "action_type": "handled",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "snapshot_id": "snapshot-1",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "review_window": "7d",
        "before_metrics": {},
        "after_metrics": {},
        "result": "improved",
        "review_note": "market 1 已改善",
        "reviewer_name": "本地运营",
        "reviewed_at": "2026-06-10T00:00:00+00:00",
    }
    (tmp_path / "review_records.jsonl").write_text(json.dumps(review_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    enriched = manual_actions.apply_latest_review_records([signal_market_1, signal_market_2], review_root=tmp_path)

    assert enriched[0].review_result == "improved"
    assert enriched[1].review_result is None


def test_latest_review_result_matches_stable_object_when_signal_id_changes(tmp_path: Path) -> None:
    previous_signal = make_advertised_product_signal("sig-ad-product-old")
    current_signal = make_advertised_product_signal("sig-ad-product-new")
    review_payload = {
        "id": "review-record-stable-object",
        "signal_id": previous_signal.id,
        "action_id": "manual-action-stable-object",
        "action_type": "add_to_review",
        "acted_at": "2026-06-15T00:00:00+00:00",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "advertised_product",
        "object_id": "B016EXMW02",
        "object_label": "B016EXMW02",
        "review_window": "7d",
        "before_metrics": {"cost": 20, "orders": 2},
        "after_metrics": {"cost": 18, "orders": 5},
        "result": "improved",
        "review_note": "同一广告 ASIN 已改善",
        "reviewer_name": "本地运营",
        "reviewed_at": "2026-06-23T00:00:00+00:00",
    }
    (tmp_path / "review_records.jsonl").write_text(json.dumps(review_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    records = manual_actions.load_review_records(
        "sig-ad-product-new",
        market_id=1,
        object_type="advertised_product",
        object_id="B016EXMW02",
        review_root=tmp_path,
    )
    enriched = manual_actions.apply_latest_review_records([current_signal], review_root=tmp_path)

    assert [record.id for record in records] == ["review-record-stable-object"]
    assert enriched[0].review_result == "improved"


def test_manual_action_load_hides_corrupted_question_mark_text(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-corrupted",
        "signal_id": "sig-test-manual-action",
        "action_type": "observe",
        "action_note": "????????????",
        "operator_name": "????",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "manual_status": "observing",
        "snapshot_id": "snapshot-1",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": diagnosis_evidence_snapshot(),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    records = load_manual_actions("sig-test-manual-action", action_root=tmp_path)
    todos = build_review_todos(
        "sig-test-manual-action",
        action_root=tmp_path,
        now=datetime(2026, 6, 9, tzinfo=UTC),
    )

    assert records[0].operator_name == "本地运营"
    assert records[0].action_note is None
    assert todos[0].operator_name == "本地运营"
    assert todos[0].action_note is None


def test_signal_manual_routes_are_scoped_by_market_id(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path, raising=False)
    action_payloads = [
        {
            "id": "manual-action-market-1",
            "signal_id": "sig-shared-data-quality",
            "action_type": "observe",
            "action_note": "market 1 observe",
            "operator_name": "本地运营",
            "acted_at": "2026-06-01T00:00:00+00:00",
            "manual_status": "observing",
            "snapshot_id": "snapshot-market-1",
            "shop_id": "shop-rivbos",
            "market_id": 1,
            "object_type": "cross",
            "object_id": "aba_search_term_snapshot",
            "object_label": "ABA 搜索词数据",
        },
        {
            "id": "manual-action-market-2",
            "signal_id": "sig-shared-data-quality",
            "action_type": "handled",
            "action_note": "market 2 handled",
            "operator_name": "本地运营",
            "acted_at": "2026-06-02T00:00:00+00:00",
            "manual_status": "adopted",
            "snapshot_id": "snapshot-market-2",
            "shop_id": "shop-other",
            "market_id": 2,
            "object_type": "cross",
            "object_id": "aba_search_term_snapshot",
            "object_label": "ABA 搜索词数据",
        },
    ]
    review_payloads = [
        {
            "id": "review-record-market-1",
            "signal_id": "sig-shared-data-quality",
            "action_id": "manual-action-market-1",
            "action_type": "observe",
            "acted_at": "2026-06-01T00:00:00+00:00",
            "snapshot_id": "snapshot-market-1",
            "shop_id": "shop-rivbos",
            "market_id": 1,
            "object_type": "cross",
            "object_id": "aba_search_term_snapshot",
            "object_label": "ABA 搜索词数据",
            "review_window": "7d",
            "before_metrics": {},
            "after_metrics": {},
            "result": "no_change",
            "review_note": "market 1",
            "reviewer_name": "本地运营",
            "reviewed_at": "2026-06-10T00:00:00+00:00",
        },
        {
            "id": "review-record-market-2",
            "signal_id": "sig-shared-data-quality",
            "action_id": "manual-action-market-2",
            "action_type": "handled",
            "acted_at": "2026-06-02T00:00:00+00:00",
            "snapshot_id": "snapshot-market-2",
            "shop_id": "shop-other",
            "market_id": 2,
            "object_type": "cross",
            "object_id": "aba_search_term_snapshot",
            "object_label": "ABA 搜索词数据",
            "review_window": "7d",
            "before_metrics": {},
            "after_metrics": {},
            "result": "improved",
            "review_note": "market 2",
            "reviewer_name": "本地运营",
            "reviewed_at": "2026-06-11T00:00:00+00:00",
        },
    ]
    (tmp_path / "manual_actions.jsonl").write_text(
        "\n".join(json.dumps(payload, ensure_ascii=False) for payload in action_payloads) + "\n",
        encoding="utf-8",
    )
    (tmp_path / "review_records.jsonl").write_text(
        "\n".join(json.dumps(payload, ensure_ascii=False) for payload in review_payloads) + "\n",
        encoding="utf-8",
    )

    client = TestClient(app)
    manual_response = client.get("/api/signals/sig-shared-data-quality/manual-actions?market_id=2")
    todo_response = client.get("/api/signals/sig-shared-data-quality/review-todos?market_id=2")
    review_response = client.get("/api/signals/sig-shared-data-quality/review-records?market_id=2")

    assert [record["id"] for record in manual_response.json()] == ["manual-action-market-2"]
    assert {todo["action_id"] for todo in todo_response.json()} == {"manual-action-market-2"}
    assert [record["id"] for record in review_response.json()] == ["review-record-market-2"]


def test_review_record_route_can_read_by_stable_object_when_signal_id_changes(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path, raising=False)
    review_payload = {
        "id": "review-record-stable-object",
        "signal_id": "sig-ad-product-old",
        "action_id": "manual-action-stable-object",
        "action_type": "add_to_review",
        "acted_at": "2026-06-15T00:00:00+00:00",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "advertised_product",
        "object_id": "B016EXMW02",
        "object_label": "B016EXMW02",
        "review_window": "7d",
        "before_metrics": {"cost": 20, "orders": 2},
        "after_metrics": {"cost": 18, "orders": 5},
        "result": "improved",
        "review_note": "同一广告 ASIN 已改善",
        "reviewer_name": "本地运营",
        "reviewed_at": "2026-06-23T00:00:00+00:00",
    }
    (tmp_path / "review_records.jsonl").write_text(json.dumps(review_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    response = TestClient(app).get(
        "/api/signals/sig-ad-product-new/review-records"
        "?market_id=1&object_type=advertised_product&object_id=B016EXMW02"
    )

    assert response.status_code == 200
    assert [record["id"] for record in response.json()] == ["review-record-stable-object"]


def test_review_todos_are_derived_from_manual_action_time(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-1",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": diagnosis_evidence_snapshot(),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    todos = build_review_todos(
        "sig-test-manual-action",
        action_root=tmp_path,
        now=datetime(2026, 6, 9, tzinfo=UTC),
    )

    assert [todo.review_window for todo in todos] == ["7d", "14d"]
    assert todos[0].due_at == "2026-06-08T00:00:00+00:00"
    assert todos[0].is_due is True
    assert todos[0].days_since_action == 8
    assert todos[0].object_type == "search_term"
    assert todos[0].object_id == "kids sunglasses"
    assert todos[0].object_label == "kids sunglasses"
    assert todos[1].due_at == "2026-06-15T00:00:00+00:00"
    assert todos[1].is_due is False


def test_review_todos_follow_latest_manual_action_only(tmp_path: Path) -> None:
    action_payloads = [
        {
            "id": "manual-action-old",
            "signal_id": "sig-test-manual-action",
            "action_type": "observe",
            "action_note": "old observe",
            "operator_name": "local operator",
            "acted_at": "2026-06-01T00:00:00+00:00",
            "manual_status": "observing",
            "snapshot_id": "snapshot-old",
            "shop_id": "shop-rivbos",
            "market_id": 1,
            "object_type": "search_term",
            "object_id": "kids sunglasses",
            "object_label": "kids sunglasses",
        },
        {
            "id": "manual-action-new",
            "signal_id": "sig-test-manual-action",
            "action_type": "handled",
            "action_note": "new handled",
            "operator_name": "local operator",
            "acted_at": "2026-06-03T00:00:00+00:00",
            "manual_status": "adopted",
            "snapshot_id": "snapshot-new",
            "shop_id": "shop-rivbos",
            "market_id": 1,
            "object_type": "search_term",
            "object_id": "kids sunglasses",
            "object_label": "kids sunglasses",
        },
    ]
    (tmp_path / "manual_actions.jsonl").write_text(
        "\n".join(json.dumps(payload, ensure_ascii=False) for payload in action_payloads) + "\n",
        encoding="utf-8",
    )

    todos = build_review_todos(
        "sig-test-manual-action",
        action_root=tmp_path,
        now=datetime(2026, 6, 10, tzinfo=UTC),
    )

    assert [todo.review_window for todo in todos] == ["7d", "14d"]
    assert {todo.action_id for todo in todos} == {"manual-action-new"}
    assert todos[0].action_type == "handled"
    assert todos[0].due_at == "2026-06-10T00:00:00+00:00"
    assert todos[0].is_due is True
    assert todos[0].days_since_action == 7


def test_review_todos_skip_latest_ignored_action(tmp_path: Path) -> None:
    action_payloads = [
        {
            "id": "manual-action-old",
            "signal_id": "sig-test-manual-action",
            "action_type": "handled",
            "action_note": "old handled",
            "operator_name": "local operator",
            "acted_at": "2026-06-01T00:00:00+00:00",
            "manual_status": "adopted",
            "snapshot_id": "snapshot-old",
            "shop_id": "shop-rivbos",
            "market_id": 1,
            "object_type": "search_term",
            "object_id": "kids sunglasses",
            "object_label": "kids sunglasses",
        },
        {
            "id": "manual-action-ignore",
            "signal_id": "sig-test-manual-action",
            "action_type": "ignore",
            "action_note": "ignore this round",
            "operator_name": "local operator",
            "acted_at": "2026-06-03T00:00:00+00:00",
            "manual_status": "ignored",
            "snapshot_id": "snapshot-new",
            "shop_id": "shop-rivbos",
            "market_id": 1,
            "object_type": "search_term",
            "object_id": "kids sunglasses",
            "object_label": "kids sunglasses",
        },
    ]
    (tmp_path / "manual_actions.jsonl").write_text(
        "\n".join(json.dumps(payload, ensure_ascii=False) for payload in action_payloads) + "\n",
        encoding="utf-8",
    )

    todos = build_review_todos(
        "sig-test-manual-action",
        action_root=tmp_path,
        now=datetime(2026, 6, 10, tzinfo=UTC),
    )

    assert todos == []


def test_review_todo_decision_voids_one_legacy_window_without_deleting_action(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-legacy",
        "signal_id": "sig-legacy-missing-evidence",
        "action_type": "add_to_review",
        "action_note": "legacy action without evidence snapshot",
        "operator_name": "local operator",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "manual_status": "pending",
        "snapshot_id": "snapshot-old",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "beach essentials",
        "object_label": "beach essentials",
        "evidence_snapshot": [],
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    before = build_review_todos(
        "sig-legacy-missing-evidence",
        market_id=1,
        action_root=tmp_path,
        now=datetime(2026, 6, 10, tzinfo=UTC),
    )
    assert [todo.review_window for todo in before] == ["7d", "14d"]

    decision = manual_actions.save_review_todo_decision(
        action_id="manual-action-legacy",
        signal_id="sig-legacy-missing-evidence",
        review_window="7d",
        reason="历史动作缺少 evidence_snapshot，7d 待办作废。",
        operator_name="本地运营",
        shop_id="shop-rivbos",
        market_id=1,
        object_type="search_term",
        object_id="beach essentials",
        object_label="beach essentials",
        action_root=tmp_path,
    )

    after = build_review_todos(
        "sig-legacy-missing-evidence",
        market_id=1,
        action_root=tmp_path,
        now=datetime(2026, 6, 10, tzinfo=UTC),
    )
    actions = load_manual_actions("sig-legacy-missing-evidence", market_id=1, action_root=tmp_path)
    decisions = manual_actions.load_review_todo_decisions(action_id="manual-action-legacy", market_id=1, action_root=tmp_path)

    assert decision.decision_type == "void_legacy_missing_evidence"
    assert decision.can_auto_change_rules is False
    assert decision.can_auto_execute_ads is False
    assert [todo.review_window for todo in after] == ["14d"]
    assert [action.id for action in actions] == ["manual-action-legacy"]
    assert [item.id for item in decisions] == [decision.id]


def test_review_todo_decision_voids_all_windows_when_window_is_none(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-legacy-all",
        "signal_id": "sig-legacy-all",
        "action_type": "handled",
        "operator_name": "local operator",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "manual_status": "adopted",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "advertised_product",
        "object_id": "B016EXMW02",
        "object_label": "B016EXMW02",
        "evidence_snapshot": [],
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    manual_actions.save_review_todo_decision(
        action_id="manual-action-legacy-all",
        signal_id="sig-legacy-all",
        review_window=None,
        reason="历史动作缺少 evidence_snapshot，全部待办作废。",
        market_id=1,
        object_type="advertised_product",
        object_id="B016EXMW02",
        action_root=tmp_path,
    )

    todos = build_review_todos(
        "sig-legacy-all",
        market_id=1,
        action_root=tmp_path,
        now=datetime(2026, 6, 10, tzinfo=UTC),
    )

    assert todos == []


def test_review_effect_for_cross_signal_uses_data_quality_review_message(tmp_path: Path) -> None:
    build_review_effect_result = getattr(manual_actions, "build_review_effect_result", None)
    assert build_review_effect_result is not None
    action_payload = {
        "id": "manual-action-cross",
        "signal_id": "sig-data-quality-aba-stale",
        "action_type": "observe",
        "action_note": "重新导入 ABA 后观察",
        "operator_name": "本地运营",
        "acted_at": "2026-06-14T00:00:00+00:00",
        "manual_status": "observing",
        "snapshot_id": "aba-snapshot-old",
        "shop_id": "market:1",
        "market_id": 1,
        "object_type": "cross",
        "object_id": "aba_search_term_snapshot",
        "object_label": "ABA 搜索词数据",
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    result = build_review_effect_result(
        "sig-data-quality-aba-stale",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            }
        ],
        now=datetime(2026, 6, 22, tzinfo=UTC),
    )

    assert result.status == "not_ready"
    assert result.result == "unclear"
    assert result.message == "处理前后指标暂不可计算：数据质量或交叉信号不适用广告指标前后对比，请复查数据是否补齐或更新"
    assert result.action_id == "manual-action-cross"
    assert result.object_type == "cross"
    assert result.before_metrics == {}
    assert result.after_metrics == {}


def test_review_effect_waits_for_after_snapshot(tmp_path: Path) -> None:
    build_review_effect_result = getattr(manual_actions, "build_review_effect_result", None)
    assert build_review_effect_result is not None
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": diagnosis_evidence_snapshot(),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    result = build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "impressions": 1000,
                "clicks": 50,
                "cost": 80,
                "orders": 1,
                "sales": 50,
            }
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    assert result.status == "not_ready"
    assert result.result == "unclear"
    assert result.message == "处理前后指标暂不可计算：缺少处理后 7 天快照"
    assert result.before_metrics["cost"] == 80
    assert result.after_metrics == {}


def test_review_effect_for_advertised_product_ignores_sales_product_rows_with_same_asin(tmp_path: Path) -> None:
    build_review_effect_result = getattr(manual_actions, "build_review_effect_result", None)
    assert build_review_effect_result is not None
    action_payload = {
        "id": "manual-action-ad-product",
        "signal_id": "sig-ad-product",
        "action_type": "add_to_review",
        "action_note": "加入复盘",
        "operator_name": "本地运营",
        "acted_at": "2026-06-15T00:00:00+00:00",
        "manual_status": "pending",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "advertised_product",
        "object_id": "B016EXMW02",
        "object_label": "B016EXMW02",
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    result = build_review_effect_result(
        "sig-ad-product",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "object_type": "advertised_product",
                "source_table": "advertised_products",
                "asin": "B016EXMW02",
                "start_date": "2026-06-08",
                "end_date": "2026-06-14",
                "impressions": 1000,
                "clicks": 20,
                "cost": 20,
                "orders": 2,
                "sales": 100,
            },
            {
                "market_id": 1,
                "object_type": "sales_product",
                "source_table": "sales_product_daily_metrics",
                "asin": "B016EXMW02",
                "start_date": "2026-06-08",
                "end_date": "2026-06-14",
                "impressions": 0,
                "clicks": 0,
                "cost": -500,
                "orders": 100,
                "sales": 1000,
            },
        ],
        now=datetime(2026, 6, 23, tzinfo=UTC),
    )

    assert result.status == "not_ready"
    assert result.message == "处理前后指标暂不可计算：缺少处理后 7 天快照"
    assert result.before_metrics["cost"] == 20
    assert result.before_metrics["orders"] == 2
    assert result.before_metrics["sales"] == 100
    assert result.before_metrics["cpc"] == 1


def test_review_effect_uses_rows_inside_review_window_only(tmp_path: Path) -> None:
    build_review_effect_result = getattr(manual_actions, "build_review_effect_result", None)
    assert build_review_effect_result is not None
    action_payload = {
        "id": "manual-action-ad-product",
        "signal_id": "sig-ad-product",
        "action_type": "add_to_review",
        "action_note": "加入复盘",
        "operator_name": "本地运营",
        "acted_at": "2026-06-15T00:00:00+00:00",
        "manual_status": "pending",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "advertised_product",
        "object_id": "B016EXMW02",
        "object_label": "B016EXMW02",
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    result = build_review_effect_result(
        "sig-ad-product",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "object_type": "advertised_product",
                "source_table": "advertised_products",
                "asin": "B016EXMW02",
                "start_date": "2026-05-17",
                "end_date": "2026-06-15",
                "impressions": 9000,
                "clicks": 200,
                "cost": 200,
                "orders": 20,
                "sales": 500,
            },
            {
                "market_id": 1,
                "object_type": "advertised_product",
                "source_table": "advertised_products",
                "asin": "B016EXMW02",
                "start_date": "2026-06-08",
                "end_date": "2026-06-14",
                "impressions": 1000,
                "clicks": 20,
                "cost": 20,
                "orders": 2,
                "sales": 100,
            },
        ],
        now=datetime(2026, 6, 23, tzinfo=UTC),
    )

    assert result.status == "not_ready"
    assert result.message == "处理前后指标暂不可计算：缺少处理后 7 天快照"
    assert result.before_start_date == "2026-06-08"
    assert result.before_end_date == "2026-06-14"
    assert result.before_metrics["cost"] == 20
    assert result.before_metrics["orders"] == 2
    assert result.before_metrics["sales"] == 100


def test_review_effect_requires_complete_before_window(tmp_path: Path) -> None:
    build_review_effect_result = getattr(manual_actions, "build_review_effect_result", None)
    assert build_review_effect_result is not None
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": diagnosis_evidence_snapshot(),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    result = build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-07",
                "end_date": "2026-06-07",
                "impressions": 200,
                "clicks": 10,
                "cost": 20,
                "orders": 1,
                "sales": 40,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "impressions": 900,
                "clicks": 45,
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    assert result.status == "not_ready"
    assert result.result == "unclear"
    assert result.message == "处理前后指标暂不可计算：处理前 7 天窗口不足"
    assert result.before_start_date == "2026-06-07"
    assert result.before_end_date == "2026-06-07"


def test_review_effect_requires_complete_after_window_start(tmp_path: Path) -> None:
    build_review_effect_result = getattr(manual_actions, "build_review_effect_result", None)
    assert build_review_effect_result is not None
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    result = build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "impressions": 1000,
                "clicks": 50,
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-12",
                "end_date": "2026-06-15",
                "impressions": 600,
                "clicks": 30,
                "cost": 45,
                "orders": 4,
                "sales": 160,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    assert result.status == "not_ready"
    assert result.result == "unclear"
    assert result.message == "处理前后指标暂不可计算：处理后 7 天窗口不足"
    assert result.after_start_date == "2026-06-12"
    assert result.after_end_date == "2026-06-15"


def test_review_effect_compares_before_and_after_metrics(tmp_path: Path) -> None:
    build_review_effect_result = getattr(manual_actions, "build_review_effect_result", None)
    assert build_review_effect_result is not None
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    result = build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "impressions": 1000,
                "clicks": 50,
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "impressions": 900,
                "clicks": 45,
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    assert result.status == "ready"
    assert result.result == "improved"
    assert result.message == "处理后 7 天订单改善，ACOS 下降"
    assert result.before_metrics["cost"] == 80
    assert result.before_metrics["orders"] == 1
    assert result.before_metrics["acos"] == 1.6
    assert result.after_metrics["cost"] == 60
    assert result.after_metrics["orders"] == 5
    assert result.after_metrics["acos"] == 0.3


def test_review_effect_for_search_term_uses_only_matching_ad_search_term_rows(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-beach-essentials",
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
        "evidence_snapshot": diagnosis_evidence_snapshot(),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    result = manual_actions.build_review_effect_result(
        "sig-opportunity-search-term-1-beach-essentials",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
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
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    assert result.status == "ready"
    assert result.object_type == "search_term"
    assert result.object_id == "search_term:1:beach essentials"
    assert result.before_metrics["cost"] == 41
    assert result.before_metrics["orders"] == 2
    assert result.after_metrics["cost"] == 30
    assert result.after_metrics["orders"] == 4
    assert result.after_metrics["sales"] == 200


def test_review_effect_waits_until_review_window_due_even_when_rows_exist(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    effect = manual_actions.build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 14, tzinfo=UTC),
    )

    assert effect.status == "not_ready"
    assert effect.result == "unclear"
    assert effect.due_at == "2026-06-15T00:00:00+00:00"
    assert effect.message == "处理前后指标暂不可计算：7 天复盘窗口尚未到期，预计 2026-06-15 后复盘"
    try:
        manual_actions.save_review_record(effect, review_note="不能提前保存", reviewer_name="本地运营", review_root=tmp_path)
    except ValueError as error:
        assert str(error) == "review_effect_not_ready"
    else:
        raise AssertionError("复盘窗口未到期时不能保存 review_records")


def test_review_record_persists_ready_effect_and_can_read_latest(tmp_path: Path) -> None:
    build_review_effect_result = getattr(manual_actions, "build_review_effect_result", None)
    save_review_record = getattr(manual_actions, "save_review_record", None)
    load_review_records = getattr(manual_actions, "load_review_records", None)
    latest_review_record = getattr(manual_actions, "latest_review_record", None)
    assert build_review_effect_result is not None
    assert save_review_record is not None
    assert load_review_records is not None
    assert latest_review_record is not None
    search_term_review_snapshot = diagnosis_evidence_snapshot()
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": search_term_review_snapshot,
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    assert effect.evidence_snapshot[0].label == "排查路径"
    assert effect.evidence_snapshot[1].source == "actionability_status"

    record = save_review_record(
        effect,
        review_note="确认处理有效，保留为成功复盘",
        reviewer_name="本地运营",
        expected_action_id="manual-action-fixed",
        expected_object_type="search_term",
        expected_object_id="kids sunglasses",
        expected_review_window="7d",
        expected_evidence_snapshot=search_term_review_snapshot,
        expected_can_auto_change_rules=False,
        expected_can_auto_execute_ads=False,
        review_root=tmp_path,
    )
    records = load_review_records("sig-test-manual-action", review_root=tmp_path)
    latest = latest_review_record("sig-test-manual-action", review_root=tmp_path)

    assert record.signal_id == "sig-test-manual-action"
    assert record.result == "improved"
    assert record.review_window == "7d"
    assert record.review_note == "确认处理有效，保留为成功复盘"
    assert record.shop_id == "shop-rivbos"
    assert record.market_id == 1
    assert record.object_type == "search_term"
    assert record.object_id == "kids sunglasses"
    assert record.object_label == "kids sunglasses"
    assert record.before_metrics["cost"] == 80
    assert record.after_metrics["orders"] == 5
    assert record.evidence_snapshot[0].label == "排查路径"
    assert record.evidence_snapshot[1].label == "AI 准入"
    assert record.evidence_snapshot[1].source == "actionability_status"
    assert record.review_context is not None
    assert record.review_context.search_intent_label == "规则语义：儿童太阳镜"
    assert record.review_context.search_term == "kids sunglasses"
    assert record.review_context.can_auto_change_rules is False
    assert record.review_context.can_auto_execute_ads is False
    assert records == [record]
    assert records[0].review_context is not None
    assert records[0].review_context.search_intent_label == "规则语义：儿童太阳镜"
    assert records[0].evidence_snapshot[0].value.startswith("Parent 经营盘子")
    assert latest == record
    assert (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_evidence_snapshot_not_inherited_from_effect(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": diagnosis_evidence_snapshot(),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )
    stale_snapshot = diagnosis_evidence_snapshot()
    coverage_index = next(index for index, item in enumerate(stale_snapshot) if item["label"] == "广告商品覆盖")
    stale_snapshot[coverage_index] = {
        "label": "广告商品覆盖",
        "value": "前端缓存里的旧证据",
        "detail": "这不是当前人工动作继承下来的证据快照。",
        "source": "stale_frontend",
    }

    try:
        manual_actions.save_review_record(
            effect,
            review_note="证据快照不一致不能保存",
            reviewer_name="本地运营",
            expected_action_id="manual-action-fixed",
            expected_object_type="search_term",
            expected_object_id="kids sunglasses",
            expected_review_window="7d",
            expected_evidence_snapshot=stale_snapshot,
            expected_can_auto_change_rules=False,
            expected_can_auto_execute_ads=False,
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_evidence_snapshot_mismatch"
    else:
        raise AssertionError("ReviewRecord 不能保存非当前人工动作继承的证据快照")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_evidence_snapshot_without_target_object_reference(tmp_path: Path) -> None:
    other_object_snapshot = diagnosis_evidence_snapshot_for_other_object()
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": other_object_snapshot,
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(
            effect,
            review_note="证据快照未指向当前对象不能保存",
            reviewer_name="本地运营",
            expected_action_id="manual-action-fixed",
            expected_object_type="search_term",
            expected_object_id="kids sunglasses",
            expected_review_window="7d",
            expected_evidence_snapshot=other_object_snapshot,
            expected_can_auto_change_rules=False,
            expected_can_auto_execute_ads=False,
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_evidence_snapshot_object_mismatch"
    else:
        raise AssertionError("ReviewRecord 不能保存未能回看当前对象的证据快照")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_search_term_snapshot_without_action_boundary_at_service_layer(tmp_path: Path) -> None:
    evidence_snapshot = diagnosis_without_label_snapshot("动作边界")
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": evidence_snapshot,
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(
            effect,
            review_note="缺少动作边界不能保存",
            reviewer_name="本地运营",
            expected_action_id="manual-action-fixed",
            expected_object_type="search_term",
            expected_object_id="kids sunglasses",
            expected_review_window="7d",
            expected_evidence_snapshot=evidence_snapshot,
            expected_can_auto_change_rules=False,
            expected_can_auto_execute_ads=False,
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_missing_action_boundary"
    else:
        raise AssertionError("搜索词复盘缺少动作边界时不能保存 ReviewRecord")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_search_term_snapshot_without_ad_context_rows_at_service_layer(tmp_path: Path) -> None:
    evidence_snapshot = diagnosis_without_label_snapshot("逐投放上下文")
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": evidence_snapshot,
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(
            effect,
            review_note="缺少逐投放上下文不能保存",
            reviewer_name="本地运营",
            expected_action_id="manual-action-fixed",
            expected_object_type="search_term",
            expected_object_id="kids sunglasses",
            expected_review_window="7d",
            expected_evidence_snapshot=evidence_snapshot,
            expected_can_auto_change_rules=False,
            expected_can_auto_execute_ads=False,
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_missing_ad_context_rows"
    else:
        raise AssertionError("搜索词复盘缺少逐投放上下文时不能保存 ReviewRecord")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_search_term_snapshot_without_required_evidence_at_service_layer(tmp_path: Path) -> None:
    evidence_snapshot = diagnosis_without_label_snapshot("需要补证")
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": evidence_snapshot,
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(
            effect,
            review_note="缺少需要补证不能保存",
            reviewer_name="本地运营",
            expected_action_id="manual-action-fixed",
            expected_object_type="search_term",
            expected_object_id="kids sunglasses",
            expected_review_window="7d",
            expected_evidence_snapshot=evidence_snapshot,
            expected_can_auto_change_rules=False,
            expected_can_auto_execute_ads=False,
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_missing_required_evidence"
    else:
        raise AssertionError("搜索词复盘缺少需要补证时不能保存 ReviewRecord")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_advertised_product_snapshot_without_ad_product_coverage(tmp_path: Path) -> None:
    evidence_snapshot = diagnosis_without_label_snapshot("广告商品覆盖")
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-ad-product-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "advertised_product",
        "object_id": "B016EXMW02",
        "object_label": "B016EXMW02",
        "evidence_snapshot": evidence_snapshot,
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-ad-product-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=ad_product_review_rows(),
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(
            effect,
            review_note="缺少广告商品覆盖不能保存",
            reviewer_name="本地运营",
            expected_action_id="manual-action-fixed",
            expected_object_type="advertised_product",
            expected_object_id="B016EXMW02",
            expected_review_window="7d",
            expected_evidence_snapshot=evidence_snapshot,
            expected_can_auto_change_rules=False,
            expected_can_auto_execute_ads=False,
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_missing_ad_product_coverage"
    else:
        raise AssertionError("广告商品复盘缺少广告商品覆盖时不能保存 ReviewRecord")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_advertised_product_snapshot_without_action_boundary(tmp_path: Path) -> None:
    evidence_snapshot = diagnosis_without_label_snapshot("动作边界")
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-ad-product-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "advertised_product",
        "object_id": "B016EXMW02",
        "object_label": "B016EXMW02",
        "evidence_snapshot": evidence_snapshot,
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-ad-product-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=ad_product_review_rows(),
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(
            effect,
            review_note="缺少动作边界不能保存",
            reviewer_name="本地运营",
            expected_action_id="manual-action-fixed",
            expected_object_type="advertised_product",
            expected_object_id="B016EXMW02",
            expected_review_window="7d",
            expected_evidence_snapshot=evidence_snapshot,
            expected_can_auto_change_rules=False,
            expected_can_auto_execute_ads=False,
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_missing_action_boundary"
    else:
        raise AssertionError("广告商品复盘缺少动作边界时不能保存 ReviewRecord")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_placement_snapshot_without_placement_performance(tmp_path: Path) -> None:
    evidence_snapshot = placement_without_label_snapshot("广告位表现")
    action_payload = {
        "id": "manual-action-placement",
        "signal_id": "sig-test-placement-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "placement",
        "object_id": "Top of Search",
        "object_label": "Top of Search",
        "evidence_snapshot": evidence_snapshot,
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-placement-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=placement_review_rows(),
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(
            effect,
            review_note="缺少广告位表现不能保存",
            reviewer_name="本地运营",
            expected_action_id="manual-action-placement",
            expected_object_type="placement",
            expected_object_id="Top of Search",
            expected_review_window="7d",
            expected_evidence_snapshot=evidence_snapshot,
            expected_can_auto_change_rules=False,
            expected_can_auto_execute_ads=False,
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_missing_placement_performance"
    else:
        raise AssertionError("广告位复盘缺少广告位表现时不能保存 ReviewRecord")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_placement_snapshot_without_action_boundary(tmp_path: Path) -> None:
    evidence_snapshot = placement_without_label_snapshot("动作边界")
    action_payload = {
        "id": "manual-action-placement",
        "signal_id": "sig-test-placement-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "placement",
        "object_id": "Top of Search",
        "object_label": "Top of Search",
        "evidence_snapshot": evidence_snapshot,
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-placement-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=placement_review_rows(),
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(
            effect,
            review_note="缺少动作边界不能保存",
            reviewer_name="本地运营",
            expected_action_id="manual-action-placement",
            expected_object_type="placement",
            expected_object_id="Top of Search",
            expected_review_window="7d",
            expected_evidence_snapshot=evidence_snapshot,
            expected_can_auto_change_rules=False,
            expected_can_auto_execute_ads=False,
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_missing_action_boundary"
    else:
        raise AssertionError("广告位复盘缺少动作边界时不能保存 ReviewRecord")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_missing_diagnosis_path(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": minimal_evidence_snapshot("广告商品覆盖"),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(
            effect,
            review_note="缺少诊断路径",
            reviewer_name="本地运营",
            expected_action_id="manual-action-fixed",
            expected_object_type="search_term",
            expected_object_id="kids sunglasses",
            expected_review_window="7d",
            expected_evidence_snapshot=minimal_evidence_snapshot("广告商品覆盖"),
            expected_can_auto_change_rules=False,
            expected_can_auto_execute_ads=False,
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_missing_diagnosis_path"
    else:
        raise AssertionError("缺少排查路径时不能保存 ReviewRecord")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_missing_ai_admission(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": diagnosis_without_ai_admission_snapshot(),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(
            effect,
            review_note="缺少 AI 准入理由",
            reviewer_name="本地运营",
            expected_action_id="manual-action-fixed",
            expected_object_type="search_term",
            expected_object_id="kids sunglasses",
            expected_review_window="7d",
            expected_evidence_snapshot=diagnosis_without_ai_admission_snapshot(),
            expected_can_auto_change_rules=False,
            expected_can_auto_execute_ads=False,
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_missing_ai_admission"
    else:
        raise AssertionError("缺少 AI 准入理由时不能保存 ReviewRecord")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_missing_search_term_or_placement_boundary(tmp_path: Path) -> None:
    cases = [
        ("搜索词边界", "review_record_missing_search_term_boundary"),
        ("广告位边界", "review_record_missing_placement_boundary"),
    ]
    for missing_label, expected_error in cases:
        case_root = tmp_path / expected_error
        case_root.mkdir()
        evidence_snapshot = diagnosis_without_label_snapshot(missing_label)
        action_payload = {
            "id": "manual-action-fixed",
            "signal_id": "sig-test-manual-action",
            "action_type": "handled",
            "action_note": "已人工处理",
            "operator_name": "本地运营",
            "acted_at": "2026-06-08T00:00:00+00:00",
            "manual_status": "adopted",
            "snapshot_id": "snapshot-before",
            "shop_id": "shop-rivbos",
            "market_id": 1,
            "object_type": "search_term",
            "object_id": "kids sunglasses",
            "object_label": "kids sunglasses",
            "evidence_snapshot": evidence_snapshot,
        }
        (case_root / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
        effect = manual_actions.build_review_effect_result(
            "sig-test-manual-action",
            review_window="7d",
            action_root=case_root,
            signal_rows=[
                {
                    "market_id": 1,
                    "search_term": "kids sunglasses",
                    "start_date": "2026-06-01",
                    "end_date": "2026-06-07",
                    "cost": 80,
                    "orders": 1,
                    "sales": 50,
                },
                {
                    "market_id": 1,
                    "search_term": "kids sunglasses",
                    "start_date": "2026-06-09",
                    "end_date": "2026-06-15",
                    "cost": 60,
                    "orders": 5,
                    "sales": 200,
                },
            ],
            now=datetime(2026, 6, 16, tzinfo=UTC),
        )

        try:
            manual_actions.save_review_record(
                effect,
                review_note=f"缺少{missing_label}",
                reviewer_name="本地运营",
                expected_action_id="manual-action-fixed",
                expected_object_type="search_term",
                expected_object_id="kids sunglasses",
                expected_review_window="7d",
                expected_evidence_snapshot=evidence_snapshot,
                expected_can_auto_change_rules=False,
                expected_can_auto_execute_ads=False,
                review_root=case_root,
            )
        except ValueError as error:
            assert str(error) == expected_error
        else:
            raise AssertionError(f"缺少{missing_label}时不能保存 ReviewRecord")

        assert not (case_root / "review_records.jsonl").exists()


def test_review_record_rejects_not_ready_effect(tmp_path: Path) -> None:
    save_review_record = getattr(manual_actions, "save_review_record", None)
    assert save_review_record is not None
    effect = manual_actions.build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        save_review_record(effect, review_note="不能保存", reviewer_name="本地运营", review_root=tmp_path)
    except ValueError as error:
        assert str(error) == "review_effect_not_ready"
    else:
        raise AssertionError("not_ready 的处理前后指标不能保存为复盘记录")


def test_review_record_rejects_missing_preflight_expectation(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(effect, review_note="缺少预检期望", reviewer_name="本地运营", review_root=tmp_path)
    except ValueError as error:
        assert str(error) == "review_record_preflight_required"
    else:
        raise AssertionError("缺少复盘对象预检期望时不能保存 review_records")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_rejects_missing_forbidden_effect_expectation(tmp_path: Path) -> None:
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    effect = manual_actions.build_review_effect_result(
        "sig-test-manual-action",
        review_window="7d",
        action_root=tmp_path,
        signal_rows=[
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
        now=datetime(2026, 6, 16, tzinfo=UTC),
    )

    try:
        manual_actions.save_review_record(
            effect,
            review_note="缺少禁止自动动作声明",
            reviewer_name="本地运营",
            expected_action_id="manual-action-fixed",
            expected_object_type="search_term",
            expected_object_id="kids sunglasses",
            expected_review_window="7d",
            review_root=tmp_path,
        )
    except ValueError as error:
        assert str(error) == "review_record_preflight_required"
    else:
        raise AssertionError("缺少禁止自动动作声明时不能保存 review_records")

    assert not (tmp_path / "review_records.jsonl").exists()


def test_manual_action_route_persists_and_applies_latest_status(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "detect_signals", lambda signal_rows, aba_rows=None, promotion_strategies=None: [make_signal()])
    monkeypatch.setattr(routes, "detect_data_quality_signals", lambda *args, **kwargs: [])
    evidence_snapshot = minimal_evidence_snapshot("搜索词浪费证据")
    monkeypatch.setattr(
        routes,
        "build_manual_action_preflight_payload",
        lambda **kwargs: route_preflight_payload(
            object_type="search_term",
            object_id="kids sunglasses",
            action_type="handled",
            evidence_snapshot=evidence_snapshot,
        ),
    )

    response = TestClient(app).post(
        "/api/signals/sig-test-manual-action/manual-actions",
        json={
            "action_type": "handled",
            "action_note": "已人工处理",
            "operator_name": "本地运营",
            "expected_product_scope_id": "all",
            "expected_object_type": "search_term",
            "expected_object_id": "kids sunglasses",
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
            "evidence_snapshot": evidence_snapshot,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["signal_id"] == "sig-test-manual-action"
    assert payload["action_type"] == "handled"
    assert payload["manual_status"] == "adopted"
    assert payload["snapshot_id"] == "snapshot-1"
    assert payload["shop_id"] == "shop-rivbos"
    assert payload["market_id"] == 1
    assert payload["object_type"] == "search_term"
    assert payload["object_id"] == "search_term:1:kids sunglasses"
    assert payload["object_label"] == "kids sunglasses"

    signals_response = TestClient(app).get("/api/signals?market_id=1")
    signals = signals_response.json()

    assert signals[0]["status"] == "adopted"
    assert signals[0]["manual_status"] == "adopted"

    actions_response = TestClient(app).get("/api/signals/sig-test-manual-action/manual-actions")
    actions = actions_response.json()

    assert len(actions) == 1
    assert actions[0]["action_note"] == "已人工处理"

    review_response = TestClient(app).get("/api/signals/sig-test-manual-action/review-todos")
    review_todos = review_response.json()

    assert review_response.status_code == 200
    assert [todo["review_window"] for todo in review_todos] == ["7d", "14d"]
    assert review_todos[0]["signal_id"] == "sig-test-manual-action"
    assert review_todos[0]["action_type"] == "handled"
    assert review_todos[0]["object_type"] == "search_term"
    assert review_todos[0]["object_id"] == "search_term:1:kids sunglasses"


def test_manual_action_route_review_todos_inherit_full_search_term_snapshot(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "detect_signals", lambda signal_rows, aba_rows=None, promotion_strategies=None: [make_signal()])
    monkeypatch.setattr(routes, "detect_data_quality_signals", lambda *args, **kwargs: [])
    evidence_snapshot = search_term_full_review_chain_snapshot()
    monkeypatch.setattr(
        routes,
        "build_manual_action_preflight_payload",
        lambda **kwargs: route_preflight_payload(
            object_type="search_term",
            object_id="kids sunglasses",
            action_type="add_to_review",
            evidence_snapshot=evidence_snapshot,
        ),
    )

    response = TestClient(app).post(
        "/api/signals/sig-test-manual-action/manual-actions?market_id=1",
        json={
            "action_type": "add_to_review",
            "action_note": "加入 7/14 天复盘",
            "operator_name": "本地运营",
            "expected_product_scope_id": "parent_asin:B00K4W4AAA",
            "expected_object_type": "search_term",
            "expected_object_id": "kids sunglasses",
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
            "evidence_snapshot": evidence_snapshot,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["action_type"] == "add_to_review"
    assert payload["evidence_snapshot"] == evidence_snapshot

    review_response = TestClient(app).get("/api/signals/sig-test-manual-action/review-todos?market_id=1")
    review_todos = review_response.json()

    assert review_response.status_code == 200
    assert [todo["review_window"] for todo in review_todos] == ["7d", "14d"]
    for todo in review_todos:
        assert todo["action_id"] == payload["id"]
        assert todo["object_type"] == "search_term"
        assert todo["object_id"] == "search_term:1:kids sunglasses"
        assert todo["evidence_snapshot"] == evidence_snapshot
        labels = [item["label"] for item in todo["evidence_snapshot"]]
        assert "搜索词表现分组" in labels
        assert "广告组合流判断" in labels
        assert "同组投放商品表现" in labels
        assert "逐投放上下文" in labels
        assert "投放词证据" in labels
        assert "广告位边界" in labels
        assert "ABA 背景" in labels
        assert "动作边界" in labels


def test_manual_action_route_rejects_missing_forbidden_effect_expectation(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "detect_signals", lambda signal_rows, aba_rows=None, promotion_strategies=None: [make_signal()])
    monkeypatch.setattr(routes, "detect_data_quality_signals", lambda *args, **kwargs: [])

    response = TestClient(app).post(
        "/api/signals/sig-test-manual-action/manual-actions?market_id=1",
        json={
            "action_type": "handled",
            "action_note": "已人工处理",
            "operator_name": "本地运营",
            "expected_object_type": "search_term",
            "expected_object_id": "kids sunglasses",
            "evidence_snapshot": minimal_evidence_snapshot("搜索词浪费证据"),
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "manual_action_preflight_required"
    assert load_manual_actions("sig-test-manual-action", action_root=tmp_path) == []


def test_manual_action_route_rejects_preflight_object_mismatch(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "detect_signals", lambda signal_rows, aba_rows=None, promotion_strategies=None: [make_signal()])
    monkeypatch.setattr(routes, "detect_data_quality_signals", lambda *args, **kwargs: [])

    response = TestClient(app).post(
        "/api/signals/sig-test-manual-action/manual-actions?market_id=1",
        json={
            "action_type": "handled",
            "action_note": "已人工处理",
            "operator_name": "本地运营",
            "expected_object_type": "search_term",
            "expected_object_id": "wrong search term",
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
            "evidence_snapshot": minimal_evidence_snapshot("搜索词浪费证据"),
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "manual_action_preflight_mismatch"
    assert load_manual_actions("sig-test-manual-action", action_root=tmp_path) == []

    forbidden_response = TestClient(app).post(
        "/api/signals/sig-test-manual-action/manual-actions?market_id=1",
        json={
            "action_type": "handled",
            "expected_object_type": "search_term",
            "expected_object_id": "kids sunglasses",
            "expected_can_auto_change_rules": True,
            "expected_can_auto_execute_ads": False,
            "evidence_snapshot": minimal_evidence_snapshot("搜索词浪费证据"),
        },
    )

    assert forbidden_response.status_code == 409
    assert forbidden_response.json()["detail"] == "manual_action_forbidden_effect"
    assert load_manual_actions("sig-test-manual-action", action_root=tmp_path) == []


def test_manual_action_route_uses_asin_for_advertised_product_review_identity(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "detect_signals", lambda signal_rows, aba_rows=None, promotion_strategies=None: [make_advertised_product_signal()])
    monkeypatch.setattr(routes, "detect_data_quality_signals", lambda *args, **kwargs: [])
    evidence_snapshot = minimal_evidence_snapshot("广告商品覆盖")
    monkeypatch.setattr(
        routes,
        "build_manual_action_preflight_payload",
        lambda **kwargs: route_preflight_payload(
            object_type="advertised_product",
            object_id="B016EXMW02",
            action_type="add_to_review",
            evidence_snapshot=evidence_snapshot,
        ),
    )

    response = TestClient(app).post(
        "/api/signals/sig-ad-product-manual-action/manual-actions?market_id=1",
        json={
            "action_type": "add_to_review",
            "action_note": "review B016EXMW02",
            "operator_name": "local operator",
            "expected_product_scope_id": "parent_asin:B00K4W4AAA",
            "expected_object_type": "advertised_product",
            "expected_object_id": "B016EXMW02",
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
            "evidence_snapshot": evidence_snapshot,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["object_type"] == "advertised_product"
    assert payload["object_id"] == "B016EXMW02"
    assert payload["object_label"] == "B016EXMW02"

    review_response = TestClient(app).get("/api/signals/sig-ad-product-manual-action/review-todos?market_id=1")
    review_todos = review_response.json()

    assert review_response.status_code == 200
    assert [todo["review_window"] for todo in review_todos] == ["7d", "14d"]
    assert review_todos[0]["object_type"] == "advertised_product"
    assert review_todos[0]["object_id"] == "B016EXMW02"
    assert review_todos[0]["object_label"] == "B016EXMW02"


def test_manual_action_route_uses_asin_for_sales_product_review_identity(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "detect_signals", lambda signal_rows, aba_rows=None, promotion_strategies=None: [make_sales_product_signal()])
    monkeypatch.setattr(routes, "detect_data_quality_signals", lambda *args, **kwargs: [])
    evidence_snapshot = minimal_evidence_snapshot("销售承接证据")
    monkeypatch.setattr(
        routes,
        "build_manual_action_preflight_payload",
        lambda **kwargs: route_preflight_payload(
            object_type="sales_product",
            object_id="B06VW5SQ97",
            action_type="add_to_review",
            evidence_snapshot=evidence_snapshot,
        ),
    )

    response = TestClient(app).post(
        "/api/signals/sig-sales-product-manual-action/manual-actions?market_id=1",
        json={
            "action_type": "add_to_review",
            "action_note": "review B06VW5SQ97",
            "operator_name": "local operator",
            "expected_product_scope_id": "parent_asin:B00K4W4AAA",
            "expected_object_type": "sales_product",
            "expected_object_id": "B06VW5SQ97",
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
            "evidence_snapshot": evidence_snapshot,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["object_type"] == "sales_product"
    assert payload["object_id"] == "B06VW5SQ97"
    assert payload["object_label"] == "RBK004-RBK004-2 深蓝"

    review_response = TestClient(app).get("/api/signals/sig-sales-product-manual-action/review-todos?market_id=1")
    review_todos = review_response.json()

    assert review_response.status_code == 200
    assert [todo["review_window"] for todo in review_todos] == ["7d", "14d"]
    assert review_todos[0]["object_type"] == "sales_product"
    assert review_todos[0]["object_id"] == "B06VW5SQ97"
    assert review_todos[0]["object_label"] == "RBK004-RBK004-2 深蓝"


def test_review_effect_route_returns_not_ready_without_after_snapshot(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")
    monkeypatch.setattr(
        routes,
        "load_signal_rows_from_success_snapshots",
        lambda: [
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            }
        ],
        raising=False,
    )

    response = TestClient(app).get("/api/signals/sig-test-manual-action/review-effect?review_window=7d")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "not_ready"
    assert payload["result"] == "unclear"
    assert payload["message"] == "处理前后指标暂不可计算：缺少处理后 7 天快照"


def test_review_record_route_saves_ready_effect_and_signal_reads_latest_result(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(routes, "detect_signals", lambda signal_rows, aba_rows=None, promotion_strategies=None: [make_signal()])
    monkeypatch.setattr(routes, "detect_data_quality_signals", lambda *args, **kwargs: [])
    monkeypatch.setattr(routes, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(
        routes,
        "load_signal_rows_from_success_snapshots",
        lambda: [
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
    )
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": diagnosis_evidence_snapshot(),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    response = TestClient(app).post(
        "/api/signals/sig-test-manual-action/review-records?review_window=7d",
        json={
            "review_note": "确认处理有效，保留为成功复盘",
            "reviewer_name": "本地运营",
            "expected_action_id": "manual-action-fixed",
            "expected_object_type": "search_term",
            "expected_object_id": "kids sunglasses",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": diagnosis_evidence_snapshot(),
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )
    list_response = TestClient(app).get("/api/signals/sig-test-manual-action/review-records")
    signal_response = TestClient(app).get("/api/signals/sig-test-manual-action?market_id=1")

    assert response.status_code == 200
    payload = response.json()
    assert payload["result"] == "improved"
    assert payload["review_note"] == "确认处理有效，保留为成功复盘"
    assert payload["evidence_snapshot"][0]["label"] == "排查路径"
    assert payload["evidence_snapshot"][1]["label"] == "AI 准入"
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["evidence_snapshot"][1]["source"] == "actionability_status"
    assert signal_response.json()["review_result"] == "improved"


def test_review_record_route_rejects_mismatched_preflight_expectation(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(
        routes,
        "load_signal_rows_from_success_snapshots",
        lambda: [
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
    )
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": diagnosis_evidence_snapshot(),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    response = TestClient(app).post(
        "/api/signals/sig-test-manual-action/review-records?review_window=7d&market_id=1",
        json={
            "review_note": "对象不一致时不能保存",
            "reviewer_name": "本地运营",
            "expected_action_id": "manual-action-fixed",
            "expected_object_type": "search_term",
            "expected_object_id": "wrong search term",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": diagnosis_evidence_snapshot(),
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "review_record_evidence_snapshot_object_mismatch"
    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_route_rejects_missing_ai_admission(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(
        routes,
        "load_signal_rows_from_success_snapshots",
        lambda: [
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
    )
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": diagnosis_without_ai_admission_snapshot(),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    response = TestClient(app).post(
        "/api/signals/sig-test-manual-action/review-records?review_window=7d&market_id=1",
        json={
            "review_note": "缺少 AI 准入理由时不能保存",
            "reviewer_name": "本地运营",
            "expected_action_id": "manual-action-fixed",
            "expected_object_type": "search_term",
            "expected_object_id": "kids sunglasses",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": diagnosis_without_ai_admission_snapshot(),
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "review_record_missing_ai_admission"
    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_route_rejects_mismatched_evidence_snapshot(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(
        routes,
        "load_signal_rows_from_success_snapshots",
        lambda: [
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
    )
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": diagnosis_evidence_snapshot(),
    }
    stale_snapshot = diagnosis_evidence_snapshot()
    coverage_index = next(index for index, item in enumerate(stale_snapshot) if item["label"] == "广告商品覆盖")
    stale_snapshot[coverage_index] = {
        "label": "广告商品覆盖",
        "value": "前端缓存里的旧证据",
        "detail": "这不是当前 ReviewTodo 的证据快照。",
        "source": "stale_frontend",
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    response = TestClient(app).post(
        "/api/signals/sig-test-manual-action/review-records?review_window=7d&market_id=1",
        json={
            "review_note": "证据快照不一致时不能保存",
            "reviewer_name": "本地运营",
            "expected_action_id": "manual-action-fixed",
            "expected_object_type": "search_term",
            "expected_object_id": "kids sunglasses",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": stale_snapshot,
            "expected_can_auto_change_rules": False,
            "expected_can_auto_execute_ads": False,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "review_record_evidence_snapshot_mismatch"
    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_route_rejects_missing_forbidden_effect_expectation(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(
        routes,
        "load_signal_rows_from_success_snapshots",
        lambda: [
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-01",
                "end_date": "2026-06-07",
                "cost": 80,
                "orders": 1,
                "sales": 50,
            },
            {
                "market_id": 1,
                "search_term": "kids sunglasses",
                "start_date": "2026-06-09",
                "end_date": "2026-06-15",
                "cost": 60,
                "orders": 5,
                "sales": 200,
            },
        ],
    )
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
        "evidence_snapshot": diagnosis_evidence_snapshot(),
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    response = TestClient(app).post(
        "/api/signals/sig-test-manual-action/review-records?review_window=7d&market_id=1",
        json={
            "review_note": "缺少禁止自动动作声明",
            "reviewer_name": "本地运营",
            "expected_action_id": "manual-action-fixed",
            "expected_object_type": "search_term",
            "expected_object_id": "kids sunglasses",
            "expected_review_window": "7d",
            "expected_evidence_snapshot": diagnosis_evidence_snapshot(),
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "review_record_preflight_required"
    assert not (tmp_path / "review_records.jsonl").exists()


def test_review_record_route_rejects_not_ready_effect(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(routes, "MANUAL_ACTION_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "REVIEW_RECORD_ROOT", tmp_path, raising=False)
    monkeypatch.setattr(routes, "load_signal_rows_from_success_snapshots", lambda: [])
    action_payload = {
        "id": "manual-action-fixed",
        "signal_id": "sig-test-manual-action",
        "action_type": "handled",
        "action_note": "已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "snapshot-before",
        "shop_id": "shop-rivbos",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "kids sunglasses",
        "object_label": "kids sunglasses",
    }
    (tmp_path / "manual_actions.jsonl").write_text(json.dumps(action_payload, ensure_ascii=False) + "\n", encoding="utf-8")

    response = TestClient(app).post(
        "/api/signals/sig-test-manual-action/review-records?review_window=7d",
        json={"review_note": "不能保存", "reviewer_name": "本地运营"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "review_effect_not_ready"
