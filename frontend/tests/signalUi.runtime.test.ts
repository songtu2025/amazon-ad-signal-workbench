declare const process: {
  env: Record<string, string | undefined>;
  exitCode?: number;
};

import {
  buildManualConfirmationEvidenceItems,
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
  assertIncludes(evidenceBlocks.targeting_context.detail ?? "", "sunglasses for kids");
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
  assert(runtimeSearchTermReviewChain !== null, "右侧人工确认应能复用真实下一候选的搜索词机会复核链。");

  const manualConfirmationEvidenceItems = buildManualConfirmationEvidenceItems(
    nextDiagnosisContractItems,
    runtimeSearchTermReviewChain,
  );
  assert(
    manualConfirmationEvidenceItems.map((item: any) => item.label).join(" / ") ===
      "业务问题 / 当前判断 / 能证明 / 不能证明 / 人工下一步 / 投放词证据 / 广告组合流判断 / ABA 背景 / 证据缺口 / 动作边界",
    "右侧人工确认证据依据必须保留固定业务判断结构和搜索词机会复核链。",
  );
  assertIncludes(asText(manualConfirmationEvidenceItems), nextLabel);
  assertIncludes(asText(manualConfirmationEvidenceItems), "不能");
  assertIncludes(asText(manualConfirmationEvidenceItems), "人工");
  assertIncludes(asText(manualConfirmationEvidenceItems), "投放词");
  assertIncludes(asText(manualConfirmationEvidenceItems), "ABA");
  assertIncludes(asText(manualConfirmationEvidenceItems), "不得自动");

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
  assert(readinessSummary?.status === "blocked", "当前历史 ReviewTodo 缺少搜索词复核链，应被复盘证据门禁阻断。");
  assertIncludes(readinessSummary?.detail ?? "", "缺少投放词证据");
  assertIncludes(readinessSummary?.detail ?? "", "缺少广告组合流判断");
  assertIncludes(readinessSummary?.boundary ?? "", "广告组合流判断");
  assertIncludes(readinessSummary?.boundary ?? "", "不自动执行广告动作");
  assertIncludes(asText(readinessSummary?.nextSteps), "不能静默补写历史 evidence_snapshot");
  assertIncludes(readinessSummary?.queueSeparation?.primary ?? "", recommendedLabel);
  assertIncludes(readinessSummary?.queueSeparation?.primary ?? "", nextLabel);
  assertIncludes(readinessSummary?.queueSeparation?.items[2]?.value ?? "", "17 条证据");
  assertIncludes(readinessSummary?.queueSeparation?.items[2]?.value ?? "", "搜索词复核链缺口");
  assertNotIncludes(readinessSummary?.queueSeparation?.items[2]?.value ?? "", "对象引用缺口");

  const repairSummary = buildReviewEvidenceRepairSummary(repair);
  assert(repairSummary?.status === "blocked", "历史待办治理不能把搜索词复核链阻断展示成 ready。");
  assertIncludes(repairSummary?.primary ?? "", "历史动作缺证据");
  assertIncludes(repairSummary?.detail ?? "", "重建当前证据预览");
  const repairSampleText = asText(repairSummary?.sampleItems);
  assertIncludes(repairSampleText, "search_term / beach essentials");
  assertIncludes(repairSampleText, "有投放词证据");
  assertIncludes(repairSampleText, "有广告组合流判断");
  assertIncludes(repairSampleText, "有 ABA 背景");
  assertIncludes(repairSampleText, "有证据缺口");
  assertIncludes(repairSampleText, "有动作边界");
  assertIncludes(repairSampleText, "当前不可重新留痕");
  assertIncludes(repairSampleText, "dry-run 可预检");
  assertIncludes(repairSampleText, "真实作废未执行");
  assertIncludes(repairSampleText, "作废对象：search_term / search_term:1:beach essentials");
  assertIncludes(repairSampleText, "复盘窗口：7d / 14d");
  assertIncludes(repairSampleText, "作废后：搜索词旧待办作废后仍不是复盘完成");
  assertIncludes(repairSampleText, "重新留痕：重新点击“加入复盘”时必须保存新的 ManualAction 和 7d / 14d ReviewTodo");
  assertIncludes(repairSampleText, "广告组合流");
  assertIncludes(repairSampleText, "投放词");
  assertIncludes(repairSampleText, "ABA");
  assertIncludes(repairSampleText, "VOID_TODO:manual-action-d958bfd5cef04a538547bb4c19c48e6f:all");
  assertIncludes(repairSampleText, "apply_review_todo_void_once.py");
  assertIncludes(repairSampleText, "只写 review_todo_decisions");
  assertIncludes(repairSampleText, "不修改 manual_actions");
  assertIncludes(repairSampleText, "不保存 ReviewRecord");
  assertNotIncludes(repairSampleText, "--execute");
  assert(repairSummary?.voidPlanItems[0]?.objectText === "search_term / search_term:1:beach essentials", "历史治理应暴露作废对象。");
  assert(
    repairSummary?.voidPlanItems[0]?.statusText === "dry-run 可预检；真实作废未执行",
    "历史治理应暴露作废计划状态。",
  );
  assert(repairSummary?.voidPlanItems[0]?.reviewWindows === "7d / 14d", "历史治理应暴露 7d / 14d 复盘窗口。");
  assertIncludes(repairSummary?.voidPlanItems[0]?.afterVoidText ?? "", "搜索词旧待办作废后仍不是复盘完成");
  assertIncludes(repairSummary?.voidPlanItems[0]?.recreateText ?? "", "广告组合流");
  assertIncludes(repairSummary?.voidPlanItems[0]?.recreateText ?? "", "投放词");
  assertIncludes(repairSummary?.voidPlanItems[0]?.recreateText ?? "", "ABA");
  assertIncludes(
    repairSummary?.voidPlanItems[0]?.authorizationCode ?? "",
    "VOID_TODO:manual-action-d958bfd5cef04a538547bb4c19c48e6f:all",
  );
  assertIncludes(repairSummary?.voidPlanItems[0]?.dryRunCommand ?? "", "apply_review_todo_void_once.py");
  assertNotIncludes(repairSummary?.voidPlanItems[0]?.dryRunCommand ?? "", "--execute");
  assertIncludes(repairSummary?.voidPlanItems[0]?.boundary ?? "", "只写 review_todo_decisions");
  assertIncludes(asText(repairSummary?.nextSteps), "不能静默补写历史 evidence_snapshot");
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
  assertIncludes(authorizationSummary?.evidence ?? "", "22 条");
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
  assertIncludes(evidenceReadinessText, "搜索词复核链");
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
  const preflightEvidenceRows = manualActionPreflightEvidenceRows(preflight);
  const priorityEvidenceRows = manualActionPreflightPriorityEvidenceRows(preflight);
  const priorityEvidenceText = JSON.stringify(priorityEvidenceRows);
  assert(preflightEvidenceRows.some((item) => item.label === "搜索词边界" && item.source), "完整证据快照预览应展示搜索词边界及来源。");
  assert(preflightEvidenceRows.some((item) => item.label === "广告位边界" && item.source), "完整证据快照预览应展示广告位边界及来源。");
  assertIncludes(priorityEvidenceText, "AI 准入");
  assertIncludes(priorityEvidenceText, "投放词证据");
  assertIncludes(priorityEvidenceText, "ABA 背景");
  assertIncludes(priorityEvidenceText, "搜索词边界");
  assertIncludes(priorityEvidenceText, "广告位边界");
  assertIncludes(priorityEvidenceText, "证据缺口");

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
  assertIncludes(readbackText, "7d 17 条");
  assertIncludes(readbackText, "14d 17 条");
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
  const reviewTodoForObjectGate = reviewTodos.find((todo: any) => todo.review_window === "7d") ?? reviewTodos[0];
  const reviewTodoEvidenceReadback = buildReviewTodoEvidenceReadbackSummary(reviewTodoForObjectGate);
  assert(reviewTodoEvidenceReadback?.tone === "blocked", "历史 ReviewTodo 缺搜索词复核链时，待办证据回读应先显示 blocked。");
  const reviewTodoEvidenceReadbackText = asText(reviewTodoEvidenceReadback);
  assertIncludes(reviewTodoEvidenceReadbackText, "复盘待办证据回读核对");
  assertIncludes(reviewTodoEvidenceReadbackText, "业务判断");
  assertIncludes(reviewTodoEvidenceReadbackText, "诊断路径");
  assertIncludes(reviewTodoEvidenceReadbackText, "搜索词复核链");
  assertIncludes(reviewTodoEvidenceReadbackText, "缺：投放词证据 / 广告组合流判断 / ABA 背景 / 证据缺口 / 动作边界");
  assertIncludes(reviewTodoEvidenceReadbackText, "当前待办没有广告组合流判断");
  assertIncludes(reviewTodoEvidenceReadbackText, "不能直接保存可复盘结论");
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
  assertIncludes(reviewRecordPreflightText, "回看动作边界");
  assertIncludes(reviewRecordPreflightText, "缺少投放词证据");
  assertIncludes(reviewRecordPreflightText, "缺少广告组合流判断");
  assertIncludes(reviewRecordPreflightText, "缺少 ABA 背景");
  assertIncludes(reviewRecordPreflightText, "缺少证据缺口");
  assertIncludes(reviewRecordPreflightText, "缺少动作边界");
  assert(
    !canSaveReviewRecordWithPreflight(simulatedReadyEffect, reviewRecordPreflight),
    "历史 ReviewTodo 缺少搜索词复核链时不能保存 ReviewRecord。",
  );
}

main().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
