import {
  EvidenceForUi,
  PrimaryObjectForUi,
  ProductScopedSignalForUi,
  ProductScopeFilterOption,
  SignalForUi,
  applySignalStatusOverrides,
  buildBackendRecommendedManualActionCandidate,
  buildNextUnhandledManualActionCandidate,
  buildRecommendedManualActionCandidate,
  canRecommendManualActionFromTriageSummary,
  isActionableProductScope,
  manualActionPreviewForSelectedSignal,
  manualActionTargetSummary,
  resolveSignalSelectionId,
  buildAdProductComparisonRows,
  buildEvidenceDrilldownSections,
  buildKeyEvidenceFacts,
  buildProductScopeGroupOverview,
  buildProductScopeFirstScreenSummary,
  buildProductScopeEntryGuidance,
  buildProductScopeOptionGroups,
  buildProductScopeSignalExplanation,
  buildProductScopeAdmissionCard,
  buildNoActionableManualGate,
  buildProductScopeAnalysisPath,
  buildDiagnosisContextSummary,
  buildDiagnosisPathSummary,
  buildProductScopeEvidenceMatrix,
  buildProductScopeEvidenceRouteGuide,
  buildManualActionCandidateAdGroupBridge,
  buildProductScopeQueueHeader,
  buildProductScopeSelectionSummary,
  buildProductScopeCandidateGapExplanation,
  buildSignalEvidenceSupport,
  buildSignalDiagnosticScope,
  buildSignalLayerOverview,
  buildSignalQueueMeta,
  buildSignalQueueObjectStatus,
  buildSignalQueueScopeBadge,
  buildSearchIntentReviewCards,
  buildSignalObjectContext,
  buildSignalOverview,
  buildSignalTriggerRationale,
  buildSignalTriageRationale,
  recommendedManualStatusText,
  recommendedEvidenceDrilldownText,
  nextUnhandledEvidenceDrilldownText,
  signalTriageCompactItems,
  buildRuleFeedbackPrioritySummary,
  buildReviewReadinessGateSummary,
  signalTriageBlockerTexts,
  signalTriageBusinessEvidenceItems,
  signalTriageDiagnosisPathItems,
  signalTriageDepthText,
  signalTriageLayerText,
  signalTriageReviewFeedbackText,
  signalTriageSummaryText,
  triggerEvidenceCountText,
  buildEvidenceSourceOptions,
  buildEvidenceRouteNodes,
  filterEvidenceBySource,
  filterSignalsBySearchIntent,
  filterSignalsByProductScope,
  mergeBackendTriageSignals,
  preferredProductScopeId,
  productScopeOptionLabel,
  productScopeAdGroupDiagnosisRows,
  productScopeDrilldownEvidenceItems,
  signalProductScopeIds,
  signalScopedStateKey,
  signalDecisionBoundary,
  signalImpactScope,
  signalCategoryLabel,
  signalQueueKind,
  recommendedManualActionCardCopy,
} from "../src/pages/SignalTriageWorkbench/signalUi";
import {
  manualActionButtonGate,
  manualActionPostWriteContractItems,
  manualActionPostWriteReadbackMessage,
  manualActionPreflightEvidenceRows,
  reviewContextText,
} from "../src/pages/SignalTriageWorkbench/reviewUi";

function assertEqual<T>(actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`期望 ${expected}，实际 ${actual}`);
  }
}

function assertIncludes(actual: string, expected: string) {
  if (!actual.includes(expected)) {
    throw new Error(`期望包含 ${expected}，实际 ${actual}`);
  }
}

function assertNotIncludes(actual: string, expected: string) {
  if (actual.includes(expected)) {
    throw new Error(`期望不包含 ${expected}，实际 ${actual}`);
  }
}

function assertClose(actual: number | null, expected: number, precision = 0.0001) {
  if (actual === null || Math.abs(actual - expected) > precision) {
    throw new Error(`期望接近 ${expected}，实际 ${actual}`);
  }
}

const dataQualitySignal: SignalForUi = {
  id: "sig-data-quality-search-intent-ungrouped",
  signal_type: "anomaly",
  signal_category: "data_quality",
  severity: 3,
  status: "pending",
  freshness_status: "api_snapshot",
};

const staleSignal: SignalForUi = {
  id: "sig-data-quality-aba-stale",
  signal_type: "anomaly",
  signal_category: "data_quality",
  severity: 4,
  status: "pending",
  freshness_status: "stale",
};

assertEqual(signalScopedStateKey("sig-shared-data-quality", 1), "1:sig-shared-data-quality");
assertEqual(signalScopedStateKey("sig-shared-data-quality", 2), "2:sig-shared-data-quality");
assertEqual(signalScopedStateKey("sig-shared-data-quality", null), "unknown:sig-shared-data-quality");

const reviewContextWithMetrics = reviewContextText({
  review_context: {
    manual_action_path: "人工确认后加入精准关键词候选或小流量观察",
    review_metrics: "7/14 天复盘点击、订单、ACOS、CVR、是否重复出现",
    can_auto_change_rules: false,
    can_auto_execute_ads: false,
  },
});
assertIncludes(reviewContextWithMetrics ?? "", "动作路径：人工确认后加入精准关键词候选或小流量观察");
assertIncludes(reviewContextWithMetrics ?? "", "复盘指标：7/14 天复盘点击、订单、ACOS");

const preflightEvidenceRows = manualActionPreflightEvidenceRows({
  status: "ready_for_explicit_manual_write",
  will_write: false,
  evidence_snapshot_preview: {
    status: "ready",
    will_write: false,
    will_save_on_authorized_write: true,
    item_count: 2,
    items: [
      {
        label: "投放词结构",
        value: "1 个投放词 / 搜索词表现行 2 条",
        detail: "投放词：beach essentials；不能自动加词、否词或调价。",
        source: "ad_search_term_daily_metrics",
      },
      {
        label: "复盘指标",
        value: "7/14 天复盘点击、订单、ACOS、CVR",
        detail: "用于判断处理是否有效，不代表自动执行广告动作。",
        source: "积加API",
      },
    ],
  },
});
assertEqual(preflightEvidenceRows.length, 2);
assertEqual(preflightEvidenceRows[0].label, "投放词结构");
assertIncludes(preflightEvidenceRows[0].detail ?? "", "不能自动加词");
assertEqual(preflightEvidenceRows[1].source, "积加API");
assertEqual(manualActionPreflightEvidenceRows(null).length, 0);

const postWriteContractItems = manualActionPostWriteContractItems({
  status: "ready_for_explicit_manual_write",
  will_write: false,
  target: {
    action_type: "add_to_review",
    object_type: "search_term",
    object_id: "search_term:1:beach essentials",
    review_windows: ["7d", "14d"],
  },
  expected_after_write: {
    target_manual_action_count: 1,
    target_review_todo_count: 2,
  },
  forbidden_effects: ["不保存 review_records", "不执行广告动作"],
  evidence_snapshot_preview: {
    item_count: 8,
    will_save_on_authorized_write: true,
  },
});
assertEqual(postWriteContractItems.length, 4);
assertEqual(postWriteContractItems[0].label, "人工留痕");
assertIncludes(postWriteContractItems[0].value, "1 条");
assertIncludes(postWriteContractItems[1].value, "2 条");
assertIncludes(postWriteContractItems[1].detail, "7d / 14d");
assertIncludes(postWriteContractItems[1].detail, "8 条证据快照");
assertEqual(postWriteContractItems[2].value, "不保存");
assertIncludes(postWriteContractItems[3].detail, "不自动加词");
assertEqual(manualActionPostWriteContractItems(null)[0].value, "读取中");

const mismatchedManualActionGate = manualActionButtonGate(
  "add_to_review",
  {
    status: "ready_for_explicit_manual_write",
    will_write: false,
    target: {
      action_type: "add_to_review",
      object_type: "search_term",
      object_id: "search_term:1:old",
    },
  },
  null,
  false,
  {
    objectType: "search_term",
    objectId: "search_term:1:beach essentials",
  },
);
assertEqual(mismatchedManualActionGate.disabled, true);
assertIncludes(mismatchedManualActionGate.reason ?? "", "预检目标");

const matchedManualActionGate = manualActionButtonGate(
  "add_to_review",
  {
    status: "ready_for_explicit_manual_write",
    will_write: false,
    target: {
      action_type: "add_to_review",
      object_type: "search_term",
      object_id: "search_term:1:beach essentials",
    },
  },
  null,
  false,
  {
    objectType: "search_term",
    objectId: "search_term:1:beach essentials",
  },
);
assertEqual(matchedManualActionGate.disabled, false);

const postWriteReadbackMessage = manualActionPostWriteReadbackMessage(
  {
    action_type: "add_to_review",
    object_type: "search_term",
    object_id: "search_term:1:beach essentials",
    object_label: "beach essentials",
    evidence_snapshot: [
      { label: "投放词结构", value: "1 个投放词 / 搜索词表现行 2 条" },
      { label: "人工动作路径", value: "人工确认后逐广告活动、广告组和广告商品复核" },
      { label: "复盘指标", value: "7/14 天复盘点击、订单、ACOS、CVR" },
      { label: "广告位证据缺口", value: "缺少可直接配套的广告位上下文" },
      { label: "排查路径", value: "搜索词 -> 广告活动 / 广告组" },
      { label: "搜索词表现", value: "花费 34.11 / 订单 21 / 销售额 193.20" },
      { label: "投放上下文", value: "广告活动 2 个 / 广告组 2 个" },
      { label: "对象边界", value: "搜索词是投放证据，不是广告商品本身" },
    ],
  },
  [
    {
      review_window: "7d",
      due_at: "2026-06-25T00:00:00Z",
      is_due: false,
      object_type: "search_term",
      object_id: "search_term:1:beach essentials",
      evidence_snapshot: [{ label: "投放词结构", value: "1 个投放词 / 搜索词表现行 2 条" }],
    },
    {
      review_window: "14d",
      due_at: "2026-07-02T00:00:00Z",
      is_due: false,
      object_type: "search_term",
      object_id: "search_term:1:beach essentials",
      evidence_snapshot: [{ label: "投放词结构", value: "1 个投放词 / 搜索词表现行 2 条" }],
    },
  ],
  [],
  {
    status: "ready_for_explicit_manual_write",
    will_write: true,
    target: {
      action_type: "add_to_review",
      object_type: "search_term",
      object_id: "search_term:1:beach essentials",
      review_windows: ["7d", "14d"],
    },
    current_counts: {
      target_manual_action_count: 1,
      target_review_todo_count: 2,
      target_review_record_count: 0,
    },
    forbidden_effects: ["不保存 review_records", "不执行广告动作"],
  },
);
assertIncludes(postWriteReadbackMessage, "search_term:1:beach essentials");
assertIncludes(postWriteReadbackMessage, "证据快照 8 条");
assertIncludes(postWriteReadbackMessage, "复盘待办 7d / 14d");
assertIncludes(postWriteReadbackMessage, "review_records 0 条");
assertIncludes(postWriteReadbackMessage, "不执行广告动作");

const opportunitySignal: SignalForUi = {
  id: "sig-market-opportunity",
  signal_type: "opportunity",
  signal_category: "market_opportunity",
  severity: 2,
  status: "observing",
  freshness_status: "api_snapshot",
};

const sameIdMarket1Signal = {
  ...dataQualitySignal,
  id: "sig-shared-data-quality",
  market_id: 1,
} as const satisfies SignalForUi;

const sameIdMarket2Signal = {
  ...dataQualitySignal,
  id: "sig-shared-data-quality",
  market_id: 2,
} as const satisfies SignalForUi;

const adGroupSignal = {
  id: "sig-ad-group-structure",
  signal_type: "anomaly",
  signal_category: "ad_group_structure",
  severity: 3,
  status: "pending",
  freshness_status: "api_snapshot",
  object_type: "ad_group",
} as const satisfies SignalForUi & { object_type: "ad_group" };

const searchTermSignal = {
  id: "sig-search-term-waste",
  signal_type: "anomaly",
  signal_category: "search_term_waste",
  severity: 4,
  status: "pending",
  freshness_status: "api_snapshot",
  object_type: "search_term",
} as const satisfies SignalForUi & { object_type: "search_term" };

const placementSignal = {
  id: "sig-placement-opportunity",
  signal_type: "opportunity",
  signal_category: "placement_efficiency",
  severity: 2,
  status: "pending",
  freshness_status: "api_snapshot",
  object_type: "placement",
} as const satisfies SignalForUi & { object_type: "placement" };

const advertisedProductSignal = {
  id: "sig-advertised-product-waste",
  signal_type: "anomaly",
  signal_category: "advertised_product_efficiency",
  severity: 4,
  status: "pending",
  freshness_status: "api_snapshot",
  object_type: "advertised_product",
} as const satisfies SignalForUi & { object_type: "advertised_product" };

const advertisedProductOpportunitySignal = {
  ...advertisedProductSignal,
  id: "sig-ad-product-stable-conversion",
  signal_type: "opportunity",
  signal_category: "advertised_product_opportunity",
  severity: 3,
} as const satisfies SignalForUi & { object_type: "advertised_product" };

const advertisedProductEfficiencySignal = {
  ...advertisedProductSignal,
  id: "sig-ad-product-efficiency",
  signal_type: "anomaly",
  signal_category: "advertised_product_efficiency",
  severity: 4,
} as const satisfies SignalForUi & { object_type: "advertised_product" };

const adGroupSignalWithAdProducts = {
  ...adGroupSignal,
  evidence: {
    source_rows: [
      { source_table: "advertised_products", asin: "B000TEST01" },
      { source_table: "advertised_products", asin: "B000TEST02" },
    ],
  },
};

const searchTermSignalWithoutAsin = {
  ...searchTermSignal,
  evidence: {
    source_rows: [{ source_table: "ad_search_term_daily_metrics", search_term: "kids sunglasses" }],
  },
};

const dataQualitySignalWithAdRows = {
  ...dataQualitySignal,
  evidence: {
    source_rows: [{ source_table: "advertised_products", asin: "B000TEST01" }],
  },
};

assertEqual(signalCategoryLabel(dataQualitySignal), "数据质量");
assertEqual(signalQueueKind(dataQualitySignal), "data_quality");
assertEqual(signalCategoryLabel(opportunitySignal), "市场机会");
assertEqual(signalCategoryLabel({ ...opportunitySignal, signal_category: "search_term_opportunity", object_type: "search_term" }), "搜索词机会");
assertEqual(signalCategoryLabel(advertisedProductOpportunitySignal), "广告商品机会");
assertEqual(signalCategoryLabel({ ...opportunitySignal, signal_category: "aba_market_opportunity", object_type: "search_term" }), "ABA市场机会");
assertEqual(signalQueueKind(opportunitySignal), "opportunity");
assertEqual(signalProductScopeIds(adGroupSignalWithAdProducts).join(","), "ad_asin:B000TEST01,ad_asin:B000TEST02");
assertEqual(signalProductScopeIds(searchTermSignalWithoutAsin).length, 0);
assertEqual(filterSignalsByProductScope([adGroupSignalWithAdProducts, searchTermSignalWithoutAsin], "ad_asin:B000TEST01").length, 1);
assertEqual(
  filterSignalsByProductScope([adGroupSignalWithAdProducts, searchTermSignalWithoutAsin], "parent_asin:B0PARENT", [
    {
      scope_id: "parent_asin:B0PARENT",
      scope_type: "parent_asin",
      parent_asin: "B0PARENT",
      child_asins: ["B000TEST01"],
    },
  ]).length,
  1,
);
assertEqual(
  filterSignalsByProductScope([dataQualitySignalWithAdRows, adGroupSignalWithAdProducts], "parent_asin:B0PARENT", [
    {
      scope_id: "parent_asin:B0PARENT",
      scope_type: "parent_asin",
      parent_asin: "B0PARENT",
      child_asins: ["B000TEST01"],
    },
  ]).length,
  1,
);
assertEqual(filterSignalsByProductScope([adGroupSignalWithAdProducts, searchTermSignalWithoutAsin], "unattributed").length, 1);
assertEqual(filterSignalsByProductScope([dataQualitySignal, searchTermSignalWithoutAsin], "unattributed").length, 1);
assertEqual(
  preferredProductScopeId([
    { scope_id: "all", scope_type: "all" },
    { scope_id: "ad_asin:B000TEST01", scope_type: "advertised_asin", asin: "B000TEST01" },
    { scope_id: "parent_asin:B0PARENT", scope_type: "parent_asin", parent_asin: "B0PARENT", child_asins: ["B000TEST01"] },
  ]),
  "parent_asin:B0PARENT",
);
assertEqual(
  preferredProductScopeId([
    { scope_id: "all", scope_type: "all" },
    { scope_id: "ad_asin:B000TEST01", scope_type: "advertised_asin", asin: "B000TEST01" },
  ]),
  "ad_asin:B000TEST01",
);
assertEqual(
  preferredProductScopeId([
    { scope_id: "all", scope_type: "all" },
    { scope_id: "sales_asin:B000SALES1", scope_type: "sales_asin", asin: "B000SALES1" },
  ]),
  "all",
);

assertEqual(productScopeOptionLabel({ scope_id: "all", scope_type: "all", label: "全量排查（商品 + 未归因 + 数据质量）" }), "辅助入口：全量排查（商品 + 未归因 + 数据质量）");
assertEqual(productScopeOptionLabel({ scope_id: "unattributed", scope_type: "unattributed", label: "未归因广告数据" }), "辅助入口：未归因广告数据");
assertEqual(productScopeOptionLabel({ scope_id: "parent_asin:B0PARENT", scope_type: "parent_asin", label: "Parent ASIN B0PARENT" }), "商品组：Parent ASIN B0PARENT");
assertEqual(productScopeOptionLabel({ scope_id: "ad_asin:B000TEST01", scope_type: "advertised_asin", label: "广告 ASIN B000TEST01" }), "ASIN：广告 ASIN B000TEST01");
assertEqual(productScopeOptionLabel({ scope_id: "sales_asin:B000SALES1", scope_type: "sales_asin", label: "销售 ASIN B000SALES1" }), "销售背景：销售 ASIN B000SALES1");

const productScopeOptionGroups = buildProductScopeOptionGroups([
  { scope_id: "all", scope_type: "all", label: "全量排查" },
  { scope_id: "unattributed", scope_type: "unattributed", label: "未归因广告数据" },
  { scope_id: "parent_asin:B0PARENT", scope_type: "parent_asin", label: "Parent ASIN B0PARENT" },
  { scope_id: "ad_asin:B000TEST01", scope_type: "advertised_asin", label: "广告 ASIN B000TEST01" },
  { scope_id: "sales_asin:B000SALES1", scope_type: "sales_asin", label: "销售 ASIN B000SALES1" },
]);

assertEqual(productScopeOptionGroups.map((group) => group.label).join(" / "), "广告分析入口 / 辅助排查入口");
assertEqual(productScopeOptionGroups[0].options.map((option) => option.scope_id).join(","), "parent_asin:B0PARENT,ad_asin:B000TEST01");
assertEqual(productScopeOptionGroups[1].options.map((option) => option.scope_id).join(","), "all,unattributed");

const parentAsinOptions = [
  {
    scope_id: "parent_asin:B00K4W4AAA",
    scope_type: "parent_asin",
    label: "Parent ASIN B00K4W4AAA",
    parent_asin: "B00K4W4AAA",
    child_asins: ["B016EXMVZS", "B016EXMW02"],
  },
  {
    scope_id: "ad_asin:B016EXMVZS",
    scope_type: "advertised_asin",
    label: "广告 ASIN B016EXMVZS",
    asin: "B016EXMVZS",
    strategy_notes: ["主推款"],
  },
  {
    scope_id: "ad_asin:B016EXMW02",
    scope_type: "advertised_asin",
    label: "广告 ASIN B016EXMW02",
    asin: "B016EXMW02",
  },
] satisfies ProductScopeFilterOption[];

const placementCandidateSignal = {
  ...placementSignal,
  id: "sig-placement-p0",
  priority: "P0",
  severity: 4,
  evidence: {
    primary_object: {
      object_type: "placement",
      label: "Top of Search",
      placement: "Top of Search",
    },
  },
} satisfies ProductScopedSignalForUi & { priority: "P0" };

const mainPushAdProductCandidateSignal = {
  ...advertisedProductSignal,
  id: "sig-ad-product-main-push",
  priority: "P1",
  severity: 3,
  evidence: {
    primary_object: {
      object_type: "advertised_product",
      label: "B016EXMVZS",
      asin: "B016EXMVZS",
    },
  },
} satisfies ProductScopedSignalForUi & { priority: "P1" };

const noStrategyAdProductCandidateSignal = {
  ...advertisedProductSignal,
  id: "sig-ad-product-no-strategy",
  priority: "P1",
  severity: 3,
  evidence: {
    primary_object: {
      object_type: "advertised_product",
      label: "B016EXMW02",
      asin: "B016EXMW02",
    },
  },
} satisfies ProductScopedSignalForUi & { priority: "P1" };

const recommendedManualActionCandidate = buildRecommendedManualActionCandidate(
  [placementCandidateSignal, mainPushAdProductCandidateSignal, noStrategyAdProductCandidateSignal],
  parentAsinOptions,
);

assertEqual(recommendedManualActionCandidate?.signal.id, "sig-ad-product-no-strategy");
assertIncludes(recommendedManualActionCandidate?.reason ?? "", "Parent ASIN B00K4W4AAA");
assertIncludes(recommendedManualActionCandidate?.reason ?? "", "无主推款策略备注");
assertEqual(recommendedManualActionCandidate?.manualActionPreview.willWrite, false);
assertEqual(recommendedManualActionCandidate?.manualActionPreview.actionType, "add_to_review");
assertEqual(recommendedManualActionCandidate?.manualActionPreview.objectType, "advertised_product");
assertEqual(recommendedManualActionCandidate?.manualActionPreview.objectId, "B016EXMW02");
assertEqual(recommendedManualActionCandidate?.manualActionPreview.reviewWindows.join(" / "), "7d / 14d");

assertEqual(isActionableProductScope({ scope_id: "all", scope_type: "all", label: "全量排查" }), false);
assertEqual(isActionableProductScope({ scope_id: "unattributed", scope_type: "unattributed", label: "未归因广告数据" }), false);
assertEqual(isActionableProductScope({ scope_id: "parent_asin:B00K4W4AAA", scope_type: "parent_asin", label: "Parent ASIN B00K4W4AAA" }), true);
assertEqual(isActionableProductScope({ scope_id: "ad_asin:B016EXMW02", scope_type: "advertised_asin", label: "广告 ASIN B016EXMW02" }), true);
assertEqual(isActionableProductScope({ scope_id: "sales_asin:B016EXMW1G", scope_type: "sales_asin", label: "销售 ASIN B016EXMW1G" }), false);

