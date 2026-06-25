from types import SimpleNamespace

from app.models.signals import MetricSnapshot
from app.services import signal_detection, signal_triage


def make_candidate() -> dict[str, object]:
    return {
        "signal_id": "sig-ad-product",
        "signal_type": "opportunity",
        "signal_category": "advertised_product_opportunity",
        "priority": "P1",
        "confidence": "medium",
        "severity": 3,
        "shop_id": "market:1",
        "shop_name": "rivbos",
        "market_id": 1,
        "marketplace": "US",
        "object_type": "advertised_product",
        "object_id": "snapshot-row-id",
        "object_label": "B016EXMW02",
        "asin": "B016EXMW02",
        "summary": "广告 ASIN B016EXMW02 转化稳定，适合进入商品机会观察",
        "evidence_count": 3,
        "freshness_status": "api_snapshot",
        "suggested_action": {
            "action_type": "review_candidate",
            "title": "人工复核",
            "description": "人工确认后记录处理结果",
            "requires_manual_confirmation": True,
        },
        "data_sources": [{"source_type": "积加API", "source_table": "snapshot"}],
    }


def test_review_todo_evidence_snapshot_audit_detects_object_reference_mismatch() -> None:
    todo = SimpleNamespace(
        object_id="search_term:1:beach essentials",
        object_label="beach essentials",
        evidence_snapshot=[
            SimpleNamespace(label="排查路径", value="搜索词 -> 广告组 -> 人工复核"),
            SimpleNamespace(label="AI 准入", value="可进入人工确认"),
            SimpleNamespace(label="搜索词边界", value="搜索词只说明同广告组上下文"),
            SimpleNamespace(label="广告位边界", value="只有活动级广告位背景"),
            SimpleNamespace(label="人工确认判断依据", value="boys sunglasses 产生 3 单，可进入人工扩量复核"),
        ],
    )

    audit = signal_triage._review_todo_evidence_snapshot_audit(todo)

    assert audit["evidence_snapshot_count"] == 5
    assert audit["has_diagnosis_path"] is True
    assert audit["has_ai_admission"] is True
    assert audit["has_search_term_boundary"] is True
    assert audit["has_placement_boundary"] is True
    assert audit["has_object_reference"] is False


def test_review_wait_summary_ignores_cross_todos_for_metric_window() -> None:
    effects = [
        {
            "signal_id": "sig-data-quality-aba-stale",
            "review_window": "7d",
            "status": "not_ready",
            "is_due": False,
            "due_at": "2026-06-21T04:09:35+00:00",
            "object_type": "cross",
            "object_id": "aba_search_term_snapshot",
            "object_label": "ABA 搜索词数据",
            "message": "复盘效果暂不可计算：数据质量或交叉信号不适用广告指标前后对比，请复查数据是否补齐或更新",
        },
        {
            "signal_id": "sig-ad-product",
            "review_window": "7d",
            "status": "not_ready",
            "is_due": False,
            "due_at": "2026-06-22T00:00:00+00:00",
            "object_type": "advertised_product",
            "object_id": "B016EXMW02",
            "object_label": "B016EXMW02",
            "message": "复盘效果暂不可计算：7 天复盘窗口尚未到期，预计 2026-06-22 后复盘",
        },
    ]

    wait_summary = signal_triage._review_wait_summary(effects, ready_count=0)

    assert wait_summary["status"] == "waiting_review_window"
    assert wait_summary["earliest_due_date"] == "2026-06-22"
    assert wait_summary["next_review_window"] == "7d"
    assert wait_summary["next_object_type"] == "advertised_product"
    assert wait_summary["next_object_id"] == "B016EXMW02"
    assert "ABA 搜索词数据" not in wait_summary["message"]


def test_review_wait_summary_explains_data_gap_after_due() -> None:
    effects = [
        {
            "signal_id": "sig-ad-product",
            "review_window": "7d",
            "status": "not_ready",
            "is_due": True,
            "due_at": "2026-06-22T00:00:00+00:00",
            "object_type": "advertised_product",
            "object_id": "B016EXMW02",
            "object_label": "B016EXMW02",
            "message": "复盘效果暂不可计算：缺少处理后 7 天快照",
        }
    ]

    wait_summary = signal_triage._review_wait_summary(effects, ready_count=0)

    assert wait_summary["status"] == "blocked_by_data_gap"
    assert wait_summary["gap_reasons"] == ["复盘效果暂不可计算：缺少处理后 7 天快照"]
    assert "当前没有 ready 复盘效果" in wait_summary["message"]
    assert "先查询积加 API 限流规则" in wait_summary["next_step"]
    assert "不拉取快照" not in wait_summary["forbidden_actions"]
    assert "不保存复盘结论" in wait_summary["forbidden_actions"]


def test_review_identity_audit_separates_metric_due_date_from_cross_due_date() -> None:
    audit = signal_triage._review_identity_audit_summary(
        [],
        [],
        [
            {
                "signal_id": "sig-data-quality",
                "action_id": "manual-action-data-quality",
                "object_type": "cross",
                "object_id": "aba_search_term_snapshot",
                "object_label": "ABA 搜索词数据",
                "review_window": "7d",
                "status": "not_ready",
                "is_due": False,
                "due_at": "2026-06-21T00:00:00+00:00",
            },
            {
                "signal_id": "sig-ad-product",
                "action_id": "manual-action-ad-product",
                "object_type": "advertised_product",
                "object_id": "B016EXMVZS",
                "object_label": "B016EXMVZS",
                "review_window": "7d",
                "status": "not_ready",
                "is_due": False,
                "due_at": "2026-06-22T00:00:00+00:00",
            },
        ],
        ready_count=0,
        identity_issues=[],
    )

    assert audit["earliest_due_date"] == "2026-06-21"
    assert audit["earliest_any_due_date"] == "2026-06-21"
    assert audit["earliest_metric_due_date"] == "2026-06-22"
    assert "earliest_any_due_date 包含数据质量和交叉待办" in audit["date_boundary"]
    assert "earliest_metric_due_date 为准" in audit["date_boundary"]


def test_signal_triage_exposes_review_identity_audit_from_readiness(monkeypatch) -> None:
    identity_audit = {
        "status": "ready_for_readback",
        "earliest_any_due_date": "2026-06-21",
        "earliest_metric_due_date": "2026-06-22",
        "date_boundary": "保存广告复盘记录时以 earliest_metric_due_date 为准。",
    }

    monkeypatch.setattr(
        signal_triage,
        "build_review_candidates_payload",
        lambda **kwargs: {
            "status": "empty",
            "selected_market_id": kwargs.get("selected_market_id"),
            "selected_product_scope_id": None,
            "signal_row_count": 0,
            "signal_count": 0,
            "candidate_count": 0,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {},
            "candidates": [],
            "candidate_layers": [],
            "recommended_candidate": None,
            "recommended_evidence_drilldown": None,
            "product_scope_drilldown": None,
            "recommendation_reason": "等待经营对象。",
            "manual_action_preview": None,
        },
    )
    monkeypatch.setattr(
        signal_triage,
        "build_review_readiness_payload",
        lambda **kwargs: {
            "status": "not_ready",
            "manual_action_count": 1,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 2,
            "manual_action_identity_issue_count": 0,
            "review_feedback": {},
            "rule_improvement": {},
            "review_wait_summary": {"earliest_due_date": "2026-06-22"},
            "review_identity_audit": identity_audit,
            "next_action": "等待广告指标复盘窗口。",
        },
    )

    payload = signal_triage.build_signal_triage_payload(selected_market_id=1)

    assert payload["review_status"]["review_identity_audit"] == identity_audit
    assert payload["review_status"]["review_identity_audit"]["earliest_metric_due_date"] == "2026-06-22"


def test_signal_triage_top_level_diagnosis_contract_tracks_recommended_candidate(monkeypatch) -> None:
    recommended_candidate = make_candidate()
    recommended_candidate.update(
        {
            "signal_id": "sig-recommended-beach-essentials",
            "object_type": "search_term",
            "object_id": "search_term:1:beach essentials",
            "object_label": "beach essentials",
            "signal_category": "search_term_opportunity",
            "priority": "P1",
            "severity": 5,
        }
    )
    next_candidate = make_candidate()
    next_candidate.update(
        {
            "signal_id": "sig-next-b01fay0yl0",
            "object_type": "search_term",
            "object_id": "search_term:1:b01fay0yl0",
            "object_label": "b01fay0yl0",
            "signal_category": "search_term_opportunity",
            "priority": "P0",
            "severity": 5,
        }
    )

    monkeypatch.setattr(
        signal_triage,
        "build_review_candidates_payload",
        lambda **kwargs: {
            "status": "ready",
            "selected_market_id": kwargs.get("selected_market_id"),
            "selected_product_scope_id": "parent_asin:B00K4W4AAA",
            "signal_row_count": 2,
            "signal_count": 2,
            "candidate_count": 2,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {},
            "candidates": [recommended_candidate, next_candidate],
            "candidate_layers": [],
            "recommended_candidate": recommended_candidate,
            "recommended_evidence_drilldown": {},
            "product_scope_drilldown": {"status": "ready", "summary": "Parent ASIN 广告证据已读取。"},
            "recommendation_reason": "优先复核 beach essentials。",
            "manual_action_preview": None,
        },
    )
    monkeypatch.setattr(
        signal_triage,
        "build_review_readiness_payload",
        lambda **kwargs: {
            "status": "not_ready",
            "manual_action_count": 0,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 0,
            "manual_action_identity_issue_count": 0,
            "review_feedback": {},
            "rule_improvement": {},
            "review_wait_summary": {},
            "review_identity_audit": {},
            "next_action": "等待人工确认。",
        },
    )
    monkeypatch.setattr(signal_triage, "_next_unhandled_candidate", lambda candidates, status, market_id: next_candidate)

    def fake_diagnosis_contract(**kwargs):
        candidate = kwargs.get("recommended_candidate") or {}
        return {
            "signal_id": candidate.get("signal_id"),
            "object_label": candidate.get("object_label"),
            "sections": [],
        }

    monkeypatch.setattr(signal_triage, "_diagnosis_contract", fake_diagnosis_contract)

    payload = signal_triage.build_signal_triage_payload(selected_market_id=1, product_scope_id="parent_asin:B00K4W4AAA")

    assert payload["recommended_candidate"]["signal_id"] == "sig-recommended-beach-essentials"
    assert payload["recommended_diagnosis_contract"]["signal_id"] == "sig-recommended-beach-essentials"
    assert payload["next_unhandled_diagnosis_contract"]["signal_id"] == "sig-next-b01fay0yl0"
    assert payload["diagnosis_contract"]["signal_id"] == "sig-recommended-beach-essentials"


def make_signal(
    signal_id: str,
    asin: str,
    *,
    object_type: str = "advertised_product",
    signal_category: str = "advertised_product_efficiency",
    action_type: str | None = None,
    priority: str = "P1",
    severity: int = 3,
    label: str | None = None,
    source_rows: list[dict[str, object]] | None = None,
) -> SimpleNamespace:
    default_source_rows = [
        {
            "source_table": "sales_product_daily_metrics" if object_type == "sales_product" else "advertised_products",
            "asin": asin,
        }
    ]
    return SimpleNamespace(
        id=signal_id,
        signal_type="opportunity",
        signal_category=signal_category,
        priority=priority,
        confidence="medium",
        severity=severity,
        shop_id="market:1",
        shop_name="rivbos",
        market_id=1,
        marketplace="US",
        object_type=object_type,
        summary=f"{asin} summary",
        evidence_count=3,
        freshness_status="api_snapshot",
        suggested_action=SimpleNamespace(
            action_type=action_type
            or {
                "product_ad_coverage": "review_sales_product_ad_coverage",
                "search_term_opportunity": "promote_search_term",
                "search_term_performance_split": "review_search_term_split",
                "ad_group_structure": "review_multi_product_ad_group",
            }.get(signal_category, "review_advertised_product_efficiency"),
            title="manual review",
            description="manual review",
            requires_manual_confirmation=True,
        ),
        data_sources=[SimpleNamespace(source_type="积加API", source_name="积加API快照", source_table="snapshot")],
        evidence=SimpleNamespace(
            primary_object=SimpleNamespace(
                object_type=object_type,
                object_id=f"{signal_id}-row",
                label=label or asin,
                asin=asin,
            ),
            source_rows=source_rows or default_source_rows,
        ),
    )


def test_review_candidates_respect_parent_asin_product_scope(monkeypatch) -> None:
    in_scope = make_signal("sig-in-scope", "B016EXMW02")
    out_of_scope = make_signal("sig-out-of-scope", "B0D89X1LXC")

    monkeypatch.setattr(signal_triage, "load_signal_rows_from_latest_snapshot", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(signal_triage, "_current_signals", lambda signal_rows, selected_market_id=None: [out_of_scope, in_scope])
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(model_dump=lambda mode="json": {"has_snapshot": True, "snapshot_id": "snapshot-30d", "status": "success"}),
    )
    monkeypatch.setattr(
        signal_triage,
        "build_product_scope_summary",
        lambda: SimpleNamespace(
            options=[
                SimpleNamespace(
                    scope_id="parent_asin:B00K4W4AAA",
                    scope_type="parent_asin",
                    parent_asin="B00K4W4AAA",
                    child_asins=["B016EXMVZS", "B016EXMW02"],
                ),
                SimpleNamespace(
                    scope_id="parent_asin:B0D8B7K8ZP",
                    scope_type="parent_asin",
                    parent_asin="B0D8B7K8ZP",
                    child_asins=["B0D89X1LXC"],
                ),
            ],
        ),
    )

    payload = signal_triage.build_review_candidates_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
    )

    assert payload["selected_product_scope_id"] == "parent_asin:B00K4W4AAA"
    assert payload["signal_count"] == 1
    assert payload["candidate_count"] == 1
    assert payload["candidates"][0]["shop_id"] == "market:1"
    assert payload["recommended_candidate"]["shop_id"] == "market:1"
    assert payload["manual_action_preview"]["shop_id"] == "market:1"
    assert payload["candidates"][0]["object_label"] == "B016EXMW02"
    assert payload["recommended_candidate"]["object_label"] == "B016EXMW02"
    assert payload["manual_action_preview"]["object_label"] == "B016EXMW02"


def test_parent_scope_includes_search_term_candidates_by_ad_group_context(monkeypatch) -> None:
    search_term_row = {
        "source_table": "ad_search_term_daily_metrics",
        "campaign_id": "camp-1",
        "campaign_name": "RBK004-beach essentials",
        "ad_group_id": "group-1",
        "ad_group_name": "RBK004-扩展-beach essentials",
        "normalized_query": "beach essentials",
        "search_term": "beach essentials",
        "spend": 16.03,
        "clicks": 19,
        "orders": 8,
        "sales": 76.32,
    }
    in_scope_ad_row = {
        "source_table": "advertised_products",
        "asin": "B016EXMVZS",
        "campaign_id": "camp-1",
        "campaign_name": "RBK004-beach essentials",
        "ad_group_id": "group-1",
        "ad_group_name": "RBK004-扩展-beach essentials",
        "spend": 79.9,
        "clicks": 89,
        "orders": 27,
        "sales": 258.5,
    }
    out_of_scope_ad_row = {
        "source_table": "advertised_products",
        "asin": "B0D89X1LXC",
        "campaign_id": "camp-2",
        "campaign_name": "Other campaign",
        "ad_group_id": "group-2",
        "ad_group_name": "Other ad group",
        "spend": 50.0,
        "clicks": 20,
        "orders": 2,
        "sales": 70.0,
    }
    search_term_signal = make_signal(
        "sig-search-term-context",
        "",
        object_type="search_term",
        signal_category="search_term_opportunity",
        action_type="promote_search_term",
        label="beach essentials",
        source_rows=[search_term_row],
    )
    search_term_signal.evidence.primary_object.asin = ""
    search_term_signal.evidence.primary_object.object_id = "search_term:1:beach essentials"

    monkeypatch.setattr(
        signal_triage,
        "load_signal_rows_from_latest_snapshot",
        lambda: [in_scope_ad_row, out_of_scope_ad_row, search_term_row],
    )
    monkeypatch.setattr(signal_triage, "_current_signals", lambda signal_rows, selected_market_id=None: [search_term_signal])
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(model_dump=lambda mode="json": {"has_snapshot": True, "snapshot_id": "snapshot-30d", "status": "success"}),
    )
    monkeypatch.setattr(
        signal_triage,
        "build_product_scope_summary",
        lambda: SimpleNamespace(
            options=[
                SimpleNamespace(
                    scope_id="parent_asin:B00K4W4AAA",
                    scope_type="parent_asin",
                    parent_asin="B00K4W4AAA",
                    child_asins=["B016EXMVZS"],
                ),
                SimpleNamespace(
                    scope_id="parent_asin:B0D8B7K8ZP",
                    scope_type="parent_asin",
                    parent_asin="B0D8B7K8ZP",
                    child_asins=["B0D89X1LXC"],
                ),
            ],
        ),
    )

    payload = signal_triage.build_review_candidates_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
    )

    assert payload["selected_product_scope_id"] == "parent_asin:B00K4W4AAA"
    assert payload["signal_count"] == 1
    assert payload["candidate_count"] == 1
    assert payload["candidate_layers"][1]["layer_id"] == "search_term_context"
    assert payload["candidate_layers"][1]["label"] == "搜索词候选"
    assert payload["candidate_layers"][1]["count"] == 1
    assert payload["candidates"][0]["object_type"] == "search_term"
    assert payload["candidates"][0]["object_label"] == "beach essentials"
    assert payload["recommended_candidate"]["object_label"] == "beach essentials"
    assert "广告组上下文" in payload["recommendation_reason"]
    assert "不能自动归因到单个 ASIN" in payload["recommendation_reason"]
    assert "搜索词候选 1 个" in payload["recommendation_reason"]
    assert "广告 ASIN 待处理 1 个" not in payload["recommendation_reason"]


