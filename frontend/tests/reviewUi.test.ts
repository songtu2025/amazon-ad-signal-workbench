import {
  buildReviewTodoQueueDetails,
  buildReviewTodoScopeHint,
  buildReviewTodoQueueSummary,
  reviewContextText,
  buildRuleImprovementReadiness,
  buildReviewRecordPreflightChecklist,
  buildReviewRecordSaveGateSummary,
  buildReviewRecordSavePathSummary,
  buildReviewTodoDecisionReadbackSummary,
  buildReviewTodoEvidenceReadbackSummary,
  buildReviewEffectWindowLedger,
  buildRuleFeedbackCandidate,
  buildManualActionEvidenceSnapshot,
  buildManualActionDisplayEvidenceSnapshot,
  manualActionExpectedTargetForSignal,
  buildManualActionIdentityGateItems,
  buildManualActionPathSteps,
  buildManualActionReadbackPathItems,
  buildManualActionRequestPayload,
  buildSignalManualActionEvidenceSnapshot,
  buildSearchIntentManualActionEvidenceSnapshot,
  mergeManualActionEvidenceSnapshots,
  canSaveReviewEffect,
  canSaveReviewRecordWithPreflight,
  filterReviewTodosByProductScope,
  manualActionBoundaryText,
  manualActionEmptyStateText,
  manualActionEvidenceSnapshotText,
  manualActionEvidenceReasonText,
  manualActionSavableEvidenceReasonText,
  manualActionIntentText,
  manualActionButtonGate,
  manualActionButtonExpectationText,
  manualActionPreflightErrorForAction,
  manualActionPreflightForAction,
  manualActionWriteGuardMessage,
  manualActionPostWriteExpectationText,
  manualActionPostWriteExpectationSummaryText,
  manualActionPostWritePreflightReadErrorText,
  manualActionPostWriteReadbackMessage,
  manualActionAuthorizationReadinessSummary,
  manualConfirmationEvidenceReadinessSummary,
  manualConfirmationDiagnosisBridgeSummary,
  buildManualActionPostWritePreflightRequest,
  buildManualReviewClosureLedger,
  manualActionPreflightEvidenceSnapshotText,
  manualActionPreflightPriorityEvidenceRows,
  manualActionPreflightStatusText,
  manualActionReadbackCompactText,
  manualActionReadbackConsistencyText,
  hasReviewRecordReadbackMatch,
  ManualActionForUi,
  reviewApplicabilityBoundaryText,
  reviewTodoScopeHintText,
  buildReviewRecordReadbackTarget,
  buildReviewRecordRequestPayload,
  reviewCheckpointText,
  reviewEffectTargetReadbackText,
  reviewEffectWindowText,
  reviewMetricComparisonRows,
  ReviewEffectForUi,
  ReviewRecordForUi,
  ReviewTodoForUi,
  reviewRecordStatusText,
  reviewRecordTargetReadbackText,
  reviewRecordSignalIdForTodo,
  reviewEffectSummaryText,
  reviewTargetReadbackText,
  reviewTodoStatusText,
  reviewRecordReadbackStatus,
  reviewTodoEmptyStateText,
  selectManualActionsForSignal,
  selectNextReviewTodo,
  selectReviewTodosForSignal,
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
    throw new Error(`不应包含 ${expected}，实际 ${actual}`);
  }
}

const dueTodo: ReviewTodoForUi = {
  review_window: "7d",
  due_at: "2026-06-08T00:00:00+00:00",
  is_due: true,
};

const pendingTodo: ReviewTodoForUi = {
  review_window: "14d",
  due_at: "2026-06-15T00:00:00+00:00",
  is_due: false,
};

const completeReviewTodoEvidenceSnapshot = [
  { label: "排查路径", value: "Parent ASIN -> 广告 ASIN B016EXMW02 -> 广告组 -> 搜索词 / 广告位", source: "business_rule" },
  { label: "AI 准入", value: "允许人工留痕，不执行广告动作", source: "actionability_status" },
  { label: "搜索词边界", value: "搜索词只说明同广告组上下文", source: "business_rule" },
  { label: "广告位边界", value: "广告位缺口不能自动归因", source: "business_rule" },
];

const dueTodoWithCompleteEvidence: ReviewTodoForUi = {
  ...dueTodo,
  object_type: "advertised_product",
  object_id: "B016EXMW02",
  object_label: "B016EXMW02",
  evidence_snapshot: completeReviewTodoEvidenceSnapshot,
};

const pendingTodoWithCompleteEvidence: ReviewTodoForUi = {
  ...pendingTodo,
  object_type: "advertised_product",
  object_id: "B016EXMW02",
  object_label: "B016EXMW02",
  evidence_snapshot: completeReviewTodoEvidenceSnapshot,
};

assertEqual(reviewTodoStatusText(dueTodo), "7 天复盘已到期");
assertEqual(reviewTodoStatusText(pendingTodo), "14 天复盘未到期");
assertEqual(selectNextReviewTodo([pendingTodo, dueTodo])?.review_window, "7d");
assertEqual(selectNextReviewTodo([]), null);

const queueSummary = buildReviewTodoQueueSummary([
  {
    ...pendingTodo,
    signal_id: "sig-pending",
    object_label: "搜索词 12 month sunglasses",
  },
  {
    ...dueTodo,
    signal_id: "sig-due",
    object_label: "广告 ASIN B016EXMW02",
  },
]);
assertEqual(queueSummary.total, 2);
assertEqual(queueSummary.due, 1);
assertEqual(queueSummary.pending, 1);
assertEqual(queueSummary.text, "复盘待办 2 条 / 到期 1 条");
assertEqual(queueSummary.next?.signal_id, "sig-due");
assertEqual(queueSummary.nextLabel, "广告 ASIN B016EXMW02");
assertEqual(queueSummary.nextDueDate, "2026-06-08");
assertIncludes(queueSummary.description, "只代表已进入复盘窗口");
assertIncludes(queueSummary.description, "到期待办仍需人工确认后保存 ReviewRecord");
assertIncludes(queueSummary.description, "不自动改规则");
assertIncludes(queueSummary.description, "不执行广告动作");

const legacyEvidenceQueueSummary = buildReviewTodoQueueSummary([
  { ...pendingTodo, signal_id: "sig-legacy-pending", evidence_snapshot: [] },
  { ...dueTodo, signal_id: "sig-legacy-due", evidence_snapshot: null },
]);
assertIncludes(legacyEvidenceQueueSummary.description, "历史旧留痕缺少证据快照");
assertIncludes(legacyEvidenceQueueSummary.description, "新人工动作已要求保存证据快照");

const pendingOnlyQueueSummary = buildReviewTodoQueueSummary([
  {
    ...pendingTodo,
    signal_id: "sig-pending-next",
    object_label: "B016EXMVZS",
    due_at: "2026-06-22T01:13:51+00:00",
  },
]);
assertIncludes(pendingOnlyQueueSummary.description, "下一项：B016EXMVZS / 2026-06-22");
assertIncludes(pendingOnlyQueueSummary.description, "未到期前不保存复盘结论");
assertIncludes(pendingOnlyQueueSummary.description, "未到期前不拉取复盘快照");
assertIncludes(pendingOnlyQueueSummary.description, "不保存 ReviewRecord");
assertIncludes(pendingOnlyQueueSummary.description, "不执行广告动作");

const emptyQueueSummary = buildReviewTodoQueueSummary([]);
assertEqual(emptyQueueSummary.total, 0);
assertEqual(emptyQueueSummary.text, "暂无复盘待办");
assertEqual(emptyQueueSummary.next, null);
assertEqual(emptyQueueSummary.nextDueDate, null);
assertEqual(
  reviewTodoScopeHintText({
    currentTotal: emptyQueueSummary.total,
    globalTotal: queueSummary.total,
    isGlobalScope: false,
  }),
  "当前诊断入口暂无复盘待办；范围外辅助排查还有 2 条，可显式切到全量排查查看。",
);
const globalReviewTodoHint = buildReviewTodoScopeHint({
  currentTotal: emptyQueueSummary.total,
  globalTotal: queueSummary.total,
  isGlobalScope: false,
});
assertEqual(globalReviewTodoHint?.text, "当前诊断入口暂无复盘待办；范围外辅助排查还有 2 条，可显式切到全量排查查看。");
assertEqual(globalReviewTodoHint?.actionScopeId, "all");
assertEqual(globalReviewTodoHint?.actionLabel, "切到全量排查");
const scopedReviewTodoHint = buildReviewTodoScopeHint({
  currentTotal: 6,
  globalTotal: 10,
  isGlobalScope: false,
});
assertEqual(scopedReviewTodoHint?.text, "当前诊断入口有 6 条复盘待办；范围外辅助排查还有 4 条，不属于当前入口。");
assertEqual(scopedReviewTodoHint?.actionScopeId, "all");
assertEqual(scopedReviewTodoHint?.actionLabel, "切到全量排查");
const globalReviewTodoDetails = buildReviewTodoQueueDetails([pendingTodo, dueTodo], {
  isGlobalScope: true,
});
assertEqual(globalReviewTodoDetails?.title, "全局复盘待办明细 2 条");
assertIncludes(globalReviewTodoDetails?.description ?? "", "不代表处理已经改善");
assertEqual(globalReviewTodoDetails?.rows.length, 2);
assertEqual(globalReviewTodoDetails?.rows[0].statusText, "7 天复盘已到期");
assertEqual(globalReviewTodoDetails?.rows[0].dueDate, "2026-06-08");
const abaContextTodo: ReviewTodoForUi = {
  ...dueTodo,
  signal_id: "sig-long-tail-beach-current",
  object_label: "beach essentials for toddlers 1-3",
  evidence_snapshot: [
    { label: "语义组", value: "规则语义：海滩出行用品", source: "规则语义" },
    { label: "ABA语义参考词", value: "beach essentials", source: "ABA导出" },
  ],
  review_context: {
    search_intent_label: "规则语义：海滩出行用品",
    search_term: "beach essentials for toddlers 1-3",
    aba_reference_term: "beach essentials",
    aba_reference_rank: "208",
    aba_match_boundary: "短语包含匹配，仅作为同类 SearchTerm 市场热度背景。",
    repeat_search_intent_count: 2,
    repeat_aba_reference_count: 1,
    repeat_summary: "同一 Parent ASIN 搜索词表现聚合已有 2 次人工留痕，复盘时应判断规则反馈口径是否需要人工复核。",
    can_auto_change_rules: false,
    can_auto_execute_ads: false,
  },
};
assertIncludes(reviewContextText(abaContextTodo) ?? "", "Parent ASIN 广告搜索词表现复核：规则语义：海滩出行用品");
assertIncludes(reviewContextText(abaContextTodo) ?? "", "具体 SearchTerm：beach essentials");
assertIncludes(reviewContextText(abaContextTodo) ?? "", "人工复盘下一步：按同类广告搜索词表现核对规则口径");
assertIncludes(reviewContextText(abaContextTodo) ?? "", "ABA 站点级参考：beach essentials / 排名 208");
assertIncludes(reviewContextText(abaContextTodo) ?? "", "同一 Parent ASIN 广告搜索词表现复核已有 2 次人工留痕");
assertIncludes(reviewContextText(abaContextTodo) ?? "", "不会自动改规则或执行广告");
assertIncludes(manualActionEvidenceSnapshotText(abaContextTodo) ?? "", "复盘上下文：Parent ASIN 广告搜索词表现复核：规则语义：海滩出行用品");
assertNotIncludes(manualActionEvidenceSnapshotText(abaContextTodo) ?? "", "语义组：");
const contextDetails = buildReviewTodoQueueDetails([abaContextTodo], { isGlobalScope: true });
assertIncludes(contextDetails?.rows[0].contextText ?? "", "留痕证据快照");
assertIncludes(contextDetails?.rows[0].contextText ?? "", "搜索词表现分组：规则语义：海滩出行用品");
assertNotIncludes(contextDetails?.rows[0].contextText ?? "", "语义组：");
assertIncludes(contextDetails?.rows[0].contextText ?? "", "ABA语义参考词");
assertIncludes(contextDetails?.rows[0].contextText ?? "", "ABA 站点级参考：beach essentials / 排名 208");
const legacySemanticGroupContextText = reviewContextText({
  review_context: {
    repeat_summary: "同一语义组已有 2 次人工留痕，复盘时应判断规则反馈口径是否需要人工复核。",
  },
});
assertIncludes(legacySemanticGroupContextText ?? "", "同一搜索词表现分组已有 2 次人工留痕");
assertNotIncludes(legacySemanticGroupContextText ?? "", "语义组");
assertEqual(
  buildReviewTodoQueueDetails([pendingTodo, dueTodo], {
    isGlobalScope: false,
  }),
  null,
);
assertEqual(
  reviewTodoScopeHintText({
    currentTotal: emptyQueueSummary.total,
    globalTotal: queueSummary.total,
    isGlobalScope: true,
  }),
  null,
);

const currentSnapshotSignalTodo: ReviewTodoForUi = {
  signal_id: "sig-current-snapshot",
  object_id: "B016EXMVZS",
  object_label: "B016EXMVZS",
  review_window: "7d",
  due_at: "2026-06-22T00:00:00+00:00",
  is_due: false,
};
const previousSnapshotSameParentTodo: ReviewTodoForUi = {
  signal_id: "sig-previous-snapshot",
  action_id: "manual-action-ad-product",
  shop_id: "market:1",
  market_id: 1,
  object_type: "advertised_product",
  object_id: "B016EXMW02",
  object_label: "B016EXMW02",
  action_type: "add_to_review",
  operator_name: "本地运营",
  acted_at: "2026-06-15T07:12:46.650985+00:00",
  review_window: "14d",
  due_at: "2026-06-29T00:00:00+00:00",
  is_due: false,
};
const previousSnapshotOtherShopSameObjectTodo: ReviewTodoForUi = {
  ...previousSnapshotSameParentTodo,
  signal_id: "sig-other-shop-same-asin",
  shop_id: "market:2",
  object_label: "B016EXMW02 / 其他店铺",
};
const otherParentTodo: ReviewTodoForUi = {
  signal_id: "sig-other-parent",
  shop_id: "market:1",
  market_id: 1,
  object_type: "advertised_product",
  object_id: "B0OTHER",
  object_label: "B0OTHER",
  review_window: "7d",
  due_at: "2026-06-22T00:00:00+00:00",
  is_due: false,
};

const parentScopedTodos = filterReviewTodosByProductScope(
  [currentSnapshotSignalTodo, previousSnapshotSameParentTodo, otherParentTodo],
  "parent_asin:B00K4W4AAA",
  {
    scope_id: "parent_asin:B00K4W4AAA",
    scope_type: "parent_asin",
    parent_asin: "B00K4W4AAA",
    child_asins: ["B016EXMVZS", "B016EXMW02"],
  },
  new Set(["sig-current-snapshot"]),
);
assertEqual(parentScopedTodos.length, 2);
assertEqual(parentScopedTodos[0].signal_id, "sig-current-snapshot");
assertEqual(parentScopedTodos[1].signal_id, "sig-previous-snapshot");

const selectedCurrentSignalWithoutDirectTodo = {
  id: "sig-current-B016EXMW02",
  shop_id: "market:1",
  market_id: 1,
  object_type: "advertised_product",
  evidence: {
    primary_object: {
      object_type: "advertised_product",
      object_id: "current-row-id",
      asin: "B016EXMW02",
      label: "B016EXMW02",
    },
  },
};
const selectedStableObjectTodos = selectReviewTodosForSignal(
  [],
  [previousSnapshotSameParentTodo, previousSnapshotOtherShopSameObjectTodo, otherParentTodo],
  selectedCurrentSignalWithoutDirectTodo,
);
assertEqual(selectedStableObjectTodos.length, 1);
assertEqual(selectedStableObjectTodos[0].signal_id, "sig-previous-snapshot");
assertEqual(selectedStableObjectTodos[0].object_id, "B016EXMW02");
assertEqual(
  reviewRecordSignalIdForTodo(selectedCurrentSignalWithoutDirectTodo, selectedStableObjectTodos[0]),
  "sig-previous-snapshot",
);
assertEqual(reviewRecordSignalIdForTodo(selectedCurrentSignalWithoutDirectTodo, null), "sig-current-B016EXMW02");
assertEqual(reviewRecordSignalIdForTodo(null, null), null);
const crossSnapshotReviewRecordReadbackTarget = buildReviewRecordReadbackTarget(
  selectedCurrentSignalWithoutDirectTodo,
  selectedStableObjectTodos[0],
);
assertEqual(crossSnapshotReviewRecordReadbackTarget?.requestSignalId, "sig-previous-snapshot");
assertEqual(crossSnapshotReviewRecordReadbackTarget?.stateSignalId, "sig-current-B016EXMW02");
assertEqual(crossSnapshotReviewRecordReadbackTarget?.objectType, "advertised_product");
assertEqual(crossSnapshotReviewRecordReadbackTarget?.objectId, "B016EXMW02");
assertEqual(buildReviewRecordReadbackTarget(null, selectedStableObjectTodos[0]), null);
assertEqual(
  reviewTargetReadbackText(previousSnapshotSameParentTodo),
  "店铺：market:1；站点：market_id 1；对象：advertised_product / B016EXMW02",
);
const selectedStableObjectManualActions = selectManualActionsForSignal([], selectedStableObjectTodos);
assertEqual(selectedStableObjectManualActions.length, 1);
assertEqual(selectedStableObjectManualActions[0].action_type, "add_to_review");
assertEqual(selectedStableObjectManualActions[0].operator_name, "本地运营");
assertEqual(
  reviewTargetReadbackText(selectedStableObjectManualActions[0]),
  "店铺：market:1；站点：market_id 1；对象：advertised_product / B016EXMW02",
);
assertEqual(
  reviewTargetReadbackText({
    shop_id: "market:1",
    market_id: 1,
    object_type: "search_term",
    object_id: "search_term:1:beach essentials",
    object_label: "beach essentials",
  }),
  "店铺：market:1；站点：market_id 1；对象：具体 SearchTerm：beach essentials；稳定对象：search_term / search_term:1:beach essentials",
);

const notReadyEffect: ReviewEffectForUi = {
  signal_id: "sig-previous-snapshot",
  action_id: "manual-action-ad-product",
  action_type: "add_to_review",
  shop_id: "market:1",
  market_id: 1,
  object_type: "advertised_product",
  object_id: "B016EXMW02",
  object_label: "B016EXMW02",
  review_window: "7d",
  status: "not_ready",
  result: "unclear",
  message: "复盘效果暂不可计算：缺少处理后 7 天快照",
  before_start_date: "2026-06-08",
  before_end_date: "2026-06-14",
  after_start_date: null,
  after_end_date: null,
};

const notReadyEffectReadback = reviewEffectTargetReadbackText(notReadyEffect) ?? "";
assertIncludes(notReadyEffectReadback, "market:1");
assertIncludes(notReadyEffectReadback, "advertised_product / B016EXMW02");
assertIncludes(notReadyEffectReadback, "add_to_review / manual-action-ad-product");
assertIncludes(notReadyEffectReadback, "7");

const improvedEffect: ReviewEffectForUi = {
  review_window: "7d",
  status: "ready",
  result: "improved",
  message: "处理后 7 天订单改善，ACOS 下降",
  before_start_date: "2026-06-01",
  before_end_date: "2026-06-07",
  after_start_date: "2026-06-09",
  after_end_date: "2026-06-15",
};