const backendRecommendedManualActionCandidate = buildBackendRecommendedManualActionCandidate(
  [mainPushAdProductCandidateSignal, noStrategyAdProductCandidateSignal],
  {
    recommended_candidate: {
      signal_id: "sig-ad-product-no-strategy",
      stable_object_id: "B016EXMW02",
      object_label: "B016EXMW02",
    },
    recommendation_reason: "后端推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
    manual_action_preview: {
      will_write: false,
      signal_id: "sig-ad-product-no-strategy",
      action_type: "add_to_review",
      object_type: "advertised_product",
      object_id: "B016EXMW02",
      object_label: "B016EXMW02",
      shop_id: "market:1",
      shop_name: "rivbos",
      market_id: 1,
      review_windows: ["7d", "14d"],
    },
  },
);

assertEqual(backendRecommendedManualActionCandidate?.signal.id, "sig-ad-product-no-strategy");
assertIncludes(backendRecommendedManualActionCandidate?.reason ?? "", "后端推荐 B016EXMW02");
assertEqual(backendRecommendedManualActionCandidate?.manualActionPreview.objectId, "B016EXMW02");
assertEqual(backendRecommendedManualActionCandidate?.manualActionPreview.shopId, "market:1");

const globalScopeBackendCandidate = buildBackendRecommendedManualActionCandidate(
  [noStrategyAdProductCandidateSignal],
  {
    product_scope_gate: {
      status: "requires_product_scope",
      is_actionable: false,
      message: "当前是全量排查入口，先选择 Parent ASIN / ASIN。",
    },
    recommended_candidate: {
      signal_id: "sig-ad-product-no-strategy",
      stable_object_id: "B016EXMW02",
      object_label: "B016EXMW02",
    },
    manual_action_preview: {
      will_write: false,
      signal_id: "sig-ad-product-no-strategy",
      action_type: "add_to_review",
      object_type: "advertised_product",
      object_id: "B016EXMW02",
      object_label: "B016EXMW02",
      review_windows: ["7d", "14d"],
    },
  },
);
assertEqual(globalScopeBackendCandidate, null);

assertEqual(
  resolveSignalSelectionId(null, [mainPushAdProductCandidateSignal, noStrategyAdProductCandidateSignal], {
    recommended_candidate: {
      signal_id: "sig-ad-product-no-strategy",
      stable_object_id: "B016EXMW02",
      object_label: "B016EXMW02",
    },
    manual_action_preview: {
      will_write: false,
      signal_id: "sig-ad-product-no-strategy",
      action_type: "add_to_review",
      object_type: "advertised_product",
      object_id: "B016EXMW02",
      object_label: "B016EXMW02",
      review_windows: ["7d", "14d"],
    },
  }),
  "sig-ad-product-no-strategy",
);
assertEqual(
  resolveSignalSelectionId("sig-ad-product-main-push", [mainPushAdProductCandidateSignal, noStrategyAdProductCandidateSignal], {
    recommended_candidate: {
      signal_id: "sig-ad-product-no-strategy",
      stable_object_id: "B016EXMW02",
      object_label: "B016EXMW02",
    },
    manual_action_preview: {
      will_write: false,
      signal_id: "sig-ad-product-no-strategy",
      action_type: "add_to_review",
      object_type: "advertised_product",
      object_id: "B016EXMW02",
      object_label: "B016EXMW02",
      review_windows: ["7d", "14d"],
    },
  }),
  "sig-ad-product-main-push",
);
assertEqual(
  resolveSignalSelectionId("sig-out-of-scope", [mainPushAdProductCandidateSignal, noStrategyAdProductCandidateSignal], {
    recommended_candidate: {
      signal_id: "sig-ad-product-no-strategy",
      stable_object_id: "B016EXMW02",
      object_label: "B016EXMW02",
    },
    manual_action_preview: {
      will_write: false,
      signal_id: "sig-ad-product-no-strategy",
      action_type: "add_to_review",
      object_type: "advertised_product",
      object_id: "B016EXMW02",
      object_label: "B016EXMW02",
      review_windows: ["7d", "14d"],
    },
  }),
  "sig-ad-product-no-strategy",
);

const backendManualActionTargetSummary = manualActionTargetSummary(backendRecommendedManualActionCandidate?.manualActionPreview ?? null);
assertIncludes(backendManualActionTargetSummary, "店铺：rivbos / market:1");
assertIncludes(backendManualActionTargetSummary, "对象：advertised_product / B016EXMW02");
assertIncludes(backendManualActionTargetSummary, "窗口：7d / 14d");
assertIncludes(backendManualActionTargetSummary, "不会自动执行广告动作");

const nextUnhandledManualActionCandidate = buildNextUnhandledManualActionCandidate(
  [
    noStrategyAdProductCandidateSignal,
    {
      ...noStrategyAdProductCandidateSignal,
      id: "sig-next-unhandled",
      evidence: {
        primary_object: {
          object_type: "advertised_product",
          label: "RBK004-RBK004-2 深蓝",
          asin: "B06VW5SQ97",
        },
      },
    },
  ],
  {
    next_unhandled_candidate: {
      signal_id: "sig-next-unhandled",
      object_type: "advertised_product",
      object_id: "B06VW5SQ97",
      stable_object_id: "B06VW5SQ97",
      object_label: "RBK004-RBK004-2 深蓝",
      manual_action_preview: {
        will_write: false,
        signal_id: "sig-next-unhandled",
        action_type: "add_to_review",
        object_type: "advertised_product",
        object_id: "B06VW5SQ97",
        object_label: "RBK004-RBK004-2 深蓝",
        review_windows: ["7d", "14d"],
      },
    },
    next_action:
      "推荐对象已人工留痕并等待复盘；可继续人工确认下一个未留痕候选 RBK004-RBK004-2 深蓝 的 add_to_review；真实写入只能由人工按钮触发，不要自动执行广告动作。",
  },
);

assertEqual(nextUnhandledManualActionCandidate?.signal.id, "sig-next-unhandled");
assertEqual(nextUnhandledManualActionCandidate?.manualActionPreview.objectId, "B06VW5SQ97");
assertIncludes(nextUnhandledManualActionCandidate?.reason ?? "", "下一个未留痕候选 RBK004-RBK004-2 深蓝");
assertIncludes(nextUnhandledManualActionCandidate?.reason ?? "", "不要自动执行广告动作");

const backendRecommendedCandidateWithNextPreview = buildBackendRecommendedManualActionCandidate(
  [
    noStrategyAdProductCandidateSignal,
    {
      ...noStrategyAdProductCandidateSignal,
      id: "sig-next-unhandled",
      evidence: {
        primary_object: {
          object_type: "advertised_product",
          label: "B07BS9754Q",
          asin: "B07BS9754Q",
        },
      },
    },
  ],
  {
    recommended_candidate: {
      signal_id: "sig-ad-product-no-strategy",
      stable_object_id: "B016EXMW02",
      object_label: "B016EXMW02",
    },
    manual_action_preview: {
      will_write: false,
      signal_id: "sig-next-unhandled",
      action_type: "add_to_review",
      object_type: "advertised_product",
      object_id: "B07BS9754Q",
      object_label: "B07BS9754Q",
      review_windows: ["7d", "14d"],
    },
    recommended_manual_status: {
      has_manual_action: true,
      has_review_todo: true,
      object_id: "B016EXMW02",
      object_label: "B016EXMW02",
      review_windows: ["7d", "14d"],
    },
    next_unhandled_candidate: {
      signal_id: "sig-next-unhandled",
      object_type: "advertised_product",
      object_id: "B07BS9754Q",
      stable_object_id: "B07BS9754Q",
      object_label: "B07BS9754Q",
    },
  },
);
assertEqual(backendRecommendedCandidateWithNextPreview?.signal.id, "sig-ad-product-no-strategy");
assertEqual(backendRecommendedCandidateWithNextPreview?.objectLabel, "B016EXMW02");
assertEqual(backendRecommendedCandidateWithNextPreview?.manualActionPreview.objectId, "B016EXMW02");

const handledRecommendedWithNextSummary = {
  recommended_candidate: {
    signal_id: "sig-ad-product-no-strategy",
    stable_object_id: "B016EXMW02",
    object_label: "B016EXMW02",
  },
  manual_action_preview: {
    will_write: false,
    signal_id: "sig-ad-product-no-strategy",
    action_type: "add_to_review",
    object_type: "advertised_product",
    object_id: "B016EXMW02",
    object_label: "B016EXMW02",
    review_windows: ["7d", "14d"],
  },
  recommended_manual_status: {
    has_manual_action: true,
    has_review_todo: true,
    review_todo_count: 2,
  },
  next_unhandled_candidate: {
    signal_id: "sig-next-unhandled",
    object_type: "sales_product",
    object_id: "sales-row-826-dark-blue",
    stable_object_id: "B06VW5SQ97",
    object_label: "RBK004-RBK004-2 深蓝",
    manual_action_preview: {
      will_write: false,
      signal_id: "sig-next-unhandled",
      action_type: "add_to_review",
      object_type: "sales_product",
      object_id: "B06VW5SQ97",
      object_label: "RBK004-RBK004-2 深蓝",
      review_windows: ["7d", "14d"],
    },
  },
};

assertEqual(
  resolveSignalSelectionId(null, [noStrategyAdProductCandidateSignal, { ...noStrategyAdProductCandidateSignal, id: "sig-next-unhandled" }], handledRecommendedWithNextSummary),
  "sig-next-unhandled",
);
assertEqual(
  resolveSignalSelectionId(
    "sig-ad-product-no-strategy",
    [noStrategyAdProductCandidateSignal, { ...noStrategyAdProductCandidateSignal, id: "sig-next-unhandled" }],
    handledRecommendedWithNextSummary,
  ),
  "sig-ad-product-no-strategy",
);
assertEqual(manualActionPreviewForSelectedSignal("sig-ad-product-no-strategy", handledRecommendedWithNextSummary, noStrategyAdProductCandidateSignal), null);

const selectedNextUnhandledPreview = manualActionPreviewForSelectedSignal("sig-next-unhandled", {
  next_unhandled_candidate: {
    signal_id: "sig-next-unhandled",
    object_type: "sales_product",
    object_id: "sales-row-826-dark-blue",
    stable_object_id: "B06VW5SQ97",
    object_label: "RBK004-RBK004-2 深蓝",
    manual_action_preview: {
      will_write: false,
      signal_id: "sig-next-unhandled",
      action_type: "add_to_review",
      object_type: "sales_product",
      object_id: "B06VW5SQ97",
      object_label: "RBK004-RBK004-2 深蓝",
      shop_id: "market:1",
      shop_name: "rivbos",
      market_id: 1,
      review_windows: ["7d", "14d"],
      preflight_checklist: [
        {
          check_id: "target_identity",
          label: "确认复盘对象",
          evidence: "sales_product / B06VW5SQ97",
          required: true,
        },
        {
          check_id: "ad_product_coverage",
          label: "核对广告 ASIN 覆盖",
          evidence: "销售表现广告订单不能直接等同于广告商品投放行。",
          required: true,
        },
        {
          check_id: "business_boundary",
          label: "核对库存 / 价格 / 策略边界",
          evidence: "销售商品强不等于可自动加投。",
          required: true,
        },
      ],
    },
  },
});

assertEqual(selectedNextUnhandledPreview?.objectType, "sales_product");
assertEqual(selectedNextUnhandledPreview?.objectId, "B06VW5SQ97");
assertEqual(selectedNextUnhandledPreview?.objectLabel, "RBK004-RBK004-2 深蓝");
assertEqual(selectedNextUnhandledPreview?.shopId, "market:1");
assertEqual(selectedNextUnhandledPreview?.preflightChecks.length, 3);
assertEqual(selectedNextUnhandledPreview?.preflightChecks[1].label, "核对广告 ASIN 覆盖");
assertIncludes(selectedNextUnhandledPreview?.preflightChecks[1].evidence ?? "", "销售表现广告订单不能直接等同于广告商品投放行");

const selectedPreviewFallsBackToSignalShop = manualActionPreviewForSelectedSignal(
  "sig-next-unhandled",
  {
    next_unhandled_candidate: {
      signal_id: "sig-next-unhandled",
      object_type: "sales_product",
      object_id: "sales-row-826-dark-blue",
      stable_object_id: "B06VW5SQ97",
      object_label: "RBK004-RBK004-2 深蓝",
      manual_action_preview: {
        will_write: false,
        signal_id: "sig-next-unhandled",
        action_type: "add_to_review",
        object_type: "sales_product",
        object_id: "B06VW5SQ97",
        object_label: "RBK004-RBK004-2 深蓝",
        market_id: 1,
        review_windows: ["7d", "14d"],
      },
    },
  },
  {
    id: "sig-next-unhandled",
    signal_type: "opportunity",
    signal_category: "商品机会",
    market_id: 1,
    object_type: "sales_product",
    severity: 72,
    status: "pending",
    freshness_status: "api_snapshot",
    shop_id: "market:1",
    shop_name: "rivbos",
  },
);

assertEqual(selectedPreviewFallsBackToSignalShop?.shopId, "market:1");
assertEqual(selectedPreviewFallsBackToSignalShop?.shopName, "rivbos");

const selectedSignalOnlyPreview = manualActionPreviewForSelectedSignal(
  "sig-direct-selected",
  null,
  {
    id: "sig-direct-selected",
    signal_type: "opportunity",
    signal_category: "商品机会",
    market_id: 1,
    object_type: "advertised_product",
    severity: 74,
    status: "pending",
    freshness_status: "api_snapshot",
    shop_id: "market:1",
    shop_name: "rivbos",
    evidence: {
      primary_object: {
        object_type: "advertised_product",
        object_id: "B016EXMW02",
        label: "广告 ASIN B016EXMW02",
        asin: "B016EXMW02",
      },
    },
  },
);

assertEqual(selectedSignalOnlyPreview?.shopId, "market:1");
assertEqual(selectedSignalOnlyPreview?.objectType, "advertised_product");
assertEqual(selectedSignalOnlyPreview?.objectId, "B016EXMW02");
assertIncludes(manualActionTargetSummary(selectedSignalOnlyPreview), "店铺：rivbos / market:1");

const globalScopeSelectedPreview = manualActionPreviewForSelectedSignal(
  "sig-direct-selected",
  {
    product_scope_gate: {
      status: "requires_product_scope",
      is_actionable: false,
      message: "当前是全量排查入口，先选择 Parent ASIN / ASIN。",
    },
  },
  {
    id: "sig-direct-selected",
    signal_type: "opportunity",
    signal_category: "商品机会",
    market_id: 1,
    object_type: "advertised_product",
    severity: 74,
    status: "pending",
    freshness_status: "api_snapshot",
    evidence: {
      primary_object: {
        object_type: "advertised_product",
        object_id: "B016EXMW02",
        label: "广告 ASIN B016EXMW02",
      },
    },
  },
);
assertEqual(globalScopeSelectedPreview, null);

assertEqual(
  recommendedManualStatusText({
    recommended_manual_status: {
      will_write: false,
      signal_id: "sig-ad-product-no-strategy",
      object_id: "B016EXMW02",
      object_label: "B016EXMW02",
      has_manual_action: false,
      manual_action_count: 0,
      has_review_todo: false,
      review_todo_count: 0,
      ready_review_count: 0,
      review_windows: [],
      next_action: "推荐对象尚未人工留痕；请在右侧点击加入复盘或记录观察，真实写入只能由人工按钮触发，不要自动执行广告动作。",
    },
  }),
  "B016EXMW02：推荐对象尚未人工留痕；请在右侧点击加入复盘或记录观察，真实写入只能由人工按钮触发，不要自动执行广告动作。",
);

assertEqual(
  recommendedManualStatusText({
    recommended_manual_status: {
      will_write: false,
      signal_id: "sig-ad-product-no-strategy",
      object_id: "B016EXMW02",
      object_label: "B016EXMW02",
      has_manual_action: true,
      manual_action_count: 1,
      has_review_todo: true,
      review_todo_count: 2,
      ready_review_count: 0,
      review_windows: ["7d", "14d"],
    },
  }),
  "B016EXMW02：已生成 2 条复盘待办，等待 7 天 / 14 天完整窗口后再判断效果。",
);

assertIncludes(
  recommendedManualStatusText({
    next_action:
      "推荐对象已人工留痕并等待复盘；可继续人工确认下一个未留痕候选 RBK004-RBK004-2 深蓝 的 add_to_review；真实写入只能由人工按钮触发，不要自动执行广告动作。",
    recommended_manual_status: {
      will_write: false,
      signal_id: "sig-ad-product-no-strategy",
      object_id: "B016EXMW02",
      object_label: "B016EXMW02",
      has_manual_action: true,
      manual_action_count: 1,
      has_review_todo: true,
      review_todo_count: 2,
      ready_review_count: 0,
      review_windows: ["7d", "14d"],
      next_action: "推荐对象已人工留痕并生成复盘待办；等待 7 天 / 14 天完整窗口后再判断效果。",
    },
  }) ?? "",
  "下一个未留痕候选 RBK004-RBK004-2 深蓝",
);

const handledRecommendedCardCopy = recommendedManualActionCardCopy({
  recommended_manual_status: {
    object_label: "B016EXMW02",
    has_manual_action: true,
    has_review_todo: true,
    next_action: "推荐对象已人工留痕并生成复盘待办；等待 7 天 / 14 天完整窗口后再判断效果。",
  },
  next_unhandled_candidate: {
    object_label: "RBK004-RBK004-2 深蓝",
    stable_object_id: "B06VW5SQ97",
  },
});
assertEqual(handledRecommendedCardCopy.ariaLabel, "推荐对象复盘等待");
assertEqual(handledRecommendedCardCopy.title, "推荐对象复盘等待");
assertEqual(handledRecommendedCardCopy.buttonText, "查看复盘对象");
assertEqual(handledRecommendedCardCopy.buttonAriaLabel, "查看已留痕推荐对象 B016EXMW02 的复盘等待状态");

const noActionableCandidateCardCopy = recommendedManualActionCardCopy({
  actionability_status: {
    status: "no_actionable_candidate",
    can_write_manual_action: false,
    diagnosis_mode: "product_scope_drilldown",
    message: "当前经营对象已有广告下钻数据，但没有命中可进入人工确认的广告对象级候选；只能作为诊断视图，不能写人工动作。",
  },
  signal_status: { signal_count: 0, candidate_count: 0 },
  product_scope_drilldown: {
    scope_id: "parent_asin:B00K4W4AAA",
    scope_type: "parent_asin",
    status: "ready",
    advertised_asin_count: 3,
    items: [],
    summary: "当前商品范围广告 ASIN 3 个。",
    boundary: "广告 ASIN 指标来自 advertised_products。",
  },
});
assertEqual(noActionableCandidateCardCopy.title, "暂无可行动候选");
assertEqual(noActionableCandidateCardCopy.buttonText, "查看诊断");
assertIncludes(noActionableCandidateCardCopy.buttonAriaLabel, "只能作为诊断视图");

const noActionableAdmissionCard = buildProductScopeAdmissionCard({
  actionability_status: {
    status: "no_actionable_candidate",
    can_write_manual_action: false,
    diagnosis_mode: "product_scope_drilldown",
    message: "当前经营对象已有广告下钻数据，但没有命中可进入人工确认的广告对象级候选；只能作为诊断视图，不能写人工动作。",
    next_step: "先按广告 ASIN、广告组、投放词、搜索词和广告位复核数据关系；不要写入人工动作。",
    manual_gate_title: "API 准入门禁标题",
    boundary: "API 边界：candidate_count=0，不能写人工动作。",
    allowed_paths: ["API 允许：继续下钻搜索词", "API 允许：等待下一次快照"],
    forbidden_actions: ["API 禁止：自动否词", "API 禁止：自动调价"],
  },
  signal_status: { signal_count: 0, candidate_count: 0 },
  product_scope_drilldown: {
    scope_id: "parent_asin:B00K4W4AAA",
    scope_type: "parent_asin",
    status: "ready",
    advertised_asin_count: 3,
    items: [
      {
        asin: "B000TEST01",
        spend: 20,
        clicks: 30,
        orders: 2,
        sales: 40,
        ad_product_row_count: 1,
        top_ad_group: {
          ad_group_name: "RBK004-kids sunglasses-广泛",
          spend: 20,
          clicks: 30,
          orders: 2,
          sales: 40,
          search_term_count: 2,
          placement_count: 1,
          campaign_placement_count: 3,
          ad_group_advertised_asin_count: 2,
          ad_group_advertised_asins: ["B000TEST01", "B000TEST02"],
          ad_group_attribution_boundary: "同广告组投放 2 个广告 ASIN；搜索词和广告位只能说明广告组上下文，不能自动归因到单个 ASIN。",
          effective_search_terms: [{ search_term: "kids sunglasses", spend: 8, clicks: 12, orders: 2, sales: 40 }],
          zero_order_search_terms: [{ search_term: "baby sunglasses", spend: 5, clicks: 8, orders: 0, sales: 0 }],
        },
      },
    ],
    summary: "当前商品范围广告 ASIN 3 个。",
    boundary: "搜索词和广告位只说明同广告组上下文，不能自动归因到单个 ASIN，也不能自动执行广告动作。",
  },
});
if (!noActionableAdmissionCard) {
  throw new Error("无可行动候选时应返回 AI 信号准入卡片");
}
assertEqual(noActionableAdmissionCard.title, "AI 信号准入：暂不进入人工动作");
assertEqual(noActionableAdmissionCard.statusLabel, "只能诊断");
assertEqual(noActionableAdmissionCard.tone, "blocked");
assertIncludes(noActionableAdmissionCard.conclusion, "没有命中可进入人工确认");
assertIncludes(noActionableAdmissionCard.nextStep, "广告 ASIN、广告组、投放词、搜索词和广告位");
assertIncludes(noActionableAdmissionCard.manualActionBoundary, "candidate_count=0");
assertIncludes(noActionableAdmissionCard.manualActionBoundary, "不能写人工动作");
assertIncludes(
  noActionableAdmissionCard.evidenceItems.map((item) => `${item.label} ${item.value} ${item.detail}`).join(" / "),
  "广告 ASIN 覆盖",
);

const parentDiagnosisScope: ProductScopeFilterOption = {
  scope_id: "parent_asin:B00K4W4AAA",
  scope_type: "parent_asin",
  label: "Parent ASIN B00K4W4AAA",
  parent_asin: "B00K4W4AAA",
  child_asins: [
    "B016EXMVZS",
    "B016EXMW02",
    "B07BS9754Q",
    "B01MTEST01",
    "B01MTEST02",
    "B01MTEST03",
    "B01MTEST04",
    "B01MTEST05",
    "B01MTEST06",
    "B01MTEST07",
    "B01MTEST08",
    "B01MTEST09",
  ],
  ad_spend: 764.11,
  ad_orders: 281,
  ad_sales: 2715.06,
  sales_orders: 24591,
  sales_amount: 262341.49,
};

