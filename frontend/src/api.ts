import {
  marketScopedPath,
  manualActionPreflightPath,
  reviewEvidenceRepairPath,
  type SignalReviewRecordLookup,
  reviewTodosPath,
  signalManualActionsPath,
  signalReviewEffectPath,
  signalReviewRecordsPath,
  searchIntentsPath,
  signalTriagePath,
  signalReviewTodosPath,
} from "./apiPaths";

export type SignalType = "anomaly" | "opportunity";
export type ObjectType =
  | "ad_group"
  | "sales_product"
  | "advertised_product"
  | "search_term"
  | "placement"
  | "search_intent"
  | "cross";

export interface MetricSnapshot {
  impressions: number;
  clicks: number;
  cost: number;
  orders: number;
  sales: number;
  acos: number | null;
  cvr: number | null;
  cpc: number | null;
}

export interface AdObjectRef {
  object_type: ObjectType;
  object_id: string;
  label: string;
  campaign_name?: string | null;
  ad_group_name?: string | null;
  asin?: string | null;
  sku?: string | null;
  msku?: string | null;
  placement?: string | null;
  search_term?: string | null;
  intent_label?: string | null;
}

export interface EvidenceItem {
  label: string;
  value: string;
  note?: string | null;
  source_type?: string | null;
  source_name?: string | null;
  metric_name?: string | null;
  metric_value?: string | null;
  comparison_value?: string | null;
  time_range?: string | null;
  object_type?: string | null;
  object_id?: string | null;
  explanation?: string | null;
}

export interface EvidencePackage {
  period_days: number;
  primary_object: AdObjectRef;
  metrics: MetricSnapshot;
  comparison: EvidenceItem[];
  facts: EvidenceItem[];
  source_rows: Record<string, unknown>[];
}

export interface SuggestedAction {
  action_type: string;
  title: string;
  description: string;
  requires_manual_confirmation: boolean;
}

