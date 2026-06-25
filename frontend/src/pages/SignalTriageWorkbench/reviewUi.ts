export interface ReviewTodoForUi {
  signal_id?: string;
  action_id?: string | null;
  shop_id?: string | null;
  market_id?: number | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  action_type?: "observe" | "handled" | "add_to_review" | "ignore";
  action_note?: string | null;
  operator_name?: string | null;
  acted_at?: string | null;
  evidence_snapshot?: ManualActionEvidenceSnapshotForUi[] | null;
  review_context?: ReviewContextForUi | null;
  review_window: "7d" | "14d";
  due_at: string;
  is_due: boolean;
}

export interface ReviewTodoQueueSummary<T extends ReviewTodoForUi = ReviewTodoForUi> {
  total: number;
  due: number;
  pending: number;
  text: string;
  description: string;
  next: T | null;
  nextLabel: string | null;
  nextDueDate: string | null;
}

export interface ReviewTodoQueueDetailRow {
  key: string;
  label: string;
  contextText?: string | null;
  statusText: string;
  dueDate: string;
  isDue: boolean;
  signalId?: string;
}

export interface ReviewTodoQueueDetails {
  title: string;
  description: string;
  rows: ReviewTodoQueueDetailRow[];
}

export interface ReviewTodoScopeHintInput {
  currentTotal: number;
  globalTotal: number;
  isGlobalScope: boolean;
}

export interface ReviewTodoScopeHint {
  text: string;
  actionScopeId: "all";
  actionLabel: string;
}

export interface ProductScopeForReviewTodo {
  scope_id: string;
  scope_type?: string | null;
  asin?: string | null;
  parent_asin?: string | null;
  child_asins?: string[];
}

export interface ReviewEffectForUi {
  signal_id?: string;
  action_id?: string | null;
  action_type?: "observe" | "handled" | "add_to_review" | "ignore" | null;
  acted_at?: string | null;
  due_at?: string | null;
  snapshot_id?: string | null;
  shop_id?: string | null;
  market_id?: number | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  review_window: "7d" | "14d";
  status: "not_ready" | "ready";
  result: "improved" | "no_change" | "worse" | "unclear";
  message: string;
  before_start_date?: string | null;
  before_end_date?: string | null;
  after_start_date?: string | null;
  after_end_date?: string | null;
  before_metrics?: Partial<Record<"cost" | "orders" | "sales" | "acos" | "cvr" | "cpc", number | null>>;
  after_metrics?: Partial<Record<"cost" | "orders" | "sales" | "acos" | "cvr" | "cpc", number | null>>;
}

export interface ReviewRecordForUi {
  signal_id?: string;
  action_id?: string | null;
  action_type?: "observe" | "handled" | "add_to_review" | "ignore" | null;
  acted_at?: string | null;
  snapshot_id?: string | null;
  shop_id?: string | null;
  market_id?: number | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  review_window?: "7d" | "14d";
  before_start_date?: string | null;
  before_end_date?: string | null;
  after_start_date?: string | null;
  after_end_date?: string | null;
  before_metrics?: Partial<Record<"cost" | "orders" | "sales" | "acos" | "cvr" | "cpc", number | null>>;
  after_metrics?: Partial<Record<"cost" | "orders" | "sales" | "acos" | "cvr" | "cpc", number | null>>;
  evidence_snapshot?: ManualActionEvidenceSnapshotForUi[] | null;
  review_context?: ReviewContextForUi | null;
  result: "improved" | "no_change" | "worse" | "unclear";
  review_note?: string | null;
}

export interface ReviewRecordReadbackTarget {
  requestSignalId: string;
  stateSignalId: string;
  objectType?: string;
  objectId?: string;
}

export interface ReviewRecordReadbackExpectation {
  actionId?: string | null;
  objectType?: string | null;
  objectId?: string | null;
  reviewWindow?: "7d" | "14d" | null;
}

export interface ReviewRecordRequestPayloadForUi {
  review_note?: string | null;
  reviewer_name?: string;
  expected_action_id?: string | null;
  expected_object_type?: string | null;
  expected_object_id?: string | null;
  expected_review_window?: "7d" | "14d" | null;
  expected_evidence_snapshot: ManualActionEvidenceSnapshotForUi[];
  expected_can_auto_change_rules: false;
  expected_can_auto_execute_ads: false;
}

export interface ManualActionForUi {
  id?: string | null;
  signal_id?: string | null;
  action_type: "observe" | "handled" | "add_to_review" | "ignore";
  shop_id?: string | null;
  market_id?: number | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  action_note?: string | null;
  operator_name?: string | null;
  acted_at?: string | null;
  evidence_snapshot?: ManualActionEvidenceSnapshotForUi[] | null;
}

export interface ManualActionEvidenceSnapshotForUi {
  label: string;
  value: string;
  detail?: string | null;
  source?: string | null;
}

export interface ManualActionRequestPayloadForUi {
  action_type: ManualActionForUi["action_type"];
  action_note: string;
  operator_name: string;
  evidence_snapshot: ManualActionEvidenceSnapshotForUi[];
  expected_product_scope_id?: string | null;
  expected_object_type?: string | null;
  expected_object_id?: string | null;
  expected_can_auto_change_rules: false;
  expected_can_auto_execute_ads: false;
}

export interface ManualActionRequestPayloadInput {
  actionType: ManualActionForUi["action_type"];
  actionLabel: string;
  operatorName: string;
  productScopeId?: string | null;
  evidenceSnapshot?: ManualActionEvidenceSnapshotForUi[] | null;
  preflight?: ManualActionPreflightForUi | null;
}

export interface ManualActionDisplayEvidenceSnapshotInput {
  fallbackEvidenceSnapshot?: ManualActionEvidenceSnapshotForUi[] | null;
  preflight?: ManualActionPreflightForUi | null;
}

export interface ManualActionPostWritePreflightRequestForUi {
  marketId?: number | null;
  top: number;
  productScopeId?: string | null;
  expectedObjectId?: string | null;
  expectedObjectType?: string | null;
  actionType?: ManualActionForUi["action_type"] | null;
  expectWritten: true;
}

export interface ManualActionPostWritePreflightRequestInput {
  action: ManualActionForUi;
  fallbackMarketId?: number | null;
  productScopeId?: string | null;
  top?: number;
}

export interface ReviewContextForUi {
  search_intent_label?: string | null;
  search_term?: string | null;
  aba_reference_term?: string | null;
  aba_reference_rank?: string | null;
  aba_period?: string | null;
  aba_match_boundary?: string | null;
  manual_action_path?: string | null;
  review_metrics?: string | null;
  repeat_search_intent_count?: number | null;
  repeat_aba_reference_count?: number | null;
  repeat_summary?: string | null;
  can_auto_change_rules?: boolean | null;
  can_auto_execute_ads?: boolean | null;
}

export interface ManualActionEvidenceSnapshotInput {
  label?: string | null;
  value?: string | null;
  detail?: string | null;
  source?: string | null;
}

export interface SearchIntentManualActionContextInput {
  intentLabel?: string | null;
  searchTerm?: string | null;
  abaReferenceTerm?: string | null;
  abaRank?: string | number | null;
  abaPeriod?: string | null;
  abaMatchBoundary?: string | null;
}

export type SearchIntentManualActionReadbackTone = "ready" | "warning" | "waiting";
export type SearchIntentManualActionPreflightConsistencyTone = "ready" | "blocked" | "waiting";

export interface SearchIntentManualActionReadbackInput {
  evidenceSnapshot?: ManualActionEvidenceSnapshotForUi[] | null;
  operationDecisionLabel?: string | null;
  operationDecisionReason?: string | null;
  primarySearchTerm?: string | null;
  primarySearchTermReason?: string | null;
  nextManualStep?: string | null;
}

export interface SearchIntentManualActionReadbackSummary {
  title: string;
  tone: SearchIntentManualActionReadbackTone;
  rows: { label: string; value: string; detail: string }[];
  boundary: string;
}

export interface SearchIntentManualActionPreflightConsistencyInput {
  readback?: SearchIntentManualActionReadbackSummary | null;
  preflight?: ManualActionPreflightForUi | null;
}

export interface SearchIntentManualActionPreflightConsistencySummary {
  title: string;
  tone: SearchIntentManualActionPreflightConsistencyTone;
  rows: { label: string; value: string; detail: string }[];
  boundary: string;
}

export interface ManualActionPreflightForUi {
  status?: string | null;
  mode?: string | null;
  will_write?: boolean | null;
  requires_explicit_authorization?: boolean | null;
  selected_market_id?: number | null;
  selected_product_scope_id?: string | null;
  target?: {
    signal_id?: string | null;
    action_type?: ManualActionForUi["action_type"] | string | null;
    object_type?: string | null;
    object_id?: string | null;
    source_object_id?: string | null;
    object_label?: string | null;
    shop_id?: string | null;
    shop_name?: string | null;
    market_id?: number | null;
    review_windows?: string[];
  } | null;
  current_counts?: {
    target_manual_action_count?: number | null;
    target_review_todo_count?: number | null;
    target_review_record_count?: number | null;
  } | null;
  expected_after_write?: {
    target_manual_action_count?: number | null;
    target_review_todo_count?: number | null;
    target_review_record_count?: number | null;
  } | null;
  blockers?: { code?: string | null; message?: string | null }[];
  forbidden_effects?: string[];
  evidence_snapshot_preview?: {
    status?: string | null;
    will_write?: boolean | null;
    will_save_on_authorized_write?: boolean | null;
    item_count?: number | null;
    sources?: string[];
    items?: ManualActionEvidenceSnapshotForUi[] | null;
    boundary?: string | null;
  } | null;
  post_write_checks?: {
    target_manual_action_evidence_snapshot_counts?: ManualActionPostWriteEvidenceSnapshotCountForUi[] | null;
    target_review_todo_evidence_snapshot_counts?: ManualActionPostWriteEvidenceSnapshotCountForUi[] | null;
  } | null;
}

export type ManualActionPreflightsByActionForUi = Partial<
  Record<ManualActionForUi["action_type"], ManualActionPreflightForUi | null>
>;

export type ManualActionPreflightErrorsByActionForUi = Partial<Record<ManualActionForUi["action_type"], string | null>>;

interface ManualActionPostWriteEvidenceSnapshotCountForUi {
  signal_id?: string | null;
  object_type?: string | null;
  object_id?: string | null;
  review_window?: string | null;
  evidence_snapshot_count?: number | null;
}

export interface ManualActionButtonGate {
  disabled: boolean;
  reason: string | null;
  compactReason: string | null;
}

export interface ManualActionChoiceGuideItem {
  actionType: ManualActionForUi["action_type"];
  label: string;
  whenToUse: string;
  writes: string;
  boundary: string;
}

export interface ManualActionChoiceRecommendation {
  actionType: ManualActionForUi["action_type"];
  label: string;
  tone: "ready" | "blocked";
  title: string;
  reason: string;
  evidenceLink: string;
  evidenceBoundary: string;
  reviewPlan: string;
  boundary: string;
}

export interface ManualActionChoiceRecommendationInput {
  recommendedActionType?: ManualActionForUi["action_type"] | null;
  gatesByAction: Partial<Record<ManualActionForUi["action_type"], ManualActionButtonGate>>;
  diagnosisEvidence?: DiagnosisEvidenceSummaryForManualBridge | null;
}

export interface ManualActionExpectedTargetForUi {
  objectType?: string | null;
  objectId?: string | null;
  actionType?: ManualActionForUi["action_type"] | string | null;
}

export function manualActionPreflightForAction(
  actionType: ManualActionForUi["action_type"],
  preflightsByAction: ManualActionPreflightsByActionForUi,
  fallbackPreflight: ManualActionPreflightForUi | null = null,
) {
  const actionPreflight = preflightsByAction[actionType] ?? null;
  if (actionPreflight) return actionPreflight;
  const fallbackActionType = normalizedPreflightTargetValue(fallbackPreflight?.target?.action_type);
  return fallbackActionType === actionType ? fallbackPreflight : null;
}

export function manualActionPreflightErrorForAction(
  actionType: ManualActionForUi["action_type"],
  errorsByAction: ManualActionPreflightErrorsByActionForUi,
  fallbackError: string | null = null,
) {
  if (Object.prototype.hasOwnProperty.call(errorsByAction, actionType)) {
    return errorsByAction[actionType] ?? null;
  }
  return fallbackError;
}

export interface ManualActionPostWriteContractItem {
  label: string;
  value: string;
  detail: string;
}

export interface ManualActionAuthorizationReadinessSummary {
  title: string;
  tone: "ready" | "blocked" | "waiting";
  primary: string;
  target: string;
  currentState: string;
  authorizedResult: string;
  evidence: string;
  boundary: string;
}

export interface ManualConfirmationEvidenceForUi {
  label: string;
  value: string;
  detail?: string | null;
}

export interface ManualConfirmationEvidenceReadinessRow {
  label: string;
  value: string;
  detail: string;
  tone: "ready" | "waiting" | "blocked";
}

export interface ManualConfirmationEvidenceReadinessSummary {
  title: string;
  tone: "ready" | "waiting" | "blocked";
  summary: string;
  rows: ManualConfirmationEvidenceReadinessRow[];
  boundary: string;
}

export interface DiagnosisEvidenceSummaryForManualBridge {
  title?: string | null;
  businessQuestion?: string | null;
  objectReadback?: string | null;
  proves?: string | null;
  doesNotProve?: string | null;
  evidenceGap?: string | null;
  nextManualStep?: string | null;
}

export interface ManualConfirmationDiagnosisBridgeRow {
  label: string;
  value: string;
  detail: string;
  tone: "ready" | "waiting" | "blocked";
}

export interface ManualConfirmationDiagnosisBridgeSummary {
  title: string;
  tone: "ready" | "waiting" | "blocked";
  summary: string;
  rows: ManualConfirmationDiagnosisBridgeRow[];
  boundary: string;
}

export interface ReviewTodoEvidenceReadbackRow {
  label: string;
  value: string;
  detail: string;
  tone: "ready" | "waiting" | "blocked";
}

export interface ReviewTodoEvidenceReadbackSummary {
  title: string;
  tone: "ready" | "waiting" | "blocked";
  summary: string;
  rows: ReviewTodoEvidenceReadbackRow[];
  boundary: string;
}

export interface ReviewTodoDecisionReadbackSummary {
  title: string;
  tone: "ready" | "waiting" | "blocked";
  summary: string;
  rows: ReviewTodoEvidenceReadbackRow[];
  boundary: string;
}

export interface ManualActionPathStep {
  label: string;
  value: string;
  detail: string;
  tone: "ready" | "waiting" | "blocked" | "done";
}

export interface ManualActionPathStepInput {
  preflight: ManualActionPreflightForUi | null;
  preflightError: string | null;
  latestManualAction: Pick<ManualActionForUi, "action_type" | "evidence_snapshot"> | null;
  hasReviewTodo: boolean;
}

export interface ManualActionReadbackPathItem {
  label: string;
  value: string;
  detail: string;
  tone: "empty" | "waiting" | "ready" | "blocked" | "saved";
}

export interface ManualActionReadbackPathInput {
  latestManualAction: Pick<ManualActionForUi, "action_type" | "evidence_snapshot"> | null;
  reviewTodos: ReviewTodoForUi[];
  reviewRecords: ReviewRecordForUi[];
}

export interface ManualActionIdentityGateItem {
  label: string;
  value: string;
  detail: string;
  tone: "ready" | "waiting" | "blocked";
}

export interface ManualActionIdentityGateInput {
  signal: ReviewSignalForUi | null;
  preflight: ManualActionPreflightForUi | null;
  latestManualAction: ManualActionForUi | null;
  nextReviewTodo: ReviewTodoForUi | null;
  fallbackMarketId?: number | null;
}

export interface ManualReviewClosureLedgerInput {
  manualActionCount: number;
  reviewTodoCount: number;
  reviewRecordCount: number;
  reviewEffectStatus?: "not_ready" | "ready" | string | null;
  nextReviewDueAt?: string | null;
}

export interface ManualReviewClosureLedgerRow {
  label: string;
  value: string;
  detail: string;
  tone: "empty" | "waiting" | "ready" | "saved";
}

export interface ManualReviewClosureLedger {
  title: string;
  summary: string;
  rows: ManualReviewClosureLedgerRow[];
  boundary: string;
}

export interface ManualReviewEvidencePathReadbackInput {
  latestManualAction: ManualActionForUi | null;
  reviewTodos: ReviewTodoForUi[];
  reviewRecords: ReviewRecordForUi[];
}

export interface ManualReviewEvidencePathReadback {
  title: string;
  tone: "ready" | "waiting" | "blocked" | "saved";
  summary: string;
  rows: ReviewTodoEvidenceReadbackRow[];
  boundary: string;
}

export interface ReviewApplicabilityForUi {
  object_type?: string | null;
  signal_category?: string | null;
}

export interface ReviewSignalForUi {
  id?: string | null;
  shop_id?: string | null;
  market_id?: number | null;
  object_type?: string | null;
  evidence?: {
    primary_object?: {
      object_type?: string | null;
      object_id?: string | null;
      asin?: string | null;
      label?: string | null;
      search_term?: string | null;
      intent_label?: string | null;
    } | null;
    facts?: {
      label?: string | null;
      value?: string | number | null;
      metric_name?: string | null;
      metric_value?: string | number | null;
      time_range?: string | null;
    }[] | null;
  } | null;
}

export interface ReviewMetricComparisonRow {
  label: string;
  before: string;
  after: string;
}

export interface RuleImprovementReadiness {
  title: string;
  description: string;
  nextStep: string;
  tone: "blocked" | "ready" | "saved";
}

export interface RuleFeedbackCandidate {
  title: string;
  basis: string;
  recommendation: string;
  boundary: string;
}

export interface ReviewRecordPreflightCheck {
  id:
    | "target_identity"
    | "action_evidence_snapshot"
    | "diagnosis_path"
    | "diagnosis_path_missing"
    | "ai_admission"
    | "ai_admission_missing"
    | "search_term_performance_decision"
    | "search_term_performance_decision_missing"
    | "search_term_boundary"
    | "search_term_boundary_missing"
    | "placement_boundary"
    | "placement_boundary_missing"
    | "placement_performance"
    | "placement_performance_missing"
    | "ad_product_coverage"
    | "ad_product_coverage_missing"
    | "targeting_evidence"
    | "targeting_evidence_missing"
    | "ad_group_synthesis"
    | "ad_group_synthesis_missing"
    | "ad_group_product_performance"
    | "ad_group_product_performance_missing"
    | "ad_context_rows"
    | "ad_context_rows_missing"
    | "aba_context"
    | "aba_context_missing"
    | "evidence_gap"
    | "evidence_gap_missing"
    | "required_evidence"
    | "required_evidence_missing"
    | "manual_action_boundary"
    | "manual_action_boundary_missing"
    | "window_integrity"
    | "metric_basis"
    | "review_result_boundary"
    | "rule_feedback_boundary"
    | "todo_evidence_signature"
    | "todo_evidence_signature_missing"
    | "todo_object_reference"
    | "todo_object_reference_missing";
  title: string;
  description: string;
}

export interface ReviewRecordSaveGateSummary {
  tone: "blocked" | "ready" | "saved";
  title: string;
  detail: string;
  canSave: boolean;
}

export interface ReviewRecordSavePathSummary {
  title: string;
  tone: "ready" | "waiting" | "blocked";
  rows: ReviewTodoEvidenceReadbackRow[];
  boundary: string;
}

export interface ReviewEffectWindowLedger {
  tone: "waiting" | "blocked" | "ready" | "saved";
  title: string;
  status: string;
  beforeWindow: string;
  afterWindow: string;
  metricCoverage: string;
  nextStep: string;
  boundary: string;
}

const baseRequiredReviewRecordPreflightCheckIds: ReviewRecordPreflightCheck["id"][] = [
  "target_identity",
  "action_evidence_snapshot",
  "diagnosis_path",
  "ai_admission",
  "search_term_boundary",
  "placement_boundary",
  "window_integrity",
  "metric_basis",
  "review_result_boundary",
  "rule_feedback_boundary",
  "todo_evidence_signature",
  "todo_object_reference",
];

const advertisedProductRequiredReviewRecordPreflightCheckIds: ReviewRecordPreflightCheck["id"][] = [
  "ad_product_coverage",
  "ad_group_synthesis",
  "ad_group_product_performance",
  "evidence_gap",
  "required_evidence",
  "manual_action_boundary",
];

const placementRequiredReviewRecordPreflightCheckIds: ReviewRecordPreflightCheck["id"][] = [
  "placement_performance",
  "evidence_gap",
  "required_evidence",
  "manual_action_boundary",
];

const requiredReviewRecordPreflightCheckLabels: Record<ReviewRecordPreflightCheck["id"], string> = {
  target_identity: "复盘对象",
  action_evidence_snapshot: "人工动作证据",
  diagnosis_path: "原始诊断路径",
  diagnosis_path_missing: "原始诊断路径缺失",
  ai_admission: "AI 准入理由",
  ai_admission_missing: "AI 准入理由缺失",
  search_term_performance_decision: "搜索词表现判断",
  search_term_performance_decision_missing: "搜索词表现判断缺失",
  search_term_boundary: "搜索词边界",
  search_term_boundary_missing: "搜索词边界缺失",
  placement_boundary: "广告位边界",
  placement_boundary_missing: "广告位边界缺失",
  placement_performance: "广告位表现",
  placement_performance_missing: "广告位表现缺失",
  ad_product_coverage: "广告商品覆盖",
  ad_product_coverage_missing: "广告商品覆盖缺失",
  targeting_evidence: "投放词证据",
  targeting_evidence_missing: "投放词证据缺失",
  ad_group_synthesis: "广告组合流判断",
  ad_group_synthesis_missing: "广告组合流判断缺失",
  ad_group_product_performance: "同组投放商品表现",
  ad_group_product_performance_missing: "同组投放商品表现缺失",
  ad_context_rows: "逐投放复核顺序",
  ad_context_rows_missing: "逐投放复核顺序缺失",
  aba_context: "ABA 背景",
  aba_context_missing: "ABA 背景缺失",
  evidence_gap: "证据缺口",
  evidence_gap_missing: "证据缺口缺失",
  required_evidence: "需要补证",
  required_evidence_missing: "需要补证缺失",
  manual_action_boundary: "动作边界",
  manual_action_boundary_missing: "动作边界缺失",
  window_integrity: "复盘窗口",
  metric_basis: "指标口径",
  review_result_boundary: "结论边界",
  rule_feedback_boundary: "规则反馈边界",
  todo_evidence_signature: "待办证据一致性",
  todo_evidence_signature_missing: "待办证据不一致",
  todo_object_reference: "待办证据对象引用",
  todo_object_reference_missing: "待办证据对象错配",
};

export interface BackendRuleImprovementForUi {
  status?: string | null;
  title?: string | null;
  reason?: string | null;
  next_step?: string | null;
  can_auto_change_rules?: boolean | null;
  can_auto_execute_ads?: boolean | null;
}

export interface BackendReviewWaitSummaryForUi {
  status?: string | null;
  ready_count?: number | null;
  not_ready_count?: number | null;
  earliest_due_at?: string | null;
  earliest_due_date?: string | null;
  review_windows?: string[];
  next_object_type?: string | null;
  next_object_id?: string | null;
  next_object_label?: string | null;
  message?: string | null;
  next_step?: string | null;
  forbidden_actions?: string[];
}

const reviewWindowLabel: Record<ReviewTodoForUi["review_window"], string> = {
  "7d": "7 天",
  "14d": "14 天",
};

function reviewWindowsDisplayText(windows?: Array<string | null | undefined> | null) {
  const visibleWindows = windows?.filter((window): window is string => Boolean(window)) ?? [];
  const labels = visibleWindows.map((window) => reviewWindowLabel[window as ReviewTodoForUi["review_window"]] ?? window);
  return labels.length > 0 ? labels.join(" / ") : "7 天 / 14 天";
}

type ManualActionReviewTargetLike = {
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
};

function manualActionReviewTargetDisplayText(target?: ManualActionReviewTargetLike | null) {
  if (!target?.object_type || !target?.object_id) return "目标对象待确认";
  if (target.object_type === "search_term") {
    return reviewObjectIdentityDisplayText(target.object_type, target.object_id, target.object_label) || "目标对象待确认";
  }
  return normalizedPreflightTargetValue(target.object_label) || normalizedPreflightTargetValue(target.object_id) || "目标对象待确认";
}

export function reviewTodoStatusText(todo: ReviewTodoForUi) {
  return `${reviewWindowLabel[todo.review_window]}复盘${todo.is_due ? "已到期" : "未到期"}`;
}

export function reviewCheckpointText(todo: ReviewTodoForUi | null, effect: ReviewEffectForUi | null) {
  if (!todo) return "暂无复盘待办：记录观察、标记已处理或加入复盘后才会生成 7/14 天复盘。";
  const statusText = reviewTodoStatusText(todo);
  if (!todo.is_due && effect?.status !== "ready") {
    const suffix = effect ? "；当前复盘效果仅说明窗口尚未完整，未到期前不保存复盘记录。" : "，未到期前不保存复盘记录。";
    return `${statusText}：到 ${String(todo.due_at).slice(0, 10)} 后再判断处理前后指标${suffix}`;
  }
  if (!effect) {
    return `${statusText}：正在读取复盘效果。`;
  }
  if (effect.status === "ready") return `${statusText}：已具备处理前后指标，可以保存复盘记录。`;
  if (effect.status === "not_ready") return `${statusText}：${effect.message}`;
  return `${statusText}：${effect.message}`;
}

export function manualActionEmptyStateText(preflight: ManualActionPreflightForUi | null) {
  const evidenceCount = numberOrZero(preflight?.evidence_snapshot_preview?.item_count);
  if (evidenceCount > 0) {
    return `暂无人工处理记录：当前未产生证据快照留痕；人工留痕准入已给出 ${evidenceCount} 条点击后可保存的证据快照；只有人工点击后才保存留痕和复盘排程，不执行广告动作。`;
  }
  return "暂无人工处理记录：当前未产生证据快照留痕；先完成对象和证据准入核对，再由人工选择记录观察、标记已处理、加入复盘或忽略本次。";
}

export function reviewTodoEmptyStateText(latestManualAction: Pick<ManualActionForUi, "action_type" | "evidence_snapshot"> | null) {
  if (!latestManualAction) {
    return "暂无复盘待办：当前还没有人工留痕；先完成人工记录或加入复盘后，系统才会生成 7/14 天复盘排程。";
  }
  const evidenceText = latestManualAction.evidence_snapshot?.length
    ? "已有留痕证据快照，但当前没有复盘排程"
    : "该留痕缺少证据快照，不能反推当时判断依据";
  return `暂无复盘待办：已有人工留痕但未读到 7/14 天待办；${evidenceText}；不能保存复盘结论。`;
}