const parentDiagnosisSummary = {
  actionability_status: {
    status: "no_actionable_candidate",
    can_write_manual_action: false,
    diagnosis_mode: "product_scope_drilldown",
    message: "当前经营对象已有广告下钻数据，但没有命中可进入人工确认的广告对象级候选；只能作为诊断视图，不能写人工动作。",
    next_step: "先按广告 ASIN、广告组、投放词、搜索词和广告位复核数据关系；不要写入人工动作。",
    manual_gate_title: "API 准入门禁标题",
    boundary: "API 边界：candidate_count=0，不能写人工动作。",
    allowed_paths: ["API 允许：继续下钻搜索词", "API 允许：等待下一次快照"],
    forbidden_actions: ["API 禁止：自动否词", "API 禁止：自动调价"],
  },
  signal_status: { signal_count: 0, candidate_count: 0 },
  product_scope_drilldown: {
    scope_id: "parent_asin:B00K4W4AAA",
    scope_type: "parent_asin",
    status: "ready",
    advertised_asin_count: 3,
    items: [
      {
        asin: "B016EXMVZS",
        spend: 320.12,
        clicks: 210,
        orders: 118,
        sales: 1180.5,
        ad_product_row_count: 2,
        top_ad_group: {
          ad_group_name: "RBK004-kids sunglasses-广泛",
          spend: 180.21,
          clicks: 126,
          orders: 48,
          sales: 540.3,
          search_term_count: 18,
          placement_count: 0,
          campaign_placement_count: 4,
          ad_group_advertised_asin_count: 2,
          ad_group_advertised_asins: ["B016EXMVZS", "B016EXMW02"],
          ad_group_attribution_boundary: "同广告组投放 2 个广告 ASIN；搜索词和广告位只能说明广告组上下文，不能自动归因到单个 ASIN。",
          effective_search_terms: [{ search_term: "kids sunglasses", spend: 18, clicks: 42, orders: 9, sales: 120 }],
          zero_order_search_terms: [{ search_term: "baby sunglasses", spend: 9, clicks: 20, orders: 0, sales: 0 }],
        },
      },
    ],
    ad_group_diagnosis: [
      {
        campaign_id: "camp-1",
        campaign_name: "RBK004-kids sunglasses-广泛",
        ad_group_id: "group-1",
        ad_group_name: "RBK004-kids sunglasses-广泛",
        spend: 152.59,
        clicks: 139,
        orders: 69,
        sales: 686.98,
        acos: 0.2221,
        cvr: 0.4964,
        ad_group_advertised_asin_count: 2,
        ad_group_advertised_asins: ["B016EXMVZS", "B016EXMW02"],
        search_term_count: 18,
        effective_search_term_count: 3,
        zero_order_search_term_count: 3,
        placement_count: 0,
        campaign_placement_count: 4,
        diagnosis_status: "observe",
        diagnosis_label: "观察",
        problem_type: "投放结构失衡",
        reason: "RBK004-kids sunglasses-广泛 整体有订单，但存在 3 个无订单花费词样本，适合继续下钻观察。",
        evidence: "订单 69 / 无订单花费词 3 / 搜索词 18",
        next_review_focus: "优先比较有效搜索词和无订单花费词；没有候选准入前只做诊断。",
        attribution_boundary: "同广告组投放 2 个广告 ASIN；搜索词和广告位只能说明广告组上下文，不能自动归因到单个 ASIN。",
        forbidden_actions: ["自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
        search_term_diagnosis: {
          term_summary: "有效搜索词 1 条 / 无订单花费词 1 条",
          effective_terms: [{ search_term: "kids sunglasses", term_type: "regular", spend: 18, clicks: 42, orders: 9, sales: 120 }],
          zero_order_terms: [{ search_term: "baby sunglasses", term_type: "regular", spend: 9, clicks: 20, orders: 0, sales: 0 }],
          term_boundary: "搜索词只说明同广告组上下文，不能自动归因到单个 ASIN；ASIN 型搜索词只能作为商品定向或自动投放上下文复核，不包装成关键词加词建议。",
          next_review_focus: "优先比较有效搜索词和无订单花费词；没有候选准入前只做诊断。",
          forbidden_actions: ["自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
        },
      },
    ],
    summary: "当前商品范围广告 ASIN 3 个，广告花费 $764.11，广告订单 281；先看广告 ASIN，再下钻广告组、投放词、搜索词和广告位。",
    boundary: "搜索词和广告位只说明同广告组上下文，不能自动归因到单个 ASIN，也不能自动执行广告动作。",
  },
};

const diagnosisContextSummary = buildDiagnosisContextSummary(parentDiagnosisScope, parentDiagnosisSummary);
if (!diagnosisContextSummary) {
  throw new Error("Parent ASIN 应返回当前诊断上下文摘要");
}
assertEqual(diagnosisContextSummary.title, "当前诊断上下文");
assertEqual(diagnosisContextSummary.statusLabel, "只能诊断");
assertEqual(diagnosisContextSummary.tone, "blocked");
assertIncludes(
  diagnosisContextSummary.items.map((item) => `${item.label} ${item.value} ${item.detail ?? ""}`).join(" / "),
  "Parent ASIN B00K4W4AAA",
);
assertIncludes(
  diagnosisContextSummary.items.map((item) => `${item.label} ${item.value} ${item.detail ?? ""}`).join(" / "),
  "3 个广告 ASIN",
);
assertIncludes(
  diagnosisContextSummary.items.map((item) => `${item.label} ${item.value} ${item.detail ?? ""}`).join(" / "),
  "0 个",
);
assertIncludes(diagnosisContextSummary.boundary, "不能自动归因");

const diagnosisPathSummary = buildDiagnosisPathSummary(parentDiagnosisScope, parentDiagnosisSummary);
if (!diagnosisPathSummary) {
  throw new Error("Parent ASIN 应返回左侧诊断路径摘要");
}
assertEqual(diagnosisPathSummary.title, "当前诊断路径");
assertIncludes(diagnosisPathSummary.description, "Parent ASIN -> 广告 ASIN -> 广告组 -> 搜索词/广告位 -> AI 准入");
assertIncludes(
  diagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "RBK004-kids sunglasses-广泛",
);
assertIncludes(
  diagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "搜索词 18 条",
);
assertIncludes(
  diagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "只能诊断",
);
assertIncludes(diagnosisPathSummary.boundary, "不能写人工动作");

const productScopeEvidenceMatrix = buildProductScopeEvidenceMatrix(parentDiagnosisScope, parentDiagnosisSummary);
if (!productScopeEvidenceMatrix) {
  throw new Error("Parent ASIN 应返回对象证据矩阵");
}
assertEqual(productScopeEvidenceMatrix.title, "对象证据矩阵");
assertIncludes(productScopeEvidenceMatrix.summary, "Parent ASIN -> 广告 ASIN -> 广告组 -> 搜索词/广告位 -> AI 准入");
assertEqual(productScopeEvidenceMatrix.rows.length, 5);
assertIncludes(
  productScopeEvidenceMatrix.rows.map((row) => `${row.layerLabel} ${row.objectLabel} ${row.evidenceLabel} ${row.value} ${row.detail}`).join(" / "),
  "经营入口 Parent ASIN B00K4W4AAA",
);
assertIncludes(
  productScopeEvidenceMatrix.rows.map((row) => `${row.layerLabel} ${row.objectLabel} ${row.evidenceLabel} ${row.value} ${row.detail}`).join(" / "),
  "销售表现子 ASIN 12 个",
);
assertIncludes(
  productScopeEvidenceMatrix.rows.map((row) => `${row.layerLabel} ${row.objectLabel} ${row.evidenceLabel} ${row.value} ${row.detail}`).join(" / "),
  "广告 ASIN B016EXMVZS",
);
assertIncludes(
  productScopeEvidenceMatrix.rows.map((row) => `${row.layerLabel} ${row.objectLabel} ${row.evidenceLabel} ${row.value} ${row.detail}`).join(" / "),
  "广告组 RBK004-kids sunglasses-广泛",
);
assertIncludes(
  productScopeEvidenceMatrix.rows.map((row) => `${row.layerLabel} ${row.objectLabel} ${row.evidenceLabel} ${row.value} ${row.detail}`).join(" / "),
  "同组 2 个广告 ASIN",
);
assertIncludes(
  productScopeEvidenceMatrix.rows.map((row) => `${row.layerLabel} ${row.objectLabel} ${row.evidenceLabel} ${row.value} ${row.detail}`).join(" / "),
  "kids sunglasses",
);
assertIncludes(
  productScopeEvidenceMatrix.rows.map((row) => `${row.layerLabel} ${row.objectLabel} ${row.evidenceLabel} ${row.value} ${row.detail}`).join(" / "),
  "baby sunglasses",
);
assertIncludes(
  productScopeEvidenceMatrix.rows.map((row) => `${row.layerLabel} ${row.objectLabel} ${row.evidenceLabel} ${row.value} ${row.detail}`).join(" / "),
  "AI 准入 只能诊断 / 候选 0 个",
);
assertIncludes(productScopeEvidenceMatrix.rows.find((row) => row.layerId === "admission")?.detail ?? "", "candidate_count=0");
assertIncludes(productScopeEvidenceMatrix.boundary, "不能自动归因");

const productScopeEvidenceRouteGuide = buildProductScopeEvidenceRouteGuide(productScopeEvidenceMatrix);
assertEqual(productScopeEvidenceRouteGuide.title, "广告证据链导览");
assertIncludes(productScopeEvidenceRouteGuide.summary, "先看经营入口，再看广告 ASIN、广告组、搜索词/广告位和人工确认门禁");
assertEqual(productScopeEvidenceRouteGuide.steps.length, 5);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "1 经营入口 Parent ASIN B00K4W4AAA",
);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "2 广告 ASIN B016EXMVZS",
);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "3 广告组 RBK004-kids sunglasses-广泛",
);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "4 搜索词/广告位 搜索词 18 条 / 广告位 0 条",
);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "5 人工确认 只能诊断 / 候选 0 个",
);
assertIncludes(productScopeEvidenceRouteGuide.boundary, "不能自动归因");

const adGroupDiagnosisRows = productScopeAdGroupDiagnosisRows(parentDiagnosisSummary);
assertEqual(adGroupDiagnosisRows.length, 1);
assertEqual(adGroupDiagnosisRows[0].title, "RBK004-kids sunglasses-广泛");
assertEqual(adGroupDiagnosisRows[0].statusLabel, "观察");
assertEqual(adGroupDiagnosisRows[0].statusTone, "observe");
assertEqual(adGroupDiagnosisRows[0].problemType, "投放结构失衡");
assertIncludes(adGroupDiagnosisRows[0].metrics, "花费 152.59");
assertIncludes(adGroupDiagnosisRows[0].metrics, "ACOS 22.2%");
assertIncludes(adGroupDiagnosisRows[0].trafficContext, "广告 ASIN 2 个");
assertIncludes(adGroupDiagnosisRows[0].trafficContext, "搜索词 18 条");
assertIncludes(adGroupDiagnosisRows[0].reason, "无订单花费词");
assertIncludes(adGroupDiagnosisRows[0].advertisedAsins.join(" / "), "B016EXMW02");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.title, "优先复核 RBK004-kids sunglasses-广泛");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.evidence, "有效词 3 条 / 无订单花费词 3 条 / 广告 ASIN 2 个");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.decision, "广告组整体有转化");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.decision, "词意图分化");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.manualGate, "候选 0 个");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.manualGate, "只做诊断");
assertIncludes(adGroupDiagnosisRows[0].boundary, "不能自动归因");
assertIncludes(adGroupDiagnosisRows[0].forbiddenActions.join(" / "), "自动调价");
assertEqual(adGroupDiagnosisRows[0].searchTermDiagnosis?.termSummary, "有效搜索词 1 条 / 无订单花费词 1 条");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.effectiveTerms.map((term) => term.label).join(" / ") ?? "", "kids sunglasses");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.zeroOrderTerms.map((term) => term.label).join(" / ") ?? "", "baby sunglasses");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.termBoundary ?? "", "ASIN 型搜索词");

const manualActionAdGroupBridge = buildManualActionCandidateAdGroupBridge(
  backendRecommendedManualActionCandidate?.manualActionPreview ?? null,
  adGroupDiagnosisRows,
);
if (!manualActionAdGroupBridge) {
  throw new Error("右侧候选应返回广告组关系说明");
}
assertEqual(manualActionAdGroupBridge.title, "人工候选与广告组关系");
assertIncludes(manualActionAdGroupBridge.evidence, "B016EXMW02");
assertIncludes(manualActionAdGroupBridge.evidence, "RBK004-kids sunglasses-广泛");
assertIncludes(manualActionAdGroupBridge.evidence, "投放商品");
assertIncludes(manualActionAdGroupBridge.decision, "沿用中间广告组判断");
assertIncludes(manualActionAdGroupBridge.boundary, "广告组是投放容器");
assertIncludes(manualActionAdGroupBridge.boundary, "不自动执行广告动作");

const noActionableManualGate = buildNoActionableManualGate(parentDiagnosisSummary);
if (!noActionableManualGate) {
  throw new Error("candidate_count=0 时右侧应返回无候选人工动作门禁");
}
assertEqual(noActionableManualGate.statusLabel, "只能诊断");
assertIncludes(noActionableManualGate.reason, "没有命中可进入人工确认");
assertIncludes(noActionableManualGate.nextStep, "广告 ASIN、广告组、投放词、搜索词和广告位");
assertEqual(noActionableManualGate.title, "API 准入门禁标题");
assertEqual(noActionableManualGate.boundary, "API 边界：candidate_count=0，不能写人工动作。");
assertIncludes(noActionableManualGate.allowedPaths.join(" / "), "API 允许：继续下钻搜索词");
assertIncludes(noActionableManualGate.allowedPaths.join(" / "), "API 允许：等待下一次快照");
assertIncludes(noActionableManualGate.forbiddenEffects.join(" / "), "API 禁止：自动调价");
assertIncludes(noActionableManualGate.forbiddenEffects.join(" / "), "API 禁止：自动否词");
assertEqual(
  canRecommendManualActionFromTriageSummary({
    actionability_status: {
      status: "no_actionable_candidate",
      can_write_manual_action: false,
    },
  }),
  false,
);
assertEqual(canRecommendManualActionFromTriageSummary({}), true);

const readySearchTermParentSummary = {
  ...parentDiagnosisSummary,
  status: "ready_for_manual_confirmation",
  signal_status: { signal_count: 3, candidate_count: 3 },
  actionability_status: {
    status: "ready_for_manual_confirmation",
    can_write_manual_action: true,
    diagnosis_mode: "manual_action",
    message: "已有可进入人工确认的广告对象级候选。",
    next_step: "由运营人工确认后写入留痕，并生成 7/14 天复盘待办。",
    manual_gate_title: "可进入人工确认",
    boundary: "只允许人工记录观察、标记已处理、加入复盘或忽略本次；不会自动执行广告动作。",
    allowed_paths: ["记录观察", "标记已处理", "加入复盘", "忽略本次"],
    forbidden_actions: ["自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
  },
  recommended_candidate: {
    signal_id: "sig-opportunity-search-term-1-beach-essentials",
    signal_type: "opportunity",
    signal_category: "search_term_opportunity",
    priority: "P0",
    confidence: "high",
    severity: 4,
    shop_id: "market:1",
    shop_name: "rivbos",
    market_id: 1,
    marketplace: "US",
    object_type: "search_term",
    object_id: "search_term:1:beach essentials",
    stable_object_id: "beach essentials",
    object_label: "beach essentials",
    summary: "搜索词 beach essentials 在 2 个投放上下文中转化稳定，存在合并放量机会",
    evidence_count: 11,
    freshness_status: "api_snapshot",
    problem_type: "机会扩量",
    evidence_strength: "高",
    attribution_boundary: "搜索词只能说明广告活动和广告组下的用户搜索表现，不能自动归因到单个广告 ASIN。",
    review_path: "待人工动作",
  },
  manual_action_preview: {
    will_write: false,
    signal_id: "sig-opportunity-search-term-1-beach-essentials",
    action_type: "add_to_review",
    object_type: "search_term",
    object_id: "search_term:1:beach essentials",
    object_label: "beach essentials",
    shop_id: "market:1",
    shop_name: "rivbos",
    market_id: 1,
    review_windows: ["7d", "14d"],
  },
};

const readyParentExplanation = buildProductScopeSignalExplanation(parentDiagnosisScope, {
  scopeSignalCount: 0,
  allSignalCount: 15,
  dataQualityCount: 1,
  advertisedAsinCount: 3,
  signalTriageSummary: readySearchTermParentSummary,
});
assertEqual(readyParentExplanation, null);

const readyDiagnosisContextSummary = buildDiagnosisContextSummary(parentDiagnosisScope, readySearchTermParentSummary);
if (!readyDiagnosisContextSummary) {
  throw new Error("ready Parent ASIN 应返回当前诊断上下文摘要");
}
assertEqual(readyDiagnosisContextSummary.statusLabel, "待人工确认");
assertIncludes(
  readyDiagnosisContextSummary.items.map((item) => `${item.label} ${item.value} ${item.detail ?? ""}`).join(" / "),
  "可处理候选 3 个",
);

const readyDiagnosisPathSummary = buildDiagnosisPathSummary(parentDiagnosisScope, readySearchTermParentSummary);
if (!readyDiagnosisPathSummary) {
  throw new Error("ready Parent ASIN 应返回当前诊断路径");
}
assertIncludes(
  readyDiagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "AI 准入 待人工确认 / 候选 3 个",
);
assertNotIncludes(readyDiagnosisPathSummary.boundary, "candidate_count=0");

const readyAdmissionCard = buildProductScopeAdmissionCard(readySearchTermParentSummary);
if (!readyAdmissionCard) {
  throw new Error("ready Parent ASIN 应返回 AI 准入卡片");
}
assertEqual(readyAdmissionCard.statusLabel, "待人工确认");
assertIncludes(readyAdmissionCard.nextStep, "7/14");

const readyNoActionableManualGate = buildNoActionableManualGate(readySearchTermParentSummary);
assertEqual(readyNoActionableManualGate, null);

const backendSearchTermSignal: ProductScopedSignalForUi = {
  id: "sig-opportunity-search-term-1-beach-essentials",
  signal_type: "opportunity",
  signal_category: "search_term_opportunity",
  market_id: 1,
  object_type: "search_term",
  severity: 4,
  status: "pending",
  freshness_status: "api_snapshot",
  evidence: {
    primary_object: {
      object_type: "search_term",
      object_id: "search_term:1:beach essentials",
      label: "beach essentials",
      search_term: "beach essentials",
    },
    source_rows: [],
  },
};

const mergedBackendTriageSignals = mergeBackendTriageSignals([], [backendSearchTermSignal], readySearchTermParentSummary);
assertEqual(mergedBackendTriageSignals.length, 1);
assertEqual(mergedBackendTriageSignals[0].id, "sig-opportunity-search-term-1-beach-essentials");

const mergedBackendTriageSignalsWithoutDuplicate = mergeBackendTriageSignals(
  [backendSearchTermSignal],
  [backendSearchTermSignal],
  readySearchTermParentSummary,
);
assertEqual(mergedBackendTriageSignalsWithoutDuplicate.length, 1);

assertEqual(
  signalTriageSummaryText({
    signal_status: { signal_count: 137, candidate_count: 135 },
    recommended_candidate: { stable_object_id: "B016EXMW02", object_label: "B016EXMW02" },
    review_status: { ready_count: 0 },
  }),
  "后端分诊：137 条信号 / 135 个候选；建议先看 B016EXMW02；暂无 ready 复盘。",
);

assertIncludes(
  signalTriageSummaryText({
    signal_status: { signal_count: 137, candidate_count: 135 },
    recommended_candidate: { stable_object_id: "B016EXMW02", object_label: "B016EXMW02" },
    review_status: {
      ready_count: 0,
      review_feedback: {
        total: 2,
        by_result: { improved: 1, worse: 1 },
        summary: "已保存 2 条复盘记录：improved 1 / worse 1。",
        rule_feedback: "复盘反馈只进入解释层，不自动调整广告动作或规则。",
      },
    },
  }),
  "复盘反馈：已保存 2 条复盘记录：improved 1 / worse 1。",
);

const waitingReviewReadinessGate = buildReviewReadinessGateSummary({
  review_status: {
    manual_action_count: 17,
    review_record_count: 0,
    ready_count: 0,
    not_ready_count: 10,
    review_wait_summary: {
      earliest_due_date: "2026-06-22",
      next_object_type: "advertised_product",
      next_object_label: "B016EXMVZS",
      message: "已有人工动作，但 7/14 天复盘窗口未到期。",
      next_step: "等到 2026-06-22 后再读取复盘窗口。",
      forbidden_actions: ["不拉取快照", "不保存复盘结论", "不自动改规则", "不自动执行广告动作"],
    },
    review_identity_audit: {
      status: "ready_for_readback",
      manual_action_count: 17,
      review_record_count: 0,
      effect_count: 10,
      missing_action_id_count: 0,
      missing_object_id_count: 0,
      missing_review_window_count: 0,
      unstable_object_id_count: 0,
      ready_review_count: 0,
      can_save_review_records_now: false,
      earliest_due_date: "2026-06-21",
      earliest_metric_due_date: "2026-06-22",
      issues: [],
      readback_keys: [],
    },
  },
});
assertEqual(waitingReviewReadinessGate?.title, "复盘等待窗口");
assertEqual(waitingReviewReadinessGate?.status, "waiting");
assertIncludes(waitingReviewReadinessGate?.primary ?? "", "17 条人工留痕");
assertIncludes(waitingReviewReadinessGate?.primary ?? "", "ready 复盘 0 个");
assertIncludes(waitingReviewReadinessGate?.primary ?? "", "2026-06-22");
assertIncludes(waitingReviewReadinessGate?.detail ?? "", "B016EXMVZS");
assertIncludes(waitingReviewReadinessGate?.boundary ?? "", "不保存复盘结论");
assertIncludes(waitingReviewReadinessGate?.boundary ?? "", "不自动执行广告动作");
assertEqual(waitingReviewReadinessGate?.items[0].label, "人工留痕");
assertEqual(waitingReviewReadinessGate?.items[0].value, "17 条");
assertEqual(waitingReviewReadinessGate?.items[2].label, "最早复盘");
assertEqual(waitingReviewReadinessGate?.items[2].value, "2026-06-22");
assertEqual(waitingReviewReadinessGate?.nextSteps.length, 3);
assertEqual(waitingReviewReadinessGate?.nextSteps[0].label, "现在");
assertIncludes(waitingReviewReadinessGate?.nextSteps[0].detail ?? "", "查看当前人工留痕和复盘待办");
assertIncludes(waitingReviewReadinessGate?.nextSteps[0].detail ?? "", "不拉取快照");
assertEqual(waitingReviewReadinessGate?.nextSteps[1].label, "到期后");
assertIncludes(waitingReviewReadinessGate?.nextSteps[1].detail ?? "", "2026-06-22 后只读检查复盘效果");
assertEqual(waitingReviewReadinessGate?.nextSteps[2].label, "ready 后");
assertIncludes(waitingReviewReadinessGate?.nextSteps[2].detail ?? "", "人工确认后再保存 review_records");
assertEqual(waitingReviewReadinessGate?.identityAudit?.title, "复盘读回身份门禁");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.summary ?? "", "读回身份可审计");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.summary ?? "", "缺失 action_id / object_id / review_window：0 / 0 / 0");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.summary ?? "", "广告指标最早复盘：2026-06-22");
assertEqual(waitingReviewReadinessGate?.identityAudit?.items[2].label, "历史对象 ID 风险");
assertEqual(waitingReviewReadinessGate?.identityAudit?.items[2].value, "0");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.boundary ?? "", "当前不能保存复盘记录");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.boundary ?? "", "ready_for_readback 只表示可按原动作读回对象");

