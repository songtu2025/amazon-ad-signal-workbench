from collections import defaultdict
from datetime import date, datetime, timezone
import re
from typing import Any

from app.models.snapshots import SnapshotReadiness, SnapshotStatus
from app.models.signals import (
    AdObjectRef,
    AiSignal,
    ConfidenceLevel,
    DataSourceRef,
    EvidenceItem,
    EvidencePackage,
    FreshnessStatus,
    MetricSnapshot,
    ObjectType,
    SearchIntentSummary,
    SearchIntentTopTerm,
    SignalPriority,
    SignalType,
    SuggestedAction,
)


ABA_HOT_TERM_RANK_LIMIT = 1000
ABA_HOT_TERM_CLICK_THRESHOLD = 40
ABA_PHRASE_CONTEXT_MIN_WORDS = 2
SALES_STRONG_ORDER_THRESHOLD = 3
AD_WEAK_ORDER_THRESHOLD = 1
AD_GROUP_SPEND_CONCENTRATION_THRESHOLD = 0.75
AD_GROUP_MIN_SPEND_THRESHOLD = 50
AD_PRODUCT_MIN_STABLE_CLICKS = 20
AD_PRODUCT_MIN_STABLE_ORDERS = 2
AD_PRODUCT_MAX_STABLE_ACOS = 0.30
AD_PRODUCT_ANOMALY_MIN_CLICKS = 20
AD_PRODUCT_ANOMALY_MAX_WEAK_ORDERS = 1
AD_PRODUCT_ANOMALY_HIGH_ACOS = 0.45
SEARCH_TERM_STRONG_ORDER_THRESHOLD = 3
SEARCH_TERM_MIN_ACTIONABLE_CLICKS = 3
LONG_TAIL_MIN_ORDERS = 2
LONG_TAIL_MAX_SPEND = 5
LONG_TAIL_MAX_ACOS = 0.10
SEARCH_TERM_SPLIT_MIN_SPEND = 3
SEARCH_TERM_SPLIT_MIN_ORDERS = 2
SEARCH_TERM_SPLIT_MIN_ZERO_ORDER_SPEND_SHARE = 0.4
ABA_STALE_AFTER_DAYS = 14
SEARCH_INTENT_GROUPING_MIN_ROWS = 2
SEARCH_INTENT_UNGROUPED_SHARE_THRESHOLD = 0.8
UNGROUPED_INTENT_LABELS = {"未分组搜索词", "未分组", "unknown", "UNKNOWN"}
CHILD_SEARCH_TERMS = (
    "baby",
    "babies",
    "infant",
    "toddler",
    "toddlers",
    "kid",
    "kids",
    "child",
    "children",
    "boy",
    "boys",
    "girl",
    "girls",
    "month",
    "year old",
    "year-old",
    "youth",
)
SPORT_SEARCH_TERMS = ("sport", "sports", "sporty", "running", "baseball", "cycling", "golf", "polarized")


def has_actionable_search_term_opportunity_support(
    metrics: MetricSnapshot,
    aba_support_row: dict | None,
    aba_phrase_context_row: dict | None,
    *,
    is_asin_like_search_term: bool = False,
) -> bool:
    if is_asin_like_search_term:
        return True
    # ABA 是站点级市场背景，只能增强证据，不能替代广告侧最小样本量。
    return metrics.clicks >= SEARCH_TERM_MIN_ACTIONABLE_CLICKS


def detect_data_quality_signals(
    snapshot_status: SnapshotStatus,
    snapshot_readiness: SnapshotReadiness,
    *,
    signal_row_count: int | None = None,
) -> list[AiSignal]:
    market_id = snapshot_readiness.market_id or snapshot_status.market_id
    marketplace = snapshot_readiness.marketplace_code or snapshot_status.marketplace_code
    shop_name = snapshot_readiness.shop_name or snapshot_status.shop_name
    shop_id = f"market:{market_id}" if market_id is not None else "unknown"
    if snapshot_status.has_snapshot and snapshot_status.status == "success":
        if signal_row_count == 0:
            return [
                _empty_snapshot_signal(
                    snapshot_status=snapshot_status,
                    shop_id=shop_id,
                    shop_name=shop_name,
                    market_id=market_id,
                    marketplace=marketplace,
                )
            ]
        return []

    missing = "、".join(snapshot_readiness.missing) if snapshot_readiness.missing else "未发现缺失配置"
    reason = snapshot_readiness.reason or "真实 API 快照不可用"
    primary_object = AdObjectRef(object_type=ObjectType.CROSS, object_id="api_snapshot", label="真实 API 快照")
    facts = [
        EvidenceItem(
            label="快照状态",
            value=snapshot_status.status,
            source_type="积加API",
            source_name="真实 API 快照状态",
            metric_name="snapshot_status",
            metric_value=snapshot_status.status,
            object_type=ObjectType.CROSS.value,
            object_id="api_snapshot",
            explanation=f"当前没有可用于生成广告信号的成功快照，状态为 {snapshot_status.status}。",
        ),
        EvidenceItem(
            label="API 请求能力",
            value="可请求" if snapshot_readiness.can_request_api else "不可请求",
            source_type="积加API",
            source_name="真实 API 快照状态",
            metric_name="can_request_api",
            metric_value=str(snapshot_readiness.can_request_api),
            object_type=ObjectType.CROSS.value,
            object_id="api_snapshot",
            explanation=reason,
        ),
        EvidenceItem(
            label="缺失配置",
            value=missing,
            source_type="积加API",
            source_name="真实 API 快照状态",
            metric_name="missing_config_keys",
            metric_value=missing,
            object_type=ObjectType.CROSS.value,
            object_id="api_snapshot",
            explanation=f"只暴露缺失配置项名称，不暴露任何密钥值：{missing}。",
        ),
    ]
    return [
        AiSignal(
            id="sig-data-quality-api-snapshot-missing",
            signal_type=SignalType.ANOMALY,
            signal_category="data_quality",
            priority=SignalPriority.P1,
            confidence=ConfidenceLevel.HIGH,
            shop_id=shop_id,
            shop_name=shop_name,
            market_id=market_id,
            marketplace=marketplace,
            country=marketplace,
            object_type=ObjectType.CROSS,
            severity=4,
            summary="真实 API 快照未就绪，AI 信号缺少主数据输入",
            why=f"{reason}。没有成功快照时，广告商品、搜索词、广告位等信号都不能被可靠识别。",
            evidence=EvidencePackage(
                period_days=0,
                primary_object=primary_object,
                metrics=MetricSnapshot(),
                facts=facts,
                source_rows=[
                    {
                        "snapshot_status": snapshot_status.status,
                        "snapshot_id": snapshot_status.snapshot_id,
                        "can_request_api": snapshot_readiness.can_request_api,
                        "missing": snapshot_readiness.missing,
                    }
                ],
            ),
            evidence_count=len(facts),
            data_sources=[
                DataSourceRef(
                    source_type="积加API",
                    source_name="真实 API 快照状态",
                    snapshot_id=snapshot_status.snapshot_id,
                    market_id=market_id,
                    start_date=snapshot_status.start_date,
                    end_date=snapshot_status.end_date,
                )
            ],
            freshness_status=FreshnessStatus.STALE,
            detected_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
            uncertainty="这是数据链路级信号，只说明真实 API 快照不可用，不代表广告表现本身异常。",
            suggested_action=SuggestedAction(
                action_type="request_api_snapshot",
                title="补齐积加 API 配置后手动拉取快照",
                description="先补齐缺失配置，再由人工触发一次低频真实 API 快照拉取；拉取成功后再判断广告异常和机会点。",
            ),
            risk="如果忽略该问题，工作台会只看到空信号或降级信号，容易误判为业务没有异常。",
            tags=["数据质量", "真实API快照", "人工拉取"],
        )
    ]


def _empty_snapshot_signal(
    *,
    snapshot_status: SnapshotStatus,
    shop_id: str,
    shop_name: str | None,
    market_id: int | None,
    marketplace: str | None,
) -> AiSignal:
    primary_object = AdObjectRef(object_type=ObjectType.CROSS, object_id="api_snapshot", label="真实 API 快照")
    search_rows = snapshot_status.row_counts.get("ad_search_term_daily_metrics", 0)
    placement_rows = snapshot_status.row_counts.get("ad_placement_daily_metrics", 0)
    facts = [
        EvidenceItem(
            label="搜索词可分析行",
            value=str(search_rows),
            source_type="积加API",
            source_name="真实 API 快照 manifest",
            metric_name="ad_search_term_daily_metrics",
            metric_value=str(search_rows),
            time_range=source_time_range(
                {"start_date": snapshot_status.start_date, "end_date": snapshot_status.end_date}
            ),
            object_type=ObjectType.CROSS.value,
            object_id="api_snapshot",
            explanation=f"manifest 显示 ad_search_term_daily_metrics 行数为 {search_rows}，无法生成搜索词异常或机会信号。",
        ),
        EvidenceItem(
            label="广告位可分析行",
            value=str(placement_rows),
            source_type="积加API",
            source_name="真实 API 快照 manifest",
            metric_name="ad_placement_daily_metrics",
            metric_value=str(placement_rows),
            time_range=source_time_range(
                {"start_date": snapshot_status.start_date, "end_date": snapshot_status.end_date}
            ),
            object_type=ObjectType.CROSS.value,
            object_id="api_snapshot",
            explanation=f"manifest 显示 ad_placement_daily_metrics 行数为 {placement_rows}，无法生成广告位表现信号。",
        ),
    ]
    return AiSignal(
        id="sig-data-quality-api-snapshot-empty",
        signal_type=SignalType.ANOMALY,
        signal_category="data_quality",
        priority=SignalPriority.P1,
        confidence=ConfidenceLevel.HIGH,
        shop_id=shop_id,
        shop_name=shop_name,
        market_id=market_id,
        marketplace=marketplace,
        country=marketplace,
        object_type=ObjectType.CROSS,
        severity=4,
        summary="真实 API 快照已生成，但缺少可分析的广告搜索词和广告位数据",
        why="快照状态为成功，但当前信号规则没有可读取的搜索词或广告位明细，不能据此判断广告异常或机会点。",
        evidence=EvidencePackage(
            period_days=0,
            primary_object=primary_object,
            metrics=MetricSnapshot(),
            facts=facts,
            source_rows=[
                {
                    "snapshot_id": snapshot_status.snapshot_id,
                    "row_counts": snapshot_status.row_counts,
                    "api_list": snapshot_status.api_list,
                }
            ],
        ),
        evidence_count=len(facts),
        data_sources=[
            DataSourceRef(
                source_type="积加API",
                source_name="真实 API 快照 manifest",
                snapshot_id=snapshot_status.snapshot_id,
                market_id=market_id,
                start_date=snapshot_status.start_date,
                end_date=snapshot_status.end_date,
            )
        ],
        freshness_status=FreshnessStatus.STALE,
        detected_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        uncertainty="这是数据覆盖信号，只说明当前快照缺少可分析行，不代表广告表现本身正常或异常。",
        suggested_action=SuggestedAction(
            action_type="inspect_api_snapshot_rows",
            title="检查快照接口范围和 normalized 行数",
            description="先核对 manifest 的 row_counts、raw 响应和 normalized 文件，确认搜索词与广告位接口是否返回了有效行。",
        ),
        risk="如果忽略该问题，工作台会把数据覆盖不足误表现为没有业务信号。",
        tags=["数据质量", "快照行数", "真实API快照"],
    )


def metric_snapshot(row: dict) -> MetricSnapshot:
    clicks = int(row.get("clicks") or 0)
    if row.get("source_table") == "sales_product_daily_metrics":
        return MetricSnapshot(
            impressions=int(row.get("impressions") or 0),
            clicks=clicks,
            cost=0,
            orders=int(row.get("orders") or 0),
            sales=round(float(row.get("sales") or 0), 2),
        )
    cost = float(row.get("cost") or 0)
    orders = int(row.get("orders") or 0)
    sales = float(row.get("sales") or 0)
    return MetricSnapshot(
        impressions=int(row.get("impressions") or 0),
        clicks=clicks,
        cost=round(cost, 2),
        orders=orders,
        sales=round(sales, 2),
        acos=round(cost / sales, 4) if sales > 0 else None,
        cvr=round(orders / clicks, 4) if clicks > 0 else None,
        cpc=round(cost / clicks, 4) if clicks > 0 else None,
    )


def ad_ref(row: dict, object_type: ObjectType) -> AdObjectRef:
    object_id = row.get("row_id", "")
    if object_type == ObjectType.PLACEMENT:
        label = row.get("placement") or row.get("campaign_name") or row.get("product_name")
    else:
        label = row.get("product_name") or row.get("search_term") or row.get("ad_group_name")
    return AdObjectRef(
        object_type=object_type,
        object_id=object_id,
        label=label,
        campaign_name=row.get("campaign_name"),
        ad_group_name=row.get("ad_group_name"),
        asin=row.get("asin"),
        sku=row.get("sku"),
        msku=row.get("msku"),
        placement=row.get("placement"),
        search_term=row.get("search_term"),
        intent_label=row.get("intent_label"),
    )


def evidence_package(
    row: dict,
    object_type: ObjectType,
    facts: list[EvidenceItem],
    source_rows: list[dict] | None = None,
) -> EvidencePackage:
    primary_object = ad_ref(row, object_type)
    return EvidencePackage(
        period_days=14,
        primary_object=primary_object,
        metrics=metric_snapshot(row),
        facts=[enrich_evidence_item(row, fact, primary_object) for fact in facts],
        source_rows=source_rows or [row],
    )


def enrich_evidence_item(row: dict, fact: EvidenceItem, primary_object: AdObjectRef) -> EvidenceItem:
    source = data_source_ref(row)
    time_range = source_time_range(row)
    return fact.model_copy(
        update={
            "source_type": fact.source_type or source.source_type,
            "source_name": fact.source_name or source.source_name,
            "metric_name": fact.metric_name or fact.label,
            "metric_value": fact.metric_value or fact.value,
            "time_range": fact.time_range or time_range,
            "object_type": fact.object_type or primary_object.object_type.value,
            "object_id": fact.object_id or primary_object.object_id,
            "explanation": fact.explanation or fact.note or f"{fact.label}：{fact.value}",
        }
    )


def signal_fields(
    row: dict,
    *,
    signal_category: str,
    priority: SignalPriority = SignalPriority.P0,
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM,
    evidence_count: int,
    uncertainty: str | None = None,
) -> dict[str, Any]:
    market_id = integer_value(row.get("market_id") or row.get("marketplace_id"))
    source = data_source_ref(row)
    return {
        "signal_category": signal_category,
        "priority": priority,
        "confidence": confidence,
        "shop_id": string_value(row.get("shop_id")) or (f"market:{market_id}" if market_id is not None else "unknown"),
        "shop_name": string_value(row.get("shop_name")),
        "market_id": market_id,
        "marketplace": string_value(row.get("marketplace") or row.get("marketplace_code") or row.get("country")),
        "country": string_value(row.get("country") or row.get("marketplace") or row.get("marketplace_code")),
        "evidence_count": evidence_count,
        "data_sources": [source],
        "freshness_status": freshness_status(row),
        "detected_at": string_value(row.get("detected_at")) or datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "uncertainty": uncertainty or default_uncertainty(row),
    }


def data_source_ref(row: dict) -> DataSourceRef:
    source_type = string_value(row.get("source_type"))
    market_id = integer_value(row.get("market_id") or row.get("marketplace_id"))
    if source_type == "api_snapshot":
        source_label = "积加API"
        source_name = "积加API快照"
    elif source_type == "ABA导出":
        source_label = "ABA导出"
        source_name = string_value(row.get("source_name")) or "ABA搜索词快照"
    elif source_type in {"mock", "sample", "fixture"}:
        source_label = "样例数据"
        source_name = "测试或交互样例"
    else:
        source_label = "未知来源"
        source_name = source_type or "未标记来源"
    return DataSourceRef(
        source_type=source_label,
        source_name=source_name,
        snapshot_id=string_value(row.get("snapshot_id")),
        api_name=string_value(row.get("api_name")),
        source_table=string_value(row.get("source_table")),
        source_record_id=string_value(row.get("source_record_id") or row.get("row_id")),
        source_file=string_value(row.get("source_file")),
        market_id=market_id,
        start_date=string_value(row.get("start_date")),
        end_date=string_value(row.get("end_date")),
    )


def signal_evidence_source_keys(signal: AiSignal) -> set[str]:
    keys: set[str] = set()
    for source in signal.data_sources:
        key_parts = [source.source_type]
        if source.source_table:
            key_parts.append(source.source_table)
        elif source.source_name:
            key_parts.append(source.source_name)
        elif source.source_file:
            key_parts.append(source.source_file)
        keys.add("|".join(part for part in key_parts if part))
    return keys


def enforce_signal_confidence_support(signal: AiSignal) -> AiSignal:
    if signal.confidence != ConfidenceLevel.HIGH:
        return signal
    if signal.signal_category == "data_quality":
        return signal

    source_count = len(signal_evidence_source_keys(signal))
    if source_count >= 2:
        return signal

    warning = (
        f"证据来源不足：非数据质量高置信信号当前只有 {source_count} 个独立证据来源，"
        "已按统一置信度规则降为中置信。"
    )
    uncertainty = f"{signal.uncertainty} {warning}" if signal.uncertainty else warning
    return signal.model_copy(update={"confidence": ConfidenceLevel.MEDIUM, "uncertainty": uncertainty})


def freshness_status(row: dict) -> FreshnessStatus:
    if row.get("source_type") == "api_snapshot":
        return FreshnessStatus.API_SNAPSHOT
    if row.get("source_type") in {"mock", "sample", "fixture"}:
        return FreshnessStatus.SAMPLE_DATA
    return FreshnessStatus.UNKNOWN