export interface DataSourceRef {
  source_type: string;
  source_name: string;
  snapshot_id?: string | null;
  api_name?: string | null;
  source_table?: string | null;
  source_record_id?: string | null;
  source_file?: string | null;
  market_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface AiSignal {
  id: string;
  signal_type: SignalType;
  signal_category: string;
  priority: "P0" | "P1" | "P2";
  confidence: "high" | "medium" | "low";
  shop_id: string;
  shop_name?: string | null;
  market_id?: number | null;
  marketplace?: string | null;
  country?: string | null;
  object_type: ObjectType;
  severity: number;
  summary: string;
  why: string;
  evidence: EvidencePackage;
  evidence_count: number;
  data_sources: DataSourceRef[];
  freshness_status: "api_snapshot" | "sample_data" | "unknown" | "stale";
  detected_at: string;
  uncertainty: string;
  suggested_action: SuggestedAction;
  risk: string;
  status: "pending" | "adopted" | "observing" | "ignored" | "false_positive";
  manual_status: "pending" | "adopted" | "observing" | "ignored" | "false_positive";
  review_result?: string | null;
  tags: string[];
}

export interface SearchIntentSummary {
  intent_label: string;
  search_terms: string[];
  metrics: MetricSnapshot;
  insight: string;
  semantic_source: string;
  aba_match_count: number;
  top_search_terms: SearchIntentTopTerm[];
  data_grain?: string;
  business_question?: string;
  current_judgement?: string;
  metric_purpose?: string;
  ad_context?: string;
  evidence_gap?: string;
  proves?: string;
  does_not_prove?: string;
  next_manual_step?: string;
}

export interface SearchIntentTopTerm {
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

export interface MarketOption {
  market_id: number;
  shop_name: string;
  marketplace_code: string;
  country?: string | null;
  source: string;
  has_snapshot: boolean;
  snapshot_id?: string | null;
}

export interface ProductScopeOption {
  scope_id: string;
  scope_type: string;
  label: string;
  asin?: string | null;
  parent_asin?: string | null;
  child_asins?: string[];
  source: string;
  spend: number;
  orders: number;
  sales: number;
  sales_orders?: number;
  sales_amount?: number;
  ad_spend?: number;
  ad_orders?: number;
  ad_sales?: number;
  metric_boundary?: string | null;
  strategy_notes?: string[];
}

export interface ProductScopeCoverage {
  sales_asin_count: number;
  advertised_asin_count: number;
  parent_asin_count: number;
  matched_asin_count: number;
  search_term_unattributed_count: number;
  placement_unattributed_count: number;
  boundary: string;
}

export interface ProductScopeSummary {
  has_snapshot: boolean;
  snapshot_id?: string | null;
  market_id?: number | null;
  shop_name?: string | null;
  marketplace_code?: string | null;
  options: ProductScopeOption[];
  coverage: ProductScopeCoverage;
}

export interface SnapshotStatus {
  has_snapshot: boolean;
  snapshot_id: string | null;
  source: string | null;
  market_id: number | null;
  shop_name: string | null;
  marketplace_code: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  status: string;
  row_counts: Record<string, number>;
  api_list: string[];
  error_message: string | null;
}

export interface NormalizedTableInspection {
  name: string;
  exists: boolean;
  manifest_row_count: number | null;
  actual_row_count: number;
  matches_manifest: boolean;
  path: string | null;
}

export interface SnapshotInspectionResult {
  status: string;
  has_snapshot: boolean;
  ready_for_signals: boolean;
  snapshot_id: string | null;
  source: string | null;
  market_id: number | null;
  shop_name: string | null;
  marketplace_code: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  snapshot_status: string | null;
  signal_row_count: number;
  row_counts: Record<string, number>;
  api_list: string[];
  normalized_tables: NormalizedTableInspection[];
  issues: string[];
}

export interface SnapshotReadiness {
  ready: boolean;
  can_request_api: boolean;
  missing: string[];
  next_action?: string | null;
  market_id: number | null;
  base_url_configured: boolean;
  auth_mode: string;
  has_snapshot: boolean;
  snapshot_status: string;
  snapshot_id: string | null;
  shop_name: string | null;
  marketplace_code: string | null;
  reason: string;
}

export interface SnapshotCreateRequest {
  market_id?: number | null;
  days?: number;
  count?: number;
  max_pages?: number;
  force?: boolean;
}

export interface SnapshotProbeResult {
  status: string;
  can_request_api: boolean;
  missing: string[];
  next_action?: string | null;
  api_name: string;
  market_id: number | null;
  row_count: number;
  market: Record<string, unknown> | null;
  message: string;
}

export interface SnapshotCreateResult {
  status: string;
  can_request_api: boolean;
  missing: string[];
  next_action?: string | null;
  snapshot_dir: string | null;
  snapshot_id: string | null;
  market_id: number | null;
  shop_name: string | null;
  marketplace_code: string | null;
  start_date: string | null;
  end_date: string | null;
  row_counts: Record<string, number>;
  inspection: SnapshotInspectionResult | null;
  message: string;
}

export interface SnapshotSignalScanResult {
  ready_for_signals: boolean;
  inspection: SnapshotInspectionResult;
  signal_row_count: number;
  aba_row_count: number;
  signal_count: number;
  summary?: SignalScanSummary | null;
  signals: AiSignal[];
}

export interface SignalScanSummaryTable {
  name: string;
  row_count: number;
  role: string;
}

export interface SignalScanSummaryCategory {
  signal_category: string;
  label: string;
  count: number;
}

export interface SignalScanSummary {
  summary_text: string;
  scanned_tables: SignalScanSummaryTable[];
  hit_signal_categories: SignalScanSummaryCategory[];
  suppressed_reasons: string[];
  attribution_boundaries: string[];
  next_focus: string;
}

export interface SignalTriageCandidateSummary {
  signal_id: string;
  signal_type?: string | null;
  signal_category?: string | null;
  priority?: "P0" | "P1" | "P2" | string | null;
  confidence?: "high" | "medium" | "low" | string | null;
  severity: number;
  shop_id?: string | null;
  shop_name?: string | null;
  market_id?: number | null;
  marketplace?: string | null;
  object_type?: string | null;
  object_id?: string | null;
  stable_object_id?: string | null;
  object_label?: string | null;
  summary?: string | null;
  evidence_count: number;
  freshness_status?: string | null;
  problem_type?: string | null;
  evidence_strength?: string | null;
  attribution_boundary?: string | null;
  review_path?: string | null;
}

export interface SignalTriageCandidateLayer {
  layer_id: string;
  label: string;
  reason?: string | null;
  count: number;
  top_candidates: (SignalTriageCandidateSummary | null)[];
}

export interface SignalTriageRecommendedEvidenceDrilldown {
  object_label?: string | null;
  object_type?: string | null;
  direct_ad_product_row_count: number;
  search_term_context_count: number;
  placement_context_count: number;
  campaigns: string[];
  ad_groups: string[];
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
    top_terms?: SignalTriageSearchTermMetric[];
    high_spend_terms?: SignalTriageSearchTermMetric[];
    effective_terms?: SignalTriageSearchTermMetric[];
    zero_order_spend_terms?: SignalTriageSearchTermMetric[];
    aba_matched_terms?: SignalTriageSearchTermMetric[];
  } | null;
  ad_product_rows: {
    campaign_name?: string | null;
    ad_group_name?: string | null;
    asin?: string | null;
    spend?: number | null;
    clicks?: number | null;
    orders?: number | null;
    sales?: number | null;
    acos?: number | null;
    cvr?: number | null;
  }[];
  boundary?: string | null;
  summary?: string | null;
}

export interface SignalTriageDiagnosisContract {
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
}

export interface SignalTriageProductScopeSearchTerm {
  search_term?: string | null;
  normalized_query?: string | null;
  targeting_text?: string | null;
  term_type?: string | null;
  spend?: number | null;
  clicks?: number | null;
  orders?: number | null;
  sales?: number | null;
}

export interface SignalTriageProductScopeSearchTermDiagnosis {
  term_summary?: string | null;
  effective_terms?: SignalTriageProductScopeSearchTerm[] | null;
  zero_order_terms?: SignalTriageProductScopeSearchTerm[] | null;
  term_boundary?: string | null;
  next_review_focus?: string | null;
  forbidden_actions?: string[] | null;
}

export interface SignalTriageProductScopeTargetingItem {
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

export interface SignalTriageProductScopeTargetingContext {
  basis?: string | null;
  context_ad_group_label?: string | null;
  targeting_count?: number | null;
  report_row_count?: number | null;
  keyword_targeting_count?: number | null;
  auto_targeting_count?: number | null;
  top_targetings?: SignalTriageProductScopeTargetingItem[] | null;
  effective_targetings?: SignalTriageProductScopeTargetingItem[] | null;
  zero_order_spend_targetings?: SignalTriageProductScopeTargetingItem[] | null;
  diagnosis_summary?: string | null;
  next_review_focus?: string | null;
  boundary?: string | null;
}

export interface SignalTriageProductScopeTopAdGroup {
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
  effective_search_terms?: SignalTriageProductScopeSearchTerm[] | null;
  zero_order_search_terms?: SignalTriageProductScopeSearchTerm[] | null;
  placement_context_level?: string | null;
  targeting_context?: SignalTriageProductScopeTargetingContext | null;
}

export interface SignalTriageProductScopeDrilldownItem {
  asin?: string | null;
  spend?: number | null;
  clicks?: number | null;
  orders?: number | null;
  sales?: number | null;
  acos?: number | null;
  cvr?: number | null;
  ad_product_row_count?: number | null;
  top_ad_group?: SignalTriageProductScopeTopAdGroup | null;
  next_review_focus?: string | null;
}

export interface SignalTriageProductScopeCandidateGapCheck {
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  result?: string | null;
  anomaly_check?: string | null;
  opportunity_check?: string | null;
  diagnosis_context?: string | null;
  next_review_focus?: string | null;
}

export interface SignalTriageProductScopeCandidateGapAnalysis {
  status?: string | null;
  summary?: string | null;
  checks?: SignalTriageProductScopeCandidateGapCheck[] | null;
  boundary?: string | null;
}

export interface SignalTriageProductScopeAdGroupDiagnosis {
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
  search_term_diagnosis?: SignalTriageProductScopeSearchTermDiagnosis | null;
}

export interface SignalTriageProductScopeDrilldown {
  scope_id?: string | null;
  scope_type?: string | null;
  status?: string | null;
  advertised_asin_count?: number | null;
  items?: SignalTriageProductScopeDrilldownItem[] | null;
  ad_group_diagnosis?: SignalTriageProductScopeAdGroupDiagnosis[] | null;
  candidate_gap_analysis?: SignalTriageProductScopeCandidateGapAnalysis | null;
  summary?: string | null;
  boundary?: string | null;
}

export interface SignalTriageSearchTermMetric {
  normalized_query?: string | null;
  spend?: number | null;
  clicks?: number | null;
  orders?: number | null;
  sales?: number | null;
  aba_rank?: number | null;
  aba_period?: string | null;
}

export interface SignalTriageManualActionPreview {
  will_write: false;
  signal_id?: string | null;
  action_type: "add_to_review" | string;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  shop_id?: string | null;
  shop_name?: string | null;
  market_id?: number | null;
  review_windows: ReviewWindow[];
  preflight_checklist?: {
    check_id?: string | null;
    label: string;
    evidence: string;
    required?: boolean | null;
  }[];
  note?: string | null;
}

export interface SignalTriageRecommendedManualStatus {
  will_write: false;
  signal_id?: string | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  shop_id?: string | null;
  shop_name?: string | null;
  market_id?: number | null;
  has_manual_action: boolean;
  manual_action_count: number;
  has_review_todo: boolean;
  review_todo_count: number;
  ready_review_count: number;
  review_windows: ReviewWindow[];
  next_action: string;
}

export interface SignalTriageSummary {
  status: string;
  selected_market_id?: number | null;
  selected_product_scope_id?: string | null;
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
    is_actionable?: boolean;
    selected_product_scope_id?: string | null;
    candidate_pool_count?: number | null;
    message?: string | null;
  } | null;
  snapshot: Record<string, unknown>;
  signal_status: {
    signal_row_count: number;
    signal_count: number;
    candidate_count: number;
    excluded_count: number;
    excluded_summary: Record<string, number>;
  };
  candidate_mix: Record<string, Record<string, number>>;
  candidate_layers: SignalTriageCandidateLayer[];
  recommended_candidate?: SignalTriageCandidateSummary | null;
  recommended_evidence_drilldown?: SignalTriageRecommendedEvidenceDrilldown | null;
  recommended_diagnosis_contract?: SignalTriageDiagnosisContract | null;
  diagnosis_contract?: SignalTriageDiagnosisContract | null;
  product_scope_drilldown?: SignalTriageProductScopeDrilldown | null;
  recommendation_reason?: string | null;
  manual_action_preview?: SignalTriageManualActionPreview | null;
  recommended_manual_status?: SignalTriageRecommendedManualStatus | null;
  next_unhandled_candidate?: (SignalTriageCandidateSummary & {
    manual_action_preview?: SignalTriageManualActionPreview | null;
  }) | null;
  next_unhandled_evidence_drilldown?: SignalTriageRecommendedEvidenceDrilldown | null;
  next_unhandled_diagnosis_contract?: SignalTriageDiagnosisContract | null;
  top_candidates: (SignalTriageCandidateSummary | null)[];
  review_status: {
    status?: string | null;
    manual_action_count: number;
    review_record_count: number;
    ready_count: number;
    not_ready_count: number;
    manual_action_identity_issue_count: number;
    review_feedback?: {
      total?: number;
      by_result?: Record<string, number>;
      by_signal_type?: Record<string, number>;
      sample_sort?: {
        order?: string[];
        reason?: string | null;
      };
      action_boundaries?: Record<
        string,
        {
          result?: string | null;
          allowed_reviews?: string[];
          forbidden_actions?: string[];
          boundary?: string | null;
        }
      >;
      closure_checklist?: {
        check_id?: string | null;
        label?: string | null;
        status?: string | null;
        evidence?: string | null;
      }[];
      records?: {
        signal_id?: string | null;
        signal_type?: string | null;
        result?: string | null;
        object_type?: string | null;
        object_id?: string | null;
        object_label?: string | null;
        review_window?: string | null;
        review_note?: string | null;
        sort_reason?: string | null;
        evidence_snapshot_count?: number | null;
        evidence_snapshot?: ManualActionEvidenceSnapshot[];
        diagnosis_snapshot?: ManualActionEvidenceSnapshot | null;
        ai_admission_snapshot?: ManualActionEvidenceSnapshot | null;
        action_boundary?: {
          result?: string | null;
          allowed_reviews?: string[];
          forbidden_actions?: string[];
          boundary?: string | null;
        } | null;
        evidence_drilldown?: {
          summary?: string | null;
          boundary?: string | null;
        } | null;
        diagnosis_path?: {
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
        } | null;
        evidence_groups?: {
          group_id?: string | null;
          label?: string | null;
          value?: string | null;
        }[];
      }[];
      candidate_groups?: {
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
        action_boundary?: {
          result?: string | null;
          allowed_reviews?: string[];
          forbidden_actions?: string[];
          boundary?: string | null;
        } | null;
        boundary?: string | null;
      }[];
      pending_source_candidates?: {
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
      }[];
      summary?: string | null;
      rule_feedback?: string | null;
    };
    review_wait_summary?: {
      status?: string | null;
      ready_count?: number | null;
      not_ready_count?: number | null;
      earliest_due_at?: string | null;
      earliest_due_date?: string | null;
      review_windows?: string[];
      next_review_window?: string | null;
      next_object_type?: string | null;
      next_object_id?: string | null;
      next_object_label?: string | null;
      gap_reasons?: string[];
      message?: string | null;
      next_step?: string | null;
      forbidden_actions?: string[];
    };
    review_identity_audit?: {
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
      unstable_object_id_count?: number | null;
      ready_review_count?: number | null;
      can_save_review_records_now?: boolean | null;
      earliest_due_date?: string | null;
      earliest_any_due_date?: string | null;
      earliest_metric_due_date?: string | null;
      date_boundary?: string | null;
      issues?: {
        issue_type?: string | null;
        signal_id?: string | null;
        action_id?: string | null;
        object_type?: string | null;
        object_id?: string | null;
        review_window?: string | null;
        note?: string | null;
      }[] | null;
      readback_keys?: {
        signal_id?: string | null;
        action_id?: string | null;
        object_type?: string | null;
        object_id?: string | null;
        object_label?: string | null;
        review_window?: string | null;
        status?: string | null;
        is_due?: boolean | null;
        due_at?: string | null;
        evidence_snapshot_count?: number | null;
        has_diagnosis_path?: boolean | null;
        has_ai_admission?: boolean | null;
      }[] | null;
    };
    rule_improvement?: {
      status?: string | null;
      title?: string | null;
      reason?: string | null;
      next_step?: string | null;
      can_auto_change_rules?: boolean;
      can_auto_execute_ads?: boolean;
    };
    next_action?: string | null;
  };
  blockers: { code: string; message: string }[];
  next_action: string;
}

export interface ReviewEvidenceRepairItem {
  action_id?: string | null;
  signal_id?: string | null;
  action_type?: string | null;
  shop_id?: string | null;
  market_id?: number | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  review_windows?: string[] | null;
  issue_types?: string[] | null;
  todo_count?: number | null;
  current_preflight?: {
    status?: string | null;
    target_matches_legacy?: boolean | null;
    target?: Record<string, unknown> | null;
    blockers?: { code?: string | null; message?: string | null }[] | null;
    evidence_snapshot_status?: string | null;
    evidence_snapshot_item_count?: number | null;
    has_diagnosis_path?: boolean | null;
    has_ai_admission?: boolean | null;
    has_search_term_boundary?: boolean | null;
    has_placement_boundary?: boolean | null;
    has_parent_asin_scope?: boolean | null;
    has_ad_asin_coverage?: boolean | null;
    has_targeting_evidence?: boolean | null;
    has_ad_group_synthesis?: boolean | null;
    has_ad_group_product_performance?: boolean | null;
    has_aba_context?: boolean | null;
    has_evidence_gap?: boolean | null;
    has_action_boundary?: boolean | null;
    has_object_reference?: boolean | null;
    missing_required_labels?: string[] | null;
  } | null;
  can_rebuild_evidence_preview?: boolean | null;
  can_recreate_from_current_signal?: boolean | null;
  can_patch_legacy_record?: boolean | null;
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
}

export interface ReviewEvidenceRepairPayload {
  status: string;
  will_write: boolean;
  requires_explicit_authorization?: boolean;
  selected_market_id?: number | null;
  selected_product_scope_id?: string | null;
  readiness_status?: string | null;
  rule_improvement_status?: string | null;
  counts: {
    manual_actions?: number | null;
    review_todos?: number | null;
    repair_issue_count?: number | null;
    legacy_action_gap_count?: number | null;
    preview_rebuildable_count?: number | null;
    recreatable_count?: number | null;
  };
  items: ReviewEvidenceRepairItem[];
  forbidden_effects?: string[] | null;
  next_action?: string | null;
}

export interface SnapshotPipelineResult {
  pipeline_status: string;
  create: SnapshotCreateResult;
  inspection: SnapshotInspectionResult;
  signal_scan: SnapshotSignalScanResult;
}

export type ManualActionType = "observe" | "handled" | "add_to_review" | "ignore";
export type ReviewWindow = "7d" | "14d";

export interface ManualActionEvidenceSnapshot {
  label: string;
  value: string;
  detail?: string | null;
  source?: string | null;
}

export interface ReviewContext {
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

export interface ManualActionRequest {
  action_type: ManualActionType;
  action_note?: string | null;
  operator_name?: string;
  evidence_snapshot?: ManualActionEvidenceSnapshot[];
  expected_product_scope_id?: string | null;
  expected_object_type?: string | null;
  expected_object_id?: string | null;
  expected_can_auto_change_rules: boolean;
  expected_can_auto_execute_ads: boolean;
}

export interface ManualActionRecord {
  id: string;
  signal_id: string;
  action_type: ManualActionType;
  action_note?: string | null;
  operator_name: string;
  acted_at: string;
  manual_status: AiSignal["manual_status"];
  snapshot_id?: string | null;
  shop_id?: string | null;
  market_id?: number | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  evidence_snapshot?: ManualActionEvidenceSnapshot[];
}

export interface ManualActionPreflightTarget {
  signal_id?: string | null;
  action_type?: ManualActionType | string | null;
  object_type?: string | null;
  object_id?: string | null;
  source_object_id?: string | null;
  object_label?: string | null;
  shop_id?: string | null;
  shop_name?: string | null;
  market_id?: number | null;
  review_windows?: string[];
}

export interface ManualActionPreflightCounts {
  manual_action_count?: number | null;
  target_manual_action_count?: number | null;
  target_review_todo_count?: number | null;
  review_record_count?: number | null;
  target_review_record_count?: number | null;
}

export interface ManualActionPreflightBlocker {
  code?: string | null;
  message?: string | null;
}

export interface ManualActionEvidenceSnapshotPreview {
  status?: string | null;
  will_write?: boolean | null;
  will_save_on_authorized_write?: boolean | null;
  item_count?: number | null;
  sources?: string[];
  items?: ManualActionEvidenceSnapshot[];
  boundary?: string | null;
}

export interface ManualActionPostWriteEvidenceSnapshotCount {
  signal_id?: string | null;
  object_type?: string | null;
  object_id?: string | null;
  review_window?: string | null;
  evidence_snapshot_count?: number | null;
}

export interface ManualActionPostWriteChecks {
  target_manual_action_evidence_snapshot_counts?: ManualActionPostWriteEvidenceSnapshotCount[] | null;
  target_review_todo_evidence_snapshot_counts?: ManualActionPostWriteEvidenceSnapshotCount[] | null;
}

export interface ManualActionPreflight {
  status: string;
  mode: "pre_write" | "post_write" | string;
  will_write: boolean;
  requires_explicit_authorization: boolean;
  selected_market_id?: number | null;
  selected_product_scope_id?: string | null;
  target?: ManualActionPreflightTarget | null;
  current_counts?: ManualActionPreflightCounts | null;
  expected_after_write?: ManualActionPreflightCounts | null;
  post_write_checks?: ManualActionPostWriteChecks | null;
  evidence_snapshot_preview?: ManualActionEvidenceSnapshotPreview | null;
  blockers: ManualActionPreflightBlocker[];
  forbidden_effects: string[];
  next_action?: string | null;
}

export interface ReviewTodo {
  signal_id: string;
  action_id: string;
  action_type: ManualActionType;
  manual_status: AiSignal["manual_status"];
  action_note?: string | null;
  operator_name: string;
  acted_at: string;
  snapshot_id?: string | null;
  shop_id?: string | null;
  market_id?: number | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  evidence_snapshot?: ManualActionEvidenceSnapshot[];
  review_context?: ReviewContext | null;
  review_window: ReviewWindow;
  due_at: string;
  is_due: boolean;
  days_since_action: number;
}

export interface ReviewEffectResult {
  signal_id: string;
  action_id?: string | null;
  action_type?: ManualActionType | null;
  acted_at?: string | null;
  due_at?: string | null;
  snapshot_id?: string | null;
  shop_id?: string | null;
  market_id?: number | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  evidence_snapshot?: ManualActionEvidenceSnapshot[];
  review_window: ReviewWindow;
  status: "not_ready" | "ready";
  result: "improved" | "no_change" | "worse" | "unclear";
  message: string;
  before_start_date?: string | null;
  before_end_date?: string | null;
  after_start_date?: string | null;
  after_end_date?: string | null;
  before_metrics: Partial<MetricSnapshot>;
  after_metrics: Partial<MetricSnapshot>;
}

export interface ReviewRecordRequest {
  review_note?: string | null;
  reviewer_name?: string;
  expected_action_id?: string | null;
  expected_object_type?: string | null;
  expected_object_id?: string | null;
  expected_review_window?: ReviewWindow | null;
  expected_evidence_snapshot: ManualActionEvidenceSnapshot[];
  expected_can_auto_change_rules: boolean;
  expected_can_auto_execute_ads: boolean;
}

export interface ReviewRecord {
  id: string;
  signal_id: string;
  action_id?: string | null;
  action_type?: ManualActionType | null;
  acted_at?: string | null;
  snapshot_id?: string | null;
  shop_id?: string | null;
  market_id?: number | null;
  object_type?: string | null;
  object_id?: string | null;
  object_label?: string | null;
  review_window: ReviewWindow;
  before_start_date?: string | null;
  before_end_date?: string | null;
  after_start_date?: string | null;
  after_end_date?: string | null;
  before_metrics: Partial<MetricSnapshot>;
  after_metrics: Partial<MetricSnapshot>;
  evidence_snapshot?: ManualActionEvidenceSnapshot[];
  review_context?: ReviewContext | null;
  result: "improved" | "no_change" | "worse" | "unclear";
  review_note?: string | null;
  reviewer_name: string;
  reviewed_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  if (typeof fetch === "function") {
    const response = await fetch(url, init);
    if (!response.ok) {
      throw new Error(`request_failed_${response.status}`);
    }
    return response.json() as Promise<T>;
  }
  return xhrRequest<T>(url, init);
}

function xhrRequest<T>(url: string, init?: RequestInit): Promise<T> {
  if (typeof XMLHttpRequest === "undefined") {
    return Promise.reject(new Error("request_transport_unavailable"));
  }
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(init?.method ?? "GET", url);
    if (init?.credentials === "include") {
      request.withCredentials = true;
    }
    applyXhrHeaders(request, init?.headers);
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`request_failed_${request.status}`));
        return;
      }
      try {
        resolve(JSON.parse(request.responseText) as T);
      } catch {
        reject(new Error("request_parse_failed"));
      }
    };
    request.onerror = () => reject(new Error("request_network_failed"));
    request.send((init?.body as XMLHttpRequestBodyInit | null | undefined) ?? null);
  });
}

