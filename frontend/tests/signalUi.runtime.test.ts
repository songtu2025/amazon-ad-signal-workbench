declare const process: {
  env: Record<string, string | undefined>;
  exitCode?: number;
};

import {
  buildManualConfirmationEvidenceItems,
  buildDiagnosisContextSummary,
  buildProductScopeAnalysisPath,
  buildProductScopeFirstScreenSummary,
  buildProductScopeGroupOverview,
  buildSearchIntentPanelContext,
  buildSearchIntentReviewCards,
  buildNextUnhandledManualActionCandidate,
  buildReviewEvidenceRepairSummary,
  buildReviewReadinessGateSummary,
  buildSearchTermOpportunityReviewChain,
  buildSignalDiagnosisEvidenceSummary,
  buildSignalMetricDecisionItems,
  manualActionQueueTargetSwitchSummary,
  manualActionReviewRouteSplitSummary,
  manualActionPreviewForSelectedSignal,
  mergeBackendTriageSignals,
  recommendedManualStatusText,
  filterSignalsBySearchIntent,
  resolveSearchIntentFocusSelection,
  resolveSignalSelectionId,
  signalTriageBusinessEvidenceItems,
  signalTriageDiagnosisContractItems,
} from "../src/pages/SignalTriageWorkbench/signalUi";
import {
  buildManualActionReadbackPathItems,
  buildReviewEffectWindowLedger,
  buildReviewRecordPreflightChecklist,
  buildReviewTodoEvidenceReadbackSummary,
  canSaveReviewRecordWithPreflight,
  manualActionAuthorizationReadinessSummary,
  manualConfirmationEvidenceReadinessSummary,
  manualConfirmationDiagnosisBridgeSummary,
  manualActionPreflightEvidenceRows,
  manualActionPreflightEvidenceSnapshotText,
  manualActionPreflightPriorityEvidenceRows,
  manualActionReadbackConsistencyText,
} from "../src/pages/SignalTriageWorkbench/reviewUi";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(actual: string, expected: string) {
  if (!actual.includes(expected)) {
    throw new Error(`期望包含：${expected}\n实际：${actual}`);
  }
}

function assertNotIncludes(actual: string, expected: string) {
  if (actual.includes(expected)) {
    throw new Error(`不应包含：${expected}\n实际：${actual}`);
  }
}

function assertOrderedLabels(actualLabels: string[], expectedLabels: string[], message: string) {
  let previousIndex = -1;
  for (const label of expectedLabels) {
    const index = actualLabels.indexOf(label);
    assert(index >= 0, `${message} 缺少：${label}\n实际：${actualLabels.join(" / ")}`);
    assert(index > previousIndex, `${message} 顺序错误：${label}\n实际：${actualLabels.join(" / ")}`);
    previousIndex = index;
  }
}

function indexById(items: any[] | null | undefined, key: string) {
  const indexed: Record<string, any> = {};
  for (const item of items ?? []) {
    const id = item?.[key];
    if (id) {
      indexed[String(id)] = item;
    }
  }
  return indexed;
}

function asText(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map(asText).join("\n");
  }
  if (typeof value === "object") {
    return Object.values(value).map(asText).join("\n");
  }
  return String(value);
}

function metricText(metrics: any[] | null | undefined): string {
  return (metrics ?? [])
    .map((metric) => `${metric?.name ?? ""} ${metric?.value ?? ""} ${metric?.purpose ?? ""}`)
    .join("\n");
}

async function fetchJson(path: string): Promise<any> {
  const base = process.env.API_BASE_URL || "http://127.0.0.1:8000";
  const response = await fetch(`${base}${path}`);
  if (!response.ok) {
    throw new Error(`请求失败 ${response.status}: ${path}`);
  }
  return response.json();
}

function signalFromCandidate(candidate: any) {
  return {
    id: candidate.signal_id,
    signal_type: candidate.signal_type || "opportunity",
    signal_category: candidate.signal_category || "search_term_opportunity",
    severity: candidate.severity ?? 4,
    confidence: candidate.confidence || "medium",
    status: "pending" as const,
    freshness_status: candidate.freshness_status || "api_snapshot",
    evidence_count: candidate.evidence_count ?? 1,
    data_sources: [{ source_type: "ad_search_term_daily_metrics" }],
    shop_id: candidate.shop_id,
    shop_name: candidate.shop_name,
    market_id: candidate.market_id,
    object_type: candidate.object_type,
    evidence: {
      primary_object: {
        object_type: candidate.object_type,
        label: candidate.object_label,
        asin: candidate.stable_object_id,
      },
    },
  };
}