def test_search_intent_summaries_respect_parent_asin_product_scope(monkeypatch) -> None:
    in_scope_search_row = {
        "source_table": "ad_search_term_daily_metrics",
        "market_id": 1,
        "campaign_id": "camp-1",
        "campaign_name": "RBK004-beach essentials",
        "ad_group_id": "group-1",
        "ad_group_name": "RBK004-扩展-beach essentials",
        "normalized_query": "beach essentials",
        "search_term": "beach essentials",
        "cost": 16.03,
        "spend": 16.03,
        "clicks": 19,
        "orders": 8,
        "sales": 76.32,
    }
    in_scope_search_row_without_signal = {
        "source_table": "ad_search_term_daily_metrics",
        "market_id": 1,
        "campaign_id": "camp-1",
        "campaign_name": "RBK004-beach essentials",
        "ad_group_id": "group-1",
        "ad_group_name": "RBK004-扩展-beach essentials",
        "normalized_query": "beach essentials tent",
        "search_term": "beach essentials tent",
        "cost": 4.0,
        "spend": 4.0,
        "clicks": 5,
        "orders": 1,
        "sales": 18.0,
    }
    out_of_scope_search_row = {
        "source_table": "ad_search_term_daily_metrics",
        "market_id": 1,
        "campaign_id": "camp-2",
        "campaign_name": "Other campaign",
        "ad_group_id": "group-2",
        "ad_group_name": "Other ad group",
        "normalized_query": "kids sunglasses",
        "search_term": "kids sunglasses",
        "cost": 99.0,
        "spend": 99.0,
        "clicks": 40,
        "orders": 20,
        "sales": 300.0,
    }
    in_scope_ad_row = {
        "source_table": "advertised_products",
        "market_id": 1,
        "asin": "B016EXMVZS",
        "campaign_id": "camp-1",
        "ad_group_id": "group-1",
    }
    out_of_scope_ad_row = {
        "source_table": "advertised_products",
        "market_id": 1,
        "asin": "B0D89X1LXC",
        "campaign_id": "camp-2",
        "ad_group_id": "group-2",
    }
    in_scope_signal = make_signal(
        "sig-in-scope-search-term",
        "",
        object_type="search_term",
        signal_category="search_term_opportunity",
        action_type="promote_search_term",
        label="beach essentials",
        source_rows=[in_scope_search_row],
    )
    out_of_scope_signal = make_signal(
        "sig-out-of-scope-search-term",
        "",
        object_type="search_term",
        signal_category="search_term_opportunity",
        action_type="promote_search_term",
        label="kids sunglasses",
        source_rows=[out_of_scope_search_row],
    )
    in_scope_signal.evidence.primary_object.asin = ""
    in_scope_signal.evidence.primary_object.object_id = "search_term:1:beach essentials"
    out_of_scope_signal.evidence.primary_object.asin = ""
    out_of_scope_signal.evidence.primary_object.object_id = "search_term:1:kids sunglasses"

    monkeypatch.setattr(
        signal_triage,
        "load_signal_rows_from_latest_snapshot",
        lambda: [
            in_scope_ad_row,
            out_of_scope_ad_row,
            in_scope_search_row,
            in_scope_search_row_without_signal,
            out_of_scope_search_row,
        ],
    )
    monkeypatch.setattr(signal_triage, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(
        signal_triage,
        "_current_signals",
        lambda signal_rows, selected_market_id=None: [in_scope_signal, out_of_scope_signal],
    )
    monkeypatch.setattr(
        signal_triage,
        "build_product_scope_summary",
        lambda: SimpleNamespace(
            options=[
                SimpleNamespace(
                    scope_id="parent_asin:B00K4W4AAA",
                    scope_type="parent_asin",
                    parent_asin="B00K4W4AAA",
                    child_asins=["B016EXMVZS"],
                ),
                SimpleNamespace(
                    scope_id="parent_asin:B0D8B7K8ZP",
                    scope_type="parent_asin",
                    parent_asin="B0D8B7K8ZP",
                    child_asins=["B0D89X1LXC"],
                ),
            ],
        ),
    )

    summaries = signal_triage.build_search_intent_summaries(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
    )

    assert len(summaries) == 1
    assert summaries[0].top_search_terms[0].search_term == "beach essentials"
    assert "beach essentials" in summaries[0].search_terms
    assert "beach essentials tent" in summaries[0].search_terms
    assert "kids sunglasses" not in summaries[0].search_terms
    assert summaries[0].metrics.cost == 20.03
    assert summaries[0].data_grain == "当前 Parent ASIN 关联广告上下文中的 ad_search_term_daily_metrics 用户搜索词表现行，按标准化用户搜索词及规则归类聚合；不包含未投放子 ASIN、自然搜索词或 ABA 站点数据"
    assert "扩量、止损，还是只观察" in summaries[0].business_question
    assert "可人工确认的扩量机会" in summaries[0].current_judgement
    assert "花费 20.03" in summaries[0].metric_purpose
    assert "覆盖 1 个广告活动、1 个广告组、2 条搜索词表现行" in summaries[0].ad_context
    assert "关联 1 个广告 ASIN：B016EXMVZS" in summaries[0].ad_context
    assert "投放词/投放对象 0 个：投放词待补齐" in summaries[0].ad_context
    assert "缺广告 ASIN 覆盖上下文" not in summaries[0].evidence_gap
    assert "缺投放词或关键词承接字段" in summaries[0].evidence_gap
    assert "广告位影响需要继续打开广告位证据核对" in summaries[0].evidence_gap
    assert "当前 Parent ASIN 关联广告上下文" in summaries[0].proves
    assert "按标准化用户搜索词及规则归类聚合" in summaries[0].proves
    assert "同类广告搜索词" in summaries[0].proves
    assert "不能证明 Parent ASIN 下全部自然搜索或市场搜索表现" in summaries[0].does_not_prove
    assert "不能把搜索词表现分组当作人工动作对象" in summaries[0].does_not_prove
    assert "语义组人工动作" not in summaries[0].does_not_prove
    assert "出单最多的具体 SearchTerm 信号" in summaries[0].next_manual_step


def test_search_intent_current_judgement_uses_ad_search_term_performance_subject() -> None:
    judgement = signal_detection.search_intent_current_judgement(
        MetricSnapshot(clicks=24, cost=18.6, orders=0, sales=0, cvr=0, acos=None, cpc=0.775)
    )

    assert "广告用户搜索词表现和广告商品承接" in judgement
    assert "搜索意图和商品承接" not in judgement


def test_review_candidates_require_actionable_manual_triage_gate(monkeypatch) -> None:
    actionable = make_signal("sig-actionable", "B016EXMW02")
    shallow_opportunity = make_signal(
        "sig-shallow-opportunity",
        "B016EXMW03",
        signal_category="advertised_product_opportunity",
        action_type="review_advertised_product_opportunity",
    )
    unsupported_action = make_signal("sig-unsupported-action", "B016EXMW04", action_type="review_candidate")
    asin_product_targeting_review = make_signal(
        "sig-asin-product-targeting-review",
        "b016exmvzs",
        object_type="search_term",
        signal_category="search_term_opportunity",
        action_type="review_product_targeting_search_term",
        label="b016exmvzs",
    )
    weak_evidence = make_signal("sig-weak-evidence", "B016EXMW05")
    weak_evidence.evidence_count = 2
    missing_source = make_signal("sig-missing-source", "B016EXMW06")
    missing_source.data_sources = []

    monkeypatch.setattr(signal_triage, "load_signal_rows_from_latest_snapshot", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(
        signal_triage,
        "_current_signals",
        lambda signal_rows, selected_market_id=None: [
            actionable,
            asin_product_targeting_review,
            shallow_opportunity,
            unsupported_action,
            weak_evidence,
            missing_source,
        ],
    )
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(model_dump=lambda mode="json": {"has_snapshot": True, "snapshot_id": "snapshot-30d", "status": "success"}),
    )
    monkeypatch.setattr(signal_triage, "build_product_scope_summary", lambda: SimpleNamespace(options=[]))

    payload = signal_triage.build_review_candidates_payload(selected_market_id=1)

    assert payload["candidate_count"] == 2
    assert {candidate["signal_id"] for candidate in payload["candidates"]} == {
        "sig-actionable",
        "sig-asin-product-targeting-review",
    }
    assert payload["excluded_summary"] == {
        "insufficient_evidence": 1,
        "missing_data_source": 1,
        "not_actionable_signal": 1,
        "unsupported_manual_action": 1,
    }


def test_signal_triage_requires_product_scope_before_actionable_recommendation(monkeypatch) -> None:
    candidate = make_candidate()

    monkeypatch.setattr(
        signal_triage,
        "build_review_candidates_payload",
        lambda **kwargs: {
            "status": "has_candidates",
            "selected_market_id": kwargs.get("selected_market_id"),
            "selected_product_scope_id": None,
            "signal_row_count": 88,
            "signal_count": 12,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-30d", "status": "success"},
            "candidates": [candidate],
            "candidate_layers": [
                {"layer_id": "advertised_asin_opportunity", "label": "广告 ASIN 待处理", "count": 1, "top_candidates": [candidate]},
            ],
            "recommended_candidate": candidate,
            "recommended_evidence_drilldown": {"object_label": "B016EXMW02", "business_evidence_blocks": []},
            "recommendation_reason": "推荐 B016EXMW02：这是广告 ASIN 候选。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": "sig-ad-product",
                "action_type": "add_to_review",
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
                "market_id": 1,
                "review_windows": ["7d", "14d"],
            },
            "next_action": "从候选中选择一个广告对象，由人工确认后记录人工处理动作。",
        },
    )
    monkeypatch.setattr(
        signal_triage,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 0,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 0,
            "manual_action_identity_issue_count": 0,
            "review_feedback": {},
            "rule_improvement": {},
            "review_wait_summary": {},
            "next_action": "当前没有 ready 复盘结果。",
        },
    )

    payload = signal_triage.build_signal_triage_payload(selected_market_id=1, top=5)

    assert payload["status"] == "requires_product_scope"
    assert payload["actionability_status"]["status"] == "requires_product_scope"
    assert payload["actionability_status"]["can_write_manual_action"] is False
    assert payload["product_scope_gate"]["is_actionable"] is False
    assert payload["product_scope_gate"]["candidate_pool_count"] == 1
    assert payload["signal_status"]["candidate_count"] == 0
    assert payload["recommended_candidate"] is None
    assert payload["recommended_evidence_drilldown"] is None
    assert payload["manual_action_preview"] is None
    assert payload["next_unhandled_candidate"] is None
    assert payload["top_candidates"] == []
    assert any(blocker["code"] == "product_scope_required" for blocker in payload["blockers"])
    assert "Parent ASIN / ASIN" in payload["next_action"]


def test_signal_triage_treats_sales_asin_as_sales_context_not_actionable_ad_scope(monkeypatch) -> None:
    candidate = make_candidate()
    candidate["object_type"] = "sales_product"
    candidate["object_id"] = "sales-row-1"
    candidate["stable_object_id"] = "B016EXMW1G"
    candidate["object_label"] = "B016EXMW1G"

    monkeypatch.setattr(
        signal_triage,
        "build_review_candidates_payload",
        lambda **kwargs: {
            "status": "has_candidates",
            "selected_market_id": kwargs.get("selected_market_id"),
            "selected_product_scope_id": "sales_asin:B016EXMW1G",
            "signal_row_count": 88,
            "signal_count": 1,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-30d", "status": "success"},
            "candidates": [candidate],
            "candidate_layers": [
                {"layer_id": "sales_strong_ad_weak", "label": "销售强广告弱", "count": 1, "top_candidates": [candidate]},
            ],
            "recommended_candidate": candidate,
            "recommended_evidence_drilldown": {"object_label": "B016EXMW1G", "business_evidence_blocks": []},
            "recommendation_reason": "推荐 B016EXMW1G：这是销售覆盖缺口候选。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": candidate["signal_id"],
                "action_type": "add_to_review",
                "object_type": "sales_product",
                "object_id": "B016EXMW1G",
                "object_label": "B016EXMW1G",
                "market_id": 1,
                "review_windows": ["7d", "14d"],
            },
            "next_action": "从候选中选择一个对象，由人工确认后记录人工处理动作。",
        },
    )
    monkeypatch.setattr(
        signal_triage,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 0,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 0,
            "manual_action_identity_issue_count": 0,
            "review_feedback": {},
            "rule_improvement": {},
            "review_wait_summary": {},
            "next_action": "当前没有 ready 复盘结果。",
        },
    )

    payload = signal_triage.build_signal_triage_payload(
        selected_market_id=1,
        top=5,
        product_scope_id="sales_asin:B016EXMW1G",
    )

    assert payload["status"] == "requires_product_scope"
    assert payload["product_scope_gate"]["is_actionable"] is False
    assert payload["product_scope_gate"]["selected_product_scope_id"] == "sales_asin:B016EXMW1G"
    assert "销售背景" in payload["product_scope_gate"]["message"]
    assert payload["actionability_status"]["can_write_manual_action"] is False
    assert payload["signal_status"]["candidate_count"] == 0
    assert payload["recommended_candidate"] is None
    assert payload["manual_action_preview"] is None


def test_signal_triage_empty_parent_scope_includes_ad_drilldown(monkeypatch) -> None:
    signal_rows = [
        {
            "source_table": "advertised_products",
            "asin": "B016EXMVZS",
            "campaign_id": "camp-1",
            "campaign_name": "RBK004-kids sunglasses",
            "ad_group_id": "group-1",
            "ad_group_name": "RBK004-kids sunglasses-广泛",
            "spend": 100.0,
            "clicks": 50,
            "orders": 20,
            "sales": 400.0,
        },
        {
            "source_table": "advertised_products",
            "asin": "B016EXMW02",
            "campaign_id": "camp-1",
            "campaign_name": "RBK004-kids sunglasses",
            "ad_group_id": "group-1",
            "ad_group_name": "RBK004-kids sunglasses-广泛",
            "spend": 40.0,
            "clicks": 20,
            "orders": 8,
            "sales": 160.0,
        },
        {
            "source_table": "ad_search_term_daily_metrics",
            "campaign_id": "camp-1",
            "campaign_name": "RBK004-kids sunglasses",
            "ad_group_id": "group-1",
            "ad_group_name": "RBK004-kids sunglasses-广泛",
            "normalized_query": "kids sunglasses",
            "search_term": "kids sunglasses",
            "targeting_text": "kids sunglasses",
            "spend": 5.0,
            "clicks": 6,
            "orders": 2,
            "sales": 24.0,
        },
        {
            "source_table": "ad_search_term_daily_metrics",
            "campaign_id": "camp-1",
            "campaign_name": "RBK004-kids sunglasses",
            "ad_group_id": "group-1",
            "ad_group_name": "RBK004-kids sunglasses-广泛",
            "normalized_query": "baby sunglasses",
            "search_term": "baby sunglasses",
            "targeting_text": "kids sunglasses",
            "spend": 4.0,
            "clicks": 5,
            "orders": 0,
            "sales": 0.0,
        },
        {
            "source_table": "ad_placement_daily_metrics",
            "campaign_id": "camp-1",
            "campaign_name": "RBK004-kids sunglasses",
            "ad_group_id": "group-1",
            "placement": "Top of Search on-Amazon",
            "spend": 30.0,
            "clicks": 18,
            "orders": 8,
            "sales": 96.0,
        },
    ]
    monkeypatch.setattr(signal_triage, "load_signal_rows_from_latest_snapshot", lambda: signal_rows)
    monkeypatch.setattr(signal_triage, "_current_signals", lambda signal_rows, selected_market_id=None: [])
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(model_dump=lambda mode="json": {"has_snapshot": True, "snapshot_id": "snapshot-30d", "status": "success"}),
    )
    monkeypatch.setattr(
        signal_triage,
        "build_product_scope_summary",
        lambda: SimpleNamespace(
            options=[
                SimpleNamespace(
                    scope_id="parent_asin:B00K4W4AAA",
                    scope_type="parent_asin",
                    parent_asin="B00K4W4AAA",
                    child_asins=["B016EXMVZS", "B016EXMW02"],
                )
            ],
        ),
    )
    monkeypatch.setattr(
        signal_triage,
        "build_review_readiness_payload",
        lambda selected_market_id=None, **kwargs: {
            "status": "not_ready",
            "manual_action_count": 0,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 0,
        },
    )

    payload = signal_triage.build_signal_triage_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
    )

    assert payload["status"] == "no_actionable_candidate"
    assert payload["actionability_status"]["status"] == "no_actionable_candidate"
    assert payload["actionability_status"]["can_write_manual_action"] is False
    assert payload["actionability_status"]["diagnosis_mode"] == "product_scope_drilldown"
    assert "只能作为诊断视图" in payload["actionability_status"]["message"]
    assert "广告 ASIN 2 个" in payload["actionability_status"]["message"]
    assert "广告花费 140.00" in payload["actionability_status"]["message"]
    assert "广告订单 28" in payload["actionability_status"]["message"]
    assert "现有信号规则没有命中" in payload["actionability_status"]["message"]
    assert "下钻广告 ASIN、广告组、有效搜索词和无订单花费词" in payload["actionability_status"]["next_step"]
    assert payload["actionability_status"]["manual_gate_title"] == "暂不进入人工动作"
    assert "candidate_count=0" in payload["actionability_status"]["boundary"]
    assert "不能写人工动作" in payload["actionability_status"]["boundary"]
    assert "继续下钻广告 ASIN / 广告组 / 搜索词 / 广告位" in payload["actionability_status"]["allowed_paths"]
    assert "补数据或等待下一次快照候选" in payload["actionability_status"]["allowed_paths"]
    assert "自动调价" in payload["actionability_status"]["forbidden_actions"]
    assert "自动否词" in payload["actionability_status"]["forbidden_actions"]
    assert payload["manual_action_preview"] is None
    assert any(blocker["code"] == "no_review_candidate" for blocker in payload["blockers"])
    drilldown = payload["product_scope_drilldown"]
    assert drilldown["scope_id"] == "parent_asin:B00K4W4AAA"
    assert drilldown["advertised_asin_count"] == 2
    assert drilldown["items"][0]["asin"] == "B016EXMVZS"
    assert drilldown["items"][0]["top_ad_group"]["ad_group_name"] == "RBK004-kids sunglasses-广泛"
    assert drilldown["items"][0]["top_ad_group"]["ad_group_advertised_asin_count"] == 2
    assert drilldown["items"][0]["top_ad_group"]["ad_group_advertised_asins"] == ["B016EXMVZS", "B016EXMW02"]
    assert "同广告组投放 2 个广告 ASIN" in drilldown["items"][0]["top_ad_group"]["ad_group_attribution_boundary"]
    assert drilldown["items"][0]["top_ad_group"]["search_term_count"] == 2
    assert drilldown["items"][0]["top_ad_group"]["placement_count"] == 1
    assert drilldown["items"][0]["top_ad_group"]["effective_search_terms"][0]["search_term"] == "kids sunglasses"
    assert drilldown["items"][0]["top_ad_group"]["zero_order_search_terms"][0]["search_term"] == "baby sunglasses"
    targeting_context = drilldown["items"][0]["top_ad_group"]["targeting_context"]
    assert targeting_context["targeting_count"] == 1
    assert targeting_context["report_row_count"] == 2
    assert targeting_context["top_targetings"][0]["targeting_text"] == "kids sunglasses"
    assert "不代表完整关键词库" in targeting_context["boundary"]
    assert "广告 ASIN 2 个" in drilldown["summary"]
    assert "搜索词和广告位只说明同广告组上下文" in drilldown["boundary"]
    candidate_gap = drilldown["candidate_gap_analysis"]
    assert candidate_gap["status"] == "diagnostic_only"
    assert "广告 ASIN 层没有命中可人工确认候选" in candidate_gap["summary"]
    assert "搜索词候选按广告组上下文另行准入" in candidate_gap["summary"]
    assert "不写人工动作" in candidate_gap["boundary"]
    assert len(candidate_gap["checks"]) == 2
    assert candidate_gap["checks"][0]["object_type"] == "advertised_product"
    assert candidate_gap["checks"][0]["object_id"] == "B016EXMVZS"
    assert "未触发广告 ASIN 异常" in candidate_gap["checks"][0]["anomaly_check"]
    assert "订单 20" in candidate_gap["checks"][0]["anomaly_check"]
    assert "稳定转化机会规则暂缓" in candidate_gap["checks"][0]["opportunity_check"]
    assert "缺库存、利润、价格、主推策略" in candidate_gap["checks"][0]["opportunity_check"]
    assert "诊断不准入" in candidate_gap["checks"][0]["result"]
    assert drilldown["ad_group_diagnosis"][0]["ad_group_name"] == "RBK004-kids sunglasses-广泛"
    assert drilldown["ad_group_diagnosis"][0]["diagnosis_status"] == "observe"
    assert drilldown["ad_group_diagnosis"][0]["diagnosis_label"] == "观察"
    product_performance = drilldown["ad_group_diagnosis"][0]["advertised_product_performance"]
    assert product_performance[0]["asin"] == "B016EXMVZS"
    assert product_performance[0]["spend"] == 100.0
    assert product_performance[0]["orders"] == 20
    assert product_performance[0]["acos"] == 0.25
    assert product_performance[0]["cvr"] == 0.4
    assert product_performance[1]["asin"] == "B016EXMW02"
    assert product_performance[1]["sample_boundary"] == "点击样本少，仅适合观察。"
    assert "无订单花费词" in drilldown["ad_group_diagnosis"][0]["reason"]
    assert "搜索词和广告位只能说明广告组上下文" in drilldown["ad_group_diagnosis"][0]["attribution_boundary"]
    assert "自动调价" in drilldown["ad_group_diagnosis"][0]["forbidden_actions"]
    search_term_diagnosis = drilldown["ad_group_diagnosis"][0]["search_term_diagnosis"]
    assert search_term_diagnosis["term_summary"] == "有效搜索词 1 条 / 无订单花费词 1 条"
    assert search_term_diagnosis["effective_terms"][0]["search_term"] == "kids sunglasses"
    assert search_term_diagnosis["effective_terms"][0]["term_type"] == "regular"
    assert search_term_diagnosis["zero_order_terms"][0]["search_term"] == "baby sunglasses"
    assert search_term_diagnosis["zero_order_terms"][0]["term_type"] == "regular"
    assert "不能自动归因到单个 ASIN" in search_term_diagnosis["term_boundary"]
    assert "ASIN 型搜索词" in search_term_diagnosis["term_boundary"]
    assert "自动否词" in search_term_diagnosis["forbidden_actions"]