export function buildManualActionPathSteps(input: ManualActionPathStepInput): ManualActionPathStep[] {
  const blockers = input.preflight?.blockers ?? [];
  const evidenceCount = numberOrZero(input.preflight?.evidence_snapshot_preview?.item_count);
  const preflightBlocked = Boolean(input.preflightError || input.preflight?.status === "blocked" || blockers.length > 0);
  const preflightReady = Boolean(input.preflight && !preflightBlocked && input.preflight.will_write === false);
  const hasManualAction = Boolean(input.latestManualAction);

  return [
    {
      label: "人工留痕准入",
      value: preflightBlocked ? "已阻塞" : preflightReady ? "已通过" : "读取中",
      detail: preflightBlocked
        ? "对象或证据未通过核对时不会写入人工动作。"
        : preflightReady
          ? "对象和证据已通过核对，只能由人工点击后写入留痕。"
          : "读取完成前按钮保持受控，不写入人工动作。",
      tone: preflightBlocked ? "blocked" : preflightReady ? "ready" : "waiting",
    },
    {
      label: "证据快照",
      value: evidenceCount > 0 ? `${evidenceCount} 条` : "待补证",
      detail: evidenceCount > 0 ? "这些证据只会在人工点击后保存，用于后续复盘回看。" : "未读到可保存证据时，不应进入人工留痕。",
      tone: evidenceCount > 0 ? "ready" : "waiting",
    },
    {
      label: "人工留痕",
      value: hasManualAction ? "已留痕" : preflightReady ? "待人工点击" : "等待预检",
      detail: hasManualAction
        ? "已存在人工动作记录，继续核对复盘待办和证据快照。"
        : preflightReady
          ? "人工可选择记录观察、标记已处理、加入复盘或忽略本次。"
          : "预检通过前不开放写入路径。",
      tone: hasManualAction ? "done" : preflightReady ? "waiting" : "blocked",
    },
    {
      label: "7/14 天复盘",
      value: input.hasReviewTodo ? "已排程" : hasManualAction ? "未读到待办" : "留痕后生成",
      detail: input.hasReviewTodo
        ? "复盘待办只表示进入排程，未到期不判断效果。"
        : "没有复盘待办时不保存复盘结论。",
      tone: input.hasReviewTodo ? "done" : hasManualAction ? "blocked" : "waiting",
    },
  ];
}

export function reviewTargetReadbackText(
  target:
    | {
        shop_id?: string | null;
        market_id?: number | null;
        object_type?: string | null;
        object_id?: string | null;
        object_label?: string | null;
      }
    | null
    | undefined,
) {
  if (!target) return null;
  const shopText = `店铺：${String(target.shop_id ?? "").trim() || "待补充"}`;
  const marketText = target.market_id != null ? `站点：market_id ${target.market_id}` : "站点：待补充";
  const objectType = String(target.object_type ?? "").trim() || "对象";
  const objectId = String(target.object_id ?? target.object_label ?? "").trim() || "待补充";
  const objectText = reviewObjectIdentityDisplayText(objectType, objectId, target.object_label) || `${objectType} / ${objectId}`;
  return `${shopText}；${marketText}；对象：${objectText}`;
}

export function reviewEffectTargetReadbackText(effect: ReviewEffectForUi | null | undefined) {
  if (!effect) return null;
  const targetText = reviewTargetReadbackText(effect) ?? "店铺：待补充；站点：待补充；对象：待补充";
  const actionType = String(effect.action_type ?? "").trim() || "待补充";
  const actionId = String(effect.action_id ?? "").trim() || "待补充";
  return `${targetText}；人工动作：${actionType} / ${actionId}；窗口：${reviewWindowLabel[effect.review_window]}`;
}

export function reviewRecordTargetReadbackText(record: ReviewRecordForUi | null | undefined) {
  if (!record) return null;
  const targetText = reviewTargetReadbackText(record) ?? "店铺：待补充；站点：待补充；对象：待补充";
  const actionType = String(record.action_type ?? "").trim() || "待补充";
  const actionId = String(record.action_id ?? "").trim() || "待补充";
  const reviewWindow = record.review_window ? reviewWindowLabel[record.review_window] : "待补充";
  return `${targetText}；人工动作：${actionType} / ${actionId}；窗口：${reviewWindow}`;
}

export function selectNextReviewTodo<T extends ReviewTodoForUi>(todos: T[]) {
  if (todos.length === 0) return null;
  return [...todos].sort((left, right) => {
    if (left.is_due !== right.is_due) return left.is_due ? -1 : 1;
    return new Date(left.due_at).getTime() - new Date(right.due_at).getTime();
  })[0];
}

export function reviewRecordSignalIdForTodo(signal: ReviewSignalForUi | null, todo: ReviewTodoForUi | null) {
  const todoSignalId = String(todo?.signal_id ?? "").trim();
  if (todoSignalId) return todoSignalId;
  const signalId = String(signal?.id ?? "").trim();
  return signalId || null;
}

export function buildReviewRecordReadbackTarget(signal: ReviewSignalForUi | null, todo: ReviewTodoForUi | null): ReviewRecordReadbackTarget | null {
  const stateSignalId = String(signal?.id ?? "").trim();
  const requestSignalId = reviewRecordSignalIdForTodo(signal, todo);
  if (!stateSignalId || !requestSignalId) return null;
  const stableObject = reviewSignalStableObjectForReviewRecord(signal);
  return { requestSignalId, stateSignalId, ...stableObject };
}

export function selectReviewTodosForSignal<T extends ReviewTodoForUi>(
  directTodos: T[],
  scopedTodos: T[],
  signal: ReviewSignalForUi | null,
) {
  if (directTodos.length > 0) return directTodos;
  const stableObjectIds = reviewSignalStableObjectIds(signal);
  if (stableObjectIds.size === 0) return [];
  return scopedTodos.filter((todo) => {
    const objectId = String(todo.object_id ?? "");
    return objectId !== "" && stableObjectIds.has(objectId) && reviewTodoMatchesSignalContext(todo, signal);
  });
}

export function selectManualActionsForSignal(directActions: ManualActionForUi[], reviewTodosForSelectedObject: ReviewTodoForUi[]) {
  if (directActions.length > 0) return directActions;
  return reviewTodosForSelectedObject.filter((todo): todo is ReviewTodoForUi & ManualActionForUi => Boolean(todo.action_type));
}

export function filterReviewTodosByProductScope<T extends ReviewTodoForUi>(
  todos: T[],
  activeProductScopeId: string,
  selectedScope: ProductScopeForReviewTodo | null,
  scopedSignalIds: Set<string>,
): T[] {
  if (activeProductScopeId === "all") return todos;
  return todos.filter((todo) => {
    if (todo.signal_id && scopedSignalIds.has(todo.signal_id)) return true;
    return reviewTodoMatchesProductScope(todo, activeProductScopeId, selectedScope);
  });
}

function reviewTodoMatchesProductScope(todo: ReviewTodoForUi, activeProductScopeId: string, selectedScope: ProductScopeForReviewTodo | null) {
  const objectId = String(todo.object_id ?? "");
  if (!objectId || !selectedScope) return false;
  const scopeType = selectedScope.scope_type ?? "";
  if (scopeType === "parent_asin" || activeProductScopeId.startsWith("parent_asin:")) {
    return objectId === selectedScope.parent_asin || (selectedScope.child_asins ?? []).includes(objectId);
  }
  if (scopeType === "advertised_asin" || scopeType === "sales_asin" || activeProductScopeId.startsWith("ad_asin:") || activeProductScopeId.startsWith("sales_asin:")) {
    return objectId === selectedScope.asin;
  }
  return false;
}

function reviewSignalStableObjectIds(signal: ReviewSignalForUi | null) {
  const primaryObject = signal?.evidence?.primary_object;
  return new Set(reviewSignalStableObjectIdCandidates(signal, primaryObject));
}

function reviewTodoMatchesSignalContext(todo: ReviewTodoForUi, signal: ReviewSignalForUi | null) {
  const signalShopId = String(signal?.shop_id ?? "").trim();
  const todoShopId = String(todo.shop_id ?? "").trim();
  if (signalShopId && todoShopId && signalShopId !== todoShopId) return false;

  if (signal?.market_id != null && todo.market_id != null && signal.market_id !== todo.market_id) return false;

  const signalObjectType = String(signal?.evidence?.primary_object?.object_type ?? signal?.object_type ?? "").trim();
  const todoObjectType = String(todo.object_type ?? "").trim();
  if (signalObjectType && todoObjectType && signalObjectType !== todoObjectType) return false;

  return true;
}

function reviewSignalStableObjectForReviewRecord(signal: ReviewSignalForUi | null) {
  const primaryObject = signal?.evidence?.primary_object;
  const objectType = reviewSignalObjectType(signal, primaryObject);
  const objectId = reviewSignalStableObjectIdCandidates(signal, primaryObject)[0];
  if (!objectType || !objectId) return {};
  return { objectType, objectId };
}

function reviewSignalObjectType(
  signal: ReviewSignalForUi | null,
  primaryObject: NonNullable<ReviewSignalForUi["evidence"]>["primary_object"] | null | undefined,
) {
  return String(primaryObject?.object_type ?? signal?.object_type ?? "").trim();
}

function reviewSignalStableObjectIdCandidates(
  signal: ReviewSignalForUi | null,
  primaryObject: NonNullable<ReviewSignalForUi["evidence"]>["primary_object"] | null | undefined = signal?.evidence?.primary_object,
) {
  const objectType = reviewSignalObjectType(signal, primaryObject);
  if (objectType === "search_term") {
    const stableSearchTermId = stableSearchTermObjectIdForUi(
      primaryObject?.object_id,
      primaryObject?.label,
      primaryObject?.search_term,
      signal?.market_id,
    );
    return uniqueStableObjectIds([
      stableSearchTermId,
      primaryObject?.object_id,
      primaryObject?.search_term,
      primaryObject?.label,
    ]);
  }
  return uniqueStableObjectIds([primaryObject?.asin, primaryObject?.object_id, primaryObject?.label]);
}

function stableSearchTermObjectIdForUi(
  objectId?: string | null,
  label?: string | null,
  searchTerm?: string | null,
  marketId?: number | string | null,
) {
  const existingObjectId = String(objectId ?? "").trim();
  if (existingObjectId.startsWith("search_term:")) return existingObjectId;
  const query = [searchTerm, label, objectId]
    .map((value) => String(value ?? "").trim())
    .find(Boolean);
  if (!query) return "";
  const market = String(marketId ?? "").trim();
  return market ? `search_term:${market}:${query}` : `search_term:${query}`;
}

function uniqueStableObjectIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function searchTermDisplayNameFromIdentity(objectId?: string | null, objectLabel?: string | null) {
  const label = normalizedPreflightTargetValue(objectLabel);
  if (label && !label.startsWith("search_term:")) return label;
  const id = normalizedPreflightTargetValue(objectId);
  if (!id) return "";
  if (!id.startsWith("search_term:")) return id;
  const [, , ...queryParts] = id.split(":");
  return queryParts.join(":").trim() || id;
}

function reviewObjectIdentityDisplayText(objectType?: string | null, objectId?: string | null, objectLabel?: string | null) {
  const type = normalizedPreflightTargetValue(objectType);
  const id = normalizedPreflightTargetValue(objectId);
  const label = normalizedPreflightTargetValue(objectLabel);
  if (type === "search_term") {
    const searchTerm = searchTermDisplayNameFromIdentity(id, label);
    if (searchTerm && id && searchTerm !== id) return `具体 SearchTerm：${searchTerm}；稳定对象：${type} / ${id}`;
    if (searchTerm) return `具体 SearchTerm：${searchTerm}`;
  }
  if (type && id) return `${type} / ${id}`;
  return id || label || "";
}

export function manualActionExpectedTargetForSignal(
  signal: ReviewSignalForUi | null,
  actionType: ManualActionForUi["action_type"] | string | null | undefined,
): ManualActionExpectedTargetForUi {
  const stableObject = reviewSignalStableObjectForReviewRecord(signal);
  return {
    objectType: stableObject.objectType ?? null,
    objectId: stableObject.objectId ?? null,
    actionType: actionType ?? null,
  };
}

export function buildReviewTodoQueueSummary<T extends ReviewTodoForUi>(todos: T[]): ReviewTodoQueueSummary<T> {
  const total = todos.length;
  const due = todos.filter((todo) => todo.is_due).length;
  const next = selectNextReviewTodo(todos);
  if (total === 0) {
    return {
      total,
      due,
      pending: 0,
      text: "暂无复盘待办",
      description: "记录观察、标记已处理或加入复盘后才会生成 7/14 天复盘。",
      next,
      nextLabel: null,
      nextDueDate: null,
    };
  }
  const missingEvidenceCount = todos.filter((todo) => !todo.evidence_snapshot?.length).length;
  const evidenceDescription =
    missingEvidenceCount > 0
      ? ` 当前 ${missingEvidenceCount}/${total} 条待办来自历史旧留痕缺少证据快照；新人工动作已要求保存证据快照。`
      : " 当前待办已带点击时证据快照。";
  const nextLabel = next?.object_label ?? next?.object_id ?? next?.signal_id ?? null;
  const nextDueDate = next?.due_at ? next.due_at.slice(0, 10) : null;
  const nextDescription =
    nextLabel && nextDueDate
      ? ` 下一项：${nextLabel} / ${nextDueDate}，${
          next?.is_due ? "已到期但仍需人工确认后保存复盘结论。" : "未到期前不保存复盘结论。"
        }`
      : "";
  const boundaryDescription =
    due > 0
      ? " 到期待办仍需人工确认后保存 ReviewRecord；不自动改规则，不执行广告动作。"
      : " 未到期前不拉取复盘快照，不保存 ReviewRecord，不自动改规则，不执行广告动作。";
  return {
    total,
    due,
    pending: total - due,
    text: `复盘待办 ${total} 条 / 到期 ${due} 条`,
    description: `复盘待办只代表已进入复盘窗口；是否改善必须等处理前后指标对比或人工复盘确认。${nextDescription}${evidenceDescription}${boundaryDescription}`,
    next,
    nextLabel,
    nextDueDate,
  };
}

export function buildReviewTodoQueueDetails<T extends ReviewTodoForUi>(
  todos: T[],
  options: { isGlobalScope: boolean; limit?: number },
): ReviewTodoQueueDetails | null {
  if (!options.isGlobalScope || todos.length === 0) return null;
  const limit = options.limit ?? 4;
  const sortedTodos = [...todos].sort((left, right) => {
    if (left.is_due !== right.is_due) return left.is_due ? -1 : 1;
    return new Date(left.due_at).getTime() - new Date(right.due_at).getTime();
  });
  return {
    title: `全局复盘待办明细 ${todos.length} 条`,
    description: "全量排查下展示全局复盘待办；待办只代表进入复盘窗口，不代表处理已经改善。",
    rows: sortedTodos.slice(0, limit).map((todo, index) => {
      const label = todo.object_label ?? todo.object_id ?? todo.signal_id ?? "对象待补充";
      return {
        key: `${todo.signal_id ?? "todo"}-${todo.review_window}-${todo.due_at}-${index}`,
        label,
        contextText: manualActionEvidenceSnapshotText(todo),
        statusText: reviewTodoStatusText(todo),
        dueDate: String(todo.due_at).slice(0, 10),
        isDue: todo.is_due,
        signalId: todo.signal_id,
      };
    }),
  };
}

export function buildReviewTodoScopeHint(input: ReviewTodoScopeHintInput): ReviewTodoScopeHint | null {
  if (input.isGlobalScope || input.globalTotal === 0 || input.currentTotal >= input.globalTotal) return null;
  if (input.currentTotal > 0) {
    const remainingTotal = input.globalTotal - input.currentTotal;
    return {
      text: `当前诊断入口有 ${input.currentTotal} 条复盘待办；范围外辅助排查还有 ${remainingTotal} 条，不属于当前入口。`,
      actionScopeId: "all",
      actionLabel: "切到全量排查",
    };
  }
  return {
    text: `当前诊断入口暂无复盘待办；范围外辅助排查还有 ${input.globalTotal} 条，可显式切到全量排查查看。`,
    actionScopeId: "all",
    actionLabel: "切到全量排查",
  };
}

export function reviewTodoScopeHintText(input: ReviewTodoScopeHintInput) {
  return buildReviewTodoScopeHint(input)?.text ?? null;
}

export function reviewEffectSummaryText(effect: ReviewEffectForUi) {
  return effect.message;
}

export function reviewEffectWindowText(effect: ReviewEffectForUi | null) {
  if (!effect) return null;
  const beforeWindow = reviewEffectWindowRange(effect.before_start_date, effect.before_end_date);
  const afterWindow = reviewEffectWindowRange(effect.after_start_date, effect.after_end_date);
  return `复盘窗口：处理前 ${beforeWindow}；${afterWindow === "待补齐" ? "处理后待补齐" : `处理后 ${afterWindow}`}。`;
}

export function buildReviewEffectWindowLedger(
  todo: ReviewTodoForUi | null,
  effect: ReviewEffectForUi | null,
  hasMatchingReviewRecord = false,
): ReviewEffectWindowLedger {
  if (hasMatchingReviewRecord) {
    return {
      tone: "saved",
      title: "复盘记录已保存",
      status: "已读回匹配 ReviewRecord，后续只作为规则反馈样本查看。",
      beforeWindow: effect ? reviewEffectWindowRange(effect.before_start_date, effect.before_end_date) : "已保存记录为准",
      afterWindow: effect ? reviewEffectWindowRange(effect.after_start_date, effect.after_end_date) : "已保存记录为准",
      metricCoverage: "以已保存 ReviewRecord 的 before_metrics / after_metrics 为准。",
      nextStep: "回看复盘记录和规则反馈候选，不重复保存同一 action_id / object_id / review_window。",
      boundary: "已保存不代表自动改规则，也不代表系统执行过广告动作。",
    };
  }

  if (!todo) {
    return {
      tone: "waiting",
      title: "尚未进入复盘窗口",
      status: "当前没有由人工留痕派生的 ReviewTodo。",
      beforeWindow: "需要先人工授权写入 ManualAction",
      afterWindow: "生成 7d / 14d ReviewTodo 后再计算",
      metricCoverage: "暂无处理前 / 处理后指标窗口。",
      nextStep: "先完成明确人工动作，系统再生成 7d / 14d 复盘待办。",
      boundary: "没有人工动作和 ReviewTodo 时，不能判断建议有效、无效或恶化。",
    };
  }

  if (!effect) {
    const dueText = todo.due_at ? String(todo.due_at).slice(0, 10) : "到期日待补充";
    return {
      tone: todo.is_due ? "blocked" : "waiting",
      title: todo.is_due ? "等待读取复盘效果" : "等待复盘窗口到期",
      status: reviewTodoStatusText(todo),
      beforeWindow: "待读取处理前窗口",
      afterWindow: `到 ${dueText} 后读取处理后窗口`,
      metricCoverage: "还没有拿到 review-effect，不能保存 ReviewRecord。",
      nextStep: todo.is_due
        ? "读取复盘效果；若缺处理后快照，先查询积加 API 限流规则，再人工触发低频快照。"
        : `等待到 ${dueText} 后再复核处理后指标，未到期前不保存复盘结论。`,
      boundary: "ReviewTodo 只代表进入复盘队列，不代表处理已经改善。",
    };
  }

  const beforeWindow = reviewEffectWindowRange(effect.before_start_date, effect.before_end_date);
  const afterWindow = reviewEffectWindowRange(effect.after_start_date, effect.after_end_date);
  const metricLabels = reviewMetricComparisonRows(effect).map((row) => row.label);
  const metricCoverage = metricLabels.length > 0 ? `已读取指标：${metricLabels.join("、")}。` : "暂无可对比指标行。";

  if (effect.status !== "ready") {
    const dueText = todo.due_at ? String(todo.due_at).slice(0, 10) : "到期日待补充";
    return {
      tone: "blocked",
      title: "复盘窗口未完整",
      status: effect.message,
      beforeWindow,
      afterWindow,
      metricCoverage: `${metricCoverage}处理后窗口未完整时不能保存 ReviewRecord。`,
      nextStep: todo.is_due
        ? "先补齐处理后快照；触发快照前必须查询限流规则，且只能人工低频触发。"
        : `等待到 ${dueText} 后再读取处理后窗口。`,
      boundary: "未到 ready 前不判断改善、无变化或恶化，也不输出规则改进结论。",
    };
  }

  return {
    tone: "ready",
    title: "复盘效果可人工保存",
    status: effect.message,
    beforeWindow,
    afterWindow,
    metricCoverage: `${metricCoverage}保存前仍需核对对象、证据快照和动作边界。`,
    nextStep: "人工核对保存前检查后，只保存 ReviewRecord。",
    boundary: "复盘结论只说明当前对象和当前窗口的指标变化，不证明所有业务变化都由本次人工处理导致。",
  };
}

export function canSaveReviewEffect(effect: ReviewEffectForUi | null) {
  return effect?.status === "ready";
}

export function canSaveReviewRecordWithPreflight(
  effect: ReviewEffectForUi | null,
  checklist: ReviewRecordPreflightCheck[] | null | undefined,
) {
  if (!canSaveReviewEffect(effect)) return false;
  const checklistIds = new Set((checklist ?? []).map((check) => check.id));
  return requiredReviewRecordPreflightCheckIdsForEffect(effect).every((id) => checklistIds.has(id));
}

export function buildReviewRecordSaveGateSummary(
  todo: ReviewTodoForUi | null,
  effect: ReviewEffectForUi | null,
  checklist: ReviewRecordPreflightCheck[] | null | undefined,
  hasMatchingReviewRecord = false,
): ReviewRecordSaveGateSummary {
  if (hasMatchingReviewRecord) {
    return {
      tone: "saved",
      title: "已保存匹配复盘记录",
      detail: "已读回同一 action_id / object_id / review_window 的 ReviewRecord；该结论只来自人工保存，不自动改规则或执行广告动作。",
      canSave: false,
    };
  }
  if (!todo) {
    return {
      tone: "blocked",
      title: "暂不能保存复盘记录",
      detail: "当前没有 7/14 天复盘待办；必须先有人工留痕派生的 ReviewTodo，才能进入 ReviewRecord 保存。",
      canSave: false,
    };
  }
  if (!effect) {
    return {
      tone: "blocked",
      title: "等待复盘效果",
      detail: "已存在复盘待办，但还没有读取到 ready 复盘效果；先补齐处理前后指标窗口，再由人工保存 ReviewRecord。",
      canSave: false,
    };
  }
  if (effect.status !== "ready") {
    return {
      tone: "blocked",
      title: "暂不能保存复盘记录",
      detail: `${effect.message}；未到 ready 前不保存 ReviewRecord，也不判断改善、无变化或恶化。`,
      canSave: false,
    };
  }

  const checklistIds = new Set((checklist ?? []).map((check) => check.id));
  const missingLabels = requiredReviewRecordPreflightCheckIdsForEffect(effect)
    .filter((id) => !checklistIds.has(id))
    .map((id) => requiredReviewRecordPreflightCheckLabels[id]);
  if (missingLabels.length > 0) {
    return {
      tone: "blocked",
      title: "保存前检查未通过",
      detail: `复盘效果已 ready，但保存前检查缺少：${missingLabels.join("、")}；不能用当前页面缓存或其他对象证据保存 ReviewRecord。`,
      canSave: false,
    };
  }

  return {
    tone: "ready",
    title: "可人工保存复盘记录",
    detail: `已满足 ready 复盘效果和 ${checklist?.length ?? 0} 项保存前检查；点击只保存 ReviewRecord，不自动改规则或执行广告动作。`,
    canSave: true,
  };
}

