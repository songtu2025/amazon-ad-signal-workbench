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
  buildProductScopeDiagnosisBrief,
  buildProductScopeEntryGuidance,
  buildProductScopeOptionGroups,
  buildProductScopePriorityDecisionBuckets,
  buildProductScopePriorityQueueItems,
  mergeActiveProductScopePriorityTriageHint,
  mergeProductScopePrioritySearchIntentHints,
  buildProductScopeManualActionTargetAlignment,
  buildProductScopeSignalExplanation,
  buildProductScopeAdmissionCard,
  buildNoActionableManualGate,
  buildProductScopeAnalysisPath,
  buildDiagnosisContextSummary,
  buildDiagnosisPathSummary,
  buildProductScopeEvidenceMatrix,
  buildProductScopeEvidenceRouteDecision,
  buildProductScopeEvidenceRouteGuide,
  buildSearchIntentEntryLockSummary,
  buildManualActionCandidateAdGroupBridge,
  buildManualActionDecisionFactItems,
  buildProductScopeQueueHeader,
  buildProductScopeSelectionSummary,
  buildProductScopeCandidateGapExplanation,
  buildSignalEvidenceSupport,
  buildSignalDiagnosticScope,
  buildSelectedSignalScopeContext,
  buildSearchIntentFocusContext,
  buildSearchIntentSelectedTermReasonSummary,
  buildSearchIntentPanelContext,
  buildSearchIntentReviewDecisionSummary,
  buildSignalLayerOverview,
  buildSignalQueueMeta,
  buildSignalQueueObjectStatus,
  buildSignalQueueScopeBadge,
  buildSearchIntentReviewCards,
  buildSignalObjectContext,
  buildSignalOverview,
  buildSignalTriggerRationale,
  buildSignalTriageRationale,
  buildSignalDiagnosisEvidenceSummary,
  buildSignalMetricDecisionItems,
  buildSearchTermOpportunityReviewChain,
  buildSearchTermAdContextRows,
  buildSearchTermAdContextReviewSummary,
  buildManualConfirmationEvidenceItems,
  recommendedManualStatusText,
  recommendedEvidenceDrilldownText,
  nextUnhandledEvidenceDrilldownText,
  manualActionReviewRouteSplitSummary,
  manualActionQueueTargetSwitchSummary,
  signalTriageCompactItems,
  buildRuleFeedbackPrioritySummary,
  buildReviewEvidenceRepairSummary,
  buildReviewReadinessGateSummary,
  signalTriageBlockerTexts,
  signalTriageBusinessEvidenceItems,
  signalTriageDiagnosisContractItems,
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
  selectSearchIntentSignalId,
  resolveSearchIntentFocusSelection,
  filterSignalsByProductScope,
  mergeBackendTriageSignals,
  preferredProductScopeId,
  resolveProductScopePrioritySelectionId,
  resolveProductScopeSelectionId,
  productScopeOptionLabel,
  productScopeAdGroupDiagnosisRows,
  productScopeDrilldownEvidenceItems,
  signalProductScopeIds,
  signalScopedStateKey,
  signalDecisionBoundary,
  signalImpactScope,
  signalCategoryLabel,
  signalQueueKind,
  signalQueueKindLabel,
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
assertIncludes(mismatchedManualActionGate.reason ?? "", "人工留痕目标");

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
    evidence_snapshot_preview: {
      will_write: false,
      will_save_on_authorized_write: true,
      item_count: 2,
      items: [
        { label: "AI 准入", value: "允许人工留痕，不会自动执行广告动作", source: "actionability_status" },
        { label: "动作边界", value: "只允许人工留痕和复盘", source: "business_rule" },
      ],
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
assertIncludes(postWriteReadbackMessage, "复盘排程");
assertIncludes(postWriteReadbackMessage, "7 天 / 14 天");
assertIncludes(postWriteReadbackMessage, "复盘结论 0 条");
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

const manualActionDecisionFacts = buildManualActionDecisionFactItems(
  {
    ...searchTermSignal,
    why: "后端摘要判断 beach essentials 有低花费高转化机会",
    risk: "旧风险字段不应优先覆盖诊断合同",
    uncertainty: "旧不确定性字段不应优先覆盖诊断合同",
  },
  [
    {
      sectionId: "search_term_opportunity",
      title: "搜索词机会",
      businessQuestion: "是否存在可人工复核的扩量机会",
      objectGrain: "搜索词 + 广告组上下文",
      metricText: "花费 $34.11 / 订单 21 / ACOS 17.66%",
      currentJudgement: "可进入人工复核，但不能自动加词",
      proves: "能证明该搜索词在当前广告上下文内有转化",
      doesNotProve: "不能证明应该自动加词、自动调价、自动否词，也不能自动归因到单个 ASIN。",
      evidenceGap: "缺少广告位明细和人工策略确认",
      requiredEvidence: "需要补充广告位、投放词和 7/14 天复盘指标",
      nextManualStep: "人工选择记录观察或加入复盘",
    },
  ],
  "广告搜索词表现：beach essentials 花费 34.11 / 订单 21",
);
assertEqual(manualActionDecisionFacts.map((item) => item.label).join(" / "), "处理依据 / 风险 / 不确定性");
assertIncludes(manualActionDecisionFacts[0].value, "业务问题：是否存在可人工复核的扩量机会");
assertIncludes(manualActionDecisionFacts[0].value, "当前判断：可进入人工复核");
assertIncludes(manualActionDecisionFacts[0].value, "证据摘要：");
assertIncludes(manualActionDecisionFacts[0].value, "beach essentials");
assertIncludes(manualActionDecisionFacts[0].value, "人工下一步：人工选择记录观察或加入复盘");
assertIncludes(manualActionDecisionFacts[1].value, "不能证明应该自动加词");
assertIncludes(manualActionDecisionFacts[1].value, "自动调价");
assertIncludes(manualActionDecisionFacts[2].value, "证据缺口");
assertIncludes(manualActionDecisionFacts[2].value, "需要补证");
assertIncludes(manualActionDecisionFacts[2].value, "广告位");

const fallbackManualActionDecisionFacts = buildManualActionDecisionFactItems({
  ...advertisedProductSignal,
  risk: "广告商品指标不能解释搜索词来源",
  uncertainty: "缺少广告位证据",
});
assertIncludes(fallbackManualActionDecisionFacts[0].value, "广告商品可以承接广告指标");
assertIncludes(fallbackManualActionDecisionFacts[1].value, "广告商品指标不能解释搜索词来源");
assertIncludes(fallbackManualActionDecisionFacts[2].value, "缺少广告位证据");

const advertisedProductEfficiencySignal = {
  ...advertisedProductSignal,
  id: "sig-ad-product-efficiency",
  signal_type: "anomaly",
  signal_category: "advertised_product_efficiency",
  severity: 4,
} as const satisfies SignalForUi & { object_type: "advertised_product" };

const reviewSignal = {
  id: "sig-review-effect",
  signal_type: "opportunity",
  signal_category: "review_effect",
  severity: 2,
  status: "pending",
  freshness_status: "api_snapshot",
  object_type: "cross",
} as const satisfies SignalForUi & { object_type: "cross" };

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
assertEqual(signalQueueKindLabel(signalQueueKind(dataQualitySignal)), "数据质量");
assertEqual(signalCategoryLabel(opportunitySignal), "市场机会");
assertEqual(signalCategoryLabel({ ...opportunitySignal, signal_category: "search_term_opportunity", object_type: "search_term" }), "搜索词机会");
assertEqual(signalCategoryLabel(advertisedProductOpportunitySignal), "广告商品机会");
assertEqual(signalCategoryLabel({ ...opportunitySignal, signal_category: "aba_market_opportunity", object_type: "search_term" }), "ABA市场机会");
assertEqual(signalQueueKind(opportunitySignal), "opportunity_expansion");
assertEqual(signalQueueKindLabel(signalQueueKind(opportunitySignal)), "机会扩量");
assertEqual(signalQueueKind(searchTermSignal), "spend_waste");
assertEqual(signalQueueKindLabel(signalQueueKind(searchTermSignal)), "花费浪费");
assertEqual(signalQueueKind(adGroupSignal), "structure_boundary");
assertEqual(signalQueueKind(placementSignal), "structure_boundary");
assertEqual(signalQueueKindLabel(signalQueueKind(adGroupSignal)), "投放结构");
assertEqual(signalQueueKind(reviewSignal), "review");
assertEqual(signalQueueKindLabel(signalQueueKind(reviewSignal)), "复盘");
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
const productScopeSelectionOptions: ProductScopeFilterOption[] = [
  { scope_id: "all", scope_type: "all" },
  {
    scope_id: "parent_asin:B0PARENT",
    scope_type: "parent_asin",
    label: "Parent ASIN B0PARENT",
    parent_asin: "B0PARENT",
    child_asins: ["B000TEST01"],
    ad_spend: 12,
  },
  {
    scope_id: "ad_asin:B000TEST01",
    scope_type: "advertised_asin",
    label: "广告 ASIN B000TEST01",
    asin: "B000TEST01",
    ad_spend: 8,
  },
];
assertEqual(resolveProductScopeSelectionId(null, productScopeSelectionOptions), "parent_asin:B0PARENT");
assertEqual(resolveProductScopeSelectionId("ad_asin:B000TEST01", productScopeSelectionOptions), "ad_asin:B000TEST01");
assertEqual(resolveProductScopeSelectionId("missing-scope", productScopeSelectionOptions), "parent_asin:B0PARENT");

assertEqual(productScopeOptionLabel({ scope_id: "all", scope_type: "all", label: "全量排查（商品 + 未归因 + 数据质量）" }), "辅助入口：全量排查（商品 + 未归因 + 数据质量）");
assertEqual(productScopeOptionLabel({ scope_id: "unattributed", scope_type: "unattributed", label: "未归因广告数据" }), "辅助入口：未归因广告数据");
assertEqual(productScopeOptionLabel({ scope_id: "parent_asin:B0PARENT", scope_type: "parent_asin", label: "Parent ASIN B0PARENT" }), "经营入口：Parent ASIN B0PARENT");
assertEqual(productScopeOptionLabel({ scope_id: "ad_asin:B000TEST01", scope_type: "advertised_asin", label: "广告 ASIN B000TEST01" }), "广告下钻：广告 ASIN B000TEST01");
assertEqual(productScopeOptionLabel({ scope_id: "sales_asin:B000SALES1", scope_type: "sales_asin", label: "销售 ASIN B000SALES1" }), "销售背景：销售 ASIN B000SALES1");

const productScopeOptionGroups = buildProductScopeOptionGroups([
  { scope_id: "all", scope_type: "all", label: "全量排查" },
  { scope_id: "unattributed", scope_type: "unattributed", label: "未归因广告数据" },
  { scope_id: "parent_asin:B0PARENT", scope_type: "parent_asin", label: "Parent ASIN B0PARENT" },
  { scope_id: "ad_asin:B000TEST01", scope_type: "advertised_asin", label: "广告 ASIN B000TEST01" },
  { scope_id: "sales_asin:B000SALES1", scope_type: "sales_asin", label: "销售 ASIN B000SALES1" },
]);

assertEqual(
  productScopeOptionGroups.map((group) => group.label).join(" / "),
  "经营入口（Parent ASIN） / 广告下钻入口（仅已投广告 ASIN） / 辅助排查入口（非广告动作对象）",
);
assertEqual(productScopeOptionGroups[0].options.map((option) => option.scope_id).join(","), "parent_asin:B0PARENT");
assertEqual(productScopeOptionGroups[1].options.map((option) => option.scope_id).join(","), "ad_asin:B000TEST01");
assertEqual(productScopeOptionGroups[2].options.map((option) => option.scope_id).join(","), "all,unattributed,sales_asin:B000SALES1");

const productScopePriorityQueueItems = buildProductScopePriorityQueueItems(
  [
    {
      scope_id: "parent_asin:B0REVIEW",
      scope_type: "parent_asin",
      label: "Parent ASIN B0REVIEW",
      parent_asin: "B0REVIEW",
      child_asins: ["B0REVIEWCHILD"],
      ad_spend: 20,
      ad_orders: 1,
      ad_sales: 30,
    },
    {
      scope_id: "parent_asin:B0URGENT",
      scope_type: "parent_asin",
      label: "Parent ASIN B0URGENT",
      parent_asin: "B0URGENT",
      child_asins: ["B0URGENTCHILD"],
      ad_spend: 140,
      ad_orders: 0,
      ad_sales: 0,
    },
    {
      scope_id: "parent_asin:B0WATCH",
      scope_type: "parent_asin",
      label: "Parent ASIN B0WATCH",
      parent_asin: "B0WATCH",
      child_asins: ["B0WATCHCHILD"],
      ad_spend: 9,
      ad_orders: 1,
      ad_sales: 18,
    },
    {
      scope_id: "parent_asin:B0QUIET",
      scope_type: "parent_asin",
      label: "Parent ASIN B0QUIET",
      parent_asin: "B0QUIET",
      child_asins: ["B0QUIETCHILD"],
    },
  ],
  [
    {
      ...searchTermSignal,
      id: "sig-review-parent",
      severity: 2,
      evidence: { source_rows: [{ source_table: "advertised_products", asin: "B0REVIEWCHILD" }] },
    },
    {
      ...advertisedProductSignal,
      id: "sig-urgent-parent",
      severity: 5,
      evidence: {
        primary_object: { label: "B0URGENTCHILD", asin: "B0URGENTCHILD" },
        source_rows: [{ source_table: "advertised_products", asin: "B0URGENTCHILD" }],
      },
    },
  ] satisfies ProductScopedSignalForUi[],
  [{ signal_id: "sig-review-parent", is_due: true }],
);
assertEqual(productScopePriorityQueueItems.map((item) => item.scopeId).join(","), "parent_asin:B0REVIEW,parent_asin:B0URGENT,parent_asin:B0WATCH,parent_asin:B0QUIET");
assertEqual(productScopePriorityQueueItems[0].priorityLabel, "先复盘");
assertEqual(productScopePriorityQueueItems[0].tone, "review");
assertEqual(productScopePriorityQueueItems[0].actionCue, "先复盘");
assertEqual(productScopePriorityQueueItems[0].workflowStatus.label, "到期复盘");
assertIncludes(productScopePriorityQueueItems[0].workflowStatus.nextStep, "复盘效果 ready");
assertIncludes(productScopePriorityQueueItems[0].mainQuestion, "已到期复盘");
assertIncludes(productScopePriorityQueueItems[0].decisionBadge, "人工动作：先复盘");
assertIncludes(productScopePriorityQueueItems[0].decisionBadge, "复盘状态：到期 1 项");
assertIncludes(productScopePriorityQueueItems[1].mainQuestion, "高优先级广告信号");
assertEqual(productScopePriorityQueueItems[1].actionCue, "先止损");
assertEqual(productScopePriorityQueueItems[1].workflowStatus.label, "待人工确认");
assertIncludes(productScopePriorityQueueItems[1].workflowStatus.reason, "高优先广告信号");
assertIncludes(productScopePriorityQueueItems[1].decisionBadge, "人工动作：右侧人工确认");
assertIncludes(productScopePriorityQueueItems[1].decisionBadge, "复盘状态：未排程");
assertIncludes(productScopePriorityQueueItems[1].nextManualStep, "右侧选择记录观察、标记已处理、加入复盘或忽略本次");
assertIncludes(productScopePriorityQueueItems[1].boundary, "未投放子 ASIN 不进入广告动作对象");
assertEqual(productScopePriorityQueueItems[2].priorityLabel, "观察");
assertEqual(productScopePriorityQueueItems[2].actionCue, "只观察");
assertEqual(productScopePriorityQueueItems[2].workflowStatus.label, "仅观察");
assertIncludes(productScopePriorityQueueItems[2].workflowStatus.nextStep, "不逐层阅读完整报表");
assertIncludes(productScopePriorityQueueItems[2].decisionBadge, "人工动作：保持观察");
assertIncludes(productScopePriorityQueueItems[2].decisionBadge, "按需加入复盘");
assertEqual(productScopePriorityQueueItems[3].priorityLabel, "暂不展开");
assertEqual(productScopePriorityQueueItems[3].actionCue, "暂不展开");
assertEqual(productScopePriorityQueueItems[3].workflowStatus.label, "证据缺口");
assertIncludes(productScopePriorityQueueItems[3].workflowStatus.reason, "没有投放广告证据");
assertIncludes(productScopePriorityQueueItems[3].decisionBadge, "人工动作：暂不展开");
assertIncludes(productScopePriorityQueueItems[3].decisionBadge, "复盘状态：无待办");
assertIncludes(productScopePriorityQueueItems[3].evidenceSummary, "当前无投放广告证据");

const triagedProductScopePriorityQueueItems = mergeActiveProductScopePriorityTriageHint(productScopePriorityQueueItems, {
  product_scope_gate: {
    status: "ready",
    is_actionable: true,
    selected_product_scope_id: "parent_asin:B0WATCH",
    candidate_pool_count: 3,
    message: "已锁定 Parent ASIN / ASIN 经营对象，可进入广告证据下钻和人工确认。",
  },
  signal_status: { signal_count: 2, candidate_count: 3 },
  recommended_candidate: {
    signal_id: "sig-search-term-beach",
    object_type: "search_term",
    object_label: "beach essentials",
    stable_object_id: "search_term:1:beach essentials",
  },
});
assertEqual(triagedProductScopePriorityQueueItems[0].scopeId, "parent_asin:B0REVIEW");
const triagedWatchPriorityItem = triagedProductScopePriorityQueueItems.find((item) => item.scopeId === "parent_asin:B0WATCH");
assertEqual(triagedWatchPriorityItem?.priorityLabel, "人工确认");
assertEqual(triagedWatchPriorityItem?.tone, "urgent");
assertEqual(triagedWatchPriorityItem?.actionCue, "先确认");
assertEqual(triagedWatchPriorityItem?.workflowStatus.label, "待人工确认");
assertIncludes(triagedWatchPriorityItem?.workflowStatus.reason ?? "", "可复核候选");
assertIncludes(triagedWatchPriorityItem?.mainQuestion ?? "", "可人工复核候选");
assertIncludes(triagedWatchPriorityItem?.evidenceSummary ?? "", "后端候选 3 个");
assertIncludes(triagedWatchPriorityItem?.evidenceSummary ?? "", "beach essentials");
assertIncludes(triagedWatchPriorityItem?.decisionBadge ?? "", "候选：beach essentials");
assertIncludes(triagedWatchPriorityItem?.nextManualStep ?? "", "投放词、广告组、广告 ASIN");
assertIncludes(triagedWatchPriorityItem?.boundary ?? "", "不代表自动加词、否词、调价或暂停广告");

const searchIntentEnhancedPriorityQueueItems = mergeProductScopePrioritySearchIntentHints(productScopePriorityQueueItems, {
  "parent_asin:B0WATCH": [
    {
      intent_label: "规则语义：海滩出行用品",
      search_terms: ["beach essentials"],
      metrics: {
        impressions: 800,
        clicks: 40,
        cost: 24,
        orders: 8,
        sales: 96,
        acos: 0.25,
        cvr: 0.2,
        cpc: 0.6,
      },
      insight: "该语义类目转化稳定，属于放量候选",
      semantic_source: "规则语义",
      aba_match_count: 1,
      data_grain: "当前 Parent ASIN 相关广告上下文中实际产生表现的用户搜索词行，按标准化用户搜索词及规则归类聚合",
      business_question: "这组同类广告用户搜索词在当前 Parent ASIN 广告上下文下，是应该扩量、止损，还是只观察？",
      current_judgement: "当前判断：有订单且 ACOS 较低，优先复核是否存在可人工确认的扩量机会。",
      metric_purpose: "指标目的：花费 24 和点击 40 判断消耗规模；订单 8、CVR 20.00%、ACOS 25.00% 判断承接质量。",
      ad_context: "广告上下文：覆盖 1 个广告活动、1 个广告组、1 条搜索词表现行；仍需核对同广告组投放商品。",
      evidence_gap: "证据缺口：广告位影响需要继续打开广告位证据核对。",
      proves: "能证明当前广告上下文内同类广告搜索词有订单和 ABA 背景。",
      does_not_prove: "不能证明 Parent ASIN 下全部自然搜索或市场搜索表现，也不能把搜索词表现分组当作人工动作对象。",
      next_manual_step: "逐条打开具体 SearchTerm 信号，人工核对投放词、广告组和广告位。",
      top_search_terms: [
        {
          search_term: "beach essentials",
          normalized_query: "beach essentials",
          ad_group_names: ["beach essentials 精准"],
          targeting_texts: ["beach essentials"],
          clicks: 40,
          cost: 24,
          orders: 8,
          sales: 96,
          acos: 0.25,
          aba_rank: 208,
          aba_period: "2026-06-07 至 2026-06-13",
          source_row_count: 2,
        },
      ],
    },
  ],
});
assertEqual(searchIntentEnhancedPriorityQueueItems[0].scopeId, "parent_asin:B0REVIEW");
const searchIntentEnhancedWatchPriorityItem = searchIntentEnhancedPriorityQueueItems.find((item) => item.scopeId === "parent_asin:B0WATCH");
assertEqual(searchIntentEnhancedWatchPriorityItem?.priorityLabel, "搜索词扩量");
assertEqual(searchIntentEnhancedWatchPriorityItem?.tone, "urgent");
assertEqual(searchIntentEnhancedWatchPriorityItem?.actionCue, "先扩量");
assertEqual(searchIntentEnhancedWatchPriorityItem?.workflowStatus.label, "待人工确认");
assertIncludes(searchIntentEnhancedWatchPriorityItem?.workflowStatus.reason ?? "", "具体 SearchTerm");
assertIncludes(searchIntentEnhancedWatchPriorityItem?.mainQuestion ?? "", "广告搜索词复核线索");
assertIncludes(searchIntentEnhancedWatchPriorityItem?.evidenceSummary ?? "", "搜索词复核 1 组");
assertIncludes(searchIntentEnhancedWatchPriorityItem?.evidenceSummary ?? "", "扩量复核");
assertIncludes(searchIntentEnhancedWatchPriorityItem?.rankReason ?? "", "搜索词复核摘要");
assertIncludes(searchIntentEnhancedWatchPriorityItem?.decisionBadge ?? "", "搜索词：扩量复核");
assertIncludes(searchIntentEnhancedWatchPriorityItem?.nextManualStep ?? "", "具体 SearchTerm 诊断");
assertIncludes(searchIntentEnhancedWatchPriorityItem?.boundary ?? "", "不把搜索词表现分组当作人工动作对象");
assertIncludes(searchIntentEnhancedWatchPriorityItem?.boundary ?? "", "不自动加词、否词、调价或暂停广告");

const productScopePriorityDecisionBuckets = buildProductScopePriorityDecisionBuckets(productScopePriorityQueueItems);
assertEqual(productScopePriorityDecisionBuckets.map((bucket) => `${bucket.label}:${bucket.count}`).join(" / "), "复盘优先:1 / 人工确认:1 / 保持观察:1 / 暂不展开:1");
assertIncludes(productScopePriorityDecisionBuckets[0].action, "先看 1 条到期复盘");
assertIncludes(productScopePriorityDecisionBuckets[1].action, "记录观察、标记已处理、加入复盘或忽略本次");
assertIncludes(productScopePriorityDecisionBuckets[1].boundary, "不自动调价、暂停、加词或否词");
assertIncludes(productScopePriorityDecisionBuckets[2].action, "只在广告证据变化或新增信号时复核");
assertIncludes(productScopePriorityDecisionBuckets[3].boundary, "没有广告证据的 Parent ASIN");

const prioritySelectionOptions = [
  {
    scope_id: "parent_asin:B0FIRST",
    scope_type: "parent_asin",
    label: "Parent ASIN B0FIRST",
    parent_asin: "B0FIRST",
    child_asins: ["B0FIRSTCHILD"],
    ad_spend: 5,
  },
  {
    scope_id: "parent_asin:B0DUE",
    scope_type: "parent_asin",
    label: "Parent ASIN B0DUE",
    parent_asin: "B0DUE",
    child_asins: ["B0DUECHILD"],
    ad_spend: 20,
  },
] satisfies ProductScopeFilterOption[];
const prioritySelectionSignals = [
  {
    ...searchTermSignal,
    id: "sig-due-parent",
    evidence: { source_rows: [{ source_table: "advertised_products", asin: "B0DUECHILD" }] },
  },
] satisfies ProductScopedSignalForUi[];
assertEqual(
  resolveProductScopePrioritySelectionId(null, prioritySelectionOptions, prioritySelectionSignals, [
    { signal_id: "sig-due-parent", is_due: true },
  ]),
  "parent_asin:B0DUE",
);
assertEqual(
  resolveProductScopePrioritySelectionId("parent_asin:B0FIRST", prioritySelectionOptions, prioritySelectionSignals, [
    { signal_id: "sig-due-parent", is_due: true },
  ]),
  "parent_asin:B0FIRST",
);
assertEqual(
  resolveProductScopePrioritySelectionId("missing-scope", prioritySelectionOptions, prioritySelectionSignals, [
    { signal_id: "sig-due-parent", is_due: true },
  ]),
  "parent_asin:B0DUE",
);

const readyTargetAlignment = buildProductScopeManualActionTargetAlignment({
  priorityItem: productScopePriorityQueueItems[0],
  selectedSignal: {
    ...searchTermSignal,
    id: "sig-search-term-beach-essentials",
    evidence: {
      primary_object: {
        object_type: "search_term",
        object_id: "search_term:1:beach essentials",
        label: "beach essentials",
      },
    },
  },
  manualActionPreview: {
    willWrite: false,
    actionType: "add_to_review",
    objectType: "search_term",
    objectId: "search_term:1:beach essentials",
    objectLabel: "beach essentials",
    reviewWindows: ["7d", "14d"],
    preflightChecks: [],
  },
  preflight: {
    status: "ready_for_explicit_manual_write",
    target: {
      signal_id: "sig-search-term-beach-essentials",
      object_type: "search_term",
      object_id: "search_term:1:beach essentials",
      object_label: "beach essentials",
    },
  },
});
assertEqual(readyTargetAlignment.tone, "ready");
assertIncludes(readyTargetAlignment.title, "链路一致");
assertIncludes(readyTargetAlignment.items.map((item) => item.label).join(" / "), "今日优先入口");
assertIncludes(readyTargetAlignment.items.map((item) => item.label).join(" / "), "后端预检对象");
assertIncludes(readyTargetAlignment.boundary, "不代表自动加词");

const blockedTargetAlignment = buildProductScopeManualActionTargetAlignment({
  priorityItem: productScopePriorityQueueItems[0],
  selectedSignal: {
    ...searchTermSignal,
    id: "sig-search-term-beach-essentials",
    evidence: {
      primary_object: {
        object_type: "search_term",
        object_id: "search_term:1:beach essentials",
        label: "beach essentials",
      },
    },
  },
  manualActionPreview: {
    willWrite: false,
    actionType: "add_to_review",
    objectType: "search_term",
    objectId: "search_term:1:beach essentials",
    objectLabel: "beach essentials",
    reviewWindows: ["7d", "14d"],
    preflightChecks: [],
  },
  preflight: {
    status: "ready_for_explicit_manual_write",
    target: {
      signal_id: "sig-other-search-term",
      object_type: "search_term",
      object_id: "search_term:1:other",
      object_label: "other",
    },
  },
});
assertEqual(blockedTargetAlignment.tone, "blocked");
assertIncludes(blockedTargetAlignment.primary, "不一致");
assertIncludes(blockedTargetAlignment.boundary, "不能把一个 Parent ASIN 下看到的证据保存到另一条 SearchTerm");

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

const salesContextSignal = {
  ...opportunitySignal,
  id: "sig-sales-context",
  signal_category: "product_ad_coverage",
  object_type: "sales_product",
  priority: "P1",
  severity: 2,
  evidence: {
    primary_object: {
      object_type: "sales_product",
      label: "销售 ASIN B016EXMW1G",
      asin: "B016EXMW1G",
    },
  },
} satisfies ProductScopedSignalForUi & { priority: "P1"; object_type: "sales_product" };

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

const salesScopeMergedSignals = mergeBackendTriageSignals<ProductScopedSignalForUi>(
  [salesContextSignal],
  [noStrategyAdProductCandidateSignal],
  {
    product_scope_gate: {
      status: "requires_product_scope",
      is_actionable: false,
      selected_product_scope_id: "sales_asin:B016EXMW1G",
      message: "当前是销售背景 ASIN，广告 AI 信号必须从 Parent ASIN 或已有广告数据的广告 ASIN 进入。",
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
assertEqual(salesScopeMergedSignals.map((signal) => signal.id).join(","), "sig-sales-context");

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
assertIncludes(backendManualActionTargetSummary, "复盘对象：B016EXMW02");
assertIncludes(backendManualActionTargetSummary, "对象身份：广告商品");
assertIncludes(backendManualActionTargetSummary, "复盘窗口：7 天 / 14 天");
assertNotIncludes(backendManualActionTargetSummary, "对象：advertised_product / B016EXMW02");
assertNotIncludes(backendManualActionTargetSummary, "窗口：7d / 14d");
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
assertIncludes(nextUnhandledManualActionCandidate?.reason ?? "", "本次待授权对象 RBK004-RBK004-2 深蓝");
assertIncludes(nextUnhandledManualActionCandidate?.reason ?? "", "加入复盘");
assertNotIncludes(nextUnhandledManualActionCandidate?.reason ?? "", "add_to_review");
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
  "sig-next-unhandled",
);
assertEqual(
  resolveSignalSelectionId(
    "sig-ad-product-main-push",
    [
      mainPushAdProductCandidateSignal,
      noStrategyAdProductCandidateSignal,
      { ...noStrategyAdProductCandidateSignal, id: "sig-next-unhandled" },
    ],
    handledRecommendedWithNextSummary,
  ),
  "sig-ad-product-main-push",
);
assertEqual(manualActionPreviewForSelectedSignal("sig-ad-product-no-strategy", handledRecommendedWithNextSummary, noStrategyAdProductCandidateSignal), null);

const mergedNextUnhandledFallbackSignals = mergeBackendTriageSignals<ProductScopedSignalForUi>([], [], handledRecommendedWithNextSummary);
const mergedFallbackNextSignal = mergedNextUnhandledFallbackSignals.find((signal) => signal.id === "sig-next-unhandled");
if (!mergedFallbackNextSignal) {
  throw new Error("triage 下一候选缺少 /api/signals 同 ID 时，前端应合成最小可复核信号");
}
assertEqual(mergedFallbackNextSignal.signal_type, "opportunity");
assertEqual(mergedFallbackNextSignal.signal_category, "product_ad_coverage");
assertEqual(mergedFallbackNextSignal.object_type, "sales_product");
assertEqual(mergedFallbackNextSignal.evidence?.primary_object?.asin, "B06VW5SQ97");
assertEqual(resolveSignalSelectionId(null, mergedNextUnhandledFallbackSignals, handledRecommendedWithNextSummary), "sig-next-unhandled");
const mergedFallbackNextCandidate = buildNextUnhandledManualActionCandidate(
  mergedNextUnhandledFallbackSignals,
  handledRecommendedWithNextSummary,
);
assertEqual(mergedFallbackNextCandidate?.objectLabel, handledRecommendedWithNextSummary.next_unhandled_candidate.object_label);
assertEqual(mergedFallbackNextCandidate?.manualActionPreview.objectId, "B06VW5SQ97");
assertEqual(
  manualActionPreviewForSelectedSignal("sig-next-unhandled", handledRecommendedWithNextSummary, mergedFallbackNextSignal)?.objectId,
  "B06VW5SQ97",
);
const selectedRecommendedTargetSwitch = manualActionQueueTargetSwitchSummary(
  handledRecommendedWithNextSummary,
  "sig-ad-product-no-strategy",
);
assertEqual(selectedRecommendedTargetSwitch?.tone, "blocked");
assertIncludes(selectedRecommendedTargetSwitch?.primary ?? "", "B016EXMW02");
assertIncludes(selectedRecommendedTargetSwitch?.primary ?? "", "已留痕对象");
assertIncludes(selectedRecommendedTargetSwitch?.diagnosisObject ?? "", "B016EXMW02");
assertIncludes(selectedRecommendedTargetSwitch?.writeTarget ?? "", "B06VW5SQ97");
assertIncludes(selectedRecommendedTargetSwitch?.boundary ?? "", "右侧按钮只保存本次待授权对象");
assertIncludes(selectedRecommendedTargetSwitch?.boundary ?? "", "不能互借状态");

const selectedNextTargetSwitch = manualActionQueueTargetSwitchSummary(handledRecommendedWithNextSummary, "sig-next-unhandled");
assertEqual(selectedNextTargetSwitch?.tone, "ready");
assertIncludes(selectedNextTargetSwitch?.primary ?? "", "RBK004-RBK004-2 深蓝");
assertIncludes(selectedNextTargetSwitch?.primary ?? "", "本次按钮只写入");
const selectedNextRouteSplit = manualActionReviewRouteSplitSummary(handledRecommendedWithNextSummary, "sig-next-unhandled", {
  tone: "ready",
  target: "目标：sales_product / B06VW5SQ97 / RBK004-RBK004-2 深蓝",
  currentState: "当前：ManualAction 0 条 / ReviewTodo 0 条",
  authorizedResult: "授权后预期：ManualAction 1 条 / ReviewTodo 2 条 / 窗口 7d / 14d",
  evidence: "证据快照：21 条，授权写入时会随 ManualAction 保存并继承到 ReviewTodo。",
  boundary: "ready 只代表可人工确认，未授权前不写 manual_actions。",
});
assertEqual(selectedNextRouteSplit?.tone, "ready");
assertIncludes(selectedNextRouteSplit?.primary ?? "", "默认只处理本次写入对象");
assertIncludes(selectedNextRouteSplit?.primary ?? "", "B016EXMW02 只作为已留痕边界");
const selectedNextRouteSplitText = JSON.stringify(selectedNextRouteSplit);
assertIncludes(selectedNextRouteSplitText, "已留痕对象");
assertIncludes(selectedNextRouteSplitText, "ManualAction 1 条 / ReviewTodo 2 条");
assertIncludes(selectedNextRouteSplitText, "本次写入对象");
const selectedNextWaitingRouteSplit = manualActionReviewRouteSplitSummary(handledRecommendedWithNextSummary, "sig-next-unhandled", {
  tone: "waiting",
  target: "目标：sales_product / B06VW5SQ97 / RBK004-RBK004-2 深蓝",
  currentState: "当前：等待后端只读预检读回 ManualAction / ReviewTodo 计数",
  authorizedResult: "授权后预期：人工点击后才生成 ManualAction 和 7/14 天 ReviewTodo",
  evidence: "证据快照：等待只读预检确认，未确认前不能写入",
});
const selectedNextWaitingRouteSplitText = JSON.stringify(selectedNextWaitingRouteSplit);
assertIncludes(selectedNextWaitingRouteSplitText, "等待预检");
assertNotIncludes(selectedNextWaitingRouteSplitText, "先确认选中对象");

const searchTermHandledWithNextSummary = {
  recommended_manual_status: {
    has_manual_action: true,
    object_label: "beach essentials",
    object_id: "search_term:1:beach essentials",
  },
  recommended_candidate: {
    signal_id: "sig-opportunity-search-term-1-beach-essentials",
    object_type: "search_term",
    object_label: "beach essentials",
    object_id: "search_term:1:beach essentials",
    stable_object_id: "search_term:1:beach essentials",
  },
  next_unhandled_candidate: {
    signal_id: "sig-opportunity-search-term-1-beach-vacation-essentials",
    object_type: "search_term",
    object_label: "beach vacation essentials",
    object_id: "search_term:1:beach vacation essentials",
    stable_object_id: "search_term:1:beach vacation essentials",
    manual_action_preview: {
      signal_id: "sig-opportunity-search-term-1-beach-vacation-essentials",
      action_type: "add_to_review",
      object_type: "search_term",
      object_id: "search_term:1:beach vacation essentials",
      object_label: "beach vacation essentials",
      review_windows: ["7d", "14d"],
    },
  },
};
const selectedSearchTermTargetSwitch = manualActionQueueTargetSwitchSummary(
  searchTermHandledWithNextSummary,
  "sig-opportunity-search-term-1-beach-essentials",
);
assertIncludes(selectedSearchTermTargetSwitch?.diagnosisObject ?? "", "具体 SearchTerm：beach essentials");
assertIncludes(selectedSearchTermTargetSwitch?.diagnosisObject ?? "", "稳定对象：search_term / search_term:1:beach essentials");
assertIncludes(selectedSearchTermTargetSwitch?.writeTarget ?? "", "具体 SearchTerm：beach vacation essentials");
assertIncludes(selectedSearchTermTargetSwitch?.writeTarget ?? "", "稳定对象：search_term / search_term:1:beach vacation essentials");
assertIncludes(selectedNextRouteSplitText, "ManualAction 0 条 / ReviewTodo 0 条");
assertIncludes(selectedNextRouteSplitText, "授权后预期：ManualAction 1 条 / ReviewTodo 2 条");
assertIncludes(selectedNextRouteSplitText, "ready 只代表可人工确认");
assertIncludes(selectedNextRouteSplitText, "不能互借状态");
const selectedRecommendedRouteSplit = manualActionReviewRouteSplitSummary(
  handledRecommendedWithNextSummary,
  "sig-ad-product-no-strategy",
  selectedNextRouteSplit?.rows[1] ? { tone: "ready" } : null,
);
assertEqual(selectedRecommendedRouteSplit?.tone, "blocked");
assertIncludes(JSON.stringify(selectedRecommendedRouteSplit), "先切换候选");

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

const separatedRecommendedManualStatus = recommendedManualStatusText({
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
});
assertIncludes(separatedRecommendedManualStatus ?? "", "等待 7 天 / 14 天完整窗口");
assertNotIncludes(separatedRecommendedManualStatus ?? "", "本次待授权对象 RBK004-RBK004-2 深蓝");

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
          targeting_context: {
            targeting_count: 1,
            report_row_count: 2,
            diagnosis_summary: "投放词 1 个 / 有效投放词 1 个 / 无订单消耗投放词 0 个",
            next_review_focus: "先把有效投放词作为正向样本，再对比其带来的搜索词是否稳定。",
            boundary: "投放词来自搜索词表现行，不代表完整关键词库；不能自动加词、否词或调价。",
            top_targetings: [{ targeting_text: "kids sunglasses", spend: 13, clicks: 20, orders: 2, sales: 40 }],
            effective_targetings: [{ targeting_text: "kids sunglasses", spend: 13, clicks: 20, orders: 2, sales: 40 }],
            zero_order_spend_targetings: [],
          },
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
          targeting_context: {
            targeting_count: 1,
            report_row_count: 2,
            diagnosis_summary: "投放词 1 个 / 有效投放词 1 个 / 无订单消耗投放词 0 个",
            next_review_focus: "先把有效投放词作为正向样本，再对比其带来的搜索词是否稳定。",
            boundary: "投放词来自搜索词表现行中的 keyword_text / target_id，不代表完整关键词库；只能用于人工复核同广告组结构。",
            top_targetings: [{ targeting_text: "kids sunglasses", spend: 27, clicks: 62, orders: 9, sales: 120, source_label: "关键词" }],
            effective_targetings: [{ targeting_text: "kids sunglasses", spend: 27, clicks: 62, orders: 9, sales: 120, source_label: "关键词" }],
            zero_order_spend_targetings: [],
          },
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
        advertised_product_performance: [
          {
            asin: "B016EXMVZS",
            msku: "RBK004-1",
            label: "B016EXMVZS",
            spend: 100,
            clicks: 50,
            orders: 20,
            sales: 400,
            acos: 0.25,
            cvr: 0.4,
            row_count: 1,
          },
          {
            asin: "B016EXMW02",
            msku: "RBK004-2",
            label: "B016EXMW02",
            spend: 40,
            clicks: 20,
            orders: 8,
            sales: 160,
            acos: 0.25,
            cvr: 0.4,
            row_count: 1,
            sample_boundary: "点击样本少，仅适合观察。",
          },
        ],
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
          effective_terms: [
            {
              search_term: "kids sunglasses",
              targeting_text: "kids sunglasses",
              term_type: "regular",
              spend: 18,
              clicks: 42,
              orders: 9,
              sales: 120,
            },
          ],
          zero_order_terms: [
            {
              search_term: "baby sunglasses",
              targeting_text: "kids sunglasses",
              term_type: "regular",
              spend: 9,
              clicks: 20,
              orders: 0,
              sales: 0,
            },
          ],
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
assertIncludes(diagnosisPathSummary.description, "Parent ASIN -> 广告 ASIN -> 广告组 -> 投放词/搜索词/广告位 -> AI 准入 -> 人工确认 -> 7/14 天复盘");
assertEqual(diagnosisPathSummary.steps.length, 7);
assertIncludes(
  diagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "RBK004-kids sunglasses-广泛",
);
assertIncludes(
  diagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "投放词 1 个",
);
assertIncludes(
  diagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "搜索词 18 条",
);
assertIncludes(
  diagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "只能诊断",
);
assertIncludes(
  diagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "人工确认 只能诊断 / 候选 0 个",
);
assertIncludes(
  diagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "7/14 天复盘",
);
assertIncludes(
  diagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "ReviewTodo",
);
assertIncludes(diagnosisPathSummary.boundary, "不能写人工动作");
assertIncludes(diagnosisPathSummary.boundary, "不能保存 ReviewRecord");

const productScopeEvidenceMatrix = buildProductScopeEvidenceMatrix(parentDiagnosisScope, parentDiagnosisSummary);
if (!productScopeEvidenceMatrix) {
  throw new Error("Parent ASIN 应返回对象证据矩阵");
}
assertEqual(productScopeEvidenceMatrix.title, "对象证据矩阵");
assertIncludes(productScopeEvidenceMatrix.summary, "Parent ASIN -> 广告 ASIN -> 广告组 -> 投放词/搜索词/广告位 -> AI 准入");
assertIncludes(productScopeEvidenceMatrix.summary, "人工确认 -> 7/14 天复盘");
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
  "投放词/搜索词/广告位 投放词 1 个 / 搜索词 18 条 / 广告位 0 条",
);
assertIncludes(
  productScopeEvidenceMatrix.rows.map((row) => `${row.layerLabel} ${row.objectLabel} ${row.evidenceLabel} ${row.value} ${row.detail}`).join(" / "),
  "投放词：kids sunglasses",
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
assertIncludes(productScopeEvidenceRouteGuide.summary, "先看经营入口，再看广告 ASIN、广告组、投放词/搜索词/广告位");
assertIncludes(productScopeEvidenceRouteGuide.summary, "AI 信号诊断、人工确认和 7/14 天复盘");
assertEqual(productScopeEvidenceRouteGuide.layerSummary.length, 4);
assertEqual(
  productScopeEvidenceRouteGuide.layerSummary.map((item) => `${item.label}:${item.value}`).join(" / "),
  "直接证据:2 层 / 上下文证据:2 层 / AI 准入:只能诊断 / 复盘路径:等待人工留痕",
);
assertIncludes(productScopeEvidenceRouteGuide.layerSummary[0].description, "未投放子 ASIN 不进入广告动作对象");
assertIncludes(productScopeEvidenceRouteGuide.layerSummary[1].description, "广告组、投放词、搜索词和广告位只解释流量来源与归因边界");
assertIncludes(productScopeEvidenceRouteGuide.layerSummary[2].description, "先按广告 ASIN、广告组、投放词、搜索词和广告位复核数据关系");
assertIncludes(productScopeEvidenceRouteGuide.layerSummary[3].description, "ReviewTodo");
const productScopeEvidenceRouteDecision = buildProductScopeEvidenceRouteDecision(productScopeEvidenceMatrix);
assertEqual(productScopeEvidenceRouteDecision.title, "路径可落地判断");
assertEqual(productScopeEvidenceRouteDecision.statusLabel, "只能诊断");
assertEqual(productScopeEvidenceRouteGuide.decision.statusLabel, productScopeEvidenceRouteDecision.statusLabel);
assertIncludes(productScopeEvidenceRouteDecision.businessQuestion, "哪些广告对象真的有广告数据");
assertIncludes(productScopeEvidenceRouteDecision.currentJudgement, "广告 ASIN B016EXMVZS");
assertIncludes(productScopeEvidenceRouteDecision.currentJudgement, "候选 0 个");
assertIncludes(productScopeEvidenceRouteDecision.proves, "有广告表现的对象");
assertIncludes(productScopeEvidenceRouteDecision.doesNotProve, "未投放子 ASIN");
assertIncludes(productScopeEvidenceRouteDecision.doesNotProve, "不能把搜索词、广告位或 ABA 市场热度自动归因到单个广告 ASIN");
assertIncludes(productScopeEvidenceRouteDecision.nextManualStep, "只读诊断");
assertEqual(productScopeEvidenceRouteGuide.steps.length, 7);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "1 Parent ASIN 经营盘 Parent ASIN B00K4W4AAA",
);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "2 广告 ASIN 覆盖 B016EXMVZS",
);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "3 广告组结构 RBK004-kids sunglasses-广泛",
);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "4 投放词 / 搜索词 / 广告位 投放词 1 个 / 搜索词 18 条 / 广告位 0 条",
);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "5 AI 信号诊断 只能诊断 / 候选 0 个",
);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "6 人工确认 只能诊断 / 候选 0 个",
);
assertIncludes(
  productScopeEvidenceRouteGuide.steps.map((step) => `${step.order} ${step.label} ${step.objectLabel} ${step.primaryEvidence} ${step.nextFocus}`).join(" / "),
  "7 7/14 天复盘 等待人工留痕和 ReviewTodo",
);
assertIncludes(productScopeEvidenceRouteGuide.boundary, "不能自动归因");