const readyReviewReadinessGate = buildReviewReadinessGateSummary({
  review_status: {
    manual_action_count: 17,
    review_record_count: 0,
    ready_count: 2,
    not_ready_count: 8,
    rule_improvement: {
      status: "waiting_manual_review_record",
      next_step: "先人工确认 ready 复盘，再保存 review_records。",
    },
  },
});
assertEqual(readyReviewReadinessGate?.title, "复盘可保存门槛");
assertEqual(readyReviewReadinessGate?.status, "ready");
assertIncludes(readyReviewReadinessGate?.primary ?? "", "2 个 ready 复盘");
assertIncludes(readyReviewReadinessGate?.boundary ?? "", "仍需人工确认");
assertIncludes(readyReviewReadinessGate?.boundary ?? "", "不自动执行广告动作");
assertIncludes(readyReviewReadinessGate?.nextSteps[0].detail ?? "", "先人工核对 ready 复盘");
assertIncludes(readyReviewReadinessGate?.nextSteps[1].detail ?? "", "手动保存 review_records");
assertIncludes(readyReviewReadinessGate?.nextSteps[2].detail ?? "", "仅进入人工规则复核");

const triageReviewFeedbackSummary = {
  signal_status: { signal_count: 137, candidate_count: 135 },
  recommended_candidate: { stable_object_id: "B016EXMW02", object_label: "B016EXMW02" },
  review_status: {
    ready_count: 0,
    review_feedback: {
      total: 2,
      by_result: { improved: 1, worse: 1 },
      by_signal_type: { opportunity: 1, anomaly: 1 },
      sample_sort: {
        order: ["worse", "no_change", "unclear", "improved"],
        reason: "样本按业务风险排序：worse 优先，因为处理后效果变差；no_change 其次，因为建议可能无效；unclear 需要补证据；improved 只作为保留口径参考。",
      },
      action_boundaries: {
        worse: {
          result: "worse",
          allowed_reviews: ["复核阈值", "复核证据来源", "复核建议动作"],
          forbidden_actions: ["自动改规则", "自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
          boundary: "worse 只能触发人工复核阈值、证据来源和建议动作；不自动改规则，不自动执行广告动作。",
        },
        improved: {
          result: "improved",
          allowed_reviews: ["保留当前解释口径", "沉淀正向样本"],
          forbidden_actions: ["自动改规则", "自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
          boundary: "improved 只能作为保留当前解释口径和沉淀正向样本参考；不自动改规则，不自动执行广告动作。",
        },
      },
      closure_checklist: [
        { check_id: "result_distribution", label: "复盘结果分布", status: "ready", evidence: "复盘结果：worse 1 / improved 1" },
        {
          check_id: "sample_priority",
          label: "样本优先级",
          status: "ready",
          evidence: "排序：worse -> no_change -> unclear -> improved",
        },
        { check_id: "evidence_trace", label: "证据追溯", status: "partial", evidence: "1 / 2 条样本带证据分组" },
        {
          check_id: "review_record_trace",
          label: "复盘记录来源",
          status: "partial",
          evidence: "1 / 2 条样本带 review_record_id / action_id / 指标窗口",
        },
        {
          check_id: "action_boundary",
          label: "动作边界",
          status: "ready",
          evidence: "只允许人工复核；不自动改规则，不自动执行广告动作",
        },
      ],
      records: [
        {
          review_record_id: "review-record-worse-7d",
          signal_id: "sig-anomaly",
          action_id: "manual-action-worse",
          signal_type: "anomaly",
          result: "worse",
          object_type: "search_term",
          object_id: "12 month sunglasses",
          object_label: "12 month sunglasses",
          review_window: "7d",
          metric_window: {
            before: "2026-06-01 至 2026-06-07",
            after: "2026-06-08 至 2026-06-14",
          },
          review_note: "建议没有改善",
          sort_reason: "排序依据：worse 优先，因为处理后效果变差，先复核阈值、证据来源和建议动作。",
          action_boundary: {
            result: "worse",
            allowed_reviews: ["复核阈值", "复核证据来源", "复核建议动作"],
            forbidden_actions: ["自动改规则", "自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
            boundary: "worse 只能触发人工复核阈值、证据来源和建议动作；不自动改规则，不自动执行广告动作。",
          },
          evidence_drilldown: {
            summary: "广告商品投放行 0 条，覆盖广告活动 0 个 / 广告组 0 个；同广告组搜索词上下文 1 条、广告位上下文 0 条；搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。",
          },
          evidence_groups: [
            { group_id: "product_metrics", label: "商品指标", value: "广告商品投放行 0 条" },
            { group_id: "search_term_context", label: "搜索词上下文", value: "1 条" },
            { group_id: "placement_context", label: "广告位上下文", value: "0 条" },
            { group_id: "boundary", label: "边界提示", value: "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。" },
          ],
        },
        {
          signal_id: "sig-opportunity",
          signal_type: "opportunity",
          result: "improved",
          object_type: "advertised_product",
          object_id: "B016EXMW02",
          object_label: "B016EXMW02",
          review_window: "14d",
          review_note: "处理有效",
        },
      ],
      candidate_groups: [
        {
          group_id: "search_intent:规则语义：海滩出行用品",
          group_type: "search_intent",
          group_label: "规则语义：海滩出行用品",
          aba_reference_term: "beach essentials",
          aba_period: "2026-05-10 到 2026-05-16",
          total: 1,
          by_result: { worse: 1 },
          priority_result: "worse",
          sample_review_record_ids: ["review-record-worse-7d"],
          sample_action_ids: ["manual-action-worse"],
          recommendation: "worse 1：优先复核该语义组的阈值、证据来源和建议动作。",
          boundary: "候选只进入解释层和人工复核，不自动改规则，不自动执行广告动作。",
        },
      ],
      summary: "已保存 2 条复盘记录：improved 1 / worse 1。",
      rule_feedback: "处理有效，同类信号可保留当前解释口径；处理后效果变差，下次同类信号应复核阈值、证据来源和建议动作；该反馈只进入解释层，不自动调整广告动作或规则。",
    },
  },
};
assertIncludes(signalTriageReviewFeedbackText(triageReviewFeedbackSummary) ?? "", "复盘反馈：已保存 2 条复盘记录");
assertIncludes(signalTriageReviewFeedbackText(triageReviewFeedbackSummary) ?? "", "复核阈值");
assertIncludes(signalTriageReviewFeedbackText(triageReviewFeedbackSummary) ?? "", "不自动调整广告动作或规则");
const ruleFeedbackPrioritySummary = buildRuleFeedbackPrioritySummary(triageReviewFeedbackSummary);
assertEqual(ruleFeedbackPrioritySummary?.title, "已保存复盘样本池");
assertIncludes(ruleFeedbackPrioritySummary?.basis ?? "", "opportunity 1 / anomaly 1");
assertIncludes(ruleFeedbackPrioritySummary?.basis ?? "", "来自已保存 ReviewRecord");
assertIncludes(ruleFeedbackPrioritySummary?.priority ?? "", "worse 1");
assertIncludes(ruleFeedbackPrioritySummary?.priority ?? "", "优先复核阈值、证据来源和建议动作");
assertIncludes(ruleFeedbackPrioritySummary?.sampleSort ?? "", "worse 优先");
assertIncludes(ruleFeedbackPrioritySummary?.sampleSort ?? "", "improved 只作为保留口径参考");
assertIncludes(ruleFeedbackPrioritySummary?.actionBoundary ?? "", "worse：复核阈值 / 复核证据来源 / 复核建议动作");
assertIncludes(ruleFeedbackPrioritySummary?.actionBoundary ?? "", "不自动改规则");
assertIncludes(ruleFeedbackPrioritySummary?.actionBoundary ?? "", "不自动执行广告动作");
assertEqual(ruleFeedbackPrioritySummary?.closureChecklist.length, 5);
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[0] ?? "", "复盘结果分布 ready");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[0] ?? "", "worse 1");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[2] ?? "", "证据追溯 partial");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[2] ?? "", "1 / 2 条样本带证据分组");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[3] ?? "", "复盘记录来源 partial");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[3] ?? "", "review_record_id / action_id / 指标窗口");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[4] ?? "", "不自动执行广告动作");
assertEqual(ruleFeedbackPrioritySummary?.records.length, 2);
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "worse / anomaly / search_term / 12 month sunglasses / 7d");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "复盘记录：review-record-worse-7d / action_id manual-action-worse");
assertIncludes(
  ruleFeedbackPrioritySummary?.records[0] ?? "",
  "指标窗口：2026-06-01 至 2026-06-07 -> 2026-06-08 至 2026-06-14",
);
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "建议没有改善");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "排序依据：worse 优先");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "动作边界：复核阈值 / 复核证据来源 / 复核建议动作");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "不自动执行广告动作");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "证据回看：广告商品投放行 0 条");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "搜索词上下文 1 条");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "证据分组：商品指标：广告商品投放行 0 条");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "搜索词上下文：1 条");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "广告位上下文：0 条");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "边界提示：搜索词和广告位只说明同广告组上下文");
assertIncludes(ruleFeedbackPrioritySummary?.records[1] ?? "", "improved / opportunity / advertised_product / B016EXMW02 / 14d");
assertEqual(ruleFeedbackPrioritySummary?.candidateGroups.length, 1);
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "规则语义：海滩出行用品");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "worse 1");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "beach essentials");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "不自动改规则");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "不自动执行广告动作");
assertIncludes(ruleFeedbackPrioritySummary?.boundary ?? "", "只进入解释层");
assertIncludes(ruleFeedbackPrioritySummary?.boundary ?? "", "不代表当前选中信号已 ready");
assertIncludes(ruleFeedbackPrioritySummary?.boundary ?? "", "不自动改规则");
assertIncludes(ruleFeedbackPrioritySummary?.boundary ?? "", "不自动执行广告动作");

const triageWithoutSavedReviewFeedback = {
  signal_status: { signal_count: 137, candidate_count: 135 },
  recommended_candidate: { stable_object_id: "B016EXMW02", object_label: "B016EXMW02" },
  review_status: {
    ready_count: 0,
    review_feedback: {
      total: 0,
      by_result: {},
      closure_checklist: [
        { check_id: "result_distribution", label: "复盘结果分布", status: "blocked", evidence: "复盘结果：暂无" },
        { check_id: "sample_priority", label: "样本优先级", status: "ready", evidence: "排序：worse -> no_change -> unclear -> improved" },
        {
          check_id: "manual_action_context",
          label: "复盘输入证据",
          status: "partial",
          evidence: "人工动作 2 条，证据快照 1 条，语义组 1 条，ABA参考 1 条",
        },
        { check_id: "evidence_trace", label: "证据追溯", status: "blocked", evidence: "0 / 0 条样本带证据分组" },
        { check_id: "action_boundary", label: "动作边界", status: "ready", evidence: "只允许人工复核；不自动改规则，不自动执行广告动作" },
      ],
      summary: "暂无已保存复盘记录。",
      rule_feedback: "暂无复盘结果：保留当前信号解释口径，不调整规则。",
    },
  },
};
assertEqual(signalTriageReviewFeedbackText(triageWithoutSavedReviewFeedback), null);
assertEqual(signalTriageSummaryText(triageWithoutSavedReviewFeedback).includes("复盘反馈"), false);
const blockedRuleFeedbackPrioritySummary = buildRuleFeedbackPrioritySummary(triageWithoutSavedReviewFeedback);
assertEqual(blockedRuleFeedbackPrioritySummary?.title, "已保存复盘样本池");
assertIncludes(blockedRuleFeedbackPrioritySummary?.basis ?? "", "复盘结果：待补齐");
assertIncludes(blockedRuleFeedbackPrioritySummary?.closureChecklist[0] ?? "", "复盘结果分布 blocked");
assertIncludes(blockedRuleFeedbackPrioritySummary?.closureChecklist[2] ?? "", "复盘输入证据 partial");
assertIncludes(blockedRuleFeedbackPrioritySummary?.closureChecklist[2] ?? "", "证据快照 1 条");
assertIncludes(blockedRuleFeedbackPrioritySummary?.closureChecklist[3] ?? "", "证据追溯 blocked");
assertIncludes(blockedRuleFeedbackPrioritySummary?.closureChecklist[3] ?? "", "0 / 0 条样本带证据分组");
assertEqual(blockedRuleFeedbackPrioritySummary?.records.length, 0);

const triageCompactItems = signalTriageCompactItems({
  signal_status: { signal_count: 137, candidate_count: 135 },
  recommended_candidate: { stable_object_id: "B016EXMW02", object_label: "B016EXMW02" },
  review_status: { ready_count: 2 },
});
assertEqual(triageCompactItems.length, 4);
assertEqual(triageCompactItems[0].label, "信号");
assertEqual(triageCompactItems[0].value, "137");
assertEqual(triageCompactItems[1].label, "候选");
assertEqual(triageCompactItems[1].value, "135");
assertEqual(triageCompactItems[2].label, "推荐");
assertEqual(triageCompactItems[2].value, "B016EXMW02");
assertEqual(triageCompactItems[3].label, "ready 复盘");
assertEqual(triageCompactItems[3].value, "2");

const compactQueueMeta = buildSignalQueueMeta({
  ...staleSignal,
  object_type: "advertised_product",
  confidence: "medium",
  shop_name: "rivbos",
  marketplace: "US",
});
assertEqual(compactQueueMeta.primary.join(" / "), "广告商品 / 严重 4 / 置信 中");
assertEqual(compactQueueMeta.secondary, "rivbos / US / 数据过期 / 待确认");

const duplicateAdProductSignals = [
  {
    ...advertisedProductOpportunitySignal,
    id: "sig-b016-row-1",
    evidence: { primary_object: { object_type: "advertised_product", label: "B016EXMW02", asin: "B016EXMW02" } },
  },
  {
    ...advertisedProductOpportunitySignal,
    id: "sig-b016-row-2",
    evidence: { primary_object: { object_type: "advertised_product", label: "B016EXMW02", asin: "B016EXMW02" } },
  },
  {
    ...advertisedProductOpportunitySignal,
    id: "sig-b016-row-3",
    evidence: { primary_object: { object_type: "advertised_product", label: "B016EXMW02", asin: "B016EXMW02" } },
  },
] satisfies ProductScopedSignalForUi[];

const duplicateAdProductStatus = buildSignalQueueObjectStatus(duplicateAdProductSignals[0], duplicateAdProductSignals, [
  { object_id: "B016EXMW02", review_window: "7d" },
  { object_id: "B016EXMW02", review_window: "14d" },
]);

assertEqual(duplicateAdProductStatus.items.join(" / "), "同对象 3 条信号 / 复盘待办 2 条");

const visibleTriageBlockers = signalTriageBlockerTexts({
  blockers: [
    { code: "candidate_count_exceeds_top_limit", message: "候选数 15 大于本次展示上限 5，需要先按优先级和严重度分诊。" },
    { code: "missing_manual_action_preview", message: "候选存在，但缺少只读人工动作预览。" },
    {
      code: "no_ready_review_effect",
      message: "已有人工处理记录，但当前没有 ready 的 7/14 天复盘结果。复盘阻塞：7d：缺少处理后 7 天快照；14d：处理前 14 天窗口不足。",
    },
  ],
});
assertEqual(visibleTriageBlockers.length, 2);
assertIncludes(visibleTriageBlockers[0], "复盘阻塞");
assertIncludes(visibleTriageBlockers[0], "7d：缺少处理后 7 天快照");
assertIncludes(visibleTriageBlockers[0], "14d：处理前 14 天窗口不足");

assertEqual(
  signalTriageLayerText({
    candidate_layers: [
      { layer_id: "sales_strong_ad_weak", label: "销售强广告弱", count: 9, top_candidates: [] },
      { layer_id: "advertised_asin_opportunity", label: "广告 ASIN 机会", count: 3, top_candidates: [] },
      { layer_id: "strategy_boundary", label: "策略主推边界", count: 3, top_candidates: [] },
    ],
  }),
  "候选分层：销售强广告弱 9 / 广告 ASIN 机会 3 / 策略主推边界 3",
);

assertEqual(
  signalTriageDepthText({
    recommended_candidate: {
      object_label: "B016EXMW02",
      problem_type: "机会扩量",
      evidence_strength: "中",
      review_path: "待人工动作",
      attribution_boundary: "分析对象落到广告 ASIN；搜索词、广告位和广告组只作上下文证据，不能自动归因到该 ASIN。",
    },
  }),
  "深度分析：经营问题 机会扩量 / 证据强度 中 / 复盘路径 待人工动作 / 归因边界 分析对象落到广告 ASIN；搜索词、广告位和广告组只作上下文证据，不能自动归因到该 ASIN。",
);

assertEqual(
  signalTriageDepthText({
    recommended_candidate: {
      object_label: "B016EXMW02",
      problem_type: "机会扩量",
      evidence_strength: "中",
      review_path: "待 7d",
      attribution_boundary: "推荐对象已经人工留痕，等待复盘窗口。",
    },
    recommended_manual_status: {
      has_manual_action: true,
      has_review_todo: true,
    },
    next_unhandled_candidate: {
      object_label: "RBK004-RBK004-2 深蓝",
      stable_object_id: "B06VW5SQ97",
      problem_type: "销售承接不足",
      evidence_strength: "中",
      review_path: "待人工动作",
      attribution_boundary: "分析对象落到销售商品；广告承接必须通过广告 ASIN 覆盖和销售表现共同验证。",
    },
  }),
  "深度分析：待处理候选 RBK004-RBK004-2 深蓝 / 经营问题 销售承接不足 / 证据强度 中 / 复盘路径 待人工动作 / 归因边界 分析对象落到销售商品；广告承接必须通过广告 ASIN 覆盖和销售表现共同验证。",
);

const evidenceDrilldownText = recommendedEvidenceDrilldownText({
  recommended_evidence_drilldown: {
    object_label: "B016EXMW02",
    direct_ad_product_row_count: 1,
    search_term_context_count: 1,
    placement_context_count: 1,
    metric_summary: {
      basis: "recommended_evidence_rows",
      row_count: 2,
      spend: 40,
      clicks: 50,
      orders: 8,
      sales: 200,
      acos: 0.2,
      cvr: 0.16,
    },
    top_spend_campaign: { label: "RBK004-MANUAL", spend: 30, spend_share: 0.75 },
    top_spend_ad_group: { label: "RBK004-Exact", spend: 30, spend_share: 0.75 },
    ad_group_diagnosis: {
      basis: "advertised_products + same_ad_group_context",
      summary: "优先下钻广告组 RBK004-Exact：广告花费 30.00，广告订单 6，同广告组搜索词 4 条，广告位 1 条；同时核对搜索词与广告位，判断问题来自词流量还是流量位置。",
      top_ad_group: {
        campaign_name: "RBK004-MANUAL",
        ad_group_name: "RBK004-Exact",
        ad_product_row_count: 1,
        spend: 30,
        clicks: 30,
        orders: 6,
        sales: 150,
        search_term_count: 4,
        placement_count: 1,
        acos: 0.2,
        cvr: 0.2,
        is_top_spend_ad_group: true,
        diagnosis_focus: "同时核对搜索词与广告位，判断问题来自词流量还是流量位置。",
      },
      rows: [],
      boundary: "广告组是投放容器；这里只定位广告组问题来源，不自动执行广告动作。",
    },
    all_asin_ad_coverage: {
      basis: "raw_advertised_products",
      raw_ad_product_row_count: 3,
      recommended_ad_product_row_count: 2,
      missing_ad_product_row_count: 1,
      missing_reason_summary: { 未触发推荐证据的背景投放行: 1 },
      missing_ad_product_rows: [
        {
          campaign_name: "RBK004-BROAD",
          ad_group_name: "RBK004-Broad",
          spend: 5,
          orders: 1,
          coverage_reason: "未触发推荐证据的背景投放行",
        },
      ],
      coverage_ratio: 0.6667,
      metric_summary: {
        basis: "raw_advertised_products",
        row_count: 3,
        spend: 45,
        clicks: 60,
        orders: 9,
        sales: 225,
        acos: 0.2,
        cvr: 0.15,
      },
    },
    business_evidence_blocks: [
      {
        block_id: "ad_group_problem_location",
        label: "广告组问题定位",
        value: "RBK004-Exact / 花费 30.00 / 订单 6",
        detail: "同广告组搜索词 4 条 / 广告位 1 条；同时核对搜索词与广告位，判断问题来自词流量还是流量位置。",
        source: "advertised_products + ad_search_term_daily_metrics + ad_placement_daily_metrics",
      },
    ],
    ad_product_rows: [{ campaign_name: "RBK004-AUTO", ad_group_name: "RBK004-Auto", clicks: 20 }],
    boundary: "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。",
    summary: "广告商品投放行 1 条，覆盖广告活动 1 个 / 广告组 1 个。",
  },
});

assertIncludes(evidenceDrilldownText, "推荐证据：B016EXMW02");
assertIncludes(evidenceDrilldownText, "广告商品投放行 1 条");
assertIncludes(evidenceDrilldownText, "触发证据行合计：2 条 / 花费 40.00 / 订单 8 / 销售额 200.00 / ACOS 20.0% / CVR 16.0%");
assertIncludes(evidenceDrilldownText, "全量投放覆盖：raw 行 3 / 推荐证据 2 / 未覆盖 1 / 覆盖率 66.7%");
assertIncludes(evidenceDrilldownText, "未覆盖原因：未触发推荐证据的背景投放行 1 条");
assertIncludes(evidenceDrilldownText, "未覆盖投放行：RBK004-BROAD / RBK004-Broad 花费 5.00 订单 1");
assertIncludes(evidenceDrilldownText, "主要花费来源：RBK004-MANUAL，占比 75.0%");
assertIncludes(evidenceDrilldownText, "广告组问题定位：RBK004-Exact / 花费 30.00 / 订单 6");
assertIncludes(evidenceDrilldownText, "同时核对搜索词与广告位");
assertIncludes(evidenceDrilldownText, "RBK004-AUTO / RBK004-Auto");
assertIncludes(evidenceDrilldownText, "不能自动归因");