def source_time_range(row: dict) -> str | None:
    start_date = string_value(row.get("start_date"))
    end_date = string_value(row.get("end_date"))
    if start_date and end_date:
        return f"{start_date} 至 {end_date}"
    return None


def default_uncertainty(row: dict) -> str:
    if row.get("source_type") == "api_snapshot":
        return "当前判断来自单一数据源的 API 快照，仍需结合 ABA、销售表现或人工语义复核。"
    if row.get("source_type") in {"mock", "sample", "fixture"}:
        return "当前判断来自样例数据，只能验证交互和规则，不能作为真实业务结论。"
    return "当前数据来源不完整，置信度需要人工复核。"


def string_value(value: Any) -> str | None:
    if value in (None, ""):
        return None
    return str(value)


def integer_value(value: Any) -> int | None:
    if value in (None, ""):
        return None
    return int(value)


def normalized_search_query(row: dict) -> str | None:
    query = string_value(row.get("normalized_query")) or string_value(row.get("search_term"))
    if query is None:
        return None
    return re.sub(r"\s+", " ", query.strip().lower())


def is_asin_like_search_query(query: str | None) -> bool:
    return bool(query and re.fullmatch(r"b[0-9a-z]{9}", query.strip().lower()))


def asin_search_term_boundary_evidence(row: dict) -> EvidenceItem:
    query = normalized_search_query(row) or string_value(row.get("search_term")) or "ASIN 型搜索词"
    return EvidenceItem(
        label="对象边界",
        value="ASIN 型搜索词不能当作普通关键词加词，只能作为商品定向或自动投放上下文的人工复核对象。",
        source_type="积加API",
        source_name="积加API快照",
        metric_name="asin_search_term_boundary",
        metric_value=query,
        object_type=ObjectType.SEARCH_TERM.value,
        object_id=search_term_object_id(integer_value(row.get("market_id") or row.get("marketplace_id")), query),
        explanation="Amazon 广告里 ASIN 形态的搜索词更接近商品定向或自动投放上下文，不应直接生成普通关键词加词建议。",
    )


def product_targeting_search_term_action() -> SuggestedAction:
    return SuggestedAction(
        action_type="review_product_targeting_search_term",
        title="人工复核 ASIN 型搜索词的商品定向价值",
        description="先确认该 ASIN 对象与广告商品、广告组和投放策略是否相关，再决定是否记录观察或作为商品定向候选复核；不要把它当作普通关键词加词。",
    )


def search_term_actionability_evidence_items(
    row: dict,
    *,
    is_asin_like_search_term: bool,
    is_grouped: bool = False,
    object_id: str | None = None,
    normalized_query: str | None = None,
) -> list[EvidenceItem]:
    query = normalized_query or normalized_search_query(row) or string_value(row.get("search_term")) or "unknown"
    market_id = integer_value(row.get("market_id") or row.get("marketplace_id"))
    evidence_object_id = object_id or search_term_object_id(market_id, query)
    if is_asin_like_search_term:
        action_path = "人工确认后只进入商品定向或自动投放上下文复核；本系统只记录处理和复盘，不自动新增关键词、不自动调价、不自动否词。"
        review_metrics = "7/14 天复盘 target_id/广告组下点击、订单、ACOS、CVR、是否重复出现；先确认该 ASIN 是否有商品定向价值，不作为普通关键词加词。"
    elif is_grouped:
        action_path = "人工确认后逐广告活动、广告组和广告商品复核，再决定加入精准关键词候选或小流量观察；本系统只记录处理和复盘，不自动新增关键词、不自动调价、不自动否词。"
        review_metrics = "7/14 天复盘点击、订单、ACOS、CVR、是否重复出现，并分广告组复盘承接差异；不能用合并结果直接同步放量。"
    else:
        action_path = "人工确认后加入精准关键词候选或小流量观察；本系统只记录处理和复盘，不自动新增关键词、不自动调价、不自动否词。"
        review_metrics = "7/14 天复盘点击、订单、ACOS、CVR、是否重复出现；若进入小流量测试，先看广告侧趋势，不用单日波动定性。"
    return [
        EvidenceItem(
            label="人工动作路径",
            value=action_path,
            source_type="积加API",
            source_name="规则生成",
            metric_name="manual_action_path",
            metric_value=action_path,
            time_range=source_time_range(row),
            object_type=ObjectType.SEARCH_TERM.value,
            object_id=evidence_object_id,
            explanation="机会信号只能进入人工确认、记录观察、加入复盘或忽略本次，不能自动执行广告动作。",
        ),
        EvidenceItem(
            label="复盘指标",
            value=review_metrics,
            source_type="积加API",
            source_name="规则生成",
            metric_name="review_metrics",
            metric_value=review_metrics,
            time_range=source_time_range(row),
            object_type=ObjectType.SEARCH_TERM.value,
            object_id=evidence_object_id,
            explanation="机会必须有复盘窗口和复盘指标，否则不能判断建议是否真的改善广告表现。",
        ),
    ]


def is_ungrouped_intent_label(label: str | None) -> bool:
    value = string_value(label)
    return value is None or value in UNGROUPED_INTENT_LABELS


def has_any_term(query: str, terms: tuple[str, ...]) -> bool:
    return any(term in query for term in terms)


def infer_search_intent_label(row: dict) -> str | None:
    query = normalized_search_query(row)
    if not query:
        return None
    if re.fullmatch(r"b[0-9a-z]{9}", query):
        return "规则语义：ASIN 查询词"
    if "sun hat" in query or "bucket hat" in query or "swim hat" in query or re.search(r"\bhat\b", query):
        return "规则语义：儿童防晒帽" if has_any_term(query, CHILD_SEARCH_TERMS) else "规则语义：防晒帽"
    if "beach" in query and ("essential" in query or "vacation" in query or "must have" in query):
        return "规则语义：海滩出行用品"
    if "essential" in query or "must have" in query or "airplane" in query or "travel" in query:
        return "规则语义：出行用品"
    if "sunglass" in query or "sun glasses" in query:
        if has_any_term(query, CHILD_SEARCH_TERMS):
            return "规则语义：儿童太阳镜"
        if has_any_term(query, SPORT_SEARCH_TERMS):
            return "规则语义：运动太阳镜"
        return "规则语义：太阳镜"
    return None


def resolved_search_intent_label(row: dict) -> str:
    current = string_value(row.get("intent_label"))
    if not is_ungrouped_intent_label(current):
        return current or "未分组搜索词"
    return infer_search_intent_label(row) or current or "未分组搜索词"


def period_key(row: dict) -> tuple[str, str] | None:
    start_date = string_value(row.get("start_date"))
    end_date = string_value(row.get("end_date"))
    if not start_date or not end_date:
        return None
    return start_date, end_date


def market_match_keys(row: dict) -> list[str]:
    keys: list[str] = []
    market_id = integer_value(row.get("market_id") or row.get("marketplace_id"))
    if market_id is not None:
        keys.append(f"id:{market_id}")
    marketplace = string_value(row.get("marketplace") or row.get("marketplace_code") or row.get("country"))
    if marketplace:
        keys.append(f"code:{marketplace.upper()}")
    return keys


def parsed_date(value: Any) -> date | None:
    text = string_value(value)
    if not text:
        return None
    try:
        return datetime.fromisoformat(text[:10]).date()
    except ValueError:
        return None


def latest_end_date(rows: list[dict]) -> date | None:
    dates = [parsed_date(row.get("end_date")) for row in rows]
    valid_dates = [item for item in dates if item is not None]
    return max(valid_dates) if valid_dates else None


def detect_aba_data_quality_signals(rows: list[dict], aba_rows: list[dict]) -> list[AiSignal]:
    if not aba_rows:
        return []

    aba_end_date = latest_end_date(aba_rows)
    if aba_end_date is None:
        return []

    reference_end_date = latest_end_date(rows) or datetime.now(timezone.utc).date()
    stale_days = (reference_end_date - aba_end_date).days
    if stale_days <= ABA_STALE_AFTER_DAYS:
        return []

    aba_row = max(aba_rows, key=lambda row: parsed_date(row.get("end_date")) or date.min)
    context_row = rows[0] if rows else aba_row
    market_id = integer_value(
        context_row.get("market_id")
        or context_row.get("marketplace_id")
        or aba_row.get("market_id")
        or aba_row.get("marketplace_id")
    )
    marketplace = string_value(
        context_row.get("marketplace")
        or context_row.get("marketplace_code")
        or context_row.get("country")
        or aba_row.get("marketplace")
        or aba_row.get("marketplace_code")
        or aba_row.get("country")
    )
    shop_id = string_value(context_row.get("shop_id")) or (f"market:{market_id}" if market_id is not None else "unknown")
    shop_name = string_value(context_row.get("shop_name"))
    start_date = string_value(aba_row.get("start_date")) or ""
    end_date = string_value(aba_row.get("end_date")) or aba_end_date.isoformat()
    reference_end = reference_end_date.isoformat()
    aba_period = f"{start_date} 至 {end_date}" if start_date else end_date
    source_name = string_value(aba_row.get("source_name")) or "ABA搜索词快照"
    primary_object = AdObjectRef(object_type=ObjectType.CROSS, object_id="aba_search_term_snapshot", label="ABA 搜索词数据")
    facts = [
        EvidenceItem(
            label="ABA 行数",
            value=str(len(aba_rows)),
            source_type="ABA导出",
            source_name=source_name,
            metric_name="aba_row_count",
            metric_value=str(len(aba_rows)),
            time_range=aba_period,
            object_type=ObjectType.CROSS.value,
            object_id="aba_search_term_snapshot",
            explanation=f"当前参与扫描的 ABA 搜索词行数为 {len(aba_rows)}。",
        ),
        EvidenceItem(
            label="ABA 周期",
            value=aba_period,
            source_type="ABA导出",
            source_name=source_name,
            metric_name="aba_report_period",
            metric_value=aba_period,
            time_range=aba_period,
            object_type=ObjectType.CROSS.value,
            object_id="aba_search_term_snapshot",
            explanation=f"ABA 导出周期为 {aba_period}。",
        ),
        EvidenceItem(
            label="分析周期结束",
            value=reference_end,
            source_type="积加API",
            source_name="真实 API 快照",
            metric_name="analysis_period_end",
            metric_value=reference_end,
            object_type=ObjectType.CROSS.value,
            object_id="api_snapshot",
            explanation=f"当前分析周期结束日为 {reference_end}。",
        ),
        EvidenceItem(
            label="过期天数",
            value=str(stale_days),
            source_type="ABA导出",
            source_name=source_name,
            metric_name="aba_stale_days",
            metric_value=str(stale_days),
            object_type=ObjectType.CROSS.value,
            object_id="aba_search_term_snapshot",
            explanation=f"ABA 结束日距离分析周期结束日已 {stale_days} 天。",
        ),
        EvidenceItem(
            label="过期阈值",
            value=str(ABA_STALE_AFTER_DAYS),
            source_type="ABA导出",
            source_name=source_name,
            metric_name="aba_stale_after_days",
            metric_value=str(ABA_STALE_AFTER_DAYS),
            object_type=ObjectType.CROSS.value,
            object_id="aba_search_term_snapshot",
            explanation=f"当前 ABA 过期阈值为 {ABA_STALE_AFTER_DAYS} 天。",
        ),
    ]
    return [
        AiSignal(
            id="sig-data-quality-aba-stale",
            signal_type=SignalType.ANOMALY,
            signal_category="data_quality",
            priority=SignalPriority.P0,
            confidence=ConfidenceLevel.HIGH,
            shop_id=shop_id,
            shop_name=shop_name,
            market_id=market_id,
            marketplace=marketplace,
            country=marketplace,
            object_type=ObjectType.CROSS,
            severity=4,
            summary="ABA 搜索词数据已过期，相关市场机会信号需要降置信",
            why=(
                f"ABA 周期 {aba_period}，距离当前分析周期结束 {reference_end} 已 {stale_days} 天，"
                f"超过 {ABA_STALE_AFTER_DAYS} 天阈值。"
            ),
            evidence=EvidencePackage(
                period_days=stale_days,
                primary_object=primary_object,
                metrics=MetricSnapshot(),
                facts=facts,
                source_rows=aba_rows[:3],
            ),
            evidence_count=len(facts),
            data_sources=[data_source_ref(aba_row)],
            freshness_status=FreshnessStatus.STALE,
            detected_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
            uncertainty="ABA 是站点级人工导出数据，不直接归属店铺；过期后只能作为低置信市场背景，不能当作高置信机会证据。",
            suggested_action=SuggestedAction(
                action_type="refresh_aba_export",
                title="重新导入 ABA 搜索词文件",
                description="人工从积加 ERP 导出最新 ABA 搜索词报表后再导入；导入前不要把旧 ABA 当作高置信市场机会证据。",
            ),
            risk="旧 ABA 可能导致热词机会、竞品份额和广告覆盖判断失真。",
            tags=["数据质量", "ABA过期", "市场机会"],
        )
    ]


def aba_rows_by_match_key(aba_rows: list[dict]) -> dict[tuple[str, str, str, str], dict]:
    index: dict[tuple[str, str, str, str], dict] = {}
    for aba_row in aba_rows:
        normalized_query = normalized_search_query(aba_row)
        period = period_key(aba_row)
        if not normalized_query or period is None:
            continue
        for market_key in market_match_keys(aba_row):
            index[(market_key, period[0], period[1], normalized_query)] = aba_row
    return index


def latest_aba_rows_by_market_query(aba_rows: list[dict]) -> dict[tuple[str, str], dict]:
    index: dict[tuple[str, str], dict] = {}
    for aba_row in aba_rows:
        normalized_query = normalized_search_query(aba_row)
        if not normalized_query:
            continue
        for market_key in market_match_keys(aba_row):
            key = (market_key, normalized_query)
            existing = index.get(key)
            if existing is None or (parsed_date(aba_row.get("end_date")) or date.min) > (
                parsed_date(existing.get("end_date")) or date.min
            ):
                index[key] = aba_row
    return index


def matched_latest_aba_row_for_search_term(row: dict, latest_aba_index: dict[tuple[str, str], dict]) -> dict | None:
    normalized_query = normalized_search_query(row)
    if not normalized_query:
        return None
    api_end_date = parsed_date(row.get("end_date"))
    for market_key in market_match_keys(row):
        aba_row = latest_aba_index.get((market_key, normalized_query))
        if aba_row is None:
            continue
        rank = integer_value(aba_row.get("search_frequency_rank"))
        if rank is None or rank > ABA_HOT_TERM_RANK_LIMIT:
            continue
        aba_end_date = parsed_date(aba_row.get("end_date"))
        if api_end_date is not None and aba_end_date is not None:
            stale_days = (api_end_date - aba_end_date).days
            if stale_days > ABA_STALE_AFTER_DAYS:
                continue
        return aba_row
    return None


def is_aba_phrase_context_match(search_query: str, aba_query: str) -> bool:
    if search_query == aba_query:
        return False
    if len(aba_query.split()) < ABA_PHRASE_CONTEXT_MIN_WORDS:
        return False
    return f" {aba_query} " in f" {search_query} "


def matched_latest_aba_phrase_context_row_for_search_term(
    row: dict,
    latest_aba_index: dict[tuple[str, str], dict],
) -> dict | None:
    normalized_query = normalized_search_query(row)
    if not normalized_query:
        return None
    api_end_date = parsed_date(row.get("end_date"))
    candidates: list[dict] = []
    for market_key in market_match_keys(row):
        for candidate_market_key, candidate_query in latest_aba_index:
            if candidate_market_key != market_key:
                continue
            if not is_aba_phrase_context_match(normalized_query, candidate_query):
                continue
            aba_row = latest_aba_index[(candidate_market_key, candidate_query)]
            rank = integer_value(aba_row.get("search_frequency_rank"))
            if rank is None or rank > ABA_HOT_TERM_RANK_LIMIT:
                continue
            aba_end_date = parsed_date(aba_row.get("end_date"))
            if api_end_date is not None and aba_end_date is not None:
                stale_days = (api_end_date - aba_end_date).days
                if stale_days > ABA_STALE_AFTER_DAYS:
                    continue
            candidates.append(aba_row)
    if not candidates:
        return None
    return min(
        candidates,
        key=lambda item: (
            integer_value(item.get("search_frequency_rank")) or ABA_HOT_TERM_RANK_LIMIT + 1,
            -(len(normalized_search_query(item) or "")),
        ),
    )


def aba_search_term_evidence_items(aba_row: dict) -> list[EvidenceItem]:
    rank = integer_value(aba_row.get("search_frequency_rank"))
    source_record_id = string_value(aba_row.get("source_record_id"))
    facts = [
        EvidenceItem(
            label="ABA排名",
            value=str(rank) if rank is not None else "",
            source_type="ABA导出",
            source_name="ABA搜索词快照",
            metric_name="ABA排名",
            metric_value=str(rank) if rank is not None else "",
            time_range=source_time_range(aba_row),
            object_type=ObjectType.SEARCH_TERM.value,
            object_id=source_record_id,
            explanation=f"ABA 导出显示 {aba_row.get('search_term') or normalized_search_query(aba_row)} 搜索频率排名 {rank}。",
        ),
        EvidenceItem(
            label="ABA周期",
            value=source_time_range(aba_row) or "",
            source_type="ABA导出",
            source_name="ABA搜索词快照",
            metric_name="ABA周期",
            metric_value=source_time_range(aba_row) or "",
            time_range=source_time_range(aba_row),
            object_type=ObjectType.SEARCH_TERM.value,
            object_id=source_record_id,
            explanation="ABA 是站点级市场数据，只能作为搜索词市场热度证据。",
        ),
    ]
    top1_asin = string_value(aba_row.get("top1_asin"))
    if top1_asin:
        facts.append(
            EvidenceItem(
                label="ABA Top1 ASIN",
                value=top1_asin,
                source_type="ABA导出",
                source_name="ABA搜索词快照",
                metric_name="ABA Top1 ASIN",
                metric_value=top1_asin,
                time_range=source_time_range(aba_row),
                object_type=ObjectType.SEARCH_TERM.value,
                object_id=source_record_id,
                explanation="ABA Top ASIN 只用于判断市场竞争对象，不代表本店广告归因。",
            )
        )
    return facts


