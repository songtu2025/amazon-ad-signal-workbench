from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class SignalType(str, Enum):
    ANOMALY = "anomaly"
    OPPORTUNITY = "opportunity"


class ObjectType(str, Enum):
    AD_GROUP = "ad_group"
    SALES_PRODUCT = "sales_product"
    ADVERTISED_PRODUCT = "advertised_product"
    SEARCH_TERM = "search_term"
    PLACEMENT = "placement"
    SEARCH_INTENT = "search_intent"
    CROSS = "cross"


class SignalStatus(str, Enum):
    PENDING = "pending"
    ADOPTED = "adopted"
    OBSERVING = "observing"
    IGNORED = "ignored"
    FALSE_POSITIVE = "false_positive"


class SignalPriority(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class FreshnessStatus(str, Enum):
    API_SNAPSHOT = "api_snapshot"
    SAMPLE_DATA = "sample_data"
    UNKNOWN = "unknown"
    STALE = "stale"


class MetricSnapshot(BaseModel):
    impressions: int = 0
    clicks: int = 0
    cost: float = 0
    orders: int = 0
    sales: float = 0
    acos: float | None = None
    cvr: float | None = None
    cpc: float | None = None


class AdObjectRef(BaseModel):
    object_type: ObjectType
    object_id: str
    label: str
    campaign_name: str | None = None
    ad_group_name: str | None = None
    asin: str | None = None
    sku: str | None = None
    msku: str | None = None
    placement: str | None = None
    search_term: str | None = None
    intent_label: str | None = None


class EvidenceItem(BaseModel):
    label: str
    value: str
    note: str | None = None
    source_type: str | None = None
    source_name: str | None = None
    metric_name: str | None = None
    metric_value: str | None = None
    comparison_value: str | None = None
    time_range: str | None = None
    object_type: str | None = None
    object_id: str | None = None
    explanation: str | None = None


class DataSourceRef(BaseModel):
    source_type: str
    source_name: str
    snapshot_id: str | None = None
    api_name: str | None = None
    source_table: str | None = None
    source_record_id: str | None = None
    source_file: str | None = None
    market_id: int | None = None
    start_date: str | None = None
    end_date: str | None = None


class EvidencePackage(BaseModel):
    period_days: int
    primary_object: AdObjectRef
    metrics: MetricSnapshot
    comparison: list[EvidenceItem] = Field(default_factory=list)
    facts: list[EvidenceItem] = Field(default_factory=list)
    source_rows: list[dict[str, Any]] = Field(default_factory=list)


class SuggestedAction(BaseModel):
    action_type: str
    title: str
    description: str
    requires_manual_confirmation: bool = True


class AiSignal(BaseModel):
    id: str
    signal_type: SignalType
    signal_category: str
    priority: SignalPriority
    confidence: ConfidenceLevel
    shop_id: str
    shop_name: str | None = None
    market_id: int | None = None
    marketplace: str | None = None
    country: str | None = None
    object_type: ObjectType
    severity: int = Field(ge=1, le=5)
    summary: str
    why: str
    evidence: EvidencePackage
    evidence_count: int = 0
    data_sources: list[DataSourceRef] = Field(default_factory=list)
    freshness_status: FreshnessStatus = FreshnessStatus.UNKNOWN
    detected_at: str
    uncertainty: str
    suggested_action: SuggestedAction
    risk: str
    status: SignalStatus = SignalStatus.PENDING
    manual_status: SignalStatus = SignalStatus.PENDING
    review_result: str | None = None
    tags: list[str] = Field(default_factory=list)


class SearchIntentTopTerm(BaseModel):
    search_term: str
    normalized_query: str | None = None
    clicks: int = 0
    cost: float = 0
    orders: int = 0
    sales: float = 0
    acos: float | None = None
    aba_rank: int | None = None
    aba_period: str | None = None
    source_row_count: int = 0


class SearchIntentSummary(BaseModel):
    intent_label: str
    search_terms: list[str]
    metrics: MetricSnapshot
    insight: str
    semantic_source: str = "未知"
    aba_match_count: int = 0
    top_search_terms: list[SearchIntentTopTerm] = Field(default_factory=list)
    data_grain: str = "当前广告中实际产生表现的用户搜索词行按搜索意图聚合"
    business_question: str = "这组同类广告用户搜索词在当前 Parent ASIN 广告上下文下，是应该扩量、止损，还是只观察？"
    current_judgement: str = "需要结合花费、点击、订单、ACOS、广告组和投放词继续人工复核。"
    metric_purpose: str = "花费和点击用于判断消耗规模，订单、CVR 和 ACOS 用于判断广告搜索词承接质量。"
    ad_context: str = "广告上下文待补充。"
    evidence_gap: str = "需要继续核对投放词、广告组商品清单和广告位表现，才能转成具体人工动作。"
    proves: str = "能证明同类广告搜索词在当前广告上下文内的花费、点击、订单和 ABA 背景。"
    does_not_prove: str = "不能证明 Parent ASIN 下全部自然搜索或市场搜索表现，不能证明单个 ASIN 归因，也不能生成广告搜索词聚合上下文人工动作。"
    next_manual_step: str = "逐条打开具体 SearchTerm 信号，人工核对投放词、广告组、广告位和证据缺口后再记录观察或加入复盘。"
