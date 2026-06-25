export interface SignalForUi {
  id: string;
  signal_type: "anomaly" | "opportunity";
  signal_category: string;
  market_id?: number | null;
  object_type?: "ad_group" | "sales_product" | "advertised_product" | "search_term" | "placement" | "search_intent" | "cross";
  severity: number;
  status: "pending" | "adopted" | "observing" | "ignored" | "false_positive";
  freshness_status: "api_snapshot" | "sample_data" | "unknown" | "stale";
  review_result?: string | null;
}

export type SignalQueueKind = "spend_waste" | "opportunity_expansion" | "structure_boundary" | "data_quality" | "review";
export type SignalStatusOverrideMap = Record<string, SignalForUi["status"]>;

const signalQueueKindLabels: Record<SignalQueueKind, string> = {
  spend_waste: "花费浪费",
  opportunity_expansion: "机会扩量",
  structure_boundary: "投放结构",
  data_quality: "数据质量",
  review: "复盘",
};

export interface SignalTriageRationale {
  queueKind: SignalQueueKind;
  queueLabel: string;
  queueReason: string;
  priorityReason: string;
  statusReason: string;
  reviewBoundary: string;
  reviewRuleFeedback: string;
}

export interface SignalTriggerRationale {
  objectRule: string;
  triggerRule: string;
  evidenceRule: string;
  confidenceBoundary: string;
  actionBoundary: string;
}

export interface PrimaryObjectForUi {
  object_type?: SignalForUi["object_type"];
  object_id?: string | null;
  label: string;
  campaign_name?: string | null;
  ad_group_name?: string | null;
  asin?: string | null;
  parent_asin?: string | null;
  sku?: string | null;
  msku?: string | null;
  placement?: string | null;
  search_term?: string | null;
  intent_label?: string | null;
}

export interface SignalObjectContextItem {
  label: string;
  value: string;
}

export interface SignalObjectReviewPath {
  label: string;
  value: string;
  detail: string;
}

export interface SignalObjectContext {
  boundary: string;
  items: SignalObjectContextItem[];
  reviewPath?: SignalObjectReviewPath | null;
}

export interface SignalDiagnosticScope {
  label: string;
  boundary: string;
}

export type SignalQueueScopeTone = "product" | "unattributed" | "data_quality" | "container";

export interface SignalQueueScopeBadge {
  label: string;
  tone: SignalQueueScopeTone;
}

export interface SignalQueueMetaInput extends SignalForUi {
  confidence?: "high" | "medium" | "low";
  shop_id?: string | null;
  shop_name?: string | null;
  marketplace?: string | null;
}

export interface SignalQueueMeta {
  primary: string[];
  secondary: string;
  decision: string;
}

export interface SelectedSignalScopeContext {
  title: string;
  statusLabel: string;
  scopeLabel: string;
  signalObject: string;
  relation: string;
  boundary: string;
  tone: SignalQueueScopeTone;
}

export interface SearchIntentFocusContext {
  title: string;
  focusLabel: string;
  signalObject: string;
  pathItems: { label: string; value: string }[];
  relation: string;
  boundary: string;
  tone: SignalQueueScopeTone;
}

export interface SearchIntentEntryLockSummary {
  title: string;
  rows: { label: string; value: string; detail: string }[];
  boundary: string;
}

export type SearchIntentSelectedTermReasonTone = "ready" | "warning" | "waiting";

export interface SearchIntentSelectedTermReasonSummary {
  title: string;
  tone: SearchIntentSelectedTermReasonTone;
  rows: { label: string; value: string; detail: string }[];
  executionSteps: { label: string; value: string; detail: string }[];
  boundary: string;
}

export interface SignalQueueObjectStatusTodo {
  object_id?: string | null;
  review_window?: string | null;
}

export interface SignalQueueObjectStatus {
  items: string[];
}

export interface SignalOverview {
  high: number;
  anomaly: number;
  opportunity: number;
  dataQuality: number;
  stale: number;
  pending: number;
}

export interface SignalLayerOverview {
  product: number;
  unattributed: number;
  dataQuality: number;
  container: number;
}

export interface SearchIntentTopTermForUi {
  search_term: string;
  normalized_query?: string | null;
  ad_group_names?: string[];
  targeting_texts?: string[];
  clicks: number;
  cost: number;
  orders: number;
  sales: number;
  acos?: number | null;
  aba_rank?: number | null;
  aba_period?: string | null;
  source_row_count: number;
}

export interface SearchIntentSummaryForUi {
  intent_label: string;
  search_terms: string[];
  metrics: {
    impressions: number;
    clicks: number;
    cost: number;
    orders: number;
    sales: number;
    acos: number | null;
    cvr: number | null;
    cpc: number | null;
  };
  insight: string;
  semantic_source?: string | null;
  aba_match_count?: number | null;
  top_search_terms?: SearchIntentTopTermForUi[];
  data_grain?: string | null;
  business_question?: string | null;
  current_judgement?: string | null;
  metric_purpose?: string | null;
  ad_context?: string | null;
  evidence_gap?: string | null;
  proves?: string | null;
  does_not_prove?: string | null;
  next_manual_step?: string | null;
}

export interface SearchIntentReviewCard {
  intentLabel: string;
  title: string;
  summary: string;
  sourceLabel: string;
  operationDecisionLabel: string;
  operationDecisionReason: string;
  operationDecisionTone: "scale" | "waste" | "observe";
  reviewStatus: SearchIntentReviewStatus;
  insight: string;
  businessQuestion: string;
  currentJudgement: string;
  metricPurpose: string;
  metricPurposeItems: SearchIntentMetricPurposeItem[];
  adContext: string;
  evidenceGap: string;
  signalMetricBoundary: string;
  purpose: string;
  boundary: string;
  dataGrain: string;
  proves: string;
  doesNotProve: string;
  nextManualStep: string;
  primarySearchTerm: string | null;
  primarySearchTermReason: string;
  topTerms: string[];
}

export interface SearchIntentReviewStatus {
  label: string;
  reason: string;
  nextStep: string;
  tone: "scale" | "waste" | "observe";
}

export interface SearchIntentReviewDecisionSummaryItem {
  label: string;
  value: string;
  detail: string;
  tone: SearchIntentReviewCard["operationDecisionTone"];
}

export interface SearchIntentReviewDecisionSummary {
  headline: string;
  businessQuestion: string;
  topIntentLabel: string;
  topDecisionLabel: string;
  topDecisionReason: string;
  topSearchTermLabel: string;
  manualReviewPath: string;
  proofBoundary: string;
  distributionItems: SearchIntentReviewDecisionSummaryItem[];
  priorityPathItems: SearchIntentReviewDecisionSummaryItem[];
  evidenceGap: string;
  nextManualStep: string;
  boundary: string;
}

export interface SearchIntentMetricPurposeItem {
  label: string;
  value: string;
  tone: "scale" | "waste" | "gap";
}

export interface SearchIntentPanelContext {
  purpose: string;
  dataGrain: string;
  interactionBoundary: string;
  proves: string;
  doesNotProve: string;
  nextManualStep: string;
  signalMetricBoundary: string;
  boundary: string;
  emptyText: string;
}

export interface SearchIntentFilterSignalForUi extends SignalForUi {
  evidence?: {
    primary_object?: PrimaryObjectForUi | null;
    facts?: EvidenceForUi[] | null;
    source_rows?: Record<string, unknown>[] | null;
  } | null;
}

export interface EvidenceForUi {
  label: string;
  value: string;
  source_type?: string | null;
}

type KeyEvidenceSignalContext = Pick<SignalForUi, "id" | "signal_category" | "object_type" | "freshness_status">;

export interface SignalDataSourceForUi {
  source_type?: string | null;
}

export interface SignalEvidenceSupportInput extends SignalForUi {
  confidence: "high" | "medium" | "low";
  evidence_count: number;
  data_sources?: SignalDataSourceForUi[];
  evidence?: {
    facts?: EvidenceForUi[];
    primary_object?: PrimaryObjectForUi;
    source_rows?: Record<string, unknown>[];
  };
}

export interface ProductScopedSignalForUi extends SignalForUi {
  evidence?: {
    primary_object?: PrimaryObjectForUi;
    source_rows?: Record<string, unknown>[];
  };
}

export interface ProductScopeFilterOption {
  scope_id: string;
  scope_type?: string;
  label?: string;
  asin?: string | null;
  parent_asin?: string | null;
  child_asins?: string[];
  spend?: number;
  orders?: number;
  sales?: number;
  sales_orders?: number;
  sales_amount?: number;
  ad_spend?: number;
  ad_orders?: number;
  ad_sales?: number;
  metric_boundary?: string | null;
  strategy_notes?: string[];
}

export interface ManualActionCandidateSignalForUi extends ProductScopedSignalForUi {
  priority?: "P0" | "P1" | "P2";
  summary?: string;
  shop_id?: string | null;
  shop_name?: string | null;
  market_id?: number | null;
  suggested_action?: {
    requires_manual_confirmation?: boolean;
  };
}

export interface RecommendedManualActionPreview {
  willWrite: false;
  actionType: "add_to_review";
  objectType: string;
  objectId: string;
  objectLabel: string;
  shopId?: string | null;
  shopName?: string | null;
  marketId?: number | null;
  reviewWindows: string[];
  preflightChecks: ManualActionPreflightCheck[];
}

const userFacingManualActionLabels: Record<string, string> = {
  observe: "记录观察",
  handled: "标记已处理",
  add_to_review: "加入复盘",
  ignore: "忽略本次",
};

function userFacingManualActionText(text: string): string {
  return Object.entries(userFacingManualActionLabels).reduce(
    (current, [actionCode, actionLabel]) => current.replace(new RegExp(`\\b${actionCode}\\b`, "g"), actionLabel),
    text,
  );
}

export interface ManualActionPreflightCheck {
  checkId: string;
  label: string;
  evidence: string;
  required: boolean;
}

export interface RecommendedManualActionCandidate<T extends ManualActionCandidateSignalForUi = ManualActionCandidateSignalForUi> {
  signal: T;
  objectLabel: string;
  reason: string;
  manualActionPreview: RecommendedManualActionPreview;
}

export interface ManualActionQueueTargetSwitchSummary {
  title: string;
  tone: "blocked" | "ready" | "waiting";
  primary: string;
  diagnosisObject: string;
  writeTarget: string;
  boundary: string;
}

export interface ManualActionRouteSplitReadinessForUi {
  tone?: "ready" | "blocked" | "waiting" | string;
  target?: string;
  currentState?: string;
  authorizedResult?: string;
  evidence?: string;
  boundary?: string;
}

export interface ManualActionRouteSplitRow {
  label: string;
  value: string;
  detail: string;
  tone: "saved" | "ready" | "waiting" | "blocked";
}

export interface ManualActionRouteSplitSummary {
  title: string;
  tone: "blocked" | "ready" | "waiting";
  primary: string;
  rows: ManualActionRouteSplitRow[];
  boundary: string;
}

interface SelectedSignalManualActionFallback extends SignalForUi {
  shop_id?: string | null;
  shop_name?: string | null;
  evidence?: {
    primary_object?: PrimaryObjectForUi | null;
  } | null;
}

export interface RuleFeedbackRecordForUi {
  review_record_id?: string | null;
  signal_id?: string | null;
  action_id?: string | null;
  signal_type?: string | null;
  result?: string | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  review_window?: string | null;
  metric_window?: {
    before?: string | null;
    after?: string | null;
  } | null;
  review_note?: string | null;
  evidence_snapshot_count?: number | null;
  evidence_snapshot?: RuleFeedbackEvidenceSnapshotForUi[];
  diagnosis_snapshot?: RuleFeedbackEvidenceSnapshotForUi | null;
  ai_admission_snapshot?: RuleFeedbackEvidenceSnapshotForUi | null;
  evidence_drilldown?: {
    summary?: string | null;
    boundary?: string | null;
  } | null;
  diagnosis_path?: RuleFeedbackDiagnosisPathForUi | null;
  sort_reason?: string | null;
  action_boundary?: RuleFeedbackActionBoundaryForUi | null;
  evidence_groups?: {
    group_id?: string | null;
    label?: string | null;
    value?: string | null;
  }[];
}

export interface RuleFeedbackCandidateGroupForUi {
  group_id?: string | null;
  group_type?: string | null;
  group_label?: string | null;
  aba_reference_term?: string | null;
  aba_period?: string | null;
  aba_match_boundary?: string | null;
  total?: number | null;
  by_result?: Record<string, number>;
  priority_result?: string | null;
  sample_review_record_ids?: string[];
  sample_action_ids?: string[];
  sample_parent_scopes?: string[];
  sample_search_terms?: string[];
  sample_ad_contexts?: string[];
  recommendation?: string | null;
  action_boundary?: RuleFeedbackActionBoundaryForUi | null;
  boundary?: string | null;
}

export interface RuleFeedbackPendingSourceForUi {
  source_type?: string | null;
  source_id?: string | null;
  action_type?: string | null;
  acted_at?: string | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  group_label?: string | null;
  aba_reference_term?: string | null;
  aba_period?: string | null;
  aba_match_boundary?: string | null;
  sample_parent_scopes?: string[];
  sample_search_terms?: string[];
  sample_ad_contexts?: string[];
  readiness?: string | null;
  boundary?: string | null;
}

export interface RuleFeedbackDiagnosisPathForUi {
  path?: string | null;
  steps?: {
    step_id?: string | null;
    label?: string | null;
    value?: string | null;
    detail?: string | null;
    source?: string | null;
  }[];
  boundary?: string | null;
  next_manual_step?: string | null;
}

export interface RuleFeedbackEvidenceSnapshotForUi {
  label?: string | null;
  value?: string | null;
  detail?: string | null;
  source?: string | null;
}

export interface RuleFeedbackActionBoundaryForUi {
  result?: string | null;
  allowed_reviews?: string[];
  forbidden_actions?: string[];
  boundary?: string | null;
}

export interface RuleFeedbackClosureCheckForUi {
  check_id?: string | null;
  label?: string | null;
  status?: string | null;
  evidence?: string | null;
}

interface SearchTermMetricForUi {
  normalized_query?: string | null;
  spend?: number | null;
  clicks?: number | null;
  orders?: number | null;
  sales?: number | null;
  aba_rank?: number | null;
  aba_period?: string | null;
}

interface ProductScopeDrilldownTermForUi {
  search_term?: string | null;
  normalized_query?: string | null;
  targeting_text?: string | null;
  term_type?: string | null;
  spend?: number | null;
  clicks?: number | null;
  orders?: number | null;
  sales?: number | null;
}

interface ProductScopeSearchTermDiagnosisForUi {
  term_summary?: string | null;
  effective_terms?: ProductScopeDrilldownTermForUi[] | null;
  zero_order_terms?: ProductScopeDrilldownTermForUi[] | null;
  term_boundary?: string | null;
  next_review_focus?: string | null;
  forbidden_actions?: string[] | null;
}

interface ProductScopeTargetingItemForUi {
  targeting_text?: string | null;
  source_report_type?: string | null;
  source_label?: string | null;
  keyword_id?: string | null;
  target_id?: string | null;
  keyword_id_count?: number | null;
  target_id_count?: number | null;
  search_term_count?: number | null;
  sample_search_terms?: string[] | null;
  spend?: number | null;
  clicks?: number | null;
  orders?: number | null;
  sales?: number | null;
}

interface ProductScopeTargetingContextForUi {
  basis?: string | null;
  context_ad_group_label?: string | null;
  targeting_count?: number | null;
  report_row_count?: number | null;
  keyword_targeting_count?: number | null;
  auto_targeting_count?: number | null;
  top_targetings?: ProductScopeTargetingItemForUi[] | null;
  effective_targetings?: ProductScopeTargetingItemForUi[] | null;
  zero_order_spend_targetings?: ProductScopeTargetingItemForUi[] | null;
  diagnosis_summary?: string | null;
  next_review_focus?: string | null;
  boundary?: string | null;
}

interface ProductScopeDrilldownTopAdGroupForUi {
  campaign_id?: string | null;
  campaign_name?: string | null;
  ad_group_id?: string | null;
  ad_group_name?: string | null;
  spend?: number | null;
  clicks?: number | null;
  orders?: number | null;
  sales?: number | null;
  ad_product_row_count?: number | null;
  search_term_count?: number | null;
  placement_count?: number | null;
  campaign_placement_count?: number | null;
  ad_group_advertised_asin_count?: number | null;
  ad_group_advertised_asins?: string[] | null;
  ad_group_attribution_boundary?: string | null;
  effective_search_terms?: ProductScopeDrilldownTermForUi[] | null;
  zero_order_search_terms?: ProductScopeDrilldownTermForUi[] | null;
  placement_context_level?: string | null;
  targeting_context?: ProductScopeTargetingContextForUi | null;
}

interface ProductScopeDrilldownItemForUi {
  asin?: string | null;
  spend?: number | null;
  clicks?: number | null;
  orders?: number | null;
  sales?: number | null;
  acos?: number | null;
  cvr?: number | null;
  ad_product_row_count?: number | null;
  top_ad_group?: ProductScopeDrilldownTopAdGroupForUi | null;
  next_review_focus?: string | null;
}

interface ProductScopeDrilldownAdGroupDiagnosisForUi {
  campaign_id?: string | null;
  campaign_name?: string | null;
  ad_group_id?: string | null;
  ad_group_name?: string | null;
  spend?: number | null;
  clicks?: number | null;
  orders?: number | null;
  sales?: number | null;
  acos?: number | null;
  cvr?: number | null;
  ad_product_row_count?: number | null;
  current_scope_advertised_asin_count?: number | null;
  ad_group_advertised_asin_count?: number | null;
  ad_group_advertised_asins?: string[] | null;
  advertised_product_performance?: ProductScopeDrilldownAdGroupProductPerformanceForUi[] | null;
  search_term_count?: number | null;
  effective_search_term_count?: number | null;
  zero_order_search_term_count?: number | null;
  placement_count?: number | null;
  campaign_placement_count?: number | null;
  placement_context_level?: string | null;
  diagnosis_status?: string | null;
  diagnosis_label?: string | null;
  problem_type?: string | null;
  reason?: string | null;
  evidence?: string | null;
  next_review_focus?: string | null;
  attribution_boundary?: string | null;
  forbidden_actions?: string[] | null;
  search_term_diagnosis?: ProductScopeSearchTermDiagnosisForUi | null;
}

interface ProductScopeDrilldownAdGroupProductPerformanceForUi {
  asin?: string | null;
  msku?: string | null;
  label?: string | null;
  spend?: number | null;
  clicks?: number | null;
  orders?: number | null;
  sales?: number | null;
  acos?: number | null;
  cvr?: number | null;
  row_count?: number | null;
  sample_boundary?: string | null;
}

interface ProductScopeDrilldownForUi {
  scope_id?: string | null;
  scope_type?: string | null;
  status?: string | null;
  advertised_asin_count?: number | null;
  items?: ProductScopeDrilldownItemForUi[] | null;
  ad_group_diagnosis?: ProductScopeDrilldownAdGroupDiagnosisForUi[] | null;
  candidate_gap_analysis?: {
    status?: string | null;
    summary?: string | null;
    checks?: {
      object_type?: string | null;
      object_id?: string | null;
      object_label?: string | null;
      result?: string | null;
      anomaly_check?: string | null;
      opportunity_check?: string | null;
      diagnosis_context?: string | null;
      next_review_focus?: string | null;
    }[] | null;
    boundary?: string | null;
  } | null;
  summary?: string | null;
  boundary?: string | null;
}

export interface SignalTriageCandidateForUi {
  signal_id?: string | null;
  signal_type?: string | null;
  signal_category?: string | null;
  priority?: string | null;
  confidence?: string | null;
  severity?: number | null;
  shop_id?: string | null;
  shop_name?: string | null;
  market_id?: number | null;
  marketplace?: string | null;
  object_type?: string | null;
  object_id?: string | null;
  stable_object_id?: string | null;
  object_label?: string | null;
  summary?: string | null;
  uncertainty?: string | null;
  evidence_count?: number | null;
  freshness_status?: string | null;
  problem_type?: string | null;
  evidence_strength?: string | null;
  attribution_boundary?: string | null;
  review_path?: string | null;
  manual_action_preview?: {
    will_write?: boolean;
    signal_id?: string | null;
    action_type?: string | null;
    object_type?: string | null;
    object_id?: string | null;
    object_label?: string | null;
    shop_id?: string | null;
    shop_name?: string | null;
    market_id?: number | null;
    review_windows?: string[];
    preflight_checklist?: {
      check_id?: string | null;
      label: string;
      evidence: string;
      required?: boolean | null;
    }[];
  } | null;
}

export interface SignalTriageSummaryForUi {
  actionability_status?: {
    status?: string | null;
    can_write_manual_action?: boolean | null;
    diagnosis_mode?: string | null;
    message?: string | null;
    next_step?: string | null;
    manual_gate_title?: string | null;
    boundary?: string | null;
    allowed_paths?: string[] | null;
    forbidden_actions?: string[] | null;
  } | null;
  product_scope_gate?: {
    status?: string | null;
    is_actionable?: boolean | null;
    selected_product_scope_id?: string | null;
    candidate_pool_count?: number | null;
    message?: string | null;
  } | null;
  signal_status?: {
    signal_count?: number;
    candidate_count?: number;
  };
  product_scope_drilldown?: ProductScopeDrilldownForUi | null;
  candidate_layers?: {
    layer_id?: string | null;
    label?: string | null;
    count?: number | null;
    top_candidates?: unknown[];
  }[];
  recommended_candidate?: SignalTriageCandidateForUi | null;
  next_unhandled_candidate?: SignalTriageCandidateForUi | null;
  recommended_evidence_drilldown?: {
    object_label?: string | null;
    direct_ad_product_row_count?: number | null;
    search_term_context_count?: number | null;
    placement_context_count?: number | null;
    campaigns?: string[];
    ad_groups?: string[];
    metric_summary?: {
      basis?: string | null;
      row_count?: number | null;
      spend?: number | null;
      clicks?: number | null;
      orders?: number | null;
      sales?: number | null;
      acos?: number | null;
      cvr?: number | null;
    } | null;
    sales_product_summary?: {
      basis?: string | null;
      row_count?: number | null;
      start_date?: string | null;
      end_date?: string | null;
      sessions?: number | null;
      page_views?: number | null;
      orders?: number | null;
      units?: number | null;
      sales?: number | null;
      ad_orders?: number | null;
      ad_spend?: number | null;
      ad_sales?: number | null;
      organic_orders?: number | null;
      organic_sales?: number | null;
      order_rate?: number | null;
      ad_order_share?: number | null;
      ad_sales_share?: number | null;
    } | null;
    diagnosis_judgement?: {
      problem_layer?: string | null;
      problem_type?: string | null;
      confidence?: string | null;
      summary?: string | null;
      reason?: string | null;
      next_review_focus?: string | null;
      boundary?: string | null;
      evidence_basis?: {
        ad_group_name?: string | null;
        spend?: number | null;
        clicks?: number | null;
        orders?: number | null;
        search_term_count?: number | null;
        placement_count?: number | null;
        campaign_placement_count?: number | null;
        total_spend?: number | null;
        total_orders?: number | null;
      } | null;
    } | null;
    business_evidence_blocks?: {
      block_id?: string | null;
      label: string;
      value: string;
      detail?: string | null;
      source?: string | null;
    }[] | null;
    sibling_comparison?: {
      basis?: string | null;
      parent_asin?: string | null;
      sibling_asin_count?: number | null;
      target_asin?: string | null;
      target_order_rank?: number | null;
      target_sales_rank?: number | null;
      target_ad_order_share_rank?: number | null;
      target_orders?: number | null;
      target_sales?: number | null;
      target_ad_order_share?: number | null;
      parent_orders?: number | null;
      parent_sales?: number | null;
      parent_ad_order_share?: number | null;
      interpretation?: string | null;
    } | null;
    ad_product_coverage?: {
      basis?: string | null;
      parent_asin?: string | null;
      target_asin?: string | null;
      sibling_asin_count?: number | null;
      target_direct_ad_product_row_count?: number | null;
      parent_ad_product_row_count?: number | null;
      parent_advertised_asin_count?: number | null;
      coverage_ratio?: number | null;
      target_sales_ad_orders?: number | null;
      target_sales_ad_sales?: number | null;
      interpretation?: string | null;
    } | null;
    top_spend_campaign?: {
      label?: string | null;
      spend?: number | null;
      clicks?: number | null;
      orders?: number | null;
      sales?: number | null;
      spend_share?: number | null;
    } | null;
    top_spend_ad_group?: {
      label?: string | null;
      spend?: number | null;
      clicks?: number | null;
      orders?: number | null;
      sales?: number | null;
      spend_share?: number | null;
    } | null;
    ad_group_diagnosis?: {
      basis?: string | null;
      summary?: string | null;
      top_ad_group?: {
        campaign_name?: string | null;
        ad_group_name?: string | null;
        ad_product_row_count?: number | null;
        spend?: number | null;
        clicks?: number | null;
        orders?: number | null;
        sales?: number | null;
        search_term_count?: number | null;
        placement_count?: number | null;
        campaign_placement_count?: number | null;
        campaign_placements?: {
          placement?: string | null;
          spend?: number | null;
          clicks?: number | null;
          orders?: number | null;
          sales?: number | null;
        }[] | null;
        placement_context_level?: string | null;
        acos?: number | null;
        cvr?: number | null;
        is_top_spend_ad_group?: boolean | null;
        diagnosis_focus?: string | null;
      } | null;
      rows?: {
        campaign_name?: string | null;
        ad_group_name?: string | null;
        ad_product_row_count?: number | null;
        spend?: number | null;
        clicks?: number | null;
        orders?: number | null;
        sales?: number | null;
        search_term_count?: number | null;
        placement_count?: number | null;
        campaign_placement_count?: number | null;
        campaign_placements?: {
          placement?: string | null;
          spend?: number | null;
          clicks?: number | null;
          orders?: number | null;
          sales?: number | null;
        }[] | null;
        placement_context_level?: string | null;
        acos?: number | null;
        cvr?: number | null;
        is_top_spend_ad_group?: boolean | null;
        diagnosis_focus?: string | null;
      }[] | null;
      boundary?: string | null;
    } | null;
    targeting_context?: {
      basis?: string | null;
      context_ad_group_label?: string | null;
      targeting_count?: number | null;
      report_row_count?: number | null;
      keyword_targeting_count?: number | null;
      auto_targeting_count?: number | null;
      top_targetings?: {
        targeting_text?: string | null;
        source_report_type?: string | null;
        source_label?: string | null;
        keyword_id?: string | null;
        target_id?: string | null;
        keyword_id_count?: number | null;
        target_id_count?: number | null;
        search_term_count?: number | null;
        sample_search_terms?: string[] | null;
        spend?: number | null;
        clicks?: number | null;
        orders?: number | null;
        sales?: number | null;
      }[] | null;
      effective_targetings?: {
        targeting_text?: string | null;
        source_report_type?: string | null;
        source_label?: string | null;
        search_term_count?: number | null;
        spend?: number | null;
        clicks?: number | null;
        orders?: number | null;
        sales?: number | null;
      }[] | null;
      zero_order_spend_targetings?: {
        targeting_text?: string | null;
        source_report_type?: string | null;
        source_label?: string | null;
        search_term_count?: number | null;
        spend?: number | null;
        clicks?: number | null;
        orders?: number | null;
        sales?: number | null;
      }[] | null;
      diagnosis_summary?: string | null;
      next_review_focus?: string | null;
      boundary?: string | null;
    } | null;
    all_asin_ad_coverage?: {
      basis?: string | null;
      raw_ad_product_row_count?: number | null;
      recommended_ad_product_row_count?: number | null;
      covered_raw_ad_product_row_count?: number | null;
      missing_ad_product_row_count?: number | null;
      missing_reason_summary?: Record<string, number> | null;
      missing_ad_product_rows?: {
        campaign_name?: string | null;
        ad_group_name?: string | null;
        asin?: string | null;
        spend?: number | null;
        clicks?: number | null;
        orders?: number | null;
        sales?: number | null;
        acos?: number | null;
        cvr?: number | null;
        coverage_reason?: string | null;
      }[] | null;
      coverage_ratio?: number | null;
      metric_summary?: {
        basis?: string | null;
        row_count?: number | null;
        spend?: number | null;
        clicks?: number | null;
        orders?: number | null;
        sales?: number | null;
        acos?: number | null;
        cvr?: number | null;
      } | null;
    } | null;
    search_term_aba_context?: {
      basis?: string | null;
      context_ad_group_label?: string | null;
      context_search_term_count?: number | null;
      aba_top1000_match_count?: number | null;
      aba_period?: string | null;
      diagnosis_summary?: string | null;
      next_review_focus?: string | null;
      boundary?: string | null;
      top_terms?: SearchTermMetricForUi[];
      high_spend_terms?: SearchTermMetricForUi[];
      effective_terms?: SearchTermMetricForUi[];
      zero_order_spend_terms?: SearchTermMetricForUi[];
      aba_matched_terms?: SearchTermMetricForUi[];
    } | null;
    ad_product_rows?: {
      campaign_name?: string | null;
      ad_group_name?: string | null;
      clicks?: number | null;
    }[];
    boundary?: string | null;
    summary?: string | null;
  } | null;
  diagnosis_contract?: {
    status?: string | null;
    signal_id?: string | null;
    object_type?: string | null;
    object_id?: string | null;
    object_label?: string | null;
    sections?: {
      section_id?: string | null;
      title?: string | null;
      business_question?: string | null;
      object_grain?: string | null;
      metrics?: {
        name?: string | null;
        value?: string | null;
        purpose?: string | null;
      }[] | null;
      current_judgement?: string | null;
      proves?: string | null;
      does_not_prove?: string | null;
      evidence_gap?: string | null;
      required_evidence?: string | null;
      next_manual_step?: string | null;
    }[] | null;
  } | null;
  next_unhandled_evidence_drilldown?: SignalTriageSummaryForUi["recommended_evidence_drilldown"];
  recommended_diagnosis_contract?: SignalTriageSummaryForUi["diagnosis_contract"];
  next_unhandled_diagnosis_contract?: SignalTriageSummaryForUi["diagnosis_contract"];
  recommendation_reason?: string | null;
  manual_action_preview?: {
    will_write?: boolean;
    signal_id?: string | null;
    action_type?: string | null;
    object_type?: string | null;
    object_id?: string | null;
    object_label?: string | null;
    shop_id?: string | null;
    shop_name?: string | null;
    market_id?: number | null;
    review_windows?: string[];
    preflight_checklist?: {
      check_id?: string | null;
      label: string;
      evidence: string;
      required?: boolean | null;
    }[];
  } | null;
  recommended_manual_status?: {
    will_write?: boolean;
    signal_id?: string | null;
    object_type?: string | null;
    object_id?: string | null;
    object_label?: string | null;
    shop_id?: string | null;
    shop_name?: string | null;
    market_id?: number | null;
    has_manual_action?: boolean;
    manual_action_count?: number;
    has_review_todo?: boolean;
    review_todo_count?: number;
    ready_review_count?: number;
    review_windows?: string[];
    next_action?: string | null;
  } | null;
  review_status?: {
    status?: string | null;
    manual_action_count?: number;
    review_record_count?: number;
    ready_count?: number;
    not_ready_count?: number;
    review_wait_summary?: {
      status?: string | null;
      earliest_due_date?: string | null;
      next_review_window?: string | null;
      next_object_type?: string | null;
      next_object_id?: string | null;
      next_object_label?: string | null;
      gap_reasons?: string[] | null;
      message?: string | null;
      next_step?: string | null;
      forbidden_actions?: string[] | null;
    } | null;
    review_identity_audit?: ReviewIdentityAuditForUi | null;
    review_feedback?: {
      total?: number;
      by_result?: Record<string, number>;
      by_signal_type?: Record<string, number>;
      sample_sort?: {
        order?: string[];
        reason?: string | null;
      };
      action_boundaries?: Record<string, RuleFeedbackActionBoundaryForUi>;
      closure_checklist?: RuleFeedbackClosureCheckForUi[];
      records?: RuleFeedbackRecordForUi[];
      candidate_groups?: RuleFeedbackCandidateGroupForUi[];
      pending_source_candidates?: RuleFeedbackPendingSourceForUi[];
      summary?: string | null;
      rule_feedback?: string | null;
    };
    rule_improvement?: {
      status?: string | null;
      title?: string | null;
      reason?: string | null;
      next_step?: string | null;
      can_auto_change_rules?: boolean;
      can_auto_execute_ads?: boolean;
    };
  };
  blockers?: { code?: string | null; message?: string | null }[];
  next_action?: string | null;
}

export interface SignalEvidenceSupport {
  sourceSummary: string;
  confidenceReason: string;
  severityReason: string;
  supportWarning: string | null;
}

export interface SignalTriageCompactItem {
  label: string;
  value: string;
  tone: "neutral" | "strong" | "success";
}

export interface ReviewReadinessGateItem {
  label: string;
  value: string;
  tone: "neutral" | "waiting" | "ready" | "blocked";
}

export interface ReviewReadinessNextStep {
  label: string;
  detail: string;
}

export interface ReviewIdentityAuditForUi {
  status?: string | null;
  manual_action_count?: number | null;
  review_record_count?: number | null;
  effect_count?: number | null;
  missing_action_id_count?: number | null;
  missing_object_id_count?: number | null;
  missing_review_window_count?: number | null;
  missing_evidence_snapshot_count?: number | null;
  missing_diagnosis_path_count?: number | null;
  missing_ai_admission_count?: number | null;
  missing_search_term_boundary_count?: number | null;
  missing_placement_boundary_count?: number | null;
  missing_ad_product_coverage_count?: number | null;
  missing_placement_performance_count?: number | null;
  missing_targeting_evidence_count?: number | null;
  missing_ad_group_synthesis_count?: number | null;
  missing_ad_group_product_performance_count?: number | null;
  missing_aba_context_count?: number | null;
  missing_evidence_gap_count?: number | null;
  missing_required_evidence_count?: number | null;
  missing_action_boundary_count?: number | null;
  missing_object_reference_count?: number | null;
  unstable_object_id_count?: number | null;
  ready_review_count?: number | null;
  can_save_review_records_now?: boolean | null;
  earliest_due_date?: string | null;
  earliest_any_due_date?: string | null;
  earliest_metric_due_date?: string | null;
  date_boundary?: string | null;
  issues?: unknown[] | null;
  readback_keys?: unknown[] | null;
}

export interface ReviewIdentityAuditSummary {
  title: string;
  status: "ready" | "blocked";
  summary: string;
  boundary: string;
  items: ReviewReadinessGateItem[];
}

export interface ReviewQueueSeparationSummary {
  title: string;
  primary: string;
  boundary: string;
  items: ReviewReadinessGateItem[];
}

export interface ReviewReadinessGateSummary {
  title: string;
  status: "empty" | "waiting" | "blocked" | "ready";
  primary: string;
  detail: string;
  boundary: string;
  items: ReviewReadinessGateItem[];
  nextSteps: ReviewReadinessNextStep[];
  identityAudit?: ReviewIdentityAuditSummary | null;
  queueSeparation?: ReviewQueueSeparationSummary | null;
}

export interface ReviewEvidenceRepairPayloadForUi {
  status?: string | null;
  will_write?: boolean | null;
  requires_explicit_authorization?: boolean | null;
  readiness_status?: string | null;
  rule_improvement_status?: string | null;
  counts?: {
    manual_actions?: number | null;
    review_todos?: number | null;
    repair_issue_count?: number | null;
    legacy_action_gap_count?: number | null;
    preview_rebuildable_count?: number | null;
    recreatable_count?: number | null;
  } | null;
  items?: {
    action_id?: string | null;
    object_type?: string | null;
    object_id?: string | null;
    object_label?: string | null;
    review_windows?: string[] | null;
    issue_types?: string[] | null;
    todo_count?: number | null;
    current_preflight?: {
      status?: string | null;
      target_matches_legacy?: boolean | null;
      evidence_snapshot_item_count?: number | null;
      has_diagnosis_path?: boolean | null;
      has_ai_admission?: boolean | null;
      has_search_term_boundary?: boolean | null;
      has_placement_boundary?: boolean | null;
      has_parent_asin_scope?: boolean | null;
      has_ad_asin_coverage?: boolean | null;
      has_ad_product_coverage?: boolean | null;
      has_placement_performance?: boolean | null;
      has_targeting_evidence?: boolean | null;
      has_ad_group_synthesis?: boolean | null;
      has_ad_group_product_performance?: boolean | null;
      has_aba_context?: boolean | null;
      has_evidence_gap?: boolean | null;
      has_required_evidence?: boolean | null;
      has_action_boundary?: boolean | null;
      has_object_reference?: boolean | null;
      missing_required_labels?: string[] | null;
    } | null;
    can_patch_legacy_record?: boolean | null;
    can_rebuild_evidence_preview?: boolean | null;
    can_recreate_from_current_signal?: boolean | null;
    patch_policy?: string | null;
    void_plan?: {
      status?: string | null;
      action_id?: string | null;
      review_window?: string | null;
      review_windows?: string[] | null;
      expected_object_type?: string | null;
      expected_object_id?: string | null;
      required_authorization_code?: string | null;
      dry_run_command?: string | null;
      execute_command?: string | null;
      boundary?: string | null;
    } | null;
    recommended_next_step?: string | null;
    will_write?: boolean | null;
  }[] | null;
  forbidden_effects?: string[] | null;
  next_action?: string | null;
}

export interface ReviewEvidenceRepairSummary {
  title: string;
  status: "ready" | "blocked";
  primary: string;
  detail: string;
  boundary: string;
  items: ReviewReadinessGateItem[];
  nextSteps: ReviewReadinessNextStep[];
  sampleItems: string[];
  voidPlanItems: ReviewEvidenceRepairVoidPlanSummary[];
}

export interface ReviewEvidenceRepairVoidPlanSummary {
  actionId: string;
  statusText: string;
  objectText: string;
  reviewWindows: string;
  authorizationCode: string;
  dryRunCommand: string;
  afterVoidText: string;
  recreateText: string;
  boundary: string;
}

export interface RuleFeedbackPrioritySummary {
  title: string;
  basis: string;
  priority: string;
  sampleSort: string;
  actionBoundary: string;
  closureChecklist: string[];
  records: string[];
  candidateGroups: string[];
  pendingSources: string[];
  boundary: string;
}

export interface AdProductComparisonRow {
  product: string;
  asin: string;
  msku: string;
  spend: number;
  clicks: number;
  orders: number;
  sales: number;
  acos: number | null;
  cvr: number | null;
  sourceRecordId: string;
}

export interface ProductScopeGroupOverview {
  title: string;
  summary: string;
  adAsinLabels: string[];
  adAsinRows: ProductGroupAdAsinRow[];
  adCoverageDecision: ProductScopeAdCoverageDecision;
  relationItems: ProductScopeRelationItem[];
  strategyNotes: string[];
  boundaryNotes: string[];
}

export interface ProductScopeFirstScreenSummary {
  title: string;
  summary: string;
  mvpStatus: ProductScopeMvpStatus;
  factItems: ProductScopeRelationItem[];
  adAsinRows: ProductGroupAdAsinRow[];
  adCoverageDecision: ProductScopeAdCoverageDecision;
  landingGates: ProductScopeLandingGateItem[];
  pathSummary: string;
  pathSteps: ProductScopeFirstScreenPathStep[];
  boundary: string;
}

export interface ProductScopeMvpStatus {
  title: string;
  statusLabel: string;
  summary: string;
  detail: string;
  boundary: string;
  tone: "diagnostic" | "manual" | "review" | "blocked";
}

export interface ProductScopeLandingGateItem {
  label: string;
  value: string;
  detail: string;
  tone: "ready" | "waiting" | "blocked" | "scope";
}

export interface ProductScopeFirstScreenPathStep {
  label: string;
  detail: string;
}

export interface ProductScopeRelationItem {
  label: string;
  value: string;
  tone: "primary" | "direct" | "strategy" | "context";
}

export interface ProductGroupAdAsinDecision {
  statusLabel: string;
  reason: string;
  proves: string;
  doesNotProve: string;
  nextFocus: string;
}

export interface ProductScopeAdCoverageDecision {
  statusLabel: string;
  summary: string;
  proves: string;
  doesNotProve: string;
  nextManualStep: string;
}

export interface ProductGroupAdAsinRow {
  scopeId: string;
  asin: string;
  spend: number;
  orders: number;
  sales: number;
  acos: number | null;
  strategyNote: string | null;
  decision: ProductGroupAdAsinDecision;
}

export interface ProductScopeSelectionSummary {
  title: string;
  description: string;
  targetBoundary: string;
  scopeSyncNotice?: ProductScopeSyncNotice;
  tone: "product" | "unattributed" | "all";
}

export interface ProductScopeSyncNotice {
  title: string;
  summary: string;
  directMetric: string;
  contextBoundary: string;
  manualBoundary: string;
}

export interface ProductScopeAnalysisPath {
  steps: string[];
  boundary: string;
}

export interface ProductScopeEntryGuidance {
  title: string;
  description: string;
  items: ProductScopeRelationItem[];
}

export interface ProductScopeOptionGroup {
  label: string;
  options: ProductScopeFilterOption[];
}

export interface ProductScopeQueueHeader {
  title: string;
  countText: string;
  description: string;
}

export type ProductScopePriorityQueueTone = "urgent" | "review" | "watch" | "quiet";

export interface ProductScopePriorityQueueReviewTodo {
  signal_id?: string | null;
  is_due?: boolean | null;
}

export interface ProductScopePriorityQueueItem {
  scopeId: string;
  label: string;
  priorityLabel: string;
  tone: ProductScopePriorityQueueTone;
  workflowStatus: ProductScopePriorityWorkflowStatus;
  mainQuestion: string;
  evidenceSummary: string;
  rankReason: string;
  decisionBadge: string;
  nextManualStep: string;
  boundary: string;
  signalCount: number;
  reviewTodoCount: number;
  dueReviewTodoCount: number;
  score: number;
}

export interface ProductScopePriorityWorkflowStatus {
  label: string;
  tone: ProductScopePriorityQueueTone;
  reason: string;
  nextStep: string;
}

export type ProductScopePrioritySearchIntentSummaryMap = Record<string, SearchIntentSummaryForUi[] | undefined>;

function appendPriorityText(text: string, addition: string): string {
  if (!addition || text.includes(addition)) return text;
  return `${text} / ${addition}`;
}

export interface ProductScopePriorityDecisionBucket {
  id: "review" | "manual" | "watch" | "quiet";
  label: string;
  count: number;
  objectLabels: string[];
  action: string;
  boundary: string;
  tone: ProductScopePriorityQueueTone;
}

export interface ProductScopeManualActionTargetAlignmentItem {
  label: string;
  value: string;
  detail: string;
}

export interface ProductScopeManualActionTargetAlignment {
  tone: "ready" | "waiting" | "blocked";
  title: string;
  primary: string;
  items: ProductScopeManualActionTargetAlignmentItem[];
  boundary: string;
}

export interface ProductScopeManualActionTargetAlignmentInput {
  priorityItem?: ProductScopePriorityQueueItem | null;
  selectedSignal?: ProductScopedSignalForUi | null;
  manualActionPreview?: RecommendedManualActionPreview | null;
  preflight?: {
    status?: string | null;
    target?: {
      signal_id?: string | null;
      object_type?: string | null;
      object_id?: string | null;
      object_label?: string | null;
    } | null;
  } | null;
  preflightError?: string | null;
}

export interface ProductScopeSignalExplanationInput {
  scopeSignalCount: number;
  allSignalCount: number;
  dataQualityCount?: number;
  advertisedAsinCount?: number;
  lowSignalThreshold?: number;
  signalTriageSummary?: SignalTriageSummaryForUi | null;
}

export interface ProductScopeSignalExplanation {
  title: string;
  description: string;
  reasons: string[];
  tone: "neutral" | "strategy" | "data";
}

export interface ProductScopeCoverageForOverview {
  search_term_unattributed_count?: number;
  placement_unattributed_count?: number;
}

export type EvidenceDrilldownSectionKey = "product_metrics" | "search_term_context" | "placement_context" | "boundary";

export interface EvidenceDrilldownSection<T extends EvidenceForUi = EvidenceForUi> {
  key: EvidenceDrilldownSectionKey;
  label: string;
  description: string;
  facts: T[];
}

const productMetricLabels = ["广告 ASIN", "销售 ASIN", "花费", "点击", "订单", "销售额", "ACOS", "CVR", "ROAS", "触发原因"];

function factText(fact: EvidenceForUi): string {
  return `${fact.label} ${fact.value}`;
}

export function buildEvidenceDrilldownSections<T extends EvidenceForUi>(facts: T[]): EvidenceDrilldownSection<T>[] {
  const buckets: Record<EvidenceDrilldownSectionKey, T[]> = {
    product_metrics: [],
    search_term_context: [],
    placement_context: [],
    boundary: [],
  };

  facts.forEach((fact) => {
    const text = factText(fact);
    if (fact.label.includes("同广告组搜索词上下文")) {
      buckets.search_term_context.push(fact);
      return;
    }
    if (fact.label.includes("同广告组广告位上下文")) {
      buckets.placement_context.push(fact);
      return;
    }
    if (
      fact.label.includes("上下文边界") ||
      fact.label.includes("归因边界") ||
      text.includes("不能自动归因") ||
      text.includes("不能强行归属")
    ) {
      buckets.boundary.push(fact);
      return;
    }
    if (productMetricLabels.some((label) => fact.label.includes(label))) {
      buckets.product_metrics.push(fact);
    }
  });

  const sections: EvidenceDrilldownSection<T>[] = [
    {
      key: "product_metrics",
      label: "商品指标",
      description: "该分区只包含可直接落到当前 ASIN 的广告商品或销售商品指标。",
      facts: buckets.product_metrics,
    },
    {
      key: "search_term_context",
      label: "搜索词上下文",
      description: "该分区只说明同广告组搜索词上下文，不能直接当作当前 ASIN 的搜索词归因。",
      facts: buckets.search_term_context,
    },
    {
      key: "placement_context",
      label: "广告位上下文",
      description: "该分区只说明同广告组广告位上下文，不能直接当作当前 ASIN 的广告位归因。",
      facts: buckets.placement_context,
    },
    {
      key: "boundary",
      label: "边界说明",
      description: "该分区说明哪些证据不能自动归因到 ASIN，以及后续需要人工复核的判断边界。",
      facts: buckets.boundary,
    },
  ];

  return sections.filter((section) => section.facts.length > 0);
}

export interface EvidenceSourceOption {
  sourceType: string;
  label: string;
  count: number;
}

export interface EvidenceRouteNode {
  sourceType: string;
  label: string;
  count: number;
  status: "已接入" | "待复核";
}

const unknownEvidenceSource = "未知来源";
const preferredEvidenceSourceOrder = ["积加API", "ABA导出", "关键词监控", "销售表现", "人工语义"];

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function searchTermDisplayNameFromIdentity(objectId?: string | null, objectLabel?: string | null) {
  const label = stringValue(objectLabel);
  if (label && !label.startsWith("search_term:")) return label;
  const id = stringValue(objectId);
  if (!id) return "";
  if (!id.startsWith("search_term:")) return id;
  const [, , ...queryParts] = id.split(":");
  return queryParts.join(":").trim() || id;
}

function objectIdentityDisplayText(objectType?: string | null, objectId?: string | null, objectLabel?: string | null) {
  const type = stringValue(objectType);
  const id = stringValue(objectId);
  const label = stringValue(objectLabel);
  if (type === "search_term") {
    const searchTerm = searchTermDisplayNameFromIdentity(id, label);
    if (searchTerm && id && searchTerm !== id) return `具体 SearchTerm：${searchTerm}；稳定对象：${type} / ${id}`;
    if (searchTerm) return `具体 SearchTerm：${searchTerm}`;
  }
  if (type && id) return `${type} / ${id}`;
  return id || label || "";
}

export function signalScopedStateKey(signalId: string, marketId?: number | null) {
  return `${marketId ?? "unknown"}:${signalId}`;
}

export const signalStatusOverrideKey = signalScopedStateKey;

export function applySignalStatusOverrides<T extends SignalForUi>(signals: T[], overrides: SignalStatusOverrideMap): T[] {
  return signals.map((signal) => ({
    ...signal,
    status: overrides[signalStatusOverrideKey(signal.id, signal.market_id)] ?? signal.status,
  }));
}

export function signalQueueKind(signal: SignalForUi): SignalQueueKind {
  const category = signal.signal_category.toLowerCase();
  if (category.includes("data_quality")) return "data_quality";
  if (category.includes("review")) return "review";
  if (
    category.includes("ad_group") ||
    category.includes("structure") ||
    category.includes("placement") ||
    signal.object_type === "ad_group" ||
    signal.object_type === "placement"
  ) {
    return "structure_boundary";
  }
  if (signal.signal_type === "opportunity" || category.includes("opportunity") || category.includes("aba")) {
    return "opportunity_expansion";
  }
  return "spend_waste";
}

export function signalQueueKindLabel(kind: SignalQueueKind): string {
  return signalQueueKindLabels[kind];
}

function sourceParentAsin(row: Record<string, unknown>): string {
  return sourceText(row, "parent_asin") || sourceText(row, "parentAsin") || sourceText(row, "variation_asin") || sourceText(row, "variationAsin");
}

export function signalProductScopeIds(signal: ProductScopedSignalForUi, productScopeOptions: ProductScopeFilterOption[] = []): string[] {
  const scopeIds = new Set<string>();
  const asins = new Set<string>();
  const primaryAsin = stringValue(signal.evidence?.primary_object?.asin);
  const primaryParentAsin = stringValue(signal.evidence?.primary_object?.parent_asin);
  if (primaryAsin) {
    asins.add(primaryAsin);
    if (signal.object_type === "sales_product") scopeIds.add(`sales_asin:${primaryAsin}`);
    if (signal.object_type === "advertised_product") scopeIds.add(`ad_asin:${primaryAsin}`);
  }
  if (primaryParentAsin) scopeIds.add(`parent_asin:${primaryParentAsin}`);

  signal.evidence?.source_rows?.forEach((row) => {
    const asin = stringValue(row.asin);
    const parentAsin = sourceParentAsin(row);
    if (parentAsin) scopeIds.add(`parent_asin:${parentAsin}`);
    if (!asin) return;
    asins.add(asin);
    const sourceTable = stringValue(row.source_table);
    if (sourceTable === "sales_product_daily_metrics") {
      scopeIds.add(`sales_asin:${asin}`);
      return;
    }
    if (sourceTable === "advertised_products") {
      scopeIds.add(`ad_asin:${asin}`);
    }
  });

  productScopeOptions.forEach((option) => {
    if (option.scope_type !== "parent_asin") return;
    if (option.child_asins?.some((asin) => asins.has(asin))) {
      scopeIds.add(option.scope_id);
    }
  });

  return Array.from(scopeIds);
}

export function filterSignalsByProductScope<T extends ProductScopedSignalForUi>(
  signals: T[],
  scopeId: string,
  productScopeOptions: ProductScopeFilterOption[] = [],
): T[] {
  if (scopeId === "all") return signals;
  return signals.filter((signal) => {
    if (signal.signal_category === "data_quality") return false;
    const scopeIds = signalProductScopeIds(signal, productScopeOptions);
    if (scopeId === "unattributed") return scopeIds.length === 0;
    return scopeIds.includes(scopeId);
  });
}

export function mergeBackendTriageSignals<T extends ProductScopedSignalForUi>(
  scopedSignals: T[],
  allSignals: T[],
  summary: SignalTriageSummaryForUi | null | undefined,
): T[] {
  if (summaryRequiresProductScope(summary)) return scopedSignals;
  const seen = new Set(scopedSignals.map((signal) => signal.id));
  const merged = [...scopedSignals];

  backendTriageSignalIds(summary).forEach((signalId) => {
    if (seen.has(signalId)) return;
    const signal = allSignals.find((item) => item.id === signalId) ?? buildBackendTriageFallbackSignal(summary, signalId);
    if (!signal) return;
    seen.add(signal.id);
    merged.push(signal as T);
  });

  return merged;
}

function backendTriageSignalIds(summary: SignalTriageSummaryForUi | null | undefined): string[] {
  const ids = new Set<string>();

  [
    summary?.recommended_candidate?.signal_id,
    summary?.manual_action_preview?.signal_id,
    summary?.next_unhandled_candidate?.signal_id,
    summary?.next_unhandled_candidate?.manual_action_preview?.signal_id,
  ].forEach((value) => {
    const signalId = stringValue(value);
    if (signalId) ids.add(signalId);
  });

  (summary?.candidate_layers ?? []).forEach((layer) => {
    (layer.top_candidates ?? []).forEach((candidate) => {
      if (!candidate || typeof candidate !== "object") return;
      const signalId = stringValue((candidate as { signal_id?: unknown }).signal_id);
      if (signalId) ids.add(signalId);
    });
  });

  return Array.from(ids);
}

type SignalTriageEvidenceDrilldownForUi = SignalTriageSummaryForUi["recommended_evidence_drilldown"];

interface BackendTriageCandidateEntry {
  candidate: SignalTriageCandidateForUi;
  drilldown?: SignalTriageEvidenceDrilldownForUi | null;
}

const knownSignalObjectTypes: NonNullable<SignalForUi["object_type"]>[] = [
  "ad_group",
  "sales_product",
  "advertised_product",
  "search_term",
  "placement",
  "search_intent",
  "cross",
];

function buildBackendTriageFallbackSignal(
  summary: SignalTriageSummaryForUi | null | undefined,
  signalId: string,
): ProductScopedSignalForUi | null {
  const entry = backendTriageCandidateEntries(summary).find(({ candidate }) => triageCandidateMatchesSignalId(candidate, signalId));
  if (!entry) return null;

  const candidate = entry.candidate;
  const preview = candidate.manual_action_preview;
  const objectType = normalizeSignalObjectType(preview?.object_type || candidate.object_type, candidate.signal_category);
  const objectId =
    stringValue(preview?.object_id) ||
    stringValue(candidate.stable_object_id) ||
    stringValue(candidate.object_id) ||
    signalId;
  const objectLabel =
    stringValue(preview?.object_label) ||
    stringValue(candidate.object_label) ||
    stringValue(candidate.stable_object_id) ||
    stringValue(candidate.object_id) ||
    signalId;
  const confidence = normalizeSignalConfidence(candidate.confidence || candidate.evidence_strength);
  const severity = numericValue(candidate.severity) ?? (confidence === "high" ? 4 : 3);
  const signalCategory = stringValue(candidate.signal_category) || defaultSignalCategoryForObjectType(objectType);
  const summaryText = stringValue(candidate.summary) || `${objectLabel} 需要进入人工复核`;
  const whyText =
    stringValue(candidate.problem_type) ||
    stringValue(candidate.attribution_boundary) ||
    "后端 signal-triage 已识别为可人工处理候选，但 /api/signals 暂无同 ID 队列记录。";
  const primaryObject: PrimaryObjectForUi = {
    object_type: objectType,
    object_id: objectId,
    label: objectLabel,
  };

  if (objectType === "search_term") primaryObject.search_term = objectLabel;
  if (objectType === "placement") primaryObject.placement = objectLabel;
  if (objectType === "advertised_product" || objectType === "sales_product") {
    primaryObject.asin = stringValue(candidate.stable_object_id) || objectId;
  }

  return {
    id: signalId,
    signal_type: normalizeSignalType(candidate.signal_type),
    signal_category: signalCategory,
    priority: normalizeSignalPriority(candidate.priority),
    confidence,
    shop_id: stringValue(preview?.shop_id) || stringValue(candidate.shop_id) || null,
    shop_name: stringValue(preview?.shop_name) || stringValue(candidate.shop_name) || null,
    market_id: preview?.market_id ?? candidate.market_id ?? null,
    marketplace: stringValue(candidate.marketplace) || null,
    object_type: objectType,
    severity,
    summary: summaryText,
    why: whyText,
    evidence: {
      period_days: 30,
      primary_object: primaryObject,
      metrics: triageMetricSnapshot(entry.drilldown),
      comparison: [],
      facts: triageFallbackFacts(candidate),
      source_rows: [],
    },
    evidence_count: numericValue(candidate.evidence_count) ?? 1,
    data_sources: [
      {
        source_type: "signal_triage",
        source_name: "/api/signal-triage",
      },
    ],
    freshness_status: normalizeFreshnessStatus(candidate.freshness_status),
    detected_at: "",
    uncertainty: stringValue(candidate.uncertainty) || stringValue(candidate.attribution_boundary),
    suggested_action: {
      action_type: stringValue(preview?.action_type) || "add_to_review",
      title: "加入人工复盘",
      description: "只生成可人工确认的处理入口，不自动执行广告动作。",
      requires_manual_confirmation: true,
    },
    risk: stringValue(candidate.attribution_boundary) || "该候选来自后端分诊摘要，仍需人工核对对象边界和证据链。",
    status: "pending",
    manual_status: "pending",
    review_result: null,
    tags: [candidate.problem_type, candidate.evidence_strength, candidate.review_path].map(stringValue).filter(Boolean),
  } as ProductScopedSignalForUi;
}

function backendTriageCandidateEntries(summary: SignalTriageSummaryForUi | null | undefined): BackendTriageCandidateEntry[] {
  const entries: BackendTriageCandidateEntry[] = [];
  if (summary?.recommended_candidate) {
    entries.push({
      candidate: {
        ...summary.recommended_candidate,
        manual_action_preview: summary.recommended_candidate.manual_action_preview ?? summary.manual_action_preview ?? null,
      },
      drilldown: summary.recommended_evidence_drilldown,
    });
  }
  if (summary?.next_unhandled_candidate) {
    entries.push({
      candidate: summary.next_unhandled_candidate,
      drilldown: summary.next_unhandled_evidence_drilldown,
    });
  }
  (summary?.candidate_layers ?? []).forEach((layer) => {
    (layer.top_candidates ?? []).forEach((candidate) => {
      if (!candidate || typeof candidate !== "object") return;
      if (!stringValue((candidate as SignalTriageCandidateForUi).signal_id)) return;
      entries.push({ candidate: candidate as SignalTriageCandidateForUi });
    });
  });
  return entries;
}

function triageCandidateMatchesSignalId(candidate: SignalTriageCandidateForUi, signalId: string): boolean {
  return [candidate.signal_id, candidate.manual_action_preview?.signal_id].map(stringValue).includes(signalId);
}

function normalizeSignalType(value: unknown): SignalForUi["signal_type"] {
  return stringValue(value) === "anomaly" ? "anomaly" : "opportunity";
}

function normalizeSignalPriority(value: unknown): "P0" | "P1" | "P2" {
  const priority = stringValue(value);
  return priority === "P0" || priority === "P2" ? priority : "P1";
}

function normalizeSignalConfidence(value: unknown): "high" | "medium" | "low" {
  const confidence = stringValue(value).toLowerCase();
  if (confidence === "high" || confidence.includes("高")) return "high";
  if (confidence === "low" || confidence.includes("低")) return "low";
  return "medium";
}

function normalizeFreshnessStatus(value: unknown): SignalForUi["freshness_status"] {
  const status = stringValue(value);
  return status === "api_snapshot" || status === "sample_data" || status === "stale" ? status : "unknown";
}

function normalizeSignalObjectType(value: unknown, signalCategory?: unknown): SignalForUi["object_type"] {
  const objectType = stringValue(value);
  if ((knownSignalObjectTypes as string[]).includes(objectType)) return objectType as SignalForUi["object_type"];
  const category = stringValue(signalCategory).toLowerCase();
  if (category.includes("advertised_product")) return "advertised_product";
  if (category.includes("product_ad_coverage") || category.includes("sales_product")) return "sales_product";
  if (category.includes("search_term")) return "search_term";
  if (category.includes("placement")) return "placement";
  if (category.includes("ad_group")) return "ad_group";
  return undefined;
}

function defaultSignalCategoryForObjectType(objectType: SignalForUi["object_type"]): string {
  if (objectType === "advertised_product") return "advertised_product_opportunity";
  if (objectType === "sales_product") return "product_ad_coverage";
  if (objectType === "placement") return "placement_efficiency";
  if (objectType === "ad_group") return "ad_group_structure";
  return "search_term_opportunity";
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function triageMetricSnapshot(drilldown: SignalTriageEvidenceDrilldownForUi | null | undefined) {
  const metricSummary = drilldown?.metric_summary;
  const clicks = numericValue(metricSummary?.clicks) ?? 0;
  const cost = numericValue(metricSummary?.spend) ?? 0;
  return {
    impressions: 0,
    clicks,
    cost,
    orders: numericValue(metricSummary?.orders) ?? 0,
    sales: numericValue(metricSummary?.sales) ?? 0,
    acos: numericValue(metricSummary?.acos),
    cvr: numericValue(metricSummary?.cvr),
    cpc: clicks > 0 ? cost / clicks : null,
  };
}

function triageFallbackFacts(candidate: SignalTriageCandidateForUi): EvidenceForUi[] {
  return [
    { label: "业务问题", value: stringValue(candidate.problem_type), source_type: "signal_triage" },
    { label: "证据强度", value: stringValue(candidate.evidence_strength), source_type: "signal_triage" },
    { label: "对象边界", value: stringValue(candidate.attribution_boundary), source_type: "signal_triage" },
  ].filter((fact) => fact.value);
}

const reviewableManualActionObjectTypes: SignalForUi["object_type"][] = [
  "advertised_product",
  "sales_product",
  "search_term",
  "placement",
  "ad_group",
];

function isReviewableManualActionCandidate(signal: ManualActionCandidateSignalForUi): boolean {
  if (signal.signal_category === "data_quality" || signal.object_type === "cross") return false;
  if (!reviewableManualActionObjectTypes.includes(signal.object_type)) return false;
  return signal.suggested_action?.requires_manual_confirmation !== false;
}

function signalAsins(signal: ProductScopedSignalForUi): string[] {
  const asins = new Set<string>();
  const primaryAsin = stringValue(signal.evidence?.primary_object?.asin);
  if (primaryAsin) asins.add(primaryAsin);
  signal.evidence?.source_rows?.forEach((row) => {
    const asin = stringValue(row.asin);
    if (asin) asins.add(asin);
  });
  return Array.from(asins);
}

function candidateParentOption(signal: ProductScopedSignalForUi, productScopeOptions: ProductScopeFilterOption[]): ProductScopeFilterOption | null {
  const scopeIds = new Set(signalProductScopeIds(signal, productScopeOptions));
  return (
    productScopeOptions.find(
      (option) => (option.scope_type === "parent_asin" || option.scope_id.startsWith("parent_asin:")) && scopeIds.has(option.scope_id),
    ) ?? null
  );
}

function candidateAsinOption(signal: ProductScopedSignalForUi, productScopeOptions: ProductScopeFilterOption[]): ProductScopeFilterOption | null {
  const asins = new Set(signalAsins(signal));
  return productScopeOptions.find((option) => option.asin && asins.has(option.asin)) ?? null;
}

function candidateObjectLabel(signal: ProductScopedSignalForUi): string {
  return (
    stringValue(signal.evidence?.primary_object?.label) ||
    stringValue(signal.evidence?.primary_object?.asin) ||
    stringValue(signal.evidence?.primary_object?.search_term) ||
    stringValue(signal.evidence?.primary_object?.placement) ||
    signal.id
  );
}

function candidateRecommendationScore(signal: ManualActionCandidateSignalForUi, productScopeOptions: ProductScopeFilterOption[]): number {
  const objectScore: Record<string, number> = {
    advertised_product: 80,
    sales_product: 75,
    search_term: 50,
    placement: 40,
    ad_group: 35,
  };
  const priorityScore: Record<string, number> = {
    P0: 12,
    P1: 8,
    P2: 4,
  };
  const parentOption = candidateParentOption(signal, productScopeOptions);
  const asinOption = candidateAsinOption(signal, productScopeOptions);
  const strategyNoteCount = asinOption?.strategy_notes?.length ?? 0;

  return (
    (parentOption ? 100 : 0) +
    (objectScore[signal.object_type ?? ""] ?? 0) +
    (strategyNoteCount === 0 && asinOption ? 30 : 0) -
    (strategyNoteCount > 0 ? 20 : 0) +
    (priorityScore[signal.priority ?? ""] ?? 0) +
    signal.severity
  );
}

function parentOptionLabel(option: ProductScopeFilterOption): string {
  return option.label ?? (option.parent_asin ? `Parent ASIN ${option.parent_asin}` : option.scope_id);
}

function candidateRecommendationReason(signal: ManualActionCandidateSignalForUi, productScopeOptions: ProductScopeFilterOption[]): string {
  const label = candidateObjectLabel(signal);
  const parentOption = candidateParentOption(signal, productScopeOptions);
  const asinOption = candidateAsinOption(signal, productScopeOptions);
  const strategyNoteCount = asinOption?.strategy_notes?.length ?? 0;

  if (parentOption && strategyNoteCount === 0) {
    return `建议优先留痕：${label} 属于 ${parentOptionLabel(parentOption)}，无主推款策略备注，适合先跑通 ASIN 人工确认和后续复盘。`;
  }
  if (parentOption) {
    return `建议优先留痕：${label} 属于 ${parentOptionLabel(parentOption)}，但已有策略备注，需要先核对策略边界再记录人工处理。`;
  }
  return `建议优先留痕：${label} 是可复盘广告对象，适合先记录人工动作并等待 7/14 天快照。`;
}

function manualActionPreviewObjectId(signal: ManualActionCandidateSignalForUi): string {
  const primaryObject = signal.evidence?.primary_object;
  const objectType = primaryObject?.object_type ?? signal.object_type;
  const fallbackObjectId = stringValue(primaryObject?.object_id) || signal.id;

  if (objectType === "advertised_product" || objectType === "sales_product") {
    return (
      stringValue(primaryObject?.asin) ||
      stringValue(primaryObject?.msku) ||
      stringValue(primaryObject?.sku) ||
      fallbackObjectId
    );
  }

  return stringValue(primaryObject?.search_term) || stringValue(primaryObject?.placement) || fallbackObjectId;
}

function buildManualActionPreview(signal: ManualActionCandidateSignalForUi): RecommendedManualActionPreview {
  const objectLabel = candidateObjectLabel(signal);
  const objectType = signal.evidence?.primary_object?.object_type ?? signal.object_type ?? "unknown";
  const objectId = manualActionPreviewObjectId(signal);

  return {
    willWrite: false,
    actionType: "add_to_review",
    objectType,
    objectId,
    objectLabel,
    shopId: signal.shop_id ?? null,
    shopName: signal.shop_name ?? null,
    marketId: signal.market_id ?? null,
    reviewWindows: ["7d", "14d"],
    preflightChecks: fallbackManualActionPreflightChecks(objectType, objectId),
  };
}

export function buildRecommendedManualActionCandidate<T extends ManualActionCandidateSignalForUi>(
  signals: T[],
  productScopeOptions: ProductScopeFilterOption[] = [],
): RecommendedManualActionCandidate<T> | null {
  const rankedCandidates = signals
    .filter(isReviewableManualActionCandidate)
    .map((signal, index) => ({
      signal,
      index,
      score: candidateRecommendationScore(signal, productScopeOptions),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const recommended = rankedCandidates[0]?.signal;
  if (!recommended) return null;

  return {
    signal: recommended,
    objectLabel: candidateObjectLabel(recommended),
    reason: candidateRecommendationReason(recommended, productScopeOptions),
    manualActionPreview: buildManualActionPreview(recommended),
  };
}

export function buildBackendRecommendedManualActionCandidate<T extends ManualActionCandidateSignalForUi>(
  signals: T[],
  summary: SignalTriageSummaryForUi | null | undefined,
): RecommendedManualActionCandidate<T> | null {
  if (summaryRequiresProductScope(summary)) return null;
  const recommended = summary?.recommended_candidate;
  const rawPreview = summary?.manual_action_preview;
  const previewMatchesRecommended =
    rawPreview &&
    (!recommended?.signal_id || rawPreview.signal_id === recommended.signal_id) &&
    (!recommended?.stable_object_id || !rawPreview.object_id || rawPreview.object_id === recommended.stable_object_id);
  const preview = previewMatchesRecommended ? rawPreview : null;
  const signalId = recommended?.signal_id || preview?.signal_id;
  if (!signalId) return null;
  const signal = signals.find((item) => item.id === signalId);
  if (!signal) return null;

  const objectLabel =
    preview?.object_label ||
    recommended?.object_label ||
    recommended?.stable_object_id ||
    candidateObjectLabel(signal);
  const objectType = preview?.object_type || signal.evidence?.primary_object?.object_type || signal.object_type || "unknown";
  const objectId = preview?.object_id || recommended?.stable_object_id || manualActionPreviewObjectId(signal);
  const reviewWindows = preview?.review_windows?.length
    ? preview.review_windows
    : summary?.recommended_manual_status?.review_windows?.length
      ? summary.recommended_manual_status.review_windows
      : ["7d", "14d"];

  return {
    signal,
    objectLabel,
    reason: userFacingManualActionText(summary?.recommendation_reason || summary?.next_action || `后端推荐 ${objectLabel} 进入人工确认。`),
    manualActionPreview: {
      willWrite: false,
      actionType: "add_to_review",
      objectType,
      objectId,
      objectLabel,
      shopId: preview?.shop_id ?? signal.shop_id ?? null,
      shopName: preview?.shop_name ?? signal.shop_name ?? null,
      marketId: preview?.market_id ?? signal.market_id ?? null,
      reviewWindows,
      preflightChecks: normalizeManualActionPreflightChecks(preview?.preflight_checklist, objectType, objectId),
    },
  };
}

export function buildNextUnhandledManualActionCandidate<T extends ManualActionCandidateSignalForUi>(
  signals: T[],
  summary: SignalTriageSummaryForUi | null | undefined,
): RecommendedManualActionCandidate<T> | null {
  if (summaryRequiresProductScope(summary)) return null;
  const candidate = summary?.next_unhandled_candidate;
  const preview = candidate?.manual_action_preview;
  const signalId = preview?.signal_id || candidate?.signal_id;
  if (!signalId || !preview) return null;
  const signal = signals.find((item) => item.id === signalId);
  if (!signal) return null;

  const objectLabel =
    preview.object_label ||
    candidate.object_label ||
    candidate.stable_object_id ||
    candidate.object_id ||
    candidateObjectLabel(signal);

  return {
    signal,
    objectLabel,
    reason: userFacingManualActionText(summary?.next_action || `下一个未留痕候选 ${objectLabel} 需要人工确认。`),
    manualActionPreview: {
      willWrite: false,
      actionType: "add_to_review",
      objectType: preview.object_type || candidate.object_type || signal.evidence?.primary_object?.object_type || signal.object_type || "unknown",
      objectId: preview.object_id || candidate.stable_object_id || candidate.object_id || manualActionPreviewObjectId(signal),
      objectLabel,
      shopId: preview.shop_id ?? candidate.shop_id ?? signal.shop_id ?? null,
      shopName: preview.shop_name ?? candidate.shop_name ?? signal.shop_name ?? null,
      marketId: preview.market_id ?? candidate.market_id ?? signal.market_id ?? null,
      reviewWindows: preview.review_windows?.length ? preview.review_windows : ["7d", "14d"],
      preflightChecks: normalizeManualActionPreflightChecks(preview.preflight_checklist, preview.object_type || candidate.object_type, preview.object_id),
    },
  };
}

function recommendedManualActionSignalId(summary: SignalTriageSummaryForUi | null | undefined): string | null {
  return stringValue(summary?.recommended_candidate?.signal_id) || stringValue(summary?.manual_action_preview?.signal_id) || null;
}

function nextUnhandledManualActionSignalId(summary: SignalTriageSummaryForUi | null | undefined): string | null {
  const candidate = summary?.next_unhandled_candidate;
  return stringValue(candidate?.manual_action_preview?.signal_id) || stringValue(candidate?.signal_id) || null;
}

function shouldPreferNextUnhandledManualAction(summary: SignalTriageSummaryForUi | null | undefined): boolean {
  return Boolean(summary?.recommended_manual_status?.has_manual_action && nextUnhandledManualActionSignalId(summary));
}

export function resolveSignalSelectionId<T extends ManualActionCandidateSignalForUi>(
  currentSelectedId: string | null | undefined,
  signals: T[],
  summary: SignalTriageSummaryForUi | null | undefined,
): string | null {
  const recommendedCandidate = buildBackendRecommendedManualActionCandidate(signals, summary);
  const nextUnhandledCandidate = buildNextUnhandledManualActionCandidate(signals, summary);
  const shouldUseNextUnhandled = shouldPreferNextUnhandledManualAction(summary);
  const recommendedSignalId = recommendedManualActionSignalId(summary);
  const currentSelectionExists = Boolean(currentSelectedId && signals.some((signal) => signal.id === currentSelectedId));

  if (shouldUseNextUnhandled && nextUnhandledCandidate && (!currentSelectionExists || currentSelectedId === recommendedSignalId)) {
    return nextUnhandledCandidate.signal.id;
  }

  if (currentSelectedId && currentSelectionExists) {
    return currentSelectedId;
  }

  return (
    recommendedCandidate?.signal.id ??
    nextUnhandledCandidate?.signal.id ??
    signals[0]?.id ??
    null
  );
}

function normalizeManualActionPreview(
  preview:
    | NonNullable<SignalTriageSummaryForUi["manual_action_preview"]>
    | NonNullable<NonNullable<SignalTriageSummaryForUi["next_unhandled_candidate"]>["manual_action_preview"]>
    | null
    | undefined,
  fallback: {
    objectType?: string | null;
    objectId?: string | null;
    objectLabel?: string | null;
    shopId?: string | null;
    shopName?: string | null;
    marketId?: number | null;
  } = {},
): RecommendedManualActionPreview | null {
  if (!preview) return null;
  const objectId = stringValue(preview.object_id) || stringValue(fallback.objectId);
  if (!objectId) return null;

  return {
    willWrite: false,
    actionType: "add_to_review",
    objectType: stringValue(preview.object_type) || stringValue(fallback.objectType) || "unknown",
    objectId,
    objectLabel: stringValue(preview.object_label) || stringValue(fallback.objectLabel) || objectId,
    shopId: stringValue(preview.shop_id) || stringValue(fallback.shopId) || null,
    shopName: stringValue(preview.shop_name) || stringValue(fallback.shopName) || null,
    marketId: preview.market_id ?? fallback.marketId ?? null,
    reviewWindows: preview.review_windows?.length ? preview.review_windows : ["7d", "14d"],
    preflightChecks: normalizeManualActionPreflightChecks(preview.preflight_checklist, preview.object_type || fallback.objectType, objectId),
  };
}

export function manualActionPreviewForSelectedSignal(
  selectedSignalId: string | null | undefined,
  summary: SignalTriageSummaryForUi | null | undefined,
  selectedSignal?: SelectedSignalManualActionFallback | null,
): RecommendedManualActionPreview | null {
  if (!selectedSignalId) return null;
  if (summaryRequiresProductScope(summary)) return null;

  const primaryObject = selectedSignal?.evidence?.primary_object;
  const selectedFallback = {
    objectType: primaryObject?.object_type || selectedSignal?.object_type,
    objectId: primaryObject?.object_id || primaryObject?.asin || null,
    objectLabel: primaryObject?.label || primaryObject?.asin || null,
    shopId: selectedSignal?.shop_id,
    shopName: selectedSignal?.shop_name,
    marketId: selectedSignal?.market_id,
  };

  const recommendedPreview = summary?.manual_action_preview;
  const nextCandidate = summary?.next_unhandled_candidate;
  const nextPreview = nextCandidate?.manual_action_preview;
  const nextSignalId = nextPreview?.signal_id || nextCandidate?.signal_id;
  const shouldUseNextUnhandled = shouldPreferNextUnhandledManualAction(summary);

  if (!shouldUseNextUnhandled && recommendedPreview?.signal_id === selectedSignalId) {
    return normalizeManualActionPreview(recommendedPreview, {
      ...selectedFallback,
      objectId: summary?.recommended_candidate?.stable_object_id || selectedFallback.objectId,
      objectLabel: summary?.recommended_candidate?.object_label || selectedFallback.objectLabel,
    });
  }

  if (nextSignalId === selectedSignalId) {
    return normalizeManualActionPreview(nextPreview, {
      objectType: nextCandidate?.object_type,
      objectId: nextCandidate?.stable_object_id || nextCandidate?.object_id,
      objectLabel: nextCandidate?.object_label || nextCandidate?.stable_object_id,
      shopId: nextCandidate?.shop_id || selectedFallback.shopId,
      shopName: nextCandidate?.shop_name || selectedFallback.shopName,
      marketId: nextCandidate?.market_id ?? selectedFallback.marketId,
    });
  }

  if (recommendedManualActionSignalId(summary) || nextUnhandledManualActionSignalId(summary)) {
    return null;
  }

  if (selectedFallback.objectId) {
    return {
      willWrite: false,
      actionType: "add_to_review",
      objectType: selectedFallback.objectType || "unknown",
      objectId: selectedFallback.objectId,
      objectLabel: selectedFallback.objectLabel || selectedFallback.objectId,
      shopId: selectedFallback.shopId ?? null,
      shopName: selectedFallback.shopName ?? null,
      marketId: selectedFallback.marketId ?? null,
      reviewWindows: ["7d", "14d"],
      preflightChecks: fallbackManualActionPreflightChecks(selectedFallback.objectType || "unknown", selectedFallback.objectId),
    };
  }

  return null;
}

function normalizeManualActionPreflightChecks(
  checks: {
    check_id?: string | null;
    label?: string | null;
    evidence?: string | null;
    required?: boolean | null;
  }[] | null | undefined,
  objectType?: string | null,
  objectId?: string | null,
): ManualActionPreflightCheck[] {
  const normalized = (checks ?? [])
    .map((check, index) => ({
      checkId: stringValue(check.check_id) || `check_${index + 1}`,
      label: stringValue(check.label),
      evidence: stringValue(check.evidence),
      required: check.required !== false,
    }))
    .filter((check) => check.label && check.evidence);
  return normalized.length ? normalized : fallbackManualActionPreflightChecks(objectType || "unknown", objectId || "当前对象");
}

function fallbackManualActionPreflightChecks(objectType?: string | null, objectId?: string | null): ManualActionPreflightCheck[] {
  const safeObjectType = stringValue(objectType) || "unknown";
  const safeObjectId = stringValue(objectId) || "当前对象";
  return [
    {
      checkId: "target_identity",
      label: "确认复盘对象",
      evidence: `${safeObjectType} / ${safeObjectId}`,
      required: true,
    },
    {
      checkId: "manual_action_boundary",
      label: "确认人工动作边界",
      evidence: "只记录人工判断，不自动调价、暂停、否词或加词。",
      required: true,
    },
  ];
}

export function manualActionTargetSummary(preview: RecommendedManualActionPreview | null | undefined): string {
  if (!preview) {
    return "当前信号暂无后端目标预检；点击前请先确认信号对象，真实留痕仍只由人工按钮触发。";
  }
  const shopText = preview.shopName || preview.shopId ? `店铺：${[preview.shopName, preview.shopId].filter(Boolean).join(" / ")}` : "店铺：待补充";
  const marketText = preview.marketId != null ? `站点：market_id ${preview.marketId}` : "站点：待补充";
  const objectLabel = preview.objectLabel || preview.objectId || "待确认";
  const objectTypeText = queueObjectTypeLabel[preview.objectType as NonNullable<SignalForUi["object_type"]>] ?? preview.objectType ?? "复盘对象";
  const windowLabel = preview.reviewWindows.map(reviewWindowText).filter(Boolean).join(" / ") || "7 天 / 14 天";
  const objectText = `复盘对象：${objectLabel}`;
  const objectIdentityText = `对象身份：${objectTypeText}`;
  const windowText = `复盘窗口：${windowLabel}`;
  return `${shopText}；${marketText}；${objectText}；${objectIdentityText}；${windowText}；只记录人工判断，不会自动执行广告动作。`;
}

export function manualActionQueueTargetSwitchSummary(
  summary: SignalTriageSummaryForUi | null | undefined,
  selectedSignalId?: string | null,
): ManualActionQueueTargetSwitchSummary | null {
  if (!summary?.recommended_manual_status?.has_manual_action || !summary.next_unhandled_candidate) return null;
  const recommended = summary.recommended_candidate;
  const nextCandidate = summary.next_unhandled_candidate;
  const nextPreview = nextCandidate.manual_action_preview;
  const recommendedLabel =
    stringValue(recommended?.object_label) ||
    stringValue(recommended?.stable_object_id) ||
    stringValue(recommended?.object_id) ||
    "推荐对象";
  const recommendedObjectText =
    objectIdentityDisplayText(
      stringValue(recommended?.object_type),
      stringValue(recommended?.stable_object_id || recommended?.object_id || recommendedLabel),
      recommendedLabel,
    ) || recommendedLabel;
  const nextSignalId = stringValue(nextPreview?.signal_id) || stringValue(nextCandidate.signal_id);
  const nextLabel =
    stringValue(nextPreview?.object_label) ||
    stringValue(nextCandidate.object_label) ||
    stringValue(nextCandidate.stable_object_id) ||
    stringValue(nextCandidate.object_id) ||
    "下一个未留痕候选";
  const nextObjectText =
    objectIdentityDisplayText(
      stringValue(nextPreview?.object_type || nextCandidate.object_type),
      stringValue(nextPreview?.object_id || nextCandidate.stable_object_id || nextCandidate.object_id || nextLabel),
      nextLabel,
    ) || nextLabel;
  const selectedIsRecommended = Boolean(selectedSignalId && selectedSignalId === stringValue(recommended?.signal_id));
  const selectedIsNext = Boolean(selectedSignalId && selectedSignalId === nextSignalId);
  const tone: ManualActionQueueTargetSwitchSummary["tone"] = selectedIsRecommended ? "blocked" : selectedIsNext ? "ready" : "waiting";
  const primary = selectedIsRecommended
    ? `当前选中 ${recommendedLabel}，它已经有人工留痕；右侧按钮不能继续写同一对象。`
    : selectedIsNext
      ? `当前选中 ${nextLabel}，这是下一个未留痕候选；只读预检通过后才允许人工确认。`
      : `${recommendedLabel} 已有人工留痕；当前可写候选已切换到 ${nextLabel}。`;
  return {
    title: "人工动作目标切换",
    tone,
    primary,
    diagnosisObject: `诊断推荐对象：${recommendedObjectText}`,
    writeTarget: `当前可写候选：${nextObjectText}`,
    boundary: "推荐对象和可写候选必须分开处理；不能把推荐对象的诊断证据写到另一个可写候选，也不能自动加词、否词、调价或暂停广告。",
  };
}

export function manualActionReviewRouteSplitSummary(
  summary: SignalTriageSummaryForUi | null | undefined,
  selectedSignalId?: string | null,
  readiness?: ManualActionRouteSplitReadinessForUi | null,
): ManualActionRouteSplitSummary | null {
  if (!summary?.recommended_manual_status?.has_manual_action || !summary.next_unhandled_candidate) return null;
  const switchSummary = manualActionQueueTargetSwitchSummary(summary, selectedSignalId);
  if (!switchSummary) return null;

  const status = summary.recommended_manual_status;
  const recommended = summary.recommended_candidate;
  const nextCandidate = summary.next_unhandled_candidate;
  const nextPreview = nextCandidate.manual_action_preview;
  const recommendedLabel =
    stringValue(status.object_label) ||
    stringValue(recommended?.object_label) ||
    stringValue(recommended?.stable_object_id) ||
    stringValue(status.object_id) ||
    stringValue(recommended?.object_id) ||
    "已留痕推荐对象";
  const nextLabel =
    stringValue(nextPreview?.object_label) ||
    stringValue(nextCandidate.object_label) ||
    stringValue(nextCandidate.stable_object_id) ||
    stringValue(nextCandidate.object_id) ||
    "下一个未留痕候选";
  const recommendedSignalId = stringValue(status.signal_id) || stringValue(recommended?.signal_id);
  const nextSignalId = stringValue(nextPreview?.signal_id) || stringValue(nextCandidate.signal_id);
  const selectedIsRecommended = Boolean(selectedSignalId && selectedSignalId === recommendedSignalId);
  const selectedIsNext = Boolean(selectedSignalId && selectedSignalId === nextSignalId);
  const manualActionCount = Math.max(0, status.manual_action_count ?? (status.has_manual_action ? 1 : 0));
  const reviewTodoCount = Math.max(0, status.review_todo_count ?? (status.has_review_todo ? 1 : 0));
  const windows = status.review_windows?.length ? status.review_windows.join(" / ") : "7d / 14d";
  const readinessTone = readiness?.tone === "ready" || readiness?.tone === "blocked" ? readiness.tone : "waiting";
  const nextTone: ManualActionRouteSplitRow["tone"] =
    readinessTone === "blocked" ? "blocked" : readinessTone === "ready" ? "ready" : "waiting";
  const tone: ManualActionRouteSplitSummary["tone"] = selectedIsRecommended ? "blocked" : selectedIsNext && nextTone === "ready" ? "ready" : "waiting";
  const currentWriteState = readiness?.currentState?.trim() || "当前：等待后端只读预检读回 ManualAction / ReviewTodo 计数";
  const expectedWriteState = readiness?.authorizedResult?.trim() || "授权后预期：人工点击后才生成 ManualAction 和 7/14 天 ReviewTodo";
  const evidenceState = readiness?.evidence?.trim() || "证据快照：等待只读预检确认，未确认前不能写入";
  const nextValue = readiness?.target?.trim()
    ? `${nextLabel} / ${readiness.target.replace(/^目标：/, "")}`
    : `${nextLabel} / 待后端只读预检`;
  const nextStep = selectedIsNext
    ? "当前选中待授权新对象：先核对预检、证据快照和对象身份，再由人工按钮授权。"
    : selectedIsRecommended
      ? "当前停在已留痕旧对象：不要重复写入，切到下一候选后再做只读预检。"
      : "当前未直接停在两条轨道之一：先确认信号队列选中对象，再判断是否进入人工按钮。";

  return {
    title: "人工确认双轨分流",
    tone,
    primary: `${recommendedLabel} 已进入人工留痕轨道；${nextLabel} 是待授权新轨道。两者不能互借证据或状态。`,
    rows: [
      {
        label: "已留痕旧对象",
        value: `${recommendedLabel} / ManualAction ${manualActionCount} 条 / ReviewTodo ${reviewTodoCount} 条`,
        detail: `这条轨道只说明已经记录人工判断，并等待 ${windows} 复盘；不能再把它当作当前可写对象。`,
        tone: "saved",
      },
      {
        label: "待授权新对象",
        value: nextValue,
        detail: `${currentWriteState}；${expectedWriteState}；${evidenceState}`,
        tone: nextTone,
      },
      {
        label: "人工下一步",
        value: selectedIsNext && nextTone === "ready" ? "可人工授权" : selectedIsRecommended ? "先切换候选" : "先确认选中对象",
        detail: nextStep,
        tone: selectedIsNext && nextTone === "ready" ? "ready" : "waiting",
      },
    ],
    boundary: `${switchSummary.boundary}；已留痕旧对象只进入复盘读回，待授权新对象只有人工点击后才写入 manual_actions 和 review_todos。${
      readiness?.boundary ? `；${readiness.boundary}` : ""
    }`,
  };
}

export function signalTriageSummaryText(summary: SignalTriageSummaryForUi | null | undefined): string {
  if (!summary) return "后端分诊摘要未加载。";
  const signalCount = summary.signal_status?.signal_count ?? 0;
  const candidateCount = summary.signal_status?.candidate_count ?? 0;
  if (summaryRequiresProductScope(summary)) {
    return `后端分诊：${signalCount} 条信号 / ${candidateCount} 个可处理候选；${summary.product_scope_gate?.message ?? "先选择 Parent ASIN / ASIN 经营对象。"}`;
  }
  if (summaryHasNoActionableCandidate(summary)) {
    const message = summary.actionability_status?.message ?? "当前经营对象暂无可行动候选，只能作为诊断视图。";
    return `后端分诊：${signalCount} 条信号 / ${candidateCount} 个可处理候选；${message}`;
  }
  const recommended =
    summary.recommended_candidate?.stable_object_id || summary.recommended_candidate?.object_label || "暂无推荐对象";
  const readyCount = summary.review_status?.ready_count ?? 0;
  const reviewText = readyCount > 0 ? `${readyCount} 个 ready 复盘` : "暂无 ready 复盘";
  const feedback = summary.review_status?.review_feedback;
  const feedbackSummary = (feedback?.total ?? 0) > 0 ? feedback?.summary?.trim().replace(/[。；;.\s]+$/, "") : "";
  const feedbackText = feedbackSummary ? `${reviewText}；复盘反馈：${feedbackSummary}` : reviewText;
  return `后端分诊：${signalCount} 条信号 / ${candidateCount} 个候选；建议先看 ${recommended}；${feedbackText}。`;
}

export function signalTriageReviewFeedbackText(summary: SignalTriageSummaryForUi | null | undefined): string | null {
  const feedback = summary?.review_status?.review_feedback;
  if (!feedback || (feedback.total ?? 0) <= 0) return null;
  const summaryText = feedback.summary?.trim().replace(/[。；;.\s]+$/, "");
  const ruleText = feedback.rule_feedback?.trim().replace(/[。；;.\s]+$/, "");
  if (!summaryText && !ruleText) return null;
  if (!ruleText) return `复盘反馈：${summaryText}。`;
  if (!summaryText) return `复盘反馈：${ruleText}。`;
  return `复盘反馈：${summaryText}；${ruleText}。`;
}

function buildReviewIdentityAuditSummary(
  audit: ReviewIdentityAuditForUi | null | undefined,
): ReviewIdentityAuditSummary | null {
  if (!audit) return null;

  const missingActionIdCount = audit.missing_action_id_count ?? 0;
  const missingObjectIdCount = audit.missing_object_id_count ?? 0;
  const missingReviewWindowCount = audit.missing_review_window_count ?? 0;
  const missingKeyCount = missingActionIdCount + missingObjectIdCount + missingReviewWindowCount;
  const missingEvidenceSnapshotCount = audit.missing_evidence_snapshot_count ?? 0;
  const missingDiagnosisPathCount = audit.missing_diagnosis_path_count ?? 0;
  const missingAiAdmissionCount = audit.missing_ai_admission_count ?? 0;
  const missingSearchTermBoundaryCount = audit.missing_search_term_boundary_count ?? 0;
  const missingPlacementBoundaryCount = audit.missing_placement_boundary_count ?? 0;
  const missingAdProductCoverageCount = audit.missing_ad_product_coverage_count ?? 0;
  const missingPlacementPerformanceCount = audit.missing_placement_performance_count ?? 0;
  const missingTargetingEvidenceCount = audit.missing_targeting_evidence_count ?? 0;
  const missingAdGroupSynthesisCount = audit.missing_ad_group_synthesis_count ?? 0;
  const missingAdGroupProductPerformanceCount = audit.missing_ad_group_product_performance_count ?? 0;
  const missingAbaContextCount = audit.missing_aba_context_count ?? 0;
  const missingEvidenceGapCount = audit.missing_evidence_gap_count ?? 0;
  const missingRequiredEvidenceCount = audit.missing_required_evidence_count ?? 0;
  const missingActionBoundaryCount = audit.missing_action_boundary_count ?? 0;
  const missingObjectReferenceCount = audit.missing_object_reference_count ?? 0;
  const missingObjectReviewChainCount =
    missingAdProductCoverageCount +
    missingPlacementPerformanceCount +
    missingTargetingEvidenceCount +
    missingAdGroupSynthesisCount +
    missingAbaContextCount +
    missingEvidenceGapCount +
    missingRequiredEvidenceCount +
    missingActionBoundaryCount;
  const missingEvidenceGateCount =
    missingEvidenceSnapshotCount +
    missingDiagnosisPathCount +
    missingAiAdmissionCount +
    missingSearchTermBoundaryCount +
    missingPlacementBoundaryCount +
    missingObjectReviewChainCount +
    missingObjectReferenceCount;
  const unstableObjectIdCount = audit.unstable_object_id_count ?? 0;
  const issueCount = audit.issues?.length ?? 0;
  const readyReviewCount = audit.ready_review_count ?? 0;
  const effectCount = audit.effect_count ?? 0;
  const earliestMetricDueDate = audit.earliest_metric_due_date?.trim() || "等待广告指标窗口";
  const earliestAnyDueDate = audit.earliest_any_due_date?.trim() || audit.earliest_due_date?.trim() || "";
  const dateBoundary =
    audit.date_boundary?.trim() ||
    (earliestAnyDueDate && earliestAnyDueDate !== earliestMetricDueDate
      ? `全部待办最早到期 ${earliestAnyDueDate}，但广告指标复盘以 ${earliestMetricDueDate} 为准`
      : "");
  const isBlocked = issueCount > 0 || missingKeyCount > 0 || missingEvidenceGateCount > 0 || unstableObjectIdCount > 0 || audit.status === "blocked";
  const statusText = isBlocked ? "读回身份存在阻塞" : "读回身份可审计";
  const saveText = audit.can_save_review_records_now
    ? "当前存在 ready 复盘，保存前仍需人工确认"
    : "当前不能保存复盘记录";
  const boundaryParts = [
    saveText,
    "ready_for_readback 只表示可按原动作读回对象，不表示复盘效果 ready",
    dateBoundary,
  ].filter(Boolean);

  return {
    title: "复盘读回身份门禁",
    status: isBlocked ? "blocked" : "ready",
    summary: `${statusText}；缺失 action_id / object_id / review_window：${missingActionIdCount} / ${missingObjectIdCount} / ${missingReviewWindowCount}；证据快照缺口：${missingEvidenceSnapshotCount} / 排查路径 ${missingDiagnosisPathCount} / AI 准入 ${missingAiAdmissionCount} / 搜索词边界 ${missingSearchTermBoundaryCount} / 广告位边界 ${missingPlacementBoundaryCount} / 对象复核链 ${missingObjectReviewChainCount}（广告商品覆盖 ${missingAdProductCoverageCount} / 广告位表现 ${missingPlacementPerformanceCount} / 投放词 ${missingTargetingEvidenceCount} / 广告组合流判断 ${missingAdGroupSynthesisCount} / 同组投放商品表现 ${missingAdGroupProductPerformanceCount} / ABA ${missingAbaContextCount} / 证据缺口 ${missingEvidenceGapCount} / 需要补证 ${missingRequiredEvidenceCount} / 动作边界 ${missingActionBoundaryCount}）/ 对象引用 ${missingObjectReferenceCount}；广告指标最早复盘：${earliestMetricDueDate}。`,
    boundary: `${boundaryParts.join("；")}。`,
    items: [
      { label: "待读回效果", value: `${effectCount}`, tone: effectCount > 0 ? "ready" : "neutral" },
      { label: "ready 复盘", value: `${readyReviewCount}`, tone: readyReviewCount > 0 ? "ready" : "waiting" },
      { label: "历史对象 ID 风险", value: `${unstableObjectIdCount}`, tone: unstableObjectIdCount > 0 ? "blocked" : "ready" },
      { label: "缺失键", value: `${missingKeyCount}`, tone: missingKeyCount > 0 ? "blocked" : "ready" },
      { label: "证据快照缺口", value: `${missingEvidenceGateCount}`, tone: missingEvidenceGateCount > 0 ? "blocked" : "ready" },
      {
        label: "对象复核链缺口",
        value: `${missingObjectReviewChainCount}`,
        tone: missingObjectReviewChainCount > 0 ? "blocked" : "ready",
      },
    ],
  };
}

function buildReviewQueueSeparationSummary(
  summary: SignalTriageSummaryForUi | null | undefined,
): ReviewQueueSeparationSummary | null {
  const waitSummary = summary?.review_status?.review_wait_summary;
  const readbackKeys = reviewReadbackKeys(summary?.review_status?.review_identity_audit?.readback_keys);
  const nextCandidate = summary?.next_unhandled_candidate;

  const reviewObjectLabel =
    waitSummary?.next_object_label?.trim() ||
    waitSummary?.next_object_id?.trim() ||
    readbackKeys[0]?.objectLabel ||
    readbackKeys[0]?.objectId ||
    "";
  const reviewObjectType = waitSummary?.next_object_type?.trim() || readbackKeys[0]?.objectType || "";
  const reviewObjectId = waitSummary?.next_object_id?.trim() || readbackKeys[0]?.objectId || "";
  const reviewObjectText = uniqueNonEmpty([reviewObjectType, reviewObjectLabel || reviewObjectId]).join(" / ");
  const reviewWindowTextValue = reviewReadbackWindowText(readbackKeys, waitSummary);
  const evidenceSnapshotText = reviewEvidenceSnapshotText(readbackKeys);

  const candidateObjectLabel =
    nextCandidate?.object_label?.trim() ||
    nextCandidate?.stable_object_id?.trim() ||
    nextCandidate?.object_id?.trim() ||
    "";
  const candidateObjectText = uniqueNonEmpty([nextCandidate?.object_type, candidateObjectLabel]).join(" / ");

  if (!reviewObjectText && !candidateObjectText) return null;

  const reviewIdentityKeys = normalizedIdentityKeys([
    reviewObjectId,
    reviewObjectLabel,
    ...readbackKeys.flatMap((key) => [key.objectId, key.objectLabel]),
  ]);
  const candidateIdentityKeys = normalizedIdentityKeys([
    nextCandidate?.object_id,
    nextCandidate?.stable_object_id,
    nextCandidate?.object_label,
  ]);
  const isSameObject =
    reviewIdentityKeys.length > 0 &&
    candidateIdentityKeys.length > 0 &&
    candidateIdentityKeys.some((key) => reviewIdentityKeys.includes(key));
  const relationText =
    reviewObjectText && candidateObjectText
      ? isSameObject
        ? "同一对象，先查重"
        : "不同对象，分开处理"
      : "对象待补齐";

  return {
    title: "复盘对象与候选队列",
    primary: `已加入复盘的是 ${reviewObjectText || "待识别对象"}；下一条待处理候选是 ${candidateObjectText || "暂无候选"}。`,
    boundary:
      "复盘对象只用于到期后读回处理效果；下一候选只用于下一次人工确认，二者不能混合归因，不能由页面自动加词、否词或调价。",
    items: [
      { label: "已加入复盘", value: reviewObjectText || "待识别", tone: reviewObjectText ? "waiting" : "blocked" },
      { label: "复盘窗口", value: reviewWindowTextValue || "待识别", tone: reviewWindowTextValue ? "waiting" : "blocked" },
      { label: "证据快照", value: evidenceSnapshotText, tone: evidenceSnapshotText.includes("待识别") ? "blocked" : "ready" },
      { label: "下一待处理", value: candidateObjectText || "暂无候选", tone: candidateObjectText ? "ready" : "neutral" },
      { label: "对象关系", value: relationText, tone: relationText === "不同对象，分开处理" ? "ready" : "waiting" },
    ],
  };
}

function reviewReadbackKeys(keys: unknown[] | null | undefined) {
  return (keys ?? [])
    .map((key) => {
      if (!key || typeof key !== "object") return null;
      const row = key as Record<string, unknown>;
      return {
        objectType: sourceText(row, "object_type"),
        objectId: sourceText(row, "object_id"),
        objectLabel: sourceText(row, "object_label"),
        reviewWindow: reviewWindowText(sourceText(row, "review_window")),
        dueDate: dateOnlyText(sourceText(row, "due_at") || sourceText(row, "due_date") || sourceText(row, "review_due_date")),
        evidenceSnapshotCount: sourceNumber(row, "evidence_snapshot_count"),
        hasDiagnosisPath: sourceBoolean(row, "has_diagnosis_path"),
        hasAiAdmission: sourceBoolean(row, "has_ai_admission"),
        hasSearchTermBoundary: sourceBoolean(row, "has_search_term_boundary"),
        hasPlacementBoundary: sourceBoolean(row, "has_placement_boundary"),
        hasParentAsinScope: sourceBoolean(row, "has_parent_asin_scope"),
        hasAdAsinCoverage: sourceBoolean(row, "has_ad_asin_coverage"),
        hasAdProductCoverage: sourceBoolean(row, "has_ad_product_coverage"),
        hasPlacementPerformance: sourceBoolean(row, "has_placement_performance"),
        hasTargetingEvidence: sourceBoolean(row, "has_targeting_evidence"),
        hasAdGroupSynthesis: sourceBoolean(row, "has_ad_group_synthesis"),
        hasAdGroupProductPerformance: sourceBoolean(row, "has_ad_group_product_performance"),
        hasAbaContext: sourceBoolean(row, "has_aba_context"),
        hasEvidenceGap: sourceBoolean(row, "has_evidence_gap"),
        hasRequiredEvidence: sourceBoolean(row, "has_required_evidence"),
        hasActionBoundary: sourceBoolean(row, "has_action_boundary"),
        hasObjectReference: sourceBoolean(row, "has_object_reference"),
      };
    })
    .filter((key): key is NonNullable<typeof key> => Boolean(key));
}

function reviewReadbackWindowText(
  readbackKeys: ReturnType<typeof reviewReadbackKeys>,
  waitSummary: NonNullable<NonNullable<SignalTriageSummaryForUi["review_status"]>["review_wait_summary"]> | null | undefined,
): string {
  const windows = uniqueNonEmpty(
    readbackKeys.map((key) => uniqueNonEmpty([key.reviewWindow, key.dueDate]).join(" ")),
  );
  if (windows.length > 0) return windows.join(" / ");
  const fallbackWindow = reviewWindowText(waitSummary?.next_review_window);
  const fallbackDue = dateOnlyText(waitSummary?.earliest_due_date);
  return uniqueNonEmpty([fallbackWindow, fallbackDue]).join(" ");
}

function reviewEvidenceSnapshotText(readbackKeys: ReturnType<typeof reviewReadbackKeys>): string {
  if (readbackKeys.length === 0) return "待识别";
  const snapshotCounts = readbackKeys.map((key) => key.evidenceSnapshotCount).filter((count) => count > 0);
  const hasBoundaryFields = readbackKeys.some(
    (key) =>
      key.hasDiagnosisPath !== null ||
      key.hasAiAdmission !== null ||
      key.hasSearchTermBoundary !== null ||
      key.hasPlacementBoundary !== null ||
      key.hasParentAsinScope !== null ||
      key.hasAdAsinCoverage !== null ||
      key.hasObjectReference !== null,
  );
  const searchTermKeys = readbackKeys.filter((key) => key.objectType === "search_term");
  const advertisedProductKeys = readbackKeys.filter((key) => key.objectType === "advertised_product");
  const placementKeys = readbackKeys.filter((key) => key.objectType === "placement");
  const hasSearchTermChainFields = searchTermKeys.some(
    (key) =>
      key.hasTargetingEvidence !== null ||
      key.hasParentAsinScope !== null ||
      key.hasAdAsinCoverage !== null ||
      key.hasAdGroupSynthesis !== null ||
      key.hasAdGroupProductPerformance !== null ||
      key.hasAbaContext !== null ||
      key.hasEvidenceGap !== null ||
      key.hasRequiredEvidence !== null ||
      key.hasActionBoundary !== null,
  );
  const allSearchTermChainComplete =
    searchTermKeys.length === 0 ||
    (hasSearchTermChainFields &&
      searchTermKeys.every(
        (key) =>
          key.hasTargetingEvidence === true &&
          key.hasParentAsinScope === true &&
          key.hasAdAsinCoverage === true &&
          key.hasAdGroupSynthesis === true &&
          key.hasAdGroupProductPerformance === true &&
          key.hasAbaContext === true &&
          key.hasEvidenceGap === true &&
          key.hasRequiredEvidence === true &&
          key.hasActionBoundary === true,
      ));
  const hasSearchTermChainGap =
    hasSearchTermChainFields &&
    searchTermKeys.some(
      (key) =>
        key.hasTargetingEvidence === false ||
        key.hasParentAsinScope === false ||
        key.hasAdAsinCoverage === false ||
        key.hasAdGroupSynthesis === false ||
        key.hasAdGroupProductPerformance === false ||
        key.hasAbaContext === false ||
        key.hasEvidenceGap === false ||
        key.hasRequiredEvidence === false ||
        key.hasActionBoundary === false,
    );
  const hasAdvertisedProductChainFields = advertisedProductKeys.some(
    (key) =>
      key.hasAdProductCoverage !== null ||
      key.hasAdGroupSynthesis !== null ||
      key.hasAdGroupProductPerformance !== null ||
      key.hasEvidenceGap !== null ||
      key.hasRequiredEvidence !== null ||
      key.hasActionBoundary !== null,
  );
  const allAdvertisedProductChainComplete =
    advertisedProductKeys.length === 0 ||
    (hasAdvertisedProductChainFields &&
      advertisedProductKeys.every(
        (key) =>
          key.hasAdProductCoverage === true &&
          key.hasAdGroupSynthesis === true &&
          key.hasAdGroupProductPerformance === true &&
          key.hasEvidenceGap === true &&
          key.hasRequiredEvidence === true &&
          key.hasActionBoundary === true,
      ));
  const hasAdvertisedProductChainGap =
    hasAdvertisedProductChainFields &&
    advertisedProductKeys.some(
      (key) =>
        key.hasAdProductCoverage === false ||
        key.hasAdGroupSynthesis === false ||
        key.hasAdGroupProductPerformance === false ||
        key.hasEvidenceGap === false ||
        key.hasRequiredEvidence === false ||
        key.hasActionBoundary === false,
    );
  const hasPlacementChainFields = placementKeys.some(
    (key) =>
      key.hasPlacementPerformance !== null ||
      key.hasEvidenceGap !== null ||
      key.hasRequiredEvidence !== null ||
      key.hasActionBoundary !== null,
  );
  const allPlacementChainComplete =
    placementKeys.length === 0 ||
    (hasPlacementChainFields &&
      placementKeys.every(
        (key) =>
          key.hasPlacementPerformance === true &&
          key.hasEvidenceGap === true &&
          key.hasRequiredEvidence === true &&
          key.hasActionBoundary === true,
      ));
  const hasPlacementChainGap =
    hasPlacementChainFields &&
    placementKeys.some(
      (key) =>
        key.hasPlacementPerformance === false ||
        key.hasEvidenceGap === false ||
        key.hasRequiredEvidence === false ||
        key.hasActionBoundary === false,
    );
  const hasObjectReviewChainGap = hasSearchTermChainGap || hasAdvertisedProductChainGap || hasPlacementChainGap;
  const hasObjectReviewChainKeys = searchTermKeys.length > 0 || advertisedProductKeys.length > 0 || placementKeys.length > 0;
  const allObjectReviewChainsComplete =
    hasObjectReviewChainKeys &&
    allSearchTermChainComplete &&
    allAdvertisedProductChainComplete &&
    allPlacementChainComplete;
  const allBoundariesComplete =
    hasBoundaryFields &&
    readbackKeys.every(
      (key) =>
        key.hasDiagnosisPath === true &&
        key.hasAiAdmission === true &&
        key.hasSearchTermBoundary === true &&
        key.hasPlacementBoundary === true &&
        key.hasObjectReference !== false,
    );
  const hasBoundaryGap =
    hasBoundaryFields &&
    readbackKeys.some(
      (key) =>
        key.hasDiagnosisPath === false ||
        key.hasAiAdmission === false ||
        key.hasSearchTermBoundary === false ||
        key.hasPlacementBoundary === false ||
        key.hasObjectReference === false,
    );
  const hasObjectReferenceGap = readbackKeys.some((key) => key.hasObjectReference === false);
  const boundaryText = hasObjectReferenceGap
    ? " / 对象引用缺口"
    : hasObjectReviewChainGap
      ? " / 对象复核链缺口"
      : allBoundariesComplete
        ? allObjectReviewChainsComplete
          ? " / 对象复核链齐全"
          : " / 基础边界齐全"
        : hasBoundaryGap
          ? " / 关键边界缺口"
          : "";
  if (snapshotCounts.length === 0) return `${readbackKeys.length} 个待办 / 待识别证据${boundaryText}`;
  return `${readbackKeys.length} 个待办 / ${Math.max(...snapshotCounts)} 条证据${boundaryText}`;
}

function normalizedIdentityKeys(values: Array<string | null | undefined>): string[] {
  return uniqueNonEmpty(values).map((value) => value.toLowerCase());
}

function dateOnlyText(value: string | null | undefined): string {
  const text = value?.trim() || "";
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text;
}

export function buildReviewReadinessGateSummary(
  summary: SignalTriageSummaryForUi | null | undefined,
): ReviewReadinessGateSummary | null {
  const status = summary?.review_status;
  if (!status) return null;

  const identityAudit = buildReviewIdentityAuditSummary(status.review_identity_audit);
  const queueSeparation = buildReviewQueueSeparationSummary(summary);
  const manualActionCount = status.manual_action_count ?? 0;
  const reviewRecordCount = status.review_record_count ?? status.review_feedback?.total ?? 0;
  const readyCount = status.ready_count ?? 0;
  const notReadyCount = status.not_ready_count ?? 0;
  const waitSummary = status.review_wait_summary;
  const waitStatus = waitSummary?.status?.trim() || "";
  const isReviewEvidenceGateBlocked =
    waitStatus === "blocked_by_review_evidence_gap" || identityAudit?.status === "blocked";
  const earliestDueDate = waitSummary?.earliest_due_date?.trim() || "等待窗口";
  const nextReviewWindow = reviewWindowText(waitSummary?.next_review_window);
  const nextObjectLabel = waitSummary?.next_object_label || waitSummary?.next_object_id;
  const nextObject = uniqueNonEmpty([waitSummary?.next_object_type, nextObjectLabel]).join(" / ");
  const waitForbiddenActions = uniqueNonEmpty(waitSummary?.forbidden_actions ?? []);
  const defaultForbiddenActions =
    isReviewEvidenceGateBlocked || (waitStatus && waitStatus !== "waiting_review_window")
      ? ["不保存复盘结论", "不自动改规则", "不自动执行广告动作"]
      : ["不拉取快照", "不保存复盘结论", "不自动改规则", "不自动执行广告动作"];
  const forbiddenActions = waitForbiddenActions.length
    ? waitForbiddenActions
    : defaultForbiddenActions;
  const forbiddenActionText = forbiddenActions.join("、");

  if (readyCount > 0) {
    const nextStep = status.rule_improvement?.next_step?.trim() || "先人工确认 ready 复盘，再保存 review_records。";
    return {
      title: "复盘可保存门槛",
      status: "ready",
      primary: `已有 ${readyCount} 个 ready 复盘，保存前仍需人工确认。`,
      detail: nextStep,
      boundary: "ready 只表示窗口数据满足预检，仍需人工确认并手动保存 review_records；不自动改规则，不自动执行广告动作。",
      identityAudit,
      queueSeparation,
      items: [
        { label: "人工留痕", value: `${manualActionCount} 条`, tone: manualActionCount > 0 ? "ready" : "neutral" },
        { label: "已存复盘", value: `${reviewRecordCount} 条`, tone: reviewRecordCount > 0 ? "ready" : "waiting" },
        { label: "ready 复盘", value: `${readyCount} 个`, tone: "ready" },
        { label: "未就绪", value: `${notReadyCount} 个`, tone: notReadyCount > 0 ? "waiting" : "neutral" },
      ],
      nextSteps: [
        { label: "现在", detail: "先人工核对 ready 复盘的对象、窗口、指标和证据，不自动执行广告动作。" },
        { label: "保存", detail: "确认无误后手动保存 review_records，才形成处理有效、无变化或恶化的复盘结论。" },
        { label: "沉淀", detail: "保存后的样本仅进入人工规则复核和解释口径优化，不自动改规则。" },
      ],
    };
  }

  if (manualActionCount > 0 && (isReviewEvidenceGateBlocked || (waitStatus && waitStatus !== "waiting_review_window"))) {
    const gapReasons = uniqueNonEmpty(waitSummary?.gap_reasons ?? []);
    const gapReasonText =
      gapReasons.join("；") ||
      waitSummary?.message?.trim() ||
      status.rule_improvement?.reason?.trim() ||
      identityAudit?.summary?.trim() ||
      "当前没有 ready 复盘效果，处理前后指标证据仍不足。";
    const rawNextStep =
      waitSummary?.next_step?.trim() ||
      status.rule_improvement?.next_step?.trim() ||
      (isReviewEvidenceGateBlocked
        ? "先 dry-run 作废旧待办，再重新人工留痕生成完整证据快照；必须包含排查路径、AI 准入、搜索词边界、广告位边界、投放词证据、广告组合流判断、同组投放商品表现、ABA 背景、证据缺口、需要补证和动作边界，不能用当前页面证据伪装成历史点击证据，不能补写历史 evidence_snapshot。"
        : "先补齐复盘所需的处理前后广告指标快照，再只读检查 ready 状态。");
    const nextStep = isReviewEvidenceGateBlocked ? reviewEvidenceGateRepairStep(rawNextStep) : rawNextStep;
    const gapStatusText =
      waitStatus === "blocked_by_data_gap"
        ? "证据不足"
        : isReviewEvidenceGateBlocked
          ? "证据门禁阻断"
          : waitStatus;
    return {
      title: isReviewEvidenceGateBlocked
        ? "复盘证据门禁阻断"
        : waitStatus === "blocked_by_data_gap"
          ? "复盘证据缺口"
          : "复盘输入未就绪",
      status: "blocked",
      primary: isReviewEvidenceGateBlocked
        ? `已有 ${manualActionCount} 条人工留痕，但复盘读回门禁未通过；当前不能保存复盘结论。`
        : `已有 ${manualActionCount} 条人工留痕，但 ready 复盘 ${readyCount} 个；当前不能保存复盘结论。`,
      detail: gapReasonText,
      boundary: isReviewEvidenceGateBlocked
        ? `缺 evidence_snapshot、排查路径、AI 准入、搜索词边界、广告位边界、投放词证据、广告组合流判断、同组投放商品表现、ABA 背景、证据缺口、需要补证或动作边界时，不能把当前页面证据伪装成历史点击证据；当前${forbiddenActionText}。`
        : `not_ready 只说明证据不足，不能证明处理有效或无效；当前${forbiddenActionText}。`,
      identityAudit,
      queueSeparation,
      items: [
        { label: "人工留痕", value: `${manualActionCount} 条`, tone: "ready" },
        { label: "已存复盘", value: `${reviewRecordCount} 条`, tone: reviewRecordCount > 0 ? "ready" : "waiting" },
        { label: "ready 复盘", value: `${readyCount} 个`, tone: "blocked" },
        { label: "未就绪", value: `${notReadyCount} 个`, tone: notReadyCount > 0 ? "blocked" : "neutral" },
        { label: "缺口状态", value: gapStatusText, tone: "blocked" },
      ],
      nextSteps: [
        { label: "现在", detail: `先确认复盘缺口：${gapReasonText}` },
        { label: "补证据", detail: nextStep },
        { label: "ready 后", detail: "只有出现 ready 复盘后，才人工核对并保存 review_records；不自动改规则或执行广告动作。" },
      ],
    };
  }

  if (manualActionCount > 0) {
    const detailParts = uniqueNonEmpty([
      waitSummary?.message,
      nextObject ? `下一项：${nextObject}` : null,
      nextReviewWindow ? `下一窗口：${nextReviewWindow}` : null,
      waitSummary?.next_step,
    ]);
    const nextReviewTargetText = nextObject ? ` ${nextObject}` : "下一广告对象";
    const nextWindowText = nextReviewWindow ? ` ${nextReviewWindow}` : "广告指标";
    return {
      title: "复盘等待窗口",
      status: "waiting",
      primary: `已有 ${manualActionCount} 条人工留痕，ready 复盘 ${readyCount} 个，最早广告复盘 ${earliestDueDate} 后再复核。`,
      detail: detailParts.join("；") || "人工动作已记录，等待 7/14 天窗口形成可比较的前后指标。",
      boundary: `未到期前${forbiddenActionText}。`,
      identityAudit,
      queueSeparation,
      items: [
        { label: "人工留痕", value: `${manualActionCount} 条`, tone: "ready" },
        { label: "已存复盘", value: `${reviewRecordCount} 条`, tone: reviewRecordCount > 0 ? "ready" : "waiting" },
        { label: "最早广告复盘", value: earliestDueDate, tone: "waiting" },
        { label: "下一窗口", value: nextReviewWindow || "待识别", tone: nextReviewWindow ? "waiting" : "blocked" },
        { label: "下一广告对象", value: nextObject || "待识别", tone: nextObject ? "waiting" : "blocked" },
        { label: "未就绪", value: `${notReadyCount} 个`, tone: notReadyCount > 0 ? "waiting" : "neutral" },
      ],
      nextSteps: [
        { label: "现在", detail: `查看当前人工留痕和复盘待办，未到期前${forbiddenActionText}。` },
        { label: "到期后", detail: `${earliestDueDate} 后只读检查${nextReviewTargetText} 的${nextWindowText}复盘效果，确认处理前后窗口是否完整。` },
        { label: "ready 后", detail: "出现 ready 复盘后，人工确认后再保存 review_records；仍不自动改规则或执行广告动作。" },
      ],
    };
  }

  return {
    title: "复盘输入不足",
    status: "empty",
    primary: "暂无人工留痕，尚不能形成 7/14 天复盘。",
    detail: "先完成可行动候选的人工确认，并生成 review_todos 后再进入效果复盘。",
    boundary: "没有 manual_actions 就不能保存 review_records；不自动改规则，不自动执行广告动作。",
    identityAudit,
    queueSeparation,
    items: [
      { label: "人工留痕", value: "0 条", tone: "blocked" },
      { label: "已存复盘", value: `${reviewRecordCount} 条`, tone: reviewRecordCount > 0 ? "ready" : "neutral" },
      { label: "ready 复盘", value: "0 个", tone: "blocked" },
      { label: "未就绪", value: `${notReadyCount} 个`, tone: notReadyCount > 0 ? "waiting" : "neutral" },
    ],
    nextSteps: [
      { label: "现在", detail: "先选择通过准入的可行动候选，并查看后端只读预检证据。" },
      { label: "人工确认", detail: "人工点击后只保存 manual_actions 和 7/14 天 review_todos，不保存复盘结论。" },
      { label: "后续", detail: "等复盘窗口完整后再检查 ready 状态；不自动改规则，不自动执行广告动作。" },
    ],
  };
}

function reviewEvidenceGateRepairStep(value: string): string {
  const text = value.trim();
  const hasCompleteSnapshot = text.includes("完整证据快照");
  const hasSearchBoundary = text.includes("搜索词边界");
  const hasPlacementBoundary = text.includes("广告位边界");
  const hasTargetingEvidence = text.includes("投放词证据");
  const hasAdGroupSynthesis = text.includes("广告组合流判断");
  const hasAdGroupProductPerformance = text.includes("同组投放商品表现");
  const hasAbaContext = text.includes("ABA 背景");
  const hasEvidenceGap = text.includes("证据缺口");
  const hasRequiredEvidence = text.includes("需要补证");
  const hasActionBoundary = text.includes("动作边界");
  const hasPatchPolicy = text.includes("不能静默补写历史 evidence_snapshot");
  if (
    hasCompleteSnapshot &&
    hasSearchBoundary &&
    hasPlacementBoundary &&
    hasTargetingEvidence &&
    hasAdGroupSynthesis &&
    hasAdGroupProductPerformance &&
    hasAbaContext &&
    hasEvidenceGap &&
    hasRequiredEvidence &&
    hasActionBoundary &&
    hasPatchPolicy
  ) {
    return text;
  }
  const base = text.replace(/[。；;.\s]+$/, "");
  const patchPolicyText = hasPatchPolicy ? null : "不能静默补写历史 evidence_snapshot";
  const snapshotText =
    hasCompleteSnapshot &&
    hasSearchBoundary &&
    hasPlacementBoundary &&
    hasTargetingEvidence &&
    hasAdGroupSynthesis &&
    hasAdGroupProductPerformance &&
    hasAbaContext &&
    hasEvidenceGap &&
    hasRequiredEvidence &&
    hasActionBoundary
      ? null
      : "重新人工留痕必须形成完整证据快照，包含排查路径、AI 准入、搜索词边界、广告位边界、投放词证据、广告组合流判断、同组投放商品表现、ABA 背景、证据缺口、需要补证和动作边界";
  return `${uniqueNonEmpty([base, patchPolicyText, snapshotText]).join("；")}。`;
}

export function buildReviewEvidenceRepairSummary(
  payload: ReviewEvidenceRepairPayloadForUi | null | undefined,
): ReviewEvidenceRepairSummary | null {
  if (!payload) return null;

  const counts = payload.counts ?? {};
  const legacyGapCount = counts.legacy_action_gap_count ?? 0;
  const reviewTodoCount = counts.review_todos ?? 0;
  const repairIssueCount = counts.repair_issue_count ?? 0;
  const previewRebuildableCount = counts.preview_rebuildable_count ?? 0;
  const recreatableCount = counts.recreatable_count ?? 0;
  const hasLegacyGap = payload.status === "blocked_by_legacy_evidence_gap" || legacyGapCount > 0;
  const hasReviewEvidenceGateGap = payload.rule_improvement_status === "blocked_by_review_evidence_gap";
  const forbiddenEffects = uniqueNonEmpty(payload.forbidden_effects ?? []);
  const boundary =
    `只读预览 will_write=${payload.will_write === true ? "true" : "false"}；` +
    "不能补写历史 evidence_snapshot，不能保存 ReviewRecord，不能自动执行广告动作。";
  const sampleItems = (payload.items ?? [])
    .slice(0, 3)
    .map((item) => {
      const objectText =
        objectIdentityDisplayText(item.object_type, item.object_id, item.object_label) ||
        uniqueNonEmpty([item.object_type, item.object_label || item.object_id]).join(" / ") ||
        "历史待办对象";
      const windows = uniqueNonEmpty(item.review_windows ?? []).join(" / ") || "复盘窗口待识别";
      const action = item.action_id ? `动作 ${item.action_id}` : "历史动作";
      const nextStep = item.recommended_next_step?.trim() || "需要先 dry-run 作废旧待办，再重新人工留痕。";
      const issueText = reviewRepairIssueText(item.issue_types);
      const preflightText = reviewRepairPreflightText(item);
      const patchPolicy =
        item.patch_policy?.trim() || (item.can_patch_legacy_record === false ? "历史记录不能静默 patch" : "");
      const voidPlanText = reviewRepairVoidPlanText(item);
      return uniqueNonEmpty([
        `${objectText}；${windows}；${action}`,
        issueText,
        preflightText,
        patchPolicy,
        nextStep,
        voidPlanText,
      ]).join("；");
    });
  const voidPlanItems = (payload.items ?? [])
    .slice(0, 3)
    .map(reviewRepairVoidPlanItem)
    .filter((item): item is ReviewEvidenceRepairVoidPlanSummary => item !== null);

  if (!hasLegacyGap && hasReviewEvidenceGateGap) {
    return {
      title: "历史待办治理",
      status: "blocked",
      primary: "旧证据快照没有整份缺失，但对象复核链仍被复盘证据门禁阻断。",
      detail:
        "当前缺口不是 legacy evidence_snapshot 为空，而是旧快照缺少对象复核链标签；具体缺口以“复盘证据门禁阻断”为准，不能保存 ReviewRecord。",
      boundary,
      items: [
        { label: "历史缺口动作", value: "0 个", tone: "ready" },
        { label: "复盘待办", value: `${reviewTodoCount} 条`, tone: reviewTodoCount > 0 ? "blocked" : "neutral" },
        { label: "对象复核链", value: "阻断", tone: "blocked" },
        { label: "可自动执行广告", value: "0 项", tone: "ready" },
      ],
      nextSteps: [
        { label: "先看门禁", detail: "回到复盘证据门禁，核对缺少的是广告商品覆盖、广告位表现、投放词证据、广告组合流判断、同组投放商品表现、ABA 背景、证据缺口、需要补证还是动作边界。" },
        { label: "治理方式", detail: "当前可落地路径是 dry-run 作废旧待办，再重新人工留痕；不能静默补写历史 evidence_snapshot。" },
        { label: "保存限制", detail: "复核链补齐并出现 ready 复盘前，不保存 ReviewRecord，不自动改规则，不执行广告动作。" },
      ],
      sampleItems: forbiddenEffects,
      voidPlanItems,
    };
  }

  if (!hasLegacyGap) {
    return {
      title: "历史待办治理",
      status: "ready",
      primary: "当前没有历史证据快照缺口。",
      detail: payload.next_action?.trim() || "继续等待复盘窗口；未到期前不保存 ReviewRecord。",
      boundary,
      items: [
        { label: "历史缺口动作", value: "0 个", tone: "ready" },
        { label: "复盘待办", value: `${reviewTodoCount} 条`, tone: reviewTodoCount > 0 ? "waiting" : "neutral" },
        { label: "可静默补证据", value: "0 个", tone: "ready" },
        { label: "可自动执行广告", value: "0 项", tone: "ready" },
      ],
      nextSteps: [
        { label: "继续", detail: payload.next_action?.trim() || "等待复盘窗口到期后，再人工核对是否满足保存门槛。" },
      ],
      sampleItems,
      voidPlanItems,
    };
  }

  const primary = `发现 ${legacyGapCount} 个历史动作缺证据，影响 ${reviewTodoCount} 条复盘待办。`;
  const detail =
    payload.next_action?.trim() ||
    "当前信号不能直接重建同对象证据；需要先 dry-run 作废旧待办，再重新人工留痕。";
  return {
    title: "历史待办治理",
    status: "blocked",
    primary,
    detail,
    boundary,
    items: [
      { label: "历史缺口动作", value: `${legacyGapCount} 个`, tone: "blocked" },
      { label: "缺口问题", value: `${repairIssueCount} 个`, tone: repairIssueCount > 0 ? "blocked" : "neutral" },
      { label: "可重建预览", value: `${previewRebuildableCount} 个`, tone: previewRebuildableCount > 0 ? "waiting" : "blocked" },
      { label: "可重新留痕", value: `${recreatableCount} 个`, tone: recreatableCount > 0 ? "waiting" : "blocked" },
    ],
    nextSteps: [
      { label: "核对", detail: "先核对 action_id、对象 ID、7/14 天窗口，以及缺的是排查路径、AI 准入、搜索词边界、广告位边界还是广告组合流判断。" },
      { label: "补证边界", detail: "可重建预览只作为人工核对参考；当前不提供补写历史 evidence_snapshot 的执行入口，已有旧留痕时不能重复写入绕过门禁。" },
      { label: "dry-run", detail: "先按卡片中的 dry-run 命令做只读预检；真实作废必须显式带授权码，页面不能静默补写历史 evidence_snapshot。" },
      { label: "复盘", detail: "作废旧待办不等于复盘完成；需要新的人工留痕生成带证据的 ReviewTodo 后再等窗口复盘。" },
    ],
    sampleItems: sampleItems.length ? sampleItems : forbiddenEffects,
    voidPlanItems,
  };
}

function reviewRepairIssueText(issueTypes: string[] | null | undefined): string {
  const labels: Record<string, string> = {
    missing_evidence_snapshot: "缺 evidence_snapshot",
    missing_diagnosis_path: "缺排查路径",
    missing_ai_admission: "缺 AI 准入",
    missing_search_term_boundary: "缺搜索词边界",
    missing_placement_boundary: "缺广告位边界",
    missing_ad_product_coverage: "缺广告商品覆盖",
    missing_placement_performance: "缺广告位表现",
    missing_targeting_evidence: "缺投放词证据",
    missing_ad_group_synthesis: "缺广告组合流判断",
    missing_ad_group_product_performance: "缺同组投放商品表现",
    missing_aba_context: "缺 ABA 背景",
    missing_evidence_gap: "缺证据缺口",
    missing_required_evidence: "缺需要补证",
    missing_action_boundary: "缺动作边界",
    evidence_snapshot_object_mismatch: "证据快照对象不一致",
    missing_action_id: "缺 action_id",
    missing_object_id: "缺 object_id",
    missing_review_window: "缺 review_window",
    unstable_object_id: "对象 ID 不稳定",
  };
  const values = uniqueNonEmpty(issueTypes ?? []).map((issue) => labels[issue] ?? issue);
  return values.length ? `证据缺口：${values.join(" / ")}` : "";
}

function reviewRepairPreflightText(
  item: NonNullable<ReviewEvidenceRepairPayloadForUi["items"]>[number],
): string {
  const preflight = item.current_preflight;
  const previewState = item.can_rebuild_evidence_preview ? "可重建证据预览" : "证据预览不可重建";
  const recreateState = item.can_recreate_from_current_signal ? "可重新人工留痕" : "当前不可重新留痕";
  const patchState = item.can_patch_legacy_record ? "可人工补证待确认" : "不可补写历史证据";
  const status = preflight?.status?.trim() ? `预检 ${preflight.status.trim()}` : "";
  const target = preflight?.target_matches_legacy === true ? "对象匹配旧待办" : preflight?.target_matches_legacy === false ? "对象不匹配旧待办" : "";
  const evidenceCount =
    typeof preflight?.evidence_snapshot_item_count === "number"
      ? `当前预览 ${preflight.evidence_snapshot_item_count} 条证据`
      : "";
  const required = [
    preflight?.has_diagnosis_path === true ? "有排查路径" : preflight?.has_diagnosis_path === false ? "缺排查路径" : "",
    preflight?.has_ai_admission === true ? "有 AI 准入" : preflight?.has_ai_admission === false ? "缺 AI 准入" : "",
    preflight?.has_search_term_boundary === true
      ? "有搜索词边界"
      : preflight?.has_search_term_boundary === false
        ? "缺搜索词边界"
        : "",
    preflight?.has_placement_boundary === true
      ? "有广告位边界"
      : preflight?.has_placement_boundary === false
        ? "缺广告位边界"
        : "",
    preflight?.has_parent_asin_scope === true
      ? "有 Parent ASIN入口"
      : preflight?.has_parent_asin_scope === false
        ? "缺 Parent ASIN入口"
        : "",
    preflight?.has_ad_asin_coverage === true
      ? "有广告 ASIN承接"
      : preflight?.has_ad_asin_coverage === false
        ? "缺广告 ASIN承接"
        : "",
    preflight?.has_ad_product_coverage === true
      ? "有广告商品覆盖"
      : preflight?.has_ad_product_coverage === false
        ? "缺广告商品覆盖"
        : "",
    preflight?.has_placement_performance === true
      ? "有广告位表现"
      : preflight?.has_placement_performance === false
        ? "缺广告位表现"
        : "",
    preflight?.has_targeting_evidence === true
      ? "有投放词证据"
      : preflight?.has_targeting_evidence === false
        ? "缺投放词证据"
        : "",
    preflight?.has_ad_group_synthesis === true
      ? "有广告组合流判断"
      : preflight?.has_ad_group_synthesis === false
        ? "缺广告组合流判断"
        : "",
    preflight?.has_ad_group_product_performance === true
      ? "有同组投放商品表现"
      : preflight?.has_ad_group_product_performance === false
        ? "缺同组投放商品表现"
        : "",
    preflight?.has_aba_context === true
      ? "有 ABA 背景"
      : preflight?.has_aba_context === false
        ? "缺 ABA 背景"
        : "",
    preflight?.has_evidence_gap === true
      ? "有证据缺口"
      : preflight?.has_evidence_gap === false
        ? "缺证据缺口"
        : "",
    preflight?.has_required_evidence === true
      ? "有需要补证"
      : preflight?.has_required_evidence === false
        ? "缺需要补证"
        : "",
    preflight?.has_action_boundary === true
      ? "有动作边界"
      : preflight?.has_action_boundary === false
        ? "缺动作边界"
        : "",
    preflight?.has_object_reference === true
      ? "对象引用可回看"
      : preflight?.has_object_reference === false
        ? "对象引用错配"
        : "",
  ];
  const missingLabels = uniqueNonEmpty(preflight?.missing_required_labels ?? []);
  const missing = missingLabels.length ? `当前预览仍缺：${missingLabels.join(" / ")}` : "";
  return uniqueNonEmpty([
    `当前预检：${previewState} / ${recreateState} / ${patchState}`,
    status,
    target,
    evidenceCount,
    ...required,
    missing,
  ]).join("；");
}

function reviewRepairVoidPlanText(item: NonNullable<ReviewEvidenceRepairPayloadForUi["items"]>[number]): string {
  const planItem = reviewRepairVoidPlanItem(item);
  if (!planItem) return "";
  return uniqueNonEmpty([
    planItem.statusText,
    `作废对象：${planItem.objectText}`,
    `复盘窗口：${planItem.reviewWindows}`,
    `作废后：${planItem.afterVoidText}`,
    `重新留痕：${planItem.recreateText}`,
    planItem.authorizationCode ? `授权码 ${planItem.authorizationCode}` : "",
    planItem.dryRunCommand ? `dry-run：${planItem.dryRunCommand}` : "",
    planItem.boundary,
  ]).join("；");
}

function reviewRepairVoidPlanItem(
  item: NonNullable<ReviewEvidenceRepairPayloadForUi["items"]>[number],
): ReviewEvidenceRepairVoidPlanSummary | null {
  const voidPlan = item.void_plan;
  if (!voidPlan) return null;
  const actionId = voidPlan.action_id?.trim() || item.action_id?.trim() || "";
  const statusText = reviewRepairVoidPlanStatusText(voidPlan.status);
  const objectType = voidPlan.expected_object_type || item.object_type;
  const objectId = voidPlan.expected_object_id || item.object_id;
  const objectText =
    objectIdentityDisplayText(objectType, objectId, item.object_label) ||
    uniqueNonEmpty([voidPlan.expected_object_type, voidPlan.expected_object_id]).join(" / ") ||
    uniqueNonEmpty([item.object_type, item.object_id]).join(" / ");
  const reviewWindows =
    uniqueNonEmpty([...(voidPlan.review_windows ?? []), voidPlan.review_window, ...(item.review_windows ?? [])]).join(" / ") ||
    "复盘窗口待识别";
  const authorizationCode = voidPlan.required_authorization_code?.trim() ?? "";
  const dryRunCommand = voidPlan.dry_run_command?.trim() ?? "";
  const boundary = voidPlan.boundary?.trim() ?? "";
  const afterVoidText = reviewRepairAfterVoidText(voidPlan.expected_object_type || item.object_type);
  const recreateText = reviewRepairRecreateText(voidPlan.expected_object_type || item.object_type);
  if (!uniqueNonEmpty([actionId, objectText, reviewWindows, authorizationCode, dryRunCommand, boundary]).length) {
    return null;
  }
  return {
    actionId: actionId || "历史动作待识别",
    statusText,
    objectText: objectText || "作废对象待识别",
    reviewWindows,
    authorizationCode,
    dryRunCommand,
    afterVoidText,
    recreateText,
    boundary,
  };
}

function reviewRepairVoidPlanStatusText(status: string | null | undefined): string {
  const value = status?.trim();
  if (value === "dry_run_available") return "dry-run 可预检；真实作废未执行";
  if (value === "missing_action_id") return "缺 action_id，不能预检作废";
  return value ? `作废计划状态：${value}` : "作废计划状态待识别";
}

function reviewRepairAfterVoidText(objectType: string | null | undefined): string {
  const prefix = objectType?.trim() === "search_term" ? "搜索词旧待办作废后" : "旧待办作废后";
  return `${prefix}仍不是复盘完成；需要重新跑人工动作预检，确认 duplicate 阻挡已清掉。`;
}

function reviewRepairRecreateText(objectType: string | null | undefined): string {
  if (objectType?.trim() === "search_term") {
    return "重新点击“加入复盘”时必须保存新的 ManualAction 和 7d / 14d ReviewTodo，并带排查路径、AI 准入、搜索词边界、广告位边界、广告组合流、投放词、ABA、证据缺口和动作边界。";
  }
  return "重新点击人工动作时必须保存新的 ManualAction 和 7d / 14d ReviewTodo；不能补写旧 evidence_snapshot。";
}

function reviewWindowText(window: string | null | undefined): string {
  const value = window?.trim();
  if (!value) return "";
  const labels: Record<string, string> = { "7d": "7 天", "14d": "14 天" };
  return labels[value] ?? value;
}

export function buildRuleFeedbackPrioritySummary(summary: SignalTriageSummaryForUi | null | undefined): RuleFeedbackPrioritySummary | null {
  const feedback = summary?.review_status?.review_feedback;
  const closureChecklist = (feedback?.closure_checklist ?? []).map(ruleFeedbackClosureCheckText);
  if (!feedback || ((feedback.total ?? 0) <= 0 && closureChecklist.length === 0)) return null;
  const savedRecordCount = feedback.total ?? 0;
  const bySignalType = feedback.by_signal_type ?? {};
  const signalTypeText = formatOrderedCounts(bySignalType, ["opportunity", "anomaly", "unknown"]) || "信号类型维度待补齐";
  const byResult = feedback.by_result ?? {};
  const pendingSources = (feedback.pending_source_candidates ?? []).slice(0, 5).map(ruleFeedbackPendingSourceText);
  if (savedRecordCount <= 0) {
    const readyReviewCount = summary?.review_status?.ready_count ?? 0;
    const actionBoundary =
      readyReviewCount > 0
        ? "当前只能补齐人工动作证据、人工核对已 ready 复盘并保存复盘记录；不自动改规则，不自动执行广告动作。"
        : "当前只能补齐人工动作证据或等待复盘窗口；没有 ready 复盘前不保存复盘记录，不自动改规则，不自动执行广告动作。";
    return {
      title: "复盘样本池门槛",
      basis: "暂无已保存 ReviewRecord；这里只展示复盘输入证据和保存门槛，不形成规则反馈候选。",
      priority: "未保存复盘结论前，不能判断规则有效、无效或需要调整。",
      sampleSort: "worse / no_change / unclear / improved 的样本排序只在保存 ReviewRecord 后启用。",
      actionBoundary,
      closureChecklist,
      records: [],
      candidateGroups: [],
      pendingSources,
      boundary: "没有已保存 ReviewRecord 时，该区域只是门槛检查，不代表已有规则反馈样本池，不代表当前选中信号已 ready。",
    };
  }
  return {
    title: "已保存复盘样本池",
    basis: `来自已保存 ReviewRecord：${savedRecordCount} 条；信号类型：${signalTypeText}；复盘结果：${
      formatOrderedCounts(byResult, ["worse", "no_change", "unclear", "improved"]) || "待补齐"
    }。`,
    priority: ruleFeedbackPriorityText(byResult),
    sampleSort: feedback.sample_sort?.reason?.trim() || "样本按业务风险排序：worse / no_change / unclear / improved。",
    actionBoundary: ruleFeedbackActionBoundaryText(feedback.action_boundaries),
    closureChecklist,
    records: (feedback.records ?? []).slice(0, 5).map(ruleFeedbackRecordText),
    candidateGroups: (feedback.candidate_groups ?? []).slice(0, 5).map(ruleFeedbackCandidateGroupText),
    pendingSources,
    boundary: "该样本池只进入解释层和人工复核优先级，不代表当前选中信号已 ready，不自动改规则，不自动执行广告动作。",
  };
}

export function signalTriageCompactItems(summary: SignalTriageSummaryForUi | null | undefined): SignalTriageCompactItem[] {
  if (!summary) return [];
  const recommended =
    summary.recommended_candidate?.stable_object_id || summary.recommended_candidate?.object_label || "暂无";
  return [
    { label: "信号", value: String(summary.signal_status?.signal_count ?? 0), tone: "neutral" },
    { label: "候选", value: String(summary.signal_status?.candidate_count ?? 0), tone: "strong" },
    { label: "推荐", value: recommended, tone: recommended === "暂无" ? "neutral" : "strong" },
    { label: "ready 复盘", value: String(summary.review_status?.ready_count ?? 0), tone: "success" },
  ];
}

export function signalTriageBlockerTexts(summary: SignalTriageSummaryForUi | null | undefined): string[] {
  const blockers = summary?.blockers ?? [];
  const noReadyBlockers = blockers.filter((blocker) => blocker.code === "no_ready_review_effect");
  const otherBlockers = blockers.filter((blocker) => blocker.code !== "no_ready_review_effect");
  return [...noReadyBlockers, ...otherBlockers]
    .map((blocker) => blocker.message?.trim() ?? "")
    .filter(Boolean)
    .slice(0, 2);
}

export function signalTriageLayerText(summary: SignalTriageSummaryForUi | null | undefined): string {
  if (summaryRequiresProductScope(summary)) {
    return "候选分层：当前为全量/未归因辅助入口，暂不进入处理候选。";
  }
  const layers = (summary?.candidate_layers ?? []).filter((layer) => (layer.count ?? 0) > 0);
  if (layers.length === 0) return "候选分层：暂无候选";
  return `候选分层：${layers.map((layer) => `${layer.label || layer.layer_id || "未分类"} ${layer.count ?? 0}`).join(" / ")}`;
}

function formatOrderedCounts(counts: Record<string, number>, preferredOrder: string[]) {
  const seen = new Set<string>();
  const orderedKeys = [
    ...preferredOrder.filter((key) => {
      seen.add(key);
      return (counts[key] ?? 0) > 0;
    }),
    ...Object.keys(counts)
      .filter((key) => !seen.has(key) && (counts[key] ?? 0) > 0)
      .sort(),
  ];
  return orderedKeys.map((key) => `${key} ${counts[key]}`).join(" / ");
}

function ruleFeedbackPriorityText(byResult: Record<string, number>) {
  if ((byResult.worse ?? 0) > 0) return `worse ${byResult.worse}：优先复核阈值、证据来源和建议动作。`;
  if ((byResult.no_change ?? 0) > 0) return `no_change ${byResult.no_change}：优先复核证据来源或建议动作。`;
  if ((byResult.unclear ?? 0) > 0) return `unclear ${byResult.unclear}：先补复盘样本和指标。`;
  if ((byResult.improved ?? 0) > 0) return `improved ${byResult.improved}：当前同类信号可保留解释口径。`;
  return "暂无可排序复盘结果。";
}

function ruleFeedbackRecordText(record: RuleFeedbackRecordForUi) {
  const result = record.result || "unclear";
  const signalType = record.signal_type || "unknown";
  const objectType = record.object_type || "object";
  const objectLabel = record.object_label || record.object_id || "对象待补充";
  const reviewWindow = record.review_window || "窗口待补充";
  const recordSource =
    record.review_record_id || record.action_id
      ? `；复盘记录：${record.review_record_id || "id待补充"} / action_id ${record.action_id || "待补充"}`
      : "";
  const metricWindow =
    record.metric_window?.before && record.metric_window?.after
      ? `；指标窗口：${record.metric_window.before} -> ${record.metric_window.after}`
      : "";
  const note = record.review_note ? `；${record.review_note}` : "";
  const sortReason = record.sort_reason ? `；${record.sort_reason}` : "";
  const actionBoundary = ruleFeedbackRecordActionBoundaryText(record.action_boundary);
  const savedSnapshot = ruleFeedbackSavedSnapshotText(record);
  const diagnosisPath = ruleFeedbackDiagnosisPathText(record.diagnosis_path);
  const evidence = record.evidence_drilldown?.summary ? `；证据回看：${record.evidence_drilldown.summary}` : "";
  const evidenceGroups = ruleFeedbackEvidenceGroupsText(record.evidence_groups);
  return `${result} / ${signalType} / ${objectType} / ${objectLabel} / ${reviewWindow}${recordSource}${metricWindow}${note}${sortReason}${actionBoundary}${savedSnapshot}${diagnosisPath}${evidence}${evidenceGroups}`;
}

function ruleFeedbackCandidateGroupText(group: RuleFeedbackCandidateGroupForUi) {
  const groupType =
    group.group_type === "search_intent"
      ? "规则反馈样本上下文（广告搜索词表现复核）"
      : group.group_type === "aba_reference_term"
        ? "规则反馈样本上下文（ABA 站点级参考）"
        : "规则反馈样本上下文";
  const groupLabel = group.group_label || group.group_id || "上下文待补充";
  const resultText = formatOrderedCounts(group.by_result ?? {}, ["worse", "no_change", "unclear", "improved"]) || "结果待补齐";
  const totalText = group.total != null ? `样本 ${group.total}` : "样本待补齐";
  const abaText = group.aba_reference_term
    ? `；ABA 站点级参考：${group.aba_reference_term}${group.aba_period ? ` / ${group.aba_period}` : ""}`
    : "";
  const abaBoundary = group.aba_match_boundary
    ? `；ABA边界：${group.aba_match_boundary}`
    : group.aba_reference_term
      ? "；ABA边界：ABA 只作为站点级市场背景，不能当作店铺、广告组、商品或搜索词归因证据。"
      : "";
  const parentScopeText = ruleFeedbackCandidateGroupSampleText("Parent ASIN来源", group.sample_parent_scopes);
  const searchTermText = ruleFeedbackCandidateGroupSampleText("SearchTerm样本", group.sample_search_terms);
  const adContextText = ruleFeedbackCandidateGroupSampleText("逐投放来源", group.sample_ad_contexts);
  const recommendation = group.recommendation ? `；${group.recommendation}` : "";
  const actionBoundary = ruleFeedbackRecordActionBoundaryText(group.action_boundary);
  const boundary = group.boundary
    ? `；${group.boundary}`
    : actionBoundary
      ? ""
      : "；该上下文只用于规则反馈样本归类和人工复核优先级，不是广告处理对象；不自动改规则，不自动执行广告动作。";
  return `${groupType}：${groupLabel} / ${totalText} / ${resultText}${parentScopeText}${searchTermText}${adContextText}${abaText}${abaBoundary}${recommendation}${actionBoundary}${boundary}`;
}

function ruleFeedbackCandidateGroupSampleText(label: string, values?: string[]) {
  const text = (values ?? [])
    .map((value) => stringValue(value))
    .filter(Boolean)
    .slice(0, 3)
    .join(" / ");
  return text ? `；${label}：${text}` : "";
}

function ruleFeedbackPendingSourceText(source: RuleFeedbackPendingSourceForUi) {
  const label = source.group_label || source.object_label || source.source_id || "待复盘来源待补充";
  const objectText = source.object_label ? ` / 对象：${source.object_label}` : "";
  const actionText = source.action_type ? ` / 人工动作：${source.action_type}` : "";
  const parentScopeText = ruleFeedbackCandidateGroupSampleText("Parent ASIN来源", source.sample_parent_scopes);
  const searchTermText = ruleFeedbackCandidateGroupSampleText("SearchTerm样本", source.sample_search_terms);
  const adContextText = ruleFeedbackCandidateGroupSampleText("逐投放来源", source.sample_ad_contexts);
  const abaText = source.aba_reference_term
    ? `；ABA 站点级参考：${source.aba_reference_term}${source.aba_period ? ` / ${source.aba_period}` : ""}`
    : "";
  const abaBoundary = source.aba_match_boundary
    ? `；ABA边界：${source.aba_match_boundary}`
    : source.aba_reference_term
      ? "；ABA边界：ABA 只作为站点级市场背景，不能当作店铺、广告组、商品或搜索词归因证据。"
      : "";
  const boundary =
    source.boundary ||
    "该来源只说明待复盘人工留痕；未保存 ReviewRecord 前不形成规则反馈候选，不自动改规则，不自动执行广告动作。";
  return `待复盘来源：${label}${objectText}${actionText}${parentScopeText}${searchTermText}${adContextText}${abaText}${abaBoundary}；${boundary}`;
}

function ruleFeedbackActionBoundaryText(boundaries: Record<string, RuleFeedbackActionBoundaryForUi> | null | undefined) {
  if (!boundaries) return "动作边界：只允许人工复核，不自动改规则，不自动执行广告动作。";
  const parts = ["worse", "no_change", "unclear", "improved"]
    .map((result) => {
      const boundary = boundaries[result];
      const allowed = (boundary?.allowed_reviews ?? []).filter(Boolean).join(" / ");
      return allowed ? `${result}：${allowed}` : "";
    })
    .filter(Boolean);
  const forbiddenText = "不自动改规则 / 不自动执行广告动作";
  return parts.length ? `动作边界：${parts.join("；")}；禁止：${forbiddenText}。` : "动作边界：只允许人工复核，不自动改规则，不自动执行广告动作。";
}

function ruleFeedbackClosureCheckText(check: RuleFeedbackClosureCheckForUi) {
  const label = check.label || check.check_id || "复核项";
  const status = check.status || "unknown";
  const evidence = check.evidence ? `：${check.evidence}` : "";
  return `${label} ${status}${evidence}`;
}

function ruleFeedbackRecordActionBoundaryText(boundary: RuleFeedbackActionBoundaryForUi | null | undefined) {
  const allowed = (boundary?.allowed_reviews ?? []).filter(Boolean).join(" / ");
  if (!allowed) return "";
  const boundaryText = boundary?.boundary ? `；${boundary.boundary}` : "";
  return `；动作边界：${allowed}${boundaryText}`;
}

function ruleFeedbackSnapshotItemText(item: RuleFeedbackEvidenceSnapshotForUi | null | undefined) {
  if (!item) return "";
  const label = item.label?.trim() || "证据快照";
  const value = item.value?.trim();
  const detail = item.detail?.trim();
  const source = item.source?.trim();
  if (!value && !detail) return "";
  return `${label}：${value || detail}${source ? ` / ${source}` : ""}`;
}

function ruleFeedbackSavedSnapshotText(record: RuleFeedbackRecordForUi) {
  const count = Number(record.evidence_snapshot_count ?? record.evidence_snapshot?.length ?? 0);
  const diagnosis = ruleFeedbackSnapshotItemText(record.diagnosis_snapshot);
  const aiAdmission = ruleFeedbackSnapshotItemText(record.ai_admission_snapshot);
  const missingParts = [
    count <= 0 ? "保存快照" : "",
    diagnosis ? "" : "排查路径",
    aiAdmission ? "" : "AI 准入",
  ].filter(Boolean);
  const parts = [diagnosis, aiAdmission, missingParts.length ? `缺口：${missingParts.join(" / ")}` : ""].filter(Boolean);
  return `；保存快照：${count} 条${parts.length > 0 ? `；${parts.join("；")}` : ""}`;
}

function ruleFeedbackDiagnosisPathText(path: RuleFeedbackDiagnosisPathForUi | null | undefined) {
  if (!path) return "";
  const pathText = path.path?.trim() || "";
  const steps = (path.steps ?? [])
    .slice(0, 4)
    .map((step) => {
      const label = step.label?.trim() || step.step_id?.trim() || "路径节点";
      const value = step.value?.trim();
      return value ? `${label}：${value}` : label;
    })
    .filter(Boolean);
  const stepText = steps.length > 0 ? `；路径证据：${steps.join(" / ")}` : "";
  const boundary = path.boundary?.trim() ? `；边界：${path.boundary.trim()}` : "";
  const next = path.next_manual_step?.trim() ? `；人工下一步：${path.next_manual_step.trim()}` : "";
  if (!pathText && !stepText && !boundary && !next) return "";
  return `；诊断路径：${pathText || "待补齐"}${stepText}${boundary}${next}`;
}

function ruleFeedbackEvidenceGroupsText(groups: RuleFeedbackRecordForUi["evidence_groups"]) {
  const parts = (groups ?? [])
    .filter((group) => group.label && group.value)
    .slice(0, 6)
    .map((group) => `${group.label}：${group.value}`);
  return parts.length ? `；广告搜索词复核证据：${parts.join("；")}` : "";
}

export function signalTriageDepthText(summary: SignalTriageSummaryForUi | null | undefined): string {
  if (summaryRequiresProductScope(summary)) {
    return "深度分析：先选择 Parent ASIN / ASIN 经营对象，再下钻广告组、投放词、搜索词和广告位。";
  }
  const shouldExplainNextUnhandled = Boolean(summary?.recommended_manual_status?.has_manual_action && summary?.next_unhandled_candidate);
  const candidate = shouldExplainNextUnhandled ? summary?.next_unhandled_candidate : summary?.recommended_candidate;
  if (!candidate) return "深度分析：暂无推荐对象";
  const prefix =
    shouldExplainNextUnhandled && candidate.object_label
      ? `待处理候选 ${candidate.object_label}`
      : shouldExplainNextUnhandled && candidate.stable_object_id
        ? `待处理候选 ${candidate.stable_object_id}`
        : "";
  const parts = [
    prefix,
    candidate.problem_type ? `经营问题 ${candidate.problem_type}` : "",
    candidate.evidence_strength ? `证据强度 ${candidate.evidence_strength}` : "",
    candidate.review_path ? `复盘路径 ${candidate.review_path}` : "",
    candidate.attribution_boundary ? `归因边界 ${candidate.attribution_boundary}` : "",
    candidate.uncertainty ? `不确定性 ${candidate.uncertainty}` : "",
  ].filter(Boolean);
  return parts.length ? `深度分析：${parts.join(" / ")}` : "深度分析：暂无完整口径";
}

export function recommendedEvidenceDrilldownText(summary: SignalTriageSummaryForUi | null | undefined): string {
  const drilldown = summary?.recommended_evidence_drilldown;
  const objectLabel = drilldown?.object_label || summary?.recommended_candidate?.stable_object_id || summary?.recommended_candidate?.object_label || "推荐对象";
  return evidenceDrilldownText(summary, drilldown, objectLabel, "推荐证据", "暂无推荐对象证据下钻");
}

export function nextUnhandledEvidenceDrilldownText(summary: SignalTriageSummaryForUi | null | undefined): string {
  const drilldown = summary?.next_unhandled_evidence_drilldown;
  const objectLabel =
    drilldown?.object_label ||
    summary?.next_unhandled_candidate?.stable_object_id ||
    summary?.next_unhandled_candidate?.object_label ||
    "下一个候选";
  return evidenceDrilldownText(summary, drilldown, objectLabel, "下一个候选证据", "暂无下一个候选证据下钻");
}

const visibleBusinessEvidenceBlockOrder = [
  "diagnosis_path",
  "diagnosis_judgement",
  "sales_performance",
  "ad_coverage",
  "ad_product_coverage",
  "ad_metric_summary",
  "top_spend_source",
  "search_term_metric_summary",
  "search_term_context",
  "ad_group_problem_location",
  "ad_group_product_performance",
  "targeting_context",
  "search_term_market_context",
  "search_term_aba_context",
  "placement_context_gap",
  "downstream_context_gap",
  "context_boundary",
  "search_term_boundary",
  "parent_sibling_position",
];

export interface SignalTriageBusinessEvidenceItem {
  blockId: string;
  label: string;
  value: string;
  detail: string | null;
  source: string | null;
}

export interface SignalTriageDiagnosisContractItem {
  sectionId: string;
  title: string;
  businessQuestion: string;
  objectGrain: string;
  metricText: string;
  currentJudgement: string;
  proves: string;
  doesNotProve: string;
  evidenceGap: string;
  requiredEvidence: string;
  nextManualStep: string;
}

export interface SearchTermOpportunityReviewChain {
  title: string;
  businessQuestion: string;
  objectGrain: string;
  reviewPath: string;
  reviewLayers: SearchTermOpportunityReviewLayer[];
  parentScopeContext: string;
  adAsinCoverage: string;
  targetingEvidence: string;
  adGroupSynthesis: string;
  adGroupProductPerformance: string;
  placementBoundary: string;
  marketContext: string;
  currentJudgement: string;
  proves: string;
  doesNotProve: string;
  evidenceGap: string;
  requiredEvidence: string;
  nextManualStep: string;
  actionBoundary: string;
}

export interface SearchTermOpportunityReviewLayer {
  label: string;
  purpose: string;
  evidence: string;
  proves: string;
  doesNotProve: string;
  nextManualStep: string;
}

export interface SearchTermAdContextRow {
  key: string;
  searchTerm: string;
  campaignName: string;
  adGroupName: string;
  targetingLabel: string;
  reviewPriority: string;
  reviewReason: string;
  proves: string;
  doesNotProve: string;
  nextManualStep: string;
  metricsText: string;
  efficiencyText: string;
  periodText: string;
  judgement: string;
  boundary: string;
}

export interface SearchTermAdContextReviewSummary {
  title: string;
  statusLabel: string;
  firstLine: string;
  whyFirst: string;
  proves: string;
  doesNotProve: string;
  nextManualStep: string;
  boundary: string;
}

type SearchTermAdContextBaseRow = Omit<
  SearchTermAdContextRow,
  "reviewPriority" | "reviewReason" | "proves" | "doesNotProve" | "nextManualStep"
>;

export interface SearchTermAdContextSignalForUi extends SignalForUi {
  evidence?: {
    primary_object?: PrimaryObjectForUi | null;
    source_rows?: Record<string, unknown>[] | null;
  } | null;
}

export interface SignalDiagnosisEvidenceSummary {
  title: string;
  businessQuestion: string;
  objectReadback: string;
  strengthLabel: string;
  strengthReason: string;
  proves: string;
  doesNotProve: string;
  evidenceGap: string;
  nextManualStep: string;
  tone: "strong" | "medium" | "weak";
}

export interface ManualConfirmationEvidenceItem {
  label: string;
  value: string;
  detail: string | null;
}

export interface ManualActionDecisionFactItem {
  label: "处理依据" | "风险" | "不确定性";
  value: string;
}

interface ManualActionDecisionFactSignal extends SignalForUi {
  risk?: string | null;
  uncertainty?: string | null;
  why?: string | null;
  summary?: string | null;
}

export interface SignalMetricDecisionItem {
  label: string;
  value: string;
  purpose: string;
  proves: string;
  doesNotProve: string;
  nextManualStep: string;
}

interface SignalMetricSnapshotForUi {
  impressions?: number;
  clicks?: number;
  cost: number;
  orders: number;
  sales: number;
  acos?: number | null;
  cvr?: number | null;
  cpc?: number | null;
}

export interface ProductScopeAdmissionCard {
  title: string;
  statusLabel: string;
  tone: "blocked" | "ready" | "pending";
  conclusion: string;
  nextStep: string;
  manualActionBoundary: string;
  evidenceItems: SignalTriageBusinessEvidenceItem[];
}

export interface NoActionableManualGate {
  title: string;
  statusLabel: string;
  reason: string;
  nextStep: string;
  boundary: string;
  allowedPaths: string[];
  forbiddenEffects: string[];
}

export interface ProductScopeCandidateGapExplanation {
  title: string;
  summary: string;
  admission: string;
  reasons: string[];
  nextStep: string;
  boundary: string;
}

export type DiagnosisSummaryTone = "blocked" | "ready" | "pending" | "neutral";

export interface DiagnosisContextSummaryItem {
  label: string;
  value: string;
  detail?: string | null;
}

export interface DiagnosisContextSummary {
  title: string;
  statusLabel: string;
  tone: DiagnosisSummaryTone;
  items: DiagnosisContextSummaryItem[];
  boundary: string;
}

export interface DiagnosisPathSummaryStep {
  label: string;
  value: string;
  tone: "active" | "context" | "blocked" | "ready" | "neutral";
}

export interface DiagnosisPathSummary {
  title: string;
  description: string;
  steps: DiagnosisPathSummaryStep[];
  boundary: string;
}

export interface ProductScopeEvidenceMatrixRow {
  layerId: "scope" | "ad_asin" | "ad_group" | "traffic_context" | "admission";
  layerLabel: string;
  objectLabel: string;
  evidenceLabel: string;
  value: string;
  detail: string;
  source: string;
  tone: "scope" | "direct" | "context" | "blocked" | "ready" | "neutral";
}

export interface ProductScopeEvidenceMatrix {
  title: string;
  summary: string;
  rows: ProductScopeEvidenceMatrixRow[];
  boundary: string;
}

export interface ProductScopeEvidenceRouteGuideStep {
  order: number;
  layerId: ProductScopeEvidenceMatrixRow["layerId"] | "ai_signal" | "manual_confirmation" | "review";
  label: string;
  objectLabel: string;
  primaryEvidence: string;
  nextFocus: string;
  tone: ProductScopeEvidenceMatrixRow["tone"];
}

export interface ProductScopeEvidenceRouteDecision {
  title: string;
  statusLabel: string;
  statusTone: "ready" | "blocked" | "context";
  businessQuestion: string;
  currentJudgement: string;
  proves: string;
  doesNotProve: string;
  nextManualStep: string;
}

export interface ProductScopeEvidenceRouteLayerSummaryItem {
  label: string;
  value: string;
  description: string;
  tone: ProductScopeEvidenceRouteDecision["statusTone"];
}

export interface ProductScopeEvidenceRouteGuide {
  title: string;
  summary: string;
  decision: ProductScopeEvidenceRouteDecision;
  layerSummary: ProductScopeEvidenceRouteLayerSummaryItem[];
  steps: ProductScopeEvidenceRouteGuideStep[];
  boundary: string;
}

export interface ProductScopeDiagnosisBriefSection {
  id: "scope_filter" | "sales_summary" | "ai_summary" | "ad_group_priority" | "ad_group_detail";
  label: string;
  title: string;
  businessQuestion: string;
  purpose: string;
  currentJudgement: string;
  proves: string;
  doesNotProve: string;
  nextManualStep: string;
  tone: "scope" | "ready" | "context" | "manual" | "blocked";
}

export interface ProductScopeDecisionGuide {
  title: string;
  primaryDecision: string;
  readPath: string;
  expandFocus: string;
  notToDo: string;
  nextManualStep: string;
  tone: "ready" | "waiting" | "blocked";
}

export interface ProductScopeDiagnosisVerdictItem {
  label: string;
  value: string;
  detail: string;
  tone: "ready" | "waiting" | "blocked" | "manual";
}

export interface ProductScopeDiagnosisBrief {
  title: string;
  summary: string;
  statusLabel: string;
  statusTone: ProductScopeMvpStatus["tone"];
  decisionGuide: ProductScopeDecisionGuide;
  verdictItems: ProductScopeDiagnosisVerdictItem[];
  sections: ProductScopeDiagnosisBriefSection[];
  manualActions: string[];
  boundary: string;
}

export interface ProductScopeAdGroupActionableReview {
  title: string;
  evidence: string;
  decision: string;
  manualGate: string;
}

export interface ProductScopeAdGroupProblemLocator {
  title: string;
  businessQuestion: string;
  currentJudgement: string;
  problemLocation: string;
  splitReason: string;
  doesNotProve: string;
  nextManualStep: string;
}

export interface ProductScopeAdGroupOwnershipDecision {
  title: string;
  statusLabel: string;
  businessQuestion: string;
  currentJudgement: string;
  issueOwner: string;
  evidencePath: string;
  doesNotProve: string;
  nextManualStep: string;
}

export interface ProductScopeAdGroupEvidenceSynthesis {
  title: string;
  tone: "aligned" | "partial" | "gap";
  statusLabel: string;
  businessQuestion: string;
  currentJudgement: string;
  evidenceChain: string;
  proves: string;
  doesNotProve: string;
  evidenceGap: string;
  nextManualStep: string;
}

export interface ProductScopePlacementEvidenceDecision {
  title: string;
  status: ProductScopePlacementEvidenceStatus;
  businessQuestion: string;
  currentJudgement: string;
  evidenceLevel: string;
  proves: string;
  doesNotProve: string;
  evidenceGap: string;
  nextManualStep: string;
}

export interface ProductScopePlacementEvidenceStatus {
  label: string;
  tone: "healthy" | "observe" | "gap";
  reason: string;
  nextStep: string;
}

export interface ManualActionCandidateAdGroupBridge {
  title: string;
  evidence: string;
  decision: string;
  synthesisStatus: string;
  synthesisJudgement: string;
  synthesisEvidenceChain: string;
  synthesisBoundary: string;
  synthesisGap: string;
  searchTermBoundary: string;
  placementBoundary: string;
  manualNextStep: string;
  boundary: string;
}

export interface ProductScopeAdGroupDiagnosisRow {
  id: string;
  title: string;
  statusLabel: string;
  statusTone: "healthy" | "observe" | "risk" | "gap";
  diagnosisStatus: ProductScopeAdGroupDiagnosisStatus;
  problemType: string;
  metrics: string;
  trafficContext: string;
  trafficContextBoundary: string;
  reason: string;
  advertisedAsins: string[];
  advertisedProductPerformance: ProductScopeAdGroupAdvertisedProductPerformance[];
  ownershipDecision: ProductScopeAdGroupOwnershipDecision;
  problemLocator: ProductScopeAdGroupProblemLocator;
  evidenceSynthesis: ProductScopeAdGroupEvidenceSynthesis;
  actionableReview: ProductScopeAdGroupActionableReview;
  placementDecision: ProductScopePlacementEvidenceDecision;
  nextReviewFocus: string;
  boundary: string;
  forbiddenActions: string[];
  searchTermDiagnosis: ProductScopeSearchTermDiagnosis | null;
}

export interface ProductScopeAdGroupDiagnosisStatus {
  label: string;
  tone: "healthy" | "observe" | "risk" | "gap";
  reason: string;
  nextStep: string;
}

export interface ProductScopeAdGroupAdvertisedProductPerformance {
  key: string;
  label: string;
  asin: string;
  msku: string | null;
  metrics: string;
  sampleBoundary: string | null;
}

export interface ProductScopeSearchTermDiagnosisTerm {
  label: string;
  termTypeLabel: string;
  metrics: string;
  targetingText: string | null;
}

export interface ProductScopeSearchTermDecision {
  title: string;
  businessQuestion: string;
  currentJudgement: string;
  targetingEvidence: string;
  proves: string;
  doesNotProve: string;
  nextManualStep: string;
}

export interface ProductScopeSearchTermDiagnosis {
  termSummary: string;
  decision: ProductScopeSearchTermDecision;
  effectiveTerms: ProductScopeSearchTermDiagnosisTerm[];
  zeroOrderTerms: ProductScopeSearchTermDiagnosisTerm[];
  termBoundary: string;
  nextReviewFocus: string;
  forbiddenActions: string[];
}

export interface SignalTriageDiagnosisPathItem extends SignalTriageBusinessEvidenceItem {
  step: number;
}

type SignalTriageBusinessEvidenceTarget = "active" | "recommended" | "next_unhandled";

const diagnosisPathBlockSlots = [
  { blockIds: ["diagnosis_judgement", "diagnosis_path", "search_term_metric_summary"], labels: ["综合判断", "排查路径", "搜索词表现"], displayLabel: "综合判断" },
  { blockIds: ["ad_group_problem_location", "search_term_context"], labels: ["广告组问题定位", "投放上下文"], displayLabel: "广告组问题定位" },
  { blockIds: ["ad_group_product_performance"], labels: ["同组投放商品表现"], displayLabel: "广告 ASIN 承接" },
  { blockIds: ["targeting_context"], labels: ["投放词结构"], displayLabel: "投放词结构" },
  { blockIds: ["search_term_market_context", "search_term_aba_context"], labels: ["搜索词市场背景", "ABA市场背景"] },
  { blockIds: ["placement_context_gap", "downstream_context_gap"], labels: ["广告位证据缺口", "下游证据缺口"], displayLabel: "广告位边界" },
  { blockIds: ["context_boundary", "search_term_boundary"], labels: ["上下文边界", "对象边界"], displayLabel: "对象边界" },
];

export function signalTriageBusinessEvidenceItems(
  summary: SignalTriageSummaryForUi | null | undefined,
  target: SignalTriageBusinessEvidenceTarget = "active",
): SignalTriageBusinessEvidenceItem[] {
  const useNextUnhandled = Boolean(summary?.recommended_manual_status?.has_manual_action && summary?.next_unhandled_evidence_drilldown);
  const drilldown =
    target === "recommended"
      ? summary?.recommended_evidence_drilldown
      : target === "next_unhandled"
        ? summary?.next_unhandled_evidence_drilldown
        : useNextUnhandled
          ? summary?.next_unhandled_evidence_drilldown
          : summary?.recommended_evidence_drilldown;
  const blocks = drilldown?.business_evidence_blocks?.filter((block) => block.label && block.value) ?? [];
  const ordered = visibleBusinessEvidenceBlockOrder
    .map((blockId) => blocks.find((block) => block.block_id === blockId))
    .filter((block): block is NonNullable<(typeof blocks)[number]> => Boolean(block));
  const fallback = blocks.filter((block) => !visibleBusinessEvidenceBlockOrder.includes(block.block_id ?? ""));
  const prioritized = [...ordered, ...fallback];
  const visible = prioritized.slice(0, 6);
  const contextBoundary = prioritized.find((block) => block.block_id === "context_boundary" || block.block_id === "search_term_boundary");
  if (contextBoundary && !visible.some((block) => block.block_id === contextBoundary.block_id)) {
    visible.push(contextBoundary);
  }
  return visible.map((block) => ({
    blockId: block.block_id ?? block.label,
    label: block.label,
    value: block.value,
    detail: block.detail ?? null,
    source: block.source ?? null,
  }));
}

export function signalTriageDiagnosisContractItems(
  summary: SignalTriageSummaryForUi | null | undefined,
  contract: SignalTriageSummaryForUi["diagnosis_contract"] | null | undefined = summary?.diagnosis_contract,
): SignalTriageDiagnosisContractItem[] {
  const sections = contract?.sections ?? [];
  return sections
    .filter((section) => section.title && section.business_question && section.current_judgement)
    .map((section) => ({
      sectionId: section.section_id ?? section.title ?? "diagnosis_contract_section",
      title: diagnosisContractDisplayTitle(section.section_id, section.title),
      businessQuestion: section.business_question ?? "等待补充业务问题",
      objectGrain: section.object_grain ?? "等待补充对象粒度",
      metricText: diagnosisContractMetricText(section.metrics),
      currentJudgement: section.current_judgement ?? "等待补充当前判断",
      proves: section.proves ?? "等待补充能证明什么",
      doesNotProve: section.does_not_prove ?? "等待补充不能证明什么",
      evidenceGap: section.evidence_gap ?? "等待补充证据缺口",
      requiredEvidence: section.required_evidence ?? "等待补充所需证据",
      nextManualStep: section.next_manual_step ?? "等待人工复核",
    }));
}

function diagnosisContractDisplayTitle(sectionId?: string | null, title?: string | null): string {
  if (sectionId === "search_term_opportunity" || title === "搜索词机会") {
    return "广告搜索词表现复核";
  }
  return title ?? "诊断合同";
}

export function buildSearchTermOpportunityReviewChain(
  diagnosisContractItems: SignalTriageDiagnosisContractItem[],
  businessEvidenceItems: SignalTriageBusinessEvidenceItem[],
): SearchTermOpportunityReviewChain | null {
  const directSearchTermContract = diagnosisContractItems.find((item) => {
    const text = `${item.sectionId} ${item.title} ${item.objectGrain} ${item.businessQuestion}`.toLowerCase();
    return item.sectionId === "search_term_opportunity" || item.title.includes("搜索词机会") || text.includes("searchterm");
  });
  const searchTermContextContract = diagnosisContractItems.find((item) => {
    const text = `${item.sectionId} ${item.title} ${item.objectGrain} ${item.businessQuestion}`.toLowerCase();
    return text.includes("search_term") || text.includes("搜索词") || text.includes("aba");
  });
  const searchTermContract = directSearchTermContract ?? searchTermContextContract;
  const parentScopeContract = diagnosisContractItems.find((item) => item.sectionId === "parent_asin_scope");
  const adAsinContract = diagnosisContractItems.find((item) => item.sectionId === "ad_asin_coverage");
  const adGroupBoundaryContract = diagnosisContractItems.find((item) => item.sectionId === "ad_group_boundary");
  const placementContract = diagnosisContractItems.find((item) => item.sectionId === "placement_gap");
  const targetingBlock = businessEvidenceItems.find(
    (item) => item.blockId === "targeting_context" || item.label.includes("投放词"),
  );
  const adGroupBlock = businessEvidenceItems.find(
    (item) =>
      item.blockId === "ad_group_problem_location" ||
      item.blockId === "ad_group_context" ||
      item.blockId === "product_scope_ad_group_products" ||
      item.label.includes("广告组"),
  );
  const adGroupProductBlock = businessEvidenceItems.find(
    (item) =>
      item.blockId === "ad_group_advertised_product_performance" ||
      item.blockId === "product_scope_ad_group_products" ||
      item.label.includes("同组投放商品表现") ||
      item.label.includes("广告组内投放商品"),
  );
  const marketBlock = businessEvidenceItems.find(
    (item) =>
      item.blockId === "search_term_market_context" ||
      item.blockId === "search_term_aba_context" ||
      item.label.includes("搜索词市场") ||
      item.label.includes("ABA"),
  );
  const boundaryBlock = businessEvidenceItems.find((item) => item.blockId === "context_boundary");
  if (!searchTermContract && !targetingBlock && !marketBlock) return null;

  const doesNotProve = uniqueNonEmpty([
    searchTermContract?.doesNotProve,
    "不能把 ABA 当作店铺数据，不能把搜索词直接归因到单个广告 ASIN，也不能据此自动执行广告动作。",
  ]).join("；");
  const evidenceGap = uniqueNonEmpty([
    searchTermContract?.evidenceGap,
    boundaryBlock?.detail,
    marketBlock ? null : "缺少可匹配的 ABA 站点级市场背景时，只能用广告搜索词表现做人工观察。",
  ]).join("；");
  const targetingEvidence = appendBoundaryIfMissing(
    businessEvidenceBlockSentence(
      targetingBlock,
      "投放词结构待补：需要核对关键词 / 商品定向 / 自动投放上下文。",
    ),
    "投放词证据只说明当前投放上下文，不代表完整关键词库覆盖。",
    ["完整关键词库"],
  );
  const parentScopeContext = appendBoundaryIfMissing(
    uniqueNonEmpty([parentScopeContract?.currentJudgement, parentScopeContract?.proves]).join("；") ||
      "Parent ASIN 经营入口待补：需要先确认销售表现和当前广告数据只覆盖有投放的 ASIN。",
    "Parent ASIN 是经营盘入口，不代表所有子 ASIN 都进入广告分析；未投放子 ASIN 只能作为销售背景。",
    ["Parent ASIN", "广告"],
  );
  const adAsinCoverage = appendBoundaryIfMissing(
    uniqueNonEmpty([adAsinContract?.currentJudgement, adAsinContract?.doesNotProve]).join("；") ||
      "广告 ASIN 承接待补：需要确认当前搜索词由哪些有广告表现的 ASIN 和广告组承接。",
    "只有有广告数据的广告 ASIN 才能进入 SearchTerm 承接复核；搜索词不能自动归因到单个广告 ASIN。",
    ["广告 ASIN", "不能"],
  );
  const adGroupSynthesis = appendBoundaryIfMissing(
    uniqueNonEmpty([adGroupBoundaryContract?.currentJudgement, adGroupBoundaryContract?.doesNotProve, adGroupBoundaryContract?.evidenceGap]).join("；") ||
      businessEvidenceBlockSentence(
        adGroupBlock,
        "广告组合流判断待补：搜索词不能自动归因到单个广告 ASIN，需回到同广告组广告 ASIN、广告组结构和广告位证据缺口。",
      ),
    "搜索词只说明同广告组上下文，不能自动归因到单个广告 ASIN；缺少广告组级广告位证据时，不能判断广告位影响。",
    ["不能自动归因", "广告位"],
  );
  const adGroupProductPerformance = appendBoundaryIfMissing(
    adGroupBoundaryContract?.currentJudgement ||
      businessEvidenceBlockSentence(
        adGroupProductBlock,
        "同组投放商品表现待补：需要回看同广告组广告 ASIN 的花费、点击、订单、销售额、ACOS 和 CVR。",
      ),
    "同组投放商品表现只说明广告组内承接差异，不能把搜索词自动归因到单个广告 ASIN。",
    ["广告 ASIN", "不能"],
  );
  const placementBoundary = appendBoundaryIfMissing(
    uniqueNonEmpty([
      placementContract?.currentJudgement,
      placementContract?.evidenceGap,
      placementContract?.doesNotProve,
    ]).join("；") || "广告位边界待补：需要核对搜索词直连广告位、广告组级广告位或同广告活动广告位背景。",
    "广告位证据只能说明流量位置层级；缺少搜索词直连或广告组级广告位时，不能把表现差异解释为广告位问题。",
    ["广告位", "不能"],
  );
  const marketContext = appendBoundaryIfMissing(
    businessEvidenceBlockSentence(
      marketBlock,
      "ABA 市场背景待补：ABA 只能按站点 + 周期 + 标准化搜索词匹配，不能当作店铺或广告组数据。",
    ),
    "ABA 只能作为站点级市场背景，不能当作店铺、商品、广告组或广告 ASIN 数据。",
    ["站点级", "ABA"],
  );
  const reviewLayers: SearchTermOpportunityReviewLayer[] = [
    {
      label: "广告组合流判断",
      purpose: "判断同一个 SearchTerm 处在哪些广告组容器和多商品结构里，避免把广告组汇总误读成单个 ASIN 结论。",
      evidence: adGroupSynthesis,
      proves: "能证明搜索词出现在哪些广告组上下文里，以及广告组是否存在多广告 ASIN、主推策略或广告位证据缺口。",
      doesNotProve: "不能证明某个广告 ASIN 应自动加词、否词、调价或拆分广告组。",
      nextManualStep: "先打开广告组核对同组 ASIN、主推策略和投放目的，再决定记录观察或加入复盘。",
    },
    {
      label: "同组投放商品表现",
      purpose: "比较同广告组内投放商品的花费、点击、订单、销售额、ACOS 和 CVR，判断承接差异是否值得人工复核。",
      evidence: adGroupProductPerformance,
      proves: "能证明同广告组广告商品的承接强弱和样本边界。",
      doesNotProve: "不能证明该 SearchTerm 的消耗或订单应自动归因到某个广告 ASIN。",
      nextManualStep: "人工对比高花费、低转化和主推款 ASIN，必要时加入复盘观察处理后指标。",
    },
    {
      label: "投放词证据",
      purpose: "确认当前 SearchTerm 是由关键词、商品定向还是自动投放上下文承接，避免把出单搜索词直接当成完整关键词库结论。",
      evidence: targetingEvidence,
      proves: "能证明该搜索词在当前广告活动、广告组和投放对象下有可回看的投放承接证据。",
      doesNotProve: "不能证明关键词库已完整覆盖，也不能证明应该自动加词、自动否词或调整竞价。",
      nextManualStep: "人工核对投放词、匹配方式和广告组目的，再决定记录观察、加入复盘或忽略本次。",
    },
    {
      label: "广告位边界",
      purpose: "确认当前广告位证据停留在搜索词直连、广告组级、广告活动级还是缺失，避免把活动级背景当成归因。",
      evidence: placementBoundary,
      proves: "能证明当前是否具备足够粒度解释广告位影响。",
      doesNotProve: "缺少搜索词直连或广告组级广告位时，不能证明广告位导致该搜索词或该广告组表现差异。",
      nextManualStep: "若要判断广告位影响，先补广告组级或搜索词直连广告位；否则只把广告位作为边界说明。",
    },
  ];

  return {
    title:
      directSearchTermContract?.title === "搜索词机会"
        ? "广告搜索词表现复核"
        : directSearchTermContract?.title ?? "广告搜索词表现复核链",
    businessQuestion:
      directSearchTermContract?.businessQuestion ?? "这个搜索词是否只是广告上下文，还是值得人工复核扩量或治理？",
    objectGrain:
      directSearchTermContract?.objectGrain ?? "SearchTerm + 同广告活动 / 广告组上下文 + 站点级 ABA 背景",
    reviewPath:
      "Parent ASIN 销售盘 -> 有广告数据的广告 ASIN -> 广告组容器 -> 同组投放商品表现 -> 投放词 -> 广告位边界 -> 具体 SearchTerm -> 人工确认 -> 7/14 天复盘",
    reviewLayers,
    parentScopeContext,
    adAsinCoverage,
    targetingEvidence,
    adGroupSynthesis,
    adGroupProductPerformance,
    placementBoundary,
    marketContext,
    currentJudgement: searchTermContract?.currentJudgement ?? marketBlock?.value ?? targetingBlock?.value ?? "等待补充搜索词机会判断。",
    proves:
      searchTermContract?.proves ??
      "能证明当前搜索词在已有广告上下文中存在人工复核价值，但仍要结合投放词、广告组和商品承接判断。",
    doesNotProve,
    evidenceGap: evidenceGap || "等待补充投放词、ABA 周期、广告组结构或人工策略证据。",
    requiredEvidence:
      searchTermContract?.requiredEvidence ||
      "需要人工核对广告商品、投放词维护状态、广告组策略、ABA 周期和 7/14 天复盘指标。",
    nextManualStep:
      searchTermContract?.nextManualStep ||
      "先核对投放词、广告组结构和 ABA 周期，再选择记录观察、加入复盘或忽略本次。",
    actionBoundary: "只允许人工记录观察、标记已处理、加入复盘或忽略本次；不得自动加词、否词、调价或暂停广告。",
  };
}

export function buildSearchTermAdContextRows(signal: SearchTermAdContextSignalForUi, limit = 6): SearchTermAdContextRow[] {
  if (signal.signal_category !== "search_term_opportunity" || signal.object_type !== "search_term") return [];

  const primarySearchTerm = normalizeSearchIntentSearchTerm(
    signal.evidence?.primary_object?.search_term ?? signal.evidence?.primary_object?.label,
  );
  return (signal.evidence?.source_rows ?? [])
    .filter((row) => sourceText(row, "source_table") === "ad_search_term_daily_metrics")
    .filter((row) => {
      if (!primarySearchTerm) return true;
      return (
        normalizeSearchIntentSearchTerm(sourceText(row, "search_term")) === primarySearchTerm ||
        normalizeSearchIntentSearchTerm(sourceText(row, "normalized_query")) === primarySearchTerm
      );
    })
    .map((row, index) => {
      const spend = sourceNumber(row, "cost") || sourceNumber(row, "spend");
      const clicks = sourceNumber(row, "clicks");
      const orders = sourceNumber(row, "orders");
      const sales = sourceNumber(row, "sales");
      const acos = sales > 0 ? roundRate(spend / sales) : null;
      const cvr = clicks > 0 ? roundRate(orders / clicks) : null;
      const sourceReportType = sourceText(row, "source_report_type");
      const targetingText =
        sourceText(row, "targeting_text") || sourceText(row, "keyword_text") || sourceText(row, "target_id") || sourceText(row, "keyword_id");
      const targetingType =
        sourceReportType === "keyword"
          ? "关键词投放"
          : sourceReportType === "targeting"
            ? "商品/自动投放"
            : sourceReportType || "投放来源待补";

      return {
        key: sourceText(row, "row_id") || sourceText(row, "source_record_id") || `${sourceText(row, "ad_group_id")}-${index}`,
        searchTerm: sourceText(row, "search_term") || sourceText(row, "normalized_query") || signal.evidence?.primary_object?.label || "搜索词待补",
        campaignName: sourceText(row, "campaign_name") || "广告活动待补",
        adGroupName: sourceText(row, "ad_group_name") || "广告组待补",
        targetingLabel: targetingText ? `${targetingType}：${targetingText}` : `${targetingType}：投放词待补`,
        metricsText: `点击 ${Math.round(clicks)} / 花费 ${formatEvidenceNumber(spend)} / 订单 ${Math.round(orders)} / 销售额 ${formatEvidenceNumber(sales)}`,
        efficiencyText: `ACOS ${formatEvidencePercent(acos)} / CVR ${formatEvidencePercent(cvr)}`,
        periodText: sourceText(row, "start_date") && sourceText(row, "end_date") ? `${sourceText(row, "start_date")} 至 ${sourceText(row, "end_date")}` : "周期待补",
        judgement: searchTermAdContextJudgement(spend, clicks, orders, acos),
        boundary: "这一行只证明该搜索词在当前广告活动、广告组和投放词上下文中的广告表现；不能自动归因到单个 ASIN，也不能自动加词、否词、调价或暂停广告。",
      };
    })
    .filter((row) => row.searchTerm.trim())
    .sort((left, right) => searchTermAdContextSortScore(right) - searchTermAdContextSortScore(left) || left.adGroupName.localeCompare(right.adGroupName))
    .slice(0, limit)
    .map((row, index) => {
      const priority = searchTermAdContextReviewPriority(row, index);
      const decision = searchTermAdContextRowDecision(row, priority);
      return {
        ...row,
        reviewPriority: priority.label,
        reviewReason: priority.reason,
        ...decision,
      };
    });
}

function searchTermAdContextSortScore(row: SearchTermAdContextBaseRow): number {
  const orderMatch = row.metricsText.match(/订单 (\d+)/);
  const spendMatch = row.metricsText.match(/花费 ([0-9.]+)/);
  const orders = orderMatch ? Number(orderMatch[1]) : 0;
  const spend = spendMatch ? Number(spendMatch[1]) : 0;
  return orders * 100000 + spend;
}

function searchTermAdContextJudgement(spend: number, clicks: number, orders: number, acos: number | null): string {
  if (orders > 0 && acos !== null) return "有订单承接，优先核对该广告组和投放词是否符合当前 Parent ASIN 的投放策略。";
  if (orders > 0) return "已有订单但销售额或 ACOS 证据不足，先核对订单口径和销售承接。";
  if (spend > 0 && clicks > 0) return "有点击和花费但暂无订单，只能作为人工观察或浪费复核候选。";
  return "样本较弱，只能作为搜索词上下文，不足以单独生成广告动作。";
}

function searchTermAdContextReviewPriority(row: SearchTermAdContextBaseRow, index: number): { label: string; reason: string } {
  const metrics = searchTermAdContextMetricValues(row);
  if (index === 0 && metrics.orders > 0) {
    return {
      label: "优先复核广告组",
      reason: "当前同词表现行中订单和花费排序最高，先核对该广告组的投放词、广告 ASIN 承接和主推策略。",
    };
  }
  if (metrics.orders === 0 && metrics.spend > 0) {
    return {
      label: "止损复核候选",
      reason: "该行已有花费或点击但暂未形成订单，只能进入人工浪费排查，不能自动否词或调价。",
    };
  }
  if (metrics.orders > 0) {
    return {
      label: "对照复核广告组",
      reason: "该行也有订单承接，用来和优先广告组对照，判断同一 SearchTerm 在不同广告组的承接差异。",
    };
  }
  return {
    label: "观察补证",
    reason: "当前样本不足以判断扩量或止损，先补齐投放词、广告组和复盘窗口证据。",
  };
}

function searchTermAdContextRowDecision(
  row: SearchTermAdContextBaseRow,
  priority: { label: string; reason: string },
): Pick<SearchTermAdContextRow, "proves" | "doesNotProve" | "nextManualStep"> {
  const metrics = searchTermAdContextMetricValues(row);
  const contextLabel = `${row.campaignName} / ${row.adGroupName} / ${row.targetingLabel}`;
  const proves = `能证明该 SearchTerm 在 ${contextLabel} 下的逐投放表现：${row.metricsText}，用于比较同词在不同广告组、投放词和广告 ASIN 承接差异。`;
  const doesNotProve =
    "不能证明该表现应自动归因到单个 ASIN，也不能证明应自动加词、否词、调价、广告位加价或暂停广告。";
  const nextManualStep =
    metrics.orders > 0
      ? `优先人工核对 ${row.adGroupName} 的广告组目的、投放词匹配、广告 ASIN 承接和广告位边界；${priority.reason}`
      : metrics.spend > 0
        ? `人工核对 ${row.adGroupName} 是否存在词相关性、匹配方式或商品承接问题；只能记录观察、加入复盘或忽略本次，不自动否词。`
        : "当前样本较弱，先补投放词、广告组、广告 ASIN 和复盘窗口证据，再决定是否留痕。";
  return { proves, doesNotProve, nextManualStep };
}

export function buildSearchTermAdContextReviewSummary(rows: SearchTermAdContextRow[]): SearchTermAdContextReviewSummary | null {
  const firstRow = rows[0];
  if (!firstRow) return null;
  const adGroupCount = new Set(rows.map((row) => row.adGroupName).filter(Boolean)).size;
  const targetingCount = new Set(rows.map((row) => row.targetingLabel).filter(Boolean)).size;
  return {
    title: `先看 ${firstRow.adGroupName}`,
    statusLabel: `${rows.length} 条逐投放表现 / ${adGroupCount} 个广告组 / ${targetingCount} 个投放上下文`,
    firstLine: `${firstRow.searchTerm} / ${firstRow.campaignName} / ${firstRow.targetingLabel}`,
    whyFirst: `${firstRow.reviewPriority}：${firstRow.reviewReason}`,
    proves: firstRow.proves,
    doesNotProve: firstRow.doesNotProve,
    nextManualStep: firstRow.nextManualStep,
    boundary:
      "逐投放上下文只说明同一个 SearchTerm 在不同广告活动、广告组和投放词下的表现顺序；不替代 Parent ASIN、广告 ASIN、广告组或广告位完整判断。",
  };
}

function searchTermAdContextMetricValues(row: SearchTermAdContextBaseRow): { orders: number; spend: number } {
  const orderMatch = row.metricsText.match(/订单 (\d+)/);
  const spendMatch = row.metricsText.match(/花费 ([0-9.]+)/);
  return {
    orders: orderMatch ? Number(orderMatch[1]) : 0,
    spend: spendMatch ? Number(spendMatch[1]) : 0,
  };
}

function businessEvidenceBlockSentence(block: SignalTriageBusinessEvidenceItem | undefined, fallback: string): string {
  if (!block) return fallback;
  return `${block.label}：${block.value}${block.detail ? `；${block.detail}` : ""}`;
}

function appendBoundaryIfMissing(value: string, boundary: string, requiredMarkers: string[]): string {
  if (requiredMarkers.every((marker) => value.includes(marker))) return value;
  return uniqueNonEmpty([value, boundary]).join("；");
}

const manualConfirmationPreferredSections = [
  "search_term_opportunity",
  "ad_asin_coverage",
  "ad_group_boundary",
  "placement_gap",
  "manual_review",
];

export function buildManualConfirmationEvidenceItems(
  diagnosisContractItems: SignalTriageDiagnosisContractItem[],
  searchTermOpportunityReviewChain: SearchTermOpportunityReviewChain | null | undefined = null,
  signal: (SignalForUi & { evidence?: { primary_object?: PrimaryObjectForUi | null } | null }) | null | undefined = null,
  searchIntentReviewCard: SearchIntentReviewCard | null | undefined = null,
): ManualConfirmationEvidenceItem[] {
  const primary =
    manualConfirmationPreferredSections
      .map((sectionId) => diagnosisContractItems.find((item) => item.sectionId === sectionId))
      .find(Boolean) ?? diagnosisContractItems[0];

  const primaryItems: ManualConfirmationEvidenceItem[] = primary
    ? [
        {
          label: "业务问题",
          value: primary.businessQuestion,
          detail: primary.objectGrain ? `对象粒度：${primary.objectGrain}` : null,
        },
        {
          label: "当前判断",
          value: primary.currentJudgement,
          detail: primary.metricText ? `关键指标：${primary.metricText}` : null,
        },
        {
          label: "能证明",
          value: primary.proves,
          detail: "只说明当前证据能支撑哪些判断。",
        },
        {
          label: "不能证明",
          value: primary.doesNotProve,
          detail: "反证边界必须在人工点击前确认，不能包装成自动广告动作。",
        },
        {
          label: "人工下一步",
          value: primary.nextManualStep,
          detail: "只允许记录观察、标记已处理、加入复盘或忽略本次。",
        },
      ]
    : [];
  const objectReviewPathItem = signal ? buildSignalObjectReviewPath(signal, signal.evidence?.primary_object ?? null) : null;
  const objectReviewItems: ManualConfirmationEvidenceItem[] =
    objectReviewPathItem && !searchTermOpportunityReviewChain
      ? [
          {
            label: objectReviewPathItem.label,
            value: objectReviewPathItem.value,
            detail: objectReviewPathItem.detail,
          },
        ]
      : [];
  const searchIntentDecisionItems: ManualConfirmationEvidenceItem[] = searchIntentReviewCard
    ? [
        {
          label: "搜索词表现判断",
          value: `${searchIntentReviewCard.operationDecisionLabel}：${searchIntentReviewCard.operationDecisionReason}`,
          detail: searchIntentReviewCard.primarySearchTerm
            ? `优先打开 ${searchIntentReviewCard.primarySearchTerm}；${searchIntentReviewCard.primarySearchTermReason}。该判断只用于人工复核优先级，不自动执行广告动作。`
            : "该判断只用于人工复核优先级，不自动执行广告动作。",
        },
      ]
    : [];
  const searchTermReviewItems: ManualConfirmationEvidenceItem[] = searchTermOpportunityReviewChain
    ? [
        {
          label: "复核路径",
          value: searchTermOpportunityReviewChain.reviewPath,
          detail:
            "人工点击前按同一条路径核对 Parent ASIN、广告 ASIN、广告组、同组投放商品、投放词、广告位和具体 SearchTerm；写入后用于 7/14 天复盘回看。",
        },
        {
          label: "Parent ASIN 入口",
          value: searchTermOpportunityReviewChain.parentScopeContext,
          detail: "用于确认这条搜索词复核仍从当前 Parent ASIN 经营盘进入，不把未投放子 ASIN 当广告问题。",
        },
        {
          label: "广告 ASIN 承接",
          value: searchTermOpportunityReviewChain.adAsinCoverage,
          detail: "用于确认只有有广告数据的广告 ASIN 进入承接复核；搜索词不能自动归因到单个广告 ASIN。",
        },
        {
          label: "广告组合流判断",
          value: searchTermOpportunityReviewChain.adGroupSynthesis,
          detail: "用于确认搜索词只说明同广告组上下文，不能自动归因到单个广告 ASIN、广告组或广告位。",
        },
        {
          label: "同组投放商品表现",
          value: searchTermOpportunityReviewChain.adGroupProductPerformance,
          detail: "用于确认同广告组广告 ASIN 的承接差异；不能把搜索词或广告位自动归因到单个广告 ASIN。",
        },
        {
          label: "逐投放上下文",
          value: "按广告组、投放词、广告 ASIN 和搜索词表现顺序复核；具体排序以后端 evidence_snapshot 中的逐投放上下文为准。",
          detail:
            "用于确认人工点击前不是只看搜索词合计，而是回到广告组容器、投放词和广告 ASIN 承接顺序；不能把排序解释成自动加词、否词或调价。",
        },
        {
          label: "投放词证据",
          value: searchTermOpportunityReviewChain.targetingEvidence,
          detail: "用于确认搜索词来自当前广告组投放上下文，不代表完整关键词库。",
        },
        {
          label: "广告位边界",
          value: searchTermOpportunityReviewChain.placementBoundary,
          detail: "用于确认广告位证据停留在搜索词直连、广告组级、广告活动级还是缺失；缺广告组级证据时不能下广告位结论。",
        },
        {
          label: "ABA 背景",
          value: searchTermOpportunityReviewChain.marketContext,
          detail: "ABA 只能按站点 + 周期 + 标准化搜索词匹配，不能当店铺、产品、广告组或广告 ASIN 数据。",
        },
        {
          label: "证据缺口",
          value: searchTermOpportunityReviewChain.evidenceGap,
          detail: "用于确认当前证据还缺哪类业务事实，不能把缺口包装成广告调整结论。",
        },
        {
          label: "需要补证",
          value: searchTermOpportunityReviewChain.requiredEvidence,
          detail: "补证路径必须随人工留痕一起保存，方便 7/14 天复盘回看当时缺什么证据。",
        },
        {
          label: "动作边界",
          value: searchTermOpportunityReviewChain.actionBoundary,
          detail: searchTermOpportunityReviewChain.doesNotProve,
        },
      ]
    : [];

  return [...primaryItems, ...objectReviewItems, ...searchIntentDecisionItems, ...searchTermReviewItems].filter((item) => item.value.trim());
}

function preferredDiagnosisContractItem(
  diagnosisContractItems: SignalTriageDiagnosisContractItem[],
): SignalTriageDiagnosisContractItem | undefined {
  return (
    manualConfirmationPreferredSections
      .map((sectionId) => diagnosisContractItems.find((item) => item.sectionId === sectionId))
      .find(Boolean) ?? diagnosisContractItems[0]
  );
}

function manualActionDecisionFallbackBoundary(signal: ManualActionDecisionFactSignal): string {
  return signalDecisionBoundary(signal) || "该信号只能作为人工复核线索，不能绕过证据链直接执行广告动作。";
}

function manualActionDecisionFactValue(value: string, fallback: string): string {
  return value.trim() || fallback;
}

function manualActionDecisionBasisText(
  primary: SignalTriageDiagnosisContractItem | undefined,
  evidenceReason?: string | null,
): string {
  if (!primary) return stringValue(evidenceReason);
  return uniqueNonEmpty([
    `业务问题：${primary.businessQuestion}`,
    `当前判断：${primary.currentJudgement}`,
    stringValue(evidenceReason) ? `证据摘要：${stringValue(evidenceReason)}` : primary.metricText ? `关键指标：${primary.metricText}` : null,
    `人工下一步：${primary.nextManualStep}`,
  ]).join("；");
}

export function buildManualActionDecisionFactItems(
  signal: ManualActionDecisionFactSignal,
  diagnosisContractItems: SignalTriageDiagnosisContractItem[] = [],
  evidenceReason?: string | null,
): ManualActionDecisionFactItem[] {
  const primary = preferredDiagnosisContractItem(diagnosisContractItems);
  const boundary = manualActionDecisionFallbackBoundary(signal);
  const basis = manualActionDecisionFactValue(
    manualActionDecisionBasisText(primary, evidenceReason) || stringValue(signal.why) || stringValue(signal.summary),
    boundary,
  );
  const risk = manualActionDecisionFactValue(
    primary ? `不能证明：${primary.doesNotProve}` : stringValue(signal.risk),
    boundary,
  );
  const uncertainty = manualActionDecisionFactValue(
    primary
      ? `证据缺口：${primary.evidenceGap}；需要补证：${primary.requiredEvidence}`
      : stringValue(signal.uncertainty),
    boundary,
  );

  return [
    { label: "处理依据", value: basis },
    { label: "风险", value: risk },
    { label: "不确定性", value: uncertainty },
  ];
}

function signalDiagnosisObjectStableId(primaryObject: PrimaryObjectForUi | undefined, signal: SignalEvidenceSupportInput): string {
  return (
    stringValue(primaryObject?.object_id) ||
    stringValue(primaryObject?.asin) ||
    stringValue(primaryObject?.search_term) ||
    stringValue(primaryObject?.placement) ||
    stringValue(primaryObject?.label) ||
    signal.id
  );
}

function signalDiagnosisObjectLabel(primaryObject: PrimaryObjectForUi | undefined, stableId: string): string {
  return (
    stringValue(primaryObject?.label) ||
    stringValue(primaryObject?.asin) ||
    stringValue(primaryObject?.search_term) ||
    stringValue(primaryObject?.placement) ||
    stableId
  );
}

function buildSignalDiagnosisObjectReadback(
  signal: SignalEvidenceSupportInput,
  primary: SignalTriageDiagnosisContractItem,
): string {
  const primaryObject = signal.evidence?.primary_object;
  const objectType = primaryObject?.object_type ?? signal.object_type ?? "unknown";
  const stableId = signalDiagnosisObjectStableId(primaryObject, signal);
  const objectLabel = signalDiagnosisObjectLabel(primaryObject, stableId);
  const objectText = uniqueNonEmpty([objectType, objectLabel !== stableId ? objectLabel : null, stableId]).join(" / ");
  const grainText = primary.objectGrain ? `对象粒度：${primary.objectGrain}` : "对象粒度待补充";

  if (!objectType || objectType === "unknown") {
    return `诊断对象待核对：${objectText || signal.id}；${grainText}；不能把中间诊断直接带入右侧 ManualAction / ReviewTodo / ReviewRecord。`;
  }

  return `诊断对象：${objectText}；${grainText}；该对象必须与右侧 ManualAction / ReviewTodo / ReviewRecord 使用同一 stable object。`;
}

export function buildSignalDiagnosisEvidenceSummary(
  signal: SignalEvidenceSupportInput,
  diagnosisContractItems: SignalTriageDiagnosisContractItem[],
): SignalDiagnosisEvidenceSummary | null {
  const primary =
    manualConfirmationPreferredSections
      .map((sectionId) => diagnosisContractItems.find((item) => item.sectionId === sectionId))
      .find(Boolean) ?? diagnosisContractItems[0];
  if (!primary) return null;

  const support = buildSignalEvidenceSupport(signal);
  const strengthLabelByConfidence: Record<SignalEvidenceSupportInput["confidence"], string> = {
    high: "证据强度：高",
    medium: "证据强度：中",
    low: "证据强度：低",
  };
  const toneByConfidence: Record<SignalEvidenceSupportInput["confidence"], SignalDiagnosisEvidenceSummary["tone"]> = {
    high: "strong",
    medium: "medium",
    low: "weak",
  };
  const strengthReason = [support.confidenceReason, support.supportWarning].filter(Boolean).join(" ");

  return {
    title: primary.title,
    businessQuestion: primary.businessQuestion,
    objectReadback: buildSignalDiagnosisObjectReadback(signal, primary),
    strengthLabel: strengthLabelByConfidence[signal.confidence],
    strengthReason,
    proves: primary.proves,
    doesNotProve: primary.doesNotProve,
    evidenceGap: primary.evidenceGap,
    nextManualStep: primary.nextManualStep,
    tone: toneByConfidence[signal.confidence],
  };
}

export function buildSignalMetricDecisionItems(
  metrics: SignalMetricSnapshotForUi,
  diagnosisContractItems: SignalTriageDiagnosisContractItem[] = [],
): SignalMetricDecisionItem[] {
  const baseMetrics = [
    {
      label: "花费",
      value: formatSignalMetricMoney(metrics.cost),
      fallbackPurpose: "用于判断当前信号是否有足够广告花费样本，避免把零成本偶然波动当成机会或异常。",
    },
    {
      label: "订单",
      value: String(metrics.orders),
      fallbackPurpose: "用于判断当前对象是否产生真实广告转化，避免只用点击或花费推断机会。",
    },
    {
      label: "销售额",
      value: formatSignalMetricMoney(metrics.sales),
      fallbackPurpose: "用于判断订单是否带来销售承接，避免只看订单数量。",
    },
    {
      label: "ACOS",
      value: formatSignalMetricPercent(metrics.acos ?? null),
      fallbackPurpose: "用于判断当前效率是否可接受，只能作为人工复核线索。",
    },
  ];
  const searchTermContract = diagnosisContractItems.find((item) => item.sectionId === "search_term_opportunity");
  const searchTermContextMetrics = [
    {
      label: "CVR",
      fallbackPurpose: "用于判断点击是否形成有效广告承接，不能单独证明应放量。",
    },
    {
      label: "投放上下文",
      fallbackPurpose: "用于确认该词出现在哪些广告组和表现行，避免把合并结果误读为单一对象表现。",
    },
    {
      label: "投放词证据",
      fallbackPurpose: "用于判断该 SearchTerm 是否已有投放词承接，不代表完整关键词库覆盖。",
    },
    {
      label: "广告位证据",
      fallbackPurpose: "用于判断是否具备广告位层级证据；缺广告组级证据时不能解释广告位影响。",
    },
    {
      label: "ABA市场热度",
      fallbackPurpose: "用于判断该词是否同时具备站点级市场背景，不能当作店铺或广告组数据。",
    },
    {
      label: "广告组承接边界",
      fallbackPurpose: "用于判断搜索词机会能否安全下钻到广告组和广告 ASIN，不能自动归因到单个 ASIN。",
    },
  ]
    .map((metric) => {
      const value = contractMetricValue(metric.label, searchTermContract);
      return value ? { ...metric, value } : null;
    })
    .filter((metric): metric is { label: string; value: string; fallbackPurpose: string } => Boolean(metric));

  return [...baseMetrics, ...searchTermContextMetrics].map((metric) => {
    const contractItem = diagnosisContractItemForMetric(metric.label, diagnosisContractItems);
    return {
      label: metric.label,
      value: metric.value,
      purpose: metricPurposeFromContract(metric.label, contractItem) ?? metric.fallbackPurpose,
      proves: contractItem?.proves ?? "能证明当前指标在所选对象和周期内成立。",
      doesNotProve: contractItem?.doesNotProve ?? "不能单独证明应自动调价、自动加词、自动否词或归因到单个 ASIN。",
      nextManualStep: contractItem?.nextManualStep ?? "人工复核广告商品、投放词、广告组策略后记录观察或加入复盘。",
    };
  });
}

function contractMetricValue(label: string, item: SignalTriageDiagnosisContractItem | undefined): string | null {
  const part = contractMetricPart(label, item);
  if (!part) return null;
  const value = part.slice(`${label}：`.length).split("，")[0]?.trim();
  return value || null;
}

function diagnosisContractItemForMetric(
  label: string,
  items: SignalTriageDiagnosisContractItem[],
): SignalTriageDiagnosisContractItem | undefined {
  return items.find((item) => metricPurposeFromContract(label, item)) ?? items[0];
}

function metricPurposeFromContract(label: string, item: SignalTriageDiagnosisContractItem | undefined): string | null {
  const part = contractMetricPart(label, item);
  if (!part) return null;
  const purpose = part.split("，").slice(1).join("，").trim();
  return purpose || null;
}

function contractMetricPart(label: string, item: SignalTriageDiagnosisContractItem | undefined): string | null {
  if (!item?.metricText) return null;
  return (
    item.metricText
      .split("；")
      .map((text) => text.trim())
      .find((text) => text.startsWith(`${label}：`)) ?? null
  );
}

function formatSignalMetricMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatSignalMetricPercent(value: number | null): string {
  if (value === null) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function diagnosisContractMetricText(
  metrics: NonNullable<NonNullable<SignalTriageSummaryForUi["diagnosis_contract"]>["sections"]>[number]["metrics"],
): string {
  const parts = (metrics ?? [])
    .filter((metric) => metric.name && metric.value)
    .map((metric) => {
      const purpose = diagnosisContractPurposeText(metric.purpose);
      return purpose ? `${metric.name}：${metric.value}，${purpose}` : `${metric.name}：${metric.value}`;
    });
  return parts.join("；");
}

function diagnosisContractPurposeText(purpose: string | null | undefined): string {
  const normalized = purpose?.trim().replace(/[。；;]$/, "");
  if (!normalized) return "";
  return normalized.startsWith("用于") ? normalized : `用于${normalized}`;
}

export function productScopeDrilldownEvidenceItems(summary: SignalTriageSummaryForUi | null | undefined): SignalTriageBusinessEvidenceItem[] {
  const drilldown = summary?.product_scope_drilldown;
  const items = drilldown?.items ?? [];
  if (!drilldown || items.length <= 0) return [];

  const topItem = items[0];
  const topGroup = topItem.top_ad_group;
  const evidence: SignalTriageBusinessEvidenceItem[] = [
    {
      blockId: "product_scope_ad_asin_summary",
      label: "广告 ASIN 覆盖",
      value: `${drilldown.advertised_asin_count ?? items.length} 个广告 ASIN`,
      detail: drilldown.summary ?? "只下钻当前商品范围内有广告数据的 ASIN，未投放子 ASIN 不进入广告诊断。",
      source: "积加API / advertised_products",
    },
    {
      blockId: "product_scope_top_ad_asin",
      label: "优先广告 ASIN",
      value: `${topItem.asin ?? "未知 ASIN"} / 花费 ${formatEvidenceNumber(topItem.spend)} / 订单 ${Math.round(topItem.orders ?? 0)}`,
      detail: topItem.next_review_focus ?? null,
      source: "积加API / advertised_products",
    },
  ];

  if (topGroup) {
    const targetingContext = topGroup.targeting_context;
    const targetingCount = targetingContext?.targeting_count ?? 0;
    const targetingNames = productScopeTargetingNames(targetingContext);
    evidence.push({
      blockId: "product_scope_top_ad_group",
      label: "优先广告组",
      value: topGroup.ad_group_name || topGroup.ad_group_id || "未知广告组",
      detail: `投放词 ${targetingCount} 个 / 搜索词 ${topGroup.search_term_count ?? 0} 条 / 广告组级广告位 ${topGroup.placement_count ?? 0} 条 / 同广告活动广告位 ${topGroup.campaign_placement_count ?? 0} 条`,
      source: "积加API / ad_search_term_daily_metrics / ad_placement_daily_metrics",
    });

    if (targetingCount > 0) {
      evidence.push({
        blockId: "product_scope_targeting_context",
        label: "投放词结构",
        value: targetingContext?.diagnosis_summary ?? `${targetingCount} 个投放词`,
        detail: uniqueNonEmpty([
          targetingNames.length > 0 ? `投放词：${targetingNames.join("、")}` : null,
          targetingContext?.next_review_focus,
          targetingContext?.boundary ?? "投放词来自搜索词表现行，不代表完整关键词库，不能自动加词、否词或调价。",
        ]).join("；"),
        source: "积加API / ad_search_term_daily_metrics",
      });
    }

    const adGroupAsins = uniqueNonEmpty(topGroup.ad_group_advertised_asins ?? []);
    if ((topGroup.ad_group_advertised_asin_count ?? 0) > 0 || adGroupAsins.length > 0) {
      evidence.push({
        blockId: "product_scope_ad_group_products",
        label: "广告组投放结构",
        value: `${topGroup.ad_group_advertised_asin_count ?? adGroupAsins.length} 个广告 ASIN`,
        detail: `${adGroupAsins.length > 0 ? adGroupAsins.join("、") : "广告 ASIN 列表待补充"}；${topGroup.ad_group_attribution_boundary ?? "搜索词和广告位只能作为广告组上下文。"}`,
        source: "积加API / advertised_products",
      });
    }

    const effectiveTerms = productScopeTermNames(topGroup.effective_search_terms);
    if (effectiveTerms.length > 0) {
      evidence.push({
        blockId: "product_scope_effective_search_terms",
        label: "有效搜索词",
        value: effectiveTerms.join("、"),
        detail: "这些搜索词已有订单，用于识别当前广告组的有效流量意图。",
        source: "积加API / ad_search_term_daily_metrics",
      });
    }

    const zeroOrderTerms = productScopeTermNames(topGroup.zero_order_search_terms);
    if (zeroOrderTerms.length > 0) {
      evidence.push({
        blockId: "product_scope_zero_order_search_terms",
        label: "无订单花费词",
        value: zeroOrderTerms.join("、"),
        detail: "这些搜索词有花费无订单，只能作为人工复核候选，不能自动否词。",
        source: "积加API / ad_search_term_daily_metrics",
      });
    }
  }

  const candidateGap = drilldown.candidate_gap_analysis;
  const candidateGapChecks = candidateGap?.checks?.filter((check) => check?.object_id || check?.object_label) ?? [];
  if (candidateGap && candidateGapChecks.length > 0) {
    const visibleChecks = candidateGapChecks.slice(0, 2);
    evidence.push({
      blockId: "product_scope_candidate_gap",
      label: "AI 候选缺口",
      value: visibleChecks.map((check) => `${check.object_label || check.object_id || "未知对象"}：${check.result || "诊断不准入"}`).join("；"),
      detail: [
        candidateGap.summary,
        ...visibleChecks.flatMap((check) =>
          [check.anomaly_check, check.opportunity_check, check.next_review_focus].filter((text): text is string => Boolean(text?.trim())),
        ),
        candidateGap.boundary,
      ]
        .filter((text): text is string => Boolean(text?.trim()))
        .join("；"),
      source: "系统准入规则 / advertised_products",
    });
  }

  if (drilldown.boundary) {
    evidence.push({
      blockId: "product_scope_context_boundary",
      label: "归因边界",
      value: "搜索词和广告位只作上下文",
      detail: drilldown.boundary,
      source: "系统边界",
    });
  }

  return evidence;
}

export function productScopeAdGroupDiagnosisRows(summary: SignalTriageSummaryForUi | null | undefined): ProductScopeAdGroupDiagnosisRow[] {
  const rows = summary?.product_scope_drilldown?.ad_group_diagnosis ?? [];
  const actionability = summary?.actionability_status;
  const candidateCount = summary?.signal_status?.candidate_count ?? 0;
  const canWriteManualAction = actionability?.can_write_manual_action === true;
  return rows
    .filter((row) => row?.ad_group_name || row?.ad_group_id)
    .slice(0, 6)
    .map((row, index) => ({
      id: row.ad_group_id?.trim() || `${row.campaign_id ?? "campaign"}-${index}`,
      title: row.ad_group_name?.trim() || row.ad_group_id?.trim() || "未知广告组",
      statusLabel: row.diagnosis_label?.trim() || "待判断",
      statusTone: productScopeAdGroupDiagnosisTone(row.diagnosis_status),
      diagnosisStatus: productScopeAdGroupDiagnosisStatus(row, candidateCount, canWriteManualAction),
      problemType: row.problem_type?.trim() || "诊断口径待补充",
      metrics: `花费 ${formatEvidenceNumber(row.spend)} / 订单 ${Math.round(row.orders ?? 0)} / ACOS ${formatEvidencePercent(row.acos)}`,
      trafficContext: `广告 ASIN ${row.ad_group_advertised_asin_count ?? 0} 个 / 搜索词 ${row.search_term_count ?? 0} 条 / 广告位 ${
        row.placement_count ?? 0
      } 条 / 活动广告位 ${row.campaign_placement_count ?? 0} 条`,
      trafficContextBoundary:
        "这些数量只说明当前广告组或广告活动上下文覆盖；不能证明搜索词、广告位或广告组表现已归因到单个广告 ASIN，也不能替代人工动作门禁。",
      reason: row.reason?.trim() || "等待后端补充广告组诊断原因。",
      advertisedAsins: row.ad_group_advertised_asins?.map((asin) => asin.trim()).filter(Boolean) ?? [],
      advertisedProductPerformance: productScopeAdGroupAdvertisedProductPerformance(row),
      ownershipDecision: productScopeAdGroupOwnershipDecision(row, canWriteManualAction),
      problemLocator: productScopeAdGroupProblemLocator(row, candidateCount, canWriteManualAction),
      evidenceSynthesis: productScopeAdGroupEvidenceSynthesis(row, canWriteManualAction),
      actionableReview: productScopeAdGroupActionableReview(row, candidateCount, canWriteManualAction),
      placementDecision: productScopePlacementEvidenceDecision(row, canWriteManualAction),
      nextReviewFocus: row.next_review_focus?.trim() || "先下钻广告 ASIN、搜索词和广告位上下文。",
      boundary: row.attribution_boundary?.trim() || "广告组是投放容器，搜索词和广告位不能自动归因到单个 ASIN。",
      forbiddenActions: row.forbidden_actions?.length ? row.forbidden_actions : ["自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
      searchTermDiagnosis: productScopeSearchTermDiagnosis(row),
    }));
}

export function buildProductScopeDiagnosisBrief(
  firstScreenSummary: ProductScopeFirstScreenSummary | null,
  routeGuide: ProductScopeEvidenceRouteGuide | null,
  adGroupRows: ProductScopeAdGroupDiagnosisRow[],
): ProductScopeDiagnosisBrief | null {
  if (!firstScreenSummary) return null;
  const adFact = firstScreenSummary.factItems[1];
  const primaryAdGroup = adGroupRows[0];
  const routeDecision = routeGuide?.decision;
  const routeStepText = routeGuide
    ? `${routeGuide.steps.length} 层证据：${routeGuide.summary}`
    : firstScreenSummary.pathSummary;
  const adGroupJudgement = primaryAdGroup
    ? `${primaryAdGroup.title}：${primaryAdGroup.statusLabel}；${primaryAdGroup.metrics}`
    : "暂无可排序广告组；先确认广告商品、搜索词和广告位证据是否可下钻。";
  const adGroupProves = primaryAdGroup
    ? primaryAdGroup.evidenceSynthesis.proves
    : "当前只能证明还没有足够广告组诊断行进入排序。";
  const adGroupDoesNotProve = primaryAdGroup
    ? primaryAdGroup.evidenceSynthesis.doesNotProve
    : "不能证明广告组没有问题，也不能把缺失排序解释成广告结构健康。";
  const adGroupNextManualStep = primaryAdGroup
    ? primaryAdGroup.problemLocator.nextManualStep
    : "先补齐广告组、投放商品、投放词、搜索词和广告位证据，再进入人工复核。";
  const adEvidenceGate = firstScreenSummary.landingGates.find((gate) => gate.label === "广告证据");
  const scopeGate = firstScreenSummary.landingGates.find((gate) => gate.label === "经营口径");
  const hasAdvertisedAsin = firstScreenSummary.adAsinRows.length > 0;
  const scopeLockJudgement = `${scopeGate?.value ?? firstScreenSummary.factItems[0]?.value ?? "当前 Parent ASIN 经营口径待确认"}；筛选器只锁定经营对象和周期，不把广告组、搜索词或广告位提升为商品入口。`;
  const scopeLockNextManualStep = `${scopeGate?.detail ?? "先确认当前 Parent ASIN、店铺、站点和周期口径，再进入广告证据下钻。"} 若要处理广告问题，继续看有 advertised_products 证据的广告 ASIN。`;
  const salesEntryCurrentJudgement = hasAdvertisedAsin
    ? `可以进入广告诊断：${adEvidenceGate?.value ?? firstScreenSummary.adCoverageDecision.statusLabel}。${
        adEvidenceGate?.detail ?? firstScreenSummary.adCoverageDecision.summary
      } 经营销售盘只做背景，不把全部销售子 ASIN 当广告对象。`
    : `暂不进入广告诊断：${adEvidenceGate?.value ?? "缺少广告 ASIN，不能进入广告诊断"}。${
        adEvidenceGate?.detail ?? firstScreenSummary.adCoverageDecision.summary
      } 先补齐 advertised_products、广告组、投放词、搜索词或广告位证据。`;
  const salesEntryNextManualStep = hasAdvertisedAsin
    ? `${adFact?.value ?? "只把有 advertised_products 证据的广告 ASIN 带入后续诊断。"} 下一步进入广告组排序和具体广告证据，不把未投放子 ASIN 拉入广告分析。`
    : `${firstScreenSummary.adCoverageDecision.nextManualStep} 暂不看广告组排序，先补广告对象证据。`;
  const decisionGuide: ProductScopeDecisionGuide = hasAdvertisedAsin
    ? {
        title: "Parent ASIN 决策导览",
        primaryDecision: primaryAdGroup
          ? `先展开 ${primaryAdGroup.title}：${primaryAdGroup.problemType}；${primaryAdGroup.statusLabel}。`
          : "可以进入广告诊断，但暂无可排序广告组；先确认广告组、投放商品、投放词、搜索词和广告位证据是否齐全。",
        readPath: "先判断 Parent ASIN 是否有广告证据，再看广告 ASIN 覆盖，接着只展开问题广告组，不逐个读完整报表。",
        expandFocus: primaryAdGroup
          ? `${primaryAdGroup.problemLocator.problemLocation}；下钻顺序为投放商品 -> 投放词 -> 搜索词 -> 广告位。`
          : "暂时不展开广告组明细；补齐广告组诊断行后再进入四层广告证据。",
        notToDo:
          "不要把销售子 ASIN 全量、搜索词或广告位直接归因到单个广告 ASIN，也不要把 AI 判断包装成自动加词、否词、调价或暂停广告。",
        nextManualStep: primaryAdGroup ? primaryAdGroup.problemLocator.nextManualStep : salesEntryNextManualStep,
        tone: primaryAdGroup ? "ready" : "waiting",
      }
    : {
        title: "Parent ASIN 决策导览",
        primaryDecision: "暂不展开广告组：当前缺少可进入广告诊断的广告 ASIN。",
        readPath: "先补 advertised_products、广告组、投放词、搜索词或广告位证据，再进入广告诊断路径。",
        expandFocus: "没有广告对象证据时，只能把 Parent ASIN 当经营背景，不能生成广告问题归因。",
        notToDo:
          "不要用未投放销售子 ASIN、ABA 或销售表现直接生成广告动作，也不要自动创建人工复盘记录。",
        nextManualStep: salesEntryNextManualStep,
        tone: "blocked",
      };
  const verdictItems: ProductScopeDiagnosisVerdictItem[] = [
    {
      label: "准入结论",
      value: hasAdvertisedAsin ? "进入广告诊断" : "暂不进入广告诊断",
      detail: salesEntryCurrentJudgement,
      tone: hasAdvertisedAsin ? "ready" : "blocked",
    },
    {
      label: "今日焦点",
      value: primaryAdGroup ? primaryAdGroup.title : "等待广告组证据",
      detail: primaryAdGroup
        ? `${primaryAdGroup.problemType}；${primaryAdGroup.problemLocator.problemLocation}`
        : "缺少可排序广告组时，不展开广告组明细，也不生成广告动作。",
      tone: primaryAdGroup ? "ready" : "waiting",
    },
    {
      label: "证据下钻",
      value: routeGuide ? `${routeGuide.steps.length} 层证据` : "证据路径待补齐",
      detail: routeGuide?.summary ?? "等待广告 ASIN、广告组、投放词、搜索词和广告位形成可读证据链。",
      tone: routeGuide ? "ready" : "waiting",
    },
    {
      label: "人工边界",
      value: "只做人工留痕",
      detail: "允许记录观察、标记已处理、加入复盘或忽略本次；复盘窗口完整后再评价效果。",
      tone: "manual",
    },
  ];

  return {
    title: "Parent ASIN 运营诊断路径",
    summary:
      "这不是把筛选器、销售、广告组、明细和 AI 分析纵向堆叠成长报表，而是一条运营决策路径：先锁定 Parent ASIN 口径，再用销售表现确认入口，判断先看哪个广告组，接着下钻广告组下的投放商品、投放词、搜索词和广告位，最后由 AI 汇总判断，只输出可人工确认的下一步。",
    statusLabel: firstScreenSummary.mvpStatus.statusLabel,
    statusTone: firstScreenSummary.mvpStatus.tone,
    decisionGuide,
    verdictItems,
    sections: [
      {
        id: "scope_filter",
        label: "0",
        title: "筛选器与口径锁定",
        businessQuestion: "当前页面到底在看哪个店铺、站点、Parent ASIN 和周期，哪些对象不能被混进来？",
        purpose: "先把经营对象、站点、周期和数据来源锁住，避免后续把广告组、搜索词、广告位或 ABA 当成 Parent ASIN 商品口径。",
        currentJudgement: scopeLockJudgement,
        proves: "能证明当前诊断入口已经限定为一个 Parent ASIN 经营范围，并为广告 ASIN、广告组和搜索词下钻提供同一上下文。",
        doesNotProve: "不能证明广告组就是产品，不能证明所有销售子 ASIN 都有广告数据，也不能把 ABA 当店铺专属数据。",
        nextManualStep: scopeLockNextManualStep,
        tone: "scope",
      },
      {
        id: "sales_summary",
        label: "1",
        title: "Parent ASIN 销售表现入口",
        businessQuestion: "这个 Parent ASIN 是否有足够广告证据，值得进入广告诊断？",
        purpose: "先回答这个 Parent ASIN 是否值得进入广告诊断，并限定销售子 ASIN 只是经营背景，不把未投放变体拉进广告分析。",
        currentJudgement: salesEntryCurrentJudgement,
        proves: "能证明当前 Parent ASIN 经营盘、销售子 ASIN 范围，以及哪些广告 ASIN 有 advertised_products 证据可进入下钻。",
        doesNotProve: "不能证明 Parent ASIN 下所有子 ASIN 都有广告数据，也不能直接生成广告动作对象。",
        nextManualStep: salesEntryNextManualStep,
        tone: "scope",
      },
      {
        id: "ad_group_priority",
        label: "2",
        title: "广告组优先排序",
        businessQuestion: "进入广告诊断后，今天应该先看哪个广告组，而不是扫完整广告组列表？",
        purpose: "在进入广告诊断后，先找最值得人工复核的广告组，避免运营逐个广告组读报表。",
        currentJudgement: adGroupJudgement,
        proves: adGroupProves,
        doesNotProve: adGroupDoesNotProve,
        nextManualStep: adGroupNextManualStep,
        tone: primaryAdGroup ? "ready" : "blocked",
      },
      {
        id: "ad_group_detail",
        label: "3",
        title: "广告组下具体数据",
        businessQuestion: "当前广告组下的问题落在哪一层具体数据：投放商品、投放词、搜索词，还是广告位？",
        purpose: "先确认问题落点、证据缺口和人工下一步，再把广告组下具体数据拆成投放商品、投放词、搜索词和广告位四类证据。",
        currentJudgement: routeStepText,
        proves: routeDecision?.proves ?? "能证明当前页面已经给出广告证据下钻路径。",
        doesNotProve:
          routeDecision?.doesNotProve ?? "不能证明搜索词、广告位或广告组表现已经归因到单个广告 ASIN。",
        nextManualStep: routeDecision?.nextManualStep ?? "按证据链逐层核对后，再进入右侧人工确认。",
        tone: routeGuide ? "context" : "blocked",
      },
      {
        id: "ai_summary",
        label: "4",
        title: "AI 人工动作判断",
        businessQuestion: "证据读完后，运营现在只能做哪一种人工动作，后续如何复盘？",
        purpose: "在筛选口径、销售入口、广告组排序和广告组下具体数据都读完后，只把当前状态汇总为记录观察、标记已处理、加入复盘或忽略本次。",
        currentJudgement: firstScreenSummary.mvpStatus.summary,
        proves: firstScreenSummary.mvpStatus.detail,
        doesNotProve: "不代表系统可以自动加词、否词、调价或暂停广告；也不代表没有 ready 复盘时已经证明建议有效。",
        nextManualStep: firstScreenSummary.pathSteps.find((step) => step.label === "人工确认")?.detail ?? "右侧只允许人工确认动作。",
        tone: firstScreenSummary.mvpStatus.tone === "blocked" ? "blocked" : "manual",
      },
    ],
    manualActions: ["记录观察", "标记已处理", "加入复盘", "忽略本次"],
    boundary: firstScreenSummary.boundary,
  };
}

function productScopeAdGroupAdvertisedProductPerformance(
  row: ProductScopeDrilldownAdGroupDiagnosisForUi,
): ProductScopeAdGroupAdvertisedProductPerformance[] {
  return (row.advertised_product_performance ?? [])
    .filter((item) => item?.asin || item?.label)
    .slice(0, 8)
    .map((item, index) => {
      const asin = item.asin?.trim() || item.label?.trim() || "未知 ASIN";
      const label = item.label?.trim() || asin;
      const msku = item.msku?.trim() || null;
      return {
        key: `${asin}-${msku ?? "no-msku"}-${index}`,
        label,
        asin,
        msku,
        metrics: `花费 ${formatEvidenceNumber(item.spend)} / 点击 ${Math.round(item.clicks ?? 0)} / 订单 ${Math.round(
          item.orders ?? 0,
        )} / 销售额 ${formatEvidenceNumber(item.sales)} / ACOS ${formatEvidencePercent(item.acos)} / CVR ${formatEvidencePercent(item.cvr)}`,
        sampleBoundary: item.sample_boundary?.trim() || null,
      };
    });
}

function productScopeAdGroupDiagnosisStatus(
  row: ProductScopeDrilldownAdGroupDiagnosisForUi,
  candidateCount: number,
  canWriteManualAction: boolean,
): ProductScopeAdGroupDiagnosisStatus {
  const effectiveCount = row.effective_search_term_count ?? row.search_term_diagnosis?.effective_terms?.length ?? 0;
  const zeroOrderCount = row.zero_order_search_term_count ?? row.search_term_diagnosis?.zero_order_terms?.length ?? 0;
  const searchTermCount = row.search_term_count ?? 0;
  const placementCount = row.placement_count ?? 0;
  const campaignPlacementCount = row.campaign_placement_count ?? 0;
  const adAsinCount = row.ad_group_advertised_asin_count ?? row.current_scope_advertised_asin_count ?? row.ad_product_row_count ?? 0;
  const manualActionText = canWriteManualAction
    ? "右侧可人工记录观察、标记已处理、加入复盘或忽略本次。"
    : "当前只读复核，未满足门禁前不写人工动作。";

  if (adAsinCount === 0 || searchTermCount === 0) {
    const missing = [adAsinCount > 0 ? "" : "投放商品", searchTermCount > 0 ? "" : "搜索词"].filter(Boolean).join("、");
    return {
      label: "证据缺口",
      tone: "gap",
      reason: `当前广告组缺少${missing || "关键"}证据，不能判断具体广告问题。`,
      nextStep: "先补齐 advertised_products、投放词、搜索词或广告位证据，再进入人工复核。",
    };
  }
  if (effectiveCount > 0 && zeroOrderCount > 0) {
    return {
      label: canWriteManualAction ? "待人工复核" : "只读复核",
      tone: "risk",
      reason: `同一广告组同时有有效词 ${effectiveCount} 条和无订单花费词 ${zeroOrderCount} 条，问题优先落在搜索词意图分化。`,
      nextStep: `先核对投放商品、投放词、搜索词和广告位边界；${manualActionText}`,
    };
  }
  if (zeroOrderCount > 0) {
    return {
      label: canWriteManualAction ? "待人工复核" : "只读复核",
      tone: "risk",
      reason: `存在无订单花费词 ${zeroOrderCount} 条，先判断词相关性、匹配方式和商品承接。`,
      nextStep: `先复核搜索词和投放词，不自动否词或调价；${manualActionText}`,
    };
  }
  if (placementCount === 0 && campaignPlacementCount > 0) {
    return {
      label: "广告位缺口",
      tone: "gap",
      reason: `只有活动级广告位 ${campaignPlacementCount} 条，不能判断广告组级广告位影响。`,
      nextStep: "先补广告组级广告位证据；当前只用广告 ASIN、投放词和搜索词做人工复核。",
    };
  }
  if (adAsinCount > 1) {
    return {
      label: "容器边界",
      tone: "observe",
      reason: `同广告组包含 ${adAsinCount} 个广告 ASIN，先按容器边界复核，不拆成单 ASIN 结论。`,
      nextStep: `对比同组投放商品、投放词和搜索词表现；${manualActionText}`,
    };
  }
  if (effectiveCount > 0) {
    return {
      label: "仅观察",
      tone: "observe",
      reason: `当前有有效搜索词 ${effectiveCount} 条，但缺少更强异常或复盘触发证据。`,
      nextStep: "保持观察或记录观察；不要自动加词、调价或扩大投放。",
    };
  }
  return {
    label: "仅观察",
    tone: "healthy",
    reason: "当前广告组没有明显异常或机会，只保留广告上下文。",
    nextStep: "不展开完整明细；等搜索词、广告位或候选信号变化后再复核。",
  };
}

function productScopeAdGroupEvidenceSynthesis(
  row: ProductScopeDrilldownAdGroupDiagnosisForUi,
  canWriteManualAction: boolean,
): ProductScopeAdGroupEvidenceSynthesis {
  const groupName = row.ad_group_name?.trim() || row.ad_group_id?.trim() || "未知广告组";
  const effectiveCount = row.effective_search_term_count ?? row.search_term_diagnosis?.effective_terms?.length ?? 0;
  const zeroOrderCount = row.zero_order_search_term_count ?? row.search_term_diagnosis?.zero_order_terms?.length ?? 0;
  const searchTermCount = row.search_term_count ?? 0;
  const placementCount = row.placement_count ?? 0;
  const campaignPlacementCount = row.campaign_placement_count ?? 0;
  const adAsins = row.ad_group_advertised_asins?.map((asin) => asin.trim()).filter(Boolean) ?? [];
  const adAsinCount = row.ad_group_advertised_asin_count ?? row.current_scope_advertised_asin_count ?? row.ad_product_row_count ?? adAsins.length;
  const adAsinText = adAsins.length > 0 ? adAsins.slice(0, 3).join("、") : "广告 ASIN 清单待补充";
  const targetingTerms = [
    ...(row.search_term_diagnosis?.effective_terms ?? []),
    ...(row.search_term_diagnosis?.zero_order_terms ?? []),
  ]
    .map((term) => term.targeting_text?.trim())
    .filter((term): term is string => Boolean(term));
  const uniqueTargetingTerms = Array.from(new Set(targetingTerms));
  const targetingText = uniqueTargetingTerms.length > 0 ? uniqueTargetingTerms.slice(0, 3).join("、") : "投放词待补充";
  const placementText =
    placementCount > 0
      ? `广告组级 ${placementCount} 条`
      : campaignPlacementCount > 0
        ? `仅活动级 ${campaignPlacementCount} 条`
        : "缺少广告位证据";
  const tone: ProductScopeAdGroupEvidenceSynthesis["tone"] =
    adAsinCount === 0 || searchTermCount === 0 ? "gap" : placementCount > 0 ? "aligned" : "partial";
  let statusLabel = "证据不足：等待下游证据";

  if (effectiveCount > 0 && zeroOrderCount > 0) {
    statusLabel = "证据合流：搜索词分化优先";
  } else if (zeroOrderCount > 0) {
    statusLabel = "证据合流：无订单花费词优先";
  } else if (effectiveCount > 0 && placementCount === 0 && campaignPlacementCount > 0) {
    statusLabel = "证据部分合流：有效词可复核，广告位只是活动背景";
  } else if (effectiveCount > 0) {
    statusLabel = "证据合流：有效词承接优先";
  } else if (adAsinCount > 1) {
    statusLabel = "证据部分合流：多广告 ASIN 容器边界优先";
  } else if (placementCount === 0 && campaignPlacementCount > 0) {
    statusLabel = "证据缺口：广告位只有活动背景";
  } else if (searchTermCount === 0) {
    statusLabel = "证据缺口：缺少搜索词样本";
  }

  const gaps = [
    adAsinCount > 0 ? "" : "广告 ASIN 清单",
    uniqueTargetingTerms.length > 0 ? "" : "投放词证据",
    searchTermCount > 0 ? "" : "搜索词样本",
    placementCount > 0 ? "" : "广告组级广告位证据",
  ].filter(Boolean);
  const evidenceGap =
    gaps.length > 0
      ? `当前仍缺少${gaps.join("、")}；只能按已有广告商品和搜索词上下文人工复核。`
      : "证据链已能支持广告组层人工复核，但仍缺少搜索词到单个广告 ASIN 和广告位的直接归因链路。";
  const proves =
    effectiveCount > 0 || zeroOrderCount > 0
      ? `能证明 ${groupName} 下已有可比较的搜索词表现：有效词 ${effectiveCount} 条、无订单花费词 ${zeroOrderCount} 条，可用于人工判断词意图分化或商品承接差异。`
      : `能证明 ${groupName} 当前广告组层证据还不足以形成搜索词表现判断，只能先看广告 ASIN 和广告位覆盖。`;
  const nextManualStep = canWriteManualAction
    ? "右侧人工记录前，先按这条合流判断核对广告 ASIN、投放词、搜索词和广告位缺口；只能记录观察、标记已处理、加入复盘或忽略本次。"
    : "当前只读诊断；先按这条合流判断核对广告 ASIN、投放词、搜索词和广告位缺口，不写人工动作。";

  return {
    title: `广告组证据合流判断：${groupName}`,
    tone,
    statusLabel,
    businessQuestion: "广告商品、投放词、搜索词和广告位证据是否指向同一个可人工复核的问题？",
    currentJudgement: `广告 ASIN ${adAsinCount} 个 / 投放词 ${uniqueTargetingTerms.length} 个 / 搜索词 ${searchTermCount} 条 / 广告位 ${placementText}。`,
    evidenceChain: `广告 ASIN ${adAsinCount} 个（${adAsinText}）-> 投放词 ${uniqueTargetingTerms.length} 个（${targetingText}）-> 搜索词 ${searchTermCount} 条（有效 ${effectiveCount} / 无订单 ${zeroOrderCount}）-> 广告位 ${placementText}。`,
    proves,
    doesNotProve: "不能证明应该自动拆广告组、自动加词、自动否词、自动调价，也不能把搜索词或广告位影响自动归因到单个广告 ASIN。",
    evidenceGap,
    nextManualStep,
  };
}

export function buildManualActionCandidateAdGroupBridge(
  preview: RecommendedManualActionPreview | null | undefined,
  rows: ProductScopeAdGroupDiagnosisRow[],
): ManualActionCandidateAdGroupBridge | null {
  if (!preview || rows.length === 0) return null;
  const topGroup = rows[0];
  const objectId = preview.objectId?.trim();
  const objectLabel = preview.objectLabel?.trim() || objectId || "当前候选对象";
  const normalizedObjectId = objectId?.toLowerCase() ?? "";
  const normalizedObjectLabel = objectLabel.toLowerCase();
  const advertisedAsinMatch =
    preview.objectType === "advertised_product" && topGroup.advertisedAsins.some((asin) => asin.toLowerCase() === normalizedObjectId);
  const allTerms = [
    ...(topGroup.searchTermDiagnosis?.effectiveTerms ?? []),
    ...(topGroup.searchTermDiagnosis?.zeroOrderTerms ?? []),
  ];
  const searchTermMatch =
    preview.objectType === "search_term" &&
    allTerms.some((term) => {
      const label = term.label.toLowerCase();
      return label === normalizedObjectId || label === normalizedObjectLabel;
    });

  let evidence = `候选对象 ${objectLabel} 需要对照优先广告组 ${topGroup.title} 的广告 ASIN、搜索词和广告位证据复核。`;
  if (advertisedAsinMatch) {
    evidence = `候选广告 ASIN ${objectLabel} 出现在优先广告组 ${topGroup.title} 的投放商品中。`;
  } else if (preview.objectType === "advertised_product" && topGroup.advertisedAsins.length > 0) {
    evidence = `候选广告 ASIN ${objectLabel} 需对照优先广告组 ${topGroup.title} 的投放商品清单复核。`;
  } else if (searchTermMatch) {
    evidence = `候选搜索词 ${objectLabel} 出现在优先广告组 ${topGroup.title} 的搜索词样本中。`;
  } else if (preview.objectType === "search_term") {
    evidence = `候选搜索词 ${objectLabel} 使用优先广告组 ${topGroup.title} 的同组搜索词上下文复核。`;
  }

  const searchTermDecision = topGroup.searchTermDiagnosis?.decision;
  const searchTermBoundary = searchTermDecision
    ? `搜索词边界：${searchTermDecision.proves} ${searchTermDecision.doesNotProve}`
    : "搜索词边界：当前没有搜索词业务判断，不能用搜索词推导人工动作。";
  const placementBoundary = `广告位边界：${topGroup.placementDecision.evidenceLevel} ${topGroup.placementDecision.doesNotProve}`;
  const synthesis = topGroup.evidenceSynthesis;
  const manualNextStep = [
    synthesis.nextManualStep,
    searchTermDecision?.nextManualStep,
    topGroup.placementDecision.nextManualStep,
    "右侧按钮只保存人工留痕或复盘待办，不执行广告动作。",
  ]
    .filter((text): text is string => Boolean(text?.trim()))
    .join(" ");

  return {
    title: "人工候选与广告组关系",
    evidence,
    decision: `沿用中间广告组合流判断：${synthesis.statusLabel}；${topGroup.actionableReview.decision}`,
    synthesisStatus: `合流状态：${synthesis.statusLabel}`,
    synthesisJudgement: synthesis.currentJudgement,
    synthesisEvidenceChain: synthesis.evidenceChain,
    synthesisBoundary: `能证明：${synthesis.proves} 不能证明：${synthesis.doesNotProve}`,
    synthesisGap: `证据缺口：${synthesis.evidenceGap}`,
    searchTermBoundary,
    placementBoundary,
    manualNextStep,
    boundary: "广告组是投放容器；该关系只说明候选对象与同广告组上下文的复核关系，不自动归因到单个 ASIN，也不自动执行广告动作。",
  };
}

function productScopeAdGroupOwnershipDecision(
  row: ProductScopeDrilldownAdGroupDiagnosisForUi,
  canWriteManualAction: boolean,
): ProductScopeAdGroupOwnershipDecision {
  const groupName = row.ad_group_name?.trim() || row.ad_group_id?.trim() || "未知广告组";
  const effectiveCount = row.effective_search_term_count ?? row.search_term_diagnosis?.effective_terms?.length ?? 0;
  const zeroOrderCount = row.zero_order_search_term_count ?? row.search_term_diagnosis?.zero_order_terms?.length ?? 0;
  const searchTermCount = row.search_term_count ?? 0;
  const placementCount = row.placement_count ?? 0;
  const campaignPlacementCount = row.campaign_placement_count ?? 0;
  const adAsins = row.ad_group_advertised_asins?.map((asin) => asin.trim()).filter(Boolean) ?? [];
  const adAsinCount = row.ad_group_advertised_asin_count ?? row.current_scope_advertised_asin_count ?? row.ad_product_row_count ?? adAsins.length;
  const adAsinText = adAsins.length > 0 ? adAsins.slice(0, 3).join("、") : "广告 ASIN 清单待补充";
  const statusLabel =
    adAsinCount > 1
      ? "先归属到广告组容器"
      : adAsinCount === 1
        ? "可从单广告 ASIN 复核"
        : "广告商品归属待补证";
  const issueOwner =
    adAsinCount > 1
      ? `当前广告组包含 ${adAsinCount} 个广告 ASIN（${adAsinText}），问题先归属到广告组容器和搜索词上下文，不能拆到单个广告 ASIN。`
      : adAsinCount === 1
        ? `当前广告组只识别到 1 个广告 ASIN（${adAsinText}），可作为商品承接复核入口，但搜索词和广告位仍需独立验证。`
        : "当前广告组缺少广告 ASIN 清单，不能判断商品归属，只能先补 advertised_products 投放行或商品映射。";
  const evidencePath =
    `广告 ASIN -> 广告组 ${groupName} -> 搜索词 ${searchTermCount} 条` +
    `（有效 ${effectiveCount} / 无订单 ${zeroOrderCount}）-> 广告组级广告位 ${placementCount} 条 / 活动级广告位 ${campaignPlacementCount} 条。`;
  const nextManualStep = canWriteManualAction
    ? "右侧人工记录前，先按归属判定逐项核对广告 ASIN 清单、有效词、无订单花费词和广告位粒度。"
    : "当前只读诊断；先按归属判定核对广告 ASIN 清单、有效词、无订单花费词和广告位粒度，不写人工动作。";

  return {
    title: `问题归属判定：${groupName}`,
    statusLabel,
    businessQuestion: "这个广告组问题能不能归到单个广告 ASIN，还是只能先归到广告组容器和搜索词 / 广告位上下文？",
    currentJudgement: `广告 ASIN ${adAsinCount} 个 / 搜索词 ${searchTermCount} 条 / 广告组级广告位 ${placementCount} 条 / 活动级广告位 ${campaignPlacementCount} 条。`,
    issueOwner,
    evidencePath,
    doesNotProve: "不能证明应自动拆广告组、自动调价、自动否词，也不能把搜索词或广告位直接归因到单个广告 ASIN。",
    nextManualStep,
  };
}

function productScopeAdGroupProblemLocator(
  row: ProductScopeDrilldownAdGroupDiagnosisForUi,
  candidateCount: number,
  canWriteManualAction: boolean,
): ProductScopeAdGroupProblemLocator {
  const groupName = row.ad_group_name?.trim() || row.ad_group_id?.trim() || "未知广告组";
  const effectiveCount = row.effective_search_term_count ?? row.search_term_diagnosis?.effective_terms?.length ?? 0;
  const zeroOrderCount = row.zero_order_search_term_count ?? row.search_term_diagnosis?.zero_order_terms?.length ?? 0;
  const searchTermCount = row.search_term_count ?? 0;
  const placementCount = row.placement_count ?? 0;
  const campaignPlacementCount = row.campaign_placement_count ?? 0;
  const adAsinCount = row.ad_group_advertised_asin_count ?? row.current_scope_advertised_asin_count ?? row.ad_product_row_count ?? 0;
  const metricText = `花费 ${formatEvidenceNumber(row.spend)} / 订单 ${Math.round(row.orders ?? 0)} / ACOS ${formatEvidencePercent(row.acos)}`;
  let problemLocation = "问题落点待补充：先确认广告商品、搜索词和广告位证据是否齐全。";

  if (effectiveCount > 0 && zeroOrderCount > 0) {
    problemLocation = "优先落在搜索词意图分化：同一广告组同时有有效词和无订单花费词。";
  } else if (zeroOrderCount > 0) {
    problemLocation = "优先落在无订单花费词：先复核搜索词相关性、匹配方式和商品承接。";
  } else if (adAsinCount > 1) {
    problemLocation = "优先落在广告组容器边界：同组多个广告 ASIN 会掩盖商品级表现差异。";
  } else if (searchTermCount === 0) {
    problemLocation = "优先落在搜索词证据缺口：当前广告组没有可复核搜索词样本。";
  } else if (placementCount === 0 && campaignPlacementCount > 0) {
    problemLocation = "优先落在广告位证据缺口：只能看到活动级广告位，不能判断广告组级广告位影响。";
  }

  const splitReason =
    adAsinCount > 1
      ? `广告组汇总会把 ${adAsinCount} 个广告 ASIN 的花费、订单和承接混在一起；必须拆到广告 ASIN 和搜索词层复核。`
      : "广告组仍是投放容器；即使只有一个广告 ASIN，也要用搜索词和广告位上下文复核问题来源。";
  const nextManualStep = canWriteManualAction
    ? `右侧已有 ${candidateCount} 个候选可人工确认；先按广告 ASIN清单、有效词、无订单花费词和广告位缺口逐项核对。`
    : `当前候选 ${candidateCount} 个，先只读复核广告 ASIN清单、有效词、无订单花费词和广告位缺口，不写人工动作。`;

  return {
    title: `问题先落到哪里：${groupName}`,
    businessQuestion: "这个广告组的问题应该先看投放商品、搜索词分化、广告位缺口，还是数据缺口？",
    currentJudgement: `${metricText}；广告 ASIN ${adAsinCount} 个 / 搜索词 ${searchTermCount} 条 / 广告位 ${placementCount} 条 / 活动广告位 ${campaignPlacementCount} 条。`,
    problemLocation,
    splitReason,
    doesNotProve: "不能证明应自动拆广告组、自动否词、自动调价，也不能把搜索词或广告位自动归因到单个广告 ASIN。",
    nextManualStep,
  };
}

function productScopeAdGroupActionableReview(
  row: ProductScopeDrilldownAdGroupDiagnosisForUi,
  candidateCount: number,
  canWriteManualAction: boolean,
): ProductScopeAdGroupActionableReview {
  const groupName = row.ad_group_name?.trim() || row.ad_group_id?.trim() || "未知广告组";
  const effectiveCount = row.effective_search_term_count ?? row.search_term_diagnosis?.effective_terms?.length ?? 0;
  const zeroOrderCount = row.zero_order_search_term_count ?? row.search_term_diagnosis?.zero_order_terms?.length ?? 0;
  const adAsinCount = row.ad_group_advertised_asin_count ?? row.current_scope_advertised_asin_count ?? row.ad_product_row_count ?? 0;
  let decision = "搜索词证据不足，先补齐搜索词或广告位数据，再判断广告组问题。";

  if (effectiveCount > 0 && zeroOrderCount > 0) {
    decision = "广告组整体有转化，但同时存在无订单花费词；先判断词意图分化、匹配过宽或商品承接不一致。";
  } else if (zeroOrderCount > 0) {
    decision = "存在无订单花费词；先复核搜索词相关性、匹配方式和商品承接，不直接否词或调价。";
  } else if (effectiveCount > 0) {
    decision = "已有有效搜索词；先确认这些词是否稳定、是否匹配商品语义，再决定是否加入复盘观察。";
  }

  return {
    title: `优先复核 ${groupName}`,
    evidence: `有效词 ${effectiveCount} 条 / 无订单花费词 ${zeroOrderCount} 条 / 广告 ASIN ${adAsinCount} 个`,
    decision,
    manualGate: canWriteManualAction
      ? `当前候选 ${candidateCount} 个，可在右侧人工确认区记录判断，仍不自动执行广告动作。`
      : `当前候选 ${candidateCount} 个，未满足人工动作门禁；只做诊断，不写人工动作。`,
  };
}

function productScopePlacementEvidenceDecision(
  row: ProductScopeDrilldownAdGroupDiagnosisForUi,
  canWriteManualAction: boolean,
): ProductScopePlacementEvidenceDecision {
  const groupName = row.ad_group_name?.trim() || row.ad_group_id?.trim() || "未知广告组";
  const placementCount = row.placement_count ?? 0;
  const campaignPlacementCount = row.campaign_placement_count ?? 0;
  const searchTermCount = row.search_term_count ?? 0;
  const adAsinCount = row.ad_group_advertised_asin_count ?? row.current_scope_advertised_asin_count ?? 0;
  let status: ProductScopePlacementEvidenceStatus = {
    label: "广告位缺口",
    tone: "gap",
    reason: "当前没有广告组级或活动级广告位样本，不能判断流量位置是否影响转化或 ACOS。",
    nextStep: "先补齐 ad_placement_daily_metrics，再把广告位纳入人工复核。",
  };
  let evidenceLevel = "广告位证据缺口：当前没有广告组级或活动级广告位样本。";
  let proves = "能证明当前广告组诊断缺少广告位维度，暂时不能判断流量位置是否影响转化或 ACOS。";
  let evidenceGap = "需要补齐 ad_placement_daily_metrics 中 campaign_id + ad_group_id 级别的广告位表现。";
  let nextManualStep = "先按广告 ASIN、投放词和搜索词只读复核；补齐广告位数据前，不判断广告位影响，也不写自动广告动作。";

  if (placementCount > 0) {
    status = {
      label: "广告位可复核",
      tone: "healthy",
      reason: `当前广告组有广告位样本 ${placementCount} 条，可以和搜索词、广告 ASIN 一起人工复核流量位置。`,
      nextStep: canWriteManualAction
        ? "对照广告位、有效词、无订单花费词和广告 ASIN 承接后，只在右侧人工记录观察或加入复盘。"
        : "先只读对照广告位、有效词、无订单花费词和广告 ASIN 承接；未满足门禁前不写人工动作。",
    };
    evidenceLevel = "广告组级广告位证据可用：可以和同广告组搜索词、广告 ASIN 一起人工复核流量位置。";
    proves = "能证明该广告组存在广告位上下文，可用于人工比较不同流量位置的花费、订单、ACOS 或 CVR。";
    evidenceGap = "仍缺少搜索词到广告位的直接链路，不能判断某个搜索词或单个 ASIN 一定由该广告位造成。";
    nextManualStep = canWriteManualAction
      ? "先对照广告位、有效词、无订单花费词和广告 ASIN 承接，再在右侧人工记录观察或加入复盘。"
      : "先只读对照广告位、有效词、无订单花费词和广告 ASIN 承接；未满足门禁前不写人工动作。";
  } else if (campaignPlacementCount > 0) {
    status = {
      label: "只有活动背景",
      tone: "observe",
      reason: `同广告活动有广告位样本 ${campaignPlacementCount} 条，但缺少当前广告组级广告位样本。`,
      nextStep: "先补广告组级广告位证据；当前只用广告 ASIN、投放词和搜索词人工复核，不做广告位结论。",
    };
    evidenceLevel = "只有广告活动级广告位背景：可以说明活动层有广告位数据，但不能替代广告组级判断。";
    proves = "能证明同广告活动存在广告位背景，可提示补齐广告组级广告位证据。";
    evidenceGap = "缺少当前广告组级广告位样本，不能判断广告位是否造成该广告组、搜索词或广告 ASIN 的表现。";
    nextManualStep = "先核对广告位接口是否能下钻到广告组；当前只用搜索词和广告 ASIN 复核，不做广告位结论。";
  }

  return {
    title: `广告位证据判断：${groupName}`,
    status,
    businessQuestion: "当前广告位数据能否解释流量位置问题，还是只是证据缺口？",
    currentJudgement: `广告组级广告位 ${placementCount} 条 / 活动级广告位 ${campaignPlacementCount} 条 / 搜索词 ${searchTermCount} 条 / 广告 ASIN ${adAsinCount} 个。`,
    evidenceLevel,
    proves,
    doesNotProve: "不能证明应自动调整广告位加价、预算或竞价，也不能把广告位影响自动归因到单个搜索词或广告 ASIN。",
    evidenceGap,
    nextManualStep,
  };
}

function productScopeSearchTermDiagnosis(
  row: ProductScopeDrilldownAdGroupDiagnosisForUi,
): ProductScopeSearchTermDiagnosis | null {
  const diagnosis = row.search_term_diagnosis;
  if (!diagnosis) return null;
  const effectiveTerms = productScopeSearchTermDiagnosisTerms(diagnosis.effective_terms ?? []);
  const zeroOrderTerms = productScopeSearchTermDiagnosisTerms(diagnosis.zero_order_terms ?? []);
  return {
    termSummary: diagnosis.term_summary?.trim() || `有效搜索词 ${effectiveTerms.length} 条 / 无订单花费词 ${zeroOrderTerms.length} 条`,
    decision: productScopeSearchTermDecision(row, diagnosis, effectiveTerms, zeroOrderTerms),
    effectiveTerms,
    zeroOrderTerms,
    termBoundary:
      diagnosis.term_boundary?.trim() ||
      "搜索词只说明同广告组上下文，不能自动归因到单个 ASIN；ASIN 型搜索词只能作为商品定向或自动投放上下文复核。",
    nextReviewFocus: diagnosis.next_review_focus?.trim() || row.next_review_focus?.trim() || "优先比较有效搜索词和无订单花费词；没有候选准入前只做诊断。",
    forbiddenActions: diagnosis.forbidden_actions?.length
      ? diagnosis.forbidden_actions
      : ["自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
  };
}

function productScopeSearchTermDiagnosisTerms(
  terms: ProductScopeDrilldownTermForUi[],
): ProductScopeSearchTermDiagnosisTerm[] {
  return terms.slice(0, 3).map((term) => ({
    label: term.search_term?.trim() || term.normalized_query?.trim() || "未知搜索词",
    termTypeLabel: term.term_type === "asin_like" ? "ASIN 型" : "普通搜索词",
    metrics: `花费 ${formatEvidenceNumber(term.spend)} / 点击 ${Math.round(term.clicks ?? 0)} / 订单 ${Math.round(term.orders ?? 0)}`,
    targetingText: term.targeting_text?.trim() || null,
  }));
}

function productScopeSearchTermDecision(
  row: ProductScopeDrilldownAdGroupDiagnosisForUi,
  diagnosis: ProductScopeSearchTermDiagnosisForUi,
  effectiveTerms: ProductScopeSearchTermDiagnosisTerm[],
  zeroOrderTerms: ProductScopeSearchTermDiagnosisTerm[],
): ProductScopeSearchTermDecision {
  const targetingLabels = uniqueNonEmpty([...effectiveTerms, ...zeroOrderTerms].map((term) => term.targetingText));
  const searchTermCount = row.search_term_count ?? effectiveTerms.length + zeroOrderTerms.length;
  const placementCount = row.placement_count ?? 0;
  const campaignPlacementCount = row.campaign_placement_count ?? 0;
  const adAsinCount = row.ad_group_advertised_asin_count ?? row.current_scope_advertised_asin_count ?? 0;
  let proves = "能证明当前广告组存在可人工复核的搜索词样本，但还不能直接判断应做广告动作。";

  if (effectiveTerms.length > 0 && zeroOrderTerms.length > 0) {
    proves = "能证明同广告组内广告搜索词表现分化：有词产生订单，也有词产生花费但没有订单。";
  } else if (effectiveTerms.length > 0) {
    proves = "能证明当前广告组存在产生订单的搜索词，可作为人工复核扩量或稳定承接的线索。";
  } else if (zeroOrderTerms.length > 0) {
    proves = "能证明当前广告组存在花费无订单的搜索词，可作为人工复核相关性、匹配方式和承接的线索。";
  }

  return {
    title: "搜索词业务判断",
    businessQuestion: "这些搜索词是在提示放量机会、浪费风险，还是仅表示广告组上下文？",
    currentJudgement: `有效词 ${effectiveTerms.length} 条 / 无订单花费词 ${zeroOrderTerms.length} 条 / 搜索词样本 ${searchTermCount} 条 / 投放词 ${
      targetingLabels.length
    } 个 / 广告 ASIN ${adAsinCount} 个 / 广告位 ${placementCount} 条 / 活动广告位 ${campaignPlacementCount} 条。`,
    targetingEvidence: targetingLabels.length > 0 ? `触发投放词：${targetingLabels.join("、")}` : "触发投放词：当前搜索词样本未带投放词证据。",
    proves,
    doesNotProve:
      "不能证明应自动加词、自动否词、自动调价，也不能把搜索词归因到单个广告 ASIN；ASIN 型搜索词只能进入商品定向或自动投放上下文复核。",
    nextManualStep:
      diagnosis.next_review_focus?.trim() ||
      row.next_review_focus?.trim() ||
      "先核对投放词、广告 ASIN、商品承接和广告组策略；满足右侧门禁后再人工记录观察或加入复盘。",
  };
}

function productScopeAdGroupDiagnosisTone(status: string | null | undefined): ProductScopeAdGroupDiagnosisRow["statusTone"] {
  if (status === "healthy") return "healthy";
  if (status === "observe") return "observe";
  if (status === "data_gap") return "gap";
  if (status === "suspected_waste" || status === "suspected_conversion_gap") return "risk";
  return "gap";
}

export function buildProductScopeAdmissionCard(summary: SignalTriageSummaryForUi | null | undefined): ProductScopeAdmissionCard | null {
  if (!summary?.actionability_status) return null;
  const actionability = summary.actionability_status;
  const status = actionability.status ?? "unknown";
  const candidateCount = summary.signal_status?.candidate_count ?? 0;
  const signalCount = summary.signal_status?.signal_count ?? 0;
  const message = actionability.message?.trim() || "当前经营对象的 AI 信号准入状态待后端补充。";
  const nextStep = actionability.next_step?.trim() || summary.next_action?.trim() || "先复核当前经营对象的数据关系和证据链。";
  const evidenceItems = productScopeDrilldownEvidenceItems(summary);

  if (status === "requires_product_scope") {
    return {
      title: "AI 信号准入：先选择经营对象",
      statusLabel: "等待选择",
      tone: "pending",
      conclusion: message,
      nextStep,
      manualActionBoundary: "未进入 Parent ASIN / 广告 ASIN 经营对象前，不能写人工动作。",
      evidenceItems,
    };
  }

  if (status === "no_actionable_candidate") {
    return {
      title: "AI 信号准入：暂不进入人工动作",
      statusLabel: actionability.diagnosis_mode === "product_scope_drilldown" ? "只能诊断" : "暂无候选",
      tone: "blocked",
      conclusion: message,
      nextStep,
      manualActionBoundary: `candidate_count=${candidateCount}，不能写人工动作；只允许查看经营诊断、广告下钻证据和数据缺口。`,
      evidenceItems,
    };
  }

  if (actionability.can_write_manual_action === true) {
    return {
      title: "AI 信号准入：可进入人工确认",
      statusLabel: "待人工确认",
      tone: "ready",
      conclusion: message || `当前范围已有 ${candidateCount} 个可进入人工确认的广告对象级候选。`,
      nextStep,
      manualActionBoundary: "只允许人工记录观察、标记已处理、加入复盘或忽略本次；不会自动执行广告动作。",
      evidenceItems,
    };
  }

  return {
    title: "AI 信号准入：等待补齐预检",
    statusLabel: "预检不足",
    tone: "pending",
    conclusion: message,
    nextStep,
    manualActionBoundary: `当前有 ${signalCount} 条信号 / ${candidateCount} 个候选，但缺少人工动作只读预检，不能写人工动作。`,
    evidenceItems,
  };
}

export function buildNoActionableManualGate(summary: SignalTriageSummaryForUi | null | undefined): NoActionableManualGate | null {
  if (!summaryHasNoActionableCandidate(summary)) return null;
  const status = diagnosisStatus(summary);
  const candidateCount = summary?.signal_status?.candidate_count ?? 0;
  const actionability = summary?.actionability_status;
  const message = actionability?.message?.trim() || "当前经营对象没有可进入人工确认的广告对象级候选。";
  const nextStep =
    actionability?.next_step?.trim() ||
    "先按广告 ASIN、广告组、投放词、搜索词和广告位复核数据关系；不要写入人工动作。";
  const allowedPaths = (actionability?.allowed_paths ?? []).map((path) => path?.trim()).filter(Boolean);
  const forbiddenEffects = (actionability?.forbidden_actions ?? []).map((effect) => effect?.trim()).filter(Boolean);

  return {
    title: actionability?.manual_gate_title?.trim() || "暂不进入人工动作",
    statusLabel: status.label,
    reason: message,
    nextStep,
    boundary:
      actionability?.boundary?.trim() ||
      `candidate_count=${candidateCount}，不能写人工动作；右侧不生成广告调整建议，也不自动执行广告动作。`,
    allowedPaths: allowedPaths.length
      ? allowedPaths
      : [
          "查看对象证据矩阵，确认 Parent ASIN、广告 ASIN、广告组和搜索词/广告位关系",
          "继续下钻广告 ASIN / 广告组 / 搜索词 / 广告位",
          "补数据或等待下一次快照候选",
          "记录观察需等候选准入后再由人工点击留痕",
        ],
    forbiddenEffects: forbiddenEffects.length ? forbiddenEffects : ["自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
  };
}

export function buildDiagnosisContextSummary(
  selectedScope: ProductScopeFilterOption | null,
  summary: SignalTriageSummaryForUi | null | undefined,
): DiagnosisContextSummary | null {
  if (!selectedScope && !summary?.actionability_status) return null;

  const status = diagnosisStatus(summary);
  const drilldown = summary?.product_scope_drilldown;
  const candidateCount = summary?.signal_status?.candidate_count ?? 0;
  const signalCount = summary?.signal_status?.signal_count ?? 0;
  const adAsinCount = drilldown?.advertised_asin_count ?? drilldown?.items?.length ?? 0;
  const childAsinCount = selectedScope?.child_asins?.length ?? 0;

  return {
    title: "当前诊断上下文",
    statusLabel: status.label,
    tone: status.tone,
    items: [
      {
        label: "经营入口",
        value: diagnosisScopeLabel(selectedScope),
        detail: childAsinCount > 0 ? `销售表现子 ASIN ${childAsinCount} 个` : null,
      },
      {
        label: "广告覆盖",
        value: adAsinCount > 0 ? `${adAsinCount} 个广告 ASIN` : "待读取广告 ASIN",
        detail: drilldown?.summary ?? "只下钻有广告数据的 ASIN；未投放子 ASIN 不进入广告诊断。",
      },
      {
        label: "准入状态",
        value: status.label,
        detail: summary?.actionability_status?.message?.trim() ?? "以后端 AI 信号准入状态为准。",
      },
      {
        label: "可处理候选",
        value: `${candidateCount} 个`,
        detail: `当前范围信号 ${signalCount} 条`,
      },
    ],
    boundary: diagnosisBoundary(summary),
  };
}

export function buildProductScopeCandidateGapExplanation(
  selectedScope: ProductScopeFilterOption | null,
  summary: SignalTriageSummaryForUi | null | undefined,
): ProductScopeCandidateGapExplanation | null {
  if (!selectedScope || !summaryHasNoActionableCandidate(summary)) return null;
  if (!isAdAsinDiagnosisScope(selectedScope)) return null;

  const selectedAsin = productScopeSelectedAsin(selectedScope);
  const candidateCount = summary?.signal_status?.candidate_count ?? 0;
  const status = diagnosisStatus(summary);
  const drilldown = summary?.product_scope_drilldown;
  const candidateGap = drilldown?.candidate_gap_analysis;
  const checks = candidateGap?.checks?.filter((check) => check?.object_id || check?.object_label) ?? [];
  const matchedCheck = checks.find((check) => productScopeCandidateGapCheckMatchesAsin(check, selectedAsin)) ?? checks[0] ?? null;
  if (!candidateGap && !matchedCheck && candidateCount > 0) return null;

  const selectedLabel = selectedAsin || matchedCheck?.object_label || matchedCheck?.object_id || selectedScope.label || "当前广告 ASIN";
  const reasons = [
    matchedCheck?.anomaly_check,
    matchedCheck?.opportunity_check,
    matchedCheck?.diagnosis_context,
    matchedCheck?.next_review_focus,
  ].filter((text): text is string => Boolean(text?.trim()));

  return {
    title: "广告 ASIN 候选缺口解释",
    summary: `${selectedLabel} 当前可处理候选 ${candidateCount} 个；${
      candidateGap?.summary?.trim() || summary?.actionability_status?.message?.trim() || "现有信号规则没有命中可进入人工确认的对象级候选。"
    }`,
    admission: `${status.label} / 候选 ${candidateCount} 个`,
    reasons: reasons.length
      ? reasons
      : [summary?.actionability_status?.message?.trim() || "当前证据只支持诊断和下钻，不足以写入人工动作。"],
    nextStep:
      summary?.actionability_status?.next_step?.trim() ||
      matchedCheck?.next_review_focus?.trim() ||
      "继续下钻广告组、投放词、搜索词和广告位证据。",
    boundary: uniqueNonEmpty([candidateGap?.boundary, summary?.actionability_status?.boundary, drilldown?.boundary]).join("；"),
  };
}

export function buildDiagnosisPathSummary(
  selectedScope: ProductScopeFilterOption | null,
  summary: SignalTriageSummaryForUi | null | undefined,
): DiagnosisPathSummary | null {
  if (!selectedScope && !summary?.actionability_status) return null;

  const status = diagnosisStatus(summary);
  const drilldown = summary?.product_scope_drilldown;
  const topGroup = drilldown?.items?.[0]?.top_ad_group;
  const adAsinCount = drilldown?.advertised_asin_count ?? drilldown?.items?.length ?? 0;
  const candidateCount = summary?.signal_status?.candidate_count ?? 0;
  const canWriteManualAction = summary?.actionability_status?.can_write_manual_action === true;
  const manualActionCount = summary?.review_status?.manual_action_count ?? 0;
  const readyReviewCount = summary?.review_status?.ready_count ?? 0;
  const topAdGroupName = topGroup?.ad_group_name?.trim() || topGroup?.ad_group_id?.trim();
  const targetingCount = topGroup?.targeting_context?.targeting_count ?? 0;
  const searchTermCount = topGroup?.search_term_count ?? 0;
  const placementCount = topGroup?.placement_count ?? 0;
  const manualStepValue =
    canWriteManualAction && candidateCount > 0
      ? `待人工确认 / 候选 ${candidateCount} 个`
      : candidateCount > 0
        ? `候选 ${candidateCount} 个 / 等待门禁`
        : "只能诊断 / 候选 0 个";
  const manualStepTone: DiagnosisPathSummaryStep["tone"] =
    canWriteManualAction && candidateCount > 0 ? "ready" : candidateCount > 0 ? "neutral" : "blocked";
  const reviewStepValue =
    readyReviewCount > 0
      ? `${readyReviewCount} 个 ready 复盘待人工保存`
      : manualActionCount > 0
        ? `已有 ${manualActionCount} 条人工留痕，等待 7/14 天窗口`
        : "人工留痕后生成 ReviewTodo";
  const reviewStepTone: DiagnosisPathSummaryStep["tone"] = readyReviewCount > 0 ? "ready" : manualActionCount > 0 ? "neutral" : "blocked";

  return {
    title: "当前诊断路径",
    description: diagnosisPathDescription(selectedScope),
    steps: [
      {
        label: "经营入口",
        value: diagnosisScopeLabel(selectedScope),
        tone: "active",
      },
      {
        label: "广告 ASIN",
        value: adAsinCount > 0 ? `${adAsinCount} 个广告 ASIN` : "待读取广告 ASIN",
        tone: "context",
      },
      {
        label: "广告组",
        value: topAdGroupName ?? "按广告 ASIN 下钻",
        tone: "context",
      },
      {
        label: "投放词/搜索词/广告位",
        value: topGroup ? `投放词 ${targetingCount} 个 / 搜索词 ${searchTermCount} 条 / 广告位 ${placementCount} 条` : "等待广告组上下文",
        tone: "context",
      },
      {
        label: "AI 准入",
        value: `${status.label} / 候选 ${candidateCount} 个`,
        tone: status.tone === "blocked" ? "blocked" : status.tone === "ready" ? "ready" : "neutral",
      },
      {
        label: "人工确认",
        value: manualStepValue,
        tone: manualStepTone,
      },
      {
        label: "7/14 天复盘",
        value: reviewStepValue,
        tone: reviewStepTone,
      },
    ],
    boundary: `${diagnosisBoundary(summary)}${candidateCount === 0 ? " candidate_count=0，不能写人工动作。" : ""} 未完成人工留痕和 ready 复盘前，不能保存 ReviewRecord 或判断处理有效。`,
  };
}

export function buildProductScopeEvidenceMatrix(
  selectedScope: ProductScopeFilterOption | null,
  summary: SignalTriageSummaryForUi | null | undefined,
): ProductScopeEvidenceMatrix | null {
  const drilldown = summary?.product_scope_drilldown;
  const topItem = drilldown?.items?.[0];
  const topGroup = topItem?.top_ad_group;
  if (!selectedScope && !drilldown && !summary?.actionability_status) return null;

  const status = diagnosisStatus(summary);
  const candidateCount = summary?.signal_status?.candidate_count ?? 0;
  const childAsinCount = selectedScope?.child_asins?.length ?? 0;
  const adAsinCount = drilldown?.advertised_asin_count ?? drilldown?.items?.length ?? 0;
  const topAdAsin = topItem?.asin?.trim() || "待选择广告 ASIN";
  const topAdGroupName = topGroup?.ad_group_name?.trim() || topGroup?.ad_group_id?.trim() || "等待广告组上下文";
  const adGroupAsinCount = topGroup?.ad_group_advertised_asin_count ?? uniqueNonEmpty(topGroup?.ad_group_advertised_asins ?? []).length;
  const targetingContext = topGroup?.targeting_context;
  const targetingCount = targetingContext?.targeting_count ?? 0;
  const targetingNames = productScopeTargetingNames(targetingContext);
  const effectiveTerms = productScopeTermNames(topGroup?.effective_search_terms);
  const zeroOrderTerms = productScopeTermNames(topGroup?.zero_order_search_terms);
  const trafficParts = [
    targetingNames.length > 0 ? `投放词：${targetingNames.join("、")}` : "",
    effectiveTerms.length > 0 ? `有效搜索词：${effectiveTerms.join("、")}` : "",
    zeroOrderTerms.length > 0 ? `无订单花费词：${zeroOrderTerms.join("、")}` : "",
  ].filter(Boolean);
  const trafficBoundary = uniqueNonEmpty([
    targetingContext?.next_review_focus,
    targetingContext?.boundary,
    "搜索词和广告位用于定位问题来源，不能自动归因到单个 ASIN，也不能自动否词或调价。",
  ]).join("；");

  const rows: ProductScopeEvidenceMatrixRow[] = [
    {
      layerId: "scope",
      layerLabel: "经营入口",
      objectLabel: diagnosisScopeLabel(selectedScope),
      evidenceLabel: "销售表现口径",
      value:
        childAsinCount > 0
          ? `销售表现子 ASIN ${childAsinCount} 个 / 订单 ${selectedScope?.sales_orders ?? 0} / 销售额 ${formatScopeMoney(selectedScope?.sales_amount)}`
          : "等待销售表现或 Parent ASIN 口径",
      detail: "Parent ASIN 是经营盘子入口；未投放子 ASIN 只作为销售背景，不进入广告信号队列。",
      source: "销售表现 / sales_product_daily_metrics",
      tone: "scope",
    },
    {
      layerId: "ad_asin",
      layerLabel: "广告 ASIN",
      objectLabel: topAdAsin,
      evidenceLabel: "广告商品表现",
      value: `${adAsinCount} 个广告 ASIN / 优先 ${topAdAsin} / 花费 ${formatEvidenceNumber(topItem?.spend)} / 订单 ${Math.round(topItem?.orders ?? 0)}`,
      detail: drilldown?.summary ?? "只下钻当前商品范围内有广告数据的 ASIN。",
      source: "积加API / advertised_products",
      tone: "direct",
    },
    {
      layerId: "ad_group",
      layerLabel: "广告组",
      objectLabel: topAdGroupName,
      evidenceLabel: "投放容器边界",
      value: `同组 ${adGroupAsinCount} 个广告 ASIN / 搜索词 ${topGroup?.search_term_count ?? 0} 条 / 广告位 ${topGroup?.placement_count ?? 0} 条`,
      detail: topGroup?.ad_group_attribution_boundary ?? "广告组是投放容器，搜索词和广告位只能说明广告组上下文。",
      source: "积加API / ad_groups / advertised_products",
      tone: "context",
    },
    {
      layerId: "traffic_context",
      layerLabel: "投放词/搜索词/广告位",
      objectLabel: `投放词 ${targetingCount} 个 / 搜索词 ${topGroup?.search_term_count ?? 0} 条 / 广告位 ${topGroup?.placement_count ?? 0} 条`,
      evidenceLabel: "流量上下文",
      value: trafficParts.length > 0 ? trafficParts.join("；") : "等待投放词、有效词、无订单词或广告位明细",
      detail: trafficBoundary,
      source: "积加API / ad_search_term_daily_metrics / ad_placement_daily_metrics",
      tone: "context",
    },
    {
      layerId: "admission",
      layerLabel: "AI 准入",
      objectLabel: `${status.label} / 候选 ${candidateCount} 个`,
      evidenceLabel: "人工动作门禁",
      value: summary?.actionability_status?.next_step?.trim() || "先复核广告 ASIN、广告组、搜索词和广告位证据。",
      detail:
        candidateCount === 0
          ? "candidate_count=0，不能写人工动作；只能查看诊断、证据缺口或继续下钻。"
          : "只允许人工记录观察、标记已处理、加入复盘或忽略本次。",
      source: "系统准入 / actionability_status",
      tone: status.tone === "blocked" ? "blocked" : status.tone === "ready" ? "ready" : "neutral",
    },
  ];

  return {
    title: "对象证据矩阵",
    summary: diagnosisPathDescription(selectedScope),
    rows,
    boundary: diagnosisBoundary(summary),
  };
}

export function buildProductScopeEvidenceRouteGuide(matrix: ProductScopeEvidenceMatrix): ProductScopeEvidenceRouteGuide {
  const rowByLayer = (layerId: ProductScopeEvidenceMatrixRow["layerId"]) => matrix.rows.find((row) => row.layerId === layerId);
  const routeStepFromRow = (
    row: ProductScopeEvidenceMatrixRow | undefined,
    order: number,
    label: string,
    fallbackObject: string,
    fallbackEvidence: string,
    fallbackFocus: string,
  ): ProductScopeEvidenceRouteGuideStep => ({
    order,
    layerId: row?.layerId ?? "ai_signal",
    label,
    objectLabel: row?.objectLabel ?? fallbackObject,
    primaryEvidence: row ? `${row.evidenceLabel}：${row.value}` : fallbackEvidence,
    nextFocus: row?.detail ?? fallbackFocus,
    tone: row?.tone ?? "neutral",
  });
  const scopeRow = rowByLayer("scope");
  const adAsinRow = rowByLayer("ad_asin");
  const adGroupRow = rowByLayer("ad_group");
  const trafficRow = rowByLayer("traffic_context");
  const admissionRow = rowByLayer("admission");
  const admissionObject = admissionRow?.objectLabel ?? "AI 准入待确认";
  const admissionEvidence = admissionRow ? `${admissionRow.evidenceLabel}：${admissionRow.value}` : "人工动作门禁：等待 actionability_status";
  const admissionFocus = admissionRow?.detail ?? "先补齐广告 ASIN、广告组、投放词、搜索词和广告位证据。";
  const reviewTone = admissionRow?.tone === "ready" ? "ready" : admissionRow?.tone === "blocked" ? "blocked" : "neutral";

  return {
    title: "广告证据链导览",
    summary: "先看经营入口，再看广告 ASIN、广告组、投放词/搜索词/广告位、AI 信号诊断、人工确认和 7/14 天复盘。",
    decision: buildProductScopeEvidenceRouteDecision(matrix),
    layerSummary: buildProductScopeEvidenceRouteLayerSummary(matrix),
    steps: [
      routeStepFromRow(
        scopeRow,
        1,
        "Parent ASIN 经营盘",
        "等待经营入口",
        "销售表现口径：等待销售表现证据",
        "先确认 Parent ASIN 和销售表现子 ASIN 口径。",
      ),
      routeStepFromRow(
        adAsinRow,
        2,
        "广告 ASIN 覆盖",
        "等待广告 ASIN",
        "广告商品表现：等待 advertised_products 证据",
        "只下钻有广告数据的广告 ASIN。",
      ),
      routeStepFromRow(
        adGroupRow,
        3,
        "广告组结构",
        "等待广告组上下文",
        "投放容器边界：等待 ad_groups 证据",
        "广告组是投放容器，不是产品。",
      ),
      routeStepFromRow(
        trafficRow,
        4,
        "投放词 / 搜索词 / 广告位",
        "等待流量上下文",
        "流量上下文：等待搜索词、投放词或广告位证据",
        "搜索词和广告位只能作为同广告组上下文证据。",
      ),
      {
        order: 5,
        layerId: "ai_signal",
        label: "AI 信号诊断",
        objectLabel: admissionObject,
        primaryEvidence: admissionEvidence,
        nextFocus: `${admissionFocus} 诊断区必须解释业务问题、指标目的、能证明什么和不能证明什么。`,
        tone: admissionRow?.tone ?? "neutral",
      },
      {
        order: 6,
        layerId: "manual_confirmation",
        label: "人工确认",
        objectLabel: admissionObject,
        primaryEvidence: "人工动作门禁：只允许记录观察、标记已处理、加入复盘或忽略本次。",
        nextFocus:
          admissionRow?.tone === "ready"
            ? "人工点击前继续核对证据快照、对象身份和动作边界。"
            : "未通过 AI 准入时不能写 ManualAction，也不能包装成广告调整建议。",
        tone: admissionRow?.tone ?? "neutral",
      },
      {
        order: 7,
        layerId: "review",
        label: "7/14 天复盘",
        objectLabel: "等待人工留痕和 ReviewTodo",
        primaryEvidence: "复盘门槛：先有人工留痕和 7d / 14d ReviewTodo，到期后人工保存 ReviewRecord。",
        nextFocus: "复盘只评价人工处理后的指标变化，不能自动改规则、调价、加词或否词。",
        tone: reviewTone,
      },
    ],
    boundary: matrix.boundary,
  };
}

export function buildProductScopeEvidenceRouteLayerSummary(
  matrix: ProductScopeEvidenceMatrix,
): ProductScopeEvidenceRouteLayerSummaryItem[] {
  const directLayerCount = matrix.rows.filter((row) => row.layerId === "scope" || row.layerId === "ad_asin").length;
  const contextLayerCount = matrix.rows.filter((row) => row.layerId === "ad_group" || row.layerId === "traffic_context").length;
  const admissionRow = matrix.rows.find((row) => row.layerId === "admission");
  const isBlocked = admissionRow?.tone === "blocked" || admissionRow?.detail.includes("candidate_count=0");
  const isReady = admissionRow?.tone === "ready";
  const gateTone: ProductScopeEvidenceRouteDecision["statusTone"] = isReady ? "ready" : isBlocked ? "blocked" : "context";
  const gateValue = isReady ? "可人工复核" : isBlocked ? "只能诊断" : "证据待补齐";
  const reviewValue = isReady ? "动作后复盘" : "等待人工留痕";

  return [
    {
      label: "直接证据",
      value: `${directLayerCount} 层`,
      description: "经营入口和广告 ASIN 分开读，未投放子 ASIN 不进入广告动作对象。",
      tone: "ready",
    },
    {
      label: "上下文证据",
      value: `${contextLayerCount} 层`,
      description: "广告组、投放词、搜索词和广告位只解释流量来源与归因边界。",
      tone: "context",
    },
    {
      label: "AI 准入",
      value: gateValue,
      description: admissionRow?.value ?? "先补齐广告 ASIN、广告组、搜索词和广告位证据。",
      tone: gateTone,
    },
    {
      label: "复盘路径",
      value: reviewValue,
      description: "先有人工动作和 ReviewTodo，到期后才人工保存 7/14 天 ReviewRecord。",
      tone: isReady ? "ready" : "context",
    },
  ];
}

export function buildProductScopeEvidenceRouteDecision(matrix: ProductScopeEvidenceMatrix): ProductScopeEvidenceRouteDecision {
  const adAsinRow = matrix.rows.find((row) => row.layerId === "ad_asin");
  const adGroupRow = matrix.rows.find((row) => row.layerId === "ad_group");
  const trafficRow = matrix.rows.find((row) => row.layerId === "traffic_context");
  const admissionRow = matrix.rows.find((row) => row.layerId === "admission");

  const isBlocked = admissionRow?.tone === "blocked" || admissionRow?.detail.includes("candidate_count=0");
  const isReady = admissionRow?.tone === "ready";
  const statusLabel = isReady ? "可人工复核" : isBlocked ? "只能诊断" : "证据待补齐";
  const statusTone: ProductScopeEvidenceRouteDecision["statusTone"] = isReady ? "ready" : isBlocked ? "blocked" : "context";
  const adAsinLabel = adAsinRow?.objectLabel || "待选择广告 ASIN";
  const adGroupLabel = adGroupRow?.objectLabel || "等待广告组上下文";
  const trafficLabel = trafficRow?.objectLabel || "等待搜索词/广告位上下文";
  const admissionLabel = admissionRow?.objectLabel || "AI 准入待确认";
  const admissionNextStep = admissionRow?.value || "先复核广告 ASIN、广告组、搜索词和广告位证据。";

  return {
    title: "路径可落地判断",
    statusLabel,
    statusTone,
    businessQuestion: "这条 Parent ASIN 路径下，哪些广告对象真的有广告数据，是否足够支撑人工复核？",
    currentJudgement: `当前链路定位到广告 ASIN ${adAsinLabel}、广告组 ${adGroupLabel} 和 ${trafficLabel}；AI 准入为 ${admissionLabel}。`,
    proves: `能证明当前经营入口下的广告分析只落到有广告表现的对象：广告 ASIN ${adAsinLabel}、广告组 ${adGroupLabel}，以及同广告组的搜索词/广告位上下文。`,
    doesNotProve:
      "不能证明未投放子 ASIN 存在广告问题，也不能把搜索词、广告位或 ABA 市场热度自动归因到单个广告 ASIN。",
    nextManualStep: isReady
      ? `下一步人工复核：${admissionNextStep}`
      : `下一步先补证据或继续只读诊断：${admissionNextStep}`,
  };
}

function isAdAsinDiagnosisScope(scope: ProductScopeFilterOption): boolean {
  return (
    scope.scope_type === "advertised_asin" ||
    scope.scope_type === "sales_asin" ||
    scope.scope_id.startsWith("ad_asin:") ||
    scope.scope_id.startsWith("sales_asin:")
  );
}

function productScopeSelectedAsin(scope: ProductScopeFilterOption): string {
  return (
    scope.asin?.trim() ||
    scope.scope_id.replace("ad_asin:", "").replace("sales_asin:", "").trim()
  );
}

function productScopeCandidateGapCheckMatchesAsin(
  check: NonNullable<NonNullable<ProductScopeDrilldownForUi["candidate_gap_analysis"]>["checks"]>[number],
  asin: string,
) {
  const normalizedAsin = asin.trim().toLowerCase();
  if (!normalizedAsin) return false;
  return [check.object_id, check.object_label].some((value) => value?.trim().toLowerCase() === normalizedAsin);
}

function diagnosisStatus(summary: SignalTriageSummaryForUi | null | undefined): { label: string; tone: DiagnosisSummaryTone } {
  const actionability = summary?.actionability_status;
  if (!actionability) return { label: "口径待确认", tone: "neutral" };

  if (actionability.status === "requires_product_scope") {
    return { label: "等待选择", tone: "pending" };
  }

  if (actionability.status === "no_actionable_candidate") {
    return {
      label: actionability.diagnosis_mode === "product_scope_drilldown" ? "只能诊断" : "暂无候选",
      tone: "blocked",
    };
  }

  if (actionability.can_write_manual_action === true) {
    return { label: "待人工确认", tone: "ready" };
  }

  return { label: "预检不足", tone: "pending" };
}

function diagnosisScopeLabel(selectedScope: ProductScopeFilterOption | null): string {
  if (!selectedScope) return "未选择经营对象";
  if (selectedScope.scope_type === "parent_asin" || selectedScope.scope_id.startsWith("parent_asin:")) {
    return `Parent ASIN ${selectedScope.parent_asin ?? selectedScope.scope_id.replace("parent_asin:", "")}`;
  }
  if (selectedScope.scope_type === "advertised_asin") {
    return `广告 ASIN ${selectedScope.asin ?? selectedScope.label ?? selectedScope.scope_id.replace("ad_asin:", "")}`;
  }
  if (selectedScope.scope_type === "sales_asin") {
    return `销售背景 ASIN ${selectedScope.asin ?? selectedScope.label ?? selectedScope.scope_id.replace("sales_asin:", "")}`;
  }
  if (selectedScope.scope_id === "unattributed" || selectedScope.scope_type === "unattributed") {
    return "未归因广告数据";
  }
  if (selectedScope.scope_id === "all" || selectedScope.scope_type === "all") {
    return "全量排查";
  }
  return selectedScope.label ?? selectedScope.scope_id;
}

function diagnosisPathDescription(selectedScope: ProductScopeFilterOption | null): string {
  if (selectedScope?.scope_type === "parent_asin" || selectedScope?.scope_id.startsWith("parent_asin:")) {
    return "Parent ASIN -> 广告 ASIN -> 广告组 -> 投放词/搜索词/广告位 -> AI 准入 -> 人工确认 -> 7/14 天复盘";
  }
  if (selectedScope?.scope_type === "advertised_asin") {
    return "广告 ASIN -> 广告组 -> 投放词/搜索词/广告位 -> AI 准入 -> 人工确认 -> 7/14 天复盘";
  }
  return "经营入口 -> 广告证据 -> AI 准入 -> 人工确认 -> 7/14 天复盘";
}

function diagnosisBoundary(summary: SignalTriageSummaryForUi | null | undefined): string {
  return (
    summary?.product_scope_drilldown?.boundary?.trim() ||
    summary?.actionability_status?.next_step?.trim() ||
    summary?.actionability_status?.message?.trim() ||
    "搜索词和广告位只说明同广告组上下文，不能自动归因到单个 ASIN。"
  );
}

export function signalTriageDiagnosisPathItems(items: SignalTriageBusinessEvidenceItem[]): SignalTriageDiagnosisPathItem[] {
  const pathItems = diagnosisPathBlockSlots
    .map((slot) => {
      const item = items.find((evidenceItem) => slot.blockIds.includes(evidenceItem.blockId) || slot.labels.includes(evidenceItem.label));
      return item ? { item, slot } : null;
    })
    .filter((entry): entry is { item: SignalTriageBusinessEvidenceItem; slot: (typeof diagnosisPathBlockSlots)[number] } => Boolean(entry));

  return pathItems.map(({ item, slot }, index) => ({
    ...item,
    label: slot.displayLabel ?? item.label,
    step: index + 1,
  }));
}

export function triggerEvidenceCountText(count: number): string {
  return `${count} 条触发证据行`;
}

function evidenceDrilldownText(
  summary: SignalTriageSummaryForUi | null | undefined,
  drilldown: NonNullable<SignalTriageSummaryForUi["recommended_evidence_drilldown"]> | null | undefined,
  objectLabel: string,
  prefix: string,
  emptyText: string,
): string {
  if (!drilldown) return `${prefix}：${emptyText}`;
  const summaryText = drilldown.summary || "暂无摘要";
  const isSalesProductEvidence = drilldown.metric_summary?.basis === "sales_product_daily_metrics" || drilldown.sales_product_summary?.basis === "sales_product_daily_metrics";
  const metricText = isSalesProductEvidence || summaryText.includes("证据行合计") ? "" : recommendedEvidenceMetricText(drilldown.metric_summary);
  const coverageText =
    summaryText.includes("raw 全量广告商品行") || summaryText.includes("全量投放覆盖")
      ? ""
      : recommendedEvidenceCoverageText(drilldown.all_asin_ad_coverage);
  const businessBlocksText = businessEvidenceBlocksText(drilldown.business_evidence_blocks);
  const topSpendText = summaryText.includes("主要花费") ? "" : recommendedEvidenceTopSpendText(drilldown.top_spend_campaign);
  const firstRow = drilldown.ad_product_rows?.[0];
  const firstRowText =
    firstRow?.campaign_name || firstRow?.ad_group_name
      ? `；首条投放行：${[firstRow?.campaign_name, firstRow?.ad_group_name].filter(Boolean).join(" / ")}`
      : "";
  const boundaryText = drilldown.boundary && !summaryText.includes(drilldown.boundary) ? `；${drilldown.boundary}` : "";
  return `${prefix}：${objectLabel}；${summaryText}${businessBlocksText}${metricText}${coverageText}${topSpendText}${firstRowText}${boundaryText}`;
}

function businessEvidenceBlocksText(
  blocks: NonNullable<NonNullable<SignalTriageSummaryForUi["recommended_evidence_drilldown"]>["business_evidence_blocks"]> | null | undefined,
): string {
  if (!blocks?.length) return "";
  const parts = blocks
    .filter((block) => block.label && block.value)
    .slice(0, 6)
    .map((block) => {
      const detail = block.detail ? `（${block.detail}）` : "";
      return `${block.label}：${block.value}${detail}`;
    });
  return parts.length ? `；业务证据与上下文：${parts.join("；")}` : "";
}

function recommendedEvidenceMetricText(metricSummary: NonNullable<SignalTriageSummaryForUi["recommended_evidence_drilldown"]>["metric_summary"]): string {
  if (!metricSummary) return "";
  const rowCountText = typeof metricSummary.row_count === "number" && Number.isFinite(metricSummary.row_count) ? `${metricSummary.row_count} 条 / ` : "";
  const spend = formatEvidenceNumber(metricSummary.spend);
  const orders = Math.round(metricSummary.orders ?? 0);
  const sales = formatEvidenceNumber(metricSummary.sales);
  const acos = formatEvidencePercent(metricSummary.acos);
  const cvr = formatEvidencePercent(metricSummary.cvr);
  return `；触发证据行合计：${rowCountText}花费 ${spend} / 订单 ${orders} / 销售额 ${sales} / ACOS ${acos} / CVR ${cvr}`;
}

function recommendedEvidenceTopSpendText(topSpend: NonNullable<SignalTriageSummaryForUi["recommended_evidence_drilldown"]>["top_spend_campaign"]): string {
  if (!topSpend?.label) return "";
  return `；主要花费来源：${topSpend.label}，占比 ${formatEvidencePercent(topSpend.spend_share)}`;
}

function recommendedEvidenceCoverageText(coverage: NonNullable<SignalTriageSummaryForUi["recommended_evidence_drilldown"]>["all_asin_ad_coverage"]): string {
  if (!coverage) return "";
  const rawCount = coverage.raw_ad_product_row_count ?? 0;
  const recommendedCount = coverage.recommended_ad_product_row_count ?? 0;
  const missingCount = coverage.missing_ad_product_row_count ?? 0;
  const reasonText = recommendedEvidenceCoverageReasonText(coverage.missing_reason_summary);
  const missingRowsText = recommendedEvidenceMissingRowsText(coverage.missing_ad_product_rows);
  return `；全量投放覆盖：raw 行 ${rawCount} / 推荐证据 ${recommendedCount} / 未覆盖 ${missingCount} / 覆盖率 ${formatEvidencePercent(coverage.coverage_ratio)}${reasonText}${missingRowsText}`;
}

function recommendedEvidenceCoverageReasonText(reasonSummary: Record<string, number> | null | undefined): string {
  if (!reasonSummary) return "";
  const parts = Object.entries(reasonSummary)
    .filter(([, count]) => typeof count === "number" && count > 0)
    .map(([reason, count]) => `${reason} ${count} 条`);
  return parts.length ? `；未覆盖原因：${parts.join("，")}` : "";
}

function recommendedEvidenceMissingRowsText(
  rows: NonNullable<NonNullable<SignalTriageSummaryForUi["recommended_evidence_drilldown"]>["all_asin_ad_coverage"]>["missing_ad_product_rows"],
): string {
  if (!rows?.length) return "";
  const parts = rows.slice(0, 3).map((row) => {
    const campaign = row.campaign_name || "未知广告活动";
    const adGroup = row.ad_group_name || "未知广告组";
    return `${campaign} / ${adGroup} 花费 ${formatEvidenceNumber(row.spend)} 订单 ${Math.round(row.orders ?? 0)}`;
  });
  return parts.length ? `；未覆盖投放行：${parts.join("；")}` : "";
}

function formatEvidenceNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "-";
}

function formatEvidencePercent(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "-";
}

function formatReviewNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function formatReviewPercent(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "-";
}

function searchIntentOperationDecision(metrics: SearchIntentSummaryForUi["metrics"]): Pick<
  SearchIntentReviewCard,
  "operationDecisionLabel" | "operationDecisionReason" | "operationDecisionTone"
> {
  if (metrics.orders >= 3 && typeof metrics.acos === "number" && metrics.acos <= 0.3) {
    return {
      operationDecisionLabel: "扩量复核",
      operationDecisionReason: `订单 ${metrics.orders} 且 ACOS ${formatReviewPercent(metrics.acos)}，优先打开具体 SearchTerm 核对投放词、广告组和广告位后再人工加入观察或复盘。`,
      operationDecisionTone: "scale",
    };
  }
  if (metrics.orders === 0 && metrics.cost >= 30) {
    return {
      operationDecisionLabel: "止损复核",
      operationDecisionReason: `花费 ${formatReviewNumber(metrics.cost)} 但订单 0，优先打开具体 SearchTerm 核对投放词、广告组商品和广告位缺口后再人工判断。`,
      operationDecisionTone: "waste",
    };
  }
  return {
    operationDecisionLabel: "观察复核",
    operationDecisionReason: `当前订单 ${metrics.orders}、花费 ${formatReviewNumber(metrics.cost)}，样本或证据还不足以直接判断扩量或止损，先打开具体 SearchTerm 补证。`,
    operationDecisionTone: "observe",
  };
}

function searchIntentTopTermText(term: SearchIntentTopTermForUi | undefined): string | null {
  return stringValue(term?.search_term) || stringValue(term?.normalized_query) || null;
}

function compareSearchIntentNumbers(left: number | null | undefined, right: number | null | undefined): number {
  const leftValue = typeof left === "number" && Number.isFinite(left) ? left : Number.NEGATIVE_INFINITY;
  const rightValue = typeof right === "number" && Number.isFinite(right) ? right : Number.NEGATIVE_INFINITY;
  return rightValue - leftValue;
}

function compareSearchIntentAcos(left: number | null | undefined, right: number | null | undefined): number {
  const leftValue = typeof left === "number" && Number.isFinite(left) ? left : Number.POSITIVE_INFINITY;
  const rightValue = typeof right === "number" && Number.isFinite(right) ? right : Number.POSITIVE_INFINITY;
  return leftValue - rightValue;
}

function representativeSearchIntentTopTerm(topTerms: SearchIntentTopTermForUi[]): SearchIntentTopTermForUi | undefined {
  return [...topTerms].sort(
    (left, right) =>
      compareSearchIntentNumbers(left.source_row_count, right.source_row_count) ||
      compareSearchIntentNumbers(left.cost, right.cost) ||
      compareSearchIntentNumbers(left.clicks, right.clicks),
  )[0];
}

function searchIntentSourceRowCount(summary: SearchIntentSummaryForUi): number {
  return (summary.top_search_terms ?? []).reduce((total, term) => {
    const count = typeof term.source_row_count === "number" && Number.isFinite(term.source_row_count) ? term.source_row_count : 0;
    return total + count;
  }, 0);
}

function searchIntentDecisionPriority(tone: SearchIntentReviewCard["operationDecisionTone"]): number {
  if (tone === "waste") return 3;
  if (tone === "scale") return 2;
  return 1;
}

function compareSearchIntentReviewPriority(
  leftSummary: SearchIntentSummaryForUi,
  leftTone: SearchIntentReviewCard["operationDecisionTone"],
  rightSummary: SearchIntentSummaryForUi,
  rightTone: SearchIntentReviewCard["operationDecisionTone"],
): number {
  const decisionOrder = searchIntentDecisionPriority(rightTone) - searchIntentDecisionPriority(leftTone);
  if (decisionOrder !== 0) return decisionOrder;

  if (leftTone === "waste") {
    return (
      compareSearchIntentNumbers(leftSummary.metrics.cost, rightSummary.metrics.cost) ||
      compareSearchIntentNumbers(leftSummary.metrics.clicks, rightSummary.metrics.clicks) ||
      compareSearchIntentNumbers(searchIntentSourceRowCount(leftSummary), searchIntentSourceRowCount(rightSummary)) ||
      compareSearchIntentNumbers(leftSummary.aba_match_count ?? 0, rightSummary.aba_match_count ?? 0)
    );
  }

  if (leftTone === "scale") {
    return (
      compareSearchIntentNumbers(leftSummary.metrics.orders, rightSummary.metrics.orders) ||
      compareSearchIntentAcos(leftSummary.metrics.acos, rightSummary.metrics.acos) ||
      compareSearchIntentNumbers(leftSummary.metrics.sales, rightSummary.metrics.sales) ||
      compareSearchIntentNumbers(searchIntentSourceRowCount(leftSummary), searchIntentSourceRowCount(rightSummary)) ||
      compareSearchIntentNumbers(leftSummary.aba_match_count ?? 0, rightSummary.aba_match_count ?? 0)
    );
  }

  return (
    compareSearchIntentNumbers(searchIntentSourceRowCount(leftSummary), searchIntentSourceRowCount(rightSummary)) ||
    compareSearchIntentNumbers(leftSummary.metrics.cost, rightSummary.metrics.cost) ||
    compareSearchIntentNumbers(leftSummary.metrics.clicks, rightSummary.metrics.clicks) ||
    compareSearchIntentNumbers(leftSummary.aba_match_count ?? 0, rightSummary.aba_match_count ?? 0)
  );
}

function selectPrimarySearchTermForOperationDecision(
  summary: SearchIntentSummaryForUi,
  operationDecisionTone: SearchIntentReviewCard["operationDecisionTone"],
): Pick<SearchIntentReviewCard, "primarySearchTerm" | "primarySearchTermReason"> {
  const topTerms = (summary.top_search_terms ?? []).filter((term) => searchIntentTopTermText(term));
  const fallbackSearchTerm = stringValue(summary.search_terms[0]) || null;
  if (topTerms.length === 0) {
    return {
      primarySearchTerm: fallbackSearchTerm,
      primarySearchTermReason: fallbackSearchTerm
        ? "当前缺少逐词广告指标，先打开聚合组内第一个 SearchTerm 补齐广告组和投放词证据。"
        : "当前没有可落到具体 SearchTerm 的广告搜索词表现行，先补齐搜索词快照。",
    };
  }

  if (operationDecisionTone === "scale") {
    const scaleCandidate = [...topTerms]
      .filter((term) => term.orders > 0)
      .sort(
        (left, right) =>
          compareSearchIntentNumbers(left.orders, right.orders) ||
          compareSearchIntentAcos(left.acos, right.acos) ||
          compareSearchIntentNumbers(left.sales, right.sales) ||
          compareSearchIntentNumbers(left.cost, right.cost),
      )[0];
    if (scaleCandidate) {
      return {
        primarySearchTerm: searchIntentTopTermText(scaleCandidate),
        primarySearchTermReason: "扩量复核先看有订单、订单更多且 ACOS 更低的具体 SearchTerm。",
      };
    }
  }

  if (operationDecisionTone === "waste") {
    const wasteCandidate = [...topTerms]
      .filter((term) => term.orders === 0)
      .sort(
        (left, right) =>
          compareSearchIntentNumbers(left.cost, right.cost) || compareSearchIntentNumbers(left.clicks, right.clicks),
      )[0];
    if (wasteCandidate) {
      return {
        primarySearchTerm: searchIntentTopTermText(wasteCandidate),
        primarySearchTermReason: "止损复核先看无订单且花费最高的具体 SearchTerm。",
      };
    }
  }

  const representativeCandidate = representativeSearchIntentTopTerm(topTerms);
  return {
    primarySearchTerm: searchIntentTopTermText(representativeCandidate) || fallbackSearchTerm,
    primarySearchTermReason: "观察复核先看当前聚合组内样本行数和消耗更有代表性的具体 SearchTerm。",
  };
}

function searchIntentMetricPurposeItems(
  summary: SearchIntentSummaryForUi,
  operationDecisionTone: SearchIntentReviewCard["operationDecisionTone"],
): SearchIntentMetricPurposeItem[] {
  const metrics = summary.metrics;
  const rowCount = searchIntentSourceRowCount(summary);
  const rowText = rowCount > 0 ? `表现行 ${rowCount} 条` : "表现行待补";
  const gapText = searchIntentDisplayText(summary.evidence_gap).replace(/^证据缺口[:：]\s*/, "");
  const operationText =
    operationDecisionTone === "scale"
      ? "当前判断偏扩量：先找有订单且 ACOS 可接受的具体 SearchTerm，再核对投放词、广告组目的和广告位边界。"
      : operationDecisionTone === "waste"
        ? "当前判断偏止损：先找无订单消耗最高的具体 SearchTerm，再人工判断是否记录观察、加入复盘或忽略。"
        : "当前判断偏观察：样本或证据不足，先补广告组、投放词、广告位和同组 ASIN 证据。";
  return [
    {
      label: "扩量判断",
      value: `目标：判断是否存在可人工复核的扩量机会；证据：订单 ${metrics.orders} / CVR ${formatReviewPercent(metrics.cvr)} / ACOS ${formatReviewPercent(metrics.acos)} / 销售额 ${formatReviewNumber(metrics.sales)}，用于判断搜索词是否已有广告承接质量；${operationText}`,
      tone: "scale",
    },
    {
      label: "止损判断",
      value: `目标：判断是否存在需要人工止损复核的消耗浪费；证据：花费 ${formatReviewNumber(metrics.cost)} / 点击 ${formatReviewNumber(metrics.clicks)} / 订单 ${metrics.orders}，用于识别高消耗低承接；只能提示人工核对投放词和广告组，不能自动否词、调价或暂停广告。`,
      tone: "waste",
    },
    {
      label: "观察门槛",
      value: `目标：判断当前是否只能观察和补证；证据：${rowText} / ABA 命中 ${summary.aba_match_count ?? 0}；广告组、投放词、广告位、同组 ASIN 和 ABA 周期只用于判断证据是否足够。${gapText ? `当前缺口：${gapText}` : "缺失时只降低置信度或提示补证，不生成广告动作。"}`,
      tone: "gap",
    },
  ];
}

function buildSearchIntentReviewStatus(
  summary: SearchIntentSummaryForUi,
  operationDecision: Pick<SearchIntentReviewCard, "operationDecisionLabel" | "operationDecisionReason" | "operationDecisionTone">,
  primarySelection: Pick<SearchIntentReviewCard, "primarySearchTerm" | "primarySearchTermReason">,
): SearchIntentReviewStatus {
  const metrics = summary.metrics;
  const rowCount = searchIntentSourceRowCount(summary);
  const searchTermLabel = primarySelection.primarySearchTerm ?? "待补齐具体 SearchTerm";
  const gapText = searchIntentDisplayText(summary.evidence_gap).replace(/^证据缺口[:：]\s*/, "");

  if (operationDecision.operationDecisionTone === "scale") {
    return {
      label: "扩量复核",
      tone: "scale",
      reason: `订单 ${metrics.orders}、ACOS ${formatReviewPercent(metrics.acos)} 已形成可人工复核的扩量候选；先确认 ${searchTermLabel} 是否能被广告组、投放词和广告位证据解释。`,
      nextStep: `打开 ${searchTermLabel} 的具体 SearchTerm 信号，人工核对广告组目标、投放词和广告位后，只做记录观察或加入 7/14 天复盘。`,
    };
  }

  if (operationDecision.operationDecisionTone === "waste") {
    return {
      label: "止损复核",
      tone: "waste",
      reason: `花费 ${formatReviewNumber(metrics.cost)}、订单 ${metrics.orders} 指向消耗风险；先确认 ${searchTermLabel} 是否集中在同一广告组、投放词或广告位。`,
      nextStep: `打开 ${searchTermLabel} 的具体 SearchTerm 信号，人工核对后再记录观察、标记已处理、加入复盘或忽略本次；不自动否词。`,
    };
  }

  const isEvidenceGap = !primarySelection.primarySearchTerm || rowCount === 0 || Boolean(gapText);
  return {
    label: isEvidenceGap ? "证据补齐" : "仅观察",
    tone: "observe",
    reason: isEvidenceGap
      ? `当前缺少足够落地证据：${gapText || primarySelection.primarySearchTermReason}；不能把聚合指标直接转成广告动作。`
      : `表现行 ${rowCount} 条、订单 ${metrics.orders}、花费 ${formatReviewNumber(metrics.cost)} 尚不足以支撑扩量或止损，先保持观察。`,
    nextStep: `先补广告组、投放词、广告位和同组 ASIN 证据，再决定是否进入人工留痕或 7/14 天复盘。`,
  };
}

export function buildSearchIntentReviewCards(summaries: SearchIntentSummaryForUi[], limit = 8): SearchIntentReviewCard[] {
  return summaries
    .map((summary, index) => ({
      summary,
      index,
      operationDecision: searchIntentOperationDecision(summary.metrics),
    }))
    .sort(
      (left, right) =>
        compareSearchIntentReviewPriority(
          left.summary,
          left.operationDecision.operationDecisionTone,
          right.summary,
          right.operationDecision.operationDecisionTone,
        ) || left.index - right.index,
    )
    .slice(0, limit)
    .map(({ summary, operationDecision }) => {
      const metrics = summary.metrics;
      const abaMatchCount = summary.aba_match_count ?? 0;
      const primarySelection = selectPrimarySearchTermForOperationDecision(summary, operationDecision.operationDecisionTone);
      const metricPurposeItems = searchIntentMetricPurposeItems(summary, operationDecision.operationDecisionTone);
      const reviewStatus = buildSearchIntentReviewStatus(summary, operationDecision, primarySelection);
      const topTerms = (summary.top_search_terms ?? []).slice(0, 3).map((term) => {
        const abaText = term.aba_rank ? ` / ABA ${term.aba_rank}` : "";
        const adGroupText = (term.ad_group_names ?? []).filter(Boolean).slice(0, 2).join("、") || "广告组待补齐";
        const targetingText = (term.targeting_texts ?? []).filter(Boolean).slice(0, 2).join("、") || "投放词待补齐";
        return `${term.search_term}：${term.orders} 单 / 花费 ${formatReviewNumber(term.cost)} / ACOS ${formatReviewPercent(term.acos)} / 表现行 ${term.source_row_count} 条 / 广告组 ${adGroupText} / 投放词 ${targetingText}${abaText}`;
      });
      return {
        intentLabel: summary.intent_label,
        title: summary.intent_label,
        summary: `${metrics.orders} 单 / 花费 ${formatReviewNumber(metrics.cost)} / ACOS ${formatReviewPercent(metrics.acos)} / ABA 命中 ${abaMatchCount}`,
        sourceLabel: summary.semantic_source || "未知来源",
        ...operationDecision,
        reviewStatus,
        insight: searchIntentDisplayText(summary.insight),
        businessQuestion:
          searchIntentDisplayText(summary.business_question) ||
          "这组同类广告用户搜索词在当前 Parent ASIN 广告上下文下，是应该扩量、止损，还是只观察？",
        currentJudgement:
          searchIntentDisplayText(summary.current_judgement) ||
          "当前判断：需要结合花费、点击、订单、ACOS、广告组和投放词继续人工复核。",
        metricPurpose:
          searchIntentDisplayText(summary.metric_purpose) ||
          "指标目的：花费和点击用于判断消耗规模，订单、CVR 和 ACOS 用于判断广告搜索词承接质量。",
        metricPurposeItems,
        adContext: searchIntentDisplayText(summary.ad_context) || "广告上下文：等待广告活动、广告组和搜索词表现行补齐。",
        evidenceGap:
          searchIntentDisplayText(summary.evidence_gap) ||
          "证据缺口：需要继续核对投放词、广告组商品清单和广告位表现，才能转成具体人工动作。",
        signalMetricBoundary:
          "与具体信号关系：本卡片指标覆盖当前 Parent ASIN 广告上下文中按标准化用户搜索词及规则归类聚合后的同类搜索词表现行；点开后的 AI 信号只展示通过规则准入或合并后的可行动证据子集，因此行数和合计指标可能小于卡片。",
        purpose: "用途：从当前 Parent ASIN 视角，聚合广告中实际产生表现的用户搜索词，帮助运营判断同类 SearchTerm 表现、机会和异常。",
        boundary: "边界：只复核广告用户搜索词表现；不改变诊断入口，不把搜索词表现分组当作人工动作对象，不证明单个 ASIN 归因，ABA 仅作站点级背景。",
        dataGrain: searchIntentDisplayText(summary.data_grain) || "当前 Parent ASIN 关联广告上下文中实际产生表现的 ad_search_term_daily_metrics 用户搜索词表现行，按标准化用户搜索词及规则归类聚合。",
        proves:
          searchIntentDisplayText(summary.proves) ||
          "能证明当前广告上下文内按标准化用户搜索词及规则归类聚合后的同类广告搜索词花费、点击、订单和 ABA 背景。",
        doesNotProve:
          searchIntentDisplayText(summary.does_not_prove) || "不能证明 Parent ASIN 下全部自然搜索或市场搜索表现，不能证明单个 ASIN 归因，也不能把搜索词表现分组当作人工动作对象。",
        nextManualStep: searchIntentDisplayText(summary.next_manual_step) || "逐条打开具体 SearchTerm 信号，人工核对投放词、广告组、广告位和证据缺口后再记录观察或加入复盘。",
        ...primarySelection,
        topTerms,
      };
    });
}

function searchIntentDisplayText(text?: string | null): string {
  return (text ?? "")
    .replace(/不能生成广告搜索词聚合上下文人工动作/g, "不能把搜索词表现分组当作人工动作对象")
    .replace(/不生成广告搜索词聚合上下文人工动作/g, "不把搜索词表现分组当作人工动作对象")
    .replace(/生成广告搜索词聚合上下文人工动作/g, "把搜索词表现分组当作人工动作对象")
    .replace(/生成语义组人工动作/g, "把搜索词表现分组当作人工动作对象")
    .replace(/语义组人工动作/g, "把搜索词表现分组当作人工动作对象")
    .replace(/广告搜索词聚合上下文人工动作/g, "把搜索词表现分组当作人工动作对象")
    .replace(/不能把 Parent ASIN 搜索词表现聚合当作人工动作对象/g, "不能把搜索词表现分组当作人工动作对象")
    .replace(/不把 Parent ASIN 搜索词表现聚合当作人工动作对象/g, "不把搜索词表现分组当作人工动作对象")
    .replace(/把 Parent ASIN 搜索词表现聚合当作人工动作对象/g, "把搜索词表现分组当作人工动作对象")
    .replace(/不能把搜索意图分组当作人工动作对象/g, "不能把搜索词表现分组当作人工动作对象")
    .replace(/不把搜索意图分组当作人工动作对象/g, "不把搜索词表现分组当作人工动作对象")
    .replace(/把搜索意图分组当作人工动作对象/g, "把搜索词表现分组当作人工动作对象")
    .replace(/搜索意图分组/g, "搜索词表现分组")
    .replace(/按搜索意图聚合/g, "按标准化用户搜索词及规则归类聚合")
    .replace(/按搜索意图汇总/g, "按标准化用户搜索词及规则归类汇总")
    .replace(/按标准化搜索词\/语义标签聚合/g, "按标准化用户搜索词及规则归类聚合")
    .replace(/按标准化搜索词\/语义标签汇总/g, "按标准化用户搜索词及规则归类汇总")
    .replace(/该语义类目/g, "这组广告搜索词")
    .replace(/语义类目/g, "这组广告搜索词")
    .replace(/Parent ASIN 下全部搜索词表现/g, "Parent ASIN 下全部自然搜索或市场搜索表现")
    .replace(/不包含未投放子 ASIN 或自然搜索词/g, "不包含未投放子 ASIN、自然搜索词或 ABA 站点数据");
}

export function buildSearchIntentPanelContext(cards: SearchIntentReviewCard[]): SearchIntentPanelContext {
  const firstCard = cards[0];
  return {
    purpose:
      firstCard?.purpose ??
      "用途：从当前 Parent ASIN 视角聚合广告中实际产生表现的用户搜索词，帮助运营复核同类 SearchTerm 表现；它不是经营商品入口、广告组入口或人工动作对象。",
    dataGrain: firstCard?.dataGrain ?? "当前 Parent ASIN 关联广告上下文中的 ad_search_term_daily_metrics 用户搜索词表现行，按标准化用户搜索词及规则归类聚合。",
    interactionBoundary:
      "点击后只改变左侧信号队列筛选和中间选中 SearchTerm，不改变顶部诊断入口筛选器，也不切换 Parent ASIN / 广告 ASIN / 广告组。",
    proves: firstCard?.proves ?? "能证明当前诊断入口内按标准化用户搜索词及规则归类聚合后的同类广告搜索词花费、点击、订单、ACOS 和 ABA 站点级背景。",
    doesNotProve:
      firstCard?.doesNotProve ??
      "不能证明 Parent ASIN 下全部自然搜索或市场搜索表现，不能证明单个广告 ASIN 归因，也不能把搜索词表现分组当作人工动作对象。",
    nextManualStep:
      firstCard?.nextManualStep ??
      "有命中时逐条打开具体 SearchTerm 信号；无命中时先确认广告搜索词快照、广告组和投放词证据缺口，不把搜索词聚合包装成可执行动作。",
    signalMetricBoundary:
      firstCard?.signalMetricBoundary ??
      "与具体信号关系：聚合卡片覆盖当前 Parent ASIN 广告上下文中按标准化用户搜索词及规则归类聚合后的同类搜索词表现行；具体 AI 信号只展示通过规则准入或合并后的可行动证据子集。",
    boundary:
      firstCard?.boundary ??
      "边界：只复核广告用户搜索词表现；不改变诊断入口，不把搜索词表现分组当作人工动作对象，不证明单个 ASIN 归因，ABA 仅作站点级背景。",
    emptyText:
      cards.length > 0
        ? `当前展示 ${cards.length} 组 Parent ASIN 广告搜索词表现复核，点击后只筛选当前诊断入口内的同类 SearchTerm 信号。`
        : "当前诊断入口下没有可关联的广告用户搜索词表现行；这不是系统故障，也不代表 Parent ASIN 没有自然搜索词，只代表当前广告上下文没有可复核的 SearchTerm 表现。",
  };
}

export function buildSearchIntentReviewDecisionSummary(cards: SearchIntentReviewCard[]): SearchIntentReviewDecisionSummary | null {
  const firstCard = cards[0];
  if (!firstCard) return null;

  const scaleCount = cards.filter((card) => card.operationDecisionTone === "scale").length;
  const wasteCount = cards.filter((card) => card.operationDecisionTone === "waste").length;
  const observeCount = cards.filter((card) => card.operationDecisionTone === "observe").length;
  const topSearchTermLabel = firstCard.primarySearchTerm
    ? `优先打开 SearchTerm：${firstCard.primarySearchTerm}；${firstCard.primarySearchTermReason}`
    : `优先打开聚合：${firstCard.intentLabel}；等待具体 SearchTerm 证据补齐。`;
  const priorityPathItems = cards.slice(0, 3).map((card, index) => ({
    label: `${index + 1}. ${card.intentLabel}`,
    value: card.operationDecisionLabel,
    detail: card.primarySearchTerm
      ? `先打开 ${card.primarySearchTerm}：${card.primarySearchTermReason}`
      : card.evidenceGap,
    tone: card.operationDecisionTone,
  }));

  return {
    headline: `先看 ${firstCard.intentLabel}：${firstCard.operationDecisionLabel}。当前 ${cards.length} 组搜索词中，有效词扩量 ${scaleCount} 组 / 浪费词止损 ${wasteCount} 组 / 证据缺口观察 ${observeCount} 组。`,
    businessQuestion: "当前 Parent ASIN 下的广告用户搜索词，今天应先做扩量复核、止损复核，还是只观察补证？",
    topIntentLabel: firstCard.intentLabel,
    topDecisionLabel: firstCard.operationDecisionLabel,
    topDecisionReason: firstCard.operationDecisionReason,
    topSearchTermLabel,
    manualReviewPath:
      "打开具体 SearchTerm 信号 -> 核对广告组、投放词、广告 ASIN 和广告位证据 -> 右侧只做人工留痕或加入 7/14 天复盘。",
    proofBoundary:
      "只证明当前 Parent ASIN 广告上下文中的搜索词表现优先级；不覆盖自然搜索、未投放子 ASIN 或单个 ASIN 归因。",
    distributionItems: [
      {
        label: "有效词扩量",
        value: `${scaleCount} 组`,
        detail: "先看有订单、ACOS 可接受且能落到具体 SearchTerm 的聚合组。",
        tone: "scale",
      },
      {
        label: "浪费词止损",
        value: `${wasteCount} 组`,
        detail: "先看无订单消耗、点击或花费集中但承接不足的聚合组。",
        tone: "waste",
      },
      {
        label: "证据缺口观察",
        value: `${observeCount} 组`,
        detail: "样本、投放词、广告组商品清单或广告位证据不足时，只观察和补证。",
        tone: "observe",
      },
    ],
    priorityPathItems,
    evidenceGap: firstCard.evidenceGap,
    nextManualStep: firstCard.nextManualStep,
    boundary: "本摘要只做搜索词复核排序，不改变 Parent ASIN 诊断入口，不把搜索词表现分组当作人工动作对象，也不生成自动加词、否词、调价或暂停广告动作。",
  };
}

export function buildSearchIntentEntryLockSummary(
  selectedScope: ProductScopeFilterOption | null,
  activeSearchIntentLabel: string | null | undefined,
  activeCard?: Pick<SearchIntentReviewCard, "primarySearchTerm" | "primarySearchTermReason"> | null,
): SearchIntentEntryLockSummary | null {
  const intentLabel = activeSearchIntentLabel?.trim();
  if (!intentLabel) return null;

  const scopeLabel = diagnosisScopeLabel(selectedScope);
  const primarySearchTerm = activeCard?.primarySearchTerm?.trim();
  return {
    title: "诊断入口锁定核对",
    rows: [
      {
        label: "经营诊断入口",
        value: scopeLabel,
        detail: "保持当前顶部 / 经营诊断入口筛选器，不把 Parent ASIN 广告搜索词表现复核写回 ProductScope。",
      },
      {
        label: "Parent ASIN 广告搜索词表现复核",
        value: intentLabel,
        detail: "从当前 Parent ASIN 视角聚合广告中的用户搜索词表现行，只作为二级队列筛选，用于缩小同类 SearchTerm 信号。",
      },
      {
        label: "优先诊断对象",
        value: primarySearchTerm ? `SearchTerm：${primarySearchTerm}` : "等待命中具体 SearchTerm",
        detail: activeCard?.primarySearchTermReason || "人工确认和复盘仍以后端预检确认的具体 SearchTerm 稳定对象为准。",
      },
    ],
    boundary:
      "点击 Parent ASIN 广告搜索词表现复核卡片不会切换经营诊断入口；如需切换 Parent ASIN、ASIN 或广告对象，必须使用诊断入口筛选器或明确入口按钮。",
  };
}

export function filterSignalsBySearchIntent<T extends SearchIntentFilterSignalForUi>(signals: T[], intentLabel: string | null | undefined): T[] {
  const selectedIntentLabel = intentLabel?.trim();
  if (!selectedIntentLabel) return signals;
  const contextLabels = new Set([
    "搜索词表现分组",
    "搜索意图分组",
    "Parent ASIN 广告搜索词表现复核",
    "Parent ASIN 搜索词表现聚合",
    "广告搜索词聚合上下文",
    "语义组",
  ]);
  return signals.filter((signal) => {
    if (signal.signal_category !== "search_term_opportunity" || signal.object_type !== "search_term") return false;
    const primaryIntentLabel = signal.evidence?.primary_object?.intent_label?.trim();
    if (primaryIntentLabel === selectedIntentLabel) return true;
    return (signal.evidence?.facts ?? []).some(
      (fact) => contextLabels.has(fact.label) && fact.value.trim() === selectedIntentLabel,
    );
  });
}

function normalizeSearchIntentSearchTerm(value: unknown): string {
  return stringValue(value).toLowerCase().replace(/\s+/g, " ");
}

function isSearchTermFactLabel(label: string): boolean {
  const normalizedLabel = label.toLowerCase();
  return normalizedLabel.includes("searchterm") || normalizedLabel.includes("search_term") || normalizedLabel.includes("搜索词");
}

function searchIntentCandidateMatchesSearchTerm(candidate: unknown, normalizedSearchTerm: string): boolean {
  const normalizedCandidate = normalizeSearchIntentSearchTerm(candidate);
  if (!normalizedCandidate) return false;
  const asciiColonTail = normalizedCandidate.split(":").pop()?.trim();
  const chineseColonTail = normalizedCandidate.split("：").pop()?.trim();
  return normalizedCandidate === normalizedSearchTerm || asciiColonTail === normalizedSearchTerm || chineseColonTail === normalizedSearchTerm;
}

function searchIntentSignalMatchesSearchTerm(signal: SearchIntentFilterSignalForUi, normalizedSearchTerm: string): boolean {
  const primaryObject = signal.evidence?.primary_object;
  const candidates: unknown[] = [
    primaryObject?.search_term,
    primaryObject?.label,
    primaryObject?.object_id,
    (signal as { object_id?: unknown }).object_id,
  ];

  signal.evidence?.facts?.forEach((fact) => {
    if (isSearchTermFactLabel(fact.label)) candidates.push(fact.value);
  });

  signal.evidence?.source_rows?.forEach((row) => {
    candidates.push(row.search_term, row.normalized_query, row.query);
  });

  return candidates.some((candidate) => searchIntentCandidateMatchesSearchTerm(candidate, normalizedSearchTerm));
}

export function selectSearchIntentSignalId<T extends SearchIntentFilterSignalForUi>(
  signals: T[],
  intentLabel: string | null | undefined,
  preferredSearchTerm?: string | null,
): string | null {
  const nextSignals = filterSignalsBySearchIntent(signals, intentLabel);
  const normalizedSearchTerm = normalizeSearchIntentSearchTerm(preferredSearchTerm);
  if (normalizedSearchTerm) {
    const matchedSignal = nextSignals.find((signal) => searchIntentSignalMatchesSearchTerm(signal, normalizedSearchTerm));
    if (matchedSignal) return matchedSignal.id;
  }
  return nextSignals[0]?.id ?? null;
}

export interface SearchIntentFocusSelection<TSignalId = string> {
  intentLabel: string | null;
  scopeId: string | null;
  signalId: TSignalId | null;
}

export function resolveSearchIntentFocusSelection<T extends SearchIntentFilterSignalForUi>(
  signals: T[],
  activeSearchIntentLabel: string | null,
  activeProductScopeId: string,
  intentLabel: string,
  preferredSearchTerm?: string | null,
): SearchIntentFocusSelection {
  if (activeSearchIntentLabel === intentLabel) {
    return { intentLabel: null, scopeId: null, signalId: null };
  }
  return {
    intentLabel,
    scopeId: activeProductScopeId,
    signalId: selectSearchIntentSignalId(signals, intentLabel, preferredSearchTerm),
  };
}

export function recommendedManualActionCardCopy(summary: SignalTriageSummaryForUi | null | undefined): {
  ariaLabel: string;
  title: string;
  buttonText: string;
  buttonAriaLabel: string;
} {
  if (summaryRequiresProductScope(summary)) {
    return {
      ariaLabel: "先选择经营对象",
      title: "先选择经营对象",
      buttonText: "查看范围",
      buttonAriaLabel: "先选择 Parent ASIN 或 ASIN 经营对象后再查看人工留痕建议",
    };
  }
  if (summaryHasNoActionableCandidate(summary)) {
    const message = summary?.actionability_status?.message ?? "当前经营对象暂无可行动候选，只能作为诊断视图。";
    return {
      ariaLabel: "暂无可行动候选",
      title: "暂无可行动候选",
      buttonText: "查看诊断",
      buttonAriaLabel: `查看当前经营对象诊断：${message}`,
    };
  }
  const status = summary?.recommended_manual_status;
  const label = status?.object_label || status?.object_id || summary?.recommended_candidate?.object_label || summary?.recommended_candidate?.stable_object_id || "推荐对象";
  if (status?.has_manual_action) {
    return {
      ariaLabel: "推荐对象复盘等待",
      title: "推荐对象复盘等待",
      buttonText: "查看复盘对象",
      buttonAriaLabel: `查看已留痕推荐对象 ${label} 的复盘等待状态`,
    };
  }
  return {
    ariaLabel: "建议优先留痕对象",
    title: "建议优先留痕",
    buttonText: "查看信号",
    buttonAriaLabel: `查看建议优先留痕对象 ${label}`,
  };
}

export function recommendedManualStatusText(summary: SignalTriageSummaryForUi | null | undefined): string | null {
  const status = summary?.recommended_manual_status;
  if (!status) return null;
  const label = status.object_label || status.object_id || "推荐对象";
  let nextAction = status.next_action;
  if (!nextAction && (status.ready_review_count ?? 0) > 0) {
    nextAction = `已有 ${status.ready_review_count} 个 ready 复盘结果，保存前仍需人工确认。`;
  }
  if (!nextAction && status.has_review_todo) {
    const windowText = status.review_windows?.length ? status.review_windows.map((window) => window.replace("d", " 天")).join(" / ") : "7 天 / 14 天";
    nextAction = `已生成 ${status.review_todo_count ?? 0} 条复盘待办，等待 ${windowText}完整窗口后再判断效果。`;
  }
  if (!nextAction) {
    nextAction = status.has_manual_action
      ? "推荐对象已有人工留痕，继续等待复盘窗口。"
      : "推荐对象尚未人工留痕；请在右侧点击加入复盘或记录观察。";
  }
  return `${label}：${userFacingManualActionText(nextAction)}`;
}

export function preferredProductScopeId(options: ProductScopeFilterOption[]): string {
  return (
    options.find((option) => option.scope_type === "parent_asin" && hasProductScopeAdEvidence(option))?.scope_id ??
    options.find((option) => option.scope_type === "advertised_asin" && hasProductScopeAdEvidence(option))?.scope_id ??
    options.find((option) => option.scope_type === "parent_asin")?.scope_id ??
    options.find((option) => option.scope_type === "advertised_asin")?.scope_id ??
    options.find((option) => option.scope_id === "all")?.scope_id ??
    options[0]?.scope_id ??
    "all"
  );
}

export function resolveProductScopeSelectionId(
  currentSelectedScopeId: string | null | undefined,
  options: ProductScopeFilterOption[],
): string {
  if (currentSelectedScopeId && options.some((option) => option.scope_id === currentSelectedScopeId)) {
    return currentSelectedScopeId;
  }
  return preferredProductScopeId(options);
}

export function resolveProductScopePrioritySelectionId(
  currentSelectedScopeId: string | null | undefined,
  options: ProductScopeFilterOption[],
  signals: ProductScopedSignalForUi[],
  reviewTodos: ProductScopePriorityQueueReviewTodo[] = [],
): string {
  if (currentSelectedScopeId && options.some((option) => option.scope_id === currentSelectedScopeId)) {
    return currentSelectedScopeId;
  }

  const topPriorityScopeId = buildProductScopePriorityQueueItems(options, signals, reviewTodos, 1)[0]?.scopeId;
  return resolveProductScopeSelectionId(topPriorityScopeId, options);
}

function productScopeManualActionSignalReadback(signal?: ProductScopedSignalForUi | null) {
  if (!signal) return "未选中信号";
  const primary = signal.evidence?.primary_object;
  const label = primary?.label || primary?.asin || primary?.object_id || signal.id;
  const type = primary?.object_type || signal.object_type || "signal";
  return `${type} / ${label}`;
}

function manualActionPreviewTargetReadback(preview?: RecommendedManualActionPreview | null) {
  if (!preview) return "当前选中信号没有后端可写预检对象";
  return `${preview.objectType} / ${preview.objectLabel} / ${preview.objectId}`;
}

function manualActionPreflightTargetReadback(input: ProductScopeManualActionTargetAlignmentInput["preflight"]) {
  const target = input?.target;
  if (!target) return "后端预检目标读取中";
  const label = target.object_label || target.object_id || "对象待补充";
  return `${target.object_type ?? "unknown"} / ${label} / ${target.object_id ?? "object_id 待补充"}`;
}

export function buildProductScopeManualActionTargetAlignment(
  input: ProductScopeManualActionTargetAlignmentInput,
): ProductScopeManualActionTargetAlignment {
  const priorityReadback = input.priorityItem
    ? `${input.priorityItem.label} / ${input.priorityItem.priorityLabel}`
    : "未绑定今日优先 Parent ASIN";
  const signalReadback = productScopeManualActionSignalReadback(input.selectedSignal);
  const previewReadback = manualActionPreviewTargetReadback(input.manualActionPreview);
  const preflightReadback = manualActionPreflightTargetReadback(input.preflight);
  const previewObjectId = input.manualActionPreview?.objectId;
  const preflightTarget = input.preflight?.target;
  const preflightObjectId = preflightTarget?.object_id;
  const signalId = input.selectedSignal?.id;
  const preflightSignalId = preflightTarget?.signal_id;
  const objectMatches = Boolean(previewObjectId && preflightObjectId && previewObjectId === preflightObjectId);
  const signalMatches = Boolean(!preflightSignalId || !signalId || preflightSignalId === signalId);
  const items: ProductScopeManualActionTargetAlignmentItem[] = [
    {
      label: "今日优先入口",
      value: priorityReadback,
      detail: "只决定用户先看哪条 Parent ASIN，不改变人工动作对象。",
    },
    {
      label: "选中信号",
      value: signalReadback,
      detail: "中间诊断当前展示的 AI 信号或证据对象。",
    },
    {
      label: "前端预览对象",
      value: previewReadback,
      detail: "右侧准备读取后端 preflight 的目标对象。",
    },
    {
      label: "后端预检对象",
      value: preflightReadback,
      detail: "人工点击后真正允许保存的对象以后端 preflight 为准。",
    },
  ];

  if (input.preflightError) {
    return {
      tone: "blocked",
      title: "人工动作对象链路未通过",
      primary: input.preflightError,
      items,
      boundary: "后端预检失败前不能写入 ManualAction，也不能生成 7/14 天复盘待办。",
    };
  }

  if (!input.manualActionPreview) {
    return {
      tone: "waiting",
      title: "人工动作对象链路待确认",
      primary: "当前信号没有后端可写预检对象，只能阅读证据或切换到可处理候选。",
      items,
      boundary: "没有稳定对象 ID 时，不能把 Parent ASIN、广告组或搜索词上下文包装成人工动作。",
    };
  }

  if (!input.preflight) {
    return {
      tone: "waiting",
      title: "人工动作对象链路读取中",
      primary: "正在读取后端 preflight，未返回前不允许写入人工动作。",
      items,
      boundary: "前端预览只做读回提示，不能替代后端 evidence_snapshot_preview。",
    };
  }

  if (!objectMatches || !signalMatches) {
    return {
      tone: "blocked",
      title: "人工动作对象链路不一致",
      primary: "当前优先入口、选中信号或后端预检对象不一致；右侧按钮必须由门禁阻断。",
      items,
      boundary: "不能把一个 Parent ASIN 下看到的证据保存到另一条 SearchTerm、广告 ASIN 或广告组对象。",
    };
  }

  return {
    tone: "ready",
    title: "人工动作对象链路一致",
    primary: "当前优先入口、选中信号和后端预检对象已对齐；仍需人工点击后才保存留痕和复盘待办。",
    items,
    boundary: "本读回只证明保存目标一致，不代表自动加词、否词、调价、暂停广告或生成复盘效果结论。",
  };
}

function hasProductScopeAdEvidence(option: ProductScopeFilterOption): boolean {
  return (option.ad_spend ?? option.spend ?? 0) > 0 || (option.ad_orders ?? option.orders ?? 0) > 0 || (option.ad_sales ?? option.sales ?? 0) > 0;
}

export function isActionableProductScope(option: ProductScopeFilterOption | null | undefined): boolean {
  return option?.scope_type === "parent_asin" || option?.scope_type === "advertised_asin";
}

function summaryRequiresProductScope(summary: SignalTriageSummaryForUi | null | undefined): boolean {
  return summary?.product_scope_gate?.is_actionable === false;
}

function summaryHasNoActionableCandidate(summary: SignalTriageSummaryForUi | null | undefined): boolean {
  return summary?.actionability_status?.status === "no_actionable_candidate";
}

export function canRecommendManualActionFromTriageSummary(summary: SignalTriageSummaryForUi | null | undefined): boolean {
  return summary?.actionability_status?.can_write_manual_action !== false;
}

export function productScopeOptionLabel(option: ProductScopeFilterOption): string {
  const label = option.label ?? option.scope_id;
  if (option.scope_id === "all" || option.scope_type === "all") return `辅助入口：${label}`;
  if (option.scope_id === "unattributed" || option.scope_type === "unattributed") return `辅助入口：${label}`;
  if (option.scope_type === "parent_asin" || option.scope_id.startsWith("parent_asin:")) return `经营入口：${label}`;
  if (option.scope_type === "advertised_asin") return `广告下钻：${label}`;
  if (option.scope_type === "sales_asin") return `销售背景：${label}`;
  return label;
}

export function buildProductScopeOptionGroups(options: ProductScopeFilterOption[]): ProductScopeOptionGroup[] {
  const loadingOptions = options.filter((option) => option.scope_type === "loading");
  const parentOptions = options.filter((option) => option.scope_type === "parent_asin" || option.scope_id.startsWith("parent_asin:"));
  const advertisedOptions = options.filter((option) => option.scope_type === "advertised_asin");
  const salesBackgroundOptions = options.filter((option) => option.scope_type === "sales_asin");
  const assistOptions = options.filter(
    (option) =>
      option.scope_id === "all" ||
      option.scope_type === "all" ||
      option.scope_id === "unattributed" ||
      option.scope_type === "unattributed" ||
      option.scope_type === "sales_asin",
  );
  const groups: ProductScopeOptionGroup[] = [];
  if (loadingOptions.length > 0) groups.push({ label: "诊断入口状态", options: loadingOptions });
  if (parentOptions.length > 0) groups.push({ label: "经营入口（Parent ASIN）", options: parentOptions });
  if (advertisedOptions.length > 0) groups.push({ label: "广告下钻入口（仅已投广告 ASIN）", options: advertisedOptions });
  if (salesBackgroundOptions.length > 0 || assistOptions.length > salesBackgroundOptions.length) {
    groups.push({ label: "辅助排查入口（非广告动作对象）", options: assistOptions });
  }
  return groups;
}

export function buildProductScopePriorityQueueItems(
  options: ProductScopeFilterOption[],
  signals: ProductScopedSignalForUi[],
  reviewTodos: ProductScopePriorityQueueReviewTodo[] = [],
  limit = 10,
): ProductScopePriorityQueueItem[] {
  const parentOptions = options.filter((option) => option.scope_type === "parent_asin" || option.scope_id.startsWith("parent_asin:"));

  return parentOptions
    .map((option) => {
      const scopeSignals = filterSignalsByProductScope(signals, option.scope_id, options);
      const scopeSignalIds = new Set(scopeSignals.map((signal) => signal.id));
      const scopeReviewTodos = reviewTodos.filter((todo) => Boolean(todo.signal_id && scopeSignalIds.has(todo.signal_id)));
      const dueReviewTodoCount = scopeReviewTodos.filter((todo) => Boolean(todo.is_due)).length;
      const highSignalCount = scopeSignals.filter((signal) => signal.severity >= 4).length;
      const openSignalCount = scopeSignals.filter((signal) => signal.status !== "adopted" && signal.status !== "ignored" && signal.status !== "false_positive").length;
      const strongestKind = productScopePriorityDominantKind(scopeSignals);
      const adSpend = scopeAdSpend(option);
      const adOrders = scopeAdOrders(option);
      const adSales = scopeAdSales(option);
      const hasAdEvidence = hasProductScopeAdEvidence(option);
      const score =
        dueReviewTodoCount * 1000 +
        scopeReviewTodos.length * 520 +
        highSignalCount * 150 +
        openSignalCount * 55 +
        scopeSignals.reduce((total, signal) => total + signal.severity, 0) * 8 +
        Math.min(adSpend, 500);
      const priority = productScopePriorityLabel({
        dueReviewTodoCount,
        reviewTodoCount: scopeReviewTodos.length,
        highSignalCount,
        openSignalCount,
        hasAdEvidence,
      });

      return {
        scopeId: option.scope_id,
        label: option.label ?? option.parent_asin ?? option.scope_id.replace("parent_asin:", ""),
        priorityLabel: priority.label,
        tone: priority.tone,
        workflowStatus: productScopePriorityWorkflowStatus({
          dueReviewTodoCount,
          reviewTodoCount: scopeReviewTodos.length,
          highSignalCount,
          openSignalCount,
          hasAdEvidence,
        }),
        mainQuestion: productScopePriorityQuestion({
          strongestKind,
          dueReviewTodoCount,
          highSignalCount,
          hasAdEvidence,
        }),
        evidenceSummary: hasAdEvidence
          ? `广告花费 ${formatScopeMoney(adSpend)} / 广告订单 ${adOrders} / 广告销售额 ${formatScopeMoney(adSales)} / AI 信号 ${scopeSignals.length} 条`
          : `当前无投放广告证据 / AI 信号 ${scopeSignals.length} 条 / 复盘待办 ${scopeReviewTodos.length} 条`,
        rankReason: productScopePriorityRankReason({
          dueReviewTodoCount,
          reviewTodoCount: scopeReviewTodos.length,
          highSignalCount,
          openSignalCount,
          adSpend,
          hasAdEvidence,
        }),
        decisionBadge: productScopePriorityDecisionBadge({
          dueReviewTodoCount,
          reviewTodoCount: scopeReviewTodos.length,
          highSignalCount,
          openSignalCount,
          hasAdEvidence,
        }),
        nextManualStep: productScopePriorityNextStep({
          dueReviewTodoCount,
          reviewTodoCount: scopeReviewTodos.length,
          highSignalCount,
          openSignalCount,
          hasAdEvidence,
        }),
        boundary:
          "这只是 Parent ASIN 今日分诊入口；点击后仍按广告 ASIN、广告组、投放词、搜索词和广告位证据下钻，未投放子 ASIN 不进入广告动作对象。",
        signalCount: scopeSignals.length,
        reviewTodoCount: scopeReviewTodos.length,
        dueReviewTodoCount,
        score,
      } satisfies ProductScopePriorityQueueItem;
    })
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .slice(0, limit);
}

export function mergeActiveProductScopePriorityTriageHint(
  items: ProductScopePriorityQueueItem[],
  summary: SignalTriageSummaryForUi | null | undefined,
): ProductScopePriorityQueueItem[] {
  const selectedScopeId = summary?.product_scope_gate?.selected_product_scope_id?.trim();
  const candidateCount =
    summary?.product_scope_gate?.candidate_pool_count ?? summary?.signal_status?.candidate_count ?? 0;
  if (!selectedScopeId || candidateCount <= 0) return items;

  const recommendedLabel =
    summary?.recommended_candidate?.object_label || summary?.recommended_candidate?.stable_object_id || "推荐候选";
  const candidateText = `后端候选 ${candidateCount} 个`;
  const recommendedText = `推荐 ${recommendedLabel}`;

  return items.map((item) => {
    if (item.scopeId !== selectedScopeId) return item;

    const shouldKeepReviewPriority = item.tone === "review";
    return {
      ...item,
      priorityLabel: shouldKeepReviewPriority ? item.priorityLabel : "人工确认",
      tone: shouldKeepReviewPriority ? item.tone : "urgent",
      workflowStatus: shouldKeepReviewPriority
        ? item.workflowStatus
        : {
            label: "待人工确认",
            tone: "urgent",
            reason: `已选 Parent 返回 ${candidateCount} 个可复核候选，先核对推荐候选是否需要人工留痕。`,
            nextStep: `打开 ${recommendedLabel} 的诊断证据，再决定记录观察、标记已处理、加入复盘或忽略本次。`,
          },
      mainQuestion: shouldKeepReviewPriority
        ? item.mainQuestion
        : `已选 Parent 有 ${candidateCount} 个可人工复核候选，先看 ${recommendedLabel} 是否需要留痕或加入复盘。`,
      evidenceSummary: appendPriorityText(appendPriorityText(item.evidenceSummary, candidateText), recommendedText),
      rankReason: `${item.rankReason}；已选 Parent 的 signal-triage 返回 ${candidateCount} 个可复核候选。`,
      decisionBadge: shouldKeepReviewPriority
        ? appendPriorityText(item.decisionBadge, `候选：${recommendedLabel}`)
        : `人工动作：右侧人工确认 / 候选：${recommendedLabel} / 复盘状态：按后端门禁。`,
      nextManualStep: `先打开 ${recommendedLabel} 的诊断证据，核对投放词、广告组、广告 ASIN 和边界后，再在右侧选择记录观察、标记已处理、加入复盘或忽略本次。`,
      boundary: `${item.boundary} 当前候选来自已选 Parent 的 signal-triage 结果，只代表可人工复核线索，不代表自动加词、否词、调价或暂停广告。`,
    } satisfies ProductScopePriorityQueueItem;
  });
}

export function mergeProductScopePrioritySearchIntentHints(
  items: ProductScopePriorityQueueItem[],
  searchIntentsByScope: ProductScopePrioritySearchIntentSummaryMap,
): ProductScopePriorityQueueItem[] {
  return items
    .map((item, index) => {
      const searchIntentCards = buildSearchIntentReviewCards(searchIntentsByScope[item.scopeId] ?? [], 3);
      const topCard = searchIntentCards[0];
      if (!topCard) return { item, index };

      const decisionText = `搜索词复核 ${searchIntentCards.length} 组`;
      const topText = `优先 ${topCard.operationDecisionLabel}：${topCard.title}`;
      const primarySearchTerm = topCard.primarySearchTerm ?? topCard.title;
      const scoreBonus =
        topCard.operationDecisionTone === "waste"
          ? 420
          : topCard.operationDecisionTone === "scale"
            ? 360
            : 80;
      const shouldKeepReviewPriority = item.tone === "review";
      const upgradedTone: ProductScopePriorityQueueTone =
        shouldKeepReviewPriority ? item.tone : topCard.operationDecisionTone === "observe" ? item.tone : "urgent";
      const upgradedPriorityLabel = shouldKeepReviewPriority
        ? item.priorityLabel
        : topCard.operationDecisionTone === "scale"
          ? "搜索词扩量"
          : topCard.operationDecisionTone === "waste"
            ? "搜索词止损"
            : item.priorityLabel === "暂不展开"
              ? "搜索词观察"
              : item.priorityLabel;

      return {
        item: {
          ...item,
          priorityLabel: upgradedPriorityLabel,
          tone: upgradedTone,
          workflowStatus:
            shouldKeepReviewPriority || topCard.operationDecisionTone === "observe"
              ? item.workflowStatus
              : {
                  label: "待人工确认",
                  tone: "urgent",
                  reason: `${topCard.title} 已形成${topCard.operationDecisionLabel}线索，需要下钻具体 SearchTerm 后再人工判断。`,
                  nextStep: `打开 ${primarySearchTerm} 的具体 SearchTerm 诊断，再决定记录观察、标记已处理、加入复盘或忽略本次。`,
                },
          mainQuestion: shouldKeepReviewPriority
            ? item.mainQuestion
            : `当前 Parent 有 ${searchIntentCards.length} 组广告搜索词复核线索，先看 ${topCard.title} 是否需要进入具体 SearchTerm 人工复核。`,
          evidenceSummary: appendPriorityText(appendPriorityText(item.evidenceSummary, decisionText), topText),
          rankReason: `${item.rankReason}；搜索词复核摘要：${topCard.operationDecisionReason}`,
          decisionBadge: appendPriorityText(item.decisionBadge, `搜索词：${topCard.operationDecisionLabel}`),
          nextManualStep: `先打开 ${primarySearchTerm} 的具体 SearchTerm 诊断，核对投放词、广告组、广告 ASIN 和广告位边界，再决定记录观察、标记已处理、加入复盘或忽略本次。`,
          boundary: `${item.boundary} 搜索词复核只用于 Parent 首页排序和下钻提示，不把搜索词表现分组当作人工动作对象，也不自动加词、否词、调价或暂停广告。`,
          score: item.score + scoreBonus + searchIntentCards.length * 12,
        } satisfies ProductScopePriorityQueueItem,
        index,
      };
    })
    .sort((left, right) => right.item.score - left.item.score || left.index - right.index)
    .map(({ item }) => item);
}

export function buildProductScopePriorityDecisionBuckets(items: ProductScopePriorityQueueItem[]): ProductScopePriorityDecisionBucket[] {
  const reviewItems = items.filter((item) => item.tone === "review");
  const manualItems = items.filter((item) => item.tone === "urgent");
  const watchItems = items.filter((item) => item.tone === "watch");
  const quietItems = items.filter((item) => item.tone === "quiet");
  const dueReviewTodoCount = reviewItems.reduce((total, item) => total + item.dueReviewTodoCount, 0);
  const labelPreview = (bucketItems: ProductScopePriorityQueueItem[]) => bucketItems.slice(0, 2).map((item) => item.label);

  return [
    {
      id: "review",
      label: "复盘优先",
      count: reviewItems.length,
      objectLabels: labelPreview(reviewItems),
      action:
        dueReviewTodoCount > 0
          ? `先看 ${dueReviewTodoCount} 条到期复盘，再判断是否需要继续观察。`
          : "等待 7/14 天复盘窗口，不重复点击人工动作。",
      boundary: "只处理已进入复盘窗口的对象，不把复盘状态包装成新的广告优化建议。",
      tone: "review",
    },
    {
      id: "manual",
      label: "人工确认",
      count: manualItems.length,
      objectLabels: labelPreview(manualItems),
      action: "进入右侧记录观察、标记已处理、加入复盘或忽略本次。",
      boundary: "只做人工留痕和复盘排程，不自动调价、暂停、加词或否词。",
      tone: "urgent",
    },
    {
      id: "watch",
      label: "保持观察",
      count: watchItems.length,
      objectLabels: labelPreview(watchItems),
      action: "先不展开全部明细，只在广告证据变化或新增信号时复核。",
      boundary: "观察对象不能被当成已证明异常，也不能直接进入广告动作。",
      tone: "watch",
    },
    {
      id: "quiet",
      label: "暂不展开",
      count: quietItems.length,
      objectLabels: labelPreview(quietItems),
      action: "当前不占用诊断时间，等出现广告证据或 AI 信号后再进入详情。",
      boundary: "没有广告证据的 Parent ASIN 只能作为经营背景，不能进入广告诊断动作。",
      tone: "quiet",
    },
  ];
}

function productScopePriorityDominantKind(signals: ProductScopedSignalForUi[]): SignalQueueKind | null {
  const counts = new Map<SignalQueueKind, number>();
  signals.forEach((signal) => {
    const kind = signalQueueKind(signal);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  });
  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function productScopePriorityLabel(input: {
  dueReviewTodoCount: number;
  reviewTodoCount: number;
  highSignalCount: number;
  openSignalCount: number;
  hasAdEvidence: boolean;
}): { label: string; tone: ProductScopePriorityQueueTone } {
  if (input.dueReviewTodoCount > 0) return { label: "先复盘", tone: "review" };
  if (input.reviewTodoCount > 0) return { label: "等复盘", tone: "review" };
  if (input.highSignalCount > 0) return { label: "今日优先", tone: "urgent" };
  if (input.openSignalCount > 0) return { label: "排队复核", tone: "watch" };
  if (input.hasAdEvidence) return { label: "观察", tone: "watch" };
  return { label: "暂不展开", tone: "quiet" };
}

function productScopePriorityWorkflowStatus(input: {
  dueReviewTodoCount: number;
  reviewTodoCount: number;
  highSignalCount: number;
  openSignalCount: number;
  hasAdEvidence: boolean;
}): ProductScopePriorityWorkflowStatus {
  if (input.dueReviewTodoCount > 0) {
    return {
      label: "到期复盘",
      tone: "review",
      reason: `已有 ${input.dueReviewTodoCount} 条复盘待办到期，先核对处理前后指标。`,
      nextStep: "打开右侧复盘待办；只有复盘效果 ready 后，才人工保存复盘记录。",
    };
  }
  if (input.reviewTodoCount > 0) {
    return {
      label: "等待复盘",
      tone: "review",
      reason: `已有 ${input.reviewTodoCount} 条复盘待办，当前重点是等 7/14 天窗口完整。`,
      nextStep: "未到期前不重复处理；只补充观察，不自动调整广告。",
    };
  }
  if (input.highSignalCount > 0) {
    return {
      label: "待人工确认",
      tone: "urgent",
      reason: `存在 ${input.highSignalCount} 条高优先广告信号，需要判断是否影响花费、订单或 ACOS。`,
      nextStep: "打开诊断链路，在右侧选择记录观察、标记已处理、加入复盘或忽略本次。",
    };
  }
  if (input.openSignalCount > 0) {
    return {
      label: "仅观察",
      tone: "watch",
      reason: `有 ${input.openSignalCount} 条待复核信号，但当前不足以升级成优先人工处理。`,
      nextStep: "只核对证据是否足够；证据不足时记录观察或继续等待新数据。",
    };
  }
  if (input.hasAdEvidence) {
    return {
      label: "仅观察",
      tone: "watch",
      reason: "有广告表现背景，但暂无明确异常、机会或复盘待办。",
      nextStep: "不逐层阅读完整报表；等新增信号或指标变化后再展开。",
    };
  }
  return {
    label: "证据缺口",
    tone: "quiet",
    reason: "当前没有投放广告证据，不能进入广告诊断动作。",
    nextStep: "先补 advertised_products、搜索词或广告位证据，再判断是否进入分析。",
  };
}

function productScopePriorityQuestion(input: {
  strongestKind: SignalQueueKind | null;
  dueReviewTodoCount: number;
  highSignalCount: number;
  hasAdEvidence: boolean;
}): string {
  if (input.dueReviewTodoCount > 0) return "已到期复盘，需要先判断人工动作后的 7/14 天结果。";
  if (!input.hasAdEvidence) return "当前没有投放广告证据，只保留销售背景，不继续展开广告诊断。";
  if (input.highSignalCount > 0) return "存在高优先级广告信号，需要先判断是否影响花费、订单或 ACOS。";
  if (input.strongestKind) return `主要看${signalQueueKindLabel(input.strongestKind)}，先确认是否需要人工留痕或加入复盘。`;
  return "当前没有明确待处理信号，保持观察，不需要像报表一样展开阅读。";
}

function productScopePriorityNextStep(input: {
  dueReviewTodoCount: number;
  reviewTodoCount: number;
  highSignalCount: number;
  openSignalCount: number;
  hasAdEvidence: boolean;
}): string {
  if (input.dueReviewTodoCount > 0) return "先打开这个 Parent ASIN，核对到期 ReviewTodo，再人工保存复盘记录。";
  if (input.reviewTodoCount > 0) return "暂不判断效果，等待 ReviewTodo 到期；只补充观察，不自动改广告。";
  if (input.highSignalCount > 0) return "打开后先看最高优先级信号，再在右侧选择记录观察、标记已处理、加入复盘或忽略本次。";
  if (input.openSignalCount > 0) return "打开后只复核当前广告证据是否足够，证据不足时记录观察或保持待确认。";
  if (input.hasAdEvidence) return "保留观察即可；没有明确异常或机会时，不需要逐层阅读全部广告数据。";
  return "不进入广告诊断；需要先补齐 advertised_products、搜索词或广告位证据。";
}

function productScopePriorityDecisionBadge(input: {
  dueReviewTodoCount: number;
  reviewTodoCount: number;
  highSignalCount: number;
  openSignalCount: number;
  hasAdEvidence: boolean;
}): string {
  if (input.dueReviewTodoCount > 0) return `人工动作：先复盘 / 复盘状态：到期 ${input.dueReviewTodoCount} 项`;
  if (input.reviewTodoCount > 0) return `人工动作：等待复盘 / 复盘状态：待复盘 ${input.reviewTodoCount} 项`;
  if (input.highSignalCount > 0) return "人工动作：右侧人工确认 / 复盘状态：未排程";
  if (input.openSignalCount > 0) return "人工动作：记录观察 / 复盘状态：可加入复盘";
  if (input.hasAdEvidence) return "人工动作：保持观察 / 复盘状态：按需加入复盘";
  return "人工动作：暂不展开 / 复盘状态：无待办";
}

function productScopePriorityRankReason(input: {
  dueReviewTodoCount: number;
  reviewTodoCount: number;
  highSignalCount: number;
  openSignalCount: number;
  adSpend: number;
  hasAdEvidence: boolean;
}): string {
  if (input.dueReviewTodoCount > 0) {
    return `复盘到期优先于普通信号；到期 ${input.dueReviewTodoCount} 项 / 高优先级 ${input.highSignalCount} 条 / 广告花费 ${formatScopeMoney(input.adSpend)}。`;
  }
  if (input.reviewTodoCount > 0) {
    return `已有复盘排程优先于新分析；待复盘 ${input.reviewTodoCount} 项 / 高优先级 ${input.highSignalCount} 条 / 广告花费 ${formatScopeMoney(input.adSpend)}。`;
  }
  if (input.highSignalCount > 0) {
    return `高优先级信号优先；高优先级 ${input.highSignalCount} 条 / 待复核 ${input.openSignalCount} 条 / 广告花费 ${formatScopeMoney(input.adSpend)}。`;
  }
  if (input.openSignalCount > 0) {
    return `待复核信号优先于安静对象；待复核 ${input.openSignalCount} 条 / 广告花费 ${formatScopeMoney(input.adSpend)}。`;
  }
  if (input.hasAdEvidence) {
    return `有广告证据但暂无强信号；按广告花费 ${formatScopeMoney(input.adSpend)} 保留观察。`;
  }
  return "无广告证据排在后面；只保留经营背景，暂不展开广告诊断。";
}

export function buildProductScopeSelectionSummary(selectedScope: ProductScopeFilterOption | null): ProductScopeSelectionSummary {
  if (!selectedScope) {
    return {
      title: "等待诊断入口",
      description: "需要先读取商品范围，才能按 Parent ASIN / ASIN 收敛信号。",
      targetBoundary: "未选择范围时不生成处理目标；先选择 Parent ASIN / ASIN 后再人工确认。",
      tone: "all",
    };
  }

  if (selectedScope.scope_id === "all" || selectedScope.scope_type === "all") {
    return {
      title: "辅助：全量排查入口",
      description: "这里会混合商品信号、未归因广告数据和数据质量层，只适合全局排查；日常经营诊断优先从 Parent ASIN / ASIN 开始。",
      targetBoundary: "全量入口只用于排查；人工处理仍要落到具体销售商品、广告商品、搜索词或数据质量对象。",
      tone: "all",
    };
  }

  if (selectedScope.scope_id === "unattributed" || selectedScope.scope_type === "unattributed") {
    return {
      title: "辅助：未归因广告数据入口",
      description: "这里只看缺少商品键的搜索词、广告位或投放容器证据，用于解释上下文，不强行归到某个 ASIN。",
      targetBoundary: "未归因入口只解释缺少商品键的广告上下文；人工处理按搜索词、广告位或投放容器记录，不补造 ASIN。",
      tone: "unattributed",
    };
  }

  if (selectedScope.scope_type === "parent_asin" || selectedScope.scope_id.startsWith("parent_asin:")) {
    const parentAsin = selectedScope.parent_asin ?? selectedScope.scope_id.replace("parent_asin:", "");
    return {
      title: "Parent ASIN 经营入口",
      description: "先看 Parent ASIN 的经营盘子，再下钻有广告证据的广告 ASIN、广告组、投放词、搜索词和广告位上下文。",
      targetBoundary: `分析范围是 Parent ASIN ${parentAsin}；人工处理目标必须落到子 ASIN / 销售商品 / 广告 ASIN，广告组和搜索词只用于定位问题，未投放子 ASIN 不直接进入广告诊断，不要把子 ASIN 当作 product_scope_id。`,
      tone: "product",
    };
  }

  if (selectedScope.scope_type === "advertised_asin") {
    const asin = selectedScope.asin ?? selectedScope.scope_id.replace("ad_asin:", "").replace("sales_asin:", "");
    return {
      title: "ASIN 诊断入口",
      description: "当前入口只看该 ASIN 可直接匹配的商品信号；搜索词和广告位仍只作为同广告组上下文。",
      targetBoundary: "当前 ASIN 是诊断入口；人工处理目标使用具体销售商品 / 广告 ASIN 的 object_type 与 object_id。",
      scopeSyncNotice: {
        title: "广告 ASIN 范围已同步",
        summary: `当前已切到 ${asin}，只直接读取该 ASIN 可匹配的广告商品指标。`,
        directMetric: "广告商品指标可直接用于判断该 ASIN 的花费、订单、销售额和 ACOS。",
        contextBoundary: "搜索词、投放词和广告位仍是同广告组上下文，不能自动归因到该 ASIN。",
        manualBoundary: "人工动作仍以后端预检返回的 object_type / object_id 为准，不用页面筛选标签替代。",
      },
      tone: "product",
    };
  }

  if (selectedScope.scope_type === "sales_asin") {
    const asin = selectedScope.asin ?? selectedScope.scope_id.replace("sales_asin:", "");
    return {
      title: "销售 ASIN 背景入口",
      description: "当前入口只作为销售表现和广告覆盖缺口背景，不作为广告下钻或人工动作对象；需要广告诊断时切到 Parent ASIN 或已投广告 ASIN。",
      targetBoundary: "sales_asin 不能替代 advertised_product；人工处理仍必须落到后端预检确认的具体销售商品、广告商品、搜索词、广告位或数据质量对象。",
      scopeSyncNotice: {
        title: "销售背景已同步",
        summary: `当前只观察 ${asin} 的销售背景和广告覆盖缺口，不能说明它已投广告。`,
        directMetric: "销售表现可用于判断经营背景和覆盖缺口，不能直接当作广告商品指标。",
        contextBoundary: "没有广告投放行时不进入广告 ASIN 下钻；搜索词、投放词和广告位不能归因到该销售 ASIN。",
        manualBoundary: "人工动作仍以后端预检返回的 object_type / object_id 为准，不用销售背景筛选标签替代。",
      },
      tone: "product",
    };
  }

  return {
    title: "诊断入口",
    description: "当前入口按已有商品范围筛选信号，底层证据仍保留原始广告对象粒度。",
    targetBoundary: "人工处理目标必须使用后端预检返回的 object_type 与 object_id，不使用页面筛选标签替代。",
    tone: "all",
  };
}

export function buildProductScopeAnalysisPath(selectedScope: ProductScopeFilterOption | null): ProductScopeAnalysisPath {
  if (!selectedScope || selectedScope.scope_id === "all" || selectedScope.scope_type === "all") {
    return {
      steps: ["店铺 / 站点", "全量排查", "商品 / 未归因 / 数据质量", "人工分诊"],
      boundary: "全量排查会混合多个对象层级，只用于排查，不作为日常商品经营诊断口径。",
    };
  }

  if (selectedScope.scope_id === "unattributed" || selectedScope.scope_type === "unattributed") {
    return {
      steps: ["店铺 / 站点", "未归因广告数据", "广告组 / 搜索词 / 广告位", "人工复核"],
      boundary: "这里解释缺少商品键的投放上下文，不能强行归到 Parent ASIN 或 ASIN。",
    };
  }

  if (selectedScope.scope_type === "parent_asin" || selectedScope.scope_id.startsWith("parent_asin:")) {
    return {
      steps: [
        "店铺 / 站点",
        "Parent ASIN 销售盘",
        "广告 ASIN 覆盖",
        "广告组结构",
        "广告位 / 投放词",
        "搜索词 / ABA 证据",
        "AI 信号诊断",
        "人工确认 / 7-14 天复盘",
      ],
      boundary:
        "先看 Parent ASIN 销售盘，再看有广告证据的广告 ASIN 覆盖、广告组结构、投放词、搜索词和广告位；未投放子 ASIN 不进入广告信号队列，搜索词、ABA 和广告位只用于定位问题，不能直接当作 ASIN 归因；AI 信号必须进入人工确认和 7/14 天复盘。",
    };
  }

  if (selectedScope.scope_type === "advertised_asin") {
    return {
      steps: ["店铺 / 站点", "ASIN", "商品指标", "同广告组上下文"],
      boundary: "该入口只直接解释当前 ASIN 的商品指标，搜索词和广告位仍需按同广告组上下文复核。",
    };
  }

  if (selectedScope.scope_type === "sales_asin") {
    return {
      steps: ["店铺 / 站点", "销售 ASIN 背景", "广告覆盖缺口", "人工排查"],
      boundary: "销售 ASIN 只提供经营背景和覆盖缺口，不是广告 ASIN 下钻入口；没有广告投放行时不能生成广告动作对象。",
    };
  }

  return {
    steps: ["店铺 / 站点", "诊断入口", "证据链", "人工分诊"],
    boundary: "当前入口按已有对象范围筛选，仍需按证据原始粒度解释。",
  };
}

export function buildProductScopeEntryGuidance(
  options: ProductScopeFilterOption[],
  coverage?: ProductScopeCoverageForOverview | null,
): ProductScopeEntryGuidance {
  const parentScopeCount = options.filter((option) => option.scope_type === "parent_asin").length;
  const advertisedAsinScopeCount = options.filter((option) => option.scope_type === "advertised_asin").length;
  const salesBackgroundScopeCount = options.filter((option) => option.scope_type === "sales_asin").length;
  const salesBackgroundText = salesBackgroundScopeCount > 0 ? `，${salesBackgroundScopeCount} 个销售背景 ASIN 仅辅助` : "";
  const searchTermContextCount = coverage?.search_term_unattributed_count ?? 0;
  const placementContextCount = coverage?.placement_unattributed_count ?? 0;
  const hasParentScope = parentScopeCount > 0;

  return {
    title: hasParentScope ? "Parent ASIN 优先诊断路径" : "ASIN 临时诊断路径",
    description: hasParentScope
      ? "首层先按 Parent ASIN / ASIN 看经营盘子；只有广告 ASIN 进入广告下钻，销售 ASIN 只作为销售背景。"
      : "当前快照缺少 Parent ASIN，先按已投广告 ASIN 观察；销售 ASIN 只作背景，补齐父 ASIN 导入后再恢复商品组入口。",
    items: [
      {
        label: "第一层分组",
        value: hasParentScope
          ? `${parentScopeCount} 个 Parent ASIN 经营入口，${advertisedAsinScopeCount} 个广告 ASIN 可下钻${salesBackgroundText}`
          : `${advertisedAsinScopeCount} 个广告 ASIN 可观察${salesBackgroundText}`,
        tone: "primary",
      },
      {
        label: "广告下钻证据",
        value: "广告 ASIN / 广告组 / 投放词 / 搜索词用于定位问题，不替代经营商品",
        tone: "direct",
      },
      {
        label: "上下文边界",
        value: `搜索词 ${searchTermContextCount} 条 / 广告位 ${placementContextCount} 条，只做上下文或未归因排查`,
        tone: "context",
      },
    ],
  };
}

export function buildProductScopeQueueHeader(selectedScope: ProductScopeFilterOption | null, visibleCount: number): ProductScopeQueueHeader {
  const countText = `${visibleCount} 条`;

  if (!selectedScope || selectedScope.scope_id === "all" || selectedScope.scope_type === "all") {
    return {
      title: "全量排查 AI 信号",
      countText,
      description: "当前是混合视图，会同时包含商品、未归因广告数据和数据质量层；日常经营诊断优先切到 Parent ASIN / ASIN。",
    };
  }

  if (selectedScope.scope_id === "unattributed" || selectedScope.scope_type === "unattributed") {
    return {
      title: "未归因广告数据 AI 信号",
      countText,
      description: "这里只看缺少商品键的广告组、搜索词或广告位上下文，不强行归属到某个 ASIN。",
    };
  }

  if (selectedScope.scope_type === "parent_asin" || selectedScope.scope_id.startsWith("parent_asin:")) {
    return {
      title: "Parent ASIN 广告证据信号",
      countText,
      description: "从 Parent ASIN 经营盘子下钻，只展示当前范围内有广告证据的广告 ASIN、广告组、投放词和搜索词问题；未投放子 ASIN 不直接进入广告诊断，搜索词和广告位仍按上下文解释。",
    };
  }

  if (selectedScope.scope_type === "advertised_asin" || selectedScope.scope_type === "sales_asin") {
    return {
      title: "当前 ASIN AI 信号",
      countText,
      description: "只展示当前 ASIN 可直接匹配的商品信号；同广告组搜索词和广告位只作为上下文。",
    };
  }

  return {
    title: "当前范围 AI 信号",
    countText,
    description: "队列已按当前诊断入口收敛，底层证据仍保留原始广告对象粒度。",
  };
}

export function buildProductScopeSignalExplanation(
  selectedScope: ProductScopeFilterOption | null,
  input: ProductScopeSignalExplanationInput,
): ProductScopeSignalExplanation | null {
  if (!selectedScope || selectedScope.scope_id === "all" || selectedScope.scope_type === "all") return null;
  const backendCandidateCount = input.signalTriageSummary?.signal_status?.candidate_count ?? 0;
  if (backendCandidateCount > 0 || input.signalTriageSummary?.actionability_status?.can_write_manual_action === true) return null;
  const lowSignalThreshold = input.lowSignalThreshold ?? 2;
  if (input.scopeSignalCount > lowSignalThreshold) return null;

  const isParentScope = selectedScope.scope_type === "parent_asin" || selectedScope.scope_id.startsWith("parent_asin:");
  const isAsinScope = selectedScope.scope_type === "advertised_asin" || selectedScope.scope_type === "sales_asin";
  const noActionableMessage = summaryHasNoActionableCandidate(input.signalTriageSummary)
    ? input.signalTriageSummary?.actionability_status?.message ?? "当前经营对象暂无可行动候选，只能作为诊断视图，不能写人工动作。"
    : null;
  const title = productScopeSignalExplanationTitle({
    isParentScope,
    isAsinScope,
    noActionable: Boolean(noActionableMessage),
    scopeSignalCount: input.scopeSignalCount,
  });
  const reasons: string[] = [];
  const strategyNotes = selectedScope.strategy_notes ?? [];

  if (noActionableMessage) {
    reasons.push(`可行动准入：${noActionableMessage}`);
  }

  if (strategyNotes.length > 0) {
    reasons.push(`策略压制：${strategyNotes[0]}`);
  }

  if (isParentScope) {
    const childAsinCount = selectedScope.child_asins?.length ?? 0;
    const advertisedAsinCount = input.advertisedAsinCount ?? 0;
    if (childAsinCount > 0) {
      reasons.push(
        `Parent ASIN 广告口径：销售表现识别 ${childAsinCount} 个子 ASIN，其中 ${advertisedAsinCount} 个有当前投放广告证据；未投放子 ASIN 只作经营背景，不进入广告信号队列。`,
      );
    }
    const adSpend = scopeAdSpend(selectedScope);
    const adOrders = scopeAdOrders(selectedScope);
    const adSales = scopeAdSales(selectedScope);
    if (advertisedAsinCount > 0 || adSpend > 0 || adOrders > 0 || adSales > 0) {
      reasons.push(
        `广告承接口径：${advertisedAsinCount} 个广告 ASIN 合计花费 ${formatScopeMoney(adSpend)}，广告订单 ${adOrders}，广告销售 ${formatScopeMoney(adSales)}；未命中高花费无订单或高点击低转化等可处理异常时，只能保持观察。`,
      );
    } else {
      reasons.push("广告承接口径：当前 Parent ASIN 没有投放广告 ASIN，不能生成广告处理建议。");
    }
  }

  const productScopeDrilldown = productScopeDrilldownText(input.signalTriageSummary);
  if (productScopeDrilldown) {
    reasons.push(productScopeDrilldown);
  }

  const manualActionEvidenceGap = manualActionEvidenceGapText(input.signalTriageSummary);
  if (manualActionEvidenceGap) {
    reasons.push(manualActionEvidenceGap);
  }

  const metricTotal = isParentScope
    ? scopeSalesOrders(selectedScope) + scopeSalesAmount(selectedScope) + scopeAdSpend(selectedScope) + scopeAdOrders(selectedScope) + scopeAdSales(selectedScope)
    : (selectedScope.spend ?? 0) + (selectedScope.orders ?? 0) + (selectedScope.sales ?? 0);

  if (metricTotal <= 0) {
    reasons.push("数据不足：当前范围缺少广告花费、订单或销售样本，只能保持观察。");
  } else {
    reasons.push("暂无可处理命中：当前真实快照有经营或广告数据，但没有命中人工处理队列准入门槛。");
  }

  if (isParentScope || isAsinScope) {
    reasons.push("商品粒度：这里只统计能直接落到 ASIN 的商品信号，搜索词和广告位不会强行归入。");
  }

  const outsideSignalCount = Math.max(input.allSignalCount - input.scopeSignalCount, 0);
  if (outsideSignalCount > 0) {
    const outsideLabel = isParentScope ? "Parent ASIN 广告证据范围" : isAsinScope ? "ASIN 广告证据范围" : "当前诊断范围";
    reasons.push(`范围外辅助排查：还有 ${outsideSignalCount} 条不属于当前 ${outsideLabel}的信号，只用于查看未归因广告数据或数据质量事项。`);
  }

  if ((input.dataQualityCount ?? 0) > 0) {
    reasons.push(`数据质量层还有 ${input.dataQualityCount} 条，只说明数据链路或字段覆盖，不参与商品归因。`);
  }

  return {
    title,
    description: "信号少不等于系统没读到数据，需要先区分策略压制、暂无规则命中和数据不足。",
    reasons,
    tone: strategyNotes.length > 0 ? "strategy" : reasons.some((reason) => reason.startsWith("数据不足") || reason.startsWith("复盘输入证据缺口")) ? "data" : "neutral",
  };
}

function productScopeSignalExplanationTitle(input: {
  isParentScope: boolean;
  isAsinScope: boolean;
  noActionable: boolean;
  scopeSignalCount: number;
}): string {
  if (input.isParentScope) {
    if (input.noActionable) return "当前 Parent ASIN 暂无可行动候选";
    if (input.scopeSignalCount === 0) return "当前 Parent ASIN 暂无可处理广告信号";
    return `当前 Parent ASIN 仅有 ${input.scopeSignalCount} 条广告信号`;
  }
  if (input.isAsinScope) {
    if (input.noActionable) return "当前 ASIN 暂无可行动候选";
    if (input.scopeSignalCount === 0) return "当前 ASIN 暂无需处理信号";
    return `当前 ASIN 仅有 ${input.scopeSignalCount} 条信号`;
  }
  if (input.noActionable) return "当前范围暂无可行动候选";
  return input.scopeSignalCount === 0 ? "当前范围暂无需处理信号" : `当前范围仅有 ${input.scopeSignalCount} 条信号`;
}

function productScopeDrilldownText(summary: SignalTriageSummaryForUi | null | undefined): string | null {
  const drilldown = summary?.product_scope_drilldown;
  const items = drilldown?.items ?? [];
  if (!drilldown || items.length <= 0) return null;

  const topItem = items[0];
  const topGroup = topItem.top_ad_group;
  const parts: string[] = [];
  const summaryText = drilldown.summary?.trim();
  parts.push(summaryText || `当前商品范围广告 ASIN ${drilldown.advertised_asin_count ?? items.length} 个。`);

  const asin = topItem.asin?.trim();
  if (asin && topGroup) {
    const adGroupName = topGroup.ad_group_name?.trim() || topGroup.ad_group_id?.trim() || "优先广告组";
    parts.push(
      `优先下钻 ${asin} -> ${adGroupName}：花费 ${formatScopeMoney(topGroup.spend ?? topItem.spend ?? 0)}，订单 ${topGroup.orders ?? topItem.orders ?? 0}，搜索词 ${
        topGroup.search_term_count ?? 0
      } 条，广告组级广告位 ${topGroup.placement_count ?? 0} 条，同广告活动广告位 ${topGroup.campaign_placement_count ?? 0} 条`,
    );
    const searchTermText = productScopeSearchTermText(topGroup);
    if (searchTermText) {
      parts.push(searchTermText);
    }
  } else if (asin) {
    parts.push(`优先下钻 ${asin}，当前还缺少广告组、搜索词或广告位上下文。`);
  }

  const boundary = drilldown.boundary?.trim();
  if (boundary) {
    parts.push(boundary);
  }
  return `广告下钻：${parts.join("；")}`;
}

function productScopeSearchTermText(topGroup: ProductScopeDrilldownTopAdGroupForUi): string | null {
  const effectiveTerms = productScopeTermNames(topGroup.effective_search_terms);
  const zeroOrderTerms = productScopeTermNames(topGroup.zero_order_search_terms);
  const parts: string[] = [];
  if (effectiveTerms.length > 0) {
    parts.push(`有效搜索词：${effectiveTerms.join("、")}`);
  }
  if (zeroOrderTerms.length > 0) {
    parts.push(`无订单花费搜索词：${zeroOrderTerms.join("、")}`);
  }
  return parts.length > 0 ? parts.join("；") : null;
}

function productScopeTermNames(terms: ProductScopeDrilldownTermForUi[] | null | undefined): string[] {
  return uniqueNonEmpty((terms ?? []).map((term) => term.search_term || term.normalized_query)).slice(0, 3);
}

function productScopeTargetingNames(context: ProductScopeTargetingContextForUi | null | undefined): string[] {
  return uniqueNonEmpty([
    ...(context?.effective_targetings ?? []).map((item) => item.targeting_text),
    ...(context?.zero_order_spend_targetings ?? []).map((item) => item.targeting_text),
    ...(context?.top_targetings ?? []).map((item) => item.targeting_text),
  ]).slice(0, 3);
}

function manualActionEvidenceGapText(summary: SignalTriageSummaryForUi | null | undefined): string | null {
  const checklist = summary?.review_status?.review_feedback?.closure_checklist ?? [];
  const manualActionContext = checklist.find((item) => item.check_id === "manual_action_context" && item.status === "blocked");
  const evidence = manualActionContext?.evidence?.trim();
  if (!evidence) return null;
  return `复盘输入证据缺口：${evidence}；这些历史人工留痕不能支撑 7/14 天复盘，应先补齐证据快照或重新走人工确认。`;
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim() ?? "").filter(Boolean)));
}

function formatScopeMoney(value?: number): string {
  return `$${(value ?? 0).toFixed(2)}`;
}

function scopeAdSpend(option: ProductScopeFilterOption): number {
  if (option.ad_spend !== undefined) return option.ad_spend;
  if (option.scope_type === "parent_asin" || option.scope_type === "advertised_asin") return option.spend ?? 0;
  return 0;
}

function scopeAdOrders(option: ProductScopeFilterOption): number {
  if (option.ad_orders !== undefined) return option.ad_orders;
  if (option.scope_type === "advertised_asin") return option.orders ?? 0;
  return 0;
}

function scopeAdSales(option: ProductScopeFilterOption): number {
  if (option.ad_sales !== undefined) return option.ad_sales;
  if (option.scope_type === "advertised_asin") return option.sales ?? 0;
  return 0;
}

function scopeSalesOrders(option: ProductScopeFilterOption): number {
  return option.sales_orders ?? option.orders ?? 0;
}

function scopeSalesAmount(option: ProductScopeFilterOption): number {
  return option.sales_amount ?? option.sales ?? 0;
}

function buildProductGroupAdAsinDecision(input: {
  asin: string;
  spend: number;
  orders: number;
  sales: number;
  acos: number | null;
  strategyNote: string | null;
}): ProductGroupAdAsinDecision {
  const spendText = formatScopeMoney(input.spend);
  const salesText = formatScopeMoney(input.sales);
  const acosText = input.acos === null ? "无销售额" : `${(input.acos * 100).toFixed(1)}%`;
  const hasStrategy = Boolean(input.strategyNote?.trim());
  const statusLabel =
    input.spend <= 0
      ? "不优先下钻"
      : input.orders <= 0
        ? "优先排查承接"
        : hasStrategy
          ? "按策略复核"
          : "可作为下钻入口";
  const metricReason =
    input.spend <= 0
      ? `广告花费 ${spendText}，当前只能证明覆盖关系。`
      : input.orders <= 0
        ? `广告花费 ${spendText} 但订单 0，先查同广告组搜索词和广告位上下文。`
        : `广告花费 ${spendText}，订单 ${input.orders}，销售额 ${salesText}，ACOS ${acosText}。`;
  const strategyReason = hasStrategy ? `策略说明：${input.strategyNote}` : "暂无主推款策略说明。";

  return {
    statusLabel,
    reason: `${metricReason} ${strategyReason}`,
    proves: `能证明广告 ASIN ${input.asin} 在当前 Parent ASIN 范围内有广告商品粒度表现。`,
    doesNotProve: "不能证明未投放子 ASIN 有广告问题，也不能把搜索词、广告位或 ABA 自动归因到该 ASIN。",
    nextFocus:
      input.spend <= 0
        ? "下一步先核对广告商品覆盖；没有消耗时不进入花费或 ACOS 判断。"
        : "下一步点击该 ASIN 下钻广告组、投放词、搜索词和广告位证据；只做人工复核，不自动执行广告动作。",
  };
}

function formatCoverageRatio(part: number, total: number): string {
  if (total <= 0) return "覆盖率待核对";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function buildProductScopeAdCoverageDecision(
  childAsins: string[],
  adAsinRows: ProductGroupAdAsinRow[],
): ProductScopeAdCoverageDecision {
  const adAsinSet = new Set(adAsinRows.map((row) => row.asin));
  const unadvertisedChildAsins = childAsins.filter((asin) => !adAsinSet.has(asin));
  const childCount = childAsins.length;
  const adCount = adAsinRows.length;
  const uncoveredCount = unadvertisedChildAsins.length;
  const coverageText = formatCoverageRatio(adCount, childCount);
  const uncoveredSample = unadvertisedChildAsins.slice(0, 5).join("、");
  const hiddenUncoveredCount = Math.max(0, uncoveredCount - 5);
  const uncoveredText =
    uncoveredCount > 0
      ? `${uncoveredSample}${hiddenUncoveredCount > 0 ? ` 等 ${uncoveredCount} 个` : ""}`
      : "暂无未投放子 ASIN";

  if (childCount === 0) {
    return {
      statusLabel: "子 ASIN 待核对",
      summary: "当前 Parent ASIN 缺少销售表现子 ASIN 清单，不能判断广告覆盖率，也不能证明没有未投放变体。",
      proves: "只能证明当前筛选范围下暂时没有可比较的销售表现子 ASIN 清单。",
      doesNotProve: "不能证明 Parent ASIN 没有子商品，也不能用广告 ASIN 数替代完整变体数量。",
      nextManualStep: "先补销售表现 parent_asin / variationAsin 或稳定商品映射，再判断广告 ASIN 覆盖。",
    };
  }

  return {
    statusLabel: `${adCount}/${childCount} 个子 ASIN 有当前 SP 广告投放行`,
    summary:
      `当前 SP 广告覆盖率 ${coverageText}；${adCount} 个广告 ASIN 可进入广告诊断，` +
      `${uncoveredCount} 个未投放子 ASIN 只作为经营背景或覆盖缺口。`,
    proves:
      adCount > 0
        ? "advertised_products 已覆盖这些 ASIN 的广告商品表现，可继续下钻广告组、投放词、搜索词和广告位。"
        : "当前 Parent ASIN 销售范围没有命中 advertised_products 投放行，不能进入广告对象级诊断。",
    doesNotProve: "不能证明 Parent ASIN 只有这些广告 ASIN，也不能证明未投放子 ASIN 存在广告异常。",
    nextManualStep:
      uncoveredCount > 0
        ? `先围绕 ${adCount} 个广告 ASIN 做广告诊断；未覆盖 ${uncoveredText} 需要补广告投放行、非 SP 来源或商品映射证据后再进入广告分析。`
        : "全部销售表现子 ASIN 都有广告投放行时，仍需逐个下钻广告组、投放词、搜索词和广告位，不能自动执行广告动作。",
  };
}

export function buildProductScopeGroupOverview(
  selectedScope: ProductScopeFilterOption | null,
  options: ProductScopeFilterOption[],
  coverage?: ProductScopeCoverageForOverview | null,
): ProductScopeGroupOverview | null {
  if (!selectedScope) return null;
  if (selectedScope.scope_type !== "parent_asin" && !selectedScope.scope_id.startsWith("parent_asin:")) return null;

  const parentAsin = selectedScope.parent_asin ?? selectedScope.scope_id.replace("parent_asin:", "");
  const childAsins = selectedScope.child_asins ?? [];
  const childAsinSet = new Set(childAsins);
  const adAsinOptions = options
    .filter((option) => option.scope_type === "advertised_asin" && option.asin && childAsinSet.has(option.asin))
    .sort((left, right) => scopeAdSpend(right) - scopeAdSpend(left));
  const adAsinLabels = adAsinOptions.map((option) => {
    const asin = option.asin ?? option.label ?? "未知 ASIN";
    return `${asin} / 广告花费 ${formatScopeMoney(scopeAdSpend(option))} / 广告订单 ${scopeAdOrders(option)} / 广告销售额 ${formatScopeMoney(scopeAdSales(option))}`;
  });
  const adAsinRows = adAsinOptions.map((option) => {
    const spend = scopeAdSpend(option);
    const sales = scopeAdSales(option);
    const asin = option.asin ?? option.label ?? "未知 ASIN";
    const orders = scopeAdOrders(option);
    const acos = sales > 0 ? spend / sales : null;
    const strategyNote = option.strategy_notes?.[0] ?? null;
    return {
      scopeId: option.scope_id,
      asin,
      spend,
      orders,
      sales,
      acos,
      strategyNote,
      decision: buildProductGroupAdAsinDecision({ asin, spend, orders, sales, acos, strategyNote }),
    };
  });
  const adCoverageDecision = buildProductScopeAdCoverageDecision(childAsins, adAsinRows);
  const strategyNotes = uniqueNonEmpty([
    ...(selectedScope.strategy_notes ?? []),
    ...adAsinOptions.flatMap((option) => option.strategy_notes ?? []),
  ]);
  const boundaryNotes = [
    "销售子 ASIN 来自 sales_product_daily_metrics、parent_asin/variationAsin 或人工映射；广告 ASIN 来自 advertised_products。两者不能互相替代，未投放子 ASIN 只作为经营背景，不进入广告信号队列。",
    "广告组是投放容器，一个广告组至少包含一个广告商品，也可能包含多个广告商品，不能用广告组数量或广告覆盖数量推断完整子商品数量。",
  ];
  if (selectedScope.metric_boundary) {
    boundaryNotes.push(selectedScope.metric_boundary);
  }

  if ((coverage?.search_term_unattributed_count ?? 0) > 0) {
    boundaryNotes.push(`搜索词 ${coverage?.search_term_unattributed_count} 条只能作为未归因或同广告组上下文，不能自动归因到商品组。`);
  }
  if ((coverage?.placement_unattributed_count ?? 0) > 0) {
    boundaryNotes.push(`广告位 ${coverage?.placement_unattributed_count} 条只能作为流量位置或同广告组上下文，不能自动归因到商品组。`);
  }
  const searchTermContextCount = coverage?.search_term_unattributed_count ?? 0;
  const placementContextCount = coverage?.placement_unattributed_count ?? 0;
  const parentOrders = scopeSalesOrders(selectedScope);
  const parentSales = scopeSalesAmount(selectedScope);
  const parentAdSpend = scopeAdSpend(selectedScope);
  const parentAdOrders = scopeAdOrders(selectedScope);
  const parentAdSales = scopeAdSales(selectedScope);
  const relationItems: ProductScopeRelationItem[] = [
    {
      label: "销售背景（不直接诊断）",
      value: `Parent ASIN ${parentAsin} / 销售表现识别 ${childAsins.length} 个子 ASIN / 经营订单 ${parentOrders} / 经营销售额 ${formatScopeMoney(parentSales)}；用于先看整体经营，不等同广告对象`,
      tone: "primary",
    },
    {
      label: "广告诊断对象（有投放证据）",
      value: `仅 ${adAsinLabels.length} 个 advertised_products 广告 ASIN 可下钻 / 广告花费 ${formatScopeMoney(parentAdSpend)} / 广告订单 ${parentAdOrders} / 广告销售额 ${formatScopeMoney(parentAdSales)}，继续看广告组、投放词和搜索词`,
      tone: "direct",
    },
    {
      label: "策略事实",
      value:
        strategyNotes.length > 0
          ? `${strategyNotes.length} 条主推款/策略说明；消耗集中不直接判异常`
          : "暂无主推款策略说明；消耗集中需人工复核",
      tone: "strategy",
    },
    {
      label: "广告流量上下文（不可归因 ASIN）",
      value: `投放词、搜索词 ${searchTermContextCount} 条 / 广告位 ${placementContextCount} 条只做问题定位，不做 ASIN 归因`,
      tone: "context",
    },
  ];

  return {
    title: `Parent ASIN ${parentAsin} 经营背景与广告证据`,
    summary: `经营背景：${childAsins.length} 个销售表现子 ASIN；广告诊断：仅 ${adAsinLabels.length} 个有投放证据的广告 ASIN 可下钻`,
    adAsinLabels,
    adAsinRows,
    adCoverageDecision,
    relationItems,
    strategyNotes,
    boundaryNotes,
  };
}

export function buildProductScopeFirstScreenSummary(
  overview: ProductScopeGroupOverview | null,
  triageSummary?: SignalTriageSummaryForUi | null,
): ProductScopeFirstScreenSummary | null {
  if (!overview) return null;
  const salesFact = overview.relationItems[0]?.value ?? "Parent ASIN 经营销售盘等待销售表现证据";
  const advertisedAsinCount = overview.adAsinRows.length;
  const adAsinText =
    advertisedAsinCount > 0
      ? `${advertisedAsinCount} 个当前投放广告 ASIN，只进入有 advertised_products 证据的广告 ASIN；这不是销售子 ASIN 全量。`
      : "当前没有可进入广告诊断的广告 ASIN。";
  const actionabilityMessage =
    triageSummary?.actionability_status?.message?.trim() ||
    triageSummary?.actionability_status?.next_step?.trim() ||
    "先复核广告 ASIN、广告组、投放词、搜索词和广告位证据。";
  const candidateCount = triageSummary?.signal_status?.candidate_count;
  const canWriteManualAction = triageSummary?.actionability_status?.can_write_manual_action === true;
  const manualActionCount = triageSummary?.review_status?.manual_action_count ?? 0;
  const reviewRecordCount = triageSummary?.review_status?.review_record_count ?? 0;
  const readyReviewCount = triageSummary?.review_status?.ready_count ?? 0;
  const earliestDueDate = triageSummary?.review_status?.review_wait_summary?.earliest_due_date?.trim();
  const candidateText =
    candidateCount === undefined
      ? "AI 候选等待扫描"
      : canWriteManualAction && candidateCount > 0
        ? `${candidateCount} 个可写人工候选`
        : `${candidateCount} 个候选未通过人工写入门禁`;
  const mvpStatus: ProductScopeMvpStatus =
    readyReviewCount > 0 && reviewRecordCount > 0
      ? {
          title: "诊断 MVP 状态判定",
          statusLabel: "复盘闭环可验证",
          summary: `当前已有 ${readyReviewCount} 个 ready 复盘和 ${reviewRecordCount} 条 review_records，可以进入人工复盘样本验证；仍不自动改规则或执行广告动作。`,
          detail: "沿 Parent ASIN -> 广告 ASIN -> 广告组 / 投放商品 / 搜索词 / 广告位 -> AI 信号 -> 人工留痕 -> 复盘记录检查证据链。",
          boundary: "完整闭环也只代表人工保存过复盘样本，不代表系统可自动执行广告动作。",
          tone: "review",
        }
      : canWriteManualAction && (candidateCount ?? 0) > 0
        ? {
            title: "诊断 MVP 状态判定",
            statusLabel: "人工留痕 MVP",
            summary: `当前有 ${candidateCount} 个可写人工候选，可进入人工确认和留痕；但 ready 复盘 ${readyReviewCount} 个、review_records ${reviewRecordCount} 条，不是完整复盘闭环。`,
            detail: "沿 Parent ASIN -> 广告 ASIN -> 广告组 / 投放商品 / 搜索词 / 广告位 -> AI 信号 -> 人工留痕推进，复盘窗口完整后再评价效果。",
            boundary: "ready 复盘出现前只能记录人工动作，不能保存复盘结论，不能说建议有效或无效。",
            tone: "manual",
          }
        : advertisedAsinCount > 0
          ? {
              title: "诊断 MVP 状态判定",
              statusLabel: "诊断 MVP",
              summary: `当前有真实广告证据，但 ${candidateText}；可用于定位问题，不是完整业务闭环。`,
              detail: "继续下钻广告 ASIN、广告组、搜索词和广告位，确认对象边界、证据强度和 AI 准入原因。",
              boundary: "没有可写候选或 ready 复盘时，不能保存 review_records，不能说处理有效或无效。",
              tone: "diagnostic",
            }
          : {
              title: "诊断 MVP 状态判定",
              statusLabel: "数据准备中",
              summary: "当前缺少可下钻广告 ASIN，不能进入广告诊断 MVP。",
              detail: "先补齐广告商品、广告组、搜索词和广告位证据，再判断 AI 信号准入。",
              boundary: "没有广告证据时不能生成广告调整建议，也不能写人工复盘记录。",
              tone: "blocked",
            };
  const reviewGateValue =
    readyReviewCount > 0
      ? `${readyReviewCount} 个 ready 复盘待人工保存`
      : manualActionCount > 0
        ? `已有 ${manualActionCount} 条人工留痕，最早 ${earliestDueDate || "等待窗口"} 后复盘`
        : "暂无人工留痕，不能生成复盘结论";
  const pathSummary =
    "Parent ASIN 经营销售入口 -> 广告 ASIN -> 广告组 -> 投放商品 / 投放词 / 搜索词 / 广告位 -> AI 信号诊断 -> 人工确认 -> 7/14 天复盘";
  const aiSignalStepDetail =
    candidateCount === undefined
      ? `等待 AI 准入扫描；${actionabilityMessage}`
      : `${candidateCount} 个候选；${actionabilityMessage}`;
  const landingGates: ProductScopeLandingGateItem[] = [
    {
      label: "经营口径",
      value: salesFact,
      detail: "销售表现子 ASIN 是经营背景；广告诊断必须继续落到有广告证据的广告 ASIN。",
      tone: "scope",
    },
    {
      label: "广告证据",
      value: advertisedAsinCount > 0 ? `${advertisedAsinCount} 个广告 ASIN 可下钻` : "缺少广告 ASIN，不能进入广告诊断",
      detail: overview.adCoverageDecision.summary,
      tone: advertisedAsinCount > 0 ? "ready" : "blocked",
    },
    {
      label: "AI 准入",
      value:
        candidateCount === undefined
          ? "等待 AI 准入扫描"
          : candidateCount > 0 && canWriteManualAction
            ? `${candidateCount} 个候选可人工复核`
            : `${candidateCount ?? 0} 个候选，只能诊断不能写动作`,
      detail: actionabilityMessage,
      tone: candidateCount && candidateCount > 0 && canWriteManualAction ? "ready" : "waiting",
    },
    {
      label: "复盘门槛",
      value: reviewGateValue,
      detail: `已保存 review_records ${reviewRecordCount} 条；未保存复盘结论前不能说处理有效或无效。`,
      tone: readyReviewCount > 0 ? "ready" : manualActionCount > 0 ? "waiting" : "blocked",
    },
  ];
  return {
    title: "Parent ASIN 经营销售入口与广告证据",
    summary: overview.summary,
    mvpStatus,
    factItems: overview.relationItems.slice(0, 2),
    adAsinRows: overview.adAsinRows.slice(0, 3),
    adCoverageDecision: overview.adCoverageDecision,
    landingGates,
    pathSummary,
    pathSteps: [
      { label: "Parent ASIN 经营销售盘", detail: salesFact },
      { label: "广告 ASIN 覆盖", detail: adAsinText },
      { label: "广告组结构", detail: "广告组是投放容器，不是产品；先看同组投放商品、花费和订单分化。" },
      {
        label: "投放商品 / 投放词 / 搜索词 / 广告位",
        detail:
          "投放商品来自广告组内 advertised_products 证据，只代表实际参与广告投放的商品；投放词、搜索词和广告位只作为流量上下文证据，不能直接归因到单个 ASIN。",
      },
      { label: "AI 信号诊断", detail: aiSignalStepDetail },
      {
        label: "人工确认",
        detail: "只允许记录观察、标记已处理、加入复盘、忽略本次；不自动加词、否词、调价或暂停广告。",
      },
      {
        label: "7/14 天复盘",
        detail: `${reviewGateValue}；窗口完整后人工保存 ReviewRecord，不能自动改规则或执行广告动作。`,
      },
    ],
    boundary: "只展示有广告证据的广告 ASIN；未投放子 ASIN 不进入广告诊断；搜索词和广告位不能直接归因到单个 ASIN。",
  };
}

export function buildSignalDiagnosticScope(signal: ProductScopedSignalForUi): SignalDiagnosticScope {
  const productScopeIds = signalProductScopeIds(signal);

  if (signal.signal_category === "data_quality") {
    return {
      label: "数据质量层",
      boundary: "这条信号先判断数据链路、字段覆盖或新鲜度，不进入商品归因；补齐数据后再做商品或广告对象诊断。",
    };
  }

  if (productScopeIds.length > 0) {
    return {
      label: "商品视角",
      boundary: "已匹配到广告或销售 ASIN，可先按商品视角筛选；但底层证据仍需按广告活动、广告组、搜索词或广告位原始粒度解释。",
    };
  }

  if (signal.object_type === "search_term") {
    return {
      label: "未归因广告数据",
      boundary: "当前搜索词证据只有广告活动、广告组和搜索词粒度，缺少 ASIN，不能强行归属到商品或 Parent ASIN；应放在未归因广告数据下观察。",
    };
  }

  if (signal.object_type === "placement") {
    return {
      label: "未归因广告数据",
      boundary: "当前广告位证据只有广告活动和广告位粒度，缺少 ASIN，不能强行归属到商品或 Parent ASIN；应放在未归因广告数据下观察。",
    };
  }

  if (signal.object_type === "ad_group") {
    return {
      label: "投放容器",
      boundary: "广告组是投放容器，不是商品；没有 ASIN 证据时只能按广告组结构复核，不能直接归属到经营商品。",
    };
  }

  return {
    label: "未归因对象",
    boundary: "当前证据缺少稳定商品键，不能按商品或 Parent ASIN 汇总；先保留在原始对象层级诊断。",
  };
}

export function buildSignalQueueScopeBadge(signal: ProductScopedSignalForUi): SignalQueueScopeBadge {
  const scope = buildSignalDiagnosticScope(signal);
  if (scope.label === "商品视角") return { label: scope.label, tone: "product" };
  if (scope.label === "数据质量层") return { label: scope.label, tone: "data_quality" };
  if (scope.label === "投放容器") return { label: scope.label, tone: "container" };
  return { label: scope.label, tone: "unattributed" };
}

const queueObjectTypeLabel: Record<NonNullable<SignalForUi["object_type"]>, string> = {
  ad_group: "广告组",
  sales_product: "销售商品",
  advertised_product: "广告商品",
  search_term: "搜索词",
  placement: "广告位",
  search_intent: "搜索词表现聚合",
  cross: "交叉信号",
};

export function buildSelectedSignalScopeContext(
  selectedScope: ProductScopeFilterOption | null,
  signal: ProductScopedSignalForUi | null | undefined,
): SelectedSignalScopeContext | null {
  if (!signal) return null;

  const diagnosticScope = buildSignalDiagnosticScope(signal);
  const scopeBadge = buildSignalQueueScopeBadge(signal);
  const scopeLabel = diagnosisScopeLabel(selectedScope);
  const primaryObject = signal.evidence?.primary_object;
  const objectType = signal.object_type ?? primaryObject?.object_type;
  const objectTypeLabel = objectType ? queueObjectTypeLabel[objectType] ?? "信号对象" : "信号对象";
  const objectLabel =
    primaryObject?.label?.trim() ||
    primaryObject?.search_term?.trim() ||
    primaryObject?.placement?.trim() ||
    primaryObject?.asin?.trim() ||
    signal.id;
  const signalObject = `${objectTypeLabel}：${objectLabel}`;
  const relation = selectedSignalScopeRelationText(selectedScope, signal, scopeLabel, signalObject);

  return {
    title: "选中信号与当前入口",
    statusLabel: diagnosticScope.label,
    scopeLabel,
    signalObject,
    relation,
    boundary: uniqueNonEmpty([
      `当前诊断入口仍是 ${scopeLabel}；选中信号只决定中间证据和右侧人工确认对象。`,
      diagnosticScope.boundary,
    ]).join("；"),
    tone: scopeBadge.tone,
  };
}

export function buildSearchIntentFocusContext(
  selectedIntentLabel: string | null | undefined,
  signal: ProductScopedSignalForUi | null | undefined,
  selectedScope: ProductScopeFilterOption | null = null,
  searchIntentReviewCard: SearchIntentReviewCard | null | undefined = null,
): SearchIntentFocusContext | null {
  const focusLabel = selectedIntentLabel?.trim();
  if (!focusLabel || !signal) return null;
  if (filterSignalsBySearchIntent([signal], focusLabel).length === 0) return null;

  const primaryObject = signal.evidence?.primary_object;
  const searchTerm =
    primaryObject?.search_term?.trim() ||
    primaryObject?.label?.trim() ||
    signal.id;
  const signalObject = `SearchTerm：${searchTerm}`;
  const scopeLabel = diagnosisScopeLabel(selectedScope);
  const decisionCard = searchIntentReviewCard?.intentLabel === focusLabel ? searchIntentReviewCard : null;
  const pathItems = [
    { label: "经营诊断入口", value: scopeLabel },
    { label: "广告搜索词表现聚合", value: `${focusLabel}：当前 Parent ASIN 关联广告中的用户搜索词表现行` },
    { label: "当前诊断对象", value: signalObject },
  ];
  if (decisionCard) {
    pathItems.push({
      label: "运营判断",
      value: `${decisionCard.operationDecisionLabel}：${decisionCard.operationDecisionReason}`,
    });
    if (decisionCard.primarySearchTerm) {
      pathItems.push({
        label: "优先 SearchTerm",
        value: `${decisionCard.primarySearchTerm}：${decisionCard.primarySearchTermReason}`,
      });
    }
  }
  const decisionText = decisionCard
    ? `当前聚合卡片判断为“${decisionCard.operationDecisionLabel}”，只用于决定先复核哪条 SearchTerm。`
    : "";

  return {
    title: "Parent ASIN 广告搜索词表现复核承接",
    focusLabel,
    signalObject,
    pathItems,
    relation: `这个广告搜索词表现聚合用于从 ${scopeLabel} 视角聚合广告中实际产生表现的用户搜索词行；左侧只用它缩小同类 SearchTerm 信号队列；中间仍诊断 ${signalObject}；若进入人工动作，右侧必须以后端预检确认的 SearchTerm 稳定对象为准。${decisionText}`,
    boundary: `Parent ASIN 广告搜索词表现复核「${focusLabel}」只是从 Parent ASIN 视角聚合广告搜索词表现的分析视角，不是经营商品、广告组或人工动作对象；扩量 / 止损 / 观察判断只服务人工复核优先级；ABA 只作站点级背景，实际写入以后端 preflight evidence_snapshot_preview 为准。`,
    tone: "container",
  };
}

function searchIntentSelectedSignalSearchTerm(signal: ProductScopedSignalForUi | null | undefined): string {
  if (!signal) return "";
  const primaryObject = signal.evidence?.primary_object;
  const candidates: unknown[] = [
    primaryObject?.search_term,
    primaryObject?.label,
    primaryObject?.object_id,
    (signal as { object_id?: unknown }).object_id,
  ];
  const evidence = signal.evidence as SearchIntentFilterSignalForUi["evidence"] | undefined;
  evidence?.facts?.forEach((fact) => {
    if (isSearchTermFactLabel(fact.label)) candidates.push(fact.value);
  });
  signal.evidence?.source_rows?.forEach((row) => {
    candidates.push(row.search_term, row.normalized_query, row.query);
  });
  return candidates.map((candidate) => stringValue(candidate)).find(Boolean) ?? "";
}

export function buildSearchIntentSelectedTermReasonSummary(
  selectedIntentLabel: string | null | undefined,
  signal: ProductScopedSignalForUi | null | undefined,
  searchIntentReviewCard:
    | Pick<
        SearchIntentReviewCard,
        "intentLabel" | "operationDecisionLabel" | "operationDecisionReason" | "primarySearchTerm" | "primarySearchTermReason" | "nextManualStep"
      >
    | null
    | undefined = null,
): SearchIntentSelectedTermReasonSummary | null {
  const focusLabel = selectedIntentLabel?.trim();
  if (!focusLabel || !signal) return null;
  if (filterSignalsBySearchIntent([signal], focusLabel).length === 0) return null;

  const decisionCard = searchIntentReviewCard?.intentLabel === focusLabel ? searchIntentReviewCard : null;
  const selectedSearchTerm = searchIntentSelectedSignalSearchTerm(signal);
  const primarySearchTerm = decisionCard?.primarySearchTerm?.trim() ?? "";
  const normalizedPrimarySearchTerm = normalizeSearchIntentSearchTerm(primarySearchTerm);
  const matchedPrimarySearchTerm = normalizedPrimarySearchTerm
    ? searchIntentSignalMatchesSearchTerm(signal, normalizedPrimarySearchTerm)
    : Boolean(selectedSearchTerm);
  const tone: SearchIntentSelectedTermReasonTone = !selectedSearchTerm ? "waiting" : matchedPrimarySearchTerm ? "ready" : "warning";
  const currentObjectDetail = !selectedSearchTerm
    ? "当前聚合分组还没有命中具体 SearchTerm 信号；只能先检查广告搜索词快照和信号准入条件。"
    : matchedPrimarySearchTerm
      ? "当前中间诊断已经落到该聚合分组下优先复核的 SearchTerm；继续看广告组、投放词、广告 ASIN 和广告位证据。"
      : "当前选中 SearchTerm 与聚合卡片的优先项不一致；这通常表示用户手动切换了信号，需要按当前信号证据复核。";
  const reviewTarget = selectedSearchTerm || primarySearchTerm || "等待具体 SearchTerm";

  return {
    title: "具体 SearchTerm 复核理由",
    tone,
    rows: [
      {
        label: "Parent ASIN 聚合视角",
        value: focusLabel,
        detail: "从当前 Parent ASIN 关联广告中的用户搜索词表现行聚合，不是经营商品、广告组或人工动作对象。",
      },
      {
        label: "当前判断",
        value: decisionCard?.operationDecisionLabel ?? "等待聚合判断",
        detail:
          decisionCard?.operationDecisionReason ??
          "先用花费、点击、订单、ACOS、广告组和投放词证据判断这组广告搜索词是扩量、止损还是观察。",
      },
      {
        label: "优先打开理由",
        value: primarySearchTerm ? `SearchTerm：${primarySearchTerm}` : "等待命中具体 SearchTerm",
        detail: decisionCard?.primarySearchTermReason ?? "需要有广告搜索词表现行和具体 SearchTerm 信号后，才能给出优先复核对象。",
      },
      {
        label: "当前中间诊断",
        value: selectedSearchTerm ? `SearchTerm：${selectedSearchTerm}` : "未选中具体 SearchTerm",
        detail: currentObjectDetail,
      },
      {
        label: "人工下一步",
        value: decisionCard?.nextManualStep ?? "打开具体 SearchTerm 后人工复核广告组、投放词、广告 ASIN 和广告位证据。",
        detail: "页面只支持记录观察、标记已处理、加入复盘或忽略本次；不能自动加词、否词、调价或暂停广告。",
      },
    ],
    executionSteps: [
      {
        label: "1. 锁定入口",
        value: focusLabel,
        detail: "确认仍在当前 Parent ASIN 广告上下文内复核，不切换经营诊断入口。",
      },
      {
        label: "2. 锁定 SearchTerm",
        value: `SearchTerm：${reviewTarget}`,
        detail: matchedPrimarySearchTerm
          ? "当前中间诊断已命中优先复核 SearchTerm。"
          : "先确认当前选中 SearchTerm 是否就是本次要复核的具体搜索词。",
      },
      {
        label: "3. 核对广告承接",
        value: "广告 ASIN / 广告组 / 投放词 / 广告位",
        detail: "按中间诊断链逐层核对承接关系和证据缺口，不能把搜索词自动归因到单个 ASIN。",
      },
      {
        label: "4. 选择人工动作",
        value: decisionCard?.nextManualStep ?? "记录观察或加入复盘前，先等待后端预检确认稳定对象。",
        detail: "右侧只能记录观察、标记已处理、加入复盘或忽略本次；7/14 天后再读指标复盘。",
      },
    ],
    boundary:
      "这块只解释为什么从当前 Parent ASIN 的广告搜索词表现聚合进入具体 SearchTerm；不能证明单个 ASIN 归因，也不会自动执行任何广告动作。",
  };
}

function selectedSignalScopeRelationText(
  selectedScope: ProductScopeFilterOption | null,
  signal: ProductScopedSignalForUi,
  scopeLabel: string,
  signalObject: string,
): string {
  if (signal.signal_category === "data_quality") {
    return `${signalObject} 只解释当前快照、字段或新鲜度，不代表 ${scopeLabel} 已经出现经营异常。`;
  }
  if (signal.object_type === "ad_group") {
    return `${signalObject} 是投放容器，用来定位结构和归因边界；经营入口仍是 ${scopeLabel}。`;
  }
  if (signal.object_type === "search_term") {
    return `${signalObject} 用来解释同广告组 / 投放上下文里的搜索表现；不能自动归因到 ${scopeLabel} 下某个单一 ASIN。`;
  }
  if (signal.object_type === "placement") {
    return `${signalObject} 只说明流量位置表现；需要结合广告 ASIN、广告组和搜索词后再判断 ${scopeLabel}。`;
  }
  if (signal.object_type === "advertised_product") {
    return `${signalObject} 是广告商品诊断点；可下钻广告表现，但人工动作仍要通过稳定对象预检。`;
  }
  if (signal.object_type === "sales_product") {
    return `${signalObject} 是销售商品诊断点；广告动作仍需回到广告 ASIN 或搜索词等可处理对象。`;
  }
  if (selectedScope?.scope_type === "all" || selectedScope?.scope_id === "all") {
    return `${signalObject} 来自全量排查；只作为辅助排查对象，不替代 Parent ASIN / ASIN 经营入口。`;
  }
  return `${signalObject} 是当前入口下的一个诊断对象；先看证据链，再决定是否进入人工确认。`;
}

const queueStatusLabel: Record<SignalForUi["status"], string> = {
  pending: "待确认",
  adopted: "已处理",
  observing: "观察中",
  ignored: "已忽略",
  false_positive: "误报",
};

const queueFreshnessLabel: Record<SignalForUi["freshness_status"], string> = {
  api_snapshot: "API快照",
  sample_data: "样例数据",
  unknown: "未知来源",
  stale: "数据过期",
};

const queueConfidenceLabel: Record<NonNullable<SignalQueueMetaInput["confidence"]>, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function buildSignalQueueMeta(signal: SignalQueueMetaInput): SignalQueueMeta {
  const objectType = signal.object_type ? queueObjectTypeLabel[signal.object_type] : "未归因对象";
  const confidence = signal.confidence ? queueConfidenceLabel[signal.confidence] : "待补";
  const shop = signal.shop_name || signal.shop_id || "未知店铺";
  const marketplace = signal.marketplace || "未知站点";
  const businessProblem = signalQueueKindLabel(signalQueueKind(signal));
  const decisionBoundary = signalDecisionBoundary(signal);
  const actionBoundary = buildSignalTriggerRationale(signal).actionBoundary;
  return {
    primary: [`经营问题 ${businessProblem}`, objectType, `严重 ${signal.severity}`, `置信 ${confidence}`],
    secondary: `${shop} / ${marketplace} / ${queueFreshnessLabel[signal.freshness_status]} / ${queueStatusLabel[signal.status]}`,
    decision: `${decisionBoundary || "按当前对象层级判断，不能跨层级归因"}；${actionBoundary}`,
  };
}

export function buildSignalQueueObjectStatus(
  signal: ProductScopedSignalForUi,
  signals: ProductScopedSignalForUi[],
  reviewTodos: SignalQueueObjectStatusTodo[] = [],
): SignalQueueObjectStatus {
  const stableIds = signalQueueStableObjectIds(signal);
  if (stableIds.size === 0) return { items: [] };

  const signalCount = signals.filter((candidate) => setsIntersect(stableIds, signalQueueStableObjectIds(candidate))).length;
  const reviewTodoCount = reviewTodos.filter((todo) => stableIds.has(normalizeQueueObjectId(todo.object_id))).length;
  const items: string[] = [];
  if (signalCount > 1) items.push(`同对象 ${signalCount} 条信号`);
  if (reviewTodoCount > 0) items.push(`复盘待办 ${reviewTodoCount} 条`);
  return { items };
}

function signalQueueStableObjectIds(signal: ProductScopedSignalForUi): Set<string> {
  const ids = new Set<string>();
  const primaryObject = signal.evidence?.primary_object;
  addQueueObjectId(ids, primaryObject?.asin);
  addQueueObjectId(ids, primaryObject?.label);
  if (signal.object_type === "search_term") addQueueObjectId(ids, primaryObject?.search_term);
  if (signal.object_type === "placement") addQueueObjectId(ids, primaryObject?.placement);

  signal.evidence?.source_rows?.forEach((row) => {
    addQueueObjectId(ids, row.asin);
    if (signal.object_type === "search_term") addQueueObjectId(ids, row.search_term);
    if (signal.object_type === "placement") addQueueObjectId(ids, row.placement);
  });
  return ids;
}

function addQueueObjectId(ids: Set<string>, value: unknown): void {
  const normalized = normalizeQueueObjectId(value);
  if (normalized) ids.add(normalized);
}

function normalizeQueueObjectId(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function setsIntersect(first: Set<string>, second: Set<string>): boolean {
  for (const value of first) {
    if (second.has(value)) return true;
  }
  return false;
}

export function buildSignalLayerOverview(signals: ProductScopedSignalForUi[]): SignalLayerOverview {
  return signals.reduce<SignalLayerOverview>(
    (overview, signal) => {
      const badge = buildSignalQueueScopeBadge(signal);
      if (badge.tone === "product") overview.product += 1;
      if (badge.tone === "unattributed") overview.unattributed += 1;
      if (badge.tone === "data_quality") overview.dataQuality += 1;
      if (badge.tone === "container") overview.container += 1;
      return overview;
    },
    { product: 0, unattributed: 0, dataQuality: 0, container: 0 },
  );
}

export function signalCategoryLabel(signal: SignalForUi): string {
  if (signal.signal_category === "data_quality") return "数据质量";
  if (signal.signal_type === "opportunity") {
    if (signal.signal_category === "search_term_opportunity") return "搜索词机会";
    if (signal.signal_category === "advertised_product_opportunity") return "广告商品机会";
    if (signal.signal_category === "aba_market_opportunity") return "ABA市场机会";
    if (signal.signal_category === "placement_efficiency" || signal.object_type === "placement") return "广告位机会";
    if (signal.signal_category === "ad_group_structure" || signal.object_type === "ad_group") return "广告组结构机会";
    return "市场机会";
  }
  return "异常";
}

export function buildSignalTriageRationale(signal: SignalForUi): SignalTriageRationale {
  const queueKind = signalQueueKind(signal);
  const queueLabel = signalQueueKindLabel(queueKind);
  const categoryLabel = signalCategoryLabel(signal);
  const queueReason =
    queueKind === "data_quality"
      ? `进入数据质量队列：经营问题=数据质量；signal_category=${signal.signal_category}，先解释数据链路、来源或新鲜度问题。`
      : `进入${queueLabel}队列：经营问题=${queueLabel}；原始信号=${categoryLabel}，signal_type=${signal.signal_type}，signal_category=${signal.signal_category}。`;
  const priorityReason =
    signal.severity >= 4
      ? `进入高优先级筛选：severity=${signal.severity}，优先处理影响较大的信号。`
      : `不进入高优先级筛选：severity=${signal.severity}，仍保留在${queueLabel}队列中。`;
  const statusReason =
    signal.status === "observing"
      ? "进入观察中筛选：status=observing，这是人工处理状态，不改变原始信号类型。"
      : `不进入观察中筛选：status=${signal.status}，人工状态只影响处理队列视图。`;
  const reviewBoundary = signal.review_result
    ? `复盘结果只说明处理后效果：review_result=${signal.review_result}；review_result 不参与分诊。`
    : "review_result 不参与分诊；没有复盘结果时，也不会改变信号分诊桶。";

  return {
    queueKind,
    queueLabel,
    queueReason,
    priorityReason,
    statusReason,
    reviewBoundary,
    reviewRuleFeedback: reviewRuleFeedbackText(signal.review_result),
  };
}

function reviewRuleFeedbackText(reviewResult?: string | null) {
  if (!reviewResult) return "暂无复盘结果：保留当前信号解释口径，不调整规则。";
  if (reviewResult === "improved") return "复盘反馈：处理有效；同类信号可保留当前规则提示，但后续广告动作仍需人工确认。";
  if (reviewResult === "no_change") return "复盘反馈：处理后无明显变化；下次同类信号应复核证据来源或建议动作，不自动改规则。";
  if (reviewResult === "worse") return "复盘反馈：处理后效果变差；下次同类信号应复核阈值、证据来源和建议动作，不自动改规则。";
  if (reviewResult === "unclear") return "复盘反馈：复盘证据不足或结果不清；不调整规则，先补复盘样本和指标。";
  return `复盘反馈：review_result=${reviewResult} 暂无明确规则反馈；不自动改规则。`;
}

export function buildSignalTriggerRationale(signal: SignalForUi): SignalTriggerRationale {
  if (signal.signal_category === "data_quality" && signal.id.toLowerCase().includes("aba")) {
    return {
      objectRule: "判断对象：ABA 搜索词快照，是站点级市场数据，不直接归属店铺或商品。",
      triggerRule: "触发条件：ABA 周期结束日距离当前分析周期结束超过 14 天。",
      evidenceRule: "证据来源：ABA导出 + 当前积加API分析周期，核心字段是 ABA 周期、分析周期结束日、过期天数和过期阈值。",
      confidenceBoundary: "置信边界：高置信只表示数据过期事实确定，不代表任何经营机会已经确定。",
      actionBoundary: "处理边界：需要人工重新导入 ABA 文件，导入前相关 ABA 机会只能降置信观察。",
    };
  }

  if (signal.signal_category === "data_quality") {
    return {
      objectRule: "判断对象：数据链路或字段覆盖，不直接代表广告经营对象异常。",
      triggerRule: "触发条件：快照、导入、字段覆盖或语义输入不足，导致后续经营判断缺少必要数据。",
      evidenceRule: "证据来源：快照状态、行数、字段覆盖、导入周期或语义分组覆盖。",
      confidenceBoundary: "置信边界：数据质量高置信只表示数据问题本身明确，不能扩展成经营结论。",
      actionBoundary: "处理边界：先补数据或补语义资料，再判断广告、商品或搜索词问题。",
    };
  }

  if (signal.signal_category === "placement_efficiency") {
    return {
      objectRule: "判断对象：广告位，说明流量位置和预算分配层级，不直接代表单个商品承接。",
      triggerRule: "触发条件：广告位 ACOS 明显偏高或流量位置结构需要人工复核；单周期低 ACOS 不再直接生成预算倾斜机会。",
      evidenceRule: "证据来源：ad_placement_daily_metrics，核心字段是 placement、cost、orders、sales、ACOS、CVR。",
      confidenceBoundary: "置信边界：当前通常是单一积加API强证据源，所以以中置信为主，不能直接当作自动调价依据。",
      actionBoundary: "处理边界：只能建议人工复核广告位加价或流量位置结构，不自动改竞价。",
    };
  }

  if (signal.signal_category === "search_term_performance_split") {
    return {
      objectRule: "判断对象：搜索词表现聚合，不是单条投放行，也不能强行归属到单个商品。",
      triggerRule: "触发条件：同一 normalized_query 出现在多条投放行，且同时存在出单行和无订单消耗行，说明逐行判断可能误判。",
      evidenceRule: "证据来源：ad_search_term_daily_metrics，核心字段是 normalized_query、投放行数、总花费、总订单、无订单花费占比和投放行明细。",
      confidenceBoundary: "置信边界：这是搜索词层面的结构分化，不能直接归因到单个商品。",
      actionBoundary: "处理边界：建议人工按广告活动、广告组和投放对象拆开复核，不自动否词或改词。",
    };
  }

  if (signal.signal_category === "search_term_opportunity") {
    return {
      objectRule: "判断对象：广告搜索词，先看搜索词自身表现，再结合广告活动和广告组上下文。",
      triggerRule: "触发条件：低花费但已经产生订单，且 ACOS 明显较低，适合进入长尾机会观察或小流量验证。",
      evidenceRule: "证据来源：ad_search_term_daily_metrics，核心字段是 search_term、cost、orders、sales、ACOS。",
      confidenceBoundary: "置信边界：单周期样本通常不足以证明稳定放量，只能作为中低置信机会。",
      actionBoundary: "处理边界：建议人工确认语义匹配后观察或小预算测试，不自动新增关键词。",
    };
  }

  if (signal.signal_category === "advertised_product_opportunity") {
    return {
      objectRule: "判断对象：广告商品 ASIN。它是投放商品，不等同于经营商品；Parent ASIN 只作为商品组筛选入口。",
      triggerRule: "触发条件：该类稳定转化机会已暂缓生成；如果出现，说明后端信号准入闸门需要复核。",
      evidenceRule: "证据要求：必须补齐库存、利润、价格、主推策略或搜索词相关性等独立证据，不能只看单周期广告表现。",
      confidenceBoundary: "置信边界：单一积加API快照只能说明表现观察，不能证明可放量机会。",
      actionBoundary: "处理边界：不进入自动加预算或改竞价；未补齐独立证据前不应作为可处理机会。",
    };
  }

  if (signal.signal_category === "advertised_product_efficiency") {
    return {
      objectRule: "判断对象：广告商品 ASIN。它是投放商品，不等同于经营商品；广告组只作为上下文容器。",
      triggerRule: "触发条件：广告商品点击样本充足但订单弱，或 ACOS 明显偏高，说明该 ASIN 当前广告承接偏弱。",
      evidenceRule: "证据来源：advertised_products，核心字段是 ASIN、cost、clicks、orders、sales、ACOS。",
      confidenceBoundary: "置信边界：当前是单一积加API快照，只能定位到广告商品现象，不能直接解释搜索词、广告位或广告组原因。",
      actionBoundary: "处理边界：建议人工下钻库存、价格、Listing、主推策略和搜索词，不自动暂停、调价或否词。",
    };
  }

  if (signal.signal_category === "ad_group_structure") {
    return {
      objectRule: "判断对象：广告组结构。广告组是投放容器，不是商品。",
      triggerRule: "触发条件：同一广告组内多个广告商品花费、订单、ACOS 或 CVR 差异明显；如果头部 ASIN 是主推款，应记录为策略事实而不是异常。",
      evidenceRule: "证据来源：advertised_products、ad_search_term_daily_metrics 和人工主推款策略资料。",
      confidenceBoundary: "置信边界：缺少主推款资料时只能做策略待确认，不能把消耗集中直接判成异常。",
      actionBoundary: "处理边界：建议人工确认主推款和商品表现差异，不自动拆广告组。",
    };
  }

  return {
    objectRule: `判断对象：${signal.object_type ?? "跨对象"}，按当前信号对象层级解释，不跨层级归因。`,
    triggerRule: `触发条件：由 signal_category=${signal.signal_category} 对应规则命中，需结合当前证据和指标阈值复核。`,
    evidenceRule: "证据来源：以当前信号 data_sources 和 evidence.facts 为准，页面不补造额外业务事实。",
    confidenceBoundary: "置信边界：按证据来源数量、新鲜度和异常强度决定，不能把中低置信当作确定结论。",
    actionBoundary: "处理边界：只生成建议和人工处理记录，不自动执行广告动作。",
  };
}

function collectEvidenceSourceTypes(signal: SignalEvidenceSupportInput): string[] {
  const sourceTypes = new Set<string>();

  signal.data_sources?.forEach((source) => {
    const sourceType = source.source_type?.trim();
    if (sourceType) sourceTypes.add(sourceType);
  });

  signal.evidence?.facts?.forEach((fact) => {
    const sourceType = fact.source_type?.trim();
    if (sourceType) sourceTypes.add(sourceType);
  });

  return Array.from(sourceTypes);
}

export function buildSignalEvidenceSupport(signal: SignalEvidenceSupportInput): SignalEvidenceSupport {
  const sourceTypes = collectEvidenceSourceTypes(signal);
  const sourceCount = sourceTypes.length;
  const sourceSummary = sourceCount > 0 ? sourceTypes.join("、") : "来源未标记";
  const evidenceSummary = `当前证据数 ${signal.evidence_count} 条，证据来源 ${sourceSummary}。`;

  let confidenceReason: string;
  if (signal.confidence === "high" && sourceCount >= 2) {
    confidenceReason = `高置信：至少两个独立证据源一致，${evidenceSummary}`;
  } else if (signal.confidence === "high" && signal.signal_category === "data_quality") {
    confidenceReason = `高置信：数据质量规则由快照、导入状态或字段覆盖直接触发，${evidenceSummary}这是数据链路确定性，不等同于经营结论。`;
  } else if (signal.confidence === "high") {
    confidenceReason = `高置信：当前规则认为异常强度明确，${evidenceSummary}`;
  } else if (signal.confidence === "medium") {
    confidenceReason = `中置信：一个强证据源加指标明显异常，${evidenceSummary}`;
  } else {
    confidenceReason = `低置信：过期或单一数据源不足以支撑强结论，${evidenceSummary}`;
  }

  let severityReason: string;
  if (signal.severity >= 4) {
    severityReason = `高严重度：影响花费、订单、ACOS、核心产品或高热搜索词，severity=${signal.severity}。`;
  } else if (signal.severity === 3) {
    severityReason = `中严重度：影响局部广告组、部分搜索词或数据判断链路，severity=${signal.severity}。`;
  } else {
    severityReason = `低严重度：当前更接近观察或数据不足提示，severity=${signal.severity}。`;
  }

  let supportWarning: string | null = null;
  if (signal.evidence_count <= 0) {
    supportWarning = "当前没有可用证据，不能把该信号当作可执行判断。";
  } else if (signal.confidence === "high" && sourceCount < 2 && signal.signal_category !== "data_quality") {
    supportWarning = `高置信但当前只有 ${sourceCount} 个证据来源，需要补充独立来源或降级复核。`;
  } else if (signal.freshness_status === "stale") {
    supportWarning = "数据过期，相关经营判断需要降置信复核。";
  }

  return {
    sourceSummary,
    confidenceReason,
    severityReason,
    supportWarning,
  };
}

export function signalDecisionBoundary(signal: SignalForUi): string | null {
  if (signal.signal_category === "data_quality") {
    if (signal.freshness_status === "stale") return "数据已过期，相关结论需要降置信复核";
    return "先补数据，再判断经营问题";
  }

  if (signal.object_type === "ad_group") {
    return "广告组是投放容器，只能先复核结构和同组广告商品，不能直接归因为单个商品。";
  }

  if (signal.object_type === "search_term") {
    return "搜索词只能作为投放判断对象，需要结合广告活动、广告组和转化证据，不能直接当作商品结论。";
  }

  if (signal.object_type === "placement") {
    return "广告位只说明流量位置和预算效率，需要结合广告组和商品承接证据人工判断。";
  }

  if (signal.object_type === "advertised_product") {
    return "广告商品可以承接广告指标，但销售承接仍要结合销售商品和同组上下文复核。";
  }

  if (signal.object_type === "sales_product") {
    return "销售商品可以说明经营表现，但广告动作必须回到广告 ASIN、广告组、投放词和搜索词复核。";
  }

  if (signal.signal_type === "opportunity") {
    return "机会信号只能进入人工观察或小流量验证，不自动执行广告动作。";
  }

  return "该信号只能作为人工复核线索，不能绕过证据链直接执行广告动作。";
}

export function signalImpactScope(signal: SignalForUi): string {
  const signalText = `${signal.id} ${signal.signal_category} ${signal.object_type ?? ""}`.toLowerCase();

  if (signal.signal_category === "data_quality") {
    if (signal.freshness_status === "stale" && signalText.includes("aba")) {
      return "影响 ABA 机会判断可信度，不代表广告经营表现本身异常。";
    }

    if (signal.freshness_status === "stale") {
      return "影响数据判断能力，过期数据会降低相关结论可信度。";
    }

    return "影响数据判断能力，需要先补齐数据再判断经营问题。";
  }

  if (signal.object_type === "ad_group" || signalText.includes("ad_group")) {
    return "影响广告组结构判断；广告组是投放容器，不能直接归因为单个商品。";
  }

  if (signal.object_type === "search_term" || signalText.includes("search_term")) {
    return "影响搜索词层面的投放判断，需要结合广告活动和广告组上下文处理。";
  }

  if (signal.object_type === "placement" || signalText.includes("placement")) {
    return "影响广告位预算和流量分配判断，不直接代表商品承接问题。";
  }

  if (signal.signal_type === "opportunity") {
    return "影响机会优先级判断，适合进入人工观察或小流量验证。";
  }

  return "影响局部经营判断，需结合证据和不确定性人工处理。";
}

function pushContextItem(items: SignalObjectContextItem[], label: string, value?: string | null) {
  const text = value?.trim();
  if (!text) return;
  if (items.some((item) => item.label === label && item.value === text)) return;
  items.push({ label, value: text });
}

function buildSignalObjectReviewPath(signal: SignalForUi, primaryObject?: PrimaryObjectForUi | null): SignalObjectReviewPath | null {
  const objectType = signal.object_type ?? primaryObject?.object_type;

  if (objectType === "advertised_product") {
    return {
      label: "复核路径",
      value:
        "Parent ASIN 销售盘 -> 当前广告 ASIN -> 广告组容器 -> 同组投放商品表现 -> 投放词 / 搜索词上下文 -> 广告位边界 -> 人工确认 -> 7/14 天复盘",
      detail: "广告 ASIN 是投放商品，不等同于经营商品；搜索词和广告位只能作为同广告组上下文，不能自动归因到该 ASIN。",
    };
  }

  if (objectType === "ad_group") {
    return {
      label: "复核路径",
      value:
        "Parent ASIN 销售盘 -> 广告 ASIN 覆盖 -> 当前广告组容器 -> 同组投放商品表现 -> 投放词 / 搜索词 / 广告位证据 -> 主推款策略边界 -> 人工确认 -> 7/14 天复盘",
      detail: "广告组是投放容器，不是商品；先核对同组广告商品表现和主推款策略，再判断是否只是结构待确认，不能自动拆广告组。",
    };
  }

  if (objectType === "placement") {
    return {
      label: "复核路径",
      value:
        "当前经营入口 -> 广告活动 / 广告组 -> 广告位表现 -> 广告 ASIN 和搜索词承接核对 -> 证据缺口 -> 人工确认 -> 7/14 天复盘",
      detail: "广告位只说明流量位置或广告活动上下文；缺广告组或广告 ASIN 证据时不能下 ASIN 或 Parent ASIN 归因结论。",
    };
  }

  return null;
}

export function buildSignalObjectContext(signal: SignalForUi, primaryObject: PrimaryObjectForUi): SignalObjectContext {
  const objectType = signal.object_type ?? primaryObject.object_type;
  const items: SignalObjectContextItem[] = [];
  const reviewPath = buildSignalObjectReviewPath(signal, primaryObject);

  pushContextItem(items, "广告活动", primaryObject.campaign_name);
  pushContextItem(items, "广告组", primaryObject.ad_group_name);

  if (objectType === "ad_group") {
    pushContextItem(items, "广告组", primaryObject.label);
    return {
      boundary: "广告组是投放容器，不能直接归因为单个商品；商品判断必须继续看广告商品或销售商品证据。",
      items,
      reviewPath,
    };
  }

  if (objectType === "search_term") {
    pushContextItem(items, "搜索词", primaryObject.search_term ?? primaryObject.label);
    return {
      boundary: "搜索词表现通常落在广告活动和广告组上下文，不能强行归属到单个商品。",
      items,
      reviewPath,
    };
  }

  if (objectType === "placement") {
    pushContextItem(items, "广告位", primaryObject.placement ?? primaryObject.label);
    return {
      boundary: "广告位说明流量位置和预算分配层级，不直接代表单个商品承接。",
      items,
      reviewPath,
    };
  }

  if (objectType === "advertised_product") {
    pushContextItem(items, "ASIN", primaryObject.asin);
    pushContextItem(items, "SKU", primaryObject.sku);
    pushContextItem(items, "MSKU", primaryObject.msku);
    pushContextItem(items, "广告商品", primaryObject.label);
    return {
      boundary: "广告商品代表投放商品，不等同于经营商品；销售承接需要销售商品证据。",
      items,
      reviewPath,
    };
  }

  if (objectType === "sales_product") {
    pushContextItem(items, "ASIN", primaryObject.asin);
    pushContextItem(items, "SKU", primaryObject.sku);
    pushContextItem(items, "MSKU", primaryObject.msku);
    pushContextItem(items, "销售商品", primaryObject.label);
    return {
      boundary: "销售商品代表经营表现，广告承接需要匹配广告商品证据。",
      items,
      reviewPath,
    };
  }

  if (objectType === "search_intent") {
    pushContextItem(items, "Parent ASIN 广告搜索词表现复核", primaryObject.intent_label ?? primaryObject.label);
    return {
      boundary: "Parent ASIN 广告搜索词表现复核用于聚合同类广告搜索词表现，搜索词表现分组不等同于关键词本身，也不是广告处理对象。",
      items,
      reviewPath,
    };
  }

  pushContextItem(items, "判断对象", primaryObject.label);
  return {
    boundary: "跨对象信号用于说明数据链路或组合判断，不直接归因到单个商品或广告组。",
    items,
    reviewPath,
  };
}

export function buildSignalOverview(signals: SignalForUi[]): SignalOverview {
  return {
    high: signals.filter((signal) => signal.severity >= 4).length,
    anomaly: signals.filter((signal) => signal.signal_type === "anomaly" && signal.signal_category !== "data_quality").length,
    opportunity: signals.filter((signal) => signal.signal_type === "opportunity").length,
    dataQuality: signals.filter((signal) => signal.signal_category === "data_quality").length,
    stale: signals.filter((signal) => signal.freshness_status === "stale").length,
    pending: signals.filter((signal) => signal.status === "pending").length,
  };
}

function evidenceSourceType(fact: EvidenceForUi): string {
  const sourceType = fact.source_type?.trim();
  return sourceType || unknownEvidenceSource;
}

export function buildEvidenceSourceOptions<T extends EvidenceForUi>(facts: T[]): EvidenceSourceOption[] {
  const counts = new Map<string, number>();

  facts.forEach((fact) => {
    const sourceType = evidenceSourceType(fact);
    counts.set(sourceType, (counts.get(sourceType) ?? 0) + 1);
  });

  return [
    { sourceType: "all", label: "全部", count: facts.length },
    ...Array.from(counts, ([sourceType, count]) => ({ sourceType, label: sourceType, count })),
  ];
}

export function buildEvidenceRouteNodes<T extends EvidenceForUi>(facts: T[]): EvidenceRouteNode[] {
  const counts = new Map<string, number>();

  facts.forEach((fact) => {
    const sourceType = evidenceSourceType(fact);
    counts.set(sourceType, (counts.get(sourceType) ?? 0) + 1);
  });

  return Array.from(
    counts,
    ([sourceType, count]): EvidenceRouteNode => ({
      sourceType,
      label: sourceType,
      count,
      status: sourceType === unknownEvidenceSource ? "待复核" : "已接入",
    }),
  ).sort((left, right) => {
    const leftIndex = preferredEvidenceSourceOrder.indexOf(left.sourceType);
    const rightIndex = preferredEvidenceSourceOrder.indexOf(right.sourceType);
    const normalizedLeft = leftIndex === -1 ? preferredEvidenceSourceOrder.length : leftIndex;
    const normalizedRight = rightIndex === -1 ? preferredEvidenceSourceOrder.length : rightIndex;
    return normalizedLeft - normalizedRight || left.sourceType.localeCompare(right.sourceType);
  });
}

export function filterEvidenceBySource<T extends EvidenceForUi>(facts: T[], selectedSource: string): T[] {
  if (selectedSource === "all") return facts;
  return facts.filter((fact) => evidenceSourceType(fact) === selectedSource);
}

function sourceText(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value.trim() : "";
}

function sourceNumber(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  const numberValue = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function sourceBoolean(row: Record<string, unknown>, key: string): boolean | null {
  const value = row[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}

function roundRate(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function buildAdProductComparisonRows(
  objectType: SignalForUi["object_type"],
  signalCategory: string,
  sourceRows: Record<string, unknown>[],
): AdProductComparisonRow[] {
  if (objectType !== "ad_group" || signalCategory !== "ad_group_structure") return [];

  return sourceRows
    .map((row) => {
      const spend = sourceNumber(row, "cost") || sourceNumber(row, "spend");
      const clicks = sourceNumber(row, "clicks");
      const orders = sourceNumber(row, "orders");
      const sales = sourceNumber(row, "sales");
      const asin = sourceText(row, "asin");
      const productName = sourceText(row, "product_name");

      return {
        product: asin || productName || "广告商品",
        asin,
        msku: sourceText(row, "msku") || sourceText(row, "sku"),
        spend,
        clicks,
        orders,
        sales,
        acos: sales > 0 ? roundRate(spend / sales) : null,
        cvr: clicks > 0 ? roundRate(orders / clicks) : null,
        sourceRecordId: sourceText(row, "row_id") || sourceText(row, "source_record_id"),
      };
    })
    .filter((row) => row.spend > 0 || row.orders > 0 || row.sales > 0)
    .sort((left, right) => right.spend - left.spend || right.orders - left.orders || left.product.localeCompare(right.product));
}

const keyEvidencePriorityRules = [
  ["投放行表现明细"],
  ["广告商品清单"],
  ["商品表现差异"],
  ["归因边界"],
  ["过期天数", "未分组占比", "无订单花费占比"],
  ["ABA 周期", "分析周期结束", "广告商品数", "强销售商品数", "花费占比"],
  ["花费", "订单", "点击", "ACOS", "CVR", "ROAS", "搜索词"],
];

function keyEvidencePriorityRulesForSignal(signal?: KeyEvidenceSignalContext): string[][] {
  if (!signal) return keyEvidencePriorityRules;

  if (signal.signal_category === "placement_efficiency") {
    return [["广告位"], ["ACOS"], ["订单"], ["转化率"], ["花费"], ...keyEvidencePriorityRules];
  }

  if (signal.signal_category === "search_term_opportunity") {
    return [
      ["搜索词表现分组", "搜索意图分组", "Parent ASIN 广告搜索词表现复核", "Parent ASIN 搜索词表现聚合", "广告搜索词聚合上下文", "语义组"],
      ["投放上下文数"],
      ["搜索词"],
      ["合计订单", "订单"],
      ["合计ACOS", "ACOS"],
      ["花费"],
      ["转化率"],
      ...keyEvidencePriorityRules,
    ];
  }

  if (signal.signal_category === "advertised_product_opportunity") {
    return [
      ["广告 ASIN"],
      ["同广告组搜索词上下文", "同广告组广告位上下文"],
      ["上下文边界"],
      ["订单"],
      ["ACOS"],
      ["CVR"],
      ["点击"],
      ["花费"],
      ...keyEvidencePriorityRules,
    ];
  }

  if (signal.signal_category === "advertised_product_efficiency") {
    return [
      ["广告 ASIN"],
      ["触发原因"],
      ["上下文边界"],
      ["同广告组搜索词上下文", "同广告组广告位上下文"],
      ["订单"],
      ["ACOS"],
      ["点击"],
      ["花费"],
      ...keyEvidencePriorityRules,
    ];
  }

  if (signal.signal_category === "search_term_performance_split") {
    return [["投放行表现明细"], ["无订单花费占比"], ["搜索词"], ["投放行数"], ["总花费"], ["总订单"], ...keyEvidencePriorityRules];
  }

  if (signal.signal_category === "data_quality" && signal.id.includes("product-ad-coverage")) {
    return [["销售商品指标行"], ["强销售商品"], ["广告商品行"], ["商品关联命中"], ...keyEvidencePriorityRules];
  }

  if (signal.signal_category === "data_quality" && signal.id.includes("search-intent")) {
    return [["未分组占比"], ["搜索词行数"], ["唯一搜索词"], ["未分组行数"], ...keyEvidencePriorityRules];
  }

  if (signal.signal_category === "data_quality" && signal.id.toLowerCase().includes("aba")) {
    return [["过期天数"], ["ABA 周期"], ["分析周期结束"], ["过期阈值"], ["ABA 行数"], ...keyEvidencePriorityRules];
  }

  return keyEvidencePriorityRules;
}

function keyEvidencePriority(fact: EvidenceForUi, rules: string[][]): number {
  const labelPriorityIndex = rules.findIndex((keywords) => keywords.some((keyword) => fact.label.includes(keyword)));
  if (labelPriorityIndex !== -1) return labelPriorityIndex;

  const text = `${fact.label} ${fact.value}`;
  const priorityIndex = rules.findIndex((keywords) => keywords.some((keyword) => text.includes(keyword)));
  return priorityIndex === -1 ? rules.length : priorityIndex;
}

export function buildKeyEvidenceFacts<T extends EvidenceForUi>(facts: T[], maxCount = 3, signal?: KeyEvidenceSignalContext): T[] {
  const rules = keyEvidencePriorityRulesForSignal(signal);
  return facts
    .map((fact, index) => ({ fact, index, priority: keyEvidencePriority(fact, rules) }))
    .sort((left, right) => left.priority - right.priority || left.index - right.index)
    .slice(0, maxCount)
    .map((item) => item.fact);
}