export function buildReviewRecordSavePathSummary(
  decisionReadback: ReviewTodoDecisionReadbackSummary | null,
  windowLedger: ReviewEffectWindowLedger,
  saveGate: ReviewRecordSaveGateSummary,
): ReviewRecordSavePathSummary | null {
  if (!decisionReadback && windowLedger.tone === "waiting" && saveGate.tone === "blocked") return null;

  const decisionReady = decisionReadback?.tone === "ready";
  const windowReady = windowLedger.tone === "ready" || windowLedger.tone === "saved";
  const saveReady = saveGate.canSave || saveGate.tone === "saved";
  const hasBlocked = decisionReadback?.tone === "blocked" || windowLedger.tone === "blocked" || saveGate.tone === "blocked";
  const tone: ReviewRecordSavePathSummary["tone"] =
    decisionReady && windowReady && saveReady ? "ready" : hasBlocked ? "blocked" : "waiting";

  return {
    title: "复盘保存顺序核对",
    tone,
    rows: [
      {
        label: "1. 当时判断",
        value: decisionReady ? "已读回" : decisionReadback ? "待补齐" : "无待办判断",
        detail: decisionReadback?.summary ?? "没有 ReviewTodo 业务判断读回，不能从处理后指标反推当时为什么进入复盘。",
        tone: (decisionReady ? "ready" : decisionReadback?.tone === "blocked" ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
      },
      {
        label: "2. 指标窗口",
        value: windowReady ? "已 ready" : windowLedger.tone === "blocked" ? "未完整" : "等待到期",
        detail: `${windowLedger.status}；${windowLedger.metricCoverage}`,
        tone: (windowReady ? "ready" : windowLedger.tone === "blocked" ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
      },
      {
        label: "3. 保存结论",
        value: saveGate.canSave ? "可人工保存" : saveGate.tone === "saved" ? "已保存" : "不可保存",
        detail: saveGate.detail,
        tone: (saveReady ? "ready" : saveGate.tone === "blocked" ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
      },
    ],
    boundary:
      "保存 ReviewRecord 前必须按顺序先读回当时判断，再核对处理前后指标窗口，最后只保存人工复盘结论；不自动改规则或执行广告动作。",
  };
}

const reviewRecordDiagnosisPathLabels = ["排查路径", "人工动作路径"];
const reviewRecordAiAdmissionLabels = ["AI 准入"];
const reviewRecordSearchTermBoundaryLabels = ["搜索词边界"];
const reviewRecordPlacementBoundaryLabels = ["广告位边界"];
const reviewRecordPlacementPerformanceLabels = ["广告位表现"];
const reviewRecordSearchTermPerformanceDecisionLabels = ["搜索词表现判断"];
const reviewRecordParentScopeLabels = ["Parent ASIN入口"];
const reviewRecordAdAsinCoverageLabels = ["广告 ASIN承接"];
const reviewRecordAdProductCoverageLabels = ["广告商品覆盖"];
const reviewRecordTargetingEvidenceLabels = ["投放词证据"];
const reviewRecordAdGroupSynthesisLabels = ["广告组合流判断"];
const reviewRecordAdGroupProductPerformanceLabels = ["同组投放商品表现"];
const reviewRecordAdContextRowsLabels = ["逐投放上下文"];
const reviewRecordAbaContextLabels = ["ABA 背景"];
const reviewRecordEvidenceGapLabels = ["证据缺口"];
const reviewRecordRequiredEvidenceLabels = ["需要补证"];
const reviewRecordManualActionBoundaryLabels = ["动作边界"];
const reviewRecordManualNextStepLabels = ["人工下一步"];

const reviewRecordDiagnosisSupportLabels = [
  "广告组问题定位",
  "投放词结构",
  "搜索词市场背景",
  "投放词证据",
  "搜索词表现判断",
  "广告组合流判断",
  "同组投放商品表现",
  "逐投放上下文",
  "ABA 背景",
  "证据缺口",
  "需要补证",
  "动作边界",
  "搜索词边界",
  "广告位边界",
  "广告位表现",
  "上下文边界",
  "广告位证据缺口",
  "下钻证据缺口",
  "广告商品覆盖",
  "搜索词表现",
  "投放上下文",
];

const reviewTodoBusinessJudgementLabels = ["人工确认判断依据", "能证明的事实", "不能证明的边界", "人工下一步"];

function reviewTodoDecisionSnapshotText(snapshot: ManualActionEvidenceSnapshotForUi[], labels: string[]) {
  const item = snapshot.find((snapshotItem) => labels.includes(String(snapshotItem.label ?? "").trim()));
  return item ? reviewRecordEvidenceItemText(item) : null;
}

export function buildReviewTodoDecisionReadbackSummary(todo: ReviewTodoForUi | null): ReviewTodoDecisionReadbackSummary | null {
  if (!todo) return null;
  const snapshot = (todo.evidence_snapshot ?? []).filter(
    (item) => String(item.label ?? "").trim() && String(item.value ?? "").trim(),
  );
  const hasSnapshot = snapshot.length > 0;
  const isSearchTermTodo = normalizedPreflightTargetValue(todo.object_type) === "search_term";
  const decisionText = reviewTodoDecisionSnapshotText(
    snapshot,
    isSearchTermTodo ? reviewRecordSearchTermPerformanceDecisionLabels : ["人工确认判断依据"],
  );
  const nextStepText = reviewTodoDecisionSnapshotText(snapshot, reviewRecordManualNextStepLabels);
  const requiredEvidenceText = reviewTodoDecisionSnapshotText(snapshot, reviewRecordRequiredEvidenceLabels);
  const boundaryText = reviewTodoDecisionSnapshotText(snapshot, reviewRecordManualActionBoundaryLabels);
  const diagnosisPathText = reviewTodoDecisionSnapshotText(snapshot, reviewRecordDiagnosisPathLabels);
  const parentScopeText = reviewTodoDecisionSnapshotText(snapshot, reviewRecordParentScopeLabels);
  const adAsinCoverageText = reviewTodoDecisionSnapshotText(
    snapshot,
    isSearchTermTodo ? reviewRecordAdAsinCoverageLabels : reviewRecordAdProductCoverageLabels,
  );
  const adGroupSynthesisText = reviewTodoDecisionSnapshotText(snapshot, reviewRecordAdGroupSynthesisLabels);
  const adContextRowsText = reviewTodoDecisionSnapshotText(snapshot, reviewRecordAdContextRowsLabels);
  const targetingEvidenceText = reviewTodoDecisionSnapshotText(snapshot, reviewRecordTargetingEvidenceLabels);
  const searchTermBoundaryText = reviewTodoDecisionSnapshotText(snapshot, reviewRecordSearchTermBoundaryLabels);
  const placementBoundaryText = reviewTodoDecisionSnapshotText(snapshot, reviewRecordPlacementBoundaryLabels);
  const hasDecisionPathReadback = isSearchTermTodo
    ? Boolean(diagnosisPathText && parentScopeText && adAsinCoverageText && adGroupSynthesisText)
    : Boolean(diagnosisPathText && adGroupSynthesisText);
  const hasEvidenceLayerReadback = isSearchTermTodo
    ? Boolean(adContextRowsText && targetingEvidenceText && searchTermBoundaryText && placementBoundaryText)
    : Boolean(adAsinCoverageText || placementBoundaryText);
  const pathDetail = [diagnosisPathText, parentScopeText, adAsinCoverageText].filter(Boolean).join("；");
  const evidenceLayerDetail = isSearchTermTodo
    ? [adContextRowsText, targetingEvidenceText, searchTermBoundaryText, placementBoundaryText].filter(Boolean).join("；")
    : [adAsinCoverageText, placementBoundaryText].filter(Boolean).join("；");
  const hasCoreEvidenceReadback = isSearchTermTodo ? hasEvidenceLayerReadback : true;
  const hasCoreReadback = Boolean(decisionText && nextStepText && boundaryText && hasDecisionPathReadback && hasCoreEvidenceReadback);
  const tone: ReviewTodoDecisionReadbackSummary["tone"] = hasCoreReadback ? "ready" : hasSnapshot ? "blocked" : "waiting";

  return {
    title: isSearchTermTodo ? "复盘待办业务判断读回" : "复盘待办判断读回",
    tone,
    summary: hasCoreReadback
      ? "已能第一眼回看当时为什么进入复盘、从哪个 Parent ASIN / 广告对象展开、默认看哪个广告组、逐投放复核顺序和动作边界；待办仍只表示排程，未到期不判断效果。"
      : hasSnapshot
        ? "当前待办有证据快照，但缺少业务判断、原始诊断路径、人工下一步或动作边界；保存 ReviewRecord 前必须回到完整证据核对。"
        : "当前待办没有证据快照；只能看到排程，不能回看当时判断。",
    rows: [
      {
        label: "原始诊断路径",
        value: hasDecisionPathReadback ? "已回读" : hasSnapshot ? "缺少路径" : "等待证据快照",
        detail:
          pathDetail ||
          "缺少 Parent ASIN / 广告 ASIN / 广告组路径，用户到期后只能看到排程，不能确认当初为什么从该经营入口展开。",
        tone: (hasDecisionPathReadback ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
      },
      {
        label: "默认展开焦点",
        value: adGroupSynthesisText ? "已回读" : hasSnapshot ? "缺少广告组合流" : "等待证据快照",
        detail:
          adGroupSynthesisText ??
          "缺少广告组合流判断，不能知道当时默认聚焦哪个广告组、同组广告 ASIN 或投放上下文。",
        tone: (adGroupSynthesisText ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
      },
      ...(isSearchTermTodo
        ? [
            {
              label: "逐投放复核顺序",
              value: adContextRowsText ? "已回读" : hasSnapshot ? "缺少逐投放上下文" : "等待证据快照",
              detail:
                adContextRowsText ??
                "缺少逐投放上下文，到期复盘不能知道当时先看哪个广告组、投放词和广告 ASIN 承接顺序。",
              tone: (adContextRowsText ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
            },
          ]
        : []),
      {
        label: "复核证据层",
        value: hasEvidenceLayerReadback ? "已回读" : hasSnapshot ? "缺少证据层" : "等待证据快照",
        detail:
          evidenceLayerDetail ||
          "缺少投放商品、投放词、搜索词或广告位证据层，到期后不能只凭处理后指标反推广告问题。",
        tone: (hasEvidenceLayerReadback ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
      },
      {
        label: isSearchTermTodo ? "搜索词表现判断" : "当时判断",
        value: decisionText ? "已回读" : hasSnapshot ? "缺少判断" : "等待证据快照",
        detail: decisionText ?? "缺少当时为什么进入复盘的判断，不能只凭处理后指标反推原因。",
        tone: (decisionText ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
      },
      {
        label: "人工下一步",
        value: nextStepText ? "已回读" : hasSnapshot ? "缺少下一步" : "等待证据快照",
        detail: nextStepText ?? "缺少人工下一步，用户无法知道到期后应复核哪个证据层。",
        tone: (nextStepText ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
      },
      {
        label: "需要补证",
        value: requiredEvidenceText ? "已回读" : hasSnapshot ? "缺少补证项" : "等待证据快照",
        detail: requiredEvidenceText ?? "缺少需要补证，复盘时容易把证据缺口误读成效果结论。",
        tone: (requiredEvidenceText ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
      },
      {
        label: "动作边界",
        value: boundaryText ? "已回读" : hasSnapshot ? "缺少边界" : "等待证据快照",
        detail: boundaryText ?? "缺少动作边界，不能确认复盘待办只服务人工回看而不是自动广告动作。",
        tone: (boundaryText ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
      },
    ],
    boundary: boundaryText
      ? `${boundaryText}；复盘待办只表示进入 7/14 天排程，不自动执行广告动作，也不代表建议已经有效。`
      : "复盘待办只表示进入 7/14 天排程；缺少动作边界时，不得保存效果结论或自动执行广告动作。",
  };
}

function reviewTodoMissingLabelGroups(labels: Set<string>, labelGroups: string[][]) {
  return labelGroups
    .filter((group) => !group.some((label) => labels.has(label)))
    .map((group) => group.join(" 或 "));
}

function reviewTodoReadbackRow(
  label: string,
  requiredGroups: string[][],
  labels: Set<string>,
  hasSnapshot: boolean,
  readyDetail: string,
): ReviewTodoEvidenceReadbackRow {
  const missing = reviewTodoMissingLabelGroups(labels, requiredGroups);
  const ready = hasSnapshot && missing.length === 0;
  return {
    label,
    value: ready ? "已回读" : hasSnapshot ? `缺：${missing.join(" / ")}` : "等待证据快照",
    detail: ready
      ? readyDetail
      : hasSnapshot
        ? `${readyDetail} 当前缺少：${missing.join(" / ")}。`
        : `${readyDetail} 当前待办没有 evidence_snapshot，不能回看当时判断。`,
    tone: ready ? "ready" : hasSnapshot ? "blocked" : "waiting",
  };
}

export function buildReviewTodoEvidenceReadbackSummary(todo: ReviewTodoForUi | null): ReviewTodoEvidenceReadbackSummary | null {
  if (!todo) return null;

  const snapshot = (todo.evidence_snapshot ?? []).filter(
    (item) => String(item.label ?? "").trim() && String(item.value ?? "").trim(),
  );
  const hasSnapshot = snapshot.length > 0;
  const labels = evidenceLabelSet(snapshot);
  const objectType = normalizedPreflightTargetValue(todo.object_type);
  const objectId = normalizedPreflightTargetValue(todo.object_id);
  const objectLabel = normalizedPreflightTargetValue(todo.object_label);
  const actionId = normalizedPreflightTargetValue(todo.action_id);
  const objectReady = Boolean(objectType && objectId && actionId);
  const isSearchTermTodo = objectType === "search_term";
  const isAdvertisedProductTodo = objectType === "advertised_product";
  const isPlacementTodo = objectType === "placement";
  const dueDate = todo.due_at ? String(todo.due_at).slice(0, 10) : "到期日待补充";
  const adGroupSynthesisItem = snapshot.find((item) => reviewRecordAdGroupSynthesisLabels.includes(String(item.label ?? "").trim()));
  const adGroupSynthesisText = adGroupSynthesisItem ? reviewRecordEvidenceItemText(adGroupSynthesisItem) : null;
  const searchTermPerformanceDecisionItem = snapshot.find((item) =>
    reviewRecordSearchTermPerformanceDecisionLabels.includes(String(item.label ?? "").trim()),
  );
  const searchTermPerformanceDecisionText = searchTermPerformanceDecisionItem
    ? reviewRecordEvidenceItemText(searchTermPerformanceDecisionItem)
    : null;
  const adContextRowsItem = snapshot.find((item) => reviewRecordAdContextRowsLabels.includes(String(item.label ?? "").trim()));
  const adContextRowsText = adContextRowsItem ? reviewRecordEvidenceItemText(adContextRowsItem) : null;
  const adGroupProductPerformanceItem = snapshot.find((item) =>
    reviewRecordAdGroupProductPerformanceLabels.includes(String(item.label ?? "").trim()),
  );
  const adGroupProductPerformanceText = adGroupProductPerformanceItem ? reviewRecordEvidenceItemText(adGroupProductPerformanceItem) : null;
  const targetingEvidenceItem = snapshot.find((item) => reviewRecordTargetingEvidenceLabels.includes(String(item.label ?? "").trim()));
  const targetingEvidenceText = targetingEvidenceItem ? reviewRecordEvidenceItemText(targetingEvidenceItem) : null;
  const placementBoundaryItem = snapshot.find((item) => reviewRecordPlacementBoundaryLabels.includes(String(item.label ?? "").trim()));
  const placementBoundaryText = placementBoundaryItem ? reviewRecordEvidenceItemText(placementBoundaryItem) : null;
  const objectDisplayText = reviewObjectIdentityDisplayText(objectType, objectId, objectLabel);

  const rows: ReviewTodoEvidenceReadbackRow[] = [
    {
      label: "待办对象",
      value: objectReady ? objectDisplayText || `${objectType} / ${objectId}` : "对象不完整",
      detail: objectReady
        ? `ReviewTodo 可回读 action_id ${actionId}；${reviewWindowLabel[todo.review_window]}复盘到期 ${dueDate}；${objectDisplayText ? `复盘对象为 ${objectDisplayText}` : `对象展示为 ${objectLabel || objectId}`}。`
        : "ReviewTodo 缺少 action_id、object_type 或 object_id，不能确认复盘待办对应哪一次人工判断。",
      tone: objectReady ? "ready" : "blocked",
    },
    reviewTodoReadbackRow(
      "业务判断",
      reviewTodoBusinessJudgementLabels.map((label) => [label]),
      labels,
      hasSnapshot,
      "复盘时必须能回看当时为什么判断、能证明什么、不能证明什么，以及下一步人工动作。",
    ),
    reviewTodoReadbackRow(
      "诊断路径",
      [
        reviewRecordDiagnosisPathLabels,
        reviewRecordAiAdmissionLabels,
        reviewRecordSearchTermBoundaryLabels,
        reviewRecordPlacementBoundaryLabels,
      ],
      labels,
      hasSnapshot,
      "复盘待办必须继承 Parent ASIN、广告 ASIN、广告组、搜索词和广告位的原始诊断边界。",
    ),
    ...(isSearchTermTodo
      ? [
          reviewTodoReadbackRow(
            "广告搜索词表现复核链",
            [
              reviewRecordParentScopeLabels,
              reviewRecordAdAsinCoverageLabels,
              reviewRecordSearchTermPerformanceDecisionLabels,
              reviewRecordAdGroupSynthesisLabels,
              reviewRecordAdGroupProductPerformanceLabels,
              reviewRecordAdContextRowsLabels,
              reviewRecordTargetingEvidenceLabels,
              reviewRecordSearchTermBoundaryLabels,
              reviewRecordPlacementBoundaryLabels,
              reviewRecordAbaContextLabels,
              reviewRecordEvidenceGapLabels,
              reviewRecordRequiredEvidenceLabels,
              reviewRecordManualActionBoundaryLabels,
            ],
            labels,
            hasSnapshot,
            "广告搜索词表现复核待办必须保留 Parent ASIN 入口、广告 ASIN 承接、搜索词表现判断、广告组合流判断、同组投放商品表现、逐投放上下文、投放词证据、搜索词边界、广告位边界、ABA 背景、证据缺口、需要补证和动作边界，避免复盘时把搜索词裸指标或搜索词表现分组误判为自动加词或否词依据。",
          ),
          {
            label: "搜索词表现判断",
            value: searchTermPerformanceDecisionText ? "已回读" : hasSnapshot ? "缺少判断" : "等待证据快照",
            detail: searchTermPerformanceDecisionText
              ? `${searchTermPerformanceDecisionText}。复盘时必须先回看当时为什么把该 SearchTerm 判为扩量、止损或观察候选，再核对处理后指标。`
              : "当前待办没有搜索词表现判断；复盘时只能看到搜索词表现分组，无法回看当时为什么选择这条 SearchTerm。",
            tone: (searchTermPerformanceDecisionText ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
          },
          {
            label: "广告组合流判断",
            value: adGroupSynthesisText ? "已回读" : hasSnapshot ? "缺少判断" : "等待证据快照",
            detail: adGroupSynthesisText
              ? `${adGroupSynthesisText}。复盘时必须先回到广告组和同组广告 ASIN，再判断是否需要人工调整投放结构。`
              : "当前待办没有广告组合流判断；不能只看搜索词裸指标就判断单个广告 ASIN、广告组或广告位出了问题。",
            tone: (adGroupSynthesisText ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
          },
          {
            label: "同组投放商品表现",
            value: adGroupProductPerformanceText ? "已回读" : hasSnapshot ? "缺少同组商品" : "等待证据快照",
            detail: adGroupProductPerformanceText
              ? `${adGroupProductPerformanceText}。复盘时必须回看同一广告组内实际投放商品的花费、订单和承接差异，不能把广告组或搜索词表现直接归因到单个 ASIN。`
              : "当前待办没有同组投放商品表现；不能判断广告组内哪些投放商品承接了该 SearchTerm，也不能把未投放子 ASIN 拉入复盘。",
            tone: (adGroupProductPerformanceText ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
          },
          {
            label: "投放词与广告位边界",
            value: targetingEvidenceText && placementBoundaryText ? "已回读" : hasSnapshot ? "缺少上下文" : "等待证据快照",
            detail:
              targetingEvidenceText && placementBoundaryText
                ? `${targetingEvidenceText}；${placementBoundaryText}。复盘时投放词用于判断匹配承接，广告位只说明流量位置边界，不能自动加词、否词、调价或归因到单个 ASIN。`
                : "当前待办缺少投放词证据或广告位边界；到期后只能先补证，不能只凭 SearchTerm 指标保存复盘结论。",
            tone: (targetingEvidenceText && placementBoundaryText
              ? "ready"
              : hasSnapshot
                ? "blocked"
                : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
          },
          {
            label: "逐投放复核顺序",
            value: adContextRowsText ? "已回读" : hasSnapshot ? "缺少顺序" : "等待证据快照",
            detail: adContextRowsText
              ? `${adContextRowsText}。复盘时必须按当时的逐投放顺序回看广告组、投放词和广告 ASIN 承接，不能把排序解释成自动加词、否词或调价。`
              : "当前待办没有逐投放上下文；不能回看当时先复核哪个广告组，也不能只凭搜索词合计指标保存复盘结论。",
            tone: (adContextRowsText ? "ready" : hasSnapshot ? "blocked" : "waiting") as ReviewTodoEvidenceReadbackRow["tone"],
          },
        ]
      : []),
    ...(isAdvertisedProductTodo
      ? [
          reviewTodoReadbackRow(
            "广告商品复核链",
            [
              reviewRecordAdProductCoverageLabels,
              reviewRecordAdGroupSynthesisLabels,
              reviewRecordAdGroupProductPerformanceLabels,
              reviewRecordEvidenceGapLabels,
              reviewRecordRequiredEvidenceLabels,
              reviewRecordManualActionBoundaryLabels,
            ],
            labels,
            hasSnapshot,
            "广告商品待办必须保留广告商品覆盖、广告组合流判断、同组投放商品表现、证据缺口、需要补证和动作边界，避免复盘时把 ASIN 指标或同广告组搜索词背景误判为单 ASIN 自动归因。",
          ),
        ]
      : []),
    ...(isPlacementTodo
      ? [
          reviewTodoReadbackRow(
            "广告位复核链",
            [
              reviewRecordPlacementPerformanceLabels,
              reviewRecordEvidenceGapLabels,
              reviewRecordRequiredEvidenceLabels,
              reviewRecordManualActionBoundaryLabels,
            ],
            labels,
            hasSnapshot,
            "广告位待办必须保留广告位表现、证据缺口、需要补证和动作边界，避免复盘时把广告位指标误判为自动调整广告位加价或单 ASIN 归因。",
          ),
        ]
      : []),
    {
      label: "复盘边界",
      value: todo.is_due ? "可读取效果窗口" : "等待到期",
      detail: "ReviewTodo 只代表等待 7/14 天后人工复核；到期后仍需 ReviewRecord 保存门禁，不自动改规则或执行广告动作。",
      tone: "ready",
    },
  ];

  const blockedCount = rows.filter((row) => row.tone === "blocked").length;
  const waitingCount = rows.filter((row) => row.tone === "waiting").length;
  const tone: ReviewTodoEvidenceReadbackSummary["tone"] =
    blockedCount > 0 ? "blocked" : waitingCount > 0 ? "waiting" : "ready";
  const summary =
    tone === "ready"
      ? "ReviewTodo 已回读人工点击时的 evidence_snapshot；到期后可按同一证据链进入 ReviewRecord 保存前门禁。"
      : tone === "waiting"
        ? "已读到复盘待办，但还没有证据快照，不能回看当时判断。"
        : "复盘待办证据快照缺少关键标签，到期后不能直接保存可复盘结论。";

  return {
    title: "复盘待办证据回读核对",
    tone,
    summary,
    rows,
    boundary: "这里只做待办证据回读；不会保存 ReviewRecord，不改规则，也不执行广告动作。",
  };
}

function requiredReviewRecordPreflightCheckIdsForEffect(effect: ReviewEffectForUi | null): ReviewRecordPreflightCheck["id"][] {
  const objectType = normalizedPreflightTargetValue(effect?.object_type);
  if (objectType === "search_term") {
    return [
      "target_identity",
      "action_evidence_snapshot",
      "diagnosis_path",
      "ai_admission",
      "search_term_performance_decision",
      "ad_group_synthesis",
      "ad_group_product_performance",
      "ad_context_rows",
      "targeting_evidence",
      "search_term_boundary",
      "placement_boundary",
      "aba_context",
      "evidence_gap",
      "required_evidence",
      "manual_action_boundary",
      "window_integrity",
      "metric_basis",
      "review_result_boundary",
      "rule_feedback_boundary",
      "todo_evidence_signature",
      "todo_object_reference",
    ];
  }
  if (objectType === "advertised_product") {
    return [...baseRequiredReviewRecordPreflightCheckIds, ...advertisedProductRequiredReviewRecordPreflightCheckIds];
  }
  if (objectType === "placement") {
    return [...baseRequiredReviewRecordPreflightCheckIds, ...placementRequiredReviewRecordPreflightCheckIds];
  }
  return baseRequiredReviewRecordPreflightCheckIds;
}

function reviewRecordEvidenceItemText(item: ManualActionEvidenceSnapshotForUi) {
  const label = String(item.label ?? "").trim();
  const value = String(item.value ?? "").trim();
  const detail = String(item.detail ?? "").trim();
  if (!label || !value) return null;
  return detail ? `${label}：${value}（${detail}）` : `${label}：${value}`;
}

function reviewRecordDiagnosisPathPreflightText(todo: ReviewTodoForUi | null) {
  const snapshot = todo?.evidence_snapshot ?? [];
  const diagnosisPathItem = snapshot.find((item) => reviewRecordDiagnosisPathLabels.includes(String(item.label ?? "").trim()));
  const diagnosisPathText = diagnosisPathItem ? reviewRecordEvidenceItemText(diagnosisPathItem) : null;
  const supportText = snapshot
    .filter((item) => reviewRecordDiagnosisSupportLabels.includes(String(item.label ?? "").trim()))
    .map(reviewRecordEvidenceItemText)
    .filter((item): item is string => Boolean(item))
    .slice(0, 3)
    .join("；");

  if (!diagnosisPathText) {
    const supportSuffix = supportText ? `；可回看的支撑证据：${supportText}` : "";
    return `当前待办缺少原始诊断路径${supportSuffix}；保存前只能核对指标事实，不能把复盘结论扩展成规则判断或自动广告动作。`;
  }

  const supportSuffix = supportText ? `；支撑证据：${supportText}` : "";
  return `原始诊断链：${diagnosisPathText}${supportSuffix}。保存复盘前必须确认复盘对象仍沿用当时 Parent ASIN -> 广告 ASIN -> 广告组 -> 投放词 / 搜索词 / 广告位的判断路径。`;
}

function reviewTodoHasDiagnosisPath(todo: ReviewTodoForUi | null) {
  return (todo?.evidence_snapshot ?? []).some((item) => String(item.label ?? "").trim() === "排查路径" && String(item.value ?? "").trim());
}

function reviewRecordAiAdmissionPreflightText(todo: ReviewTodoForUi | null) {
  const snapshot = todo?.evidence_snapshot ?? [];
  const admissionItem = snapshot.find((item) => reviewRecordAiAdmissionLabels.includes(String(item.label ?? "").trim()));
  const admissionText = admissionItem ? reviewRecordEvidenceItemText(admissionItem) : null;
  if (!admissionText) {
    return "当前待办缺少 AI 准入理由；保存前只能核对指标事实，不能证明当时为什么允许进入人工确认，也不能扩展成规则判断或自动广告动作。";
  }
  return `AI 准入回看：${admissionText}。保存复盘前必须确认该记录只是人工留痕和复盘入口，不代表系统自动执行广告动作。`;
}

function reviewTodoHasAiAdmission(todo: ReviewTodoForUi | null) {
  return (todo?.evidence_snapshot ?? []).some((item) => String(item.label ?? "").trim() === "AI 准入" && String(item.value ?? "").trim());
}

function reviewRecordSearchTermPerformanceDecisionPreflightText(todo: ReviewTodoForUi | null) {
  const snapshot = todo?.evidence_snapshot ?? [];
  const decisionItem = snapshot.find((item) =>
    reviewRecordSearchTermPerformanceDecisionLabels.includes(String(item.label ?? "").trim()),
  );
  const decisionText = decisionItem ? reviewRecordEvidenceItemText(decisionItem) : null;
  if (!decisionText) {
    return "当前待办缺少搜索词表现判断；保存前只能核对处理前后指标，不能回看当时为什么选择这条 SearchTerm，也不能把搜索词表现分组包装成动作对象。";
  }
  return `搜索词表现判断回看：${decisionText}。保存复盘前必须确认该判断只用于人工复核优先级，不自动加词、否词、调价或暂停广告。`;
}

function reviewTodoHasSearchTermPerformanceDecision(todo: ReviewTodoForUi | null) {
  return (todo?.evidence_snapshot ?? []).some((item) => String(item.label ?? "").trim() === "搜索词表现判断" && String(item.value ?? "").trim());
}

function reviewRecordBoundaryPreflightText(
  todo: ReviewTodoForUi | null,
  labels: string[],
  missingText: string,
  readyPrefix: string,
) {
  const snapshot = todo?.evidence_snapshot ?? [];
  const boundaryItem = snapshot.find((item) => labels.includes(String(item.label ?? "").trim()));
  const boundaryText = boundaryItem ? reviewRecordEvidenceItemText(boundaryItem) : null;
  if (!boundaryText) {
    return `${missingText}；保存前只能核对处理前后指标，不能证明当时人工判断已经看过该证据边界。`;
  }
  return `${readyPrefix}：${boundaryText}。保存复盘前必须确认该边界只用于人工复核，不代表系统自动归因、加词、否词、调价或调整广告位。`;
}

function reviewRecordSearchTermBoundaryPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordBoundaryPreflightText(
    todo,
    reviewRecordSearchTermBoundaryLabels,
    "当前待办缺少搜索词边界",
    "搜索词边界回看",
  );
}

function reviewRecordPlacementBoundaryPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordBoundaryPreflightText(
    todo,
    reviewRecordPlacementBoundaryLabels,
    "当前待办缺少广告位边界",
    "广告位边界回看",
  );
}

function reviewRecordSearchTermReviewChainPreflightText(
  todo: ReviewTodoForUi | null,
  labels: string[],
  missingText: string,
  readyPrefix: string,
) {
  const snapshot = todo?.evidence_snapshot ?? [];
  const item = snapshot.find((evidenceItem) => labels.includes(String(evidenceItem.label ?? "").trim()));
  const itemText = item ? reviewRecordEvidenceItemText(item) : null;
  if (!itemText) {
    return `${missingText}；保存前只能核对处理前后指标，不能证明当时人工判断已经看过搜索词机会的广告组合流、同组投放商品、逐投放上下文、投放词、搜索词边界、广告位边界、ABA、证据缺口或动作边界。`;
  }
  return `${readyPrefix}：${itemText}。保存复盘前必须确认它只作为人工复盘依据，不自动加词、否词、调价或暂停广告。`;
}

function reviewRecordAdvertisedProductReviewChainPreflightText(
  todo: ReviewTodoForUi | null,
  labels: string[],
  missingText: string,
  readyPrefix: string,
) {
  const snapshot = todo?.evidence_snapshot ?? [];
  const item = snapshot.find((evidenceItem) => labels.includes(String(evidenceItem.label ?? "").trim()));
  const itemText = item ? reviewRecordEvidenceItemText(item) : null;
  if (!itemText) {
    return `${missingText}；保存前只能核对处理前后指标，不能证明当时人工判断已经看过广告商品覆盖、广告组容器、证据缺口、需要补证或动作边界。`;
  }
  return `${readyPrefix}：${itemText}。保存复盘前必须确认它只作为广告商品人工复盘依据，不自动归因搜索词、调价、暂停、加词或否词。`;
}

function reviewRecordPlacementReviewChainPreflightText(
  todo: ReviewTodoForUi | null,
  labels: string[],
  missingText: string,
  readyPrefix: string,
) {
  const snapshot = todo?.evidence_snapshot ?? [];
  const item = snapshot.find((evidenceItem) => labels.includes(String(evidenceItem.label ?? "").trim()));
  const itemText = item ? reviewRecordEvidenceItemText(item) : null;
  if (!itemText) {
    return `${missingText}；保存前只能核对处理前后指标，不能证明当时人工判断已经看过广告位表现、证据缺口、需要补证或动作边界。`;
  }
  return `${readyPrefix}：${itemText}。保存复盘前必须确认它只作为广告位人工复盘依据，不自动调整广告位加价、预算、关键词或商品投放。`;
}

function reviewRecordPlacementPerformancePreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordPlacementReviewChainPreflightText(
    todo,
    reviewRecordPlacementPerformanceLabels,
    "当前待办缺少广告位表现",
    "广告位表现回看",
  );
}

function reviewRecordPlacementEvidenceGapPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordPlacementReviewChainPreflightText(
    todo,
    reviewRecordEvidenceGapLabels,
    "当前待办缺少证据缺口",
    "证据缺口回看",
  );
}

function reviewRecordPlacementRequiredEvidencePreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordPlacementReviewChainPreflightText(
    todo,
    reviewRecordRequiredEvidenceLabels,
    "当前待办缺少需要补证",
    "需要补证回看",
  );
}

function reviewRecordPlacementManualActionBoundaryPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordPlacementReviewChainPreflightText(
    todo,
    reviewRecordManualActionBoundaryLabels,
    "当前待办缺少动作边界",
    "动作边界回看",
  );
}

function reviewRecordAdProductCoveragePreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordAdvertisedProductReviewChainPreflightText(
    todo,
    reviewRecordAdProductCoverageLabels,
    "当前待办缺少广告商品覆盖",
    "广告商品覆盖回看",
  );
}

function reviewRecordAdProductAdGroupSynthesisPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordAdvertisedProductReviewChainPreflightText(
    todo,
    reviewRecordAdGroupSynthesisLabels,
    "当前待办缺少广告组合流判断",
    "广告组合流判断回看",
  );
}

function reviewRecordAdProductAdGroupProductPerformancePreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordAdvertisedProductReviewChainPreflightText(
    todo,
    reviewRecordAdGroupProductPerformanceLabels,
    "当前待办缺少同组投放商品表现",
    "同组投放商品表现回看",
  );
}

function reviewRecordAdProductEvidenceGapPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordAdvertisedProductReviewChainPreflightText(
    todo,
    reviewRecordEvidenceGapLabels,
    "当前待办缺少证据缺口",
    "证据缺口回看",
  );
}

function reviewRecordAdProductRequiredEvidencePreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordAdvertisedProductReviewChainPreflightText(
    todo,
    reviewRecordRequiredEvidenceLabels,
    "当前待办缺少需要补证",
    "需要补证回看",
  );
}

function reviewRecordAdProductManualActionBoundaryPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordAdvertisedProductReviewChainPreflightText(
    todo,
    reviewRecordManualActionBoundaryLabels,
    "当前待办缺少动作边界",
    "动作边界回看",
  );
}

function reviewRecordTargetingEvidencePreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordSearchTermReviewChainPreflightText(
    todo,
    reviewRecordTargetingEvidenceLabels,
    "当前待办缺少投放词证据",
    "投放词证据回看",
  );
}

function reviewRecordAdGroupSynthesisPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordSearchTermReviewChainPreflightText(
    todo,
    reviewRecordAdGroupSynthesisLabels,
    "当前待办缺少广告组合流判断",
    "广告组合流判断回看",
  );
}

function reviewRecordAdGroupProductPerformancePreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordSearchTermReviewChainPreflightText(
    todo,
    reviewRecordAdGroupProductPerformanceLabels,
    "当前待办缺少同组投放商品表现",
    "同组投放商品表现回看",
  );
}

function reviewRecordAdContextRowsPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordSearchTermReviewChainPreflightText(
    todo,
    reviewRecordAdContextRowsLabels,
    "当前待办缺少逐投放上下文",
    "逐投放复核顺序回看",
  );
}

function reviewRecordAbaContextPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordSearchTermReviewChainPreflightText(
    todo,
    reviewRecordAbaContextLabels,
    "当前待办缺少 ABA 背景",
    "ABA 背景回看",
  );
}

function reviewRecordEvidenceGapPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordSearchTermReviewChainPreflightText(
    todo,
    reviewRecordEvidenceGapLabels,
    "当前待办缺少证据缺口",
    "证据缺口回看",
  );
}

function reviewRecordRequiredEvidencePreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordSearchTermReviewChainPreflightText(
    todo,
    reviewRecordRequiredEvidenceLabels,
    "当前待办缺少需要补证",
    "需要补证回看",
  );
}

function reviewRecordManualActionBoundaryPreflightText(todo: ReviewTodoForUi | null) {
  return reviewRecordSearchTermReviewChainPreflightText(
    todo,
    reviewRecordManualActionBoundaryLabels,
    "当前待办缺少动作边界",
    "动作边界回看",
  );
}

function reviewTodoHasSearchTermBoundary(todo: ReviewTodoForUi | null) {
  return (todo?.evidence_snapshot ?? []).some((item) => String(item.label ?? "").trim() === "搜索词边界" && String(item.value ?? "").trim());
}

function reviewTodoHasPlacementBoundary(todo: ReviewTodoForUi | null) {
  return (todo?.evidence_snapshot ?? []).some((item) => String(item.label ?? "").trim() === "广告位边界" && String(item.value ?? "").trim());
}

function reviewTodoHasSnapshotLabel(todo: ReviewTodoForUi | null, expectedLabel: string) {
  return (todo?.evidence_snapshot ?? []).some(
    (item) => String(item.label ?? "").trim() === expectedLabel && String(item.value ?? "").trim(),
  );
}

function reviewTodoHasSearchIntentContext(todo: ReviewTodoForUi | null | undefined) {
  return Boolean(
    todo?.review_context?.search_intent_label ||
      reviewTodoHasSnapshotLabel(todo ?? null, "搜索词表现分组") ||
      reviewTodoHasSnapshotLabel(todo ?? null, "搜索意图分组") ||
      reviewTodoHasSnapshotLabel(todo ?? null, "语义组") ||
      reviewTodoHasSnapshotLabel(todo ?? null, "Parent ASIN 广告搜索词表现复核") ||
      reviewTodoHasSnapshotLabel(todo ?? null, "Parent ASIN 搜索词表现聚合") ||
      reviewTodoHasSnapshotLabel(todo ?? null, "广告搜索词聚合上下文"),
  );
}

function reviewTodoHasEvidenceSnapshot(todo: ReviewTodoForUi | null) {
  return (todo?.evidence_snapshot ?? []).some((item) => String(item.label ?? "").trim() !== "" && String(item.value ?? "").trim() !== "");
}

function reviewTodoEvidenceMatchesEffect(todo: ReviewTodoForUi | null, effect: ReviewEffectForUi) {
  if (!todo || !reviewTodoHasEvidenceSnapshot(todo)) return false;
  const todoActionId = normalizedPreflightTargetValue(todo.action_id);
  const todoObjectType = normalizedPreflightTargetValue(todo.object_type);
  const todoObjectId = normalizedPreflightTargetValue(todo.object_id);
  const effectActionId = normalizedPreflightTargetValue(effect.action_id);
  const effectObjectType = normalizedPreflightTargetValue(effect.object_type);
  const effectObjectId = normalizedPreflightTargetValue(effect.object_id);
  if (!todoActionId || !todoObjectType || !todoObjectId) return false;
  if (effectActionId && todoActionId !== effectActionId) return false;
  if (effectObjectType && todoObjectType !== effectObjectType) return false;
  if (effectObjectId && todoObjectId !== effectObjectId) return false;
  return todo.review_window === effect.review_window;
}

function reviewTodoEvidenceSignaturePreflightText(todo: ReviewTodoForUi | null, effect: ReviewEffectForUi) {
  const issues: string[] = [];
  const todoActionId = normalizedPreflightTargetValue(todo?.action_id);
  const todoObjectType = normalizedPreflightTargetValue(todo?.object_type);
  const todoObjectId = normalizedPreflightTargetValue(todo?.object_id);
  const effectActionId = normalizedPreflightTargetValue(effect.action_id);
  const effectObjectType = normalizedPreflightTargetValue(effect.object_type);
  const effectObjectId = normalizedPreflightTargetValue(effect.object_id);
  const snapshotCount = (todo?.evidence_snapshot ?? []).filter(
    (item) => String(item.label ?? "").trim() !== "" && String(item.value ?? "").trim() !== "",
  ).length;

  if (!todo) issues.push("缺少复盘待办");
  if (!todoActionId) issues.push("待办缺少 action_id");
  if (!todoObjectType || !todoObjectId) issues.push("待办缺少 stable object");
  if (snapshotCount === 0) issues.push("待办缺少证据快照");
  if (effectActionId && todoActionId && effectActionId !== todoActionId) issues.push("action_id 与 ready effect 不一致");
  if (effectObjectType && todoObjectType && effectObjectType !== todoObjectType) issues.push("object_type 与 ready effect 不一致");
  if (effectObjectId && todoObjectId && effectObjectId !== todoObjectId) issues.push("object_id 与 ready effect 不一致");
  if (todo?.review_window && todo.review_window !== effect.review_window) issues.push("review_window 与 ready effect 不一致");

  if (issues.length > 0) {
    return `待办证据不一致：${issues.join("；")}；不能用页面缓存、其他待办或当前重新计算证据保存 ReviewRecord。`;
  }
  return `待办证据一致：action_id ${todoActionId}；对象 ${todoObjectType} / ${todoObjectId}；窗口 ${
    reviewWindowLabel[effect.review_window]
  }；证据快照 ${snapshotCount} 条。前端只提交这份 ReviewTodo 证据，后端仍会按签名校验。`;
}

function reviewTodoObjectReferenceTerms(todo: ReviewTodoForUi | null, effect: ReviewEffectForUi | null) {
  const terms: string[] = [];
  for (const value of [todo?.object_id, todo?.object_label, effect?.object_id, effect?.object_label]) {
    const text = String(value ?? "").trim();
    if (!text) continue;
    terms.push(text);
    if (text.includes(":")) {
      const tail = text.split(":").pop()?.trim();
      if (tail) terms.push(tail);
    }
  }
  return Array.from(new Set(terms));
}

function reviewTodoStableObjectReferenceTerms(todo: ReviewTodoForUi | null, effect: ReviewEffectForUi | null) {
  const terms: string[] = [];
  for (const value of [todo?.object_id, effect?.object_id]) {
    const text = String(value ?? "").trim();
    if (!text) continue;
    terms.push(text);
    if (text.includes(":")) {
      const tail = text.split(":").pop()?.trim();
      if (tail) terms.push(tail);
    }
  }
  return Array.from(new Set(terms));
}

function reviewEvidenceSnapshotTextForObjectReference(todo: ReviewTodoForUi | null) {
  return (todo?.evidence_snapshot ?? [])
    .map((item) => [item.label, item.value, item.detail, item.source].map((value) => String(value ?? "").trim()).filter(Boolean).join(" "))
    .join(" ")
    .toLocaleLowerCase();
}

function reviewTodoHasObjectReference(todo: ReviewTodoForUi | null, effect: ReviewEffectForUi | null) {
  if (!todo || !reviewTodoHasEvidenceSnapshot(todo)) return false;
  const stableTerms = reviewTodoStableObjectReferenceTerms(todo, effect);
  const terms = stableTerms.length > 0 ? stableTerms : reviewTodoObjectReferenceTerms(todo, effect);
  if (terms.length === 0) return false;
  const snapshotText = reviewEvidenceSnapshotTextForObjectReference(todo);
  return terms.some((term) => snapshotText.includes(term.toLocaleLowerCase()));
}

function reviewTodoObjectReferencePreflightText(todo: ReviewTodoForUi | null, effect: ReviewEffectForUi) {
  const terms = reviewTodoObjectReferenceTerms(todo, effect);
  const objectText =
    normalizedPreflightTargetValue(todo?.object_type || effect.object_type) &&
    normalizedPreflightTargetValue(todo?.object_id || effect.object_id)
      ? `${normalizedPreflightTargetValue(todo?.object_type || effect.object_type)} / ${normalizedPreflightTargetValue(
          todo?.object_id || effect.object_id,
        )}`
      : "对象待补充";
  if (!todo) {
    return "缺少复盘待办，无法确认待办证据快照是否属于当前复盘对象；不能用当前页面缓存保存 ReviewRecord。";
  }
  if (!reviewTodoHasEvidenceSnapshot(todo)) {
    return `待办证据对象错配：${objectText} 缺少可回看的 evidence_snapshot；不能保存 ReviewRecord。`;
  }
  if (terms.length === 0) {
    return `待办证据对象错配：${objectText} 缺少稳定 object_id / object_label；不能证明证据快照属于当前复盘对象。`;
  }
  if (!reviewTodoHasObjectReference(todo, effect)) {
    return `待办证据对象错配：证据快照未能回看 ${objectText}；可能混入其他候选证据，不能保存 ReviewRecord。`;
  }
  return `待办证据对象引用可回看：${objectText}；证据快照包含 ${terms.slice(0, 3).join(" / ")}，保存前仍只作为人工复盘依据，不自动执行广告动作。`;
}

export function buildReviewRecordPreflightChecklist(
  todo: ReviewTodoForUi | null,
  effect: ReviewEffectForUi | null,
  readbackTarget: ReviewRecordReadbackTarget | null,
): ReviewRecordPreflightCheck[] {
  if (!effect || !canSaveReviewEffect(effect)) return [];

  const targetReadback = reviewEffectTargetReadbackText(effect) ?? reviewTargetReadbackText(todo) ?? "店铺：待补充；站点：待补充；对象：待补充";
  const requestSignalId = readbackTarget?.requestSignalId ?? effect.signal_id ?? todo?.signal_id ?? "待补充";
  const stateSignalId = readbackTarget?.stateSignalId ?? effect.signal_id ?? todo?.signal_id ?? "待补充";
  const targetObjectText =
    readbackTarget?.objectType || readbackTarget?.objectId
      ? `；写入对象：${String(readbackTarget?.objectType ?? "对象")} / ${String(readbackTarget?.objectId ?? "待补充")}`
      : "";
  const dueText = todo?.due_at ? `；待办到期：${String(todo.due_at).slice(0, 10)}` : "";
  const metricLabels = reviewMetricComparisonRows(effect).map((row) => row.label);
  const metricText = metricLabels.length > 0 ? `已核对 ${metricLabels.join("、")}。` : "暂无可展示指标行。";
  const evidenceSnapshotText = manualActionEvidenceSnapshotText(todo);
  const hasDiagnosisPath = reviewTodoHasDiagnosisPath(todo);
  const hasAiAdmission = reviewTodoHasAiAdmission(todo);
  const hasSearchTermBoundary = reviewTodoHasSearchTermBoundary(todo);
  const hasPlacementBoundary = reviewTodoHasPlacementBoundary(todo);
  const effectObjectType = normalizedPreflightTargetValue(effect.object_type);
  const requiresSearchTermReviewChain = effectObjectType === "search_term";
  const requiresAdvertisedProductReviewChain = effectObjectType === "advertised_product";
  const requiresPlacementReviewChain = effectObjectType === "placement";
  const hasAdProductCoverage = reviewTodoHasSnapshotLabel(todo, "广告商品覆盖");
  const hasPlacementPerformance = reviewTodoHasSnapshotLabel(todo, "广告位表现");
  const hasSearchTermPerformanceDecision = reviewTodoHasSearchTermPerformanceDecision(todo);
  const hasTargetingEvidence = reviewTodoHasSnapshotLabel(todo, "投放词证据");
  const hasAdGroupSynthesis = reviewTodoHasSnapshotLabel(todo, "广告组合流判断");
  const hasAdGroupProductPerformance = reviewTodoHasSnapshotLabel(todo, "同组投放商品表现");
  const hasAdContextRows = reviewTodoHasSnapshotLabel(todo, "逐投放上下文");
  const hasAbaContext = reviewTodoHasSnapshotLabel(todo, "ABA 背景");
  const hasEvidenceGap = reviewTodoHasSnapshotLabel(todo, "证据缺口");
  const hasRequiredEvidence = reviewTodoHasSnapshotLabel(todo, "需要补证");
  const hasManualActionBoundary = reviewTodoHasSnapshotLabel(todo, "动作边界");
  const hasTodoEvidenceSignature = reviewTodoEvidenceMatchesEffect(todo, effect);
  const hasTodoObjectReference = reviewTodoHasObjectReference(todo, effect);

  const checks: ReviewRecordPreflightCheck[] = [
    {
      id: "target_identity",
      title: "确认复盘对象",
      description: `${targetReadback}；请求信号：${requestSignalId}；写入状态信号：${stateSignalId}${targetObjectText}。`,
    },
    {
      id: "action_evidence_snapshot",
      title: "回看人工动作证据",
      description: evidenceSnapshotText
        ? `${evidenceSnapshotText}。保存复盘前应确认复盘结论仍对应这份当时证据。`
        : "当前待办没有证据快照；只能保存指标复盘事实，不能反推当时证据或自动调整规则。",
    },
    {
      id: hasDiagnosisPath ? "diagnosis_path" : "diagnosis_path_missing",
      title: "回看原始诊断路径",
      description: reviewRecordDiagnosisPathPreflightText(todo),
    },
    {
      id: hasAiAdmission ? "ai_admission" : "ai_admission_missing",
      title: "回看 AI 准入理由",
      description: reviewRecordAiAdmissionPreflightText(todo),
    },
  ];

  if (!requiresSearchTermReviewChain) {
    checks.push(
      {
        id: hasSearchTermBoundary ? "search_term_boundary" : "search_term_boundary_missing",
        title: "回看搜索词边界",
        description: reviewRecordSearchTermBoundaryPreflightText(todo),
      },
      {
        id: hasPlacementBoundary ? "placement_boundary" : "placement_boundary_missing",
        title: "回看广告位边界",
        description: reviewRecordPlacementBoundaryPreflightText(todo),
      },
    );
  }

  if (requiresSearchTermReviewChain) {
    checks.push(
      {
        id: hasSearchTermPerformanceDecision ? "search_term_performance_decision" : "search_term_performance_decision_missing",
        title: "回看搜索词表现判断",
        description: reviewRecordSearchTermPerformanceDecisionPreflightText(todo),
      },
      {
        id: hasAdGroupSynthesis ? "ad_group_synthesis" : "ad_group_synthesis_missing",
        title: "回看广告组合流判断",
        description: reviewRecordAdGroupSynthesisPreflightText(todo),
      },
      {
        id: hasAdGroupProductPerformance ? "ad_group_product_performance" : "ad_group_product_performance_missing",
        title: "回看同组投放商品表现",
        description: reviewRecordAdGroupProductPerformancePreflightText(todo),
      },
      {
        id: hasAdContextRows ? "ad_context_rows" : "ad_context_rows_missing",
        title: "回看逐投放复核顺序",
        description: reviewRecordAdContextRowsPreflightText(todo),
      },
      {
        id: hasTargetingEvidence ? "targeting_evidence" : "targeting_evidence_missing",
        title: "回看投放词证据",
        description: reviewRecordTargetingEvidencePreflightText(todo),
      },
      {
        id: hasSearchTermBoundary ? "search_term_boundary" : "search_term_boundary_missing",
        title: "回看搜索词边界",
        description: reviewRecordSearchTermBoundaryPreflightText(todo),
      },
      {
        id: hasPlacementBoundary ? "placement_boundary" : "placement_boundary_missing",
        title: "回看广告位边界",
        description: reviewRecordPlacementBoundaryPreflightText(todo),
      },
      {
        id: hasAbaContext ? "aba_context" : "aba_context_missing",
        title: "回看 ABA 背景",
        description: reviewRecordAbaContextPreflightText(todo),
      },
      {
        id: hasEvidenceGap ? "evidence_gap" : "evidence_gap_missing",
        title: "回看证据缺口",
        description: reviewRecordEvidenceGapPreflightText(todo),
      },
      {
        id: hasRequiredEvidence ? "required_evidence" : "required_evidence_missing",
        title: "回看需要补证",
        description: reviewRecordRequiredEvidencePreflightText(todo),
      },
      {
        id: hasManualActionBoundary ? "manual_action_boundary" : "manual_action_boundary_missing",
        title: "回看动作边界",
        description: reviewRecordManualActionBoundaryPreflightText(todo),
      },
    );
  }

  if (requiresAdvertisedProductReviewChain) {
    checks.push(
      {
        id: hasAdProductCoverage ? "ad_product_coverage" : "ad_product_coverage_missing",
        title: "回看广告商品覆盖",
        description: reviewRecordAdProductCoveragePreflightText(todo),
      },
      {
        id: hasAdGroupSynthesis ? "ad_group_synthesis" : "ad_group_synthesis_missing",
        title: "回看广告组合流判断",
        description: reviewRecordAdProductAdGroupSynthesisPreflightText(todo),
      },
      {
        id: hasAdGroupProductPerformance ? "ad_group_product_performance" : "ad_group_product_performance_missing",
        title: "回看同组投放商品表现",
        description: reviewRecordAdProductAdGroupProductPerformancePreflightText(todo),
      },
      {
        id: hasEvidenceGap ? "evidence_gap" : "evidence_gap_missing",
        title: "回看证据缺口",
        description: reviewRecordAdProductEvidenceGapPreflightText(todo),
      },
      {
        id: hasRequiredEvidence ? "required_evidence" : "required_evidence_missing",
        title: "回看需要补证",
        description: reviewRecordAdProductRequiredEvidencePreflightText(todo),
      },
      {
        id: hasManualActionBoundary ? "manual_action_boundary" : "manual_action_boundary_missing",
        title: "回看动作边界",
        description: reviewRecordAdProductManualActionBoundaryPreflightText(todo),
      },
    );
  }

  if (requiresPlacementReviewChain) {
    checks.push(
      {
        id: hasPlacementPerformance ? "placement_performance" : "placement_performance_missing",
        title: "回看广告位表现",
        description: reviewRecordPlacementPerformancePreflightText(todo),
      },
      {
        id: hasEvidenceGap ? "evidence_gap" : "evidence_gap_missing",
        title: "回看证据缺口",
        description: reviewRecordPlacementEvidenceGapPreflightText(todo),
      },
      {
        id: hasRequiredEvidence ? "required_evidence" : "required_evidence_missing",
        title: "回看需要补证",
        description: reviewRecordPlacementRequiredEvidencePreflightText(todo),
      },
      {
        id: hasManualActionBoundary ? "manual_action_boundary" : "manual_action_boundary_missing",
        title: "回看动作边界",
        description: reviewRecordPlacementManualActionBoundaryPreflightText(todo),
      },
    );
  }

  checks.push(
    {
      id: "window_integrity",
      title: "确认复盘窗口",
      description: `保存 ${reviewWindowLabel[effect.review_window]}复盘；效果状态：${effect.status}${dueText}。`,
    },
    {
      id: "metric_basis",
      title: "核对指标口径",
      description: `${reviewEffectWindowText(effect) ?? "复盘窗口待补齐。"}${metricText}该对比只说明处理前后窗口变化，不等同于归因所有业务变化。`,
    },
    {
      id: "review_result_boundary",
      title: "确认复盘结论边界",
      description: `${reviewEffectSummaryText(effect)}；该结论只保存当前对象、当前动作和 ${reviewWindowLabel[effect.review_window]}窗口的指标变化，不证明所有业务变化都由本次人工处理导致。`,
    },
    {
      id: "rule_feedback_boundary",
      title: "确认规则反馈边界",
      description: "保存后只形成规则反馈候选；不自动改规则，不自动执行广告动作。",
    },
    {
      id: hasTodoEvidenceSignature ? "todo_evidence_signature" : "todo_evidence_signature_missing",
      title: "核对待办证据一致性",
      description: reviewTodoEvidenceSignaturePreflightText(todo, effect),
    },
    {
      id: hasTodoObjectReference ? "todo_object_reference" : "todo_object_reference_missing",
      title: "核对待办证据对象引用",
      description: reviewTodoObjectReferencePreflightText(todo, effect),
    },
  );

  return checks;
}