const adGroupDiagnosisRows = productScopeAdGroupDiagnosisRows(parentDiagnosisSummary);
assertEqual(adGroupDiagnosisRows.length, 1);
assertEqual(adGroupDiagnosisRows[0].title, "RBK004-kids sunglasses-广泛");
assertEqual(adGroupDiagnosisRows[0].statusLabel, "观察");
assertEqual(adGroupDiagnosisRows[0].statusTone, "observe");
assertEqual(adGroupDiagnosisRows[0].diagnosisStatus.label, "只读复核");
assertEqual(adGroupDiagnosisRows[0].diagnosisStatus.tone, "risk");
assertIncludes(adGroupDiagnosisRows[0].diagnosisStatus.reason, "有效词 3 条");
assertIncludes(adGroupDiagnosisRows[0].diagnosisStatus.reason, "无订单花费词 3 条");
assertIncludes(adGroupDiagnosisRows[0].diagnosisStatus.nextStep, "当前只读复核");
assertEqual(adGroupDiagnosisRows[0].problemType, "投放结构失衡");
assertIncludes(adGroupDiagnosisRows[0].metrics, "花费 152.59");
assertIncludes(adGroupDiagnosisRows[0].metrics, "ACOS 22.2%");
assertIncludes(adGroupDiagnosisRows[0].trafficContext, "广告 ASIN 2 个");
assertIncludes(adGroupDiagnosisRows[0].trafficContext, "搜索词 18 条");
assertIncludes(adGroupDiagnosisRows[0].trafficContextBoundary, "只说明当前广告组或广告活动上下文覆盖");
assertIncludes(adGroupDiagnosisRows[0].trafficContextBoundary, "不能证明搜索词、广告位或广告组表现已归因到单个广告 ASIN");
assertIncludes(adGroupDiagnosisRows[0].trafficContextBoundary, "不能替代人工动作门禁");
assertIncludes(adGroupDiagnosisRows[0].reason, "无订单花费词");
assertIncludes(adGroupDiagnosisRows[0].advertisedAsins.join(" / "), "B016EXMW02");
assertEqual(adGroupDiagnosisRows[0].advertisedProductPerformance.length, 2);
assertEqual(adGroupDiagnosisRows[0].advertisedProductPerformance[0].asin, "B016EXMVZS");
assertIncludes(adGroupDiagnosisRows[0].advertisedProductPerformance[0].metrics, "花费 100");
assertIncludes(adGroupDiagnosisRows[0].advertisedProductPerformance[0].metrics, "点击 50");
assertIncludes(adGroupDiagnosisRows[0].advertisedProductPerformance[0].metrics, "订单 20");
assertIncludes(adGroupDiagnosisRows[0].advertisedProductPerformance[0].metrics, "销售额 400");
assertIncludes(adGroupDiagnosisRows[0].advertisedProductPerformance[0].metrics, "ACOS 25.0%");
assertIncludes(adGroupDiagnosisRows[0].advertisedProductPerformance[0].metrics, "CVR 40.0%");
assertEqual(adGroupDiagnosisRows[0].advertisedProductPerformance[1].sampleBoundary, "点击样本少，仅适合观察。");
assertEqual(adGroupDiagnosisRows[0].ownershipDecision.statusLabel, "先归属到广告组容器");
assertIncludes(adGroupDiagnosisRows[0].ownershipDecision.businessQuestion, "能不能归到单个广告 ASIN");
assertIncludes(adGroupDiagnosisRows[0].ownershipDecision.currentJudgement, "广告 ASIN 2 个");
assertIncludes(adGroupDiagnosisRows[0].ownershipDecision.issueOwner, "问题先归属到广告组容器和搜索词上下文");
assertIncludes(adGroupDiagnosisRows[0].ownershipDecision.issueOwner, "不能拆到单个广告 ASIN");
assertIncludes(adGroupDiagnosisRows[0].ownershipDecision.evidencePath, "广告 ASIN -> 广告组 RBK004-kids sunglasses-广泛");
assertIncludes(adGroupDiagnosisRows[0].ownershipDecision.evidencePath, "有效 3 / 无订单 3");
assertIncludes(adGroupDiagnosisRows[0].ownershipDecision.doesNotProve, "自动拆广告组");
assertIncludes(adGroupDiagnosisRows[0].ownershipDecision.doesNotProve, "直接归因到单个广告 ASIN");
assertIncludes(adGroupDiagnosisRows[0].ownershipDecision.nextManualStep, "只读诊断");
assertIncludes(adGroupDiagnosisRows[0].ownershipDecision.nextManualStep, "不写人工动作");
assertIncludes(adGroupDiagnosisRows[0].problemLocator.title, "问题先落到哪里");
assertIncludes(adGroupDiagnosisRows[0].problemLocator.businessQuestion, "投放商品、搜索词分化、广告位缺口");
assertIncludes(adGroupDiagnosisRows[0].problemLocator.currentJudgement, "广告 ASIN 2 个");
assertIncludes(adGroupDiagnosisRows[0].problemLocator.problemLocation, "搜索词意图分化");
assertIncludes(adGroupDiagnosisRows[0].problemLocator.splitReason, "广告组汇总会把 2 个广告 ASIN");
assertIncludes(adGroupDiagnosisRows[0].problemLocator.doesNotProve, "自动拆广告组");
assertIncludes(adGroupDiagnosisRows[0].problemLocator.doesNotProve, "不能把搜索词或广告位自动归因到单个广告 ASIN");
assertIncludes(adGroupDiagnosisRows[0].problemLocator.nextManualStep, "不写人工动作");
assertEqual(adGroupDiagnosisRows[0].evidenceSynthesis.title, "广告组证据合流判断：RBK004-kids sunglasses-广泛");
assertEqual(adGroupDiagnosisRows[0].evidenceSynthesis.tone, "partial");
assertEqual(adGroupDiagnosisRows[0].evidenceSynthesis.statusLabel, "证据合流：搜索词分化优先");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.businessQuestion, "广告商品、投放词、搜索词和广告位证据是否指向同一个");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.currentJudgement, "广告 ASIN 2 个");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.currentJudgement, "投放词 1 个");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.currentJudgement, "广告位 仅活动级 4 条");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.evidenceChain, "B016EXMVZS");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.evidenceChain, "投放词 1 个（kids sunglasses）");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.evidenceChain, "搜索词 18 条（有效 3 / 无订单 3）");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.proves, "搜索词表现");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.doesNotProve, "自动加词");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.doesNotProve, "单个广告 ASIN");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.evidenceGap, "广告组级广告位证据");
assertIncludes(adGroupDiagnosisRows[0].evidenceSynthesis.nextManualStep, "不写人工动作");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.title, "优先复核 RBK004-kids sunglasses-广泛");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.evidence, "有效词 3 条 / 无订单花费词 3 条 / 广告 ASIN 2 个");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.decision, "广告组整体有转化");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.decision, "词意图分化");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.manualGate, "候选 0 个");
assertIncludes(adGroupDiagnosisRows[0].actionableReview.manualGate, "只做诊断");
assertIncludes(adGroupDiagnosisRows[0].boundary, "不能自动归因");
assertIncludes(adGroupDiagnosisRows[0].forbiddenActions.join(" / "), "自动调价");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.businessQuestion, "流量位置问题");
assertEqual(adGroupDiagnosisRows[0].placementDecision.status.label, "只有活动背景");
assertEqual(adGroupDiagnosisRows[0].placementDecision.status.tone, "observe");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.status.reason, "广告位样本 4 条");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.status.reason, "缺少当前广告组级广告位样本");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.status.nextStep, "不做广告位结论");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.currentJudgement, "广告组级广告位 0 条");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.currentJudgement, "活动级广告位 4 条");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.evidenceLevel, "只有广告活动级广告位背景");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.proves, "同广告活动存在广告位背景");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.doesNotProve, "自动调整广告位加价");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.doesNotProve, "不能把广告位影响自动归因到单个搜索词或广告 ASIN");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.evidenceGap, "缺少当前广告组级广告位样本");
assertIncludes(adGroupDiagnosisRows[0].placementDecision.nextManualStep, "不做广告位结论");
assertEqual(adGroupDiagnosisRows[0].searchTermDiagnosis?.termSummary, "有效搜索词 1 条 / 无订单花费词 1 条");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.effectiveTerms.map((term) => term.label).join(" / ") ?? "", "kids sunglasses");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.zeroOrderTerms.map((term) => term.label).join(" / ") ?? "", "baby sunglasses");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.decision.businessQuestion ?? "", "放量机会、浪费风险");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.decision.currentJudgement ?? "", "投放词 1 个");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.decision.currentJudgement ?? "", "广告 ASIN 2 个");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.decision.targetingEvidence ?? "", "kids sunglasses");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.decision.proves ?? "", "广告搜索词表现分化");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.decision.doesNotProve ?? "", "自动加词");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.decision.doesNotProve ?? "", "不能把搜索词归因到单个广告 ASIN");
assertIncludes(adGroupDiagnosisRows[0].searchTermDiagnosis?.decision.nextManualStep ?? "", "优先比较有效搜索词和无订单花费词");
assertEqual(adGroupDiagnosisRows[0].searchTermDiagnosis?.effectiveTerms[0]?.targetingText, "kids sunglasses");
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
assertIncludes(manualActionAdGroupBridge.decision, "沿用中间广告组合流判断");
assertIncludes(manualActionAdGroupBridge.decision, "证据合流：搜索词分化优先");
assertIncludes(manualActionAdGroupBridge.synthesisStatus, "证据合流：搜索词分化优先");
assertIncludes(manualActionAdGroupBridge.synthesisJudgement, "广告 ASIN 2 个");
assertIncludes(manualActionAdGroupBridge.synthesisJudgement, "投放词 1 个");
assertIncludes(manualActionAdGroupBridge.synthesisEvidenceChain, "投放词 1 个（kids sunglasses）");
assertIncludes(manualActionAdGroupBridge.synthesisEvidenceChain, "搜索词 18 条（有效 3 / 无订单 3）");
assertIncludes(manualActionAdGroupBridge.synthesisBoundary, "搜索词表现");
assertIncludes(manualActionAdGroupBridge.synthesisBoundary, "自动加词");
assertIncludes(manualActionAdGroupBridge.synthesisBoundary, "单个广告 ASIN");
assertIncludes(manualActionAdGroupBridge.synthesisGap, "广告组级广告位证据");
assertIncludes(manualActionAdGroupBridge.searchTermBoundary, "搜索词边界");
assertIncludes(manualActionAdGroupBridge.searchTermBoundary, "广告搜索词表现分化");
assertIncludes(manualActionAdGroupBridge.searchTermBoundary, "不能把搜索词归因到单个广告 ASIN");
assertIncludes(manualActionAdGroupBridge.placementBoundary, "广告位边界");
assertIncludes(manualActionAdGroupBridge.placementBoundary, "只有广告活动级广告位背景");
assertIncludes(manualActionAdGroupBridge.placementBoundary, "不能把广告位影响自动归因到单个搜索词或广告 ASIN");
assertIncludes(manualActionAdGroupBridge.manualNextStep, "不写人工动作");
assertIncludes(manualActionAdGroupBridge.manualNextStep, "优先比较有效搜索词和无订单花费词");
assertIncludes(manualActionAdGroupBridge.manualNextStep, "不做广告位结论");
assertIncludes(manualActionAdGroupBridge.manualNextStep, "不执行广告动作");
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
assertIncludes(
  readyDiagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "人工确认 待人工确认 / 候选 3 个",
);
assertIncludes(
  readyDiagnosisPathSummary.steps.map((step) => `${step.label} ${step.value}`).join(" / "),
  "7/14 天复盘 人工留痕后生成 ReviewTodo",
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
        status: "waiting_review_window",
        earliest_due_date: "2026-06-22",
        next_review_window: "7d",
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
      missing_evidence_snapshot_count: 0,
      missing_diagnosis_path_count: 0,
      missing_ai_admission_count: 0,
      missing_search_term_boundary_count: 0,
      missing_placement_boundary_count: 0,
      unstable_object_id_count: 0,
      ready_review_count: 0,
      can_save_review_records_now: false,
      earliest_due_date: "2026-06-21",
      earliest_any_due_date: "2026-06-21",
      earliest_metric_due_date: "2026-06-22",
      date_boundary: "earliest_due_date / earliest_any_due_date 包含数据质量和交叉待办；保存广告复盘记录时以 earliest_metric_due_date 为准。",
      issues: [],
      readback_keys: [],
    },
  },
});
assertEqual(waitingReviewReadinessGate?.title, "复盘等待窗口");
assertEqual(waitingReviewReadinessGate?.status, "waiting");
assertIncludes(waitingReviewReadinessGate?.primary ?? "", "17 条人工留痕");
assertIncludes(waitingReviewReadinessGate?.primary ?? "", "ready 复盘 0 个");
assertIncludes(waitingReviewReadinessGate?.primary ?? "", "最早广告复盘");
assertIncludes(waitingReviewReadinessGate?.primary ?? "", "2026-06-22");
assertIncludes(waitingReviewReadinessGate?.detail ?? "", "B016EXMVZS");
assertIncludes(waitingReviewReadinessGate?.boundary ?? "", "不保存复盘结论");
assertIncludes(waitingReviewReadinessGate?.boundary ?? "", "不自动执行广告动作");
assertEqual(waitingReviewReadinessGate?.items[0].label, "人工留痕");
assertEqual(waitingReviewReadinessGate?.items[0].value, "17 条");
assertEqual(waitingReviewReadinessGate?.items[2].label, "最早广告复盘");
assertEqual(waitingReviewReadinessGate?.items[2].value, "2026-06-22");
assertEqual(waitingReviewReadinessGate?.items[3].label, "下一窗口");
assertEqual(waitingReviewReadinessGate?.items[3].value, "7 天");
assertEqual(waitingReviewReadinessGate?.items[4].label, "下一广告对象");
assertEqual(waitingReviewReadinessGate?.items[4].value, "advertised_product / B016EXMVZS");
assertEqual(waitingReviewReadinessGate?.nextSteps.length, 3);
assertEqual(waitingReviewReadinessGate?.nextSteps[0].label, "现在");
assertIncludes(waitingReviewReadinessGate?.nextSteps[0].detail ?? "", "查看当前人工留痕和复盘待办");
assertIncludes(waitingReviewReadinessGate?.nextSteps[0].detail ?? "", "不拉取快照");
assertIncludes(waitingReviewReadinessGate?.nextSteps[0].detail ?? "", "不自动执行广告动作");
assertEqual(waitingReviewReadinessGate?.nextSteps[1].label, "到期后");
assertIncludes(waitingReviewReadinessGate?.nextSteps[1].detail ?? "", "2026-06-22 后只读检查 advertised_product / B016EXMVZS 的 7 天复盘效果");
assertEqual(waitingReviewReadinessGate?.nextSteps[2].label, "ready 后");
assertIncludes(waitingReviewReadinessGate?.nextSteps[2].detail ?? "", "人工确认后再保存 review_records");
assertEqual(waitingReviewReadinessGate?.identityAudit?.title, "复盘读回身份门禁");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.summary ?? "", "读回身份可审计");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.summary ?? "", "缺失 action_id / object_id / review_window：0 / 0 / 0");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.summary ?? "", "证据快照缺口：0 / 排查路径 0 / AI 准入 0");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.summary ?? "", "搜索词边界 0 / 广告位边界 0");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.summary ?? "", "广告指标最早复盘：2026-06-22");
assertEqual(waitingReviewReadinessGate?.identityAudit?.items[2].label, "历史对象 ID 风险");
assertEqual(waitingReviewReadinessGate?.identityAudit?.items[2].value, "0");
assertEqual(waitingReviewReadinessGate?.identityAudit?.items[4].label, "证据快照缺口");
assertEqual(waitingReviewReadinessGate?.identityAudit?.items[4].value, "0");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.boundary ?? "", "当前不能保存复盘记录");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.boundary ?? "", "ready_for_readback 只表示可按原动作读回对象");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.boundary ?? "", "earliest_any_due_date 包含数据质量和交叉待办");
assertIncludes(waitingReviewReadinessGate?.identityAudit?.boundary ?? "", "earliest_metric_due_date 为准");