def test_review_candidates_group_parent_asin_candidates_by_decision_layer(monkeypatch) -> None:
    sales_strong_ad_weak = make_signal(
        "sig-sales-strong-ad-weak",
        "B016EXMW1G",
        object_type="sales_product",
        signal_category="product_ad_coverage",
        priority="P0",
        severity=4,
        label="RBK004-RBK004-2 绿",
    )
    strategy_boundary = make_signal("sig-main-push-boundary", "B016EXMVZS")
    ad_asin_opportunity = make_signal("sig-ad-asin-opportunity", "B016EXMW02")

    monkeypatch.setattr(signal_triage, "load_signal_rows_from_latest_snapshot", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(
        signal_triage,
        "_current_signals",
        lambda signal_rows, selected_market_id=None: [sales_strong_ad_weak, strategy_boundary, ad_asin_opportunity],
    )
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(model_dump=lambda mode="json": {"has_snapshot": True, "snapshot_id": "snapshot-30d", "status": "success"}),
    )
    monkeypatch.setattr(
        signal_triage,
        "build_product_scope_summary",
        lambda: SimpleNamespace(
            options=[
                SimpleNamespace(
                    scope_id="parent_asin:B00K4W4AAA",
                    scope_type="parent_asin",
                    parent_asin="B00K4W4AAA",
                    child_asins=["B016EXMVZS", "B016EXMW02", "B016EXMW1G"],
                ),
                SimpleNamespace(
                    scope_id="ad_asin:B016EXMVZS",
                    scope_type="advertised_asin",
                    asin="B016EXMVZS",
                    parent_asin="B00K4W4AAA",
                    strategy_notes=["B016EXMVZS 已标记为主推款"],
                ),
                SimpleNamespace(
                    scope_id="ad_asin:B016EXMW02",
                    scope_type="advertised_asin",
                    asin="B016EXMW02",
                    parent_asin="B00K4W4AAA",
                    strategy_notes=[],
                ),
                SimpleNamespace(
                    scope_id="sales_asin:B016EXMW1G",
                    scope_type="sales_asin",
                    asin="B016EXMW1G",
                    parent_asin="B00K4W4AAA",
                    strategy_notes=[],
                ),
            ],
        ),
    )

    payload = signal_triage.build_review_candidates_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
    )

    layers = {layer["layer_id"]: layer for layer in payload["candidate_layers"]}
    assert layers["sales_strong_ad_weak"]["count"] == 1
    assert layers["advertised_asin_opportunity"]["count"] == 1
    assert layers["strategy_boundary"]["count"] == 1
    assert layers["advertised_asin_opportunity"]["top_candidates"][0]["object_label"] == "B016EXMW02"
    assert payload["recommended_candidate"]["asin"] == "B016EXMW1G"
    assert payload["recommended_candidate"]["object_label"] == "RBK004-RBK004-2 绿"
    assert payload["recommended_candidate"]["object_type"] == "sales_product"
    assert "广告 ASIN 待处理" in payload["recommendation_reason"]
    assert "销售强广告弱" in payload["recommendation_reason"]
    assert "策略主推边界" in payload["recommendation_reason"]


def test_review_candidate_layers_keep_ad_group_as_container_boundary() -> None:
    product_scope = SimpleNamespace(options=[])
    ad_group_candidate = {
        "signal_id": "sig-ad-group-structure",
        "signal_category": "ad_group_structure",
        "object_type": "ad_group",
        "object_id": "G-1",
        "object_label": "RBK004-Auto",
        "priority": "P1",
        "severity": 3,
    }

    layers = {layer["layer_id"]: layer for layer in signal_triage._candidate_layers([ad_group_candidate], product_scope)}

    assert layers["advertised_asin_opportunity"]["count"] == 0
    assert layers["ad_group_structure_boundary"]["count"] == 1
    assert layers["ad_group_structure_boundary"]["top_candidates"][0]["object_label"] == "RBK004-Auto"


def test_candidate_summary_exposes_deep_analysis_fields() -> None:
    candidate = make_candidate()

    summary = signal_triage._candidate_summary(candidate)

    assert summary["problem_type"] == "机会扩量"
    assert summary["evidence_strength"] == "中"
    assert summary["review_path"] == "待人工动作"
    assert "广告 ASIN" in summary["attribution_boundary"]
    assert "不能自动归因" in summary["attribution_boundary"]


def test_ad_group_candidate_summary_keeps_structure_boundary_problem_type() -> None:
    candidate = {
        "signal_id": "sig-ad-group-structure",
        "signal_category": "ad_group_structure",
        "object_type": "ad_group",
        "object_id": "G-1",
        "object_label": "RBK004-Auto",
        "priority": "P1",
        "confidence": "medium",
        "severity": 3,
        "evidence_count": 5,
        "freshness_status": "api_snapshot",
    }

    summary = signal_triage._candidate_summary(candidate)

    assert summary["problem_type"] == "投放结构失衡"
    assert summary["review_path"] == "待人工动作"
    assert "广告组是投放容器" in summary["attribution_boundary"]
    assert "不能直接归因到单个商品" in summary["attribution_boundary"]


def test_review_candidates_include_recommended_evidence_drilldown(monkeypatch) -> None:
    candidate = make_signal(
        "sig-ad-asin-opportunity",
        "B016EXMW02",
        source_rows=[
            {
                "source_table": "advertised_products",
                "campaign_name": "RBK004-AUTO",
                "ad_group_name": "RBK004-Auto",
                "asin": "B016EXMW02",
                "spend": 12.5,
                "orders": 3,
                "sales": 59.97,
                "acos": 0.2084,
                "cvr": 0.3,
            },
            {
                "source_table": "ad_search_term_daily_metrics",
                "campaign_name": "RBK004-AUTO",
                "ad_group_name": "RBK004-Auto",
                "search_term": "baby sunglasses",
                "spend": 4.5,
                "orders": 1,
            },
            {
                "source_table": "ad_placement_daily_metrics",
                "campaign_name": "RBK004-AUTO",
                "ad_group_name": "RBK004-Auto",
                "placement": "Detail Page on-Amazon",
                "spend": 2.0,
                "orders": 1,
            },
        ],
    )

    monkeypatch.setattr(signal_triage, "load_signal_rows_from_latest_snapshot", lambda: list(candidate.evidence.source_rows))
    monkeypatch.setattr(signal_triage, "_current_signals", lambda signal_rows, selected_market_id=None: [candidate])
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(model_dump=lambda mode="json": {"has_snapshot": True, "snapshot_id": "snapshot-30d", "status": "success"}),
    )
    monkeypatch.setattr(
        signal_triage,
        "build_product_scope_summary",
        lambda: SimpleNamespace(
            options=[
                SimpleNamespace(
                    scope_id="parent_asin:B00K4W4AAA",
                    scope_type="parent_asin",
                    parent_asin="B00K4W4AAA",
                    child_asins=["B016EXMW02"],
                ),
                SimpleNamespace(
                    scope_id="ad_asin:B016EXMW02",
                    scope_type="advertised_asin",
                    asin="B016EXMW02",
                    parent_asin="B00K4W4AAA",
                    strategy_notes=[],
                ),
            ],
        ),
    )

    payload = signal_triage.build_review_candidates_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
    )

    drilldown = payload["recommended_evidence_drilldown"]
    assert drilldown["object_label"] == "B016EXMW02"
    assert drilldown["direct_ad_product_row_count"] == 1
    assert drilldown["search_term_context_count"] == 1
    assert drilldown["placement_context_count"] == 1
    assert drilldown["ad_product_rows"][0]["campaign_name"] == "RBK004-AUTO"
    assert drilldown["ad_product_rows"][0]["ad_group_name"] == "RBK004-Auto"
    assert "广告商品投放行 1 条" in drilldown["summary"]
    assert "同广告组搜索词上下文 1 条" in drilldown["summary"]
    assert "不能自动归因" in drilldown["boundary"]


def test_signal_triage_payload_adds_diagnosis_contract_for_search_term_path(monkeypatch, tmp_path) -> None:
    candidate = make_signal(
        "sig-opportunity-search-term-1-beach-essentials",
        "beach essentials",
        object_type="search_term",
        signal_category="search_term_opportunity",
        priority="P0",
        severity=4,
        source_rows=[
            {
                "source_table": "ad_search_term_daily_metrics",
                "campaign_name": "RBK004-beach essentials-精准（测试）",
                "ad_group_name": "RBK004-beach essentials-精准（测试）",
                "search_term": "beach essentials",
                "targeting_text": "beach essentials",
                "spend": 18.08,
                "clicks": 19,
                "orders": 13,
                "sales": 116.88,
            },
            {
                "source_table": "ad_search_term_daily_metrics",
                "campaign_name": "RBK004-扩展-beach essentials（旺季前夕开）",
                "ad_group_name": "RBK004-扩展-beach essentials",
                "search_term": "beach essentials",
                "targeting_text": "beach essentials",
                "spend": 16.03,
                "clicks": 19,
                "orders": 8,
                "sales": 76.32,
            },
        ],
    )
    snapshot_rows = [
        *candidate.evidence.source_rows,
        {
            "source_table": "advertised_products",
            "campaign_name": "RBK004-beach essentials-精准（测试）",
            "ad_group_name": "RBK004-beach essentials-精准（测试）",
            "asin": "B016EXMW02",
            "spend": 18.08,
            "clicks": 19,
            "orders": 13,
            "sales": 116.88,
        },
        {
            "source_table": "advertised_products",
            "campaign_name": "RBK004-扩展-beach essentials（旺季前夕开）",
            "ad_group_name": "RBK004-扩展-beach essentials",
            "asin": "B016EXMVZS",
            "spend": 16.03,
            "clicks": 19,
            "orders": 8,
            "sales": 76.32,
        },
        {
            "source_table": "ad_placement_daily_metrics",
            "campaign_name": "RBK004-beach essentials-精准（测试）",
            "placement": "Top of Search on-Amazon",
            "spend": 12.0,
            "clicks": 10,
            "orders": 5,
            "sales": 50.0,
        },
        {
            "source_table": "ad_placement_daily_metrics",
            "campaign_name": "RBK004-扩展-beach essentials（旺季前夕开）",
            "placement": "Product Pages on-Amazon",
            "spend": 8.0,
            "clicks": 9,
            "orders": 3,
            "sales": 30.0,
        },
    ]

    monkeypatch.setattr(signal_triage, "load_signal_rows_from_latest_snapshot", lambda: list(snapshot_rows))
    monkeypatch.setattr(
        signal_triage,
        "load_aba_rows_from_latest_snapshot",
        lambda: [
            {
                "search_term": "beach essentials",
                "normalized_query": "beach essentials",
                "search_frequency_rank": 208,
                "rank_change_type": "上升",
                "rank_change_value": 16,
                "start_date": "2026-06-07",
                "end_date": "2026-06-13",
                "source_type": "ABA导出",
            }
        ],
    )
    monkeypatch.setattr(signal_triage, "_current_signals", lambda signal_rows, selected_market_id=None: [candidate])
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(model_dump=lambda mode="json": {"has_snapshot": True, "snapshot_id": "snapshot-30d", "status": "success"}),
    )
    monkeypatch.setattr(
        signal_triage,
        "build_product_scope_summary",
        lambda: SimpleNamespace(
            options=[
                SimpleNamespace(
                    scope_id="parent_asin:B00K4W4AAA",
                    scope_type="parent_asin",
                    label="Parent ASIN B00K4W4AAA",
                    parent_asin="B00K4W4AAA",
                    child_asins=["B016EXMW02", "B016EXMVZS", "B016EXMW1G"],
                    sales_orders=120,
                    sales_amount=1299.0,
                ),
                SimpleNamespace(
                    scope_id="ad_asin:B016EXMW02",
                    scope_type="advertised_asin",
                    asin="B016EXMW02",
                    parent_asin="B00K4W4AAA",
                    strategy_notes=[],
                ),
            ],
        ),
    )

    payload = signal_triage.build_signal_triage_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        action_root=tmp_path / "actions",
        review_root=tmp_path / "reviews",
    )

    contract = payload["diagnosis_contract"]
    assert contract["object_label"] == "beach essentials"
    assert contract["status"] == "ready_for_manual_confirmation"
    sections = {section["section_id"]: section for section in contract["sections"]}
    assert set(sections) >= {
        "parent_asin_scope",
        "ad_asin_coverage",
        "ad_group_boundary",
        "search_term_opportunity",
        "placement_gap",
        "manual_review",
    }
    for section in sections.values():
        assert section["business_question"]
        assert section["object_grain"]
        assert section["metrics"]
        assert section["current_judgement"]
        assert section["proves"]
        assert section["does_not_prove"]
        assert section["next_manual_step"]
        assert section["evidence_gap"]
        assert section["required_evidence"]

    ad_asin_section = sections["ad_asin_coverage"]
    ad_asin_metrics = {metric["name"]: metric["value"] for metric in ad_asin_section["metrics"]}
    assert ad_asin_metrics["广告 ASIN 数"] == "2"
    assert ad_asin_metrics["广告 ASIN 花费"] == "34.11"
    assert ad_asin_metrics["广告 ASIN 订单"] == "21"
    assert "B016EXMW02" in ad_asin_metrics["优先复核 ASIN"]
    assert ad_asin_metrics["直接广告商品行"] == "0"
    assert "不能直接归因到某个广告 ASIN" in ad_asin_section["current_judgement"]
    assert "搜索词到广告 ASIN 的归因边界" in ad_asin_section["evidence_gap"]
    assert "投放商品清单" in ad_asin_section["required_evidence"]
    assert "记录观察" in ad_asin_section["next_manual_step"]

    search_term_section = sections["search_term_opportunity"]
    search_term_metrics = {metric["name"]: metric["value"] for metric in search_term_section["metrics"]}
    search_term_metric_purposes = {metric["name"]: metric["purpose"] for metric in search_term_section["metrics"]}
    assert search_term_section["object_grain"] == "SearchTerm + 同广告活动 / 广告组上下文 + 站点级 ABA 背景"
    assert "是否存在可人工复核的扩量机会" in search_term_section["business_question"]
    assert "不是自动加词" in search_term_section["business_question"]
    assert search_term_metrics["花费"] == "34.11"
    assert search_term_metrics["订单"] == "21"
    assert search_term_metrics["销售额"] == "193.20"
    assert search_term_metrics["ACOS"] == "17.7%"
    assert search_term_metrics["CVR"] == "55.3%"
    assert "零成本偶然样本" in search_term_metric_purposes["花费"]
    assert "真实店内广告转化" in search_term_metric_purposes["订单"]
    assert "不是自动调价依据" in search_term_metric_purposes["ACOS"]
    assert search_term_metrics["投放上下文"] == "广告组 2 个 / 搜索词表现行 2 条"
    assert search_term_metrics["投放词证据"] == "beach essentials / 1 个"
    assert search_term_metrics["广告位证据"] == "广告组级广告位 0 条 / 同广告活动广告位 2 条"
    assert search_term_metrics["ABA市场热度"] == "排名 208 / 2026-06-07 至 2026-06-13 / 上升16"
    assert search_term_metrics["广告组承接边界"] == "2/2 已匹配 / 最大同组 ASIN 1"
    assert "ACOS 17.7%" in search_term_section["current_judgement"]
    assert "ABA 排名 208" in search_term_section["current_judgement"]
    assert "广告位证据：广告组级广告位 0 条 / 同广告活动广告位 2 条" in search_term_section["current_judgement"]
    assert "投放词、广告组结构、广告位层级和广告 ASIN 承接" in search_term_section["current_judgement"]
    assert "站点级 ABA 市场热度" in search_term_section["proves"]
    assert "广告位证据层级" in search_term_section["proves"]
    assert "不能证明应该自动加词" in search_term_section["does_not_prove"]
    assert "不能证明广告位造成该搜索词表现差异" in search_term_section["does_not_prove"]
    assert "缺少搜索词直连广告位和广告组级广告位" in search_term_section["evidence_gap"]
    assert "同广告活动 2 条广告位只能作背景" in search_term_section["evidence_gap"]
    assert "advertised_products" in search_term_section["required_evidence"]
    assert "ad_placement_daily_metrics" in search_term_section["required_evidence"]
    assert "ABA 搜索词快照" in search_term_section["required_evidence"]
    assert "核对投放词 beach essentials" in search_term_section["next_manual_step"]
    assert "广告位层级" in search_term_section["next_manual_step"]
    ad_group_section = sections["ad_group_boundary"]
    ad_group_metrics = {metric["name"]: metric["value"] for metric in ad_group_section["metrics"]}
    assert ad_group_metrics["广告组数"] == "2"
    assert ad_group_metrics["已匹配广告组结构"] == "2/2"
    assert ad_group_metrics["多商品广告组"] == "0/2"
    assert ad_group_metrics["最大同组 ASIN"] == "1"
    assert ad_group_metrics["有效/无订单词"] == "2/0"
    assert "B016EXMW02 花费 18.08 / 订单 13" in ad_group_metrics["同组投放商品表现"]
    assert "B016EXMVZS 花费 16.03 / 订单 8" in ad_group_metrics["同组投放商品表现"]
    assert "策略备注 0 / 多商品广告组 0" in ad_group_metrics["主推策略边界"]
    assert "不自动执行广告动作" in ad_group_metrics["主推策略边界"]
    assert ad_group_metrics["广告位层级"] == "广告活动级 2"
    assert "RBK004-beach essentials-精准（测试）" in ad_group_section["current_judgement"]
    assert "RBK004-扩展-beach essentials" in ad_group_section["current_judgement"]
    assert "已匹配 2/2 个广告组结构" in ad_group_section["current_judgement"]
    assert "单 ASIN 投放" in ad_group_section["current_judgement"]
    assert "同组商品表现" in ad_group_section["current_judgement"]
    assert "主推策略边界" in ad_group_section["current_judgement"]
    assert "广告组是投放容器" in sections["ad_group_boundary"]["evidence_gap"]
    assert "同广告活动广告位证据" in sections["ad_group_boundary"]["evidence_gap"]
    assert "投放商品清单" in sections["ad_group_boundary"]["required_evidence"]
    assert "advertised_products" in sections["ad_group_boundary"]["required_evidence"]
    assert "同组 ASIN" in sections["ad_group_boundary"]["next_manual_step"]
    placement_section = sections["placement_gap"]
    placement_metrics = {metric["name"]: metric["value"] for metric in placement_section["metrics"]}
    assert placement_metrics["推荐对象广告位"] == "0"
    assert placement_metrics["匹配广告组"] == "2/2"
    assert placement_metrics["广告组级广告位"] == "0"
    assert placement_metrics["广告活动级背景"] == "2"
    assert placement_metrics["缺广告位广告组"] == "0"
    assert "同广告活动广告位背景" in placement_section["current_judgement"]
    assert "不能证明该搜索词或该广告组由广告位导致" in placement_section["current_judgement"]
    assert "广告活动级证据不能替代广告组级归因" in placement_section["does_not_prove"]
    assert "缺搜索词直连广告位和广告组级广告位" in placement_section["evidence_gap"]
    assert "ad_placement_daily_metrics" in sections["placement_gap"]["required_evidence"]
    assert "campaign_id + ad_group_id" in placement_section["required_evidence"]
    assert "广告组级广告位数据" in placement_section["next_manual_step"]
    assert "记录观察" in sections["manual_review"]["next_manual_step"]


