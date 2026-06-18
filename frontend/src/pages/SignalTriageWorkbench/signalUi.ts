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

export type SignalQueueKind = SignalForUi["signal_type"] | "data_quality";
export type SignalStatusOverrideMap = Record<string, SignalForUi["status"]>;

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

export interface SignalObjectContext {
  boundary: string;
  items: SignalObjectContextItem[];
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
}

export interface SearchIntentReviewCard {
  intentLabel: string;
  title: string;
  summary: string;
  sourceLabel: string;
  insight: string;
  topTerms: string[];
}

export interface SearchIntentFilterSignalForUi extends SignalForUi {
  evidence?: {
    primary_object?: PrimaryObjectForUi | null;
    facts?: EvidenceForUi[] | null;
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
  evidence_drilldown?: {
    summary?: string | null;
    boundary?: string | null;
  } | null;
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
  total?: number | null;
  by_result?: Record<string, number>;
  priority_result?: string | null;
  sample_review_record_ids?: string[];
  sample_action_ids?: string[];
  recommendation?: string | null;
  boundary?: string | null;
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
  recommended_candidate?: {
    signal_id?: string | null;
    stable_object_id?: string | null;
    object_label?: string | null;
    problem_type?: string | null;
    evidence_strength?: string | null;
    attribution_boundary?: string | null;
    uncertainty?: string | null;
    review_path?: string | null;
  } | null;
  next_unhandled_candidate?: {
    signal_id?: string | null;
    shop_id?: string | null;
    shop_name?: string | null;
    market_id?: number | null;
    marketplace?: string | null;
    object_type?: string | null;
    object_id?: string | null;
    stable_object_id?: string | null;
    object_label?: string | null;
    problem_type?: string | null;
    evidence_strength?: string | null;
    attribution_boundary?: string | null;
    uncertainty?: string | null;
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
  } | null;
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
  next_unhandled_evidence_drilldown?: SignalTriageSummaryForUi["recommended_evidence_drilldown"];
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
    manual_action_count?: number;
    review_record_count?: number;
    ready_count?: number;
    not_ready_count?: number;
    review_wait_summary?: {
      status?: string | null;
      earliest_due_date?: string | null;
      next_object_type?: string | null;
      next_object_label?: string | null;
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
  unstable_object_id_count?: number | null;
  ready_review_count?: number | null;
  can_save_review_records_now?: boolean | null;
  earliest_due_date?: string | null;
  earliest_metric_due_date?: string | null;
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

export interface ReviewReadinessGateSummary {
  title: string;
  status: "empty" | "waiting" | "ready";
  primary: string;
  detail: string;
  boundary: string;
  items: ReviewReadinessGateItem[];
  nextSteps: ReviewReadinessNextStep[];
  identityAudit?: ReviewIdentityAuditSummary | null;
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
  landingGates: ProductScopeLandingGateItem[];
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

export interface ProductGroupAdAsinRow {
  scopeId: string;
  asin: string;
  spend: number;
  orders: number;
  sales: number;
  acos: number | null;
  strategyNote: string | null;
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
  if (signal.signal_category === "data_quality") return "data_quality";
  return signal.signal_type;
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
  const seen = new Set(scopedSignals.map((signal) => signal.id));
  const merged = [...scopedSignals];

  backendTriageSignalIds(summary).forEach((signalId) => {
    if (seen.has(signalId)) return;
    const signal = allSignals.find((item) => item.id === signalId);
    if (!signal) return;
    seen.add(signal.id);
    merged.push(signal);
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
    reason: summary?.recommendation_reason || summary?.next_action || `后端推荐 ${objectLabel} 进入人工确认。`,
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
    reason: summary?.next_action || `下一个未留痕候选 ${objectLabel} 需要人工确认。`,
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
  return stringValue(summary?.manual_action_preview?.signal_id) || stringValue(summary?.recommended_candidate?.signal_id) || null;
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

  if (currentSelectedId && signals.some((signal) => signal.id === currentSelectedId)) {
    return currentSelectedId;
  }

  if (shouldUseNextUnhandled && nextUnhandledCandidate) return nextUnhandledCandidate.signal.id;

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
  const objectText = `对象：${preview.objectType} / ${preview.objectId}`;
  const windowText = `窗口：${preview.reviewWindows.join(" / ")}`;
  return `${shopText}；${marketText}；${objectText}；${windowText}；只记录人工判断，不会自动执行广告动作。`;
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
  const unstableObjectIdCount = audit.unstable_object_id_count ?? 0;
  const issueCount = audit.issues?.length ?? 0;
  const readyReviewCount = audit.ready_review_count ?? 0;
  const effectCount = audit.effect_count ?? 0;
  const earliestMetricDueDate = audit.earliest_metric_due_date?.trim() || "等待广告指标窗口";
  const isBlocked = issueCount > 0 || missingKeyCount > 0 || unstableObjectIdCount > 0 || audit.status === "blocked";
  const statusText = isBlocked ? "读回身份存在阻塞" : "读回身份可审计";
  const saveText = audit.can_save_review_records_now
    ? "当前存在 ready 复盘，保存前仍需人工确认"
    : "当前不能保存复盘记录";

  return {
    title: "复盘读回身份门禁",
    status: isBlocked ? "blocked" : "ready",
    summary: `${statusText}；缺失 action_id / object_id / review_window：${missingActionIdCount} / ${missingObjectIdCount} / ${missingReviewWindowCount}；广告指标最早复盘：${earliestMetricDueDate}。`,
    boundary: `${saveText}；ready_for_readback 只表示可按原动作读回对象，不表示复盘效果 ready。`,
    items: [
      { label: "待读回效果", value: `${effectCount}`, tone: effectCount > 0 ? "ready" : "neutral" },
      { label: "ready 复盘", value: `${readyReviewCount}`, tone: readyReviewCount > 0 ? "ready" : "waiting" },
      { label: "历史对象 ID 风险", value: `${unstableObjectIdCount}`, tone: unstableObjectIdCount > 0 ? "blocked" : "ready" },
      { label: "缺失键", value: `${missingKeyCount}`, tone: missingKeyCount > 0 ? "blocked" : "ready" },
    ],
  };
}

export function buildReviewReadinessGateSummary(
  summary: SignalTriageSummaryForUi | null | undefined,
): ReviewReadinessGateSummary | null {
  const status = summary?.review_status;
  if (!status) return null;

  const identityAudit = buildReviewIdentityAuditSummary(status.review_identity_audit);
  const manualActionCount = status.manual_action_count ?? 0;
  const reviewRecordCount = status.review_record_count ?? status.review_feedback?.total ?? 0;
  const readyCount = status.ready_count ?? 0;
  const notReadyCount = status.not_ready_count ?? 0;
  const waitSummary = status.review_wait_summary;
  const earliestDueDate = waitSummary?.earliest_due_date?.trim() || "等待窗口";
  const nextObject = uniqueNonEmpty([waitSummary?.next_object_type, waitSummary?.next_object_label]).join(" / ");
  const waitForbiddenActions = uniqueNonEmpty(waitSummary?.forbidden_actions ?? []);
  const forbiddenActions = waitForbiddenActions.length
    ? waitForbiddenActions
    : ["不拉取快照", "不保存复盘结论", "不自动改规则", "不自动执行广告动作"];

  if (readyCount > 0) {
    const nextStep = status.rule_improvement?.next_step?.trim() || "先人工确认 ready 复盘，再保存 review_records。";
    return {
      title: "复盘可保存门槛",
      status: "ready",
      primary: `已有 ${readyCount} 个 ready 复盘，保存前仍需人工确认。`,
      detail: nextStep,
      boundary: "ready 只表示窗口数据满足预检，仍需人工确认并手动保存 review_records；不自动改规则，不自动执行广告动作。",
      identityAudit,
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

  if (manualActionCount > 0) {
    const detailParts = uniqueNonEmpty([
      waitSummary?.message,
      nextObject ? `下一项：${nextObject}` : null,
      waitSummary?.next_step,
    ]);
    return {
      title: "复盘等待窗口",
      status: "waiting",
      primary: `已有 ${manualActionCount} 条人工留痕，ready 复盘 ${readyCount} 个，最早 ${earliestDueDate} 后再复核。`,
      detail: detailParts.join("；") || "人工动作已记录，等待 7/14 天窗口形成可比较的前后指标。",
      boundary: `未到期前${forbiddenActions.join("、")}。`,
      identityAudit,
      items: [
        { label: "人工留痕", value: `${manualActionCount} 条`, tone: "ready" },
        { label: "已存复盘", value: `${reviewRecordCount} 条`, tone: reviewRecordCount > 0 ? "ready" : "waiting" },
        { label: "最早复盘", value: earliestDueDate, tone: "waiting" },
        { label: "未就绪", value: `${notReadyCount} 个`, tone: notReadyCount > 0 ? "waiting" : "neutral" },
      ],
      nextSteps: [
        { label: "现在", detail: "查看当前人工留痕和复盘待办，未到期前不拉取快照、不保存复盘结论。" },
        { label: "到期后", detail: `${earliestDueDate} 后只读检查复盘效果，确认处理前后 7/14 天窗口是否完整。` },
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

export function buildRuleFeedbackPrioritySummary(summary: SignalTriageSummaryForUi | null | undefined): RuleFeedbackPrioritySummary | null {
  const feedback = summary?.review_status?.review_feedback;
  const closureChecklist = (feedback?.closure_checklist ?? []).map(ruleFeedbackClosureCheckText);
  if (!feedback || ((feedback.total ?? 0) <= 0 && closureChecklist.length === 0)) return null;
  const bySignalType = feedback.by_signal_type ?? {};
  const signalTypeText = formatOrderedCounts(bySignalType, ["opportunity", "anomaly", "unknown"]) || "信号类型维度待补齐";
  const byResult = feedback.by_result ?? {};
  return {
    title: "已保存复盘样本池",
    basis: `来自已保存 ReviewRecord：${feedback.total ?? 0} 条；信号类型：${signalTypeText}；复盘结果：${
      formatOrderedCounts(byResult, ["worse", "no_change", "unclear", "improved"]) || "待补齐"
    }。`,
    priority: ruleFeedbackPriorityText(byResult),
    sampleSort: feedback.sample_sort?.reason?.trim() || "样本按业务风险排序：worse / no_change / unclear / improved。",
    actionBoundary: ruleFeedbackActionBoundaryText(feedback.action_boundaries),
    closureChecklist,
    records: (feedback.records ?? []).slice(0, 5).map(ruleFeedbackRecordText),
    candidateGroups: (feedback.candidate_groups ?? []).slice(0, 5).map(ruleFeedbackCandidateGroupText),
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
  const evidence = record.evidence_drilldown?.summary ? `；证据回看：${record.evidence_drilldown.summary}` : "";
  const evidenceGroups = ruleFeedbackEvidenceGroupsText(record.evidence_groups);
  return `${result} / ${signalType} / ${objectType} / ${objectLabel} / ${reviewWindow}${recordSource}${metricWindow}${note}${sortReason}${actionBoundary}${evidence}${evidenceGroups}`;
}

function ruleFeedbackCandidateGroupText(group: RuleFeedbackCandidateGroupForUi) {
  const groupType = group.group_type === "search_intent" ? "语义组" : group.group_type === "aba_reference_term" ? "ABA参考词" : "候选分组";
  const groupLabel = group.group_label || group.group_id || "分组待补充";
  const resultText = formatOrderedCounts(group.by_result ?? {}, ["worse", "no_change", "unclear", "improved"]) || "结果待补齐";
  const totalText = group.total != null ? `样本 ${group.total}` : "样本待补齐";
  const abaText = group.aba_reference_term
    ? `；ABA参考：${group.aba_reference_term}${group.aba_period ? ` / ${group.aba_period}` : ""}`
    : "";
  const recommendation = group.recommendation ? `；${group.recommendation}` : "";
  const boundary = group.boundary ? `；${group.boundary}` : "；只进入解释层和人工复核，不自动改规则，不自动执行广告动作。";
  return `${groupType}：${groupLabel} / ${totalText} / ${resultText}${abaText}${recommendation}${boundary}`;
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

function ruleFeedbackEvidenceGroupsText(groups: RuleFeedbackRecordForUi["evidence_groups"]) {
  const parts = (groups ?? [])
    .filter((group) => group.label && group.value)
    .slice(0, 4)
    .map((group) => `${group.label}：${group.value}`);
  return parts.length ? `；证据分组：${parts.join("；")}` : "";
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
  "ad_group_problem_location",
  "targeting_context",
  "search_term_market_context",
  "search_term_aba_context",
  "placement_context_gap",
  "downstream_context_gap",
  "context_boundary",
  "parent_sibling_position",
];

export interface SignalTriageBusinessEvidenceItem {
  blockId: string;
  label: string;
  value: string;
  detail: string | null;
  source: string | null;
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
  layerId: ProductScopeEvidenceMatrixRow["layerId"];
  label: string;
  objectLabel: string;
  primaryEvidence: string;
  nextFocus: string;
  tone: ProductScopeEvidenceMatrixRow["tone"];
}

export interface ProductScopeEvidenceRouteGuide {
  title: string;
  summary: string;
  steps: ProductScopeEvidenceRouteGuideStep[];
  boundary: string;
}

export interface ProductScopeAdGroupActionableReview {
  title: string;
  evidence: string;
  decision: string;
  manualGate: string;
}

export interface ManualActionCandidateAdGroupBridge {
  title: string;
  evidence: string;
  decision: string;
  boundary: string;
}

export interface ProductScopeAdGroupDiagnosisRow {
  id: string;
  title: string;
  statusLabel: string;
  statusTone: "healthy" | "observe" | "risk" | "gap";
  problemType: string;
  metrics: string;
  trafficContext: string;
  reason: string;
  advertisedAsins: string[];
  actionableReview: ProductScopeAdGroupActionableReview;
  nextReviewFocus: string;
  boundary: string;
  forbiddenActions: string[];
  searchTermDiagnosis: ProductScopeSearchTermDiagnosis | null;
}

export interface ProductScopeSearchTermDiagnosisTerm {
  label: string;
  termTypeLabel: string;
  metrics: string;
}

export interface ProductScopeSearchTermDiagnosis {
  termSummary: string;
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
  { blockIds: ["diagnosis_judgement"], labels: ["综合判断"] },
  { blockIds: ["ad_group_problem_location"], labels: ["广告组问题定位"] },
  { blockIds: ["targeting_context"], labels: ["投放词结构"] },
  { blockIds: ["search_term_market_context", "search_term_aba_context"], labels: ["搜索词市场背景", "ABA市场背景"] },
  { blockIds: ["placement_context_gap", "downstream_context_gap"], labels: ["广告位证据缺口", "下游证据缺口"] },
  { blockIds: ["context_boundary"], labels: ["上下文边界"] },
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
  const contextBoundary = prioritized.find((block) => block.block_id === "context_boundary");
  if (contextBoundary && !visible.some((block) => block.block_id === "context_boundary")) {
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
    evidence.push({
      blockId: "product_scope_top_ad_group",
      label: "优先广告组",
      value: topGroup.ad_group_name || topGroup.ad_group_id || "未知广告组",
      detail: `搜索词 ${topGroup.search_term_count ?? 0} 条 / 广告组级广告位 ${topGroup.placement_count ?? 0} 条 / 同广告活动广告位 ${topGroup.campaign_placement_count ?? 0} 条`,
      source: "积加API / ad_search_term_daily_metrics / ad_placement_daily_metrics",
    });

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
      problemType: row.problem_type?.trim() || "诊断口径待补充",
      metrics: `花费 ${formatEvidenceNumber(row.spend)} / 订单 ${Math.round(row.orders ?? 0)} / ACOS ${formatEvidencePercent(row.acos)}`,
      trafficContext: `广告 ASIN ${row.ad_group_advertised_asin_count ?? 0} 个 / 搜索词 ${row.search_term_count ?? 0} 条 / 广告位 ${
        row.placement_count ?? 0
      } 条 / 活动广告位 ${row.campaign_placement_count ?? 0} 条`,
      reason: row.reason?.trim() || "等待后端补充广告组诊断原因。",
      advertisedAsins: row.ad_group_advertised_asins?.map((asin) => asin.trim()).filter(Boolean) ?? [],
      actionableReview: productScopeAdGroupActionableReview(row, candidateCount, canWriteManualAction),
      nextReviewFocus: row.next_review_focus?.trim() || "先下钻广告 ASIN、搜索词和广告位上下文。",
      boundary: row.attribution_boundary?.trim() || "广告组是投放容器，搜索词和广告位不能自动归因到单个 ASIN。",
      forbiddenActions: row.forbidden_actions?.length ? row.forbidden_actions : ["自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
      searchTermDiagnosis: productScopeSearchTermDiagnosis(row),
    }));
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

  return {
    title: "人工候选与广告组关系",
    evidence,
    decision: `沿用中间广告组判断：${topGroup.actionableReview.decision}`,
    boundary: "广告组是投放容器；该关系只说明候选对象与同广告组上下文的复核关系，不自动归因到单个 ASIN，也不自动执行广告动作。",
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

function productScopeSearchTermDiagnosis(
  row: ProductScopeDrilldownAdGroupDiagnosisForUi,
): ProductScopeSearchTermDiagnosis | null {
  const diagnosis = row.search_term_diagnosis;
  if (!diagnosis) return null;
  const effectiveTerms = productScopeSearchTermDiagnosisTerms(diagnosis.effective_terms ?? []);
  const zeroOrderTerms = productScopeSearchTermDiagnosisTerms(diagnosis.zero_order_terms ?? []);
  return {
    termSummary: diagnosis.term_summary?.trim() || `有效搜索词 ${effectiveTerms.length} 条 / 无订单花费词 ${zeroOrderTerms.length} 条`,
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
  }));
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
  const topAdGroupName = topGroup?.ad_group_name?.trim() || topGroup?.ad_group_id?.trim();
  const searchTermCount = topGroup?.search_term_count ?? 0;
  const placementCount = topGroup?.placement_count ?? 0;

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
        label: "搜索词/广告位",
        value: topGroup ? `搜索词 ${searchTermCount} 条 / 广告位 ${placementCount} 条` : "等待广告组上下文",
        tone: "context",
      },
      {
        label: "AI 准入",
        value: `${status.label} / 候选 ${candidateCount} 个`,
        tone: status.tone === "blocked" ? "blocked" : status.tone === "ready" ? "ready" : "neutral",
      },
    ],
    boundary: `${diagnosisBoundary(summary)}${candidateCount === 0 ? " candidate_count=0，不能写人工动作。" : ""}`,
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
  const effectiveTerms = productScopeTermNames(topGroup?.effective_search_terms);
  const zeroOrderTerms = productScopeTermNames(topGroup?.zero_order_search_terms);
  const trafficParts = [
    effectiveTerms.length > 0 ? `有效搜索词：${effectiveTerms.join("、")}` : "",
    zeroOrderTerms.length > 0 ? `无订单花费词：${zeroOrderTerms.join("、")}` : "",
  ].filter(Boolean);

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
      layerLabel: "搜索词/广告位",
      objectLabel: `搜索词 ${topGroup?.search_term_count ?? 0} 条 / 广告位 ${topGroup?.placement_count ?? 0} 条`,
      evidenceLabel: "流量上下文",
      value: trafficParts.length > 0 ? trafficParts.join("；") : "等待有效词、无订单词或广告位明细",
      detail: "搜索词和广告位用于定位问题来源，不能自动归因到单个 ASIN，也不能自动否词或调价。",
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
  return {
    title: "广告证据链导览",
    summary: "先看经营入口，再看广告 ASIN、广告组、搜索词/广告位和人工确认门禁。",
    steps: matrix.rows.map((row, index) => ({
      order: index + 1,
      layerId: row.layerId,
      label: row.layerId === "admission" ? "人工确认" : row.layerLabel,
      objectLabel: row.objectLabel,
      primaryEvidence: `${row.evidenceLabel}：${row.value}`,
      nextFocus: row.detail,
      tone: row.tone,
    })),
    boundary: matrix.boundary,
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
    return "Parent ASIN -> 广告 ASIN -> 广告组 -> 搜索词/广告位 -> AI 准入";
  }
  if (selectedScope?.scope_type === "advertised_asin") {
    return "广告 ASIN -> 广告组 -> 搜索词/广告位 -> AI 准入";
  }
  return "经营入口 -> 广告证据 -> AI 准入";
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
    .map((slot) => items.find((item) => slot.blockIds.includes(item.blockId) || slot.labels.includes(item.label)))
    .filter((item): item is SignalTriageBusinessEvidenceItem => Boolean(item));

  return pathItems.map((item, index) => ({
    ...item,
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

export function buildSearchIntentReviewCards(summaries: SearchIntentSummaryForUi[], limit = 4): SearchIntentReviewCard[] {
  return summaries.slice(0, limit).map((summary) => {
    const metrics = summary.metrics;
    const abaMatchCount = summary.aba_match_count ?? 0;
    const topTerms = (summary.top_search_terms ?? []).slice(0, 3).map((term) => {
      const abaText = term.aba_rank ? ` / ABA ${term.aba_rank}` : "";
      return `${term.search_term}：${term.orders} 单 / 花费 ${formatReviewNumber(term.cost)} / ACOS ${formatReviewPercent(term.acos)}${abaText}`;
    });
    return {
      intentLabel: summary.intent_label,
      title: summary.intent_label,
      summary: `${metrics.orders} 单 / 花费 ${formatReviewNumber(metrics.cost)} / ACOS ${formatReviewPercent(metrics.acos)} / ABA 命中 ${abaMatchCount}`,
      sourceLabel: summary.semantic_source || "未知来源",
      insight: summary.insight,
      topTerms,
    };
  });
}

export function filterSignalsBySearchIntent<T extends SearchIntentFilterSignalForUi>(signals: T[], intentLabel: string | null | undefined): T[] {
  const selectedIntentLabel = intentLabel?.trim();
  if (!selectedIntentLabel) return signals;
  return signals.filter((signal) => {
    if (signal.signal_category !== "search_term_opportunity" || signal.object_type !== "search_term") return false;
    const primaryIntentLabel = signal.evidence?.primary_object?.intent_label?.trim();
    if (primaryIntentLabel === selectedIntentLabel) return true;
    return (signal.evidence?.facts ?? []).some((fact) => fact.label === "语义组" && fact.value.trim() === selectedIntentLabel);
  });
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
  const triageNextAction = status.has_manual_action ? summary?.next_action?.trim() : "";
  let nextAction = triageNextAction || status.next_action;
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
  return `${label}：${nextAction}`;
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
  if (option.scope_type === "parent_asin" || option.scope_id.startsWith("parent_asin:")) return `商品组：${label}`;
  if (option.scope_type === "advertised_asin") return `ASIN：${label}`;
  if (option.scope_type === "sales_asin") return `销售背景：${label}`;
  return label;
}

export function buildProductScopeOptionGroups(options: ProductScopeFilterOption[]): ProductScopeOptionGroup[] {
  const loadingOptions = options.filter((option) => option.scope_type === "loading");
  const productOptions = options.filter(
    (option) =>
      option.scope_type === "parent_asin" ||
      option.scope_id.startsWith("parent_asin:") ||
      option.scope_type === "advertised_asin",
  );
  const assistOptions = options.filter(
    (option) => option.scope_id === "all" || option.scope_type === "all" || option.scope_id === "unattributed" || option.scope_type === "unattributed",
  );
  const groups: ProductScopeOptionGroup[] = [];
  if (loadingOptions.length > 0) groups.push({ label: "经营入口状态", options: loadingOptions });
  if (productOptions.length > 0) groups.push({ label: "广告分析入口", options: productOptions });
  if (assistOptions.length > 0) groups.push({ label: "辅助排查入口", options: assistOptions });
  return groups;
}

export function buildProductScopeSelectionSummary(selectedScope: ProductScopeFilterOption | null): ProductScopeSelectionSummary {
  if (!selectedScope) {
    return {
      title: "等待经营商品入口",
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

  if (selectedScope.scope_type === "advertised_asin" || selectedScope.scope_type === "sales_asin") {
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

  if (selectedScope.scope_type === "advertised_asin" || selectedScope.scope_type === "sales_asin") {
    return {
      steps: ["店铺 / 站点", "ASIN", "商品指标", "同广告组上下文"],
      boundary: "该入口只直接解释当前 ASIN 的商品指标，搜索词和广告位仍需按同广告组上下文复核。",
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
  const asinScopeCount = options.filter((option) => option.scope_type === "advertised_asin" || option.scope_type === "sales_asin").length;
  const searchTermContextCount = coverage?.search_term_unattributed_count ?? 0;
  const placementContextCount = coverage?.placement_unattributed_count ?? 0;
  const hasParentScope = parentScopeCount > 0;

  return {
    title: hasParentScope ? "经营商品优先入口" : "ASIN 临时经营入口",
    description: hasParentScope
      ? "首层先按 Parent ASIN / ASIN 看经营盘子，再进入广告 ASIN、广告组、投放词和搜索词证据下钻。"
      : "当前快照缺少 Parent ASIN，先按 ASIN 观察；补齐父 ASIN 导入后再恢复商品组入口。",
    items: [
      {
        label: "第一层分组",
        value: hasParentScope ? `${parentScopeCount} 个 Parent ASIN 商品组，${asinScopeCount} 个 ASIN 可下钻` : `${asinScopeCount} 个 ASIN 可观察`,
        tone: "primary",
      },
      {
        label: "第二层证据",
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
      title: "Parent ASIN 广告分诊",
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
  const label = isParentScope ? "商品组" : isAsinScope ? "ASIN" : "当前范围";
  const titlePrefix = isAsinScope ? `当前 ${label}` : `当前${label}`;
  const titleJoiner = isAsinScope ? " " : "";
  const noActionableMessage = summaryHasNoActionableCandidate(input.signalTriageSummary)
    ? input.signalTriageSummary?.actionability_status?.message ?? "当前经营对象暂无可行动候选，只能作为诊断视图，不能写人工动作。"
    : null;
  const title = noActionableMessage
    ? `${titlePrefix}${titleJoiner}暂无可行动候选`
    : input.scopeSignalCount === 0
      ? `${titlePrefix}${titleJoiner}暂无需处理信号`
      : `${titlePrefix}${titleJoiner}仅有 ${input.scopeSignalCount} 条信号`;
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
        `商品组口径：销售表现识别 ${childAsinCount} 个子 ASIN，其中 ${advertisedAsinCount} 个有当前投放广告证据；未投放子 ASIN 不进入广告信号队列。`,
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
    reasons.push(`全量排查还有 ${outsideSignalCount} 条范围外信号，可用于查看未归因广告数据或数据质量事项。`);
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
    return {
      scopeId: option.scope_id,
      asin: option.asin ?? option.label ?? "未知 ASIN",
      spend,
      orders: scopeAdOrders(option),
      sales,
      acos: sales > 0 ? spend / sales : null,
      strategyNote: option.strategy_notes?.[0] ?? null,
    };
  });
  const strategyNotes = uniqueNonEmpty([
    ...(selectedScope.strategy_notes ?? []),
    ...adAsinOptions.flatMap((option) => option.strategy_notes ?? []),
  ]);
  const boundaryNotes = [
    "Parent ASIN 是商品组入口；子 ASIN 来自销售表现 parent_asin/variationAsin 或人工映射，广告 ASIN 只代表当前投放覆盖，未投放子 ASIN 不进入广告信号队列。",
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
      label: "Parent ASIN 经营盘子",
      value: `Parent ASIN ${parentAsin} / ${childAsins.length} 个销售表现子 ASIN / 订单 ${parentOrders} / 销售额 ${formatScopeMoney(parentSales)}`,
      tone: "primary",
    },
    {
      label: "广告证据下钻",
      value: `${adAsinLabels.length} 个当前投放广告 ASIN / 广告花费 ${formatScopeMoney(parentAdSpend)} / 广告订单 ${parentAdOrders} / 广告销售额 ${formatScopeMoney(parentAdSales)}，继续看广告组、投放词和搜索词`,
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
      label: "广告上下文",
      value: `投放词、搜索词 ${searchTermContextCount} 条 / 广告位 ${placementContextCount} 条只做问题定位，不做 ASIN 归因`,
      tone: "context",
    },
  ];

  return {
    title: `Parent ASIN ${parentAsin} 商品组`,
    summary: `已识别 ${childAsins.length} 个销售表现子 ASIN / ${adAsinLabels.length} 个当前投放广告 ASIN`,
    adAsinLabels,
    adAsinRows,
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
  const salesFact = overview.relationItems[0]?.value ?? "Parent ASIN 销售盘等待销售表现证据";
  const advertisedAsinCount = overview.adAsinRows.length;
  const adAsinText =
    advertisedAsinCount > 0
      ? `${advertisedAsinCount} 个当前投放广告 ASIN，只进入有广告证据的广告 ASIN。`
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
  const candidateText = candidateCount === undefined ? "AI 候选等待扫描" : `${candidateCount} 个可写人工候选`;
  const mvpStatus: ProductScopeMvpStatus =
    readyReviewCount > 0 && reviewRecordCount > 0
      ? {
          title: "诊断 MVP 状态判定",
          statusLabel: "复盘闭环可验证",
          summary: `当前已有 ${readyReviewCount} 个 ready 复盘和 ${reviewRecordCount} 条 review_records，可以进入人工复盘样本验证；仍不自动改规则或执行广告动作。`,
          detail: "沿 Parent ASIN -> 广告 ASIN -> 广告组 / 搜索词 / 广告位 -> AI 信号 -> 人工留痕 -> 复盘记录检查证据链。",
          boundary: "完整闭环也只代表人工保存过复盘样本，不代表系统可自动执行广告动作。",
          tone: "review",
        }
      : canWriteManualAction && (candidateCount ?? 0) > 0
        ? {
            title: "诊断 MVP 状态判定",
            statusLabel: "人工留痕 MVP",
            summary: `当前有 ${candidateCount} 个可写人工候选，可进入人工确认和留痕；但 ready 复盘 ${readyReviewCount} 个、review_records ${reviewRecordCount} 条，不是完整复盘闭环。`,
            detail: "沿 Parent ASIN -> 广告 ASIN -> 广告组 / 搜索词 / 广告位 -> AI 信号 -> 人工留痕推进，复盘窗口完整后再评价效果。",
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
      detail: "只有有广告证据的 ASIN 才进入广告诊断；未投放子 ASIN 不包装成广告问题。",
      tone: advertisedAsinCount > 0 ? "ready" : "blocked",
    },
    {
      label: "AI 准入",
      value: candidateCount === undefined ? "等待 AI 准入扫描" : candidateCount > 0 ? `${candidateCount} 个候选需人工复核` : "0 个候选，只能诊断不能写动作",
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
    title: "Parent ASIN 销售盘",
    summary: overview.summary,
    mvpStatus,
    factItems: overview.relationItems.slice(0, 2),
    adAsinRows: overview.adAsinRows.slice(0, 3),
    landingGates,
    pathSteps: [
      { label: "先看销售盘", detail: salesFact },
      { label: "再看广告 ASIN", detail: adAsinText },
      { label: "定位广告组", detail: "广告组是投放容器，先看同组广告商品、花费和订单分化。" },
      { label: "复核流量证据", detail: "搜索词和广告位只作为上下文证据，不能直接归因到单个 ASIN。" },
      { label: "进入人工闭环", detail: "AI 只给诊断和建议，最终必须人工确认和 7/14 天复盘。" },
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
  search_intent: "语义聚合",
  cross: "交叉信号",
};

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
  return {
    primary: [objectType, `严重 ${signal.severity}`, `置信 ${confidence}`],
    secondary: `${shop} / ${marketplace} / ${queueFreshnessLabel[signal.freshness_status]} / ${queueStatusLabel[signal.status]}`,
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
  const queueLabel = signalCategoryLabel(signal);
  const queueReason =
    queueKind === "data_quality"
      ? "进入数据质量桶：signal_category=data_quality，先解释数据链路、来源或新鲜度问题。"
      : `进入${queueLabel}桶：signal_type=${signal.signal_type}，表示当前规则判断为${queueLabel}信号。`;
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
      objectRule: "判断对象：搜索词聚合，不是单条投放行，也不能强行归属到单个商品。",
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

export function buildSignalObjectContext(signal: SignalForUi, primaryObject: PrimaryObjectForUi): SignalObjectContext {
  const objectType = signal.object_type ?? primaryObject.object_type;
  const items: SignalObjectContextItem[] = [];

  pushContextItem(items, "广告活动", primaryObject.campaign_name);
  pushContextItem(items, "广告组", primaryObject.ad_group_name);

  if (objectType === "ad_group") {
    pushContextItem(items, "广告组", primaryObject.label);
    return {
      boundary: "广告组是投放容器，不能直接归因为单个商品；商品判断必须继续看广告商品或销售商品证据。",
      items,
    };
  }

  if (objectType === "search_term") {
    pushContextItem(items, "搜索词", primaryObject.search_term ?? primaryObject.label);
    return {
      boundary: "搜索词表现通常落在广告活动和广告组上下文，不能强行归属到单个商品。",
      items,
    };
  }

  if (objectType === "placement") {
    pushContextItem(items, "广告位", primaryObject.placement ?? primaryObject.label);
    return {
      boundary: "广告位说明流量位置和预算分配层级，不直接代表单个商品承接。",
      items,
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
    };
  }

  if (objectType === "search_intent") {
    pushContextItem(items, "语义分组", primaryObject.intent_label ?? primaryObject.label);
    return {
      boundary: "语义分组用于聚合搜索意图，不等同于关键词本身。",
      items,
    };
  }

  pushContextItem(items, "判断对象", primaryObject.label);
  return {
    boundary: "跨对象信号用于说明数据链路或组合判断，不直接归因到单个商品或广告组。",
    items,
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
    return [["语义组"], ["投放上下文数"], ["搜索词"], ["合计订单", "订单"], ["合计ACOS", "ACOS"], ["花费"], ["转化率"], ...keyEvidencePriorityRules];
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