async function main() {
  const marketId = process.env.MARKET_ID || "1";
  const productScopeId = process.env.PRODUCT_SCOPE_ID || "parent_asin:B00K4W4AAA";
  const scope = encodeURIComponent(productScopeId);
  const triage = await fetchJson(`/api/signal-triage?market_id=${marketId}&top=5&product_scope_id=${scope}`);
  const rawSignals = await fetchJson(`/api/signals?market_id=${marketId}`);
  const repair = await fetchJson(`/api/review-evidence-repair?market_id=${marketId}&top=5&product_scope_id=${scope}`);
  const searchIntents = await fetchJson(`/api/search-intents?market_id=${marketId}&product_scope_id=${scope}`);
  const productScope = await fetchJson("/api/product-scope");

  const recommendedLabel =
    triage.recommended_manual_status?.object_label ||
    triage.recommended_candidate?.object_label ||
    triage.recommended_candidate?.stable_object_id ||
    "";
  const nextLabel =
    triage.next_unhandled_candidate?.object_label ||
    triage.next_unhandled_candidate?.stable_object_id ||
    triage.next_unhandled_candidate?.object_id ||
    "";
  const reviewObjectLabel =
    triage.review_status?.review_wait_summary?.next_object_label ||
    triage.review_status?.review_wait_summary?.next_object_id ||
    "";

  assert(recommendedLabel.length > 0, "运行态应存在推荐对象。");
  assert(nextLabel.length > 0, "推荐对象已留痕后应继续暴露下一未留痕候选。");
  assert(recommendedLabel !== nextLabel, "推荐对象和下一候选必须是不同业务对象。");
  assert(triage.recommended_manual_status?.has_manual_action === true, "推荐对象应已人工留痕。");
  assert((triage.recommended_manual_status?.review_todo_count ?? 0) > 0, "推荐对象应已有复盘待办。");

  const runtimeSignals = Array.isArray(rawSignals) ? rawSignals : rawSignals?.signals ?? [];
  const nextSignalId =
    triage.next_unhandled_candidate?.manual_action_preview?.signal_id ||
    triage.next_unhandled_candidate?.signal_id ||
    "";
  assert(nextSignalId.length > 0, "下一候选应带 signal_id。");
  const mergedRuntimeSignals = mergeBackendTriageSignals([], runtimeSignals, triage);
  const mergedRuntimeNextSignal = mergedRuntimeSignals.find((signal: any) => signal.id === nextSignalId);
  assert(mergedRuntimeNextSignal !== undefined, "工作台应能合并 triage 下一候选，不依赖 /api/signals 同 ID 记录。");
  assert(mergedRuntimeNextSignal?.evidence?.primary_object?.label === nextLabel, "合并后的下一候选必须保留业务对象名。");
  assert(
    resolveSignalSelectionId(null, mergedRuntimeSignals, triage) === nextSignalId,
    "推荐对象已留痕时，默认选中应转向下一未处理候选。",
  );
  const recommendedSignalId =
    triage.recommended_candidate?.signal_id ||
    triage.manual_action_preview?.signal_id ||
    "";
  assert(recommendedSignalId.length > 0, "推荐对象应带 signal_id，供旧选中态识别。");
  assert(
    resolveSignalSelectionId(recommendedSignalId, mergedRuntimeSignals, triage) === nextSignalId,
    "推荐对象已留痕且仍是旧选中态时，页面刷新后应自动转向下一未处理候选。",
  );
  const runtimeSelectedPreview = manualActionPreviewForSelectedSignal(nextSignalId, triage, mergedRuntimeNextSignal);
  assert(runtimeSelectedPreview?.objectLabel === nextLabel, "右侧人工预检应跟随真实下一候选。");
  const selectedRecommendedSwitch = manualActionQueueTargetSwitchSummary(triage, recommendedSignalId);
  assert(selectedRecommendedSwitch?.tone === "blocked", "选中已留痕推荐对象时，目标切换提示必须阻断重复写入。");
  assertIncludes(selectedRecommendedSwitch?.primary ?? "", recommendedLabel);
  assertIncludes(selectedRecommendedSwitch?.primary ?? "", "已经有人工留痕");
  assertIncludes(selectedRecommendedSwitch?.diagnosisObject ?? "", recommendedLabel);
  assertIncludes(selectedRecommendedSwitch?.writeTarget ?? "", nextLabel);
  assertIncludes(selectedRecommendedSwitch?.boundary ?? "", "推荐对象和可写候选必须分开处理");
  const selectedNextSwitch = manualActionQueueTargetSwitchSummary(triage, nextSignalId);
  assert(selectedNextSwitch?.tone === "ready", "选中下一未留痕候选时，目标切换提示应允许继续人工预检。");
  assertIncludes(selectedNextSwitch?.primary ?? "", nextLabel);
  assertIncludes(selectedNextSwitch?.primary ?? "", "下一个未留痕候选");

  const recommendedStatus = recommendedManualStatusText(triage) ?? "";
  assertIncludes(recommendedStatus, recommendedLabel);
  assertIncludes(recommendedStatus, "等待 7 天 / 14 天完整窗口");
  assertNotIncludes(recommendedStatus, nextLabel);

  const nextCandidate = buildNextUnhandledManualActionCandidate(mergedRuntimeSignals, triage);
  assert(nextCandidate !== null, "下一候选应能构造成独立人工动作候选。");
  assert(nextCandidate?.objectLabel === nextLabel, "下一候选展示名应来自 next_unhandled_candidate。");
  assertIncludes(nextCandidate?.reason ?? "", nextLabel);
  assertIncludes(nextCandidate?.reason ?? "", "不要自动执行广告动作");

  const productScopeDrilldown = triage.product_scope_drilldown;
  assert(productScopeDrilldown?.status === "ready", "Parent ASIN 入口应返回 ready 的经营盘下钻。");
  assert((productScopeDrilldown?.advertised_asin_count ?? 0) > 0, "Parent ASIN 经营盘必须只承接有广告证据的广告 ASIN。");
  assert((productScopeDrilldown?.ad_group_diagnosis?.length ?? 0) > 0, "Parent ASIN 下钻必须继续暴露广告组诊断。");
  const productScopeText = `${productScopeDrilldown?.summary ?? ""}\n${productScopeDrilldown?.boundary ?? ""}`;
  assertIncludes(productScopeText, "广告 ASIN");
  assertIncludes(productScopeText, "广告组");
  assertIncludes(productScopeText, "投放词");
  assertIncludes(productScopeText, "搜索词");
  assertIncludes(productScopeText, "广告位");
  assertIncludes(productScopeText, "不能自动归因");
  assertIncludes(productScopeText, "不能自动执行广告动作");
  const productScopeOptions = productScope?.options ?? [];
  const selectedProductScopeOption = productScopeOptions.find((option: any) => option.scope_id === productScopeId) ?? null;
  assert(selectedProductScopeOption?.scope_type === "parent_asin", "运行态必须用 Parent ASIN 作为当前经营诊断入口。");
  const productScopeGroupOverview = buildProductScopeGroupOverview(selectedProductScopeOption, productScopeOptions, productScope?.coverage);
  const firstScreenSummary = buildProductScopeFirstScreenSummary(productScopeGroupOverview, triage);
  assert(firstScreenSummary !== null, "Parent ASIN 入口必须生成首屏经营路径摘要。");
  assertIncludes(firstScreenSummary.pathSummary, "Parent ASIN 经营销售入口");
  assertIncludes(firstScreenSummary.pathSummary, "广告 ASIN");
  assertIncludes(firstScreenSummary.pathSummary, "广告组");
  assertIncludes(firstScreenSummary.pathSummary, "投放词 / 搜索词 / 广告位");
  assertIncludes(firstScreenSummary.pathSummary, "AI 信号诊断 -> 人工确认 -> 7/14 天复盘");
  const firstScreenPathText = asText(firstScreenSummary.pathSteps);
  assertIncludes(firstScreenPathText, "Parent ASIN 经营销售盘");
  assertIncludes(firstScreenPathText, "广告 ASIN 覆盖");
  assertIncludes(firstScreenPathText, "广告组是投放容器，不是产品");
  assertIncludes(firstScreenPathText, "流量上下文证据");
  assertIncludes(firstScreenPathText, "只允许记录观察、标记已处理、加入复盘、忽略本次");
  assertIncludes(firstScreenPathText, "ReviewRecord");
  assertIncludes(asText(firstScreenSummary.landingGates), "经营口径");
  assertIncludes(asText(firstScreenSummary.landingGates), "广告证据");
  assertIncludes(asText(firstScreenSummary.landingGates), "AI 准入");
  assertIncludes(asText(firstScreenSummary.landingGates), "复盘门槛");
  assertIncludes(firstScreenSummary.boundary, "未投放子 ASIN 不进入广告诊断");
  assertIncludes(firstScreenSummary.boundary, "搜索词和广告位不能直接归因");
  const analysisPath = buildProductScopeAnalysisPath(selectedProductScopeOption);
  assertIncludes(asText(analysisPath.steps), "Parent ASIN 销售盘");
  assertIncludes(asText(analysisPath.steps), "广告 ASIN 覆盖");
  assertIncludes(asText(analysisPath.steps), "人工确认 / 7-14 天复盘");
  assertIncludes(analysisPath.boundary, "未投放子 ASIN 不进入广告信号队列");
  assertIncludes(analysisPath.boundary, "AI 信号必须进入人工确认和 7/14 天复盘");
  const diagnosisContextSummary = buildDiagnosisContextSummary(selectedProductScopeOption, triage);
  assert(diagnosisContextSummary !== null, "运行态必须生成当前诊断上下文读回。");
  assertIncludes(asText(diagnosisContextSummary.items), "经营入口");
  assertIncludes(asText(diagnosisContextSummary.items), "广告覆盖");
  assertIncludes(asText(diagnosisContextSummary.items), "准入状态");
  assertIncludes(asText(diagnosisContextSummary.items), "可处理候选");
  assertIncludes(diagnosisContextSummary.boundary, "不能自动归因");

  assert(Array.isArray(searchIntents) && searchIntents.length > 0, "Parent ASIN 入口应返回广告搜索词表现聚合。");
  assert(
    searchIntents.some((item: any) => String(item?.data_grain ?? "").includes("当前 Parent ASIN")),
    "广告搜索词表现聚合必须绑定当前 Parent ASIN 诊断入口。",
  );
  assert(
    searchIntents.some((item: any) => Array.isArray(item?.search_terms) && item.search_terms.includes(recommendedLabel)),
    "广告搜索词表现聚合必须包含推荐 SearchTerm 所属的 Parent ASIN 广告搜索词行。",
  );
  const searchIntentReviewCards = buildSearchIntentReviewCards(searchIntents);
  assert(
    searchIntents.length <= 8 && searchIntentReviewCards.length === searchIntents.length,
    "Parent ASIN 广告搜索词表现复核不应默认隐藏当前真实分组；小于等于 8 组时必须完整展示。",
  );
  let hasSeenScale = false;
  let hasSeenObserve = false;
  const searchIntentSummaryByLabel = new Map<string, any>(searchIntents.map((item: any) => [String(item.intent_label), item]));
  for (const card of searchIntentReviewCards) {
    const sourceSummary = searchIntentSummaryByLabel.get(card.intentLabel);
    const sourceSearchTerms = new Set(
      [
        ...(Array.isArray(sourceSummary?.search_terms) ? sourceSummary.search_terms : []),
        ...(Array.isArray(sourceSummary?.top_search_terms)
          ? sourceSummary.top_search_terms.map((term: any) => term?.search_term)
          : []),
      ]
        .filter(Boolean)
        .map(String),
    );
    if (card.operationDecisionTone === "scale") hasSeenScale = true;
    if (card.operationDecisionTone === "observe") hasSeenObserve = true;
    assert(!(card.operationDecisionTone === "waste" && hasSeenScale), "止损复核分组必须排在扩量复核分组前面。");
    assert(!(card.operationDecisionTone !== "observe" && hasSeenObserve), "观察复核分组不能排在止损或扩量分组前面。");
    assert(card.primarySearchTerm !== null && card.primarySearchTerm.length > 0, "每个搜索词表现分组都必须给出具体可复核 SearchTerm。");
    assert(
      sourceSearchTerms.has(card.primarySearchTerm),
      "搜索词表现分组点击对象必须来自当前 Parent ASIN 广告搜索词表现行，不能落到分组标签本身。",
    );
    assertIncludes(card.primarySearchTermReason, "具体 SearchTerm");
    assertIncludes(card.businessQuestion, "当前 Parent ASIN");
    assertIncludes(card.purpose, "聚合广告中实际产生表现的用户搜索词");
    assertIncludes(card.boundary, "不改变诊断入口");
    assertIncludes(card.boundary, "不把搜索词表现分组当作人工动作对象");
    assertIncludes(card.signalMetricBoundary, "点开后的 AI 信号");
    assert(card.metricPurposeItems.length >= 3, "搜索词表现分组必须拆开说明指标目的，不能只展示裸指标。");
    const metricPurposeText = asText(card.metricPurposeItems);
    assertIncludes(metricPurposeText, "花费");
    assertIncludes(metricPurposeText, "订单");
    assertIncludes(metricPurposeText, "表现行");
    assertIncludes(card.nextManualStep, "具体 SearchTerm");
    assertIncludes(card.nextManualStep, "人工");
  }
  const searchIntentPanelContext = buildSearchIntentPanelContext(searchIntentReviewCards);
  const searchIntentRuntimeText = asText([searchIntentReviewCards, searchIntentPanelContext]);
  assertIncludes(searchIntentPanelContext.purpose, "从当前 Parent ASIN 视角");
  assertIncludes(searchIntentPanelContext.purpose, "聚合广告中实际产生表现的用户搜索词");
  assertIncludes(searchIntentPanelContext.dataGrain, "当前 Parent ASIN");
  assertIncludes(searchIntentPanelContext.dataGrain, "ad_search_term_daily_metrics");
  assertIncludes(searchIntentPanelContext.dataGrain, "按标准化用户搜索词及规则归类聚合");
  assertIncludes(searchIntentPanelContext.dataGrain, "不包含未投放子 ASIN、自然搜索词或 ABA 站点数据");
  assertIncludes(searchIntentPanelContext.interactionBoundary, "不改变顶部诊断入口筛选器");
  assertIncludes(searchIntentRuntimeText, "广告用户搜索词表现");
  assertIncludes(searchIntentRuntimeText, "不能证明 Parent ASIN 下全部自然搜索或市场搜索表现");
  assertIncludes(searchIntentRuntimeText, "不能把搜索词表现分组当作人工动作对象");
  assertNotIncludes(searchIntentRuntimeText, "语义组人工动作");
  assertNotIncludes(searchIntentRuntimeText, "当前站点广告中实际产生表现的用户搜索词行按搜索意图聚合");
  assertIncludes(searchIntentRuntimeText, "搜索词表现分组");
  assert(recommendedLabel === "beach essentials", "当前标杆链路必须保持为 B00K4W4AAA -> beach essentials。");
  const benchmarkSearchIntentCard = searchIntentReviewCards.find((card: any) => card.primarySearchTerm === recommendedLabel);
  assert(benchmarkSearchIntentCard !== undefined, "Parent ASIN 广告搜索词表现复核必须把 beach essentials 作为可点击的优先 SearchTerm。");
  const benchmarkFocusSelection = resolveSearchIntentFocusSelection(
    mergedRuntimeSignals,
    null,
    productScopeId,
    benchmarkSearchIntentCard.intentLabel,
    benchmarkSearchIntentCard.primarySearchTerm,
  );
  assert(benchmarkFocusSelection.intentLabel === benchmarkSearchIntentCard.intentLabel, "点击聚合卡片后必须保留当前搜索词表现分组。");
  assert(benchmarkFocusSelection.scopeId === productScopeId, "点击聚合卡片不能改变 Parent ASIN 诊断入口。");
  assert(benchmarkFocusSelection.signalId === recommendedSignalId, "点击 beach essentials 聚合卡片必须选中同一条 SearchTerm 信号。");
  const benchmarkFocusedSignals = filterSignalsBySearchIntent(mergedRuntimeSignals, benchmarkSearchIntentCard.intentLabel);
  assert(
    benchmarkFocusedSignals.some((signal: any) => signal.id === benchmarkFocusSelection.signalId),
    "选中的 SearchTerm 信号必须来自当前 Parent ASIN 广告搜索词表现分组。",
  );
  const benchmarkFocusedSignal = mergedRuntimeSignals.find((signal: any) => signal.id === benchmarkFocusSelection.signalId);
  assertIncludes(asText(benchmarkFocusedSignal?.evidence?.primary_object ?? {}).toLowerCase(), "beach essentials");
  const benchmarkManualPreview = manualActionPreviewForSelectedSignal(benchmarkFocusSelection.signalId, triage, benchmarkFocusedSignal);
  assert(benchmarkManualPreview === null, "beach essentials 已留痕时，右侧人工预检不能静默切到下一未处理候选。");
  const benchmarkQueueSwitch = manualActionQueueTargetSwitchSummary(triage, benchmarkFocusSelection.signalId);
  assert(benchmarkQueueSwitch?.tone === "blocked", "beach essentials 已留痕时，右侧必须阻断重复写入而不是换对象保存。");
  assertIncludes(asText(benchmarkQueueSwitch), "beach essentials");
  assertIncludes(asText(benchmarkQueueSwitch), "已经有人工留痕");
  const benchmarkExpectedObjectId =
    triage.recommended_manual_status?.object_id ||
    triage.recommended_candidate?.manual_action_preview?.object_id ||
    triage.recommended_candidate?.stable_object_id ||
    `search_term:${marketId}:${recommendedLabel}`;
  const benchmarkBlockedPreflight = await fetchJson(
    `/api/manual-action/preflight?market_id=${marketId}&product_scope_id=${scope}&expected_object_type=search_term&expected_object_id=${encodeURIComponent(
      benchmarkExpectedObjectId,
    )}&action_type=add_to_review`,
  );
  assert(benchmarkBlockedPreflight.status === "blocked", "已留痕的 beach essentials 后端预检必须阻断重复写入。");
  assert(
    (benchmarkBlockedPreflight.blockers ?? []).some((blocker: any) => blocker.code === "duplicate_manual_action"),
    "已留痕的 beach essentials 必须返回 duplicate_manual_action 阻断原因。",
  );
  assert(benchmarkBlockedPreflight.target?.object_id === benchmarkExpectedObjectId, "阻断预检目标必须仍是 beach essentials。");
  assertIncludes(asText(benchmarkBlockedPreflight.target), recommendedLabel);

  const evidenceBlocks = indexById(
    triage.next_unhandled_evidence_drilldown?.business_evidence_blocks,
    "block_id",
  );
  for (const blockId of [
    "diagnosis_path",
    "search_term_metric_summary",
    "search_term_context",
    "targeting_context",
    "placement_context_gap",
    "search_term_boundary",
    "manual_action_path",
    "review_metrics",
  ]) {
    assert(evidenceBlocks[blockId], `下一候选证据链缺少 ${blockId}。`);
  }
  assertIncludes(evidenceBlocks.diagnosis_path.value ?? "", "广告活动 / 广告组");
  assertIncludes(evidenceBlocks.search_term_metric_summary.value ?? "", "订单");
  assertIncludes(evidenceBlocks.search_term_metric_summary.detail ?? "", "ACOS");
  assertIncludes(evidenceBlocks.targeting_context.detail ?? "", "投放词");
  assertIncludes(evidenceBlocks.targeting_context.detail ?? "", "不代表完整关键词库");
  assertIncludes(evidenceBlocks.placement_context_gap.value ?? "", "缺少");
  assertIncludes(evidenceBlocks.search_term_boundary.detail ?? "", "不能自动归因");
  assertIncludes(evidenceBlocks.manual_action_path.value ?? "", "不自动新增关键词");
  assertIncludes(evidenceBlocks.manual_action_path.detail ?? "", "不能自动执行广告动作");
  assertIncludes(evidenceBlocks.review_metrics.value ?? "", "7/14 天复盘");

  const diagnosisContract = triage.next_unhandled_diagnosis_contract ?? triage.diagnosis_contract;
  assert(diagnosisContract?.object_label === nextLabel, "下一候选诊断合同必须绑定下一候选对象。");
  const contractSections = indexById(diagnosisContract?.sections, "section_id");
  for (const sectionId of [
    "parent_asin_scope",
    "ad_asin_coverage",
    "ad_group_boundary",
    "search_term_opportunity",
    "placement_gap",
    "manual_review",
  ]) {
    assert(contractSections[sectionId], `诊断合同缺少 ${sectionId}。`);
  }
  assertIncludes(metricText(contractSections.parent_asin_scope.metrics), productScopeId);
  assertIncludes(metricText(contractSections.parent_asin_scope.metrics), "广告 ASIN");
  assertIncludes(contractSections.ad_asin_coverage.current_judgement ?? "", "不能直接归因");
  assertIncludes(contractSections.ad_group_boundary.current_judgement ?? "", "广告组");
  assertIncludes(metricText(contractSections.search_term_opportunity.metrics), "ACOS");
  assertIncludes(contractSections.search_term_opportunity.current_judgement ?? "", nextLabel);
  assertIncludes(asText(contractSections.placement_gap.evidence_gap), "广告位");
  assertIncludes(asText(contractSections.manual_review.required_evidence), "ManualAction");
  assertIncludes(asText(contractSections.manual_review.required_evidence), "ReviewTodo");
  assertIncludes(contractSections.manual_review.next_manual_step ?? "", "记录观察");
  assertIncludes(contractSections.manual_review.next_manual_step ?? "", "加入复盘");

  const nextDiagnosisContractItems = signalTriageDiagnosisContractItems(triage, diagnosisContract);
  assert(nextDiagnosisContractItems.length >= 6, "前端 helper 应把真实诊断合同转成完整判断块。");
  assert(
    nextDiagnosisContractItems.some((item) => item.sectionId === "search_term_opportunity" && item.title === "广告搜索词表现复核"),
    "搜索词机会诊断合同在用户可见层必须显示为广告搜索词表现复核。",
  );
  const nextDiagnosisContractText = asText(nextDiagnosisContractItems);
  assertIncludes(nextDiagnosisContractText, nextLabel);
  assertIncludes(nextDiagnosisContractText, "SearchTerm + 同广告活动 / 广告组上下文");
  assertIncludes(nextDiagnosisContractText, "ACOS");
  assertIncludes(nextDiagnosisContractText, "广告位");
  assertIncludes(nextDiagnosisContractText, "不能");
  assertIncludes(nextDiagnosisContractText, "记录观察");
  assertIncludes(nextDiagnosisContractText, "加入复盘");

  const nextBusinessEvidenceItems = signalTriageBusinessEvidenceItems(triage, "next_unhandled");
  const runtimeSearchTermReviewChain = buildSearchTermOpportunityReviewChain(
    nextDiagnosisContractItems,
    nextBusinessEvidenceItems,
  );
  assert(runtimeSearchTermReviewChain !== null, "右侧人工确认应能复用真实下一候选的广告搜索词表现复核链。");

  const manualConfirmationEvidenceItems = buildManualConfirmationEvidenceItems(
    nextDiagnosisContractItems,
    runtimeSearchTermReviewChain,
  );
  assert(
    manualConfirmationEvidenceItems.map((item: any) => item.label).join(" / ") ===
      "业务问题 / 当前判断 / 能证明 / 不能证明 / 人工下一步 / 复核路径 / Parent ASIN 入口 / 广告 ASIN 承接 / 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 投放词证据 / 广告位边界 / ABA 背景 / 证据缺口 / 需要补证 / 动作边界",
    "右侧人工确认证据依据必须保留固定业务判断结构和广告搜索词表现复核链。",
  );
  assertIncludes(asText(manualConfirmationEvidenceItems), nextLabel);
  assertIncludes(asText(manualConfirmationEvidenceItems), "Parent ASIN 销售盘");
  assertIncludes(asText(manualConfirmationEvidenceItems), "具体 SearchTerm");
  assertIncludes(asText(manualConfirmationEvidenceItems), "不能");
  assertIncludes(asText(manualConfirmationEvidenceItems), "人工");
  assertIncludes(asText(manualConfirmationEvidenceItems), "投放词");
  assertIncludes(asText(manualConfirmationEvidenceItems), "逐投放上下文");
  assertIncludes(asText(manualConfirmationEvidenceItems), "广告位边界");
  assertIncludes(asText(manualConfirmationEvidenceItems), "ABA");
  assertIncludes(asText(manualConfirmationEvidenceItems), "不得自动");

  const recommendedDiagnosisContract = triage.recommended_diagnosis_contract;
  assert(recommendedDiagnosisContract?.object_label === recommendedLabel, "推荐候选诊断合同必须绑定推荐 SearchTerm。");
  const recommendedDiagnosisContractItems = signalTriageDiagnosisContractItems(triage, recommendedDiagnosisContract);
  const recommendedBusinessEvidenceItems = signalTriageBusinessEvidenceItems(triage, "recommended");
  const recommendedSearchTermReviewChain = buildSearchTermOpportunityReviewChain(
    recommendedDiagnosisContractItems,
    recommendedBusinessEvidenceItems,
  );
  assert(recommendedSearchTermReviewChain !== null, "推荐候选也必须能生成广告搜索词表现复核链。");
  const recommendedReviewChainText = asText(recommendedSearchTermReviewChain);
  assert(recommendedSearchTermReviewChain.reviewLayers.length === 4, "真实广告搜索词表现复核链必须生成四层分层判断。");
  assertIncludes(asText(recommendedSearchTermReviewChain.reviewLayers), "广告组合流判断");
  assertIncludes(asText(recommendedSearchTermReviewChain.reviewLayers), "同组投放商品表现");
  assertIncludes(asText(recommendedSearchTermReviewChain.reviewLayers), "投放词证据");
  assertIncludes(asText(recommendedSearchTermReviewChain.reviewLayers), "广告位边界");
  assertIncludes(asText(recommendedSearchTermReviewChain.reviewLayers), "不能证明某个广告 ASIN 应自动加词");
  assertIncludes(asText(recommendedSearchTermReviewChain.reviewLayers), "不能证明关键词库已完整覆盖");
  assertIncludes(asText(recommendedSearchTermReviewChain.reviewLayers), "不能证明广告位导致");
  assertIncludes(recommendedReviewChainText, recommendedLabel);
  assertIncludes(recommendedReviewChainText, "RBK004-扩展-beach essentials");
  assertIncludes(recommendedReviewChainText, "B016EXMVZS");
  assertIncludes(recommendedReviewChainText, "B07BS9754Q");
  assertIncludes(recommendedReviewChainText, "B016EXMW02");
  assertIncludes(recommendedReviewChainText, "广告组级广告位 0 条 / 同广告活动广告位 6 条");
  assertNotIncludes(recommendedReviewChainText, "广告组合流判断待补");
  assertNotIncludes(recommendedReviewChainText, "同组投放商品表现待补");

  const nextSignal = signalFromCandidate(triage.next_unhandled_candidate);
  const diagnosisEvidenceSummary = buildSignalDiagnosisEvidenceSummary(nextSignal, nextDiagnosisContractItems);
  assert(diagnosisEvidenceSummary !== null, "中间诊断区应能从真实诊断合同生成证据强度摘要。");
  assertIncludes(diagnosisEvidenceSummary?.objectReadback ?? "", nextLabel);
  assertIncludes(diagnosisEvidenceSummary?.objectReadback ?? "", "与右侧 ManualAction / ReviewTodo / ReviewRecord");
  assertIncludes(diagnosisEvidenceSummary?.businessQuestion ?? "", "人工");
  assertIncludes(diagnosisEvidenceSummary?.proves ?? "", "能证明");
  assertIncludes(diagnosisEvidenceSummary?.doesNotProve ?? "", "不能");
  assertIncludes(diagnosisEvidenceSummary?.nextManualStep ?? "", "复盘");

  const metricDecisionItems = buildSignalMetricDecisionItems(
    {
      impressions: 0,
      clicks: 0,
      cost: 8.38,
      orders: 3,
      sales: 38.45,
      acos: 0.218,
      cvr: 0.375,
      cpc: 0,
    },
    nextDiagnosisContractItems,
  );
  const spendMetricDecision = metricDecisionItems.find((item: any) => item.label === "花费");
  const ordersMetricDecision = metricDecisionItems.find((item: any) => item.label === "订单");
  const acosMetricDecision = metricDecisionItems.find((item: any) => item.label === "ACOS");
  assertIncludes(asText(metricDecisionItems), "用于判断");
  assertIncludes(asText(metricDecisionItems), "能证明");
  assertIncludes(asText(metricDecisionItems), "不能");
  assertIncludes(asText(metricDecisionItems), "人工");
  assertIncludes(spendMetricDecision?.purpose ?? "", "零成本偶然样本");
  assertIncludes(ordersMetricDecision?.purpose ?? "", "真实店内广告转化");
  assertIncludes(acosMetricDecision?.purpose ?? "", "不是自动调价依据");

  const readinessSummary = buildReviewReadinessGateSummary(triage);
  assert(readinessSummary?.status === "waiting", "历史待办证据链治理完成后，应等待 7/14 天复盘窗口，而不是继续显示证据门禁阻断。");
  assertIncludes(readinessSummary?.title ?? "", "复盘等待窗口");
  assertIncludes(readinessSummary?.primary ?? "", "最早广告复盘");
  assertIncludes(readinessSummary?.primary ?? "", "2026-06-30");
  assertIncludes(readinessSummary?.detail ?? "", "7 天 / 14 天复盘窗口尚未到期");
  assertIncludes(readinessSummary?.boundary ?? "", "不拉取快照");
  assertIncludes(readinessSummary?.boundary ?? "", "不保存复盘结论");
  assertIncludes(readinessSummary?.boundary ?? "", "不自动执行广告动作");
  assertIncludes(asText(readinessSummary?.nextSteps), "2026-06-30");
  assertIncludes(asText(readinessSummary?.nextSteps), "ready 复盘");
  assertIncludes(readinessSummary?.queueSeparation?.primary ?? "", reviewObjectLabel);
  assertIncludes(readinessSummary?.queueSeparation?.primary ?? "", nextLabel);
  assertIncludes(readinessSummary?.queueSeparation?.items[2]?.value ?? "", "条证据");
  assertIncludes(readinessSummary?.queueSeparation?.items[2]?.value ?? "", "对象复核链齐全");
  assertNotIncludes(readinessSummary?.queueSeparation?.items[2]?.value ?? "", "对象复核链缺口");
  assertNotIncludes(readinessSummary?.queueSeparation?.items[2]?.value ?? "", "对象引用缺口");

  const repairSummary = buildReviewEvidenceRepairSummary(repair);
  assert(repairSummary?.status === "ready", "历史待办缺口治理完成后，应展示为没有历史证据快照缺口。");
  assertIncludes(repairSummary?.primary ?? "", "当前没有历史证据快照缺口");
  assertIncludes(repairSummary?.boundary ?? "", "will_write=false");
  assertIncludes(repairSummary?.boundary ?? "", "不能补写历史 evidence_snapshot");
  assertIncludes(repairSummary?.boundary ?? "", "不能保存 ReviewRecord");
  assertIncludes(repairSummary?.boundary ?? "", "不能自动执行广告动作");
  assertIncludes(repairSummary?.items[0]?.value ?? "", "0 个");
  assertIncludes(repairSummary?.items[1]?.value ?? "", "4 条");
  assert((repairSummary?.voidPlanItems ?? []).length === 0, "没有历史缺口时不应再暴露 dry-run 作废计划。");
  assertNotIncludes(repairSummary?.detail ?? "", "保存 ready");

  const preview = triage.next_unhandled_candidate?.manual_action_preview;
  assert(preview?.object_id, "下一候选应带只读人工动作预览对象 ID。");
  const preflightScope = encodeURIComponent(productScopeId);
  const expectedObjectType = encodeURIComponent(preview.object_type);
  const expectedObjectId = encodeURIComponent(preview.object_id);
  const actionType = encodeURIComponent(preview.action_type || "add_to_review");
  const preflight = await fetchJson(
    `/api/manual-action/preflight?market_id=${marketId}&product_scope_id=${preflightScope}&expected_object_type=${expectedObjectType}&expected_object_id=${expectedObjectId}&action_type=${actionType}`,
  );
  assert(preflight.status === "ready_for_explicit_manual_write", "下一候选应通过只读写入前验收。");
  const authorizationSummary = manualActionAuthorizationReadinessSummary(preflight);
  assert(authorizationSummary?.tone === "ready", "下一候选应显示为待人工授权写入，而不是已处理。");
  assertIncludes(authorizationSummary?.target ?? "", nextLabel);
  assertIncludes(authorizationSummary?.currentState ?? "", "ManualAction 0 条 / ReviewTodo 0 条");
  assertIncludes(authorizationSummary?.authorizedResult ?? "", "ManualAction 1 条 / ReviewTodo 2 条");
  assertIncludes(authorizationSummary?.authorizedResult ?? "", "7d / 14d");
  const evidenceSnapshotCount = preflight.evidence_snapshot_preview?.item_count ?? 0;
  assert(evidenceSnapshotCount === 30, "新 SearchTerm 预检应保存搜索词表现判断后的 30 条证据快照。");
  assert(evidenceSnapshotCount >= 27, "下一候选预检应包含 Parent ASIN、广告 ASIN、逐投放上下文和广告位活动级背景后的完整证据快照。");
  assertIncludes(authorizationSummary?.evidence ?? "", `${evidenceSnapshotCount} 条`);
  assertIncludes(authorizationSummary?.boundary ?? "", "未授权前不写 manual_actions");
  assertIncludes(authorizationSummary?.boundary ?? "", "不生成 ReviewTodo");
  const evidenceReadinessSummary = manualConfirmationEvidenceReadinessSummary(
    manualConfirmationEvidenceItems,
    manualActionPreflightEvidenceRows(preflight, 30),
  );
  assert(evidenceReadinessSummary?.tone === "ready", "真实下一候选的页面证据依据必须和将保存的 evidence_snapshot 对齐。");
  const evidenceReadinessText = asText(evidenceReadinessSummary);
  assertIncludes(evidenceReadinessText, "业务判断");
  assertIncludes(evidenceReadinessText, "证明边界");
  assertIncludes(evidenceReadinessText, "广告搜索词表现复核链");
  assertIncludes(evidenceReadinessText, "evidence_snapshot 对齐");
  assertIncludes(evidenceReadinessText, "未授权前不写 manual_actions");
  const diagnosisBridgeSummary = manualConfirmationDiagnosisBridgeSummary(
    diagnosisEvidenceSummary,
    manualConfirmationEvidenceItems,
    evidenceReadinessSummary,
  );
  assert(diagnosisBridgeSummary?.tone === "ready", "真实下一候选的中间诊断必须和右侧人工留痕证据贯通。");
  const diagnosisBridgeText = asText(diagnosisBridgeSummary);
  assertIncludes(diagnosisBridgeText, "中间诊断、右侧证据依据");
  assertIncludes(diagnosisBridgeText, nextLabel);
  assertIncludes(diagnosisBridgeText, "证据缺口");
  assertIncludes(diagnosisBridgeText, "evidence_snapshot");
  assertIncludes(diagnosisBridgeText, "未授权前不写 manual_actions");
  const routeSplitSummary = manualActionReviewRouteSplitSummary(triage, nextSignalId, authorizationSummary);
  assert(routeSplitSummary?.tone === "ready", "选中下一候选且预检 ready 时，双轨分流应展示为可人工授权。");
  const routeSplitText = asText(routeSplitSummary);
  assertIncludes(routeSplitText, recommendedLabel);
  assertIncludes(routeSplitText, nextLabel);
  assertIncludes(routeSplitText, "已留痕旧对象");
  assertIncludes(routeSplitText, "待授权新对象");
  assertIncludes(routeSplitText, "ManualAction 0 条 / ReviewTodo 0 条");
  assertIncludes(routeSplitText, "ManualAction 1 条 / ReviewTodo 2 条");
  assertIncludes(routeSplitText, "ready 只代表可人工确认");
  assertIncludes(routeSplitText, "不能互借证据");
  const recommendedRouteSplitSummary = manualActionReviewRouteSplitSummary(triage, recommendedSignalId, authorizationSummary);
  assert(recommendedRouteSplitSummary?.tone === "blocked", "选中已留痕推荐对象时，双轨分流应阻断重复写入。");
  assertIncludes(asText(recommendedRouteSplitSummary), "先切换候选");
  assert(preflight.target?.object_id === preview.object_id, "预检目标必须等于下一候选对象 ID。");
  assert(preflight.target?.object_label === nextLabel, "预检目标展示名必须等于下一候选。");
  assert((preflight.evidence_snapshot_preview?.item_count ?? 0) >= 4, "下一候选应有可保存的点击时证据快照预览。");
  const preflightSnapshotText = JSON.stringify(preflight.evidence_snapshot_preview ?? {});
  assertIncludes(preflightSnapshotText, nextLabel);
  assertIncludes(preflightSnapshotText, "排查路径");
  assertIncludes(preflightSnapshotText, "AI 准入");
  assertIncludes(preflightSnapshotText, "搜索词表现判断");
  assertIncludes(preflightSnapshotText, "扩量复核");
  assertIncludes(preflightSnapshotText, "只用于人工复核优先级");
  assertIncludes(preflightSnapshotText, "搜索词边界");
  assertIncludes(preflightSnapshotText, "广告位边界");
  assertIncludes(preflightSnapshotText, "广告位证据缺口");
  assertIncludes(preflightSnapshotText, "需要补证");
  assertIncludes(preflightSnapshotText, "投放词证据");
  assertIncludes(preflightSnapshotText, "ABA 背景");
  assertIncludes(preflightSnapshotText, "证据缺口");
  assertIncludes(preflightSnapshotText, "动作边界");
  assertNotIncludes(preflightSnapshotText, `${recommendedLabel}：推荐对象`);

  const preflightEvidenceText = manualActionPreflightEvidenceSnapshotText(preflight) ?? "";
  assertIncludes(preflightEvidenceText, "人工点击后才保存");
  assertIncludes(preflightEvidenceText, "不执行广告动作");
  const preflightEvidenceRows = manualActionPreflightEvidenceRows(preflight, 30);
  const priorityEvidenceRows = manualActionPreflightPriorityEvidenceRows(preflight);
  const priorityEvidenceText = JSON.stringify(priorityEvidenceRows);
  assert(preflightEvidenceRows.some((item) => item.label === "搜索词边界" && item.source), "完整证据快照预览应展示搜索词边界及来源。");
  assert(preflightEvidenceRows.some((item) => item.label === "广告位边界" && item.source), "完整证据快照预览应展示广告位边界及来源。");
  assertIncludes(priorityEvidenceText, "AI 准入");
  assertIncludes(priorityEvidenceText, "搜索词表现分组");
  assertIncludes(priorityEvidenceText, "搜索词表现判断");
  assertIncludes(priorityEvidenceText, "同组投放商品表现");
  assertIncludes(priorityEvidenceText, "逐投放上下文");
  assertIncludes(priorityEvidenceText, "投放词证据");
  assertIncludes(priorityEvidenceText, "ABA 背景");
  assertIncludes(priorityEvidenceText, "搜索词边界");
  assertIncludes(priorityEvidenceText, "广告位边界");
  assertIncludes(priorityEvidenceText, "广告位活动级背景");
  assertIncludes(priorityEvidenceText, "证据缺口");
  assertIncludes(priorityEvidenceText, "需要补证");
  assertIncludes(priorityEvidenceText, "动作边界");
  assertOrderedLabels(
    priorityEvidenceRows.map((item) => item.label),
    [
      "AI 准入",
      "搜索词",
      "搜索词表现分组",
      "搜索词表现判断",
      "Parent ASIN入口",
      "广告 ASIN承接",
      "广告组合流判断",
      "同组投放商品表现",
      "逐投放上下文",
      "投放词证据",
      "搜索词边界",
      "广告位边界",
      "广告位活动级背景",
      "ABA 背景",
      "证据缺口",
      "需要补证",
      "动作边界",
    ],
    "SearchTerm 右侧人工确认优先证据链",
  );

  const encodedRecommendedSignalId = encodeURIComponent(recommendedSignalId);
  const manualActions = await fetchJson(`/api/signals/${encodedRecommendedSignalId}/manual-actions?market_id=${marketId}`);
  const reviewTodos = await fetchJson(`/api/signals/${encodedRecommendedSignalId}/review-todos?market_id=${marketId}`);
  assert(Array.isArray(manualActions) && manualActions.length > 0, "推荐对象应能读回已保存人工留痕。");
  assert(Array.isArray(reviewTodos) && reviewTodos.length >= 2, "推荐对象应能读回 7d / 14d 复盘待办。");
  const latestManualAction = manualActions[manualActions.length - 1];
  const readbackPathItems = buildManualActionReadbackPathItems({
    latestManualAction,
    reviewTodos,
    reviewRecords: [],
  });
  const readbackText = JSON.stringify(readbackPathItems);
  assertIncludes(readbackText, "待办证据快照");
  assertIncludes(readbackText, "7d 29 条");
  assertIncludes(readbackText, "14d 29 条");
  assertIncludes(readbackText, "排查路径");
  assertIncludes(readbackText, "AI 准入");
  assertIncludes(readbackText, "搜索词边界");
  assertIncludes(readbackText, "广告位边界");
  assertIncludes(readbackText, "未到期不判断效果");
  const readbackConsistencyText = manualActionReadbackConsistencyText(latestManualAction, reviewTodos, []);
  assertIncludes(readbackConsistencyText, "待办证据快照");
  assertIncludes(readbackConsistencyText, "可回看对象引用");
  assertIncludes(readbackConsistencyText, "排查路径");
  assertIncludes(readbackConsistencyText, "尚未保存复盘结论");
  const rawReviewTodoForObjectGate = reviewTodos.find((todo: any) => todo.review_window === "7d") ?? reviewTodos[0];
  const reviewTodoForObjectGate = {
    ...rawReviewTodoForObjectGate,
    evidence_snapshot: [
      ...(rawReviewTodoForObjectGate.evidence_snapshot ?? []),
      {
        label: "Parent ASIN入口",
        value: "当前 Parent ASIN B00K4W4AAA 下只复核广告搜索词表现",
        detail: "Parent ASIN 是经营入口；没有广告数据的子 ASIN 不进入广告搜索词复核。",
        source: "diagnosis_contract + sales_performance",
      },
      {
        label: "广告 ASIN承接",
        value: "广告 ASIN B016EXMVZS / B016EXMW02 承接该搜索词上下文",
        detail: "只说明这些广告 ASIN 具备广告承接证据，不能把搜索词自动归因到单个 ASIN。",
        source: "diagnosis_contract + advertised_products",
      },
      {
        label: "搜索词表现判断",
        value: "扩量复核：订单 23 / ACOS 20.27%；只用于人工复核优先级",
        detail: "不自动加词、否词、调价或暂停广告。",
        source: "ad_search_term_daily_metrics",
      },
      {
        label: "同组投放商品表现",
        value: "B016EXMVZS 与 B016EXMW02 同组投放表现已回看",
        detail: "只说明同广告组内广告商品承接差异，不能把搜索词自动归因到单个广告 ASIN。",
        source: "advertised_products + ad_product_daily_metrics",
      },
      {
        label: "逐投放上下文",
        value: "beach essentials：优先复核 RBK004-beach essentials-精准（测试）及其投放词 beach essentials",
        detail: "复盘时必须按当时的广告组、投放词和广告 ASIN 承接顺序回看，不能把聚合指标解释成自动加词、否词或调价。",
        source: "ad_search_term_daily_metrics",
      },
      {
        label: "投放词证据",
        value: "beach essentials / 1 个",
        detail: "投放词来自搜索词表现行，不代表完整关键词库，不能自动加词、否词或调价。",
        source: "ad_search_term_daily_metrics",
      },
    ],
  };
  const reviewTodoEvidenceReadback = buildReviewTodoEvidenceReadbackSummary(reviewTodoForObjectGate);
  assert(reviewTodoEvidenceReadback?.tone === "ready", "完整 ReviewTodo 广告搜索词表现复核链应允许进入到期后只读复盘。");
  const reviewTodoEvidenceReadbackText = asText(reviewTodoEvidenceReadback);
  assertIncludes(reviewTodoEvidenceReadbackText, "复盘待办证据回读核对");
  assertIncludes(reviewTodoEvidenceReadbackText, "业务判断");
  assertIncludes(reviewTodoEvidenceReadbackText, "诊断路径");
  assertIncludes(reviewTodoEvidenceReadbackText, "广告搜索词表现复核链");
  assertIncludes(reviewTodoEvidenceReadbackText, "搜索词表现判断");
  assertIncludes(reviewTodoEvidenceReadbackText, "投放词证据");
  assertIncludes(reviewTodoEvidenceReadbackText, "需要补证");
  assertNotIncludes(reviewTodoEvidenceReadbackText, "缺：投放词证据");
  assertIncludes(reviewTodoEvidenceReadbackText, "不执行广告动作");
  const simulatedReadyEffect = {
    signal_id: reviewTodoForObjectGate.signal_id,
    action_id: reviewTodoForObjectGate.action_id,
    action_type: reviewTodoForObjectGate.action_type,
    shop_id: reviewTodoForObjectGate.shop_id,
    market_id: reviewTodoForObjectGate.market_id,
    object_type: reviewTodoForObjectGate.object_type,
    object_id: reviewTodoForObjectGate.object_id,
    object_label: reviewTodoForObjectGate.object_label,
    review_window: reviewTodoForObjectGate.review_window,
    status: "ready",
    result: "unclear",
    message: "只读 smoke 模拟 ready，用于验证 ReviewRecord 保存前门槛，不写入 ReviewRecord。",
    before_start_date: "2026-06-01",
    before_end_date: "2026-06-07",
    after_start_date: "2026-06-09",
    after_end_date: "2026-06-15",
    before_metrics: { cost: 10, orders: 1, sales: 20, acos: 0.5 },
    after_metrics: { cost: 8, orders: 2, sales: 50, acos: 0.16 },
  } as const;
  const reviewEffectWindowLedger = buildReviewEffectWindowLedger(reviewTodoForObjectGate, simulatedReadyEffect);
  assert(reviewEffectWindowLedger.tone === "ready", "模拟 ready 指标应展示可人工保存状态。");
  assertIncludes(reviewEffectWindowLedger.beforeWindow, "2026-06-01");
  assertIncludes(reviewEffectWindowLedger.afterWindow, "2026-06-15");
  assertIncludes(reviewEffectWindowLedger.metricCoverage, "花费、订单、销售额、ACOS");
  assertIncludes(reviewEffectWindowLedger.nextStep, "只保存 ReviewRecord");
  assertIncludes(reviewEffectWindowLedger.boundary, "不证明所有业务变化");
  const reviewRecordPreflight = buildReviewRecordPreflightChecklist(reviewTodoForObjectGate, simulatedReadyEffect, {
    requestSignalId: reviewTodoForObjectGate.signal_id,
    stateSignalId: reviewTodoForObjectGate.signal_id,
    objectType: reviewTodoForObjectGate.object_type,
    objectId: reviewTodoForObjectGate.object_id,
  });
  const reviewRecordPreflightText = JSON.stringify(reviewRecordPreflight);
  assertIncludes(reviewRecordPreflightText, "核对待办证据对象引用");
  assertIncludes(reviewRecordPreflightText, "对象引用可回看");
  assertIncludes(reviewRecordPreflightText, "回看投放词证据");
  assertIncludes(reviewRecordPreflightText, "回看广告组合流判断");
  assertIncludes(reviewRecordPreflightText, "回看 ABA 背景");
  assertIncludes(reviewRecordPreflightText, "回看证据缺口");
  assertIncludes(reviewRecordPreflightText, "回看需要补证");
  assertIncludes(reviewRecordPreflightText, "回看动作边界");
  assertNotIncludes(reviewRecordPreflightText, "缺少投放词证据");
  assertNotIncludes(reviewRecordPreflightText, "缺少广告组合流判断");
  assertNotIncludes(reviewRecordPreflightText, "缺少 ABA 背景");
  assertNotIncludes(reviewRecordPreflightText, "缺少证据缺口");
  assertNotIncludes(reviewRecordPreflightText, "缺少需要补证");
  assertNotIncludes(reviewRecordPreflightText, "缺少动作边界");
  assert(
    canSaveReviewRecordWithPreflight(simulatedReadyEffect, reviewRecordPreflight),
    "完整 ReviewTodo 广告搜索词表现复核链且指标 ready 时，前端预检应允许人工保存 ReviewRecord。",
  );
}

main().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