const separatedReviewQueueGate = buildReviewReadinessGateSummary({
  next_unhandled_candidate: {
    object_type: "search_term",
    object_id: "search_term:1:boys sunglasses",
    stable_object_id: "search_term:1:boys sunglasses",
    object_label: "boys sunglasses",
    problem_type: "opportunity",
    evidence_strength: "medium",
  },
  review_status: {
    manual_action_count: 18,
    review_record_count: 0,
    ready_count: 0,
    not_ready_count: 2,
    review_wait_summary: {
      status: "waiting_review_window",
      earliest_due_date: "2026-06-28",
      next_review_window: "7d",
      next_object_type: "search_term",
      next_object_id: "search_term:1:beach essentials",
      next_object_label: "beach essentials",
      message: "已有人工动作，但 7/14 天复盘窗口未到期。",
    },
    review_identity_audit: {
      status: "ready_for_readback",
      manual_action_count: 18,
      review_record_count: 0,
      effect_count: 2,
      missing_action_id_count: 0,
      missing_object_id_count: 0,
      missing_review_window_count: 0,
      missing_evidence_snapshot_count: 0,
      missing_diagnosis_path_count: 0,
      missing_ai_admission_count: 0,
      missing_search_term_boundary_count: 0,
      missing_placement_boundary_count: 0,
      unstable_object_id_count: 0,
      ready_review_count: 0,
      can_save_review_records_now: false,
      earliest_metric_due_date: "2026-06-28",
      readback_keys: [
        {
          object_type: "search_term",
          object_id: "search_term:1:beach essentials",
          object_label: "beach essentials",
          review_window: "7d",
          due_at: "2026-06-28T03:58:03.939315+00:00",
          evidence_snapshot_count: 17,
          has_diagnosis_path: true,
          has_ai_admission: true,
          has_search_term_boundary: true,
          has_placement_boundary: true,
          has_parent_asin_scope: true,
          has_ad_asin_coverage: true,
          has_targeting_evidence: true,
          has_ad_group_synthesis: true,
          has_ad_group_product_performance: true,
          has_aba_context: true,
          has_evidence_gap: true,
          has_required_evidence: true,
          has_action_boundary: true,
        },
        {
          object_type: "search_term",
          object_id: "search_term:1:beach essentials",
          object_label: "beach essentials",
          review_window: "14d",
          due_at: "2026-07-05T03:58:03.939315+00:00",
          evidence_snapshot_count: 17,
          has_diagnosis_path: true,
          has_ai_admission: true,
          has_search_term_boundary: true,
          has_placement_boundary: true,
          has_parent_asin_scope: true,
          has_ad_asin_coverage: true,
          has_targeting_evidence: true,
          has_ad_group_synthesis: true,
          has_ad_group_product_performance: true,
          has_aba_context: true,
          has_evidence_gap: true,
          has_required_evidence: true,
          has_action_boundary: true,
        },
      ],
    },
  },
});
assertEqual(separatedReviewQueueGate?.queueSeparation?.title, "复盘对象与候选队列");
assertIncludes(separatedReviewQueueGate?.queueSeparation?.primary ?? "", "beach essentials");
assertIncludes(separatedReviewQueueGate?.queueSeparation?.primary ?? "", "boys sunglasses");
assertEqual(separatedReviewQueueGate?.queueSeparation?.items[0].label, "已加入复盘");
assertEqual(separatedReviewQueueGate?.queueSeparation?.items[0].value, "search_term / beach essentials");
assertIncludes(separatedReviewQueueGate?.queueSeparation?.items[1].value ?? "", "7 天 2026-06-28");
assertIncludes(separatedReviewQueueGate?.queueSeparation?.items[1].value ?? "", "14 天 2026-07-05");
assertEqual(separatedReviewQueueGate?.queueSeparation?.items[2].value, "2 个待办 / 17 条证据 / 对象复核链齐全");
assertEqual(separatedReviewQueueGate?.queueSeparation?.items[3].value, "search_term / boys sunglasses");
assertEqual(separatedReviewQueueGate?.queueSeparation?.items[4].value, "不同对象，分开处理");
assertIncludes(separatedReviewQueueGate?.queueSeparation?.boundary ?? "", "不能混合归因");
assertIncludes(separatedReviewQueueGate?.queueSeparation?.boundary ?? "", "不能由页面自动加词、否词或调价");

const blockedReviewIdentityAuditGate = buildReviewReadinessGateSummary({
  review_status: {
    manual_action_count: 17,
    review_record_count: 0,
    ready_count: 0,
    not_ready_count: 10,
    review_identity_audit: {
      status: "blocked",
      manual_action_count: 17,
      review_record_count: 0,
      effect_count: 10,
      missing_action_id_count: 0,
      missing_object_id_count: 0,
      missing_review_window_count: 0,
      missing_evidence_snapshot_count: 10,
      missing_diagnosis_path_count: 10,
      missing_ai_admission_count: 10,
      missing_search_term_boundary_count: 10,
      missing_placement_boundary_count: 10,
      unstable_object_id_count: 0,
      ready_review_count: 0,
      can_save_review_records_now: false,
      earliest_metric_due_date: "2026-06-22",
      issues: [{ issue_type: "missing_evidence_snapshot", note: "历史复盘待办缺少人工点击时保存的 evidence_snapshot。" }],
      readback_keys: [],
    },
  },
});
assertEqual(blockedReviewIdentityAuditGate?.identityAudit?.status, "blocked");
assertIncludes(blockedReviewIdentityAuditGate?.identityAudit?.summary ?? "", "读回身份存在阻塞");
assertIncludes(blockedReviewIdentityAuditGate?.identityAudit?.summary ?? "", "证据快照缺口：10 / 排查路径 10 / AI 准入 10");
assertIncludes(blockedReviewIdentityAuditGate?.identityAudit?.summary ?? "", "搜索词边界 10 / 广告位边界 10");
assertEqual(blockedReviewIdentityAuditGate?.identityAudit?.items[4].value, "50");

const objectMismatchReviewIdentityAuditGate = buildReviewReadinessGateSummary({
  review_status: {
    status: "waiting_review_window",
    ready_count: 0,
    not_ready_count: 2,
    review_identity_audit: {
      status: "blocked",
      effect_count: 2,
      ready_review_count: 0,
      missing_action_id_count: 0,
      missing_object_id_count: 0,
      missing_review_window_count: 0,
      missing_evidence_snapshot_count: 0,
      missing_diagnosis_path_count: 0,
      missing_ai_admission_count: 0,
      missing_search_term_boundary_count: 0,
      missing_placement_boundary_count: 0,
      missing_object_reference_count: 2,
      unstable_object_id_count: 0,
      can_save_review_records_now: false,
      earliest_metric_due_date: "2026-06-28",
      issues: [{ issue_type: "evidence_snapshot_object_mismatch" }],
    },
  },
});

assertEqual(objectMismatchReviewIdentityAuditGate?.identityAudit?.status, "blocked");
assertIncludes(objectMismatchReviewIdentityAuditGate?.identityAudit?.summary ?? "", "对象引用 2");
assertEqual(objectMismatchReviewIdentityAuditGate?.identityAudit?.items[4].value, "2");
assertEqual(blockedReviewIdentityAuditGate?.title, "复盘证据门禁阻断");
assertEqual(blockedReviewIdentityAuditGate?.status, "blocked");
assertIncludes(blockedReviewIdentityAuditGate?.primary ?? "", "复盘读回门禁未通过");
assertIncludes(blockedReviewIdentityAuditGate?.detail ?? "", "证据快照缺口：10");
assertIncludes(blockedReviewIdentityAuditGate?.boundary ?? "", "不能把当前页面证据伪装成历史点击证据");
assertIncludes(blockedReviewIdentityAuditGate?.boundary ?? "", "广告组合流判断");
assertIncludes(blockedReviewIdentityAuditGate?.boundary ?? "", "动作边界");
assertNotIncludes(blockedReviewIdentityAuditGate?.boundary ?? "", "不拉取快照");
assertEqual(blockedReviewIdentityAuditGate?.items[4].value, "证据门禁阻断");
assertIncludes(blockedReviewIdentityAuditGate?.nextSteps[1].detail ?? "", "完整证据快照");
assertIncludes(blockedReviewIdentityAuditGate?.nextSteps[1].detail ?? "", "广告组合流判断");
assertIncludes(blockedReviewIdentityAuditGate?.nextSteps[1].detail ?? "", "动作边界");

const blockedReviewEvidenceRepair = buildReviewEvidenceRepairSummary({
  status: "blocked_by_legacy_evidence_gap",
  will_write: false,
  requires_explicit_authorization: true,
  counts: {
    manual_actions: 17,
    review_todos: 10,
    repair_issue_count: 10,
    legacy_action_gap_count: 5,
    preview_rebuildable_count: 0,
    recreatable_count: 0,
  },
  items: [
    {
      action_id: "manual-action-36ab1ca4680846e2899f747c43c0e800",
      object_type: "advertised_product",
      object_id: "B016EXMVZS",
      object_label: "B016EXMVZS",
      review_windows: ["7d", "14d"],
      issue_types: ["missing_search_term_boundary", "missing_placement_boundary"],
      current_preflight: {
        status: "blocked_by_target_mismatch",
        target_matches_legacy: false,
        evidence_snapshot_item_count: 0,
        has_diagnosis_path: false,
        has_ai_admission: false,
        has_search_term_boundary: false,
        has_placement_boundary: false,
        has_object_reference: false,
        missing_required_labels: ["排查路径", "AI 准入", "搜索词边界", "广告位边界"],
      },
      can_patch_legacy_record: false,
      can_rebuild_evidence_preview: false,
      can_recreate_from_current_signal: false,
      patch_policy:
        "历史记录缺少点击当时保存的 evidence_snapshot；当前重建证据只能作为人工核对参考，不能静默写回旧记录；MVP 不提供补写历史 evidence_snapshot 的执行入口。",
      void_plan: {
        status: "dry_run_available",
        action_id: "manual-action-36ab1ca4680846e2899f747c43c0e800",
        review_window: null,
        review_windows: ["7d", "14d"],
        expected_object_type: "advertised_product",
        expected_object_id: "B016EXMVZS",
        required_authorization_code: "VOID_TODO:manual-action-36ab1ca4680846e2899f747c43c0e800:all",
        dry_run_command:
          'python scripts\\apply_review_todo_void_once.py --market-id 1 --action-id manual-action-36ab1ca4680846e2899f747c43c0e800 --expected-object-type advertised_product --expected-object-id B016EXMVZS --compact',
        execute_command:
          'python scripts\\apply_review_todo_void_once.py --market-id 1 --action-id manual-action-36ab1ca4680846e2899f747c43c0e800 --expected-object-type advertised_product --expected-object-id B016EXMVZS --execute --authorization-code VOID_TODO:manual-action-36ab1ca4680846e2899f747c43c0e800:all --compact',
        boundary:
          "先 dry-run 核对对象和窗口；execute 必须显式带授权码。该动作只写 review_todo_decisions，不修改 manual_actions，不保存 ReviewRecord，不执行广告动作。",
      },
      recommended_next_step: "当前预检目标不是这个历史待办对象，不能用当前信号证据修补历史。",
      will_write: false,
    },
  ],
  forbidden_effects: ["不保存 review_records", "不执行广告动作", "不把当前页面证据伪装成历史点击证据"],
  next_action: "发现 5 个历史动作缺证据，当前信号不能直接重建同对象证据；先 dry-run 作废旧待办，后续重新人工留痕。",
});
assertEqual(blockedReviewEvidenceRepair?.title, "历史待办治理");
assertEqual(blockedReviewEvidenceRepair?.status, "blocked");
assertIncludes(blockedReviewEvidenceRepair?.primary ?? "", "5 个历史动作缺证据");
assertIncludes(blockedReviewEvidenceRepair?.primary ?? "", "10 条复盘待办");
assertIncludes(blockedReviewEvidenceRepair?.detail ?? "", "作废旧待办");
assertIncludes(blockedReviewEvidenceRepair?.boundary ?? "", "will_write=false");
assertIncludes(blockedReviewEvidenceRepair?.boundary ?? "", "不能补写历史 evidence_snapshot");
assertIncludes(blockedReviewEvidenceRepair?.boundary ?? "", "不能自动执行广告动作");
assertEqual(blockedReviewEvidenceRepair?.items[0].label, "历史缺口动作");
assertEqual(blockedReviewEvidenceRepair?.items[0].value, "5 个");
assertEqual(blockedReviewEvidenceRepair?.items[2].label, "可重建预览");
assertEqual(blockedReviewEvidenceRepair?.items[2].value, "0 个");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "advertised_product / B016EXMVZS");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "缺搜索词边界");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "缺广告位边界");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "证据预览不可重建");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "对象引用错配");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "不可补写历史证据");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "不能用当前信号证据修补历史");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "dry-run 可预检");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "真实作废未执行");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "作废对象：advertised_product / B016EXMVZS");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "复盘窗口：7d / 14d");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "作废后：旧待办作废后仍不是复盘完成");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "重新留痕：重新点击人工动作时必须保存新的 ManualAction 和 7d / 14d ReviewTodo");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "VOID_TODO:manual-action-36ab1ca4680846e2899f747c43c0e800:all");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "apply_review_todo_void_once.py");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "只写 review_todo_decisions");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "不修改 manual_actions");
assertIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "不保存 ReviewRecord");
assertNotIncludes(blockedReviewEvidenceRepair?.sampleItems[0] ?? "", "--execute");
assertEqual(blockedReviewEvidenceRepair?.voidPlanItems[0]?.statusText, "dry-run 可预检；真实作废未执行");
assertEqual(blockedReviewEvidenceRepair?.voidPlanItems[0]?.objectText, "advertised_product / B016EXMVZS");
assertEqual(blockedReviewEvidenceRepair?.voidPlanItems[0]?.reviewWindows, "7d / 14d");
assertIncludes(blockedReviewEvidenceRepair?.voidPlanItems[0]?.afterVoidText ?? "", "旧待办作废后仍不是复盘完成");
assertIncludes(blockedReviewEvidenceRepair?.voidPlanItems[0]?.recreateText ?? "", "保存新的 ManualAction 和 7d / 14d ReviewTodo");
assertEqual(
  blockedReviewEvidenceRepair?.voidPlanItems[0]?.authorizationCode,
  "VOID_TODO:manual-action-36ab1ca4680846e2899f747c43c0e800:all",
);
assertIncludes(blockedReviewEvidenceRepair?.voidPlanItems[0]?.dryRunCommand ?? "", "apply_review_todo_void_once.py");
assertNotIncludes(blockedReviewEvidenceRepair?.voidPlanItems[0]?.dryRunCommand ?? "", "--execute");
assertIncludes(blockedReviewEvidenceRepair?.voidPlanItems[0]?.boundary ?? "", "只写 review_todo_decisions");
assertIncludes(blockedReviewEvidenceRepair?.nextSteps[1].detail ?? "", "人工核对参考");
assertIncludes(blockedReviewEvidenceRepair?.nextSteps[1].detail ?? "", "不提供补写历史 evidence_snapshot");
assertIncludes(blockedReviewEvidenceRepair?.nextSteps[1].detail ?? "", "不能重复写入绕过门禁");
assertIncludes(blockedReviewEvidenceRepair?.nextSteps[2].detail ?? "", "dry-run 命令");
assertIncludes(blockedReviewEvidenceRepair?.nextSteps[2].detail ?? "", "不能静默补写历史 evidence_snapshot");
assertIncludes(blockedReviewEvidenceRepair?.nextSteps[3].detail ?? "", "新的人工留痕生成带证据的 ReviewTodo");

const previewOnlyReviewEvidenceRepair = buildReviewEvidenceRepairSummary({
  status: "blocked_by_legacy_evidence_gap",
  will_write: false,
  requires_explicit_authorization: true,
  counts: {
    manual_actions: 18,
    review_todos: 2,
    repair_issue_count: 4,
    legacy_action_gap_count: 1,
    preview_rebuildable_count: 1,
    recreatable_count: 0,
  },
  items: [
    {
      action_id: "manual-action-search-term",
      object_type: "search_term",
      object_id: "search_term:1:beach essentials",
      object_label: "beach essentials",
      review_windows: ["7d", "14d"],
      issue_types: ["evidence_snapshot_object_mismatch"],
      current_preflight: {
        status: "blocked_by_existing_manual_trace",
        target_matches_legacy: true,
        evidence_snapshot_item_count: 17,
        has_diagnosis_path: true,
        has_ai_admission: true,
        has_search_term_boundary: true,
        has_placement_boundary: true,
        has_parent_asin_scope: true,
        has_ad_asin_coverage: true,
        has_targeting_evidence: true,
        has_ad_group_synthesis: true,
        has_aba_context: true,
        has_evidence_gap: true,
        has_action_boundary: true,
        has_object_reference: true,
        missing_required_labels: [],
      },
      can_patch_legacy_record: false,
      can_rebuild_evidence_preview: true,
      can_recreate_from_current_signal: false,
      patch_policy:
        "当前重建证据只能作为人工核对参考，不能静默写回旧记录；MVP 不提供补写历史 evidence_snapshot 的执行入口。",
      recommended_next_step:
        "当前能重建同一对象的证据预览，但真实写入仍被门禁挡住。当前可落地路径是先 dry-run 作废旧待办，再重新人工留痕生成新的 ReviewTodo；不能补写历史 evidence_snapshot。",
      will_write: false,
    },
  ],
  forbidden_effects: ["不保存 review_records", "不执行广告动作"],
  next_action:
    "发现 1 个历史动作缺证据，其中 1 个只能重建当前证据预览；预览不能写回历史 evidence_snapshot，当前可落地路径是先 dry-run 作废旧待办，再重新人工留痕。",
});
assertEqual(previewOnlyReviewEvidenceRepair?.status, "blocked");
assertEqual(previewOnlyReviewEvidenceRepair?.items[2].value, "1 个");
assertEqual(previewOnlyReviewEvidenceRepair?.items[3].value, "0 个");
assertIncludes(previewOnlyReviewEvidenceRepair?.detail ?? "", "只能重建当前证据预览");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "具体 SearchTerm：beach essentials");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "稳定对象：search_term / search_term:1:beach essentials");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "证据快照对象不一致");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "可重建证据预览");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "当前不可重新留痕");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "不可补写历史证据");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "当前预览 17 条证据");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "有搜索词边界");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "有广告位边界");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "有 Parent ASIN入口");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "有广告 ASIN承接");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "有投放词证据");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "有广告组合流判断");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "有 ABA 背景");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "有证据缺口");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "有动作边界");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "对象引用可回看");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "真实写入仍被门禁挡住");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "先 dry-run 作废旧待办");
assertIncludes(previewOnlyReviewEvidenceRepair?.sampleItems[0] ?? "", "不能补写历史 evidence_snapshot");