function applyXhrHeaders(request: XMLHttpRequest, headers?: HeadersInit): void {
  if (!headers) return;
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    headers.forEach((value, key) => request.setRequestHeader(key, value));
    return;
  }
  if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => request.setRequestHeader(key, value));
    return;
  }
  Object.entries(headers).forEach(([key, value]) => request.setRequestHeader(key, value));
}

export function fetchSignals(marketId?: number | null): Promise<AiSignal[]> {
  return request<AiSignal[]>(marketScopedPath("/api/signals", marketId));
}

export function fetchSearchIntents(marketId?: number | null, productScopeId?: string | null): Promise<SearchIntentSummary[]> {
  return request<SearchIntentSummary[]>(searchIntentsPath(marketId, productScopeId));
}

export function fetchMarketOptions(): Promise<MarketOption[]> {
  return request<MarketOption[]>("/api/market-options");
}

export function fetchProductScope(): Promise<ProductScopeSummary> {
  return request<ProductScopeSummary>("/api/product-scope");
}

export function fetchSnapshotStatus(): Promise<SnapshotStatus> {
  return request<SnapshotStatus>("/api/snapshot/status");
}

export function fetchSnapshotReadiness(marketId?: number | null): Promise<SnapshotReadiness> {
  return request<SnapshotReadiness>(marketScopedPath("/api/snapshot/readiness", marketId));
}

