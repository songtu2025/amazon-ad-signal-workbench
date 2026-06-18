from typing import Literal

from pydantic import BaseModel, Field

from app.models.signals import SignalStatus


ManualActionType = Literal["observe", "handled", "add_to_review", "ignore"]
ReviewWindow = Literal["7d", "14d"]
ReviewEffectStatus = Literal["not_ready", "ready"]
ReviewEffectResultType = Literal["improved", "no_change", "worse", "unclear"]


class ManualActionEvidenceSnapshot(BaseModel):
    label: str
    value: str
    detail: str | None = None
    source: str | None = None


class ReviewContext(BaseModel):
    search_intent_label: str | None = None
    search_term: str | None = None
    aba_reference_term: str | None = None
    aba_reference_rank: str | None = None
    aba_period: str | None = None
    aba_match_boundary: str | None = None
    manual_action_path: str | None = None
    review_metrics: str | None = None
    repeat_search_intent_count: int = 0
    repeat_aba_reference_count: int = 0
    repeat_summary: str | None = None
    can_auto_change_rules: bool = False
    can_auto_execute_ads: bool = False


class ManualActionRequest(BaseModel):
    action_type: ManualActionType
    action_note: str | None = None
    operator_name: str = "本地运营"
    evidence_snapshot: list[ManualActionEvidenceSnapshot] = Field(default_factory=list)
    expected_product_scope_id: str | None = None
    expected_object_type: str | None = None
    expected_object_id: str | None = None
    expected_can_auto_change_rules: bool = False
    expected_can_auto_execute_ads: bool = False


class ManualActionRecord(BaseModel):
    id: str
    signal_id: str
    action_type: ManualActionType
    action_note: str | None = None
    operator_name: str
    acted_at: str
    manual_status: SignalStatus
    snapshot_id: str | None = None
    shop_id: str | None = None
    market_id: int | None = None
    object_type: str | None = None
    object_id: str | None = None
    object_label: str | None = None
    evidence_snapshot: list[ManualActionEvidenceSnapshot] = Field(default_factory=list)


class ReviewTodo(BaseModel):
    signal_id: str
    action_id: str
    action_type: ManualActionType
    manual_status: SignalStatus
    action_note: str | None = None
    operator_name: str
    acted_at: str
    snapshot_id: str | None = None
    shop_id: str | None = None
    market_id: int | None = None
    object_type: str | None = None
    object_id: str | None = None
    object_label: str | None = None
    evidence_snapshot: list[ManualActionEvidenceSnapshot] = Field(default_factory=list)
    review_context: ReviewContext | None = None
    review_window: ReviewWindow
    due_at: str
    is_due: bool
    days_since_action: int


class ReviewEffectResult(BaseModel):
    signal_id: str
    action_id: str | None = None
    action_type: ManualActionType | None = None
    acted_at: str | None = None
    due_at: str | None = None
    snapshot_id: str | None = None
    shop_id: str | None = None
    market_id: int | None = None
    object_type: str | None = None
    object_id: str | None = None
    object_label: str | None = None
    review_window: ReviewWindow
    status: ReviewEffectStatus
    result: ReviewEffectResultType = "unclear"
    message: str
    before_start_date: str | None = None
    before_end_date: str | None = None
    after_start_date: str | None = None
    after_end_date: str | None = None
    before_metrics: dict[str, int | float | None] = Field(default_factory=dict)
    after_metrics: dict[str, int | float | None] = Field(default_factory=dict)


class ReviewRecordRequest(BaseModel):
    review_note: str | None = None
    reviewer_name: str = "本地运营"
    expected_action_id: str | None = None
    expected_object_type: str | None = None
    expected_object_id: str | None = None
    expected_review_window: ReviewWindow | None = None
    expected_can_auto_change_rules: bool = False
    expected_can_auto_execute_ads: bool = False


class ReviewRecord(BaseModel):
    id: str
    signal_id: str
    action_id: str | None = None
    action_type: ManualActionType | None = None
    acted_at: str | None = None
    snapshot_id: str | None = None
    shop_id: str | None = None
    market_id: int | None = None
    object_type: str | None = None
    object_id: str | None = None
    object_label: str | None = None
    review_window: ReviewWindow
    before_start_date: str | None = None
    before_end_date: str | None = None
    after_start_date: str | None = None
    after_end_date: str | None = None
    before_metrics: dict[str, int | float | None] = Field(default_factory=dict)
    after_metrics: dict[str, int | float | None] = Field(default_factory=dict)
    result: ReviewEffectResultType
    review_note: str | None = None
    reviewer_name: str
    reviewed_at: str