const missingSearchTermRepairEvidence = buildReviewEvidenceRepairSummary({
  status: "blocked_by_legacy_evidence_gap",
  will_write: false,
  requires_explicit_authorization: true,
  counts: {
    manual_actions: 20,
    review_todos: 2,
    repair_issue_count: 5,
    legacy_action_gap_count: 1,
    preview_rebuildable_count: 0,
    recreatable_count: 0,
  },
  items: [
    {
      action_id: "manual-action-search-term",
      object_type: "search_term",
      object_id: "search_term:1:beach essentials",
      object_label: "beach essentials",
      review_windows: ["7d", "14d"],
      issue_types: [
        "missing_targeting_evidence",
        "missing_ad_group_synthesis",
        "missing_aba_context",
        "missing_evidence_gap",
        "missing_required_evidence",
        "missing_action_boundary",
      ],
      current_preflight: {
        status: "ready_for_explicit_manual_write",
        target_matches_legacy: true,
        evidence_snapshot_item_count: 17,
        has_diagnosis_path: true,
        has_ai_admission: true,
        has_search_term_boundary: true,
        has_placement_boundary: true,
        has_targeting_evidence: false,
        has_ad_group_synthesis: false,
        has_ad_group_product_performance: false,
        has_aba_context: false,
        has_evidence_gap: false,
        has_required_evidence: false,
        has_action_boundary: false,
        has_object_reference: true,
        missing_required_labels: ["投放词证据", "广告组合流判断", "同组投放商品表现", "ABA 背景", "证据缺口", "需要补证", "动作边界"],
      },
      can_patch_legacy_record: false,
      can_rebuild_evidence_preview: false,
      can_recreate_from_current_signal: false,
      patch_policy:
        "当前重建证据只能作为人工核对参考，不能静默写回旧记录；MVP 不提供补写历史 evidence_snapshot 的执行入口。",
      recommended_next_step: "当前预检目标匹配历史对象，但当前证据预览仍缺：投放词证据、广告组合流判断、同组投放商品表现、ABA 背景、证据缺口、需要补证、动作边界。",
      will_write: false,
    },
  ],
  forbidden_effects: ["不保存 review_records", "不执行广告动作"],
  next_action: "发现 1 个历史动作缺证据，当前信号不能直接重建同对象证据；先 dry-run 作废旧待办，后续重新人工留痕。",
});
assertIncludes(missingSearchTermRepairEvidence?.sampleItems[0] ?? "", "缺投放词证据");
assertIncludes(missingSearchTermRepairEvidence?.sampleItems[0] ?? "", "缺广告组合流判断");
assertIncludes(missingSearchTermRepairEvidence?.sampleItems[0] ?? "", "缺 ABA 背景");
assertIncludes(missingSearchTermRepairEvidence?.sampleItems[0] ?? "", "缺证据缺口");
assertIncludes(missingSearchTermRepairEvidence?.sampleItems[0] ?? "", "缺需要补证");
assertIncludes(missingSearchTermRepairEvidence?.sampleItems[0] ?? "", "缺动作边界");
assertIncludes(
  missingSearchTermRepairEvidence?.sampleItems[0] ?? "",
  "当前预览仍缺：投放词证据 / 广告组合流判断 / 同组投放商品表现 / ABA 背景 / 证据缺口 / 需要补证 / 动作边界",
);

const searchTermChainBlockedReviewEvidenceRepair = buildReviewEvidenceRepairSummary({
  status: "ready_no_legacy_gap",
  will_write: false,
  readiness_status: "not_ready",
  rule_improvement_status: "blocked_by_review_evidence_gap",
  counts: {
    manual_actions: 20,
    review_todos: 2,
    repair_issue_count: 0,
    legacy_action_gap_count: 0,
    preview_rebuildable_count: 0,
    recreatable_count: 0,
  },
  items: [],
  forbidden_effects: ["不保存 review_records", "不执行广告动作", "不把当前页面证据伪装成历史点击证据"],
  next_action: "当前没有历史证据快照缺口；继续等待复盘窗口，未到期前不保存 ReviewRecord。",
});
assertEqual(searchTermChainBlockedReviewEvidenceRepair?.status, "blocked");
assertIncludes(searchTermChainBlockedReviewEvidenceRepair?.primary ?? "", "对象复核链仍被复盘证据门禁阻断");
assertIncludes(searchTermChainBlockedReviewEvidenceRepair?.detail ?? "", "旧快照缺少对象复核链标签");
assertEqual(searchTermChainBlockedReviewEvidenceRepair?.items[0].value, "0 个");
assertEqual(searchTermChainBlockedReviewEvidenceRepair?.items[2].label, "对象复核链");
assertEqual(searchTermChainBlockedReviewEvidenceRepair?.items[2].value, "阻断");
assertIncludes(searchTermChainBlockedReviewEvidenceRepair?.nextSteps[0].detail ?? "", "投放词证据");
assertIncludes(searchTermChainBlockedReviewEvidenceRepair?.nextSteps[0].detail ?? "", "广告组合流判断");
assertIncludes(searchTermChainBlockedReviewEvidenceRepair?.nextSteps[0].detail ?? "", "ABA 背景");
assertIncludes(searchTermChainBlockedReviewEvidenceRepair?.nextSteps[1].detail ?? "", "不能静默补写历史 evidence_snapshot");
assertIncludes(searchTermChainBlockedReviewEvidenceRepair?.nextSteps[2].detail ?? "", "不保存 ReviewRecord");

const readyReviewEvidenceRepair = buildReviewEvidenceRepairSummary({
  status: "ready_no_legacy_gap",
  will_write: false,
  counts: {
    manual_actions: 17,
    review_todos: 0,
    repair_issue_count: 0,
    legacy_action_gap_count: 0,
    preview_rebuildable_count: 0,
    recreatable_count: 0,
  },
  items: [],
  forbidden_effects: ["不执行广告动作"],
  next_action: "当前没有历史证据快照缺口，可以继续等待复盘窗口。",
});
assertEqual(readyReviewEvidenceRepair?.status, "ready");
assertIncludes(readyReviewEvidenceRepair?.primary ?? "", "没有历史证据快照缺口");
assertIncludes(readyReviewEvidenceRepair?.boundary ?? "", "不能自动执行广告动作");

const blockedReviewReadinessGate = buildReviewReadinessGateSummary({
  review_status: {
    manual_action_count: 17,
    review_record_count: 0,
    ready_count: 0,
    not_ready_count: 10,
    review_wait_summary: {
      status: "blocked_by_data_gap",
      gap_reasons: ["复盘效果暂不可计算：缺少处理后 7 天快照"],
      message: "当前没有 ready 复盘效果；复盘效果暂不可计算：缺少处理后 7 天快照",
      next_step: "先补齐复盘所需数据。下一步：先查询积加 API 限流规则，再由人工触发低频快照。",
      forbidden_actions: ["不保存复盘结论", "不自动改规则", "不自动执行广告动作"],
    },
  },
});
assertEqual(blockedReviewReadinessGate?.title, "复盘证据缺口");
assertEqual(blockedReviewReadinessGate?.status, "blocked");
assertIncludes(blockedReviewReadinessGate?.primary ?? "", "当前不能保存复盘结论");
assertIncludes(blockedReviewReadinessGate?.detail ?? "", "缺少处理后 7 天快照");
assertIncludes(blockedReviewReadinessGate?.boundary ?? "", "not_ready 只说明证据不足");
assertIncludes(blockedReviewReadinessGate?.boundary ?? "", "不保存复盘结论");
assertIncludes(blockedReviewReadinessGate?.boundary ?? "", "不自动执行广告动作");
assertNotIncludes(blockedReviewReadinessGate?.boundary ?? "", "不拉取快照");
assertEqual(blockedReviewReadinessGate?.items[4].label, "缺口状态");
assertEqual(blockedReviewReadinessGate?.items[4].value, "证据不足");
assertIncludes(blockedReviewReadinessGate?.nextSteps[0].detail ?? "", "先确认复盘缺口");
assertIncludes(blockedReviewReadinessGate?.nextSteps[1].detail ?? "", "先查询积加 API 限流规则");
assertIncludes(blockedReviewReadinessGate?.nextSteps[2].detail ?? "", "出现 ready 复盘后");

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
        { check_id: "evidence_trace", label: "证据追溯", status: "partial", evidence: "1 / 2 条样本带证据上下文" },
        {
          check_id: "review_record_trace",
          label: "复盘记录来源",
          status: "partial",
          evidence: "1 / 2 条样本带 review_record_id / action_id / 指标窗口",
        },
        {
          check_id: "review_record_evidence_snapshot",
          label: "复盘证据快照",
          status: "partial",
          evidence: "1 / 2 条样本带保存快照，1 / 2 条可回看 AI 准入",
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
          evidence_snapshot_count: 2,
          diagnosis_snapshot: {
            label: "排查路径",
            value: "Parent 经营盘子 -> 广告 ASIN -> 广告组 -> 投放词 / 搜索词 / 广告位",
            detail: "保存复盘前必须回看原始广告诊断路径。",
            source: "business_rule",
          },
          ai_admission_snapshot: {
            label: "AI 准入",
            value: "可进入人工确认 / ready_for_manual_confirmation / 候选 1 个 / 允许人工留痕",
            detail: "准入只证明允许人工留痕，不代表系统会自动执行广告动作。",
            source: "actionability_status",
          },
          sort_reason: "排序依据：worse 优先，因为处理后效果变差，先复核阈值、证据来源和建议动作。",
          action_boundary: {
            result: "worse",
            allowed_reviews: ["复核阈值", "复核证据来源", "复核建议动作"],
            forbidden_actions: ["自动改规则", "自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
            boundary: "worse 只能触发人工复核阈值、证据来源和建议动作；不自动改规则，不自动执行广告动作。",
          },
          evidence_drilldown: {
            summary: "搜索词表现行 1 条，覆盖广告活动 1 个 / 广告组 1 个；花费 28.50，订单 0；搜索词只能说明广告活动和广告组下的用户搜索表现，不能自动归因到单个广告 ASIN。",
          },
          diagnosis_path: {
            path: "搜索词 -> 广告活动 / 广告组 -> 投放词结构 -> 广告 ASIN 人工复核",
            steps: [
              { step_id: "search_term_metric_summary", label: "搜索词表现", value: "花费 28.50 / 订单 0 / 销售额 0.00" },
              { step_id: "search_term_context", label: "投放上下文", value: "广告活动 1 个 / 广告组 1 个 / 搜索词表现行 1 条" },
              { step_id: "targeting_context", label: "投放词结构", value: "1 个投放词 / 搜索词表现行 1 条" },
            ],
            boundary: "搜索词只能说明广告活动和广告组下的用户搜索表现，不能自动归因到单个广告 ASIN。",
            next_manual_step: "只用于回看该复盘样本的原始诊断路径；继续人工复核，不自动改规则，不自动执行广告动作。",
          },
          evidence_groups: [
            {
              group_id: "parent_search_term_review",
              label: "Parent ASIN 广告搜索词表现复核",
              value: "当前诊断入口下广告用户搜索词表现行 1 条；用于聚合同类搜索词表现，再进入具体 SearchTerm 人工复核",
            },
            { group_id: "ad_group_boundary", label: "广告组边界", value: "广告活动 1 个 / 广告组 1 个；广告组是投放容器，不是单个商品" },
            {
              group_id: "targeting_context",
              label: "投放词上下文",
              value: "1 个投放词 / 搜索词表现行 1 条；投放词：beach essentials。这些字段来自搜索词表现行，不代表完整关键词库，不能自动加词、否词或调价。",
            },
            { group_id: "placement_boundary", label: "广告位边界", value: "广告位上下文 0 条；缺少广告位证据时不能判断广告位影响" },
            {
              group_id: "snapshot_review_chain",
              label: "复盘证据链覆盖",
              value: "已覆盖 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 投放词证据 / 搜索词边界 / 广告位边界 / ABA 背景",
            },
            {
              group_id: "attribution_boundary",
              label: "归因边界",
              value: "搜索词只能说明广告活动和广告组下的用户搜索表现，不能自动归因到单个广告 ASIN。",
            },
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
          aba_match_boundary: "ABA 是站点级，只按站点 + 周期 + 搜索词匹配，不能当作店铺数据或广告归因。",
          total: 1,
          by_result: { worse: 1 },
          priority_result: "worse",
          sample_review_record_ids: ["review-record-worse-7d"],
          sample_action_ids: ["manual-action-worse"],
          sample_parent_scopes: ["Parent ASIN B00K4W4AAA 下只复核有广告数据的搜索词表现。"],
          sample_search_terms: ["12 month sunglasses"],
          sample_ad_contexts: ["优先复核广告组：RBK004-beach essentials-精准 / 投放词 beach essentials"],
          recommendation: "worse 1：优先复核该规则反馈样本上下文（广告搜索词表现复核）的阈值、证据来源和建议动作。",
          action_boundary: {
            result: "worse",
            allowed_reviews: ["复核阈值", "复核证据来源", "复核建议动作"],
            forbidden_actions: ["自动改规则", "自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
            boundary: "worse 只能触发人工复核阈值、证据来源和建议动作；不自动改规则，不自动执行广告动作。",
          },
          boundary: "该分组只用于规则反馈样本归类和人工复核优先级，不是广告处理对象；不自动改规则，不自动执行广告动作。",
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
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "规则反馈样本上下文（广告搜索词表现复核）");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "不是广告处理对象");
assertEqual(ruleFeedbackPrioritySummary?.closureChecklist.length, 6);
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[0] ?? "", "复盘结果分布 ready");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[0] ?? "", "worse 1");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[2] ?? "", "证据追溯 partial");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[2] ?? "", "1 / 2 条样本带证据上下文");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[3] ?? "", "复盘记录来源 partial");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[3] ?? "", "review_record_id / action_id / 指标窗口");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[4] ?? "", "复盘证据快照 partial");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[4] ?? "", "1 / 2 条可回看 AI 准入");
assertIncludes(ruleFeedbackPrioritySummary?.closureChecklist[5] ?? "", "不自动执行广告动作");
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
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "保存快照：2 条");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "排查路径：Parent 经营盘子 -> 广告 ASIN -> 广告组");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "AI 准入：可进入人工确认");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "actionability_status");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "诊断路径：搜索词 -> 广告活动 / 广告组 -> 投放词结构 -> 广告 ASIN 人工复核");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "路径证据：搜索词表现：花费 28.50 / 订单 0 / 销售额 0.00");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "人工下一步：只用于回看该复盘样本的原始诊断路径");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "证据回看：搜索词表现行 1 条");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "覆盖广告活动 1 个 / 广告组 1 个");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "广告搜索词复核证据：Parent ASIN 广告搜索词表现复核");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "当前诊断入口下广告用户搜索词表现行 1 条");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "广告组边界：广告活动 1 个 / 广告组 1 个");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "投放词上下文：1 个投放词 / 搜索词表现行 1 条");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "广告位边界：广告位上下文 0 条");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "复盘证据链覆盖：已覆盖 广告组合流判断");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "逐投放上下文");
assertIncludes(ruleFeedbackPrioritySummary?.records[0] ?? "", "归因边界：搜索词只能说明广告活动和广告组下的用户搜索表现");
assertIncludes(ruleFeedbackPrioritySummary?.records[1] ?? "", "improved / opportunity / advertised_product / B016EXMW02 / 14d");
assertIncludes(ruleFeedbackPrioritySummary?.records[1] ?? "", "保存快照：0 条");
assertIncludes(ruleFeedbackPrioritySummary?.records[1] ?? "", "缺口：保存快照 / 排查路径 / AI 准入");
assertEqual(ruleFeedbackPrioritySummary?.candidateGroups.length, 1);
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "规则语义：海滩出行用品");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "worse 1");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "Parent ASIN来源：Parent ASIN B00K4W4AAA");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "SearchTerm样本：12 month sunglasses");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "逐投放来源：优先复核广告组：RBK004-beach essentials-精准");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "beach essentials");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "ABA边界");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "不能当作店铺数据或广告归因");
assertIncludes(ruleFeedbackPrioritySummary?.candidateGroups[0] ?? "", "动作边界：复核阈值 / 复核证据来源 / 复核建议动作");
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
          evidence: "人工动作 2 条，证据快照 1 条，广告搜索词聚合上下文 1 条，ABA 站点级参考 1 条",
        },
        { check_id: "evidence_trace", label: "证据追溯", status: "blocked", evidence: "0 / 0 条样本带证据上下文" },
        { check_id: "action_boundary", label: "动作边界", status: "ready", evidence: "只允许人工复核；不自动改规则，不自动执行广告动作" },
      ],
      pending_source_candidates: [
        {
          source_type: "manual_action",
          source_id: "manual-action-generic",
          action_type: "add_to_review",
          object_type: "search_term",
          object_id: "search_term:1:boys sunglasses",
          object_label: "boys sunglasses",
          group_label: "规则语义：ASIN 查询词",
          sample_parent_scopes: ["Parent ASIN 经营入口待补：需要确认销售表现和当前广告数据只覆盖有投放的 ASIN。"],
          sample_search_terms: ["boys sunglasses"],
          sample_ad_contexts: ["逐投放来源待补充"],
          boundary: "该来源只说明待复盘人工留痕；未保存 ReviewRecord 前不形成规则反馈候选，不自动改规则，不自动执行广告动作。",
        },
        {
          source_type: "manual_action",
          source_id: "manual-action-beach",
          action_type: "add_to_review",
          object_type: "search_term",
          object_id: "search_term:1:beach essentials",
          object_label: "beach essentials",
          group_label: "规则语义：海滩出行用品",
          aba_reference_term: "beach essentials",
          aba_period: "2026-05-10 到 2026-05-16",
          aba_match_boundary: "ABA 是站点级，只按站点 + 周期 + 搜索词匹配，不能当作店铺数据或广告归因。",
          sample_parent_scopes: ["Parent ASIN B00K4W4AAA 下只复核有广告数据的搜索词表现。"],
          sample_search_terms: ["beach essentials"],
          sample_ad_contexts: ["广告组 RBK004-beach essentials-精准 / 投放词 beach essentials"],
          boundary: "该来源只说明待复盘人工留痕；未保存 ReviewRecord 前不形成规则反馈候选，不自动改规则，不自动执行广告动作。",
        },
      ],
      summary: "暂无已保存复盘记录。",
      rule_feedback: "暂无复盘结果：保留当前信号解释口径，不调整规则。",
    },
  },
};
assertEqual(signalTriageReviewFeedbackText(triageWithoutSavedReviewFeedback), null);
assertEqual(signalTriageSummaryText(triageWithoutSavedReviewFeedback).includes("复盘反馈"), false);
const blockedRuleFeedbackPrioritySummary = buildRuleFeedbackPrioritySummary(triageWithoutSavedReviewFeedback);
assertEqual(blockedRuleFeedbackPrioritySummary?.title, "复盘样本池门槛");
assertIncludes(blockedRuleFeedbackPrioritySummary?.basis ?? "", "暂无已保存 ReviewRecord");
assertIncludes(blockedRuleFeedbackPrioritySummary?.basis ?? "", "不形成规则反馈候选");
assertIncludes(blockedRuleFeedbackPrioritySummary?.priority ?? "", "未保存复盘结论前");
assertIncludes(blockedRuleFeedbackPrioritySummary?.priority ?? "", "不能判断规则有效");
assertIncludes(blockedRuleFeedbackPrioritySummary?.sampleSort ?? "", "保存 ReviewRecord 后启用");
assertIncludes(blockedRuleFeedbackPrioritySummary?.actionBoundary ?? "", "没有 ready 复盘前不保存复盘记录");
assertNotIncludes(blockedRuleFeedbackPrioritySummary?.actionBoundary ?? "", "保存 ready 复盘记录");
assertIncludes(blockedRuleFeedbackPrioritySummary?.actionBoundary ?? "", "不自动执行广告动作");
assertIncludes(blockedRuleFeedbackPrioritySummary?.closureChecklist[0] ?? "", "复盘结果分布 blocked");
assertIncludes(blockedRuleFeedbackPrioritySummary?.closureChecklist[2] ?? "", "复盘输入证据 partial");
assertIncludes(blockedRuleFeedbackPrioritySummary?.closureChecklist[2] ?? "", "证据快照 1 条");
assertIncludes(blockedRuleFeedbackPrioritySummary?.closureChecklist[3] ?? "", "证据追溯 blocked");
assertIncludes(blockedRuleFeedbackPrioritySummary?.closureChecklist[3] ?? "", "0 / 0 条样本带证据上下文");
assertEqual(blockedRuleFeedbackPrioritySummary?.records.length, 0);
assertEqual(blockedRuleFeedbackPrioritySummary?.candidateGroups.length, 0);
assertEqual(blockedRuleFeedbackPrioritySummary?.pendingSources.length, 2);
assertIncludes(blockedRuleFeedbackPrioritySummary?.pendingSources[0] ?? "", "待复盘来源：规则语义：ASIN 查询词");
assertIncludes(blockedRuleFeedbackPrioritySummary?.pendingSources[0] ?? "", "经营入口待补");
assertIncludes(blockedRuleFeedbackPrioritySummary?.defaultPendingSource ?? "", "待复盘来源：规则语义：海滩出行用品");
assertIncludes(blockedRuleFeedbackPrioritySummary?.defaultPendingSource ?? "", "Parent ASIN来源：Parent ASIN B00K4W4AAA");
assertIncludes(blockedRuleFeedbackPrioritySummary?.defaultPendingSource ?? "", "SearchTerm样本：beach essentials");
assertIncludes(blockedRuleFeedbackPrioritySummary?.defaultPendingSource ?? "", "逐投放来源：广告组 RBK004-beach essentials-精准");
assertIncludes(blockedRuleFeedbackPrioritySummary?.defaultPendingSource ?? "", "未保存 ReviewRecord 前不形成规则反馈候选");
assertIncludes(blockedRuleFeedbackPrioritySummary?.boundary ?? "", "门槛检查");
assertIncludes(blockedRuleFeedbackPrioritySummary?.boundary ?? "", "不代表已有规则反馈样本池");

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
assertEqual(compactQueueMeta.primary.join(" / "), "经营问题 数据质量 / 广告商品 / 严重 4 / 置信 中");
assertEqual(compactQueueMeta.secondary, "rivbos / US / 数据过期 / 待确认");
const compactQueueDecision = (compactQueueMeta as { decision?: string }).decision ?? "";
assertIncludes(compactQueueDecision, "数据已过期");
assertIncludes(compactQueueDecision, "需要人工重新导入 ABA 文件");

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

const diagnosisContractItems = signalTriageDiagnosisContractItems({
  diagnosis_contract: {
    object_label: "beach essentials",
    status: "ready_for_manual_confirmation",
    sections: [
      {
        section_id: "search_term_opportunity",
        title: "搜索词机会",
        business_question: "是否存在可人工复核的扩量机会？",
        object_grain: "SearchTerm + 同广告活动 / 广告组上下文",
        metrics: [
          {
            name: "花费",
            value: "$34.11",
            purpose: "判断该机会不是零成本偶然样本。",
          },
          {
            name: "订单",
            value: "21",
            purpose: "判断搜索词是否已经产生真实广告转化。",
          },
          {
            name: "销售额",
            value: "$193.20",
            purpose: "判断扩量机会是否已有销售承接。",
          },
          {
            name: "ACOS",
            value: "17.7%",
            purpose: "判断放量前的效率是否可接受。",
          },
          {
            name: "CVR",
            value: "55.3%",
            purpose: "判断点击承接质量是否支持继续复核，不能单独证明应放量。",
          },
          {
            name: "投放上下文",
            value: "广告组 2 个 / 搜索词表现行 2 条",
            purpose: "确认该词出现在哪些广告组，避免把合并结果误读为单一对象表现。",
          },
          {
            name: "投放词证据",
            value: "beach essentials / 1 个",
            purpose: "判断用户搜索词是否已有投放词承接；这不是完整关键词库证明。",
          },
          {
            name: "广告位证据",
            value: "广告组级广告位 0 条 / 同广告活动广告位 2 条",
            purpose: "判断是否能解释流量位置影响；只有广告组级或搜索词直连证据才可辅助广告位判断。",
          },
          {
            name: "ABA市场热度",
            value: "排名 208 / 2026-06-07 至 2026-06-13 / 上升16",
            purpose: "判断该词是否同时具备站点级市场热度；ABA 只作为市场背景。",
          },
          {
            name: "广告组承接边界",
            value: "2/2 已匹配 / 最大同组 ASIN 1",
            purpose: "判断搜索词机会能否安全下钻到广告组和广告 ASIN。",
          },
        ],
        current_judgement: "当前搜索词在 2 个投放上下文中转化稳定。",
        proves: "能证明该搜索词在当前投放上下文中有转化。",
        does_not_prove: "不能证明应该自动加词、自动调价或归因到单个广告 ASIN。",
        evidence_gap: "缺少投放词是否已稳定维护、是否主推策略允许扩量的人工证据。",
        required_evidence: "需要人工核对广告商品、投放词、广告组策略和 7/14 天复盘指标。",
        next_manual_step: "人工复核广告商品和投放词后，记录观察或加入 7/14 天复盘。",
      },
    ],
  },
});