export function fetchSnapshotInspection(): Promise<SnapshotInspectionResult> {
  return request<SnapshotInspectionResult>("/api/snapshot/inspection");
}

export function fetchSignalScanSummary(marketId?: number | null): Promise<SignalScanSummary> {
  return request<SignalScanSummary>(marketScopedPath("/api/signal-scan/summary", marketId));
}

export function fetchSignalTriageSummary(marketId?: number | null, top = 5, productScopeId?: string | null): Promise<SignalTriageSummary> {
  return request<SignalTriageSummary>(signalTriagePath(marketId, top, productScopeId));
}

export function fetchReviewEvidenceRepair(
  marketId?: number | null,
  top = 5,
  productScopeId?: string | null,
): Promise<ReviewEvidenceRepairPayload> {
  return request<ReviewEvidenceRepairPayload>(reviewEvidenceRepairPath(marketId, top, productScopeId));
}

export function fetchManualActionPreflight(options: {
  marketId?: number | null;
  top?: number;
  productScopeId?: string | null;
  expectedObjectId?: string | null;
  expectedObjectType?: string | null;
  actionType?: string | null;
  expectWritten?: boolean;
}): Promise<ManualActionPreflight> {
  return request<ManualActionPreflight>(manualActionPreflightPath(options));
}

