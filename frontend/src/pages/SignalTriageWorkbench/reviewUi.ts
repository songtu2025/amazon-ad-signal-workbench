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
  expected_can_auto_change_rules: false;
  expected_can_auto_execute_ads: false;
}

export interface ManualActionForUi {
  id?: string | null;
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

export interface ManualActionPreflightForUi {
  status?: string | null;
  mode?: string | null;
  will_write?: boolean | null;
  requires_explicit_authorization?: boolean | null;
  target?: {
    action_type?: ManualActionForUi["action_type"] | string | null;
    object_type?: string | null;
    object_id?: string | null;
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

export interface ManualActionExpectedTargetForUi {
  objectType?: string | null;
  objectId?: string | null;
  actionType?: ManualActionForUi["action_type"] | string | null;
}

export interface ManualActionPostWriteContractItem {
  label: string;
  value: string;
  detail: string;
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
  id: "target_identity" | "action_evidence_snapshot" | "window_integrity" | "metric_basis" | "rule_feedback_boundary";
  title: string;
  description: string;
}

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

export function reviewTodoStatusText(todo: ReviewTodoForUi) {
  return `${reviewWindowLabel[todo.review_window]}复盘${todo.is_due ? "已到期" : "未到期"}`;
}

export function reviewCheckpointText(todo: ReviewTodoForUi | null, effect: ReviewEffectForUi | null) {
  if (!todo) return "暂无复盘待办：记录观察、标记已处理或加入复盘后才会生成 7/14 天复盘。";
  const statusText = reviewTodoStatusText(todo);
  if (!todo.is_due && effect?.status !== "ready") {
    const suffix = effect ? "；当前复盘效果仅说明窗口尚未完整。" : "。";
    return `${statusText}：到 ${String(todo.due_at).slice(0, 10)} 后再判断处理前后指标${suffix}`;
  }
  if (!effect) {
    return `${statusText}：正在读取复盘效果。`;
  }
  if (effect.status === "ready") return `${statusText}：已具备处理前后指标，可以保存复盘记录。`;
  if (effect.status === "not_ready") return `${statusText}：${effect.message}`;
  return `${statusText}：${effect.message}`;
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
  return `${shopText}；${marketText}；对象：${objectType} / ${objectId}`;
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
  return new Set(
    [primaryObject?.asin, primaryObject?.label, primaryObject?.object_id]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean),
  );
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
  const objectType = String(primaryObject?.object_type ?? signal?.object_type ?? "").trim();
  const objectId = [primaryObject?.asin, primaryObject?.label, primaryObject?.object_id]
    .map((value) => String(value ?? "").trim())
    .find(Boolean);
  if (!objectType || !objectId) return {};
  return { objectType, objectId };
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
  return {
    total,
    due,
    pending: total - due,
    text: `复盘待办 ${total} 条 / 到期 ${due} 条`,
    description: `复盘待办只代表已进入复盘窗口；是否改善必须等处理前后指标对比或人工复盘确认。${nextDescription}${evidenceDescription}`,
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
      text: `当前范围有 ${input.currentTotal} 条复盘待办；全局共 ${input.globalTotal} 条，另有 ${remainingTotal} 条在其他范围。`,
      actionScopeId: "all",
      actionLabel: "切到全量排查",
    };
  }
  return {
    text: `全局还有 ${input.globalTotal} 条复盘待办，可切到全量排查查看。`,
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

export function canSaveReviewEffect(effect: ReviewEffectForUi | null) {
  return effect?.status === "ready";
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

  return [
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
      id: "rule_feedback_boundary",
      title: "确认规则反馈边界",
      description: "保存后只形成规则反馈候选；不自动改规则，不自动执行广告动作。",
    },
  ];
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
  const note = record.review_note || "未填写备注";
  const windowText = reviewEffectWindowText(effect);
  const windowSuffix = windowText ? `；${windowText}` : "";
  return {
    title: "规则反馈候选",
    basis: `复盘结果：${record.result} / ${note}；${readback}${windowSuffix}`,
    recommendation: `${reviewRuleFeedbackText(record.result)}；作为同类信号解释和规则阈值复核方向。`,
    boundary: "该候选只进入解释层，不自动改规则，不自动执行广告动作。",
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
  return `最近复盘：${record.result} / ${record.review_note || "未填写备注"}`;
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
  const semanticSource = intentLabel.startsWith("规则语义：") ? "规则语义" : "搜索词语义分组";
  const snapshot: ManualActionEvidenceSnapshotForUi[] = [
    {
      label: "语义组",
      value: intentLabel,
      detail: "只用于复盘回看同类搜索词判断链，不代表自动新增关键词、否词或调价。",
      source: semanticSource,
    },
  ];

  if (searchTerm) {
    snapshot.push({
      label: "搜索词",
      value: searchTerm,
      detail: "人工处理对象仍落到具体 SearchTerm 信号，语义组只作为复盘上下文。",
      source: "积加API",
    });
  }
  if (abaReferenceTerm) {
    snapshot.push({
      label: "ABA语义参考词",
      value: abaReferenceTerm,
      detail: "ABA 是站点级市场热度证据，只作为同语义组复盘背景。",
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

export function buildSignalManualActionEvidenceSnapshot(
  signal: ReviewSignalForUi | null | undefined,
  selectedSearchIntentLabel?: string | null,
): ManualActionEvidenceSnapshotForUi[] {
  const facts = signal?.evidence?.facts ?? [];
  const primaryObject = signal?.evidence?.primary_object;
  const factValue = (label: string) => signalFactValue(facts, label);
  const intentLabel =
    String(selectedSearchIntentLabel ?? "").trim() ||
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
      : input.evidenceSnapshot ?? [];
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
  if (!snapshot.length) return contextText ? `复盘上下文：${contextText}` : null;
  const evidenceText = snapshot
    .slice(0, 4)
    .map((item) => `${item.label}：${item.value}`)
    .join("；");
  return contextText ? `留痕证据快照：${evidenceText}；复盘上下文：${contextText}` : `留痕证据快照：${evidenceText}`;
}

const manualActionEvidenceReasonPriority = [
  "广告商品覆盖",
  "广告聚合指标",
  "广告指标汇总",
  "搜索词市场背景",
  "上下文边界",
  "人工动作路径",
  "复盘指标",
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

  return visible.map(({ item }) => `${item.label}：${item.value}`).join("；");
}

export function reviewContextText(action: { review_context?: ReviewContextForUi | null } | null) {
  const context = action?.review_context;
  if (!context) return null;
  const parts: string[] = [];
  if (context.search_intent_label) {
    parts.push(`语义组：${context.search_intent_label}`);
  }
  if (context.search_term) {
    parts.push(`搜索词：${context.search_term}`);
  }
  if (context.aba_reference_term) {
    const rankText = context.aba_reference_rank ? ` / 排名 ${context.aba_reference_rank}` : "";
    parts.push(`ABA参考：${context.aba_reference_term}${rankText}`);
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
    parts.push(context.repeat_summary);
  }
  if (context.can_auto_change_rules === false || context.can_auto_execute_ads === false) {
    parts.push("不会自动改规则或执行广告");
  }
  return parts.length > 0 ? parts.join("；") : null;
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

export function manualActionPostWriteExpectationText(actionType: ManualActionForUi["action_type"]) {
  if (actionType === "ignore") {
    return "写后预期：只写 1 条人工留痕，不生成当前复盘待办；不会保存复盘结论。";
  }
  return "写后预期：只写 1 条人工留痕，生成 7 天和 14 天复盘待办；不会保存复盘结论。";
}

export function manualActionPostWriteExpectationSummaryText() {
  return "写后预期：复盘类 -> 7d / 14d；忽略 -> 0 条；不保存结论。";
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
      detail: targetReviewTodoCount > 0 ? `应生成 ${reviewWindows} 复盘待办，${evidenceText}。` : "该动作不生成当前复盘待办。",
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

export function buildManualReviewClosureLedger(input: ManualReviewClosureLedgerInput): ManualReviewClosureLedger {
  const manualActionCount = Math.max(0, input.manualActionCount);
  const reviewTodoCount = Math.max(0, input.reviewTodoCount);
  const reviewRecordCount = Math.max(0, input.reviewRecordCount);
  const nextReviewDueDate = input.nextReviewDueAt ? input.nextReviewDueAt.slice(0, 10) : null;

  const summary = (() => {
    if (reviewRecordCount > 0) return "已形成可回看的人工闭环：留痕、待办和复盘结论均可读回。";
    if (manualActionCount > 0 && reviewTodoCount > 0) return "当前已留痕并进入 7/14 天复盘，但还没有效果结论。";
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
            ? `review_todos 只表示等待 7/14 天窗口${nextReviewDueDate ? `，下一项到期 ${nextReviewDueDate}` : ""}。`
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

export const manualActionPostWritePreflightReadErrorText =
  "写后验收读取失败，已保留人工留痕，请稍后刷新核对复盘待办。";

export function manualActionPreflightStatusText(preflight: ManualActionPreflightForUi | null) {
  if (!preflight) return "后端预检：正在读取；未读取前不会自动写入人工动作。";
  const target = preflight.target;
  const objectText = target?.object_type && target?.object_id ? `${target.object_type} / ${target.object_id}` : "目标对象待确认";
  const blockers = preflight.blockers ?? [];
  const isPostWrite = preflight.mode === "post_write";
  if (preflight.status === "blocked" || blockers.length > 0) {
    const blockerText = blockers.map((blocker) => blocker.message || blocker.code).filter(Boolean).join("；") || "存在阻塞项";
    return isPostWrite
      ? `写后验收阻塞：${objectText}；${blockerText}；请核对人工留痕和复盘待办。`
      : `后端预检阻塞：${objectText}；${blockerText}；不会写入人工动作。`;
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
    return `写后验收通过：${objectText} 当前 ${currentManualActionCount} 条留痕、${currentReviewTodoCount} 条待办${evidenceReadbackSegment}；${forbiddenText}，${reviewRecordText}。`;
  }
  const preWriteTitle = preflight.requires_explicit_authorization ? "后端预检通过，待人工授权" : "后端预检通过";
  const writeExpectation = preflight.requires_explicit_authorization ? "授权点击后预计" : "人工确认后预计";
  return `${preWriteTitle}：${objectText} 当前 ${currentManualActionCount} 条留痕、${currentReviewTodoCount} 条待办；${writeExpectation} ${expectedManualActionCount} 条留痕、${expectedReviewTodoCount} 条待办；本接口 will_write=${String(preflight.will_write)}，${forbiddenText}，${reviewRecordText}。`;
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
    .map((item) => `${item.review_window || "待确认"} ${numberOrZero(item.evidence_snapshot_count)} 条`)
    .join(" / ");

  return `证据读回：留痕 ${manualEvidenceCount} 条，复盘待办 ${reviewTodoText || "未读回证据"}`;
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

export function manualActionPreflightEvidenceRows(preflight: ManualActionPreflightForUi | null, limit = 8) {
  if (!preflight?.evidence_snapshot_preview) return [];
  return buildManualActionDisplayEvidenceSnapshot({
    preflight,
    fallbackEvidenceSnapshot: [],
  }).slice(0, limit);
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
      reason: "已有 7/14 天复盘待办；等待完整窗口后再判断效果。",
      compactReason: "等待 7/14 窗口",
    };
  }
  if (preflightError) {
    return { disabled: true, reason: preflightError, compactReason: "预检失败" };
  }
  if (!preflight) {
    return {
      disabled: true,
      reason: "正在读取后端只读预检；读取完成前不写入人工动作。",
      compactReason: "读取预检",
    };
  }
  const blockers = preflight.blockers ?? [];
  if (preflight.status === "blocked" || blockers.length > 0) {
    return {
      disabled: true,
      reason: `后端预检阻塞：${preflightBlockerText(blockers)}；不会写入人工动作。`,
      compactReason: "预检阻塞",
    };
  }
  if (preflight.will_write !== false) {
    return {
      disabled: true,
      reason: "后端预检未确认 will_write=false；不会写入人工动作。",
      compactReason: "只读边界待核对",
    };
  }
  if (manualActionPreflightTargetMismatch(preflight, expectedTarget)) {
    return {
      disabled: true,
      reason: "后端预检目标与当前候选不一致；请等待预检刷新后再写入人工动作。",
      compactReason: "预检目标待刷新",
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

function reviewRecordMatchesExpectation(record: ReviewRecordForUi, expectation: ReviewRecordReadbackExpectation) {
  const actionMatches = !expectation.actionId || record.action_id === expectation.actionId;
  const objectTypeMatches = !expectation.objectType || record.object_type === expectation.objectType;
  const objectIdMatches = !expectation.objectId || record.object_id === expectation.objectId;
  const windowMatches = !expectation.reviewWindow || record.review_window === expectation.reviewWindow;
  return actionMatches && objectTypeMatches && objectIdMatches && windowMatches && hasReviewMetricWindow(record);
}

export function reviewRecordReadbackStatus(records: ReviewRecordForUi[], expectation: ReviewRecordReadbackExpectation | null = null) {
  if (records.length === 0) return "尚未保存复盘结论";
  if (expectation) {
    const matchedRecord = records.find((record) => reviewRecordMatchesExpectation(record, expectation));
    if (matchedRecord) {
      const windowText = expectation.reviewWindow ? `${reviewWindowLabel[expectation.reviewWindow]}窗口` : "复盘窗口";
      return `已读回匹配复盘记录：action_id / object_id / ${windowText} / 指标窗口一致`;
    }
    return `复盘记录待读回核对：已读回 ${records.length} 条，但未命中 action_id / object_id / review_window / 指标窗口。`;
  }
  return `已有复盘记录 ${records.length} 条`;
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
  if (windows.length === reviewWindowOrder.length) {
    return `点击后读回一致：${actionLabel}已读回留痕 + 7d / 14d，${reviewRecordReadbackStatus(
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
  const objectType = postWritePreflight?.target?.object_type || action.object_type || "对象";
  const objectId = postWritePreflight?.target?.object_id || action.object_id || action.object_label || "待确认";
  const snapshotCount = action.evidence_snapshot?.length ?? 0;
  const windows = readbackReviewWindows(reviewTodosForSelectedObject);
  const windowText = windows.length > 0 ? windows.join(" / ") : "0 条";
  const reviewRecordCount =
    postWritePreflight?.current_counts?.target_review_record_count ?? reviewRecordsForSelectedObject.length;
  const forbiddenText = postWritePreflight?.forbidden_effects?.some((effect) => effect.includes("不执行广告动作"))
    ? "不执行广告动作"
    : "禁止副作用需继续核对";
  return `${objectType} / ${objectId} 写后读回：证据快照 ${snapshotCount} 条，复盘待办 ${windowText}，review_records ${reviewRecordCount} 条，${forbiddenText}`;
}

export function manualActionReadbackCompactText(
  action: ManualActionForUi | null,
  reviewTodosForSelectedObject: ReviewTodoForUi[],
  reviewRecordsForSelectedObject: ReviewRecordForUi[],
) {
  const recordText = reviewRecordsForSelectedObject.length > 0 ? `复盘记录 ${reviewRecordsForSelectedObject.length}` : "未存结论";
  if (!action) return "预期：复盘类 7d/14d，忽略 0；读回：暂无留痕";
  if (action.action_type === "ignore") {
    if (reviewTodosForSelectedObject.length === 0) return `预期：忽略 0；读回一致：0 条待办，${recordText}`;
    return `预期：忽略 0；待读回核对：${reviewTodosForSelectedObject.length} 条待办`;
  }

  const windows = readbackReviewWindows(reviewTodosForSelectedObject);
  if (windows.length === reviewWindowOrder.length) {
    return `预期：复盘类 7d/14d；读回一致：留痕 + 7d/14d，${recordText}`;
  }
  const currentWindowsText = windows.length > 0 ? windows.join(" / ") : "0";
  return `预期：复盘类 7d/14d；待读回补齐：${currentWindowsText}`;
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

function normalizedPreflightTargetValue(value: string | number | null | undefined) {
  return value == null ? "" : String(value).trim();
}

function reviewEffectWindowRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return "待补齐";
  return `${startDate} 至 ${endDate}`;
}