assertEqual(diagnosisContractItems.length, 1);
assertEqual(diagnosisContractItems[0].title, "广告搜索词表现复核");
assertIncludes(diagnosisContractItems[0].metricText, "订单：21，用于判断搜索词是否已经产生真实广告转化");
assertIncludes(diagnosisContractItems[0].proves, "能证明该搜索词");
assertIncludes(diagnosisContractItems[0].doesNotProve, "不能证明应该自动加词");
assertIncludes(diagnosisContractItems[0].evidenceGap, "缺少投放词");
assertIncludes(diagnosisContractItems[0].requiredEvidence, "广告商品");
assertIncludes(diagnosisContractItems[0].nextManualStep, "加入 7/14 天复盘");

const searchTermOpportunityReviewChain = buildSearchTermOpportunityReviewChain(diagnosisContractItems, [
  {
    blockId: "targeting_context",
    label: "投放词结构",
    value: "优先广告组投放词 2 个：有效 beach essentials / 无订单 beach trip essentials",
    detail: "不能自动加词、否词或调价。",
    source: "ad_targeting",
  },
  {
    blockId: "search_term_market_context",
    label: "搜索词市场背景",
    value: "优先广告组搜索词 2 条：有效 beach essentials / ABA Top1000 匹配 1 条",
    detail: "ABA匹配词：beach essentials（花费 34.11，订单 21，ABA排名 208）",
    source: "ad_search_term_daily_metrics / ABA导出",
  },
  {
    blockId: "context_boundary",
    label: "上下文边界",
    value: "搜索词 2 条 / 广告位 0 条",
    detail: "搜索词和广告位只说明同广告组上下文，不能自动归因到单个 ASIN。",
    source: "business_rule",
  },
]);

assertEqual(searchTermOpportunityReviewChain?.title, "广告搜索词表现复核");
assertIncludes(searchTermOpportunityReviewChain?.objectGrain ?? "", "SearchTerm");
assertIncludes(searchTermOpportunityReviewChain?.reviewPath ?? "", "Parent ASIN 销售盘");
assertIncludes(searchTermOpportunityReviewChain?.reviewPath ?? "", "有广告数据的广告 ASIN");
assertIncludes(searchTermOpportunityReviewChain?.reviewPath ?? "", "广告组容器");
assertIncludes(searchTermOpportunityReviewChain?.reviewPath ?? "", "同组投放商品表现");
assertIncludes(searchTermOpportunityReviewChain?.reviewPath ?? "", "投放词");
assertIncludes(searchTermOpportunityReviewChain?.reviewPath ?? "", "广告位边界");
assertIncludes(searchTermOpportunityReviewChain?.reviewPath ?? "", "具体 SearchTerm");
assertIncludes(searchTermOpportunityReviewChain?.reviewPath ?? "", "7/14 天复盘");
assertEqual(searchTermOpportunityReviewChain?.reviewLayers.length, 4);
assertEqual(searchTermOpportunityReviewChain?.reviewLayers[0].label, "广告组合流判断");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[0].purpose ?? "", "广告组容器");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[0].proves ?? "", "广告组上下文");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[0].doesNotProve ?? "", "自动加词");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[0].nextManualStep ?? "", "打开广告组");
assertEqual(searchTermOpportunityReviewChain?.reviewLayers[1].label, "同组投放商品表现");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[1].purpose ?? "", "花费、点击、订单、销售额、ACOS 和 CVR");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[1].doesNotProve ?? "", "自动归因到某个广告 ASIN");
assertEqual(searchTermOpportunityReviewChain?.reviewLayers[2].label, "投放词证据");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[2].purpose ?? "", "关键词、商品定向还是自动投放");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[2].proves ?? "", "投放承接证据");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[2].doesNotProve ?? "", "关键词库已完整覆盖");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[2].nextManualStep ?? "", "人工核对投放词");
assertEqual(searchTermOpportunityReviewChain?.reviewLayers[3].label, "广告位边界");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[3].purpose ?? "", "搜索词直连、广告组级、广告活动级");
assertIncludes(searchTermOpportunityReviewChain?.reviewLayers[3].doesNotProve ?? "", "不能证明广告位导致");
assertIncludes(searchTermOpportunityReviewChain?.parentScopeContext ?? "", "Parent ASIN");
assertIncludes(searchTermOpportunityReviewChain?.parentScopeContext ?? "", "当前广告数据");
assertIncludes(searchTermOpportunityReviewChain?.adAsinCoverage ?? "", "广告 ASIN");
assertIncludes(searchTermOpportunityReviewChain?.adAsinCoverage ?? "", "不能");
assertIncludes(searchTermOpportunityReviewChain?.targetingEvidence ?? "", "投放词结构");
assertIncludes(searchTermOpportunityReviewChain?.targetingEvidence ?? "", "beach essentials");
assertIncludes(searchTermOpportunityReviewChain?.adGroupSynthesis ?? "", "搜索词不能自动归因到单个广告 ASIN");
assertIncludes(searchTermOpportunityReviewChain?.adGroupProductPerformance ?? "", "同组投放商品表现");
assertIncludes(searchTermOpportunityReviewChain?.placementBoundary ?? "", "广告位边界待补");
assertIncludes(searchTermOpportunityReviewChain?.placementBoundary ?? "", "不能把表现差异解释为广告位问题");
assertIncludes(searchTermOpportunityReviewChain?.marketContext ?? "", "搜索词市场背景");
assertIncludes(searchTermOpportunityReviewChain?.marketContext ?? "", "ABA排名 208");
assertIncludes(searchTermOpportunityReviewChain?.doesNotProve ?? "", "不能把 ABA 当作店铺数据");
assertIncludes(searchTermOpportunityReviewChain?.doesNotProve ?? "", "不能把搜索词直接归因到单个广告 ASIN");
assertIncludes(searchTermOpportunityReviewChain?.evidenceGap ?? "", "不能自动归因到单个 ASIN");
assertIncludes(searchTermOpportunityReviewChain?.requiredEvidence ?? "", "广告商品");
assertIncludes(searchTermOpportunityReviewChain?.nextManualStep ?? "", "加入 7/14 天复盘");
assertIncludes(searchTermOpportunityReviewChain?.actionBoundary ?? "", "不得自动加词");

const searchTermAdContextRows = buildSearchTermAdContextRows({
  id: "sig-opportunity-search-term-beach-essentials",
  signal_type: "opportunity",
  signal_category: "search_term_opportunity",
  object_type: "search_term",
  severity: 4,
  status: "pending",
  freshness_status: "api_snapshot",
  evidence: {
    primary_object: { label: "beach essentials", search_term: "beach essentials" },
    source_rows: [
      {
        source_table: "ad_search_term_daily_metrics",
        row_id: "row-keyword",
        source_report_type: "keyword",
        campaign_name: "RBK004-beach essentials-精准",
        ad_group_name: "RBK004-beach essentials-精准",
        keyword_text: "beach essentials",
        search_term: "beach essentials",
        normalized_query: "beach essentials",
        start_date: "2026-05-18",
        end_date: "2026-06-16",
        clicks: 19,
        cost: 18.08,
        orders: 13,
        sales: 116.88,
      },
      {
        source_table: "aba_search_term_snapshots",
        search_term: "beach essentials",
        search_frequency_rank: 208,
      },
      {
        source_table: "ad_search_term_daily_metrics",
        row_id: "row-broad",
        source_report_type: "keyword",
        campaign_name: "RBK004-扩展-beach essentials",
        ad_group_name: "RBK004-扩展-beach essentials",
        keyword_text: "beach essentials",
        search_term: "beach essentials",
        normalized_query: "beach essentials",
        start_date: "2026-05-18",
        end_date: "2026-06-16",
        clicks: 19,
        spend: 16.03,
        orders: 8,
        sales: 76.32,
      },
      {
        source_table: "ad_search_term_daily_metrics",
        row_id: "row-other-term",
        source_report_type: "keyword",
        campaign_name: "Other",
        ad_group_name: "Other",
        keyword_text: "kids sunglasses",
        search_term: "kids sunglasses",
        normalized_query: "kids sunglasses",
        clicks: 10,
        spend: 9,
        orders: 1,
        sales: 20,
      },
    ],
  },
});

assertEqual(searchTermAdContextRows.length, 2);
assertEqual(searchTermAdContextRows[0].key, "row-keyword");
assertEqual(searchTermAdContextRows[0].adGroupName, "RBK004-beach essentials-精准");
assertIncludes(searchTermAdContextRows[0].targetingLabel, "关键词投放：beach essentials");
assertEqual(searchTermAdContextRows[0].reviewPriority, "优先复核广告组");
assertIncludes(searchTermAdContextRows[0].reviewReason, "订单和花费排序最高");
assertIncludes(searchTermAdContextRows[0].reviewReason, "投放词、广告 ASIN 承接和主推策略");
assertIncludes(searchTermAdContextRows[0].metricsText, "点击 19 / 花费 18.08 / 订单 13 / 销售额 116.88");
assertIncludes(searchTermAdContextRows[0].efficiencyText, "ACOS 15.5%");
assertIncludes(searchTermAdContextRows[0].periodText, "2026-05-18 至 2026-06-16");
assertIncludes(searchTermAdContextRows[0].judgement, "有订单承接");
assertIncludes(searchTermAdContextRows[0].boundary, "不能自动归因到单个 ASIN");
assertIncludes(searchTermAdContextRows[0].proves, "逐投放表现");
assertIncludes(searchTermAdContextRows[0].proves, "不同广告组、投放词和广告 ASIN 承接差异");
assertIncludes(searchTermAdContextRows[0].doesNotProve, "不能证明该表现应自动归因到单个 ASIN");
assertIncludes(searchTermAdContextRows[0].doesNotProve, "不能证明应自动加词、否词、调价");
assertIncludes(searchTermAdContextRows[0].nextManualStep, "优先人工核对");
assertIncludes(searchTermAdContextRows[0].nextManualStep, "广告位边界");
assertEqual(searchTermAdContextRows[1].adGroupName, "RBK004-扩展-beach essentials");
assertEqual(searchTermAdContextRows[1].reviewPriority, "对照复核广告组");
assertIncludes(searchTermAdContextRows[1].reviewReason, "不同广告组的承接差异");
const searchTermAdContextReviewSummary = buildSearchTermAdContextReviewSummary(searchTermAdContextRows);
if (!searchTermAdContextReviewSummary) {
  throw new Error("有逐投放上下文时必须生成优先摘要");
}
assertEqual(searchTermAdContextReviewSummary.title, "先看 RBK004-beach essentials-精准");
assertIncludes(searchTermAdContextReviewSummary.statusLabel, "2 条逐投放表现");
assertIncludes(searchTermAdContextReviewSummary.statusLabel, "2 个广告组");
assertIncludes(searchTermAdContextReviewSummary.firstLine, "beach essentials / RBK004-beach essentials-精准 / 关键词投放：beach essentials");
assertIncludes(searchTermAdContextReviewSummary.whyFirst, "优先复核广告组");
assertIncludes(searchTermAdContextReviewSummary.proves, "逐投放表现");
assertIncludes(searchTermAdContextReviewSummary.doesNotProve, "自动归因到单个 ASIN");
assertIncludes(searchTermAdContextReviewSummary.nextManualStep, "优先人工核对");
assertIncludes(searchTermAdContextReviewSummary.boundary, "不替代 Parent ASIN、广告 ASIN、广告组或广告位完整判断");
assertEqual(buildSearchTermAdContextReviewSummary([]), null);
assertEqual(
  buildSearchTermAdContextRows({ ...opportunitySignal, signal_category: "ad_group_structure", object_type: "ad_group" }).length,
  0,
);

const thinSearchTermOpportunityReviewChain = buildSearchTermOpportunityReviewChain(diagnosisContractItems, [
  {
    blockId: "targeting_context",
    label: "投放词结构",
    value: "优先广告组投放词 1 个：beach essentials",
    detail: "来自广告搜索词上下文。",
    source: "ad_targeting",
  },
  {
    blockId: "ad_group_context",
    label: "广告组上下文",
    value: "优先广告组 RBK004-Exact，同组广告 ASIN 2 个",
    detail: "用于人工复核结构。",
    source: "ad_groups",
  },
  {
    blockId: "search_term_market_context",
    label: "搜索词市场背景",
    value: "ABA 匹配 beach essentials，排名 208",
    detail: "用于参考市场热度。",
    source: "ABA导出",
  },
]);

assertIncludes(thinSearchTermOpportunityReviewChain?.targetingEvidence ?? "", "不代表完整关键词库覆盖");
assertIncludes(thinSearchTermOpportunityReviewChain?.parentScopeContext ?? "", "Parent ASIN");
assertIncludes(thinSearchTermOpportunityReviewChain?.adAsinCoverage ?? "", "广告 ASIN");
assertIncludes(thinSearchTermOpportunityReviewChain?.adGroupSynthesis ?? "", "搜索词只说明同广告组上下文");
assertIncludes(thinSearchTermOpportunityReviewChain?.adGroupSynthesis ?? "", "不能判断广告位影响");
assertIncludes(thinSearchTermOpportunityReviewChain?.adGroupProductPerformance ?? "", "同组投放商品表现");
assertIncludes(thinSearchTermOpportunityReviewChain?.placementBoundary ?? "", "广告位边界待补");
assertIncludes(thinSearchTermOpportunityReviewChain?.marketContext ?? "", "站点级市场背景");
assertIncludes(thinSearchTermOpportunityReviewChain?.marketContext ?? "", "不能当作店铺");
const thinManualConfirmationSearchTermItems = buildManualConfirmationEvidenceItems(
  diagnosisContractItems,
  thinSearchTermOpportunityReviewChain,
);
assertIncludes(thinManualConfirmationSearchTermItems.find((item) => item.label === "复核路径")?.value ?? "", "Parent ASIN 销售盘");
assertIncludes(thinManualConfirmationSearchTermItems.find((item) => item.label === "Parent ASIN 入口")?.value ?? "", "Parent ASIN");
assertIncludes(thinManualConfirmationSearchTermItems.find((item) => item.label === "广告 ASIN 承接")?.value ?? "", "广告 ASIN");
assertIncludes(thinManualConfirmationSearchTermItems.find((item) => item.label === "广告组合流判断")?.value ?? "", "不能判断广告位影响");
assertIncludes(thinManualConfirmationSearchTermItems.find((item) => item.label === "同组投放商品表现")?.value ?? "", "同组投放商品表现");
assertIncludes(thinManualConfirmationSearchTermItems.find((item) => item.label === "广告位边界")?.value ?? "", "广告位边界待补");
assertIncludes(thinManualConfirmationSearchTermItems.find((item) => item.label === "ABA 背景")?.value ?? "", "站点级市场背景");

const searchTermFallbackReviewChain = buildSearchTermOpportunityReviewChain(
  [
    {
      sectionId: "ad_group_boundary",
      title: "广告组边界",
      businessQuestion: "搜索词或广告商品表现是否能安全落到广告组结构判断？",
      objectGrain: "AdGroup 投放容器",
      metricText: "",
      currentJudgement: "搜索词出现在 1 个广告组上下文。",
      proves: "能证明搜索词出现在哪些广告组上下文里。",
      doesNotProve: "不能把广告组当产品。",
      evidenceGap: "缺广告组级广告位证据。",
      requiredEvidence: "需要同广告组投放商品清单。",
      nextManualStep: "先打开广告组核对投放词。",
    },
  ],
  [
    {
      blockId: "targeting_context",
      label: "投放词结构",
      value: "投放词：sunglasses for kids",
      detail: "不能自动加词。",
      source: "ad_targeting",
    },
    {
      blockId: "search_term_market_context",
      label: "搜索词市场背景",
      value: "搜索词 1 条",
      detail: "ABA匹配待补。",
      source: "ad_search_term_daily_metrics",
    },
  ],
);

assertEqual(searchTermFallbackReviewChain?.title, "广告搜索词表现复核链");
assertIncludes(searchTermFallbackReviewChain?.objectGrain ?? "", "SearchTerm");
assertIncludes(searchTermFallbackReviewChain?.currentJudgement ?? "", "搜索词出现在 1 个广告组上下文");
assertIncludes(searchTermFallbackReviewChain?.doesNotProve ?? "", "不能把广告组当产品");

const targetSpecificDiagnosisContractItems = signalTriageDiagnosisContractItems(
  {
    diagnosis_contract: {
      object_label: "boys sunglasses",
      signal_id: "sig-boys",
      status: "ready_for_manual_confirmation",
      sections: [
        {
          section_id: "search_term_opportunity",
          title: "搜索词机会",
          business_question: "boys sunglasses 是否可扩量？",
          object_grain: "SearchTerm",
          current_judgement: "boys sunglasses 可进入人工扩量复核。",
          proves: "能证明 boys sunglasses 有广告表现。",
          does_not_prove: "不能证明应该自动加词。",
          next_manual_step: "人工复核 boys sunglasses。",
        },
      ],
    },
    recommended_diagnosis_contract: {
      object_label: "beach essentials",
      signal_id: "sig-beach",
      status: "ready_for_manual_confirmation",
      sections: [
        {
          section_id: "search_term_opportunity",
          title: "搜索词机会",
          business_question: "beach essentials 是否可扩量？",
          object_grain: "SearchTerm",
          current_judgement: "beach essentials 在 2 个投放上下文中转化稳定。",
          proves: "能证明 beach essentials 有广告订单和 ABA 语义背景。",
          does_not_prove: "不能证明应该自动加词。",
          next_manual_step: "人工复核 beach essentials 后加入复盘。",
        },
      ],
    },
  },
  {
    object_label: "beach essentials",
    signal_id: "sig-beach",
    status: "ready_for_manual_confirmation",
    sections: [
      {
        section_id: "search_term_opportunity",
        title: "搜索词机会",
        business_question: "beach essentials 是否可扩量？",
        object_grain: "SearchTerm",
        current_judgement: "beach essentials 在 2 个投放上下文中转化稳定。",
        proves: "能证明 beach essentials 有广告订单和 ABA 语义背景。",
        does_not_prove: "不能证明应该自动加词。",
        next_manual_step: "人工复核 beach essentials 后加入复盘。",
      },
    ],
  },
);

assertIncludes(targetSpecificDiagnosisContractItems[0].currentJudgement, "beach essentials");
assertNotIncludes(targetSpecificDiagnosisContractItems[0].currentJudgement, "boys sunglasses");

const manualConfirmationEvidenceItems = buildManualConfirmationEvidenceItems(diagnosisContractItems);
assertEqual(
  manualConfirmationEvidenceItems.map((item) => item.label).join(" / "),
  "业务问题 / 当前判断 / 能证明 / 不能证明 / 人工下一步",
);
assertIncludes(manualConfirmationEvidenceItems[0].value, "可人工复核");
assertIncludes(manualConfirmationEvidenceItems[1].value, "2 个投放上下文");
assertIncludes(manualConfirmationEvidenceItems[1].detail ?? "", "订单：21");
assertIncludes(manualConfirmationEvidenceItems[2].value, "有转化");
assertIncludes(manualConfirmationEvidenceItems[3].value, "自动加词");
assertIncludes(manualConfirmationEvidenceItems[4].value, "加入 7/14 天复盘");

const manualConfirmationSearchTermEvidenceItems = buildManualConfirmationEvidenceItems(
  diagnosisContractItems,
  searchTermOpportunityReviewChain,
);
assertEqual(
  manualConfirmationSearchTermEvidenceItems.map((item) => item.label).join(" / "),
  "业务问题 / 当前判断 / 能证明 / 不能证明 / 人工下一步 / 复核路径 / Parent ASIN 入口 / 广告 ASIN 承接 / 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 投放词证据 / 广告位边界 / ABA 背景 / 证据缺口 / 需要补证 / 动作边界",
);
assertIncludes(manualConfirmationSearchTermEvidenceItems[5].value, "Parent ASIN 销售盘");
assertIncludes(manualConfirmationSearchTermEvidenceItems[5].value, "具体 SearchTerm");
assertIncludes(manualConfirmationSearchTermEvidenceItems[5].detail ?? "", "人工点击前");
assertIncludes(manualConfirmationSearchTermEvidenceItems[6].value, "Parent ASIN");
assertIncludes(manualConfirmationSearchTermEvidenceItems[7].value, "广告 ASIN");
assertIncludes(manualConfirmationSearchTermEvidenceItems[8].value, "搜索词不能自动归因到单个广告 ASIN");
assertIncludes(manualConfirmationSearchTermEvidenceItems[8].detail ?? "", "同广告组上下文");
assertIncludes(manualConfirmationSearchTermEvidenceItems[10].value, "广告组、投放词、广告 ASIN 和搜索词表现顺序复核");
assertIncludes(manualConfirmationSearchTermEvidenceItems[10].detail ?? "", "不能把排序解释成自动加词");
assertIncludes(manualConfirmationSearchTermEvidenceItems[11].value, "投放词结构");
assertIncludes(manualConfirmationSearchTermEvidenceItems[11].detail ?? "", "当前广告组投放上下文");
assertIncludes(manualConfirmationSearchTermEvidenceItems[11].detail ?? "", "不代表完整关键词库");
const manualConfirmationEvidenceByLabel = Object.fromEntries(
  manualConfirmationSearchTermEvidenceItems.map((item) => [item.label, item]),
);
assertIncludes(manualConfirmationEvidenceByLabel["复核路径"].value, "7/14 天复盘");
assertIncludes(manualConfirmationEvidenceByLabel["同组投放商品表现"].value, "同组投放商品");
assertIncludes(manualConfirmationEvidenceByLabel["同组投放商品表现"].detail ?? "", "不能把搜索词或广告位自动归因到单个广告 ASIN");
assertIncludes(manualConfirmationEvidenceByLabel["逐投放上下文"].value, "后端 evidence_snapshot");
assertIncludes(manualConfirmationEvidenceByLabel["逐投放上下文"].detail ?? "", "广告组容器、投放词和广告 ASIN 承接顺序");
assertIncludes(manualConfirmationEvidenceByLabel["广告位边界"].value, "不能把表现差异解释为广告位问题");
assertIncludes(manualConfirmationEvidenceByLabel["广告位边界"].detail ?? "", "缺广告组级证据时不能下广告位结论");
assertIncludes(manualConfirmationEvidenceByLabel["ABA 背景"].value, "ABA排名 208");
assertIncludes(manualConfirmationEvidenceByLabel["ABA 背景"].detail ?? "", "站点 + 周期 + 标准化搜索词");
assertIncludes(manualConfirmationEvidenceByLabel["需要补证"].value, "广告商品、投放词、广告组策略");
assertIncludes(manualConfirmationEvidenceByLabel["需要补证"].detail ?? "", "7/14 天复盘回看");
assertIncludes(manualConfirmationEvidenceByLabel["动作边界"].value, "不得自动加词");
assertIncludes(manualConfirmationEvidenceByLabel["动作边界"].detail ?? "", "不能把 ABA 当作店铺数据");

const selectedSearchIntentDecisionCard = {
  intentLabel: "规则语义：海滩出行用品",
  title: "规则语义：海滩出行用品",
  summary: "35 单 / 花费 77.38 / ACOS 23.42%",
  sourceLabel: "规则语义",
  operationDecisionLabel: "扩量复核",
  operationDecisionReason: "有订单且 ACOS 可控，优先人工复核是否存在可扩量机会。",
  operationDecisionTone: "scale" as const,
  reviewStatus: {
    label: "扩量复核",
    reason: "订单 35、ACOS 23.42% 已形成可人工复核的扩量候选。",
    nextStep: "打开 beach essentials 的具体 SearchTerm 信号，人工核对广告组目标、投放词和广告位后，只做记录观察或加入 7/14 天复盘。",
    tone: "scale" as const,
  },
  insight: "这组广告搜索词转化稳定。",
  businessQuestion: "这组同类广告用户搜索词是否存在可扩量机会？",
  currentJudgement: "当前进入扩量人工复核。",
  metricPurpose: "花费、点击、订单、CVR 和 ACOS 用于判断是否值得继续人工复核。",
  metricPurposeItems: [],
  adContext: "覆盖 2 个广告组。",
  evidenceGap: "需要补投放词和广告位证据。",
  signalMetricBoundary: "卡片指标覆盖聚合表现行，具体信号只展示可行动子集。",
  purpose: "从 Parent ASIN 视角聚合广告用户搜索词表现。",
  boundary: "不自动执行广告动作。",
  dataGrain: "ad_search_term_daily_metrics 用户搜索词表现行。",
  proves: "能证明同类搜索词有广告订单。",
  doesNotProve: "不能证明应该自动加词。",
  nextManualStep: "打开具体 SearchTerm 后人工复核。",
  primarySearchTerm: "beach essentials",
  primarySearchTermReason: "该词订单最多，适合作为优先打开的 SearchTerm。",
  topTerms: [],
};

const manualConfirmationSearchTermEvidenceItemsWithDecision = buildManualConfirmationEvidenceItems(
  diagnosisContractItems,
  searchTermOpportunityReviewChain,
  undefined,
  selectedSearchIntentDecisionCard,
);
assertIncludes(
  manualConfirmationSearchTermEvidenceItemsWithDecision.map((item) => item.label).join(" / "),
  "搜索词表现判断 / 复核路径",
);
const searchIntentDecisionEvidence = manualConfirmationSearchTermEvidenceItemsWithDecision.find(
  (item) => item.label === "搜索词表现判断",
);
assertIncludes(searchIntentDecisionEvidence?.value ?? "", "扩量复核");
assertIncludes(searchIntentDecisionEvidence?.value ?? "", "可扩量机会");
assertIncludes(searchIntentDecisionEvidence?.detail ?? "", "优先打开 beach essentials");
assertIncludes(searchIntentDecisionEvidence?.detail ?? "", "只用于人工复核优先级");
assertIncludes(searchIntentDecisionEvidence?.detail ?? "", "不自动执行广告动作");

const advertisedProductManualConfirmationEvidenceItems = buildManualConfirmationEvidenceItems(
  [],
  null,
  advertisedProductSignal,
);
assertEqual(advertisedProductManualConfirmationEvidenceItems.map((item) => item.label).join(" / "), "复核路径");
assertIncludes(advertisedProductManualConfirmationEvidenceItems[0].value, "Parent ASIN 销售盘");
assertIncludes(advertisedProductManualConfirmationEvidenceItems[0].value, "当前广告 ASIN");
assertIncludes(advertisedProductManualConfirmationEvidenceItems[0].detail ?? "", "广告 ASIN 是投放商品");
assertIncludes(advertisedProductManualConfirmationEvidenceItems[0].detail ?? "", "不能自动归因到该 ASIN");