def aba_phrase_context_evidence_items(aba_row: dict, row: dict) -> list[EvidenceItem]:
    rank = integer_value(aba_row.get("search_frequency_rank"))
    aba_query = normalized_search_query(aba_row) or ""
    source_record_id = string_value(aba_row.get("source_record_id"))
    boundary = "短语包含匹配，仅作为同类 SearchTerm 市场热度背景，不代表精确搜索词份额或本店广告归因。"
    return [
        EvidenceItem(
            label="语义组",
            value=resolved_search_intent_label(row),
            source_type="积加API",
            source_name="搜索词规则语义",
            metric_name="语义组",
            metric_value=resolved_search_intent_label(row),
            time_range=source_time_range(row),
            object_type=ObjectType.SEARCH_TERM.value,
            object_id=string_value(row.get("source_record_id") or row.get("row_id")),
            explanation="广告搜索词聚合上下文用于人工复核同类广告搜索词表现，不代表自动广告动作。",
        ),
        EvidenceItem(
            label="ABA语义参考词",
            value=aba_query,
            source_type="ABA导出",
            source_name="ABA搜索词快照",
            metric_name="ABA语义参考词",
            metric_value=aba_query,
            time_range=source_time_range(aba_row),
            object_type=ObjectType.SEARCH_TERM.value,
            object_id=source_record_id,
            explanation=f"广告搜索词包含 ABA 热词短语 {aba_query}，可作为同类 SearchTerm 市场热度背景。",
        ),
        EvidenceItem(
            label="ABA语义参考排名",
            value=str(rank) if rank is not None else "",
            source_type="ABA导出",
            source_name="ABA搜索词快照",
            metric_name="ABA语义参考排名",
            metric_value=str(rank) if rank is not None else "",
            time_range=source_time_range(aba_row),
            object_type=ObjectType.SEARCH_TERM.value,
            object_id=source_record_id,
            explanation="该排名来自站点级 ABA 导出，不能直接代表本店广告归因。",
        ),
        EvidenceItem(
            label="ABA周期",
            value=source_time_range(aba_row) or "",
            source_type="ABA导出",
            source_name="ABA搜索词快照",
            metric_name="ABA周期",
            metric_value=source_time_range(aba_row) or "",
            time_range=source_time_range(aba_row),
            object_type=ObjectType.SEARCH_TERM.value,
            object_id=source_record_id,
            explanation="ABA 周期用于判断市场热度证据是否新鲜。",
        ),
        EvidenceItem(
            label="ABA匹配边界",
            value=boundary,
            source_type="ABA导出",
            source_name="ABA搜索词快照",
            metric_name="ABA匹配边界",
            metric_value=boundary,
            time_range=source_time_range(aba_row),
            object_type=ObjectType.SEARCH_TERM.value,
            object_id=source_record_id,
            explanation=boundary,
        ),
    ]


def aba_rank_change_text(row: dict) -> str:
    change_type = string_value(row.get("rank_change_type")) or "无变化信息"
    change_value = string_value(row.get("rank_change_value"))
    if change_value:
        return f"{change_type} {change_value}"
    return change_type


def search_term_signal_key(signal: AiSignal) -> tuple[int | None, str] | None:
    if signal.signal_category != "search_term_opportunity" or signal.object_type != ObjectType.SEARCH_TERM:
        return None
    query = signal.evidence.primary_object.search_term
    if not query:
        return None
    normalized_query = re.sub(r"\s+", " ", query.strip().lower())
    if not normalized_query:
        return None
    return signal.market_id, normalized_query


def search_term_object_id(market_id: int | None, normalized_query: str) -> str:
    return f"search_term:{market_id if market_id is not None else 'unknown'}:{normalized_query}"