def test_sales_product_candidate_evidence_drilldown_uses_sales_product_scope() -> None:
    candidate = signal_triage._candidate_payload(
        make_signal(
            "sig-sales-product-ad-weak",
            "B06VW5SQ97",
            object_type="sales_product",
            signal_category="product_ad_coverage",
            priority="P0",
            severity=4,
            source_rows=[
                {
                    "source_table": "sales_product_daily_metrics",
                    "asin": "B06VW5SQ97",
                    "start_date": "2026-05-17",
                    "end_date": "2026-06-15",
                    "sessions": 2721,
                    "page_views": 2985,
                    "orders": 251,
                    "units": 260,
                    "sales": 2433.04,
                    "ad_orders": 18,
                    "ad_spend": -64.92,
                    "ad_sales": 170.76,
                }
            ],
        )
    )

    drilldown = candidate["evidence_drilldown"]
    assert drilldown["object_label"] == "B06VW5SQ97"
    assert drilldown["direct_ad_product_row_count"] == 0
    assert drilldown["search_term_context_count"] == 0
    assert drilldown["placement_context_count"] == 0
    assert drilldown["metric_summary"]["basis"] == "sales_product_daily_metrics"
    assert drilldown["sales_product_summary"]["orders"] == 251
    assert drilldown["sales_product_summary"]["ad_orders"] == 18
    assert drilldown["sales_product_summary"]["organic_orders"] == 233
    assert drilldown["sales_product_summary"]["organic_sales"] == 2262.28
    assert drilldown["sales_product_summary"]["order_rate"] == 0.0922
    assert drilldown["sales_product_summary"]["ad_order_share"] == 0.0717
    assert drilldown["sales_product_summary"]["ad_sales_share"] == 0.0702
    blocks = {block["block_id"]: block for block in drilldown["business_evidence_blocks"]}
    assert blocks["sales_performance"]["label"] == "销售表现"
    assert "订单 251" in blocks["sales_performance"]["value"]
    assert "非广告订单 233" in blocks["sales_performance"]["detail"]
    assert blocks["ad_coverage"]["label"] == "广告承接"
    assert "广告订单占比 7.2%" in blocks["ad_coverage"]["value"]
    assert "不单独作为异常结论" in blocks["ad_coverage"]["detail"]
    assert blocks["decision_boundary"]["label"] == "判断边界"
    assert blocks["manual_next_step"]["label"] == "人工下一步"
    assert "订单 251" in drilldown["summary"]
    assert "广告订单 18" in drilldown["summary"]
    assert "不单独作为异常结论" in drilldown["summary"]
    assert "不自动执行广告动作" in drilldown["summary"]
    assert "人工复核" in drilldown["boundary"]


def test_recommended_sales_product_drilldown_keeps_sales_product_evidence_after_merge(monkeypatch) -> None:
    candidate = make_signal(
        "sig-sales-product-ad-weak",
        "B06VW5SQ97",
        object_type="sales_product",
        signal_category="product_ad_coverage",
        priority="P0",
        severity=4,
        label="RBK004-RBK004-2 深蓝",
        source_rows=[
            {
                "source_table": "sales_product_daily_metrics",
                "asin": "B06VW5SQ97",
                "start_date": "2026-05-18",
                "end_date": "2026-06-16",
                "sessions": 2721,
                "page_views": 2985,
                "orders": 251,
                "units": 260,
                "sales": 2433.04,
                "ad_orders": 18,
                "ad_spend": -64.92,
                "ad_sales": 170.76,
            }
        ],
    )

    monkeypatch.setattr(signal_triage, "load_signal_rows_from_latest_snapshot", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(signal_triage, "_current_signals", lambda signal_rows, selected_market_id=None: [candidate])
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(model_dump=lambda mode="json": {"has_snapshot": True, "snapshot_id": "snapshot-30d", "status": "success"}),
    )
    monkeypatch.setattr(
        signal_triage,
        "build_product_scope_summary",
        lambda: SimpleNamespace(
            options=[
                SimpleNamespace(
                    scope_id="parent_asin:B00K4W4AAA",
                    scope_type="parent_asin",
                    parent_asin="B00K4W4AAA",
                    child_asins=["B06VW5SQ97"],
                )
            ],
        ),
    )

    payload = signal_triage.build_review_candidates_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
    )

    drilldown = payload["recommended_evidence_drilldown"]
    assert payload["manual_action_preview"]["object_id"] == "B06VW5SQ97"
    assert drilldown["object_type"] == "sales_product"
    assert drilldown["metric_summary"]["basis"] == "sales_product_daily_metrics"
    assert drilldown["sales_product_summary"]["orders"] == 251
    assert drilldown["sales_product_summary"]["ad_orders"] == 18
    blocks = {block["block_id"]: block for block in drilldown["business_evidence_blocks"]}
    assert "sales_performance" in blocks
    assert "ad_coverage" in blocks
    assert "销售商品证据" in drilldown["summary"]
    assert "订单 251" in drilldown["summary"]


def test_ad_product_candidate_drilldown_uses_direct_rows_for_coverage_ratio() -> None:
    candidate = signal_triage._candidate_payload(
        make_signal(
            "sig-b016-direct",
            "B016EXMW02",
            source_rows=[
                {
                    "source_table": "advertised_products",
                    "campaign_name": "RBK004-AUTO",
                    "ad_group_name": "RBK004-Auto",
                    "asin": "B016EXMW02",
                    "spend": 10,
                    "clicks": 20,
                    "orders": 2,
                    "sales": 50,
                },
                {
                    "source_table": "advertised_products",
                    "campaign_name": "RBK004-MANUAL",
                    "ad_group_name": "RBK004-Exact",
                    "asin": "B016EXMW02",
                    "spend": 30,
                    "clicks": 30,
                    "orders": 6,
                    "sales": 150,
                },
            ],
        )
    )

    drilldown = candidate["evidence_drilldown"]
    blocks = {block["block_id"]: block for block in drilldown["business_evidence_blocks"]}
    assert blocks["ad_product_coverage"]["value"] == "覆盖 raw 投放行 2/2 / 证据行 2 条"
    assert "覆盖率 100.0%" in blocks["ad_product_coverage"]["detail"]
    assert "覆盖率未知" not in blocks["ad_product_coverage"]["detail"]
    assert blocks["downstream_context_gap"]["label"] == "下钻证据缺口"
    assert blocks["downstream_context_gap"]["value"] == "缺少同广告组搜索词和广告位上下文"
    assert "不能解释为具体搜索词、广告位或投放结构问题" in blocks["downstream_context_gap"]["detail"]


def test_ad_product_candidate_drilldown_has_manual_action_and_review_contract_blocks() -> None:
    candidate = signal_triage._candidate_payload(
        make_signal(
            "sig-b016-actionability",
            "B016EXMW02",
            source_rows=[
                {
                    "source_table": "advertised_products",
                    "campaign_name": "RBK004-AUTO",
                    "ad_group_name": "RBK004-Auto",
                    "asin": "B016EXMW02",
                    "spend": 10,
                    "clicks": 20,
                    "orders": 2,
                    "sales": 50,
                }
            ],
        )
    )

    blocks = {block["block_id"]: block for block in candidate["evidence_drilldown"]["business_evidence_blocks"]}

    assert blocks["manual_action_path"]["label"] == "人工动作路径"
    assert "不自动调价" in blocks["manual_action_path"]["detail"]
    assert blocks["review_metrics"]["label"] == "复盘指标"
    assert "7/14 天" in blocks["review_metrics"]["value"]


def test_ad_product_candidate_drilldown_marks_missing_placement_context_when_search_terms_exist() -> None:
    candidate = signal_triage._candidate_payload(
        make_signal(
            "sig-b016-search-only",
            "B016EXMW02",
            source_rows=[
                {
                    "source_table": "advertised_products",
                    "campaign_name": "RBK004-AUTO",
                    "ad_group_name": "RBK004-Auto",
                    "asin": "B016EXMW02",
                    "spend": 30,
                    "clicks": 35,
                    "orders": 1,
                    "sales": 12,
                },
                {
                    "source_table": "ad_search_term_daily_metrics",
                    "campaign_name": "RBK004-AUTO",
                    "ad_group_name": "RBK004-Auto",
                    "search_term": "kids sunglasses",
                    "spend": 12,
                    "clicks": 16,
                    "orders": 0,
                    "sales": 0,
                },
            ],
        )
    )

    drilldown = candidate["evidence_drilldown"]
    blocks = {block["block_id"]: block for block in drilldown["business_evidence_blocks"]}

    assert drilldown["search_term_context_count"] == 1
    assert drilldown["placement_context_count"] == 0
    assert blocks["placement_context_gap"]["label"] == "广告位证据缺口"
    assert blocks["placement_context_gap"]["value"] == "缺少同广告组广告位上下文"
    assert "不能判断广告位是否造成该 ASIN 承接异常" in blocks["placement_context_gap"]["detail"]
    assert "downstream_context_gap" not in blocks


def test_search_term_candidate_drilldown_uses_search_term_evidence_not_ad_product_template() -> None:
    signal = make_signal(
        "sig-search-term-beach",
        "",
        object_type="search_term",
        signal_category="search_term_opportunity",
        label="beach essentials",
        source_rows=[
            {
                "source_table": "ad_search_term_daily_metrics",
                "campaign_name": "RBK004-AUTO",
                "ad_group_name": "RBK004-Auto",
                "search_term": "beach essentials",
                "keyword_text": "beach essentials",
                "keyword_id": "kw-1",
                "spend": 2.5,
                "clicks": 5,
                "orders": 2,
                "sales": 40,
            },
            {
                "source_table": "ad_search_term_daily_metrics",
                "campaign_name": "RBK004-MANUAL",
                "ad_group_name": "RBK004-Exact",
                "search_term": "beach essentials",
                "keyword_text": "beach essentials exact",
                "keyword_id": "kw-2",
                "cost": 1.5,
                "clicks": 3,
                "orders": 1,
                "sales": 20,
            },
        ],
    )
    signal.evidence.facts = [
        SimpleNamespace(
            label="人工动作路径",
            value="人工确认后加入精准关键词候选或小流量观察；本系统只记录处理和复盘，不自动新增关键词、不自动调价、不自动否词。",
            explanation="机会信号只能进入人工确认。",
            source_type="积加API",
        ),
        SimpleNamespace(
            label="复盘指标",
            value="7/14 天复盘点击、订单、ACOS、CVR、是否重复出现。",
            explanation="机会必须有复盘窗口和复盘指标。",
            source_type="积加API",
        ),
    ]
    candidate = signal_triage._candidate_payload(signal)

    drilldown = candidate["evidence_drilldown"]
    blocks = {block["block_id"]: block for block in drilldown["business_evidence_blocks"]}

    assert drilldown["object_type"] == "search_term"
    assert drilldown["search_term_context_count"] == 2
    assert drilldown["metric_summary"]["basis"] == "search_term_daily_metrics"
    assert drilldown["metric_summary"]["spend"] == 4.0
    assert drilldown["metric_summary"]["orders"] == 3
    assert "搜索词表现行 2 条" in drilldown["summary"]
    assert blocks["search_term_metric_summary"]["label"] == "搜索词表现"
    assert blocks["search_term_metric_summary"]["value"] == "花费 4.00 / 订单 3 / 销售额 60.00"
    assert blocks["search_term_context"]["label"] == "投放上下文"
    assert "广告活动 2 个" in blocks["search_term_context"]["value"]
    assert blocks["ad_group_product_performance"]["label"] == "同组投放商品表现"
    assert blocks["ad_group_product_performance"]["value"] == "缺少同广告组投放商品上下文"
    assert "未投放子 ASIN" in blocks["ad_group_product_performance"]["detail"]
    assert drilldown["ad_group_product_row_count"] == 0
    assert drilldown["ad_product_rows"] == []
    assert blocks["targeting_context"]["label"] == "投放词结构"
    assert "2 个投放词" in blocks["targeting_context"]["value"]
    assert blocks["search_term_boundary"]["label"] == "对象边界"
    assert "不能自动归因到单个广告 ASIN" in blocks["search_term_boundary"]["detail"]
    assert blocks["manual_action_path"]["label"] == "人工动作路径"
    assert "不自动新增关键词" in blocks["manual_action_path"]["value"]
    assert blocks["review_metrics"]["label"] == "复盘指标"
    assert "7/14 天" in blocks["review_metrics"]["value"]
    assert "ad_product_coverage" not in blocks
    assert "ad_metric_summary" not in blocks
    assert "top_spend_source" not in blocks

    full_signal_rows = [
        *signal.evidence.source_rows,
        {
            "source_table": "advertised_products",
            "campaign_name": "RBK004-AUTO",
            "ad_group_name": "RBK004-Auto",
            "asin": "B016EXMW02",
            "msku": "RBK004-Blue",
            "spend": 18.08,
            "clicks": 19,
            "orders": 13,
            "sales": 116.88,
        },
        {
            "source_table": "advertised_products",
            "campaign_name": "RBK004-MANUAL",
            "ad_group_name": "RBK004-Exact",
            "asin": "B016EXMVZS",
            "msku": "RBK004-Black",
            "spend": 16.03,
            "clicks": 19,
            "orders": 8,
            "sales": 76.32,
        },
        {
            "source_table": "advertised_products",
            "campaign_name": "Other campaign",
            "ad_group_name": "Other group",
            "asin": "B00NOTSAME",
            "spend": 999,
            "clicks": 999,
            "orders": 999,
            "sales": 999,
        },
    ]
    summary_drilldown = signal_triage._candidate_summary_evidence_drilldown(
        signal_triage._candidate_summary(candidate),
        [candidate],
        full_signal_rows,
    )
    recommended_drilldown = signal_triage._recommended_evidence_drilldown(
        candidate,
        [candidate],
        full_signal_rows,
    )
    summary_blocks = {block["block_id"]: block for block in summary_drilldown["business_evidence_blocks"]}
    recommended_blocks = {block["block_id"]: block for block in recommended_drilldown["business_evidence_blocks"]}
    assert summary_drilldown["direct_ad_product_row_count"] == 0
    assert summary_drilldown["ad_group_product_row_count"] == 2
    assert len(summary_drilldown["ad_product_rows"]) == 2
    assert recommended_drilldown["ad_group_product_row_count"] == 2
    assert "B016EXMW02" in recommended_blocks["ad_group_product_performance"]["value"]
    assert "B016EXMW02" in summary_blocks["ad_group_product_performance"]["value"]
    assert "B016EXMVZS" in summary_blocks["ad_group_product_performance"]["value"]
    assert "SearchTerm 自动归因到单个 ASIN" in summary_blocks["ad_group_product_performance"]["detail"]
    assert "B00NOTSAME" not in summary_blocks["ad_group_product_performance"]["value"]
    assert "同广告组投放商品 2 行" in summary_drilldown["summary"]
    assert "缺少同广告组投放商品上下文" not in summary_drilldown["summary"]


def test_search_term_candidate_keeps_uncertainty_for_action_boundary() -> None:
    signal = make_signal(
        "sig-search-term-long-tail",
        "",
        object_type="search_term",
        signal_category="search_term_opportunity",
        label="adult sunglasses womens sporty",
        source_rows=[
            {
                "source_table": "ad_search_term_daily_metrics",
                "search_term": "adult sunglasses womens sporty",
                "spend": 1.46,
                "clicks": 1,
                "orders": 2,
                "sales": 38.21,
            }
        ],
    )
    signal.uncertainty = "低样本长尾词只能人工观察；ABA 短语只作为市场背景，不能直接当作可放量结论。"

    candidate = signal_triage._candidate_payload(signal)
    summary = signal_triage._candidate_summary(candidate)

    assert candidate["uncertainty"] == signal.uncertainty
    assert summary["uncertainty"] == signal.uncertainty


def test_recommended_search_term_drilldown_does_not_merge_as_ad_product() -> None:
    candidate = signal_triage._candidate_payload(
        make_signal(
            "sig-search-term-beach",
            "",
            object_type="search_term",
            signal_category="search_term_opportunity",
            label="beach essentials",
            source_rows=[
                {
                    "source_table": "ad_search_term_daily_metrics",
                    "campaign_name": "RBK004-AUTO",
                    "ad_group_name": "RBK004-Auto",
                    "search_term": "beach essentials",
                    "keyword_text": "beach essentials",
                    "spend": 2.5,
                    "clicks": 5,
                    "orders": 2,
                    "sales": 40,
                }
            ],
        )
    )

    drilldown = signal_triage._recommended_evidence_drilldown(candidate, [candidate], [])
    blocks = {block["block_id"]: block for block in drilldown["business_evidence_blocks"]}

    assert drilldown["object_type"] == "search_term"
    assert drilldown["metric_summary"]["basis"] == "search_term_daily_metrics"
    assert "搜索词表现行 1 条" in drilldown["summary"]
    assert "search_term_metric_summary" in blocks
    assert "ad_product_coverage" not in blocks


def test_candidate_summary_search_term_drilldown_does_not_merge_as_ad_product() -> None:
    candidate = signal_triage._candidate_payload(
        make_signal(
            "sig-search-term-beach",
            "",
            object_type="search_term",
            signal_category="search_term_opportunity",
            label="beach essentials",
            source_rows=[
                {
                    "source_table": "ad_search_term_daily_metrics",
                    "campaign_name": "RBK004-AUTO",
                    "ad_group_name": "RBK004-Auto",
                    "search_term": "beach essentials",
                    "keyword_text": "beach essentials",
                    "spend": 2.5,
                    "clicks": 5,
                    "orders": 2,
                    "sales": 40,
                }
            ],
        )
    )

    drilldown = signal_triage._candidate_summary_evidence_drilldown(
        {"signal_id": "sig-search-term-beach", "stable_object_id": "beach essentials"},
        [candidate],
        [],
    )
    blocks = {block["block_id"]: block for block in drilldown["business_evidence_blocks"]}

    assert drilldown["object_type"] == "search_term"
    assert drilldown["metric_summary"]["basis"] == "search_term_daily_metrics"
    assert "搜索词表现行 1 条" in drilldown["summary"]
    assert "search_term_metric_summary" in blocks
    assert "ad_product_coverage" not in blocks