export function buildReviewRecordRequestPayload(
  effect: ReviewEffectForUi,
  todo: ReviewTodoForUi | null,
  reviewNote: string | null,
  reviewerName = "本地运营",
): ReviewRecordRequestPayloadForUi {
  const actionId = String(todo?.action_id ?? effect.action_id ?? "").trim();
  const objectType = String(todo?.object_type ?? effect.object_type ?? "").trim();
  const objectId = String(todo?.object_id ?? effect.object_id ?? "").trim();
  return {
    review_note: reviewNote,
    reviewer_name: reviewerName,
    expected_action_id: actionId || null,
    expected_object_type: objectType || null,
    expected_object_id: objectId || null,
    expected_review_window: effect.review_window,
    expected_evidence_snapshot: todo?.evidence_snapshot ?? [],
    expected_can_auto_change_rules: false,
    expected_can_auto_execute_ads: false,
  };
}

export function buildRuleImprovementReadiness(
  effect: ReviewEffectForUi | null,
  record: ReviewRecordForUi | null,
  todo: ReviewTodoForUi | null = null,
  backendRuleImprovement: BackendRuleImprovementForUi | null = null,
  backendReviewWaitSummary: BackendReviewWaitSummaryForUi | null = null,
): RuleImprovementReadiness {
  if (!effect && !record && !todo) {
    const backendWaitReadiness = backendReviewWaitSummaryReadiness(backendReviewWaitSummary, backendRuleImprovement);
    if (backendWaitReadiness) return backendWaitReadiness;
    const backendReadiness = backendRuleImprovementReadiness(backendRuleImprovement);
    if (backendReadiness) return backendReadiness;
  }
  if (record) {
    const recordReadback = reviewRecordTargetReadbackText(record);
    return {
      title: "规则反馈已沉淀",
      description: `${reviewRuleFeedbackText(record.result)}；${recordReadback}；该反馈只进入解释层，不自动调整广告动作或自动改规则。`,
      nextStep: "继续用该复盘结果校准同类信号解释；广告动作仍必须人工确认。",
      tone: "saved",
    };
  }
  if (todo && !todo.is_due) {
    return {
      title: effect ? "规则改进暂未满足条件" : "规则改进暂未开始",
      description: effect
        ? `${effect.message}；复盘窗口未到期时，不能调整规则或输出效果结论。`
        : "先等待已生成的复盘待办到期；没有完整复盘窗口时不能调整规则或输出效果结论。",
      nextStep: `到 ${String(todo.due_at).slice(0, 10)} 后再复核处理后窗口；未到期前不保存复盘结论。`,
      tone: "blocked",
    };
  }
  if (!effect && todo?.is_due) {
    return {
      title: "规则改进等待复盘效果",
      description: `${reviewTodoStatusText(todo)}，但还没有读取到复盘效果；未取得 ready 前不能调整规则或输出效果结论。`,
      nextStep: "先读取复盘效果；如果提示缺少处理后快照，先查询积加 API 限流规则，再人工触发低频快照。",
      tone: "blocked",
    };
  }
  if (!effect) {
    return {
      title: "规则改进暂未开始",
      description: "先完成人工处理并生成 7/14 天复盘待办；没有复盘窗口时不能调整规则或输出效果结论。",
      nextStep: "先记录人工动作并生成 7/14 天复盘待办；待办到期前只观察，不输出规则结论。",
      tone: "blocked",
    };
  }
  if (effect.status !== "ready") {
    return {
      title: "规则改进暂未满足条件",
      description: `${effect.message}；缺少完整前后指标时，不能调整规则或输出效果结论。`,
      nextStep: "先查询积加 API 限流规则，再人工触发低频快照；快照覆盖完整处理后窗口后再保存复盘记录。",
      tone: "blocked",
    };
  }
  return {
    title: "规则改进待人工复盘",
    description: "已具备处理前后指标，先保存复盘记录，再用 improved / no_change / worse 判断同类信号是保留规则、复核证据还是复核阈值。",
    nextStep: "先保存复盘记录，再进入规则反馈解释层；不自动调整广告动作或规则。",
    tone: "ready",
  };
}

export function buildRuleFeedbackCandidate(
  record: ReviewRecordForUi | null,
  effect: ReviewEffectForUi | null = null,
): RuleFeedbackCandidate | null {
  if (!record) return null;
  const readback = reviewRecordTargetReadbackText(record) ?? "复盘对象待补充";
  const contextText = reviewContextText(record);
  const note = record.review_note || "未填写备注";
  const windowText = reviewEffectWindowText(effect);
  const contextSuffix = contextText ? `；复盘上下文：${contextText}` : "";
  const windowSuffix = windowText ? `；${windowText}` : "";
  return {
    title: "规则反馈候选",
    basis: `复盘结果：${record.result} / ${note}；${readback}${contextSuffix}${windowSuffix}`,
    recommendation: `${reviewRuleFeedbackText(record.result)}；作为同类信号解释和规则阈值复核方向。`,
    boundary: "规则反馈候选只进入解释层和人工复核优先级，不是广告处理对象；不自动改规则，不自动执行广告动作。",
  };
}

function backendRuleImprovementReadiness(backendRuleImprovement: BackendRuleImprovementForUi | null): RuleImprovementReadiness | null {
  if (!backendRuleImprovement) return null;
  if (backendRuleImprovement.can_auto_change_rules === true || backendRuleImprovement.can_auto_execute_ads === true) return null;

  const title = String(backendRuleImprovement.title ?? "").trim();
  const reason = String(backendRuleImprovement.reason ?? "").trim();
  const nextStep = String(backendRuleImprovement.next_step ?? "").trim();
  if (!title || (!reason && !nextStep)) return null;

  const status = String(backendRuleImprovement.status ?? "").trim();
  const tone: RuleImprovementReadiness["tone"] =
    status === "saved_feedback" ? "saved" : status === "ready_for_manual_review_record" ? "ready" : "blocked";

  return {
    title,
    description: reason || title,
    nextStep: nextStep || "继续人工复核；不自动调整广告动作或规则。",
    tone,
  };
}

function backendReviewWaitSummaryReadiness(
  backendReviewWaitSummary: BackendReviewWaitSummaryForUi | null,
  backendRuleImprovement: BackendRuleImprovementForUi | null,
): RuleImprovementReadiness | null {
  if (!backendReviewWaitSummary || backendReviewWaitSummary.status !== "waiting_review_window") return null;
  if (backendRuleImprovement?.can_auto_change_rules === true || backendRuleImprovement?.can_auto_execute_ads === true) return null;

  const title = String(backendRuleImprovement?.title ?? "规则改进暂未满足条件").trim();
  const waitCount = Number(backendReviewWaitSummary.not_ready_count ?? 0);
  const earliestDate = String(backendReviewWaitSummary.earliest_due_date ?? "").trim();
  const objectLabel = String(backendReviewWaitSummary.next_object_label ?? backendReviewWaitSummary.next_object_id ?? "").trim();
  const windows = (backendReviewWaitSummary.review_windows ?? []).filter(Boolean).join(" / ");
  const summaryParts = [
    waitCount > 0 ? `${waitCount} 项未到期` : "",
    earliestDate ? `最早 ${earliestDate}` : "",
    windows ? `窗口：${windows}` : "",
    objectLabel ? `下一对象：${objectLabel}` : "",
  ].filter(Boolean);
  const message = String(backendReviewWaitSummary.message ?? backendRuleImprovement?.reason ?? "").trim();
  const nextStep = String(backendReviewWaitSummary.next_step ?? backendRuleImprovement?.next_step ?? "").trim();
  const forbiddenActions = (backendReviewWaitSummary.forbidden_actions ?? []).filter(Boolean);

  return {
    title,
    description: [message, summaryParts.join("，")].filter(Boolean).join("；"),
    nextStep: [nextStep || "等待复盘窗口完整后再复核处理后指标。", forbiddenActions.length ? `边界：${forbiddenActions.join("、")}` : ""]
      .filter(Boolean)
      .join(" "),
    tone: "blocked",
  };
}

export function reviewMetricComparisonRows(effect: ReviewEffectForUi | null): ReviewMetricComparisonRow[] {
  if (!effect) return [];
  const metrics: { key: keyof NonNullable<ReviewEffectForUi["before_metrics"]>; label: string; percent?: boolean; integer?: boolean }[] = [
    { key: "cost", label: "花费" },
    { key: "orders", label: "订单", integer: true },
    { key: "sales", label: "销售额" },
    { key: "acos", label: "ACOS", percent: true },
    { key: "cvr", label: "CVR", percent: true },
  ];
  return metrics.flatMap((metric) => {
    const before = effect.before_metrics?.[metric.key];
    const after = effect.after_metrics?.[metric.key];
    if (before == null && after == null) return [];
    return [
      {
        label: metric.label,
        before: formatReviewMetric(before, metric),
        after: formatReviewMetric(after, metric),
      },
    ];
  });
}

export function reviewRecordStatusText(record: ReviewRecordForUi | null) {
  if (!record) return "暂无复盘记录";
  const evidenceReadback = reviewRecordEvidenceSnapshotReadbackText([record]);
  return `最近复盘：${record.result} / ${record.review_note || "未填写备注"}；${evidenceReadback ?? "复盘证据快照待核对"}`;
}

function reviewRuleFeedbackText(result: ReviewRecordForUi["result"]) {
  const feedbackText: Record<ReviewRecordForUi["result"], string> = {
    improved: "处理有效，同类信号可保留当前规则提示",
    no_change: "处理后无明显变化，下次同类信号应复核证据来源或建议动作",
    worse: "处理后效果变差，下次同类信号应复核阈值、证据来源和建议动作",
    unclear: "复盘证据不足，不调整规则，先补复盘样本和指标",
  };
  return feedbackText[result];
}

export function manualActionBoundaryText(action: ManualActionForUi | null) {
  if (!action) return null;
  const boundaryText: Partial<Record<ManualActionForUi["action_type"], string>> = {
    handled: "标记已处理只表示已记录人工处理动作；是否改善需要等复盘效果计算或人工复盘确认。",
    add_to_review: "加入复盘只表示进入后续复盘待办；不代表已经产生改善、无变化或恶化结论。",
    ignore: "忽略本次只表示当前不进入复盘待办；信号和证据仍保留，不代表误报或已删除。",
  };
  return boundaryText[action.action_type] ?? null;
}

export function buildManualActionEvidenceSnapshot(items: ManualActionEvidenceSnapshotInput[], limit = 5): ManualActionEvidenceSnapshotForUi[] {
  return items
    .filter((item) => String(item.label ?? "").trim() && String(item.value ?? "").trim())
    .slice(0, limit)
    .map((item) => ({
      label: String(item.label ?? "").trim(),
      value: String(item.value ?? "").trim(),
      detail: item.detail ? String(item.detail).trim() : null,
      source: item.source ? String(item.source).trim() : null,
    }));
}

export function buildManualActionDisplayEvidenceSnapshot(input: ManualActionDisplayEvidenceSnapshotInput): ManualActionEvidenceSnapshotForUi[] {
  const previewItems = input.preflight?.evidence_snapshot_preview?.items ?? [];
  if (previewItems.length > 0) {
    return buildManualActionEvidenceSnapshot(previewItems, previewItems.length);
  }
  return input.fallbackEvidenceSnapshot ?? [];
}

export function manualActionSavableEvidenceReasonText(
  preflight: ManualActionPreflightForUi | null,
  fallbackText = "等待后端可保存 evidence_snapshot_preview；页面 Parent ASIN 广告搜索词表现复核背景和临时证据只用于只读核对，不写入人工动作。",
) {
  if (!preflight || !manualActionPreflightHasSavableEvidenceSnapshotPreview(preflight)) {
    return fallbackText;
  }
  const previewItems = preflight.evidence_snapshot_preview?.items ?? [];
  return manualActionEvidenceReasonText(buildManualActionEvidenceSnapshot(previewItems, previewItems.length)) ?? fallbackText;
}

export function buildSearchIntentManualActionEvidenceSnapshot(
  input: SearchIntentManualActionContextInput | null,
): ManualActionEvidenceSnapshotForUi[] {
  const intentLabel = String(input?.intentLabel ?? "").trim();
  if (!intentLabel) return [];

  const searchTerm = String(input?.searchTerm ?? "").trim();
  const abaReferenceTerm = String(input?.abaReferenceTerm ?? "").trim();
  const abaRank = String(input?.abaRank ?? "").trim();
  const abaPeriod = String(input?.abaPeriod ?? "").trim();
  const abaMatchBoundary = String(input?.abaMatchBoundary ?? "").trim();
  const semanticSource = intentLabel.startsWith("规则语义：") ? "规则语义" : "Parent ASIN 广告搜索词表现复核";
  const snapshot: ManualActionEvidenceSnapshotForUi[] = [];

  if (searchTerm) {
    snapshot.push({
      label: "搜索词",
      value: searchTerm,
      detail: "人工处理对象仍落到具体 SearchTerm 信号，Parent ASIN 广告搜索词表现复核只作为复盘上下文。",
      source: "积加API",
    });
  }
  snapshot.push({
    label: "Parent ASIN 广告搜索词表现复核",
    value: intentLabel,
    detail: "只用于复盘回看当前 Parent ASIN 下同类 SearchTerm 判断链，不代表自动新增关键词、否词或调价。",
    source: semanticSource,
  });
  if (abaReferenceTerm) {
    snapshot.push({
      label: "ABA语义参考词",
      value: abaReferenceTerm,
      detail: "ABA 是站点级市场热度证据，只作为同类 SearchTerm 复盘背景。",
      source: "ABA导出",
    });
  }
  if (abaRank) {
    snapshot.push({
      label: "ABA语义参考排名",
      value: abaRank,
      detail: "该排名来自站点级 ABA 导出，不能直接代表本店广告归因。",
      source: "ABA导出",
    });
  }
  if (abaPeriod) {
    snapshot.push({
      label: "ABA周期",
      value: abaPeriod,
      detail: "ABA 周期用于判断市场热度证据是否新鲜。",
      source: "ABA导出",
    });
  }
  if (abaMatchBoundary) {
    snapshot.push({
      label: "ABA匹配边界",
      value: abaMatchBoundary,
      detail: "匹配边界用于防止把站点级 ABA 背景误当作店铺或商品归因。",
      source: "ABA导出",
    });
  }
  return snapshot;
}

function manualActionSnapshotItemValue(snapshot: ManualActionEvidenceSnapshotForUi[], labels: string[]) {
  return normalizedPreflightTargetValue(
    snapshot.find((item) => labels.includes(normalizedPreflightTargetValue(item.label)))?.value,
  );
}

function normalizeManualActionSearchTerm(value: string | null | undefined) {
  return normalizedPreflightTargetValue(value).toLowerCase().replace(/\s+/g, " ");
}

export function buildSearchIntentManualActionReadbackSummary(
  input: SearchIntentManualActionReadbackInput | null,
): SearchIntentManualActionReadbackSummary | null {
  const snapshot = input?.evidenceSnapshot ?? [];
  const intentLabel = manualActionSnapshotItemValue(snapshot, [
    "Parent ASIN 广告搜索词表现复核",
    "搜索词表现分组",
    "Parent ASIN 搜索词表现聚合",
    "语义组",
  ]);
  const searchTerm = manualActionSnapshotItemValue(snapshot, ["搜索词", "SearchTerm"]);
  if (!intentLabel && !searchTerm) return null;

  const primarySearchTerm = normalizedPreflightTargetValue(input?.primarySearchTerm);
  const normalizedSearchTerm = normalizeManualActionSearchTerm(searchTerm);
  const normalizedPrimarySearchTerm = normalizeManualActionSearchTerm(primarySearchTerm);
  const isPrimaryMismatch = Boolean(normalizedSearchTerm && normalizedPrimarySearchTerm && normalizedSearchTerm !== normalizedPrimarySearchTerm);
  const tone: SearchIntentManualActionReadbackTone = !searchTerm ? "waiting" : isPrimaryMismatch ? "warning" : "ready";
  const objectDetail = !searchTerm
    ? "还没有读回具体 SearchTerm；不能直接写入人工动作，先等待后端预检确认稳定对象。"
    : isPrimaryMismatch
      ? "当前复盘对象与聚合卡片优先 SearchTerm 不一致；如果这是用户手动切换，应按当前 SearchTerm 证据留痕。"
      : "人工动作和 7/14 天复盘会落到这个具体 SearchTerm，Parent ASIN 广告搜索词表现复核只保留为回看上下文。";

  return {
    title: "人工留痕对象读回",
    tone,
    rows: [
      {
        label: "入口上下文",
        value: intentLabel || "等待 Parent ASIN 搜索词表现复核上下文",
        detail: "读回当前 Parent ASIN 广告搜索词表现复核入口；它只做上下文，不写成 ProductScope 或人工动作对象。",
      },
      {
        label: "复盘对象",
        value: searchTerm ? `SearchTerm：${searchTerm}` : "等待具体 SearchTerm",
        detail: objectDetail,
      },
      {
        label: "当时判断",
        value: normalizedPreflightTargetValue(input?.operationDecisionLabel) || "以后端预检快照为准",
        detail:
          normalizedPreflightTargetValue(input?.operationDecisionReason) ||
          "如果后端预检没有搜索词表现判断，保存后复盘只能看到分组，不能回看为什么选择这条 SearchTerm。",
      },
      {
        label: "选择理由",
        value: primarySearchTerm ? `优先 SearchTerm：${primarySearchTerm}` : "等待优先 SearchTerm",
        detail:
          normalizedPreflightTargetValue(input?.primarySearchTermReason) ||
          "需要结合订单、花费、ACOS、广告组、投放词和广告位证据确认人工复核优先级。",
      },
      {
        label: "保存后用途",
        value: normalizedPreflightTargetValue(input?.nextManualStep) || "保存人工动作后进入 7/14 天复盘读回",
        detail: "按钮只保存人工留痕和复盘待办；实际写入以后端 preflight evidence_snapshot_preview 为准。",
      },
    ],
    boundary:
      "人工留痕只能记录观察、标记已处理、加入复盘或忽略本次；不能自动加词、否词、调价、暂停广告，也不能把 Parent ASIN 广告搜索词表现复核当作动作对象。",
  };
}

function searchIntentReadbackRowValue(readback: SearchIntentManualActionReadbackSummary, label: string) {
  return normalizedPreflightTargetValue(readback.rows.find((row) => row.label === label)?.value);
}

function normalizedSearchIntentReadbackSearchTerm(value: string | null | undefined) {
  return normalizeManualActionSearchTerm(normalizedPreflightTargetValue(value).replace(/^SearchTerm[:：]\s*/i, ""));
}

function searchIntentPreflightItemValue(preflight: ManualActionPreflightForUi, labels: string[]) {
  return manualActionSnapshotItemValue(preflight.evidence_snapshot_preview?.items ?? [], labels);
}

const searchIntentRequiredPreflightEvidenceChecks = [
  { label: "搜索词", aliases: ["搜索词", "SearchTerm"] },
  {
    label: "Parent ASIN 广告搜索词表现复核",
    aliases: ["Parent ASIN 广告搜索词表现复核", "搜索词表现分组", "Parent ASIN 搜索词表现聚合", "语义组"],
  },
  { label: "搜索词表现判断", aliases: ["搜索词表现判断"] },
  { label: "广告组合流判断", aliases: ["广告组合流判断"] },
  { label: "同组投放商品表现", aliases: ["同组投放商品表现"] },
  { label: "逐投放上下文", aliases: ["逐投放上下文"] },
  { label: "投放词证据", aliases: ["投放词证据"] },
  { label: "广告位边界", aliases: ["广告位边界"] },
  { label: "ABA 背景", aliases: ["ABA 背景"] },
  { label: "证据缺口", aliases: ["证据缺口"] },
  { label: "需要补证", aliases: ["需要补证"] },
  { label: "动作边界", aliases: ["动作边界"] },
];

export function buildSearchIntentManualActionPreflightConsistencySummary(
  input: SearchIntentManualActionPreflightConsistencyInput | null,
): SearchIntentManualActionPreflightConsistencySummary | null {
  const readback = input?.readback ?? null;
  if (!readback) return null;
  const preflight = input?.preflight ?? null;
  if (!preflight?.evidence_snapshot_preview) {
    return {
      title: "后端预检一致性核对",
      tone: "waiting",
      rows: [
        {
          label: "前端读回",
          value: readback.tone === "ready" ? "已读回 SearchTerm 对象" : "等待对象确认",
          detail: "页面读回只做点击前核对，不能证明证据已经可保存。",
        },
        {
          label: "后端预检",
          value: "等待读取 evidence_snapshot_preview",
          detail: "只有后端预检返回可保存快照后，人工动作才有复盘可回看的证据来源。",
        },
      ],
      boundary:
        "实际写入以后端 preflight evidence_snapshot_preview 为准；未读到后端快照前，不能把页面读回当成已保存证据。",
    };
  }

  const preview = preflight.evidence_snapshot_preview;
  const previewItemCount = preview.item_count ?? preview.items?.length ?? 0;
  const preflightSearchTerm = searchIntentPreflightItemValue(preflight, ["搜索词", "SearchTerm"]);
  const preflightIntentLabel = searchIntentPreflightItemValue(preflight, [
    "Parent ASIN 广告搜索词表现复核",
    "搜索词表现分组",
    "Parent ASIN 搜索词表现聚合",
    "语义组",
  ]);
  const preflightDecision = searchIntentPreflightItemValue(preflight, ["搜索词表现判断"]);
  const readbackSearchTerm = normalizedSearchIntentReadbackSearchTerm(searchIntentReadbackRowValue(readback, "复盘对象"));
  const readbackIntentLabel = searchIntentReadbackRowValue(readback, "入口上下文");
  const missingLabels = searchIntentRequiredPreflightEvidenceChecks
    .filter((check) => !searchIntentPreflightItemValue(preflight, check.aliases))
    .map((check) => check.label);

  const mismatches: string[] = [];
  if (readbackSearchTerm && preflightSearchTerm && readbackSearchTerm !== normalizeManualActionSearchTerm(preflightSearchTerm)) {
    mismatches.push("SearchTerm 与页面读回不一致");
  }
  if (readbackIntentLabel && preflightIntentLabel && readbackIntentLabel !== preflightIntentLabel) {
    mismatches.push("Parent ASIN 广告搜索词表现复核与页面读回不一致");
  }
  if (!manualActionPreflightHasSavableEvidenceSnapshotPreview(preflight)) {
    mismatches.push("后端预检快照不可保存");
  }
  const blockers = [...missingLabels.map((label) => `缺少${label}`), ...mismatches];
  const tone: SearchIntentManualActionPreflightConsistencyTone = blockers.length > 0 ? "blocked" : "ready";

  return {
    title: "后端预检一致性核对",
    tone,
    rows: [
      {
        label: "前端读回",
        value: readback.tone === "warning" ? "SearchTerm 由用户手动切换" : "SearchTerm 上下文已读回",
        detail: "用于提示用户当前页面看到的入口、对象和当时判断；不直接写入人工动作。",
      },
      {
        label: "后端预检",
        value: `${previewItemCount} 条将保存证据 / will_write=${String(preflight.will_write)}`,
        detail: preview.boundary || "后端预检只返回将保存的证据快照，不执行广告动作。",
      },
      {
        label: "可保存证据",
        value: blockers.length > 0
          ? `待补齐：${blockers.join("；")}`
          : "SearchTerm / 广告组 / 投放词 / 广告位复核链一致",
        detail:
          blockers.length > 0
            ? "缺少这些证据时，保存后 7/14 天复盘不能完整回看为什么处理这条 SearchTerm。"
            : "后端快照已包含搜索词、Parent ASIN 广告搜索词表现复核、搜索词表现判断、广告组合流、同组投放商品、逐投放上下文、投放词证据、广告位边界和补证边界。",
      },
      {
        label: "复盘判断",
        value: preflightDecision || "缺少搜索词表现判断",
        detail: "该判断只服务人工复核优先级，不能自动加词、否词、调价或暂停广告。",
      },
    ],
    boundary:
      "人工动作实际写入以后端 preflight evidence_snapshot_preview 为准；缺少 SearchTerm、广告组、同组投放商品、逐投放上下文、投放词、广告位或补证边界时，不能把前端读回当成复盘证据。",
  };
}

export function buildSignalManualActionEvidenceSnapshot(
  signal: ReviewSignalForUi | null | undefined,
  selectedSearchIntentLabel?: string | null,
): ManualActionEvidenceSnapshotForUi[] {
  const facts = signal?.evidence?.facts ?? [];
  const primaryObject = signal?.evidence?.primary_object;
  const factValue = (label: string) => signalFactValue(facts, label);
  const intentLabel =
    String(selectedSearchIntentLabel ?? "").trim() ||
    factValue("搜索意图分组") ||
    factValue("Parent ASIN 广告搜索词表现复核") ||
    factValue("Parent ASIN 搜索词表现聚合") ||
    factValue("广告搜索词聚合上下文") ||
    factValue("语义组") ||
    String(primaryObject?.intent_label ?? "").trim();
  const snapshot = buildSearchIntentManualActionEvidenceSnapshot({
    intentLabel,
    searchTerm: String(primaryObject?.search_term ?? "").trim() || factValue("搜索词") || String(primaryObject?.label ?? "").trim(),
    abaReferenceTerm: factValue("ABA语义参考词"),
    abaRank: factValue("ABA语义参考排名") || factValue("ABA排名"),
    abaPeriod: factValue("ABA周期"),
    abaMatchBoundary: factValue("ABA匹配边界"),
  });
  const manualActionPath = factValue("人工动作路径");
  if (manualActionPath) {
    snapshot.push({
      label: "人工动作路径",
      value: manualActionPath,
      detail: "用于限定人工确认后的动作边界，系统不自动执行广告操作。",
      source: "积加API",
    });
  }
  const reviewMetrics = factValue("复盘指标");
  if (reviewMetrics) {
    snapshot.push({
      label: "复盘指标",
      value: reviewMetrics,
      detail: "用于 7/14 天复盘时判断处理是否有效。",
      source: "积加API",
    });
  }
  return snapshot;
}

function signalFactValue(facts: NonNullable<NonNullable<ReviewSignalForUi["evidence"]>["facts"]>, label: string) {
  for (const fact of facts) {
    const factLabel = String(fact.label ?? fact.metric_name ?? "").trim();
    if (factLabel !== label) continue;
    const value = String(fact.value ?? fact.metric_value ?? fact.time_range ?? "").trim();
    if (value) return value;
  }
  return "";
}