export function createSnapshot(payload: SnapshotCreateRequest): Promise<SnapshotCreateResult> {
  return request<SnapshotCreateResult>("/api/snapshot/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function probeSnapshotApi(payload: SnapshotCreateRequest): Promise<SnapshotProbeResult> {
  return request<SnapshotProbeResult>("/api/snapshot/probe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function runSnapshotPipeline(payload: SnapshotCreateRequest): Promise<SnapshotPipelineResult> {
  return request<SnapshotPipelineResult>("/api/snapshot/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchSignalManualActions(signalId: string, marketId?: number | null): Promise<ManualActionRecord[]> {
  return request<ManualActionRecord[]>(signalManualActionsPath(signalId, marketId));
}

export function fetchSignalReviewTodos(signalId: string, marketId?: number | null): Promise<ReviewTodo[]> {
  return request<ReviewTodo[]>(signalReviewTodosPath(signalId, marketId));
}

export function fetchReviewTodos(marketId?: number | null): Promise<ReviewTodo[]> {
  return request<ReviewTodo[]>(reviewTodosPath(marketId));
}

export function fetchSignalReviewEffect(
  signalId: string,
  reviewWindow: ReviewWindow,
  marketId?: number | null,
): Promise<ReviewEffectResult> {
  return request<ReviewEffectResult>(signalReviewEffectPath(signalId, reviewWindow, marketId));
}

export function fetchSignalReviewRecords(
  signalId: string,
  marketId?: number | null,
  lookup?: SignalReviewRecordLookup | null,
): Promise<ReviewRecord[]> {
  return request<ReviewRecord[]>(signalReviewRecordsPath(signalId, marketId, lookup));
}

export function createSignalReviewRecord(
  signalId: string,
  reviewWindow: ReviewWindow,
  payload: ReviewRecordRequest,
  marketId?: number | null,
): Promise<ReviewRecord> {
  return request<ReviewRecord>(
    marketScopedPath(
      `/api/signals/${encodeURIComponent(signalId)}/review-records?review_window=${encodeURIComponent(reviewWindow)}`,
      marketId,
    ),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function createSignalManualAction(
  signalId: string,
  payload: ManualActionRequest,
  marketId?: number | null,
): Promise<ManualActionRecord> {
  return request<ManualActionRecord>(marketScopedPath(`/api/signals/${encodeURIComponent(signalId)}/manual-actions`, marketId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