def test_recommended_evidence_drilldown_merges_same_asin_candidates(monkeypatch) -> None:
    auto_candidate = make_signal(
        "sig-b016-auto",
        "B016EXMW02",
        source_rows=[
            {
                "source_table": "advertised_products",
                "campaign_name": "RBK004-AUTO",
                "ad_group_name": "RBK004-Auto",
                "asin": "B016EXMW02",
                "spend": 10,
                "clicks": 20,
                "orders": 2,
                "sales": 50,
            }
        ],
    )
    manual_candidate = make_signal(
        "sig-b016-manual",
        "B016EXMW02",
        source_rows=[
            {
                "source_table": "advertised_products",
                "campaign_name": "RBK004-MANUAL",
                "ad_group_name": "RBK004-Exact",
                "asin": "B016EXMW02",
                "spend": 30,
                "clicks": 30,
                "orders": 6,
                "sales": 150,
            },
            {
                "source_table": "advertised_products",
                "campaign_name": "RBK004-MANUAL",
                "ad_group_name": "RBK004-Exact",
                "asin": "B016EXMW02",
                "spend": 30,
                "clicks": 30,
                "orders": 6,
                "sales": 150,
                "acos": 0.3,
                "cvr": 0.2,
            }
        ],
    )

    monkeypatch.setattr(
        signal_triage,
        "load_signal_rows_from_latest_snapshot",
        lambda: [
            {
                "source_table": "advertised_products",
                "campaign_name": "RBK004-AUTO",
                "ad_group_name": "RBK004-Auto",
                "asin": "B016EXMW02",
                "spend": 10,
                "clicks": 20,
                "orders": 2,
                "sales": 50,
            },
            {
                "source_table": "advertised_products",
                "campaign_name": "RBK004-MANUAL",
                "ad_group_name": "RBK004-Exact",
                "asin": "B016EXMW02",
                "spend": 30,
                "clicks": 30,
                "orders": 6,
                "sales": 150,
            },
            {
                "source_table": "advertised_products",
                "campaign_name": "RBK004-BROAD",
                "ad_group_name": "RBK004-Broad",
                "asin": "B016EXMW02",
                "spend": 5,
                "clicks": 10,
                "orders": 1,
                "sales": 25,
            },
            {
                "source_table": "advertised_products",
                "campaign_name": "RBK004-ZERO",
                "ad_group_name": "RBK004-Zero",
                "asin": "B016EXMW02",
                "spend": 0,
                "clicks": 0,
                "orders": 0,
                "sales": 0,
            },
        ],
    )
    monkeypatch.setattr(
        signal_triage,
        "_current_signals",
        lambda signal_rows, selected_market_id=None: [auto_candidate, manual_candidate],
    )
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(model_dump=lambda mode="json": {"has_snapshot": True, "snapshot_id": "snapshot-30d", "status": "success"}),
    )
    monkeypatch.setattr(
        signal_triage,
        "build_product_scope_summary",
        lambda: SimpleNamespace(
            options=[
                SimpleNamespace(
                    scope_id="parent_asin:B00K4W4AAA",
                    scope_type="parent_asin",
                    parent_asin="B00K4W4AAA",
                    child_asins=["B016EXMW02"],
                ),
                SimpleNamespace(
                    scope_id="ad_asin:B016EXMW02",
                    scope_type="advertised_asin",
                    asin="B016EXMW02",
                    parent_asin="B00K4W4AAA",
                    strategy_notes=[],
                ),
            ],
        ),
    )

    payload = signal_triage.build_review_candidates_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
    )

    drilldown = payload["recommended_evidence_drilldown"]
    assert payload["recommended_candidate"]["object_label"] == "B016EXMW02"
    assert drilldown["object_label"] == "B016EXMW02"
    assert drilldown["direct_ad_product_row_count"] == 2
    assert drilldown["campaigns"] == ["RBK004-AUTO", "RBK004-MANUAL"]
    assert drilldown["ad_groups"] == ["RBK004-Auto", "RBK004-Exact"]
    assert len(drilldown["ad_product_rows"]) == 2
    assert drilldown["ad_product_rows"][0]["clicks"] == 20
    assert drilldown["metric_summary"] == {
        "basis": "recommended_evidence_rows",
        "row_count": 2,
        "spend": 40.0,
        "clicks": 50,
        "orders": 8,
        "sales": 200.0,
        "acos": 0.2,
        "cvr": 0.16,
    }
    assert drilldown["top_spend_campaign"]["label"] == "RBK004-MANUAL"
    assert drilldown["top_spend_campaign"]["spend_share"] == 0.75
    assert drilldown["top_spend_ad_group"]["label"] == "RBK004-Exact"
    assert drilldown["top_spend_ad_group"]["spend_share"] == 0.75
    assert drilldown["ad_group_diagnosis"]["basis"] == "advertised_products + same_ad_group_context"
    assert drilldown["ad_group_diagnosis"]["top_ad_group"]["ad_group_name"] == "RBK004-Exact"
    assert drilldown["ad_group_diagnosis"]["top_ad_group"]["spend"] == 30.0
    assert drilldown["ad_group_diagnosis"]["top_ad_group"]["orders"] == 6
    assert "优先下钻广告组 RBK004-Exact" in drilldown["ad_group_diagnosis"]["summary"]
    assert "广告组是投放容器" in drilldown["ad_group_diagnosis"]["boundary"]
    blocks = {block["block_id"]: block for block in drilldown["business_evidence_blocks"]}
    assert blocks["ad_product_coverage"]["label"] == "广告商品覆盖"
    assert blocks["ad_product_coverage"]["value"] == "覆盖 raw 投放行 2/4 / 证据行 2 条"
    assert "未覆盖 raw 投放行 2 条" in blocks["ad_product_coverage"]["detail"]
    assert blocks["ad_metric_summary"]["label"] == "广告聚合指标"
    assert blocks["ad_metric_summary"]["value"] == "花费 40.00 / 订单 8 / 销售额 200.00"
    assert "ACOS 20.0%" in blocks["ad_metric_summary"]["detail"]
    assert blocks["top_spend_source"]["label"] == "主要花费来源"
    assert blocks["top_spend_source"]["value"] == "RBK004-MANUAL / 花费占比 75.0%"
    assert "不代表该广告活动可以被自动调价" in blocks["top_spend_source"]["detail"]
    assert blocks["ad_group_problem_location"]["label"] == "广告组问题定位"
    assert blocks["ad_group_problem_location"]["value"] == "RBK004-Exact / 花费 30.00 / 订单 6"
    assert "先看广告商品承接" in blocks["ad_group_problem_location"]["detail"]
    assert blocks["context_boundary"]["label"] == "上下文边界"
    assert blocks["context_boundary"]["value"] == "搜索词 0 条 / 广告位 0 条"
    assert "不能自动归因" in blocks["context_boundary"]["detail"]
    assert drilldown["all_asin_ad_coverage"]["basis"] == "raw_advertised_products"
    assert drilldown["all_asin_ad_coverage"]["raw_ad_product_row_count"] == 4
    assert drilldown["all_asin_ad_coverage"]["recommended_ad_product_row_count"] == 2
    assert drilldown["all_asin_ad_coverage"]["missing_ad_product_row_count"] == 2
    assert drilldown["all_asin_ad_coverage"]["coverage_ratio"] == 0.5
    assert drilldown["all_asin_ad_coverage"]["missing_ad_product_rows"] == [
        {
            "campaign_name": "RBK004-BROAD",
            "ad_group_name": "RBK004-Broad",
            "asin": "B016EXMW02",
            "spend": 5,
            "clicks": 10,
            "orders": 1,
            "sales": 25,
            "acos": 0.2,
            "cvr": 0.1,
            "coverage_reason": "未触发推荐证据的背景投放行",
        },
        {
            "campaign_name": "RBK004-ZERO",
            "ad_group_name": "RBK004-Zero",
            "asin": "B016EXMW02",
            "spend": 0,
            "clicks": 0,
            "orders": 0,
            "sales": 0,
            "acos": None,
            "cvr": None,
            "coverage_reason": "零花费背景行",
        },
    ]
    assert drilldown["all_asin_ad_coverage"]["missing_reason_summary"] == {
        "未触发推荐证据的背景投放行": 1,
        "零花费背景行": 1,
    }
    assert drilldown["all_asin_ad_coverage"]["metric_summary"] == {
        "basis": "raw_advertised_products",
        "row_count": 4,
        "spend": 45.0,
        "clicks": 60,
        "orders": 9,
        "sales": 225.0,
        "acos": 0.2,
        "cvr": 0.15,
    }
    assert "ASIN 级证据" in drilldown["summary"]
    assert "合并 2 条同 ASIN 候选" in drilldown["summary"]
    assert "证据行合计花费 40.00" in drilldown["summary"]
    assert "raw 全量广告商品行 4 条" in drilldown["summary"]
    assert "未进入推荐证据 2 条" in drilldown["summary"]
    assert "未覆盖原因：未触发推荐证据的背景投放行 1 条，零花费背景行 1 条" in drilldown["summary"]
    assert "未覆盖投放行：RBK004-BROAD / RBK004-Broad 花费 5.00 订单 1；RBK004-ZERO / RBK004-Zero 花费 0.00 订单 0" in drilldown["summary"]
    assert "ACOS 20.0%" in drilldown["summary"]
    assert "CVR 16.0%" in drilldown["summary"]
    assert "主要花费广告活动 RBK004-MANUAL" in drilldown["summary"]
    assert "不能自动归因" in drilldown["boundary"]


def test_ad_product_drilldown_adds_same_ad_group_search_term_aba_context(monkeypatch) -> None:
    candidate = signal_triage._candidate_payload(
        make_signal(
            "sig-b07-ad-context",
            "B07BS9754Q",
            source_rows=[
                {
                    "source_table": "advertised_products",
                    "campaign_name": "RBK004-AUTO",
                    "ad_group_name": "RBK004-Auto",
                    "asin": "B07BS9754Q",
                    "spend": 54.8,
                    "clicks": 58,
                    "orders": 22,
                    "sales": 213.74,
                }
            ],
        )
    )
    signal_rows = [
        {
            "source_table": "ad_search_term_daily_metrics",
            "campaign_name": "RBK004-AUTO",
            "ad_group_name": "RBK004-Auto",
            "search_term": "beach essentials",
            "normalized_query": "beach essentials",
            "source_report_type": "keyword",
            "keyword_text": "beach essentials",
            "keyword_id": "kw-beach",
            "spend": 12.5,
            "clicks": 15,
            "orders": 4,
            "sales": 42.4,
        },
        {
            "source_table": "ad_search_term_daily_metrics",
            "campaign_name": "RBK004-AUTO",
            "ad_group_name": "RBK004-Auto",
            "search_term": "beach trip essentials",
            "normalized_query": "beach trip essentials",
            "source_report_type": "keyword",
            "keyword_text": "beach trip essentials",
            "keyword_id": "kw-beach-trip",
            "spend": 3.2,
            "clicks": 4,
            "orders": 0,
            "sales": 0,
        },
        {
            "source_table": "ad_search_term_daily_metrics",
            "campaign_name": "other campaign",
            "ad_group_name": "other group",
            "search_term": "beach essentials",
            "normalized_query": "beach essentials",
            "source_report_type": "keyword",
            "keyword_text": "beach essentials",
            "keyword_id": "kw-other",
            "spend": 99,
            "clicks": 99,
            "orders": 99,
            "sales": 999,
        },
    ]
    monkeypatch.setattr(
        signal_triage,
        "load_aba_rows_from_latest_snapshot",
        lambda: [
            {
                "normalized_query": "beach essentials",
                "search_frequency_rank": 208,
                "start_date": "2026-06-07",
                "end_date": "2026-06-13",
            }
        ],
    )

    drilldown = signal_triage._merge_recommended_evidence_drilldown(
        candidate,
        [candidate],
        signal_rows,
    )

    assert drilldown["search_term_context_count"] == 2
    context = drilldown["search_term_aba_context"]
    assert context["basis"] == "priority_ad_group_search_terms"
    assert context["context_ad_group_label"] == "RBK004-Auto"
    assert context["context_search_term_count"] == 2
    assert context["aba_top1000_match_count"] == 1
    assert context["top_terms"][0]["normalized_query"] == "beach essentials"
    assert context["top_terms"][0]["aba_rank"] == 208
    assert context["high_spend_terms"][0]["normalized_query"] == "beach essentials"
    assert context["effective_terms"][0]["normalized_query"] == "beach essentials"
    assert context["zero_order_spend_terms"][0]["normalized_query"] == "beach trip essentials"
    assert context["aba_matched_terms"][0]["normalized_query"] == "beach essentials"
    assert context["diagnosis_summary"] == "高花费词 2 个 / 有效词 1 个 / 无订单消耗词 1 个 / ABA匹配词 1 个"
    assert "无订单消耗词" in context["next_review_focus"]
    targeting_context = drilldown["targeting_context"]
    assert targeting_context["basis"] == "priority_ad_group_targetings"
    assert targeting_context["context_ad_group_label"] == "RBK004-Auto"
    assert targeting_context["targeting_count"] == 2
    assert targeting_context["report_row_count"] == 2
    assert targeting_context["top_targetings"][0]["targeting_text"] == "beach essentials"
    assert targeting_context["top_targetings"][0]["search_term_count"] == 1
    assert targeting_context["effective_targetings"][0]["targeting_text"] == "beach essentials"
    assert targeting_context["zero_order_spend_targetings"][0]["targeting_text"] == "beach trip essentials"
    assert "无订单消耗投放词" in targeting_context["next_review_focus"]
    judgement = drilldown["diagnosis_judgement"]
    assert judgement["problem_layer"] == "search_term"
    assert judgement["problem_type"] == "词层分化复核"
    assert judgement["confidence"] == "medium"
    assert "先查投放词 / 搜索词分化" in judgement["summary"]
    assert judgement["evidence_basis"]["search_term_count"] == 2
    blocks = {block["block_id"]: block for block in drilldown["business_evidence_blocks"]}
    assert blocks["diagnosis_path"]["label"] == "排查路径"
    assert "Parent 经营盘子" in blocks["diagnosis_path"]["value"]
    assert "投放词 / 搜索词 / 广告位" in blocks["diagnosis_path"]["value"]
    assert blocks["diagnosis_judgement"]["label"] == "综合判断"
    assert "先查投放词 / 搜索词分化" in blocks["diagnosis_judgement"]["value"]
    assert "不得自动加词、否词、调价或暂停广告" in blocks["diagnosis_judgement"]["detail"]
    assert blocks["targeting_context"]["label"] == "投放词结构"
    assert blocks["targeting_context"]["value"] == "优先广告组投放词 2 个：有效 beach essentials / 无订单 beach trip essentials"
    assert "高花费投放词：beach essentials（关键词，花费 12.50，订单 4，搜索词 1）" in blocks["targeting_context"]["detail"]
    assert "无订单消耗投放词：beach trip essentials（关键词，花费 3.20，订单 0，搜索词 1）" in blocks["targeting_context"]["detail"]
    assert "不能自动加词、否词或调价" in blocks["targeting_context"]["detail"]
    assert blocks["search_term_market_context"]["label"] == "搜索词市场背景"
    assert blocks["search_term_market_context"]["value"] == "优先广告组搜索词 2 条：有效 beach essentials / 无订单 beach trip essentials / ABA Top1000 匹配 1 条"
    assert "高花费词：beach essentials（花费 12.50，订单 4，ABA排名 208）" in blocks["search_term_market_context"]["detail"]
    assert "有效词：beach essentials（花费 12.50，订单 4，ABA排名 208）" in blocks["search_term_market_context"]["detail"]
    assert "无订单消耗词：beach trip essentials（花费 3.20，订单 0）" in blocks["search_term_market_context"]["detail"]
    assert "ABA匹配词：beach essentials（花费 12.50，订单 4，ABA排名 208）" in blocks["search_term_market_context"]["detail"]
    assert "先人工复核无订单消耗词" in blocks["search_term_market_context"]["detail"]
    assert "只作为市场背景" in blocks["search_term_market_context"]["detail"]
    assert blocks["context_boundary"]["value"] == "搜索词 2 条 / 广告位 0 条"

    summary_drilldown = signal_triage._candidate_summary_evidence_drilldown(
        signal_triage._candidate_summary(candidate),
        [candidate],
        signal_rows,
    )
    summary_blocks = {block["block_id"]: block for block in summary_drilldown["business_evidence_blocks"]}
    assert summary_drilldown["search_term_context_count"] == 2
    assert summary_blocks["search_term_market_context"]["value"] == "优先广告组搜索词 2 条：有效 beach essentials / 无订单 beach trip essentials / ABA Top1000 匹配 1 条"


def test_ad_product_drilldown_keeps_priority_ad_group_empty_search_term_boundary(monkeypatch) -> None:
    candidate = signal_triage._candidate_payload(
        make_signal(
            "sig-b07-ad-context-empty-priority-group",
            "B07BS9754Q",
            source_rows=[
                {
                    "source_table": "advertised_products",
                    "campaign_name": "RBK004-AUTO",
                    "ad_group_name": "RBK004-Auto",
                    "asin": "B07BS9754Q",
                    "spend": 54.8,
                    "clicks": 58,
                    "orders": 22,
                    "sales": 213.74,
                }
            ],
        )
    )
    signal_rows = [
        {
            "source_table": "ad_search_term_daily_metrics",
            "campaign_name": "RBK004-AUTO",
            "ad_group_name": "RBK004-Broad",
            "search_term": "kids sunglasses",
            "normalized_query": "kids sunglasses",
            "source_report_type": "keyword",
            "keyword_text": "kids sunglasses",
            "keyword_id": "kw-other-group",
            "spend": 12.5,
            "clicks": 15,
            "orders": 4,
            "sales": 42.4,
        },
        {
            "source_table": "ad_placement_daily_metrics",
            "campaign_name": "RBK004-AUTO",
            "placement": "Top of Search on-Amazon",
            "spend": 20,
            "clicks": 30,
            "orders": 8,
            "sales": 75,
        }
    ]
    monkeypatch.setattr(signal_triage, "load_aba_rows_from_latest_snapshot", lambda: [])

    drilldown = signal_triage._merge_recommended_evidence_drilldown(
        candidate,
        [candidate],
        signal_rows,
    )

    assert drilldown["search_term_context_count"] == 0
    assert drilldown["search_term_aba_context"] is None
    assert drilldown["targeting_context"] is None
    assert drilldown["ad_group_diagnosis"]["top_ad_group"]["search_term_count"] == 0
    judgement = drilldown["diagnosis_judgement"]
    assert judgement["problem_layer"] == "data_gap"
    assert judgement["problem_type"] == "搜索词数据缺口"
    assert judgement["confidence"] == "low"
    assert "缺少同广告组搜索词" in judgement["summary"]
    blocks = {block["block_id"]: block for block in drilldown["business_evidence_blocks"]}
    assert blocks["diagnosis_judgement"]["label"] == "综合判断"
    assert "缺少同广告组搜索词" in blocks["diagnosis_judgement"]["value"]
    assert "search_term_market_context" not in blocks
    assert blocks["context_boundary"]["value"] == "搜索词 0 条 / 广告组级广告位 0 条 / 同广告活动广告位 1 条"
    assert "不能自动归因" in blocks["context_boundary"]["detail"]


def test_ad_group_diagnosis_keeps_campaign_level_placement_boundary(monkeypatch) -> None:
    candidate = signal_triage._candidate_payload(
        make_signal(
            "sig-placement-boundary",
            "B016EXMW02",
            source_rows=[
                {
                    "source_table": "advertised_products",
                    "campaign_name": "RBK004-MANUAL",
                    "ad_group_name": "RBK004-Exact",
                    "asin": "B016EXMW02",
                    "spend": 30,
                    "clicks": 40,
                    "orders": 6,
                    "sales": 160,
                }
            ],
        )
    )
    signal_rows = [
        {
            "source_table": "ad_search_term_daily_metrics",
            "campaign_name": "RBK004-MANUAL",
            "ad_group_name": "RBK004-Exact",
            "search_term": "kids sunglasses",
            "normalized_query": "kids sunglasses",
            "spend": 8,
            "clicks": 10,
            "orders": 2,
            "sales": 40,
        },
        {
            "source_table": "ad_placement_daily_metrics",
            "campaign_name": "RBK004-MANUAL",
            "placement": "Detail Page on-Amazon",
            "spend": 10,
            "clicks": 20,
            "orders": 1,
            "sales": 24,
        },
        {
            "source_table": "ad_placement_daily_metrics",
            "campaign_name": "RBK004-MANUAL",
            "placement": "Other on-Amazon",
            "spend": 12,
            "clicks": 24,
            "orders": 2,
            "sales": 48,
        },
        {
            "source_table": "ad_placement_daily_metrics",
            "campaign_name": "RBK004-MANUAL",
            "placement": "Top of Search on-Amazon",
            "spend": 18,
            "clicks": 30,
            "orders": 3,
            "sales": 88,
        },
    ]
    monkeypatch.setattr(signal_triage, "load_aba_rows_from_latest_snapshot", lambda: [])

    drilldown = signal_triage._merge_recommended_evidence_drilldown(
        candidate,
        [candidate],
        signal_rows,
    )

    top_ad_group = drilldown["ad_group_diagnosis"]["top_ad_group"]
    assert top_ad_group["placement_count"] == 0
    assert top_ad_group["campaign_placement_count"] == 3
    assert top_ad_group["placement_context_level"] == "campaign"
    assert top_ad_group["campaign_placements"][0]["placement"] == "Top of Search on-Amazon"
    assert "同广告活动广告位 3 条" in drilldown["ad_group_diagnosis"]["summary"]
    assert "不能直接归因到该广告组" in top_ad_group["diagnosis_focus"]
    assert "同广告活动广告位 3 条" in drilldown["summary"]

    blocks = {block["block_id"]: block for block in drilldown["business_evidence_blocks"]}
    assert "同广告活动广告位 3 条" in blocks["ad_group_problem_location"]["detail"]
    assert blocks["context_boundary"]["value"] == "搜索词 1 条 / 广告组级广告位 0 条 / 同广告活动广告位 3 条"