const nextUnhandledEvidenceText = nextUnhandledEvidenceDrilldownText({
  next_unhandled_candidate: {
    object_label: "RBK004-RBK004-2 深蓝",
    stable_object_id: "B06VW5SQ97",
  },
  next_unhandled_evidence_drilldown: {
    object_label: "RBK004-RBK004-2 深蓝",
    direct_ad_product_row_count: 0,
    search_term_context_count: 0,
    placement_context_count: 0,
    campaigns: [],
    ad_groups: [],
    metric_summary: {
      basis: "sales_product_daily_metrics",
      row_count: 1,
      spend: -64.92,
      clicks: null,
      orders: 251,
      sales: 2433.04,
      acos: null,
      cvr: null,
    },
    sales_product_summary: {
      basis: "sales_product_daily_metrics",
      row_count: 1,
      start_date: "2026-05-17",
      end_date: "2026-06-15",
      sessions: 2721,
      page_views: 2985,
      orders: 251,
      units: 260,
      sales: 2433.04,
      ad_orders: 18,
      ad_spend: -64.92,
      ad_sales: 170.76,
      organic_orders: 233,
      organic_sales: 2262.28,
      order_rate: 0.0922,
      ad_order_share: 0.0717,
      ad_sales_share: 0.0702,
    },
    business_evidence_blocks: [
      {
        block_id: "sales_performance",
        label: "销售表现",
        value: "订单 251 / 销售额 2433.04",
        detail: "Sessions 2721，转化率 9.2%，非广告订单 233，非广告销售额 2262.28。",
        source: "sales_product_daily_metrics",
      },
      {
        block_id: "ad_coverage",
        label: "广告承接",
        value: "广告订单占比 7.2% / 广告销售占比 7.0%",
        detail: "广告订单 18，广告销售额 170.76；广告花费 -64.92 只按原始快照展示，不单独作为异常结论。",
        source: "sales_product_daily_metrics",
      },
      {
        block_id: "ad_product_coverage",
        label: "广告商品覆盖",
        value: "目标广告商品行 0 / 同父体已投 ASIN 3/12",
        detail: "销售表现仍有广告订单 18，但 advertised_products 快照未覆盖目标 ASIN；先人工核对广告 ASIN 覆盖、非 SP 来源或数据缺口。",
        source: "advertised_products",
      },
      {
        block_id: "parent_sibling_position",
        label: "同父体位置",
        value: "12 个子 ASIN 中订单排名 12/12",
        detail: "目标订单 251，父体总订单 24762；广告订单占比 7.2%，低于父体整体 32.4%。更像低量长尾局部复核机会，不是父体整体结构问题。",
        source: "sales_product_daily_metrics",
      },
      {
        block_id: "decision_boundary",
        label: "判断边界",
        value: "销售商品强不等于可自动加投",
        detail: "广告承接还需要结合广告 ASIN 覆盖、库存、价格和投放策略人工复核。",
        source: "business_rule",
      },
      {
        block_id: "manual_next_step",
        label: "人工下一步",
        value: "人工复核广告承接，并加入 7d / 14d 复盘",
        detail: "系统只做证据整理和建议，不自动加投、不自动调价、不自动暂停广告。",
        source: "manual_review_rule",
      },
    ],
    ad_product_rows: [],
    boundary: "销售商品强不等于可自动加投；广告承接必须结合广告 ASIN、库存、价格和策略人工复核。",
    summary:
      "销售商品证据：2026-05-17 至 2026-06-15 订单 251，销售额 2433.04；广告订单 18，广告订单占比 7.2%；广告销售额 170.76，广告销售占比 7.0%；广告花费按原始快照展示为 -64.92，不单独作为异常结论；该对象应先人工复核广告承接，不自动执行广告动作。",
  },
});

assertIncludes(nextUnhandledEvidenceText, "下一个候选证据：RBK004-RBK004-2 深蓝");
assertIncludes(nextUnhandledEvidenceText, "订单 251");
assertIncludes(nextUnhandledEvidenceText, "广告订单 18");
assertIncludes(nextUnhandledEvidenceText, "业务证据与上下文：销售表现：订单 251 / 销售额 2433.04");
assertIncludes(nextUnhandledEvidenceText, "广告承接：广告订单占比 7.2% / 广告销售占比 7.0%");
assertIncludes(nextUnhandledEvidenceText, "广告商品覆盖：目标广告商品行 0 / 同父体已投 ASIN 3/12");
assertIncludes(nextUnhandledEvidenceText, "同父体位置：12 个子 ASIN 中订单排名 12/12");
assertIncludes(nextUnhandledEvidenceText, "判断边界：销售商品强不等于可自动加投");
assertIncludes(nextUnhandledEvidenceText, "人工下一步：人工复核广告承接，并加入 7d / 14d 复盘");
assertIncludes(nextUnhandledEvidenceText, "不自动执行广告动作");
assertIncludes(nextUnhandledEvidenceText, "销售商品强不等于可自动加投");

assertEqual(triggerEvidenceCountText(3), "3 条触发证据行");

const adAsinSearchTermContextText = nextUnhandledEvidenceDrilldownText({
  next_unhandled_candidate: {
    object_label: "B07BS9754Q",
    stable_object_id: "B07BS9754Q",
  },
  next_unhandled_evidence_drilldown: {
    object_label: "B07BS9754Q",
    direct_ad_product_row_count: 1,
    search_term_context_count: 18,
    placement_context_count: 0,
    metric_summary: {
      basis: "recommended_evidence_rows",
      row_count: 3,
      spend: 64.12,
      clicks: 45,
      orders: 0,
      sales: 0,
      acos: null,
      cvr: 0,
    },
    business_evidence_blocks: [
      {
        block_id: "search_term_market_context",
        label: "搜索词市场背景",
        value: "优先广告组搜索词 18 条 / ABA Top1000 匹配 1 条",
        detail: "Top 高花费词 beach essentials（ABA排名 208）、beach essentials for family、baby beach essentials。",
        source: "ad_search_term_daily_metrics + ABA导出",
      },
      {
        block_id: "context_boundary",
        label: "上下文边界",
        value: "搜索词 18 条 / 广告位 0 条",
        detail: "搜索词和 ABA 只说明同广告组市场背景，不能自动归因到该广告 ASIN。",
        source: "business_rule",
      },
    ],
    ad_product_rows: [{ campaign_name: "Kids Beach", ad_group_name: "Beach Essentials", clicks: 45 }],
    boundary: "搜索词和 ABA 只说明同广告组市场背景，不能自动归因到该广告 ASIN。",
    summary: "广告商品投放行 1 条，覆盖广告活动 1 个 / 广告组 1 个。",
  },
});

assertIncludes(adAsinSearchTermContextText, "触发证据行合计：3 条");
assertIncludes(adAsinSearchTermContextText, "业务证据与上下文：搜索词市场背景：优先广告组搜索词 18 条 / ABA Top1000 匹配 1 条");
assertIncludes(adAsinSearchTermContextText, "上下文边界：搜索词 18 条 / 广告位 0 条");
assertIncludes(adAsinSearchTermContextText, "不能自动归因到该广告 ASIN");

const visibleBusinessEvidenceItems = signalTriageBusinessEvidenceItems({
  recommended_evidence_drilldown: {
    object_label: "RBK004-RBK004-2 深蓝",
    business_evidence_blocks: [
      {
        block_id: "sales_performance",
        label: "销售表现",
        value: "订单 247 / 销售额 2393.08",
        detail: "Sessions 2730，转化率 9.0%，非广告订单 229，非广告销售额 2222.32。",
        source: "sales_product_daily_metrics",
      },
      {
        block_id: "ad_coverage",
        label: "广告承接",
        value: "广告订单占比 7.3% / 广告销售占比 7.1%",
        detail: "广告订单 18，广告销售额 170.76；广告花费 -64.92 只按原始快照展示，不单独作为异常结论。",
        source: "sales_product_daily_metrics",
      },
      {
        block_id: "ad_product_coverage",
        label: "广告商品覆盖",
        value: "目标广告商品行 0 / 同父体已投 ASIN 3/12",
        detail: "销售表现仍有广告订单 18，但广告商品快照未覆盖目标 ASIN。",
        source: "advertised_products",
      },
      {
        block_id: "parent_sibling_position",
        label: "同父体位置",
        value: "12 个子 ASIN 中订单排名 12/12",
        detail: "目标处于同父体销售尾部，更像低量长尾的局部复核机会。",
        source: "sales_product_daily_metrics",
      },
      {
        block_id: "manual_next_step",
        label: "人工下一步",
        value: "人工复核广告承接，并加入 7d / 14d 复盘",
        detail: "系统只做证据整理和建议，不自动执行广告动作。",
        source: "manual_review_rule",
      },
    ],
  },
});

assertEqual(visibleBusinessEvidenceItems.length, 5);
assertEqual(
  visibleBusinessEvidenceItems.map((item) => item.label).join(" / "),
  "销售表现 / 广告承接 / 广告商品覆盖 / 同父体位置 / 人工下一步",
);
assertIncludes(visibleBusinessEvidenceItems[0].value, "订单 247");
assertIncludes(visibleBusinessEvidenceItems[2].value, "3/12");
assertIncludes(visibleBusinessEvidenceItems[3].detail ?? "", "低量长尾");
assertIncludes(visibleBusinessEvidenceItems[4].detail ?? "", "不自动执行广告动作");

const visibleAdAsinEvidenceItems = signalTriageBusinessEvidenceItems({
  recommended_evidence_drilldown: {
    object_label: "B016EXMW02",
    business_evidence_blocks: [
      {
        block_id: "diagnosis_path",
        label: "排查路径",
        value: "Parent 经营盘子 -> 广告 ASIN -> 广告组 -> 投放词 / 搜索词 / 广告位",
        detail: "先用 Parent ASIN 看整体销售，再只下钻有广告证据的广告 ASIN。",
        source: "business_rule",
      },
      {
        block_id: "ad_product_coverage",
        label: "广告商品覆盖",
        value: "覆盖 raw 投放行 3/7 / 证据行 3 条",
        detail: "未覆盖 raw 投放行 4 条，覆盖率 42.9%；背景行只作覆盖核对，不重复生成待处理对象。",
        source: "advertised_products",
      },
      {
        block_id: "ad_metric_summary",
        label: "广告聚合指标",
        value: "花费 151.59 / 订单 46 / 销售额 467.34",
        detail: "点击 148，ACOS 32.4%，CVR 31.1%。",
        source: "advertised_products",
      },
      {
        block_id: "top_spend_source",
        label: "主要花费来源",
        value: "RBK004-扩展-sunglasses for kids-广泛&短语 / 花费占比 80.8%",
        detail: "用于定位优先下钻的广告活动；不代表该广告活动可以被自动调价或自动扩量。",
        source: "advertised_products",
      },
      {
        block_id: "ad_group_problem_location",
        label: "广告组问题定位",
        value: "RBK004-扩展-sunglasses for kids-广泛&短语 / 花费 122.51 / 订单 36",
        detail: "同广告组搜索词 93 条 / 广告位 0 条；优先核对同广告组搜索词，判断是否存在词意图分化。",
        source: "advertised_products + ad_search_term_daily_metrics + ad_placement_daily_metrics",
      },
      {
        block_id: "context_boundary",
        label: "上下文边界",
        value: "搜索词 16 条 / 广告位 0 条",
        detail: "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。",
        source: "business_rule",
      },
    ],
  },
});

assertEqual(visibleAdAsinEvidenceItems.length, 6);
assertEqual(
  visibleAdAsinEvidenceItems.map((item) => item.label).join(" / "),
  "排查路径 / 广告商品覆盖 / 广告聚合指标 / 主要花费来源 / 广告组问题定位 / 上下文边界",
);
assertIncludes(visibleAdAsinEvidenceItems[0].value, "Parent 经营盘子");
assertIncludes(visibleAdAsinEvidenceItems[1].value, "覆盖 raw 投放行 3/7");
assertIncludes(visibleAdAsinEvidenceItems[2].detail ?? "", "ACOS 32.4%");
assertIncludes(visibleAdAsinEvidenceItems[3].detail ?? "", "不代表该广告活动可以被自动调价");
assertIncludes(visibleAdAsinEvidenceItems[4].detail ?? "", "词意图分化");
assertIncludes(visibleAdAsinEvidenceItems[5].detail ?? "", "不能自动归因");

const visibleAdAsinEvidenceItemsWithSearchContext = signalTriageBusinessEvidenceItems({
  recommended_evidence_drilldown: {
    object_label: "B07BS9754Q",
    business_evidence_blocks: [
      {
        block_id: "diagnosis_path",
        label: "排查路径",
        value: "Parent 经营盘子 -> 广告 ASIN -> 广告组 -> 投放词 / 搜索词 / 广告位",
        detail: "先用 Parent ASIN 看整体销售，再只下钻有广告证据的广告 ASIN。",
        source: "business_rule",
      },
      {
        block_id: "ad_product_coverage",
        label: "广告商品覆盖",
        value: "覆盖 raw 投放行 2/2 / 证据行 2 条",
        detail: "覆盖率 100.0%；背景行只作覆盖核对。",
        source: "advertised_products",
      },
      {
        block_id: "ad_metric_summary",
        label: "广告聚合指标",
        value: "花费 79.28 / 订单 32 / 销售额 309.57",
        detail: "点击 85，ACOS 25.6%，CVR 37.6%。",
        source: "advertised_products",
      },
      {
        block_id: "top_spend_source",
        label: "主要花费来源",
        value: "RBK004-AUTO / 花费占比 69.1%",
        detail: "用于定位优先下钻的广告活动；不代表该广告活动可以被自动调价或自动扩量。",
        source: "advertised_products",
      },
      {
        block_id: "search_term_market_context",
        label: "搜索词市场背景",
        value: "优先广告组搜索词 18 条 / ABA Top1000 匹配 1 条",
        detail: "ABA 只作为市场背景，不能自动归因到该广告 ASIN。",
        source: "ad_search_term_daily_metrics + ABA导出",
      },
      {
        block_id: "placement_context_gap",
        label: "广告位证据缺口",
        value: "缺少同广告组广告位上下文",
        detail: "当前只能用同广告组搜索词做下钻复核，不能判断广告位是否造成该 ASIN 承接异常。",
        source: "business_rule",
      },
      {
        block_id: "context_boundary",
        label: "上下文边界",
        value: "搜索词 18 条 / 广告位 0 条",
        detail: "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。",
        source: "business_rule",
      },
    ],
  },
});

assertEqual(visibleAdAsinEvidenceItemsWithSearchContext.length, 7);
assertEqual(
  visibleAdAsinEvidenceItemsWithSearchContext.map((item) => item.label).join(" / "),
  "排查路径 / 广告商品覆盖 / 广告聚合指标 / 主要花费来源 / 搜索词市场背景 / 广告位证据缺口 / 上下文边界",
);
assertIncludes(visibleAdAsinEvidenceItemsWithSearchContext[4].detail ?? "", "不能自动归因");
assertIncludes(visibleAdAsinEvidenceItemsWithSearchContext[5].detail ?? "", "不能判断广告位");
assertIncludes(visibleAdAsinEvidenceItemsWithSearchContext[6].detail ?? "", "不能自动归因");

const handledRecommendedEvidenceSummary = {
  recommended_manual_status: {
    has_manual_action: true,
  },
  recommended_evidence_drilldown: {
    object_label: "B07QXY6573",
    business_evidence_blocks: [
      {
        block_id: "ad_group_problem_location",
        label: "广告组问题定位",
        value: "RB833-广泛-sunglasses womens / 花费 30.21 / 订单 2",
        detail: "同时存在有效词和无订单消耗词，先查投放词 / 搜索词分化。",
        source: "advertised_products + ad_search_term_daily_metrics",
      },
    ],
  },
  next_unhandled_evidence_drilldown: {
    object_label: "beach essentials",
    business_evidence_blocks: [
      {
        block_id: "search_term_metric_summary",
        label: "搜索词表现",
        value: "花费 34.11 / 订单 21 / 销售额 193.20",
        detail: "搜索词只能说明广告活动和广告组下的用户搜索表现。",
        source: "ad_search_term_daily_metrics",
      },
    ],
  },
};

const handledRecommendedEvidenceItems = signalTriageBusinessEvidenceItems(handledRecommendedEvidenceSummary, "recommended");
const nextUnhandledBusinessEvidenceItems = signalTriageBusinessEvidenceItems(handledRecommendedEvidenceSummary, "next_unhandled");

assertEqual(handledRecommendedEvidenceItems.length, 1);
assertEqual(handledRecommendedEvidenceItems[0].label, "广告组问题定位");
assertIncludes(handledRecommendedEvidenceItems[0].value, "RB833-广泛-sunglasses womens");
assertEqual(nextUnhandledBusinessEvidenceItems.length, 1);
assertEqual(nextUnhandledBusinessEvidenceItems[0].label, "搜索词表现");
assertIncludes(nextUnhandledBusinessEvidenceItems[0].value, "34.11");

const diagnosisPathEvidenceSummary = {
  recommended_evidence_drilldown: {
    object_label: "B07QXY6573",
    business_evidence_blocks: [
      {
        block_id: "diagnosis_judgement",
        label: "综合判断",
        value: "RB833-广泛-sunglasses womens 同时存在有效词和无订单消耗词",
        detail: "先查投放词 / 搜索词分化。",
        source: "advertised_products + ad_search_term_daily_metrics",
      },
      {
        block_id: "ad_group_problem_location",
        label: "广告组问题定位",
        value: "RB833-广泛-sunglasses womens / 花费 30.21 / 订单 2",
        detail: "广告组是容器，需要下钻到投放词和搜索词。",
        source: "advertised_products",
      },
      {
        block_id: "search_term_market_context",
        label: "搜索词市场背景",
        value: "优先广告组搜索词 18 条 / ABA Top1000 匹配 1 条",
        detail: "ABA 只作为站点级市场背景。",
        source: "ad_search_term_daily_metrics + ABA导出",
      },
      {
        block_id: "placement_context_gap",
        label: "广告位证据缺口",
        value: "缺少同广告组广告位上下文",
        detail: "不能判断广告位是否造成该 ASIN 承接异常。",
        source: "business_rule",
      },
      {
        block_id: "context_boundary",
        label: "上下文边界",
        value: "搜索词和广告位只说明同广告组上下文",
        detail: "不能自动归因到该广告 ASIN。",
        source: "business_rule",
      },
      {
        block_id: "targeting_context",
        label: "投放词结构",
        value: "词层分化复核：有效词 3 个 / 无订单消耗词 5 个",
        detail: "先按投放词结构判断是放量机会还是浪费问题。",
        source: "ad_targeting + ad_search_term_daily_metrics",
      },
    ],
  },
};

const diagnosisPathItems = signalTriageDiagnosisPathItems(signalTriageBusinessEvidenceItems(diagnosisPathEvidenceSummary, "recommended"));

assertEqual(
  diagnosisPathItems.map((item) => item.label).join(" / "),
  "综合判断 / 广告组问题定位 / 投放词结构 / 搜索词市场背景 / 广告位证据缺口 / 上下文边界",
);
assertEqual(diagnosisPathItems[0].step, 1);
assertEqual(diagnosisPathItems[5].step, 6);
assertIncludes(diagnosisPathItems[2].value, "词层分化复核");
assertIncludes(diagnosisPathItems[5].detail ?? "", "不能自动归因");

const evidenceDrilldownTextWithBackendSummary = recommendedEvidenceDrilldownText({
  recommended_evidence_drilldown: {
    object_label: "B016EXMW02",
    direct_ad_product_row_count: 1,
    search_term_context_count: 0,
    placement_context_count: 0,
    metric_summary: {
      basis: "recommended_evidence_rows",
      row_count: 1,
      spend: 10,
      clicks: 20,
      orders: 2,
      sales: 50,
      acos: 0.2,
      cvr: 0.1,
    },
    top_spend_campaign: { label: "RBK004-AUTO", spend: 10, spend_share: 1 },
    all_asin_ad_coverage: {
      basis: "raw_advertised_products",
      raw_ad_product_row_count: 1,
      recommended_ad_product_row_count: 1,
      missing_ad_product_row_count: 0,
      coverage_ratio: 1,
      metric_summary: {
        basis: "raw_advertised_products",
        row_count: 1,
        spend: 10,
        clicks: 20,
        orders: 2,
        sales: 50,
        acos: 0.2,
        cvr: 0.1,
      },
    },
    ad_product_rows: [],
    boundary: "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。",
    summary:
      "ASIN 级证据：证据行合计花费 10.00，订单 2，销售额 50.00，ACOS 20.0%，CVR 10.0%；raw 全量广告商品行 1 条，推荐证据覆盖 1 条，未进入推荐证据 0 条，覆盖率 100.0%；主要花费广告活动 RBK004-AUTO，花费占比 100.0%；搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。",
  },
});

assertEqual((evidenceDrilldownTextWithBackendSummary.match(/证据行合计/g) ?? []).length, 1);
assertEqual((evidenceDrilldownTextWithBackendSummary.match(/全量广告商品行/g) ?? []).length, 1);
assertEqual((evidenceDrilldownTextWithBackendSummary.match(/主要花费/g) ?? []).length, 1);
assertEqual((evidenceDrilldownTextWithBackendSummary.match(/不能自动归因/g) ?? []).length, 1);

const allScopeSummary = buildProductScopeSelectionSummary({
  scope_id: "all",
  scope_type: "all",
  label: "全量排查（商品 + 未归因 + 数据质量）",
});

assertEqual(allScopeSummary.title, "辅助：全量排查入口");
assertEqual(allScopeSummary.tone, "all");
assertIncludes(allScopeSummary.description, "混合商品信号、未归因广告数据和数据质量层");
assertIncludes(allScopeSummary.description, "优先从 Parent ASIN / ASIN 开始");

const parentScopeSummary = buildProductScopeSelectionSummary({
  scope_id: "parent_asin:B0PARENT",
  scope_type: "parent_asin",
  label: "Parent ASIN B0PARENT",
});