def search_term_signal_id(market_id: int | None, normalized_query: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", normalized_query).strip("-") or "unknown"
    return f"sig-opportunity-search-term-{market_id if market_id is not None else 'unknown'}-{slug}"


def aggregate_metric_snapshot(rows: list[dict]) -> MetricSnapshot:
    impressions = sum(int(row.get("impressions") or 0) for row in rows)
    clicks = sum(int(row.get("clicks") or 0) for row in rows)
    cost = round(sum(float(row.get("cost") or row.get("spend") or 0) for row in rows), 2)
    orders = sum(int(row.get("orders") or 0) for row in rows)
    sales = round(sum(float(row.get("sales") or 0) for row in rows), 2)
    return MetricSnapshot(
        impressions=impressions,
        clicks=clicks,
        cost=cost,
        orders=orders,
        sales=sales,
        acos=round(cost / sales, 4) if sales > 0 else None,
        cvr=round(orders / clicks, 4) if clicks > 0 else None,
        cpc=round(cost / clicks, 4) if clicks > 0 else None,
    )


def unique_source_rows(signals: list[AiSignal]) -> list[dict]:
    rows: list[dict] = []
    seen: set[tuple[str, str, str]] = set()
    for signal in signals:
        for row in signal.evidence.source_rows:
            key = (
                string_value(row.get("source_table")) or "",
                string_value(row.get("source_record_id")) or "",
                string_value(row.get("row_id")) or "",
            )
            if key in seen:
                continue
            seen.add(key)
            rows.append(row)
    return rows


def unique_data_sources(signals: list[AiSignal]) -> list[DataSourceRef]:
    sources: list[DataSourceRef] = []
    seen: set[tuple[str | None, str | None, str | None, str | None, str | None]] = set()
    for signal in signals:
        for source in signal.data_sources:
            key = (
                source.source_type,
                source.source_table,
                source.source_record_id,
                source.source_file,
                source.snapshot_id,
            )
            if key in seen:
                continue
            seen.add(key)
            sources.append(source)
    return sources


def search_term_semantic_group(rows: list[dict]) -> str | None:
    for row in rows:
        if row.get("source_table") != "ad_search_term_daily_metrics":
            continue
        label = resolved_search_intent_label(row)
        if label:
            return label
    return None


def priority_rank(priority: SignalPriority | str) -> int:
    return {SignalPriority.P0: 0, SignalPriority.P1: 1, SignalPriority.P2: 2, "P0": 0, "P1": 1, "P2": 2}.get(priority, 9)


def aggregate_search_term_opportunity_signals(signals: list[AiSignal]) -> list[AiSignal]:
    groups: dict[tuple[int | None, str], list[AiSignal]] = defaultdict(list)
    passthrough: list[AiSignal] = []
    for signal in signals:
        key = search_term_signal_key(signal)
        if key is None:
            passthrough.append(signal)
        else:
            groups[key].append(signal)

    merged: list[AiSignal] = []
    for (market_id, query), group in groups.items():
        if len(group) == 1:
            merged.append(group[0])
            continue
        source_rows = unique_source_rows(group)
        api_rows = [row for row in source_rows if row.get("source_table") == "ad_search_term_daily_metrics"]
        data_sources = unique_data_sources(group)
        metrics = aggregate_metric_snapshot(api_rows)
        semantic_group = search_term_semantic_group(api_rows)
        is_asin_like_group = is_asin_like_search_query(query)
        primary_object = group[0].evidence.primary_object.model_copy(
            update={
                "object_id": search_term_object_id(market_id, query),
                "label": query,
                "campaign_name": None,
                "ad_group_name": None,
                "search_term": query,
                "intent_label": semantic_group,
            }
        )
        facts = []
        if semantic_group:
            facts.append(
                EvidenceItem(
                    label="语义组",
                    value=semantic_group,
                    source_type="积加API",
                    source_name="广告搜索词聚合上下文",
                    metric_name="semantic_group",
                    metric_value=semantic_group,
                    time_range=source_time_range(api_rows[0]) if api_rows else None,
                    object_type=ObjectType.SEARCH_TERM.value,
                    object_id=primary_object.object_id,
                    explanation="广告搜索词聚合上下文由广告搜索词 intent_label 或 normalized_query 在分析层解析，用于先按 Parent ASIN 视角复核用户搜索词表现，不代表人工确认结论。",
                )
            )
        facts.extend(
            [
                EvidenceItem(
                    label="投放上下文数",
                    value=str(len(api_rows)),
                    source_type="积加API",
                    source_name="积加API快照",
                    metric_name="ad_context_count",
                    metric_value=str(len(api_rows)),
                    object_type=ObjectType.SEARCH_TERM.value,
                    object_id=primary_object.object_id,
                    explanation="同一标准化搜索词在多个广告活动或广告组中触发机会，队列按搜索词对象合并展示。",
                ),
                EvidenceItem(
                    label="合计订单",
                    value=str(metrics.orders),
                    source_type="积加API",
                    source_name="积加API快照",
                    metric_name="total_orders",
                    metric_value=str(metrics.orders),
                    object_type=ObjectType.SEARCH_TERM.value,
                    object_id=primary_object.object_id,
                ),
                EvidenceItem(
                    label="合计花费",
                    value=f"{metrics.cost:g}",
                    source_type="积加API",
                    source_name="积加API快照",
                    metric_name="total_cost",
                    metric_value=f"{metrics.cost:g}",
                    object_type=ObjectType.SEARCH_TERM.value,
                    object_id=primary_object.object_id,
                ),
            ]
        )
        if metrics.acos is not None:
            facts.append(
                EvidenceItem(
                    label="合计ACOS",
                    value=f"{metrics.acos:.2%}",
                    source_type="积加API",
                    source_name="积加API快照",
                    metric_name="total_acos",
                    metric_value=f"{metrics.acos:.2%}",
                    object_type=ObjectType.SEARCH_TERM.value,
                    object_id=primary_object.object_id,
                )
            )
        seen_aba_facts: set[tuple[str, str]] = set()
        for signal in group:
            for fact in signal.evidence.facts:
                if fact.source_type != "ABA导出":
                    continue
                fact_key = (fact.label, fact.value)
                if fact_key in seen_aba_facts:
                    continue
                seen_aba_facts.add(fact_key)
                facts.append(fact)
        if is_asin_like_group and api_rows:
            facts.append(asin_search_term_boundary_evidence(api_rows[0]))
        facts.append(
            EvidenceItem(
                label="合并边界",
                value="同一搜索词跨投放上下文合并展示，处理前仍需人工确认具体广告活动、广告组和商品承接。",
                source_type="积加API",
                source_name="规则生成",
                metric_name="merge_boundary",
                metric_value="search_term_context_merge",
                object_type=ObjectType.SEARCH_TERM.value,
                object_id=primary_object.object_id,
            )
        )
        if api_rows:
            facts.extend(
                search_term_actionability_evidence_items(
                    api_rows[0],
                    is_asin_like_search_term=is_asin_like_group,
                    is_grouped=True,
                    object_id=primary_object.object_id,
                    normalized_query=query,
                )
            )
        evidence = group[0].evidence.model_copy(
            update={
                "primary_object": primary_object,
                "metrics": metrics,
                "facts": facts,
                "source_rows": source_rows,
            }
        )
        confidence = ConfidenceLevel.HIGH if any(signal.confidence == ConfidenceLevel.HIGH for signal in group) else ConfidenceLevel.MEDIUM
        priority = min((signal.priority for signal in group), key=priority_rank)
        semantic_summary_part = f"（{semantic_group}）" if semantic_group else ""
        action_semantic_group = semantic_group or "未分组搜索词"
        suggested_action = (
            product_targeting_search_term_action()
            if is_asin_like_group
            else group[0].suggested_action.model_copy(
                update={
                    "description": (
                        f"先按广告搜索词聚合上下文「{action_semantic_group}」复核同类搜索词表现，"
                        "再人工判断是否加入精准关键词候选或小流量观察。"
                    )
                }
            )
        )
        summary = (
            f"ASIN 型搜索词 {query}{semantic_summary_part} 在 {len(api_rows)} 个投放上下文中转化稳定，先人工复核商品定向价值"
            if is_asin_like_group
            else f"搜索词 {query}{semantic_summary_part} 在 {len(api_rows)} 个投放上下文中转化稳定，存在合并放量机会"
        )
        why = (
            (
                f"该 ASIN 型搜索词在 {len(api_rows)} 个广告活动或广告组中累计产生 {metrics.orders} 个订单，"
                f"合计 ACOS 为 {metrics.acos:.2%}；它不是普通关键词，处理前应先核对商品定向、自动投放上下文和广告商品相关性。"
            )
            if is_asin_like_group and metrics.acos is not None
            else (
                f"该 ASIN 型搜索词在 {len(api_rows)} 个广告活动或广告组中累计产生 {metrics.orders} 个订单；"
                "它不是普通关键词，处理前应先核对商品定向、自动投放上下文和广告商品相关性。"
            )
            if is_asin_like_group
            else (
                f"该搜索词在 {len(api_rows)} 个广告活动或广告组中累计产生 {metrics.orders} 个订单，"
                f"合计 ACOS 为 {metrics.acos:.2%}，说明搜索词层面存在可人工复核的扩量机会。"
            )
            if metrics.acos is not None
            else f"该搜索词在 {len(api_rows)} 个广告活动或广告组中累计产生 {metrics.orders} 个订单，适合先做人工复核。"
        )
        uncertainty = (
            "该信号按 ASIN 型搜索词对象合并多个投放上下文；当前只能用于商品定向或自动投放上下文复核，不能直接当作普通关键词加词。"
            if is_asin_like_group
            else "该信号按搜索词对象合并多个投放上下文；ABA 仍是站点级市场证据，不能直接归因到单个店铺商品或自动执行广告动作。"
        )
        tags = sorted(
            {tag for signal in group for tag in signal.tags}
            | {"合并机会", "跨投放上下文"}
            | ({"ASIN 型搜索词", "商品定向复核"} if is_asin_like_group else set())
        )
        merged.append(
            group[0].model_copy(
                update={
                    "id": search_term_signal_id(market_id, query),
                    "priority": priority,
                    "confidence": confidence,
                    "severity": max(signal.severity for signal in group),
                    "summary": summary,
                    "why": why,
                    "evidence": evidence,
                    "evidence_count": len(facts),
                    "data_sources": data_sources,
                    "uncertainty": uncertainty,
                    "risk": "合并信号只减少分诊重复，不代表所有广告活动、广告组或商品都应该同步放量；处理前必须人工逐项核对承接关系。",
                    "suggested_action": suggested_action,
                    "tags": tags,
                }
            )
        )
    return passthrough + merged


def product_match_keys(row: dict) -> list[str]:
    market_id = integer_value(row.get("market_id") or row.get("marketplace_id"))
    if market_id is None:
        return []
    keys: list[str] = []
    for field in ["asin", "msku", "sku"]:
        value = string_value(row.get(field))
        if value:
            keys.append(f"{market_id}:{field}:{value.strip().lower()}")
    return keys


def rows_by_product_key(rows: list[dict]) -> dict[str, list[dict]]:
    index: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        for key in product_match_keys(row):
            index[key].append(row)
    return index


def matched_product_rows(row: dict, index: dict[str, list[dict]]) -> list[dict]:
    matched: dict[str, dict] = {}
    for key in product_match_keys(row):
        for candidate in index.get(key, []):
            matched[candidate.get("row_id") or candidate.get("source_record_id") or key] = candidate
    return list(matched.values())


def sales_product_ad_orders(row: dict) -> int:
    return int(row.get("ad_orders") or row.get("ads_orders") or 0)


def advertised_product_orders(rows: list[dict]) -> int:
    return sum(int(row.get("orders") or 0) for row in rows)


def has_product_ad_coverage_metric_conflict(sales_row: dict, matched_ads: list[dict]) -> bool:
    sales_ad_orders = sales_product_ad_orders(sales_row)
    if sales_ad_orders <= AD_WEAK_ORDER_THRESHOLD:
        return False
    return advertised_product_orders(matched_ads) <= AD_WEAK_ORDER_THRESHOLD


def product_ad_coverage_metric_conflicts(rows: list[dict]) -> list[tuple[dict, list[dict]]]:
    sales_rows = [row for row in rows if row.get("source_table") == "sales_product_daily_metrics"]
    ad_rows = [row for row in rows if row.get("source_table") == "advertised_products"]
    ad_index = rows_by_product_key(ad_rows)
    conflicts: list[tuple[dict, list[dict]]] = []

    for sales_row in sales_rows:
        metrics = metric_snapshot(sales_row)
        if metrics.orders < SALES_STRONG_ORDER_THRESHOLD:
            continue
        matched_ads = matched_product_rows(sales_row, ad_index)
        if matched_ads and has_product_ad_coverage_metric_conflict(sales_row, matched_ads):
            conflicts.append((sales_row, matched_ads))
    return conflicts


def search_term_placement_label(row: dict) -> str:
    parts = [
        string_value(row.get("campaign_name")) or "广告活动",
        string_value(row.get("ad_group_name")) or "广告组",
    ]
    placement = string_value(row.get("keyword_text") or row.get("target_text") or row.get("target_id") or row.get("keyword_id"))
    if placement:
        parts.append(f"投放对象 {placement}")
    return " / ".join(parts)


def search_term_split_row_summary(rows: list[dict]) -> str:
    summaries: list[str] = []
    for row in sorted(rows, key=ad_product_spend, reverse=True):
        metrics = metric_snapshot(row)
        summaries.append(
            f"{search_term_placement_label(row)}：花费 {metrics.cost}，订单 {metrics.orders}，销售额 {metrics.sales}，"
            f"ACOS {format_ad_product_rate(metrics.acos, '无销售额')}，CVR {format_ad_product_rate(metrics.cvr, '无点击')}"
        )
    return "；".join(summaries)


def detect_search_term_performance_split_signals(rows: list[dict]) -> list[AiSignal]:
    search_rows_by_query: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        if row.get("source_table") != "ad_search_term_daily_metrics":
            continue
        query = normalized_search_query(row)
        if query:
            search_rows_by_query[query].append(row)

    signals: list[AiSignal] = []
    for query, query_rows in search_rows_by_query.items():
        if len(query_rows) < 2:
            continue
        metrics_by_row = [(row, metric_snapshot(row)) for row in query_rows]
        no_order_rows = [(row, metrics) for row, metrics in metrics_by_row if metrics.orders == 0 and metrics.cost > 0]
        converting_rows = [(row, metrics) for row, metrics in metrics_by_row if metrics.orders > 0]
        if not no_order_rows or not converting_rows:
            continue

        total_cost = round(sum(metrics.cost for _, metrics in metrics_by_row), 2)
        total_orders = sum(metrics.orders for _, metrics in metrics_by_row)
        if total_cost < SEARCH_TERM_SPLIT_MIN_SPEND or total_orders < SEARCH_TERM_SPLIT_MIN_ORDERS:
            continue

        zero_order_cost = round(sum(metrics.cost for _, metrics in no_order_rows), 2)
        zero_order_cost_share = zero_order_cost / total_cost if total_cost > 0 else 0
        if zero_order_cost_share < SEARCH_TERM_SPLIT_MIN_ZERO_ORDER_SPEND_SHARE:
            continue

        anchor_row = max(no_order_rows, key=lambda item: item[1].cost)[0]
        search_term_label = string_value(anchor_row.get("search_term")) or query
        aggregate_row = {
            **anchor_row,
            "search_term": search_term_label,
            "normalized_query": query,
            "impressions": sum(metrics.impressions for _, metrics in metrics_by_row),
            "clicks": sum(metrics.clicks for _, metrics in metrics_by_row),
            "cost": total_cost,
            "orders": total_orders,
            "sales": round(sum(metrics.sales for _, metrics in metrics_by_row), 2),
        }
        fields = signal_fields(
            aggregate_row,
            signal_category="search_term_performance_split",
            priority=SignalPriority.P2,
            confidence=ConfidenceLevel.MEDIUM,
            evidence_count=6,
            uncertainty=(
                "这是同一标准化搜索词的聚合诊断，说明不同投放行表现分化；"
                "当前不能直接归因到单个商品，需要人工对比广告活动、广告组和投放对象。"
            ),
        )
        fields["data_sources"] = [data_source_ref(row) for row, _ in metrics_by_row]
        row_detail_summary = search_term_split_row_summary(query_rows)
        evidence = evidence_package(
            aggregate_row,
            ObjectType.SEARCH_TERM,
            [
                EvidenceItem(label="搜索词", value=search_term_label),
                EvidenceItem(label="投放行数", value=str(len(query_rows))),
                EvidenceItem(label="总花费", value=f"{total_cost}"),
                EvidenceItem(label="总订单", value=str(total_orders)),
                EvidenceItem(label="无订单花费占比", value=f"{zero_order_cost_share:.2%}"),
                EvidenceItem(
                    label="投放行表现明细",
                    value=row_detail_summary,
                    metric_name="search_term_split_row_detail",
                    metric_value=row_detail_summary,
                ),
            ],
        )
        evidence = evidence.model_copy(update={"source_rows": query_rows})
        signals.append(
            AiSignal(
                id=f"sig-search-term-performance-split-{anchor_row['row_id']}",
                signal_type=SignalType.ANOMALY,
                **fields,
                object_type=ObjectType.SEARCH_TERM,
                severity=2,
                summary=f"同一搜索词 {search_term_label} 在多条投放行中表现分化，需要合并看",
                why=(
                    f"该搜索词分布在 {len(query_rows)} 条投放行中，总花费 {total_cost}、总订单 {total_orders}。"
                    f"其中无订单行花费 {zero_order_cost}，占总花费 {zero_order_cost_share:.2%}，"
                    "同时其它行已经出单，说明逐行判断可能误判，需要按搜索词聚合后再比较结构。"
                ),
                evidence=evidence,
                suggested_action=SuggestedAction(
                    action_type="review_search_term_split",
                    title="人工对比同一搜索词的投放分布",
                    description="人工查看该搜索词在不同广告活动和广告组中的花费、订单和承接差异，决定是否拆分观察或调整投放结构。",
                ),
                risk="如果只看单行数据，可能把同一搜索词的有效行和低效行割裂，导致错误处理。",
                tags=["搜索词聚合", "表现分化", "多投放行"],
            )
        )
    return signals


def detect_search_intent_grouping_data_quality(rows: list[dict]) -> list[AiSignal]:
    search_rows = [row for row in rows if row.get("source_table") == "ad_search_term_daily_metrics"]
    if len(search_rows) < SEARCH_INTENT_GROUPING_MIN_ROWS:
        return []

    ungrouped_rows = [
        row
        for row in search_rows
        if is_ungrouped_intent_label(resolved_search_intent_label(row))
    ]
    ungrouped_share = len(ungrouped_rows) / len(search_rows)
    if ungrouped_share < SEARCH_INTENT_UNGROUPED_SHARE_THRESHOLD:
        return []

    context_row = search_rows[0]
    unique_terms = {
        normalized_search_query(row) or string_value(row.get("search_term")) or ""
        for row in search_rows
        if normalized_search_query(row) or string_value(row.get("search_term"))
    }
    primary_object = AdObjectRef(
        object_type=ObjectType.CROSS,
        object_id="search_intent_grouping",
        label="搜索词语义分组",
    )
    facts = [
        EvidenceItem(
            label="搜索词行数",
            value=str(len(search_rows)),
            source_type="积加API",
            source_name="积加API快照",
            metric_name="search_term_row_count",
            metric_value=str(len(search_rows)),
            time_range=source_time_range(context_row),
            object_type=ObjectType.CROSS.value,
            object_id="search_intent_grouping",
            explanation=f"当前广告搜索词可分析行数为 {len(search_rows)}。",
        ),
        EvidenceItem(
            label="未分组行数",
            value=str(len(ungrouped_rows)),
            source_type="积加API",
            source_name="积加API快照",
            metric_name="ungrouped_search_term_row_count",
            metric_value=str(len(ungrouped_rows)),
            time_range=source_time_range(context_row),
            object_type=ObjectType.CROSS.value,
            object_id="search_intent_grouping",
            explanation=f"其中 {len(ungrouped_rows)} 行仍标记为未分组搜索词。",
        ),
        EvidenceItem(
            label="未分组占比",
            value=f"{ungrouped_share:.2%}",
            source_type="积加API",
            source_name="积加API快照",
            metric_name="ungrouped_search_term_share",
            metric_value=f"{ungrouped_share:.2%}",
            time_range=source_time_range(context_row),
            object_type=ObjectType.CROSS.value,
            object_id="search_intent_grouping",
            explanation=f"未分组搜索词占比为 {ungrouped_share:.2%}。",
        ),
        EvidenceItem(
            label="唯一搜索词",
            value=str(len(unique_terms)),
            source_type="积加API",
            source_name="积加API快照",
            metric_name="distinct_search_term_count",
            metric_value=str(len(unique_terms)),
            time_range=source_time_range(context_row),
            object_type=ObjectType.CROSS.value,
            object_id="search_intent_grouping",
            explanation=f"当前周期包含 {len(unique_terms)} 个唯一标准化搜索词。",
        ),
    ]
    market_id = integer_value(context_row.get("market_id") or context_row.get("marketplace_id"))
    shop_id = string_value(context_row.get("shop_id")) or (f"market:{market_id}" if market_id is not None else "unknown")
    marketplace = string_value(context_row.get("marketplace") or context_row.get("marketplace_code") or context_row.get("country"))
    return [
        AiSignal(
            id="sig-data-quality-search-intent-ungrouped",
            signal_type=SignalType.ANOMALY,
            signal_category="data_quality",
            priority=SignalPriority.P1,
            confidence=ConfidenceLevel.HIGH,
            shop_id=shop_id,
            shop_name=string_value(context_row.get("shop_name")),
            market_id=market_id,
            marketplace=marketplace,
            country=string_value(context_row.get("country") or context_row.get("marketplace") or context_row.get("marketplace_code")),
            object_type=ObjectType.CROSS,
            severity=3,
            summary="搜索词语义分组缺失，当前只能做精确词聚合分析",
            why=(
                f"当前 {len(search_rows)} 行广告搜索词中有 {len(ungrouped_rows)} 行仍是未分组搜索词，"
                f"占比 {ungrouped_share:.2%}。在语义分组补齐前，系统不能可靠回答同类词整体表现。"
            ),
            evidence=EvidencePackage(
                period_days=14,
                primary_object=primary_object,
                metrics=MetricSnapshot(),
                facts=facts,
                source_rows=search_rows[:5],
            ),
            evidence_count=len(facts),
            data_sources=[data_source_ref(context_row)],
            freshness_status=freshness_status(context_row),
            detected_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
            uncertainty="这是语义分组覆盖度信号，只说明当前搜索词语义层未就绪，不代表这些搜索词本身一定异常或一定有机会。",
            suggested_action=SuggestedAction(
                action_type="review_search_intent_grouping",
                title="人工补齐搜索词语义分组",
                description="人工先按人群、场景和商品相关性给核心广告搜索词分组；分组补齐前，只把广告搜索词聚合结果当作观察参考。",
            ),
            risk="如果忽略该问题，运营可能把未分组搜索词的整体表现误读成同一广告搜索词聚合上下文表现。",
            tags=["数据质量", "搜索词语义", "语义分组"],
        )
    ]


def detect_product_ad_coverage_signals(rows: list[dict]) -> list[AiSignal]:
    sales_rows = [row for row in rows if row.get("source_table") == "sales_product_daily_metrics"]
    ad_rows = [row for row in rows if row.get("source_table") == "advertised_products"]
    ad_index = rows_by_product_key(ad_rows)
    signals: list[AiSignal] = []

    for sales_row in sales_rows:
        metrics = metric_snapshot(sales_row)
        if metrics.orders < SALES_STRONG_ORDER_THRESHOLD:
            continue
        matched_ads = matched_product_rows(sales_row, ad_index)
        if not matched_ads:
            continue
        ad_orders = advertised_product_orders(matched_ads)
        if has_product_ad_coverage_metric_conflict(sales_row, matched_ads):
            continue
        if ad_orders > AD_WEAK_ORDER_THRESHOLD:
            continue
        ad_spend = round(sum(float(row.get("cost") or row.get("spend") or 0) for row in matched_ads), 2)
        match_key_text = " / ".join(product_match_keys(sales_row)) or "缺少 asin/msku/sku"
        confidence = ConfidenceLevel.HIGH
        fields = signal_fields(
            sales_row,
            signal_category="product_ad_coverage",
            priority=SignalPriority.P0,
            confidence=confidence,
            evidence_count=4,
            uncertainty=(
                "销售商品与广告商品按 asin / msku / sku 关联。广告组仍是投放容器，不能把广告组搜索词消耗直接归因到单个商品，"
                "处理前还需要人工复核库存、价格、Listing 和广告结构。"
            ),
        )
        fields["data_sources"] = [data_source_ref(sales_row), *[data_source_ref(row) for row in matched_ads]]
        facts = [
            EvidenceItem(
                label="销售订单",
                value=str(metrics.orders),
                metric_name="sales_orders",
                metric_value=str(metrics.orders),
                object_type=ObjectType.SALES_PRODUCT.value,
                object_id=sales_row["row_id"],
                explanation=f"销售表现显示该商品周期内订单为 {metrics.orders}，达到强销售判断阈值。",
            ),
            EvidenceItem(
                label="销售额",
                value=f"{metrics.sales}",
                metric_name="sales",
                metric_value=f"{metrics.sales}",
                object_type=ObjectType.SALES_PRODUCT.value,
                object_id=sales_row["row_id"],
                explanation=f"销售表现显示该商品周期内销售额为 {metrics.sales}。",
            ),
            EvidenceItem(
                label="广告订单",
                value=str(ad_orders),
                source_type="积加API",
                source_name="SP 广告商品",
                metric_name="ad_orders",
                metric_value=str(ad_orders),
                object_type=ObjectType.ADVERTISED_PRODUCT.value,
                object_id=string_value(matched_ads[0].get("row_id")) if matched_ads else None,
                explanation=f"按商品关联键匹配到的广告商品周期内广告订单合计为 {ad_orders}。",
            ),
            EvidenceItem(
                label="关联键",
                value=match_key_text,
                metric_name="match_keys",
                metric_value=match_key_text,
                object_type=ObjectType.SALES_PRODUCT.value,
                object_id=sales_row["row_id"],
                explanation="当前只使用同一店铺站点下的 asin / msku / sku 做销售商品和广告商品关联。",
            ),
        ]
        evidence = evidence_package(sales_row, ObjectType.SALES_PRODUCT, facts)
        evidence = evidence.model_copy(update={"source_rows": [sales_row, *matched_ads]})
        signals.append(
            AiSignal(
                id=f"sig-sales-product-ad-weak-{sales_row['row_id']}",
                signal_type=SignalType.OPPORTUNITY,
                **fields,
                object_type=ObjectType.SALES_PRODUCT,
                severity=4,
                summary=f"{sales_row['product_name']} 销售强但广告弱，需要人工评估广告承接",
                why=(
                    f"该销售商品周期内有 {metrics.orders} 个销售订单，但按商品键匹配的广告订单只有 {ad_orders}，"
                    f"广告花费为 {ad_spend}，说明自然或整体销售有需求，广告承接可能不足。"
                ),
                evidence=evidence,
                suggested_action=SuggestedAction(
                    action_type="review_sales_product_ad_coverage",
                    title="人工评估该销售商品的广告承接",
                    description="先核对该销售商品是否应该由现有广告承接，再人工检查广告商品、广告组结构、关键词和预算分配。",
                ),
                risk="如果该商品库存、利润或定位不适合投放，不能仅凭销售强就增加广告投入。",
                tags=["产品销售承接", "销售商品", "广告弱"],
            )
        )
    return signals


def detect_product_ad_coverage_metric_conflict_data_quality(rows: list[dict]) -> list[AiSignal]:
    conflicts = product_ad_coverage_metric_conflicts(rows)
    if not conflicts:
        return []

    first_sales_row, first_matched_ads = conflicts[0]
    total_sales_ad_orders = sum(sales_product_ad_orders(sales_row) for sales_row, _ in conflicts)
    total_sp_ad_orders = sum(advertised_product_orders(matched_ads) for _, matched_ads in conflicts)
    sample_asin = string_value(first_sales_row.get("asin")) or "未知 ASIN"
    sample_product = string_value(first_sales_row.get("product_name")) or "未知商品"
    sample_text = f"{sample_product} / {sample_asin}"
    fields = signal_fields(
        first_sales_row,
        signal_category="data_quality",
        priority=SignalPriority.P1,
        confidence=ConfidenceLevel.HIGH,
        evidence_count=4,
        uncertainty=(
            "这是销售表现广告指标与 SP 广告商品指标的口径冲突信号。"
            "在确认字段口径或补齐快照覆盖前，不能把该商品判断为广告弱机会。"
        ),
    )
    fields["data_sources"] = [data_source_ref(first_sales_row), data_source_ref(first_matched_ads[0])]
    facts = [
        EvidenceItem(
            label="冲突商品数",
            value=str(len(conflicts)),
            source_type="积加API",
            source_name="销售表现与 SP 广告商品",
            metric_name="product_ad_metric_conflict_count",
            metric_value=str(len(conflicts)),
            object_type=ObjectType.CROSS.value,
            object_id="product_ad_coverage_metric_conflict",
            explanation="这些强销售商品在销售表现中已有广告订单，但匹配到的 SP 广告商品订单仍被判为弱。",
        ),
        EvidenceItem(
            label="销售表现广告订单",
            value=str(total_sales_ad_orders),
            source_type="积加API",
            source_name="销售商品每日表现",
            metric_name="sales_product_ad_orders",
            metric_value=str(total_sales_ad_orders),
            object_type=ObjectType.SALES_PRODUCT.value,
            object_id=string_value(first_sales_row.get("row_id")),
            explanation=f"销售表现中这些商品的广告订单合计为 {total_sales_ad_orders}。",
        ),
        EvidenceItem(
            label="SP 广告商品订单",
            value=str(total_sp_ad_orders),
            source_type="积加API",
            source_name="SP 广告商品",
            metric_name="sp_advertised_product_orders",
            metric_value=str(total_sp_ad_orders),
            object_type=ObjectType.ADVERTISED_PRODUCT.value,
            object_id=string_value(first_matched_ads[0].get("row_id")),
            explanation=f"按商品关联键匹配到的 SP 广告商品订单合计为 {total_sp_ad_orders}。",
        ),
        EvidenceItem(
            label="示例商品",
            value=sample_text,
            source_type="积加API",
            source_name="商品关联键",
            metric_name="sample_product",
            metric_value=sample_text,
            object_type=ObjectType.SALES_PRODUCT.value,
            object_id=string_value(first_sales_row.get("row_id")),
            explanation="示例商品用于人工回查销售表现和 SP 广告商品两类 API 的字段口径。",
        ),
    ]
    return [
        AiSignal(
            id="sig-data-quality-product-ad-coverage-metric-conflict",
            signal_type=SignalType.ANOMALY,
            **fields,
            object_type=ObjectType.CROSS,
            severity=3,
            summary="产品广告承接存在广告口径冲突，当前不生成销售强但广告弱机会",
            why=(
                f"当前有 {len(conflicts)} 个强销售商品在销售表现中已有广告订单，"
                f"销售表现广告订单合计 {total_sales_ad_orders}，但匹配到的 SP 广告商品订单合计 {total_sp_ad_orders}。"
                "这说明当前快照覆盖或字段口径不一致，不能直接判断广告承接弱。"
            ),
            evidence=EvidencePackage(
                period_days=14,
                primary_object=AdObjectRef(
                    object_type=ObjectType.CROSS,
                    object_id="product_ad_coverage_metric_conflict",
                    label="产品广告承接口径",
                ),
                metrics=MetricSnapshot(),
                facts=facts,
                source_rows=[first_sales_row, *first_matched_ads[:3]],
            ),
            suggested_action=SuggestedAction(
                action_type="inspect_product_ad_metric_scope",
                title="核对销售表现广告指标与 SP 广告商品快照",
                description="人工先确认销售表现 ad_orders 与 SP 广告商品 orders 的字段口径和快照覆盖，再恢复产品广告承接判断。",
            ),
            risk="如果忽略该口径冲突，会把已有广告订单的销售商品误判为广告弱机会。",
            tags=["数据质量", "产品销售承接", "广告口径冲突"],
        )
    ]


def detect_product_ad_coverage_data_quality(rows: list[dict]) -> list[AiSignal]:
    sales_rows = [row for row in rows if row.get("source_table") == "sales_product_daily_metrics"]
    ad_rows = [row for row in rows if row.get("source_table") == "advertised_products"]
    if not sales_rows or not ad_rows:
        return []

    strong_sales_rows = [
        row for row in sales_rows if metric_snapshot(row).orders >= SALES_STRONG_ORDER_THRESHOLD
    ]
    sales_keys = {key for row in sales_rows for key in product_match_keys(row)}
    ad_keys = {key for row in ad_rows for key in product_match_keys(row)}
    matched_key_count = len(sales_keys & ad_keys)

    if strong_sales_rows:
        return []

    source_row = sales_rows[0]
    fields = signal_fields(
        source_row,
        signal_category="data_quality",
        priority=SignalPriority.P1,
        confidence=ConfidenceLevel.HIGH,
        evidence_count=4,
        uncertainty=(
            "这是产品销售承接的数据质量信号，只说明当前快照还不足以判断产品广告承接，"
            "不代表销售商品或广告商品本身表现异常。"
        ),
    )
    fields["data_sources"] = [data_source_ref(sales_rows[0]), data_source_ref(ad_rows[0])]
    facts = [
        EvidenceItem(
            label="销售商品指标行",
            value=str(len(sales_rows)),
            source_type="积加API",
            source_name="销售商品每日表现",
            metric_name="sales_product_daily_metrics",
            metric_value=str(len(sales_rows)),
            object_type=ObjectType.CROSS.value,
            object_id="product_ad_coverage",
            explanation=f"当前快照有 {len(sales_rows)} 行销售商品指标，可作为产品承接判断的输入。",
        ),
        EvidenceItem(
            label="强销售商品",
            value=str(len(strong_sales_rows)),
            source_type="积加API",
            source_name="销售商品每日表现",
            metric_name="strong_sales_product_count",
            metric_value=str(len(strong_sales_rows)),
            object_type=ObjectType.CROSS.value,
            object_id="product_ad_coverage",
            explanation=(
                f"当前订单数达到 {SALES_STRONG_ORDER_THRESHOLD} 的销售商品为 {len(strong_sales_rows)}，"
                "不足以触发产品销售强但广告弱判断。"
            ),
        ),
        EvidenceItem(
            label="广告商品行",
            value=str(len(ad_rows)),
            source_type="积加API",
            source_name="SP 广告商品",
            metric_name="advertised_product_count",
            metric_value=str(len(ad_rows)),
            object_type=ObjectType.CROSS.value,
            object_id="product_ad_coverage",
            explanation=f"当前快照有 {len(ad_rows)} 行广告商品，可用于检查广告承接。",
        ),
        EvidenceItem(
            label="商品关联命中",
            value=str(matched_key_count),
            source_type="积加API",
            source_name="销售商品与广告商品关联键",
            metric_name="matched_product_key_count",
            metric_value=str(matched_key_count),
            object_type=ObjectType.CROSS.value,
            object_id="product_ad_coverage",
            explanation="当前只按同一站点下的 asin / msku / sku 检查销售商品与广告商品是否能关联。",
        ),
    ]
    return [
        AiSignal(
            id="sig-data-quality-product-ad-coverage-unavailable",
            signal_type=SignalType.ANOMALY,
            **fields,
            object_type=ObjectType.CROSS,
            severity=2,
            summary="产品销售承接信号证据不足，当前不能判断产品广告弱点",
            why=(
                f"当前销售商品指标行为 {len(sales_rows)}，强销售商品为 {len(strong_sales_rows)}，"
                f"广告商品行为 {len(ad_rows)}，销售/广告商品关联命中为 {matched_key_count}。"
                "因此本轮不生成产品销售强但广告弱信号。"
            ),
            evidence=EvidencePackage(
                period_days=14,
                primary_object=AdObjectRef(
                    object_type=ObjectType.CROSS,
                    object_id="product_ad_coverage",
                    label="产品销售承接证据",
                ),
                metrics=MetricSnapshot(),
                facts=facts,
                source_rows=[*sales_rows[:3], *ad_rows[:3]],
            ),
            suggested_action=SuggestedAction(
                action_type="inspect_product_ad_coverage_inputs",
                title="检查销售强度和商品关联键",
                description="人工检查 asin / msku / sku 映射关系，并选择有销售订单且能与广告商品关联的样本后再判断产品广告承接。",
            ),
            risk="如果忽略该数据缺口，用户会把产品信号为空误解为产品广告没有问题。",
            tags=["数据质量", "产品销售承接", "商品关联键"],
        )
    ]


def ad_product_spend(row: dict) -> float:
    return float(row.get("cost") or row.get("spend") or 0)


def ad_product_label(row: dict) -> str:
    return string_value(row.get("asin")) or string_value(row.get("product_name")) or "广告商品"


def ad_product_summary(row: dict) -> str:
    product = ad_product_label(row)
    msku = string_value(row.get("msku") or row.get("sku"))
    parts = [product]
    if msku:
        parts.append(msku)
    parts.append(f"花费 {ad_product_spend(row)}")
    parts.append(f"订单 {int(row.get('orders') or 0)}")
    return " / ".join(parts)


AD_PRODUCT_CONTEXT_BOUNDARY = "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。"


def ad_group_key(row: dict) -> str | None:
    return string_value(row.get("ad_group_id") or row.get("group_id"))


def same_ad_group_context_rows(rows: list[dict], ad_product_row: dict, source_table: str) -> list[dict]:
    ad_group_id = ad_group_key(ad_product_row)
    if not ad_group_id:
        return []

    market_id = integer_value(ad_product_row.get("market_id") or ad_product_row.get("marketplace_id"))
    campaign_id = string_value(ad_product_row.get("campaign_id"))
    matches: list[dict] = []
    for row in rows:
        if row.get("source_table") != source_table:
            continue
        if ad_group_key(row) != ad_group_id:
            continue
        row_market_id = integer_value(row.get("market_id") or row.get("marketplace_id"))
        if market_id is not None and row_market_id is not None and row_market_id != market_id:
            continue
        row_campaign_id = string_value(row.get("campaign_id"))
        if campaign_id and row_campaign_id and row_campaign_id != campaign_id:
            continue
        matches.append(row)

    return sorted(matches, key=ad_product_spend, reverse=True)[:3]


def context_row_summary(row: dict, label_key: str) -> str:
    label = string_value(row.get(label_key)) or string_value(row.get("normalized_query")) or "未命名上下文"
    return f"{label} / 花费 {ad_product_spend(row)} / 订单 {int(row.get('orders') or 0)}"


def ad_product_context_evidence(rows: list[dict], ad_product_row: dict) -> tuple[list[EvidenceItem], list[dict], list[DataSourceRef]]:
    search_rows = same_ad_group_context_rows(rows, ad_product_row, "ad_search_term_daily_metrics")
    placement_rows = same_ad_group_context_rows(rows, ad_product_row, "ad_placement_daily_metrics")
    context_rows = [*search_rows, *placement_rows]
    ad_group_id = ad_group_key(ad_product_row) or "unknown"
    facts: list[EvidenceItem] = []

    if search_rows:
        search_detail = "；".join(context_row_summary(row, "search_term") for row in search_rows)
        facts.append(
            EvidenceItem(
                label="同广告组搜索词上下文",
                value=f"{len(search_rows)} 条：{search_detail}",
                source_type="积加API",
                source_name="积加API快照",
                metric_name="same_ad_group_search_term_context",
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation="这些搜索词行用于提示同广告组下钻方向，不代表搜索词已经归因到该广告 ASIN。",
            )
        )

    if placement_rows:
        placement_detail = "；".join(context_row_summary(row, "placement") for row in placement_rows)
        facts.append(
            EvidenceItem(
                label="同广告组广告位上下文",
                value=f"{len(placement_rows)} 条：{placement_detail}",
                source_type="积加API",
                source_name="积加API快照",
                metric_name="same_ad_group_placement_context",
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation="这些广告位行用于提示同广告组下钻方向，不代表广告位表现已经归因到该广告 ASIN。",
            )
        )

    if context_rows:
        facts.append(
            EvidenceItem(
                label="上下文边界",
                value=AD_PRODUCT_CONTEXT_BOUNDARY,
                source_type="积加API",
                source_name="积加API快照",
                metric_name="ad_product_context_boundary",
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation=AD_PRODUCT_CONTEXT_BOUNDARY,
            )
        )

    return facts, context_rows, [data_source_ref(row) for row in context_rows]


def ad_product_context_gap_evidence(ad_product_row: dict) -> EvidenceItem:
    ad_group_id = ad_group_key(ad_product_row) or "unknown"
    return EvidenceItem(
        label="下钻证据缺口",
        value="缺少同广告组搜索词和广告位上下文，只能先按广告 ASIN 指标判断承接异常。",
        source_type="积加API",
        source_name="积加API快照",
        metric_name="ad_product_downstream_context_gap",
        object_type=ObjectType.AD_GROUP.value,
        object_id=ad_group_id,
        explanation="当前快照没有命中同广告组搜索词或广告位行，不能把广告 ASIN 异常解释为具体搜索词、广告位或投放结构问题。",
    )


def ad_product_missing_placement_context_evidence(ad_product_row: dict) -> EvidenceItem:
    ad_group_id = ad_group_key(ad_product_row) or "unknown"
    return EvidenceItem(
        label="广告位证据缺口",
        value="缺少同广告组广告位上下文，不能判断广告位是否造成该 ASIN 承接异常。",
        source_type="积加API",
        source_name="积加API快照",
        metric_name="ad_product_missing_placement_context",
        object_type=ObjectType.AD_GROUP.value,
        object_id=ad_group_id,
        explanation="当前快照只命中同广告组搜索词，未命中同广告组广告位行；广告位只能作为缺失证据处理，不能包装成原因判断。",
    )


def aggregate_ad_product_row(asin: str, ad_product_rows: list[dict]) -> dict:
    anchor_row = max(ad_product_rows, key=lambda row: metric_snapshot(row).orders)
    market_id = integer_value(anchor_row.get("market_id") or anchor_row.get("marketplace_id"))
    aggregate_row = {
        **anchor_row,
        "row_id": f"ad-asin:{market_id or 'unknown'}:{asin}",
        "source_record_id": f"ad-asin:{market_id or 'unknown'}:{asin}",
        "source_table": "advertised_products",
        "asin": asin,
        "product_name": string_value(anchor_row.get("product_name")) or asin,
        "impressions": sum(int(row.get("impressions") or 0) for row in ad_product_rows),
        "clicks": sum(int(row.get("clicks") or 0) for row in ad_product_rows),
        "cost": round(sum(float(row.get("cost") or 0) for row in ad_product_rows), 2),
        "orders": sum(int(row.get("orders") or 0) for row in ad_product_rows),
        "sales": round(sum(float(row.get("sales") or 0) for row in ad_product_rows), 2),
    }
    if len({string_value(row.get("sku")) for row in ad_product_rows if string_value(row.get("sku"))}) > 1:
        aggregate_row["sku"] = None
    if len({string_value(row.get("msku")) for row in ad_product_rows if string_value(row.get("msku"))}) > 1:
        aggregate_row["msku"] = None
    return aggregate_row


def grouped_ad_product_context_evidence(rows: list[dict], ad_product_rows: list[dict]) -> tuple[list[EvidenceItem], list[dict], list[DataSourceRef]]:
    search_rows: list[dict] = []
    placement_rows: list[dict] = []
    seen_row_ids: set[str] = set()
    ad_group_ids = [ad_group_key(row) for row in ad_product_rows if ad_group_key(row)]

    def add_context_rows(target: list[dict], source_rows: list[dict]) -> None:
        for row in source_rows:
            row_id = string_value(row.get("row_id"))
            if row_id and row_id in seen_row_ids:
                continue
            if row_id:
                seen_row_ids.add(row_id)
            target.append(row)

    for ad_product_row in ad_product_rows:
        add_context_rows(search_rows, same_ad_group_context_rows(rows, ad_product_row, "ad_search_term_daily_metrics"))
        add_context_rows(placement_rows, same_ad_group_context_rows(rows, ad_product_row, "ad_placement_daily_metrics"))

    context_rows = [*search_rows, *placement_rows]
    ad_group_id = " / ".join(ad_group_ids[:3]) if ad_group_ids else "unknown"
    facts: list[EvidenceItem] = []

    if search_rows:
        search_detail = "；".join(context_row_summary(row, "search_term") for row in search_rows)
        facts.append(
            EvidenceItem(
                label="同广告组搜索词上下文",
                value=f"{len(search_rows)} 条：{search_detail}",
                source_type="积加API",
                source_name="积加API快照",
                metric_name="same_ad_group_search_term_context",
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation="这些搜索词行用于提示同广告组下钻方向，不代表搜索词已经归因到该广告 ASIN。",
            )
        )

    if placement_rows:
        placement_detail = "；".join(context_row_summary(row, "placement") for row in placement_rows)
        facts.append(
            EvidenceItem(
                label="同广告组广告位上下文",
                value=f"{len(placement_rows)} 条：{placement_detail}",
                source_type="积加API",
                source_name="积加API快照",
                metric_name="same_ad_group_placement_context",
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation="这些广告位行用于提示同广告组下钻方向，不代表广告位表现已经归因到该广告 ASIN。",
            )
        )

    if context_rows:
        facts.append(
            EvidenceItem(
                label="上下文边界",
                value=AD_PRODUCT_CONTEXT_BOUNDARY,
                source_type="积加API",
                source_name="积加API快照",
                metric_name="ad_product_context_boundary",
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation=AD_PRODUCT_CONTEXT_BOUNDARY,
            )
        )

    return facts, context_rows, [data_source_ref(row) for row in context_rows]


def detect_advertised_product_opportunity_signals(rows: list[dict]) -> list[AiSignal]:
    # 暂缓生成广告 ASIN 稳定转化机会：当前缺库存、利润、价格、主推策略等独立证据，
    # 不能只凭单周期广告转化就给出有落地意义的放量建议。
    return []


def _detect_advertised_product_opportunity_signals_without_actionability_gate(rows: list[dict]) -> list[AiSignal]:
    signals: list[AiSignal] = []
    ad_product_rows_by_asin: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        if row.get("source_table") != "advertised_products":
            continue
        asin = string_value(row.get("asin"))
        if not asin:
            continue
        ad_product_rows_by_asin[asin].append(row)

    for asin, ad_product_rows in ad_product_rows_by_asin.items():
        row = aggregate_ad_product_row(asin, ad_product_rows)
        metrics = metric_snapshot(row)
        if metrics.clicks < AD_PRODUCT_MIN_STABLE_CLICKS:
            continue
        if metrics.orders < AD_PRODUCT_MIN_STABLE_ORDERS:
            continue
        if metrics.sales <= 0 or metrics.acos is None or metrics.acos > AD_PRODUCT_MAX_STABLE_ACOS:
            continue

        product_label = string_value(row.get("product_name")) or asin
        base_facts = [
            EvidenceItem(label="广告 ASIN", value=asin),
            EvidenceItem(label="广告商品投放行", value=str(len(ad_product_rows))),
            EvidenceItem(label="花费", value=f"{metrics.cost}"),
            EvidenceItem(label="点击", value=str(metrics.clicks)),
            EvidenceItem(label="订单", value=str(metrics.orders)),
            EvidenceItem(label="ACOS", value=f"{metrics.acos:.2%}"),
            EvidenceItem(label="CVR", value=f"{(metrics.cvr or 0):.2%}"),
        ]
        context_facts, context_rows, context_sources = grouped_ad_product_context_evidence(rows, ad_product_rows)
        facts = [*base_facts, *context_facts]
        fields = signal_fields(
            row,
            signal_category="advertised_product_opportunity",
            priority=SignalPriority.P1,
            confidence=ConfidenceLevel.MEDIUM,
            evidence_count=len(facts),
            uncertainty=(
                "这是广告商品级机会信号，只说明该 ASIN 在当前 API 快照周期内广告转化稳定。"
                "是否放量仍需人工结合库存、利润、价格、主推策略和搜索词相关性复核。"
            ),
        )
        fields["data_sources"] = [*[data_source_ref(item) for item in ad_product_rows], *context_sources]
        signals.append(
            AiSignal(
                id=f"sig-ad-asin-stable-conversion-{row['row_id']}",
                signal_type=SignalType.OPPORTUNITY,
                **fields,
                object_type=ObjectType.ADVERTISED_PRODUCT,
                severity=3,
                summary=f"广告 ASIN {asin} 转化稳定，适合进入商品机会观察",
                why=(
                    f"{product_label} 在当前周期有 {metrics.clicks} 次点击、{metrics.orders} 个订单，"
                    f"广告销售额 {metrics.sales}，ACOS 为 {metrics.acos:.2%}，CVR 为 {(metrics.cvr or 0):.2%}。"
                    "该判断落在广告商品粒度，不依赖广告组归因。"
                ),
                evidence=evidence_package(
                    row,
                    ObjectType.ADVERTISED_PRODUCT,
                    facts,
                    source_rows=[*ad_product_rows, *context_rows],
                ),
                suggested_action=SuggestedAction(
                    action_type="review_advertised_product_opportunity",
                    title="人工复核该广告 ASIN 的放量价值",
                    description="先核对库存、利润、价格、主推策略和搜索词相关性，再人工决定是否小步增加预算或继续观察。",
                ),
                risk="当前只有单一 API 快照周期，不能直接自动加预算、改竞价或扩量。",
                tags=["广告商品", "稳定转化", "商品机会"],
            )
        )
    return signals


def detect_advertised_product_anomaly_signals(rows: list[dict]) -> list[AiSignal]:
    signals: list[AiSignal] = []
    for row in rows:
        if row.get("source_table") != "advertised_products":
            continue
        metrics = metric_snapshot(row)
        if metrics.clicks < AD_PRODUCT_ANOMALY_MIN_CLICKS:
            continue

        is_weak_order = metrics.orders <= AD_PRODUCT_ANOMALY_MAX_WEAK_ORDERS
        is_high_acos = metrics.acos is not None and metrics.acos >= AD_PRODUCT_ANOMALY_HIGH_ACOS
        if not is_weak_order and not is_high_acos:
            continue

        asin = string_value(row.get("asin")) or "未知 ASIN"
        product_label = string_value(row.get("product_name")) or asin
        trigger = "点击充足但订单弱" if is_weak_order else "ACOS 偏高"
        trigger_value = f"订单 {metrics.orders}" if is_weak_order else f"ACOS {metrics.acos:.2%}"
        base_facts = [
            EvidenceItem(label="广告 ASIN", value=asin),
            EvidenceItem(label="触发原因", value=trigger),
            EvidenceItem(label="花费", value=f"{metrics.cost}"),
            EvidenceItem(label="点击", value=str(metrics.clicks)),
            EvidenceItem(label="订单", value=str(metrics.orders)),
            EvidenceItem(label="ACOS", value=f"{metrics.acos:.2%}" if metrics.acos is not None else "无销售额"),
        ]
        context_facts, context_rows, context_sources = ad_product_context_evidence(rows, row)
        has_search_term_context = any(context_row.get("source_table") == "ad_search_term_daily_metrics" for context_row in context_rows)
        has_placement_context = any(context_row.get("source_table") == "ad_placement_daily_metrics" for context_row in context_rows)
        has_downstream_context = has_search_term_context or has_placement_context
        if not has_downstream_context:
            context_facts.append(ad_product_context_gap_evidence(row))
        elif has_search_term_context and not has_placement_context:
            context_facts.append(ad_product_missing_placement_context_evidence(row))
        facts = [*base_facts, *context_facts]
        if not has_downstream_context:
            uncertainty = (
                "这是广告商品级异常信号，只说明该 ASIN 在当前 API 快照周期内广告承接偏弱。"
                "当前缺少同广告组搜索词或广告位下钻证据，只能先按广告 ASIN 指标判断承接异常，不能解释具体流量来源。"
            )
        elif has_search_term_context and not has_placement_context:
            uncertainty = (
                "这是广告商品级异常信号，只说明该 ASIN 在当前 API 快照周期内广告承接偏弱。"
                "当前只有同广告组搜索词上下文，搜索词不能自动归因到该 ASIN；广告位证据缺口会影响流量位置判断。"
            )
        else:
            uncertainty = (
                "这是广告商品级异常信号，只说明该 ASIN 在当前 API 快照周期内广告承接偏弱。"
                "同广告组搜索词和广告位只能作为下钻上下文，处理前仍需人工复核承接关系。"
            )
        fields = signal_fields(
            row,
            signal_category="advertised_product_efficiency",
            priority=SignalPriority.P1,
            confidence=ConfidenceLevel.MEDIUM,
            evidence_count=len(facts),
            uncertainty=uncertainty,
        )
        fields["data_sources"] = [*fields["data_sources"], *context_sources]
        if not has_downstream_context:
            action_description = "先人工检查该 ASIN 的库存、价格、Listing 和主推策略，并确认是否需要补齐同广告组搜索词或广告位数据；再决定记录观察或加入复盘。"
        elif has_search_term_context and not has_placement_context:
            action_description = (
                "先人工检查该 ASIN 的库存、价格、Listing 和主推策略，并复核同广告组搜索词是否存在高消耗无订单或相关性问题；"
                "广告位证据缺失时先补齐广告位数据，再决定记录观察或加入复盘。"
            )
        else:
            action_description = "先人工检查该 ASIN 的库存、价格、Listing、主推策略、同广告组搜索词和广告位上下文，再决定是否记录观察、检查投放结构或加入复盘。"
        signals.append(
            AiSignal(
                id=f"sig-ad-product-efficiency-{row['row_id']}",
                signal_type=SignalType.ANOMALY,
                **fields,
                object_type=ObjectType.ADVERTISED_PRODUCT,
                severity=4,
                summary=f"广告 ASIN {asin} {trigger}，需要人工复核承接问题",
                why=(
                    f"{product_label} 在当前周期有 {metrics.clicks} 次点击、花费 {metrics.cost}，{trigger_value}。"
                    "该判断落在广告商品 ASIN 粒度，只说明商品广告承接偏弱，不能直接归因到某个搜索词或广告位。"
                ),
                evidence=evidence_package(
                    row,
                    ObjectType.ADVERTISED_PRODUCT,
                    facts,
                    source_rows=[row, *context_rows],
                ),
                suggested_action=SuggestedAction(
                    action_type="review_advertised_product_efficiency",
                    title="人工复核该广告 ASIN 的承接问题",
                    description=action_description,
                ),
                risk="当前没有自动调价、暂停或否词动作；若该 ASIN 处于新品测试或主推拉新阶段，短期效率偏弱可能需要单独解释。",
                tags=["广告商品", "承接异常", "商品异常"],
            )
        )
    return signals


def format_ad_product_rate(value: float | None, empty_text: str) -> str:
    return f"{value:.2%}" if value is not None else empty_text


def ad_product_sample_boundaries(row: dict) -> list[str]:
    boundaries: list[str] = []
    clicks = int(row.get("clicks") or 0)
    orders = int(row.get("orders") or 0)
    sales = float(row.get("sales") or 0)
    if clicks < AD_PRODUCT_MIN_STABLE_CLICKS:
        boundaries.append("点击样本少")
    if orders < AD_PRODUCT_MIN_STABLE_ORDERS:
        boundaries.append("订单样本少")
    if sales <= 0:
        boundaries.append("无销售额")
    return boundaries


def ad_product_difference_summary(rows: list[dict], total_spend: float) -> str:
    summaries: list[str] = []
    has_sample_boundary = False
    for row in sorted(rows, key=ad_product_spend, reverse=True):
        spend = ad_product_spend(row)
        clicks = int(row.get("clicks") or 0)
        orders = int(row.get("orders") or 0)
        sales = float(row.get("sales") or 0)
        spend_share = spend / total_spend if total_spend > 0 else 0
        acos = spend / sales if sales > 0 else None
        cvr = orders / clicks if clicks > 0 else None
        summary = (
            f"{ad_product_label(row)} 花费占 {spend_share:.2%}，订单 {orders}，销售额 {sales}，"
            f"ACOS {format_ad_product_rate(acos, '无销售额')}，CVR {format_ad_product_rate(cvr, '无点击')}"
        )
        sample_boundaries = ad_product_sample_boundaries(row)
        if sample_boundaries:
            has_sample_boundary = True
            summary += f"（样本边界：{' / '.join(sample_boundaries)}，仅适合观察）"
        summaries.append(summary)
    if has_sample_boundary:
        return "；".join(summaries) + "。部分商品样本不足，当前差异只能作为观察提示，不能当作稳定结论。"
    return "；".join(summaries) + "。广告组汇总会掩盖商品之间的消耗和承接差异。"


def ad_group_context_rows(rows: list[dict], ad_group_id: str, source_table: str) -> list[dict]:
    return [
        row
        for row in rows
        if row.get("source_table") == source_table
        and string_value(row.get("ad_group_id") or row.get("group_id")) == ad_group_id
    ]


def ad_group_attribution_boundary_summary(
    product_rows: list[dict],
    search_term_rows: list[dict],
    placement_rows: list[dict],
) -> str:
    context_parts: list[str] = []
    if search_term_rows:
        context_parts.append(f"{len(search_term_rows)} 条搜索词表现行")
    if placement_rows:
        context_parts.append(f"{len(placement_rows)} 条广告位表现行")
    product_labels = " / ".join(ad_product_label(row) for row in sorted(product_rows, key=ad_product_spend, reverse=True))
    return (
        f"该广告组当前快照匹配到 {'、'.join(context_parts)}。"
        f"这些表现行只能证明广告组层级的流量和转化，不能自动归属到 {product_labels} 中任一广告商品；"
        "需要结合广告商品指标人工判断。"
    )


def is_top_asin_main_push_strategy(top_row: dict, ad_group_id: str, promotion_strategies: list[dict] | None) -> bool:
    top_asin = string_value(top_row.get("asin"))
    if not top_asin:
        return False
    row_market_id = integer_value(top_row.get("market_id") or top_row.get("marketplace_id"))
    row_shop_id = string_value(top_row.get("shop_id"))
    row_start = string_value(top_row.get("start_date"))
    row_end = string_value(top_row.get("end_date"))
    for strategy in promotion_strategies or []:
        if string_value(strategy.get("strategy_role")) != "main_push":
            continue
        if string_value(strategy.get("ad_group_id")) != ad_group_id:
            continue
        if string_value(strategy.get("asin")) != top_asin:
            continue
        strategy_market_id = integer_value(strategy.get("market_id"))
        if strategy_market_id is not None and row_market_id is not None and strategy_market_id != row_market_id:
            continue
        strategy_shop_id = string_value(strategy.get("shop_id"))
        if strategy_shop_id and row_shop_id and strategy_shop_id != row_shop_id:
            continue
        strategy_start = string_value(strategy.get("start_date"))
        strategy_end = string_value(strategy.get("end_date"))
        if strategy_end and row_start and strategy_end < row_start:
            continue
        if strategy_start and row_end and strategy_start > row_end:
            continue
        return True
    return False


def detect_ad_group_structure_signals(rows: list[dict], *, promotion_strategies: list[dict] | None = None) -> list[AiSignal]:
    ad_rows = [row for row in rows if row.get("source_table") == "advertised_products"]
    groups: dict[str, list[dict]] = defaultdict(list)
    for row in ad_rows:
        ad_group_id = string_value(row.get("ad_group_id") or row.get("group_id"))
        if ad_group_id:
            groups[ad_group_id].append(row)

    signals: list[AiSignal] = []
    for ad_group_id, group_rows in groups.items():
        if len(group_rows) < 2:
            continue
        total_spend = round(sum(ad_product_spend(row) for row in group_rows), 2)
        if total_spend < AD_GROUP_MIN_SPEND_THRESHOLD:
            continue
        top_row = max(group_rows, key=ad_product_spend)
        top_spend = ad_product_spend(top_row)
        top_spend_share = top_spend / total_spend if total_spend > 0 else 0
        if top_spend_share < AD_GROUP_SPEND_CONCENTRATION_THRESHOLD:
            continue
        if is_top_asin_main_push_strategy(top_row, ad_group_id, promotion_strategies):
            continue

        ad_group_name = string_value(top_row.get("ad_group_name")) or ad_group_id
        top_product = string_value(top_row.get("product_name")) or string_value(top_row.get("asin")) or "广告商品"
        search_term_context_rows = ad_group_context_rows(rows, ad_group_id, "ad_search_term_daily_metrics")
        placement_context_rows = ad_group_context_rows(rows, ad_group_id, "ad_placement_daily_metrics")
        attribution_context_rows = search_term_context_rows + placement_context_rows
        fields = signal_fields(
            top_row,
            signal_category="ad_group_structure",
            priority=SignalPriority.P2,
            confidence=ConfidenceLevel.MEDIUM,
            evidence_count=7 + (1 if attribution_context_rows else 0),
            uncertainty=(
                "广告组是投放容器，不是产品。该信号只说明同一广告组内广告商品消耗集中。"
                "如果头部 ASIN 是主推款，这种集中可能是正常投放策略；"
                "当前快照没有主推款标记，不能直接判断为异常。"
            ),
        )
        fields["data_sources"] = [data_source_ref(row) for row in group_rows + attribution_context_rows]
        product_summaries = "；".join(ad_product_summary(row) for row in sorted(group_rows, key=ad_product_spend, reverse=True))
        product_difference_summary = ad_product_difference_summary(group_rows, total_spend)
        facts = [
            EvidenceItem(
                label="广告商品数",
                value=str(len(group_rows)),
                source_type="积加API",
                source_name="SP 广告商品",
                metric_name="advertised_product_count",
                metric_value=str(len(group_rows)),
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation=f"该广告组内当前快照匹配到 {len(group_rows)} 个广告商品。",
            ),
            EvidenceItem(
                label="广告商品清单",
                value=product_summaries,
                source_type="积加API",
                source_name="SP 广告商品",
                metric_name="advertised_product_list",
                metric_value=product_summaries,
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation="该清单来自当前 SP 广告商品快照，按花费从高到低排列。",
            ),
            EvidenceItem(
                label="商品表现差异",
                value=product_difference_summary,
                source_type="积加API",
                source_name="SP 广告商品",
                metric_name="ad_product_performance_difference",
                metric_value=product_difference_summary,
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation="该解释来自同一广告组内广告商品的花费、订单、销售额、ACOS 和 CVR 对比。",
            ),
            EvidenceItem(
                label="策略边界",
                value="当前快照没有主推款标记。若头部 ASIN 是主推款，消耗集中属于正常策略；若不是主推款，再考虑拆分观察。",
                source_type="人工语义",
                source_name="投放策略标记",
                metric_name="promotion_strategy_boundary",
                metric_value="main_push_unknown",
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation="该边界用于避免把主推款策略误判为广告组结构异常。",
            ),
            EvidenceItem(
                label="广告组总花费",
                value=f"{total_spend}",
                source_type="积加API",
                source_name="SP 广告商品",
                metric_name="ad_group_spend",
                metric_value=f"{total_spend}",
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation=f"该广告组内广告商品周期花费合计为 {total_spend}。",
            ),
            EvidenceItem(
                label="头部商品花费占比",
                value=f"{top_spend_share:.2%}",
                source_type="积加API",
                source_name="SP 广告商品",
                metric_name="top_ad_product_spend_share",
                metric_value=f"{top_spend_share:.4f}",
                object_type=ObjectType.AD_GROUP.value,
                object_id=ad_group_id,
                explanation=f"花费最高的广告商品占该广告组花费的 {top_spend_share:.2%}。",
            ),
            EvidenceItem(
                label="头部广告商品",
                value=top_product,
                source_type="积加API",
                source_name="SP 广告商品",
                metric_name="top_ad_product",
                metric_value=top_product,
                object_type=ObjectType.ADVERTISED_PRODUCT.value,
                object_id=string_value(top_row.get("row_id")) or string_value(top_row.get("source_record_id")),
                explanation="该商品是当前广告组内花费最高的广告商品。",
            ),
        ]
        if attribution_context_rows:
            attribution_boundary_summary = ad_group_attribution_boundary_summary(
                group_rows,
                search_term_context_rows,
                placement_context_rows,
            )
            facts.append(
                EvidenceItem(
                    label="归因边界",
                    value=attribution_boundary_summary,
                    source_type="积加API",
                    source_name="SP 广告组层级表现",
                    metric_name="ad_group_attribution_boundary",
                    metric_value=attribution_boundary_summary,
                    object_type=ObjectType.AD_GROUP.value,
                    object_id=ad_group_id,
                    explanation="该边界来自同一广告组下的搜索词或广告位表现行，用于说明这些层级数据不能自动归到单个广告商品。",
                )
            )
        signals.append(
            AiSignal(
                id=f"sig-ad-group-spend-concentration-{ad_group_id}",
                signal_type=SignalType.OPPORTUNITY,
                **fields,
                object_type=ObjectType.AD_GROUP,
                severity=2,
                summary=f"{ad_group_name} 多商品消耗集中，先确认头部 ASIN 是否主推款",
                why=(
                    f"该广告组内有 {len(group_rows)} 个广告商品，周期总花费为 {total_spend}，"
                    f"其中 {top_product} 占 {top_spend_share:.2%}。"
                    "如果该头部 ASIN 是主推款，消耗集中属于正常投放策略；"
                    "如果不是主推款，再按广告商品分别判断是否需要拆分观察。"
                ),
                evidence=EvidencePackage(
                    period_days=14,
                    primary_object=AdObjectRef(
                        object_type=ObjectType.AD_GROUP,
                        object_id=ad_group_id,
                        label=ad_group_name,
                        campaign_name=string_value(top_row.get("campaign_name")),
                        ad_group_name=ad_group_name,
                    ),
                    metrics=MetricSnapshot(
                        impressions=sum(int(row.get("impressions") or 0) for row in group_rows),
                        clicks=sum(int(row.get("clicks") or 0) for row in group_rows),
                        cost=total_spend,
                        orders=sum(int(row.get("orders") or 0) for row in group_rows),
                        sales=round(sum(float(row.get("sales") or 0) for row in group_rows), 2),
                    ),
                    facts=facts,
                    source_rows=group_rows,
                ),
                suggested_action=SuggestedAction(
                    action_type="review_multi_product_ad_group",
                    title="确认头部 ASIN 是否主推款",
                    description="先人工确认花费最高 ASIN 是否为当前主推款；若是主推款，记录为正常策略并继续观察；若不是，再比较各广告商品的花费、订单和 ACOS。",
                ),
                risk="如果没有主推款标记，系统只能提示结构观察，不能把消耗集中直接判断为异常或要求拆分。",
                tags=["广告组结构", "多商品广告组", "主推款待确认"],
            )
        )
    return signals


def detect_signals(
    rows: list[dict] | None = None,
    *,
    aba_rows: list[dict] | None = None,
    promotion_strategies: list[dict] | None = None,
) -> list[AiSignal]:
    source_rows = rows if rows is not None else []
    signals: list[AiSignal] = []
    latest_aba_index = latest_aba_rows_by_market_query(aba_rows or [])
    signals.extend(detect_aba_data_quality_signals(source_rows, aba_rows or []))
    signals.extend(detect_product_ad_coverage_metric_conflict_data_quality(source_rows))
    product_ad_coverage_signals = detect_product_ad_coverage_signals(source_rows)
    signals.extend(product_ad_coverage_signals)
    if not product_ad_coverage_signals:
        signals.extend(detect_product_ad_coverage_data_quality(source_rows))
    signals.extend(detect_advertised_product_opportunity_signals(source_rows))
    signals.extend(detect_advertised_product_anomaly_signals(source_rows))
    signals.extend(detect_ad_group_structure_signals(source_rows, promotion_strategies=promotion_strategies))
    signals.extend(detect_search_term_performance_split_signals(source_rows))
    signals.extend(detect_search_intent_grouping_data_quality(source_rows))

    for row in source_rows:
        metrics = metric_snapshot(row)
        is_search_term = row.get("source_table") == "ad_search_term_daily_metrics"
        is_placement = row.get("source_table") == "ad_placement_daily_metrics"
        search_query = normalized_search_query(row)
        search_term_label = string_value(row.get("search_term")) or search_query or ""
        aba_support_row = (
            matched_latest_aba_row_for_search_term(row, latest_aba_index)
            if is_search_term and search_query
            else None
        )
        aba_phrase_context_row = (
            matched_latest_aba_phrase_context_row_for_search_term(row, latest_aba_index)
            if is_search_term and search_query and aba_support_row is None
            else None
        )
        if is_search_term and metrics.cost >= 30 and metrics.orders == 0 and metrics.clicks >= 40:
            signals.append(
                AiSignal(
                    id=f"sig-waste-{row['row_id']}",
                    signal_type=SignalType.ANOMALY,
                    **signal_fields(
                        row,
                        signal_category="ad_efficiency",
                        priority=SignalPriority.P0,
                        confidence=ConfidenceLevel.MEDIUM,
                        evidence_count=4,
                    ),
                    object_type=ObjectType.ADVERTISED_PRODUCT,
                    severity=5,
                    summary=f"{row['product_name']} 在广告组内消耗较高但没有订单",
                    why="该广告商品在同一广告组内消耗了明显预算，但近 14 天没有产生订单，优先判断为止损信号。",
                    evidence=evidence_package(
                        row,
                        ObjectType.ADVERTISED_PRODUCT,
                        [
                            EvidenceItem(label="花费", value=f"{metrics.cost}"),
                            EvidenceItem(label="点击", value=str(metrics.clicks)),
                            EvidenceItem(label="订单", value=str(metrics.orders)),
                            EvidenceItem(label="搜索词语义", value=resolved_search_intent_label(row)),
                        ],
                    ),
                    suggested_action=SuggestedAction(
                        action_type="review_bid_or_search_term",
                        title="检查该商品对应搜索词和竞价",
                        description="先人工核对搜索词是否匹配商品；若继续无转化，考虑降低竞价或加入否词候选。",
                    ),
                    risk="样本来自 14 天窗口，不建议直接暂停整个广告组。",
                    tags=["高花费无订单", "广告商品", "多商品广告组"],
                )
            )

        is_asin_like_search_term = is_asin_like_search_query(search_query)
        if (
            is_search_term
            and search_query
            and metrics.orders >= SEARCH_TERM_STRONG_ORDER_THRESHOLD
            and metrics.acos is not None
            and metrics.acos <= 0.25
            and has_actionable_search_term_opportunity_support(
                metrics,
                aba_support_row,
                aba_phrase_context_row,
                is_asin_like_search_term=is_asin_like_search_term,
            )
        ):
            opportunity_facts = [
                EvidenceItem(label="ACOS", value=f"{metrics.acos:.2%}"),
                EvidenceItem(label="订单", value=str(metrics.orders)),
                EvidenceItem(label="转化率", value=f"{(metrics.cvr or 0):.2%}"),
                EvidenceItem(label="语义组", value=resolved_search_intent_label(row)),
            ]
            if is_asin_like_search_term:
                opportunity_facts.append(asin_search_term_boundary_evidence(row))
            opportunity_facts.extend(
                search_term_actionability_evidence_items(row, is_asin_like_search_term=is_asin_like_search_term)
            )
            opportunity_uncertainty = None
            if aba_support_row is not None:
                opportunity_uncertainty = "该信号由广告搜索词转化表现和同站点 ABA 热度共同支持；ABA 是站点级市场数据，不能直接代表本店广告归因。"
            elif aba_phrase_context_row is not None:
                opportunity_uncertainty = "该信号由广告搜索词转化表现触发，并命中同站点 ABA 热词短语参考；短语参考只作为同类 SearchTerm 市场热度背景，不代表精确搜索词份额。"
            if is_asin_like_search_term:
                opportunity_uncertainty = (
                    "这是 ASIN 型搜索词信号，只能作为商品定向或自动投放上下文复核；"
                    "当前 SP 商品定向详情未完整同步，不能当作普通关键词扩量建议。"
                )
            opportunity_fields = signal_fields(
                row,
                signal_category="search_term_opportunity",
                priority=SignalPriority.P0,
                confidence=ConfidenceLevel.HIGH if aba_support_row is not None else ConfidenceLevel.MEDIUM,
                evidence_count=len(opportunity_facts),
                uncertainty=opportunity_uncertainty,
            )
            opportunity_source_rows = None
            if aba_support_row is not None:
                opportunity_facts.extend(aba_search_term_evidence_items(aba_support_row))
                opportunity_fields["evidence_count"] = len(opportunity_facts)
                opportunity_fields["data_sources"] = [data_source_ref(row), data_source_ref(aba_support_row)]
                opportunity_source_rows = [row, aba_support_row]
            elif aba_phrase_context_row is not None:
                opportunity_facts.extend(aba_phrase_context_evidence_items(aba_phrase_context_row, row))
                opportunity_fields["evidence_count"] = len(opportunity_facts)
                opportunity_fields["data_sources"] = [data_source_ref(row), data_source_ref(aba_phrase_context_row)]
                opportunity_source_rows = [row, aba_phrase_context_row]
            opportunity_action = (
                product_targeting_search_term_action()
                if is_asin_like_search_term
                else SuggestedAction(
                    action_type="promote_search_term",
                    title="加入精准关键词候选",
                    description="人工确认后，可考虑将该搜索词加入精准关键词候选，并单独观察预算和竞价。",
                )
            )
            opportunity_summary = (
                f"ASIN 型搜索词 {row['search_term']} 转化稳定，先人工复核商品定向价值"
                if is_asin_like_search_term
                else f"搜索词 {row['search_term']} 转化稳定，存在放量机会"
            )
            opportunity_why = (
                f"该 ASIN 型搜索词已有 {metrics.orders} 个订单，ACOS 为 {metrics.acos:.2%}。"
                "它不是普通关键词，处理前应先核对商品定向、自动投放上下文和广告商品相关性。"
                if is_asin_like_search_term
                else "该搜索词已有稳定订单，ACOS 低于 25%，说明用户意图和广告商品匹配度较好。"
            )
            signals.append(
                AiSignal(
                    id=f"sig-opportunity-{row['row_id']}",
                    signal_type=SignalType.OPPORTUNITY,
                    **opportunity_fields,
                    object_type=ObjectType.SEARCH_TERM,
                    severity=4,
                    summary=opportunity_summary,
                    why=opportunity_why,
                    evidence=evidence_package(
                        row,
                        ObjectType.SEARCH_TERM,
                        opportunity_facts,
                        source_rows=opportunity_source_rows,
                    ),
                    suggested_action=opportunity_action,
                    risk="放量前需要确认库存、售价和广告预算目标。",
                    tags=["机会点", "搜索词", "低 ACOS"],
                )
            )

        if (
            is_search_term
            and search_query
            and LONG_TAIL_MIN_ORDERS <= metrics.orders < SEARCH_TERM_STRONG_ORDER_THRESHOLD
            and 0 < metrics.cost <= LONG_TAIL_MAX_SPEND
            and metrics.acos is not None
            and metrics.acos <= LONG_TAIL_MAX_ACOS
            and has_actionable_search_term_opportunity_support(
                metrics,
                aba_support_row,
                aba_phrase_context_row,
                is_asin_like_search_term=is_asin_like_search_term,
            )
        ):
            long_tail_uncertainty = "当前是低花费长尾词信号，订单样本仍少，适合人工观察或小预算验证，不能直接判断为稳定放量词。"
            if aba_phrase_context_row is not None:
                long_tail_uncertainty += " 该搜索词同时命中同站点 ABA 热词短语参考；短语参考只作为同类 SearchTerm 市场热度背景，不代表精确搜索词份额。"
            long_tail_facts = [
                EvidenceItem(label="搜索词", value=search_term_label),
                EvidenceItem(label="花费", value=f"{metrics.cost}"),
                EvidenceItem(label="订单", value=str(metrics.orders)),
                EvidenceItem(label="ACOS", value=f"{metrics.acos:.2%}"),
            ]
            if is_asin_like_search_term:
                long_tail_facts.append(asin_search_term_boundary_evidence(row))
                long_tail_uncertainty = (
                    "这是 ASIN 型低花费高转化信号，只能作为商品定向或自动投放上下文复核；"
                    "当前 SP 商品定向详情未完整同步，不能当作普通长尾关键词扩量建议。"
                )
            long_tail_facts.extend(
                search_term_actionability_evidence_items(row, is_asin_like_search_term=is_asin_like_search_term)
            )
            long_tail_fields = signal_fields(
                row,
                signal_category="search_term_opportunity",
                priority=SignalPriority.P2,
                confidence=ConfidenceLevel.MEDIUM,
                evidence_count=len(long_tail_facts),
                uncertainty=long_tail_uncertainty,
            )
            long_tail_source_rows = None
            if aba_support_row is not None:
                long_tail_facts.extend(aba_search_term_evidence_items(aba_support_row))
                long_tail_fields["evidence_count"] = len(long_tail_facts)
                long_tail_fields["data_sources"] = [data_source_ref(row), data_source_ref(aba_support_row)]
                long_tail_source_rows = [row, aba_support_row]
            elif aba_phrase_context_row is not None:
                long_tail_facts.extend(aba_phrase_context_evidence_items(aba_phrase_context_row, row))
                long_tail_fields["evidence_count"] = len(long_tail_facts)
                long_tail_fields["data_sources"] = [data_source_ref(row), data_source_ref(aba_phrase_context_row)]
                long_tail_source_rows = [row, aba_phrase_context_row]
            long_tail_action = (
                product_targeting_search_term_action()
                if is_asin_like_search_term
                else SuggestedAction(
                    action_type="review_long_tail_search_term",
                    title="人工评估长尾词扩量测试",
                    description="人工确认该搜索词与商品语义匹配后，加入机会观察或小流量测试。",
                )
            )
            long_tail_summary = (
                f"ASIN 型搜索词 {search_term_label} 低花费高转化，先人工复核商品定向价值"
                if is_asin_like_search_term
                else f"搜索词 {search_term_label} 低花费高转化，适合加入长尾机会观察"
            )
            long_tail_why = (
                f"该 ASIN 型搜索词周期花费 {metrics.cost}，产生 {metrics.orders} 个订单，ACOS 为 {metrics.acos:.2%}。"
                "它不是普通长尾关键词，处理前应先核对商品定向、自动投放上下文和广告商品相关性。"
                if is_asin_like_search_term
                else (
                    f"该搜索词周期花费 {metrics.cost}，产生 {metrics.orders} 个订单，ACOS 为 {metrics.acos:.2%}，"
                    "说明小样本下转化效率较高。"
                )
            )
            signals.append(
                AiSignal(
                    id=f"sig-long-tail-opportunity-{row['row_id']}",
                    signal_type=SignalType.OPPORTUNITY,
                    **long_tail_fields,
                    object_type=ObjectType.SEARCH_TERM,
                    severity=2,
                    summary=long_tail_summary,
                    why=long_tail_why,
                    evidence=evidence_package(
                        row,
                        ObjectType.SEARCH_TERM,
                        long_tail_facts,
                        source_rows=long_tail_source_rows,
                    ),
                    suggested_action=long_tail_action,
                    risk="该词订单数仍少，不能直接当作稳定高转化词。",
                    tags=["长尾词", "低花费高转化", "搜索词机会"],
                )
            )

        # 暂缓生成“广告位稳定转化机会”：当前广告位多为广告活动粒度，
        # 且缺少预算目标和同活动广告位对比，不能直接给出预算倾斜建议。

        if is_placement and row.get("placement") == "Top of Search" and metrics.acos is not None and metrics.acos > 1:
            signals.append(
                AiSignal(
                    id=f"sig-placement-{row['row_id']}",
                    signal_type=SignalType.ANOMALY,
                    **signal_fields(
                        row,
                        signal_category="placement_efficiency",
                        priority=SignalPriority.P0,
                        confidence=ConfidenceLevel.MEDIUM,
                        evidence_count=4,
                    ),
                    object_type=ObjectType.PLACEMENT,
                    severity=4,
                    summary="搜索结果顶部广告位 ACOS 明显偏高",
                    why="Top of Search 花费高，但销售额承接不足，可能需要降低广告位加价或收紧关键词。",
                    evidence=evidence_package(
                        row,
                        ObjectType.PLACEMENT,
                        [
                            EvidenceItem(label="广告位", value=row["placement"]),
                            EvidenceItem(label="ACOS", value=f"{metrics.acos:.2%}"),
                            EvidenceItem(label="花费", value=f"{metrics.cost}"),
                            EvidenceItem(label="销售额", value=f"{metrics.sales}"),
                        ],
                    ),
                    suggested_action=SuggestedAction(
                        action_type="review_placement_bid",
                        title="复核顶部广告位加价",
                        description="人工确认该广告位是否仍值得抢量；若目标是利润，优先考虑降低广告位加价。",
                    ),
                    risk="若该广告活动目标是新品曝光，不应只按短期 ACOS 判断。",
                    tags=["广告位", "Top of Search", "高 ACOS"],
                )
            )

    signals.extend(detect_aba_market_signals(source_rows, aba_rows or []))
    signals.extend(detect_intent_signals([row for row in source_rows if row.get("source_table") == "ad_search_term_daily_metrics"]))
    signals = aggregate_search_term_opportunity_signals(signals)
    supported_signals = [enforce_signal_confidence_support(signal) for signal in signals]
    return sorted(supported_signals, key=lambda item: item.severity, reverse=True)


def detect_aba_market_signals(rows: list[dict], aba_rows: list[dict]) -> list[AiSignal]:
    aba_index = aba_rows_by_match_key(aba_rows)
    latest_aba_index = latest_aba_rows_by_market_query(aba_rows)
    signals: list[AiSignal] = []
    for row in rows:
        if row.get("source_table") and row.get("source_table") != "ad_search_term_daily_metrics":
            continue
        metrics = metric_snapshot(row)
        if metrics.clicks < ABA_HOT_TERM_CLICK_THRESHOLD or metrics.orders != 0:
            continue
        normalized_query = normalized_search_query(row)
        period = period_key(row)
        if not normalized_query or period is None:
            continue

        aba_row = None
        aba_stale_days = None
        for market_key in market_match_keys(row):
            aba_row = aba_index.get((market_key, period[0], period[1], normalized_query))
            if aba_row is not None:
                break
        if aba_row is None:
            api_end_date = parsed_date(row.get("end_date"))
            for market_key in market_match_keys(row):
                candidate = latest_aba_index.get((market_key, normalized_query))
                if candidate is None:
                    continue
                aba_end_date = parsed_date(candidate.get("end_date"))
                if api_end_date is None or aba_end_date is None:
                    continue
                stale_days = (api_end_date - aba_end_date).days
                if stale_days > ABA_STALE_AFTER_DAYS:
                    aba_row = candidate
                    aba_stale_days = stale_days
                    break
            if aba_row is None:
                continue

        rank = integer_value(aba_row.get("search_frequency_rank"))
        if rank is None or rank > ABA_HOT_TERM_RANK_LIMIT:
            continue

        confidence = ConfidenceLevel.LOW if aba_stale_days is not None else ConfidenceLevel.MEDIUM
        uncertainty = (
            "该信号命中了过期 ABA 热词，只能作为低置信机会提示；需要先重新导入 ABA，再人工确认产品语义、Listing 承接和价格库存。"
            if aba_stale_days is not None
            else "该信号由同周期积加 API 搜索词表现和 ABA 热度共同触发；ABA 是站点级导出数据，仍需人工确认产品语义、Listing 承接和价格库存。"
        )
        facts = [
            EvidenceItem(label="广告搜索词", value=normalized_query),
            EvidenceItem(label="广告点击", value=str(metrics.clicks)),
            EvidenceItem(label="广告订单", value=str(metrics.orders)),
            EvidenceItem(
                label="ABA排名",
                value=str(rank),
                source_type="ABA导出",
                source_name="ABA搜索词快照",
                metric_name="ABA排名",
                metric_value=str(rank),
                time_range=source_time_range(aba_row),
                object_type=ObjectType.SEARCH_TERM.value,
                object_id=string_value(aba_row.get("source_record_id")),
                explanation=f"ABA 导出显示 {aba_row.get('search_term') or normalized_query} 搜索频率排名 {rank}。",
            ),
            EvidenceItem(
                label="ABA排名变化",
                value=aba_rank_change_text(aba_row),
                source_type="ABA导出",
                source_name="ABA搜索词快照",
                metric_name="ABA排名变化",
                metric_value=aba_rank_change_text(aba_row),
                time_range=source_time_range(aba_row),
                object_type=ObjectType.SEARCH_TERM.value,
                object_id=string_value(aba_row.get("source_record_id")),
            ),
        ]
        if aba_stale_days is not None:
            facts.extend(
                [
                    EvidenceItem(
                        label="广告周期",
                        value=source_time_range(row) or "",
                        source_type="积加API",
                        source_name="积加API快照",
                        metric_name="广告周期",
                        metric_value=source_time_range(row) or "",
                        object_type=ObjectType.SEARCH_TERM.value,
                        object_id=string_value(row.get("row_id")),
                    ),
                    EvidenceItem(
                        label="ABA周期",
                        value=source_time_range(aba_row) or "",
                        source_type="ABA导出",
                        source_name="ABA搜索词快照",
                        metric_name="ABA周期",
                        metric_value=source_time_range(aba_row) or "",
                        object_type=ObjectType.SEARCH_TERM.value,
                        object_id=string_value(aba_row.get("source_record_id")),
                    ),
                    EvidenceItem(
                        label="ABA过期天数",
                        value=str(aba_stale_days),
                        source_type="ABA导出",
                        source_name="ABA搜索词快照",
                        metric_name="ABA过期天数",
                        metric_value=str(aba_stale_days),
                        object_type=ObjectType.SEARCH_TERM.value,
                        object_id=string_value(aba_row.get("source_record_id")),
                    ),
                ]
            )
        fields = signal_fields(
            row,
            signal_category="aba_market_opportunity",
            priority=SignalPriority.P1,
            confidence=confidence,
            evidence_count=len(facts),
            uncertainty=uncertainty,
        )
        fields["data_sources"] = [data_source_ref(row), data_source_ref(aba_row)]
        if aba_stale_days is not None:
            fields["freshness_status"] = FreshnessStatus.STALE
        evidence = evidence_package(
            row,
            ObjectType.SEARCH_TERM,
            facts,
        )
        evidence = evidence.model_copy(update={"source_rows": [row, aba_row]})
        signals.append(
            AiSignal(
                id=f"sig-aba-hot-term-no-conversion-{row['row_id']}",
                signal_type=SignalType.OPPORTUNITY,
                **fields,
                object_type=ObjectType.SEARCH_TERM,
                severity=4,
                summary=f"ABA 排名 {rank} 热词 {normalized_query} 有广告点击但没有订单",
                why=(
                    f"该搜索词在 ABA 中属于高热市场词，同时当前店铺广告搜索词已有 {metrics.clicks} 次点击但没有订单。"
                    + (
                        f"但 ABA 周期已经比当前广告周期旧 {aba_stale_days} 天，只能作为低置信机会提示。"
                        if aba_stale_days is not None
                        else "说明市场需求存在，但广告承接或匹配方式需要优先复核。"
                    )
                ),
                evidence=evidence,
                suggested_action=SuggestedAction(
                    action_type="review_aba_hot_search_term",
                    title="人工复核该热词的承接与匹配方式",
                    description="先核对该词是否符合产品人群和使用场景，再检查 Listing、价格、广告匹配方式和搜索词报告；确认后再决定是否降竞价、否词或单独测试。",
                ),
                risk="ABA 是站点级市场数据，不直接归属某个店铺；缺少人工语义和销售承接证据时，不应只凭该信号调整广告。",
                tags=["ABA机会", "搜索词", "有点击无订单"],
            )
        )
    return signals


def semantic_source_for_intent_label(label: str) -> str:
    if label.startswith("规则语义："):
        return "规则语义"
    if is_ungrouped_intent_label(label):
        return "未分组"
    return "原始语义标签"


def search_intent_top_terms(
    rows: list[dict],
    latest_aba_index: dict[tuple[str, str], dict],
    *,
    limit: int = 5,
) -> list[SearchIntentTopTerm]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        query = normalized_search_query(row)
        if query:
            groups[query].append(row)

    top_terms: list[SearchIntentTopTerm] = []
    for query, group_rows in groups.items():
        merged = merge_rows(group_rows)
        metrics = metric_snapshot(merged)
        first_row = group_rows[0]
        aba_row = matched_latest_aba_row_for_search_term(first_row, latest_aba_index) if latest_aba_index else None
        top_terms.append(
            SearchIntentTopTerm(
                search_term=string_value(first_row.get("search_term")) or query,
                normalized_query=query,
                clicks=metrics.clicks,
                cost=metrics.cost,
                orders=metrics.orders,
                sales=metrics.sales,
                acos=metrics.acos,
                aba_rank=integer_value(aba_row.get("search_frequency_rank")) if aba_row is not None else None,
                aba_period=source_time_range(aba_row) if aba_row is not None else None,
                source_row_count=len(group_rows),
            )
        )
    return sorted(top_terms, key=lambda item: (-item.orders, -item.cost, -item.clicks, item.search_term))[:limit]


def search_intent_current_judgement(metrics: MetricSnapshot) -> str:
    if metrics.orders == 0 and metrics.cost >= 30:
        return "当前判断：高消耗无订单，优先打开花费最高的 SearchTerm 信号做止损复核。"
    if metrics.orders >= 3 and metrics.acos is not None and metrics.acos <= 0.3:
        return "当前判断：有订单且 ACOS 较低，优先复核是否存在可人工确认的扩量机会。"
    if metrics.orders > 0:
        return "当前判断：已有订单但样本或 ACOS 还不足以直接放量，先复核具体搜索词和投放词承接。"
    if metrics.clicks >= 20:
        return "当前判断：有点击但暂无订单，先判断搜索意图和商品承接是否偏离。"
    return "当前判断：样本偏少，只适合观察，不应包装成广告调整建议。"


def search_intent_metric_purpose(metrics: MetricSnapshot) -> str:
    acos_text = f"{metrics.acos:.2%}" if metrics.acos is not None else "缺失"
    cvr_text = f"{metrics.cvr:.2%}" if metrics.cvr is not None else "缺失"
    return (
        f"指标目的：花费 {metrics.cost:.2f} 和点击 {metrics.clicks} 判断消耗规模；"
        f"订单 {metrics.orders}、CVR {cvr_text}、ACOS {acos_text} 判断承接质量。"
    )


def search_intent_context_key(row: dict) -> tuple[str, str, str] | None:
    campaign_id = string_value(row.get("campaign_id") or row.get("campaignId"))
    ad_group_id = string_value(row.get("ad_group_id") or row.get("group_id") or row.get("adGroupId"))
    if not campaign_id and not ad_group_id:
        return None
    market_id = string_value(row.get("market_id") or row.get("marketplace_id") or row.get("marketId"))
    return (market_id, campaign_id, ad_group_id)


def search_intent_matching_context_rows(
    group_rows: list[dict],
    context_rows: list[dict],
    source_table: str,
) -> list[dict]:
    context_keys = {key for row in group_rows if (key := search_intent_context_key(row))}
    if not context_keys:
        return []
    matches: list[dict] = []
    seen: set[str] = set()
    for row in context_rows:
        if row.get("source_table") != source_table:
            continue
        if search_intent_context_key(row) not in context_keys:
            continue
        identity = string_value(row.get("row_id") or row.get("source_record_id")) or str(sorted(row.items()))
        if identity in seen:
            continue
        seen.add(identity)
        matches.append(row)
    return matches


def search_intent_ad_asin_labels(group_rows: list[dict], context_rows: list[dict]) -> list[str]:
    direct_labels = {
        label
        for row in group_rows
        if (label := string_value(row.get("asin") or row.get("ad_asin") or row.get("advertised_asin")))
    }
    context_labels = {
        label
        for row in search_intent_matching_context_rows(group_rows, context_rows, "advertised_products")
        if (label := string_value(row.get("asin") or row.get("ad_asin") or row.get("advertised_asin")))
    }
    return sorted(direct_labels | context_labels)


def search_intent_targeting_labels(group_rows: list[dict]) -> list[str]:
    labels = {
        label
        for row in group_rows
        if (
            label := string_value(
                row.get("keyword_text")
                or row.get("targeting_text")
                or row.get("target_text")
                or row.get("targeting")
                or row.get("keyword_id")
                or row.get("target_id")
            )
        )
    }
    return sorted(labels)


def search_intent_ad_context(group_rows: list[dict], context_rows: list[dict] | None = None) -> str:
    context_source_rows = context_rows if context_rows is not None else group_rows
    campaign_labels = sorted(
        {
            label
            for row in group_rows
            if (label := string_value(row.get("campaign_name") or row.get("campaign_id")))
        }
    )
    ad_group_labels = sorted(
        {
            label
            for row in group_rows
            if (label := string_value(row.get("ad_group_name") or row.get("ad_group_id") or row.get("group_id")))
        }
    )
    top_groups = "、".join(ad_group_labels[:2]) if ad_group_labels else "广告组待补齐"
    ad_asin_labels = search_intent_ad_asin_labels(group_rows, context_source_rows)
    targeting_labels = search_intent_targeting_labels(group_rows)
    ad_asin_text = "、".join(ad_asin_labels[:3]) if ad_asin_labels else "广告 ASIN 待补齐"
    targeting_text = "、".join(targeting_labels[:3]) if targeting_labels else "投放词待补齐"
    if len(ad_group_labels) > 1 or len(ad_asin_labels) > 1:
        suffix = "；多广告组或多广告 ASIN 时不能自动归因到单个广告 ASIN。"
    elif len(ad_asin_labels) == 1:
        suffix = "；仍需核对该广告 ASIN 所在广告组的投放商品、投放词和广告位。"
    else:
        suffix = "；缺广告 ASIN 覆盖上下文，不能判断具体广告商品承接。"
    return (
        f"广告上下文：覆盖 {len(campaign_labels)} 个广告活动、{len(ad_group_labels)} 个广告组、{len(group_rows)} 条搜索词表现行；"
        f"关联 {len(ad_asin_labels)} 个广告 ASIN：{ad_asin_text}；"
        f"投放词/投放对象 {len(targeting_labels)} 个：{targeting_text}；Top 广告组：{top_groups}{suffix}"
    )


def search_intent_evidence_gap(group_rows: list[dict], aba_match_count: int, context_rows: list[dict] | None = None) -> str:
    context_source_rows = context_rows if context_rows is not None else group_rows
    gaps: list[str] = []
    ad_asin_labels = search_intent_ad_asin_labels(group_rows, context_source_rows)
    targeting_labels = search_intent_targeting_labels(group_rows)
    if not ad_asin_labels:
        gaps.append("缺广告 ASIN 覆盖上下文")
    elif len(ad_asin_labels) > 1:
        gaps.append("同广告组多广告 ASIN，不能自动归因到单个广告 ASIN")
    if not targeting_labels:
        gaps.append("缺投放词或关键词承接字段")
    if aba_match_count == 0:
        gaps.append("未命中 ABA 站点级热度背景")
    gaps.append("广告位影响需要继续打开广告位证据核对")
    return "证据缺口：" + "；".join(gaps) + "。"


def search_intent_next_manual_step(metrics: MetricSnapshot) -> str:
    if metrics.orders == 0 and metrics.cost >= 30:
        return "打开花费最高且无订单的具体 SearchTerm 信号，人工核对投放词、广告组商品清单和广告位证据后，再决定记录观察或加入复盘。"
    if metrics.orders >= 3 and metrics.acos is not None and metrics.acos <= 0.3:
        return "打开出单最多的具体 SearchTerm 信号，核对投放词、广告组和 ABA 背景后，再人工判断是否加入扩量观察或复盘。"
    return "逐条打开具体 SearchTerm 信号，人工核对投放词、广告组、广告位和证据缺口后再记录观察或加入复盘。"


def search_intent_summaries(
    rows: list[dict] | None = None,
    *,
    aba_rows: list[dict] | None = None,
    context_rows: list[dict] | None = None,
    data_grain: str = "当前广告中实际产生表现的用户搜索词行按搜索意图聚合",
) -> list[SearchIntentSummary]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for row in rows if rows is not None else []:
        if row.get("source_table") != "ad_search_term_daily_metrics":
            continue
        intent_label = resolved_search_intent_label(row)
        groups[intent_label].append({**row, "intent_label": intent_label})

    summaries: list[SearchIntentSummary] = []
    latest_aba_index = latest_aba_rows_by_market_query(aba_rows or [])
    for label, group_rows in groups.items():
        merged = merge_rows(group_rows)
        metrics = metric_snapshot(merged)
        all_terms = search_intent_top_terms(group_rows, latest_aba_index, limit=len(group_rows))
        top_terms = all_terms[:5]
        aba_match_count = sum(1 for term in all_terms if term.aba_rank is not None)
        insight = "需要观察"
        if metrics.orders == 0 and metrics.cost >= 30:
            insight = "这组广告搜索词消耗较高但没有订单，属于止损候选"
        elif metrics.orders >= 3 and metrics.acos is not None and metrics.acos <= 0.3:
            insight = "这组广告搜索词转化稳定，属于放量候选"
        summaries.append(
            SearchIntentSummary(
                intent_label=label,
                search_terms=sorted({term for row in group_rows if (term := string_value(row.get("search_term")))}),
                metrics=metrics,
                insight=insight,
                semantic_source=semantic_source_for_intent_label(label),
                aba_match_count=aba_match_count,
                top_search_terms=top_terms,
                data_grain=data_grain,
                business_question="这组同类广告用户搜索词在当前 Parent ASIN 广告上下文下，是应该扩量、止损，还是只观察？",
                current_judgement=search_intent_current_judgement(metrics),
                metric_purpose=search_intent_metric_purpose(metrics),
                ad_context=search_intent_ad_context(group_rows, context_rows),
                evidence_gap=search_intent_evidence_gap(group_rows, aba_match_count, context_rows),
                next_manual_step=search_intent_next_manual_step(metrics),
            )
        )
    return sorted(summaries, key=lambda item: item.metrics.cost, reverse=True)


def detect_intent_signals(rows: list[dict]) -> list[AiSignal]:
    signals: list[AiSignal] = []
    for summary in search_intent_summaries(rows):
        metrics = summary.metrics
        if metrics.cost >= 30 and metrics.orders == 0:
            row = {
                "row_id": f"intent-{summary.intent_label}",
                "campaign_name": None,
                "ad_group_name": None,
                "asin": None,
                "sku": None,
                "msku": None,
                "product_name": summary.intent_label,
                "placement": None,
                "search_term": " / ".join(summary.search_terms),
                "intent_label": summary.intent_label,
                **metrics.model_dump(),
            }
            source_row = next((item for item in rows if resolved_search_intent_label(item) == summary.intent_label), {})
            row.update(
                {
                    "shop_id": source_row.get("shop_id"),
                    "shop_name": source_row.get("shop_name"),
                    "market_id": source_row.get("market_id"),
                    "marketplace": source_row.get("marketplace"),
                    "country": source_row.get("country"),
                    "source_type": source_row.get("source_type"),
                    "snapshot_id": source_row.get("snapshot_id"),
                    "api_name": source_row.get("api_name"),
                    "source_table": source_row.get("source_table"),
                    "source_record_id": source_row.get("source_record_id"),
                    "start_date": source_row.get("start_date"),
                    "end_date": source_row.get("end_date"),
                }
            )
            signals.append(
                AiSignal(
                    id=f"sig-intent-waste-{summary.intent_label}",
                    signal_type=SignalType.ANOMALY,
                    **signal_fields(
                        row,
                        signal_category="search_intent",
                        priority=SignalPriority.P1,
                        confidence=ConfidenceLevel.LOW,
                        evidence_count=4,
                        uncertainty="广告搜索词聚合第一版由规则生成，且当前仅来自单一数据源，需要人工复核。",
                    ),
                    object_type=ObjectType.SEARCH_INTENT,
                    severity=3,
                    summary=f"{summary.intent_label} 整体消耗偏高但没有订单",
                    why="广告搜索词按意图聚合后仍然没有订单，说明问题不是单个词波动，而是该类意图整体质量偏弱。",
                    evidence=evidence_package(
                        row,
                        ObjectType.SEARCH_INTENT,
                        [
                            EvidenceItem(label="语义标签", value=summary.intent_label),
                            EvidenceItem(label="搜索词数量", value=str(len(summary.search_terms))),
                            EvidenceItem(label="聚合花费", value=f"{metrics.cost}"),
                            EvidenceItem(label="聚合订单", value=str(metrics.orders)),
                        ],
                    ),
                    suggested_action=SuggestedAction(
                        action_type="review_intent_bucket",
                        title="复核这组广告搜索词的投放价值",
                        description="人工检查这组广告搜索词是否偏泛；若与商品弱相关，优先进入人工否词或降竞价候选。",
                    ),
                    risk="语义标签第一版由规则生成，人工反馈后再调准。",
                    tags=["广告搜索词聚合", "异常"],
                )
            )
    return signals


def merge_rows(rows: list[dict]) -> dict:
    merged = dict(rows[0])
    for field in ["impressions", "clicks", "cost", "orders", "sales"]:
        merged[field] = sum(float(row.get(field) or 0) for row in rows)
    merged["impressions"] = int(merged["impressions"])
    merged["clicks"] = int(merged["clicks"])
    merged["orders"] = int(merged["orders"])
    return merged