const adGroupManualConfirmationEvidenceItems = buildManualConfirmationEvidenceItems([], null, adGroupSignal);
assertEqual(adGroupManualConfirmationEvidenceItems.map((item) => item.label).join(" / "), "复核路径");
assertIncludes(adGroupManualConfirmationEvidenceItems[0].value, "当前广告组容器");
assertIncludes(adGroupManualConfirmationEvidenceItems[0].value, "同组投放商品表现");
assertIncludes(adGroupManualConfirmationEvidenceItems[0].value, "主推款策略边界");
assertIncludes(adGroupManualConfirmationEvidenceItems[0].detail ?? "", "广告组是投放容器");
assertIncludes(adGroupManualConfirmationEvidenceItems[0].detail ?? "", "不能自动拆广告组");

const placementManualConfirmationEvidenceItems = buildManualConfirmationEvidenceItems(
  [],
  null,
  placementSignal,
);
assertEqual(placementManualConfirmationEvidenceItems.map((item) => item.label).join(" / "), "复核路径");
assertIncludes(placementManualConfirmationEvidenceItems[0].value, "广告位表现");
assertIncludes(placementManualConfirmationEvidenceItems[0].value, "广告 ASIN 和搜索词承接核对");
assertIncludes(placementManualConfirmationEvidenceItems[0].detail ?? "", "广告位只说明流量位置");
assertIncludes(placementManualConfirmationEvidenceItems[0].detail ?? "", "不能下 ASIN 或 Parent ASIN 归因结论");

const diagnosisEvidenceSummary = buildSignalDiagnosisEvidenceSummary(
  {
    id: "sig-search-term",
    signal_type: "opportunity",
    signal_category: "long_tail_opportunity",
    object_type: "search_term",
    severity: 3,
    confidence: "medium",
    status: "pending",
    freshness_status: "api_snapshot",
    evidence_count: 8,
    data_sources: [{ source_type: "ad_search_term_daily_metrics" }, { source_type: "ABA导出" }],
    evidence: {
      primary_object: {
        object_type: "search_term",
        object_id: "search_term:1:beach essentials",
        label: "beach essentials",
        search_term: "beach essentials",
      },
      facts: [{ label: "搜索词表现", value: "订单 21", source_type: "ad_search_term_daily_metrics" }],
    },
  },
  diagnosisContractItems,
);
assertEqual(diagnosisEvidenceSummary?.title, "广告搜索词表现复核");
assertEqual(diagnosisEvidenceSummary?.strengthLabel, "证据强度：中");
assertEqual(diagnosisEvidenceSummary?.tone, "medium");
assertIncludes(diagnosisEvidenceSummary?.objectReadback ?? "", "search_term");
assertIncludes(diagnosisEvidenceSummary?.objectReadback ?? "", "beach essentials");
assertIncludes(diagnosisEvidenceSummary?.objectReadback ?? "", "同一 stable object");
assertIncludes(diagnosisEvidenceSummary?.strengthReason ?? "", "中置信");
assertIncludes(diagnosisEvidenceSummary?.strengthReason ?? "", "当前证据数 8 条");
assertIncludes(diagnosisEvidenceSummary?.proves ?? "", "当前投放上下文中有转化");
assertIncludes(diagnosisEvidenceSummary?.doesNotProve ?? "", "自动加词");
assertIncludes(diagnosisEvidenceSummary?.evidenceGap ?? "", "缺少投放词");
assertIncludes(diagnosisEvidenceSummary?.nextManualStep ?? "", "加入 7/14 天复盘");

const metricDecisionItems = buildSignalMetricDecisionItems(
  {
    impressions: 900,
    clicks: 60,
    cost: 34.11,
    orders: 21,
    sales: 193.2,
    acos: 0.1766,
    cvr: 0.35,
    cpc: 0.57,
  },
  diagnosisContractItems,
);
const ordersMetricDecision = metricDecisionItems.find((item) => item.label === "订单");
const cvrMetricDecision = metricDecisionItems.find((item) => item.label === "CVR");
const placementMetricDecision = metricDecisionItems.find((item) => item.label === "广告位证据");
const abaMetricDecision = metricDecisionItems.find((item) => item.label === "ABA市场热度");
const adGroupBoundaryMetricDecision = metricDecisionItems.find((item) => item.label === "广告组承接边界");
assertEqual(
  metricDecisionItems.map((item) => item.label).join(" / "),
  "花费 / 订单 / 销售额 / ACOS / CVR / 投放上下文 / 投放词证据 / 广告位证据 / ABA市场热度 / 广告组承接边界",
);
assertIncludes(ordersMetricDecision?.purpose ?? "", "判断搜索词是否已经产生真实广告转化");
assertIncludes(ordersMetricDecision?.proves ?? "", "当前投放上下文中有转化");
assertIncludes(ordersMetricDecision?.doesNotProve ?? "", "自动加词");
assertIncludes(ordersMetricDecision?.nextManualStep ?? "", "加入 7/14 天复盘");
assertEqual(cvrMetricDecision?.value, "55.3%");
assertIncludes(cvrMetricDecision?.purpose ?? "", "点击承接质量");
assertEqual(placementMetricDecision?.value, "广告组级广告位 0 条 / 同广告活动广告位 2 条");
assertIncludes(placementMetricDecision?.purpose ?? "", "流量位置影响");
assertEqual(abaMetricDecision?.value, "排名 208 / 2026-06-07 至 2026-06-13 / 上升16");
assertIncludes(abaMetricDecision?.purpose ?? "", "站点级市场热度");
assertEqual(adGroupBoundaryMetricDecision?.value, "2/2 已匹配 / 最大同组 ASIN 1");
assertIncludes(adGroupBoundaryMetricDecision?.purpose ?? "", "广告组和广告 ASIN");
assertIncludes(adGroupBoundaryMetricDecision?.doesNotProve ?? "", "单个广告 ASIN");

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
  "综合判断 / 广告组问题定位 / 投放词结构 / 搜索词市场背景 / 广告位边界 / 对象边界",
);
assertEqual(diagnosisPathItems[0].step, 1);
assertEqual(diagnosisPathItems[5].step, 6);
assertIncludes(diagnosisPathItems[2].value, "词层分化复核");
assertIncludes(diagnosisPathItems[5].detail ?? "", "不能自动归因");

const currentApiDiagnosisPathEvidenceSummary = {
  recommended_evidence_drilldown: {
    object_label: "beach essentials",
    business_evidence_blocks: [
      {
        block_id: "diagnosis_path",
        label: "排查路径",
        value: "搜索词 -> 广告活动 / 广告组 -> 投放词结构 -> 广告 ASIN 人工复核",
        detail: "不能跳过人工确认直接加词、否词或调价。",
        source: "business_rule",
      },
      {
        block_id: "search_term_metric_summary",
        label: "搜索词表现",
        value: "花费 34.11 / 订单 21 / 销售额 193.20",
        detail: "指标来自搜索词表现行。",
        source: "ad_search_term_daily_metrics",
      },
      {
        block_id: "search_term_context",
        label: "投放上下文",
        value: "广告活动 2 个 / 广告组 2 个 / 搜索词表现行 2 条",
        detail: "用于人工定位该搜索词出现在哪些广告活动和广告组。",
        source: "ad_search_term_daily_metrics",
      },
      {
        block_id: "ad_group_product_performance",
        label: "同组投放商品表现",
        value: "同广告组广告 ASIN 3 个",
        detail: "不能把 SearchTerm 自动归因到单个 ASIN。",
        source: "advertised_products",
      },
      {
        block_id: "targeting_context",
        label: "投放词结构",
        value: "1 个投放词 / 搜索词表现行 2 条",
        detail: "不代表完整关键词库。",
        source: "ad_search_term_daily_metrics",
      },
      {
        block_id: "placement_context_gap",
        label: "广告位证据缺口",
        value: "缺少可直接配套的广告位上下文",
        detail: "不能判断广告位是否造成表现差异。",
        source: "business_rule",
      },
      {
        block_id: "search_term_boundary",
        label: "对象边界",
        value: "搜索词是投放证据，不是广告商品本身",
        detail: "不能自动归因到单个广告 ASIN。",
        source: "business_rule",
      },
    ],
  },
};
const currentApiDiagnosisPathItems = signalTriageDiagnosisPathItems(
  signalTriageBusinessEvidenceItems(currentApiDiagnosisPathEvidenceSummary, "recommended"),
);

assertEqual(
  currentApiDiagnosisPathItems.map((item) => item.label).join(" / "),
  "综合判断 / 广告组问题定位 / 广告 ASIN 承接 / 投放词结构 / 广告位边界 / 对象边界",
);
assertIncludes(currentApiDiagnosisPathItems[1].value, "广告组 2 个");
assertIncludes(currentApiDiagnosisPathItems[2].detail ?? "", "不能把 SearchTerm 自动归因");
assertIncludes(currentApiDiagnosisPathItems[5].value, "搜索词是投放证据");

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

const salesAsinScopeSummary = buildProductScopeSelectionSummary({
  scope_id: "sales_asin:B000SALES1",
  scope_type: "sales_asin",
  label: "销售 ASIN B000SALES1",
  asin: "B000SALES1",
});

assertEqual(salesAsinScopeSummary.title, "销售 ASIN 背景入口");
assertIncludes(salesAsinScopeSummary.description, "不作为广告下钻");
assertIncludes(salesAsinScopeSummary.targetBoundary, "sales_asin 不能替代 advertised_product");
assertEqual(salesAsinScopeSummary.scopeSyncNotice?.title, "销售背景已同步");
assertIncludes(salesAsinScopeSummary.scopeSyncNotice?.summary ?? "", "不能说明它已投广告");
assertIncludes(salesAsinScopeSummary.scopeSyncNotice?.directMetric ?? "", "不能直接当作广告商品指标");
assertIncludes(salesAsinScopeSummary.scopeSyncNotice?.contextBoundary ?? "", "不能归因到该销售 ASIN");

const productScopeEntryGuidance = buildProductScopeEntryGuidance(
  [
    { scope_id: "all", scope_type: "all", label: "全量排查" },
    { scope_id: "parent_asin:B0PARENT", scope_type: "parent_asin", label: "Parent ASIN B0PARENT" },
    { scope_id: "ad_asin:B000TEST01", scope_type: "advertised_asin", label: "广告 ASIN B000TEST01", asin: "B000TEST01" },
    { scope_id: "sales_asin:B000SALES1", scope_type: "sales_asin", label: "销售 ASIN B000SALES1", asin: "B000SALES1" },
  ],
  {
    search_term_unattributed_count: 8,
    placement_unattributed_count: 2,
  },
);

assertEqual(productScopeEntryGuidance.title, "Parent ASIN 优先诊断路径");
assertIncludes(productScopeEntryGuidance.description, "先按 Parent ASIN / ASIN");
assertIncludes(productScopeEntryGuidance.description, "经营盘子");
assertIncludes(productScopeEntryGuidance.description, "只有广告 ASIN 进入广告下钻");
assertIncludes(productScopeEntryGuidance.description, "销售 ASIN 只作为销售背景");
assertIncludes(productScopeEntryGuidance.items.map((item) => item.value).join(" / "), "1 个 Parent ASIN 经营入口");
assertIncludes(productScopeEntryGuidance.items.map((item) => item.value).join(" / "), "1 个广告 ASIN 可下钻");
assertIncludes(productScopeEntryGuidance.items.map((item) => item.value).join(" / "), "1 个销售背景 ASIN 仅辅助");
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
  { scope_id: "loading_product_scope", scope_type: "loading", label: "正在读取诊断入口" },
]);
assertEqual(loadingProductScopeGroups[0]?.label, "诊断入口状态");
assertEqual(loadingProductScopeGroups[0]?.options[0]?.scope_id, "loading_product_scope");

const asinFallbackEntryGuidance = buildProductScopeEntryGuidance([
  { scope_id: "all", scope_type: "all", label: "全量排查" },
  { scope_id: "ad_asin:B000TEST01", scope_type: "advertised_asin", label: "广告 ASIN B000TEST01", asin: "B000TEST01" },
  { scope_id: "sales_asin:B000SALES1", scope_type: "sales_asin", label: "销售 ASIN B000SALES1", asin: "B000SALES1" },
]);

assertEqual(asinFallbackEntryGuidance.title, "ASIN 临时诊断路径");
assertIncludes(asinFallbackEntryGuidance.description, "缺少 Parent ASIN");
assertIncludes(asinFallbackEntryGuidance.description, "已投广告 ASIN");
assertIncludes(asinFallbackEntryGuidance.description, "销售 ASIN 只作背景");
assertIncludes(asinFallbackEntryGuidance.items.map((item) => item.value).join(" / "), "1 个广告 ASIN 可观察");
assertIncludes(asinFallbackEntryGuidance.items.map((item) => item.value).join(" / "), "1 个销售背景 ASIN 仅辅助");

const parentScopeQueueHeader = buildProductScopeQueueHeader(
  {
    scope_id: "parent_asin:B0PARENT",
    scope_type: "parent_asin",
    label: "Parent ASIN B0PARENT",
  },
  2,
);

assertEqual(parentScopeQueueHeader.title, "Parent ASIN 广告证据信号");
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

assertEqual(parentScopeSparseExplanation.title, "当前 Parent ASIN 暂无可处理广告信号");
assertIncludes(parentScopeSparseExplanation.description, "不等于系统没读到数据");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "策略压制");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "主推款");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "Parent ASIN 广告口径");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "销售表现识别 2 个子 ASIN");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "其中 1 个有当前投放广告证据");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "未投放子 ASIN 只作经营背景");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "广告承接口径");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "花费 $25.00");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "广告订单 2");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "广告销售 $40.00");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "没有命中人工处理队列准入门槛");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "范围外辅助排查");
assertIncludes(parentScopeSparseExplanation.reasons.join(" / "), "不属于当前 Parent ASIN 广告证据范围");
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
assertEqual(parentScopeDrilldownExplanation.title, "当前 Parent ASIN 暂无可行动候选");
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
          targeting_context: {
            targeting_count: 1,
            report_row_count: 2,
            diagnosis_summary: "投放词 1 个 / 有效投放词 1 个 / 无订单消耗投放词 0 个",
            next_review_focus: "先把有效投放词作为正向样本，再对比其带来的搜索词是否稳定。",
            boundary: "投放词来自搜索词表现行，不代表完整关键词库；不能自动加词、否词或调价。",
            top_targetings: [{ targeting_text: "kids sunglasses", spend: 13, clicks: 20, orders: 2, sales: 40 }],
            effective_targetings: [{ targeting_text: "kids sunglasses", spend: 13, clicks: 20, orders: 2, sales: 40 }],
            zero_order_spend_targetings: [],
          },
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
assertIncludes(parentScopeDrilldownEvidenceText, "投放词结构");
assertIncludes(parentScopeDrilldownEvidenceText, "投放词 1 个");
assertIncludes(parentScopeDrilldownEvidenceText, "不代表完整关键词库");
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
              evidence: "人工动作 15 条，证据快照 0 条，广告搜索词聚合上下文 0 条，ABA 站点级参考 0 条",
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

assertEqual(productScopeGroupOverview.title, "Parent ASIN B0PARENT 经营背景与广告证据");
assertEqual(productScopeGroupOverview.summary, "经营背景：12 个销售表现子 ASIN；广告诊断：仅 3 个有投放证据的广告 ASIN 可下钻");
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
assertEqual(productScopeGroupOverview.adAsinRows[0].decision.statusLabel, "按策略复核");
assertIncludes(productScopeGroupOverview.adAsinRows[0].decision.reason, "广告花费 $80.00");
assertIncludes(productScopeGroupOverview.adAsinRows[0].decision.reason, "策略说明");
assertIncludes(productScopeGroupOverview.adAsinRows[0].decision.proves, "广告商品粒度表现");
assertIncludes(productScopeGroupOverview.adAsinRows[0].decision.doesNotProve, "不能把搜索词、广告位或 ABA 自动归因到该 ASIN");
assertIncludes(productScopeGroupOverview.adAsinRows[0].decision.nextFocus, "点击该 ASIN 下钻广告组、投放词、搜索词和广告位证据");
assertEqual(productScopeGroupOverview.adCoverageDecision.statusLabel, "3/12 个子 ASIN 有当前 SP 广告投放行");
assertIncludes(productScopeGroupOverview.adCoverageDecision.summary, "当前 SP 广告覆盖率 25.0%");
assertIncludes(productScopeGroupOverview.adCoverageDecision.summary, "9 个未投放子 ASIN 只作为经营背景或覆盖缺口");
assertIncludes(productScopeGroupOverview.adCoverageDecision.proves, "advertised_products 已覆盖这些 ASIN");
assertIncludes(productScopeGroupOverview.adCoverageDecision.doesNotProve, "不能证明 Parent ASIN 只有这些广告 ASIN");
assertIncludes(productScopeGroupOverview.adCoverageDecision.nextManualStep, "未覆盖 B016EXMW1G、B016EXMW4S、B016EXMXTC、B06VW5SQ97、B07MH544J8 等 9 个");
assertIncludes(productScopeGroupOverview.adCoverageDecision.nextManualStep, "补广告投放行、非 SP 来源或商品映射证据");
assertEqual(productScopeGroupOverview.relationItems.length, 4);
assertEqual(productScopeGroupOverview.relationItems[0].label, "销售背景（不直接诊断）");
assertIncludes(productScopeGroupOverview.relationItems[0].value, "Parent ASIN B0PARENT");
assertIncludes(productScopeGroupOverview.relationItems[0].value, "销售表现识别 12 个子 ASIN");
assertIncludes(productScopeGroupOverview.relationItems[0].value, "经营订单 24591");
assertIncludes(productScopeGroupOverview.relationItems[0].value, "经营销售额 $262341.49");
assertIncludes(productScopeGroupOverview.relationItems[0].value, "不等同广告对象");
assertEqual(productScopeGroupOverview.relationItems[1].label, "广告诊断对象（有投放证据）");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "仅 3 个 advertised_products 广告 ASIN 可下钻");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "广告花费 $764.11");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "广告订单 281");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "广告销售额 $2715.06");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "广告组");
assertIncludes(productScopeGroupOverview.relationItems[1].value, "投放词");
assertEqual(productScopeGroupOverview.relationItems[2].label, "策略事实");
assertIncludes(productScopeGroupOverview.relationItems[2].value, "主推款");
assertEqual(productScopeGroupOverview.relationItems[3].label, "广告流量上下文（不可归因 ASIN）");
assertIncludes(productScopeGroupOverview.relationItems[3].value, "投放词");
assertIncludes(productScopeGroupOverview.relationItems[3].value, "搜索词 20 条");
assertIncludes(productScopeGroupOverview.relationItems[3].value, "不做 ASIN 归因");
assertEqual(productScopeGroupOverview.strategyNotes.length, 2);
assertIncludes(productScopeGroupOverview.strategyNotes.join(" / "), "主推款");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "销售子 ASIN 来自 sales_product_daily_metrics");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "广告 ASIN 来自 advertised_products");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "广告组是投放容器，一个广告组至少包含一个广告商品，也可能包含多个广告商品");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "两者不能互相替代");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "未投放子 ASIN 只作为经营背景");
assertIncludes(productScopeGroupOverview.boundaryNotes.join(" / "), "不进入广告信号队列");
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
assertEqual(productScopeFirstScreenSummary.title, "Parent ASIN 经营销售入口与广告证据");
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
assertIncludes(productScopeFirstScreenSummary.adAsinRows[0].decision.nextFocus, "不自动执行广告动作");
assertEqual(productScopeFirstScreenSummary.adCoverageDecision.statusLabel, productScopeGroupOverview.adCoverageDecision.statusLabel);
assertIncludes(productScopeFirstScreenSummary.adCoverageDecision.nextManualStep, "未覆盖 B016EXMW1G");
assertEqual(productScopeFirstScreenSummary.mvpStatus.title, "诊断 MVP 状态判定");
assertEqual(productScopeFirstScreenSummary.mvpStatus.statusLabel, "人工留痕 MVP");
assertIncludes(productScopeFirstScreenSummary.mvpStatus.summary, "当前有 3 个可写人工候选");
assertIncludes(productScopeFirstScreenSummary.mvpStatus.summary, "不是完整复盘闭环");
assertIncludes(productScopeFirstScreenSummary.mvpStatus.detail, "Parent ASIN -> 广告 ASIN -> 广告组 / 投放商品 / 搜索词 / 广告位");
assertIncludes(productScopeFirstScreenSummary.mvpStatus.boundary, "ready 复盘");
assertIncludes(productScopeFirstScreenSummary.pathSummary, "Parent ASIN 经营销售入口 -> 广告 ASIN -> 广告组");
assertIncludes(productScopeFirstScreenSummary.pathSummary, "投放商品 / 投放词 / 搜索词 / 广告位");
assertIncludes(productScopeFirstScreenSummary.pathSummary, "AI 信号诊断 -> 人工确认 -> 7/14 天复盘");
assertEqual(productScopeFirstScreenSummary.pathSteps.length, 7);
assertEqual(productScopeFirstScreenSummary.pathSteps[0].label, "Parent ASIN 经营销售盘");
assertIncludes(productScopeFirstScreenSummary.pathSteps[0].detail, "Parent ASIN B0PARENT");
assertEqual(productScopeFirstScreenSummary.pathSteps[1].label, "广告 ASIN 覆盖");
assertIncludes(productScopeFirstScreenSummary.pathSteps[1].detail, "只进入有 advertised_products 证据的广告 ASIN");
assertIncludes(productScopeFirstScreenSummary.pathSteps[1].detail, "不是销售子 ASIN 全量");
assertEqual(productScopeFirstScreenSummary.pathSteps[2].label, "广告组结构");
assertIncludes(productScopeFirstScreenSummary.pathSteps[2].detail, "广告组是投放容器，不是产品");
assertIncludes(productScopeFirstScreenSummary.pathSteps[2].detail, "同组投放商品");
assertEqual(productScopeFirstScreenSummary.pathSteps[3].label, "投放商品 / 投放词 / 搜索词 / 广告位");
assertIncludes(productScopeFirstScreenSummary.pathSteps[3].detail, "投放商品来自广告组内 advertised_products 证据");
assertIncludes(productScopeFirstScreenSummary.pathSteps[3].detail, "实际参与广告投放的商品");
assertIncludes(productScopeFirstScreenSummary.pathSteps[3].detail, "流量上下文证据");
assertEqual(productScopeFirstScreenSummary.pathSteps[4].label, "AI 信号诊断");
assertIncludes(productScopeFirstScreenSummary.pathSteps[4].detail, "3 个候选");
assertIncludes(productScopeFirstScreenSummary.pathSteps[4].detail, "人工复核投放词、广告商品和归因边界");
assertEqual(productScopeFirstScreenSummary.pathSteps[5].label, "人工确认");
assertIncludes(productScopeFirstScreenSummary.pathSteps[5].detail, "记录观察");
assertIncludes(productScopeFirstScreenSummary.pathSteps[5].detail, "不自动加词");
assertEqual(productScopeFirstScreenSummary.pathSteps[6].label, "7/14 天复盘");
assertIncludes(productScopeFirstScreenSummary.pathSteps[6].detail, "最早 2026-06-22");
assertIncludes(productScopeFirstScreenSummary.pathSteps[6].detail, "ReviewRecord");
assertIncludes(productScopeFirstScreenSummary.boundary, "只展示有广告证据的广告 ASIN");
assertIncludes(productScopeFirstScreenSummary.boundary, "未投放子 ASIN 不进入广告诊断");
assertIncludes(productScopeFirstScreenSummary.boundary, "搜索词和广告位不能直接归因");
assertEqual(productScopeFirstScreenSummary.landingGates.length, 4);
assertEqual(productScopeFirstScreenSummary.landingGates[0].label, "经营口径");
assertIncludes(productScopeFirstScreenSummary.landingGates[0].value, "销售表现识别 12 个子 ASIN");
assertIncludes(productScopeFirstScreenSummary.landingGates[0].detail, "经营背景");
assertEqual(productScopeFirstScreenSummary.landingGates[1].label, "广告证据");
assertIncludes(productScopeFirstScreenSummary.landingGates[1].value, "3 个广告 ASIN 可下钻");
assertIncludes(productScopeFirstScreenSummary.landingGates[1].detail, "当前 SP 广告覆盖率 25.0%");
assertIncludes(productScopeFirstScreenSummary.landingGates[1].detail, "未投放子 ASIN 只作为经营背景");
assertEqual(productScopeFirstScreenSummary.landingGates[2].label, "AI 准入");
assertIncludes(productScopeFirstScreenSummary.landingGates[2].value, "3 个候选可人工复核");
assertIncludes(productScopeFirstScreenSummary.landingGates[2].detail, "人工复核");
assertEqual(productScopeFirstScreenSummary.landingGates[3].label, "复盘门槛");
assertIncludes(productScopeFirstScreenSummary.landingGates[3].value, "最早 2026-06-22");
assertIncludes(productScopeFirstScreenSummary.landingGates[3].detail, "review_records");

const loadingProductScopeFirstScreenSummary = buildProductScopeFirstScreenSummary(productScopeGroupOverview, null);
if (!loadingProductScopeFirstScreenSummary) {
  throw new Error("Parent ASIN 首屏经营摘要读取态不能为空");
}
assertEqual(loadingProductScopeFirstScreenSummary.mvpStatus.statusLabel, "读取 AI 准入中");
assertIncludes(loadingProductScopeFirstScreenSummary.mvpStatus.summary, "正在按当前经营入口读取 AI 候选");
assertIncludes(loadingProductScopeFirstScreenSummary.mvpStatus.summary, "读回前不能判断无候选或完整闭环");
assertNotIncludes(loadingProductScopeFirstScreenSummary.mvpStatus.summary, "AI 候选等待扫描");
assertIncludes(loadingProductScopeFirstScreenSummary.pathSteps[4].detail, "正在读取当前 Parent ASIN 的 AI 候选和人工门禁");
assertIncludes(loadingProductScopeFirstScreenSummary.pathSteps[4].detail, "读回前不判断候选数量");
assertEqual(loadingProductScopeFirstScreenSummary.landingGates[2].label, "AI 准入");
assertEqual(loadingProductScopeFirstScreenSummary.landingGates[2].value, "正在读取 AI 准入");
assertIncludes(loadingProductScopeFirstScreenSummary.landingGates[2].detail, "正在读取当前经营入口的 AI 候选");
assertEqual(loadingProductScopeFirstScreenSummary.landingGates[3].value, "等待人工留痕读回，不能生成复盘结论");
assertIncludes(loadingProductScopeFirstScreenSummary.landingGates[3].detail, "等待 /api/signal-triage 读回复盘门槛");