assertEqual(parentScopeSummary.title, "Parent ASIN 经营入口");
assertEqual(parentScopeSummary.tone, "product");
assertIncludes(parentScopeSummary.description, "Parent ASIN");
assertIncludes(parentScopeSummary.description, "广告 ASIN");
assertIncludes(parentScopeSummary.description, "有广告证据");
assertIncludes(parentScopeSummary.description, "广告组");
assertIncludes(parentScopeSummary.description, "投放词");
assertIncludes(parentScopeSummary.targetBoundary, "分析范围是 Parent ASIN B0PARENT");
assertIncludes(parentScopeSummary.targetBoundary, "人工处理目标必须落到子 ASIN / 销售商品 / 广告 ASIN");
assertIncludes(parentScopeSummary.targetBoundary, "广告组和搜索词只用于定位问题");
assertIncludes(parentScopeSummary.targetBoundary, "未投放子 ASIN 不直接进入广告诊断");
assertIncludes(parentScopeSummary.targetBoundary, "不要把子 ASIN 当作 product_scope_id");

const parentScopeAnalysisPath = buildProductScopeAnalysisPath({
  scope_id: "parent_asin:B0PARENT",
  scope_type: "parent_asin",
  label: "Parent ASIN B0PARENT",
});

assertEqual(
  parentScopeAnalysisPath.steps.join(" > "),
  "店铺 / 站点 > Parent ASIN 销售盘 > 广告 ASIN 覆盖 > 广告组结构 > 广告位 / 投放词 > 搜索词 / ABA 证据 > AI 信号诊断 > 人工确认 / 7-14 天复盘",
);
assertIncludes(parentScopeAnalysisPath.boundary, "先看 Parent ASIN 销售盘");
assertIncludes(parentScopeAnalysisPath.boundary, "广告 ASIN 覆盖");
assertIncludes(parentScopeAnalysisPath.boundary, "广告组结构");
assertIncludes(parentScopeAnalysisPath.boundary, "未投放子 ASIN 不进入广告信号队列");
assertIncludes(parentScopeAnalysisPath.boundary, "投放词");
assertIncludes(parentScopeAnalysisPath.boundary, "搜索词");
assertIncludes(parentScopeAnalysisPath.boundary, "AI 信号");
assertIncludes(parentScopeAnalysisPath.boundary, "7/14 天复盘");
assertIncludes(parentScopeAnalysisPath.boundary, "不能直接当作 ASIN 归因");

const adAsinScopeAnalysisPath = buildProductScopeAnalysisPath({
  scope_id: "ad_asin:B000TEST01",
  scope_type: "advertised_asin",
  label: "广告 ASIN B000TEST01",
  asin: "B000TEST01",
});

assertEqual(adAsinScopeAnalysisPath.steps.join(" > "), "店铺 / 站点 > ASIN > 商品指标 > 同广告组上下文");
assertIncludes(adAsinScopeAnalysisPath.boundary, "只直接解释当前 ASIN 的商品指标");

const adAsinScopeSummary = buildProductScopeSelectionSummary({
  scope_id: "ad_asin:B000TEST01",
  scope_type: "advertised_asin",
  label: "广告 ASIN B000TEST01",
  asin: "B000TEST01",
});

assertEqual(adAsinScopeSummary.title, "ASIN 诊断入口");
assertEqual(adAsinScopeSummary.scopeSyncNotice?.title, "广告 ASIN 范围已同步");
assertIncludes(adAsinScopeSummary.scopeSyncNotice?.summary ?? "", "B000TEST01");
assertIncludes(adAsinScopeSummary.scopeSyncNotice?.directMetric ?? "", "广告商品指标");
assertIncludes(adAsinScopeSummary.scopeSyncNotice?.contextBoundary ?? "", "同广告组上下文");
assertIncludes(adAsinScopeSummary.scopeSyncNotice?.contextBoundary ?? "", "不能自动归因到该 ASIN");
assertIncludes(adAsinScopeSummary.scopeSyncNotice?.manualBoundary ?? "", "后端预检");

const productScopeEntryGuidance = buildProductScopeEntryGuidance(
  [
    { scope_id: "all", scope_type: "all", label: "全量排查" },
    { scope_id: "parent_asin:B0PARENT", scope_type: "parent_asin", label: "Parent ASIN B0PARENT" },
    { scope_id: "ad_asin:B000TEST01", scope_type: "advertised_asin", label: "广告 ASIN B000TEST01", asin: "B000TEST01" },
  ],
  {
    search_term_unattributed_count: 8,
    placement_unattributed_count: 2,
  },
);

assertEqual(productScopeEntryGuidance.title, "经营商品优先入口");
assertIncludes(productScopeEntryGuidance.description, "先按 Parent ASIN / ASIN");
assertIncludes(productScopeEntryGuidance.description, "经营盘子");
assertIncludes(productScopeEntryGuidance.description, "广告 ASIN");
assertIncludes(productScopeEntryGuidance.description, "投放词");
assertIncludes(productScopeEntryGuidance.items.map((item) => item.value).join(" / "), "1 个 Parent ASIN 商品组");
assertIncludes(productScopeEntryGuidance.items.map((item) => item.value).join(" / "), "广告 ASIN / 广告组 / 投放词 / 搜索词");
assertIncludes(productScopeEntryGuidance.items.map((item) => item.value).join(" / "), "搜索词 8 条 / 广告位 2 条");

const preferredAdEvidenceParentScope = preferredProductScopeId([
  { scope_id: "all", scope_type: "all", label: "全量排查" },
  { scope_id: "parent_asin:B0NOADS", scope_type: "parent_asin", label: "Parent ASIN B0NOADS", ad_spend: 0, ad_orders: 0, ad_sales: 0 },
  { scope_id: "parent_asin:B0WITHADS", scope_type: "parent_asin", label: "Parent ASIN B0WITHADS", ad_spend: 80, ad_orders: 12, ad_sales: 240 },
  { scope_id: "ad_asin:B0WITHADSCHILD", scope_type: "advertised_asin", label: "广告 ASIN B0WITHADSCHILD", ad_spend: 80 },
]);
assertEqual(preferredAdEvidenceParentScope, "parent_asin:B0WITHADS");

const loadingProductScopeGroups = buildProductScopeOptionGroups([
  { scope_id: "loading_product_scope", scope_type: "loading", label: "正在读取经营商品入口" },
]);
assertEqual(loadingProductScopeGroups[0]?.label, "经营入口状态");
assertEqual(loadingProductScopeGroups[0]?.options[0]?.scope_id, "loading_product_scope");

const asinFallbackEntryGuidance = buildProductScopeEntryGuidance([
  { scope_id: "all", scope_type: "all", label: "全量排查" },
  { scope_id: "ad_asin:B000TEST01", scope_type: "advertised_asin", label: "广告 ASIN B000TEST01", asin: "B000TEST01" },
]);

assertEqual(asinFallbackEntryGuidance.title, "ASIN 临时经营入口");
assertIncludes(asinFallbackEntryGuidance.description, "缺少 Parent ASIN");
assertIncludes(asinFallbackEntryGuidance.items.map((item) => item.value).join(" / "), "1 个 ASIN 可观察");

const parentScopeQueueHeader = buildProductScopeQueueHeader(
  {
    scope_id: "parent_asin:B0PARENT",
    scope_type: "parent_asin",
    label: "Parent ASIN B0PARENT",
  },
  2,
);

assertEqual(parentScopeQueueHeader.title, "Parent ASIN 广告分诊");
assertEqual(parentScopeQueueHeader.countText, "2 条");
assertIncludes(parentScopeQueueHeader.description, "Parent ASIN");
assertIncludes(parentScopeQueueHeader.description, "有广告证据");
assertIncludes(parentScopeQueueHeader.description, "广告组");
assertIncludes(parentScopeQueueHeader.description, "投放词");
assertIncludes(parentScopeQueueHeader.description, "未投放子 ASIN 不直接进入广告诊断");

const allScopeQueueHeader = buildProductScopeQueueHeader(
  {
    scope_id: "all",
    scope_type: "all",
    label: "全部商品和未归因对象",
  },
  5,
);

assertEqual(allScopeQueueHeader.title, "全量排查 AI 信号");
assertIncludes(allScopeQueueHeader.description, "混合视图");
assertIncludes(allScopeQueueHeader.description, "日常经营诊断");

const parentScopeSparseExplanation = buildProductScopeSignalExplanation(
  {
    scope_id: "parent_asin:B0PARENT",
    scope_type: "parent_asin",
    label: "Parent ASIN B0PARENT",
    parent_asin: "B0PARENT",
    child_asins: ["B000TEST01", "B000TEST02"],
    strategy_notes: ["B000TEST02 已标记为主推款，集中消耗不直接判为异常。"],
    sales_orders: 8,
    sales_amount: 120,
    ad_spend: 25,
    ad_orders: 2,
    ad_sales: 40,
  },
  {
    scopeSignalCount: 0,
    allSignalCount: 6,
    dataQualityCount: 2,
    advertisedAsinCount: 1,
  },
);

if (!parentScopeSparseExplanation) {
  throw new Error("Parent ASIN 少信号时应显示解释");
}

assertEqual(parentScopeSparseExplanation.title, "当前商品组暂无需处理信号");
assertIncludes(parentScopeSparseExplanation.description, "不等于系统没读到数据");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "策略压制");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "主推款");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "销售表现识别 2 个子 ASIN");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "其中 1 个有当前投放广告证据");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "未投放子 ASIN 不进入广告信号队列");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "广告承接口径");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "花费 $25.00");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "广告订单 2");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "广告销售 $40.00");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "没有命中人工处理队列准入门槛");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "全量排查还有 6 条");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "数据质量层还有 2 条");

const parentScopeDrilldownExplanation = buildProductScopeSignalExplanation(
  {
    scope_id: "parent_asin:B0PARENT",
    scope_type: "parent_asin",
    label: "Parent ASIN B0PARENT",
    parent_asin: "B0PARENT",
    child_asins: ["B000TEST01", "B000TEST02"],
    sales_orders: 8,
    sales_amount: 120,
    ad_spend: 25,
    ad_orders: 2,
    ad_sales: 40,
  },
  {
    scopeSignalCount: 0,
    allSignalCount: 0,
    dataQualityCount: 0,
    advertisedAsinCount: 2,
    signalTriageSummary: {
      actionability_status: {
        status: "no_actionable_candidate",
        can_write_manual_action: false,
        diagnosis_mode: "product_scope_drilldown",
        message: "当前经营对象已有广告下钻数据，但没有命中可进入人工确认的广告对象级候选；只能作为诊断视图，不能写人工动作。",
      },
      product_scope_drilldown: {
        scope_id: "parent_asin:B0PARENT",
        scope_type: "parent_asin",
        status: "ready",
        advertised_asin_count: 2,
        summary: "当前商品范围广告 ASIN 2 个，广告花费 $25.00，广告订单 2；先看广告 ASIN，再下钻广告组、投放词、搜索词和广告位。",
        boundary: "搜索词和广告位只说明同广告组上下文，不能自动归因到单个 ASIN，也不能自动执行广告动作。",
        items: [
          {
            asin: "B000TEST01",
            spend: 20,
            clicks: 30,
            orders: 2,
            sales: 40,
            ad_product_row_count: 1,
            top_ad_group: {
              campaign_name: "Campaign A",
              ad_group_name: "RBK004-kids sunglasses-广泛",
              spend: 20,
              clicks: 30,
              orders: 2,
              sales: 40,
              search_term_count: 2,
              placement_count: 1,
              campaign_placement_count: 3,
              ad_group_advertised_asin_count: 2,
              ad_group_advertised_asins: ["B000TEST01", "B000TEST02"],
              ad_group_attribution_boundary: "同广告组投放 2 个广告 ASIN；搜索词和广告位只能说明广告组上下文，不能自动归因到单个 ASIN。",
              effective_search_terms: [{ search_term: "kids sunglasses", spend: 8, clicks: 12, orders: 2, sales: 40 }],
              zero_order_search_terms: [{ search_term: "baby sunglasses", spend: 5, clicks: 8, orders: 0, sales: 0 }],
            },
            next_review_focus: "优先复核 RBK004-kids sunglasses-广泛 的投放词和搜索词分化。",
          },
        ],
      },
    },
  },
);

if (!parentScopeDrilldownExplanation) {
  throw new Error("Parent ASIN 无信号但有广告下钻数据时应显示解释");
}

const parentScopeDrilldownText = parentScopeDrilldownExplanation.reasons.join(" / ");
assertEqual(parentScopeDrilldownExplanation.title, "当前商品组暂无可行动候选");
assertIncludes(parentScopeDrilldownText, "可行动准入");
assertIncludes(parentScopeDrilldownText, "只能作为诊断视图");
assertIncludes(parentScopeDrilldownText, "广告下钻");
assertIncludes(parentScopeDrilldownText, "广告 ASIN 2 个");
assertIncludes(parentScopeDrilldownText, "B000TEST01");
assertIncludes(parentScopeDrilldownText, "RBK004-kids sunglasses-广泛");
assertIncludes(parentScopeDrilldownText, "kids sunglasses");
assertIncludes(parentScopeDrilldownText, "baby sunglasses");
assertIncludes(parentScopeDrilldownText, "搜索词和广告位只说明同广告组上下文");

const parentScopeDrilldownEvidence = productScopeDrilldownEvidenceItems({
  product_scope_drilldown: {
    scope_id: "parent_asin:B0PARENT",
    scope_type: "parent_asin",
    status: "ready",
    advertised_asin_count: 2,
    summary: "当前商品范围广告 ASIN 2 个，广告花费 $25.00，广告订单 2；先看广告 ASIN，再下钻广告组、投放词、搜索词和广告位。",
    boundary: "搜索词和广告位只说明同广告组上下文，不能自动归因到单个 ASIN，也不能自动执行广告动作。",
    candidate_gap_analysis: {
      status: "diagnostic_only",
      summary: "广告 ASIN 层没有命中可人工确认候选；搜索词候选按广告组上下文另行准入。",
      boundary: "candidate_count=0，不写人工动作；候选缺口只解释为什么不能进入人工确认。",
      checks: [
        {
          object_type: "advertised_product",
          object_id: "B000TEST01",
          object_label: "B000TEST01",
          result: "诊断不准入",
          anomaly_check: "未触发广告 ASIN 异常：订单 2 高于弱订单阈值，ACOS 50.0% 未构成异常。",
          opportunity_check: "稳定转化机会规则暂缓：缺库存、利润、价格、主推策略等独立证据。",
          next_review_focus: "继续下钻广告组搜索词分化。",
        },
      ],
    },
    items: [
      {
        asin: "B000TEST01",
        spend: 20,
        clicks: 30,
        orders: 2,
        sales: 40,
        ad_product_row_count: 1,
        top_ad_group: {
          campaign_name: "Campaign A",
          ad_group_name: "RBK004-kids sunglasses-广泛",
          spend: 20,
          clicks: 30,
          orders: 2,
          sales: 40,
          search_term_count: 2,
          placement_count: 1,
          campaign_placement_count: 3,
          ad_group_advertised_asin_count: 2,
          ad_group_advertised_asins: ["B000TEST01", "B000TEST02"],
          ad_group_attribution_boundary: "同广告组投放 2 个广告 ASIN；搜索词和广告位只能说明广告组上下文，不能自动归因到单个 ASIN。",
          effective_search_terms: [{ search_term: "kids sunglasses", spend: 8, clicks: 12, orders: 2, sales: 40 }],
          zero_order_search_terms: [{ search_term: "baby sunglasses", spend: 5, clicks: 8, orders: 0, sales: 0 }],
        },
        next_review_focus: "优先复核 RBK004-kids sunglasses-广泛 的投放词和搜索词分化。",
      },
    ],
  },
});
const parentScopeDrilldownEvidenceText = parentScopeDrilldownEvidence.map((item) => `${item.label} ${item.value} ${item.detail}`).join(" / ");
assertIncludes(parentScopeDrilldownEvidenceText, "广告 ASIN 覆盖");
assertIncludes(parentScopeDrilldownEvidenceText, "2 个广告 ASIN");
assertIncludes(parentScopeDrilldownEvidenceText, "优先广告 ASIN");
assertIncludes(parentScopeDrilldownEvidenceText, "B000TEST01");
assertIncludes(parentScopeDrilldownEvidenceText, "优先广告组");
assertIncludes(parentScopeDrilldownEvidenceText, "RBK004-kids sunglasses-广泛");
assertIncludes(parentScopeDrilldownEvidenceText, "广告组投放结构");
assertIncludes(parentScopeDrilldownEvidenceText, "B000TEST01、B000TEST02");
assertIncludes(parentScopeDrilldownEvidenceText, "同广告组投放 2 个广告 ASIN");
assertIncludes(parentScopeDrilldownEvidenceText, "有效搜索词");
assertIncludes(parentScopeDrilldownEvidenceText, "kids sunglasses");
assertIncludes(parentScopeDrilldownEvidenceText, "无订单花费词");
assertIncludes(parentScopeDrilldownEvidenceText, "baby sunglasses");
assertIncludes(parentScopeDrilldownEvidenceText, "AI 候选缺口");
assertIncludes(parentScopeDrilldownEvidenceText, "诊断不准入");
assertIncludes(parentScopeDrilldownEvidenceText, "B000TEST01");
assertIncludes(parentScopeDrilldownEvidenceText, "稳定转化机会规则暂缓");
assertIncludes(parentScopeDrilldownEvidenceText, "归因边界");
assertIncludes(parentScopeDrilldownEvidenceText, "不能自动归因到单个 ASIN");

const adAsinCandidateGapExplanation = buildProductScopeCandidateGapExplanation(
  {
    scope_id: "ad_asin:B000TEST01",
    scope_type: "advertised_asin",
    label: "广告 ASIN B000TEST01",
    asin: "B000TEST01",
    sales_orders: 0,
    sales_amount: 0,
    ad_spend: 20,
    ad_orders: 2,
    ad_sales: 40,
  },
  {
    actionability_status: {
      status: "no_actionable_candidate",
      diagnosis_mode: "product_scope_drilldown",
      message: "当前广告 ASIN 只能诊断，不能写人工动作。",
      next_step: "继续下钻广告组、投放词、搜索词和广告位证据。",
      boundary: "candidate_count=0，不写人工动作；搜索词和广告位不能自动归因到单个 ASIN。",
    },
    signal_status: { signal_count: 0, candidate_count: 0 },
    product_scope_drilldown: {
      scope_id: "ad_asin:B000TEST01",
      scope_type: "advertised_asin",
      advertised_asin_count: 1,
      summary: "广告 ASIN B000TEST01 花费 $20.00，订单 2。",
      boundary: "搜索词和广告位只说明同广告组上下文，不能自动归因到单个 ASIN。",
      candidate_gap_analysis: {
        status: "diagnostic_only",
        summary: "广告 ASIN 层没有命中可人工确认候选；搜索词候选按广告组上下文另行准入。",
        boundary: "candidate_count=0，不写人工动作；候选缺口只解释为什么不能进入人工确认。",
        checks: [
          {
            object_type: "advertised_product",
            object_id: "B000TEST01",
            object_label: "B000TEST01",
            result: "诊断不准入",
            anomaly_check: "未触发广告 ASIN 异常：订单 2 高于弱订单阈值，ACOS 50.0% 未构成异常。",
            opportunity_check: "稳定转化机会规则暂缓：缺库存、利润、价格、主推策略等独立证据。",
            diagnosis_context: "搜索词和广告位仍是同广告组上下文。",
            next_review_focus: "继续下钻广告组搜索词分化。",
          },
        ],
      },
      items: [],
    },
  },
);

if (!adAsinCandidateGapExplanation) {
  throw new Error("广告 ASIN 候选为 0 时应显示候选缺口解释");
}

assertEqual(adAsinCandidateGapExplanation.title, "广告 ASIN 候选缺口解释");
assertIncludes(adAsinCandidateGapExplanation.summary, "B000TEST01");
assertIncludes(adAsinCandidateGapExplanation.summary, "候选 0 个");
assertIncludes(adAsinCandidateGapExplanation.admission, "只能诊断");
assertIncludes(adAsinCandidateGapExplanation.reasons.join(" / "), "未触发广告 ASIN 异常");
assertIncludes(adAsinCandidateGapExplanation.reasons.join(" / "), "稳定转化机会规则暂缓");
assertIncludes(adAsinCandidateGapExplanation.reasons.join(" / "), "继续下钻广告组搜索词分化");
assertIncludes(adAsinCandidateGapExplanation.boundary, "candidate_count=0");
assertIncludes(adAsinCandidateGapExplanation.boundary, "不能自动归因到单个 ASIN");

const parentScopeLegacyActionGapExplanation = buildProductScopeSignalExplanation(
  {
    scope_id: "parent_asin:B0PARENT",
    scope_type: "parent_asin",
    label: "Parent ASIN B0PARENT",
    parent_asin: "B0PARENT",
    child_asins: ["B000TEST01", "B000TEST02"],
    sales_orders: 8,
    sales_amount: 120,
    ad_spend: 25,
    ad_orders: 2,
    ad_sales: 40,
  },
  {
    scopeSignalCount: 0,
    allSignalCount: 0,
    dataQualityCount: 0,
    advertisedAsinCount: 1,
    signalTriageSummary: {
      review_status: {
        review_feedback: {
          closure_checklist: [
            {
              check_id: "manual_action_context",
              label: "复盘输入证据",
              status: "blocked",
              evidence: "人工动作 15 条，证据快照 0 条，语义组 0 条，ABA参考 0 条",
            },
          ],
        },
      },
    },
  },
);

if (!parentScopeLegacyActionGapExplanation) {
  throw new Error("历史人工动作缺证据时应显示解释");
}

assertIncludes(parentScopeLegacyActionGapExplanation.reasons.join(" / "), "复盘输入证据缺口");
assertIncludes(parentScopeLegacyActionGapExplanation.reasons.join(" / "), "人工动作 15 条，证据快照 0 条");
assertEqual(parentScopeLegacyActionGapExplanation.tone, "data");

const adAsinSparseExplanation = buildProductScopeSignalExplanation(
  {
    scope_id: "ad_asin:B000TEST01",
    scope_type: "advertised_asin",
    label: "广告 ASIN B000TEST01",
    asin: "B000TEST01",
    spend: 25,
    orders: 3,
    sales: 60,
  },
  {
    scopeSignalCount: 1,
    allSignalCount: 4,
    dataQualityCount: 0,
  },
);

if (!adAsinSparseExplanation) {
  throw new Error("ASIN 少信号时应显示解释");
}

assertEqual(adAsinSparseExplanation.title, "当前 ASIN 仅有 1 条信号");
assertIncludes(adAsinSparseExplanation.reasons.join(" / "), "商品粒度");
assertIncludes(adAsinSparseExplanation.reasons.join(" / "), "搜索词和广告位不会强行归入");
assertEqual(
  buildProductScopeSignalExplanation({ scope_id: "all", scope_type: "all", label: "全量排查" }, { scopeSignalCount: 0, allSignalCount: 6 }),
  null,
);