def test_signal_triage_reports_recommended_manual_status_before_human_action(monkeypatch) -> None:
    candidate = make_candidate()
    monkeypatch.setattr(
        signal_triage,
        "build_review_candidates_payload",
        lambda selected_market_id=None: {
            "status": "has_candidates",
            "selected_market_id": selected_market_id,
            "selected_product_scope_id": "parent_asin:B00K4W4AAA",
            "signal_row_count": 702,
            "signal_count": 137,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-30d", "status": "success"},
            "candidates": [candidate],
            "recommended_candidate": candidate,
            "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": "sig-ad-product",
                "action_type": "add_to_review",
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "market_id": 1,
                "review_windows": ["7d", "14d"],
            },
        },
    )
    monkeypatch.setattr(
        signal_triage,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 3,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 4,
            "manual_action_identity_issue_count": 0,
            "review_wait_summary": {
                "status": "waiting_review_window",
                "ready_count": 0,
                "not_ready_count": 4,
                "earliest_due_date": "2026-06-21",
                "review_windows": ["7 天", "14 天"],
                "forbidden_actions": ["不拉取快照", "不保存复盘结论", "不自动执行广告动作"],
            },
            "effects": [],
            "next_action": "当前没有 ready 复盘结果。",
        },
    )
    monkeypatch.setattr(signal_triage, "load_manual_actions", lambda signal_id=None, market_id=None: [])
    monkeypatch.setattr(signal_triage, "build_review_todos", lambda signal_id=None, market_id=None: [])

    payload = signal_triage.build_signal_triage_payload(selected_market_id=1, top=5)

    status = payload["recommended_manual_status"]
    assert status["signal_id"] == "sig-ad-product"
    assert status["object_id"] == "B016EXMW02"
    assert status["has_manual_action"] is False
    assert status["review_todo_count"] == 0
    assert status["ready_review_count"] == 0
    assert "加入复盘" in status["next_action"]
    assert "自动执行广告动作" in status["next_action"]
    wait_summary = payload["review_status"]["review_wait_summary"]
    assert wait_summary["status"] == "waiting_review_window"
    assert wait_summary["earliest_due_date"] == "2026-06-21"
    assert "不拉取快照" in wait_summary["forbidden_actions"]


def test_signal_triage_reports_recommended_manual_status_after_human_action(monkeypatch) -> None:
    candidate = make_candidate()
    monkeypatch.setattr(
        signal_triage,
        "build_review_candidates_payload",
        lambda selected_market_id=None: {
            "status": "has_candidates",
            "selected_market_id": selected_market_id,
            "selected_product_scope_id": "parent_asin:B00K4W4AAA",
            "signal_row_count": 702,
            "signal_count": 137,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-30d", "status": "success"},
            "candidates": [candidate],
            "recommended_candidate": candidate,
            "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": "sig-ad-product",
                "action_type": "add_to_review",
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
                "market_id": 1,
                "review_windows": ["7d", "14d"],
            },
        },
    )
    monkeypatch.setattr(
        signal_triage,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 4,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 6,
            "manual_action_identity_issue_count": 0,
            "effects": [
                {
                    "signal_id": "sig-data-quality",
                    "review_window": "7d",
                    "status": "not_ready",
                    "object_type": "cross",
                    "message": "数据质量信号不适用广告指标前后对比",
                },
                {
                    "signal_id": "sig-ad-product",
                    "review_window": "7d",
                    "status": "not_ready",
                    "object_type": "advertised_product",
                    "message": "缺少处理后 7 天快照",
                },
                {
                    "signal_id": "sig-ad-product",
                    "review_window": "14d",
                    "status": "not_ready",
                    "object_type": "advertised_product",
                    "message": "处理前 14 天窗口不足",
                },
            ],
            "next_action": "当前没有 ready 复盘结果。",
        },
    )
    monkeypatch.setattr(signal_triage, "load_manual_actions", lambda signal_id=None, market_id=None: [SimpleNamespace(id="action-1", shop_id="market:1")])
    monkeypatch.setattr(
        signal_triage,
        "build_review_todos",
        lambda signal_id=None, market_id=None: [
            SimpleNamespace(signal_id="sig-ad-product", shop_id="market:1", review_window="7d"),
            SimpleNamespace(signal_id="sig-ad-product", shop_id="market:1", review_window="14d"),
        ],
    )

    payload = signal_triage.build_signal_triage_payload(selected_market_id=1, top=5)

    status = payload["recommended_manual_status"]
    assert status["has_manual_action"] is True
    assert status["manual_action_count"] == 1
    assert status["has_review_todo"] is True
    assert status["review_todo_count"] == 2
    assert status["ready_review_count"] == 0
    assert "等待 7 天 / 14 天" in status["next_action"]
    assert "等待 7 天 / 14 天" in payload["next_action"]
    assert "优先让运营人工确认" not in payload["next_action"]


def test_signal_triage_points_to_next_unhandled_candidate_when_recommended_is_waiting(monkeypatch) -> None:
    handled = make_candidate()
    handled["signal_id"] = "sig-handled"
    handled["object_id"] = "B016EXMW02"
    handled["object_label"] = "B016EXMW02"
    handled["asin"] = "B016EXMW02"
    unhandled = make_candidate()
    unhandled["signal_id"] = "sig-unhandled"
    unhandled["object_type"] = "sales_product"
    unhandled["object_id"] = "snapshot-row-B06VW5SQ97"
    unhandled["object_label"] = "RBK004-RBK004-2 深蓝"
    unhandled["asin"] = "B06VW5SQ97"
    unhandled["evidence_drilldown"] = {
        "object_label": "RBK004-RBK004-2 深蓝",
        "object_type": "sales_product",
        "direct_ad_product_row_count": 0,
        "search_term_context_count": 0,
        "placement_context_count": 0,
        "campaigns": [],
        "ad_groups": [],
        "metric_summary": {"basis": "sales_product_daily_metrics", "row_count": 1, "orders": 251, "sales": 2433.04},
        "sales_product_summary": {"basis": "sales_product_daily_metrics", "orders": 251, "ad_orders": 18},
        "ad_product_rows": [],
        "boundary": "销售商品强不等于可自动加投；广告承接必须结合广告 ASIN、库存、价格和策略人工复核。",
        "summary": "销售商品证据：订单 251；广告订单 18；该对象应先人工复核广告承接，不自动执行广告动作。",
    }

    monkeypatch.setattr(
        signal_triage,
        "build_review_candidates_payload",
        lambda selected_market_id=None: {
            "status": "has_candidates",
            "selected_market_id": selected_market_id,
            "selected_product_scope_id": "parent_asin:B00K4W4AAA",
            "signal_row_count": 702,
            "signal_count": 137,
            "candidate_count": 2,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-new", "status": "success"},
            "candidates": [handled, unhandled],
            "recommended_candidate": handled,
            "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": "sig-handled",
                "action_type": "add_to_review",
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "market_id": 1,
                "review_windows": ["7d", "14d"],
            },
        },
    )
    monkeypatch.setattr(
        signal_triage,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 1,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 2,
            "manual_action_identity_issue_count": 0,
            "review_feedback": {"total": 0, "by_result": {}, "summary": "暂无已保存复盘记录。"},
            "effects": [
                {
                        "signal_id": "sig-old-handled",
                        "shop_id": "market:1",
                        "market_id": 1,
                        "review_window": "7d",
                    "status": "not_ready",
                    "object_type": "advertised_product",
                    "object_id": "B016EXMW02",
                }
            ],
            "next_action": "复盘窗口尚未到期。",
        },
    )

    def load_manual_actions(signal_id=None, market_id=None):
        if signal_id == "sig-unhandled":
            return []
        return [
            SimpleNamespace(
                id="action-1",
                signal_id="sig-old-handled",
                shop_id="market:1",
                market_id=1,
                object_type="advertised_product",
                object_id="B016EXMW02",
            )
        ]

    monkeypatch.setattr(signal_triage, "load_manual_actions", load_manual_actions)
    monkeypatch.setattr(
        signal_triage,
        "build_review_todos",
        lambda signal_id=None, market_id=None: [
            SimpleNamespace(signal_id="sig-old-handled", shop_id="market:1", market_id=1, object_type="advertised_product", object_id="B016EXMW02", review_window="7d")
        ],
    )
    monkeypatch.setattr(
        signal_triage,
        "load_signal_rows_from_latest_snapshot",
        lambda: [
            {
                "source_table": "sales_product_daily_metrics",
                "parent_asin": "B00K4W4AAA",
                "asin": "B016EXMVZS",
                "product_name": "粉",
                "orders": 6689,
                "sales": 67673.70,
                "ad_orders": 3805,
                "ad_sales": 39175.55,
            },
            {
                "source_table": "sales_product_daily_metrics",
                "parent_asin": "B00K4W4AAA",
                "asin": "B09BQRQ5DT",
                "product_name": "浅粉",
                "orders": 500,
                "sales": 4995.00,
                "ad_orders": 4,
                "ad_sales": 39.96,
            },
            {
                "source_table": "sales_product_daily_metrics",
                "parent_asin": "B00K4W4AAA",
                "asin": "B09BQRQ5DT",
                "product_name": "浅粉",
                "orders": 1,
                "sales": 9.99,
                "ad_orders": 0,
                "ad_sales": 0.28,
            },
            {
                "source_table": "sales_product_daily_metrics",
                "parent_asin": "B00K4W4AAA",
                "asin": "B06VW5SQ97",
                "product_name": "RBK004-RBK004-2 深蓝",
                "orders": 251,
                "sales": 2433.04,
                "ad_orders": 18,
                "ad_sales": 170.76,
            },
            {
                "source_table": "advertised_products",
                "asin": "B016EXMVZS",
                "campaign_name": "RBK004-AUTO",
                "ad_group_name": "RBK004-Auto",
                "cost": 30.00,
                "clicks": 40,
                "orders": 6,
                "sales": 60.00,
            },
            {
                "source_table": "advertised_products",
                "asin": "B09BQRQ5DT",
                "campaign_name": "RBK004-MANUAL",
                "ad_group_name": "RBK004-Exact",
                "cost": 10.00,
                "clicks": 12,
                "orders": 1,
                "sales": 9.99,
            },
        ],
    )

    payload = signal_triage.build_signal_triage_payload(selected_market_id=1, top=5)

    assert payload["recommended_manual_status"]["has_manual_action"] is True
    assert payload["manual_action_preview"]["object_id"] == "B06VW5SQ97"
    preview_checks = {
        item["check_id"]: item
        for item in payload["manual_action_preview"]["preflight_checklist"]
    }
    assert preview_checks["target_identity"]["label"] == "确认复盘对象"
    assert "sales_product / B06VW5SQ97" in preview_checks["target_identity"]["evidence"]
    assert preview_checks["ad_product_coverage"]["label"] == "核对广告 ASIN 覆盖"
    assert "销售表现广告订单不能直接等同于广告商品投放行" in preview_checks["ad_product_coverage"]["evidence"]
    assert preview_checks["business_boundary"]["label"] == "核对库存 / 价格 / 策略边界"
    assert preview_checks["manual_action_boundary"]["label"] == "确认人工动作边界"
    assert payload["next_unhandled_candidate"]["object_label"] == "RBK004-RBK004-2 深蓝"
    assert payload["next_unhandled_candidate"]["stable_object_id"] == "B06VW5SQ97"
    assert payload["next_unhandled_candidate"]["manual_action_preview"]["object_id"] == "B06VW5SQ97"
    assert payload["next_unhandled_candidate"]["manual_action_preview"]["preflight_checklist"][1]["check_id"] == "ad_product_coverage"
    assert payload["next_unhandled_evidence_drilldown"]["object_label"] == "RBK004-RBK004-2 深蓝"
    assert payload["recommended_diagnosis_contract"]["signal_id"] == "sig-handled"
    assert payload["next_unhandled_diagnosis_contract"]["signal_id"] == "sig-unhandled"
    assert payload["diagnosis_contract"]["signal_id"] == "sig-handled"
    assert payload["diagnosis_contract"]["object_id"] == "B016EXMW02"
    assert payload["diagnosis_contract"]["object_label"] == "B016EXMW02"
    contract_sections = {section["section_id"]: section for section in payload["next_unhandled_diagnosis_contract"]["sections"]}
    assert "RBK004-RBK004-2 深蓝" in contract_sections["search_term_opportunity"]["current_judgement"]
    assert "251 单" in contract_sections["search_term_opportunity"]["current_judgement"]
    assert "自动" in contract_sections["search_term_opportunity"]["does_not_prove"]
    sibling_comparison = payload["next_unhandled_evidence_drilldown"]["sibling_comparison"]
    assert sibling_comparison["parent_asin"] == "B00K4W4AAA"
    assert sibling_comparison["sibling_asin_count"] == 3
    assert sibling_comparison["target_order_rank"] == 3
    assert sibling_comparison["top_siblings"][0]["asin"] == "B016EXMVZS"
    sibling_blocks = {
        block["block_id"]: block
        for block in payload["next_unhandled_evidence_drilldown"]["business_evidence_blocks"]
    }
    assert sibling_blocks["parent_sibling_position"]["value"] == "3 个子 ASIN 中订单排名 3/3"
    assert "浅粉" in sibling_blocks["parent_sibling_position"]["detail"]
    ad_product_coverage = payload["next_unhandled_evidence_drilldown"]["ad_product_coverage"]
    assert ad_product_coverage["target_direct_ad_product_row_count"] == 0
    assert ad_product_coverage["parent_advertised_asin_count"] == 2
    assert ad_product_coverage["sibling_asin_count"] == 3
    assert ad_product_coverage["top_advertised_siblings"][0]["asin"] == "B016EXMVZS"
    assert sibling_blocks["ad_product_coverage"]["value"] == "目标广告商品行 0 / 同父体已投 ASIN 2/3"
    assert "销售表现仍有广告订单 18" in sibling_blocks["ad_product_coverage"]["detail"]
    assert "广告商品快照未覆盖目标 ASIN" in sibling_blocks["ad_product_coverage"]["detail"]
    assert "订单 251" in payload["next_unhandled_evidence_drilldown"]["summary"]
    assert "不自动执行广告动作" in payload["next_unhandled_evidence_drilldown"]["summary"]
    assert "RBK004-RBK004-2 深蓝" in payload["next_action"]
    assert "下一个未留痕候选" in payload["next_action"]
    assert "不要自动执行广告动作" in payload["next_action"]


def test_signal_triage_waits_instead_of_showing_data_gap_when_review_effects_are_not_due(monkeypatch) -> None:
    candidate = make_candidate()
    monkeypatch.setattr(
        signal_triage,
        "build_review_candidates_payload",
        lambda selected_market_id=None: {
            "status": "has_candidates",
            "selected_market_id": 1,
            "signal_row_count": 702,
            "signal_count": 137,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-30d", "status": "success"},
            "candidates": [candidate],
            "recommended_candidate": candidate,
            "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": "sig-ad-product",
                "action_type": "add_to_review",
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "market_id": 1,
                "review_windows": ["7d", "14d"],
            },
        },
    )
    monkeypatch.setattr(
        signal_triage,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 1,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 2,
            "manual_action_identity_issue_count": 0,
            "effects": [
                {
                    "signal_id": "sig-ad-product",
                    "review_window": "7d",
                    "status": "not_ready",
                    "object_type": "advertised_product",
                    "message": "复盘效果暂不可计算：缺少处理后 7 天快照",
                    "is_due": False,
                    "due_at": "2026-06-22T00:00:00+00:00",
                },
                {
                    "signal_id": "sig-ad-product",
                    "review_window": "14d",
                    "status": "not_ready",
                    "object_type": "advertised_product",
                    "message": "复盘效果暂不可计算：缺少处理后 14 天快照",
                    "is_due": False,
                    "due_at": "2026-06-29T00:00:00+00:00",
                },
            ],
            "next_action": "复盘窗口尚未到期。",
        },
    )
    monkeypatch.setattr(signal_triage, "load_manual_actions", lambda signal_id=None, market_id=None: [SimpleNamespace(id="action-1")])
    monkeypatch.setattr(
        signal_triage,
        "build_review_todos",
        lambda signal_id=None, market_id=None: [
            SimpleNamespace(signal_id="sig-ad-product", review_window="7d"),
            SimpleNamespace(signal_id="sig-ad-product", review_window="14d"),
        ],
    )

    payload = signal_triage.build_signal_triage_payload(selected_market_id=1, top=5)

    no_ready_blocker = next(blocker for blocker in payload["blockers"] if blocker["code"] == "no_ready_review_effect")
    assert "复盘窗口尚未到期" in no_ready_blocker["message"]
    assert "2026-06-22" in no_ready_blocker["message"]
    assert "复盘阻塞" not in no_ready_blocker["message"]
    assert "缺少处理后" not in no_ready_blocker["message"]