export function mergeManualActionEvidenceSnapshots(
  primary: ManualActionEvidenceSnapshotForUi[],
  secondary: ManualActionEvidenceSnapshotForUi[],
  limit = 8,
): ManualActionEvidenceSnapshotForUi[] {
  const seen = new Set<string>();
  const merged: ManualActionEvidenceSnapshotForUi[] = [];
  for (const item of [...primary, ...secondary]) {
    const label = String(item.label ?? "").trim();
    const value = String(item.value ?? "").trim();
    if (!label || !value) continue;
    const key = `${label}\n${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      label,
      value,
      detail: item.detail ? String(item.detail).trim() : null,
      source: item.source ? String(item.source).trim() : null,
    });
    if (merged.length >= limit) break;
  }
  return merged;
}

export function buildManualActionRequestPayload(input: ManualActionRequestPayloadInput): ManualActionRequestPayloadForUi {
  const preview = input.preflight?.evidence_snapshot_preview;
  const previewItems = preview?.items ?? [];
  const evidenceSnapshot =
    previewItems.length > 0 && preview?.will_save_on_authorized_write !== false
      ? buildManualActionEvidenceSnapshot(previewItems, previewItems.length)
      : [];
  return {
    action_type: input.actionType,
    action_note: input.actionLabel,
    operator_name: input.operatorName,
    evidence_snapshot: evidenceSnapshot,
    expected_product_scope_id: input.productScopeId ?? null,
    expected_object_type: input.preflight?.target?.object_type ?? null,
    expected_object_id: input.preflight?.target?.object_id ?? null,
    expected_can_auto_change_rules: false,
    expected_can_auto_execute_ads: false,
  };
}

export function buildManualActionPostWritePreflightRequest(
  input: ManualActionPostWritePreflightRequestInput,
): ManualActionPostWritePreflightRequestForUi {
  return {
    marketId: input.action.market_id ?? input.fallbackMarketId ?? null,
    top: input.top ?? 5,
    productScopeId: input.productScopeId ?? null,
    expectedObjectId: input.action.object_id ?? null,
    expectedObjectType: input.action.object_type ?? null,
    actionType: input.action.action_type,
    expectWritten: true,
  };
}

export function manualActionEvidenceSnapshotText(
  action: { evidence_snapshot?: ManualActionEvidenceSnapshotForUi[] | null; review_context?: ReviewContextForUi | null } | null,
) {
  const snapshot = action?.evidence_snapshot ?? [];
  const contextText = reviewContextText(action);
  if (!snapshot.length) {
    const missingSnapshotText = "历史旧留痕缺少证据快照；只能说明曾有人工动作或复盘上下文，不能证明当前证据闭环";
    return contextText ? `${missingSnapshotText}；复盘上下文：${contextText}` : missingSnapshotText;
  }
  const evidenceText = snapshot
    .slice(0, 4)
    .map((item) => `${manualActionEvidenceDisplayLabel(item.label)}：${item.value}`)
    .join("；");
  return contextText ? `留痕证据快照：${evidenceText}；复盘上下文：${contextText}` : `留痕证据快照：${evidenceText}`;
}

function manualActionEvidenceDisplayLabel(label: string) {
  if (label === "语义组" || label === "搜索意图分组" || label === "广告搜索词聚合上下文" || label === "Parent ASIN 搜索词表现聚合") {
    return "搜索词表现分组";
  }
  return label;
}

const manualActionEvidenceReasonPriority = [
  "广告商品覆盖",
  "广告聚合指标",
  "广告指标汇总",
  "搜索词市场背景",
  "搜索词边界",
  "广告位边界",
  "人工确认判断依据",
  "能证明的事实",
  "不能证明的边界",
  "人工下一步",
  "上下文边界",
  "人工动作路径",
  "复盘指标",
  "搜索词表现分组",
  "搜索意图分组",
  "Parent ASIN 广告搜索词表现复核",
  "Parent ASIN 搜索词表现聚合",
  "广告搜索词聚合上下文",
  "语义组",
  "搜索词",
  "ABA语义参考词",
  "ABA语义参考排名",
];

export function manualActionEvidenceReasonText(
  snapshot: ManualActionEvidenceSnapshotForUi[] | null | undefined,
  limit = 3,
) {
  const normalized = (snapshot ?? [])
    .map((item, index) => ({
      item: {
        label: String(item.label ?? "").trim(),
        value: String(item.value ?? "").trim(),
      },
      index,
    }))
    .filter(({ item }) => item.label && item.value);
  if (!normalized.length) return null;

  const ranked = normalized
    .map((entry) => {
      const priorityIndex = manualActionEvidenceReasonPriority.indexOf(entry.item.label);
      return {
        ...entry,
        priority: priorityIndex === -1 ? manualActionEvidenceReasonPriority.length : priorityIndex,
      };
    })
    .sort((left, right) => left.priority - right.priority || left.index - right.index);
  const visible = ranked.slice(0, limit);
  const contextBoundary = ranked.find((entry) => entry.item.label === "上下文边界");
  if (contextBoundary && !visible.some((entry) => entry.item.label === "上下文边界")) {
    visible.push(contextBoundary);
  }

  return visible.map(({ item }) => `${manualActionEvidenceDisplayLabel(item.label)}：${item.value}`).join("；");
}

export function reviewContextText(action: { review_context?: ReviewContextForUi | null } | null) {
  const context = action?.review_context;
  if (!context) return null;
  const parts: string[] = [];
  if (context.search_intent_label) {
    parts.push(`Parent ASIN 广告搜索词表现复核：${context.search_intent_label}`);
  }
  if (context.search_term) {
    parts.push(`具体 SearchTerm：${context.search_term}`);
  }
  if (context.aba_reference_term) {
    const rankText = context.aba_reference_rank ? ` / 排名 ${context.aba_reference_rank}` : "";
    parts.push(`ABA 站点级参考：${context.aba_reference_term}${rankText}`);
  }
  if (context.aba_match_boundary) {
    parts.push(`边界：${context.aba_match_boundary}`);
  }
  if (context.manual_action_path) {
    parts.push(`动作路径：${context.manual_action_path}`);
  }
  if (context.review_metrics) {
    parts.push(`复盘指标：${context.review_metrics}`);
  }
  if (context.repeat_summary) {
    parts.push(reviewContextDisplayText(context.repeat_summary));
  }
  if (context.search_intent_label && context.search_term) {
    parts.push("人工复盘下一步：按同类广告搜索词表现核对规则口径，不把搜索词表现分组当作广告动作对象");
  }
  if (context.can_auto_change_rules === false || context.can_auto_execute_ads === false) {
    parts.push("不会自动改规则或执行广告");
  }
  return parts.length > 0 ? parts.join("；") : null;
}

function reviewContextDisplayText(text: string) {
  return text
    .replace(/Parent ASIN 搜索词表现聚合/g, "Parent ASIN 广告搜索词表现复核")
    .replace(/搜索意图分组/g, "搜索词表现分组")
    .replace(/语义组/g, "搜索词表现分组")
    .replace(/聚合标签/g, "搜索词表现分组");
}

export function manualActionIntentText(actionType: ManualActionForUi["action_type"]) {
  const intentText: Record<ManualActionForUi["action_type"], string> = {
    add_to_review: "人工加入复盘，生成 7/14 天复盘待办；不自动执行广告动作，也不代表已有改善结论。",
    handled: "人工标记已处理，生成 7/14 天复盘待办；不自动执行广告动作，效果要等 ready 复盘。",
    observe: "人工记录当前观察，生成 7/14 天复盘待办；不自动执行广告动作，暂不判断处理效果。",
    ignore: "人工忽略本次，不进入当前 7/14 天复盘待办；不自动执行广告动作，信号和证据保留。",
  };
  return intentText[actionType];
}

export function manualActionChoiceGuideItems(): ManualActionChoiceGuideItem[] {
  return [
    {
      actionType: "add_to_review",
      label: "加入复盘",
      whenToUse: "已确认这条信号值得 7/14 天后回看处理前后指标。",
      writes: "写入人工留痕，并生成 7d / 14d 复盘待办。",
      boundary: manualActionIntentText("add_to_review"),
    },
    {
      actionType: "observe",
      label: "记录观察",
      whenToUse: "证据值得保留，但现在还不承诺已经处理或需要判断效果。",
      writes: "写入人工观察，并生成 7d / 14d 复盘待办。",
      boundary: manualActionIntentText("observe"),
    },
    {
      actionType: "handled",
      label: "标记已处理",
      whenToUse: "运营已经在线下完成处理动作，需要把动作和证据留痕。",
      writes: "写入已处理记录，并生成 7d / 14d 复盘待办。",
      boundary: manualActionIntentText("handled"),
    },
    {
      actionType: "ignore",
      label: "忽略本次",
      whenToUse: "当前不进入复盘，但仍保留信号和证据供后续回看。",
      writes: "只写入忽略留痕，不生成当前 7/14 天复盘待办。",
      boundary: manualActionIntentText("ignore"),
    },
  ];
}

function manualActionChoiceEvidenceLink(
  diagnosisEvidence: DiagnosisEvidenceSummaryForManualBridge | null | undefined,
): Pick<ManualActionChoiceRecommendation, "evidenceLink" | "evidenceBoundary"> {
  if (!diagnosisEvidence) {
    return {
      evidenceLink: "证据回链：先回到中间诊断区核对业务问题、证据强度和人工下一步。",
      evidenceBoundary: "边界回链：当前推荐只说明人工动作选择，不替代中间证据复核，也不执行广告动作。",
    };
  }

  const context = [
    diagnosisEvidence.businessQuestion?.trim(),
    diagnosisEvidence.objectReadback?.trim(),
  ]
    .filter((item): item is string => Boolean(item))
    .join("；");
  const proves = diagnosisEvidence.proves?.trim();
  const doesNotProve = diagnosisEvidence.doesNotProve?.trim();
  const evidenceGap = diagnosisEvidence.evidenceGap?.trim();

  return {
    evidenceLink: `证据回链：${context || diagnosisEvidence.title?.trim() || "中间诊断证据链"}${
      proves ? `；能证明：${proves}` : ""
    }`,
    evidenceBoundary: doesNotProve
      ? `边界回链：不能证明：${doesNotProve}`
      : evidenceGap
        ? `边界回链：证据缺口：${evidenceGap}`
        : "边界回链：仍需人工确认，不自动执行广告动作。",
  };
}

export function manualActionChoiceRecommendation({
  recommendedActionType,
  gatesByAction,
  diagnosisEvidence,
}: ManualActionChoiceRecommendationInput): ManualActionChoiceRecommendation {
  const guides = manualActionChoiceGuideItems();
  const guideByAction = new Map(guides.map((guide) => [guide.actionType, guide]));
  const recommendedGuide = recommendedActionType ? guideByAction.get(recommendedActionType) ?? null : null;
  const recommendedGate = recommendedActionType ? gatesByAction[recommendedActionType] ?? null : null;
  const firstReadyGuide = guides.find((guide) => gatesByAction[guide.actionType]?.disabled === false) ?? null;
  const selectedGuide =
    recommendedGuide && recommendedGate?.disabled === false ? recommendedGuide : firstReadyGuide ?? recommendedGuide ?? guides[0];
  const selectedGate = gatesByAction[selectedGuide.actionType] ?? null;
  const isReady = selectedGate?.disabled === false;
  const fallbackReason = selectedGate?.reason ?? selectedGate?.compactReason ?? "当前准入预检尚未给出可写入结果。";
  const evidenceLink = manualActionChoiceEvidenceLink(diagnosisEvidence);

  if (!isReady) {
    return {
      actionType: selectedGuide.actionType,
      label: selectedGuide.label,
      tone: "blocked",
      title: "本次建议选择",
      reason: `当前没有可点击的人工动作：${fallbackReason}`,
      evidenceLink: evidenceLink.evidenceLink,
      evidenceBoundary: evidenceLink.evidenceBoundary,
      reviewPlan: "先补齐准入预检、稳定对象或证据快照，再决定是否进入 7/14 天复盘。",
      boundary: "不会自动调价、暂停广告、加词或否词。",
    };
  }

  const reasonPrefix =
    selectedGuide.actionType === recommendedActionType
      ? "系统推荐动作可用"
      : "系统推荐动作暂不可点，先选择当前第一个可用人工动作";
  return {
    actionType: selectedGuide.actionType,
    label: selectedGuide.label,
    tone: "ready",
    title: "本次建议选择",
    reason: `${reasonPrefix}：${selectedGuide.whenToUse}`,
    evidenceLink: evidenceLink.evidenceLink,
    evidenceBoundary: evidenceLink.evidenceBoundary,
    reviewPlan: `${selectedGuide.writes} 点击后只形成留痕或排程，不保存改善结论。`,
    boundary: "不会自动调价、暂停广告、加词或否词。",
  };
}

export function manualActionButtonExpectationText(
  actionType: ManualActionForUi["action_type"],
  preflight: ManualActionPreflightForUi | null,
) {
  if (!preflight?.expected_after_write || !preflight.current_counts) return null;
  const currentManualActionCount = numberOrZero(preflight.current_counts.target_manual_action_count);
  const currentReviewTodoCount = numberOrZero(preflight.current_counts.target_review_todo_count);
  const expectedManualActionCount = numberOrZero(preflight.expected_after_write.target_manual_action_count);
  const expectedReviewTodoCount = numberOrZero(preflight.expected_after_write.target_review_todo_count);
  const manualActionDelta = Math.max(0, expectedManualActionCount - currentManualActionCount);
  const reviewTodoDelta = Math.max(0, expectedReviewTodoCount - currentReviewTodoCount);
  if (actionType === "ignore") {
    return `预期写入：留痕 +${manualActionDelta}，复盘待办 +${reviewTodoDelta}；忽略本次不进入当前 7/14 天待办；不执行广告动作，不保存复盘结论。`;
  }
  return `预期写入：留痕 +${manualActionDelta}，复盘待办 +${reviewTodoDelta}；不执行广告动作，不保存复盘结论。`;
}

export function manualActionPostWriteExpectationText(actionType: ManualActionForUi["action_type"]) {
  if (actionType === "ignore") {
    return "写后预期：只写 1 条人工留痕，不生成当前复盘待办；不会保存复盘结论，不执行广告动作。";
  }
  return "写后预期：只写 1 条人工留痕，生成 7 天和 14 天复盘待办；不会保存复盘结论，不执行广告动作。";
}

export function manualActionPostWriteExpectationSummaryText() {
  return "写后预期：复盘类只生成 7 天 / 14 天复盘排程；忽略 0 条；未到 ready 不保存结论，不执行广告动作。";
}

export function manualActionPostWriteContractItems(preflight: ManualActionPreflightForUi | null): ManualActionPostWriteContractItem[] {
  if (!preflight) {
    return [
      {
        label: "后端预检",
        value: "读取中",
        detail: "未读取前不会写入人工动作，也不会生成复盘待办。",
      },
    ];
  }

  const targetManualActionCount = numberOrZero(preflight.expected_after_write?.target_manual_action_count);
  const targetReviewTodoCount = numberOrZero(preflight.expected_after_write?.target_review_todo_count);
  const reviewWindows = preflight.target?.review_windows?.length ? preflight.target.review_windows.join(" / ") : "7d / 14d";
  const evidenceCount = numberOrZero(preflight.evidence_snapshot_preview?.item_count);
  const evidenceText = evidenceCount > 0 ? `并继承 ${evidenceCount} 条证据快照` : "并回看点击时证据快照";
  const reviewRecordText = preflight.forbidden_effects?.some((effect) => effect.includes("不保存 review_records")) ? "不保存" : "待核对";
  const adsEffectText = preflight.forbidden_effects?.some((effect) => effect.includes("不执行广告动作"))
    ? "禁止自动执行"
    : "需核对禁止副作用";

  return [
    {
      label: "人工留痕",
      value: `预计 ${targetManualActionCount} 条`,
      detail: "点击后必须能从 manual_actions 读回同一对象、动作和市场。",
    },
    {
      label: "复盘待办",
      value: `预计 ${targetReviewTodoCount} 条`,
      detail: targetReviewTodoCount > 0 ? `应生成 ${reviewWindows} 复盘待办，${evidenceText}；待办只表示排程。` : "该动作不生成当前复盘待办。",
    },
    {
      label: "复盘结论",
      value: reviewRecordText,
      detail: "未到完整 7/14 天处理后窗口前，不保存 review_records，也不判断改善结论。",
    },
    {
      label: "广告动作",
      value: adsEffectText,
      detail: "只记录人工判断；不自动加词、否词、调价或暂停广告。",
    },
  ];
}

export function manualActionAuthorizationReadinessSummary(
  preflight: ManualActionPreflightForUi | null,
): ManualActionAuthorizationReadinessSummary | null {
  if (!preflight) return null;
  const blockers = preflight.blockers ?? [];
  const target = preflight.target;
  const objectText = [target?.object_type, target?.object_id].filter(Boolean).join(" / ") || "对象待补充";
  const label = target?.object_label && !objectText.includes(target.object_label) ? ` / ${target.object_label}` : "";
  const targetText = `${objectText}${label}`;
  const windows = target?.review_windows?.length ? target.review_windows.join(" / ") : "7d / 14d";
  const currentManualActions = numberOrZero(preflight.current_counts?.target_manual_action_count);
  const currentReviewTodos = numberOrZero(preflight.current_counts?.target_review_todo_count);
  const expectedManualActions = numberOrZero(preflight.expected_after_write?.target_manual_action_count);
  const expectedReviewTodos = numberOrZero(preflight.expected_after_write?.target_review_todo_count);
  const evidenceCount = numberOrZero(preflight.evidence_snapshot_preview?.item_count);
  const willSaveEvidence = preflight.evidence_snapshot_preview?.will_save_on_authorized_write === true;
  const ready =
    preflight.status === "ready_for_explicit_manual_write" &&
    preflight.will_write === false &&
    preflight.requires_explicit_authorization === true &&
    blockers.length === 0;
  const blocked = preflight.status === "blocked" || blockers.length > 0;

  return {
    title: "待授权写入状态",
    tone: blocked ? "blocked" : ready ? "ready" : "waiting",
    primary: ready
      ? "准入核对已通过，但当前没有写入；必须人工点击并通过授权门禁后才会生成留痕。"
      : blocked
        ? "当前人工动作被准入预检阻断，不能写入人工留痕。"
        : "准入预检尚未进入可授权写入状态，当前不要写入人工留痕。",
    target: `目标：${targetText}`,
    currentState: `当前：ManualAction ${currentManualActions} 条 / ReviewTodo ${currentReviewTodos} 条`,
    authorizedResult: `授权后预期：ManualAction ${expectedManualActions} 条 / ReviewTodo ${expectedReviewTodos} 条 / 窗口 ${windows}`,
    evidence:
      evidenceCount > 0
        ? `证据快照：${evidenceCount} 条${willSaveEvidence ? "，授权写入时会随 ManualAction 保存并继承到 ReviewTodo。" : "，当前仅作预览。"}`
        : "证据快照：未生成可保存预览，不能进入真实写入。",
    boundary: "ready 只代表可人工确认，不代表已处理；未授权前不写 manual_actions，不生成 ReviewTodo，不保存 ReviewRecord，不执行广告动作。",
  };
}

export function buildManualReviewClosureLedger(input: ManualReviewClosureLedgerInput): ManualReviewClosureLedger {
  const manualActionCount = Math.max(0, input.manualActionCount);
  const reviewTodoCount = Math.max(0, input.reviewTodoCount);
  const reviewRecordCount = Math.max(0, input.reviewRecordCount);
  const nextReviewDueDate = input.nextReviewDueAt ? input.nextReviewDueAt.slice(0, 10) : null;

  const summary = (() => {
    if (reviewRecordCount > 0) return "已形成可回看的人工闭环：留痕、待办和复盘结论均可读回。";
    if (manualActionCount > 0 && reviewTodoCount > 0) return "当前已留痕并进入 7/14 天复盘待办；这只是排程，未到期不判断效果。";
    if (manualActionCount > 0) return "当前只有人工留痕，没有进入 7/14 天复盘待办。";
    return "当前还不能落地到复盘：未产生人工留痕。";
  })();

  const reviewRecordDetail =
    reviewRecordCount > 0
      ? "结论只来自人工保存的 review_records，可用于后续规则反馈候选。"
      : input.reviewEffectStatus === "ready"
        ? "效果窗口 ready 只代表可复核，仍需人工保存 review_records 后才算形成复盘结论。"
        : "未到完整 7/14 天窗口前不能判断改善、无变化或恶化。";

  return {
    title: "人工确认复盘闭环",
    summary,
    rows: [
      {
        label: "人工留痕",
        value: manualActionCount > 0 ? `已记录 ${manualActionCount} 条` : "未记录",
        detail: "只有人工点击后才写入 manual_actions；不会自动执行广告动作。",
        tone: manualActionCount > 0 ? "saved" : "empty",
      },
      {
        label: "复盘待办",
        value: reviewTodoCount > 0 ? `已生成 ${reviewTodoCount} 条` : "未生成",
        detail:
          reviewTodoCount > 0
            ? `review_todos 只表示等待 7/14 天窗口，不代表已判定改善${nextReviewDueDate ? `，下一项到期 ${nextReviewDueDate}` : ""}。`
            : "记录观察、标记已处理或加入复盘后才会生成 7/14 天复盘待办。",
        tone: reviewTodoCount > 0 ? "waiting" : "empty",
      },
      {
        label: "复盘结论",
        value: reviewRecordCount > 0 ? `已保存 ${reviewRecordCount} 条` : input.reviewEffectStatus === "ready" ? "待人工保存" : "未保存",
        detail: reviewRecordDetail,
        tone: reviewRecordCount > 0 ? "saved" : input.reviewEffectStatus === "ready" ? "ready" : "waiting",
      },
    ],
    boundary: "manual_actions 记录判断；review_todos 排程；review_records 保存结论；系统不自动执行广告动作。",
  };
}

function manualReviewEvidencePathSnapshotStatus(
  snapshot: ManualActionEvidenceSnapshotForUi[] | null | undefined,
  objectType?: string | null,
) {
  const items = (snapshot ?? []).filter((item) => String(item.label ?? "").trim() && String(item.value ?? "").trim());
  const labels = evidenceLabelSet(items);
  const isSearchTerm = normalizedPreflightTargetValue(objectType) === "search_term";
  const requiredGroups = isSearchTerm
    ? [
        reviewRecordDiagnosisPathLabels,
        reviewRecordAiAdmissionLabels,
        ["Parent ASIN 广告搜索词表现复核", "Parent ASIN 搜索词表现聚合", "广告搜索词聚合上下文", "搜索意图分组", "语义组"],
        reviewRecordSearchTermPerformanceDecisionLabels,
        reviewRecordAdGroupSynthesisLabels,
        reviewRecordAdGroupProductPerformanceLabels,
        reviewRecordAdContextRowsLabels,
        reviewRecordTargetingEvidenceLabels,
        reviewRecordSearchTermBoundaryLabels,
        reviewRecordPlacementBoundaryLabels,
        reviewRecordAbaContextLabels,
      ]
    : [reviewRecordDiagnosisPathLabels, reviewRecordAiAdmissionLabels, reviewRecordSearchTermBoundaryLabels, reviewRecordPlacementBoundaryLabels];
  const missing = requiredGroups
    .map((group) => (group.some((label) => labels.has(label)) ? "" : group[0]))
    .filter(Boolean);
  const readbackLabels = isSearchTerm
    ? "排查路径 / AI 准入 / Parent ASIN 广告搜索词表现复核 / 搜索词表现判断 / 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 投放词证据 / 搜索词边界 / 广告位边界 / ABA 背景"
    : "排查路径 / AI 准入 / 搜索词边界 / 广告位边界";
  return {
    count: items.length,
    ready: items.length > 0 && missing.length === 0,
    missing,
    readbackLabels,
  };
}

export function buildManualReviewEvidencePathReadback(
  input: ManualReviewEvidencePathReadbackInput,
): ManualReviewEvidencePathReadback {
  const action = input.latestManualAction;
  const actionStatus = manualReviewEvidencePathSnapshotStatus(action?.evidence_snapshot, action?.object_type);
  const todoText = reviewTodoEvidenceSnapshotReadbackText(input.reviewTodos);
  const recordText = reviewRecordEvidenceSnapshotReadbackText(input.reviewRecords);
  const windows = readbackReviewWindows(input.reviewTodos);
  const hasAllReviewWindows = windows.length === reviewWindowOrder.length;
  const todoReady = input.reviewTodos.length > 0 && hasAllReviewWindows && !todoText?.includes("待核对");
  const recordReady = input.reviewRecords.length > 0 && !recordText?.includes("待核对");
  const hasBlocked =
    Boolean(action && !actionStatus.ready) ||
    (input.reviewTodos.length > 0 && !todoReady) ||
    (input.reviewRecords.length > 0 && !recordReady);
  const tone: ManualReviewEvidencePathReadback["tone"] = recordReady
    ? "saved"
    : hasBlocked
      ? "blocked"
      : todoReady
        ? "ready"
        : "waiting";
  const summary = (() => {
    if (!action) return "尚未产生人工留痕；没有点击时证据快照，就不能生成同一路径的复盘读回。";
    if (recordReady) return "ManualAction、ReviewTodo 和 ReviewRecord 均可沿点击时证据路径读回。";
    if (hasBlocked) return "证据路径读回存在缺口；缺口补齐前不能把待办或复盘记录当成完整业务证据。";
    if (todoReady) return "人工留痕和 7/14 天复盘待办已沿同一条点击时证据路径读回；未保存复盘结论前不判断效果。";
    return "已读到人工留痕，正在等待 7/14 天复盘待办或完整窗口。";
  })();

  return {
    title: "同一证据路径读回",
    tone,
    summary,
    rows: [
      {
        label: "ManualAction",
        value: action ? (actionStatus.ready ? "路径已留存" : "路径待核对") : "未留痕",
        detail: action
          ? actionStatus.ready
            ? `点击时 evidence_snapshot ${actionStatus.count} 条；可回看${actionStatus.readbackLabels}。`
            : `已读到人工留痕，但点击时 evidence_snapshot 缺：${actionStatus.missing.join(" / ") || "证据快照"}；后续待办不能替代历史点击依据。`
          : "尚未人工点击记录观察、标记已处理、加入复盘或忽略本次。",
        tone: action ? (actionStatus.ready ? "ready" : "blocked") : "waiting",
      },
      {
        label: "ReviewTodo",
        value: input.reviewTodos.length > 0 ? (todoReady ? "已继承 7/14 天" : "待核对") : action?.action_type === "ignore" ? "不生成" : "等待生成",
        detail:
          input.reviewTodos.length > 0
            ? `${todoText ?? "已读到复盘待办"}；ReviewTodo 只继承点击时证据路径并等待窗口，不代表效果结论。`
            : action?.action_type === "ignore"
              ? "忽略本次不生成 7/14 天待办，仍不代表误报或删除信号。"
              : "复盘类人工动作应生成 7d / 14d 待办，并继承 ManualAction 的 evidence_snapshot。",
        tone: input.reviewTodos.length > 0 ? (todoReady ? "ready" : "blocked") : "waiting",
      },
      {
        label: "ReviewRecord",
        value: input.reviewRecords.length > 0 ? (recordReady ? "结论已沿用" : "结论待核对") : "未保存结论",
        detail:
          input.reviewRecords.length > 0
            ? `${recordText ?? "已读到复盘记录"}；ReviewRecord 只能保存人工复盘结论，不自动改规则或执行广告动作。`
            : "只有 7/14 天窗口完整且人工保存后，ReviewRecord 才能沿已验证 evidence_snapshot 形成结论。",
        tone: input.reviewRecords.length > 0 ? (recordReady ? "ready" : "blocked") : "waiting",
      },
    ],
    boundary: "这张卡只验证 ManualAction -> ReviewTodo -> ReviewRecord 是否沿用点击时证据路径；不代表广告动作执行，也不代表系统自动判断改善。",
  };
}

export const manualActionPostWritePreflightReadErrorText =
  "写后读回失败，已保留人工留痕，请稍后刷新核对复盘排程。";

export function manualActionPreflightStatusText(preflight: ManualActionPreflightForUi | null) {
  if (!preflight) return "人工留痕准入：正在核对对象和证据；完成前不会写入人工动作。";
  const target = preflight.target;
  const objectText = manualActionReviewTargetDisplayText(target);
  const blockers = preflight.blockers ?? [];
  const isPostWrite = preflight.mode === "post_write";
  if (preflight.status === "blocked" || blockers.length > 0) {
    const blockerText = blockers.map((blocker) => blocker.message || blocker.code).filter(Boolean).join("；") || "存在阻塞项";
    return isPostWrite
      ? `写后读回阻塞：${objectText}；${blockerText}；请核对人工留痕和复盘排程。`
      : `人工留痕准入阻塞：${objectText}；${blockerText}；不会写入人工动作。`;
  }

  const currentManualActionCount = numberOrZero(preflight.current_counts?.target_manual_action_count);
  const currentReviewTodoCount = numberOrZero(preflight.current_counts?.target_review_todo_count);
  const expectedManualActionCount = numberOrZero(preflight.expected_after_write?.target_manual_action_count);
  const expectedReviewTodoCount = numberOrZero(preflight.expected_after_write?.target_review_todo_count);
  const forbiddenText =
    preflight.forbidden_effects?.some((effect) => effect.includes("不执行广告动作")) || preflight.will_write === false
      ? "不执行广告动作"
      : "需核对禁止副作用";
  const reviewRecordText = preflight.forbidden_effects?.some((effect) => effect.includes("不保存 review_records"))
    ? "不保存复盘结论"
    : "复盘结论需另行核对";
  if (isPostWrite) {
    const evidenceReadbackText = manualActionPostWriteEvidenceReadbackText(preflight);
    const evidenceReadbackSegment = evidenceReadbackText ? `；${evidenceReadbackText}` : "";
    const reviewTodoBoundarySegment =
      currentReviewTodoCount > 0 && numberOrZero(preflight.current_counts?.target_review_record_count) === 0
        ? `；${reviewTodoPendingEffectBoundaryText}`
        : "";
    return `写后读回通过：${objectText} 已有 ${currentManualActionCount} 条人工留痕、${currentReviewTodoCount} 条复盘排程${reviewTodoBoundarySegment}${evidenceReadbackSegment}；${forbiddenText}，${reviewRecordText}。`;
  }
  const preWriteTitle = preflight.requires_explicit_authorization ? "人工留痕准入通过，待人工点击" : "人工留痕准入通过";
  const writeExpectation = preflight.requires_explicit_authorization ? "点击后预计" : "人工确认后预计";
  return `${preWriteTitle}：${objectText} 当前已有 ${currentManualActionCount} 条人工留痕、${currentReviewTodoCount} 条复盘排程；${writeExpectation} ${expectedManualActionCount} 条人工留痕、${expectedReviewTodoCount} 条复盘排程；${forbiddenText}，${reviewRecordText}。`;
}

function manualActionPostWriteEvidenceReadbackText(preflight: ManualActionPreflightForUi) {
  const checks = preflight.post_write_checks;
  const manualEvidenceCounts = checks?.target_manual_action_evidence_snapshot_counts ?? [];
  const reviewTodoEvidenceCounts = checks?.target_review_todo_evidence_snapshot_counts ?? [];
  if (manualEvidenceCounts.length === 0 && reviewTodoEvidenceCounts.length === 0) return null;

  const manualEvidenceCount = manualEvidenceCounts.reduce(
    (total, item) => total + numberOrZero(item.evidence_snapshot_count),
    0,
  );
  const reviewTodoText = reviewTodoEvidenceCounts
    .slice()
    .sort(compareReviewWindowEvidenceCounts)
    .map((item) => `${reviewWindowsDisplayText([item.review_window])} ${numberOrZero(item.evidence_snapshot_count)} 条`)
    .join(" / ");

  return `证据读回：留痕 ${manualEvidenceCount} 条，复盘排程 ${reviewTodoText || "未读回证据"}`;
}

export function manualActionPreflightEvidenceSnapshotText(preflight: ManualActionPreflightForUi | null) {
  const preview = preflight?.evidence_snapshot_preview;
  if (!preview) return null;
  const items = preview.items ?? [];
  const itemCount = preview.item_count ?? items.length;
  if (itemCount <= 0) return "证据快照预览：未读到可保存证据；不会自动写入人工动作。";

  const evidenceText = manualActionEvidenceReasonText(items);
  const saveText = preview.will_save_on_authorized_write === false ? "授权后仍需核对是否保存" : `将保存 ${itemCount} 条证据快照`;
  const writeBoundaryText = preflight?.will_write === false || preview.will_write === false ? "人工点击后才保存，不执行广告动作" : "写入边界需核对";
  return evidenceText ? `证据快照预览：${saveText}；${evidenceText}；${writeBoundaryText}。` : `证据快照预览：${saveText}；${writeBoundaryText}。`;
}

export function manualActionPreflightEvidenceRows(preflight: ManualActionPreflightForUi | null, limit = 10) {
  if (!preflight?.evidence_snapshot_preview) return [];
  return buildManualActionDisplayEvidenceSnapshot({
    preflight,
    fallbackEvidenceSnapshot: [],
  }).slice(0, limit);
}

const manualActionPreflightPriorityEvidenceLabels = [
  "AI 准入",
  "搜索词",
  "搜索词表现判断",
  "人工下一步",
  "同组投放商品表现",
  "证据缺口",
  "需要补证",
  "动作边界",
  "投放词证据",
  "广告位边界",
  "搜索词表现分组",
  "Parent ASIN入口",
  "广告 ASIN承接",
  "广告商品覆盖",
  "广告组合流判断",
  "逐投放上下文",
  "搜索词边界",
  "广告位活动级背景",
  "ABA 背景",
  "广告位证据缺口",
  "诊断证据缺口",
];

export function manualActionPreflightPriorityEvidenceRows(preflight: ManualActionPreflightForUi | null, limit = 8) {
  if (!preflight?.evidence_snapshot_preview) return [];
  const priorityRank = new Map(manualActionPreflightPriorityEvidenceLabels.map((label, index) => [label, index]));
  const rows = buildManualActionDisplayEvidenceSnapshot({
    preflight,
    fallbackEvidenceSnapshot: [],
  });
  const seenLabels = new Set<string>();
  return rows
    .map((item, index) => ({ item, index, priority: priorityRank.get(item.label) }))
    .filter((entry): entry is { item: ManualActionEvidenceSnapshotForUi; index: number; priority: number } => entry.priority !== undefined)
    .sort((left, right) => left.priority - right.priority || left.index - right.index)
    .filter((entry) => {
      if (seenLabels.has(entry.item.label)) return false;
      seenLabels.add(entry.item.label);
      return true;
    })
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function manualConfirmationEvidenceReadinessSummary(
  manualEvidenceItems: ManualConfirmationEvidenceForUi[],
  preflightEvidenceRows: ManualActionEvidenceSnapshotForUi[],
): ManualConfirmationEvidenceReadinessSummary | null {
  if (manualEvidenceItems.length === 0) return null;
  const manualLabels = evidenceLabelSet(manualEvidenceItems);
  const snapshotLabels = evidenceLabelSet(preflightEvidenceRows);
  const hasPreflightSnapshot = preflightEvidenceRows.length > 0;
  const searchTermReviewChainLabels = [
    "Parent ASIN入口",
    "广告 ASIN承接",
    "投放词证据",
    "广告组合流判断",
    "同组投放商品表现",
    "逐投放上下文",
    "广告位边界",
    "ABA 背景",
    "证据缺口",
    "需要补证",
    "动作边界",
  ];
  const advertisedProductReviewChainLabels = ["广告商品覆盖", "广告组合流判断", "同组投放商品表现", "证据缺口", "需要补证", "动作边界"];
  const needsSearchTermReviewChain = searchTermReviewChainLabels.some(
    (label) => manualLabels.has(label) || snapshotLabels.has(label),
  );
  const needsAdvertisedProductReviewChain = manualLabels.has("广告商品覆盖") || snapshotLabels.has("广告商品覆盖");
  const checks = [
    {
      label: "业务判断",
      manual: ["业务问题", "当前判断"],
      snapshot: ["人工确认判断依据"],
      detail: "确认页面读到的业务问题和当前判断会进入点击时证据快照。",
    },
    {
      label: "证明边界",
      manual: ["能证明", "不能证明", "人工下一步"],
      snapshot: ["能证明的事实", "不能证明的边界", "人工下一步"],
      detail: "确认能证明、不能证明和人工下一步会被保留下来，避免复盘时只剩裸指标。",
    },
    ...(needsSearchTermReviewChain
      ? [
          {
            label: "广告搜索词表现复核链",
            manual: searchTermReviewChainLabels,
            snapshot: searchTermReviewChainLabels,
            detail:
              "确认搜索词进入人工确认前，Parent ASIN 入口、广告 ASIN 承接、投放词、广告组合流判断、同组投放商品表现、逐投放上下文、广告位边界、ABA、证据缺口、需要补证和动作边界会一起保存。",
          },
        ]
      : []),
    ...(needsAdvertisedProductReviewChain
      ? [
          {
            label: "广告商品复核链",
            manual: advertisedProductReviewChainLabels,
            snapshot: advertisedProductReviewChainLabels,
            detail: "确认广告商品进入人工确认前，广告商品覆盖、广告组合流判断、同组投放商品表现、证据缺口、需要补证和动作边界会一起保存。",
          },
        ]
      : []),
  ];

  const rows = checks.map<ManualConfirmationEvidenceReadinessRow>((check) => {
    const missingManual = missingEvidenceLabels(manualLabels, check.manual);
    const missingSnapshot = hasPreflightSnapshot ? missingEvidenceLabels(snapshotLabels, check.snapshot) : check.snapshot;
    const missingLabels = Array.from(new Set([...missingManual, ...missingSnapshot]));
    const ready = missingManual.length === 0 && missingSnapshot.length === 0;
    const waiting = !hasPreflightSnapshot;
    return {
      label: check.label,
      value: ready ? "已对齐" : waiting ? "等待只读预检" : `缺：${missingLabels.join(" / ")}`,
      detail: `${check.detail}${missingManual.length ? ` 页面缺少：${missingManual.join(" / ")}。` : ""}${
        missingSnapshot.length ? ` 快照缺少：${missingSnapshot.join(" / ")}。` : ""
      }`,
      tone: ready ? "ready" : waiting ? "waiting" : "blocked",
    };
  });
  const blockedCount = rows.filter((row) => row.tone === "blocked").length;
  const waitingCount = rows.filter((row) => row.tone === "waiting").length;
  const tone: ManualConfirmationEvidenceReadinessSummary["tone"] =
    blockedCount > 0 ? "blocked" : waitingCount > 0 ? "waiting" : "ready";
  const summary =
    tone === "ready"
      ? "页面证据依据已和将保存的 evidence_snapshot 对齐；人工点击后可以回看当时判断。"
      : tone === "waiting"
        ? "页面已生成证据依据，但还在等待后端只读预检返回将保存的 evidence_snapshot。"
        : "页面证据依据和将保存的 evidence_snapshot 不一致，不能把当前点击当成可复盘留痕。";

  return {
    title: "人工确认证据写入核对",
    tone,
    summary,
    rows,
    boundary:
      "这里只做点击前只读核对；未授权前不写 manual_actions，不生成 ReviewTodo，不保存 ReviewRecord，也不执行广告动作。",
  };
}

export function manualConfirmationDiagnosisBridgeSummary(
  diagnosisSummary: DiagnosisEvidenceSummaryForManualBridge | null,
  manualEvidenceItems: ManualConfirmationEvidenceForUi[],
  readinessSummary: ManualConfirmationEvidenceReadinessSummary | null,
): ManualConfirmationDiagnosisBridgeSummary | null {
  if (!diagnosisSummary) return null;
  const manualLabels = evidenceLabelSet(manualEvidenceItems);
  const readinessRows = readinessSummary?.rows ?? [];
  const businessQuestion = diagnosisSummary.businessQuestion?.trim() ?? "";
  const objectReadback = diagnosisSummary.objectReadback?.trim() ?? "";
  const proves = diagnosisSummary.proves?.trim() ?? "";
  const doesNotProve = diagnosisSummary.doesNotProve?.trim() ?? "";
  const evidenceGap = diagnosisSummary.evidenceGap?.trim() ?? "";
  const nextManualStep = diagnosisSummary.nextManualStep?.trim() ?? "";

  const businessTone = bridgeRowTone(
    Boolean(businessQuestion && objectReadback && manualLabels.has("业务问题") && manualLabels.has("当前判断")),
    readinessToneForLabel(readinessRows, "业务判断"),
  );
  const boundaryTone = bridgeRowTone(
    Boolean(
      proves &&
        doesNotProve &&
        nextManualStep &&
        manualLabels.has("能证明") &&
        manualLabels.has("不能证明") &&
        manualLabels.has("人工下一步"),
    ),
    readinessToneForLabel(readinessRows, "证明边界"),
  );
  const evidenceGapTone = evidenceGap
    ? bridgeRowTone(
        manualLabels.has("证据缺口"),
        readinessToneForLabel(readinessRows, "广告搜索词表现复核链") ??
          readinessToneForLabel(readinessRows, "搜索词复核链") ??
          readinessToneForLabel(readinessRows, "证明边界"),
      )
    : "ready";
  const snapshotTone = readinessSummary?.tone ?? "waiting";
  const rows: ManualConfirmationDiagnosisBridgeRow[] = [
    {
      label: "业务问题",
      value: bridgeRowValue(businessTone),
      detail: businessQuestion
        ? `中间诊断问题：${businessQuestion}；诊断对象：${objectReadback || "未读到对象回读"}。`
        : "中间诊断缺少业务问题，不能确认右侧人工留痕对应哪一个判断。",
      tone: businessTone,
    },
    {
      label: "证明边界",
      value: bridgeRowValue(boundaryTone),
      detail:
        proves && doesNotProve
          ? `能证明：${proves} 不能证明：${doesNotProve}`
          : "中间诊断缺少能证明或不能证明，人工点击前不能闭环。",
      tone: boundaryTone,
    },
    {
      label: "证据缺口",
      value: bridgeRowValue(evidenceGapTone),
      detail: evidenceGap ? `中间证据缺口：${evidenceGap}` : "中间诊断未声明额外证据缺口。",
      tone: evidenceGapTone,
    },
    {
      label: "点击快照",
      value: snapshotTone === "ready" ? "已进入 evidence_snapshot 核对" : snapshotTone === "waiting" ? "等待只读预检" : "快照核对阻断",
      detail: readinessSummary?.summary ?? "右侧证据依据已生成，但还没有后端只读预检返回将保存的 evidence_snapshot。",
      tone: snapshotTone,
    },
  ];
  const blockedCount = rows.filter((row) => row.tone === "blocked").length;
  const waitingCount = rows.filter((row) => row.tone === "waiting").length;
  const tone: ManualConfirmationDiagnosisBridgeSummary["tone"] =
    blockedCount > 0 ? "blocked" : waitingCount > 0 ? "waiting" : "ready";
  const summary =
    tone === "ready"
      ? "中间诊断、右侧证据依据和将保存的 evidence_snapshot 已贯通；人工点击后可回看业务问题、证明边界、证据缺口和下一步。"
      : tone === "waiting"
        ? "中间诊断和右侧证据依据已生成，但还在等待后端只读预检确认 evidence_snapshot。"
        : "中间诊断和人工留痕证据未贯通，当前不能把点击解释成可复盘闭环。";

  return {
    title: "诊断到人工留痕同步",
    tone,
    summary,
    rows,
    boundary:
      "该同步只核对读到的诊断是否能进入人工留痕；未授权前不写 manual_actions，不生成 ReviewTodo，不保存 ReviewRecord，也不执行广告动作。",
  };
}

export function manualActionButtonGate(
  actionType: ManualActionForUi["action_type"],
  preflight: ManualActionPreflightForUi | null,
  preflightError: string | null,
  hasReviewTodoForSelectedObject: boolean,
  expectedTarget?: ManualActionExpectedTargetForUi | null,
): ManualActionButtonGate {
  if (actionType === "add_to_review" && hasReviewTodoForSelectedObject) {
    return {
      disabled: true,
      reason: "已有 7 天 / 14 天复盘排程；等待完整窗口后再判断效果。",
      compactReason: "等待复盘窗口",
    };
  }
  if (preflightError) {
    return { disabled: true, reason: preflightError, compactReason: "预检失败" };
  }
  if (!preflight) {
    return {
      disabled: true,
      reason: "正在核对人工留痕对象和证据；读取完成前不写入人工动作。",
      compactReason: "核对准入",
    };
  }
  const blockers = preflight.blockers ?? [];
  if (preflight.status === "blocked" || blockers.length > 0) {
    return {
      disabled: true,
      reason: `人工留痕准入阻塞：${preflightBlockerText(blockers)}；不会写入人工动作。`,
      compactReason: "准入阻塞",
    };
  }
  if (preflight.will_write !== false) {
    return {
      disabled: true,
      reason: "人工留痕安全边界未确认；不会写入人工动作。",
      compactReason: "只读边界待核对",
    };
  }
  if (!normalizedPreflightTargetValue(expectedTarget?.objectType) || !normalizedPreflightTargetValue(expectedTarget?.objectId)) {
    return {
      disabled: true,
      reason: "当前信号对象身份待补充；缺少复盘对象类型或稳定对象时不写入人工动作。",
      compactReason: "对象身份待补充",
    };
  }
  if (manualActionPreflightTargetMismatch(preflight, expectedTarget)) {
    return {
      disabled: true,
      reason: "人工留痕目标与当前候选不一致；请等待准入核对刷新后再写入人工动作。",
      compactReason: "准入目标待刷新",
    };
  }
  const expectedActionType = normalizedPreflightTargetValue(expectedTarget?.actionType ?? actionType);
  const actualActionType = normalizedPreflightTargetValue(preflight.target?.action_type);
  if (expectedActionType && actualActionType && expectedActionType !== actualActionType) {
    return {
      disabled: true,
      reason: `准入动作与当前按钮不一致：准入为 ${manualActionReadbackLabel[actualActionType as ManualActionForUi["action_type"]] ?? actualActionType}，当前为 ${manualActionReadbackLabel[expectedActionType as ManualActionForUi["action_type"]] ?? expectedActionType}；不会写入人工动作。`,
      compactReason: "准入动作待刷新",
    };
  }
  if (!manualActionPreflightHasSavableEvidenceSnapshotPreview(preflight)) {
    return {
      disabled: true,
      reason: "准入核对未返回可保存的证据快照；不能用前端临时证据写入人工留痕。",
      compactReason: "证据快照待核对",
    };
  }
  return { disabled: false, reason: null, compactReason: null };
}

export function manualActionWriteGuardMessage(actionLabel: string, gate: ManualActionButtonGate) {
  if (!gate.disabled) return null;
  return `未保存：${actionLabel}；${gate.reason ?? "当前人工动作暂不可用。"}`;
}

const manualActionReadbackLabel: Record<ManualActionForUi["action_type"], string> = {
  add_to_review: "加入复盘",
  handled: "标记已处理",
  observe: "记录观察",
  ignore: "忽略本次",
};

const reviewWindowOrder: ReviewTodoForUi["review_window"][] = ["7d", "14d"];
const reviewTodoPendingEffectBoundaryText = "复盘待办只表示进入排程，未到期不判断效果";

function hasReviewMetricWindow(record: ReviewRecordForUi) {
  return Boolean(
    record.before_start_date &&
      record.before_end_date &&
      record.after_start_date &&
      record.after_end_date &&
      Object.keys(record.before_metrics ?? {}).length > 0 &&
      Object.keys(record.after_metrics ?? {}).length > 0,
  );
}

function hasReviewRecordEvidenceSnapshot(record: ReviewRecordForUi) {
  return (
    reviewRecordHasEvidenceSnapshot(record) &&
    reviewRecordHasObjectReference(record) &&
    reviewRecordHasSnapshotLabel(record, "排查路径") &&
    reviewRecordHasSnapshotLabel(record, "AI 准入") &&
    reviewRecordHasSnapshotLabel(record, "搜索词边界") &&
    reviewRecordHasSnapshotLabel(record, "广告位边界")
  );
}

function reviewRecordMatchesExpectation(record: ReviewRecordForUi, expectation: ReviewRecordReadbackExpectation) {
  const actionMatches = !expectation.actionId || record.action_id === expectation.actionId;
  const objectTypeMatches = !expectation.objectType || record.object_type === expectation.objectType;
  const objectIdMatches = !expectation.objectId || record.object_id === expectation.objectId;
  const windowMatches = !expectation.reviewWindow || record.review_window === expectation.reviewWindow;
  return actionMatches && objectTypeMatches && objectIdMatches && windowMatches && hasReviewMetricWindow(record) && hasReviewRecordEvidenceSnapshot(record);
}

export function reviewRecordReadbackStatus(records: ReviewRecordForUi[], expectation: ReviewRecordReadbackExpectation | null = null) {
  if (records.length === 0) return "尚未保存复盘结论";
  const evidenceReadback = reviewRecordEvidenceSnapshotReadbackText(records);
  if (expectation) {
    const matchedRecord = records.find((record) => reviewRecordMatchesExpectation(record, expectation));
    if (matchedRecord) {
      const windowText = expectation.reviewWindow ? `${reviewWindowLabel[expectation.reviewWindow]}窗口` : "复盘窗口";
      const matchedEvidenceReadback = reviewRecordEvidenceSnapshotReadbackText([matchedRecord]);
      return `已读回匹配复盘记录：action_id / object_id / ${windowText} / 指标窗口 / 证据快照一致；${matchedEvidenceReadback}`;
    }
    return `复盘记录待读回核对：已读回 ${records.length} 条，但未命中 action_id / object_id / review_window / 指标窗口 / 证据快照；${
      evidenceReadback ?? "复盘证据快照待核对"
    }。`;
  }
  return `已有复盘记录 ${records.length} 条；${evidenceReadback}`;
}

export function hasReviewRecordReadbackMatch(
  records: ReviewRecordForUi[],
  expectation: ReviewRecordReadbackExpectation | null = null,
) {
  if (!expectation) return false;
  return records.some((record) => reviewRecordMatchesExpectation(record, expectation));
}

export function buildReviewRecordReadbackExpectation(
  action: ManualActionForUi | null,
  todo: ReviewTodoForUi | null,
): ReviewRecordReadbackExpectation | null {
  const actionId = String(todo?.action_id ?? action?.id ?? "").trim();
  const objectType = String(todo?.object_type ?? action?.object_type ?? "").trim();
  const objectId = String(todo?.object_id ?? action?.object_id ?? "").trim();
  const reviewWindow = todo?.review_window ?? null;
  if (!actionId && !objectType && !objectId && !reviewWindow) return null;
  return { actionId: actionId || null, objectType: objectType || null, objectId: objectId || null, reviewWindow };
}

function readbackReviewWindows(todos: ReviewTodoForUi[]) {
  return reviewWindowOrder.filter((window) => todos.some((todo) => todo.review_window === window));
}

function reviewRecordEvidenceSnapshotCount(record: ReviewRecordForUi | null | undefined) {
  return (record?.evidence_snapshot ?? []).filter(
    (item) => String(item.label ?? "").trim() !== "" && String(item.value ?? "").trim() !== "",
  ).length;
}

function reviewRecordHasEvidenceSnapshot(record: ReviewRecordForUi | null | undefined) {
  return reviewRecordEvidenceSnapshotCount(record) > 0;
}

function reviewRecordHasSnapshotLabel(record: ReviewRecordForUi | null | undefined, expectedLabel: string) {
  return (record?.evidence_snapshot ?? []).some(
    (item) => String(item.label ?? "").trim() === expectedLabel && String(item.value ?? "").trim() !== "",
  );
}

function reviewRecordHasSearchIntentContext(record: ReviewRecordForUi | null | undefined) {
  return Boolean(
    record?.review_context?.search_intent_label ||
      reviewRecordHasSnapshotLabel(record, "搜索意图分组") ||
      reviewRecordHasSnapshotLabel(record, "语义组") ||
      reviewRecordHasSnapshotLabel(record, "Parent ASIN 广告搜索词表现复核") ||
      reviewRecordHasSnapshotLabel(record, "Parent ASIN 搜索词表现聚合") ||
      reviewRecordHasSnapshotLabel(record, "广告搜索词聚合上下文"),
  );
}

function reviewRecordObjectReferenceTerms(record: ReviewRecordForUi | null | undefined) {
  const terms: string[] = [];
  for (const value of [record?.object_id, record?.object_label]) {
    const text = String(value ?? "").trim();
    if (!text) continue;
    terms.push(text);
    if (text.includes(":")) {
      const tail = text.split(":").pop()?.trim();
      if (tail) terms.push(tail);
    }
  }
  return Array.from(new Set(terms));
}

function reviewRecordEvidenceSnapshotTextForObjectReference(record: ReviewRecordForUi | null | undefined) {
  return (record?.evidence_snapshot ?? [])
    .map((item) => [item.label, item.value, item.detail, item.source].map((value) => String(value ?? "").trim()).filter(Boolean).join(" "))
    .join(" ")
    .toLocaleLowerCase();
}

function reviewRecordHasObjectReference(record: ReviewRecordForUi | null | undefined) {
  if (!record || !reviewRecordHasEvidenceSnapshot(record)) return false;
  const terms = reviewRecordObjectReferenceTerms(record);
  if (terms.length === 0) return false;
  const snapshotText = reviewRecordEvidenceSnapshotTextForObjectReference(record);
  return terms.some((term) => snapshotText.includes(term.toLocaleLowerCase()));
}

function reviewRecordEvidenceSnapshotReadbackText(records: ReviewRecordForUi[]) {
  if (records.length === 0) return null;
  const countText = records
    .map((record) => `${record.review_window ?? "复盘"} ${reviewRecordEvidenceSnapshotCount(record)} 条`)
    .join(" / ");
  const missingParts = records.flatMap((record) => {
    const window = record.review_window ?? "复盘";
    const objectType = normalizedPreflightTargetValue(record.object_type);
    const requiredSnapshotLabels =
      objectType === "search_term"
        ? [
            "排查路径",
            "AI 准入",
            "Parent ASIN 广告搜索词表现复核",
            "搜索词表现判断",
            "广告组合流判断",
            "同组投放商品表现",
            "逐投放上下文",
            "投放词证据",
            "搜索词边界",
            "广告位边界",
            "ABA 背景",
          ]
        : ["排查路径", "AI 准入", "搜索词边界", "广告位边界"];
    const missing = [
      reviewRecordHasEvidenceSnapshot(record) ? "" : "证据快照",
      reviewRecordHasObjectReference(record) ? "" : "对象引用",
      ...requiredSnapshotLabels.map((label) =>
        label === "Parent ASIN 广告搜索词表现复核"
          ? reviewRecordHasSearchIntentContext(record)
            ? ""
            : label
          : reviewRecordHasSnapshotLabel(record, label)
            ? ""
            : label,
      ),
    ].filter(Boolean);
    return missing.length > 0 ? [`${window} 缺${missing.join(" / ")}`] : [];
  });

  if (missingParts.length > 0) {
    return `复盘证据快照待核对：${countText}；缺口：${missingParts.join("；")}`;
  }
  const readbackLabels =
    records.length === 1 && normalizedPreflightTargetValue(records[0]?.object_type) === "search_term"
      ? "对象引用 / 排查路径 / AI 准入 / Parent ASIN 广告搜索词表现复核 / 搜索词表现判断 / 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 投放词证据 / 搜索词边界 / 广告位边界 / ABA 背景"
      : "对象引用 / 排查路径 / AI 准入 / 搜索词边界 / 广告位边界";
  const contextText = records.length === 1 ? reviewContextText(records[0]) : null;
  const contextSuffix = contextText ? `；复盘上下文：${contextText}` : "";
  return `复盘证据快照：${countText}；可回看${readbackLabels}${contextSuffix}`;
}

function reviewTodoEvidenceSnapshotCount(todo: ReviewTodoForUi | null | undefined) {
  return (todo?.evidence_snapshot ?? []).filter(
    (item) => String(item.label ?? "").trim() !== "" && String(item.value ?? "").trim() !== "",
  ).length;
}

function reviewTodoEvidenceSnapshotReadbackText(todos: ReviewTodoForUi[]) {
  const windowTodos = reviewWindowOrder
    .map((window) => todos.find((todo) => todo.review_window === window))
    .filter((todo): todo is ReviewTodoForUi => Boolean(todo));
  if (windowTodos.length === 0) return null;

  const countText = windowTodos
    .map((todo) => `${todo.review_window} ${reviewTodoEvidenceSnapshotCount(todo)} 条`)
    .join(" / ");
  const missingParts = windowTodos.flatMap((todo) => {
    const objectType = normalizedPreflightTargetValue(todo.object_type);
    const requiredSnapshotLabels =
      objectType === "search_term"
        ? [
            "Parent ASIN 广告搜索词表现复核",
            "搜索词表现判断",
            "广告组合流判断",
            "同组投放商品表现",
            "逐投放上下文",
            "投放词证据",
            "搜索词边界",
            "广告位边界",
            "ABA 背景",
          ]
        : ["搜索词边界", "广告位边界"];
    const missing = [
      reviewTodoHasEvidenceSnapshot(todo) ? "" : "证据快照",
      reviewTodoHasObjectReference(todo, null) ? "" : "对象引用",
      reviewTodoHasDiagnosisPath(todo) ? "" : "排查路径",
      reviewTodoHasAiAdmission(todo) ? "" : "AI 准入",
      ...requiredSnapshotLabels.map((label) =>
        label === "Parent ASIN 广告搜索词表现复核"
          ? reviewTodoHasSearchIntentContext(todo)
            ? ""
            : label
          : reviewTodoHasSnapshotLabel(todo, label)
            ? ""
            : label,
      ),
    ].filter(Boolean);
    return missing.length > 0 ? [`${todo.review_window} 缺${missing.join(" / ")}`] : [];
  });

  if (missingParts.length > 0) {
    return `待办证据快照待核对：${countText}；可回看对象引用 / 排查路径 / AI 准入 / 搜索词边界 / 广告位边界；缺口：${missingParts.join("；")}`;
  }
  const objectText =
    windowTodos.length === 1
      ? reviewObjectIdentityDisplayText(windowTodos[0].object_type, windowTodos[0].object_id, windowTodos[0].object_label)
      : "";
  const objectSuffix = objectText ? `；复盘对象：${objectText}` : "";
  const readbackLabels =
    windowTodos.some((todo) => normalizedPreflightTargetValue(todo.object_type) === "search_term")
      ? "对象引用 / 排查路径 / AI 准入 / Parent ASIN 广告搜索词表现复核 / 搜索词表现判断 / 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 投放词证据 / 搜索词边界 / 广告位边界 / ABA 背景"
      : "对象引用 / 排查路径 / AI 准入 / 搜索词边界 / 广告位边界";
  return `待办证据快照：${countText}${objectSuffix}；可回看${readbackLabels}`;
}

function compactIdentityParts(parts: Array<string | null | undefined>) {
  return parts.map((part) => String(part ?? "").trim()).filter(Boolean).join("；");
}

function identityIssueTexts(
  expected: {
    signalId?: string | null;
    objectType?: string | null;
    objectId?: string | null;
    objectIds?: string[] | null;
    marketId?: number | null;
  },
  actual: { signalId?: string | null; objectType?: string | null; objectId?: string | null; marketId?: number | null },
) {
  const issues: string[] = [];
  const expectedSignalId = String(expected.signalId ?? "").trim();
  const actualSignalId = String(actual.signalId ?? "").trim();
  if (expectedSignalId && actualSignalId && expectedSignalId !== actualSignalId) issues.push("signal_id 不一致");

  const expectedObjectType = String(expected.objectType ?? "").trim();
  const actualObjectType = String(actual.objectType ?? "").trim();
  if (expectedObjectType && actualObjectType && expectedObjectType !== actualObjectType) issues.push("object_type 不一致");

  const expectedObjectId = String(expected.objectId ?? "").trim();
  const actualObjectId = String(actual.objectId ?? "").trim();
  const expectedObjectIds = uniqueStableObjectIds([expectedObjectId, ...(expected.objectIds ?? [])]);
  if (expectedObjectIds.length > 0 && actualObjectId && !expectedObjectIds.includes(actualObjectId)) issues.push("object_id 不一致");

  if (expected.marketId != null && actual.marketId != null && expected.marketId !== actual.marketId) issues.push("market_id 不一致");
  return issues;
}

export function buildManualActionIdentityGateItems(input: ManualActionIdentityGateInput): ManualActionIdentityGateItem[] {
  const stableObject = reviewSignalStableObjectForReviewRecord(input.signal);
  const expectedIdentity = {
    signalId: input.signal?.id ?? null,
    objectType: stableObject.objectType ?? input.signal?.object_type ?? null,
    objectId: stableObject.objectId ?? null,
    objectIds: reviewSignalStableObjectIdCandidates(input.signal),
    marketId: input.signal?.market_id ?? input.fallbackMarketId ?? null,
  };
  const signalObjectLabel =
    input.signal?.evidence?.primary_object?.search_term ??
    input.signal?.evidence?.primary_object?.label ??
    input.signal?.evidence?.primary_object?.object_id ??
    null;
  const signalDetail = compactIdentityParts([
    input.signal?.shop_id ? `shop_id ${input.signal.shop_id}` : null,
    expectedIdentity.marketId != null ? `market_id ${expectedIdentity.marketId}` : null,
    expectedIdentity.objectType && expectedIdentity.objectId
      ? reviewObjectIdentityDisplayText(expectedIdentity.objectType, expectedIdentity.objectId, signalObjectLabel)
      : null,
  ]);

  const target = input.preflight?.target ?? null;
  const preflightIssues = identityIssueTexts(expectedIdentity, {
    signalId: target?.signal_id,
    objectType: target?.object_type,
    objectId: target?.object_id,
    marketId: target?.market_id ?? input.preflight?.selected_market_id ?? null,
  });
  const preflightTargetText = compactIdentityParts([
    target?.signal_id ? `signal_id ${target.signal_id}` : null,
    target?.object_type && target?.object_id ? reviewObjectIdentityDisplayText(target.object_type, target.object_id, target.object_label) : null,
    target?.market_id != null ? `market_id ${target.market_id}` : input.preflight?.selected_market_id != null ? `market_id ${input.preflight.selected_market_id}` : null,
    `will_write=${String(input.preflight?.will_write ?? false)}`,
  ]);

  const action = input.latestManualAction;
  const actionIssues = identityIssueTexts(expectedIdentity, {
    signalId: action?.signal_id,
    objectType: action?.object_type,
    objectId: action?.object_id,
    marketId: action?.market_id ?? null,
  });
  const actionDetail = compactIdentityParts([
    action?.id ? `action_id ${action.id}` : null,
    action?.signal_id ? `signal_id ${action.signal_id}` : null,
    action?.object_type && action?.object_id ? reviewObjectIdentityDisplayText(action.object_type, action.object_id, action.object_label) : null,
    action?.market_id != null ? `market_id ${action.market_id}` : null,
    actionIssues.length > 0 ? actionIssues.join("；") : null,
  ]);

  const todo = input.nextReviewTodo;
  const todoIssues = identityIssueTexts(expectedIdentity, {
    signalId: todo?.signal_id,
    objectType: todo?.object_type,
    objectId: todo?.object_id,
    marketId: todo?.market_id ?? null,
  });
  const todoEvidenceReadback = todo ? reviewTodoEvidenceSnapshotReadbackText([todo]) : null;
  const todoDetail = compactIdentityParts([
    todo?.action_id ? `action_id ${todo.action_id}` : null,
    todo?.signal_id ? `signal_id ${todo.signal_id}` : null,
    todo?.object_type && todo?.object_id ? reviewObjectIdentityDisplayText(todo.object_type, todo.object_id, todo.object_label) : null,
    todo?.market_id != null ? `market_id ${todo.market_id}` : null,
    todoEvidenceReadback,
    todoIssues.length > 0 ? todoIssues.join("；") : null,
  ]);

  return [
    {
      label: "当前信号",
      value: expectedIdentity.signalId || "未选择",
      detail: signalDetail || "未选择信号时不允许写入人工动作。",
      tone: expectedIdentity.signalId ? "ready" : "blocked",
    },
    {
      label: "预检目标",
      value: !input.preflight ? "未读取" : preflightIssues.length > 0 ? "待核对" : "身份一致",
      detail: input.preflight
        ? `${preflightTargetText || "预检目标待补充"}${preflightIssues.length > 0 ? `；${preflightIssues.join("；")}` : ""}`
        : "后端只读预检未返回前，不写入人工动作。",
      tone: !input.preflight ? "waiting" : preflightIssues.length > 0 ? "blocked" : "ready",
    },
    {
      label: "留痕读回",
      value: !action ? "未读回" : actionIssues.length > 0 ? "待核对" : "已读回",
      detail: action ? actionDetail || "已读回人工留痕，但对象字段待补充。" : "人工点击后应读回同一 signal_id / object_id / market_id。",
      tone: !action ? "waiting" : actionIssues.length > 0 ? "blocked" : "ready",
    },
    {
      label: "复盘待办",
      value: !todo ? "未生成" : todoIssues.length > 0 ? "待核对" : `${todo.review_window} 已读回`,
      detail: todo ? todoDetail || "已读回复盘待办，但对象字段待补充。" : "复盘类动作应生成同一对象的 7d / 14d 待办。",
      tone: !todo ? "waiting" : todoIssues.length > 0 ? "blocked" : "ready",
    },
  ];
}

export function buildManualActionReadbackPathItems(input: ManualActionReadbackPathInput): ManualActionReadbackPathItem[] {
  const action = input.latestManualAction;
  const windows = readbackReviewWindows(input.reviewTodos);
  const windowText = windows.length > 0 ? windows.join(" / ") : "无待办";
  const reviewRecordCount = input.reviewRecords.length;
  const evidenceCount = numberOrZero(action?.evidence_snapshot?.length);

  if (!action) {
    return [
      {
        label: "留痕读回",
        value: "未触发",
        detail: "尚未产生人工留痕；此时不应出现广告动作、复盘待办或复盘结论。",
        tone: "empty",
      },
      {
        label: "待办读回",
        value: "无待办",
        detail: "未触发人工动作前，不生成 7/14 天复盘排程。",
        tone: "empty",
      },
      {
        label: "复盘结论",
        value: "未保存",
        detail: "没有人工留痕和完整复盘窗口，不能保存 review_records。",
        tone: "empty",
      },
    ];
  }

  const actionLabel = manualActionReadbackLabel[action.action_type];
  const isIgnoreAction = action.action_type === "ignore";
  const todoValue = isIgnoreAction ? (input.reviewTodos.length === 0 ? "0 条" : `${input.reviewTodos.length} 条待核对`) : windowText;
  const todoEvidenceReadback = reviewTodoEvidenceSnapshotReadbackText(input.reviewTodos);
  const todoWindowsComplete = windows.length === reviewWindowOrder.length;
  const todoEvidenceComplete = !todoEvidenceReadback?.includes("待核对");
  const todoComplete = isIgnoreAction ? input.reviewTodos.length === 0 : todoWindowsComplete && todoEvidenceComplete;
  const reviewRecordEvidenceReadback = reviewRecordEvidenceSnapshotReadbackText(input.reviewRecords);

  return [
    {
      label: "留痕读回",
      value: "已读回",
      detail: `${actionLabel}已读回；证据快照 ${evidenceCount} 条，只证明人工判断依据已留存，不代表广告动作已执行。`,
      tone: "ready",
    },
    {
      label: "待办读回",
      value: todoValue,
      detail: isIgnoreAction
        ? todoComplete
          ? "忽略本次不生成 7/14 天排程，符合预期；这不代表误报或删除信号。"
          : "忽略本次应为 0 条待办，需核对对象范围。"
        : todoWindowsComplete && todoEvidenceComplete
          ? `${todoEvidenceReadback ?? "7/14 天待办已读回"}；只表示进入排程，未到期不判断效果。`
          : todoWindowsComplete
            ? `${todoEvidenceReadback ?? "7/14 天待办证据待核对"}；缺口未补齐前不能保存结论，未到期不判断效果。`
          : `${todoEvidenceReadback ?? "复盘类动作应读回 7d / 14d"}；缺口未补齐前不能保存结论，未到期不判断效果。`,
      tone: todoComplete ? "ready" : "blocked",
    },
    {
      label: "复盘结论",
      value: reviewRecordCount > 0 ? "已保存" : "未保存结论",
      detail:
        reviewRecordCount > 0
          ? `已读回 ${reviewRecordCount} 条复盘结论；${reviewRecordEvidenceReadback ?? "复盘证据快照待核对"}；只作为规则解释反馈，不自动执行广告动作。`
          : "未到 7/14 天完整窗口前不保存 review_records，不判断广告效果。",
      tone: reviewRecordCount > 0 ? "saved" : "waiting",
    },
  ];
}

export function manualActionReadbackConsistencyText(
  action: ManualActionForUi | null,
  reviewTodosForSelectedObject: ReviewTodoForUi[],
  reviewRecordsForSelectedObject: ReviewRecordForUi[],
  reviewRecordExpectation: ReviewRecordReadbackExpectation | null = null,
) {
  if (!action) {
    return "点击后读回：暂无人工留痕；复盘类应读回 7d / 14d，忽略应读回 0 条。";
  }
  const actionLabel = manualActionReadbackLabel[action.action_type];
  if (action.action_type === "ignore") {
    if (reviewTodosForSelectedObject.length === 0) {
      return `点击后读回一致：${actionLabel}已读回留痕，当前 0 条待办，${reviewRecordReadbackStatus(reviewRecordsForSelectedObject)}。`;
    }
    return `点击后读回待核对：${actionLabel}应为 0 条，当前读回 ${reviewTodosForSelectedObject.length} 条。`;
  }

  const windows = readbackReviewWindows(reviewTodosForSelectedObject);
  const todoEvidenceReadback = reviewTodoEvidenceSnapshotReadbackText(reviewTodosForSelectedObject);
  if (windows.length === reviewWindowOrder.length) {
    if (todoEvidenceReadback?.includes("待核对")) {
      return `点击后读回待核对：${actionLabel}已读回留痕 + 7d / 14d，${todoEvidenceReadback}，缺口未补齐前不能保存结论，尚未保存复盘结论。`;
    }
    const pendingEffectBoundary = reviewRecordsForSelectedObject.length === 0 ? `${reviewTodoPendingEffectBoundaryText}，` : "";
    const todoEvidenceSegment = todoEvidenceReadback ? `${todoEvidenceReadback}，` : "";
    return `点击后读回一致：${actionLabel}已读回留痕 + 7d / 14d，${todoEvidenceSegment}${pendingEffectBoundary}${reviewRecordReadbackStatus(
      reviewRecordsForSelectedObject,
      reviewRecordExpectation,
    )}。`;
  }
  const currentWindowsText = windows.length > 0 ? windows.join(" / ") : "0 条";
  return `点击后读回待核对：${actionLabel}只读回 ${currentWindowsText}，应补齐 7d / 14d。`;
}

export function manualActionPostWriteReadbackMessage(
  action: ManualActionForUi,
  reviewTodosForSelectedObject: ReviewTodoForUi[],
  reviewRecordsForSelectedObject: ReviewRecordForUi[] = [],
  postWritePreflight: ManualActionPreflightForUi | null = null,
  postWritePreflightError: string | null = null,
) {
  const readbackText = manualActionReadbackConsistencyText(
    action,
    reviewTodosForSelectedObject,
    reviewRecordsForSelectedObject,
  );
  if (!postWritePreflight && !postWritePreflightError) {
    return `已记录：${manualActionReadbackLabel[action.action_type]}；${readbackText}`;
  }
  const readbackPrefix = `已记录：${manualActionReadbackLabel[action.action_type]}；${trimFinalPunctuation(readbackText)}`;
  if (postWritePreflightError) {
    return `${readbackPrefix}；${trimFinalPunctuation(postWritePreflightError)}。`;
  }
  const postWriteSummary = manualActionPostWriteReadbackSummary(
    action,
    reviewTodosForSelectedObject,
    reviewRecordsForSelectedObject,
    postWritePreflight,
  );
  return `已记录：${manualActionReadbackLabel[action.action_type]}；${trimFinalPunctuation(
    readbackText,
  )}；${postWriteSummary}；${trimFinalPunctuation(manualActionPreflightStatusText(postWritePreflight))}。`;
}

function manualActionPostWriteReadbackSummary(
  action: ManualActionForUi,
  reviewTodosForSelectedObject: ReviewTodoForUi[],
  reviewRecordsForSelectedObject: ReviewRecordForUi[],
  postWritePreflight: ManualActionPreflightForUi | null,
) {
  const objectText = manualActionReviewTargetDisplayText({
    object_type: postWritePreflight?.target?.object_type || action.object_type,
    object_id: postWritePreflight?.target?.object_id || action.object_id || action.object_label,
    object_label: postWritePreflight?.target?.object_label || action.object_label,
  });
  const snapshotCount = action.evidence_snapshot?.length ?? 0;
  const windows = readbackReviewWindows(reviewTodosForSelectedObject);
  const windowText = windows.length > 0 ? reviewWindowsDisplayText(windows) : "0 条";
  const todoEvidenceReadback = reviewTodoEvidenceSnapshotReadbackText(reviewTodosForSelectedObject);
  const reviewRecordCount =
    postWritePreflight?.current_counts?.target_review_record_count ?? reviewRecordsForSelectedObject.length;
  const reviewTodoBoundaryText =
    windows.length > 0 && numberOrZero(reviewRecordCount) === 0 ? "（只表示进入排程，未到期不判断效果）" : "";
  const forbiddenText = postWritePreflight?.forbidden_effects?.some((effect) => effect.includes("不执行广告动作"))
    ? "不执行广告动作"
    : "禁止副作用需继续核对";
  const todoEvidenceSegment = todoEvidenceReadback ? `，${todoEvidenceReadback}` : "";
  return `${objectText} 写后读回：证据快照 ${snapshotCount} 条，复盘排程 ${windowText}${reviewTodoBoundaryText}${todoEvidenceSegment}，复盘结论 ${reviewRecordCount} 条，${forbiddenText}`;
}

export function manualActionReadbackCompactText(
  action: ManualActionForUi | null,
  reviewTodosForSelectedObject: ReviewTodoForUi[],
  reviewRecordsForSelectedObject: ReviewRecordForUi[],
) {
  const hasReadableReviewRecordEvidence =
    reviewRecordsForSelectedObject.length > 0 && reviewRecordsForSelectedObject.every((record) => hasReviewRecordEvidenceSnapshot(record));
  const recordText =
    reviewRecordsForSelectedObject.length > 0
      ? `复盘记录 ${reviewRecordsForSelectedObject.length}${hasReadableReviewRecordEvidence ? "（证据可回看）" : "（证据待核对）"}`
      : "未存结论";
  if (!action) return "预期：复盘类 7d/14d 待办（排程），忽略 0；读回：暂无留痕";
  if (action.action_type === "ignore") {
    if (reviewTodosForSelectedObject.length === 0) return `预期：忽略 0；读回一致：0 条待办，${recordText}（不代表误报）`;
    return `预期：忽略 0；待读回核对：${reviewTodosForSelectedObject.length} 条待办`;
  }

  const windows = readbackReviewWindows(reviewTodosForSelectedObject);
  if (windows.length === reviewWindowOrder.length) {
    const todoBoundary = reviewRecordsForSelectedObject.length > 0 ? "" : "（仅排程）";
    return `预期：复盘类 7d/14d 待办；读回一致：留痕 + 7d/14d待办${todoBoundary}，${recordText}`;
  }
  const currentWindowsText = windows.length > 0 ? windows.join(" / ") : "0";
  return `预期：复盘类 7d/14d 待办；待读回补齐：${currentWindowsText}`;
}

export function reviewApplicabilityBoundaryText(signal: ReviewApplicabilityForUi | null) {
  if (!signal) return null;
  if (signal.signal_category === "data_quality" || signal.object_type === "cross") {
    return "该信号属于数据质量或交叉对象，只适合留痕或复查数据是否补齐，不进入广告指标前后对比。";
  }
  if (["search_term", "advertised_product", "sales_product", "placement", "ad_group"].includes(signal.object_type ?? "")) {
    return "该对象可进入广告指标复盘：记录人工动作后，等待处理前后完整 7/14 天快照再判断效果。";
  }
  return "该对象暂不支持广告指标复盘；可先记录观察，后续补齐对象口径。";
}

function formatReviewMetric(value: number | null | undefined, options: { percent?: boolean; integer?: boolean }) {
  if (value == null) return "-";
  if (options.percent) return `${(value * 100).toFixed(1)}%`;
  if (options.integer) return String(Math.round(value));
  return value.toFixed(2);
}

function numberOrZero(value: number | null | undefined) {
  return value ?? 0;
}

function evidenceLabelSet(items: Array<{ label?: string | null }>) {
  return new Set(
    items
      .map((item) => canonicalEvidenceLabel(item.label))
      .filter((label): label is string => Boolean(label)),
  );
}

function canonicalEvidenceLabel(label: string | null | undefined) {
  const trimmed = label?.trim();
  if (!trimmed) return "";
  if (trimmed === "Parent ASIN 入口") return "Parent ASIN入口";
  if (trimmed === "广告 ASIN 承接") return "广告 ASIN承接";
  return trimmed;
}

function missingEvidenceLabels(labels: Set<string>, requiredLabels: string[]) {
  return requiredLabels.filter((label) => !labels.has(label));
}

function compareReviewWindowEvidenceCounts(
  left: ManualActionPostWriteEvidenceSnapshotCountForUi,
  right: ManualActionPostWriteEvidenceSnapshotCountForUi,
) {
  const order: Record<string, number> = { "7d": 1, "14d": 2 };
  return (order[left.review_window ?? ""] ?? 99) - (order[right.review_window ?? ""] ?? 99);
}

function trimFinalPunctuation(value: string) {
  return value.replace(/[。.]$/, "");
}

function readinessToneForLabel(rows: ManualConfirmationEvidenceReadinessRow[], label: string) {
  return rows.find((row) => row.label === label)?.tone ?? null;
}

function bridgeRowTone(hasPageEvidence: boolean, snapshotTone: "ready" | "waiting" | "blocked" | null) {
  if (!hasPageEvidence) return "blocked";
  return snapshotTone ?? "waiting";
}

function bridgeRowValue(tone: "ready" | "waiting" | "blocked") {
  if (tone === "ready") return "已贯通";
  if (tone === "waiting") return "等待快照核对";
  return "未贯通";
}

function preflightBlockerText(blockers: NonNullable<ManualActionPreflightForUi["blockers"]>) {
  return blockers.map((blocker) => blocker.message || blocker.code).filter(Boolean).join("；") || "存在阻塞项";
}

function manualActionPreflightTargetMismatch(
  preflight: ManualActionPreflightForUi,
  expectedTarget?: ManualActionExpectedTargetForUi | null,
) {
  const expectedObjectType = normalizedPreflightTargetValue(expectedTarget?.objectType);
  const expectedObjectId = normalizedPreflightTargetValue(expectedTarget?.objectId);
  if (!expectedObjectType && !expectedObjectId) return false;

  const actualObjectType = normalizedPreflightTargetValue(preflight.target?.object_type);
  const actualObjectId = normalizedPreflightTargetValue(preflight.target?.object_id);
  return actualObjectType !== expectedObjectType || actualObjectId !== expectedObjectId;
}

function manualActionPreflightHasSavableEvidenceSnapshotPreview(preflight: ManualActionPreflightForUi) {
  const preview = preflight.evidence_snapshot_preview;
  return Boolean(
    preview &&
      preview.will_save_on_authorized_write !== false &&
      (preview.items?.length ?? 0) > 0,
  );
}

function normalizedPreflightTargetValue(value: string | number | null | undefined) {
  return value == null ? "" : String(value).trim();
}

function reviewEffectWindowRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return "待补齐";
  return `${startDate} 至 ${endDate}`;
}