const unattributedScopeSummary = buildProductScopeSelectionSummary({
  scope_id: "unattributed",
  scope_type: "unattributed",
  label: "未归因广告数据",
});

assertEqual(unattributedScopeSummary.title, "辅助：未归因广告数据入口");
assertEqual(unattributedScopeSummary.tone, "unattributed");
assertIncludes(unattributedScopeSummary.description, "不强行归到某个 ASIN");

const productScopeGroupOverview = buildProductScopeGroupOverview(
  {
    scope_id: "parent_asin:B0PARENT",
    scope_type: "parent_asin",
    label: "Parent ASIN B0PARENT",
    parent_asin: "B0PARENT",
    child_asins: [
      "B016EXMVZS",
      "B016EXMW02",
      "B016EXMW1G",
      "B016EXMW4S",
      "B016EXMXTC",
      "B06VW5SQ97",
      "B07BS9754Q",
      "B07MH544J8",
      "B07MR6HFPX",
      "B082M5C7TZ",
      "B09BQRQ5DT",
      "B09BQSBXTQ",
    ],
    strategy_notes: ["B000TEST02 已标记为主推款，集中消耗不直接判为异常。"],
    spend: 149.51,
    orders: 13519,
    sales: 149023.34,
    sales_orders: 24591,
    sales_amount: 262341.49,
    ad_spend: 764.11,
    ad_orders: 281,
    ad_sales: 2715.06,
    metric_boundary: "经营订单/销售额来自 sales_product_daily_metrics；广告花费/广告订单/广告销售来自 advertised_products。",
  },
  [
    { scope_id: "all", scope_type: "all", label: "全部", spend: 0, orders: 0, sales: 0 },
    {
      scope_id: "ad_asin:B016EXMVZS",
      scope_type: "advertised_asin",
      label: "广告 ASIN B016EXMVZS",
      asin: "B016EXMVZS",
      spend: 25,
      orders: 3,
      sales: 60,
      ad_spend: 25,
      ad_orders: 3,
      ad_sales: 60,
    },
    {
      scope_id: "ad_asin:B016EXMW02",
      scope_type: "advertised_asin",
      label: "广告 ASIN B016EXMW02",
      asin: "B016EXMW02",
      spend: 999,
      orders: 999,
      sales: 999,
      ad_spend: 80,
      ad_orders: 12,
      ad_sales: 240,
      strategy_notes: ["B016EXMW02 是主推款。"],
    },
    {
      scope_id: "ad_asin:B07BS9754Q",
      scope_type: "advertised_asin",
      label: "广告 ASIN B07BS9754Q",
      asin: "B07BS9754Q",
      spend: 44.51,
      orders: 11,
      sales: 128.4,
      ad_spend: 44.51,
      ad_orders: 11,
      ad_sales: 128.4,
    },
  ],
  {
    search_term_unattributed_count: 20,
    placement_unattributed_count: 10,
  },
);

if (!productScopeGroupOverview) {
  throw new Error("Parent ASIN 入口应显示商品组概览");
}

assertEqual(productScopeGroupOverview.title, "Parent ASIN B0PARENT 商品组");
assertEqual(productScopeGroupOverview.summary, "已识别 12 个销售表现子 ASIN / 3 个当前投放广告 ASIN");
assertEqual(productScopeGroupOverview.adAsinLabels.length, 3);
assertIncludes(productScopeGroupOverview.adAsinLabels[0], "B016EXMW02");
assertIncludes(productScopeGroupOverview.adAsinLabels[0], "$80.00");
assertIncludes(productScopeGroupOverview.adAsinLabels[0], "广告订单 12");
assertEqual(productScopeGroupOverview.adAsinRows.length, 3);
assertEqual(productScopeGroupOverview.adAsinRows[0].scopeId, "ad_asin:B016EXMW02");
assertEqual(productScopeGroupOverview.adAsinRows[0].asin, "B016EXMW02");
assertEqual(productScopeGroupOverview.adAsinRows[0].spend, 80);
assertEqual(productScopeGroupOverview.adAsinRows[0].orders, 12);
assertEqual(productScopeGroupOverview.adAsinRows[0].sales, 240);
assertClose(productScopeGroupOverview.adAsinRows[0].acos, 80 / 240);
assertIncludes(productScopeGroupOverview.adAsinRows[0].strategyNote ?? "", "主推款");
assertEqual(productScopeGroupOverview.relationItems.length, 4);
assertEqual(productScopeGroupOverview.relationItems[0].label, "Parent ASIN 经营盘子");
assertIncludes(productScopeGroupOverview.relationItems[0].value, "Parent ASIN B0PARENT");
assertIncludes(productScopeGroupOverview.relationItems[0].value, "12 个销售表现子 ASIN");
assertIncludes(productScopeGroupOverview.relationItems[0].value, "订单 24591");
assertIncludes(productScopeGroupOverview.relationItems[0].value, "$262341.49");
assertEqual(productScopeGroupOverview.relationItems[1].label, "广告证据下钻");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "3 个当前投放广告 ASIN");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "广告花费 $764.11");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "广告订单 281");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "广告销售额 $2715.06");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "广告组");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "投放词");
assertEqual(productScopeGroupOverview.relationItems[2].label, "策略事实");
assertIncludes(productScopeGroupOverview.relationItems[2].value, "主推款");
assertEqual(productScopeGroupOverview.relationItems[3].label, "广告上下文");
assertIncludes(productScopeGroupOverview.relationItems[3].value, "投放词");
assertIncludes(productScopeGroupOverview.relationItems[3].value, "搜索词 20 条");
assertIncludes(productScopeGroupOverview.relationItems[3].value, "不做 ASIN 归因");
assertEqual(productScopeGroupOverview.strategyNotes.length, 2);
assertIncludes(productScopeGroupOverview.strategyNotes.join(" / "), "主推款");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "Parent ASIN 是商品组入口");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "广告组是投放容器，一个广告组至少包含一个广告商品，也可能包含多个广告商品");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "广告 ASIN 只代表当前投放覆盖");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "未投放子 ASIN 不进入广告信号队列");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "经营订单/销售额来自 sales_product_daily_metrics");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "搜索词 20 条");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "广告位 10 条");
assertEqual(buildProductScopeGroupOverview({ scope_id: "all", scope_type: "all", label: "全部" }, [], null), null);

const productScopeFirstScreenSummary = buildProductScopeFirstScreenSummary(productScopeGroupOverview, {
  signal_status: { candidate_count: 3 },
  actionability_status: {
    can_write_manual_action: true,
    message: "当前范围有 3 个候选，必须先人工复核投放词、广告商品和归因边界。",
  },
  review_status: {
    manual_action_count: 17,
    review_record_count: 0,
    ready_count: 0,
    not_ready_count: 10,
    review_wait_summary: {
      earliest_due_date: "2026-06-22",
      next_object_label: "B016EXMVZS",
    },
  },
});
if (!productScopeFirstScreenSummary) {
  throw new Error("Parent ASIN 首屏经营摘要不能为空");
}
assertEqual(productScopeFirstScreenSummary.title, "Parent ASIN 销售盘");
assertEqual(productScopeFirstScreenSummary.summary, productScopeGroupOverview.summary);
assertEqual(productScopeFirstScreenSummary.factItems.length, 2);
assertIncludes(productScopeFirstScreenSummary.factItems[0].value, "Parent ASIN B0PARENT");
assertIncludes(productScopeFirstScreenSummary.factItems[0].value, "12");
assertIncludes(productScopeFirstScreenSummary.factItems[0].value, "$262341.49");
assertIncludes(productScopeFirstScreenSummary.factItems[1].value, "3");
assertIncludes(productScopeFirstScreenSummary.factItems[1].value, "$764.11");
assertEqual(productScopeFirstScreenSummary.adAsinRows.length, 3);
assertEqual(productScopeFirstScreenSummary.adAsinRows[0].asin, "B016EXMW02");
assertEqual(productScopeFirstScreenSummary.adAsinRows[0].spend, 80);
assertEqual(productScopeFirstScreenSummary.adAsinRows[0].orders, 12);
assertEqual(productScopeFirstScreenSummary.adAsinRows[0].sales, 240);
assertEqual(productScopeFirstScreenSummary.mvpStatus.title, "诊断 MVP 状态判定");
assertEqual(productScopeFirstScreenSummary.mvpStatus.statusLabel, "人工留痕 MVP");
assertIncludes(productScopeFirstScreenSummary.mvpStatus.summary, "当前有 3 个可写人工候选");
assertIncludes(productScopeFirstScreenSummary.mvpStatus.summary, "不是完整复盘闭环");
assertIncludes(productScopeFirstScreenSummary.mvpStatus.detail, "Parent ASIN -> 广告 ASIN -> 广告组 / 搜索词 / 广告位");
assertIncludes(productScopeFirstScreenSummary.mvpStatus.boundary, "ready 复盘");
assertEqual(productScopeFirstScreenSummary.pathSteps.length, 5);
assertEqual(productScopeFirstScreenSummary.pathSteps[0].label, "先看销售盘");
assertIncludes(productScopeFirstScreenSummary.pathSteps[0].detail, "Parent ASIN B0PARENT");
assertIncludes(productScopeFirstScreenSummary.pathSteps[1].detail, "只进入有广告证据的广告 ASIN");
assertIncludes(productScopeFirstScreenSummary.pathSteps[2].detail, "广告组是投放容器");
assertIncludes(productScopeFirstScreenSummary.pathSteps[3].detail, "搜索词和广告位只作为上下文证据");
assertIncludes(productScopeFirstScreenSummary.pathSteps[4].detail, "人工确认和 7/14 天复盘");
assertIncludes(productScopeFirstScreenSummary.boundary, "只展示有广告证据的广告 ASIN");
assertIncludes(productScopeFirstScreenSummary.boundary, "未投放子 ASIN 不进入广告诊断");
assertIncludes(productScopeFirstScreenSummary.boundary, "搜索词和广告位不能直接归因");
assertEqual(productScopeFirstScreenSummary.landingGates.length, 4);
assertEqual(productScopeFirstScreenSummary.landingGates[0].label, "经营口径");
assertIncludes(productScopeFirstScreenSummary.landingGates[0].value, "12 个销售表现子 ASIN");
assertIncludes(productScopeFirstScreenSummary.landingGates[0].detail, "经营背景");
assertEqual(productScopeFirstScreenSummary.landingGates[1].label, "广告证据");
assertIncludes(productScopeFirstScreenSummary.landingGates[1].value, "3 个广告 ASIN 可下钻");
assertIncludes(productScopeFirstScreenSummary.landingGates[1].detail, "只有有广告证据的 ASIN");
assertEqual(productScopeFirstScreenSummary.landingGates[2].label, "AI 准入");
assertIncludes(productScopeFirstScreenSummary.landingGates[2].value, "3 个候选需人工复核");
assertIncludes(productScopeFirstScreenSummary.landingGates[2].detail, "人工复核");
assertEqual(productScopeFirstScreenSummary.landingGates[3].label, "复盘门槛");
assertIncludes(productScopeFirstScreenSummary.landingGates[3].value, "最早 2026-06-22");
assertIncludes(productScopeFirstScreenSummary.landingGates[3].detail, "review_records");

const noCandidateMvpSummary = buildProductScopeFirstScreenSummary(productScopeGroupOverview, {
  signal_status: { candidate_count: 0 },
  actionability_status: {
    status: "no_actionable_candidate",
    can_write_manual_action: false,
    message: "B00K4W4AAA 当前范围 candidate_count=0，只能继续诊断和下钻证据。",
  },
  review_status: {
    manual_action_count: 17,
    review_record_count: 0,
    ready_count: 0,
    not_ready_count: 10,
    review_wait_summary: {
      earliest_due_date: "2026-06-22",
    },
  },
});
assertEqual(noCandidateMvpSummary?.mvpStatus.statusLabel, "诊断 MVP");
assertIncludes(noCandidateMvpSummary?.mvpStatus.summary ?? "", "当前有真实广告证据，但 0 个可写人工候选");
assertIncludes(noCandidateMvpSummary?.mvpStatus.summary ?? "", "不是完整业务闭环");
assertIncludes(noCandidateMvpSummary?.mvpStatus.detail ?? "", "继续下钻广告 ASIN、广告组、搜索词和广告位");
assertIncludes(noCandidateMvpSummary?.mvpStatus.boundary ?? "", "不能保存 review_records");
assertIncludes(noCandidateMvpSummary?.mvpStatus.boundary ?? "", "不能说处理有效或无效");

const parentScopeWithoutAdMetrics = buildProductScopeGroupOverview(
  {
    scope_id: "parent_asin:B0PARENT",
    scope_type: "parent_asin",
    label: "Parent ASIN B0PARENT",
    parent_asin: "B0PARENT",
    child_asins: ["B000TEST01"],
    spend: 50,
    orders: 1000,
    sales: 5000,
    sales_orders: 1000,
    sales_amount: 5000,
  },
  [],
  null,
);

if (!parentScopeWithoutAdMetrics) {
  throw new Error("Parent ASIN 入口应显示缺广告指标时的边界");
}

assertIncludes(parentScopeWithoutAdMetrics.relationItems[0].value, "订单 1000");
assertIncludes(parentScopeWithoutAdMetrics.relationItems[0].value, "$5000.00");
assertIncludes(parentScopeWithoutAdMetrics.relationItems[1].value, "广告花费 $50.00");
assertIncludes(parentScopeWithoutAdMetrics.relationItems[1].value, "广告订单 0");
assertIncludes(parentScopeWithoutAdMetrics.relationItems[1].value, "广告销售额 $0.00");

const searchTermDiagnosticScope = buildSignalDiagnosticScope(searchTermSignalWithoutAsin);

assertEqual(searchTermDiagnosticScope.label, "未归因广告数据");
assertIncludes(searchTermDiagnosticScope.boundary, "搜索词");
assertIncludes(searchTermDiagnosticScope.boundary, "不能强行归属到商品或 Parent ASIN");

const placementDiagnosticScope = buildSignalDiagnosticScope({
  ...placementSignal,
  evidence: {
    source_rows: [{ source_table: "ad_placement_daily_metrics", placement: "Detail Page on-Amazon" }],
  },
});

assertEqual(placementDiagnosticScope.label, "未归因广告数据");
assertIncludes(placementDiagnosticScope.boundary, "广告位");
assertIncludes(placementDiagnosticScope.boundary, "不能强行归属到商品或 Parent ASIN");

const advertisedProductDiagnosticScope = buildSignalDiagnosticScope({
  ...advertisedProductSignal,
  evidence: {
    primary_object: { object_type: "advertised_product", label: "儿童太阳镜 A", asin: "B000TEST01" },
  },
});

assertEqual(advertisedProductDiagnosticScope.label, "商品视角");
assertIncludes(advertisedProductDiagnosticScope.boundary, "ASIN");
assertIncludes(advertisedProductDiagnosticScope.boundary, "底层证据");

const searchTermQueueScope = buildSignalQueueScopeBadge(searchTermSignalWithoutAsin);

assertEqual(searchTermQueueScope.label, "未归因广告数据");
assertEqual(searchTermQueueScope.tone, "unattributed");

const dataQualityQueueScope = buildSignalQueueScopeBadge(dataQualitySignal);

assertEqual(dataQualityQueueScope.label, "数据质量层");
assertEqual(dataQualityQueueScope.tone, "data_quality");

const advertisedProductQueueScope = buildSignalQueueScopeBadge({
  ...advertisedProductSignal,
  evidence: {
    primary_object: { object_type: "advertised_product", label: "儿童太阳镜 A", asin: "B000TEST01" },
  },
});

assertEqual(advertisedProductQueueScope.label, "商品视角");
assertEqual(advertisedProductQueueScope.tone, "product");

const signalLayerOverview = buildSignalLayerOverview([
  dataQualitySignal,
  searchTermSignalWithoutAsin,
  adGroupSignal,
  {
    ...advertisedProductSignal,
    evidence: {
      primary_object: { object_type: "advertised_product", label: "儿童太阳镜 A", asin: "B000TEST01" },
    },
  },
]);

assertEqual(signalLayerOverview.product, 1);
assertEqual(signalLayerOverview.unattributed, 1);
assertEqual(signalLayerOverview.dataQuality, 1);
assertEqual(signalLayerOverview.container, 1);

const market1Overrides = { "1:sig-shared-data-quality": "observing" } as const;
assertEqual(applySignalStatusOverrides([sameIdMarket1Signal], market1Overrides)[0].status, "observing");
assertEqual(applySignalStatusOverrides([sameIdMarket2Signal], market1Overrides)[0].status, "pending");

const dataQualityTriage = buildSignalTriageRationale(staleSignal);

assertEqual(dataQualityTriage.queueKind, "data_quality");
assertEqual(dataQualityTriage.queueLabel, "数据质量");
assertIncludes(dataQualityTriage.queueReason, "signal_category=data_quality");
assertIncludes(dataQualityTriage.priorityReason, "severity=4");
assertIncludes(dataQualityTriage.reviewBoundary, "review_result 不参与分诊");
assertIncludes(dataQualityTriage.reviewRuleFeedback, "暂无复盘结果");
assertIncludes(dataQualityTriage.reviewRuleFeedback, "不调整规则");

const opportunityTriage = buildSignalTriageRationale({
  ...opportunitySignal,
  review_result: "improved",
});

assertEqual(opportunityTriage.queueKind, "opportunity");
assertEqual(opportunityTriage.queueLabel, "市场机会");
assertIncludes(opportunityTriage.queueReason, "signal_type=opportunity");
assertIncludes(opportunityTriage.statusReason, "status=observing");
assertIncludes(opportunityTriage.reviewBoundary, "复盘结果只说明处理后效果");
assertIncludes(opportunityTriage.reviewRuleFeedback, "处理有效");
assertIncludes(opportunityTriage.reviewRuleFeedback, "仍需人工确认");

const worseReviewTriage = buildSignalTriageRationale({
  ...searchTermSignal,
  review_result: "worse",
});

assertIncludes(worseReviewTriage.reviewRuleFeedback, "效果变差");
assertIncludes(worseReviewTriage.reviewRuleFeedback, "复核阈值");
assertIncludes(worseReviewTriage.reviewRuleFeedback, "不自动改规则");

const noChangeReviewTriage = buildSignalTriageRationale({
  ...advertisedProductSignal,
  review_result: "no_change",
});

assertIncludes(noChangeReviewTriage.reviewRuleFeedback, "无明显变化");
assertIncludes(noChangeReviewTriage.reviewRuleFeedback, "复核证据来源或建议动作");

const staleAbaSupport = buildSignalEvidenceSupport({
  ...staleSignal,
  confidence: "high",
  evidence_count: 5,
  data_sources: [{ source_type: "ABA导出" }, { source_type: "积加API" }],
  evidence: {
    facts: [
      { label: "ABA 周期", value: "2026-05-10 至 2026-05-16", source_type: "ABA导出" },
      { label: "分析周期结束", value: "2026-06-14", source_type: "积加API" },
      { label: "过期天数", value: "29", source_type: "ABA导出" },
    ],
  },
});

assertIncludes(staleAbaSupport.sourceSummary, "ABA导出、积加API");
assertIncludes(staleAbaSupport.confidenceReason, "高置信");
assertIncludes(staleAbaSupport.confidenceReason, "至少两个独立证据源");
assertIncludes(staleAbaSupport.severityReason, "影响花费、订单、ACOS、核心产品或高热搜索词");
assertIncludes(staleAbaSupport.supportWarning ?? "", "数据过期");

const placementSupport = buildSignalEvidenceSupport({
  ...placementSignal,
  confidence: "medium",
  severity: 4,
  evidence_count: 4,
  data_sources: [{ source_type: "积加API" }],
  evidence: {
    facts: [
      { label: "广告位", value: "Detail Page on-Amazon", source_type: "积加API" },
      { label: "ROAS", value: "5.3", source_type: "积加API" },
    ],
  },
});

assertIncludes(placementSupport.confidenceReason, "中置信");
assertIncludes(placementSupport.confidenceReason, "一个强证据源");
assertIncludes(placementSupport.severityReason, "高严重度");
assertEqual(placementSupport.supportWarning, null);

const placementTrigger = buildSignalTriggerRationale(placementSignal);

assertIncludes(placementTrigger.objectRule, "广告位");
assertIncludes(placementTrigger.triggerRule, "ACOS");
assertIncludes(placementTrigger.triggerRule, "单周期低 ACOS 不再直接生成预算倾斜机会");
assertIncludes(placementTrigger.evidenceRule, "ad_placement_daily_metrics");
assertIncludes(placementTrigger.actionBoundary, "人工");

const searchTermSplitTrigger = buildSignalTriggerRationale({
  ...searchTermSignal,
  signal_category: "search_term_performance_split",
});

assertIncludes(searchTermSplitTrigger.objectRule, "搜索词");
assertIncludes(searchTermSplitTrigger.triggerRule, "同一 normalized_query");
assertIncludes(searchTermSplitTrigger.triggerRule, "多条投放行");
assertIncludes(searchTermSplitTrigger.evidenceRule, "ad_search_term_daily_metrics");
assertIncludes(searchTermSplitTrigger.confidenceBoundary, "不能直接归因到单个商品");

const longTailTrigger = buildSignalTriggerRationale({
  ...opportunitySignal,
  signal_category: "search_term_opportunity",
  object_type: "search_term",
});

assertIncludes(longTailTrigger.triggerRule, "低花费");
assertIncludes(longTailTrigger.triggerRule, "订单");
assertIncludes(longTailTrigger.triggerRule, "ACOS");
assertIncludes(longTailTrigger.actionBoundary, "观察");

const adProductOpportunityTrigger = buildSignalTriggerRationale(advertisedProductOpportunitySignal);

assertIncludes(adProductOpportunityTrigger.objectRule, "广告商品 ASIN");
assertIncludes(adProductOpportunityTrigger.objectRule, "Parent ASIN");
assertIncludes(adProductOpportunityTrigger.triggerRule, "暂缓生成");
assertIncludes(adProductOpportunityTrigger.evidenceRule, "库存");
assertIncludes(adProductOpportunityTrigger.confidenceBoundary, "单一积加API快照只能说明表现观察");
assertIncludes(adProductOpportunityTrigger.actionBoundary, "未补齐独立证据前不应作为可处理机会");

const adProductEfficiencyTrigger = buildSignalTriggerRationale(advertisedProductEfficiencySignal);