assertEqual(reviewEffectSummaryText(notReadyEffect), "复盘效果暂不可计算：缺少处理后 7 天快照");
assertEqual(reviewEffectSummaryText(improvedEffect), "处理后 7 天订单改善，ACOS 下降");
const notReadyRuleImprovement = buildRuleImprovementReadiness(notReadyEffect, null);
assertEqual(notReadyRuleImprovement.title, "规则改进暂未满足条件");
assertIncludes(notReadyRuleImprovement.description, "缺少处理后 7 天快照");
assertIncludes(notReadyRuleImprovement.description, "不能调整规则或输出效果结论");
assertIncludes(notReadyRuleImprovement.nextStep, "先查询积加 API 限流规则");
assertIncludes(notReadyRuleImprovement.nextStep, "人工触发低频快照");
const pendingRuleImprovement = buildRuleImprovementReadiness(null, null, pendingTodo);
assertEqual(pendingRuleImprovement.title, "规则改进暂未开始");
assertIncludes(pendingRuleImprovement.nextStep, "到 2026-06-15 后再复核");
assertIncludes(pendingRuleImprovement.nextStep, "未到期前不保存复盘结论");
const dueWithoutEffectRuleImprovement = buildRuleImprovementReadiness(null, null, dueTodo);
assertEqual(dueWithoutEffectRuleImprovement.title, "规则改进等待复盘效果");
assertIncludes(dueWithoutEffectRuleImprovement.description, "7 天复盘已到期");
assertIncludes(dueWithoutEffectRuleImprovement.nextStep, "先读取复盘效果");
assertIncludes(dueWithoutEffectRuleImprovement.nextStep, "先查询积加 API 限流规则");
const readyRuleImprovement = buildRuleImprovementReadiness(improvedEffect, null, dueTodo);
assertEqual(readyRuleImprovement.title, "规则改进待人工复盘");
assertIncludes(readyRuleImprovement.description, "先保存复盘记录");
assertIncludes(readyRuleImprovement.nextStep, "先保存复盘记录");
assertIncludes(readyRuleImprovement.nextStep, "规则反馈解释层");
const backendWaitingRuleImprovement = buildRuleImprovementReadiness(null, null, null, {
  status: "waiting_review_window",
  title: "规则改进暂未满足条件",
  reason: "7 天 / 14 天复盘窗口尚未到期；最早到 2026-06-21 后再复核处理后指标。",
  next_step: "等待复盘窗口完整后再复核处理后指标，未到期前不拉快照、不保存复盘结论。",
  can_auto_change_rules: false,
  can_auto_execute_ads: false,
});
assertEqual(backendWaitingRuleImprovement.title, "规则改进暂未满足条件");
assertIncludes(backendWaitingRuleImprovement.description, "2026-06-21");
assertIncludes(backendWaitingRuleImprovement.nextStep, "未到期前不拉快照");
assertEqual(backendWaitingRuleImprovement.tone, "blocked");
const backendWaitSummaryRuleImprovement = buildRuleImprovementReadiness(
  null,
  null,
  null,
  {
    status: "waiting_review_window",
    title: "规则改进暂未满足条件",
    reason: "复盘窗口尚未到期",
    next_step: "等待复盘窗口完整后再复核处理后指标。",
    can_auto_change_rules: false,
    can_auto_execute_ads: false,
  },
  {
    status: "waiting_review_window",
    ready_count: 0,
    not_ready_count: 10,
    earliest_due_date: "2026-06-21",
    review_windows: ["7 天", "14 天"],
    next_object_type: "advertised_product",
    next_object_id: "B016EXMW02",
    next_object_label: "B016EXMW02",
    message: "已有人工处理记录，但 7 天 / 14 天复盘窗口尚未到期。",
    next_step: "未到期前不拉取快照、不保存复盘结论。",
    forbidden_actions: ["不拉取快照", "不保存复盘结论", "不自动执行广告动作"],
  },
);
assertEqual(backendWaitSummaryRuleImprovement.title, "规则改进暂未满足条件");
assertIncludes(backendWaitSummaryRuleImprovement.description, "10 项未到期");
assertIncludes(backendWaitSummaryRuleImprovement.description, "最早 2026-06-21");
assertIncludes(backendWaitSummaryRuleImprovement.description, "B016EXMW02");
assertIncludes(backendWaitSummaryRuleImprovement.nextStep, "不拉取快照");
assertIncludes(backendWaitSummaryRuleImprovement.nextStep, "不保存复盘结论");
assertIncludes(backendWaitSummaryRuleImprovement.nextStep, "不自动执行广告动作");
const backendDoesNotOverrideSelectedReadySignal = buildRuleImprovementReadiness(improvedEffect, null, dueTodo, {
  status: "waiting_review_window",
  title: "规则改进暂未满足条件",
  reason: "范围级复盘窗口尚未到期。",
  next_step: "等待范围级复盘窗口。",
  can_auto_change_rules: false,
  can_auto_execute_ads: false,
});
assertEqual(backendDoesNotOverrideSelectedReadySignal.title, "规则改进待人工复盘");
assertIncludes(backendDoesNotOverrideSelectedReadySignal.description, "已具备处理前后指标");
const unsafeBackendRuleImprovement = buildRuleImprovementReadiness(null, null, null, {
  status: "ready_for_auto_rule_change",
  title: "自动改规则",
  reason: "后端错误返回了自动改规则能力。",
  next_step: "自动改规则。",
  can_auto_change_rules: true,
  can_auto_execute_ads: false,
});
assertEqual(unsafeBackendRuleImprovement.title, "规则改进暂未开始");
assertIncludes(unsafeBackendRuleImprovement.nextStep, "先记录人工动作");
const savedReviewRecord: ReviewRecordForUi = {
  signal_id: "sig-previous-snapshot",
  action_id: "manual-action-ad-product",
  action_type: "add_to_review",
  shop_id: "market:1",
  market_id: 1,
  object_type: "advertised_product",
  object_id: "B016EXMW02",
  object_label: "B016EXMW02",
  review_window: "7d",
  before_start_date: "2026-06-01",
  before_end_date: "2026-06-07",
  after_start_date: "2026-06-09",
  after_end_date: "2026-06-15",
  before_metrics: { cost: 80, orders: 1, sales: 50, acos: 1.6 },
  after_metrics: { cost: 60, orders: 5, sales: 200, acos: 0.3 },
  evidence_snapshot: [
    {
      label: "排查路径",
      value: "Parent 经营盘子 -> 广告 ASIN B016EXMW02 -> 广告组 -> 投放词 / 搜索词 / 广告位",
      detail: "保存复盘前必须回看原始广告诊断路径。",
      source: "business_rule",
    },
    {
      label: "AI 准入",
      value: "可进入人工确认 / ready_for_manual_confirmation / 候选 1 个 / 允许人工留痕",
      detail: "准入只证明允许人工留痕，不代表系统会自动执行广告动作。",
      source: "actionability_status",
    },
    {
      label: "搜索词边界",
      value: "B016EXMW02 的搜索词只能说明广告组上下文，不能自动归因到单 ASIN。",
      detail: "复盘记录只保存人工判断证据，不自动新增关键词或否词。",
      source: "business_rule",
    },
    {
      label: "广告位边界",
      value: "B016EXMW02 广告位证据缺口需保留，不能包装成广告位调整结论。",
      detail: "广告位缺口只提示补证，不自动调价。",
      source: "business_rule",
    },
  ],
  result: "worse",
  review_note: "建议没有改善",
};
const savedReviewRecordReadback = reviewRecordTargetReadbackText(savedReviewRecord) ?? "";
assertIncludes(savedReviewRecordReadback, "market:1");
assertIncludes(savedReviewRecordReadback, "advertised_product / B016EXMW02");
assertIncludes(savedReviewRecordReadback, "add_to_review / manual-action-ad-product");
assertIncludes(savedReviewRecordReadback, "7");
assertIncludes(
  reviewRecordReadbackStatus([savedReviewRecord], {
    actionId: "manual-action-ad-product",
    objectType: "advertised_product",
    objectId: "B016EXMW02",
    reviewWindow: "7d",
  }),
  "已读回匹配复盘记录：action_id / object_id / 7 天窗口 / 指标窗口 / 证据快照一致",
);
assertIncludes(
  reviewRecordReadbackStatus([savedReviewRecord], {
    actionId: "manual-action-ad-product",
    objectType: "advertised_product",
    objectId: "B016EXMW02",
    reviewWindow: "7d",
  }),
  "复盘证据快照：7d 4 条",
);
assertIncludes(
  reviewRecordReadbackStatus([savedReviewRecord], {
    actionId: "manual-action-ad-product",
    objectType: "advertised_product",
    objectId: "B016EXMW02",
    reviewWindow: "7d",
  }),
  "可回看对象引用",
);
assertIncludes(
  reviewRecordReadbackStatus([savedReviewRecord], {
    actionId: "manual-action-ad-product",
    objectType: "advertised_product",
    objectId: "B016EXMW02",
    reviewWindow: "14d",
  }),
  "复盘记录待读回核对",
);
const savedSearchTermReviewRecord: ReviewRecordForUi = {
  ...savedReviewRecord,
  signal_id: "sig-opportunity-search-term-1-beach-essentials",
  action_id: "manual-action-search-term",
  object_type: "search_term",
  object_id: "search_term:1:beach essentials",
  object_label: "beach essentials",
  evidence_snapshot: [
    { label: "排查路径", value: "Parent ASIN B00K4W4AAA -> beach essentials", source: "business_rule" },
    { label: "AI 准入", value: "可进入人工确认 / 不自动执行广告动作", source: "actionability_status" },
    {
      label: "搜索词表现判断",
      value: "扩量复核：订单 23 / ACOS 20.27%；只用于人工复核优先级",
      detail: "不自动加词、否词、调价或暂停广告。",
      source: "ad_search_term_daily_metrics",
    },
    { label: "广告组合流判断", value: "beach essentials 已串联广告组、投放词、搜索词和广告位边界。", source: "diagnosis_contract" },
    { label: "同组投放商品表现", value: "B016EXMVZS 花费 22.78 / 订单 11", source: "ad_product_daily_metrics" },
    {
      label: "逐投放上下文",
      value: "优先复核广告组：RBK004-beach essentials-精准 / 投放词 beach essentials / 订单 11 / 花费 22.78",
      detail: "只证明该搜索词在对应广告组和投放词下的广告表现；不能自动归因到单个广告 ASIN。",
      source: "ad_search_term_daily_metrics",
    },
    { label: "投放词证据", value: "beach essentials / 1 个", source: "ad_search_term_daily_metrics" },
    { label: "搜索词边界", value: "beach essentials 只能说明广告组上下文，不能自动归因到单个广告 ASIN。", source: "business_rule" },
    { label: "广告位边界", value: "广告组级广告位 0 条 / 同广告活动广告位 6 条。", source: "placement_metrics" },
    { label: "ABA 背景", value: "ABA 排名 208 / 2026-06-07 至 2026-06-13", source: "ABA导出" },
  ],
  review_context: {
    search_intent_label: "规则语义：海滩出行用品",
    search_term: "beach essentials",
    repeat_search_intent_count: 4,
    repeat_summary: "同一 Parent ASIN 搜索词表现聚合已有 4 次人工留痕，复盘时应判断规则反馈口径是否需要人工复核。",
    can_auto_change_rules: false,
    can_auto_execute_ads: false,
  },
};
const searchTermReviewRecordReadback = reviewRecordReadbackStatus([savedSearchTermReviewRecord], {
  actionId: "manual-action-search-term",
  objectType: "search_term",
  objectId: "search_term:1:beach essentials",
  reviewWindow: "7d",
});
assertIncludes(searchTermReviewRecordReadback, "Parent ASIN 广告搜索词表现复核");
assertIncludes(searchTermReviewRecordReadback, "复盘上下文：Parent ASIN 广告搜索词表现复核：规则语义：海滩出行用品");
assertIncludes(searchTermReviewRecordReadback, "具体 SearchTerm：beach essentials");
assertIncludes(searchTermReviewRecordReadback, "人工复盘下一步：按同类广告搜索词表现核对规则口径");
assertIncludes(searchTermReviewRecordReadback, "同一 Parent ASIN 广告搜索词表现复核已有 4 次人工留痕");
const searchTermRuleFeedbackCandidate = buildRuleFeedbackCandidate(savedSearchTermReviewRecord, improvedEffect);
assertIncludes(searchTermRuleFeedbackCandidate?.basis ?? "", "复盘上下文：Parent ASIN 广告搜索词表现复核：规则语义：海滩出行用品");
assertIncludes(searchTermRuleFeedbackCandidate?.boundary ?? "", "不自动改规则，不自动执行广告动作");
const savedReviewRecordWithoutObjectReference: ReviewRecordForUi = {
  ...savedReviewRecord,
  evidence_snapshot: savedReviewRecord.evidence_snapshot?.map((item) => ({
    ...item,
    value: item.value.split("B016EXMW02").join("B07OTHERASIN"),
  })),
};
assertIncludes(
  reviewRecordReadbackStatus([savedReviewRecordWithoutObjectReference], {
    actionId: "manual-action-ad-product",
    objectType: "advertised_product",
    objectId: "B016EXMW02",
    reviewWindow: "7d",
  }),
  "复盘记录待读回核对",
);
assertIncludes(
  reviewRecordReadbackStatus([savedReviewRecordWithoutObjectReference], {
    actionId: "manual-action-ad-product",
    objectType: "advertised_product",
    objectId: "B016EXMW02",
    reviewWindow: "7d",
  }),
  "7d 缺对象引用",
);
const savedRuleImprovement = buildRuleImprovementReadiness(improvedEffect, savedReviewRecord);
assertEqual(savedRuleImprovement.title, "规则反馈已沉淀");
assertIncludes(savedRuleImprovement.description, "复核阈值、证据来源和建议动作");
assertIncludes(savedRuleImprovement.description, "不自动调整广告动作");
assertIncludes(savedRuleImprovement.description, "advertised_product / B016EXMW02");
assertIncludes(savedRuleImprovement.description, "add_to_review / manual-action-ad-product");
assertIncludes(savedRuleImprovement.description, "7");
assertIncludes(savedRuleImprovement.nextStep, "继续用该复盘结果校准同类信号解释");
const savedRuleFeedbackCandidate = buildRuleFeedbackCandidate(savedReviewRecord, improvedEffect);
assertEqual(savedRuleFeedbackCandidate?.title, "规则反馈候选");
assertIncludes(savedRuleFeedbackCandidate?.basis ?? "", "worse / 建议没有改善");
assertIncludes(savedRuleFeedbackCandidate?.basis ?? "", "advertised_product / B016EXMW02");
assertIncludes(savedRuleFeedbackCandidate?.basis ?? "", "处理前 2026-06-01 至 2026-06-07");
assertIncludes(savedRuleFeedbackCandidate?.recommendation ?? "", "复核阈值、证据来源和建议动作");
assertIncludes(savedRuleFeedbackCandidate?.boundary ?? "", "只进入解释层");
assertIncludes(savedRuleFeedbackCandidate?.boundary ?? "", "不是广告处理对象");
assertIncludes(savedRuleFeedbackCandidate?.boundary ?? "", "不自动改规则");
assertIncludes(savedRuleFeedbackCandidate?.boundary ?? "", "不自动执行广告动作");
assertEqual(buildRuleFeedbackCandidate(null, improvedEffect), null);
assertEqual(
  reviewEffectWindowText(notReadyEffect),
  "复盘窗口：处理前 2026-06-08 至 2026-06-14；处理后待补齐。",
);
assertEqual(
  reviewEffectWindowText(improvedEffect),
  "复盘窗口：处理前 2026-06-01 至 2026-06-07；处理后 2026-06-09 至 2026-06-15。",
);
assertEqual(reviewEffectWindowText(null), null);
const waitingReviewEffectWindowLedger = buildReviewEffectWindowLedger(pendingTodo, null);
assertEqual(waitingReviewEffectWindowLedger.tone, "waiting");
assertEqual(waitingReviewEffectWindowLedger.title, "等待复盘窗口到期");
assertIncludes(waitingReviewEffectWindowLedger.afterWindow, "2026-06-15");
assertIncludes(waitingReviewEffectWindowLedger.metricCoverage, "还没有拿到 review-effect");
assertIncludes(waitingReviewEffectWindowLedger.boundary, "不代表处理已经改善");
const blockedReviewEffectWindowLedger = buildReviewEffectWindowLedger(dueTodo, notReadyEffect);
assertEqual(blockedReviewEffectWindowLedger.tone, "blocked");
assertEqual(blockedReviewEffectWindowLedger.title, "复盘窗口未完整");
assertEqual(blockedReviewEffectWindowLedger.beforeWindow, "2026-06-08 至 2026-06-14");
assertEqual(blockedReviewEffectWindowLedger.afterWindow, "待补齐");
assertIncludes(blockedReviewEffectWindowLedger.metricCoverage, "不能保存 ReviewRecord");
assertIncludes(blockedReviewEffectWindowLedger.nextStep, "人工低频触发");
assertIncludes(blockedReviewEffectWindowLedger.boundary, "不判断改善");
const readyReviewEffectWindowLedger = buildReviewEffectWindowLedger(dueTodo, {
  ...improvedEffect,
  before_metrics: { cost: 80, orders: 1, sales: 50, acos: 1.6 },
  after_metrics: { cost: 60, orders: 5, sales: 200, acos: 0.3 },
});
assertEqual(readyReviewEffectWindowLedger.tone, "ready");
assertEqual(readyReviewEffectWindowLedger.title, "复盘效果可人工保存");
assertEqual(readyReviewEffectWindowLedger.beforeWindow, "2026-06-01 至 2026-06-07");
assertEqual(readyReviewEffectWindowLedger.afterWindow, "2026-06-09 至 2026-06-15");
assertIncludes(readyReviewEffectWindowLedger.metricCoverage, "花费、订单、销售额、ACOS");
assertIncludes(readyReviewEffectWindowLedger.nextStep, "只保存 ReviewRecord");
assertIncludes(readyReviewEffectWindowLedger.boundary, "不证明所有业务变化");
assertEqual(canSaveReviewEffect(notReadyEffect), false);
assertEqual(canSaveReviewEffect(improvedEffect), true);
const reviewTodoWithDiagnosisPath: ReviewTodoForUi = {
  ...dueTodo,
  signal_id: "sig-previous-snapshot",
  shop_id: "market:1",
  market_id: 1,
  object_type: "advertised_product",
  object_id: "B016EXMW02",
  action_id: "manual-action-ad-product",
  action_type: "add_to_review",
  evidence_snapshot: [
    {
      label: "排查路径",
      value: "Parent 经营盘子 -> 广告 ASIN -> 广告组 -> 投放词 / 搜索词 / 广告位",
      detail: "先用 Parent ASIN 看整体销售，再只下钻有广告证据的广告 ASIN。",
      source: "diagnosis_contract",
    },
    {
      label: "AI 准入",
      value: "可进入人工确认 / ready_for_manual_confirmation / 候选 1 个 / 允许人工留痕",
      detail: "准入只证明允许人工留痕，不代表系统会自动执行广告动作。",
      source: "actionability_status",
    },
    {
      label: "搜索词边界",
      value: "搜索词只说明同广告组上下文，不能自动归因到单个广告 ASIN。",
      detail: "保存复盘前必须确认未自动加词、否词或调价。",
      source: "search_term_metrics",
    },
    {
      label: "广告位边界",
      value: "广告组级广告位 0 条 / 同广告活动广告位 4 条。",
      detail: "活动级广告位只能作背景，不能替代广告组级证据。",
      source: "placement_metrics",
    },
    { label: "人工确认判断依据", value: "当前广告商品可进入复盘。", source: "diagnosis_contract" },
    { label: "能证明的事实", value: "当前广告商品有处理前后指标和广告商品覆盖证据。", source: "diagnosis_contract" },
    { label: "不能证明的边界", value: "不能证明搜索词或广告位可以自动归因到该广告 ASIN。", source: "diagnosis_contract" },
    { label: "人工下一步", value: "人工核对广告组、搜索词、广告位和主推策略后保存复盘。", source: "diagnosis_contract" },
    {
      label: "广告组问题定位",
      value: "RBK004-Exact / 花费 30.00 / 订单 6",
      detail: "同广告组搜索词 4 条。",
      source: "ad_group",
    },
    {
      label: "广告商品覆盖",
      value: "B016EXMW02 覆盖 raw 投放行 6/7 / 证据行 6 条",
      detail: "未覆盖 raw 投放行 1 条，覆盖率 85.7%。",
      source: "advertised_products",
    },
    {
      label: "广告组合流判断",
      value: "当前广告商品必须按广告组容器回看投放词、搜索词和广告位上下文。",
      detail: "不能把搜索词或广告位证据自动归因到单个广告 ASIN。",
      source: "diagnosis_contract",
    },
    {
      label: "同组投放商品表现",
      value: "B016EXMVZS 花费 22.78 / 订单 11；B016EXMW02 花费 18.41 / 订单 7",
      detail: "只说明同广告组内广告商品承接差异，不能把搜索词自动归因到单个广告 ASIN。",
      source: "advertised_products + ad_product_daily_metrics",
    },
    { label: "证据缺口", value: "缺少广告组级广告位证据和主推策略确认。", source: "diagnosis_contract" },
    { label: "需要补证", value: "补齐广告位、投放词维护状态和主推策略。", source: "diagnosis_contract" },
    { label: "动作边界", value: "只允许记录观察、标记已处理、加入复盘或忽略本次。", source: "business_rule" },
  ],
};
const readyAdProductReviewTodoEvidenceReadback = buildReviewTodoEvidenceReadbackSummary(reviewTodoWithDiagnosisPath);
assertEqual(readyAdProductReviewTodoEvidenceReadback?.tone, "ready");
assertIncludes(JSON.stringify(readyAdProductReviewTodoEvidenceReadback), "广告商品复核链");
assertIncludes(JSON.stringify(readyAdProductReviewTodoEvidenceReadback), "广告商品覆盖");
assertIncludes(JSON.stringify(readyAdProductReviewTodoEvidenceReadback), "同组投放商品表现");
assertIncludes(JSON.stringify(readyAdProductReviewTodoEvidenceReadback), "动作边界");
const blockedAdProductReviewTodoEvidenceReadback = buildReviewTodoEvidenceReadbackSummary({
  ...reviewTodoWithDiagnosisPath,
  evidence_snapshot: reviewTodoWithDiagnosisPath.evidence_snapshot?.filter((item) => item.label !== "动作边界"),
});
assertEqual(blockedAdProductReviewTodoEvidenceReadback?.tone, "blocked");
assertIncludes(JSON.stringify(blockedAdProductReviewTodoEvidenceReadback), "缺：动作边界");
const reviewRecordPreflightChecklist = buildReviewRecordPreflightChecklist(
  reviewTodoWithDiagnosisPath,
  {
    ...improvedEffect,
    signal_id: "sig-previous-snapshot",
    action_id: "manual-action-ad-product",
    action_type: "add_to_review",
    shop_id: "market:1",
    market_id: 1,
    object_type: "advertised_product",
    object_id: "B016EXMW02",
    before_metrics: { cost: 80, orders: 1, sales: 50, acos: 1.6 },
    after_metrics: { cost: 60, orders: 5, sales: 200, acos: 0.3 },
  },
  {
    requestSignalId: "sig-previous-snapshot",
    stateSignalId: "sig-previous-snapshot",
    objectType: "advertised_product",
    objectId: "B016EXMW02",
  },
);
assertEqual(reviewRecordPreflightChecklist.length, 18);
assertEqual(reviewRecordPreflightChecklist[0].title, "确认复盘对象");
assertIncludes(reviewRecordPreflightChecklist[0].description, "advertised_product / B016EXMW02");
assertIncludes(reviewRecordPreflightChecklist[0].description, "sig-previous-snapshot");
assertEqual(reviewRecordPreflightChecklist[1].title, "回看人工动作证据");
assertIncludes(reviewRecordPreflightChecklist[1].description, "排查路径");
assertIncludes(reviewRecordPreflightChecklist[1].description, "保存复盘前");
assertEqual(reviewRecordPreflightChecklist[2].title, "回看原始诊断路径");
assertIncludes(reviewRecordPreflightChecklist[2].description, "Parent 经营盘子 -> 广告 ASIN -> 广告组");
assertIncludes(reviewRecordPreflightChecklist[2].description, "广告组问题定位");
assertIncludes(reviewRecordPreflightChecklist[2].description, "投放词 / 搜索词 / 广告位");
assertEqual(reviewRecordPreflightChecklist[3].title, "回看 AI 准入理由");
assertIncludes(reviewRecordPreflightChecklist[3].description, "ready_for_manual_confirmation");
assertIncludes(reviewRecordPreflightChecklist[3].description, "不代表系统自动执行广告动作");
assertEqual(reviewRecordPreflightChecklist[4].title, "回看搜索词边界");
assertIncludes(reviewRecordPreflightChecklist[4].description, "搜索词只说明同广告组上下文");
assertIncludes(reviewRecordPreflightChecklist[4].description, "不能自动归因");
assertEqual(reviewRecordPreflightChecklist[5].title, "回看广告位边界");
assertIncludes(reviewRecordPreflightChecklist[5].description, "广告组级广告位 0 条");
assertIncludes(reviewRecordPreflightChecklist[5].description, "不能替代广告组级证据");
assertEqual(reviewRecordPreflightChecklist[6].id, "ad_product_coverage");
assertIncludes(reviewRecordPreflightChecklist[6].description, "广告商品覆盖回看");
assertEqual(reviewRecordPreflightChecklist[7].id, "ad_group_synthesis");
assertIncludes(reviewRecordPreflightChecklist[7].description, "广告组合流判断回看");
assertIncludes(reviewRecordPreflightChecklist[7].description, "不能把搜索词或广告位证据自动归因");
assertEqual(reviewRecordPreflightChecklist[8].id, "ad_group_product_performance");
assertIncludes(reviewRecordPreflightChecklist[8].description, "同组投放商品表现回看");
assertIncludes(reviewRecordPreflightChecklist[8].description, "B016EXMW02");
assertEqual(reviewRecordPreflightChecklist[9].id, "evidence_gap");
assertIncludes(reviewRecordPreflightChecklist[9].description, "缺少广告组级广告位证据");
assertEqual(reviewRecordPreflightChecklist[10].id, "required_evidence");
assertIncludes(reviewRecordPreflightChecklist[10].description, "补齐广告位");
assertEqual(reviewRecordPreflightChecklist[11].id, "manual_action_boundary");
assertIncludes(reviewRecordPreflightChecklist[11].description, "不自动归因搜索词");
assertEqual(reviewRecordPreflightChecklist[12].title, "确认复盘窗口");
assertIncludes(reviewRecordPreflightChecklist[12].description, "7 天");
assertIncludes(reviewRecordPreflightChecklist[12].description, "ready");
assertEqual(reviewRecordPreflightChecklist[13].title, "核对指标口径");
assertIncludes(reviewRecordPreflightChecklist[13].description, "处理前 2026-06-01 至 2026-06-07");
assertIncludes(reviewRecordPreflightChecklist[13].description, "花费、订单、销售额、ACOS");
assertIncludes(reviewRecordPreflightChecklist[13].description, "不等同于归因所有业务变化");
assertEqual(reviewRecordPreflightChecklist[14].title, "确认复盘结论边界");
assertIncludes(reviewRecordPreflightChecklist[14].description, "处理后 7 天订单改善");
assertIncludes(reviewRecordPreflightChecklist[14].description, "当前对象");
assertIncludes(reviewRecordPreflightChecklist[14].description, "不证明所有业务变化");
assertEqual(reviewRecordPreflightChecklist[15].title, "确认规则反馈边界");
assertIncludes(reviewRecordPreflightChecklist[15].description, "只形成规则反馈候选");
assertIncludes(reviewRecordPreflightChecklist[15].description, "不自动改规则");
assertIncludes(reviewRecordPreflightChecklist[15].description, "不自动执行广告动作");
assertEqual(reviewRecordPreflightChecklist[16].title, "核对待办证据一致性");
assertIncludes(reviewRecordPreflightChecklist[16].description, "action_id manual-action-ad-product");
assertIncludes(reviewRecordPreflightChecklist[16].description, "证据快照 15 条");
assertIncludes(reviewRecordPreflightChecklist[16].description, "后端仍会按签名校验");
assertEqual(reviewRecordPreflightChecklist[17].title, "核对待办证据对象引用");
assertIncludes(reviewRecordPreflightChecklist[17].description, "advertised_product / B016EXMW02");
assertIncludes(reviewRecordPreflightChecklist[17].description, "对象引用可回看");
assertEqual(buildReviewRecordPreflightChecklist(dueTodo, notReadyEffect, null).length, 0);
assertEqual(canSaveReviewRecordWithPreflight(notReadyEffect, reviewRecordPreflightChecklist), false);
assertEqual(canSaveReviewRecordWithPreflight(improvedEffect, []), false);
assertEqual(
  canSaveReviewRecordWithPreflight(
    improvedEffect,
    reviewRecordPreflightChecklist.filter((check) => check.id !== "review_result_boundary"),
  ),
  false,
);
assertEqual(
  canSaveReviewRecordWithPreflight(
    improvedEffect,
    reviewRecordPreflightChecklist.filter((check) => check.id !== "diagnosis_path"),
  ),
  false,
);
assertEqual(
  canSaveReviewRecordWithPreflight(
    improvedEffect,
    reviewRecordPreflightChecklist.filter((check) => check.id !== "ai_admission"),
  ),
  false,
);
assertEqual(canSaveReviewRecordWithPreflight(improvedEffect, reviewRecordPreflightChecklist), true);
assertEqual(
  canSaveReviewRecordWithPreflight(
    improvedEffect,
    reviewRecordPreflightChecklist.filter((check) => check.id !== "todo_evidence_signature"),
  ),
  false,
);
assertEqual(
  canSaveReviewRecordWithPreflight(
    improvedEffect,
    reviewRecordPreflightChecklist.filter((check) => check.id !== "todo_object_reference"),
  ),
  false,
);
assertEqual(
  buildReviewRecordSaveGateSummary(dueTodo, notReadyEffect, reviewRecordPreflightChecklist).title,
  "暂不能保存复盘记录",
);
assertIncludes(
  buildReviewRecordSaveGateSummary(dueTodo, notReadyEffect, reviewRecordPreflightChecklist).detail,
  "未到 ready 前不保存 ReviewRecord",
);
assertEqual(
  buildReviewRecordSaveGateSummary(dueTodo, improvedEffect, reviewRecordPreflightChecklist.slice(0, 7)).title,
  "保存前检查未通过",
);
assertIncludes(
  buildReviewRecordSaveGateSummary(dueTodo, improvedEffect, reviewRecordPreflightChecklist.slice(0, 7)).detail,
  "规则反馈边界",
);
assertIncludes(
  buildReviewRecordSaveGateSummary(dueTodo, improvedEffect, reviewRecordPreflightChecklist.slice(0, 7)).detail,
  "不能用当前页面缓存",
);
const readyReviewRecordSaveGate = buildReviewRecordSaveGateSummary(dueTodo, improvedEffect, reviewRecordPreflightChecklist);
assertEqual(readyReviewRecordSaveGate.title, "可人工保存复盘记录");
assertEqual(readyReviewRecordSaveGate.canSave, true);
assertIncludes(readyReviewRecordSaveGate.detail, "点击只保存 ReviewRecord");
assertIncludes(readyReviewRecordSaveGate.detail, "不自动改规则或执行广告动作");
const readyReviewRecordSavePath = buildReviewRecordSavePathSummary(
  buildReviewTodoDecisionReadbackSummary(reviewTodoWithDiagnosisPath),
  buildReviewEffectWindowLedger(dueTodo, improvedEffect),
  readyReviewRecordSaveGate,
);
assertEqual(readyReviewRecordSavePath?.tone, "ready");
assertIncludes(JSON.stringify(readyReviewRecordSavePath), "复盘保存顺序核对");
assertIncludes(JSON.stringify(readyReviewRecordSavePath), "1. 当时判断");
assertIncludes(JSON.stringify(readyReviewRecordSavePath), "2. 指标窗口");
assertIncludes(JSON.stringify(readyReviewRecordSavePath), "3. 保存结论");
assertIncludes(JSON.stringify(readyReviewRecordSavePath), "保存 ReviewRecord 前必须按顺序");
assertIncludes(JSON.stringify(readyReviewRecordSavePath), "不自动改规则或执行广告动作");
const blockedReviewRecordSavePath = buildReviewRecordSavePathSummary(
  buildReviewTodoDecisionReadbackSummary(reviewTodoWithDiagnosisPath),
  blockedReviewEffectWindowLedger,
  buildReviewRecordSaveGateSummary(dueTodo, notReadyEffect, reviewRecordPreflightChecklist),
);
assertEqual(blockedReviewRecordSavePath?.tone, "blocked");
assertIncludes(JSON.stringify(blockedReviewRecordSavePath), "未完整");
assertIncludes(JSON.stringify(blockedReviewRecordSavePath), "不可保存");
const matchedReviewRecordExpectation = {
  actionId: "manual-action-ad-product",
  objectType: "advertised_product",
  objectId: "B016EXMW02",
  reviewWindow: "7d" as const,
};
assertEqual(hasReviewRecordReadbackMatch([savedReviewRecord], matchedReviewRecordExpectation), true);
assertEqual(hasReviewRecordReadbackMatch([savedReviewRecord], { ...matchedReviewRecordExpectation, reviewWindow: "14d" }), false);
const savedReviewRecordGate = buildReviewRecordSaveGateSummary(
  dueTodo,
  improvedEffect,
  reviewRecordPreflightChecklist,
  hasReviewRecordReadbackMatch([savedReviewRecord], matchedReviewRecordExpectation),
);
assertEqual(savedReviewRecordGate.title, "已保存匹配复盘记录");
assertEqual(savedReviewRecordGate.canSave, false);
assertIncludes(savedReviewRecordGate.detail, "该结论只来自人工保存");
const reviewRecordPreflightChecklistWithStaleTodo = buildReviewRecordPreflightChecklist(
  {
    ...reviewTodoWithDiagnosisPath,
    action_id: "manual-action-from-other-todo",
  },
  {
    ...improvedEffect,
    signal_id: "sig-previous-snapshot",
    action_id: "manual-action-ad-product",
    action_type: "add_to_review",
    object_type: "advertised_product",
    object_id: "B016EXMW02",
  },
  null,
);
assertEqual(reviewRecordPreflightChecklistWithStaleTodo[16].id, "todo_evidence_signature_missing");
assertIncludes(reviewRecordPreflightChecklistWithStaleTodo[16].description, "action_id 与 ready effect 不一致");
assertIncludes(reviewRecordPreflightChecklistWithStaleTodo[16].description, "不能用页面缓存");
assertEqual(canSaveReviewRecordWithPreflight(improvedEffect, reviewRecordPreflightChecklistWithStaleTodo), false);
const reviewRecordPreflightChecklistWithObjectMismatch = buildReviewRecordPreflightChecklist(
  {
    ...reviewTodoWithDiagnosisPath,
    evidence_snapshot: reviewTodoWithDiagnosisPath.evidence_snapshot?.map((item) =>
      item.label === "广告商品覆盖"
        ? { ...item, value: "B07OTHERASIN 覆盖 raw 投放行 6/7 / 证据行 6 条" }
        : item.label === "同组投放商品表现"
          ? { ...item, value: "B07OTHERASIN 花费 22.78 / 订单 11；B07OTHERASIN2 花费 18.41 / 订单 7" }
          : item,
    ),
  },
  {
    ...improvedEffect,
    signal_id: "sig-previous-snapshot",
    action_id: "manual-action-ad-product",
    action_type: "add_to_review",
    object_type: "advertised_product",
    object_id: "B016EXMW02",
  },
  null,
);
assertEqual(reviewRecordPreflightChecklistWithObjectMismatch[17].id, "todo_object_reference_missing");
assertIncludes(reviewRecordPreflightChecklistWithObjectMismatch[17].description, "证据快照未能回看 advertised_product / B016EXMW02");
assertIncludes(reviewRecordPreflightChecklistWithObjectMismatch[17].description, "不能保存 ReviewRecord");
assertEqual(canSaveReviewRecordWithPreflight(improvedEffect, reviewRecordPreflightChecklistWithObjectMismatch), false);
const reviewRecordPreflightChecklistWithoutDiagnosisPath = buildReviewRecordPreflightChecklist(
  {
    ...dueTodo,
    evidence_snapshot: [
      {
        label: "广告商品覆盖",
        value: "覆盖 raw 投放行 6/7 / 证据行 6 条",
        detail: "未覆盖 raw 投放行 1 条，覆盖率 85.7%。",
        source: "advertised_products",
      },
    ],
  },
  improvedEffect,
  null,
);
assertEqual(reviewRecordPreflightChecklistWithoutDiagnosisPath[2].title, "回看原始诊断路径");
assertIncludes(reviewRecordPreflightChecklistWithoutDiagnosisPath[2].description, "缺少原始诊断路径");
assertIncludes(reviewRecordPreflightChecklistWithoutDiagnosisPath[2].description, "广告商品覆盖");
assertIncludes(reviewRecordPreflightChecklistWithoutDiagnosisPath[2].description, "不能把复盘结论扩展成规则判断");
assertEqual(canSaveReviewRecordWithPreflight(improvedEffect, reviewRecordPreflightChecklistWithoutDiagnosisPath), false);
const reviewRecordPreflightChecklistWithoutAiAdmission = buildReviewRecordPreflightChecklist(
  {
    ...reviewTodoWithDiagnosisPath,
    evidence_snapshot: reviewTodoWithDiagnosisPath.evidence_snapshot?.filter((item) => item.label !== "AI 准入"),
  },
  improvedEffect,
  null,
);
assertEqual(reviewRecordPreflightChecklistWithoutAiAdmission[3].title, "回看 AI 准入理由");
assertIncludes(reviewRecordPreflightChecklistWithoutAiAdmission[3].description, "缺少 AI 准入理由");
assertIncludes(reviewRecordPreflightChecklistWithoutAiAdmission[3].description, "不能证明当时为什么允许进入人工确认");
assertEqual(canSaveReviewRecordWithPreflight(improvedEffect, reviewRecordPreflightChecklistWithoutAiAdmission), false);
const reviewRecordPreflightChecklistWithoutSearchTermBoundary = buildReviewRecordPreflightChecklist(
  {
    ...reviewTodoWithDiagnosisPath,
    evidence_snapshot: reviewTodoWithDiagnosisPath.evidence_snapshot?.filter((item) => item.label !== "搜索词边界"),
  },
  improvedEffect,
  null,
);
assertEqual(reviewRecordPreflightChecklistWithoutSearchTermBoundary[4].id, "search_term_boundary_missing");
assertIncludes(reviewRecordPreflightChecklistWithoutSearchTermBoundary[4].description, "缺少搜索词边界");
assertEqual(canSaveReviewRecordWithPreflight(improvedEffect, reviewRecordPreflightChecklistWithoutSearchTermBoundary), false);
const reviewRecordPreflightChecklistWithoutPlacementBoundary = buildReviewRecordPreflightChecklist(
  {
    ...reviewTodoWithDiagnosisPath,
    evidence_snapshot: reviewTodoWithDiagnosisPath.evidence_snapshot?.filter((item) => item.label !== "广告位边界"),
  },
  improvedEffect,
  null,
);
assertEqual(reviewRecordPreflightChecklistWithoutPlacementBoundary[5].id, "placement_boundary_missing");
assertIncludes(reviewRecordPreflightChecklistWithoutPlacementBoundary[5].description, "缺少广告位边界");
assertEqual(canSaveReviewRecordWithPreflight(improvedEffect, reviewRecordPreflightChecklistWithoutPlacementBoundary), false);
const searchTermReviewEffect: ReviewEffectForUi = {
  ...improvedEffect,
  signal_id: "sig-opportunity-search-term-1-beach-essentials",
  action_id: "manual-action-search-term",
  action_type: "add_to_review",
  object_type: "search_term",
  object_id: "search_term:1:beach essentials",
  object_label: "beach essentials",
};
const searchTermReviewTodoWithFullChain: ReviewTodoForUi = {
  ...dueTodo,
  signal_id: "sig-opportunity-search-term-1-beach-essentials",
  shop_id: "market:1",
  market_id: 1,
  object_type: "search_term",
  object_id: "search_term:1:beach essentials",
  object_label: "beach essentials",
  action_id: "manual-action-search-term",
  action_type: "add_to_review",
  evidence_snapshot: [
    { label: "排查路径", value: "搜索词 -> 广告活动 / 广告组 -> 投放词结构 -> 广告 ASIN 人工复核", source: "business_rule" },
    { label: "AI 准入", value: "可进入人工确认 / ready_for_manual_confirmation / 允许人工留痕", source: "actionability_status" },
    { label: "搜索词表现分组", value: "规则语义：海滩出行用品", source: "规则语义" },
    {
      label: "搜索词表现判断",
      value: "扩量复核：订单 23 / ACOS 20.27%；只用于人工复核优先级",
      detail: "不自动加词、否词、调价或暂停广告。",
      source: "ad_search_term_daily_metrics",
    },
    { label: "Parent ASIN入口", value: "Parent ASIN B00K4W4AAA 下只复核有广告数据的搜索词表现。", source: "diagnosis_contract + sales_performance" },
    { label: "广告 ASIN承接", value: "广告 ASIN B016EXMVZS / B016EXMW02 承接该搜索词上下文。", source: "diagnosis_contract + advertised_products" },
    {
      label: "广告组合流判断",
      value: "同广告组广告 ASIN 2 个；搜索词不能自动归因到单个广告 ASIN",
      detail: "缺少广告组级广告位证据时不能判断广告位影响。",
      source: "ad_group_products + diagnosis_contract",
    },
    {
      label: "同组投放商品表现",
      value: "B016EXMVZS 花费 22.78 / 订单 11；B016EXMW02 花费 18.41 / 订单 7",
      detail: "只说明同广告组内广告商品承接差异，不能把搜索词自动归因到单个广告 ASIN。",
      source: "advertised_products + ad_product_daily_metrics",
    },
    {
      label: "逐投放上下文",
      value:
        "优先复核广告组：RBK004-beach essentials-精准 / 投放词 beach essentials / 订单 11 / 花费 22.78；对照复核广告组：RBK004-扩展-beach essentials / 投放词 beach essentials / 订单 7 / 花费 18.41",
      detail: "每行只证明该搜索词在对应广告活动、广告组和投放词下的广告表现；不能自动归因到单个广告 ASIN。",
      source: "ad_search_term_daily_metrics",
    },
    { label: "投放词证据", value: "beach essentials / 1 个", detail: "不是完整关键词库证明。", source: "diagnosis_contract" },
    { label: "搜索词边界", value: "beach essentials 只说明同广告组搜索词上下文", source: "ad_search_term_daily_metrics + business_rule" },
    { label: "广告位边界", value: "广告组级广告位 0 条 / 同广告活动广告位 4 条", source: "ad_placement_daily_metrics + business_rule" },
    { label: "ABA 背景", value: "ABA 排名 208 / 2026-06-07 至 2026-06-13", detail: "ABA 只作为站点级市场背景。", source: "diagnosis_contract + ABA导出" },
    { label: "人工确认判断依据", value: "beach essentials 具备人工扩量复核价值", source: "diagnosis_contract" },
    { label: "能证明的事实", value: "该搜索词已有订单和 ABA 站点级机会背景", source: "diagnosis_contract" },
    { label: "不能证明的边界", value: "不能证明单个广告 ASIN 需要自动加词或调价", source: "diagnosis_contract" },
    { label: "人工下一步", value: "人工检查广告组、投放词、广告商品和广告位后再记录复盘", source: "diagnosis_contract" },
    { label: "证据缺口", value: "缺少主推策略和投放词维护状态", source: "diagnosis_contract" },
    { label: "需要补证", value: "补齐投放词维护状态、广告商品承接和主推策略", source: "diagnosis_contract" },
    { label: "动作边界", value: "只允许记录观察、标记已处理、加入复盘或忽略本次", detail: "不得自动加词、否词、调价或暂停广告。", source: "business_rule" },
  ],
};
const readyReviewTodoEvidenceReadback = buildReviewTodoEvidenceReadbackSummary(searchTermReviewTodoWithFullChain);
const readyReviewTodoDecisionReadback = buildReviewTodoDecisionReadbackSummary(searchTermReviewTodoWithFullChain);
const searchTermSnapshotLabels = searchTermReviewTodoWithFullChain.evidence_snapshot?.map((item) => item.label).join(" / ") ?? "";
assertEqual(
  searchTermSnapshotLabels,
  "排查路径 / AI 准入 / 搜索词表现分组 / 搜索词表现判断 / Parent ASIN入口 / 广告 ASIN承接 / 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 投放词证据 / 搜索词边界 / 广告位边界 / ABA 背景 / 人工确认判断依据 / 能证明的事实 / 不能证明的边界 / 人工下一步 / 证据缺口 / 需要补证 / 动作边界",
);
assertEqual(readyReviewTodoEvidenceReadback?.tone, "ready");
assertEqual(readyReviewTodoDecisionReadback?.tone, "ready");
assertIncludes(JSON.stringify(readyReviewTodoDecisionReadback), "复盘待办业务判断读回");
assertIncludes(JSON.stringify(readyReviewTodoDecisionReadback), "搜索词表现判断");
assertIncludes(JSON.stringify(readyReviewTodoDecisionReadback), "扩量复核：订单 23");
assertIncludes(JSON.stringify(readyReviewTodoDecisionReadback), "人工下一步");
assertIncludes(JSON.stringify(readyReviewTodoDecisionReadback), "需要补证");
assertIncludes(JSON.stringify(readyReviewTodoDecisionReadback), "不自动执行广告动作");
assertIncludes(JSON.stringify(readyReviewTodoDecisionReadback), "未到期不判断效果");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "复盘待办证据回读核对");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "业务判断");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "诊断路径");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "广告搜索词表现复核链");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "Parent ASIN 入口、广告 ASIN 承接、搜索词表现判断、广告组合流判断、同组投放商品表现、逐投放上下文、投放词证据、搜索词边界、广告位边界、ABA 背景");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "扩量复核：订单 23");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "广告组合流判断");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "同组投放商品表现");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "逐投放复核顺序");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "优先复核广告组");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "对照复核广告组");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "同广告组广告 ASIN");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "不能自动归因到单个广告 ASIN");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "缺少广告组级广告位证据");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "ReviewRecord 保存前门禁");
assertIncludes(JSON.stringify(readyReviewTodoEvidenceReadback), "不执行广告动作");
const blockedReviewTodoEvidenceReadbackWithoutAdGroupSynthesis = buildReviewTodoEvidenceReadbackSummary({
  ...searchTermReviewTodoWithFullChain,
  evidence_snapshot: searchTermReviewTodoWithFullChain.evidence_snapshot?.filter((item) => item.label !== "广告组合流判断"),
});
assertEqual(blockedReviewTodoEvidenceReadbackWithoutAdGroupSynthesis?.tone, "blocked");
assertIncludes(JSON.stringify(blockedReviewTodoEvidenceReadbackWithoutAdGroupSynthesis), "缺：广告组合流判断");
const blockedReviewTodoEvidenceReadbackWithoutAdContextRows = buildReviewTodoEvidenceReadbackSummary({
  ...searchTermReviewTodoWithFullChain,
  evidence_snapshot: searchTermReviewTodoWithFullChain.evidence_snapshot?.filter((item) => item.label !== "逐投放上下文"),
});
assertEqual(blockedReviewTodoEvidenceReadbackWithoutAdContextRows?.tone, "blocked");
assertIncludes(JSON.stringify(blockedReviewTodoEvidenceReadbackWithoutAdContextRows), "缺：逐投放上下文");
assertIncludes(JSON.stringify(blockedReviewTodoEvidenceReadbackWithoutAdContextRows), "不能回看当时先复核哪个广告组");
const blockedReviewTodoEvidenceReadback = buildReviewTodoEvidenceReadbackSummary({
  ...searchTermReviewTodoWithFullChain,
  evidence_snapshot: searchTermReviewTodoWithFullChain.evidence_snapshot?.filter(
    (item) => !["ABA 背景", "证据缺口", "需要补证"].includes(item.label),
  ),
});
assertEqual(blockedReviewTodoEvidenceReadback?.tone, "blocked");
assertIncludes(JSON.stringify(blockedReviewTodoEvidenceReadback), "缺：ABA 背景 / 证据缺口 / 需要补证");
assertIncludes(JSON.stringify(blockedReviewTodoEvidenceReadback), "不能直接保存可复盘结论");
const blockedReviewTodoDecisionReadback = buildReviewTodoDecisionReadbackSummary({
  ...searchTermReviewTodoWithFullChain,
  evidence_snapshot: searchTermReviewTodoWithFullChain.evidence_snapshot?.filter((item) => item.label !== "搜索词表现判断"),
});
assertEqual(blockedReviewTodoDecisionReadback?.tone, "blocked");
assertIncludes(JSON.stringify(blockedReviewTodoDecisionReadback), "缺少当时为什么进入复盘的判断");
const searchTermManualActionReadbackPathAfterTodo = buildManualActionReadbackPathItems({
  latestManualAction: {
    action_type: "add_to_review",
    evidence_snapshot: searchTermReviewTodoWithFullChain.evidence_snapshot,
  },
  reviewTodos: [
    searchTermReviewTodoWithFullChain,
    { ...searchTermReviewTodoWithFullChain, review_window: "14d" },
  ],
  reviewRecords: [],
});
assertIncludes(searchTermManualActionReadbackPathAfterTodo[1].detail, "待办证据快照：7d 20 条 / 14d 20 条");
assertIncludes(
  searchTermManualActionReadbackPathAfterTodo[1].detail,
  "Parent ASIN 广告搜索词表现复核 / 搜索词表现判断 / 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 投放词证据 / 搜索词边界 / 广告位边界 / ABA 背景",
);
const searchTermManualActionReadbackPathWithoutAdGroupSynthesis = buildManualActionReadbackPathItems({
  latestManualAction: {
    action_type: "add_to_review",
    evidence_snapshot: searchTermReviewTodoWithFullChain.evidence_snapshot,
  },
  reviewTodos: [
    {
      ...searchTermReviewTodoWithFullChain,
      evidence_snapshot: searchTermReviewTodoWithFullChain.evidence_snapshot?.filter((item) => item.label !== "广告组合流判断"),
    },
  ],
  reviewRecords: [],
});
assertIncludes(searchTermManualActionReadbackPathWithoutAdGroupSynthesis[1].detail, "7d 缺广告组合流判断");
const searchTermReviewRecordPreflightChecklist = buildReviewRecordPreflightChecklist(
  searchTermReviewTodoWithFullChain,
  searchTermReviewEffect,
  {
    requestSignalId: "sig-opportunity-search-term-1-beach-essentials",
    stateSignalId: "sig-opportunity-search-term-1-beach-essentials",
    objectType: "search_term",
    objectId: "search_term:1:beach essentials",
  },
);
assertEqual(searchTermReviewRecordPreflightChecklist.length, 21);
assertEqual(
  searchTermReviewRecordPreflightChecklist.map((check) => check.id).slice(4, 14).join(" / "),
  "search_term_performance_decision / ad_group_synthesis / ad_group_product_performance / ad_context_rows / targeting_evidence / search_term_boundary / placement_boundary / aba_context / evidence_gap / required_evidence",
);
assertEqual(searchTermReviewRecordPreflightChecklist[4].id, "search_term_performance_decision");
assertIncludes(searchTermReviewRecordPreflightChecklist[4].description, "搜索词表现判断回看");
assertIncludes(searchTermReviewRecordPreflightChecklist[4].description, "只用于人工复核优先级");
assertEqual(searchTermReviewRecordPreflightChecklist[5].id, "ad_group_synthesis");
assertIncludes(searchTermReviewRecordPreflightChecklist[5].description, "同广告组广告 ASIN");
assertIncludes(searchTermReviewRecordPreflightChecklist[5].description, "不能自动归因到单个广告 ASIN");
assertEqual(searchTermReviewRecordPreflightChecklist[6].id, "ad_group_product_performance");
assertIncludes(searchTermReviewRecordPreflightChecklist[6].description, "同组投放商品表现回看");
assertIncludes(searchTermReviewRecordPreflightChecklist[6].description, "B016EXMVZS");
assertEqual(searchTermReviewRecordPreflightChecklist[7].id, "ad_context_rows");
assertIncludes(searchTermReviewRecordPreflightChecklist[7].description, "逐投放复核顺序回看");
assertIncludes(searchTermReviewRecordPreflightChecklist[7].description, "优先复核广告组");
assertIncludes(searchTermReviewRecordPreflightChecklist[7].description, "不能自动归因到单个广告 ASIN");
assertEqual(searchTermReviewRecordPreflightChecklist[8].id, "targeting_evidence");
assertIncludes(searchTermReviewRecordPreflightChecklist[8].description, "beach essentials");
assertEqual(searchTermReviewRecordPreflightChecklist[9].id, "search_term_boundary");
assertIncludes(searchTermReviewRecordPreflightChecklist[9].description, "beach essentials 只说明同广告组搜索词上下文");
assertEqual(searchTermReviewRecordPreflightChecklist[10].id, "placement_boundary");
assertIncludes(searchTermReviewRecordPreflightChecklist[10].description, "广告组级广告位 0 条");
assertEqual(searchTermReviewRecordPreflightChecklist[11].id, "aba_context");
assertIncludes(searchTermReviewRecordPreflightChecklist[11].description, "ABA 排名 208");
assertEqual(searchTermReviewRecordPreflightChecklist[12].id, "evidence_gap");
assertIncludes(searchTermReviewRecordPreflightChecklist[12].description, "缺少主推策略");
assertEqual(searchTermReviewRecordPreflightChecklist[13].id, "required_evidence");
assertIncludes(searchTermReviewRecordPreflightChecklist[13].description, "补齐投放词维护状态");
assertEqual(searchTermReviewRecordPreflightChecklist[14].id, "manual_action_boundary");
assertIncludes(searchTermReviewRecordPreflightChecklist[14].description, "不得自动加词");
assertEqual(canSaveReviewRecordWithPreflight(searchTermReviewEffect, searchTermReviewRecordPreflightChecklist), true);
const searchTermSavedReviewRecord: ReviewRecordForUi = {
  ...searchTermReviewEffect,
  review_note: "SearchTerm 复盘已按广告结构回看",
  evidence_snapshot: searchTermReviewTodoWithFullChain.evidence_snapshot,
  review_context: {
    search_intent_label: "规则语义：海滩出行用品",
    search_term: "beach essentials",
    repeat_search_intent_count: 4,
    repeat_summary: "同一 Parent ASIN 搜索词表现聚合已有 4 次人工留痕，复盘时应判断规则反馈口径是否需要人工复核。",
    can_auto_change_rules: false,
    can_auto_execute_ads: false,
  },
};
assertIncludes(reviewRecordStatusText(searchTermSavedReviewRecord), "复盘证据快照：7d 20 条");
assertIncludes(reviewRecordStatusText(searchTermSavedReviewRecord), "Parent ASIN 广告搜索词表现复核 / 搜索词表现判断 / 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 投放词证据 / 搜索词边界 / 广告位边界 / ABA 背景");
assertIncludes(reviewRecordStatusText(searchTermSavedReviewRecord), "复盘上下文：Parent ASIN 广告搜索词表现复核：规则语义：海滩出行用品");
assertIncludes(reviewRecordStatusText(searchTermSavedReviewRecord), "具体 SearchTerm：beach essentials");
assertIncludes(reviewRecordStatusText(searchTermSavedReviewRecord), "人工复盘下一步：按同类广告搜索词表现核对规则口径");
assertIncludes(
  reviewRecordReadbackStatus([searchTermSavedReviewRecord], {
    actionId: "manual-action-search-term",
    objectType: "search_term",
    objectId: "search_term:1:beach essentials",
    reviewWindow: "7d",
  }),
  "可回看对象引用 / 排查路径 / AI 准入 / Parent ASIN 广告搜索词表现复核 / 搜索词表现判断 / 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 投放词证据 / 搜索词边界 / 广告位边界 / ABA 背景",
);
assertIncludes(
  reviewRecordReadbackStatus(
    [
      {
        ...searchTermSavedReviewRecord,
        evidence_snapshot: searchTermSavedReviewRecord.evidence_snapshot?.filter((item) => item.label !== "广告组合流判断"),
      },
    ],
    {
      actionId: "manual-action-search-term",
      objectType: "search_term",
      objectId: "search_term:1:beach essentials",
      reviewWindow: "7d",
    },
  ),
  "7d 缺广告组合流判断",
);
for (const label of ["搜索词表现判断", "广告组合流判断", "同组投放商品表现", "逐投放上下文", "投放词证据", "搜索词边界", "广告位边界", "ABA 背景", "证据缺口", "需要补证", "动作边界"]) {
  const checklist = buildReviewRecordPreflightChecklist(
    {
      ...searchTermReviewTodoWithFullChain,
      evidence_snapshot: searchTermReviewTodoWithFullChain.evidence_snapshot?.filter((item) => item.label !== label),
    },
    searchTermReviewEffect,
    null,
  );
  assertEqual(canSaveReviewRecordWithPreflight(searchTermReviewEffect, checklist), false);
}
const placementReviewEffect: ReviewEffectForUi = {
  ...improvedEffect,
  signal_id: "sig-placement-gap:1:top-of-search",
  action_id: "manual-action-placement",
  action_type: "add_to_review",
  object_type: "placement",
  object_id: "Top of Search",
  object_label: "Top of Search",
  before_metrics: { cost: 120, orders: 2, sales: 80, acos: 1.5 },
  after_metrics: { cost: 90, orders: 4, sales: 180, acos: 0.5 },
};
const placementReviewTodoWithFullChain: ReviewTodoForUi = {
  ...dueTodo,
  signal_id: "sig-placement-gap:1:top-of-search",
  shop_id: "market:1",
  market_id: 1,
  object_type: "placement",
  object_id: "Top of Search",
  object_label: "Top of Search",
  action_id: "manual-action-placement",
  action_type: "add_to_review",
  evidence_snapshot: [
    { label: "排查路径", value: "Parent 经营盘子 -> 广告活动 -> 广告位 -> 人工复盘", source: "business_rule" },
    { label: "AI 准入", value: "可进入人工确认 / ready_for_manual_confirmation / 允许人工留痕", source: "actionability_status" },
    { label: "搜索词边界", value: "搜索词只说明同广告组上下文，不能自动归因到单个广告 ASIN。", source: "business_rule" },
    { label: "广告位边界", value: "Top of Search 是广告位层级对象，不能替代广告组级证据。", source: "ad_placement_daily_metrics" },
    { label: "人工确认判断依据", value: "Top of Search 花费高但订单承接弱，只能进入人工广告位复核。", source: "diagnosis_contract" },
    { label: "能证明的事实", value: "当前广告位层级存在花费和订单承接差异。", source: "diagnosis_contract" },
    { label: "不能证明的边界", value: "不能证明应该自动调整广告位加价或归因到单个 ASIN。", source: "diagnosis_contract" },
    { label: "人工下一步", value: "人工核对广告位、搜索词和广告商品后再加入复盘。", source: "diagnosis_contract" },
    {
      label: "广告位表现",
      value: "Top of Search：花费 120 / 订单 2 / ACOS 150.00%",
      detail: "只能说明广告位层级表现差异，不能自动归因到单个搜索词、广告组或广告 ASIN。",
      source: "diagnosis_contract + ad_placement_daily_metrics",
    },
    { label: "证据缺口", value: "缺少同广告活动 / 广告组搜索词和广告商品承接证据。", source: "diagnosis_contract" },
    { label: "需要补证", value: "补齐同广告活动广告位对比、搜索词上下文和广告商品承接证据。", source: "diagnosis_contract" },
    {
      label: "动作边界",
      value: "只允许记录观察、标记已处理、加入复盘或忽略本次。",
      detail: "不得自动调整广告位加价、自动调价、自动暂停、自动加词或自动否词。",
      source: "business_rule",
    },
  ],
};
const readyPlacementReviewTodoEvidenceReadback = buildReviewTodoEvidenceReadbackSummary(placementReviewTodoWithFullChain);
assertEqual(readyPlacementReviewTodoEvidenceReadback?.tone, "ready");
assertIncludes(JSON.stringify(readyPlacementReviewTodoEvidenceReadback), "广告位复核链");
assertIncludes(JSON.stringify(readyPlacementReviewTodoEvidenceReadback), "广告位表现");
assertIncludes(JSON.stringify(readyPlacementReviewTodoEvidenceReadback), "自动调整广告位加价");
const placementReviewRecordPreflightChecklist = buildReviewRecordPreflightChecklist(
  placementReviewTodoWithFullChain,
  placementReviewEffect,
  {
    requestSignalId: "sig-placement-gap:1:top-of-search",
    stateSignalId: "sig-placement-gap:1:top-of-search",
    objectType: "placement",
    objectId: "Top of Search",
  },
);
assertEqual(placementReviewRecordPreflightChecklist.length, 16);
assertEqual(placementReviewRecordPreflightChecklist[6].id, "placement_performance");
assertIncludes(placementReviewRecordPreflightChecklist[6].description, "Top of Search");
assertEqual(placementReviewRecordPreflightChecklist[7].id, "evidence_gap");
assertIncludes(placementReviewRecordPreflightChecklist[7].description, "广告商品承接证据");
assertEqual(placementReviewRecordPreflightChecklist[8].id, "required_evidence");
assertIncludes(placementReviewRecordPreflightChecklist[8].description, "同广告活动广告位对比");
assertEqual(placementReviewRecordPreflightChecklist[9].id, "manual_action_boundary");
assertIncludes(placementReviewRecordPreflightChecklist[9].description, "不得自动调整广告位加价");
assertEqual(canSaveReviewRecordWithPreflight(placementReviewEffect, placementReviewRecordPreflightChecklist), true);
for (const label of ["广告位表现", "证据缺口", "需要补证", "动作边界"]) {
  const checklist = buildReviewRecordPreflightChecklist(
    {
      ...placementReviewTodoWithFullChain,
      evidence_snapshot: placementReviewTodoWithFullChain.evidence_snapshot?.filter((item) => item.label !== label),
    },
    placementReviewEffect,
    null,
  );
  assertEqual(canSaveReviewRecordWithPreflight(placementReviewEffect, checklist), false);
}
const reviewRecordRequestPayload = buildReviewRecordRequestPayload(
  {
    ...improvedEffect,
    action_id: "manual-action-ad-product",
    object_type: "advertised_product",
    object_id: "B016EXMW02",
    review_window: "7d",
  },
  { ...reviewTodoWithDiagnosisPath, action_id: "manual-action-ad-product" },
  "确认处理有效",
);
assertEqual(reviewRecordRequestPayload.review_note, "确认处理有效");
assertEqual(reviewRecordRequestPayload.expected_action_id, "manual-action-ad-product");
assertEqual(reviewRecordRequestPayload.expected_object_type, "advertised_product");
assertEqual(reviewRecordRequestPayload.expected_object_id, "B016EXMW02");
assertEqual(reviewRecordRequestPayload.expected_review_window, "7d");
assertEqual(reviewRecordRequestPayload.expected_evidence_snapshot.length, 15);
assertEqual(reviewRecordRequestPayload.expected_evidence_snapshot[0].label, "排查路径");
assertEqual(reviewRecordRequestPayload.expected_evidence_snapshot[1].label, "AI 准入");
assertEqual(reviewRecordRequestPayload.expected_evidence_snapshot[2].label, "搜索词边界");
assertEqual(reviewRecordRequestPayload.expected_evidence_snapshot[3].label, "广告位边界");
assertEqual(reviewRecordRequestPayload.expected_can_auto_execute_ads, false);
assertEqual(reviewRecordRequestPayload.expected_can_auto_change_rules, false);
assertEqual(
  reviewCheckpointText(pendingTodo, null),
  "14 天复盘未到期：到 2026-06-15 后再判断处理前后指标，未到期前不保存复盘记录。",
);
assertEqual(
  reviewCheckpointText(pendingTodo, notReadyEffect),
  "14 天复盘未到期：到 2026-06-15 后再判断处理前后指标；当前复盘效果仅说明窗口尚未完整，未到期前不保存复盘记录。",
);
assertNotIncludes(reviewCheckpointText(pendingTodo, notReadyEffect), "可以保存复盘记录");
assertEqual(
  reviewCheckpointText(dueTodo, notReadyEffect),
  "7 天复盘已到期：复盘效果暂不可计算：缺少处理后 7 天快照",
);
assertEqual(
  reviewCheckpointText(dueTodo, improvedEffect),
  "7 天复盘已到期：已具备处理前后指标，可以保存复盘记录。",
);
assertEqual(
  reviewCheckpointText(null, null),
  "暂无复盘待办：记录观察、标记已处理或加入复盘后才会生成 7/14 天复盘。",
);
const emptyManualActionPreflightText = manualActionEmptyStateText(null);
assertIncludes(emptyManualActionPreflightText, "当前未产生证据快照留痕");
assertIncludes(emptyManualActionPreflightText, "先读取后端预检");
assertIncludes(emptyManualActionPreflightText, "记录观察、标记已处理、加入复盘或忽略本次");
const readyManualActionPreflightText = manualActionEmptyStateText({
  status: "ready",
  will_write: false,
  requires_explicit_authorization: true,
  target: { object_type: "search_term", object_id: "beach essentials", review_windows: ["7d", "14d"] },
  current_counts: { target_manual_action_count: 0, target_review_todo_count: 0, target_review_record_count: 0 },
  expected_after_write: { target_manual_action_count: 1, target_review_todo_count: 2, target_review_record_count: 0 },
  evidence_snapshot_preview: {
    item_count: 7,
    will_write: false,
    will_save_on_authorized_write: true,
    items: [{ label: "搜索词表现", value: "beach essentials / 订单 7" }],
  },
  forbidden_effects: ["不执行广告动作", "不保存 review_records"],
});
assertIncludes(readyManualActionPreflightText, "后端预检已给出 7 条将保存的证据快照");
assertIncludes(readyManualActionPreflightText, "will_write=false");
assertIncludes(readyManualActionPreflightText, "人工点击后才保存留痕和复盘待办");
assertIncludes(readyManualActionPreflightText, "不执行广告动作");
assertNotIncludes(readyManualActionPreflightText, "已执行广告动作");
const readyAuthorizationSummary = manualActionAuthorizationReadinessSummary({
  status: "ready_for_explicit_manual_write",
  will_write: false,
  requires_explicit_authorization: true,
  target: {
    object_type: "search_term",
    object_id: "gerpgo_market_1_20260616_120443:507942344",
    object_label: "boys sunglasses",
    review_windows: ["7d", "14d"],
  },
  current_counts: { target_manual_action_count: 0, target_review_todo_count: 0, target_review_record_count: 0 },
  expected_after_write: { target_manual_action_count: 1, target_review_todo_count: 2, target_review_record_count: 0 },
  evidence_snapshot_preview: {
    item_count: 21,
    will_write: false,
    will_save_on_authorized_write: true,
  },
  blockers: [],
});
assertEqual(readyAuthorizationSummary?.tone, "ready");
assertIncludes(readyAuthorizationSummary?.primary ?? "", "只读预检已通过");
assertIncludes(readyAuthorizationSummary?.target ?? "", "boys sunglasses");
assertIncludes(readyAuthorizationSummary?.currentState ?? "", "ManualAction 0 条 / ReviewTodo 0 条");
assertIncludes(readyAuthorizationSummary?.authorizedResult ?? "", "ManualAction 1 条 / ReviewTodo 2 条");
assertIncludes(readyAuthorizationSummary?.authorizedResult ?? "", "7d / 14d");
assertIncludes(readyAuthorizationSummary?.evidence ?? "", "21 条");
assertIncludes(readyAuthorizationSummary?.evidence ?? "", "继承到 ReviewTodo");
assertIncludes(readyAuthorizationSummary?.boundary ?? "", "ready 只代表可人工确认");
assertIncludes(readyAuthorizationSummary?.boundary ?? "", "未授权前不写 manual_actions");
assertEqual(
  manualActionAuthorizationReadinessSummary({ status: "blocked", blockers: [{ code: "duplicate_manual_action" }] })?.tone,
  "blocked",
);
const emptyReviewTodoBeforeActionText = reviewTodoEmptyStateText(null);
assertIncludes(emptyReviewTodoBeforeActionText, "当前还没有人工留痕");
assertIncludes(emptyReviewTodoBeforeActionText, "先完成人工记录或加入复盘后");
assertIncludes(emptyReviewTodoBeforeActionText, "7/14 天复盘排程");
const emptyReviewTodoAfterActionText = reviewTodoEmptyStateText({
  action_type: "handled",
  evidence_snapshot: [{ label: "搜索词表现", value: "beach essentials / 订单 7" }],
});
assertIncludes(emptyReviewTodoAfterActionText, "已有人工留痕但未读到 7/14 天待办");
assertIncludes(emptyReviewTodoAfterActionText, "不能保存复盘结论");
const manualActionPathStepsBeforeWrite = buildManualActionPathSteps({
  preflight: {
    status: "ready_for_explicit_manual_write",
    will_write: false,
    requires_explicit_authorization: true,
    current_counts: { target_manual_action_count: 0, target_review_todo_count: 0, target_review_record_count: 0 },
    expected_after_write: { target_manual_action_count: 1, target_review_todo_count: 2, target_review_record_count: 0 },
    evidence_snapshot_preview: {
      item_count: 7,
      will_write: false,
      will_save_on_authorized_write: true,
      items: [{ label: "搜索词表现", value: "beach essentials / 订单 7" }],
    },
    forbidden_effects: ["不执行广告动作", "不保存 review_records"],
  },
  preflightError: null,
  latestManualAction: null,
  hasReviewTodo: false,
});
assertEqual(manualActionPathStepsBeforeWrite.length, 4);
assertEqual(manualActionPathStepsBeforeWrite[0].label, "后端预检");
assertEqual(manualActionPathStepsBeforeWrite[0].value, "已通过");
assertIncludes(manualActionPathStepsBeforeWrite[0].detail, "will_write=false");
assertEqual(manualActionPathStepsBeforeWrite[1].label, "证据快照");
assertEqual(manualActionPathStepsBeforeWrite[1].value, "7 条");
assertIncludes(manualActionPathStepsBeforeWrite[1].detail, "人工点击后保存");
assertEqual(manualActionPathStepsBeforeWrite[2].label, "人工留痕");
assertEqual(manualActionPathStepsBeforeWrite[2].value, "待人工点击");
assertIncludes(manualActionPathStepsBeforeWrite[2].detail, "记录观察、标记已处理、加入复盘或忽略本次");
assertEqual(manualActionPathStepsBeforeWrite[3].label, "7/14 天复盘");
assertEqual(manualActionPathStepsBeforeWrite[3].value, "留痕后生成");
assertIncludes(manualActionPathStepsBeforeWrite[3].detail, "不保存复盘结论");
const manualActionPathStepsAfterTodo = buildManualActionPathSteps({
  preflight: null,
  preflightError: null,
  latestManualAction: {
    action_type: "handled",
    evidence_snapshot: [{ label: "搜索词表现", value: "beach essentials / 订单 7" }],
  },
  hasReviewTodo: true,
});
assertEqual(manualActionPathStepsAfterTodo[2].value, "已留痕");
assertEqual(manualActionPathStepsAfterTodo[3].value, "已排程");
assertIncludes(manualActionPathStepsAfterTodo[3].detail, "只表示进入排程");
const manualActionReadbackPathBeforeWrite = buildManualActionReadbackPathItems({
  latestManualAction: null,
  reviewTodos: [],
  reviewRecords: [],
});
assertEqual(manualActionReadbackPathBeforeWrite.length, 3);
assertEqual(manualActionReadbackPathBeforeWrite[0].label, "留痕读回");
assertEqual(manualActionReadbackPathBeforeWrite[0].value, "未触发");
assertEqual(manualActionReadbackPathBeforeWrite[1].label, "待办读回");
assertEqual(manualActionReadbackPathBeforeWrite[1].value, "无待办");
assertEqual(manualActionReadbackPathBeforeWrite[2].label, "复盘结论");
assertEqual(manualActionReadbackPathBeforeWrite[2].value, "未保存");
const manualActionReadbackPathAfterTodo = buildManualActionReadbackPathItems({
  latestManualAction: {
    action_type: "handled",
    evidence_snapshot: [{ label: "搜索词表现", value: "beach essentials / 订单 7" }],
  },
  reviewTodos: [dueTodoWithCompleteEvidence, pendingTodoWithCompleteEvidence],
  reviewRecords: [],
});
assertEqual(manualActionReadbackPathAfterTodo[0].value, "已读回");
assertIncludes(manualActionReadbackPathAfterTodo[0].detail, "不代表广告动作已执行");
assertEqual(manualActionReadbackPathAfterTodo[1].value, "7d / 14d");
assertIncludes(manualActionReadbackPathAfterTodo[1].detail, "待办证据快照：7d 4 条 / 14d 4 条");
assertIncludes(manualActionReadbackPathAfterTodo[1].detail, "可回看对象引用 / 排查路径 / AI 准入 / 搜索词边界 / 广告位边界");
assertIncludes(manualActionReadbackPathAfterTodo[1].detail, "只表示进入排程");
assertEqual(manualActionReadbackPathAfterTodo[2].value, "未保存结论");
assertIncludes(manualActionReadbackPathAfterTodo[2].detail, "不保存 review_records");
const manualActionReadbackPathWithEvidenceGap = buildManualActionReadbackPathItems({
  latestManualAction: {
    action_type: "handled",
    evidence_snapshot: [{ label: "搜索词表现", value: "beach essentials / 订单 7" }],
  },
  reviewTodos: [{ ...dueTodo, evidence_snapshot: [{ label: "排查路径", value: "只有路径" }] }],
  reviewRecords: [],
});
assertEqual(manualActionReadbackPathWithEvidenceGap[1].value, "7d");
assertIncludes(manualActionReadbackPathWithEvidenceGap[1].detail, "待办证据快照待核对：7d 1 条");
assertIncludes(manualActionReadbackPathWithEvidenceGap[1].detail, "7d 缺对象引用 / AI 准入 / 搜索词边界 / 广告位边界");
assertIncludes(manualActionReadbackPathWithEvidenceGap[1].detail, "缺口未补齐前不能保存结论");
const manualActionReadbackPathWithObjectMismatch = buildManualActionReadbackPathItems({
  latestManualAction: {
    action_type: "handled",
    evidence_snapshot: [{ label: "搜索词表现", value: "beach essentials / 订单 7" }],
  },
  reviewTodos: [
    { ...dueTodoWithCompleteEvidence, object_id: "B07OTHERASIN", object_label: "B07OTHERASIN" },
    { ...pendingTodoWithCompleteEvidence, object_id: "B07OTHERASIN", object_label: "B07OTHERASIN" },
  ],
  reviewRecords: [],
});
assertIncludes(manualActionReadbackPathWithObjectMismatch[1].detail, "待办证据快照待核对：7d 4 条 / 14d 4 条");
assertIncludes(manualActionReadbackPathWithObjectMismatch[1].detail, "7d 缺对象引用");
assertIncludes(manualActionReadbackPathWithObjectMismatch[1].detail, "14d 缺对象引用");
const manualActionReadbackPathAfterRecord = buildManualActionReadbackPathItems({
  latestManualAction: {
    action_type: "handled",
    evidence_snapshot: [{ label: "搜索词表现", value: "beach essentials / 订单 7" }],
  },
  reviewTodos: [dueTodoWithCompleteEvidence, pendingTodoWithCompleteEvidence],
  reviewRecords: [savedReviewRecord],
});
assertEqual(manualActionReadbackPathAfterRecord[2].value, "已保存");
assertIncludes(manualActionReadbackPathAfterRecord[2].detail, "复盘证据快照：7d 4 条");
assertIncludes(manualActionReadbackPathAfterRecord[2].detail, "可回看对象引用");
assertIncludes(manualActionReadbackPathAfterRecord[2].detail, "不自动执行广告动作");
const manualActionIdentityGateItems = buildManualActionIdentityGateItems({
  signal: {
    id: "sig-long-tail-beach-current",
    shop_id: "market:1",
    market_id: 1,
    object_type: "search_term",
    evidence: {
      primary_object: {
        object_type: "search_term",
        object_id: "beach essentials for toddlers 1-3",
        label: "beach essentials for toddlers 1-3",
      },
    },
  },
  preflight: {
    status: "ready_for_explicit_manual_write",
    will_write: false,
    requires_explicit_authorization: true,
    target: {
      signal_id: "sig-long-tail-beach-current",
      action_type: "add_to_review",
      object_type: "search_term",
      object_id: "beach essentials for toddlers 1-3",
      review_windows: ["7d", "14d"],
    },
    blockers: [],
    forbidden_effects: ["不执行广告动作"],
  },
  latestManualAction: {
    id: "manual-action-search-term",
    signal_id: "sig-long-tail-beach-current",
    action_type: "handled",
    shop_id: "market:1",
    market_id: 1,
    object_type: "search_term",
    object_id: "beach essentials for toddlers 1-3",
    evidence_snapshot: [{ label: "搜索词表现", value: "beach essentials / 订单 7" }],
  },
  nextReviewTodo: {
    ...dueTodo,
    signal_id: "sig-long-tail-beach-current",
    action_id: "manual-action-search-term",
    shop_id: "market:1",
    market_id: 1,
    object_type: "search_term",
    object_id: "beach essentials for toddlers 1-3",
    object_label: "beach essentials for toddlers 1-3",
    evidence_snapshot: [
      { label: "排查路径", value: "Parent ASIN -> 广告 ASIN -> 广告组 -> beach essentials for toddlers 1-3", source: "business_rule" },
      { label: "AI 准入", value: "允许人工留痕，不执行广告动作", source: "actionability_status" },
      { label: "搜索词表现分组", value: "规则语义：海滩出行用品", source: "规则语义" },
      { label: "搜索词表现判断", value: "观察复核：样本偏少，只用于人工复核优先级", source: "ad_search_term_daily_metrics" },
      { label: "广告组合流判断", value: "同广告组广告 ASIN 2 个；搜索词不能自动归因到单个广告 ASIN", source: "diagnosis_contract" },
      { label: "同组投放商品表现", value: "B016EXMVZS 与 B016EXMW02 同组投放表现已回看", source: "ad_product_daily_metrics" },
      { label: "逐投放上下文", value: "beach essentials for toddlers 1-3：优先复核广告组和投放词", source: "ad_search_term_daily_metrics" },
      { label: "投放词证据", value: "beach essentials for toddlers 1-3 / 1 个", source: "ad_search_term_daily_metrics" },
      { label: "搜索词边界", value: "搜索词只说明同广告组上下文", source: "business_rule" },
      { label: "广告位边界", value: "广告位缺口不能自动归因", source: "business_rule" },
      { label: "ABA 背景", value: "ABA 只作为站点级背景", source: "ABA导出" },
    ],
  },
  fallbackMarketId: 1,
});
assertEqual(manualActionIdentityGateItems.length, 4);
assertEqual(manualActionIdentityGateItems[0].label, "当前信号");
assertIncludes(manualActionIdentityGateItems[0].value, "sig-long-tail-beach-current");
assertIncludes(manualActionIdentityGateItems[0].detail, "具体 SearchTerm：beach essentials for toddlers 1-3");
assertIncludes(manualActionIdentityGateItems[0].detail, "search_term / search_term:1:beach essentials for toddlers 1-3");
assertEqual(manualActionIdentityGateItems[1].label, "预检目标");
assertEqual(manualActionIdentityGateItems[1].value, "身份一致");
assertIncludes(manualActionIdentityGateItems[1].detail, "具体 SearchTerm：beach essentials for toddlers 1-3");
assertIncludes(manualActionIdentityGateItems[1].detail, "will_write=false");
assertEqual(manualActionIdentityGateItems[2].label, "留痕读回");
assertEqual(manualActionIdentityGateItems[2].value, "已读回");
assertIncludes(manualActionIdentityGateItems[2].detail, "manual-action-search-term");
assertIncludes(manualActionIdentityGateItems[2].detail, "具体 SearchTerm：beach essentials for toddlers 1-3");
assertEqual(manualActionIdentityGateItems[3].label, "复盘待办");
assertEqual(manualActionIdentityGateItems[3].value, "7d 已读回");
assertIncludes(manualActionIdentityGateItems[3].detail, "action_id manual-action-search-term");
assertIncludes(manualActionIdentityGateItems[3].detail, "复盘对象：具体 SearchTerm：beach essentials for toddlers 1-3");
assertIncludes(manualActionIdentityGateItems[3].detail, "待办证据快照：7d 11 条");
assertIncludes(manualActionIdentityGateItems[3].detail, "Parent ASIN 广告搜索词表现复核 / 搜索词表现判断 / 广告组合流判断 / 同组投放商品表现 / 逐投放上下文");
const prefixedSearchTermIdentityGateItems = buildManualActionIdentityGateItems({
  signal: {
    id: "sig-opportunity-search-term-1-beach-essentials",
    shop_id: "market:1",
    market_id: 1,
    object_type: "search_term",
    evidence: {
      primary_object: {
        object_type: "search_term",
        object_id: "search_term:1:beach essentials",
        label: "beach essentials",
      },
    },
  },
  preflight: {
    status: "ready_for_explicit_manual_write",
    will_write: false,
    requires_explicit_authorization: true,
    target: {
      signal_id: "sig-opportunity-search-term-1-beach-essentials",
      action_type: "add_to_review",
      object_type: "search_term",
      object_id: "search_term:1:beach essentials",
      object_label: "beach essentials",
      shop_id: "market:1",
      market_id: 1,
      review_windows: ["7d", "14d"],
    },
    blockers: [],
    forbidden_effects: ["不执行广告动作"],
  },
  latestManualAction: null,
  nextReviewTodo: null,
  fallbackMarketId: 1,
});
assertEqual(prefixedSearchTermIdentityGateItems[0].value, "sig-opportunity-search-term-1-beach-essentials");
assertIncludes(prefixedSearchTermIdentityGateItems[0].detail, "具体 SearchTerm：beach essentials");
assertIncludes(prefixedSearchTermIdentityGateItems[0].detail, "search_term / search_term:1:beach essentials");
assertEqual(prefixedSearchTermIdentityGateItems[1].value, "身份一致");
assertIncludes(prefixedSearchTermIdentityGateItems[1].detail, "具体 SearchTerm：beach essentials");
assertNotIncludes(prefixedSearchTermIdentityGateItems[1].detail, "object_id 不一致");
const identityGateItemsWithEvidenceGap = buildManualActionIdentityGateItems({
  signal: {
    id: "sig-opportunity-search-term-1-beach-essentials",
    shop_id: "market:1",
    market_id: 1,
    object_type: "search_term",
    evidence: {
      primary_object: {
        object_type: "search_term",
        object_id: "search_term:1:beach essentials",
        label: "beach essentials",
      },
    },
  },
  preflight: null,
  latestManualAction: null,
  nextReviewTodo: {
    ...dueTodo,
    signal_id: "sig-opportunity-search-term-1-beach-essentials",
    action_id: "manual-action-missing-evidence",
    market_id: 1,
    object_type: "search_term",
    object_id: "search_term:1:beach essentials",
    object_label: "beach essentials",
    evidence_snapshot: [],
  },
  fallbackMarketId: 1,
});
assertEqual(identityGateItemsWithEvidenceGap[3].value, "7d 已读回");
assertIncludes(identityGateItemsWithEvidenceGap[3].detail, "待办证据快照待核对：7d 0 条");
assertIncludes(identityGateItemsWithEvidenceGap[3].detail, "缺证据快照 / 对象引用");
const mismatchedManualActionIdentityGateItems = buildManualActionIdentityGateItems({
  signal: {
    id: "sig-long-tail-beach-current",
    shop_id: "market:1",
    market_id: 1,
    object_type: "search_term",
    evidence: { primary_object: { object_type: "search_term", object_id: "beach essentials", label: "beach essentials" } },
  },
  preflight: null,
  latestManualAction: {
    id: "manual-action-other",
    signal_id: "sig-other",
    action_type: "handled",
    market_id: 2,
    object_type: "advertised_product",
    object_id: "B016EXMW02",
  },
  nextReviewTodo: null,
  fallbackMarketId: 1,
});
assertEqual(mismatchedManualActionIdentityGateItems[2].value, "待核对");
assertIncludes(mismatchedManualActionIdentityGateItems[2].detail, "signal_id 不一致");
assertIncludes(mismatchedManualActionIdentityGateItems[2].detail, "object_type 不一致");
assertIncludes(mismatchedManualActionIdentityGateItems[2].detail, "market_id 不一致");
assertEqual(
  reviewMetricComparisonRows({
    ...notReadyEffect,
    before_metrics: { cost: 19.08, orders: 7, sales: 69.93, acos: 0.2728 },
    after_metrics: {},
  })[0].after,
  "-",
);
assertEqual(
  reviewMetricComparisonRows({
    ...notReadyEffect,
    before_metrics: { cost: 19.08, orders: 7, sales: 69.93, acos: 0.2728 },
    after_metrics: {},
  }).length,
  4,
);
const metricRows = reviewMetricComparisonRows({
  ...improvedEffect,
  before_metrics: { cost: 80, orders: 1, sales: 50, acos: 1.6 },
  after_metrics: { cost: 60, orders: 5, sales: 200, acos: 0.3 },
});
assertEqual(metricRows.length, 4);
assertEqual(metricRows[0].label, "花费");
assertEqual(metricRows[0].before, "80.00");
assertEqual(metricRows[0].after, "60.00");
assertEqual(metricRows[3].label, "ACOS");
assertEqual(metricRows[3].before, "160.0%");
assertEqual(metricRows[3].after, "30.0%");
assertEqual(reviewRecordStatusText(null), "暂无复盘记录");
assertIncludes(reviewRecordStatusText({ result: "improved", review_note: "确认处理有效" }), "最近复盘：improved / 确认处理有效");
assertIncludes(reviewRecordStatusText({ result: "improved", review_note: "确认处理有效" }), "复盘证据快照待核对");
assertIncludes(reviewRecordStatusText(savedReviewRecord), "复盘证据快照：7d 4 条");
assertEqual(
  manualActionBoundaryText({ action_type: "ignore" }),
  "忽略本次只表示当前不进入复盘待办；信号和证据仍保留，不代表误报或已删除。",
);
assertEqual(
  manualActionBoundaryText({ action_type: "handled" }),
  "标记已处理只表示已记录人工处理动作；是否改善需要等复盘效果计算或人工复盘确认。",
);
assertEqual(
  manualActionBoundaryText({ action_type: "add_to_review" }),
  "加入复盘只表示进入后续复盘待办；不代表已经产生改善、无变化或恶化结论。",
);
assertEqual(manualActionBoundaryText({ action_type: "observe" }), null);
assertEqual(
  manualActionIntentText("add_to_review"),
  "人工加入复盘，生成 7/14 天复盘待办；不自动执行广告动作，也不代表已有改善结论。",
);
assertEqual(
  manualActionIntentText("handled"),
  "人工标记已处理，生成 7/14 天复盘待办；不自动执行广告动作，效果要等 ready 复盘。",
);
assertEqual(
  manualActionIntentText("observe"),
  "人工记录当前观察，生成 7/14 天复盘待办；不自动执行广告动作，暂不判断处理效果。",
);
assertEqual(
  manualActionIntentText("ignore"),
  "人工忽略本次，不进入当前 7/14 天复盘待办；不自动执行广告动作，信号和证据保留。",
);
assertEqual(
  manualActionPostWriteExpectationText("observe"),
  "写后预期：只写 1 条人工留痕，生成 7 天和 14 天复盘待办；不会保存复盘结论，不执行广告动作。",
);
assertEqual(
  manualActionPostWriteExpectationText("handled"),
  "写后预期：只写 1 条人工留痕，生成 7 天和 14 天复盘待办；不会保存复盘结论，不执行广告动作。",
);
assertEqual(
  manualActionPostWriteExpectationText("add_to_review"),
  "写后预期：只写 1 条人工留痕，生成 7 天和 14 天复盘待办；不会保存复盘结论，不执行广告动作。",
);
assertEqual(
  manualActionPostWriteExpectationText("ignore"),
  "写后预期：只写 1 条人工留痕，不生成当前复盘待办；不会保存复盘结论，不执行广告动作。",
);
assertEqual(
  manualActionPostWriteExpectationSummaryText(),
  "写后预期：复盘类只生成 7d/14d 待办（排程）；忽略 0 条；未到 ready 不保存结论，不执行广告动作。",
);
assertIncludes(
  manualActionPreflightStatusText({
    status: "ready_for_explicit_manual_write",
    mode: "pre_write",
    will_write: false,
    requires_explicit_authorization: true,
    target: {
      action_type: "add_to_review",
      object_type: "sales_product",
      object_id: "B06VW5SQ97",
      review_windows: ["7d", "14d"],
    },
    current_counts: {
      target_manual_action_count: 0,
      target_review_todo_count: 0,
    },
    expected_after_write: {
      target_manual_action_count: 1,
      target_review_todo_count: 2,
    },
    blockers: [],
    forbidden_effects: ["不执行广告动作", "不保存 review_records"],
  }),
  "后端预检通过，待人工授权：sales_product / B06VW5SQ97 当前 0 条留痕、0 条待办；授权点击后预计 1 条留痕、2 条待办；本接口 will_write=false，不执行广告动作，不保存复盘结论。",
);
const postWriteVerifiedPreflight = {
  status: "post_write_verified",
  mode: "post_write",
  will_write: false,
  requires_explicit_authorization: false,
  target: {
    action_type: "add_to_review",
    object_type: "sales_product",
    object_id: "B06VW5SQ97",
    review_windows: ["7d", "14d"],
  },
  current_counts: {
    target_manual_action_count: 1,
    target_review_todo_count: 2,
  },
  expected_after_write: {
    target_manual_action_count: 1,
    target_review_todo_count: 2,
  },
  blockers: [],
  forbidden_effects: ["不执行广告动作", "不保存 review_records"],
  post_write_checks: {
    target_manual_action_evidence_snapshot_counts: [
      {
        signal_id: "sig-sales-product",
        object_type: "sales_product",
        object_id: "B06VW5SQ97",
        evidence_snapshot_count: 8,
      },
    ],
    target_review_todo_evidence_snapshot_counts: [
      {
        signal_id: "sig-sales-product",
        object_type: "sales_product",
        object_id: "B06VW5SQ97",
        review_window: "7d",
        evidence_snapshot_count: 8,
      },
      {
        signal_id: "sig-sales-product",
        object_type: "sales_product",
        object_id: "B06VW5SQ97",
        review_window: "14d",
        evidence_snapshot_count: 8,
      },
    ],
  },
};
assertIncludes(
  manualActionPreflightStatusText(postWriteVerifiedPreflight),
  "写后验收通过：sales_product / B06VW5SQ97 当前 1 条留痕、2 条待办；复盘待办只表示进入排程，未到期不判断效果；证据读回：留痕 8 条，复盘待办 7d 8 条 / 14d 8 条；不执行广告动作，不保存复盘结论。",
);
assertIncludes(
  manualActionPreflightStatusText(postWriteVerifiedPreflight),
  "证据读回：留痕 8 条，复盘待办 7d 8 条 / 14d 8 条",
);
const readyManualActionPreflight = {
  status: "ready_for_explicit_manual_write",
  mode: "pre_write",
  will_write: false,
  requires_explicit_authorization: true,
  target: {
    action_type: "add_to_review",
    object_type: "sales_product",
    object_id: "B06VW5SQ97",
    review_windows: ["7d", "14d"],
  },
  current_counts: {
    target_manual_action_count: 0,
    target_review_todo_count: 0,
  },
  expected_after_write: {
    target_manual_action_count: 1,
    target_review_todo_count: 2,
  },
  blockers: [],
  forbidden_effects: ["不执行广告动作"],
  evidence_snapshot_preview: {
    will_write: false,
    will_save_on_authorized_write: true,
    item_count: 2,
    items: [
      { label: "AI 准入", value: "允许人工留痕，不会自动执行广告动作", source: "actionability_status" },
      { label: "动作边界", value: "只允许人工留痕和复盘", source: "business_rule" },
    ],
  },
};
const expectedCurrentSignalTarget = manualActionExpectedTargetForSignal(
  {
    id: "sig-sales-product",
    object_type: "sales_product",
    evidence: {
      primary_object: {
        object_type: "sales_product",
        object_id: "B06VW5SQ97",
        label: "B06VW5SQ97",
      },
    },
  },
  "add_to_review",
);
assertEqual(expectedCurrentSignalTarget.objectType, "sales_product");
assertEqual(expectedCurrentSignalTarget.objectId, "B06VW5SQ97");
const searchTermSignalWithSnapshotRowId = {
  id: "sig-long-tail-opportunity-gerpgo_market_1_20260616_120443:507938343",
  market_id: 1,
  object_type: "search_term",
  evidence: {
    primary_object: {
      object_type: "search_term",
      object_id: "gerpgo_market_1_20260616_120443:507938343",
      label: "b01fay0yl0",
      search_term: "b01fay0yl0",
    },
  },
};
const searchTermStableExpectedTarget = manualActionExpectedTargetForSignal(
  searchTermSignalWithSnapshotRowId,
  "add_to_review",
);
assertEqual(searchTermStableExpectedTarget.objectType, "search_term");
assertEqual(searchTermStableExpectedTarget.objectId, "search_term:1:b01fay0yl0");
const searchTermStablePreflightGate = manualActionButtonGate(
  "add_to_review",
  {
    ...readyManualActionPreflight,
    target: {
      ...readyManualActionPreflight.target,
      action_type: "add_to_review",
      object_type: "search_term",
      object_id: "search_term:1:b01fay0yl0",
    },
  },
  null,
  false,
  searchTermStableExpectedTarget,
);
assertEqual(searchTermStablePreflightGate.disabled, false);
const searchTermStableReviewTodo: ReviewTodoForUi = {
  signal_id: "sig-long-tail-opportunity-gerpgo_market_1_20260616_120443:507938343",
  action_id: "act-search-term-b01",
  market_id: 1,
  object_type: "search_term",
  object_id: "search_term:1:b01fay0yl0",
  object_label: "b01fay0yl0",
  review_window: "7d",
  due_at: "2026-06-29T00:00:00+00:00",
  is_due: false,
  evidence_snapshot: [{ label: "搜索词", value: "b01fay0yl0" }],
};
assertEqual(selectReviewTodosForSignal([], [searchTermStableReviewTodo], searchTermSignalWithSnapshotRowId).length, 1);
const searchTermReviewReadbackTarget = buildReviewRecordReadbackTarget(
  searchTermSignalWithSnapshotRowId,
  searchTermStableReviewTodo,
);
assertEqual(searchTermReviewReadbackTarget?.objectType, "search_term");
assertEqual(searchTermReviewReadbackTarget?.objectId, "search_term:1:b01fay0yl0");
const missingCurrentSignalTargetGate = manualActionButtonGate(
  "add_to_review",
  readyManualActionPreflight,
  null,
  false,
  manualActionExpectedTargetForSignal(
    {
      id: "sig-missing-object",
      object_type: "sales_product",
      evidence: { primary_object: { object_type: "sales_product" } },
    },
    "add_to_review",
  ),
);
assertEqual(missingCurrentSignalTargetGate.disabled, true);
assertIncludes(missingCurrentSignalTargetGate.reason ?? "", "当前信号对象身份待补充");
const mismatchedCurrentSignalTargetGate = manualActionButtonGate(
  "add_to_review",
  readyManualActionPreflight,
  null,
  false,
  manualActionExpectedTargetForSignal(
    {
      id: "sig-other-sales-product",
      object_type: "sales_product",
      evidence: {
        primary_object: {
          object_type: "sales_product",
          object_id: "B07OTHERASIN",
          label: "B07OTHERASIN",
        },
      },
    },
    "add_to_review",
  ),
);
assertEqual(mismatchedCurrentSignalTargetGate.disabled, true);
assertIncludes(mismatchedCurrentSignalTargetGate.reason ?? "", "后端预检目标与当前候选不一致");
assertEqual(manualActionButtonGate("add_to_review", null, null, false).disabled, true);
assertIncludes(manualActionButtonGate("add_to_review", null, null, false).reason ?? "", "正在读取后端只读预检");
assertEqual(
  manualActionButtonGate(
    "add_to_review",
    {
      ...readyManualActionPreflight,
      status: "blocked",
      blockers: [{ code: "duplicate_manual_action", message: "目标对象已有人工留痕，不应重复写入。" }],
    },
    null,
    false,
  ).disabled,
  true,
);
assertIncludes(
  manualActionButtonGate(
    "add_to_review",
    {
      ...readyManualActionPreflight,
      status: "blocked",
      blockers: [{ code: "duplicate_manual_action", message: "目标对象已有人工留痕，不应重复写入。" }],
    },
    null,
    false,
  ).reason ?? "",
  "目标对象已有人工留痕",
);
const mismatchedManualActionTypeGate = manualActionButtonGate("observe", readyManualActionPreflight, null, false, {
  objectType: "sales_product",
  objectId: "B06VW5SQ97",
  actionType: "observe",
});
assertEqual(mismatchedManualActionTypeGate.disabled, true);
assertIncludes(mismatchedManualActionTypeGate.reason ?? "", "后端预检动作与当前按钮不一致");
const missingEvidencePreviewGate = manualActionButtonGate(
  "add_to_review",
  {
    ...readyManualActionPreflight,
    evidence_snapshot_preview: null,
  },
  null,
  false,
  {
    objectType: "sales_product",
    objectId: "B06VW5SQ97",
    actionType: "add_to_review",
  },
);
assertEqual(missingEvidencePreviewGate.disabled, true);
assertIncludes(missingEvidencePreviewGate.reason ?? "", "不能用前端临时证据写入人工留痕");
assertEqual(
  manualActionButtonGate("add_to_review", readyManualActionPreflight, null, false, {
    objectType: "sales_product",
    objectId: "B06VW5SQ97",
    actionType: "add_to_review",
  }).disabled,
  false,
);
assertEqual(manualActionButtonGate("add_to_review", readyManualActionPreflight, null, true).disabled, true);
assertIncludes(manualActionButtonGate("add_to_review", readyManualActionPreflight, null, true).reason ?? "", "已有 7/14 天复盘待办");
assertEqual(
  manualActionWriteGuardMessage("加入复盘", manualActionButtonGate("add_to_review", null, null, false)),
  "未保存：加入复盘；正在读取后端只读预检；读取完成前不写入人工动作。",
);
assertIncludes(manualActionWriteGuardMessage("记录观察", mismatchedManualActionTypeGate) ?? "", "后端预检动作与当前按钮不一致");
const observeManualActionPreflight = {
  ...readyManualActionPreflight,
  target: {
    ...readyManualActionPreflight.target,
    action_type: "observe",
  },
};
const ignoreManualActionPreflight = {
  ...readyManualActionPreflight,
  target: {
    ...readyManualActionPreflight.target,
    action_type: "ignore",
  },
  expected_after_write: {
    target_manual_action_count: 1,
    target_review_todo_count: 0,
  },
};
assertEqual(
  manualActionPreflightForAction("observe", { observe: observeManualActionPreflight }, readyManualActionPreflight)?.target
    ?.action_type,
  "observe",
);
assertEqual(manualActionPreflightForAction("observe", {}, readyManualActionPreflight), null);
assertEqual(
  manualActionButtonExpectationText("observe", observeManualActionPreflight),
  "预期写入：留痕 +1，复盘待办 +2；不执行广告动作，不保存复盘结论。",
);
assertEqual(
  manualActionButtonExpectationText("ignore", ignoreManualActionPreflight),
  "预期写入：留痕 +1，复盘待办 +0；忽略本次不进入当前 7/14 天待办；不执行广告动作，不保存复盘结论。",
);
assertEqual(
  manualActionPreflightErrorForAction("ignore", { ignore: "忽略本次预检失败" }, "推荐动作预检失败"),
  "忽略本次预检失败",
);
assertEqual(manualActionPreflightErrorForAction("observe", { observe: null }, "推荐动作预检失败"), null);
assertEqual(manualActionPreflightErrorForAction("handled", {}, "推荐动作预检失败"), "推荐动作预检失败");
const handledActionForReadback: ManualActionForUi = {
  action_type: "handled",
  shop_id: "market:1",
  market_id: 1,
  object_type: "advertised_product",
  object_id: "B016EXMW02",
  evidence_snapshot: [
    {
      label: "广告商品覆盖",
      value: "覆盖 raw 投放行 6/7 / 证据行 6 条",
      detail: "未覆盖 raw 投放行 1 条，覆盖率 85.7%。",
      source: "advertised_products",
    },
  ],
};
const ignoreActionForReadback: ManualActionForUi = {
  ...handledActionForReadback,
  action_type: "ignore",
};
assertEqual(
  manualActionReadbackConsistencyText(null, [], []),
  "点击后读回：暂无人工留痕；复盘类应读回 7d / 14d，忽略应读回 0 条。",
);
assertEqual(
  manualActionReadbackConsistencyText(handledActionForReadback, [dueTodoWithCompleteEvidence, pendingTodoWithCompleteEvidence], []),
  "点击后读回一致：标记已处理已读回留痕 + 7d / 14d，待办证据快照：7d 4 条 / 14d 4 条；可回看对象引用 / 排查路径 / AI 准入 / 搜索词边界 / 广告位边界，复盘待办只表示进入排程，未到期不判断效果，尚未保存复盘结论。",
);
assertIncludes(
  manualActionReadbackConsistencyText(handledActionForReadback, [dueTodoWithCompleteEvidence, pendingTodoWithCompleteEvidence], [savedReviewRecord], {
    actionId: "manual-action-ad-product",
    objectType: "advertised_product",
    objectId: "B016EXMW02",
    reviewWindow: "7d",
  }),
  "已读回匹配复盘记录：action_id / object_id / 7 天窗口 / 指标窗口 / 证据快照一致",
);
assertEqual(
  manualActionReadbackConsistencyText(handledActionForReadback, [dueTodo], []),
  "点击后读回待核对：标记已处理只读回 7d，应补齐 7d / 14d。",
);
assertEqual(
  manualActionPostWriteReadbackMessage(
    handledActionForReadback,
    [dueTodoWithCompleteEvidence, pendingTodoWithCompleteEvidence],
    [],
    postWriteVerifiedPreflight,
  ),
  "已记录：标记已处理；点击后读回一致：标记已处理已读回留痕 + 7d / 14d，待办证据快照：7d 4 条 / 14d 4 条；可回看对象引用 / 排查路径 / AI 准入 / 搜索词边界 / 广告位边界，复盘待办只表示进入排程，未到期不判断效果，尚未保存复盘结论；sales_product / B06VW5SQ97 写后读回：证据快照 1 条，复盘待办 7d / 14d（只表示进入排程，未到期不判断效果），待办证据快照：7d 4 条 / 14d 4 条；可回看对象引用 / 排查路径 / AI 准入 / 搜索词边界 / 广告位边界，review_records 0 条，不执行广告动作；写后验收通过：sales_product / B06VW5SQ97 当前 1 条留痕、2 条待办；复盘待办只表示进入排程，未到期不判断效果；证据读回：留痕 8 条，复盘待办 7d 8 条 / 14d 8 条；不执行广告动作，不保存复盘结论。",
);
assertEqual(
  manualActionPostWriteReadbackMessage(
    handledActionForReadback,
    [dueTodoWithCompleteEvidence, pendingTodoWithCompleteEvidence],
    [],
    null,
    manualActionPostWritePreflightReadErrorText,
  ),
  "已记录：标记已处理；点击后读回一致：标记已处理已读回留痕 + 7d / 14d，待办证据快照：7d 4 条 / 14d 4 条；可回看对象引用 / 排查路径 / AI 准入 / 搜索词边界 / 广告位边界，复盘待办只表示进入排程，未到期不判断效果，尚未保存复盘结论；写后验收读取失败，已保留人工留痕，请稍后刷新核对复盘待办。",
);
const postWritePreflightRequest = buildManualActionPostWritePreflightRequest({
  action: handledActionForReadback,
  fallbackMarketId: 1,
  productScopeId: "parent_asin:B00K4W4AAA",
});
assertEqual(postWritePreflightRequest.marketId, 1);
assertEqual(postWritePreflightRequest.productScopeId, "parent_asin:B00K4W4AAA");
assertEqual(postWritePreflightRequest.expectedObjectType, "advertised_product");
assertEqual(postWritePreflightRequest.expectedObjectId, "B016EXMW02");
assertEqual(postWritePreflightRequest.actionType, "handled");
assertEqual(postWritePreflightRequest.expectWritten, true);
assertEqual(
  manualActionPostWriteReadbackMessage(handledActionForReadback, [dueTodo], []),
  "已记录：标记已处理；点击后读回待核对：标记已处理只读回 7d，应补齐 7d / 14d。",
);
const manualEvidenceSnapshot = buildManualActionEvidenceSnapshot([
  {
    label: "广告商品覆盖",
    value: "覆盖 raw 投放行 6/7 / 证据行 6 条",
    detail: "未覆盖 raw 投放行 1 条，覆盖率 85.7%。",
    source: "advertised_products",
  },
  { label: "", value: "无效空标签" },
]);
assertEqual(manualEvidenceSnapshot.length, 1);
assertEqual(manualEvidenceSnapshot[0].source, "advertised_products");
const adAsinBusinessEvidenceSnapshot = buildManualActionEvidenceSnapshot([
  { label: "广告商品覆盖", value: "覆盖 raw 投放行 2/2 / 证据行 2 条", source: "advertised_products" },
  { label: "广告聚合指标", value: "花费 79.28 / 订单 32 / 销售额 309.57", source: "advertised_products" },
  { label: "主要花费来源", value: "RBK004-AUTO / 花费占比 69.1%", source: "advertised_products" },
  { label: "搜索词市场背景", value: "同广告组搜索词 18 条 / ABA Top1000 匹配 1 条", source: "ad_search_term_daily_metrics + ABA导出" },
  { label: "上下文边界", value: "搜索词 18 条 / 广告位 0 条", detail: "不能自动归因到该广告 ASIN。", source: "business_rule" },
]);
assertEqual(adAsinBusinessEvidenceSnapshot.length, 5);
assertEqual(adAsinBusinessEvidenceSnapshot[4].label, "上下文边界");
assertIncludes(adAsinBusinessEvidenceSnapshot[4].detail ?? "", "不能自动归因");
const adAsinPreflightEvidenceSnapshotText = manualActionPreflightEvidenceSnapshotText({
  status: "ready_for_explicit_manual_write",
  mode: "pre_write",
  will_write: false,
  requires_explicit_authorization: true,
  target: {
    action_type: "add_to_review",
    object_type: "advertised_product",
    object_id: "B07BS9754Q",
    review_windows: ["7d", "14d"],
  },
  current_counts: {
    target_manual_action_count: 0,
    target_review_todo_count: 0,
  },
  expected_after_write: {
    target_manual_action_count: 1,
    target_review_todo_count: 2,
  },
  blockers: [],
  forbidden_effects: ["不执行广告动作", "不保存 review_records"],
  evidence_snapshot_preview: {
    status: "ready",
    will_write: false,
    will_save_on_authorized_write: true,
    item_count: 5,
    items: adAsinBusinessEvidenceSnapshot,
  },
});
assertIncludes(adAsinPreflightEvidenceSnapshotText ?? "", "将保存 5 条证据快照");
assertIncludes(adAsinPreflightEvidenceSnapshotText ?? "", "广告商品覆盖：覆盖 raw 投放行 2/2 / 证据行 2 条");
assertIncludes(adAsinPreflightEvidenceSnapshotText ?? "", "广告聚合指标：花费 79.28 / 订单 32 / 销售额 309.57");
assertIncludes(adAsinPreflightEvidenceSnapshotText ?? "", "上下文边界：搜索词 18 条 / 广告位 0 条");
assertIncludes(adAsinPreflightEvidenceSnapshotText ?? "", "人工点击后才保存，不执行广告动作");
const readyManualConfirmationEvidenceReadiness = manualConfirmationEvidenceReadinessSummary(
  [
    { label: "业务问题", value: "这个搜索词是否值得人工复核扩量？" },
    { label: "当前判断", value: "有订单且 ACOS 可接受" },
    { label: "能证明", value: "能证明当前广告上下文有复核价值" },
    { label: "不能证明", value: "不能证明应自动加词" },
    { label: "人工下一步", value: "加入 7/14 天复盘" },
    { label: "Parent ASIN入口", value: "Parent ASIN B00K4W4AAA 下只复核广告搜索词表现" },
    { label: "广告 ASIN承接", value: "广告 ASIN B016EXMVZS / B016EXMW02 承接" },
    { label: "投放词证据", value: "关键词 / 自动投放上下文可读回" },
    { label: "广告组合流判断", value: "搜索词只能说明同广告组上下文，不能自动归因到单个广告 ASIN" },
    { label: "同组投放商品表现", value: "B016EXMVZS 与 B016EXMW02 同组投放表现已回看" },
    { label: "逐投放上下文", value: "优先复核 RBK004-Exact / beach essentials / B016EXMVZS" },
    { label: "广告位边界", value: "广告组级广告位缺失，活动级广告位只作背景" },
    { label: "ABA 背景", value: "站点级 ABA 匹配" },
    { label: "证据缺口", value: "广告位仍需补证" },
    { label: "需要补证", value: "补齐广告位和投放词维护状态" },
    { label: "动作边界", value: "不自动执行广告动作" },
  ],
  [
    { label: "人工确认判断依据", value: "当前判断可读回" },
    { label: "能证明的事实", value: "有订单" },
    { label: "不能证明的边界", value: "不能自动加词" },
    { label: "人工下一步", value: "加入复盘" },
    { label: "Parent ASIN入口", value: "Parent ASIN B00K4W4AAA 下只复核广告搜索词表现" },
    { label: "广告 ASIN承接", value: "广告 ASIN B016EXMVZS / B016EXMW02 承接" },
    { label: "投放词证据", value: "投放词上下文" },
    { label: "广告组合流判断", value: "同广告组上下文已回看" },
    { label: "同组投放商品表现", value: "B016EXMVZS 与 B016EXMW02 同组投放表现已回看" },
    { label: "逐投放上下文", value: "优先复核 RBK004-Exact / beach essentials / B016EXMVZS" },
    { label: "广告位边界", value: "广告组级广告位缺失，活动级广告位只作背景" },
    { label: "ABA 背景", value: "站点级市场背景" },
    { label: "证据缺口", value: "需要补广告位" },
    { label: "需要补证", value: "补齐广告位和投放词维护状态" },
    { label: "动作边界", value: "不执行广告动作" },
  ],
);
assertEqual(readyManualConfirmationEvidenceReadiness?.tone, "ready");
assertIncludes(readyManualConfirmationEvidenceReadiness?.summary ?? "", "evidence_snapshot 对齐");
assertIncludes(readyManualConfirmationEvidenceReadiness?.boundary ?? "", "未授权前不写 manual_actions");
const readyManualConfirmationDiagnosisBridge = manualConfirmationDiagnosisBridgeSummary(
  {
    title: "搜索词机会",
    businessQuestion: "这个搜索词是否值得人工复核扩量？",
    objectReadback: "搜索词 boys sunglasses，与右侧 ManualAction / ReviewTodo / ReviewRecord 使用同一对象。",
    proves: "能证明当前广告上下文有复核价值",
    doesNotProve: "不能证明应自动加词",
    evidenceGap: "广告位仍需补证",
    nextManualStep: "加入 7/14 天复盘",
  },
  [
    { label: "业务问题", value: "这个搜索词是否值得人工复核扩量？" },
    { label: "当前判断", value: "有订单且 ACOS 可接受" },
    { label: "能证明", value: "能证明当前广告上下文有复核价值" },
    { label: "不能证明", value: "不能证明应自动加词" },
    { label: "人工下一步", value: "加入 7/14 天复盘" },
    { label: "Parent ASIN入口", value: "Parent ASIN B00K4W4AAA 下只复核广告搜索词表现" },
    { label: "广告 ASIN承接", value: "广告 ASIN B016EXMVZS / B016EXMW02 承接" },
    { label: "投放词证据", value: "关键词 / 自动投放上下文可读回" },
    { label: "广告组合流判断", value: "搜索词只能说明同广告组上下文，不能自动归因到单个广告 ASIN" },
    { label: "同组投放商品表现", value: "B016EXMVZS 与 B016EXMW02 同组投放表现已回看" },
    { label: "逐投放上下文", value: "优先复核 RBK004-Exact / beach essentials / B016EXMVZS" },
    { label: "广告位边界", value: "广告组级广告位缺失，活动级广告位只作背景" },
    { label: "ABA 背景", value: "站点级 ABA 匹配" },
    { label: "证据缺口", value: "广告位仍需补证" },
    { label: "需要补证", value: "补齐广告位和投放词维护状态" },
    { label: "动作边界", value: "不自动执行广告动作" },
  ],
  readyManualConfirmationEvidenceReadiness,
);
assertEqual(readyManualConfirmationDiagnosisBridge?.tone, "ready");
assertIncludes(readyManualConfirmationDiagnosisBridge?.summary ?? "", "中间诊断、右侧证据依据");
assertIncludes(JSON.stringify(readyManualConfirmationDiagnosisBridge), "证据缺口");
assertIncludes(readyManualConfirmationDiagnosisBridge?.boundary ?? "", "未授权前不写 manual_actions");
const blockedManualConfirmationEvidenceReadiness = manualConfirmationEvidenceReadinessSummary(
  [
    { label: "业务问题", value: "搜索词是否可复核？" },
    { label: "当前判断", value: "待确认" },
    { label: "能证明", value: "有广告表现" },
    { label: "不能证明", value: "不能自动执行" },
    { label: "人工下一步", value: "记录观察" },
    { label: "投放词证据", value: "投放上下文" },
    { label: "ABA 背景", value: "站点级背景" },
    { label: "证据缺口", value: "缺广告位" },
    { label: "动作边界", value: "不执行广告动作" },
  ],
  [
    { label: "人工确认判断依据", value: "当前判断可读回" },
    { label: "能证明的事实", value: "有广告表现" },
    { label: "不能证明的边界", value: "不能自动执行" },
    { label: "人工下一步", value: "记录观察" },
    { label: "投放词证据", value: "投放上下文" },
  ],
);
assertEqual(blockedManualConfirmationEvidenceReadiness?.tone, "blocked");
assertIncludes(JSON.stringify(blockedManualConfirmationEvidenceReadiness), "缺：Parent ASIN入口 / 广告 ASIN承接");
assertIncludes(JSON.stringify(blockedManualConfirmationEvidenceReadiness), "广告组合流判断");
assertIncludes(JSON.stringify(blockedManualConfirmationEvidenceReadiness), "逐投放上下文");
assertIncludes(JSON.stringify(blockedManualConfirmationEvidenceReadiness), "广告位边界");
assertIncludes(JSON.stringify(blockedManualConfirmationEvidenceReadiness), "动作边界");
assertIncludes(blockedManualConfirmationEvidenceReadiness?.summary ?? "", "不能把当前点击当成可复盘留痕");
const snapshotOnlySearchTermChainReadiness = manualConfirmationEvidenceReadinessSummary(
  [
    { label: "业务问题", value: "搜索词是否可复核？" },
    { label: "当前判断", value: "待确认" },
    { label: "能证明", value: "有广告表现" },
    { label: "不能证明", value: "不能自动执行" },
    { label: "人工下一步", value: "记录观察" },
  ],
  [
    { label: "人工确认判断依据", value: "当前判断可读回" },
    { label: "能证明的事实", value: "有广告表现" },
    { label: "不能证明的边界", value: "不能自动执行" },
    { label: "人工下一步", value: "记录观察" },
    { label: "投放词证据", value: "投放上下文" },
    { label: "广告组合流判断", value: "同广告组证据" },
    { label: "ABA 背景", value: "站点级市场背景" },
    { label: "证据缺口", value: "缺广告位层级" },
    { label: "需要补证", value: "补齐广告位和投放词维护状态" },
    { label: "动作边界", value: "只允许人工留痕" },
  ],
);
assertEqual(snapshotOnlySearchTermChainReadiness?.tone, "blocked");
assertIncludes(snapshotOnlySearchTermChainReadiness?.summary ?? "", "不一致");
assertIncludes(
  JSON.stringify(snapshotOnlySearchTermChainReadiness),
  "页面缺少：Parent ASIN入口 / 广告 ASIN承接 / 投放词证据 / 广告组合流判断 / 同组投放商品表现 / 逐投放上下文 / 广告位边界 / ABA 背景 / 证据缺口 / 需要补证 / 动作边界",
);
const blockedManualConfirmationDiagnosisBridge = manualConfirmationDiagnosisBridgeSummary(
  {
    title: "搜索词机会",
    businessQuestion: "搜索词是否可复核？",
    objectReadback: "搜索词 boys sunglasses",
    proves: "有广告表现",
    doesNotProve: "不能自动执行",
    evidenceGap: "缺广告位",
    nextManualStep: "记录观察",
  },
  [
    { label: "业务问题", value: "搜索词是否可复核？" },
    { label: "当前判断", value: "待确认" },
    { label: "能证明", value: "有广告表现" },
    { label: "不能证明", value: "不能自动执行" },
    { label: "人工下一步", value: "记录观察" },
  ],
  blockedManualConfirmationEvidenceReadiness,
);
assertEqual(blockedManualConfirmationDiagnosisBridge?.tone, "blocked");
assertIncludes(blockedManualConfirmationDiagnosisBridge?.summary ?? "", "未贯通");
assertIncludes(JSON.stringify(blockedManualConfirmationDiagnosisBridge), "中间证据缺口：缺广告位");
const adAsinPreflightPayload = buildManualActionRequestPayload({
  actionType: "add_to_review",
  actionLabel: "加入复盘",
  operatorName: "本地运营",
  evidenceSnapshot: [{ label: "前端旧证据", value: "不应覆盖后端预检快照" }],
  productScopeId: "parent_asin:B00K4W4AAA",
  preflight: {
    ...readyManualActionPreflight,
    target: {
      action_type: "add_to_review",
      object_type: "advertised_product",
      object_id: "B07BS9754Q",
      review_windows: ["7d", "14d"],
    },
    evidence_snapshot_preview: {
      status: "ready",
      will_write: false,
      will_save_on_authorized_write: true,
      item_count: 5,
      items: adAsinBusinessEvidenceSnapshot,
    },
  },
});
assertEqual(adAsinPreflightPayload.expected_product_scope_id, "parent_asin:B00K4W4AAA");
assertEqual(adAsinPreflightPayload.evidence_snapshot.length, 5);
assertEqual(adAsinPreflightPayload.evidence_snapshot[0].label, "广告商品覆盖");
assertEqual(adAsinPreflightPayload.evidence_snapshot[4].label, "上下文边界");
assertEqual(adAsinPreflightPayload.evidence_snapshot.some((item) => item.label === "前端旧证据"), false);
const ignorePreflightPayload = buildManualActionRequestPayload({
  actionType: "ignore",
  actionLabel: "忽略本次",
  operatorName: "本地运营",
  evidenceSnapshot: [{ label: "前端旧忽略证据", value: "不应写入人工留痕" }],
  productScopeId: "parent_asin:B00K4W4AAA",
  preflight: {
    ...readyManualActionPreflight,
    target: {
      action_type: "ignore",
      object_type: "search_term",
      object_id: "search_term:1:boys sunglasses",
      review_windows: [],
    },
    expected_after_write: {
      target_manual_action_count: 1,
      target_review_todo_count: 0,
    },
    evidence_snapshot_preview: {
      status: "ready",
      will_write: false,
      will_save_on_authorized_write: true,
      item_count: 2,
      items: [
        { label: "人工确认判断依据", value: "本次忽略但保留证据链", source: "diagnosis_contract" },
        { label: "不能证明的边界", value: "忽略不代表误报，也不删除信号", source: "business_rule" },
      ],
    },
  },
});
assertEqual(ignorePreflightPayload.action_type, "ignore");
assertEqual(ignorePreflightPayload.expected_product_scope_id, "parent_asin:B00K4W4AAA");
assertEqual(ignorePreflightPayload.expected_object_type, "search_term");
assertEqual(ignorePreflightPayload.expected_object_id, "search_term:1:boys sunglasses");
assertEqual(ignorePreflightPayload.evidence_snapshot.length, 2);
assertEqual(ignorePreflightPayload.evidence_snapshot[0].label, "人工确认判断依据");
assertEqual(ignorePreflightPayload.evidence_snapshot.some((item) => item.label === "前端旧忽略证据"), false);
const staleSearchTermSnapshotRowId = "gerpgo_market_1_20260616_120443:507942344";
const searchTermStablePreflightPayload = buildManualActionRequestPayload({
  actionType: "add_to_review",
  actionLabel: "加入复盘",
  operatorName: "本地运营",
  evidenceSnapshot: [{ label: "前端旧候选对象", value: staleSearchTermSnapshotRowId }],
  productScopeId: "parent_asin:B00K4W4AAA",
  preflight: {
    ...readyManualActionPreflight,
    target: {
      action_type: "add_to_review",
      object_type: "search_term",
      object_id: "search_term:1:boys sunglasses",
      source_object_id: staleSearchTermSnapshotRowId,
      object_label: "boys sunglasses",
      review_windows: ["7d", "14d"],
    },
    evidence_snapshot_preview: {
      status: "ready",
      will_write: false,
      will_save_on_authorized_write: true,
      item_count: 2,
      items: [
        { label: "人工确认判断依据", value: "搜索词 boys sunglasses 可进入人工复核", source: "diagnosis_contract" },
        { label: "对象边界", value: "旧快照行 ID 只作来源追溯，不作复盘对象", source: "business_rule" },
      ],
    },
  },
});
assertEqual(searchTermStablePreflightPayload.expected_object_type, "search_term");
assertEqual(searchTermStablePreflightPayload.expected_object_id, "search_term:1:boys sunglasses");
assertEqual(searchTermStablePreflightPayload.evidence_snapshot.length, 2);
assertNotIncludes(JSON.stringify(searchTermStablePreflightPayload), staleSearchTermSnapshotRowId);
const searchTermPreflightEvidenceSnapshot = buildManualActionDisplayEvidenceSnapshot({
  fallbackEvidenceSnapshot: [
    { label: "广告商品覆盖", value: "覆盖 raw 投放行 0/0 / 证据行 0 条" },
    { label: "广告聚合指标", value: "花费 0.00 / 订单 0 / 销售额 0.00" },
  ],
  preflight: {
    evidence_snapshot_preview: {
      will_write: false,
      will_save_on_authorized_write: true,
      item_count: 6,
      items: [
        { label: "搜索词表现", value: "花费 34.11 / 订单 21 / 销售额 193.20", source: "ad_search_term_daily_metrics" },
        { label: "投放上下文", value: "广告活动 2 个 / 广告组 2 个 / 搜索词表现行 2 条", source: "ad_search_term_daily_metrics" },
        { label: "投放词结构", value: "1 个投放词 / 搜索词表现行 2 条", source: "ad_search_term_daily_metrics" },
        { label: "搜索词边界", value: "有效词 1 条 / 无订单花费词 1 条", detail: "搜索词不能自动归因到单个 ASIN。", source: "ad_search_term_daily_metrics + business_rule" },
        { label: "广告位边界", value: "广告组级广告位 0 条 / 同广告活动广告位 4 条", detail: "活动级广告位背景不能替代广告组级判断。", source: "ad_placement_daily_metrics + business_rule" },
        { label: "对象边界", value: "搜索词是投放证据，不是广告商品本身", source: "business_rule" },
      ],
    },
  },
});
assertEqual(searchTermPreflightEvidenceSnapshot[0].label, "搜索词表现");
assertEqual(searchTermPreflightEvidenceSnapshot.some((item) => item.label === "广告商品覆盖"), false);
assertEqual(searchTermPreflightEvidenceSnapshot.some((item) => item.label === "搜索词边界"), true);
assertEqual(searchTermPreflightEvidenceSnapshot.some((item) => item.label === "广告位边界"), true);
assertIncludes(manualActionEvidenceReasonText(searchTermPreflightEvidenceSnapshot) ?? "", "搜索词边界");
assertIncludes(manualActionEvidenceReasonText(searchTermPreflightEvidenceSnapshot) ?? "", "广告位边界");
const searchTermSavableEvidenceReason = manualActionSavableEvidenceReasonText({
  evidence_snapshot_preview: {
    will_write: false,
    will_save_on_authorized_write: true,
    item_count: 6,
    items: searchTermPreflightEvidenceSnapshot,
  },
});
assertIncludes(searchTermSavableEvidenceReason, "搜索词边界");
assertIncludes(searchTermSavableEvidenceReason, "广告位边界");
const searchTermUnsavableEvidenceReason = manualActionSavableEvidenceReasonText({
  evidence_snapshot_preview: {
    will_write: false,
    will_save_on_authorized_write: false,
    item_count: 1,
    items: [{ label: "语义组", value: "规则语义：海滩出行用品", source: "规则语义" }],
  },
});
assertIncludes(searchTermUnsavableEvidenceReason, "等待后端可保存 evidence_snapshot_preview");
assertIncludes(searchTermUnsavableEvidenceReason, "页面 Parent ASIN 广告搜索词表现复核背景和临时证据只用于只读核对");
assertEqual(searchTermUnsavableEvidenceReason.includes("规则语义：海滩出行用品"), false);
const searchTermPreflightPriorityEvidenceRows = manualActionPreflightPriorityEvidenceRows({
  evidence_snapshot_preview: {
    will_write: false,
    will_save_on_authorized_write: true,
    item_count: 8,
    items: [
      { label: "AI 准入", value: "允许人工留痕，不会自动执行广告动作", source: "actionability_status" },
      { label: "投放词证据", value: "1 个投放词 / beach essentials", source: "ad_search_term_daily_metrics" },
      { label: "ABA 背景", value: "排名 208 / 2026-06-07 至 2026-06-13", source: "diagnosis_contract + ABA导出" },
      { label: "搜索词表现", value: "花费 34.11 / 订单 21 / 销售额 193.20", source: "ad_search_term_daily_metrics" },
      { label: "搜索词边界", value: "有效词 1 条 / 无订单花费词 1 条", detail: "搜索词不能自动归因到单个 ASIN。", source: "ad_search_term_daily_metrics + business_rule" },
      { label: "广告位边界", value: "广告组级广告位 0 条 / 同广告活动广告位 4 条", detail: "活动级广告位背景不能替代广告组级判断。", source: "ad_placement_daily_metrics + business_rule" },
      { label: "证据缺口", value: "缺少投放词维护状态和主推策略", source: "diagnosis_contract" },
      { label: "广告位证据缺口", value: "缺少可直接配套的广告位上下文", source: "business_rule" },
      { label: "需要补证", value: "补齐投放词维护状态、广告商品承接和主推策略", source: "diagnosis_contract" },
      { label: "诊断证据缺口", value: "缺少广告位证据，不能判断广告位影响", source: "diagnosis_contract" },
      { label: "动作边界", value: "只允许人工留痕和复盘", source: "business_rule" },
      { label: "复盘指标", value: "7/14 天复盘点击、订单、ACOS、CVR", source: "积加API" },
      { label: "对象边界", value: "搜索词是投放证据，不是广告商品本身", source: "business_rule" },
    ],
  },
});
assertEqual(searchTermPreflightPriorityEvidenceRows.length, 10);
const searchTermPreflightPriorityRow = (label: string) => searchTermPreflightPriorityEvidenceRows.find((row) => row.label === label);
assertIncludes(searchTermPreflightPriorityRow("AI 准入")?.value ?? "", "不会自动执行广告动作");
assertIncludes(searchTermPreflightPriorityRow("投放词证据")?.value ?? "", "beach essentials");
assertIncludes(searchTermPreflightPriorityRow("ABA 背景")?.value ?? "", "排名 208");
assertIncludes(searchTermPreflightPriorityRow("需要补证")?.value ?? "", "投放词维护状态");
assertIncludes(searchTermPreflightPriorityRow("动作边界")?.value ?? "", "人工留痕");
assertIncludes(searchTermPreflightPriorityRow("搜索词边界")?.detail ?? "", "不能自动归因");
assertIncludes(searchTermPreflightPriorityRow("广告位边界")?.source ?? "", "ad_placement_daily_metrics");
assertEqual(Boolean(searchTermPreflightPriorityRow("证据缺口")), true);
assertEqual(Boolean(searchTermPreflightPriorityRow("广告位证据缺口")), true);
assertEqual(Boolean(searchTermPreflightPriorityRow("诊断证据缺口")), true);
const searchIntentManualEvidenceSnapshot = buildSearchIntentManualActionEvidenceSnapshot({
  intentLabel: "规则语义：海滩出行用品",
  searchTerm: "beach essentials",
  abaReferenceTerm: "beach essentials",
  abaRank: 208,
  abaPeriod: "2026-06-07 至 2026-06-13",
  abaMatchBoundary: "短语包含匹配，仅作为同类 SearchTerm 市场热度背景。",
});
assertEqual(searchIntentManualEvidenceSnapshot.length, 6);
assertEqual(searchIntentManualEvidenceSnapshot[0].label, "搜索词");
assertEqual(searchIntentManualEvidenceSnapshot[0].value, "beach essentials");
assertIncludes(searchIntentManualEvidenceSnapshot[0].detail ?? "", "人工处理对象仍落到具体 SearchTerm");
assertEqual(searchIntentManualEvidenceSnapshot[1].label, "Parent ASIN 广告搜索词表现复核");
assertEqual(searchIntentManualEvidenceSnapshot[1].source, "规则语义");
assertIncludes(searchIntentManualEvidenceSnapshot[1].detail ?? "", "只用于复盘回看");
assertEqual(searchIntentManualEvidenceSnapshot[2].label, "ABA语义参考词");
assertEqual(searchIntentManualEvidenceSnapshot[3].label, "ABA语义参考排名");
assertEqual(searchIntentManualEvidenceSnapshot[4].label, "ABA周期");
assertEqual(searchIntentManualEvidenceSnapshot[5].label, "ABA匹配边界");
const signalManualEvidenceSnapshot = buildSignalManualActionEvidenceSnapshot({
  evidence: {
    primary_object: {
      label: "beach essentials for toddlers 1-3",
      search_term: "beach essentials for toddlers 1-3",
      intent_label: "未分组搜索词",
    },
    facts: [
      { label: "语义组", value: "规则语义：海滩出行用品" },
      { label: "ABA语义参考词", value: "beach essentials" },
      { label: "ABA语义参考排名", value: "208" },
      { label: "ABA周期", value: "2026-06-07 至 2026-06-13" },
      { label: "ABA匹配边界", value: "短语包含匹配，仅作为同类 SearchTerm 市场热度背景。" },
    ],
  },
});
assertEqual(signalManualEvidenceSnapshot[0].label, "搜索词");
assertEqual(signalManualEvidenceSnapshot[0].value, "beach essentials for toddlers 1-3");
assertEqual(signalManualEvidenceSnapshot[1].label, "Parent ASIN 广告搜索词表现复核");
assertEqual(signalManualEvidenceSnapshot[2].label, "ABA语义参考词");
assertEqual(signalManualEvidenceSnapshot[5].label, "ABA匹配边界");
assertIncludes(
  manualActionEvidenceSnapshotText({ evidence_snapshot: signalManualEvidenceSnapshot }) ?? "",
  "留痕证据快照：搜索词：beach essentials for toddlers 1-3；Parent ASIN 广告搜索词表现复核：规则语义：海滩出行用品",
);
assertIncludes(manualActionEvidenceSnapshotText({ evidence_snapshot: signalManualEvidenceSnapshot }) ?? "", "ABA语义参考词：beach essentials");
const mergedManualEvidenceSnapshot = mergeManualActionEvidenceSnapshots(searchIntentManualEvidenceSnapshot, manualEvidenceSnapshot);
assertEqual(mergedManualEvidenceSnapshot[0].label, "搜索词");
assertEqual(mergedManualEvidenceSnapshot[6].label, "广告商品覆盖");
assertIncludes(
  manualActionEvidenceSnapshotText({ evidence_snapshot: mergedManualEvidenceSnapshot }) ?? "",
  "搜索词：beach essentials",
);
assertIncludes(
  manualActionEvidenceSnapshotText({ evidence_snapshot: mergedManualEvidenceSnapshot }) ?? "",
  "Parent ASIN 广告搜索词表现复核：规则语义：海滩出行用品",
);
const manualActionRequestPayload = buildManualActionRequestPayload({
  actionType: "add_to_review",
  actionLabel: "加入复盘",
  operatorName: "本地运营",
  productScopeId: "parent_asin:B00K4W4AAA",
  evidenceSnapshot: mergedManualEvidenceSnapshot,
  preflight: {
    target: {
      object_type: "search_term",
      object_id: "beach essentials for toddlers 1-3",
    },
  },
});
assertEqual(manualActionRequestPayload.action_type, "add_to_review");
assertEqual(manualActionRequestPayload.action_note, "加入复盘");
assertEqual(manualActionRequestPayload.operator_name, "本地运营");
assertEqual(manualActionRequestPayload.expected_product_scope_id, "parent_asin:B00K4W4AAA");
assertEqual(manualActionRequestPayload.expected_object_type, "search_term");
assertEqual(manualActionRequestPayload.expected_object_id, "beach essentials for toddlers 1-3");
assertEqual(manualActionRequestPayload.expected_can_auto_execute_ads, false);
assertEqual(manualActionRequestPayload.expected_can_auto_change_rules, false);
assertEqual(manualActionRequestPayload.evidence_snapshot.length, 0);
const manualActionReasonText = manualActionEvidenceReasonText(
  [
    { label: "广告商品覆盖", value: "覆盖 raw 投放行 6/7 / 证据行 6 条" },
    { label: "广告指标汇总", value: "花费 $64.92 / 订单 18 / ACOS 38.0%" },
    { label: "Top 花费来源", value: "来自 SP 广告商品快照" },
    { label: "搜索词市场背景", value: "同广告组搜索词 18 条 / ABA Top1000 匹配 1 条" },
    { label: "语义组", value: "规则语义：海滩出行用品" },
  ],
  4,
);
assertIncludes(manualActionReasonText ?? "", "广告商品覆盖：覆盖 raw 投放行 6/7 / 证据行 6 条");
assertIncludes(manualActionReasonText ?? "", "广告指标汇总：花费 $64.92 / 订单 18 / ACOS 38.0%");
assertIncludes(manualActionReasonText ?? "", "搜索词市场背景：同广告组搜索词 18 条 / ABA Top1000 匹配 1 条");
assertIncludes(manualActionReasonText ?? "", "搜索词表现分组：规则语义：海滩出行用品");
assertNotIncludes(manualActionReasonText ?? "", "语义组：");
assertEqual(manualActionReasonText?.includes("Top 花费来源"), false);
const adAsinManualActionReasonText = manualActionEvidenceReasonText(adAsinBusinessEvidenceSnapshot);
assertIncludes(adAsinManualActionReasonText ?? "", "广告商品覆盖：覆盖 raw 投放行 2/2 / 证据行 2 条");
assertIncludes(adAsinManualActionReasonText ?? "", "广告聚合指标：花费 79.28 / 订单 32 / 销售额 309.57");
assertIncludes(adAsinManualActionReasonText ?? "", "搜索词市场背景：同广告组搜索词 18 条 / ABA Top1000 匹配 1 条");
assertIncludes(adAsinManualActionReasonText ?? "", "上下文边界：搜索词 18 条 / 广告位 0 条");
assertEqual(adAsinManualActionReasonText?.includes("主要花费来源"), false);
assertEqual(buildSearchIntentManualActionEvidenceSnapshot({ intentLabel: null }).length, 0);
assertIncludes(manualActionEvidenceSnapshotText(handledActionForReadback) ?? "", "广告商品覆盖：覆盖 raw 投放行 6/7 / 证据行 6 条");
assertIncludes(
  manualActionEvidenceSnapshotText({ evidence_snapshot: [] }) ?? "",
  "历史旧留痕缺少证据快照",
);
assertIncludes(
  manualActionEvidenceSnapshotText({ evidence_snapshot: [] }) ?? "",
  "不能证明当前证据闭环",
);
const dueTodoWithEvidence: ReviewTodoForUi = {
  ...dueTodo,
  action_type: "handled",
  evidence_snapshot: manualEvidenceSnapshot,
};
assertIncludes(manualActionEvidenceSnapshotText(dueTodoWithEvidence) ?? "", "留痕证据快照：广告商品覆盖");
assertEqual(
  manualActionReadbackConsistencyText(ignoreActionForReadback, [], []),
  "点击后读回一致：忽略本次已读回留痕，当前 0 条待办，尚未保存复盘结论。",
);
assertEqual(
  manualActionReadbackConsistencyText(ignoreActionForReadback, [dueTodo], []),
  "点击后读回待核对：忽略本次应为 0 条，当前读回 1 条。",
);
assertEqual(
  manualActionReadbackCompactText(null, [], []),
  "预期：复盘类 7d/14d 待办（排程），忽略 0；读回：暂无留痕",
);
assertEqual(
  manualActionReadbackCompactText(handledActionForReadback, [dueTodo, pendingTodo], []),
  "预期：复盘类 7d/14d 待办；读回一致：留痕 + 7d/14d待办（仅排程），未存结论",
);
assertEqual(
  manualActionReadbackCompactText(handledActionForReadback, [dueTodo], []),
  "预期：复盘类 7d/14d 待办；待读回补齐：7d",
);
assertEqual(
  manualActionReadbackCompactText(ignoreActionForReadback, [], []),
  "预期：忽略 0；读回一致：0 条待办，未存结论（不代表误报）",
);
const pendingManualReviewClosureLedger = buildManualReviewClosureLedger({
  manualActionCount: 1,
  reviewTodoCount: 2,
  reviewRecordCount: 0,
  reviewEffectStatus: "not_ready",
  nextReviewDueAt: "2026-06-15T00:00:00+00:00",
});
assertIncludes(pendingManualReviewClosureLedger.summary, "已留痕并进入 7/14 天复盘");
assertIncludes(pendingManualReviewClosureLedger.summary, "未到期不判断效果");
assertEqual(pendingManualReviewClosureLedger.rows[0].label, "人工留痕");
assertEqual(pendingManualReviewClosureLedger.rows[0].value, "已记录 1 条");
assertEqual(pendingManualReviewClosureLedger.rows[1].label, "复盘待办");
assertEqual(pendingManualReviewClosureLedger.rows[1].value, "已生成 2 条");
assertIncludes(pendingManualReviewClosureLedger.rows[1].detail, "下一项到期 2026-06-15");
assertIncludes(pendingManualReviewClosureLedger.rows[1].detail, "不代表已判定改善");
assertEqual(pendingManualReviewClosureLedger.rows[2].label, "复盘结论");
assertEqual(pendingManualReviewClosureLedger.rows[2].value, "未保存");
assertIncludes(pendingManualReviewClosureLedger.rows[2].detail, "不能判断改善");
assertIncludes(pendingManualReviewClosureLedger.boundary, "manual_actions");
assertIncludes(pendingManualReviewClosureLedger.boundary, "review_todos");
assertIncludes(pendingManualReviewClosureLedger.boundary, "review_records");
assertIncludes(pendingManualReviewClosureLedger.boundary, "不自动执行广告动作");
const readyManualReviewClosureLedger = buildManualReviewClosureLedger({
  manualActionCount: 1,
  reviewTodoCount: 2,
  reviewRecordCount: 0,
  reviewEffectStatus: "ready",
});
assertIncludes(readyManualReviewClosureLedger.rows[2].detail, "仍需人工保存 review_records");
const savedManualReviewClosureLedger = buildManualReviewClosureLedger({
  manualActionCount: 1,
  reviewTodoCount: 2,
  reviewRecordCount: 1,
  reviewEffectStatus: "ready",
});
assertIncludes(savedManualReviewClosureLedger.summary, "留痕、待办和复盘结论均可读回");
assertEqual(
  reviewApplicabilityBoundaryText({
    object_type: "search_term",
    signal_category: "search_term_opportunity",
  }),
  "该对象可进入广告指标复盘：记录人工动作后，等待处理前后完整 7/14 天快照再判断效果。",
);
assertEqual(
  reviewApplicabilityBoundaryText({
    object_type: "cross",
    signal_category: "data_quality",
  }),
  "该信号属于数据质量或交叉对象，只适合留痕或复查数据是否补齐，不进入广告指标前后对比。",
);