const productScopeDiagnosisBrief = buildProductScopeDiagnosisBrief(
  productScopeFirstScreenSummary,
  productScopeEvidenceRouteGuide,
  adGroupDiagnosisRows,
);
if (!productScopeDiagnosisBrief) {
  throw new Error("Parent ASIN 运营诊断路径不能为空");
}
assertEqual(productScopeDiagnosisBrief.title, "Parent ASIN 运营诊断路径");
assertIncludes(productScopeDiagnosisBrief.summary, "不是把筛选器、销售、广告组、明细和 AI 分析纵向堆叠成长报表");
assertIncludes(productScopeDiagnosisBrief.summary, "先锁定 Parent ASIN 口径");
assertIncludes(productScopeDiagnosisBrief.summary, "最后由 AI 汇总");
assertIncludes(productScopeDiagnosisBrief.summary, "只输出可人工确认的下一步");
assertEqual(productScopeDiagnosisBrief.statusLabel, "人工留痕 MVP");
assertEqual(productScopeDiagnosisBrief.decisionGuide.title, "Parent ASIN 决策导览");
assertIncludes(productScopeDiagnosisBrief.decisionGuide.primaryDecision, "先展开");
assertIncludes(productScopeDiagnosisBrief.decisionGuide.readPath, "不逐个读完整报表");
assertIncludes(productScopeDiagnosisBrief.decisionGuide.expandFocus, "投放商品 -> 投放词 -> 搜索词 -> 广告位");
assertIncludes(productScopeDiagnosisBrief.decisionGuide.notToDo, "不要把销售子 ASIN 全量");
assertIncludes(productScopeDiagnosisBrief.decisionGuide.notToDo, "自动加词");
assertIncludes(productScopeDiagnosisBrief.decisionGuide.nextManualStep, "人工");
assertEqual(productScopeDiagnosisBrief.verdictItems.length, 4);
assertEqual(productScopeDiagnosisBrief.verdictItems[0].label, "准入结论");
assertIncludes(productScopeDiagnosisBrief.verdictItems[0].value, "进入广告诊断");
assertIncludes(productScopeDiagnosisBrief.verdictItems[1].label, "今日焦点");
assertIncludes(productScopeDiagnosisBrief.verdictItems[1].detail, "投放结构失衡");
assertIncludes(productScopeDiagnosisBrief.verdictItems[1].detail, "搜索词意图分化");
assertIncludes(productScopeDiagnosisBrief.verdictItems[2].value, "7 层证据");
assertIncludes(productScopeDiagnosisBrief.verdictItems[3].detail, "记录观察");
assertIncludes(productScopeDiagnosisBrief.verdictItems[3].detail, "复盘窗口完整后再评价效果");
assertEqual(productScopeDiagnosisBrief.sections.length, 5);
assertEqual(productScopeDiagnosisBrief.sections[0].title, "筛选器与口径锁定");
assertIncludes(productScopeDiagnosisBrief.sections[0].businessQuestion, "店铺、站点、Parent ASIN 和周期");
assertIncludes(productScopeDiagnosisBrief.sections[0].purpose, "避免后续把广告组、搜索词、广告位或 ABA 当成 Parent ASIN 商品口径");
assertIncludes(productScopeDiagnosisBrief.sections[0].currentJudgement, "筛选器只锁定经营对象和周期");
assertIncludes(productScopeDiagnosisBrief.sections[0].doesNotProve, "不能证明广告组就是产品");
assertIncludes(productScopeDiagnosisBrief.sections[0].doesNotProve, "不能把 ABA 当店铺专属数据");
assertEqual(productScopeDiagnosisBrief.sections[1].title, "Parent ASIN 销售表现入口");
assertIncludes(productScopeDiagnosisBrief.sections[1].businessQuestion, "是否有足够广告证据");
assertIncludes(productScopeDiagnosisBrief.sections[1].purpose, "是否值得进入广告诊断");
assertIncludes(productScopeDiagnosisBrief.sections[1].currentJudgement, "可以进入广告诊断");
assertIncludes(productScopeDiagnosisBrief.sections[1].currentJudgement, "不把全部销售子 ASIN 当广告对象");
assertIncludes(productScopeDiagnosisBrief.sections[1].purpose, "限定销售子 ASIN 只是经营背景");
assertIncludes(productScopeDiagnosisBrief.sections[1].purpose, "不把未投放变体拉进广告分析");
assertIncludes(productScopeDiagnosisBrief.sections[1].proves, "哪些广告 ASIN 有 advertised_products 证据");
assertIncludes(productScopeDiagnosisBrief.sections[1].doesNotProve, "所有子 ASIN 都有广告数据");
assertIncludes(productScopeDiagnosisBrief.sections[1].nextManualStep, "下一步进入广告组排序");
assertEqual(productScopeDiagnosisBrief.sections[2].title, "广告组优先排序");
assertIncludes(productScopeDiagnosisBrief.sections[2].businessQuestion, "先看哪个广告组");
assertIncludes(productScopeDiagnosisBrief.sections[2].purpose, "避免运营逐个广告组读报表");
assertIncludes(productScopeDiagnosisBrief.sections[2].currentJudgement, "花费");
assertEqual(productScopeDiagnosisBrief.sections[3].title, "广告组下具体数据");
assertIncludes(productScopeDiagnosisBrief.sections[3].businessQuestion, "问题落在哪一层具体数据");
assertIncludes(productScopeDiagnosisBrief.sections[3].purpose, "先确认问题落点、证据缺口和人工下一步");
assertIncludes(productScopeDiagnosisBrief.sections[3].purpose, "投放商品、投放词、搜索词和广告位");
assertIncludes(productScopeDiagnosisBrief.sections[3].currentJudgement, "7 层证据");
assertEqual(productScopeDiagnosisBrief.sections[4].title, "AI 人工动作判断");
assertIncludes(productScopeDiagnosisBrief.sections[4].businessQuestion, "只能做哪一种人工动作");
assertIncludes(productScopeDiagnosisBrief.sections[4].purpose, "在筛选口径、销售入口、广告组排序和广告组下具体数据都读完后");
assertIncludes(productScopeDiagnosisBrief.sections[4].purpose, "记录观察、标记已处理、加入复盘或忽略本次");
assertIncludes(productScopeDiagnosisBrief.sections[4].doesNotProve, "不代表系统可以自动加词");
assertIncludes(productScopeDiagnosisBrief.manualActions.join(" / "), "记录观察");
assertIncludes(productScopeDiagnosisBrief.manualActions.join(" / "), "加入复盘");
assertIncludes(productScopeDiagnosisBrief.boundary, "搜索词和广告位不能直接归因");

const recommendedAdGroupEvidenceBrief = buildProductScopeDiagnosisBrief(productScopeFirstScreenSummary, productScopeEvidenceRouteGuide, [], {
  searchTermLabel: "beach essentials",
  adGroupNames: ["RBK004-beach essentials-精准（测试）", "RBK004-扩展-beach essentials"],
});
if (!recommendedAdGroupEvidenceBrief) {
  throw new Error("推荐搜索词广告组证据诊断路径不能为空");
}
assertIncludes(recommendedAdGroupEvidenceBrief.decisionGuide.primaryDecision, "可以进入广告诊断");
assertIncludes(recommendedAdGroupEvidenceBrief.decisionGuide.primaryDecision, "推荐搜索词 beach essentials");
assertIncludes(recommendedAdGroupEvidenceBrief.decisionGuide.primaryDecision, "2 个广告组");
assertIncludes(recommendedAdGroupEvidenceBrief.decisionGuide.primaryDecision, "不把它包装成广告组异常");
assertIncludes(recommendedAdGroupEvidenceBrief.decisionGuide.expandFocus, "投放商品 -> 投放词 -> 搜索词 -> 广告位");
assertIncludes(recommendedAdGroupEvidenceBrief.decisionGuide.expandFocus, "证据入口，不是自动动作对象");
assertIncludes(recommendedAdGroupEvidenceBrief.decisionGuide.nextManualStep, "记录观察、加入复盘或忽略本次");
assertIncludes(recommendedAdGroupEvidenceBrief.verdictItems[1].value, "推荐搜索词 beach essentials 关联广告组");
assertIncludes(recommendedAdGroupEvidenceBrief.verdictItems[1].detail, "2 个广告组可作为证据下钻入口");
assertIncludes(recommendedAdGroupEvidenceBrief.verdictItems[1].detail, "不代表广告组异常结论");
assertIncludes(recommendedAdGroupEvidenceBrief.sections[2].currentJudgement, "当前没有独立广告组异常排序");
assertIncludes(recommendedAdGroupEvidenceBrief.sections[2].currentJudgement, "RBK004-beach essentials-精准（测试）");
assertIncludes(recommendedAdGroupEvidenceBrief.sections[2].currentJudgement, "RBK004-扩展-beach essentials");
assertIncludes(recommendedAdGroupEvidenceBrief.sections[2].currentJudgement, "只作为搜索词证据下钻入口");
assertNotIncludes(recommendedAdGroupEvidenceBrief.sections[2].currentJudgement, "暂无可排序广告组");
assertIncludes(recommendedAdGroupEvidenceBrief.sections[2].proves, "已经回到广告组上下文");
assertIncludes(recommendedAdGroupEvidenceBrief.sections[2].doesNotProve, "不能证明广告组本身异常");
assertIncludes(recommendedAdGroupEvidenceBrief.sections[2].doesNotProve, "不能证明搜索词表现已经自动归因到单个广告 ASIN");
assertIncludes(recommendedAdGroupEvidenceBrief.sections[2].nextManualStep, "核对同组投放商品、投放词、搜索词和广告位证据");
assertEqual(recommendedAdGroupEvidenceBrief.sections[2].tone, "context");

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
assertIncludes(noCandidateMvpSummary?.mvpStatus.summary ?? "", "当前有真实广告证据，但 0 个候选未通过人工写入门禁");
assertIncludes(noCandidateMvpSummary?.mvpStatus.summary ?? "", "不是完整业务闭环");
assertIncludes(noCandidateMvpSummary?.mvpStatus.detail ?? "", "继续下钻广告 ASIN、广告组、搜索词和广告位");
assertIncludes(noCandidateMvpSummary?.mvpStatus.boundary ?? "", "不能保存 review_records");
assertIncludes(noCandidateMvpSummary?.mvpStatus.boundary ?? "", "不能说处理有效或无效");

const blockedCandidateMvpSummary = buildProductScopeFirstScreenSummary(productScopeGroupOverview, {
  signal_status: { candidate_count: 3 },
  actionability_status: {
    status: "needs_manual_preview",
    can_write_manual_action: false,
    message: "当前有 3 个候选，但缺少人工动作只读预检，不能写人工动作。",
  },
  review_status: {
    manual_action_count: 0,
    review_record_count: 0,
    ready_count: 0,
    not_ready_count: 0,
  },
});
assertEqual(blockedCandidateMvpSummary?.mvpStatus.statusLabel, "诊断 MVP");
assertIncludes(blockedCandidateMvpSummary?.mvpStatus.summary ?? "", "3 个候选未通过人工写入门禁");
assertNotIncludes(blockedCandidateMvpSummary?.mvpStatus.summary ?? "", "3 个可写人工候选");
assertIncludes(blockedCandidateMvpSummary?.landingGates[2].value ?? "", "3 个候选，只能诊断不能写动作");
assertNotIncludes(blockedCandidateMvpSummary?.landingGates[2].value ?? "", "候选可人工复核");

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

const selectedParentScopeForSignalContext: ProductScopeFilterOption = {
  scope_id: "parent_asin:B0PARENT",
  scope_type: "parent_asin",
  label: "Parent ASIN B0PARENT",
  parent_asin: "B0PARENT",
  child_asins: ["B000TEST01"],
};

const selectedSearchTermScopeContext = buildSelectedSignalScopeContext(selectedParentScopeForSignalContext, {
  ...searchTermSignalWithoutAsin,
  evidence: {
    primary_object: {
      object_type: "search_term",
      label: "beach essentials",
      search_term: "beach essentials",
    },
    source_rows: [{ source_table: "ad_search_term_daily_metrics", search_term: "beach essentials" }],
  },
});

if (!selectedSearchTermScopeContext) {
  throw new Error("选中搜索词信号应生成入口关系提示");
}

assertEqual(selectedSearchTermScopeContext.title, "选中信号与当前入口");
assertEqual(selectedSearchTermScopeContext.scopeLabel, "Parent ASIN B0PARENT");
assertIncludes(selectedSearchTermScopeContext.signalObject, "搜索词：beach essentials");
assertIncludes(selectedSearchTermScopeContext.relation, "不能自动归因");
assertIncludes(selectedSearchTermScopeContext.boundary, "当前诊断入口仍是 Parent ASIN B0PARENT");
assertIncludes(selectedSearchTermScopeContext.boundary, "选中信号只决定中间证据和右侧人工确认对象");
assertEqual(selectedSearchTermScopeContext.tone, "unattributed");

const selectedSearchIntentSignal: ProductScopedSignalForUi = {
  ...searchTermSignalWithoutAsin,
  signal_category: "search_term_opportunity",
  object_type: "search_term",
  evidence: {
    primary_object: {
      object_type: "search_term",
      label: "beach essentials",
      search_term: "beach essentials",
      intent_label: "规则语义：海滩出行用品",
    },
  },
};

const selectedSearchIntentFocusContext = buildSearchIntentFocusContext(
  "规则语义：海滩出行用品",
  selectedSearchIntentSignal,
  selectedParentScopeForSignalContext,
  selectedSearchIntentDecisionCard,
);

if (!selectedSearchIntentFocusContext) {
  throw new Error("当前广告搜索词表现复核命中搜索词信号时应生成承接提示");
}

assertEqual(selectedSearchIntentFocusContext.title, "Parent ASIN 广告搜索词表现复核承接");
assertEqual(selectedSearchIntentFocusContext.focusLabel, "规则语义：海滩出行用品");
assertIncludes(selectedSearchIntentFocusContext.signalObject, "SearchTerm：beach essentials");
assertEqual(selectedSearchIntentFocusContext.pathItems[0]?.label, "经营诊断入口");
assertEqual(selectedSearchIntentFocusContext.pathItems[0]?.value, "Parent ASIN B0PARENT");
assertEqual(selectedSearchIntentFocusContext.pathItems[1]?.label, "广告搜索词表现聚合");
assertIncludes(selectedSearchIntentFocusContext.pathItems[1]?.value ?? "", "当前 Parent ASIN 关联广告中的用户搜索词表现行");
assertEqual(selectedSearchIntentFocusContext.pathItems[2]?.label, "当前诊断对象");
assertEqual(selectedSearchIntentFocusContext.pathItems[3]?.label, "运营判断");
assertIncludes(selectedSearchIntentFocusContext.pathItems[3]?.value ?? "", "扩量复核");
assertIncludes(selectedSearchIntentFocusContext.pathItems[3]?.value ?? "", "可扩量机会");
assertEqual(selectedSearchIntentFocusContext.pathItems[4]?.label, "优先 SearchTerm");
assertIncludes(selectedSearchIntentFocusContext.pathItems[4]?.value ?? "", "beach essentials");
assertIncludes(selectedSearchIntentFocusContext.relation, "广告搜索词表现聚合");
assertIncludes(selectedSearchIntentFocusContext.relation, "从 Parent ASIN B0PARENT 视角聚合广告中实际产生表现的用户搜索词行");
assertIncludes(selectedSearchIntentFocusContext.relation, "缩小同类 SearchTerm 信号队列");
assertIncludes(selectedSearchIntentFocusContext.relation, "若进入人工动作");
assertIncludes(selectedSearchIntentFocusContext.relation, "以后端预检确认的 SearchTerm 稳定对象为准");
assertIncludes(selectedSearchIntentFocusContext.relation, "当前聚合卡片判断为“扩量复核”");
assertIncludes(selectedSearchIntentFocusContext.boundary, "Parent ASIN 广告搜索词表现复核「规则语义：海滩出行用品」只是从 Parent ASIN 视角聚合广告搜索词表现的分析视角");
assertIncludes(selectedSearchIntentFocusContext.boundary, "不是经营商品、广告组或人工动作对象");
assertIncludes(selectedSearchIntentFocusContext.boundary, "扩量 / 止损 / 观察判断只服务人工复核优先级");
assertIncludes(selectedSearchIntentFocusContext.boundary, "实际写入以后端 preflight evidence_snapshot_preview 为准");
assertEqual(buildSearchIntentFocusContext("规则语义：太阳镜", searchTermSignalWithoutAsin), null);

const selectedSearchIntentTermReasonSummary = buildSearchIntentSelectedTermReasonSummary(
  "规则语义：海滩出行用品",
  selectedSearchIntentSignal,
  selectedSearchIntentDecisionCard,
);

if (!selectedSearchIntentTermReasonSummary) {
  throw new Error("当前广告搜索词表现复核命中具体 SearchTerm 时应生成复核理由");
}

assertEqual(selectedSearchIntentTermReasonSummary.title, "具体 SearchTerm 复核理由");
assertEqual(selectedSearchIntentTermReasonSummary.tone, "ready");
assertEqual(selectedSearchIntentTermReasonSummary.rows[0]?.label, "Parent ASIN 聚合视角");
assertIncludes(selectedSearchIntentTermReasonSummary.rows[0]?.detail ?? "", "当前 Parent ASIN 关联广告中的用户搜索词表现行");
assertEqual(selectedSearchIntentTermReasonSummary.rows[1]?.label, "当前判断");
assertIncludes(selectedSearchIntentTermReasonSummary.rows[1]?.value ?? "", "扩量复核");
assertIncludes(selectedSearchIntentTermReasonSummary.rows[1]?.detail ?? "", "可扩量机会");
assertEqual(selectedSearchIntentTermReasonSummary.rows[2]?.label, "优先打开理由");
assertIncludes(selectedSearchIntentTermReasonSummary.rows[2]?.value ?? "", "SearchTerm：beach essentials");
assertIncludes(selectedSearchIntentTermReasonSummary.rows[2]?.detail ?? "", "订单最多");
assertEqual(selectedSearchIntentTermReasonSummary.rows[3]?.label, "当前中间诊断");
assertIncludes(selectedSearchIntentTermReasonSummary.rows[3]?.value ?? "", "SearchTerm：beach essentials");
assertIncludes(selectedSearchIntentTermReasonSummary.rows[3]?.detail ?? "", "广告组、投放词、广告 ASIN 和广告位证据");
assertEqual(selectedSearchIntentTermReasonSummary.rows[4]?.label, "人工下一步");
assertIncludes(selectedSearchIntentTermReasonSummary.rows[4]?.value ?? "", "打开具体 SearchTerm 后人工复核");
assertIncludes(selectedSearchIntentTermReasonSummary.rows[4]?.detail ?? "", "不能自动加词、否词、调价或暂停广告");
assertEqual(selectedSearchIntentTermReasonSummary.executionSteps.length, 4);
assertEqual(selectedSearchIntentTermReasonSummary.executionSteps[0]?.label, "1. 锁定入口");
assertIncludes(selectedSearchIntentTermReasonSummary.executionSteps[0]?.detail ?? "", "不切换经营诊断入口");
assertEqual(selectedSearchIntentTermReasonSummary.executionSteps[1]?.label, "2. 锁定 SearchTerm");
assertIncludes(selectedSearchIntentTermReasonSummary.executionSteps[1]?.value ?? "", "beach essentials");
assertIncludes(selectedSearchIntentTermReasonSummary.executionSteps[1]?.detail ?? "", "已命中优先复核 SearchTerm");
assertEqual(selectedSearchIntentTermReasonSummary.executionSteps[2]?.label, "3. 核对广告承接");
assertIncludes(selectedSearchIntentTermReasonSummary.executionSteps[2]?.value ?? "", "广告 ASIN / 广告组 / 投放词 / 广告位");
assertIncludes(selectedSearchIntentTermReasonSummary.executionSteps[2]?.detail ?? "", "不能把搜索词自动归因到单个 ASIN");
assertEqual(selectedSearchIntentTermReasonSummary.executionSteps[3]?.label, "4. 选择人工动作");
assertIncludes(selectedSearchIntentTermReasonSummary.executionSteps[3]?.value ?? "", "打开具体 SearchTerm 后人工复核");
assertIncludes(selectedSearchIntentTermReasonSummary.executionSteps[3]?.detail ?? "", "7/14 天后再读指标复盘");
assertIncludes(selectedSearchIntentTermReasonSummary.boundary, "从当前 Parent ASIN 的广告搜索词表现聚合进入具体 SearchTerm");
assertIncludes(selectedSearchIntentTermReasonSummary.boundary, "不能证明单个 ASIN 归因");
assertIncludes(selectedSearchIntentTermReasonSummary.boundary, "不会自动执行任何广告动作");

const mismatchedSearchIntentTermReasonSummary = buildSearchIntentSelectedTermReasonSummary(
  "规则语义：海滩出行用品",
  {
    ...selectedSearchIntentSignal,
    evidence: {
      primary_object: {
        object_type: "search_term",
        label: "beach wagon",
        search_term: "beach wagon",
        intent_label: "规则语义：海滩出行用品",
      },
    },
  },
  selectedSearchIntentDecisionCard,
);
assertEqual(mismatchedSearchIntentTermReasonSummary?.tone, "warning");
assertIncludes(mismatchedSearchIntentTermReasonSummary?.rows[3]?.detail ?? "", "与聚合卡片的优先项不一致");
assertEqual(buildSearchIntentSelectedTermReasonSummary("规则语义：太阳镜", selectedSearchIntentSignal), null);

const selectedAdGroupScopeContext = buildSelectedSignalScopeContext(selectedParentScopeForSignalContext, adGroupSignal);
assertIncludes(selectedAdGroupScopeContext?.relation ?? "", "投放容器");
assertIncludes(selectedAdGroupScopeContext?.relation ?? "", "经营入口仍是 Parent ASIN B0PARENT");
assertEqual(selectedAdGroupScopeContext?.tone, "container");

const selectedDataQualityScopeContext = buildSelectedSignalScopeContext(selectedParentScopeForSignalContext, dataQualitySignal);
assertIncludes(selectedDataQualityScopeContext?.relation ?? "", "不代表 Parent ASIN B0PARENT 已经出现经营异常");
assertEqual(selectedDataQualityScopeContext?.tone, "data_quality");
assertEqual(buildSelectedSignalScopeContext(selectedParentScopeForSignalContext, null), null);

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
assertIncludes(dataQualityTriage.queueReason, "经营问题=数据质量");
assertIncludes(dataQualityTriage.priorityReason, "severity=4");
assertIncludes(dataQualityTriage.reviewBoundary, "review_result 不参与分诊");
assertIncludes(dataQualityTriage.reviewRuleFeedback, "暂无复盘结果");
assertIncludes(dataQualityTriage.reviewRuleFeedback, "不调整规则");

const opportunityTriage = buildSignalTriageRationale({
  ...opportunitySignal,
  review_result: "improved",
});

assertEqual(opportunityTriage.queueKind, "opportunity_expansion");
assertEqual(opportunityTriage.queueLabel, "机会扩量");
assertIncludes(opportunityTriage.queueReason, "经营问题=机会扩量");
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
assertIncludes(adGroupContext.reviewPath?.value ?? "", "当前广告组容器");
assertIncludes(adGroupContext.reviewPath?.value ?? "", "同组投放商品表现");
assertIncludes(adGroupContext.reviewPath?.value ?? "", "主推款策略边界");
assertIncludes(adGroupContext.reviewPath?.detail ?? "", "广告组是投放容器");
assertIncludes(adGroupContext.reviewPath?.detail ?? "", "不能自动拆广告组");

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
assertIncludes(placementContext.reviewPath?.value ?? "", "广告位表现");
assertIncludes(placementContext.reviewPath?.value ?? "", "7/14 天复盘");
assertIncludes(placementContext.reviewPath?.detail ?? "", "不能下 ASIN 或 Parent ASIN 归因结论");

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
assertIncludes(advertisedProductContext.reviewPath?.value ?? "", "当前广告 ASIN");
assertIncludes(advertisedProductContext.reviewPath?.value ?? "", "广告位边界");
assertIncludes(advertisedProductContext.reviewPath?.detail ?? "", "不能自动归因到该 ASIN");

const searchIntentSignal = { ...searchTermSignal, object_type: "search_intent" as const };
const searchIntentObjectContext = buildSignalObjectContext(searchIntentSignal, {
  object_type: "search_intent",
  label: "规则语义：儿童太阳镜",
  intent_label: "规则语义：儿童太阳镜",
});

assertEqual(searchIntentObjectContext.items[0].label, "Parent ASIN 广告搜索词表现复核");
assertIncludes(searchIntentObjectContext.boundary, "Parent ASIN 广告搜索词表现复核用于聚合同类广告搜索词表现");
assertIncludes(searchIntentObjectContext.boundary, "不是广告处理对象");

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
    { label: "搜索词表现分组", value: "规则语义：儿童太阳镜", source_type: "积加API" },
    { label: "合计订单", value: "9", source_type: "积加API" },
    { label: "合计ACOS", value: "6.25%", source_type: "积加API" },
    { label: "ABA排名", value: "208", source_type: "ABA导出" },
  ],
  3,
  { ...opportunitySignal, signal_category: "search_term_opportunity", object_type: "search_term" },
);