assertIncludes(adProductEfficiencyTrigger.objectRule, "广告商品 ASIN");
assertIncludes(adProductEfficiencyTrigger.objectRule, "广告组只作为上下文容器");
assertIncludes(adProductEfficiencyTrigger.triggerRule, "点击样本充足");
assertIncludes(adProductEfficiencyTrigger.triggerRule, "订单弱");
assertIncludes(adProductEfficiencyTrigger.triggerRule, "ACOS");
assertIncludes(adProductEfficiencyTrigger.evidenceRule, "advertised_products");
assertIncludes(adProductEfficiencyTrigger.confidenceBoundary, "不能直接解释搜索词");
assertIncludes(adProductEfficiencyTrigger.actionBoundary, "不自动暂停");

const staleAbaTrigger = buildSignalTriggerRationale(staleSignal);

assertIncludes(staleAbaTrigger.objectRule, "ABA");
assertIncludes(staleAbaTrigger.triggerRule, "超过 14 天");
assertIncludes(staleAbaTrigger.evidenceRule, "ABA导出");
assertIncludes(staleAbaTrigger.confidenceBoundary, "数据过期事实");
assertIncludes(staleAbaTrigger.actionBoundary, "重新导入");

const unsupportedHighConfidence = buildSignalEvidenceSupport({
  ...searchTermSignal,
  confidence: "high",
  evidence_count: 2,
  data_sources: [{ source_type: "积加API" }],
  evidence: {
    facts: [{ label: "搜索词花费", value: "80", source_type: "积加API" }],
  },
});

assertIncludes(unsupportedHighConfidence.supportWarning ?? "", "高置信但当前只有 1 个证据来源");

const lowStaleSupport = buildSignalEvidenceSupport({
  ...opportunitySignal,
  confidence: "low",
  freshness_status: "stale",
  evidence_count: 1,
  data_sources: [{ source_type: "ABA导出" }],
  evidence: {
    facts: [{ label: "ABA 周期", value: "2026-05-10 至 2026-05-16", source_type: "ABA导出" }],
  },
});

assertIncludes(lowStaleSupport.confidenceReason, "低置信");
assertIncludes(lowStaleSupport.confidenceReason, "过期或单一数据源");
assertIncludes(lowStaleSupport.supportWarning ?? "", "数据过期");

assertEqual(signalDecisionBoundary(dataQualitySignal), "先补数据，再判断经营问题");
assertEqual(signalDecisionBoundary(staleSignal), "数据已过期，相关结论需要降置信复核");
assertIncludes(signalDecisionBoundary(opportunitySignal) ?? "", "只能进入人工观察");
assertIncludes(signalDecisionBoundary(opportunitySignal) ?? "", "不自动执行广告动作");
assertIncludes(signalDecisionBoundary(adGroupSignal) ?? "", "广告组是投放容器");
assertIncludes(signalDecisionBoundary(searchTermSignal) ?? "", "搜索词只能作为投放判断对象");
assertIncludes(signalDecisionBoundary(placementSignal) ?? "", "广告位只说明流量位置");
assertIncludes(signalDecisionBoundary(advertisedProductSignal) ?? "", "广告商品可以承接广告指标");
assertEqual(signalImpactScope(staleSignal), "影响 ABA 机会判断可信度，不代表广告经营表现本身异常。");
assertEqual(signalImpactScope(dataQualitySignal), "影响数据判断能力，需要先补齐数据再判断经营问题。");
assertEqual(signalImpactScope(adGroupSignal), "影响广告组结构判断；广告组是投放容器，不能直接归因为单个商品。");
assertEqual(signalImpactScope(searchTermSignal), "影响搜索词层面的投放判断，需要结合广告活动和广告组上下文处理。");
assertIncludes(signalImpactScope(opportunitySignal), "影响机会优先级判断");

const adGroupObject: PrimaryObjectForUi = {
  object_type: "ad_group",
  label: "RBK004-Auto",
  campaign_name: "RBK004-AUTO",
  ad_group_name: "RBK004-Auto",
};
const adGroupContext = buildSignalObjectContext(adGroupSignal, adGroupObject);

assertEqual(adGroupContext.items[0].label, "广告活动");
assertEqual(adGroupContext.items[0].value, "RBK004-AUTO");
assertEqual(adGroupContext.items[1].label, "广告组");
assertEqual(adGroupContext.items[1].value, "RBK004-Auto");
assertIncludes(adGroupContext.boundary, "广告组是投放容器");
assertIncludes(adGroupContext.boundary, "不能直接归因为单个商品");

const searchTermObject: PrimaryObjectForUi = {
  object_type: "search_term",
  label: "1 year old sunglasses",
  campaign_name: "RBK004-AUTO",
  ad_group_name: "RBK004-Auto",
  search_term: "1 year old sunglasses",
};
const searchTermContext = buildSignalObjectContext(searchTermSignal, searchTermObject);

assertEqual(searchTermContext.items[0].label, "广告活动");
assertEqual(searchTermContext.items[1].label, "广告组");
assertEqual(searchTermContext.items[2].label, "搜索词");
assertEqual(searchTermContext.items[2].value, "1 year old sunglasses");
assertIncludes(searchTermContext.boundary, "不能强行归属到单个商品");

const placementContext = buildSignalObjectContext(placementSignal, {
  object_type: "placement",
  label: "Detail Page on-Amazon",
  campaign_name: "RBK004-AUTO",
  placement: "Detail Page on-Amazon",
});

assertEqual(placementContext.items[0].label, "广告活动");
assertEqual(placementContext.items[1].label, "广告位");
assertIncludes(placementContext.boundary, "流量位置");

const advertisedProductContext = buildSignalObjectContext(advertisedProductSignal, {
  object_type: "advertised_product",
  label: "儿童太阳镜 A",
  campaign_name: "RBK004-AUTO",
  ad_group_name: "RBK004-Auto",
  asin: "B000TEST01",
  sku: "TEST-SKU-A",
});

assertEqual(advertisedProductContext.items[2].label, "ASIN");
assertEqual(advertisedProductContext.items[2].value, "B000TEST01");
assertIncludes(advertisedProductContext.boundary, "不等同于经营商品");

const overview = buildSignalOverview([dataQualitySignal, staleSignal, searchTermSignal, opportunitySignal]);

assertEqual(overview.high, 2);
assertEqual(overview.anomaly, 1);
assertEqual(overview.opportunity, 1);
assertEqual(overview.dataQuality, 2);
assertEqual(overview.stale, 1);
assertEqual(overview.pending, 3);

const evidenceFacts: EvidenceForUi[] = [
  { label: "ABA 周期", value: "2026-05-10 至 2026-05-16", source_type: "ABA导出" },
  { label: "API 周期", value: "2026-06-08 至 2026-06-14", source_type: "积加API" },
  { label: "过期天数", value: "29", source_type: "ABA导出" },
  { label: "补充说明", value: "缺少来源" },
];

const sourceOptions = buildEvidenceSourceOptions(evidenceFacts);

assertEqual(sourceOptions.length, 4);
assertEqual(sourceOptions[0].sourceType, "all");
assertEqual(sourceOptions[0].label, "全部");
assertEqual(sourceOptions[0].count, 4);
assertEqual(sourceOptions[1].sourceType, "ABA导出");
assertEqual(sourceOptions[1].count, 2);
assertEqual(sourceOptions[2].sourceType, "积加API");
assertEqual(sourceOptions[2].count, 1);
assertEqual(sourceOptions[3].sourceType, "未知来源");
assertEqual(sourceOptions[3].count, 1);

assertEqual(filterEvidenceBySource(evidenceFacts, "all").length, 4);
assertEqual(filterEvidenceBySource(evidenceFacts, "ABA导出").length, 2);
assertEqual(filterEvidenceBySource(evidenceFacts, "未知来源")[0].label, "补充说明");

const evidenceRouteNodes = buildEvidenceRouteNodes(evidenceFacts);

assertEqual(evidenceRouteNodes.map((node) => node.sourceType).join(" / "), "积加API / ABA导出 / 未知来源");
assertEqual(evidenceRouteNodes[0].label, "积加API");
assertEqual(evidenceRouteNodes[0].count, 1);
assertEqual(evidenceRouteNodes[0].status, "已接入");
assertEqual(evidenceRouteNodes[1].count, 2);
assertEqual(evidenceRouteNodes[2].status, "待复核");

const staleAbaEvidence: EvidenceForUi[] = [
  { label: "ABA 行数", value: "1000", source_type: "ABA导出" },
  { label: "ABA 周期", value: "2026-05-10 至 2026-05-16", source_type: "ABA导出" },
  { label: "分析周期结束", value: "2026-06-14", source_type: "积加API" },
  { label: "过期天数", value: "29", source_type: "ABA导出" },
  { label: "过期阈值", value: "14", source_type: "ABA导出" },
];

const keyEvidence = buildKeyEvidenceFacts(staleAbaEvidence);

assertEqual(keyEvidence.length, 3);
assertEqual(keyEvidence[0].label, "过期天数");
assertEqual(keyEvidence[1].label, "ABA 周期");
assertEqual(keyEvidence[2].label, "分析周期结束");

const adGroupEvidence: EvidenceForUi[] = [
  { label: "广告组总花费", value: "100.0", source_type: "积加API" },
  { label: "头部商品花费占比", value: "80.00%", source_type: "积加API" },
  { label: "广告商品清单", value: "B000TEST02 / MSKU-2 / 花费 80.0 / 订单 12；B000TEST01 / MSKU-1 / 花费 20.0 / 订单 2", source_type: "积加API" },
  { label: "商品表现差异", value: "B000TEST02 花费占 80.00%，订单 12，ACOS 33.33%；B000TEST01 花费占 20.00%，订单 2，ACOS 50.00%。", source_type: "积加API" },
  { label: "归因边界", value: "该广告组当前快照匹配到 1 条搜索词表现行，不能自动归属到单个广告商品。", source_type: "积加API" },
  { label: "头部广告商品", value: "广告商品 B", source_type: "积加API" },
];

const adGroupKeyEvidence = buildKeyEvidenceFacts(adGroupEvidence);

assertEqual(adGroupKeyEvidence.length, 3);
assertEqual(adGroupKeyEvidence[0].label, "广告商品清单");
assertEqual(adGroupKeyEvidence[1].label, "商品表现差异");
assertEqual(adGroupKeyEvidence[2].label, "归因边界");

const searchTermSplitEvidence: EvidenceForUi[] = [
  { label: "搜索词", value: "1 year old sunglasses", source_type: "积加API" },
  { label: "投放行数", value: "3", source_type: "积加API" },
  { label: "总花费", value: "4.06", source_type: "积加API" },
  { label: "总订单", value: "2", source_type: "积加API" },
  { label: "无订单花费占比", value: "55.17%", source_type: "积加API" },
  { label: "投放行表现明细", value: "RBK004-AUTO / RBK004-Auto / 投放对象 *：花费 2.24，订单 0，销售额 0.0，ACOS 无销售额，CVR 0.00%", source_type: "积加API" },
];

const searchTermSplitKeyEvidence = buildKeyEvidenceFacts(searchTermSplitEvidence);

assertEqual(searchTermSplitKeyEvidence.length, 3);
assertEqual(searchTermSplitKeyEvidence[0].label, "投放行表现明细");
assertEqual(searchTermSplitKeyEvidence[1].label, "无订单花费占比");

const placementKeyEvidence = buildKeyEvidenceFacts(
  [
    { label: "广告位", value: "Detail Page on-Amazon", source_type: "积加API" },
    { label: "ACOS", value: "24.92%", source_type: "积加API" },
    { label: "订单", value: "4", source_type: "积加API" },
    { label: "转化率", value: "25.00%", source_type: "积加API" },
  ],
  3,
  placementSignal,
);

assertEqual(placementKeyEvidence.length, 3);
assertEqual(placementKeyEvidence[0].label, "广告位");
assertEqual(placementKeyEvidence[1].label, "ACOS");
assertEqual(placementKeyEvidence[2].label, "订单");

const longTailKeyEvidence = buildKeyEvidenceFacts(
  [
    { label: "搜索词", value: "12 month sunglasses", source_type: "积加API" },
    { label: "花费", value: "1.12", source_type: "积加API" },
    { label: "订单", value: "2", source_type: "积加API" },
    { label: "ACOS", value: "4.88%", source_type: "积加API" },
  ],
  3,
  { ...opportunitySignal, signal_category: "search_term_opportunity", object_type: "search_term" },
);

assertEqual(longTailKeyEvidence.length, 3);
assertEqual(longTailKeyEvidence[0].label, "搜索词");
assertEqual(longTailKeyEvidence[1].label, "订单");
assertEqual(longTailKeyEvidence[2].label, "ACOS");

const groupedSearchTermOpportunityKeyEvidence = buildKeyEvidenceFacts(
  [
    { label: "投放上下文数", value: "2", source_type: "积加API" },
    { label: "语义组", value: "规则语义：儿童太阳镜", source_type: "积加API" },
    { label: "合计订单", value: "9", source_type: "积加API" },
    { label: "合计ACOS", value: "6.25%", source_type: "积加API" },
    { label: "ABA排名", value: "208", source_type: "ABA导出" },
  ],
  3,
  { ...opportunitySignal, signal_category: "search_term_opportunity", object_type: "search_term" },
);

assertEqual(groupedSearchTermOpportunityKeyEvidence.length, 3);
assertEqual(groupedSearchTermOpportunityKeyEvidence[0].label, "语义组");
assertEqual(groupedSearchTermOpportunityKeyEvidence[1].label, "投放上下文数");
assertEqual(groupedSearchTermOpportunityKeyEvidence[2].label, "合计订单");

const searchIntentReviewCards = buildSearchIntentReviewCards([
  {
    intent_label: "规则语义：儿童太阳镜",
    search_terms: ["baby sunglasses", "kids sunglasses"],
    metrics: {
      impressions: 0,
      clicks: 18,
      cost: 9,
      orders: 4,
      sales: 70,
      acos: 0.1286,
      cvr: 0.2222,
      cpc: 0.5,
    },
    insight: "该语义类目转化稳定，属于放量候选",
    semantic_source: "规则语义",
    aba_match_count: 1,
    top_search_terms: [
      {
        search_term: "baby sunglasses",
        normalized_query: "baby sunglasses",
        clicks: 12,
        cost: 7,
        orders: 3,
        sales: 50,
        acos: 0.14,
        aba_rank: 120,
        aba_period: "2026-06-07 至 2026-06-13",
        source_row_count: 2,
      },
    ],
  },
]);

assertEqual(searchIntentReviewCards.length, 1);
assertEqual(searchIntentReviewCards[0].title, "规则语义：儿童太阳镜");
assertEqual(searchIntentReviewCards[0].summary, "4 单 / 花费 9 / ACOS 12.86% / ABA 命中 1");
assertEqual(searchIntentReviewCards[0].sourceLabel, "规则语义");
assertEqual(searchIntentReviewCards[0].topTerms[0], "baby sunglasses：3 单 / 花费 7 / ACOS 14.00% / ABA 120");
assertEqual(searchIntentReviewCards[0].intentLabel, "规则语义：儿童太阳镜");

const searchIntentFilteredSignals = filterSignalsBySearchIntent(
  [
    {
      id: "sig-search-intent-primary",
      signal_type: "opportunity",
      signal_category: "search_term_opportunity",
      object_type: "search_term",
      severity: 4,
      status: "pending",
      freshness_status: "api_snapshot",
      evidence: {
        primary_object: { label: "baby sunglasses", intent_label: "规则语义：儿童太阳镜" },
        facts: [],
      },
    },
    {
      id: "sig-search-intent-fact",
      signal_type: "opportunity",
      signal_category: "search_term_opportunity",
      object_type: "search_term",
      severity: 4,
      status: "pending",
      freshness_status: "api_snapshot",
      evidence: {
        primary_object: { label: "beach essentials" },
        facts: [{ label: "语义组", value: "规则语义：海滩出行用品" }],
      },
    },
    {
      id: "sig-ad-group",
      signal_type: "opportunity",
      signal_category: "ad_group_structure",
      object_type: "ad_group",
      severity: 3,
      status: "pending",
      freshness_status: "api_snapshot",
      evidence: {
        primary_object: { label: "广告组", intent_label: "规则语义：儿童太阳镜" },
        facts: [{ label: "语义组", value: "规则语义：儿童太阳镜" }],
      },
    },
  ],
  "规则语义：儿童太阳镜",
);

assertEqual(searchIntentFilteredSignals.length, 1);
assertEqual(searchIntentFilteredSignals[0].id, "sig-search-intent-primary");

const adProductOpportunityKeyEvidence = buildKeyEvidenceFacts(
  [
    { label: "花费", value: "24.0", source_type: "积加API" },
    { label: "广告 ASIN", value: "B000TEST01", source_type: "积加API" },
    { label: "点击", value: "40", source_type: "积加API" },
    { label: "订单", value: "8", source_type: "积加API" },
    { label: "ACOS", value: "20.00%", source_type: "积加API" },
    { label: "同广告组搜索词上下文", value: "1 条：baby sunglasses / 花费 12 / 订单 0", source_type: "积加API" },
    { label: "上下文边界", value: "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。", source_type: "积加API" },
  ],
  3,
  advertisedProductOpportunitySignal,
);

assertEqual(adProductOpportunityKeyEvidence.length, 3);
assertEqual(adProductOpportunityKeyEvidence[0].label, "广告 ASIN");
assertEqual(adProductOpportunityKeyEvidence[1].label, "同广告组搜索词上下文");
assertEqual(adProductOpportunityKeyEvidence[2].label, "上下文边界");

const adProductEfficiencyKeyEvidence = buildKeyEvidenceFacts(
  [
    { label: "花费", value: "28.0", source_type: "积加API" },
    { label: "点击", value: "35", source_type: "积加API" },
    { label: "广告 ASIN", value: "B000TEST01", source_type: "积加API" },
    { label: "ACOS", value: "无销售额", source_type: "积加API" },
    { label: "触发原因", value: "点击充足但订单弱", source_type: "积加API" },
    { label: "同广告组广告位上下文", value: "1 条：Top of Search / 花费 18 / 订单 0", source_type: "积加API" },
    { label: "上下文边界", value: "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。", source_type: "积加API" },
  ],
  3,
  advertisedProductEfficiencySignal,
);

assertEqual(adProductEfficiencyKeyEvidence.length, 3);
assertEqual(adProductEfficiencyKeyEvidence[0].label, "广告 ASIN");
assertEqual(adProductEfficiencyKeyEvidence[1].label, "触发原因");
assertEqual(adProductEfficiencyKeyEvidence[2].label, "上下文边界");

const adProductDrilldownSections = buildEvidenceDrilldownSections([
  { label: "广告 ASIN", value: "B000TEST01", source_type: "积加API" },
  { label: "花费", value: "28.0", source_type: "积加API" },
  { label: "点击", value: "35", source_type: "积加API" },
  { label: "订单", value: "4", source_type: "积加API" },
  { label: "ACOS", value: "20.00%", source_type: "积加API" },
  { label: "同广告组搜索词上下文", value: "1 条：baby sunglasses / 花费 12 / 订单 0", source_type: "积加API" },
  { label: "同广告组广告位上下文", value: "1 条：Top of Search / 花费 18 / 订单 0", source_type: "积加API" },
  { label: "上下文边界", value: "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。", source_type: "积加API" },
]);

assertEqual(adProductDrilldownSections.length, 4);
assertEqual(adProductDrilldownSections[0].key, "product_metrics");
assertEqual(adProductDrilldownSections[0].label, "商品指标");
assertIncludes(adProductDrilldownSections[0].description, "可直接落到当前 ASIN");
assertEqual(adProductDrilldownSections[0].facts.length, 5);
assertEqual(adProductDrilldownSections[1].key, "search_term_context");
assertIncludes(adProductDrilldownSections[1].description, "只说明同广告组搜索词上下文");
assertEqual(adProductDrilldownSections[1].facts[0].label, "同广告组搜索词上下文");
assertEqual(adProductDrilldownSections[2].key, "placement_context");
assertIncludes(adProductDrilldownSections[2].description, "只说明同广告组广告位上下文");
assertEqual(adProductDrilldownSections[2].facts[0].label, "同广告组广告位上下文");
assertEqual(adProductDrilldownSections[3].key, "boundary");
assertEqual(adProductDrilldownSections[3].label, "边界说明");
assertIncludes(adProductDrilldownSections[3].description, "不能自动归因");

const adProductDrilldownWithoutPlacement = buildEvidenceDrilldownSections([
  { label: "广告 ASIN", value: "B000TEST01", source_type: "积加API" },
  { label: "同广告组搜索词上下文", value: "1 条：baby sunglasses / 花费 12 / 订单 0", source_type: "积加API" },
  { label: "上下文边界", value: "搜索词只说明同广告组上下文，不能自动归因到该广告 ASIN。", source_type: "积加API" },
]);

assertEqual(adProductDrilldownWithoutPlacement.length, 3);
assertEqual(adProductDrilldownWithoutPlacement[0].key, "product_metrics");
assertEqual(adProductDrilldownWithoutPlacement[1].key, "search_term_context");
assertEqual(adProductDrilldownWithoutPlacement[2].key, "boundary");

const productCoverageKeyEvidence = buildKeyEvidenceFacts(
  [
    { label: "销售商品指标行", value: "10", source_type: "积加API" },
    { label: "强销售商品", value: "0", source_type: "积加API" },
    { label: "广告商品行", value: "2", source_type: "积加API" },
    { label: "商品关联命中", value: "0", source_type: "积加API" },
  ],
  3,
  {
    ...dataQualitySignal,
    id: "sig-data-quality-product-ad-coverage-unavailable",
  },
);

assertEqual(productCoverageKeyEvidence.length, 3);
assertEqual(productCoverageKeyEvidence[0].label, "销售商品指标行");
assertEqual(productCoverageKeyEvidence[1].label, "强销售商品");
assertEqual(productCoverageKeyEvidence[2].label, "广告商品行");

const adProductComparisonRows = buildAdProductComparisonRows("ad_group", "ad_group_structure", [
  {
    asin: "B000TEST01",
    msku: "MSKU-1",
    product_name: "广告商品 A",
    cost: 20,
    clicks: 12,
    orders: 2,
    sales: 40,
  },
  {
    asin: "B000TEST02",
    msku: "MSKU-2",
    product_name: "广告商品 B",
    spend: 80,
    clicks: 80,
    orders: 12,
    sales: 240,
  },
]);

assertEqual(adProductComparisonRows.length, 2);
assertEqual(adProductComparisonRows[0].asin, "B000TEST02");
assertEqual(adProductComparisonRows[0].spend, 80);
assertEqual(adProductComparisonRows[0].orders, 12);
assertEqual(adProductComparisonRows[0].acos, 0.3333);
assertEqual(adProductComparisonRows[0].cvr, 0.15);
assertEqual(adProductComparisonRows[1].asin, "B000TEST01");
assertEqual(buildAdProductComparisonRows("search_term", "search_term_opportunity", [{ asin: "B000TEST02", cost: 80 }]).length, 0);
