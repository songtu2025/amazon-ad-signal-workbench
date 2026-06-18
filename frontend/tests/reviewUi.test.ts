import {
  buildReviewTodoQueueDetails,
  buildReviewTodoScopeHint,
  buildReviewTodoQueueSummary,
  reviewContextText,
  buildRuleImprovementReadiness,
  buildReviewRecordPreflightChecklist,
  buildRuleFeedbackCandidate,
  buildManualActionEvidenceSnapshot,
  buildManualActionDisplayEvidenceSnapshot,
  buildManualActionRequestPayload,
  buildSignalManualActionEvidenceSnapshot,
  buildSearchIntentManualActionEvidenceSnapshot,
  mergeManualActionEvidenceSnapshots,
  canSaveReviewEffect,
  filterReviewTodosByProductScope,
  manualActionBoundaryText,
  manualActionEvidenceSnapshotText,
  manualActionEvidenceReasonText,
  manualActionIntentText,
  manualActionButtonGate,
  manualActionWriteGuardMessage,
  manualActionPostWriteExpectationText,
  manualActionPostWriteExpectationSummaryText,
  manualActionPostWritePreflightReadErrorText,
  manualActionPostWriteReadbackMessage,
  buildManualActionPostWritePreflightRequest,
  buildManualReviewClosureLedger,
  manualActionPreflightEvidenceSnapshotText,
  manualActionPreflightStatusText,
  manualActionReadbackCompactText,
  manualActionReadbackConsistencyText,
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
  "全局还有 2 条复盘待办，可切到全量排查查看。",
);
const globalReviewTodoHint = buildReviewTodoScopeHint({
  currentTotal: emptyQueueSummary.total,
  globalTotal: queueSummary.total,
  isGlobalScope: false,
});
assertEqual(globalReviewTodoHint?.text, "全局还有 2 条复盘待办，可切到全量排查查看。");
assertEqual(globalReviewTodoHint?.actionScopeId, "all");
assertEqual(globalReviewTodoHint?.actionLabel, "切到全量排查");
const scopedReviewTodoHint = buildReviewTodoScopeHint({
  currentTotal: 6,
  globalTotal: 10,
  isGlobalScope: false,
});
assertEqual(scopedReviewTodoHint?.text, "当前范围有 6 条复盘待办；全局共 10 条，另有 4 条在其他范围。");
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
    aba_match_boundary: "短语包含匹配，仅作为语义组市场热度背景。",
    repeat_search_intent_count: 2,
    repeat_aba_reference_count: 1,
    repeat_summary: "同一语义组已有 2 次人工留痕，复盘时应判断规则是否需要调整。",
    can_auto_change_rules: false,
    can_auto_execute_ads: false,
  },
};
assertIncludes(reviewContextText(abaContextTodo) ?? "", "语义组：规则语义：海滩出行用品");
assertIncludes(reviewContextText(abaContextTodo) ?? "", "ABA参考：beach essentials / 排名 208");
assertIncludes(reviewContextText(abaContextTodo) ?? "", "同一语义组已有 2 次人工留痕");
assertIncludes(reviewContextText(abaContextTodo) ?? "", "不会自动改规则或执行广告");
assertIncludes(manualActionEvidenceSnapshotText(abaContextTodo) ?? "", "复盘上下文：语义组：规则语义：海滩出行用品");
const contextDetails = buildReviewTodoQueueDetails([abaContextTodo], { isGlobalScope: true });
assertIncludes(contextDetails?.rows[0].contextText ?? "", "留痕证据快照");
assertIncludes(contextDetails?.rows[0].contextText ?? "", "ABA语义参考词");
assertIncludes(contextDetails?.rows[0].contextText ?? "", "ABA参考：beach essentials / 排名 208");
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
  "已读回匹配复盘记录：action_id / object_id / 7 天窗口 / 指标窗口一致",
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
assertEqual(canSaveReviewEffect(notReadyEffect), false);
assertEqual(canSaveReviewEffect(improvedEffect), true);
const reviewRecordPreflightChecklist = buildReviewRecordPreflightChecklist(
  {
    ...dueTodo,
    signal_id: "sig-previous-snapshot",
    shop_id: "market:1",
    market_id: 1,
    object_type: "advertised_product",
    object_id: "B016EXMW02",
    action_type: "add_to_review",
    evidence_snapshot: [
      {
        label: "广告商品覆盖",
        value: "覆盖 raw 投放行 6/7 / 证据行 6 条",
        detail: "未覆盖 raw 投放行 1 条，覆盖率 85.7%。",
        source: "advertised_products",
      },
    ],
  },
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
assertEqual(reviewRecordPreflightChecklist.length, 5);
assertEqual(reviewRecordPreflightChecklist[0].title, "确认复盘对象");
assertIncludes(reviewRecordPreflightChecklist[0].description, "advertised_product / B016EXMW02");
assertIncludes(reviewRecordPreflightChecklist[0].description, "sig-previous-snapshot");
assertEqual(reviewRecordPreflightChecklist[1].title, "回看人工动作证据");
assertIncludes(reviewRecordPreflightChecklist[1].description, "广告商品覆盖");
assertIncludes(reviewRecordPreflightChecklist[1].description, "保存复盘前");
assertEqual(reviewRecordPreflightChecklist[2].title, "确认复盘窗口");
assertIncludes(reviewRecordPreflightChecklist[2].description, "7 天");
assertIncludes(reviewRecordPreflightChecklist[2].description, "ready");
assertEqual(reviewRecordPreflightChecklist[3].title, "核对指标口径");
assertIncludes(reviewRecordPreflightChecklist[3].description, "处理前 2026-06-01 至 2026-06-07");
assertIncludes(reviewRecordPreflightChecklist[3].description, "花费、订单、销售额、ACOS");
assertIncludes(reviewRecordPreflightChecklist[3].description, "不等同于归因所有业务变化");
assertEqual(reviewRecordPreflightChecklist[4].title, "确认规则反馈边界");
assertIncludes(reviewRecordPreflightChecklist[4].description, "只形成规则反馈候选");
assertIncludes(reviewRecordPreflightChecklist[4].description, "不自动改规则");
assertIncludes(reviewRecordPreflightChecklist[4].description, "不自动执行广告动作");
assertEqual(buildReviewRecordPreflightChecklist(dueTodo, notReadyEffect, null).length, 0);
const reviewRecordRequestPayload = buildReviewRecordRequestPayload(
  {
    ...improvedEffect,
    action_id: "manual-action-ad-product",
    object_type: "advertised_product",
    object_id: "B016EXMW02",
    review_window: "7d",
  },
  {
    ...dueTodo,
    action_id: "manual-action-ad-product",
    object_type: "advertised_product",
    object_id: "B016EXMW02",
  },
  "确认处理有效",
);
assertEqual(reviewRecordRequestPayload.review_note, "确认处理有效");
assertEqual(reviewRecordRequestPayload.expected_action_id, "manual-action-ad-product");
assertEqual(reviewRecordRequestPayload.expected_object_type, "advertised_product");
assertEqual(reviewRecordRequestPayload.expected_object_id, "B016EXMW02");
assertEqual(reviewRecordRequestPayload.expected_review_window, "7d");
assertEqual(reviewRecordRequestPayload.expected_can_auto_execute_ads, false);
assertEqual(reviewRecordRequestPayload.expected_can_auto_change_rules, false);
assertEqual(
  reviewCheckpointText(pendingTodo, null),
  "14 天复盘未到期：到 2026-06-15 后再判断处理前后指标。",
);
assertEqual(
  reviewCheckpointText(pendingTodo, notReadyEffect),
  "14 天复盘未到期：到 2026-06-15 后再判断处理前后指标；当前复盘效果仅说明窗口尚未完整。",
);
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
assertEqual(reviewRecordStatusText({ result: "improved", review_note: "确认处理有效" }), "最近复盘：improved / 确认处理有效");
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
  "写后预期：只写 1 条人工留痕，生成 7 天和 14 天复盘待办；不会保存复盘结论。",
);
assertEqual(
  manualActionPostWriteExpectationText("handled"),
  "写后预期：只写 1 条人工留痕，生成 7 天和 14 天复盘待办；不会保存复盘结论。",
);
assertEqual(
  manualActionPostWriteExpectationText("add_to_review"),
  "写后预期：只写 1 条人工留痕，生成 7 天和 14 天复盘待办；不会保存复盘结论。",
);
assertEqual(
  manualActionPostWriteExpectationText("ignore"),
  "写后预期：只写 1 条人工留痕，不生成当前复盘待办；不会保存复盘结论。",
);
assertEqual(
  manualActionPostWriteExpectationSummaryText(),
  "写后预期：复盘类 -> 7d / 14d；忽略 -> 0 条；不保存结论。",
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
  "写后验收通过：sales_product / B06VW5SQ97 当前 1 条留痕、2 条待办；证据读回：留痕 8 条，复盘待办 7d 8 条 / 14d 8 条；不执行广告动作，不保存复盘结论。",
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
};
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
assertEqual(manualActionButtonGate("observe", readyManualActionPreflight, null, false).disabled, false);
assertEqual(manualActionButtonGate("add_to_review", readyManualActionPreflight, null, true).disabled, true);
assertIncludes(manualActionButtonGate("add_to_review", readyManualActionPreflight, null, true).reason ?? "", "已有 7/14 天复盘待办");
assertEqual(
  manualActionWriteGuardMessage("加入复盘", manualActionButtonGate("add_to_review", null, null, false)),
  "未保存：加入复盘；正在读取后端只读预检；读取完成前不写入人工动作。",
);
assertEqual(manualActionWriteGuardMessage("记录观察", manualActionButtonGate("observe", readyManualActionPreflight, null, false)), null);
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
  manualActionReadbackConsistencyText(handledActionForReadback, [dueTodo, pendingTodo], []),
  "点击后读回一致：标记已处理已读回留痕 + 7d / 14d，尚未保存复盘结论。",
);
assertIncludes(
  manualActionReadbackConsistencyText(handledActionForReadback, [dueTodo, pendingTodo], [savedReviewRecord], {
    actionId: "manual-action-ad-product",
    objectType: "advertised_product",
    objectId: "B016EXMW02",
    reviewWindow: "7d",
  }),
  "已读回匹配复盘记录：action_id / object_id / 7 天窗口 / 指标窗口一致",
);
assertEqual(
  manualActionReadbackConsistencyText(handledActionForReadback, [dueTodo], []),
  "点击后读回待核对：标记已处理只读回 7d，应补齐 7d / 14d。",
);
assertEqual(
  manualActionPostWriteReadbackMessage(handledActionForReadback, [dueTodo, pendingTodo], [], postWriteVerifiedPreflight),
  "已记录：标记已处理；点击后读回一致：标记已处理已读回留痕 + 7d / 14d，尚未保存复盘结论；sales_product / B06VW5SQ97 写后读回：证据快照 1 条，复盘待办 7d / 14d，review_records 0 条，不执行广告动作；写后验收通过：sales_product / B06VW5SQ97 当前 1 条留痕、2 条待办；证据读回：留痕 8 条，复盘待办 7d 8 条 / 14d 8 条；不执行广告动作，不保存复盘结论。",
);
assertEqual(
  manualActionPostWriteReadbackMessage(
    handledActionForReadback,
    [dueTodo, pendingTodo],
    [],
    null,
    manualActionPostWritePreflightReadErrorText,
  ),
  "已记录：标记已处理；点击后读回一致：标记已处理已读回留痕 + 7d / 14d，尚未保存复盘结论；写后验收读取失败，已保留人工留痕，请稍后刷新核对复盘待办。",
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
const searchTermPreflightEvidenceSnapshot = buildManualActionDisplayEvidenceSnapshot({
  fallbackEvidenceSnapshot: [
    { label: "广告商品覆盖", value: "覆盖 raw 投放行 0/0 / 证据行 0 条" },
    { label: "广告聚合指标", value: "花费 0.00 / 订单 0 / 销售额 0.00" },
  ],
  preflight: {
    evidence_snapshot_preview: {
      will_write: false,
      will_save_on_authorized_write: true,
      item_count: 4,
      items: [
        { label: "搜索词表现", value: "花费 34.11 / 订单 21 / 销售额 193.20", source: "ad_search_term_daily_metrics" },
        { label: "投放上下文", value: "广告活动 2 个 / 广告组 2 个 / 搜索词表现行 2 条", source: "ad_search_term_daily_metrics" },
        { label: "投放词结构", value: "1 个投放词 / 搜索词表现行 2 条", source: "ad_search_term_daily_metrics" },
        { label: "对象边界", value: "搜索词是投放证据，不是广告商品本身", source: "business_rule" },
      ],
    },
  },
});
assertEqual(searchTermPreflightEvidenceSnapshot[0].label, "搜索词表现");
assertEqual(searchTermPreflightEvidenceSnapshot.some((item) => item.label === "广告商品覆盖"), false);
const searchIntentManualEvidenceSnapshot = buildSearchIntentManualActionEvidenceSnapshot({
  intentLabel: "规则语义：海滩出行用品",
  searchTerm: "beach essentials",
  abaReferenceTerm: "beach essentials",
  abaRank: 208,
  abaPeriod: "2026-06-07 至 2026-06-13",
  abaMatchBoundary: "短语包含匹配，仅作为语义组市场热度背景。",
});
assertEqual(searchIntentManualEvidenceSnapshot.length, 6);
assertEqual(searchIntentManualEvidenceSnapshot[0].label, "语义组");
assertEqual(searchIntentManualEvidenceSnapshot[0].source, "规则语义");
assertIncludes(searchIntentManualEvidenceSnapshot[0].detail ?? "", "只用于复盘回看");
assertEqual(searchIntentManualEvidenceSnapshot[1].label, "搜索词");
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
      { label: "ABA匹配边界", value: "短语包含匹配，仅作为语义组市场热度背景。" },
    ],
  },
});
assertEqual(signalManualEvidenceSnapshot[0].label, "语义组");
assertEqual(signalManualEvidenceSnapshot[1].label, "搜索词");
assertEqual(signalManualEvidenceSnapshot[2].label, "ABA语义参考词");
assertEqual(signalManualEvidenceSnapshot[5].label, "ABA匹配边界");
assertIncludes(manualActionEvidenceSnapshotText({ evidence_snapshot: signalManualEvidenceSnapshot }) ?? "", "ABA语义参考词：beach essentials");
const mergedManualEvidenceSnapshot = mergeManualActionEvidenceSnapshots(searchIntentManualEvidenceSnapshot, manualEvidenceSnapshot);
assertEqual(mergedManualEvidenceSnapshot[0].label, "语义组");
assertEqual(mergedManualEvidenceSnapshot[6].label, "广告商品覆盖");
assertIncludes(
  manualActionEvidenceSnapshotText({ evidence_snapshot: mergedManualEvidenceSnapshot }) ?? "",
  "语义组：规则语义：海滩出行用品",
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
assertEqual(manualActionRequestPayload.evidence_snapshot.length, 7);
assertEqual(manualActionRequestPayload.evidence_snapshot[0].label, "语义组");
assertEqual(manualActionRequestPayload.evidence_snapshot[5].label, "ABA匹配边界");
const manualActionReasonText = manualActionEvidenceReasonText([
  { label: "广告商品覆盖", value: "覆盖 raw 投放行 6/7 / 证据行 6 条" },
  { label: "广告指标汇总", value: "花费 $64.92 / 订单 18 / ACOS 38.0%" },
  { label: "Top 花费来源", value: "来自 SP 广告商品快照" },
  { label: "搜索词市场背景", value: "同广告组搜索词 18 条 / ABA Top1000 匹配 1 条" },
]);
assertIncludes(manualActionReasonText ?? "", "广告商品覆盖：覆盖 raw 投放行 6/7 / 证据行 6 条");
assertIncludes(manualActionReasonText ?? "", "广告指标汇总：花费 $64.92 / 订单 18 / ACOS 38.0%");
assertIncludes(manualActionReasonText ?? "", "搜索词市场背景：同广告组搜索词 18 条 / ABA Top1000 匹配 1 条");
assertEqual(manualActionReasonText?.includes("Top 花费来源"), false);
const adAsinManualActionReasonText = manualActionEvidenceReasonText(adAsinBusinessEvidenceSnapshot);
assertIncludes(adAsinManualActionReasonText ?? "", "广告商品覆盖：覆盖 raw 投放行 2/2 / 证据行 2 条");
assertIncludes(adAsinManualActionReasonText ?? "", "广告聚合指标：花费 79.28 / 订单 32 / 销售额 309.57");
assertIncludes(adAsinManualActionReasonText ?? "", "搜索词市场背景：同广告组搜索词 18 条 / ABA Top1000 匹配 1 条");
assertIncludes(adAsinManualActionReasonText ?? "", "上下文边界：搜索词 18 条 / 广告位 0 条");
assertEqual(adAsinManualActionReasonText?.includes("主要花费来源"), false);
assertEqual(buildSearchIntentManualActionEvidenceSnapshot({ intentLabel: null }).length, 0);
assertIncludes(manualActionEvidenceSnapshotText(handledActionForReadback) ?? "", "广告商品覆盖：覆盖 raw 投放行 6/7 / 证据行 6 条");
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
  "预期：复盘类 7d/14d，忽略 0；读回：暂无留痕",
);
assertEqual(
  manualActionReadbackCompactText(handledActionForReadback, [dueTodo, pendingTodo], []),
  "预期：复盘类 7d/14d；读回一致：留痕 + 7d/14d，未存结论",
);
assertEqual(
  manualActionReadbackCompactText(handledActionForReadback, [dueTodo], []),
  "预期：复盘类 7d/14d；待读回补齐：7d",
);
assertEqual(
  manualActionReadbackCompactText(ignoreActionForReadback, [], []),
  "预期：忽略 0；读回一致：0 条待办，未存结论",
);
const pendingManualReviewClosureLedger = buildManualReviewClosureLedger({
  manualActionCount: 1,
  reviewTodoCount: 2,
  reviewRecordCount: 0,
  reviewEffectStatus: "not_ready",
  nextReviewDueAt: "2026-06-15T00:00:00+00:00",
});
assertIncludes(pendingManualReviewClosureLedger.summary, "已留痕并进入 7/14 天复盘");
assertEqual(pendingManualReviewClosureLedger.rows[0].label, "人工留痕");
assertEqual(pendingManualReviewClosureLedger.rows[0].value, "已记录 1 条");
assertEqual(pendingManualReviewClosureLedger.rows[1].label, "复盘待办");
assertEqual(pendingManualReviewClosureLedger.rows[1].value, "已生成 2 条");
assertIncludes(pendingManualReviewClosureLedger.rows[1].detail, "下一项到期 2026-06-15");
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