def test_review_readiness_next_action_prioritizes_actionable_ad_product_gap(monkeypatch) -> None:
    todos = [
        SimpleNamespace(signal_id="sig-data-quality", market_id=1, review_window="7d", is_due=True),
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="7d", is_due=True),
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="14d", is_due=True),
    ]

    def fake_effect(signal_id, *, review_window, market_id=None, signal_rows=None):
        if signal_id == "sig-data-quality":
            return SimpleNamespace(
                signal_id=signal_id,
                action_id="manual-action-data-quality",
                market_id=market_id,
                review_window=review_window,
                status="not_ready",
                result="unclear",
                message="复盘效果暂不可计算：数据质量或交叉信号不适用广告指标前后对比，请复查数据是否补齐或更新",
                acted_at="2026-06-14T00:00:00+00:00",
                due_at="2026-06-21T00:00:00+00:00",
                object_type="cross",
                object_id="aba_search_term_snapshot",
                before_start_date=None,
                before_end_date=None,
                after_start_date=None,
                after_end_date=None,
            )
        message = "复盘效果暂不可计算：缺少处理后 7 天快照" if review_window == "7d" else "复盘效果暂不可计算：处理前 14 天窗口不足"
        return SimpleNamespace(
            signal_id=signal_id,
            action_id="manual-action-ad-product",
            action_type="add_to_review",
            shop_id="market:1",
            market_id=market_id,
            review_window=review_window,
            status="not_ready",
            result="unclear",
            message=message,
            acted_at="2026-06-15T00:00:00+00:00",
            due_at="2026-06-22T00:00:00+00:00",
            object_type="advertised_product",
            object_id="B016EXMW02",
            before_start_date="2026-06-08",
            before_end_date="2026-06-14",
            after_start_date=None,
            after_end_date=None,
        )

    monkeypatch.setattr(signal_triage, "load_manual_actions", lambda market_id=None: [SimpleNamespace(signal_id="sig-ad-product")])
    monkeypatch.setattr(signal_triage, "load_review_records", lambda market_id=None: [])
    monkeypatch.setattr(signal_triage, "load_signal_rows_from_success_snapshots", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(signal_triage, "build_review_todos", lambda market_id=None: todos)
    monkeypatch.setattr(signal_triage, "build_review_effect_result", fake_effect)
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-not-ready",
                "status": "success",
                "start_date": "2026-06-08",
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = signal_triage.build_review_readiness_payload(selected_market_id=1)
    next_action = payload["next_action"]

    assert "缺少处理后 7 天快照" in next_action
    assert next_action.index("缺少处理后 7 天快照") < next_action.index("处理前 14 天窗口不足")
    assert next_action.index("处理前 14 天窗口不足") < next_action.index("数据质量或交叉信号")
    assert "先查询积加 API 限流规则" in next_action
    assert "人工触发低频快照" in next_action


def test_review_readiness_next_action_waits_when_review_effects_are_not_due(monkeypatch) -> None:
    evidence_snapshot = [
        SimpleNamespace(label="排查路径", value="Parent ASIN -> 广告 ASIN"),
        SimpleNamespace(label="AI 准入", value="ready_for_manual_confirmation"),
        SimpleNamespace(label="搜索词边界", value="搜索词只说明同广告组上下文"),
        SimpleNamespace(label="广告位边界", value="广告位证据缺口不能自动归因"),
        SimpleNamespace(label="广告商品覆盖", value="B016EXMW02 已回看广告投放证据"),
        SimpleNamespace(label="广告组合流判断", value="B016EXMW02 必须按广告组容器回看搜索词和广告位"),
        SimpleNamespace(label="同组投放商品表现", value="同组广告 ASIN 承接差异已回看"),
        SimpleNamespace(label="证据缺口", value="不能把搜索词或广告位自动归因到 B016EXMW02"),
        SimpleNamespace(label="需要补证", value="补齐投放词维护状态、广告位和主推策略"),
        SimpleNamespace(label="动作边界", value="只允许人工留痕和复盘"),
    ]
    todos = [
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="7d", is_due=False, evidence_snapshot=evidence_snapshot),
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="14d", is_due=False, evidence_snapshot=evidence_snapshot),
    ]

    def fake_effect(signal_id, *, review_window, market_id=None, signal_rows=None):
        message = "复盘效果暂不可计算：缺少处理后 7 天快照" if review_window == "7d" else "复盘效果暂不可计算：缺少处理后 14 天快照"
        return SimpleNamespace(
            signal_id=signal_id,
            action_id="manual-action-ad-product",
            action_type="add_to_review",
            shop_id="market:1",
            market_id=market_id,
            review_window=review_window,
            status="not_ready",
            result="unclear",
            message=message,
            acted_at="2026-06-15T00:00:00+00:00",
            due_at="2026-06-22T00:00:00+00:00" if review_window == "7d" else "2026-06-29T00:00:00+00:00",
            object_type="advertised_product",
            object_id="B016EXMW02",
            object_label="B016EXMW02",
            before_start_date="2026-06-08",
            before_end_date="2026-06-14",
            after_start_date=None,
            after_end_date=None,
        )

    monkeypatch.setattr(signal_triage, "load_manual_actions", lambda market_id=None: [SimpleNamespace(signal_id="sig-ad-product")])
    monkeypatch.setattr(signal_triage, "load_review_records", lambda market_id=None: [])
    monkeypatch.setattr(signal_triage, "load_signal_rows_from_success_snapshots", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(signal_triage, "build_review_todos", lambda market_id=None: todos)
    monkeypatch.setattr(signal_triage, "build_review_effect_result", fake_effect)
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-not-ready",
                "status": "success",
                "start_date": "2026-06-08",
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = signal_triage.build_review_readiness_payload(selected_market_id=1)
    next_action = payload["next_action"]

    assert "复盘窗口尚未到期" in next_action
    assert "2026-06-22" in next_action
    assert "优先处理数据缺口" not in next_action
    assert "缺少处理后" not in next_action
    effect = payload["effects"][0]
    assert effect["action_id"] == "manual-action-ad-product"
    assert effect["action_type"] == "add_to_review"
    assert effect["shop_id"] == "market:1"
    assert effect["object_label"] == "B016EXMW02"
    wait_summary = payload["review_wait_summary"]
    assert wait_summary["status"] == "waiting_review_window"
    assert wait_summary["ready_count"] == 0
    assert wait_summary["not_ready_count"] == 2
    assert wait_summary["earliest_due_date"] == "2026-06-22"
    assert wait_summary["review_windows"] == ["7 天", "14 天"]
    assert wait_summary["next_review_window"] == "7d"
    assert wait_summary["next_object_type"] == "advertised_product"
    assert wait_summary["next_object_id"] == "B016EXMW02"
    assert "不拉取快照" in wait_summary["forbidden_actions"]
    assert "不保存复盘结论" in wait_summary["forbidden_actions"]
    assert "不自动执行广告动作" in wait_summary["forbidden_actions"]


def test_review_readiness_blocks_legacy_todos_missing_search_term_and_placement_boundary(monkeypatch) -> None:
    legacy_snapshot = [
        SimpleNamespace(label="排查路径", value="Parent ASIN -> 广告 ASIN"),
        SimpleNamespace(label="AI 准入", value="ready_for_manual_confirmation"),
    ]
    todos = [
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="7d", is_due=False, evidence_snapshot=legacy_snapshot),
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="14d", is_due=False, evidence_snapshot=legacy_snapshot),
    ]

    def fake_effect(signal_id, *, review_window, market_id=None, signal_rows=None):
        return SimpleNamespace(
            signal_id=signal_id,
            action_id=f"manual-action-{review_window}",
            action_type="add_to_review",
            shop_id="market:1",
            market_id=market_id,
            review_window=review_window,
            status="not_ready",
            result="unclear",
            message=f"复盘效果暂不可计算：{review_window} 复盘窗口尚未到期",
            acted_at="2026-06-15T00:00:00+00:00",
            due_at="2026-06-22T00:00:00+00:00" if review_window == "7d" else "2026-06-29T00:00:00+00:00",
            object_type="advertised_product",
            object_id="B016EXMW02",
            object_label="B016EXMW02",
            before_start_date=None,
            before_end_date=None,
            after_start_date=None,
            after_end_date=None,
        )

    monkeypatch.setattr(signal_triage, "load_manual_actions", lambda market_id=None: [SimpleNamespace(signal_id="sig-ad-product")])
    monkeypatch.setattr(signal_triage, "load_review_records", lambda market_id=None: [])
    monkeypatch.setattr(signal_triage, "load_signal_rows_from_success_snapshots", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(signal_triage, "build_review_todos", lambda market_id=None: todos)
    monkeypatch.setattr(signal_triage, "build_review_effect_result", fake_effect)
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-not-ready",
                "status": "success",
                "start_date": "2026-06-08",
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = signal_triage.build_review_readiness_payload(selected_market_id=1)
    audit = payload["review_identity_audit"]

    assert audit["status"] == "blocked"
    assert audit["missing_evidence_snapshot_count"] == 0
    assert audit["missing_diagnosis_path_count"] == 0
    assert audit["missing_ai_admission_count"] == 0
    assert audit["missing_search_term_boundary_count"] == 2
    assert audit["missing_placement_boundary_count"] == 2
    issue_types = {issue["issue_type"] for issue in audit["issues"]}
    assert "missing_search_term_boundary" in issue_types
    assert "missing_placement_boundary" in issue_types
    assert "missing_ad_product_coverage" in issue_types
    assert "missing_ad_group_synthesis" in issue_types
    assert "missing_ad_group_product_performance" in issue_types
    assert "missing_evidence_gap" in issue_types
    assert "missing_required_evidence" in issue_types
    assert "missing_action_boundary" in issue_types
    assert "缺少搜索词边界 2 条" in payload["review_wait_summary"]["message"]
    assert "缺少广告位边界 2 条" in payload["review_wait_summary"]["message"]
    assert "缺少广告商品覆盖 2 条" in payload["review_wait_summary"]["message"]
    assert payload["review_wait_summary"]["status"] == "blocked_by_review_evidence_gap"
    assert "到期后也不能直接保存复盘记录" in payload["next_action"]


def test_review_readiness_blocks_object_review_chain_gaps(monkeypatch) -> None:
    ad_product_snapshot = [
        SimpleNamespace(label="排查路径", value="Parent ASIN -> 广告 ASIN B016EXMW02"),
        SimpleNamespace(label="AI 准入", value="ready_for_manual_confirmation"),
        SimpleNamespace(label="搜索词边界", value="搜索词只作同广告组上下文"),
        SimpleNamespace(label="广告位边界", value="广告位只作同广告组上下文"),
    ]
    placement_snapshot = [
        SimpleNamespace(label="排查路径", value="Parent ASIN -> 广告位 Top of Search"),
        SimpleNamespace(label="AI 准入", value="ready_for_manual_confirmation"),
        SimpleNamespace(label="搜索词边界", value="搜索词只作背景"),
        SimpleNamespace(label="广告位边界", value="Top of Search 只说明流量位置表现"),
    ]
    todos = [
        SimpleNamespace(
            signal_id="sig-ad-product",
            action_id="manual-action-ad-product",
            market_id=1,
            object_type="advertised_product",
            object_id="B016EXMW02",
            object_label="B016EXMW02",
            review_window="7d",
            is_due=False,
            evidence_snapshot=ad_product_snapshot,
        ),
        SimpleNamespace(
            signal_id="sig-placement",
            action_id="manual-action-placement",
            market_id=1,
            object_type="placement",
            object_id="Top of Search",
            object_label="Top of Search",
            review_window="7d",
            is_due=False,
            evidence_snapshot=placement_snapshot,
        ),
    ]

    def fake_effect(signal_id, *, review_window, market_id=None, signal_rows=None):
        if signal_id == "sig-placement":
            return SimpleNamespace(
                signal_id=signal_id,
                action_id="manual-action-placement",
                action_type="add_to_review",
                shop_id="market:1",
                market_id=market_id,
                review_window=review_window,
                status="not_ready",
                result="unclear",
                message="复盘效果暂不可计算：7d 复盘窗口尚未到期",
                acted_at="2026-06-15T00:00:00+00:00",
                due_at="2026-06-22T00:00:00+00:00",
                object_type="placement",
                object_id="Top of Search",
                object_label="Top of Search",
                before_start_date=None,
                before_end_date=None,
                after_start_date=None,
                after_end_date=None,
            )
        return SimpleNamespace(
            signal_id=signal_id,
            action_id="manual-action-ad-product",
            action_type="add_to_review",
            shop_id="market:1",
            market_id=market_id,
            review_window=review_window,
            status="not_ready",
            result="unclear",
            message="复盘效果暂不可计算：7d 复盘窗口尚未到期",
            acted_at="2026-06-15T00:00:00+00:00",
            due_at="2026-06-22T00:00:00+00:00",
            object_type="advertised_product",
            object_id="B016EXMW02",
            object_label="B016EXMW02",
            before_start_date=None,
            before_end_date=None,
            after_start_date=None,
            after_end_date=None,
        )

    monkeypatch.setattr(signal_triage, "load_manual_actions", lambda market_id=None: [SimpleNamespace(signal_id="sig-ad-product"), SimpleNamespace(signal_id="sig-placement")])
    monkeypatch.setattr(signal_triage, "load_review_records", lambda market_id=None: [])
    monkeypatch.setattr(signal_triage, "load_signal_rows_from_success_snapshots", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(signal_triage, "build_review_todos", lambda market_id=None: todos)
    monkeypatch.setattr(signal_triage, "build_review_effect_result", fake_effect)
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-not-ready",
                "status": "success",
                "start_date": "2026-06-08",
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = signal_triage.build_review_readiness_payload(selected_market_id=1)
    audit = payload["review_identity_audit"]

    assert audit["status"] == "blocked"
    assert audit["missing_ad_product_coverage_count"] == 1
    assert audit["missing_placement_performance_count"] == 1
    assert audit["missing_ad_group_synthesis_count"] == 1
    assert audit["missing_ad_group_product_performance_count"] == 1
    assert audit["missing_evidence_gap_count"] == 2
    assert audit["missing_required_evidence_count"] == 2
    assert audit["missing_action_boundary_count"] == 2
    issue_types = [issue["issue_type"] for issue in audit["issues"]]
    assert "missing_ad_product_coverage" in issue_types
    assert "missing_placement_performance" in issue_types
    assert issue_types.count("missing_evidence_gap") == 2
    assert "缺少广告商品覆盖 1 条" in payload["review_wait_summary"]["message"]
    assert "缺少广告位表现 1 条" in payload["review_wait_summary"]["message"]
    assert "缺少动作边界 2 条" in payload["review_wait_summary"]["message"]


def test_review_readiness_blocks_legacy_todos_without_evidence_snapshot(monkeypatch) -> None:
    todos = [
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="7d", is_due=False, evidence_snapshot=[]),
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="14d", is_due=False, evidence_snapshot=[]),
    ]

    def fake_effect(signal_id, *, review_window, market_id=None, signal_rows=None):
        return SimpleNamespace(
            signal_id=signal_id,
            action_id=f"manual-action-{review_window}",
            action_type="add_to_review",
            shop_id="market:1",
            market_id=market_id,
            review_window=review_window,
            status="not_ready",
            result="unclear",
            message=f"复盘效果暂不可计算：{review_window} 复盘窗口尚未到期",
            acted_at="2026-06-15T00:00:00+00:00",
            due_at="2026-06-22T00:00:00+00:00" if review_window == "7d" else "2026-06-29T00:00:00+00:00",
            object_type="advertised_product",
            object_id="B016EXMW02",
            object_label="B016EXMW02",
            before_start_date=None,
            before_end_date=None,
            after_start_date=None,
            after_end_date=None,
        )

    monkeypatch.setattr(signal_triage, "load_manual_actions", lambda market_id=None: [SimpleNamespace(signal_id="sig-ad-product")])
    monkeypatch.setattr(signal_triage, "load_review_records", lambda market_id=None: [])
    monkeypatch.setattr(signal_triage, "load_signal_rows_from_success_snapshots", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(signal_triage, "build_review_todos", lambda market_id=None: todos)
    monkeypatch.setattr(signal_triage, "build_review_effect_result", fake_effect)
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-not-ready",
                "status": "success",
                "start_date": "2026-06-08",
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = signal_triage.build_review_readiness_payload(selected_market_id=1)
    audit = payload["review_identity_audit"]

    assert audit["status"] == "blocked"
    assert audit["missing_evidence_snapshot_count"] == 2
    assert audit["missing_diagnosis_path_count"] == 2
    assert audit["missing_ai_admission_count"] == 2
    assert audit["missing_search_term_boundary_count"] == 2
    assert audit["missing_placement_boundary_count"] == 2
    assert audit["can_save_review_records_now"] is False
    assert {issue["issue_type"] for issue in audit["issues"]} == {"missing_evidence_snapshot"}
    assert "缺少 evidence_snapshot 2 条" in payload["next_action"]
    assert "到期后也不能直接保存复盘记录" in payload["next_action"]
    assert payload["rule_improvement"]["status"] == "blocked_by_review_evidence_gap"
    assert "dry-run 作废旧待办" in payload["rule_improvement"]["next_step"]
    assert "重新人工留痕" in payload["rule_improvement"]["next_step"]
    assert "不能补写历史 evidence_snapshot" in payload["rule_improvement"]["next_step"]
    assert "补录" not in payload["rule_improvement"]["next_step"]
    assert payload["review_wait_summary"]["status"] == "blocked_by_review_evidence_gap"
    assert "缺少 evidence_snapshot 2 条" in payload["review_wait_summary"]["message"]
    assert "到期后也不能直接保存复盘记录" in payload["review_wait_summary"]["next_step"]
    assert "dry-run 作废旧待办" in payload["review_wait_summary"]["next_step"]
    assert "补录" not in payload["review_wait_summary"]["next_step"]
    assert "不静默补写历史 evidence_snapshot" in payload["review_wait_summary"]["forbidden_actions"]
    assert "不拉取快照" not in payload["review_wait_summary"]["forbidden_actions"]
    assert payload["effects"][0]["evidence_snapshot_count"] == 0


def test_review_readiness_summarizes_saved_review_records_as_rule_feedback(monkeypatch) -> None:
    review_records = [
        SimpleNamespace(signal_id="sig-opportunity", result="improved", object_type="advertised_product", object_id="B016EXMVZS", object_label="B016EXMVZS", review_window="7d", review_note="处理有效"),
        SimpleNamespace(signal_id="sig-opportunity", result="improved", object_type="advertised_product", object_id="B016EXMW02", object_label="B016EXMW02", review_window="14d", review_note="继续观察"),
        SimpleNamespace(
            id="review-record-worse-7d",
            signal_id="sig-anomaly",
            action_id="manual-action-worse",
            result="worse",
            object_type="search_term",
            object_id="12 month sunglasses",
            object_label="12 month sunglasses",
            review_window="7d",
            before_start_date="2026-06-01",
            before_end_date="2026-06-07",
            after_start_date="2026-06-08",
            after_end_date="2026-06-14",
            before_metrics={"spend": 28.5, "orders": 0},
            after_metrics={"spend": 31.2, "orders": 0},
            evidence_snapshot=[
                SimpleNamespace(
                    label="排查路径",
                    value="Parent 经营盘子 -> 广告 ASIN -> 广告组 -> 投放词 / 搜索词 / 广告位",
                    detail="保存复盘前必须回看原始广告诊断路径。",
                    source="business_rule",
                ),
                SimpleNamespace(
                    label="AI 准入",
                    value="可进入人工确认 / ready_for_manual_confirmation / 候选 1 个 / 允许人工留痕",
                    detail="准入只证明允许人工留痕，不代表系统会自动执行广告动作。",
                    source="actionability_status",
                ),
                SimpleNamespace(label="广告组合流判断", value="同一广告组内搜索词表现优先人工复核", source="business_rule"),
                SimpleNamespace(label="同组投放商品表现", value="同组广告 ASIN 2 个，需要人工判断承接差异", source="advertised_products"),
                SimpleNamespace(
                    label="逐投放上下文",
                    value="优先复核广告组：RBK004-beach essentials-精准 / 投放词 beach essentials",
                    detail="规则反馈只能回看当时逐投放复核顺序，不能自动加词、否词或调价。",
                    source="ad_search_term_daily_metrics",
                ),
                SimpleNamespace(label="投放词证据", value="beach essentials / exact", source="ad_search_term_daily_metrics"),
                SimpleNamespace(label="搜索词边界", value="12 month sunglasses 只说明当前广告组用户搜索表现", source="business_rule"),
                SimpleNamespace(label="广告位边界", value="缺少广告位上下文，不能判断广告位影响", source="business_rule"),
                SimpleNamespace(label="ABA 背景", value="beach essentials / 2026-05-10 到 2026-05-16", source="ABA导出"),
            ],
            review_note="建议没有改善",
        ),
        SimpleNamespace(signal_id="sig-missing", result="unclear", object_type="sales_product", object_id="B06VW5SQ97", object_label="RBK004-RBK004-2 深蓝", review_window="7d", review_note="证据不足"),
    ]

    monkeypatch.setattr(
        signal_triage,
        "load_manual_actions",
        lambda market_id=None: [
            SimpleNamespace(signal_id="sig-ad-product"),
            SimpleNamespace(
                id="manual-action-worse",
                signal_id="sig-anomaly",
                evidence_snapshot=[
                    SimpleNamespace(label="Parent ASIN入口", value="Parent ASIN B00K4W4AAA 下只复核有广告数据的搜索词表现。"),
                    SimpleNamespace(label="语义组", value="规则语义：海滩出行用品"),
                    SimpleNamespace(label="搜索词", value="12 month sunglasses"),
                    SimpleNamespace(label="ABA语义参考词", value="beach essentials"),
                    SimpleNamespace(label="ABA周期", value="2026-05-10 到 2026-05-16"),
                    SimpleNamespace(label="ABA匹配边界", value="ABA 是站点级，只按站点 + 周期 + 搜索词匹配。"),
                ],
            ),
        ],
    )
    monkeypatch.setattr(signal_triage, "load_review_records", lambda market_id=None: review_records)
    monkeypatch.setattr(signal_triage, "load_signal_rows_from_success_snapshots", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(
        signal_triage,
        "_current_signals",
        lambda signal_rows, selected_market_id=None: [
            SimpleNamespace(id="sig-opportunity", signal_type="opportunity"),
            SimpleNamespace(
                id="sig-anomaly",
                signal_type="anomaly",
                object_type="search_term",
                evidence={
                    "primary_object": {"label": "12 month sunglasses"},
                    "source_rows": [
                        {
                            "source_table": "ad_search_term_daily_metrics",
                            "search_term": "12 month sunglasses",
                            "campaign_name": "SP Beach",
                            "ad_group_name": "Beach Essentials Exact",
                            "targeting_text": "beach essentials",
                            "spend": 28.5,
                            "clicks": 42,
                            "orders": 0,
                        }
                    ],
                },
            ),
        ],
    )
    monkeypatch.setattr(signal_triage, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-with-review-records",
                "status": "success",
                "start_date": "2026-06-01",
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = signal_triage.build_review_readiness_payload(selected_market_id=1)

    feedback = payload["review_feedback"]
    assert feedback["total"] == 4
    assert feedback["by_result"] == {"improved": 2, "worse": 1, "unclear": 1}
    assert feedback["by_signal_type"] == {"opportunity": 2, "anomaly": 1, "unknown": 1}
    assert feedback["sample_sort"]["order"] == ["worse", "no_change", "unclear", "improved"]
    assert "worse 优先" in feedback["sample_sort"]["reason"]
    assert "improved 只作为保留口径参考" in feedback["sample_sort"]["reason"]
    assert feedback["action_boundaries"]["worse"]["allowed_reviews"] == ["复核阈值", "复核证据来源", "复核建议动作"]
    assert "自动改规则" in feedback["action_boundaries"]["worse"]["forbidden_actions"]
    assert "自动调价" in feedback["action_boundaries"]["worse"]["forbidden_actions"]
    assert feedback["action_boundaries"]["improved"]["allowed_reviews"] == ["保留当前解释口径", "沉淀正向样本"]
    checklist = {item["check_id"]: item for item in feedback["closure_checklist"]}
    assert checklist["result_distribution"]["status"] == "ready"
    assert "worse 1" in checklist["result_distribution"]["evidence"]
    assert checklist["sample_priority"]["status"] == "ready"
    assert "worse -> no_change -> unclear -> improved" in checklist["sample_priority"]["evidence"]
    assert checklist["review_record_trace"]["status"] == "partial"
    assert "1 / 4" in checklist["review_record_trace"]["evidence"]
    assert "review_record_id / action_id / 指标窗口" in checklist["review_record_trace"]["evidence"]
    assert checklist["review_record_evidence_snapshot"]["status"] == "partial"
    assert "1 / 4 条样本带保存快照" in checklist["review_record_evidence_snapshot"]["evidence"]
    assert "1 / 4 条可回看 AI 准入" in checklist["review_record_evidence_snapshot"]["evidence"]
    assert checklist["evidence_trace"]["status"] == "partial"
    assert "1 / 4" in checklist["evidence_trace"]["evidence"]
    assert checklist["action_boundary"]["status"] == "ready"
    assert "不自动改规则" in checklist["action_boundary"]["evidence"]
    assert "不自动执行广告动作" in checklist["action_boundary"]["evidence"]
    assert feedback["records"][0]["result"] == "worse"
    assert feedback["records"][0]["signal_type"] == "anomaly"
    assert feedback["records"][0]["review_record_id"] == "review-record-worse-7d"
    assert feedback["records"][0]["action_id"] == "manual-action-worse"
    assert feedback["records"][0]["object_label"] == "12 month sunglasses"
    assert feedback["records"][0]["metric_window"] == {
        "before": "2026-06-01 至 2026-06-07",
        "after": "2026-06-08 至 2026-06-14",
    }
    assert feedback["records"][0]["metric_snapshot"]["before"]["spend"] == 28.5
    assert feedback["records"][0]["metric_snapshot"]["after"]["spend"] == 31.2
    assert feedback["records"][0]["review_note"] == "建议没有改善"
    assert "排序依据：worse 优先" in feedback["records"][0]["sort_reason"]
    assert feedback["records"][0]["evidence_snapshot_count"] == 9
    assert feedback["records"][0]["diagnosis_snapshot"]["label"] == "排查路径"
    assert feedback["records"][0]["ai_admission_snapshot"]["value"].startswith("可进入人工确认")
    assert feedback["records"][0]["ai_admission_snapshot"]["source"] == "actionability_status"
    assert feedback["records"][0]["action_boundary"]["result"] == "worse"
    assert feedback["records"][0]["action_boundary"]["allowed_reviews"] == ["复核阈值", "复核证据来源", "复核建议动作"]
    assert "不自动改规则" in feedback["records"][0]["action_boundary"]["boundary"]
    assert "不自动执行广告动作" in feedback["records"][0]["action_boundary"]["boundary"]
    assert feedback["records"][0]["evidence_drilldown"]["summary"].startswith("搜索词表现行 1 条")
    assert feedback["records"][0]["evidence_drilldown"]["metric_summary"]["basis"] == "search_term_daily_metrics"
    assert "花费 28.50" in feedback["records"][0]["evidence_drilldown"]["summary"]
    assert "不能自动归因" in feedback["records"][0]["evidence_drilldown"]["boundary"]
    feedback_blocks = {block["block_id"]: block for block in feedback["records"][0]["evidence_drilldown"]["business_evidence_blocks"]}
    assert "search_term_metric_summary" in feedback_blocks
    assert "ad_product_coverage" not in feedback_blocks
    assert [group["group_id"] for group in feedback["records"][0]["evidence_groups"]] == [
        "parent_search_term_review",
        "ad_group_boundary",
        "targeting_context",
        "placement_boundary",
        "snapshot_review_chain",
        "attribution_boundary",
    ]
    assert "当前诊断入口下广告用户搜索词表现行 1 条" in feedback["records"][0]["evidence_groups"][0]["value"]
    assert "广告活动 1 个 / 广告组 1 个" in feedback["records"][0]["evidence_groups"][1]["value"]
    assert "1 个投放词 / 搜索词表现行 1 条" in feedback["records"][0]["evidence_groups"][2]["value"]
    assert "广告位上下文 0 条" in feedback["records"][0]["evidence_groups"][3]["value"]
    assert "已覆盖 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 投放词证据 / 搜索词边界 / 广告位边界 / ABA 背景" in feedback["records"][0]["evidence_groups"][4]["value"]
    assert "不能自动归因" in feedback["records"][0]["evidence_groups"][5]["value"]
    assert feedback["records"][0]["diagnosis_path"]["path"].startswith("搜索词 -> 广告活动 / 广告组")
    snapshot_without_ad_context = [
        item
        for item in feedback["records"][0]["evidence_snapshot"]
        if item["label"] != "逐投放上下文"
    ]
    assert "缺口：逐投放上下文" in signal_triage._review_feedback_search_term_snapshot_coverage(snapshot_without_ad_context)
    diagnosis_steps = {step["step_id"]: step for step in feedback["records"][0]["diagnosis_path"]["steps"]}
    assert "search_term_metric_summary" in diagnosis_steps
    assert "search_term_context" in diagnosis_steps
    assert "targeting_context" in diagnosis_steps
    assert "placement_context_gap" in diagnosis_steps
    assert "不能自动归因" in feedback["records"][0]["diagnosis_path"]["boundary"]
    assert "不自动执行广告动作" in feedback["records"][0]["diagnosis_path"]["next_manual_step"]
    assert feedback["candidate_groups"][0]["group_type"] == "search_intent"
    assert feedback["candidate_groups"][0]["group_label"] == "规则语义：海滩出行用品"
    assert feedback["candidate_groups"][0]["aba_reference_term"] == "beach essentials"
    assert feedback["candidate_groups"][0]["aba_period"] == "2026-05-10 到 2026-05-16"
    assert feedback["candidate_groups"][0]["sample_parent_scopes"] == ["Parent ASIN B00K4W4AAA 下只复核有广告数据的搜索词表现。"]
    assert feedback["candidate_groups"][0]["sample_search_terms"] == ["12 month sunglasses"]
    assert feedback["candidate_groups"][0]["sample_ad_contexts"] == ["优先复核广告组：RBK004-beach essentials-精准 / 投放词 beach essentials"]
    assert feedback["candidate_groups"][0]["by_result"] == {"worse": 1}
    assert "复核该规则反馈样本上下文（广告搜索词表现复核）的阈值、证据来源和建议动作" in feedback["candidate_groups"][0]["recommendation"]
    assert feedback["candidate_groups"][0]["action_boundary"]["allowed_reviews"] == ["复核阈值", "复核证据来源", "复核建议动作"]
    assert "自动改规则" in feedback["candidate_groups"][0]["action_boundary"]["forbidden_actions"]
    assert "不是广告处理对象" in feedback["candidate_groups"][0]["boundary"]
    assert "不自动改规则" in feedback["candidate_groups"][0]["boundary"]
    assert "不自动执行广告动作" in feedback["candidate_groups"][0]["boundary"]
    assert feedback["records"][1]["result"] == "unclear"
    assert feedback["records"][1]["signal_type"] == "unknown"
    assert feedback["records"][1]["object_type"] == "sales_product"
    assert feedback["records"][1]["evidence_drilldown"] is None
    assert feedback["records"][1]["evidence_groups"] == []
    assert "unclear 排在 improved 前" in feedback["records"][1]["sort_reason"]
    assert feedback["records"][1]["action_boundary"]["allowed_reviews"] == ["补复盘样本", "补指标口径", "复核数据完整性"]
    assert len(feedback["records"]) == 4
    assert "improved 2" in feedback["summary"]
    assert "worse 1" in feedback["summary"]
    assert "opportunity 2" in feedback["summary"]
    assert "anomaly 1" in feedback["summary"]
    assert "只进入解释层" in feedback["rule_feedback"]
    assert "不自动" in feedback["rule_feedback"]
    assert "已有保存复盘记录" in payload["next_action"]
    assert "不自动调整广告动作或规则" in payload["next_action"]
    assert payload["rule_improvement"]["status"] == "saved_feedback"
    assert payload["rule_improvement"]["can_auto_change_rules"] is False
    assert payload["rule_improvement"]["can_auto_execute_ads"] is False
    assert "只进入解释层" in payload["rule_improvement"]["reason"]


def test_review_readiness_groups_saved_review_record_snapshot_without_manual_action(monkeypatch) -> None:
    review_records = [
        SimpleNamespace(
            id="review-record-snapshot-only",
            signal_id="sig-search-term",
            action_id="manual-action-missing",
            result="worse",
            object_type="search_term",
            object_id="beach essentials",
            object_label="beach essentials",
            review_window="7d",
            before_start_date="2026-06-01",
            before_end_date="2026-06-07",
            after_start_date="2026-06-08",
            after_end_date="2026-06-14",
            before_metrics={"spend": 22.0, "orders": 2},
            after_metrics={"spend": 35.0, "orders": 1},
            evidence_snapshot=[
                SimpleNamespace(label="排查路径", value="Parent 经营盘子 -> 广告 ASIN -> 广告组 -> 搜索词"),
                SimpleNamespace(label="AI 准入", value="可进入人工确认 / ready_for_manual_confirmation / 候选 1 个"),
                SimpleNamespace(label="Parent ASIN入口", value="Parent ASIN B00K4W4AAA 下只复核有广告数据的搜索词表现。"),
                SimpleNamespace(label="语义组", value="规则语义：海滩出行用品"),
                SimpleNamespace(label="逐投放上下文", value="广告组 RBK004-beach essentials-精准 / 投放词 beach essentials"),
                SimpleNamespace(label="ABA语义参考词", value="beach essentials"),
                SimpleNamespace(label="ABA周期", value="2026-05-10 到 2026-05-16"),
                SimpleNamespace(label="ABA匹配边界", value="ABA 是站点级，只按站点 + 周期 + 搜索词匹配。"),
            ],
            review_note="复盘后表现变差",
        )
    ]

    monkeypatch.setattr(signal_triage, "load_manual_actions", lambda market_id=None: [])
    monkeypatch.setattr(signal_triage, "load_review_records", lambda market_id=None: review_records)
    monkeypatch.setattr(signal_triage, "load_signal_rows_from_success_snapshots", lambda: [])
    monkeypatch.setattr(signal_triage, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-with-review-record-only",
                "status": "success",
                "start_date": "2026-06-01",
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = signal_triage.build_review_readiness_payload(selected_market_id=1)

    feedback = payload["review_feedback"]
    assert feedback["total"] == 1
    assert feedback["manual_action_context_coverage"]["total"] == 0
    assert feedback["candidate_groups"][0]["group_type"] == "search_intent"
    assert feedback["candidate_groups"][0]["group_label"] == "规则语义：海滩出行用品"
    assert feedback["candidate_groups"][0]["aba_reference_term"] == "beach essentials"
    assert feedback["candidate_groups"][0]["aba_period"] == "2026-05-10 到 2026-05-16"
    assert feedback["candidate_groups"][0]["aba_match_boundary"] == "ABA 是站点级，只按站点 + 周期 + 搜索词匹配。"
    assert feedback["candidate_groups"][0]["sample_review_record_ids"] == ["review-record-snapshot-only"]
    assert feedback["candidate_groups"][0]["sample_action_ids"] == ["manual-action-missing"]
    assert feedback["candidate_groups"][0]["sample_parent_scopes"] == ["Parent ASIN B00K4W4AAA 下只复核有广告数据的搜索词表现。"]
    assert feedback["candidate_groups"][0]["sample_search_terms"] == ["beach essentials"]
    assert feedback["candidate_groups"][0]["sample_ad_contexts"] == ["广告组 RBK004-beach essentials-精准 / 投放词 beach essentials"]
    assert feedback["candidate_groups"][0]["by_result"] == {"worse": 1}
    assert "复核该规则反馈样本上下文（广告搜索词表现复核）" in feedback["candidate_groups"][0]["recommendation"]
    assert "不是广告处理对象" in feedback["candidate_groups"][0]["boundary"]
    assert "不自动执行广告动作" in feedback["candidate_groups"][0]["boundary"]


def test_review_readiness_shows_manual_action_context_coverage_without_saved_review_records(monkeypatch) -> None:
    monkeypatch.setattr(
        signal_triage,
        "load_manual_actions",
        lambda market_id=None: [
            SimpleNamespace(
                id="manual-action-ad-product",
                signal_id="sig-ad-product",
                action_type="add_to_review",
                evidence_snapshot=[],
            ),
            SimpleNamespace(
                id="manual-action-beach",
                signal_id="sig-search-term",
                action_type="add_to_review",
                evidence_snapshot=[
                    SimpleNamespace(label="语义组", value="规则语义：海滩出行用品"),
                    SimpleNamespace(label="ABA语义参考词", value="beach essentials"),
                ],
            ),
        ],
    )
    monkeypatch.setattr(signal_triage, "load_review_records", lambda market_id=None: [])
    monkeypatch.setattr(signal_triage, "load_signal_rows_from_success_snapshots", lambda: [])
    monkeypatch.setattr(signal_triage, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(
        signal_triage,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-without-review-records",
                "status": "success",
                "start_date": "2026-06-01",
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = signal_triage.build_review_readiness_payload(selected_market_id=1)

    feedback = payload["review_feedback"]
    assert feedback["total"] == 0
    assert feedback["manual_action_context_coverage"] == {
        "total": 2,
        "with_evidence_snapshot": 1,
        "with_search_intent": 1,
        "with_aba_reference": 1,
    }
    checklist = {item["check_id"]: item for item in feedback["closure_checklist"]}
    assert checklist["manual_action_context"]["status"] == "partial"
    assert "人工动作 2 条" in checklist["manual_action_context"]["evidence"]
    assert "证据快照 1 条" in checklist["manual_action_context"]["evidence"]
    assert "Parent ASIN 广告搜索词表现复核 1 条" in checklist["manual_action_context"]["evidence"]
    assert "ABA 站点级参考 1 条" in checklist["manual_action_context"]["evidence"]


def test_signal_triage_matches_recommended_manual_status_by_stable_object(monkeypatch) -> None:
    candidate = make_candidate()
    current_signal_id = "sig-ad-product-new-snapshot"
    previous_signal_id = "sig-ad-product-old-snapshot"
    candidate["signal_id"] = current_signal_id

    monkeypatch.setattr(
        signal_triage,
        "build_review_candidates_payload",
        lambda selected_market_id=None: {
            "status": "has_candidates",
            "selected_market_id": selected_market_id,
            "selected_product_scope_id": "parent_asin:B00K4W4AAA",
            "signal_row_count": 702,
            "signal_count": 137,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-new", "status": "success"},
            "candidates": [candidate],
            "recommended_candidate": candidate,
            "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": current_signal_id,
                "action_type": "add_to_review",
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
                "market_id": 1,
                "review_windows": ["7d", "14d"],
            },
        },
    )
    monkeypatch.setattr(
        signal_triage,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 1,
            "review_record_count": 1,
            "ready_count": 0,
            "not_ready_count": 2,
            "manual_action_identity_issue_count": 0,
            "review_feedback": {
                "total": 1,
                "by_result": {"improved": 1},
                "summary": "已保存 1 条复盘记录：improved 1。",
                "rule_feedback": "复盘反馈只进入解释层，不自动调整广告动作或规则。",
            },
            "rule_improvement": {
                "status": "saved_feedback",
                "can_auto_change_rules": False,
                "can_auto_execute_ads": False,
            },
            "effects": [
                {
                        "signal_id": previous_signal_id,
                        "shop_id": "market:1",
                        "market_id": 1,
                        "review_window": "7d",
                    "status": "not_ready",
                    "object_type": "advertised_product",
                    "object_id": "B016EXMW02",
                },
                {
                        "signal_id": previous_signal_id,
                        "shop_id": "market:1",
                        "market_id": 1,
                        "review_window": "14d",
                    "status": "not_ready",
                    "object_type": "advertised_product",
                    "object_id": "B016EXMW02",
                },
            ],
            "next_action": "当前没有 ready 复盘结果。",
        },
    )

    def load_manual_actions(signal_id=None, market_id=None):
        if signal_id == current_signal_id:
            return []
        return [
            SimpleNamespace(
                id="action-1",
                signal_id=previous_signal_id,
                shop_id="market:1",
                market_id=1,
                object_type="advertised_product",
                object_id="B016EXMW02",
            )
        ]

    def build_review_todos(signal_id=None, market_id=None):
        if signal_id == current_signal_id:
            return []
        return [
            SimpleNamespace(signal_id=previous_signal_id, shop_id="market:1", market_id=1, object_type="advertised_product", object_id="B016EXMW02", review_window="7d"),
            SimpleNamespace(signal_id=previous_signal_id, shop_id="market:1", market_id=1, object_type="advertised_product", object_id="B016EXMW02", review_window="14d"),
        ]

    monkeypatch.setattr(signal_triage, "load_manual_actions", load_manual_actions)
    monkeypatch.setattr(signal_triage, "build_review_todos", build_review_todos)

    payload = signal_triage.build_signal_triage_payload(selected_market_id=1, top=5)

    status = payload["recommended_manual_status"]
    assert status["signal_id"] == current_signal_id
    assert status["object_id"] == "B016EXMW02"
    assert status["has_manual_action"] is True
    assert status["manual_action_count"] == 1
    assert status["has_review_todo"] is True
    assert status["review_todo_count"] == 2
    assert status["ready_review_count"] == 0
    assert status["review_windows"] == ["14d", "7d"]
    assert payload["review_status"]["review_feedback"]["by_result"] == {"improved": 1}
    assert "不自动" in payload["review_status"]["review_feedback"]["rule_feedback"]
    assert payload["review_status"]["rule_improvement"]["status"] == "saved_feedback"
    assert payload["review_status"]["rule_improvement"]["can_auto_change_rules"] is False
    assert "等待 7 天 / 14 天" in status["next_action"]
    assert "等待 7 天 / 14 天" in payload["next_action"]
    assert "优先让运营人工确认" not in payload["next_action"]


def test_signal_triage_does_not_match_recommended_manual_status_from_wrong_shop(monkeypatch) -> None:
    candidate = make_candidate()
    current_signal_id = "sig-ad-product-current-shop"
    previous_signal_id = "sig-ad-product-other-shop"
    candidate["signal_id"] = current_signal_id

    monkeypatch.setattr(
        signal_triage,
        "build_review_candidates_payload",
        lambda selected_market_id=None: {
            "status": "has_candidates",
            "selected_market_id": selected_market_id,
            "selected_product_scope_id": "parent_asin:B00K4W4AAA",
            "signal_row_count": 702,
            "signal_count": 137,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-current", "status": "success"},
            "candidates": [candidate],
            "recommended_candidate": candidate,
            "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": current_signal_id,
                "action_type": "add_to_review",
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "market_id": 1,
                "review_windows": ["7d", "14d"],
            },
        },
    )
    monkeypatch.setattr(
        signal_triage,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 1,
            "review_record_count": 0,
            "ready_count": 1,
            "not_ready_count": 0,
            "manual_action_identity_issue_count": 0,
            "effects": [
                {
                    "signal_id": previous_signal_id,
                    "shop_id": "market:2",
                    "market_id": 1,
                    "review_window": "7d",
                    "status": "ready",
                    "object_type": "advertised_product",
                    "object_id": "B016EXMW02",
                }
            ],
            "next_action": "当前有 ready 复盘结果。",
        },
    )

    def load_manual_actions(signal_id=None, market_id=None):
        if signal_id == current_signal_id:
            return []
        return [
            SimpleNamespace(
                id="action-other-shop",
                signal_id=previous_signal_id,
                shop_id="market:2",
                market_id=1,
                object_type="advertised_product",
                object_id="B016EXMW02",
            )
        ]

    def build_review_todos(signal_id=None, market_id=None):
        if signal_id == current_signal_id:
            return []
        return [
            SimpleNamespace(
                signal_id=previous_signal_id,
                shop_id="market:2",
                market_id=1,
                object_type="advertised_product",
                object_id="B016EXMW02",
                review_window="7d",
            )
        ]

    monkeypatch.setattr(signal_triage, "load_manual_actions", load_manual_actions)
    monkeypatch.setattr(signal_triage, "build_review_todos", build_review_todos)

    payload = signal_triage.build_signal_triage_payload(selected_market_id=1, top=5)

    status = payload["recommended_manual_status"]
    assert status["shop_id"] == "market:1"
    assert status["has_manual_action"] is False
    assert status["manual_action_count"] == 0
    assert status["has_review_todo"] is False
    assert status["review_todo_count"] == 0
    assert status["ready_review_count"] == 0
    assert "加入复盘" in status["next_action"]
    assert "优先让运营人工确认" in payload["next_action"]