assertEqual(groupedSearchTermOpportunityKeyEvidence.length, 3);
assertEqual(groupedSearchTermOpportunityKeyEvidence[0].label, "搜索词表现分组");
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
    data_grain: "当前 Parent ASIN 相关广告上下文中实际产生表现的用户搜索词行，按标准化用户搜索词及规则归类聚合",
    business_question: "这组同类广告用户搜索词在当前 Parent ASIN 广告上下文下，是应该扩量、止损，还是只观察？",
    current_judgement: "当前判断：有订单且 ACOS 较低，优先复核是否存在可人工确认的扩量机会。",
    metric_purpose: "指标目的：花费 9.00 和点击 18 判断消耗规模；订单 4、CVR 22.22%、ACOS 12.86% 判断承接质量。",
    ad_context: "广告上下文：覆盖 1 个广告活动、1 个广告组、2 条搜索词表现行；Top 广告组：儿童太阳镜精准；仍需核对同广告组投放商品。",
    evidence_gap: "证据缺口：广告位影响需要继续打开广告位证据核对。",
    proves: "能证明当前广告上下文内按标准化用户搜索词及规则归类聚合后的同类广告搜索词有订单和 ABA 背景。",
    does_not_prove: "不能证明 Parent ASIN 下全部搜索词表现，也不能证明单个 ASIN 归因，也不能把搜索词表现分组当作人工动作对象。",
    next_manual_step: "逐条打开具体 SearchTerm 信号，人工核对投放词、广告组和广告位。",
    top_search_terms: [
      {
        search_term: "kids sunglasses",
        normalized_query: "kids sunglasses",
        ad_group_names: ["儿童太阳镜广泛"],
        targeting_texts: ["kids sunglasses broad"],
        clicks: 6,
        cost: 2,
        orders: 1,
        sales: 20,
        acos: 0.4,
        aba_rank: null,
        aba_period: null,
        source_row_count: 1,
      },
      {
        search_term: "baby sunglasses",
        normalized_query: "baby sunglasses",
        ad_group_names: ["儿童太阳镜精准"],
        targeting_texts: ["baby sunglasses exact"],
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
assertEqual(searchIntentReviewCards[0].summary, "广告表现判断依据：订单 4 / 花费 9 / ACOS 12.86% / ABA 命中 1");
assertEqual(searchIntentReviewCards[0].sourceLabel, "规则语义");
assertEqual(searchIntentReviewCards[0].operationDecisionLabel, "扩量复核");
assertEqual(searchIntentReviewCards[0].operationDecisionTone, "scale");
assertIncludes(searchIntentReviewCards[0].operationDecisionReason, "订单 4");
assertIncludes(searchIntentReviewCards[0].operationDecisionReason, "ACOS 12.86%");
assertIncludes(searchIntentReviewCards[0].operationDecisionReason, "具体 SearchTerm");
assertEqual(searchIntentReviewCards[0].reviewStatus.label, "扩量复核");
assertEqual(searchIntentReviewCards[0].reviewStatus.tone, "scale");
assertIncludes(searchIntentReviewCards[0].reviewStatus.reason, "订单 4");
assertIncludes(searchIntentReviewCards[0].reviewStatus.reason, "广告组、投放词和广告位证据");
assertIncludes(searchIntentReviewCards[0].reviewStatus.nextStep, "baby sunglasses");
assertIncludes(searchIntentReviewCards[0].reviewStatus.nextStep, "7/14 天复盘");
assertEqual(searchIntentReviewCards[0].metricPurposeItems.length, 3);
assertEqual(searchIntentReviewCards[0].metricPurposeItems[0].label, "扩量判断");
assertIncludes(searchIntentReviewCards[0].metricPurposeItems[0].value, "目标：判断是否存在可人工复核的扩量机会");
assertIncludes(searchIntentReviewCards[0].metricPurposeItems[0].value, "订单 4");
assertIncludes(searchIntentReviewCards[0].metricPurposeItems[0].value, "CVR 22.22%");
assertIncludes(searchIntentReviewCards[0].metricPurposeItems[0].value, "先找有订单且 ACOS 可接受的具体 SearchTerm");
assertEqual(searchIntentReviewCards[0].metricPurposeItems[1].label, "止损判断");
assertIncludes(searchIntentReviewCards[0].metricPurposeItems[1].value, "目标：判断是否存在需要人工止损复核的消耗浪费");
assertIncludes(searchIntentReviewCards[0].metricPurposeItems[1].value, "花费 9");
assertIncludes(searchIntentReviewCards[0].metricPurposeItems[1].value, "不能自动否词");
assertEqual(searchIntentReviewCards[0].metricPurposeItems[2].label, "观察门槛");
assertIncludes(searchIntentReviewCards[0].metricPurposeItems[2].value, "目标：判断当前是否只能观察和补证");
assertIncludes(searchIntentReviewCards[0].metricPurposeItems[2].value, "表现行 3 条");
assertIncludes(searchIntentReviewCards[0].metricPurposeItems[2].value, "ABA 命中 1");
assertIncludes(searchIntentReviewCards[0].metricPurposeItems[2].value, "广告组、投放词、广告位、同组 ASIN");
assertEqual(searchIntentReviewCards[0].insight, "这组广告搜索词转化稳定，属于放量候选");
assertIncludes(searchIntentReviewCards[0].businessQuestion, "扩量、止损，还是只观察");
assertIncludes(searchIntentReviewCards[0].currentJudgement, "可人工确认的扩量机会");
assertIncludes(searchIntentReviewCards[0].metricPurpose, "花费 9.00");
assertIncludes(searchIntentReviewCards[0].adContext, "覆盖 1 个广告活动、1 个广告组、2 条搜索词表现行");
assertIncludes(searchIntentReviewCards[0].evidenceGap, "广告位影响需要继续打开广告位证据核对");
assertIncludes(searchIntentReviewCards[0].signalMetricBoundary, "卡片指标覆盖当前 Parent ASIN");
assertIncludes(searchIntentReviewCards[0].signalMetricBoundary, "按标准化用户搜索词及规则归类聚合");
assertIncludes(searchIntentReviewCards[0].signalMetricBoundary, "可行动证据子集");
assertIncludes(searchIntentReviewCards[0].purpose, "聚合广告中实际产生表现的用户搜索词");
assertIncludes(searchIntentReviewCards[0].purpose, "当前 Parent ASIN 视角");
assertIncludes(searchIntentReviewCards[0].purpose, "判断同类 SearchTerm 表现、机会和异常");
assertIncludes(searchIntentReviewCards[0].dataGrain, "当前 Parent ASIN 相关广告上下文");
assertIncludes(searchIntentReviewCards[0].dataGrain, "按标准化用户搜索词及规则归类聚合");
assertIncludes(searchIntentReviewCards[0].proves, "同类广告搜索词");
assertIncludes(searchIntentReviewCards[0].proves, "按标准化用户搜索词及规则归类聚合");
assertIncludes(searchIntentReviewCards[0].doesNotProve, "不能证明 Parent ASIN 下全部自然搜索或市场搜索表现");
assertIncludes(searchIntentReviewCards[0].doesNotProve, "不能把搜索词表现分组当作人工动作对象");
assertEqual(searchIntentReviewCards[0].doesNotProve.includes("语义组人工动作"), false);
assertIncludes(searchIntentReviewCards[0].nextManualStep, "具体 SearchTerm 信号");
assertIncludes(searchIntentReviewCards[0].boundary, "只复核广告用户搜索词表现");
assertIncludes(searchIntentReviewCards[0].boundary, "不把搜索词表现分组当作人工动作对象");
assertIncludes(searchIntentReviewCards[0].boundary, "不证明单个 ASIN 归因");
assertIncludes(searchIntentReviewCards[0].boundary, "ABA 仅作站点级背景");
assertEqual(searchIntentReviewCards[0].primarySearchTerm, "baby sunglasses");
assertIncludes(searchIntentReviewCards[0].primarySearchTermReason, "扩量复核");
assertIncludes(searchIntentReviewCards[0].primarySearchTermReason, "有订单");
assertEqual(searchIntentReviewCards[0].topTerms[0], "kids sunglasses：1 单 / 花费 2 / ACOS 40.00% / 表现行 1 条 / 广告组 儿童太阳镜广泛 / 投放词 kids sunglasses broad");
assertEqual(searchIntentReviewCards[0].topTerms[1], "baby sunglasses：3 单 / 花费 7 / ACOS 14.00% / 表现行 2 条 / 广告组 儿童太阳镜精准 / 投放词 baby sunglasses exact / ABA 120");
assertEqual(searchIntentReviewCards[0].intentLabel, "规则语义：儿童太阳镜");

const searchIntentPanelContext = buildSearchIntentPanelContext(searchIntentReviewCards);
assertIncludes(searchIntentPanelContext.purpose, "聚合广告中实际产生表现的用户搜索词");
assertIncludes(searchIntentPanelContext.purpose, "Parent ASIN");
assertIncludes(searchIntentPanelContext.dataGrain, "当前 Parent ASIN 相关广告上下文");
assertIncludes(searchIntentPanelContext.dataGrain, "按标准化用户搜索词及规则归类聚合");
assertIncludes(searchIntentPanelContext.interactionBoundary, "只临时聚焦左侧同类 SearchTerm 信号");
assertIncludes(searchIntentPanelContext.interactionBoundary, "打开优先 SearchTerm 证据链");
assertIncludes(searchIntentPanelContext.interactionBoundary, "不改变顶部诊断入口筛选器");
assertIncludes(searchIntentPanelContext.proves, "同类广告搜索词");
assertIncludes(searchIntentPanelContext.doesNotProve, "不能证明 Parent ASIN 下全部自然搜索或市场搜索表现");
assertIncludes(searchIntentPanelContext.nextManualStep, "具体 SearchTerm 信号");
assertIncludes(searchIntentPanelContext.signalMetricBoundary, "卡片指标覆盖当前 Parent ASIN");
assertIncludes(searchIntentPanelContext.signalMetricBoundary, "按标准化用户搜索词及规则归类聚合");
assertIncludes(searchIntentPanelContext.signalMetricBoundary, "可行动证据子集");
assertIncludes(searchIntentPanelContext.boundary, "不把搜索词表现分组当作人工动作对象");
assertIncludes(searchIntentPanelContext.emptyText, "当前展示 1 组 Parent ASIN 广告搜索词表现复核");

const emptySearchIntentPanelContext = buildSearchIntentPanelContext([]);
assertIncludes(emptySearchIntentPanelContext.purpose, "不是经营商品入口、广告组入口或人工动作对象");
assertIncludes(emptySearchIntentPanelContext.purpose, "从当前 Parent ASIN 视角聚合广告中实际产生表现的用户搜索词");
assertIncludes(emptySearchIntentPanelContext.dataGrain, "当前 Parent ASIN 关联广告上下文");
assertIncludes(emptySearchIntentPanelContext.dataGrain, "用户搜索词表现行");
assertIncludes(emptySearchIntentPanelContext.dataGrain, "按标准化用户搜索词及规则归类聚合");
assertIncludes(emptySearchIntentPanelContext.interactionBoundary, "不切换 Parent ASIN / 广告 ASIN / 广告组");
assertIncludes(emptySearchIntentPanelContext.doesNotProve, "不能证明 Parent ASIN 下全部自然搜索或市场搜索表现");
assertIncludes(emptySearchIntentPanelContext.nextManualStep, "不把搜索词聚合包装成可执行动作");
assertIncludes(emptySearchIntentPanelContext.boundary, "不改变诊断入口");
assertIncludes(emptySearchIntentPanelContext.emptyText, "不代表 Parent ASIN 没有自然搜索词");

const searchIntentReviewDecisionSummary = buildSearchIntentReviewDecisionSummary(searchIntentReviewCards);
if (!searchIntentReviewDecisionSummary) {
  throw new Error("有搜索词表现复核卡片时应返回复核判断摘要");
}
assertIncludes(searchIntentReviewDecisionSummary.headline, "有效词扩量 1 组");
assertIncludes(searchIntentReviewDecisionSummary.headline, "浪费词止损 0 组");
assertIncludes(searchIntentReviewDecisionSummary.headline, "证据缺口观察 0 组");
assertIncludes(searchIntentReviewDecisionSummary.businessQuestion, "今天应先做扩量复核、止损复核，还是只观察补证");
assertEqual(searchIntentReviewDecisionSummary.topIntentLabel, "规则语义：儿童太阳镜");
assertEqual(searchIntentReviewDecisionSummary.topDecisionLabel, "扩量复核");
assertIncludes(searchIntentReviewDecisionSummary.topDecisionReason, "订单 4");
assertIncludes(searchIntentReviewDecisionSummary.topSearchTermLabel, "SearchTerm：baby sunglasses");
assertIncludes(searchIntentReviewDecisionSummary.manualReviewPath, "打开具体 SearchTerm 信号");
assertIncludes(searchIntentReviewDecisionSummary.manualReviewPath, "右侧只做人工留痕或加入 7/14 天复盘");
assertIncludes(searchIntentReviewDecisionSummary.proofBoundary, "只证明当前 Parent ASIN 广告上下文中的搜索词表现优先级");
assertIncludes(searchIntentReviewDecisionSummary.proofBoundary, "不覆盖自然搜索、未投放子 ASIN 或单个 ASIN 归因");
assertEqual(searchIntentReviewDecisionSummary.distributionItems[0].label, "有效词扩量");
assertEqual(searchIntentReviewDecisionSummary.distributionItems[1].label, "浪费词止损");
assertEqual(searchIntentReviewDecisionSummary.distributionItems[2].label, "证据缺口观察");
assertIncludes(searchIntentReviewDecisionSummary.distributionItems[0].detail, "有订单");
assertIncludes(searchIntentReviewDecisionSummary.distributionItems[1].detail, "无订单消耗");
assertIncludes(searchIntentReviewDecisionSummary.distributionItems[2].detail, "投放词");
assertEqual(searchIntentReviewDecisionSummary.priorityPathItems[0].label, "1. 规则语义：儿童太阳镜");
assertEqual(searchIntentReviewDecisionSummary.priorityPathItems[0].value, "扩量复核");
assertIncludes(searchIntentReviewDecisionSummary.priorityPathItems[0].detail, "baby sunglasses");
assertEqual(searchIntentReviewDecisionSummary.priorityPathItems.length <= 3, true);
assertIncludes(searchIntentReviewDecisionSummary.evidenceGap, "广告位影响需要继续打开广告位证据核对");
assertIncludes(searchIntentReviewDecisionSummary.nextManualStep, "具体 SearchTerm 信号");
assertIncludes(searchIntentReviewDecisionSummary.boundary, "不改变 Parent ASIN 诊断入口");
assertIncludes(searchIntentReviewDecisionSummary.boundary, "不把搜索词表现分组当作人工动作对象");
assertIncludes(searchIntentReviewDecisionSummary.boundary, "不生成自动加词、否词、调价或暂停广告动作");
assertEqual(buildSearchIntentReviewDecisionSummary([]), null);

const wasteSearchIntentReviewCards = buildSearchIntentReviewCards([
  {
    intent_label: "规则语义：高花费无订单",
    search_terms: ["kids beach gear"],
    metrics: {
      impressions: 0,
      clicks: 45,
      cost: 36,
      orders: 0,
      sales: 0,
      acos: null,
      cvr: 0,
      cpc: 0.8,
    },
    insight: "这组广告搜索词消耗较高但没有订单，属于止损候选",
    top_search_terms: [
      {
        search_term: "kids beach bag",
        clicks: 12,
        cost: 8,
        orders: 0,
        sales: 0,
        acos: null,
        source_row_count: 1,
      },
      {
        search_term: "kids beach gear",
        clicks: 45,
        cost: 36,
        orders: 0,
        sales: 0,
        acos: null,
        source_row_count: 2,
      },
    ],
  },
]);
assertEqual(wasteSearchIntentReviewCards[0].operationDecisionLabel, "止损复核");
assertEqual(wasteSearchIntentReviewCards[0].operationDecisionTone, "waste");
assertIncludes(wasteSearchIntentReviewCards[0].operationDecisionReason, "花费 36");
assertIncludes(wasteSearchIntentReviewCards[0].operationDecisionReason, "订单 0");
assertEqual(wasteSearchIntentReviewCards[0].reviewStatus.label, "止损复核");
assertEqual(wasteSearchIntentReviewCards[0].reviewStatus.tone, "waste");
assertIncludes(wasteSearchIntentReviewCards[0].reviewStatus.reason, "花费 36");
assertIncludes(wasteSearchIntentReviewCards[0].reviewStatus.reason, "同一广告组、投放词或广告位");
assertIncludes(wasteSearchIntentReviewCards[0].reviewStatus.nextStep, "不自动否词");
assertIncludes(wasteSearchIntentReviewCards[0].metricPurposeItems[1].value, "人工止损复核");
assertIncludes(wasteSearchIntentReviewCards[0].metricPurposeItems[1].value, "花费 36");
assertIncludes(wasteSearchIntentReviewCards[0].metricPurposeItems[1].value, "订单 0");
assertIncludes(wasteSearchIntentReviewCards[0].metricPurposeItems[2].value, "表现行 3 条");
assertEqual(wasteSearchIntentReviewCards[0].primarySearchTerm, "kids beach gear");
assertIncludes(wasteSearchIntentReviewCards[0].primarySearchTermReason, "无订单且花费最高");

const observeSearchIntentReviewCards = buildSearchIntentReviewCards([
  {
    intent_label: "规则语义：低样本观察",
    search_terms: ["toddler shade"],
    metrics: {
      impressions: 0,
      clicks: 2,
      cost: 1.2,
      orders: 0,
      sales: 0,
      acos: null,
      cvr: 0,
      cpc: 0.6,
    },
    insight: "需要观察",
    top_search_terms: [
      {
        search_term: "toddler shade hat",
        clicks: 10,
        cost: 6,
        orders: 0,
        sales: 0,
        acos: null,
        source_row_count: 1,
      },
      {
        search_term: "toddler shade",
        clicks: 2,
        cost: 1.2,
        orders: 0,
        sales: 0,
        acos: null,
        source_row_count: 3,
      },
    ],
  },
]);
assertEqual(observeSearchIntentReviewCards[0].operationDecisionLabel, "观察复核");
assertEqual(observeSearchIntentReviewCards[0].operationDecisionTone, "observe");
assertIncludes(observeSearchIntentReviewCards[0].operationDecisionReason, "证据还不足");
assertEqual(observeSearchIntentReviewCards[0].reviewStatus.label, "仅观察");
assertEqual(observeSearchIntentReviewCards[0].reviewStatus.tone, "observe");
assertIncludes(observeSearchIntentReviewCards[0].reviewStatus.reason, "尚不足以支撑扩量或止损");
assertIncludes(observeSearchIntentReviewCards[0].reviewStatus.nextStep, "先补广告组、投放词、广告位和同组 ASIN 证据");
assertIncludes(observeSearchIntentReviewCards[0].metricPurposeItems[0].value, "当前判断偏观察");
assertIncludes(observeSearchIntentReviewCards[0].metricPurposeItems[2].value, "只能观察和补证");
assertIncludes(observeSearchIntentReviewCards[0].metricPurposeItems[2].value, "表现行 4 条");
assertEqual(observeSearchIntentReviewCards[0].primarySearchTerm, "toddler shade");
assertIncludes(observeSearchIntentReviewCards[0].primarySearchTermReason, "样本行数");

const prioritizedSearchIntentReviewCards = buildSearchIntentReviewCards(
  [
    {
      intent_label: "规则语义：低样本观察",
      search_terms: ["low sample term"],
      insight: "低样本观察组",
      metrics: {
        impressions: 0,
        clicks: 4,
        cost: 2,
        orders: 0,
        sales: 0,
        acos: null,
        cvr: 0,
        cpc: 0.5,
      },
      top_search_terms: [{ search_term: "low sample term", clicks: 4, cost: 2, orders: 0, sales: 0, acos: null, source_row_count: 2 }],
    },
    {
      intent_label: "规则语义：稳定扩量",
      search_terms: ["stable scale term"],
      insight: "稳定扩量组",
      metrics: {
        impressions: 0,
        clicks: 20,
        cost: 8,
        orders: 4,
        sales: 80,
        acos: 0.1,
        cvr: 0.2,
        cpc: 0.4,
      },
      top_search_terms: [{ search_term: "stable scale term", clicks: 20, cost: 8, orders: 4, sales: 80, acos: 0.1, source_row_count: 3 }],
    },
    {
      intent_label: "规则语义：高花费无订单",
      search_terms: ["waste term"],
      insight: "高花费无订单组",
      metrics: {
        impressions: 0,
        clicks: 60,
        cost: 45,
        orders: 0,
        sales: 0,
        acos: null,
        cvr: 0,
        cpc: 0.75,
      },
      top_search_terms: [{ search_term: "waste term", clicks: 60, cost: 45, orders: 0, sales: 0, acos: null, source_row_count: 4 }],
    },
  ],
  2,
);
assertEqual(prioritizedSearchIntentReviewCards.length, 2);
assertEqual(prioritizedSearchIntentReviewCards[0].title, "规则语义：高花费无订单");
assertEqual(prioritizedSearchIntentReviewCards[0].operationDecisionTone, "waste");
assertIncludes(prioritizedSearchIntentReviewCards[0].operationDecisionReason, "优先打开具体 SearchTerm");
assertEqual(prioritizedSearchIntentReviewCards[1].title, "规则语义：稳定扩量");
assertEqual(prioritizedSearchIntentReviewCards[1].operationDecisionTone, "scale");
assertEqual(prioritizedSearchIntentReviewCards.some((card) => card.title === "规则语义：低样本观察"), false);

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
      id: "sig-search-intent-visible-context",
      signal_type: "opportunity",
      signal_category: "search_term_opportunity",
      object_type: "search_term",
      severity: 4,
      status: "pending",
      freshness_status: "api_snapshot",
      evidence: {
        primary_object: { label: "kids sunglasses" },
        facts: [{ label: "广告搜索词聚合上下文", value: "规则语义：儿童太阳镜" }],
      },
    },
    {
      id: "sig-search-intent-legacy-parent-label",
      signal_type: "opportunity",
      signal_category: "search_term_opportunity",
      object_type: "search_term",
      severity: 4,
      status: "pending",
      freshness_status: "api_snapshot",
      evidence: {
        primary_object: { label: "toddler sunglasses" },
        facts: [{ label: "Parent ASIN 搜索词表现聚合", value: "规则语义：儿童太阳镜" }],
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

assertEqual(searchIntentFilteredSignals.length, 3);
assertEqual(searchIntentFilteredSignals[0].id, "sig-search-intent-primary");
assertEqual(searchIntentFilteredSignals[1].id, "sig-search-intent-visible-context");
assertEqual(searchIntentFilteredSignals[2].id, "sig-search-intent-legacy-parent-label");

const preferredSearchIntentSignalId = selectSearchIntentSignalId(
  [
    {
      id: "sig-first-search-term",
      signal_type: "opportunity",
      signal_category: "search_term_opportunity",
      object_type: "search_term",
      severity: 4,
      status: "pending",
      freshness_status: "api_snapshot",
      evidence: {
        primary_object: { label: "kids sunglasses", intent_label: "same-intent" },
        facts: [],
      },
    },
    {
      id: "sig-preferred-search-term",
      signal_type: "opportunity",
      signal_category: "search_term_opportunity",
      object_type: "search_term",
      severity: 4,
      status: "pending",
      freshness_status: "api_snapshot",
      evidence: {
        primary_object: { label: "SearchTerm: baby sunglasses", intent_label: "same-intent" },
        facts: [],
      },
    },
  ],
  "same-intent",
  "baby sunglasses",
);

assertEqual(preferredSearchIntentSignalId, "sig-preferred-search-term");

const fallbackSearchIntentSignalId = selectSearchIntentSignalId(
  [
    {
      id: "sig-first-search-term",
      signal_type: "opportunity",
      signal_category: "search_term_opportunity",
      object_type: "search_term",
      severity: 4,
      status: "pending",
      freshness_status: "api_snapshot",
      evidence: {
        primary_object: { label: "kids sunglasses", intent_label: "same-intent" },
        facts: [],
      },
    },
  ],
  "same-intent",
  "missing term",
);

assertEqual(fallbackSearchIntentSignalId, "sig-first-search-term");

const searchIntentFocusSelection = resolveSearchIntentFocusSelection(
  [
    {
      id: "sig-first-search-term",
      signal_type: "opportunity",
      signal_category: "search_term_opportunity",
      object_type: "search_term",
      severity: 4,
      status: "pending",
      freshness_status: "api_snapshot",
      evidence: {
        primary_object: { label: "kids sunglasses", intent_label: "same-intent" },
        facts: [],
      },
    },
    {
      id: "sig-preferred-search-term",
      signal_type: "opportunity",
      signal_category: "search_term_opportunity",
      object_type: "search_term",
      severity: 4,
      status: "pending",
      freshness_status: "api_snapshot",
      evidence: {
        primary_object: { label: "SearchTerm: baby sunglasses", intent_label: "same-intent" },
        facts: [],
      },
    },
  ],
  null,
  "parent_asin:B00K4W4AAA",
  "same-intent",
  "baby sunglasses",
);

assertEqual(searchIntentFocusSelection.intentLabel, "same-intent");
assertEqual(searchIntentFocusSelection.scopeId, "parent_asin:B00K4W4AAA");
assertEqual(searchIntentFocusSelection.signalId, "sig-preferred-search-term");

const clearedSearchIntentFocusSelection = resolveSearchIntentFocusSelection(
  [],
  "same-intent",
  "parent_asin:B00K4W4AAA",
  "same-intent",
);

assertEqual(clearedSearchIntentFocusSelection.intentLabel, null);
assertEqual(clearedSearchIntentFocusSelection.scopeId, null);
assertEqual(clearedSearchIntentFocusSelection.signalId, null);

const searchIntentEntryLockSummary = buildSearchIntentEntryLockSummary(
  {
    scope_id: "parent_asin:B00K4W4AAA",
    scope_type: "parent_asin",
    label: "Parent ASIN B00K4W4AAA",
    parent_asin: "B00K4W4AAA",
  },
  "规则语义：海滩出行用品",
  {
    primarySearchTerm: "beach essentials",
    primarySearchTermReason: "扩量复核先看有订单、订单更多且 ACOS 更低的具体 SearchTerm。",
  },
);

assertEqual(searchIntentEntryLockSummary?.title, "经营入口未切换");
assertEqual(searchIntentEntryLockSummary?.rows[0]?.label, "经营诊断入口");
assertEqual(searchIntentEntryLockSummary?.rows[0]?.value, "Parent ASIN B00K4W4AAA");
assertIncludes(searchIntentEntryLockSummary?.rows[0]?.detail ?? "", "不把 Parent ASIN 广告搜索词表现复核写回 ProductScope");
assertEqual(searchIntentEntryLockSummary?.rows[1]?.label, "二级搜索词聚焦");
assertIncludes(searchIntentEntryLockSummary?.rows[1]?.detail ?? "", "从当前 Parent ASIN 视角聚合广告中的用户搜索词表现行");
assertEqual(searchIntentEntryLockSummary?.rows[1]?.value, "规则语义：海滩出行用品");
assertIncludes(searchIntentEntryLockSummary?.rows[1]?.detail ?? "", "二级证据聚焦");
assertIncludes(searchIntentEntryLockSummary?.rows[1]?.detail ?? "", "打开同类 SearchTerm 证据链");
assertEqual(searchIntentEntryLockSummary?.rows[2]?.value, "SearchTerm：beach essentials");
assertIncludes(searchIntentEntryLockSummary?.rows[2]?.detail ?? "", "扩量复核先看");
assertIncludes(searchIntentEntryLockSummary?.boundary ?? "", "不会切换经营诊断入口");
assertIncludes(searchIntentEntryLockSummary?.boundary ?? "", "必须使用诊断入口筛选器或明确入口按钮");
assertEqual(buildSearchIntentEntryLockSummary(null, null), null);

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
