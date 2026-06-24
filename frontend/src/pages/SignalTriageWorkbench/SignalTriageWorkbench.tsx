import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Database,
  FileWarning,
  Eye,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  AiSignal,
  ManualActionPreflight,
  ManualActionRecord,
  ManualActionType,
  MarketOption,
  ProductScopeOption,
  ProductScopeSummary,
  ReviewEffectResult,
  ReviewEvidenceRepairPayload,
  ReviewRecord,
  ReviewTodo,
  SearchIntentSummary,
  SnapshotInspectionResult,
  SignalScanSummary,
  SignalTriageSummary,
  SnapshotReadiness,
  SnapshotStatus,
  createSignalManualAction,
  createSignalReviewRecord,
  fetchManualActionPreflight,
  fetchReviewEvidenceRepair,
  fetchSignalManualActions,
  fetchReviewTodos,
  fetchSignalReviewEffect,
  fetchSignalReviewRecords,
  fetchSignalReviewTodos,
  fetchMarketOptions,
  fetchProductScope,
  fetchSignals,
  fetchSearchIntents,
  fetchSignalScanSummary,
  fetchSignalTriageSummary,
  fetchSnapshotInspection,
  fetchSnapshotReadiness,
  fetchSnapshotStatus,
  probeSnapshotApi,
  runSnapshotPipeline,
} from "../../api";
import {
  marketOptionLabel,
  shouldPauseSnapshotPullForReview,
  snapshotActionBoundaryText,
  snapshotFreshnessText,
  snapshotInspectionText,
  snapshotPipelineMessage,
  snapshotProbeMessage,
  signalScanSummaryText,
} from "./snapshotUi";
import {
  buildReviewTodoQueueDetails,
  buildReviewTodoScopeHint,
  buildReviewTodoQueueSummary,
  buildRuleImprovementReadiness,
  buildReviewRecordPreflightChecklist,
  buildReviewRecordSaveGateSummary,
  buildReviewRecordSavePathSummary,
  buildReviewEffectWindowLedger,
  buildReviewRecordRequestPayload,
  buildRuleFeedbackCandidate,
  buildManualActionEvidenceSnapshot,
  manualActionExpectedTargetForSignal,
  buildManualActionIdentityGateItems,
  buildManualActionPathSteps,
  buildManualActionReadbackPathItems,
  buildManualActionPostWritePreflightRequest,
  buildManualActionRequestPayload,
  buildSignalManualActionEvidenceSnapshot,
  buildSearchIntentManualActionPreflightConsistencySummary,
  buildSearchIntentManualActionReadbackSummary,
  mergeManualActionEvidenceSnapshots,
  canSaveReviewRecordWithPreflight,
  buildReviewRecordReadbackExpectation,
  buildReviewRecordReadbackTarget,
  filterReviewTodosByProductScope,
  buildReviewTodoDecisionReadbackSummary,
  buildReviewTodoEvidenceReadbackSummary,
  manualActionBoundaryText,
  manualActionEmptyStateText,
  manualActionEvidenceSnapshotText,
  manualActionSavableEvidenceReasonText,
  manualActionChoiceGuideItems,
  manualActionButtonExpectationText,
  manualActionIntentText,
  manualActionPostWriteExpectationSummaryText,
  manualActionPostWritePreflightReadErrorText,
  manualActionPostWriteReadbackMessage,
  manualActionAuthorizationReadinessSummary,
  manualConfirmationEvidenceReadinessSummary,
  manualConfirmationDiagnosisBridgeSummary,
  buildManualReviewClosureLedger,
  manualActionButtonGate,
  manualActionPostWriteContractItems,
  manualActionPreflightErrorForAction,
  manualActionPreflightForAction,
  manualActionWriteGuardMessage,
  manualActionPreflightEvidenceRows,
  manualActionPreflightEvidenceSnapshotText,
  manualActionPreflightPriorityEvidenceRows,
  manualActionPreflightStatusText,
  manualActionReadbackCompactText,
  manualActionReadbackConsistencyText,
  hasReviewRecordReadbackMatch,
  reviewApplicabilityBoundaryText,
  reviewCheckpointText,
  reviewEffectTargetReadbackText,
  reviewEffectSummaryText,
  reviewEffectWindowText,
  reviewMetricComparisonRows,
  reviewRecordReadbackStatus,
  reviewRecordStatusText,
  reviewRecordSignalIdForTodo,
  reviewTargetReadbackText,
  reviewTodoEmptyStateText,
  selectManualActionsForSignal,
  selectNextReviewTodo,
  selectReviewTodosForSignal,
  SearchIntentManualActionPreflightConsistencySummary,
  SearchIntentManualActionReadbackSummary,
} from "./reviewUi";
import {
  buildAdProductComparisonRows,
  buildEvidenceDrilldownSections,
  buildEvidenceRouteNodes,
  buildEvidenceSourceOptions,
  buildKeyEvidenceFacts,
  buildProductScopeGroupOverview,
  buildProductScopeFirstScreenSummary,
  buildProductScopeDiagnosisBrief,
  buildProductScopeAnalysisPath,
  buildProductScopeEntryGuidance,
  buildProductScopeOptionGroups,
  buildProductScopePriorityDecisionBuckets,
  buildProductScopePriorityQueueItems,
  buildProductScopeManualActionTargetAlignment,
  buildProductScopeAdmissionCard,
  buildProductScopeEvidenceMatrix,
  buildNoActionableManualGate,
  buildManualActionCandidateAdGroupBridge,
  buildManualActionDecisionFactItems,
  buildManualConfirmationEvidenceItems,
  buildProductScopeQueueHeader,
  buildProductScopeSelectionSummary,
  buildProductScopeCandidateGapExplanation,
  buildProductScopeSignalExplanation,
  buildBackendRecommendedManualActionCandidate,
  buildNextUnhandledManualActionCandidate,
  buildRecommendedManualActionCandidate,
  buildDiagnosisContextSummary,
  buildDiagnosisPathSummary,
  buildSearchIntentPanelContext,
  buildSearchIntentReviewCards,
  buildSearchIntentReviewDecisionSummary,
  buildSearchIntentEntryLockSummary,
  buildSearchIntentFocusContext,
  buildSearchIntentSelectedTermReasonSummary,
  buildSelectedSignalScopeContext,
  buildSignalDiagnosticScope,
  buildSignalLayerOverview,
  buildSignalQueueMeta,
  canRecommendManualActionFromTriageSummary,
  buildSignalQueueObjectStatus,
  buildSignalQueueScopeBadge,
  applySignalStatusOverrides,
  buildSignalEvidenceSupport,
  buildSignalObjectContext,
  buildSignalOverview,
  buildSignalTriggerRationale,
  buildSignalTriageRationale,
  buildSignalDiagnosisEvidenceSummary,
  buildSignalMetricDecisionItems,
  buildSearchTermOpportunityReviewChain,
  buildSearchTermAdContextRows,
  recommendedManualStatusText,
  recommendedManualActionCardCopy,
  recommendedEvidenceDrilldownText,
  nextUnhandledEvidenceDrilldownText,
  manualActionReviewRouteSplitSummary,
  manualActionQueueTargetSwitchSummary,
  manualActionPreviewForSelectedSignal,
  manualActionTargetSummary,
  buildRuleFeedbackPrioritySummary,
  buildReviewEvidenceRepairSummary,
  buildReviewReadinessGateSummary,
  resolveSignalSelectionId,
  resolveSearchIntentFocusSelection,
  signalTriageCompactItems,
  signalTriageBlockerTexts,
  signalTriageBusinessEvidenceItems,
  signalTriageDiagnosisContractItems,
  signalTriageDiagnosisPathItems,
  signalTriageDepthText,
  signalTriageLayerText,
  signalTriageReviewFeedbackText,
  signalTriageSummaryText,
  ProductScopeAdmissionCard,
  ProductScopeAdGroupDiagnosisRow,
  ProductScopeDiagnosisBrief,
  ProductScopeEvidenceMatrix,
  ProductScopeEvidenceRouteGuide,
  NoActionableManualGate,
  ProductScopeCandidateGapExplanation,
  DiagnosisContextSummary,
  DiagnosisPathSummary,
  SearchTermOpportunityReviewChain,
  SearchTermAdContextRow,
  SignalDiagnosisEvidenceSummary,
  SignalTriageBusinessEvidenceItem,
  SignalTriageDiagnosisContractItem,
  SignalMetricDecisionItem,
  SignalTriageDiagnosisPathItem,
  ProductScopePriorityDecisionBucket,
  ProductScopePriorityQueueItem,
  ProductScopeManualActionTargetAlignment,
  SelectedSignalScopeContext,
  SearchIntentPanelContext,
  SearchIntentReviewDecisionSummary,
  SearchIntentFocusContext,
  SearchIntentSelectedTermReasonSummary,
  triggerEvidenceCountText,
  filterEvidenceBySource,
  filterSignalsBySearchIntent,
  filterSignalsByProductScope,
  mergeBackendTriageSignals,
  isActionableProductScope,
  preferredProductScopeId,
  resolveProductScopePrioritySelectionId,
  resolveProductScopeSelectionId,
  productScopeOptionLabel,
  productScopeAdGroupDiagnosisRows,
  productScopeDrilldownEvidenceItems,
  buildProductScopeEvidenceRouteGuide,
  signalCategoryLabel,
  signalDecisionBoundary,
  signalImpactScope,
  signalQueueKind,
  signalQueueKindLabel,
  signalScopedStateKey,
  signalStatusOverrideKey,
  SignalQueueKind,
} from "./signalUi";

const objectTypeLabel: Record<string, string> = {
  ad_group: "广告组",
  sales_product: "销售商品",
  advertised_product: "广告商品",
  search_term: "搜索词",
  placement: "广告位",
  search_intent: "搜索词表现聚合",
  cross: "交叉信号",
};

const statusLabel: Record<AiSignal["status"], string> = {
  pending: "待确认",
  adopted: "已处理",
  observing: "观察中",
  ignored: "已忽略",
  false_positive: "误报",
};

const confidenceLabel: Record<AiSignal["confidence"], string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const freshnessLabel: Record<AiSignal["freshness_status"], string> = {
  api_snapshot: "API快照",
  sample_data: "样例数据",
  unknown: "未知来源",
  stale: "数据过期",
};

const manualActionLabel: Record<ManualActionType, string> = {
  observe: "记录观察",
  handled: "标记已处理",
  add_to_review: "加入复盘",
  ignore: "忽略本次",
};

function manualActionDisplayLabel(actionType?: string | null) {
  return manualActionLabel[actionType as ManualActionType] ?? actionType ?? "待确认";
}

const manualActionCompactIntent: Record<ManualActionType, string> = {
  add_to_review: "7d/14d 待办",
  observe: "留痕 + 复盘",
  handled: "留痕 + 复盘",
  ignore: "0 条待办",
};

const manualActionOrder: ManualActionType[] = ["add_to_review", "observe", "handled", "ignore"];

const manualActionIcon = {
  add_to_review: ClipboardList,
  observe: Eye,
  handled: CheckCircle2,
  ignore: Ban,
};

const defaultMarketId = 1;

type QueueFilter = "all" | "high" | SignalQueueKind | "observing";

const queueBusinessFilters: Array<{ value: SignalQueueKind; label: string }> = [
  { value: "opportunity_expansion", label: "机会扩量" },
  { value: "spend_waste", label: "花费浪费" },
  { value: "structure_boundary", label: "投放结构" },
  { value: "data_quality", label: "数据质量" },
  { value: "review", label: "复盘" },
];

function formatPercent(value: number | null) {
  if (value === null) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export function SignalTriageWorkbench() {
  const [signals, setSignals] = useState<AiSignal[]>([]);
  const [snapshotStatus, setSnapshotStatus] = useState<SnapshotStatus | null>(null);
  const [snapshotReadiness, setSnapshotReadiness] = useState<SnapshotReadiness | null>(null);
  const [snapshotInspection, setSnapshotInspection] = useState<SnapshotInspectionResult | null>(null);
  const [signalScanSummary, setSignalScanSummary] = useState<SignalScanSummary | null>(null);
  const [signalTriageSummary, setSignalTriageSummary] = useState<SignalTriageSummary | null>(null);
  const [reviewEvidenceRepair, setReviewEvidenceRepair] = useState<ReviewEvidenceRepairPayload | null>(null);
  const [searchIntents, setSearchIntents] = useState<SearchIntentSummary[]>([]);
  const [marketOptions, setMarketOptions] = useState<MarketOption[]>([]);
  const [productScope, setProductScope] = useState<ProductScopeSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAdGroupDiagnosisId, setSelectedAdGroupDiagnosisId] = useState<string | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [loading, setLoading] = useState(true);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [probingSnapshot, setProbingSnapshot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<Record<string, AiSignal["status"]>>({});
  const [manualActionsBySignal, setManualActionsBySignal] = useState<Record<string, ManualActionRecord[]>>({});
  const [reviewTodos, setReviewTodos] = useState<ReviewTodo[]>([]);
  const [reviewTodosBySignal, setReviewTodosBySignal] = useState<Record<string, ReviewTodo[]>>({});
  const [reviewEffectsBySignal, setReviewEffectsBySignal] = useState<Record<string, ReviewEffectResult | null>>({});
  const [reviewRecordsBySignal, setReviewRecordsBySignal] = useState<Record<string, ReviewRecord[]>>({});
  const [manualActionPreflight, setManualActionPreflight] = useState<ManualActionPreflight | null>(null);
  const [manualActionPreflightError, setManualActionPreflightError] = useState<string | null>(null);
  const [manualActionPreflightsByAction, setManualActionPreflightsByAction] =
    useState<Partial<Record<ManualActionType, ManualActionPreflight | null>>>({});
  const [manualActionPreflightErrorsByAction, setManualActionPreflightErrorsByAction] =
    useState<Partial<Record<ManualActionType, string | null>>>({});
  const [manualActionPreviewActionType, setManualActionPreviewActionType] = useState<ManualActionType | null>(null);
  const [savingManualAction, setSavingManualAction] = useState(false);
  const [savingReviewRecord, setSavingReviewRecord] = useState(false);
  const [manualActionMessage, setManualActionMessage] = useState<string | null>(null);
  const [reviewTodoMessage, setReviewTodoMessage] = useState<string | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<number>(defaultMarketId);
  const [selectedProductScopeId, setSelectedProductScopeId] = useState<string | null>(null);
  const [selectedSearchIntentLabel, setSelectedSearchIntentLabel] = useState<string | null>(null);
  const [selectedSearchIntentScopeId, setSelectedSearchIntentScopeId] = useState<string | null>(null);
  const [isEvidenceDrilldownFocused, setIsEvidenceDrilldownFocused] = useState(false);
  const workbenchGridRef = useRef<HTMLElement | null>(null);

  async function loadSignals() {
    setLoading(true);
    setError(null);
    try {
      const [
        nextMarketOptions,
        nextProductScope,
        nextSignals,
        nextSnapshotStatus,
        nextSnapshotReadiness,
        nextSnapshotInspection,
        nextSignalScanSummary,
        nextReviewTodos,
      ] = await Promise.all([
        fetchMarketOptions(),
        fetchProductScope(),
        fetchSignals(selectedMarketId),
        fetchSnapshotStatus(),
        fetchSnapshotReadiness(selectedMarketId),
        fetchSnapshotInspection(),
        fetchSignalScanSummary(selectedMarketId),
        fetchReviewTodos(selectedMarketId),
      ]);
      const nextProductScopeOptions = nextProductScope.options;
      const nextActiveProductScopeId = resolveProductScopePrioritySelectionId(
        selectedProductScopeId,
        nextProductScopeOptions,
        nextSignals,
        nextReviewTodos,
      );
      const nextProductScopedSignals = filterSignalsByProductScope(nextSignals, nextActiveProductScopeId, nextProductScopeOptions);
      const [nextSignalTriageSummary, nextReviewEvidenceRepair, nextSearchIntents] = await Promise.all([
        fetchSignalTriageSummary(selectedMarketId, 5, nextActiveProductScopeId),
        fetchReviewEvidenceRepair(selectedMarketId, 5, nextActiveProductScopeId),
        fetchSearchIntents(selectedMarketId, nextActiveProductScopeId),
      ]);
      const nextDisplayProductScopedSignals = mergeBackendTriageSignals(
        nextProductScopedSignals,
        nextSignals,
        nextSignalTriageSummary,
      );
      setMarketOptions(nextMarketOptions);
      setProductScope(nextProductScope);
      setSignals(nextSignals);
      setSnapshotStatus(nextSnapshotStatus);
      setSnapshotReadiness(nextSnapshotReadiness);
      setSnapshotInspection(nextSnapshotInspection);
      setSignalScanSummary(nextSignalScanSummary);
      setSearchIntents(nextSearchIntents);
      setSignalTriageSummary(nextSignalTriageSummary);
      setReviewEvidenceRepair(nextReviewEvidenceRepair);
      setReviewTodos(nextReviewTodos);
      setSelectedProductScopeId(nextActiveProductScopeId);
      setSelectedId((current) => resolveSignalSelectionId(current, nextDisplayProductScopedSignals, nextSignalTriageSummary));
      if (nextMarketOptions.length > 0 && !nextMarketOptions.some((option) => option.market_id === selectedMarketId)) {
        setSelectedMarketId(nextMarketOptions[0].market_id);
      }
    } catch {
      setError("后端服务未连接");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSnapshot() {
    setCreatingSnapshot(true);
    setSnapshotMessage(null);
    try {
      const result = await runSnapshotPipeline({
        market_id: selectedMarketId,
        days: 7,
        count: 10,
        max_pages: 1,
        force: false,
      });
      setSnapshotMessage(snapshotPipelineMessage(result));
      setSnapshotInspection(result.inspection);
      setSignalScanSummary(result.signal_scan.summary ?? null);
      setSignals(result.signal_scan.signals);
      setSelectedId((current) => current ?? result.signal_scan.signals[0]?.id ?? null);
      await loadSignals();
    } catch {
      setSnapshotMessage("快照拉取失败");
    } finally {
      setCreatingSnapshot(false);
    }
  }

  async function handleProbeSnapshot() {
    setProbingSnapshot(true);
    setSnapshotMessage(null);
    try {
      const result = await probeSnapshotApi({ market_id: selectedMarketId });
      setSnapshotMessage(snapshotProbeMessage(result));
      if (result.status === "ready") {
        setMarketOptions(await fetchMarketOptions());
      }
    } catch {
      setSnapshotMessage("API探测失败");
    } finally {
      setProbingSnapshot(false);
    }
  }

  useEffect(() => {
    void loadSignals();
  }, [selectedMarketId]);

  const normalizedSignals = useMemo(
    () => applySignalStatusOverrides(signals, localStatus),
    [localStatus, signals],
  );
  const layerOverview = useMemo(() => buildSignalLayerOverview(normalizedSignals), [normalizedSignals]);

  const productScopeOptions: ProductScopeOption[] = useMemo(
    () =>
      productScope?.options ?? [
        {
          scope_id: "loading_product_scope",
          scope_type: "loading",
          label: "正在读取诊断入口",
          source: "system",
          spend: 0,
          orders: 0,
          sales: 0,
        },
      ],
    [productScope],
  );
  const activeProductScopeId = useMemo(
    () => selectedProductScopeId ?? preferredProductScopeId(productScopeOptions),
    [productScopeOptions, selectedProductScopeId],
  );
  const productScopeOptionGroups = useMemo(() => buildProductScopeOptionGroups(productScopeOptions), [productScopeOptions]);
  const productScopedSignals = useMemo(
    () => filterSignalsByProductScope(normalizedSignals, activeProductScopeId, productScopeOptions),
    [activeProductScopeId, normalizedSignals, productScopeOptions],
  );
  const displayProductScopedSignals = useMemo(
    () => mergeBackendTriageSignals(productScopedSignals, normalizedSignals, signalTriageSummary),
    [normalizedSignals, productScopedSignals, signalTriageSummary],
  );
  const activeSearchIntentLabel = selectedSearchIntentScopeId === activeProductScopeId ? selectedSearchIntentLabel : null;

  useEffect(() => {
    if (loading) return;
    void Promise.all([
      fetchSignalTriageSummary(selectedMarketId, 5, activeProductScopeId),
      fetchReviewEvidenceRepair(selectedMarketId, 5, activeProductScopeId),
      fetchSearchIntents(selectedMarketId, activeProductScopeId),
    ])
      .then(([nextSignalTriageSummary, nextReviewEvidenceRepair, nextSearchIntents]) => {
        setSignalTriageSummary(nextSignalTriageSummary);
        setReviewEvidenceRepair(nextReviewEvidenceRepair);
        setSearchIntents(nextSearchIntents);
        const nextDisplayProductScopedSignals = mergeBackendTriageSignals(
          productScopedSignals,
          normalizedSignals,
          nextSignalTriageSummary,
        );
        setSelectedId((current) => resolveSignalSelectionId(current, nextDisplayProductScopedSignals, nextSignalTriageSummary));
      })
      .catch(() => setError("后端服务未连接"));
  }, [activeProductScopeId, loading, normalizedSignals, productScopedSignals, selectedMarketId]);
  useEffect(() => {
    if (!selectedSearchIntentLabel) return;
    if (selectedSearchIntentScopeId === activeProductScopeId) return;
    setSelectedSearchIntentLabel(null);
    setSelectedSearchIntentScopeId(null);
  }, [activeProductScopeId, selectedSearchIntentLabel, selectedSearchIntentScopeId]);
  const backendRecommendedManualActionCandidate = useMemo(
    () => buildBackendRecommendedManualActionCandidate(displayProductScopedSignals, signalTriageSummary),
    [displayProductScopedSignals, signalTriageSummary],
  );
  const nextUnhandledManualActionCandidate = useMemo(
    () => buildNextUnhandledManualActionCandidate(displayProductScopedSignals, signalTriageSummary),
    [displayProductScopedSignals, signalTriageSummary],
  );
  const recommendedManualStatus = useMemo(() => recommendedManualStatusText(signalTriageSummary), [signalTriageSummary]);
  const recommendedManualActionCopy = useMemo(() => recommendedManualActionCardCopy(signalTriageSummary), [signalTriageSummary]);
  const triageCompactItems = useMemo(() => signalTriageCompactItems(signalTriageSummary), [signalTriageSummary]);
  const recommendedTriageBusinessEvidenceItems = useMemo(() => signalTriageBusinessEvidenceItems(signalTriageSummary, "recommended"), [signalTriageSummary]);
  const recommendedDiagnosisContractItems = useMemo(
    () => signalTriageDiagnosisContractItems(signalTriageSummary, signalTriageSummary?.recommended_diagnosis_contract),
    [signalTriageSummary],
  );
  const nextUnhandledDiagnosisContractItems = useMemo(
    () => signalTriageDiagnosisContractItems(signalTriageSummary, signalTriageSummary?.next_unhandled_diagnosis_contract),
    [signalTriageSummary],
  );
  const nextUnhandledTriageBusinessEvidenceItems = useMemo(() => signalTriageBusinessEvidenceItems(signalTriageSummary, "next_unhandled"), [signalTriageSummary]);
  const productScopeDrilldownEvidence = useMemo(() => productScopeDrilldownEvidenceItems(signalTriageSummary), [signalTriageSummary]);
  const productScopeAdGroupDiagnosis = useMemo(() => productScopeAdGroupDiagnosisRows(signalTriageSummary), [signalTriageSummary]);
  const selectedAdGroupDiagnosis = useMemo(
    () =>
      productScopeAdGroupDiagnosis.find((row) => row.id === selectedAdGroupDiagnosisId) ??
      productScopeAdGroupDiagnosis[0] ??
      null,
    [productScopeAdGroupDiagnosis, selectedAdGroupDiagnosisId],
  );
  const productScopeAdmissionCard = useMemo(() => buildProductScopeAdmissionCard(signalTriageSummary), [signalTriageSummary]);
  const noActionableManualGate = useMemo(() => buildNoActionableManualGate(signalTriageSummary), [signalTriageSummary]);
  const searchIntentReviewCards = useMemo(() => buildSearchIntentReviewCards(searchIntents), [searchIntents]);
  const searchIntentPanelContext: SearchIntentPanelContext = useMemo(
    () => buildSearchIntentPanelContext(searchIntentReviewCards),
    [searchIntentReviewCards],
  );
  const searchIntentReviewDecisionSummary = useMemo(
    () => buildSearchIntentReviewDecisionSummary(searchIntentReviewCards),
    [searchIntentReviewCards],
  );
  const activeSearchIntentReviewCard = useMemo(
    () => (activeSearchIntentLabel ? searchIntentReviewCards.find((card) => card.intentLabel === activeSearchIntentLabel) ?? null : null),
    [activeSearchIntentLabel, searchIntentReviewCards],
  );
  const triageReviewFeedbackText = useMemo(() => signalTriageReviewFeedbackText(signalTriageSummary), [signalTriageSummary]);
  const reviewReadinessGateSummary = useMemo(() => buildReviewReadinessGateSummary(signalTriageSummary), [signalTriageSummary]);
  const reviewEvidenceRepairSummary = useMemo(
    () => buildReviewEvidenceRepairSummary(reviewEvidenceRepair),
    [reviewEvidenceRepair],
  );
  const reviewEvidenceRepairAriaLabel =
    reviewEvidenceRepairSummary?.status === "blocked" ? "历史待办治理：仍被复盘证据门禁阻断" : "历史待办治理";
  const snapshotActionBoundary = useMemo(
    () => snapshotActionBoundaryText(signalTriageSummary?.review_status ?? null),
    [signalTriageSummary?.review_status],
  );
  const shouldPauseSnapshotPull = useMemo(
    () => shouldPauseSnapshotPullForReview(signalTriageSummary?.review_status ?? null),
    [signalTriageSummary?.review_status],
  );
  const selectedProductScopeOption = useMemo(
    () => productScopeOptions.find((option) => option.scope_id === activeProductScopeId) ?? null,
    [activeProductScopeId, productScopeOptions],
  );
  const searchIntentEntryLockSummary = useMemo(
    () => buildSearchIntentEntryLockSummary(selectedProductScopeOption, activeSearchIntentLabel, activeSearchIntentReviewCard),
    [activeSearchIntentLabel, activeSearchIntentReviewCard, selectedProductScopeOption],
  );
  const productScopeCandidateGapExplanation = useMemo(
    () => buildProductScopeCandidateGapExplanation(selectedProductScopeOption, signalTriageSummary),
    [selectedProductScopeOption, signalTriageSummary],
  );
  const productScopeEvidenceMatrix = useMemo(
    () => buildProductScopeEvidenceMatrix(selectedProductScopeOption, signalTriageSummary),
    [selectedProductScopeOption, signalTriageSummary],
  );
  const productScopeEvidenceRouteGuide = useMemo(
    () => (productScopeEvidenceMatrix ? buildProductScopeEvidenceRouteGuide(productScopeEvidenceMatrix) : null),
    [productScopeEvidenceMatrix],
  );
  const canRecommendManualActionInCurrentScope =
    isActionableProductScope(selectedProductScopeOption) && canRecommendManualActionFromTriageSummary(signalTriageSummary);
  const fallbackRecommendedManualActionCandidate = useMemo(
    () =>
      canRecommendManualActionInCurrentScope
        ? buildRecommendedManualActionCandidate(displayProductScopedSignals, productScopeOptions)
        : null,
    [canRecommendManualActionInCurrentScope, displayProductScopedSignals, productScopeOptions],
  );
  const recommendedManualActionCandidate = backendRecommendedManualActionCandidate ?? fallbackRecommendedManualActionCandidate;
  const productScopeGroupOverview = useMemo(
    () => buildProductScopeGroupOverview(selectedProductScopeOption, productScopeOptions, productScope?.coverage),
    [productScope?.coverage, productScopeOptions, selectedProductScopeOption],
  );
  const productScopeFirstScreenSummary = useMemo(
    () => buildProductScopeFirstScreenSummary(productScopeGroupOverview, signalTriageSummary),
    [productScopeGroupOverview, signalTriageSummary],
  );
  const productScopeDiagnosisBrief = useMemo(
    () => buildProductScopeDiagnosisBrief(productScopeFirstScreenSummary, productScopeEvidenceRouteGuide, productScopeAdGroupDiagnosis),
    [productScopeAdGroupDiagnosis, productScopeEvidenceRouteGuide, productScopeFirstScreenSummary],
  );
  const productScopeSelectionSummary = useMemo(
    () => buildProductScopeSelectionSummary(selectedProductScopeOption),
    [selectedProductScopeOption],
  );
  const productScopeAnalysisPath = useMemo(
    () => buildProductScopeAnalysisPath(selectedProductScopeOption),
    [selectedProductScopeOption],
  );
  const diagnosisContextSummary = useMemo(
    () => buildDiagnosisContextSummary(selectedProductScopeOption, signalTriageSummary),
    [selectedProductScopeOption, signalTriageSummary],
  );
  const diagnosisPathSummary = useMemo(
    () => buildDiagnosisPathSummary(selectedProductScopeOption, signalTriageSummary),
    [selectedProductScopeOption, signalTriageSummary],
  );
  const productScopeEntryGuidance = useMemo(
    () => buildProductScopeEntryGuidance(productScopeOptions, productScope?.coverage),
    [productScope?.coverage, productScopeOptions],
  );
  const productScopePriorityQueueItems = useMemo(
    () => buildProductScopePriorityQueueItems(productScopeOptions, normalizedSignals, reviewTodos, 10),
    [normalizedSignals, productScopeOptions, reviewTodos],
  );
  const productScopePriorityDecisionSummary = useMemo(
    () => buildProductScopePriorityDecisionSummary(productScopePriorityQueueItems),
    [productScopePriorityQueueItems],
  );
  const activeProductScopePriorityItem = useMemo(
    () => productScopePriorityQueueItems.find((item) => item.scopeId === activeProductScopeId) ?? null,
    [activeProductScopeId, productScopePriorityQueueItems],
  );

  const queueFilteredSignals = useMemo(() => {
    if (filter === "all") return displayProductScopedSignals;
    if (filter === "high") return displayProductScopedSignals.filter((signal) => signal.severity >= 4);
    if (filter === "observing") return displayProductScopedSignals.filter((signal) => signal.status === "observing");
    return displayProductScopedSignals.filter((signal) => signalQueueKind(signal) === filter);
  }, [displayProductScopedSignals, filter]);
  const filteredSignals = useMemo(
    () =>
      activeSearchIntentLabel
        ? filterSignalsBySearchIntent(displayProductScopedSignals, activeSearchIntentLabel)
        : queueFilteredSignals,
    [activeSearchIntentLabel, displayProductScopedSignals, queueFilteredSignals],
  );
  const productScopeQueueHeader = useMemo(
    () => buildProductScopeQueueHeader(selectedProductScopeOption, filteredSignals.length),
    [filteredSignals.length, selectedProductScopeOption],
  );
  const productScopeSignalExplanation = useMemo(
    () =>
      buildProductScopeSignalExplanation(selectedProductScopeOption, {
        scopeSignalCount: displayProductScopedSignals.length,
        allSignalCount: normalizedSignals.length,
        dataQualityCount: layerOverview.dataQuality,
        advertisedAsinCount: productScopeGroupOverview?.adAsinRows.length,
        signalTriageSummary,
      }),
    [
      layerOverview.dataQuality,
      normalizedSignals.length,
      productScopeGroupOverview?.adAsinRows.length,
      displayProductScopedSignals.length,
      selectedProductScopeOption,
      signalTriageSummary,
    ],
  );
  const reviewTodosForCurrentScope = useMemo(() => {
    const signalIds = new Set(displayProductScopedSignals.map((signal) => signal.id));
    return filterReviewTodosByProductScope(reviewTodos, activeProductScopeId, selectedProductScopeOption, signalIds);
  }, [activeProductScopeId, displayProductScopedSignals, reviewTodos, selectedProductScopeOption]);
  const reviewTodoQueueSummary = useMemo(
    () => buildReviewTodoQueueSummary(reviewTodosForCurrentScope),
    [reviewTodosForCurrentScope],
  );
  const reviewTodoQueueDetails = useMemo(
    () =>
      buildReviewTodoQueueDetails(reviewTodosForCurrentScope, {
        isGlobalScope: activeProductScopeId === "all",
      }),
    [activeProductScopeId, reviewTodosForCurrentScope],
  );
  const reviewTodoScopeHint = useMemo(
    () =>
      buildReviewTodoScopeHint({
        currentTotal: reviewTodoQueueSummary.total,
        globalTotal: reviewTodos.length,
        isGlobalScope: activeProductScopeId === "all",
      }),
    [activeProductScopeId, reviewTodoQueueSummary.total, reviewTodos.length],
  );

  const selectedSignal = filteredSignals.find((signal) => signal.id === selectedId) ?? filteredSignals[0] ?? null;
  const selectedSignalScopeContext = useMemo(
    () => buildSelectedSignalScopeContext(selectedProductScopeOption, selectedSignal),
    [selectedProductScopeOption, selectedSignal],
  );
  const selectedSearchIntentFocusContext = useMemo(
    () => buildSearchIntentFocusContext(activeSearchIntentLabel, selectedSignal, selectedProductScopeOption, activeSearchIntentReviewCard),
    [activeSearchIntentLabel, activeSearchIntentReviewCard, selectedProductScopeOption, selectedSignal],
  );
  const selectedSearchIntentTermReasonSummary = useMemo(
    () => buildSearchIntentSelectedTermReasonSummary(activeSearchIntentLabel, selectedSignal, activeSearchIntentReviewCard),
    [activeSearchIntentLabel, activeSearchIntentReviewCard, selectedSignal],
  );
  const selectedTriageBusinessEvidenceItems =
    selectedSignal?.id && selectedSignal.id === signalTriageSummary?.recommended_candidate?.signal_id
      ? recommendedTriageBusinessEvidenceItems
      : selectedSignal?.id && selectedSignal.id === signalTriageSummary?.next_unhandled_candidate?.signal_id
        ? nextUnhandledTriageBusinessEvidenceItems
        : [];
  const selectedDiagnosisContractItems =
    selectedSignal?.id && selectedSignal.id === signalTriageSummary?.recommended_candidate?.signal_id
      ? recommendedDiagnosisContractItems
      : selectedSignal?.id && selectedSignal.id === signalTriageSummary?.next_unhandled_candidate?.signal_id
        ? nextUnhandledDiagnosisContractItems
        : [];
  const selectedDiagnosisEvidenceSummary = useMemo(
    () => (selectedSignal ? buildSignalDiagnosisEvidenceSummary(selectedSignal, selectedDiagnosisContractItems) : null),
    [selectedDiagnosisContractItems, selectedSignal],
  );
  const selectedSearchTermOpportunityReviewChain = useMemo(
    () => buildSearchTermOpportunityReviewChain(selectedDiagnosisContractItems, selectedTriageBusinessEvidenceItems),
    [selectedDiagnosisContractItems, selectedTriageBusinessEvidenceItems],
  );
  const selectedManualConfirmationEvidenceItems = useMemo(
    () =>
      buildManualConfirmationEvidenceItems(
        selectedDiagnosisContractItems,
        selectedSearchTermOpportunityReviewChain,
        selectedSignal,
        activeSearchIntentReviewCard,
      ),
    [activeSearchIntentReviewCard, selectedDiagnosisContractItems, selectedSearchTermOpportunityReviewChain, selectedSignal],
  );
  const selectedBackendManualActionPreview = canRecommendManualActionInCurrentScope
    ? manualActionPreviewForSelectedSignal(selectedSignal?.id, signalTriageSummary, selectedSignal)
    : null;
  const selectedManualActionTargetSummary = useMemo(
    () => manualActionTargetSummary(selectedBackendManualActionPreview),
    [selectedBackendManualActionPreview],
  );
  const selectedManualActionTargetSwitch = useMemo(
    () => manualActionQueueTargetSwitchSummary(signalTriageSummary, selectedSignal?.id),
    [selectedSignal?.id, signalTriageSummary],
  );
  const selectedManualActionAdGroupBridge = useMemo(
    () => buildManualActionCandidateAdGroupBridge(selectedBackendManualActionPreview, productScopeAdGroupDiagnosis),
    [productScopeAdGroupDiagnosis, selectedBackendManualActionPreview],
  );
  const selectedMarketOption = marketOptions.find((option) => option.market_id === selectedMarketId) ?? null;
  const selectedSignalStateKey = selectedSignal ? signalScopedStateKey(selectedSignal.id, selectedSignal.market_id ?? selectedMarketId) : null;
  const selectedReviewApplicabilityBoundary = reviewApplicabilityBoundaryText(selectedSignal);
  const directSelectedReviewTodos = selectedSignalStateKey ? reviewTodosBySignal[selectedSignalStateKey] ?? [] : [];
  const selectedReviewTodos = selectReviewTodosForSignal(directSelectedReviewTodos, reviewTodosForCurrentScope, selectedSignal);
  const directSelectedManualActions = selectedSignalStateKey ? manualActionsBySignal[selectedSignalStateKey] ?? [] : [];
  const selectedManualActions = selectManualActionsForSignal(directSelectedManualActions, selectedReviewTodos);
  const latestManualAction = selectedManualActions.length > 0 ? selectedManualActions[selectedManualActions.length - 1] : null;
  const latestManualActionBoundary = manualActionBoundaryText(latestManualAction);
  const latestManualActionEvidenceText = manualActionEvidenceSnapshotText(latestManualAction);
  const latestManualActionReadback = reviewTargetReadbackText(latestManualAction);
  const nextReviewTodo = selectNextReviewTodo(selectedReviewTodos);

  function handleSelectQueueFilter(nextFilter: QueueFilter) {
    clearSearchIntentFocus();
    setFilter(nextFilter);
  }

  function handleSelectProductScopePriority(scopeId: string) {
    clearSearchIntentFocus();
    setFilter("all");
    setSelectedProductScopeId(scopeId);
  }

  function clearSearchIntentFocus() {
    setSelectedSearchIntentLabel(null);
    setSelectedSearchIntentScopeId(null);
  }

  function handleSelectSearchIntent(intentLabel: string, preferredSearchTerm?: string | null) {
    const nextFocus = resolveSearchIntentFocusSelection(
      displayProductScopedSignals,
      activeSearchIntentLabel,
      activeProductScopeId,
      intentLabel,
      preferredSearchTerm,
    );
    setSelectedSearchIntentLabel(nextFocus.intentLabel);
    setSelectedSearchIntentScopeId(nextFocus.scopeId);
    if (nextFocus.signalId) {
      setSelectedId(nextFocus.signalId);
    }
  }

  function handleOpenProductScopeEvidenceDrilldown() {
    clearSearchIntentFocus();
    setFilter("all");
    setIsEvidenceDrilldownFocused(true);
    window.requestAnimationFrame(() => {
      workbenchGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      workbenchGridRef.current?.focus();
    });
  }

  function handleLocateSignalInCurrentScope(
    signalId: string | null | undefined,
    setMessage: (message: string | null) => void,
    missingMessage: string,
  ) {
    if (!signalId) return;
    if (!displayProductScopedSignals.some((signal) => signal.id === signalId)) {
      setMessage(missingMessage);
      return;
    }
    setMessage(null);
    clearSearchIntentFocus();
    setFilter("all");
    setSelectedId(signalId);
    window.requestAnimationFrame(() => {
      workbenchGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      workbenchGridRef.current?.focus();
    });
  }

  function handleLocateReviewSignal(signalId?: string | null) {
    handleLocateSignalInCurrentScope(
      signalId,
      setReviewTodoMessage,
      "当前诊断入口下没有命中这条复盘待办对应信号；诊断入口已保持不变。需要跨范围查看时，请点击“切到全量排查”。",
    );
  }

  const nextReviewTodoReadback = reviewTargetReadbackText(nextReviewTodo);
  const hasReviewTodoForSelectedObject = selectedReviewTodos.length > 0;
  const selectedManualActionPreviewActionType =
    manualActionPreviewActionType ?? selectedBackendManualActionPreview?.actionType ?? "add_to_review";
  const selectedManualActionPreviewPreflight = manualActionPreflightForAction(
    selectedManualActionPreviewActionType,
    manualActionPreflightsByAction,
    manualActionPreflight,
  );
  const selectedManualActionPreviewPreflightError = manualActionPreflightErrorForAction(
    selectedManualActionPreviewActionType,
    manualActionPreflightErrorsByAction,
    manualActionPreflightError,
  );
  const selectedManualActionTargetAlignment = useMemo(
    () =>
      buildProductScopeManualActionTargetAlignment({
        priorityItem: activeProductScopePriorityItem,
        selectedSignal,
        manualActionPreview: selectedBackendManualActionPreview,
        preflight: selectedManualActionPreviewPreflight,
        preflightError: selectedManualActionPreviewPreflightError,
      }),
    [
      activeProductScopePriorityItem,
      selectedBackendManualActionPreview,
      selectedManualActionPreviewPreflight,
      selectedManualActionPreviewPreflightError,
      selectedSignal,
    ],
  );
  const selectedManualActionPathSteps = useMemo(
    () =>
      buildManualActionPathSteps({
        preflight: selectedManualActionPreviewPreflight,
        preflightError: selectedManualActionPreviewPreflightError,
        latestManualAction,
        hasReviewTodo: hasReviewTodoForSelectedObject,
      }),
    [
      hasReviewTodoForSelectedObject,
      latestManualAction,
      selectedManualActionPreviewPreflight,
      selectedManualActionPreviewPreflightError,
    ],
  );
  const selectedManualActionIdentityGateItems = useMemo(
    () =>
      buildManualActionIdentityGateItems({
        signal: selectedSignal,
        preflight: selectedManualActionPreviewPreflight,
        latestManualAction,
        nextReviewTodo,
        fallbackMarketId: selectedMarketId,
      }),
    [latestManualAction, nextReviewTodo, selectedManualActionPreviewPreflight, selectedMarketId, selectedSignal],
  );
  const nextReviewObjectLabel = nextReviewTodo?.object_label ?? nextReviewTodo?.object_id ?? "对象待补充";
  const selectedReviewEffect = selectedSignalStateKey ? reviewEffectsBySignal[selectedSignalStateKey] ?? null : null;
  const selectedReviewEffectReadback = reviewEffectTargetReadbackText(selectedReviewEffect);
  const selectedReviewEffectWindowText = reviewEffectWindowText(selectedReviewEffect);
  const nextReviewTodoEvidenceText = manualActionEvidenceSnapshotText(nextReviewTodo);
  const selectedReviewTodoEvidenceReadback = useMemo(
    () => buildReviewTodoEvidenceReadbackSummary(nextReviewTodo),
    [nextReviewTodo],
  );
  const selectedReviewTodoDecisionReadback = useMemo(
    () => buildReviewTodoDecisionReadbackSummary(nextReviewTodo),
    [nextReviewTodo],
  );
  const selectedReviewEvidenceSnapshot = useMemo(() => {
    const todoSnapshot = nextReviewTodo?.evidence_snapshot ?? [];
    if (todoSnapshot.length > 0) {
      return {
        title: "复盘点击时证据快照",
        source: `${nextReviewTodo?.review_window ?? "待确认"} / ${nextReviewTodo?.due_at ? new Date(nextReviewTodo.due_at).toLocaleDateString() : "到期待确认"}`,
        boundary: "来自 ReviewTodo 继承的人工点击时证据快照，只用于到期后人工复盘回看；不是当前实时广告事实，也不是效果结论。",
        items: todoSnapshot,
      };
    }
    const actionSnapshot = latestManualAction?.evidence_snapshot ?? [];
    if (actionSnapshot.length > 0) {
      return {
        title: "人工留痕证据快照",
        source: latestManualAction?.acted_at ? new Date(latestManualAction.acted_at).toLocaleString() : "人工动作时间待补充",
        boundary: "来自 ManualAction 的人工点击时证据快照；只有生成 ReviewTodo 并到期后，才能进入复盘效果判断。",
        items: actionSnapshot,
      };
    }
    return null;
  }, [latestManualAction, nextReviewTodo]);
  const selectedReviewMetricRows = reviewMetricComparisonRows(selectedReviewEffect);
  const selectedReviewRecordReadbackTarget = buildReviewRecordReadbackTarget(selectedSignal, nextReviewTodo);
  const selectedReviewRecordReadbackExpectation = buildReviewRecordReadbackExpectation(latestManualAction, nextReviewTodo);
  const selectedReviewRecordPreflightChecklist = buildReviewRecordPreflightChecklist(
    nextReviewTodo,
    selectedReviewEffect,
    selectedReviewRecordReadbackTarget,
  );
  const selectedReviewRecords = selectedSignalStateKey ? reviewRecordsBySignal[selectedSignalStateKey] ?? [] : [];
  const latestReviewRecord = selectedReviewRecords.length > 0 ? selectedReviewRecords[selectedReviewRecords.length - 1] : null;
  const selectedReviewRecordHasReadbackMatch = hasReviewRecordReadbackMatch(
    selectedReviewRecords,
    selectedReviewRecordReadbackExpectation,
  );
  const selectedReviewEffectWindowLedger = useMemo(
    () => buildReviewEffectWindowLedger(nextReviewTodo, selectedReviewEffect, selectedReviewRecordHasReadbackMatch),
    [nextReviewTodo, selectedReviewEffect, selectedReviewRecordHasReadbackMatch],
  );
  const selectedReviewRecordSaveGate = buildReviewRecordSaveGateSummary(
    nextReviewTodo,
    selectedReviewEffect,
    selectedReviewRecordPreflightChecklist,
    selectedReviewRecordHasReadbackMatch,
  );
  const selectedReviewRecordSavePath = useMemo(
    () =>
      buildReviewRecordSavePathSummary(
        selectedReviewTodoDecisionReadback,
        selectedReviewEffectWindowLedger,
        selectedReviewRecordSaveGate,
      ),
    [selectedReviewEffectWindowLedger, selectedReviewRecordSaveGate, selectedReviewTodoDecisionReadback],
  );
  const selectedManualActionReadbackConsistency = manualActionReadbackConsistencyText(
    latestManualAction,
    selectedReviewTodos,
    selectedReviewRecords,
    selectedReviewRecordReadbackExpectation,
  );
  const selectedManualActionReadbackCompact = manualActionReadbackCompactText(latestManualAction, selectedReviewTodos, selectedReviewRecords);
  const selectedManualActionReadbackPathItems = useMemo(
    () =>
      buildManualActionReadbackPathItems({
        latestManualAction,
        reviewTodos: selectedReviewTodos,
        reviewRecords: selectedReviewRecords,
      }),
    [latestManualAction, selectedReviewRecords, selectedReviewTodos],
  );
  const selectedManualReviewClosureLedger = useMemo(
    () =>
      buildManualReviewClosureLedger({
        manualActionCount: selectedManualActions.length,
        reviewTodoCount: selectedReviewTodos.length,
        reviewRecordCount: selectedReviewRecords.length,
        reviewEffectStatus: selectedReviewEffect?.status ?? null,
        nextReviewDueAt: nextReviewTodo?.due_at ?? null,
      }),
    [
      nextReviewTodo?.due_at,
      selectedManualActions.length,
      selectedReviewEffect?.status,
      selectedReviewRecords.length,
      selectedReviewTodos.length,
    ],
  );
  const selectedManualActionPreflightText =
    selectedManualActionPreviewPreflightError ??
    (selectedBackendManualActionPreview
      ? manualActionPreflightStatusText(selectedManualActionPreviewPreflight)
      : latestManualAction
        ? "当前 SearchTerm 已有人工留痕；后端预检不再生成重复写入对象，请查看人工留痕和 7/14 天复盘待办。"
        : "当前信号没有后端可写预检对象；不会自动写入人工动作。");
  const selectedManualActionPreflightEvidenceText = manualActionPreflightEvidenceSnapshotText(
    selectedManualActionPreviewPreflight,
  );
  const selectedManualActionPreflightEvidenceRows = useMemo(
    () => manualActionPreflightEvidenceRows(selectedManualActionPreviewPreflight),
    [selectedManualActionPreviewPreflight],
  );
  const selectedManualActionFullPreflightEvidenceRows = useMemo(
    () => manualActionPreflightEvidenceRows(selectedManualActionPreviewPreflight, 30),
    [selectedManualActionPreviewPreflight],
  );
  const selectedManualActionPreflightPriorityEvidenceRows = useMemo(
    () => manualActionPreflightPriorityEvidenceRows(selectedManualActionPreviewPreflight),
    [selectedManualActionPreviewPreflight],
  );
  const selectedManualConfirmationEvidenceReadiness = useMemo(
    () =>
      manualConfirmationEvidenceReadinessSummary(
        selectedManualConfirmationEvidenceItems,
        selectedManualActionFullPreflightEvidenceRows,
      ),
    [selectedManualActionFullPreflightEvidenceRows, selectedManualConfirmationEvidenceItems],
  );
  const selectedManualConfirmationDiagnosisBridge = useMemo(
    () =>
      manualConfirmationDiagnosisBridgeSummary(
        selectedDiagnosisEvidenceSummary,
        selectedManualConfirmationEvidenceItems,
        selectedManualConfirmationEvidenceReadiness,
      ),
    [
      selectedDiagnosisEvidenceSummary,
      selectedManualConfirmationEvidenceItems,
      selectedManualConfirmationEvidenceReadiness,
    ],
  );
  const selectedManualActionPostWriteContractItems = useMemo(
    () => manualActionPostWriteContractItems(selectedManualActionPreviewPreflight),
    [selectedManualActionPreviewPreflight],
  );
  const selectedManualActionAuthorizationReadiness = useMemo(
    () => manualActionAuthorizationReadinessSummary(selectedManualActionPreviewPreflight),
    [selectedManualActionPreviewPreflight],
  );
  const selectedManualActionRouteSplit = useMemo(
    () =>
      manualActionReviewRouteSplitSummary(
        signalTriageSummary,
        selectedSignal?.id,
        selectedManualActionAuthorizationReadiness,
      ),
    [selectedManualActionAuthorizationReadiness, selectedSignal?.id, signalTriageSummary],
  );
  const selectedManualActionPreflightTone =
    selectedManualActionPreviewPreflightError || selectedManualActionPreviewPreflight?.status === "blocked"
      ? "blocked"
      : selectedManualActionPreviewPreflight
        ? "ready"
        : "loading";
  const selectedRuleImprovementReadiness = useMemo(
    () =>
      buildRuleImprovementReadiness(
        selectedReviewEffect,
        latestReviewRecord,
        nextReviewTodo,
        signalTriageSummary?.review_status?.rule_improvement ?? null,
        signalTriageSummary?.review_status?.review_wait_summary ?? null,
      ),
    [
      latestReviewRecord,
      nextReviewTodo,
      selectedReviewEffect,
      signalTriageSummary?.review_status?.rule_improvement,
      signalTriageSummary?.review_status?.review_wait_summary,
    ],
  );
  const selectedRuleFeedbackCandidate = useMemo(
    () => buildRuleFeedbackCandidate(latestReviewRecord, selectedReviewEffect),
    [latestReviewRecord, selectedReviewEffect],
  );
  const ruleFeedbackPrioritySummary = useMemo(
    () => buildRuleFeedbackPrioritySummary(signalTriageSummary),
    [signalTriageSummary],
  );
  const selectedBaseManualActionEvidenceSnapshot = useMemo(
    () => buildManualActionEvidenceSnapshot(selectedTriageBusinessEvidenceItems),
    [selectedTriageBusinessEvidenceItems],
  );
  const selectedSearchIntentManualActionEvidenceSnapshot = useMemo(() => {
    if (!selectedSignal) return [];
    const scopedIntentLabel =
      activeSearchIntentLabel && filterSignalsBySearchIntent([selectedSignal], activeSearchIntentLabel).length > 0
        ? activeSearchIntentLabel
        : null;
    return buildSignalManualActionEvidenceSnapshot(selectedSignal, scopedIntentLabel);
  }, [activeSearchIntentLabel, selectedSignal]);
  const selectedSearchIntentManualActionReadback = useMemo(
    () =>
      buildSearchIntentManualActionReadbackSummary({
        evidenceSnapshot: selectedSearchIntentManualActionEvidenceSnapshot,
        operationDecisionLabel: activeSearchIntentReviewCard?.operationDecisionLabel,
        operationDecisionReason: activeSearchIntentReviewCard?.operationDecisionReason,
        primarySearchTerm: activeSearchIntentReviewCard?.primarySearchTerm,
        primarySearchTermReason: activeSearchIntentReviewCard?.primarySearchTermReason,
        nextManualStep: activeSearchIntentReviewCard?.nextManualStep,
      }),
    [activeSearchIntentReviewCard, selectedSearchIntentManualActionEvidenceSnapshot],
  );
  const selectedSearchIntentManualActionPreflightConsistency = useMemo(
    () =>
      buildSearchIntentManualActionPreflightConsistencySummary({
        readback: selectedSearchIntentManualActionReadback,
        preflight: selectedManualActionPreviewPreflight,
      }),
    [selectedManualActionPreviewPreflight, selectedSearchIntentManualActionReadback],
  );
  const selectedManualActionEvidenceSnapshot = useMemo(
    () => mergeManualActionEvidenceSnapshots(selectedSearchIntentManualActionEvidenceSnapshot, selectedBaseManualActionEvidenceSnapshot),
    [selectedBaseManualActionEvidenceSnapshot, selectedSearchIntentManualActionEvidenceSnapshot],
  );
  const selectedManualActionEvidenceReason = useMemo(
    () => manualActionSavableEvidenceReasonText(selectedManualActionPreviewPreflight),
    [selectedManualActionPreviewPreflight],
  );
  const selectedManualActionDecisionFactItems = useMemo(
    () =>
      selectedSignal
        ? buildManualActionDecisionFactItems(
            selectedSignal,
            selectedDiagnosisContractItems,
            selectedManualActionEvidenceReason,
          )
        : [],
    [selectedDiagnosisContractItems, selectedManualActionEvidenceReason, selectedSignal],
  );

  const overview = useMemo(() => buildSignalOverview(displayProductScopedSignals), [displayProductScopedSignals]);

  async function loadManualActions(signalId: string, marketId?: number | null) {
    try {
      const stateKey = signalScopedStateKey(signalId, marketId);
      const [records, reviewTodos] = await Promise.all([
        fetchSignalManualActions(signalId, marketId),
        fetchSignalReviewTodos(signalId, marketId),
      ]);
      setManualActionsBySignal((current) => ({ ...current, [stateKey]: records }));
      setReviewTodosBySignal((current) => ({ ...current, [stateKey]: reviewTodos }));
      setReviewTodoMessage(null);
      return { records, reviewTodos };
    } catch {
      setManualActionMessage("人工处理记录读取失败");
      setReviewTodoMessage("复盘待办读取失败");
      return null;
    }
  }

  useEffect(() => {
    if (!selectedSignal) return;
    void loadManualActions(selectedSignal.id, selectedSignal.market_id ?? selectedMarketId);
  }, [selectedSignal?.id, selectedSignal?.market_id, selectedMarketId]);

  useEffect(() => {
    if (!selectedSignal || !selectedBackendManualActionPreview) {
      setManualActionPreflight(null);
      setManualActionPreflightError(null);
      setManualActionPreflightsByAction({});
      setManualActionPreflightErrorsByAction({});
      setManualActionPreviewActionType(null);
      return;
    }
    let cancelled = false;
    const preflightErrorText = "后端预检读取失败；未读取前不会自动写入人工动作。";
    const recommendedActionType = selectedBackendManualActionPreview.actionType;
    setManualActionPreflight(null);
    setManualActionPreflightError(null);
    setManualActionPreflightsByAction({});
    setManualActionPreflightErrorsByAction({});
    setManualActionPreviewActionType(recommendedActionType);
    const fetchPreflightForAction = async (actionType: ManualActionType) => {
      try {
        const preflight = await fetchManualActionPreflight({
          marketId: selectedSignal.market_id ?? selectedMarketId,
          top: 5,
          productScopeId: activeProductScopeId,
          expectedObjectId: selectedBackendManualActionPreview.objectId,
          expectedObjectType: selectedBackendManualActionPreview.objectType,
          actionType,
          expectWritten: false,
        });
        return { actionType, preflight, error: null };
      } catch {
        return { actionType, preflight: null, error: preflightErrorText };
      }
    };
    void (async () => {
      const recommendedResult = await fetchPreflightForAction(recommendedActionType);
      if (cancelled) return;
      setManualActionPreflightsByAction({ [recommendedActionType]: recommendedResult.preflight });
      setManualActionPreflightErrorsByAction({ [recommendedActionType]: recommendedResult.error });
      setManualActionPreflight(recommendedResult.preflight);
      setManualActionPreflightError(recommendedResult.error);
      setManualActionPreviewActionType(recommendedActionType);

      const otherResults = await Promise.all(
        manualActionOrder.filter((actionType) => actionType !== recommendedActionType).map(async (actionType) => {
          return fetchPreflightForAction(actionType);
        }),
      );
      if (cancelled) return;
      const nextPreflightsByAction: Partial<Record<ManualActionType, ManualActionPreflight | null>> = {
        [recommendedActionType]: recommendedResult.preflight,
      };
      const nextPreflightErrorsByAction: Partial<Record<ManualActionType, string | null>> = {
        [recommendedActionType]: recommendedResult.error,
      };
      otherResults.forEach((result) => {
        nextPreflightsByAction[result.actionType] = result.preflight;
        nextPreflightErrorsByAction[result.actionType] = result.error;
      });
      setManualActionPreflightsByAction(nextPreflightsByAction);
      setManualActionPreflightErrorsByAction(nextPreflightErrorsByAction);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    activeProductScopeId,
    selectedBackendManualActionPreview?.actionType,
    selectedBackendManualActionPreview?.objectId,
    selectedBackendManualActionPreview?.objectType,
    selectedMarketId,
    selectedSignal?.id,
    selectedSignal?.market_id,
  ]);

  useEffect(() => {
    if (!selectedSignal || !selectedSignalStateKey) return;
    const target = buildReviewRecordReadbackTarget(selectedSignal, nextReviewTodo);
    if (!target) return;
    void fetchSignalReviewRecords(target.requestSignalId, selectedSignal.market_id ?? selectedMarketId, {
      objectType: target.objectType,
      objectId: target.objectId,
    })
      .then((reviewRecords) => {
        setReviewRecordsBySignal((current) => ({ ...current, [selectedSignalStateKey]: reviewRecords }));
      })
      .catch(() => {
        setReviewTodoMessage("复盘记录读取失败");
      });
  }, [
    nextReviewTodo?.signal_id,
    selectedMarketId,
    selectedSignal?.id,
    selectedSignal?.market_id,
    selectedSignalStateKey,
  ]);

  useEffect(() => {
    if (!selectedSignal || !selectedSignalStateKey) return;
    if (!nextReviewTodo) {
      setReviewEffectsBySignal((current) => ({ ...current, [selectedSignalStateKey]: null }));
      return;
    }
    const reviewEffectSignalId = nextReviewTodo.signal_id ?? selectedSignal.id;
    void fetchSignalReviewEffect(reviewEffectSignalId, nextReviewTodo.review_window, selectedSignal.market_id ?? selectedMarketId)
      .then((reviewEffect) => {
        setReviewEffectsBySignal((current) => ({ ...current, [selectedSignalStateKey]: reviewEffect }));
        setReviewTodoMessage(null);
      })
      .catch(() => {
        setReviewTodoMessage("复盘效果读取失败");
      });
  }, [
    nextReviewTodo?.due_at,
    nextReviewTodo?.review_window,
    nextReviewTodo?.signal_id,
    selectedMarketId,
    selectedSignal?.id,
    selectedSignal?.market_id,
    selectedSignalStateKey,
  ]);

  async function handleManualAction(actionType: ManualActionType) {
    if (!selectedSignal) return;
    const actionPreflight = manualActionPreflightForAction(actionType, manualActionPreflightsByAction, manualActionPreflight);
    const actionPreflightError = manualActionPreflightErrorForAction(
      actionType,
      manualActionPreflightErrorsByAction,
      manualActionPreflightError,
    );
    const actionGate = manualActionButtonGate(
      actionType,
      actionPreflight,
      actionPreflightError,
      hasReviewTodoForSelectedObject,
      manualActionExpectedTargetForSignal(selectedSignal, actionType),
    );
    const guardMessage = manualActionWriteGuardMessage(manualActionLabel[actionType], actionGate);
    if (guardMessage) {
      setManualActionMessage(guardMessage);
      return;
    }
    setSavingManualAction(true);
    setManualActionMessage(null);
    try {
      const record = await createSignalManualAction(
        selectedSignal.id,
        buildManualActionRequestPayload({
          actionType,
          actionLabel: manualActionLabel[actionType],
          operatorName: "本地运营",
          productScopeId: activeProductScopeId,
          evidenceSnapshot: selectedManualActionEvidenceSnapshot,
          preflight: actionPreflight,
        }),
        selectedSignal.market_id ?? selectedMarketId,
      );
      const actionMarketId = record.market_id ?? selectedSignal.market_id ?? selectedMarketId;
      const actionStateKey = signalScopedStateKey(selectedSignal.id, actionMarketId);
      setLocalStatus((current) => ({
        ...current,
        [signalStatusOverrideKey(selectedSignal.id, actionMarketId)]: record.manual_status,
      }));
      setManualActionsBySignal((current) => ({
        ...current,
        [actionStateKey]: [...(current[actionStateKey] ?? []), record],
      }));
      const readback = await loadManualActions(selectedSignal.id, actionMarketId);
      const [nextReviewTodos, nextSignalTriageSummary, nextReviewEvidenceRepair] = await Promise.all([
        fetchReviewTodos(actionMarketId),
        fetchSignalTriageSummary(actionMarketId, 5, activeProductScopeId),
        fetchReviewEvidenceRepair(actionMarketId, 5, activeProductScopeId),
      ]);
      let postWritePreflight: ManualActionPreflight | null = null;
      let postWritePreflightError: string | null = null;
      try {
        postWritePreflight = await fetchManualActionPreflight(
          buildManualActionPostWritePreflightRequest({
            action: record,
            fallbackMarketId: actionMarketId,
            productScopeId: activeProductScopeId,
          }),
        );
        setManualActionPreflight(postWritePreflight);
        setManualActionPreflightsByAction((current) => ({ ...current, [actionType]: postWritePreflight }));
        setManualActionPreviewActionType(actionType);
      } catch {
        postWritePreflightError = manualActionPostWritePreflightReadErrorText;
        setManualActionPreflightErrorsByAction((current) => ({ ...current, [actionType]: postWritePreflightError }));
        setManualActionPreviewActionType(actionType);
      }
      setReviewTodos(nextReviewTodos);
      setSignalTriageSummary(nextSignalTriageSummary);
      setReviewEvidenceRepair(nextReviewEvidenceRepair);
      setManualActionMessage(
        readback
          ? manualActionPostWriteReadbackMessage(record, readback.reviewTodos, [], postWritePreflight, postWritePreflightError)
          : `已记录：${manualActionLabel[actionType]}；复盘待办读取失败`,
      );
    } catch {
      setManualActionMessage("人工处理记录保存失败");
    } finally {
      setSavingManualAction(false);
    }
  }

  async function handleSaveReviewRecord() {
    if (!selectedSignal || !selectedReviewEffect || !canSaveReviewRecordWithPreflight(selectedReviewEffect, selectedReviewRecordPreflightChecklist)) return;
    const reviewRecordSignalId = reviewRecordSignalIdForTodo(selectedSignal, nextReviewTodo);
    if (!reviewRecordSignalId) return;
    setSavingReviewRecord(true);
    setReviewTodoMessage(null);
    try {
      const record = await createSignalReviewRecord(
        reviewRecordSignalId,
        selectedReviewEffect.review_window,
        buildReviewRecordRequestPayload(selectedReviewEffect, nextReviewTodo, selectedReviewEffect.message),
        selectedSignal.market_id ?? selectedMarketId,
      );
      const reviewStateKey = signalScopedStateKey(selectedSignal.id, record.market_id ?? selectedSignal.market_id ?? selectedMarketId);
      const reviewReadbackTarget = selectedReviewRecordReadbackTarget;
      let nextReviewRecords = [...(reviewRecordsBySignal[reviewStateKey] ?? []), record];
      let readbackMessage = reviewRecordReadbackStatus(nextReviewRecords, {
        actionId: record.action_id,
        objectType: record.object_type,
        objectId: record.object_id,
        reviewWindow: record.review_window,
      });
      if (reviewReadbackTarget) {
        try {
          nextReviewRecords = await fetchSignalReviewRecords(reviewReadbackTarget.requestSignalId, record.market_id ?? selectedSignal.market_id ?? selectedMarketId, {
            objectType: reviewReadbackTarget.objectType,
            objectId: reviewReadbackTarget.objectId,
          });
          readbackMessage = reviewRecordReadbackStatus(nextReviewRecords, {
            actionId: record.action_id,
            objectType: record.object_type,
            objectId: record.object_id,
            reviewWindow: record.review_window,
          });
        } catch {
          readbackMessage = "复盘记录读取失败；已保存但待读回核对。";
        }
      }
      setReviewRecordsBySignal((current) => ({
        ...current,
        [reviewStateKey]: nextReviewRecords,
      }));
      setReviewTodoMessage(`已保存复盘记录；${readbackMessage}`);
      await loadSignals();
    } catch {
      setReviewTodoMessage("复盘记录保存失败");
    } finally {
      setSavingReviewRecord(false);
    }
  }

  return (
    <main className="appShell">
      <header className="workbenchTop">
        <div>
          <p className="eyebrow">Amazon 广告 AI 信号工作台</p>
          <h1>
            信号分诊
            <span className="labBadge">AI 诊断实验室</span>
          </h1>
        </div>
        <div className="topActions">
          <button
            className="secondaryButton"
            onClick={handleProbeSnapshot}
            disabled={loading || probingSnapshot || creatingSnapshot || !snapshotReadiness}
            aria-label="探测积加 API"
          >
            <ShieldCheck size={16} />
            {probingSnapshot ? "探测中" : "探测 API"}
          </button>
          <button
            className="secondaryButton"
            onClick={handleCreateSnapshot}
            disabled={loading || creatingSnapshot || probingSnapshot || !snapshotReadiness || shouldPauseSnapshotPull}
            aria-label={shouldPauseSnapshotPull ? "复盘窗口未到期，暂不拉取真实 API 快照" : "拉取真实 API 快照"}
          >
            <Database size={16} />
            {creatingSnapshot ? "拉取中" : "拉取快照"}
          </button>
          <button className="iconButton refreshButton" onClick={loadSignals} disabled={loading} aria-label="刷新信号">
            <RefreshCw size={18} />
            <span>刷新</span>
          </button>
          <p className="snapshotActionBoundary" aria-label="快照复盘门禁">
            {snapshotActionBoundary}
          </p>
        </div>
      </header>

      <section className="filterBar" aria-label="筛选条件">
        <label>
          <span>店铺</span>
          <select value={selectedMarketId} onChange={(event) => setSelectedMarketId(Number(event.target.value))}>
            {marketOptions.map((option) => (
              <option key={option.market_id} value={option.market_id}>
                {option.shop_name}
              </option>
            ))}
            {marketOptions.length === 0 && <option value={selectedMarketId}>{snapshotStatus?.shop_name ?? "market-1"}</option>}
          </select>
        </label>
        <label>
          <span>站点</span>
          <select value={selectedMarketId} onChange={(event) => setSelectedMarketId(Number(event.target.value))}>
            {marketOptions.map((option) => (
              <option key={option.market_id} value={option.market_id}>
                {marketOptionLabel(option)}
              </option>
            ))}
            {marketOptions.length === 0 && (
              <option value={selectedMarketId}>
                {selectedMarketOption ? marketOptionLabel(selectedMarketOption) : `${snapshotStatus?.marketplace_code ?? "待探测"} / market_id ${selectedMarketId}`}
              </option>
            )}
          </select>
        </label>
        <label>
          <span>产品线</span>
          <select>
            <option>全部产品线</option>
          </select>
        </label>
        <label>
          <span>经营诊断入口</span>
          <select
            aria-label="经营诊断入口筛选器"
            value={activeProductScopeId}
            disabled={productScope === null || loading}
            onChange={(event) => setSelectedProductScopeId(event.target.value)}
          >
            {productScopeOptionGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.scope_id} value={option.scope_id}>
                    {productScopeOptionLabel(option)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          <span>周期</span>
          <select>
            <option>近 14 天</option>
            <option>近 7 天</option>
          </select>
        </label>
        <div className="freshnessBadge">
          <Database size={16} />
          <span>
            {snapshotFreshnessText(snapshotStatus, snapshotReadiness)}
            {` / ${snapshotInspectionText(snapshotInspection)}`}
            {snapshotMessage ? ` / ${snapshotMessage}` : ""}
          </span>
        </div>
      </section>

      {productScope && (
        <section className="productScopeBar" aria-label="诊断入口边界">
          <div className="productScopeMetric">
            <strong>经营入口</strong>
            <span>
              广告 ASIN {productScope.coverage.advertised_asin_count} / 销售 ASIN {productScope.coverage.sales_asin_count} / Parent ASIN{" "}
              {productScope.coverage.parent_asin_count}
            </span>
          </div>
          <div className="productScopeMetric">
            <strong>未归因</strong>
            <span>
              搜索词 {productScope.coverage.search_term_unattributed_count} / 广告位 {productScope.coverage.placement_unattributed_count}
            </span>
          </div>
          <div className="productScopeMetric">
            <strong>数据质量层</strong>
            <span>{layerOverview.dataQuality} 条 / 不参与商品归因</span>
          </div>
          <div className={`productScopeNotice ${productScopeSelectionSummary.tone}`}>
            <strong>{productScopeSelectionSummary.title}</strong>
            <span>{productScopeSelectionSummary.description}</span>
            <span className="productScopeTargetBoundary">{productScopeSelectionSummary.targetBoundary}</span>
          </div>
          {productScopeSelectionSummary.scopeSyncNotice && (
            <div className="productScopeSyncNotice" aria-label="广告 ASIN 范围同步提示">
              <div>
                <strong>{productScopeSelectionSummary.scopeSyncNotice.title}</strong>
                <span>{productScopeSelectionSummary.scopeSyncNotice.summary}</span>
              </div>
              <p>{productScopeSelectionSummary.scopeSyncNotice.directMetric}</p>
              <p>{productScopeSelectionSummary.scopeSyncNotice.contextBoundary}</p>
              <p>{productScopeSelectionSummary.scopeSyncNotice.manualBoundary}</p>
            </div>
          )}
          {diagnosisContextSummary && <DiagnosisContextStrip summary={diagnosisContextSummary} />}
          <p className="productScopeCompactHint">
            先看 Parent ASIN / ASIN 经营盘子，再下钻广告 ASIN、广告组、投放词、搜索词和广告位；数据质量独立进入队列筛选。
          </p>
          <div className="productScopePathPreview" aria-label="Parent ASIN 经营诊断路径">
            <div className="productScopePathPreviewHeader">
              <strong>经营诊断路径</strong>
              <span>信号队列服务于当前路径</span>
            </div>
            <div className="productScopePathPreviewSteps">
              {productScopeAnalysisPath.steps.map((step, index) => (
                <span className="productScopePathPreviewStep" key={`${step}-${index}`}>
                  {step}
                </span>
              ))}
            </div>
            <p>{productScopeAnalysisPath.boundary}</p>
          </div>
          {productScopeFirstScreenSummary && (
            <details className="productScopeBusinessPreview" aria-label="Parent ASIN 首屏经营摘要">
              <summary className="productScopeBusinessPreviewSummary">
                <div className="productScopeBusinessPreviewHeader">
                  <strong>{productScopeFirstScreenSummary.title}</strong>
                  <span>{productScopeFirstScreenSummary.summary}</span>
                </div>
                <div className="productScopeBusinessPreviewFacts">
                  {productScopeFirstScreenSummary.factItems.map((item) => (
                    <div className={`productScopeBusinessPreviewFact ${item.tone}`} key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </summary>
              <div className="productScopeBusinessPreviewBody">
              <div
                className={`productScopeMvpStatus ${productScopeFirstScreenSummary.mvpStatus.tone}`}
                aria-label="诊断 MVP 状态判定"
              >
                <div>
                  <span>{productScopeFirstScreenSummary.mvpStatus.title}</span>
                  <strong>{productScopeFirstScreenSummary.mvpStatus.statusLabel}</strong>
                </div>
                <p>{productScopeFirstScreenSummary.mvpStatus.summary}</p>
                <p>{productScopeFirstScreenSummary.mvpStatus.detail}</p>
                <small>{productScopeFirstScreenSummary.mvpStatus.boundary}</small>
              </div>
              <div className="productScopeLandingGates" aria-label="MVP 落地门禁">
                {productScopeFirstScreenSummary.landingGates.map((item) => (
                  <div className={`productScopeLandingGate ${item.tone}`} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
              <div className="productScopeAdCoverageDecision" aria-label="广告 ASIN 覆盖准入判断">
                <div>
                  <strong>广告 ASIN 覆盖准入</strong>
                  <span>{productScopeFirstScreenSummary.adCoverageDecision.statusLabel}</span>
                </div>
                <p>{productScopeFirstScreenSummary.adCoverageDecision.summary}</p>
                <ul>
                  <li>
                    <b>能证明</b>
                    <span>{productScopeFirstScreenSummary.adCoverageDecision.proves}</span>
                  </li>
                  <li>
                    <b>不能证明</b>
                    <span>{productScopeFirstScreenSummary.adCoverageDecision.doesNotProve}</span>
                  </li>
                  <li>
                    <b>人工下一步</b>
                    <span>{productScopeFirstScreenSummary.adCoverageDecision.nextManualStep}</span>
                  </li>
                </ul>
              </div>
              <div className="productScopeBusinessPreviewPath" aria-label="首屏诊断路径">
                <p className="productScopeBusinessPreviewPathSummary">{productScopeFirstScreenSummary.pathSummary}</p>
                {productScopeFirstScreenSummary.pathSteps.map((step, index) => (
                  <div className="productScopeBusinessPreviewPathStep" key={step.label}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{step.label}</strong>
                      <p>{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              {productScopeFirstScreenSummary.adAsinRows.length > 0 && (
                <div className="productScopeBusinessPreviewTable" aria-label="首屏广告 ASIN 对比">
                  <table>
                    <thead>
                      <tr>
                        <th>广告 ASIN（有投放证据）</th>
                        <th>花费</th>
                        <th>广告订单</th>
                        <th>广告销售额</th>
                        <th>ACOS</th>
                        <th>下钻判断</th>
                        <th>策略</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productScopeFirstScreenSummary.adAsinRows.map((row) => (
                        <tr key={row.scopeId}>
                          <td>
                            <button
                              className="asinScopeButton"
                              type="button"
                              onClick={() => setSelectedProductScopeId(row.scopeId)}
                              aria-label={`查看广告 ASIN ${row.asin} 的信号`}
                            >
                              {row.asin}
                            </button>
                          </td>
                          <td>{formatMoney(row.spend)}</td>
                          <td>{row.orders}</td>
                          <td>{formatMoney(row.sales)}</td>
                          <td>{formatPercent(row.acos)}</td>
                          <td className="adAsinDecisionCell">
                            <strong>{row.decision.statusLabel}</strong>
                            <span>{row.decision.reason}</span>
                            <small>{row.decision.nextFocus}</small>
                          </td>
                          <td>{row.strategyNote ?? "未标记"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="productScopeBusinessPreviewActions" aria-label="首屏证据下钻入口">
                <button className="secondaryButton productScopeBusinessPreviewAction" type="button" onClick={handleOpenProductScopeEvidenceDrilldown}>
                  查看广告组、搜索词和广告位证据
                </button>
                <span>只进入诊断工作台，不写入人工动作，不执行广告调整。</span>
              </div>
              <p>{productScopeFirstScreenSummary.boundary}</p>
              </div>
            </details>
          )}
          <details className="productScopeDetails">
            <summary>
              <span>经营盘子与广告证据下钻</span>
              <strong>{productScopeGroupOverview?.summary ?? "查看完整判断边界"}</strong>
            </summary>
            <div className="productScopeDetailsBody">
              <div className="productScopePath" aria-label="当前分析路径">
                <strong>当前分析路径</strong>
                <div className="productScopePathSteps">
                  {productScopeAnalysisPath.steps.map((step, index) => (
                    <span className="productScopePathStep" key={`${step}-${index}`}>
                      {step}
                    </span>
                  ))}
                </div>
                <p>{productScopeAnalysisPath.boundary}</p>
              </div>
              <div className="productScopeEntryGuidance" aria-label="诊断入口路径说明">
                <div className="productScopeEntryGuidanceHeader">
                  <strong>{productScopeEntryGuidance.title}</strong>
                  <span>{productScopeEntryGuidance.description}</span>
                </div>
                <div className="productScopeEntryGuidanceItems">
                  {productScopeEntryGuidance.items.map((item) => (
                    <div className={`productScopeEntryGuidanceItem ${item.tone}`} key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <p>
                Parent ASIN 有真实字段时优先作为经营入口；缺失时按 ASIN 观察。{productScope.coverage.boundary}
                数据质量信号独立进入队列筛选，不进入商品或未归因广告数据筛选。
              </p>
              {selectedProductScopeOption?.strategy_notes?.map((note) => (
                <p key={note}>{note}</p>
              ))}
              {productScopeGroupOverview && (
                <div className="productGroupOverview" aria-label="Parent ASIN 经营背景与广告证据概览">
                  <div className="productGroupOverviewHeader">
                    <strong>{productScopeGroupOverview.title}</strong>
                    <span>{productScopeGroupOverview.summary}</span>
                  </div>
                  <div className="productGroupRelationMap" aria-label="商品组关系摘要">
                    {productScopeGroupOverview.relationItems.map((item) => (
                      <div className={`productGroupRelationItem ${item.tone}`} key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="productScopeAdCoverageDecision" aria-label="商品组广告覆盖准入判断">
                    <div>
                      <strong>广告 ASIN 覆盖准入</strong>
                      <span>{productScopeGroupOverview.adCoverageDecision.statusLabel}</span>
                    </div>
                    <p>{productScopeGroupOverview.adCoverageDecision.summary}</p>
                    <ul>
                      <li>
                        <b>能证明</b>
                        <span>{productScopeGroupOverview.adCoverageDecision.proves}</span>
                      </li>
                      <li>
                        <b>不能证明</b>
                        <span>{productScopeGroupOverview.adCoverageDecision.doesNotProve}</span>
                      </li>
                      <li>
                        <b>人工下一步</b>
                        <span>{productScopeGroupOverview.adCoverageDecision.nextManualStep}</span>
                      </li>
                    </ul>
                  </div>
                  {productScopeGroupOverview.adAsinRows.length > 0 && (
                    <div className="productGroupAsinTableWrap" aria-label="广告 ASIN 投放证据对比">
                      <table className="productGroupAsinTable">
                        <thead>
                          <tr>
                            <th>广告 ASIN（有投放证据）</th>
                            <th>花费</th>
                            <th>广告订单</th>
                            <th>广告销售额</th>
                            <th>ACOS</th>
                            <th>下钻判断</th>
                            <th>策略</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productScopeGroupOverview.adAsinRows.map((row) => (
                            <tr key={row.asin}>
                              <td>
                                <button
                                  className="asinScopeButton"
                                  type="button"
                                  onClick={() => setSelectedProductScopeId(row.scopeId)}
                                  aria-label={`查看广告 ASIN ${row.asin} 的信号`}
                                >
                                  {row.asin}
                                </button>
                              </td>
                              <td>{formatMoney(row.spend)}</td>
                              <td>{row.orders}</td>
                              <td>{formatMoney(row.sales)}</td>
                              <td>{formatPercent(row.acos)}</td>
                              <td className="adAsinDecisionCell">
                                <strong>{row.decision.statusLabel}</strong>
                                <span>{row.decision.reason}</span>
                                <small>{row.decision.nextFocus}</small>
                              </td>
                              <td>{row.strategyNote ?? "未标记"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {productScopeGroupOverview.strategyNotes.map((note) => (
                    <p className="productGroupNote" key={note}>
                      {note}
                    </p>
                  ))}
                  {productScopeGroupOverview.boundaryNotes.map((note) => (
                    <p className="productGroupBoundary" key={note}>
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </details>
        </section>
      )}

      <section className="overviewGrid" aria-label="信号概览">
        <OverviewMetric label="高优先级" value={overview.high} tone="danger" />
        <OverviewMetric label="经营异常" value={overview.anomaly} tone="danger" />
        <OverviewMetric label="机会点" value={overview.opportunity} tone="success" />
        <OverviewMetric label="数据质量" value={overview.dataQuality} tone="neutral" />
        <OverviewMetric label="数据过期" value={overview.stale} tone="danger" />
        <OverviewMetric label="待确认" value={overview.pending} tone="neutral" />
      </section>

      <section
        className={isEvidenceDrilldownFocused ? "workbenchGrid focusedFromFirstScreen" : "workbenchGrid"}
        ref={workbenchGridRef}
        aria-label="广告诊断工作台"
        tabIndex={-1}
      >
        {isEvidenceDrilldownFocused && (
          <div className="evidenceDrilldownFocusNotice" aria-label="广告证据下钻状态" aria-live="polite">
            <strong>已进入广告诊断工作台</strong>
            <span>按广告组、搜索词和广告位证据继续排查，右侧仍只允许人工确认，不执行广告调整。</span>
          </div>
        )}
        <aside className="queuePanel">
          <div className="panelHeader">
            <div>
              <h2>{productScopeQueueHeader.title}</h2>
              <p>{loading ? "加载中" : productScopeQueueHeader.countText}</p>
            </div>
          </div>
          <p className="queueScopeHint">{productScopeQueueHeader.description}</p>
          {productScopePriorityDecisionSummary && (
            <ProductScopePriorityDecisionSummaryPanel
              summary={productScopePriorityDecisionSummary}
              onOpenTop={handleSelectProductScopePriority}
            />
          )}
          {productScopePriorityQueueItems.length > 0 && (
            <section className="productScopePriorityQueue" aria-label="今日 Parent ASIN 优先处理清单">
              <div className="productScopePriorityQueueHeader">
                <strong>今日 Parent ASIN 优先处理清单</strong>
                <span>先排序，再下钻；避免 10 个 Parent ASIN 像看 10 张报纸。</span>
              </div>
              <div className="productScopePriorityQueueRows">
                {productScopePriorityQueueItems.map((item, index) => (
                  <button
                    type="button"
                    className={`productScopePriorityQueueRow ${item.tone} ${activeProductScopeId === item.scopeId ? "active" : ""}`}
                    key={item.scopeId}
                    onClick={() => handleSelectProductScopePriority(item.scopeId)}
                    aria-label={`打开 ${item.label} 的 Parent ASIN 广告诊断`}
                  >
                    <span className="productScopePriorityRank">{index + 1}</span>
                    <span className="productScopePriorityBody">
                      <span className="productScopePriorityTopline">
                        <strong>{item.label}</strong>
                        <b>{item.priorityLabel}</b>
                      </span>
                      <span>{item.mainQuestion}</span>
                      <small>{item.evidenceSummary}</small>
                      <small>排序依据：{item.rankReason}</small>
                      <small>{item.decisionBadge}</small>
                      <small>{item.nextManualStep}</small>
                      <small>{item.boundary}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {diagnosisPathSummary && <QueueDiagnosisPathPanel summary={diagnosisPathSummary} />}
          <div className="queueDecisionStrip" aria-label="优先处理提示">
            {recommendedManualActionCandidate && (
              <div className="recommendedManualActionCandidate" aria-label={recommendedManualActionCopy.ariaLabel}>
                <div>
                  <strong>{recommendedManualActionCopy.title}</strong>
                  <span>{recommendedManualActionCandidate.objectLabel}</span>
                </div>
                {recommendedManualStatus && <span className="recommendedManualActionStatus">{recommendedManualStatus}</span>}
                <details className="recommendedManualActionDetails">
                  <summary>理由与预检</summary>
                  <p>{recommendedManualActionCandidate.reason}</p>
                  <div className="recommendedManualActionPreview" aria-label="推荐留痕只读预检">
                    <span>只读预检</span>
                    <span>{recommendedManualActionCandidate.manualActionPreview.actionType}</span>
                    <span>对象ID：{recommendedManualActionCandidate.manualActionPreview.objectId}</span>
                    <span>窗口：{recommendedManualActionCandidate.manualActionPreview.reviewWindows.join(" / ")}</span>
                  </div>
                  <span className="recommendedManualActionBoundary">只定位信号；记录观察或加入复盘仍需在右侧人工点击。</span>
                </details>
                <button
                  type="button"
                  onClick={() =>
                    handleLocateSignalInCurrentScope(
                      recommendedManualActionCandidate.signal.id,
                      setManualActionMessage,
                      "当前诊断入口下没有命中推荐候选信号；诊断入口已保持不变。需要跨范围查看时，请先使用显式全量排查入口。",
                    )
                  }
                  aria-label={recommendedManualActionCopy.buttonAriaLabel}
                >
                  {recommendedManualActionCopy.buttonText}
                </button>
              </div>
            )}
            {nextUnhandledManualActionCandidate && (
              <div className="recommendedManualActionCandidate" aria-label="下一个未留痕候选">
                <div>
                  <strong>下一个未留痕候选</strong>
                  <span>{nextUnhandledManualActionCandidate.objectLabel}</span>
                </div>
                <span className="recommendedManualActionStatus">只定位队列；留痕仍需右侧人工按钮。</span>
                <details className="recommendedManualActionDetails">
                  <summary>候选预检</summary>
                  <p>{nextUnhandledManualActionCandidate.reason}</p>
                  <p>{nextUnhandledEvidenceDrilldownText(signalTriageSummary)}</p>
                  <div className="recommendedManualActionPreview" aria-label="下一个候选只读预检">
                    <span>只读预检</span>
                    <span>{nextUnhandledManualActionCandidate.manualActionPreview.actionType}</span>
                    <span>对象ID：{nextUnhandledManualActionCandidate.manualActionPreview.objectId}</span>
                    <span>窗口：{nextUnhandledManualActionCandidate.manualActionPreview.reviewWindows.join(" / ")}</span>
                  </div>
                  <span className="recommendedManualActionBoundary">不会自动写入人工动作，也不会执行广告操作。</span>
                </details>
                <button
                  type="button"
                  onClick={() =>
                    handleLocateSignalInCurrentScope(
                      nextUnhandledManualActionCandidate.signal.id,
                      setManualActionMessage,
                      "当前诊断入口下没有命中下一个候选信号；诊断入口已保持不变。需要跨范围查看时，请先使用显式全量排查入口。",
                    )
                  }
                  aria-label={`定位下一个未留痕候选 ${nextUnhandledManualActionCandidate.objectLabel}`}
                >
                  定位候选
                </button>
              </div>
            )}
            <div className={`reviewTodoQueueSummary ${reviewTodoQueueSummary.due > 0 ? "due" : ""}`} aria-label="复盘待办摘要">
              <div>
                <strong>{reviewTodoQueueSummary.text}</strong>
                <span>{reviewTodoQueueSummary.description}</span>
              </div>
              {reviewTodoQueueSummary.nextLabel && (
                reviewTodoQueueSummary.next?.signal_id ? (
                  <button
                    className="reviewTodoQueueNext"
                    type="button"
                    onClick={() => handleLocateReviewSignal(reviewTodoQueueSummary.next?.signal_id)}
                    aria-label={`定位复盘待办 ${reviewTodoQueueSummary.nextLabel}`}
                    title="查看复盘对象对应信号和证据链"
                  >
                    下一项：{reviewTodoQueueSummary.nextLabel}
                    {reviewTodoQueueSummary.nextDueDate ? ` / 到期 ${reviewTodoQueueSummary.nextDueDate}` : ""}
                  </button>
                ) : (
                  <span className="reviewTodoQueueNext">
                    下一项：{reviewTodoQueueSummary.nextLabel}
                    {reviewTodoQueueSummary.nextDueDate ? ` / 到期 ${reviewTodoQueueSummary.nextDueDate}` : ""}
                  </span>
                )
              )}
              {reviewTodoScopeHint && (
                <button
                  className="reviewTodoQueueGlobalHint"
                  type="button"
                  onClick={() => setSelectedProductScopeId(reviewTodoScopeHint.actionScopeId)}
                  aria-label="切到全量排查查看范围外复盘待办"
                  title={reviewTodoScopeHint.actionLabel}
                >
                  {reviewTodoScopeHint.text}
                </button>
              )}
            </div>
          </div>

          <div className="queueTabs" aria-label="队列筛选">
            <button className={!activeSearchIntentLabel && filter === "all" ? "active" : ""} onClick={() => handleSelectQueueFilter("all")}>
              全部
            </button>
            <button className={!activeSearchIntentLabel && filter === "high" ? "active" : ""} onClick={() => handleSelectQueueFilter("high")}>
              高优先级
            </button>
            {queueBusinessFilters.map((item) => (
              <button
                key={item.value}
                className={!activeSearchIntentLabel && filter === item.value ? "active" : ""}
                onClick={() => handleSelectQueueFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
            <button
              className={!activeSearchIntentLabel && filter === "observing" ? "active" : ""}
              onClick={() => handleSelectQueueFilter("observing")}
            >
              观察中
            </button>
          </div>

          <section className="searchIntentReviewPanel" aria-label="Parent ASIN 广告搜索词表现复核">
            <div className="searchIntentReviewHeader">
              <strong>Parent ASIN 广告搜索词表现复核</strong>
              <span>从当前 Parent ASIN 视角，聚合广告中实际产生表现的用户搜索词，帮助分析 SearchTerm 表现</span>
            </div>
            <div className="searchIntentReviewScope" aria-label="广告搜索词表现复核数据口径">
              <span>
                <b>作用</b>
                <small>{searchIntentPanelContext.purpose}</small>
              </span>
              <span>
                <b>数据口径</b>
                <small>{searchIntentPanelContext.dataGrain}</small>
              </span>
              <span>
                <b>点击后</b>
                <small>{searchIntentPanelContext.interactionBoundary}</small>
              </span>
              <span>
                <b>能证明</b>
                <small>{searchIntentPanelContext.proves}</small>
              </span>
              <span>
                <b>不能证明</b>
                <small>{searchIntentPanelContext.doesNotProve}</small>
              </span>
              <span>
                <b>人工下一步</b>
                <small>{searchIntentPanelContext.nextManualStep}</small>
              </span>
              <span>
                <b>与具体信号关系</b>
                <small>{searchIntentPanelContext.signalMetricBoundary}</small>
              </span>
            </div>
            <small className="searchIntentReviewBoundary">{searchIntentPanelContext.boundary}</small>
            {searchIntentReviewDecisionSummary && <SearchIntentReviewDecisionSummaryPanel summary={searchIntentReviewDecisionSummary} />}
            {activeSearchIntentLabel && (
              <div className="searchIntentActiveFilter" aria-label="当前广告搜索词表现复核筛选">
                <span>
                  当前 Parent ASIN 广告搜索词表现复核：{activeSearchIntentLabel}
                  <small>诊断入口保持不变，这里只是从 Parent ASIN 视角聚合广告用户搜索词表现，并筛出同类 SearchTerm 信号；不做商品归因；ABA 只作站点级背景。</small>
                  <small>绑定诊断入口：{selectedProductScopeOption?.label ?? activeProductScopeId}</small>
                </span>
                <button type="button" onClick={clearSearchIntentFocus}>
                  清除
                </button>
              </div>
            )}
            {searchIntentEntryLockSummary && (
              <div className="searchIntentEntryLock" aria-label="广告搜索词表现复核入口锁定">
                <strong>{searchIntentEntryLockSummary.title}</strong>
                <dl>
                  {searchIntentEntryLockSummary.rows.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>
                        <b>{row.value}</b>
                        <small>{row.detail}</small>
                      </dd>
                    </div>
                  ))}
                </dl>
                <small>{searchIntentEntryLockSummary.boundary}</small>
              </div>
            )}
            {searchIntentReviewCards.length > 0 ? (
              <div className="searchIntentReviewList">
                {searchIntentReviewCards.map((card) => (
                  <button
                    type="button"
                    className={`searchIntentReviewCard ${activeSearchIntentLabel === card.intentLabel ? "active" : ""}`}
                    key={card.title}
                    onClick={() => handleSelectSearchIntent(card.intentLabel, card.primarySearchTerm)}
                    aria-pressed={activeSearchIntentLabel === card.intentLabel}
                    aria-label={`打开 ${card.title} 聚合下的优先 SearchTerm 诊断`}
                  >
                    <div>
                      <strong>{card.title}</strong>
                      <span>广告搜索词表现聚合 / {card.sourceLabel}</span>
                    </div>
                    <div className={`searchIntentDecision ${card.operationDecisionTone}`} aria-label="广告搜索词表现运营判断">
                      <b>{card.operationDecisionLabel}</b>
                      <small>{card.operationDecisionReason}</small>
                    </div>
                    <p>{card.summary}</p>
                    <small>业务问题：{card.businessQuestion}</small>
                    <small>{card.currentJudgement}</small>
                    <small>{card.metricPurpose}</small>
                    <ul className="searchIntentMetricPurposeList" aria-label="广告搜索词表现指标目的">
                      {card.metricPurposeItems.map((item) => (
                        <li className={item.tone} key={item.label}>
                          <b>{item.label}</b>
                          <span>{item.value}</span>
                        </li>
                      ))}
                    </ul>
                    <small>{card.adContext}</small>
                    <small>{card.evidenceGap}</small>
                    <small>{card.signalMetricBoundary}</small>
                    <small>{card.purpose}</small>
                    <small>数据口径：{card.dataGrain}</small>
                    <small>能证明：{card.proves}</small>
                    <small>不能证明：{card.doesNotProve}</small>
                    <small>人工下一步：{card.nextManualStep}</small>
                    <small>{card.insight}</small>
                    <small>优先打开：{card.primarySearchTerm ?? "待补齐"}；{card.primarySearchTermReason}</small>
                    <small>{card.boundary}</small>
                    {card.topTerms.length > 0 && (
                      <ul>
                        {card.topTerms.map((term) => (
                          <li key={term}>{term}</li>
                        ))}
                      </ul>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="searchIntentReviewEmpty" aria-label="广告搜索词表现复核空态">
                <strong>暂无搜索词表现聚合</strong>
                <small>{searchIntentPanelContext.emptyText}</small>
              </div>
            )}
          </section>

          {loading && <EmptyState icon="loading" title="正在读取信号" />}
          {error && <EmptyState icon="warning" title={error} />}
          {!loading && !error && filteredSignals.length === 0 && (
            <EmptyState
              icon="empty"
              title={activeSearchIntentLabel ? "当前 Parent ASIN 广告搜索词表现复核暂无对应 AI 信号" : productScopeSignalExplanation?.title ?? "暂无真实快照信号"}
              description={
                activeSearchIntentLabel
                  ? "广告搜索词表现复核不切换经营商品或广告组，只在当前诊断入口内显示同组 SearchTerm 信号；如果需要看全部信号，请清除筛选。"
                  : productScopeSignalExplanation?.description
                    ? productScopeSignalExplanation.description
                  : "旧样例已移除，后续信号只从真实快照或明确标记的测试 fixture 生成。"
              }
            />
          )}
          {!loading && !error && filteredSignals.length === 0 && !activeSearchIntentLabel && productScopeSignalExplanation && (
            <div className={`sparseSignalExplanation ${productScopeSignalExplanation.tone}`} aria-label="空队列口径解释">
              {productScopeSignalExplanation.reasons.map((reason) => (
                <p key={reason}>{reason}</p>
              ))}
            </div>
          )}

          <div className="signalRows">
            {filteredSignals.map((signal, index) => {
              const queueScope = buildSignalQueueScopeBadge(signal);
              const queueMeta = buildSignalQueueMeta(signal);
              const objectStatus = buildSignalQueueObjectStatus(signal, filteredSignals, reviewTodosForCurrentScope);
              const sourceTags = Array.from(
                new Set(signal.data_sources.map((source) => source.source_type).filter((sourceType): sourceType is string => Boolean(sourceType))),
              ).slice(0, 5);
              return (
                <button
                  key={signal.id}
                  className={`signalRow ${selectedSignal?.id === signal.id ? "selected" : ""}`}
                  onClick={() => setSelectedId(signal.id)}
                >
                  <span className="signalRowIndex" aria-label={`队列序号 ${index + 1}`}>
                    {index + 1}
                  </span>
                  <span className="signalRowBody">
                    <span className="signalRowHeader">
                      <span>
                        <SignalPill signal={signal} />
                        <span className={`queueScopeBadge ${queueScope.tone}`}>{queueScope.label}</span>
                      </span>
                      <span className={`signalRowPriority ${signal.confidence}`}>
                        {signal.priority} / {confidenceLabel[signal.confidence]}
                      </span>
                    </span>
                    <strong>{signal.summary}</strong>
                    <span className="signalRowDecisionLine" aria-label="信号处理状态">
                      <span>{objectTypeLabel[signal.object_type] ?? signal.object_type}</span>
                      <span>{statusLabel[signal.manual_status]}</span>
                      <span>{signal.evidence_count} 条证据</span>
                    </span>
                    <span className="signalRowMetaLine" aria-label="信号决策信息">
                      {queueMeta.primary.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </span>
                    <span className="signalRowContext">{queueMeta.secondary}</span>
                    <span className="signalRowDecisionContext" aria-label="业务问题和对象边界">
                      {queueMeta.decision}
                    </span>
                    {sourceTags.length > 0 && (
                      <span className="signalSourceTrail" aria-label="证据来源">
                        {sourceTags.map((sourceType) => (
                          <span key={sourceType}>{sourceType}</span>
                        ))}
                      </span>
                    )}
                    {objectStatus.items.length > 0 && <span className="signalRowObjectStatus">{objectStatus.items.join(" / ")}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <details className="queueDiagnosticsDetails">
            <summary>诊断依据</summary>
            <div className="queueDiagnosticsBody">
              {signalTriageSummary && (
                <div className="signalScanSummary" aria-label="后端信号分诊摘要">
                  <strong>后端分诊摘要</strong>
                  <div className="triageCompactGrid">
                    {triageCompactItems.map((item) => (
                      <span className={`triageCompactItem ${item.tone}`} key={item.label}>
                        <small>{item.label}</small>
                        <b>{item.value}</b>
                      </span>
                    ))}
                  </div>
                  <span>{signalTriageSummaryText(signalTriageSummary)}</span>
                  {triageReviewFeedbackText && <span>{triageReviewFeedbackText}</span>}
                  <span>
                    对象分布：
                    {Object.entries(signalTriageSummary.candidate_mix.by_object_type ?? {})
                      .slice(0, 4)
                      .map(([label, count]) => `${label} ${count}`)
                      .join(" / ") || "暂无候选"}
                  </span>
                  <span>
                    优先级：
                    {Object.entries(signalTriageSummary.candidate_mix.by_priority ?? {})
                      .map(([label, count]) => `${label} ${count}`)
                      .join(" / ") || "暂无优先级"}
                  </span>
                  <span>{signalTriageLayerText(signalTriageSummary)}</span>
                  <span>{signalTriageDepthText(signalTriageSummary)}</span>
                  <span>{recommendedEvidenceDrilldownText(signalTriageSummary)}</span>
                  {signalTriageBlockerTexts(signalTriageSummary).map((blockerText) => (
                    <p key={blockerText}>{blockerText}</p>
                  ))}
                  <p>{signalTriageSummary.next_action}</p>
                </div>
              )}
              <div className="signalScanSummary" aria-label="信号扫描摘要">
                <strong>{signalScanSummaryText(signalScanSummary)}</strong>
                {signalScanSummary && (
                  <>
                    <span>
                      扫描表：
                      {signalScanSummary.scanned_tables
                        .slice(0, 3)
                        .map((item) => `${item.role} ${item.row_count} 行`)
                        .join(" / ")}
                    </span>
                    <span>
                      命中：
                      {signalScanSummary.hit_signal_categories.length > 0
                        ? signalScanSummary.hit_signal_categories.map((item) => `${item.label} ${item.count} 条`).join(" / ")
                        : "暂无业务信号"}
                    </span>
                    {[...signalScanSummary.suppressed_reasons, ...signalScanSummary.attribution_boundaries].slice(0, 2).map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                    <p>{signalScanSummary.next_focus}</p>
                  </>
                )}
              </div>
              {productScopeSignalExplanation && (
                <div className={`sparseSignalExplanation ${productScopeSignalExplanation.tone}`} aria-label="当前范围信号解释">
                  <strong>{productScopeSignalExplanation.title}</strong>
                  <span>{productScopeSignalExplanation.description}</span>
                  {productScopeSignalExplanation.reasons.map((reason) => (
                    <p key={reason}>{reason}</p>
                  ))}
                </div>
              )}
              {reviewTodoQueueDetails && (
                <div className="reviewTodoQueueDetails" aria-label="全局复盘待办明细">
                  <strong>{reviewTodoQueueDetails.title}</strong>
                  <span>{reviewTodoQueueDetails.description}</span>
                  {reviewTodoQueueDetails.rows.map((row) => (
                    <button
                      className={`reviewTodoQueueDetailRow ${row.isDue ? "due" : ""}`}
                      type="button"
                      key={row.key}
                      disabled={!row.signalId}
                      onClick={() => handleLocateReviewSignal(row.signalId)}
                      aria-label={`查看复盘待办 ${row.label}`}
                    >
                      <span>{row.statusText}</span>
                      <strong>{row.label}</strong>
                      {row.contextText && <span>{row.contextText}</span>}
                      <span>复盘日期：{row.dueDate}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </details>
        </aside>

        <section className="diagnosisPanel">
          {activeProductScopePriorityItem && (
            <ProductScopePriorityEntryBridgePanel item={activeProductScopePriorityItem} adGroup={selectedAdGroupDiagnosis} />
          )}
          {productScopeDiagnosisBrief && <ProductScopeDiagnosisBriefPanel brief={productScopeDiagnosisBrief} />}
          {productScopeAdGroupDiagnosis.length > 0 && (
            <ProductScopeAdGroupDiagnosisPanel
              rows={productScopeAdGroupDiagnosis}
              selectedId={selectedAdGroupDiagnosis?.id ?? null}
              onSelect={setSelectedAdGroupDiagnosisId}
            />
          )}
          {selectedAdGroupDiagnosis && <ProductScopeAdGroupFocusPanel row={selectedAdGroupDiagnosis} />}
          {productScopeEvidenceRouteGuide && <ProductScopeEvidenceRouteGuidePanel guide={productScopeEvidenceRouteGuide} />}
          {productScopeCandidateGapExplanation && (
            <ProductScopeCandidateGapExplanationPanel explanation={productScopeCandidateGapExplanation} />
          )}
          {selectedSignal ? (
            <>
              {selectedSignalScopeContext && <SelectedSignalScopeContextStrip context={selectedSignalScopeContext} />}
              {selectedSearchIntentFocusContext && <SearchIntentFocusContextStrip context={selectedSearchIntentFocusContext} />}
              {selectedSearchIntentTermReasonSummary && (
                <SearchIntentSelectedTermReasonPanel summary={selectedSearchIntentTermReasonSummary} />
              )}
              <SignalDiagnosis
                signal={selectedSignal}
                triageBusinessEvidenceItems={selectedTriageBusinessEvidenceItems}
                diagnosisContractItems={selectedDiagnosisContractItems}
                reviewEvidenceSnapshot={selectedReviewEvidenceSnapshot?.items ?? []}
                reviewEvidenceSnapshotTitle={selectedReviewEvidenceSnapshot?.title ?? null}
                reviewEvidenceSnapshotSource={selectedReviewEvidenceSnapshot?.source ?? null}
                reviewEvidenceSnapshotBoundary={selectedReviewEvidenceSnapshot?.boundary ?? null}
              />
            </>
          ) : productScopeAdmissionCard ? (
            <ProductScopeDrilldownEvidencePanel
              admissionCard={productScopeAdmissionCard}
              matrix={productScopeEvidenceMatrix}
              items={productScopeDrilldownEvidence}
            />
          ) : (
            <EmptyState icon="empty" title="未选择信号" />
          )}
        </section>

        <aside className="actionPanel">
          <div className="panelHeader">
            <div>
              <h2>建议处理</h2>
              <p>{selectedSignal ? statusLabel[selectedSignal.status] : noActionableManualGate?.statusLabel ?? "无信号"}</p>
            </div>
          </div>

          {selectedAdGroupDiagnosis && (
            <ProductScopeAdGroupActionBridgeCard row={selectedAdGroupDiagnosis} priorityItem={activeProductScopePriorityItem} />
          )}

          {selectedSignal ? (
            <>
              <section className="actionDecisionCard" aria-label="建议处理摘要">
                <div className="actionDecisionHeader">
                  <h3>建议动作</h3>
                  <div className={`actionConfidenceMeter ${selectedSignal.confidence}`} aria-label={`置信度 ${confidenceLabel[selectedSignal.confidence]}`}>
                    <span>置信度 {confidenceLabel[selectedSignal.confidence]}</span>
                    <i aria-hidden="true" />
                  </div>
                </div>
                <div className="actionDecisionBody">
                  <strong>{selectedSignal.suggested_action.title}</strong>
                  <p>{selectedSignal.suggested_action.description}</p>
                </div>
                <div className="actionBoundaryBar" aria-label="建议处理边界">
                  <span>
                    <ShieldCheck size={14} aria-hidden="true" />
                    人工确认后记录
                  </span>
                  <span>不自动调价 / 不自动暂停 / 不自动否词</span>
                </div>
                {selectedManualActionAdGroupBridge && (
                  <div className="manualActionAdGroupBridge" aria-label="人工候选与广告组关系">
                    <strong>{selectedManualActionAdGroupBridge.title}</strong>
                    <span>{selectedManualActionAdGroupBridge.evidence}</span>
                    <p>{selectedManualActionAdGroupBridge.decision}</p>
                    <ul className="manualActionBridgeBoundaryList" aria-label="人工点击前广告组合流复核">
                      <li>
                        <b>{selectedManualActionAdGroupBridge.synthesisStatus}</b>
                        <span>{selectedManualActionAdGroupBridge.synthesisJudgement}</span>
                      </li>
                      <li>
                        <b>合流证据链</b>
                        <span>{selectedManualActionAdGroupBridge.synthesisEvidenceChain}</span>
                      </li>
                      <li>
                        <b>合流证明边界</b>
                        <span>{selectedManualActionAdGroupBridge.synthesisBoundary}</span>
                      </li>
                      <li>
                        <b>合流证据缺口</b>
                        <span>{selectedManualActionAdGroupBridge.synthesisGap}</span>
                      </li>
                      <li>
                        <b>搜索词边界</b>
                        <span>{selectedManualActionAdGroupBridge.searchTermBoundary}</span>
                      </li>
                      <li>
                        <b>广告位边界</b>
                        <span>{selectedManualActionAdGroupBridge.placementBoundary}</span>
                      </li>
                      <li>
                        <b>人工下一步</b>
                        <span>{selectedManualActionAdGroupBridge.manualNextStep}</span>
                      </li>
                    </ul>
                    <small>{selectedManualActionAdGroupBridge.boundary}</small>
                  </div>
                )}
                {selectedManualConfirmationEvidenceItems.length > 0 && (
                  <div className="manualConfirmationEvidence" aria-label="人工确认证据依据">
                    <strong>人工确认证据依据</strong>
                    <ul>
                      {selectedManualConfirmationEvidenceItems.map((item) => (
                        <li key={item.label}>
                          <span>{item.label}</span>
                          <b>{item.value}</b>
                          {item.detail && <p>{item.detail}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedManualConfirmationEvidenceReadiness && (
                  <div
                    className={`manualConfirmationEvidenceReadiness ${selectedManualConfirmationEvidenceReadiness.tone}`}
                    aria-label="人工确认证据写入核对"
                  >
                    <strong>{selectedManualConfirmationEvidenceReadiness.title}</strong>
                    <p>{selectedManualConfirmationEvidenceReadiness.summary}</p>
                    <ul>
                      {selectedManualConfirmationEvidenceReadiness.rows.map((row) => (
                        <li key={row.label} className={row.tone}>
                          <span>{row.label}</span>
                          <b>{row.value}</b>
                          <p>{row.detail}</p>
                        </li>
                      ))}
                    </ul>
                    <small>{selectedManualConfirmationEvidenceReadiness.boundary}</small>
                  </div>
                )}
                {selectedManualConfirmationDiagnosisBridge && (
                  <div
                    className={`manualConfirmationDiagnosisBridge ${selectedManualConfirmationDiagnosisBridge.tone}`}
                    aria-label="诊断到人工留痕证据同步"
                  >
                    <strong>{selectedManualConfirmationDiagnosisBridge.title}</strong>
                    <p>{selectedManualConfirmationDiagnosisBridge.summary}</p>
                    <ul>
                      {selectedManualConfirmationDiagnosisBridge.rows.map((row) => (
                        <li key={row.label} className={row.tone}>
                          <span>{row.label}</span>
                          <b>{row.value}</b>
                          <p>{row.detail}</p>
                        </li>
                      ))}
                    </ul>
                    <small>{selectedManualConfirmationDiagnosisBridge.boundary}</small>
                  </div>
                )}
                <div className="actionFactList">
                  {selectedManualActionDecisionFactItems.map((item) => (
                    <span key={item.label}>
                      <b>{item.label}</b>
                      {item.value}
                    </span>
                  ))}
                  {selectedBackendManualActionPreview ? (
                    <span>
                      <b>预检</b>
                      {manualActionDisplayLabel(selectedBackendManualActionPreview.actionType)} / 复盘对象：
                      {objectTypeLabel[selectedBackendManualActionPreview.objectType] ?? selectedBackendManualActionPreview.objectType} / 对象ID：
                      {selectedBackendManualActionPreview.objectId} / 窗口：
                      {selectedBackendManualActionPreview.reviewWindows.join(" / ")} / 不执行广告动作
                    </span>
                  ) : (
                    <span>
                      <b>预检</b>
                      当前信号暂无后端推荐预检；真实留痕仍由人工按钮触发。
                    </span>
                  )}
                </div>
              </section>

              <section className="manualActions" aria-label="人工处理">
                <div className="manualActionsHeader">
                  <div>
                    <h3>人工确认</h3>
                    <span>只记录运营判断，不自动执行广告动作</span>
                  </div>
                  <span className="manualActionsCount">4 项</span>
                </div>
                <div className="manualActionGuardRail" aria-label="人工确认边界">
                  <span>
                    <ShieldCheck size={14} aria-hidden="true" />
                    需要人工点击才会留痕
                  </span>
                  <span>{selectedManualActionTargetSummary}</span>
                </div>
                {selectedManualActionTargetSwitch && (
                  <div
                    className={`manualActionTargetSwitch ${selectedManualActionTargetSwitch.tone}`}
                    aria-label="人工动作目标切换提示"
                  >
                    <strong>{selectedManualActionTargetSwitch.title}</strong>
                    <p>{selectedManualActionTargetSwitch.primary}</p>
                    <ul>
                      <li>
                        <span>诊断对象</span>
                        <b>{selectedManualActionTargetSwitch.diagnosisObject}</b>
                      </li>
                      <li>
                        <span>可写候选</span>
                        <b>{selectedManualActionTargetSwitch.writeTarget}</b>
                      </li>
                    </ul>
                    <small>{selectedManualActionTargetSwitch.boundary}</small>
                  </div>
                )}
                {selectedManualActionRouteSplit && (
                  <div
                    className={`manualActionRouteSplit ${selectedManualActionRouteSplit.tone}`}
                    aria-label="人工确认双轨分流"
                  >
                    <strong>{selectedManualActionRouteSplit.title}</strong>
                    <p>{selectedManualActionRouteSplit.primary}</p>
                    <ul>
                      {selectedManualActionRouteSplit.rows.map((row) => (
                        <li key={row.label} className={row.tone}>
                          <span>{row.label}</span>
                          <b>{row.value}</b>
                          <p>{row.detail}</p>
                        </li>
                      ))}
                    </ul>
                    <small>{selectedManualActionRouteSplit.boundary}</small>
                  </div>
                )}
                {selectedSearchIntentManualActionReadback && (
                  <SearchIntentManualActionReadbackCard summary={selectedSearchIntentManualActionReadback} />
                )}
                {selectedSearchIntentManualActionPreflightConsistency && (
                  <SearchIntentManualActionPreflightConsistencyCard summary={selectedSearchIntentManualActionPreflightConsistency} />
                )}
                <ProductScopeManualActionTargetAlignmentCard summary={selectedManualActionTargetAlignment} />
                {selectedSearchIntentManualActionEvidenceSnapshot.length > 0 && (
                  <div className="manualActionContextSnapshot" aria-label="Parent ASIN 广告搜索词表现复核背景核对">
                    <strong>Parent ASIN 广告搜索词表现复核背景核对</strong>
                    <ul>
                      {selectedSearchIntentManualActionEvidenceSnapshot.map((item) => (
                        <li key={`${item.label}-${item.value}`}>
                          <span>{item.label}</span>
                          <b>{item.value}</b>
                        </li>
                      ))}
                    </ul>
                    <p>只核对当前 Parent ASIN 广告搜索词表现复核背景；实际写入以后端 preflight evidence_snapshot_preview 为准，复核上下文不是人工动作对象。</p>
                  </div>
                )}
                {selectedBackendManualActionPreview?.preflightChecks.length ? (
                  <div className="manualActionPreflightChecklist" aria-label="确认前检查清单">
                    <strong>确认前检查</strong>
                    <ul>
                      {selectedBackendManualActionPreview.preflightChecks.map((check) => (
                        <li key={check.checkId}>
                          <span>{check.label}</span>
                          <p>{check.evidence}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className={`manualActionBackendPreflight ${selectedManualActionPreflightTone}`} aria-label="后端人工动作只读预检">
                  <strong>后端只读预检</strong>
                  <span>当前预览动作：{manualActionLabel[selectedManualActionPreviewActionType]}</span>
                  <p>{selectedManualActionPreflightText}</p>
                  {selectedManualActionPreflightEvidenceText ? (
                    <p className="manualActionPreflightEvidence">{selectedManualActionPreflightEvidenceText}</p>
                  ) : null}
                </div>
                {selectedManualActionAuthorizationReadiness && (
                  <div
                    className={`manualActionAuthorizationReadiness ${selectedManualActionAuthorizationReadiness.tone}`}
                    aria-label="人工动作待授权写入状态"
                  >
                    <strong>{selectedManualActionAuthorizationReadiness.title}</strong>
                    <p>{selectedManualActionAuthorizationReadiness.primary}</p>
                    <ul>
                      <li>{selectedManualActionAuthorizationReadiness.target}</li>
                      <li>{selectedManualActionAuthorizationReadiness.currentState}</li>
                      <li>{selectedManualActionAuthorizationReadiness.authorizedResult}</li>
                      <li>{selectedManualActionAuthorizationReadiness.evidence}</li>
                    </ul>
                    <small>{selectedManualActionAuthorizationReadiness.boundary}</small>
                  </div>
                )}
                <div className="manualActionPathSteps" aria-label="人工处理路径">
                  {selectedManualActionPathSteps.map((step, index) => (
                    <div key={step.label} className={`manualActionPathStep ${step.tone}`}>
                      <span>{index + 1}</span>
                      <strong>{step.label}</strong>
                      <b>{step.value}</b>
                      <p>{step.detail}</p>
                    </div>
                  ))}
                </div>
                <div className="manualActionIdentityGate" aria-label="人工动作对象身份门禁">
                  {selectedManualActionIdentityGateItems.map((item) => (
                    <div key={item.label} className={`manualActionIdentityGateItem ${item.tone}`}>
                      <span>{item.label}</span>
                      <b>{item.value}</b>
                      <p>{item.detail}</p>
                    </div>
                  ))}
                </div>
                {selectedManualActionPreflightPriorityEvidenceRows.length > 0 && (
                  <div className="manualActionEvidencePreviewList manualActionEvidenceGapPreview" aria-label="优先查看的边界与证据缺口">
                    <div>
                      <strong>先看边界与缺口</strong>
                      <span>{selectedManualActionPreflightPriorityEvidenceRows.length} 条</span>
                    </div>
                    <ul>
                      {selectedManualActionPreflightPriorityEvidenceRows.map((item, index) => (
                        <li key={`${item.label}-${item.value}-${index}`}>
                          <span>{item.label}</span>
                          <b>{item.value}</b>
                          {item.detail && <p>{item.detail}</p>}
                          {item.source && <small>来源：{item.source}</small>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedManualActionPreflightEvidenceRows.length > 0 && (
                  <div className="manualActionEvidencePreviewList" aria-label="将保存的人工证据快照">
                    <div>
                      <strong>将保存的证据快照</strong>
                      <span>{selectedManualActionPreflightEvidenceRows.length} 条</span>
                    </div>
                    <ul>
                      {selectedManualActionPreflightEvidenceRows.map((item, index) => (
                        <li key={`${item.label}-${item.value}-${index}`}>
                          <span>{item.label}</span>
                          <b>{item.value}</b>
                          {item.detail && <p>{item.detail}</p>}
                          {item.source && <small>来源：{item.source}</small>}
                        </li>
                      ))}
                    </ul>
                    {selectedManualActionPreviewPreflight?.evidence_snapshot_preview?.boundary && (
                      <p className="manualActionEvidencePreviewBoundary">
                        {selectedManualActionPreviewPreflight.evidence_snapshot_preview.boundary}
                      </p>
                    )}
                  </div>
                )}
                <div className="manualActionPostWriteContract" aria-label="点击后验收合同">
                  <div>
                    <strong>点击后验收合同</strong>
                    <span>人工动作后必须读回</span>
                  </div>
                  <ul>
                    {selectedManualActionPostWriteContractItems.map((item) => (
                      <li key={`${item.label}-${item.value}`}>
                        <span>{item.label}</span>
                        <b>{item.value}</b>
                        <p>{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="manualActionButtonBoundary" aria-label="人工留痕动作">
                  只保存人工留痕和复盘待办，不执行广告动作
                </div>
                <div className="manualActionChoiceGuide" aria-label="人工动作选择依据">
                  {manualActionChoiceGuideItems().map((guide) => {
                    const guidePreflight = manualActionPreflightForAction(
                      guide.actionType,
                      manualActionPreflightsByAction,
                      manualActionPreflight,
                    );
                    const guidePreflightError = manualActionPreflightErrorForAction(
                      guide.actionType,
                      manualActionPreflightErrorsByAction,
                      manualActionPreflightError,
                    );
                    const guideGate = manualActionButtonGate(
                      guide.actionType,
                      guidePreflight,
                      guidePreflightError,
                      hasReviewTodoForSelectedObject,
                      manualActionExpectedTargetForSignal(selectedSignal, guide.actionType),
                    );
                    return (
                      <div key={guide.actionType} className={`manualActionChoiceGuideItem ${guideGate.disabled ? "blocked" : "ready"}`}>
                        <span>{guide.label}</span>
                        <b>{guideGate.disabled ? guideGate.compactReason ?? "暂不可用" : "可人工点击"}</b>
                        <p>{guide.whenToUse}</p>
                        <small>{guide.writes}</small>
                        <small>{guideGate.reason ?? guide.boundary}</small>
                      </div>
                    );
                  })}
                </div>
                <div className="manualActionGrid" aria-label="人工动作按钮">
                  {manualActionOrder.map((actionType) => {
                    const Icon = manualActionIcon[actionType];
                    const actionPreflight = manualActionPreflightForAction(
                      actionType,
                      manualActionPreflightsByAction,
                      manualActionPreflight,
                    );
                    const actionPreflightError = manualActionPreflightErrorForAction(
                      actionType,
                      manualActionPreflightErrorsByAction,
                      manualActionPreflightError,
                    );
                    const actionGate = manualActionButtonGate(
                      actionType,
                      actionPreflight,
                      actionPreflightError,
                      hasReviewTodoForSelectedObject,
                      manualActionExpectedTargetForSignal(selectedSignal, actionType),
                    );
                    const isDuplicateReviewAction = actionType === "add_to_review" && hasReviewTodoForSelectedObject;
                    const actionLabel = isDuplicateReviewAction ? "等待复盘窗口" : manualActionLabel[actionType];
                    const actionExpectationText = manualActionButtonExpectationText(actionType, actionPreflight);
                    const actionIntent = actionGate.reason ?? [manualActionIntentText(actionType), actionExpectationText].filter(Boolean).join(" ");
                    const compactIntent = actionGate.compactReason ?? actionExpectationText ?? manualActionCompactIntent[actionType];
                    return (
                      <button
                        key={actionType}
                        className={`manualActionButton${actionType === "add_to_review" ? " primaryManualAction" : ""}`}
                        onFocus={() => setManualActionPreviewActionType(actionType)}
                        onMouseEnter={() => setManualActionPreviewActionType(actionType)}
                        onClick={() => handleManualAction(actionType)}
                        disabled={savingManualAction || actionGate.disabled}
                        aria-label={`${actionLabel}：${actionIntent}`}
                        title={actionIntent}
                      >
                        <Icon size={16} aria-hidden="true" />
                        <span className="manualActionButtonText">
                          <strong>{actionLabel}</strong>
                          <span>{compactIntent}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="manualActionReadbackStatusGroup">
                  <div className="manualActionReadbackPath" aria-label="点击后读回路径">
                    {selectedManualActionReadbackPathItems.map((item) => (
                      <div key={item.label} className={`manualActionReadbackPathItem ${item.tone}`}>
                        <span>{item.label}</span>
                        <b>{item.value}</b>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                  <p className="manualActionReadbackStatusLine">{manualActionPostWriteExpectationSummaryText()}</p>
                  <p
                    className="manualActionReadbackStatusLine"
                    title={`${manualActionPostWriteExpectationSummaryText()} ${selectedManualActionReadbackConsistency}`}
                  >
                    {selectedManualActionReadbackCompact}
                  </p>
                </div>
              </section>

              <section className="reviewFlowPanel" aria-label="复盘状态">
                <div className="reviewFlowHeader">
                  <div>
                    <h3>复盘状态</h3>
                    <span>人工动作后的 7/14 天窗口，不直接代表改善结论</span>
                  </div>
                  <b>{selectedReviewTodos.length} 项</b>
                </div>

                {reviewReadinessGateSummary && (
                  <div
                    className={`reviewReadinessGateSummary ${reviewReadinessGateSummary.status}`}
                    aria-label="全局复盘可验证性"
                  >
                    <div>
                      <strong>{reviewReadinessGateSummary.title}</strong>
                      <span>{reviewReadinessGateSummary.primary}</span>
                    </div>
                    <ul>
                      {reviewReadinessGateSummary.items.map((item) => (
                        <li key={item.label} className={item.tone}>
                          <span>{item.label}</span>
                          <b>{item.value}</b>
                        </li>
                      ))}
                    </ul>
                    {reviewReadinessGateSummary.identityAudit && (
                      <div
                        className={`reviewIdentityAudit ${reviewReadinessGateSummary.identityAudit.status}`}
                        aria-label="复盘读回身份门禁"
                      >
                        <div>
                          <strong>{reviewReadinessGateSummary.identityAudit.title}</strong>
                          <span>{reviewReadinessGateSummary.identityAudit.summary}</span>
                        </div>
                        <ul>
                          {reviewReadinessGateSummary.identityAudit.items.map((item) => (
                            <li key={item.label} className={item.tone}>
                              <span>{item.label}</span>
                              <b>{item.value}</b>
                            </li>
                          ))}
                        </ul>
                        <p>{reviewReadinessGateSummary.identityAudit.boundary}</p>
                      </div>
                    )}
                    {reviewReadinessGateSummary.queueSeparation && (
                      <div className="reviewQueueSeparation" aria-label="复盘对象与下一候选分层">
                        <div>
                          <strong>{reviewReadinessGateSummary.queueSeparation.title}</strong>
                          <span>{reviewReadinessGateSummary.queueSeparation.primary}</span>
                        </div>
                        <ul>
                          {reviewReadinessGateSummary.queueSeparation.items.map((item) => (
                            <li key={item.label} className={item.tone}>
                              <span>{item.label}</span>
                              <b>{item.value}</b>
                            </li>
                          ))}
                        </ul>
                        <p>{reviewReadinessGateSummary.queueSeparation.boundary}</p>
                      </div>
                    )}
                    <p>{reviewReadinessGateSummary.detail}</p>
                    <ol className="reviewReadinessNextSteps" aria-label="复盘下一步路径">
                      {reviewReadinessGateSummary.nextSteps.map((step) => (
                        <li key={step.label}>
                          <span>{step.label}</span>
                          <p>{step.detail}</p>
                        </li>
                      ))}
                    </ol>
                    <p>{reviewReadinessGateSummary.boundary}</p>
                  </div>
                )}

                {reviewEvidenceRepairSummary && (
                  <div
                    className={`reviewReadinessGateSummary reviewEvidenceRepairSummary ${
                      reviewEvidenceRepairSummary.status === "blocked" ? "blocked" : "ready"
                    }`}
                    aria-label={reviewEvidenceRepairAriaLabel}
                  >
                    <div>
                      <strong>{reviewEvidenceRepairSummary.title}</strong>
                      <span>{reviewEvidenceRepairSummary.primary}</span>
                    </div>
                    <ul>
                      {reviewEvidenceRepairSummary.items.map((item) => (
                        <li key={item.label} className={item.tone}>
                          <span>{item.label}</span>
                          <b>{item.value}</b>
                        </li>
                      ))}
                    </ul>
                    <p>{reviewEvidenceRepairSummary.detail}</p>
                    {reviewEvidenceRepairSummary.voidPlanItems.length > 0 && (
                      <div className="reviewRepairDryRunChecklist" aria-label="历史待办 dry-run 核对清单">
                        {reviewEvidenceRepairSummary.voidPlanItems.map((item) => (
                          <article key={item.actionId}>
                            <div>
                              <strong>dry-run 核对</strong>
                              <span>{item.actionId}</span>
                            </div>
                            <dl>
                              <div>
                                <dt>计划状态</dt>
                                <dd>{item.statusText}</dd>
                              </div>
                              <div>
                                <dt>作废对象</dt>
                                <dd>{item.objectText}</dd>
                              </div>
                              <div>
                                <dt>复盘窗口</dt>
                                <dd>{item.reviewWindows}</dd>
                              </div>
                              <div>
                                <dt>作废后</dt>
                                <dd>{item.afterVoidText}</dd>
                              </div>
                              <div>
                                <dt>重新留痕</dt>
                                <dd>{item.recreateText}</dd>
                              </div>
                              <div>
                                <dt>授权码</dt>
                                <dd>
                                  <code>{item.authorizationCode || "待生成"}</code>
                                </dd>
                              </div>
                              <div>
                                <dt>dry-run</dt>
                                <dd>
                                  <code>{item.dryRunCommand || "待生成"}</code>
                                </dd>
                              </div>
                              <div>
                                <dt>写入边界</dt>
                                <dd>{item.boundary || "只读预检，不执行广告动作。"}</dd>
                              </div>
                            </dl>
                          </article>
                        ))}
                      </div>
                    )}
                    {reviewEvidenceRepairSummary.sampleItems.length > 0 && (
                      <ul className="reviewRepairSampleList" aria-label="历史待办治理样本">
                        {reviewEvidenceRepairSummary.sampleItems.map((item) => (
                          <li key={item}>
                            <ReviewRepairSampleItem item={item} />
                          </li>
                        ))}
                      </ul>
                    )}
                    <ol className="reviewReadinessNextSteps" aria-label="历史待办治理下一步">
                      {reviewEvidenceRepairSummary.nextSteps.map((step) => (
                        <li key={step.label}>
                          <span>{step.label}</span>
                          <p>{step.detail}</p>
                        </li>
                      ))}
                    </ol>
                    <p>{reviewEvidenceRepairSummary.boundary}</p>
                  </div>
                )}

                <div className="manualReviewClosureLedger" aria-label="人工确认复盘闭环三层">
                  <div>
                    <strong>{selectedManualReviewClosureLedger.title}</strong>
                    <span>{selectedManualReviewClosureLedger.summary}</span>
                  </div>
                  <ul>
                    {selectedManualReviewClosureLedger.rows.map((row) => (
                      <li key={row.label} className={row.tone}>
                        <span>{row.label}</span>
                        <b>{row.value}</b>
                        <p>{row.detail}</p>
                      </li>
                    ))}
                  </ul>
                  <p>{selectedManualReviewClosureLedger.boundary}</p>
                </div>

                <section className="sideSection reviewFlowItem reviewFlowBoundary">
                  <h3>复盘边界</h3>
                  <p>{selectedReviewApplicabilityBoundary}</p>
                </section>

                <section className="sideSection reviewFlowItem reviewFlowHistory">
                  <h3>处理留痕</h3>
                  {latestManualAction ? (
                    <>
                      <p>{manualActionLabel[latestManualAction.action_type]}</p>
                      <span>
                        {latestManualAction.operator_name ?? "本地运营"} /{" "}
                        {latestManualAction.acted_at ? new Date(latestManualAction.acted_at).toLocaleString() : "时间待补充"}
                      </span>
                      {latestManualActionReadback && <span>{latestManualActionReadback}</span>}
                      {latestManualActionEvidenceText && <span>{latestManualActionEvidenceText}</span>}
                      {latestManualActionBoundary && <span>{latestManualActionBoundary}</span>}
                    </>
                  ) : (
                    <p>{manualActionEmptyStateText(manualActionPreflight)}</p>
                  )}
                  {manualActionMessage && <span>{manualActionMessage}</span>}
                </section>

                <section className="sideSection reviewFlowItem reviewFlowTodo">
                  <h3>复盘待办</h3>
                  {nextReviewTodo ? (
                    <>
                      <p>{reviewCheckpointText(nextReviewTodo, selectedReviewEffect)}</p>
                      <span>
                        {nextReviewObjectLabel} / {new Date(nextReviewTodo.due_at).toLocaleDateString()} / 来自动作：
                        {manualActionLabel[nextReviewTodo.action_type]}
                      </span>
                      {nextReviewTodoReadback && <span>{nextReviewTodoReadback}</span>}
                      {nextReviewTodoEvidenceText && <span>{nextReviewTodoEvidenceText}</span>}
                      {selectedReviewTodoDecisionReadback && (
                        <div
                          className={`manualConfirmationEvidenceReadiness reviewTodoDecisionReadback ${selectedReviewTodoDecisionReadback.tone}`}
                          aria-label="复盘待办业务判断读回"
                        >
                          <strong>{selectedReviewTodoDecisionReadback.title}</strong>
                          <p>{selectedReviewTodoDecisionReadback.summary}</p>
                          <ul>
                            {selectedReviewTodoDecisionReadback.rows.map((row) => (
                              <li key={row.label} className={row.tone}>
                                <span>{row.label}</span>
                                <b>{row.value}</b>
                                <p>{row.detail}</p>
                              </li>
                            ))}
                          </ul>
                          <small>{selectedReviewTodoDecisionReadback.boundary}</small>
                        </div>
                      )}
                      {selectedReviewRecordSavePath && (
                        <div
                          className={`manualConfirmationEvidenceReadiness reviewRecordSavePath ${selectedReviewRecordSavePath.tone}`}
                          aria-label="复盘保存顺序核对"
                        >
                          <strong>{selectedReviewRecordSavePath.title}</strong>
                          <ul>
                            {selectedReviewRecordSavePath.rows.map((row) => (
                              <li key={row.label} className={row.tone}>
                                <span>{row.label}</span>
                                <b>{row.value}</b>
                                <p>{row.detail}</p>
                              </li>
                            ))}
                          </ul>
                          <small>{selectedReviewRecordSavePath.boundary}</small>
                        </div>
                      )}
                      {selectedReviewTodoEvidenceReadback && (
                        <div
                          className={`manualConfirmationEvidenceReadiness reviewTodoEvidenceReadback ${selectedReviewTodoEvidenceReadback.tone}`}
                          aria-label="复盘待办证据回读核对"
                        >
                          <strong>{selectedReviewTodoEvidenceReadback.title}</strong>
                          <p>{selectedReviewTodoEvidenceReadback.summary}</p>
                          <ul>
                            {selectedReviewTodoEvidenceReadback.rows.map((row) => (
                              <li key={row.label} className={row.tone}>
                                <span>{row.label}</span>
                                <b>{row.value}</b>
                                <p>{row.detail}</p>
                              </li>
                            ))}
                          </ul>
                          <small>{selectedReviewTodoEvidenceReadback.boundary}</small>
                        </div>
                      )}
                      {selectedReviewEffectReadback && <span>{selectedReviewEffectReadback}</span>}
                      {selectedReviewEffectWindowText && <span>{selectedReviewEffectWindowText}</span>}
                      {selectedReviewEffect?.status === "ready" && <span>{reviewEffectSummaryText(selectedReviewEffect)}</span>}
                      <div
                        className={`reviewEffectWindowLedger ${selectedReviewEffectWindowLedger.tone}`}
                        aria-label="复盘效果窗口口径"
                      >
                        <strong>{selectedReviewEffectWindowLedger.title}</strong>
                        <p>{selectedReviewEffectWindowLedger.status}</p>
                        <dl>
                          <div>
                            <dt>处理前窗口</dt>
                            <dd>{selectedReviewEffectWindowLedger.beforeWindow}</dd>
                          </div>
                          <div>
                            <dt>处理后窗口</dt>
                            <dd>{selectedReviewEffectWindowLedger.afterWindow}</dd>
                          </div>
                          <div>
                            <dt>指标口径</dt>
                            <dd>{selectedReviewEffectWindowLedger.metricCoverage}</dd>
                          </div>
                          <div>
                            <dt>下一步</dt>
                            <dd>{selectedReviewEffectWindowLedger.nextStep}</dd>
                          </div>
                        </dl>
                        <small>{selectedReviewEffectWindowLedger.boundary}</small>
                      </div>
                      <p
                        className={`reviewRecordSaveGate ${selectedReviewRecordSaveGate.tone}`}
                        aria-label="复盘保存门槛"
                      >
                        <strong>{selectedReviewRecordSaveGate.title}</strong>
                        <span>{selectedReviewRecordSaveGate.detail}</span>
                      </p>
                      {selectedReviewMetricRows.length > 0 && (
                        <div className="reviewMetricTable" aria-label="复盘指标对比">
                          {selectedReviewMetricRows.map((row) => (
                            <div key={row.label}>
                              <span>{row.label}</span>
                              <strong>{row.before}</strong>
                              <strong>{row.after}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedReviewRecordPreflightChecklist.length > 0 && (
                        <div className="reviewRecordPreflightChecklist" aria-label="复盘保存前检查清单">
                          <strong>保存前检查</strong>
                          <ul>
                            {selectedReviewRecordPreflightChecklist.map((check) => (
                              <li key={check.id}>
                                <span>{check.title}</span>
                                <p>{check.description}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedReviewRecordSaveGate.canSave && (
                        <button className="secondaryButton" onClick={handleSaveReviewRecord} disabled={savingReviewRecord}>
                          保存复盘记录
                        </button>
                      )}
                    </>
                  ) : (
                    <p>{reviewTodoEmptyStateText(latestManualAction)}</p>
                  )}
                  <span>{reviewRecordStatusText(latestReviewRecord)}</span>
                  {reviewTodoMessage && <span>{reviewTodoMessage}</span>}
                </section>

                <section className="sideSection reviewFlowItem ruleImprovementSection" aria-label="规则改进门槛">
                  <h3>规则改进门槛</h3>
                  <p className={`ruleImprovementStatus ${selectedRuleImprovementReadiness.tone}`}>
                    {selectedRuleImprovementReadiness.title}
                  </p>
                  <span>{selectedRuleImprovementReadiness.description}</span>
                  <span>
                    <b>下一步：</b>
                    {selectedRuleImprovementReadiness.nextStep}
                  </span>
                  {selectedRuleFeedbackCandidate && (
                    <div className="ruleFeedbackCandidate" aria-label="规则反馈候选">
                      <strong>{selectedRuleFeedbackCandidate.title}</strong>
                      <span>{selectedRuleFeedbackCandidate.basis}</span>
                      <span>{selectedRuleFeedbackCandidate.recommendation}</span>
                      <p>{selectedRuleFeedbackCandidate.boundary}</p>
                    </div>
                  )}
                  {ruleFeedbackPrioritySummary && (
                    <div className="ruleFeedbackCandidate" aria-label="规则反馈候选汇总">
                      <strong>{ruleFeedbackPrioritySummary.title}</strong>
                      <span>{ruleFeedbackPrioritySummary.basis}</span>
                      <span>{ruleFeedbackPrioritySummary.priority}</span>
                      <span>{ruleFeedbackPrioritySummary.sampleSort}</span>
                      <span>{ruleFeedbackPrioritySummary.actionBoundary}</span>
                      {ruleFeedbackPrioritySummary.candidateGroups.length > 0 && (
                        <ul className="ruleFeedbackRecordList">
                          {ruleFeedbackPrioritySummary.candidateGroups.map((group) => (
                            <li key={group}>{group}</li>
                          ))}
                        </ul>
                      )}
                      {ruleFeedbackPrioritySummary.closureChecklist.length > 0 && (
                        <ul className="ruleFeedbackRecordList">
                          {ruleFeedbackPrioritySummary.closureChecklist.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {ruleFeedbackPrioritySummary.records.length > 0 && (
                        <ul className="ruleFeedbackRecordList">
                          {ruleFeedbackPrioritySummary.records.map((record) => (
                            <li key={record}>{record}</li>
                          ))}
                        </ul>
                      )}
                      <p>{ruleFeedbackPrioritySummary.boundary}</p>
                    </div>
                  )}
                </section>
              </section>
            </>
          ) : noActionableManualGate ? (
            <NoActionableManualGatePanel gate={noActionableManualGate} />
          ) : (
            <EmptyState icon="empty" title="等待信号" />
          )}
        </aside>
      </section>
    </main>
  );
}

function OverviewMetric({ label, value, tone }: { label: string; value: number; tone: "danger" | "success" | "neutral" }) {
  return (
    <div className={`overviewMetric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DiagnosisPathPanel({ items }: { items: SignalTriageDiagnosisPathItem[] }) {
  return (
    <section className="diagnosisPathPanel diagnosisStep stepDiagnosisPath" aria-label="广告诊断路径">
      <div className="detailSectionHeader">
        <h3>广告诊断路径</h3>
        <span>{items.length} 个排查节点</span>
      </div>
      <div className="diagnosisPathList">
        {items.map((item) => (
          <div className="diagnosisPathItem" key={`${item.step}-${item.blockId}`}>
            <span>{item.step}</span>
            <div>
              <b>{item.label}</b>
              <strong>{item.value}</strong>
              {item.detail && <p>{item.detail}</p>}
              {item.source && <small>来源：{item.source}</small>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DiagnosisContractPanel({
  items,
  summary,
}: {
  items: SignalTriageDiagnosisContractItem[];
  summary: SignalDiagnosisEvidenceSummary | null;
}) {
  return (
    <section className="diagnosisContractPanel diagnosisStep stepEvidence" aria-label="业务判断与指标目的">
      <div className="detailSectionHeader">
        <h3>业务判断与指标目的</h3>
        <span>先看人工下一步 / {items.length} 个证据块可展开</span>
      </div>
      <p className="diagnosisContractIntro">默认只给运营决策摘要；完整指标目的、证明边界和补证要求保留在展开项里。</p>
      {summary && (
        <div className={`diagnosisEvidenceSummary ${summary.tone}`} aria-label="证据强度和判断边界摘要">
          <div>
            <strong>{summary.title}</strong>
            <span>{summary.strengthLabel}</span>
          </div>
          <p>{summary.businessQuestion}</p>
          <ul>
            <li>
              <b>诊断对象</b>
              <span>{summary.objectReadback}</span>
            </li>
            <li>
              <b>人工下一步</b>
              <span>{summary.nextManualStep}</span>
            </li>
            <li>
              <b>证据缺口</b>
              <span>{summary.evidenceGap}</span>
            </li>
          </ul>
          <details className="diagnosisEvidenceDetails">
            <summary>查看能证明 / 不能证明 / 强度依据</summary>
            <ul>
              <li>
                <b>强度依据</b>
                <span>{summary.strengthReason}</span>
              </li>
              <li>
                <b>能证明</b>
                <span>{summary.proves}</span>
              </li>
              <li>
                <b>不能证明</b>
                <span>{summary.doesNotProve}</span>
              </li>
            </ul>
          </details>
        </div>
      )}
      <div className="triageBusinessEvidenceStrip compactEvidenceDetails" aria-label="指标为什么服务业务判断">
        {items.map((item) => (
          <details key={item.sectionId}>
            <summary>
              <b>{item.title}</b>
              <strong>当前判断：{item.currentJudgement}</strong>
            </summary>
            <small>业务问题：{item.businessQuestion}</small>
            <small>对象粒度：{item.objectGrain}</small>
            {item.metricText && <small>指标目的：{item.metricText}</small>}
            <small>能证明：{item.proves}</small>
            <small>不能证明：{item.doesNotProve}</small>
            <small>证据缺口：{item.evidenceGap}</small>
            <small>需要补证：{item.requiredEvidence}</small>
            <small>人工下一步：{item.nextManualStep}</small>
          </details>
        ))}
      </div>
    </section>
  );
}

function SearchTermOpportunityReviewChainPanel({
  chain,
  adContextRows,
}: {
  chain: SearchTermOpportunityReviewChain;
  adContextRows: SearchTermAdContextRow[];
}) {
  return (
    <section className="searchTermOpportunityReviewChain diagnosisStep stepEvidence" aria-label="广告搜索词表现复核链">
      <div className="detailSectionHeader">
        <h3>广告搜索词表现复核链</h3>
        <span>{chain.title}</span>
      </div>
      <p>{chain.businessQuestion}</p>
      {chain.reviewLayers.length > 0 && (
        <div className="searchTermReviewLayerGrid" aria-label="广告搜索词复核分层判断">
          {chain.reviewLayers.map((layer) => (
            <article className="searchTermReviewLayer" key={layer.label}>
              <div>
                <strong>{layer.label}</strong>
                <span>{layer.purpose}</span>
              </div>
              <dl>
                <dt>证据</dt>
                <dd>{layer.evidence}</dd>
                <dt>能证明</dt>
                <dd>{layer.proves}</dd>
                <dt>不能证明</dt>
                <dd>{layer.doesNotProve}</dd>
                <dt>人工下一步</dt>
                <dd>{layer.nextManualStep}</dd>
              </dl>
            </article>
          ))}
        </div>
      )}
      <ul>
        <li>
          <b>对象粒度</b>
          <span>{chain.objectGrain}</span>
        </li>
        <li>
          <b>复核路径</b>
          <span>{chain.reviewPath}</span>
        </li>
        <li>
          <b>Parent ASIN 入口</b>
          <span>{chain.parentScopeContext}</span>
        </li>
        <li>
          <b>广告 ASIN 承接</b>
          <span>{chain.adAsinCoverage}</span>
        </li>
        <li>
          <b>广告组合流判断</b>
          <span>{chain.adGroupSynthesis}</span>
        </li>
        <li>
          <b>同组投放商品表现</b>
          <span>{chain.adGroupProductPerformance}</span>
        </li>
        <li>
          <b>投放词证据</b>
          <span>{chain.targetingEvidence}</span>
        </li>
        <li>
          <b>广告位边界</b>
          <span>{chain.placementBoundary}</span>
        </li>
        <li>
          <b>ABA 背景</b>
          <span>{chain.marketContext}</span>
        </li>
        <li>
          <b>当前判断</b>
          <span>{chain.currentJudgement}</span>
        </li>
        <li>
          <b>能证明</b>
          <span>{chain.proves}</span>
        </li>
        <li>
          <b>不能证明</b>
          <span>{chain.doesNotProve}</span>
        </li>
        <li>
          <b>证据缺口</b>
          <span>{chain.evidenceGap}</span>
        </li>
        <li>
          <b>需要补证</b>
          <span>{chain.requiredEvidence}</span>
        </li>
        <li>
          <b>人工下一步</b>
          <span>{chain.nextManualStep}</span>
        </li>
        <li>
          <b>动作边界</b>
          <span>{chain.actionBoundary}</span>
        </li>
      </ul>
      {adContextRows.length > 0 && (
        <div className="searchTermAdContextRows" aria-label="逐投放上下文复核">
          <div className="detailSectionHeader">
            <h3>逐投放上下文复核</h3>
            <span>{adContextRows.length} 条广告搜索词表现行</span>
          </div>
          <p>同一个 SearchTerm 可能跨广告活动、广告组和投放词出现；先逐行看承接，再决定是否记录观察或加入复盘。</p>
          <div className="searchTermAdContextGrid">
            {adContextRows.map((row) => (
              <div className="searchTermAdContextRow" key={row.key}>
                <div>
                  <span>{row.periodText}</span>
                  <strong>{row.searchTerm}</strong>
                  <p>{row.campaignName}</p>
                </div>
                <div>
                  <b>{row.adGroupName}</b>
                  <span>{row.targetingLabel}</span>
                </div>
                <div>
                  <b>{row.reviewPriority}</b>
                  <span>{row.reviewReason}</span>
                </div>
                <div>
                  <b>{row.metricsText}</b>
                  <span>{row.efficiencyText}</span>
                </div>
                <p>{row.judgement}</p>
                <small>{row.boundary}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function DiagnosisContextStrip({ summary }: { summary: DiagnosisContextSummary }) {
  return (
    <div className={`diagnosisContextStrip ${summary.tone}`} aria-label="当前诊断上下文">
      <div className="diagnosisContextHeader">
        <strong>{summary.title}</strong>
        <span>{summary.statusLabel}</span>
      </div>
      <div className="diagnosisContextItems">
        {summary.items.map((item) => (
          <span key={item.label}>
            <b>{item.label}</b>
            <strong>{item.value}</strong>
            {item.detail && <small>{item.detail}</small>}
          </span>
        ))}
      </div>
      <p>{summary.boundary}</p>
    </div>
  );
}

function QueueDiagnosisPathPanel({ summary }: { summary: DiagnosisPathSummary }) {
  const finalTone = summary.steps[summary.steps.length - 1]?.tone ?? "neutral";
  return (
    <section className={`queueDiagnosisPath ${finalTone}`} aria-label="当前诊断路径">
      <div className="queueDiagnosisPathHeader">
        <strong>{summary.title}</strong>
        <span>{summary.description}</span>
      </div>
      <div className="queueDiagnosisPathSteps">
        {summary.steps.map((step) => (
          <span className={step.tone} key={`${step.label}-${step.value}`}>
            <b>{step.label}</b>
            <strong>{step.value}</strong>
          </span>
        ))}
      </div>
      <p>{summary.boundary}</p>
    </section>
  );
}

function SelectedSignalScopeContextStrip({ context }: { context: SelectedSignalScopeContext }) {
  return (
    <div className={`selectedSignalScopeContext ${context.tone}`} aria-label="选中信号与当前诊断入口关系">
      <div className="selectedSignalScopeContextHeader">
        <strong>{context.title}</strong>
        <span>{context.statusLabel}</span>
      </div>
      <div className="selectedSignalScopeContextGrid">
        <span>
          <b>当前入口</b>
          <strong>{context.scopeLabel}</strong>
        </span>
        <span>
          <b>选中信号</b>
          <strong>{context.signalObject}</strong>
        </span>
      </div>
      <p>{context.relation}</p>
      <small>{context.boundary}</small>
    </div>
  );
}

function SearchIntentFocusContextStrip({ context }: { context: SearchIntentFocusContext }) {
  return (
    <div className={`selectedSignalScopeContext searchIntentFocusContext ${context.tone}`} aria-label="广告搜索词表现复核与当前信号关系">
      <div className="selectedSignalScopeContextHeader">
        <strong>{context.title}</strong>
        <span>Parent ASIN 广告搜索词表现复核</span>
      </div>
      <div className="selectedSignalScopeContextGrid">
        {context.pathItems.map((item) => (
          <span key={item.label}>
            <b>{item.label}</b>
            <strong>{item.value}</strong>
          </span>
        ))}
      </div>
      <p>{context.relation}</p>
      <small>{context.boundary}</small>
    </div>
  );
}

function SearchIntentSelectedTermReasonPanel({ summary }: { summary: SearchIntentSelectedTermReasonSummary }) {
  return (
    <div className={`searchIntentTermReason ${summary.tone}`} aria-label="具体 SearchTerm 复核理由">
      <div className="searchIntentTermReasonHeader">
        <strong>{summary.title}</strong>
        <span>Parent ASIN 广告搜索词表现复核</span>
      </div>
      <dl>
        {summary.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <b>{row.value}</b>
              <small>{row.detail}</small>
            </dd>
          </div>
        ))}
      </dl>
      <div className="searchIntentExecutionPath" aria-label="SearchTerm 复核执行路径">
        {summary.executionSteps.map((step) => (
          <span key={step.label}>
            <b>{step.label}</b>
            <strong>{step.value}</strong>
            <small>{step.detail}</small>
          </span>
        ))}
      </div>
      <small>{summary.boundary}</small>
    </div>
  );
}

function SearchIntentReviewDecisionSummaryPanel({ summary }: { summary: SearchIntentReviewDecisionSummary }) {
  return (
    <div className="searchIntentReviewDecisionSummary" aria-label="广告搜索词表现复核判断摘要">
      <div className="searchIntentReviewDecisionHeader">
        <strong>{summary.headline}</strong>
        <span>{summary.topDecisionLabel}</span>
      </div>
      <dl className="searchIntentReviewDecisionDistribution" aria-label="有效词、浪费词和证据缺口分布">
        {summary.distributionItems.map((item) => (
          <div className={item.tone} key={item.label}>
            <dt>{item.label}</dt>
            <dd>
              <b>{item.value}</b>
              <small>{item.detail}</small>
            </dd>
          </div>
        ))}
      </dl>
      <div className="searchIntentReviewDecisionNext" aria-label="搜索词复核下一步">
        <span>
          <b>优先对象</b>
          <small>{summary.topSearchTermLabel}</small>
        </span>
        <span>
          <b>证据缺口</b>
          <small>{summary.evidenceGap}</small>
        </span>
        <span>
          <b>人工下一步</b>
          <small>{summary.nextManualStep}</small>
        </span>
      </div>
      <small>{summary.boundary}</small>
    </div>
  );
}

function ProductScopeManualActionTargetAlignmentCard({ summary }: { summary: ProductScopeManualActionTargetAlignment }) {
  return (
    <div className={`manualActionTargetAlignment ${summary.tone}`} aria-label="人工动作对象链路读回">
      <div className="manualActionTargetAlignmentHeader">
        <strong>{summary.title}</strong>
        <span>{summary.tone === "ready" ? "一致" : summary.tone === "blocked" ? "阻断" : "等待"}</span>
      </div>
      <p>{summary.primary}</p>
      <ul>
        {summary.items.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <b>{item.value}</b>
            <small>{item.detail}</small>
          </li>
        ))}
      </ul>
      <small>{summary.boundary}</small>
    </div>
  );
}

function SearchIntentManualActionReadbackCard({ summary }: { summary: SearchIntentManualActionReadbackSummary }) {
  return (
    <div className={`searchIntentManualActionReadback ${summary.tone}`} aria-label="搜索词人工留痕对象读回">
      <strong>{summary.title}</strong>
      <dl>
        {summary.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <b>{row.value}</b>
              <small>{row.detail}</small>
            </dd>
          </div>
        ))}
      </dl>
      <small>{summary.boundary}</small>
    </div>
  );
}

function SearchIntentManualActionPreflightConsistencyCard({
  summary,
}: {
  summary: SearchIntentManualActionPreflightConsistencySummary;
}) {
  return (
    <div
      className={`searchIntentManualActionPreflightConsistency ${summary.tone}`}
      aria-label="搜索词人工留痕后端预检一致性"
    >
      <strong>{summary.title}</strong>
      <dl>
        {summary.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <b>{row.value}</b>
              <small>{row.detail}</small>
            </dd>
          </div>
        ))}
      </dl>
      <small>{summary.boundary}</small>
    </div>
  );
}

function ProductScopeAdmissionCardPanel({ card }: { card: ProductScopeAdmissionCard }) {
  return (
    <section className={`admissionGateCard ${card.tone}`} aria-label="AI 信号准入">
      <div className="admissionGateHeader">
        <h3>{card.title}</h3>
        <span>{card.statusLabel}</span>
      </div>
      <strong>{card.conclusion}</strong>
      <p>{card.nextStep}</p>
      <small>{card.manualActionBoundary}</small>
      {card.evidenceItems.length > 0 && (
        <div className="admissionGateEvidence" aria-label="准入证据摘要">
          {card.evidenceItems.slice(0, 3).map((item) => (
            <span key={item.blockId}>
              <b>{item.label}</b>
              <strong>{item.value}</strong>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function ProductScopeDrilldownEvidencePanel({
  admissionCard,
  matrix,
  items,
}: {
  admissionCard: ProductScopeAdmissionCard;
  matrix: ProductScopeEvidenceMatrix | null;
  items: SignalTriageBusinessEvidenceItem[];
}) {
  return (
    <>
      <ProductScopeAdmissionCardPanel card={admissionCard} />
      <div className="detailTitle diagnosisStep stepConclusion">
        <h2>当前商品范围暂无可行动候选</h2>
        <p>已读取到广告下钻数据，但没有命中可进入人工确认的广告对象级候选；这里只能作为诊断视图，不能写人工动作。</p>
      </div>
      {matrix && <ProductScopeEvidenceMatrixPanel matrix={matrix} />}
      {items.length > 0 && (
        <section className="evidenceWorkbench diagnosisStep stepEvidence" aria-label="当前商品范围广告下钻证据">
          <div className="detailSectionHeader">
            <h3>广告下钻证据链</h3>
            <span>{items.length} 个证据节点</span>
          </div>
          <div className="triageBusinessEvidenceStrip" aria-label="Parent ASIN 广告下钻证据">
            {items.map((item) => (
              <span key={item.blockId}>
                <b>{item.label}</b>
                <strong>{item.value}</strong>
                {item.detail && <small>{item.detail}</small>}
                {item.source && <small>来源：{item.source}</small>}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

interface ProductScopePriorityDecisionSummary {
  topScopeId: string;
  topLabel: string;
  topPriorityLabel: string;
  headline: string;
  readingStrategy: string;
  rankReason: string;
  scaleText: string;
  triageBuckets: ProductScopePriorityDecisionBucket[];
  nextManualStep: string;
  boundary: string;
}

function buildProductScopePriorityDecisionSummary(items: ProductScopePriorityQueueItem[]): ProductScopePriorityDecisionSummary | null {
  const topItem = items[0];
  if (!topItem) return null;

  const urgentCount = items.filter((item) => item.tone === "urgent").length;
  const reviewCount = items.filter((item) => item.tone === "review").length;
  const dueReviewTodoCount = items.reduce((total, item) => total + item.dueReviewTodoCount, 0);
  const signalCount = items.reduce((total, item) => total + item.signalCount, 0);
  const topVerb = topItem.dueReviewTodoCount > 0 ? "先复盘" : "先处理";
  const remainingCount = Math.max(items.length - 1, 0);

  return {
    topScopeId: topItem.scopeId,
    topLabel: topItem.label,
    topPriorityLabel: topItem.priorityLabel,
    headline: `${topVerb} ${topItem.label}：${topItem.mainQuestion}`,
    readingStrategy:
      remainingCount > 0
        ? `只展开 ${topItem.label} 的诊断链路；其余 ${remainingCount} 个 Parent ASIN 先按分诊桶观察，除非出现到期复盘或高优先信号，不逐个打开完整报表。`
        : `只展开 ${topItem.label} 的诊断链路；没有第二个 Parent ASIN 时，也不额外堆销售、广告组和明细报表。`,
    rankReason: topItem.rankReason,
    scaleText: `待处理规模：${items.length} 个 Parent ASIN / 高优先 ${urgentCount} 个 / 待复盘 ${reviewCount} 个 / 到期复盘 ${dueReviewTodoCount} 条 / AI 信号 ${signalCount} 条`,
    triageBuckets: buildProductScopePriorityDecisionBuckets(items),
    nextManualStep: topItem.nextManualStep,
    boundary:
      "本摘要只做首页分诊排序，不替代销售表现、广告 ASIN、广告组、投放词、搜索词和广告位证据；点击后进入单个 Parent ASIN 诊断链路。",
  };
}

function ProductScopePriorityDecisionSummaryPanel({
  summary,
  onOpenTop,
}: {
  summary: ProductScopePriorityDecisionSummary;
  onOpenTop: (scopeId: string) => void;
}) {
  return (
    <section className="productScopePriorityDecisionSummary" aria-label="Parent ASIN 首页分诊摘要">
      <div className="productScopePriorityDecisionHeader">
        <strong>今日先看什么</strong>
        <span>{summary.topPriorityLabel}</span>
      </div>
      <b>{summary.headline}</b>
      <p>{summary.scaleText}</p>
      <div className="productScopePriorityDecisionBuckets" aria-label="Parent ASIN 分诊桶">
        {summary.triageBuckets.map((bucket) => (
          <article className={`productScopePriorityDecisionBucket ${bucket.tone}`} key={bucket.id}>
            <div>
              <strong>{bucket.label}</strong>
              <b>{bucket.count} 个</b>
            </div>
            <p>{bucket.objectLabels.length > 0 ? bucket.objectLabels.join(" / ") : "暂无对象"}</p>
            <small>{bucket.action}</small>
          </article>
        ))}
      </div>
      <p>阅读策略：{summary.readingStrategy}</p>
      <p>排序依据：{summary.rankReason}</p>
      <p>人工下一步：{summary.nextManualStep}</p>
      <small>{summary.boundary}</small>
      <button type="button" onClick={() => onOpenTop(summary.topScopeId)} aria-label={`打开今日优先 Parent ASIN ${summary.topLabel}`}>
        打开今日优先 Parent ASIN
      </button>
    </section>
  );
}

function ProductScopePriorityEntryBridgePanel({
  item,
  adGroup,
}: {
  item: ProductScopePriorityQueueItem;
  adGroup: ProductScopeAdGroupDiagnosisRow | null;
}) {
  const adGroupReadback = adGroup
    ? `${adGroup.title} / ${adGroup.problemType} / ${adGroup.statusLabel} / ${adGroup.metrics}`
    : "暂无可聚焦广告组；先补齐广告组、投放商品、投放词、搜索词和广告位证据。";
  const adGroupFocusReason = adGroup
    ? `${adGroup.nextReviewFocus}；${adGroup.boundary}`
    : "没有广告组诊断行时，不能把 Parent ASIN 直接包装成广告组问题，也不能生成自动广告动作。";

  return (
    <section className={`productScopePriorityEntryBridge diagnosisStep ${item.tone}`} aria-label="当前 Parent ASIN 进入理由">
      <div className="detailSectionHeader">
        <h3>当前 Parent ASIN 证据路径承接</h3>
        <span>{item.priorityLabel}</span>
      </div>
      <p>
        首页摘要已回答先看谁；本区只承接证据路径，避免重复排序解释。
      </p>
      <ul>
        <li>
          <b>首页摘要读回</b>
          <span>
            {item.label} / {item.priorityLabel}
          </span>
        </li>
        <li>
          <b>证据路径</b>
          <span>Parent ASIN 经营盘 → 有广告数据的广告 ASIN → 广告组 → 投放商品 / 投放词 / 搜索词 / 广告位</span>
        </li>
        <li>
          <b>广告证据</b>
          <span>{item.evidenceSummary}</span>
        </li>
        <li>
          <b>默认聚焦广告组</b>
          <span>{adGroupReadback}</span>
        </li>
        <li>
          <b>聚焦原因</b>
          <span>{adGroupFocusReason}</span>
        </li>
        <li>
          <b>进入右侧前核对</b>
          <span>{item.nextManualStep}</span>
        </li>
      </ul>
      <small>
        {item.boundary} 下方“广告组问题定位”可切换当前广告组焦点；本区只解释进入理由，不写入人工动作，也不执行任何广告操作。
      </small>
    </section>
  );
}

function ProductScopeDiagnosisBriefPanel({ brief }: { brief: ProductScopeDiagnosisBrief }) {
  return (
    <section className={`productScopeDiagnosisBrief diagnosisStep stepSummary ${brief.statusTone}`} aria-label="Parent ASIN 运营诊断路径">
      <div className="detailSectionHeader">
        <h3>{brief.title}</h3>
        <span>{brief.statusLabel}</span>
      </div>
      <div className={`productScopeDecisionGuide ${brief.decisionGuide.tone}`} aria-label="Parent ASIN 决策导览">
        <div>
          <span>{brief.decisionGuide.title}</span>
          <strong>{brief.decisionGuide.primaryDecision}</strong>
        </div>
        <ul>
          <li>
            <b>读法</b>
            <span>{brief.decisionGuide.readPath}</span>
          </li>
          <li>
            <b>展开焦点</b>
            <span>{brief.decisionGuide.expandFocus}</span>
          </li>
          <li>
            <b>不要做</b>
            <span>{brief.decisionGuide.notToDo}</span>
          </li>
          <li>
            <b>人工下一步</b>
            <span>{brief.decisionGuide.nextManualStep}</span>
          </li>
        </ul>
      </div>
      <p className="productScopeDiagnosisBriefSummary">{brief.summary}</p>
      <div className="productScopeDiagnosisBriefPath" aria-label="运营诊断路径顺序">
        {brief.sections.map((section) => (
          <span className={section.tone} key={section.id}>
            {section.label}. {section.title}
          </span>
        ))}
        <span className="manual">人工确认 / 7-14 天复盘</span>
      </div>
      <div className="productScopeDiagnosisBriefSections">
        {brief.sections.map((section) => (
          <article className={`productScopeDiagnosisBriefSection ${section.tone}`} key={section.id}>
            <div className="productScopeDiagnosisBriefSectionHeader">
              <span>{section.label}</span>
              <div>
                <strong>{section.title}</strong>
                <p>{section.purpose}</p>
              </div>
            </div>
            <ul>
              <li>
                <b>当前判断</b>
                <span>{section.currentJudgement}</span>
              </li>
              <li>
                <b>人工下一步</b>
                <span>{section.nextManualStep}</span>
              </li>
              <li>
                <b>能证明</b>
                <span>{section.proves}</span>
              </li>
              <li>
                <b>不能证明</b>
                <span>{section.doesNotProve}</span>
              </li>
            </ul>
          </article>
        ))}
      </div>
      <div className="productScopeDiagnosisBriefActions" aria-label="允许的人工动作">
        {brief.manualActions.map((action) => (
          <span key={action}>{action}</span>
        ))}
      </div>
      <p className="productScopeDiagnosisBriefBoundary">{brief.boundary}</p>
    </section>
  );
}

function ProductScopeEvidenceRouteGuidePanel({ guide }: { guide: ProductScopeEvidenceRouteGuide }) {
  return (
    <section className="productScopeEvidenceRouteGuide diagnosisStep stepEvidence" aria-label="广告证据链导览">
      <div className="detailSectionHeader">
        <h3>{guide.title}</h3>
        <span>{guide.steps.length} 层证据</span>
      </div>
      <p className="productScopeEvidenceRouteGuideSummary">{guide.summary}</p>
      <div className={`productScopeEvidenceRouteDecision ${guide.decision.statusTone}`} aria-label="广告路径可落地判断">
        <div>
          <span>{guide.decision.title}</span>
          <strong>{guide.decision.statusLabel}</strong>
        </div>
        <p>{guide.decision.businessQuestion}</p>
        <ul>
          <li>
            <b>当前判断</b>
            <span>{guide.decision.currentJudgement}</span>
          </li>
          <li>
            <b>能证明</b>
            <span>{guide.decision.proves}</span>
          </li>
          <li>
            <b>不能证明</b>
            <span>{guide.decision.doesNotProve}</span>
          </li>
          <li>
            <b>人工下一步</b>
            <span>{guide.decision.nextManualStep}</span>
          </li>
        </ul>
      </div>
      <div className="productScopeEvidenceRouteGuideSteps">
        {guide.steps.map((step) => (
          <article className={`productScopeEvidenceRouteGuideStep ${step.tone}`} key={step.layerId}>
            <span>{step.order}</span>
            <div>
              <b>{step.label}</b>
              <strong>{step.objectLabel}</strong>
              <p>{step.primaryEvidence}</p>
              <small>{step.nextFocus}</small>
            </div>
          </article>
        ))}
      </div>
      <p className="productScopeEvidenceRouteGuideBoundary">{guide.boundary}</p>
    </section>
  );
}

function ProductScopeAdGroupDiagnosisPanel({
  rows,
  selectedId,
  onSelect,
}: {
  rows: ProductScopeAdGroupDiagnosisRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const priorityRow = rows[0];

  return (
    <section className="productScopeAdGroupDiagnosis diagnosisStep stepEvidence" aria-label="广告组问题定位">
      <div className="detailSectionHeader">
        <h3>广告组问题定位</h3>
        <span>{rows.length} 个广告组，点击聚焦</span>
      </div>
      {priorityRow && (
        <div className="productScopeAdGroupPriorityGate" aria-label="广告组优先判断">
          <div className="productScopeAdGroupDiagnosisHeader">
            <div>
              <span>优先广告组</span>
              <strong>{priorityRow.title}</strong>
            </div>
            <b>{priorityRow.statusLabel}</b>
          </div>
          <div className="productScopeAdGroupPriorityTriage" aria-label="优先广告组三段判断">
            <span>
              <b>问题类型</b>
              <small>{priorityRow.problemType}</small>
            </span>
            <span>
              <b>证据强度</b>
              <small>{priorityRow.evidenceSynthesis.statusLabel}</small>
            </span>
            <span>
              <b>人工下一步</b>
              <small>{priorityRow.problemLocator.nextManualStep}</small>
            </span>
          </div>
          <p>{priorityRow.problemLocator.problemLocation}</p>
          <ul>
            <li>
              <b>为什么先看</b>
              <span>{priorityRow.evidenceSynthesis.statusLabel}</span>
            </li>
            <li>
              <b>能证明</b>
              <span>{priorityRow.evidenceSynthesis.proves}</span>
            </li>
            <li>
              <b>不能证明</b>
              <span>{priorityRow.evidenceSynthesis.doesNotProve}</span>
            </li>
            <li>
              <b>证据缺口</b>
              <span>{priorityRow.evidenceSynthesis.evidenceGap}</span>
            </li>
          </ul>
        </div>
      )}
      <div className="productScopeAdGroupDiagnosisRows">
        {rows.map((row) => {
          const isSelected = row.id === selectedId;
          return (
            <button
              className={`productScopeAdGroupDiagnosisRow ${row.statusTone} ${isSelected ? "active" : ""}`}
              key={row.id}
              type="button"
              onClick={() => onSelect(row.id)}
              aria-pressed={isSelected}
            >
              <div className="productScopeAdGroupDiagnosisHeader">
                <div>
                  <span>{row.problemType}</span>
                  <strong>{row.title}</strong>
                </div>
                <b>{row.statusLabel}</b>
              </div>
              <div className="productScopeAdGroupDiagnosisDecision" aria-label="广告组业务判断">
                <span>
                  <b>问题类型</b>
                  <small>{row.problemType}：{row.problemLocator.problemLocation}</small>
                </span>
                <span>
                  <b>证据强度</b>
                  <small>{row.evidenceSynthesis.statusLabel}</small>
                </span>
                <span>
                  <b>人工下一步</b>
                  <small>{row.problemLocator.nextManualStep}</small>
                </span>
              </div>
              <div className="productScopeAdGroupDiagnosisMetrics" aria-label="广告组证据摘要">
                <span>{row.metrics}</span>
                <span>{row.trafficContext}</span>
              </div>
              <small>证据缺口：{row.evidenceSynthesis.evidenceGap}</small>
              <small>{row.trafficContextBoundary}</small>
              <small>{row.nextReviewFocus}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface ProductScopeTargetingEvidenceRow {
  key: string;
  targetingText: string;
  statusLabel: string;
  searchTermSamples: string;
  metrics: string;
  boundary: string;
}

function buildProductScopeTargetingEvidenceRows(row: ProductScopeAdGroupDiagnosisRow): ProductScopeTargetingEvidenceRow[] {
  const diagnosis = row.searchTermDiagnosis;
  const terms = [...(diagnosis?.effectiveTerms ?? []), ...(diagnosis?.zeroOrderTerms ?? [])];

  if (terms.length === 0) {
    return [
      {
        key: `${row.id}-targeting-gap`,
        targetingText: "等待投放词证据",
        statusLabel: "证据缺口",
        searchTermSamples: "当前广告组没有可展示的搜索词表现行",
        metrics: "缺少 keyword_text / target_id 对应的投放上下文",
        boundary: "不能判断当前广告组的投放词结构，也不能据此做加词、否词或调价。",
      },
    ];
  }

  const groups = new Map<
    string,
    {
      targetingText: string;
      effectiveCount: number;
      zeroOrderCount: number;
      samples: string[];
      metrics: string[];
      hasExplicitTargeting: boolean;
    }
  >();

  for (const term of terms) {
    const rawTargetingText = term.targetingText?.trim();
    const targetingText = rawTargetingText || "未标记投放词";
    const key = targetingText.toLowerCase();
    const group =
      groups.get(key) ??
      {
        targetingText,
        effectiveCount: 0,
        zeroOrderCount: 0,
        samples: [],
        metrics: [],
        hasExplicitTargeting: Boolean(rawTargetingText),
      };

    if (term.termTypeLabel.includes("有效")) {
      group.effectiveCount += 1;
    } else if (term.termTypeLabel.includes("零单") || term.termTypeLabel.includes("无订单")) {
      group.zeroOrderCount += 1;
    }

    if (term.label && group.samples.length < 3 && !group.samples.includes(term.label)) {
      group.samples.push(term.label);
    }
    if (term.metrics && group.metrics.length < 2 && !group.metrics.includes(term.metrics)) {
      group.metrics.push(term.metrics);
    }
    group.hasExplicitTargeting = group.hasExplicitTargeting || Boolean(rawTargetingText);
    groups.set(key, group);
  }

  return Array.from(groups.values()).map((group, index) => {
    const statusParts = [
      group.effectiveCount > 0 ? `有效搜索词 ${group.effectiveCount} 条` : null,
      group.zeroOrderCount > 0 ? `无订单花费词 ${group.zeroOrderCount} 条` : null,
    ].filter((part): part is string => Boolean(part));

    return {
      key: `${row.id}-targeting-${index}-${group.targetingText}`,
      targetingText: group.targetingText,
      statusLabel: statusParts.join(" / ") || "仅有搜索词样本",
      searchTermSamples: group.samples.length ? group.samples.join(" / ") : "暂无搜索词样本",
      metrics: group.metrics.length ? group.metrics.join("；") : "等待搜索词表现指标",
      boundary: group.hasExplicitTargeting
        ? "投放词来自搜索词表现行的 keyword_text / target_id，只说明当前广告组内投放上下文，不代表完整关键词库。"
        : "当前搜索词表现行未带出明确投放词，只能先按搜索词表现复核，不能判断关键词库覆盖。",
    };
  });
}

function ProductScopeTargetingEvidencePanel({ row }: { row: ProductScopeAdGroupDiagnosisRow }) {
  const rows = buildProductScopeTargetingEvidenceRows(row);
  const decision = row.searchTermDiagnosis?.decision ?? null;

  return (
    <div className="productScopeTargetingEvidence" aria-label="投放词证据独立复核">
      <div className="productScopeTargetingEvidenceHeader">
        <strong>投放词证据</strong>
        <span>{rows.length} 个投放上下文</span>
      </div>
      <p>当前广告组的搜索词表现来自哪些投放词或投放对象？</p>
      {decision && (
        <small>
          投放词判断：{decision.targetingEvidence}；下一步：{decision.nextManualStep}
        </small>
      )}
      <ul>
        {rows.map((item) => (
          <li key={item.key}>
            <b>{item.targetingText}</b>
            <span>{item.statusLabel}</span>
            <small>搜索词样本：{item.searchTermSamples}</small>
            <small>指标：{item.metrics}</small>
            <small>{item.boundary}</small>
          </li>
        ))}
      </ul>
      <small>
        投放词证据来自搜索词表现行的 keyword_text / target_id；SP 关键词详情和商品定向详情第一阶段仍属暂缓同步，页面不能据此自动加词、否词或调价。
      </small>
    </div>
  );
}

interface ProductScopeAdGroupChecklistItem {
  key: string;
  label: string;
  title: string;
  purpose: string;
  judgement: string;
  proves: string;
  doesNotProve: string;
  nextStep: string;
}

function buildProductScopeAdGroupChecklistItems(row: ProductScopeAdGroupDiagnosisRow): ProductScopeAdGroupChecklistItem[] {
  const targetingRows = buildProductScopeTargetingEvidenceRows(row);
  const advertisedProductText =
    row.advertisedProductPerformance.length > 0
      ? `${row.advertisedProductPerformance.length} 个投放商品；${row.advertisedProductPerformance
          .slice(0, 2)
          .map((product) => `${product.asin} ${product.metrics}`)
          .join(" / ")}`
      : "当前广告组缺少投放商品表现证据";
  const targetingText = targetingRows
    .slice(0, 2)
    .map((item) => `${item.targetingText}：${item.statusLabel}`)
    .join(" / ");
  const searchTermText = row.searchTermDiagnosis
    ? `${row.searchTermDiagnosis.termSummary}；${row.searchTermDiagnosis.decision.currentJudgement}`
    : "当前广告组缺少搜索词表现证据";

  return [
    {
      key: "advertised-products",
      label: "1",
      title: "投放商品",
      purpose: "确认当前广告组实际投放哪些广告 ASIN，而不是把 Parent ASIN 下所有变体都放进广告分析。",
      judgement: advertisedProductText,
      proves: "能证明当前广告组内有广告证据的投放商品范围和样本表现。",
      doesNotProve: "不能证明未投放子 ASIN 存在广告问题，也不能把搜索词或广告位自动归因到单个广告 ASIN。",
      nextStep: "先确认哪些 advertised_products 真的参与投放，未投放子 ASIN 只作经营背景。",
    },
    {
      key: "targeting",
      label: "2",
      title: "投放词",
      purpose: "确认搜索词表现来自哪些 keyword_text / target_id，先看投放上下文再判断搜索词表现。",
      judgement: targetingText || "等待投放词证据",
      proves: "能证明当前广告组内搜索词样本对应的投放上下文。",
      doesNotProve: "不能证明完整关键词库覆盖，也不能据此自动加词、否词或调价。",
      nextStep: "只用 keyword_text / target_id 解释投放上下文，不能当作完整关键词库。",
    },
    {
      key: "search-terms",
      label: "3",
      title: "搜索词",
      purpose: "判断用户真实搜索词在当前广告组里是扩量机会、花费浪费还是继续观察。",
      judgement: searchTermText,
      proves: row.searchTermDiagnosis?.decision.proves ?? "有搜索词表现后，才能证明搜索词层的机会、浪费或观察价值。",
      doesNotProve: row.searchTermDiagnosis?.decision.doesNotProve ?? "不能在缺少搜索词表现时自动加词、否词或归因到单个广告 ASIN。",
      nextStep: row.searchTermDiagnosis?.decision.nextManualStep ?? "补齐搜索词表现后再判断扩量、止损或观察。",
    },
    {
      key: "placements",
      label: "4",
      title: "广告位",
      purpose: "确认当前问题是否可能和 Top of Search、商品页等流量位置有关。",
      judgement: row.placementDecision.currentJudgement,
      proves: row.placementDecision.proves,
      doesNotProve: row.placementDecision.doesNotProve,
      nextStep: `${row.placementDecision.evidenceLevel}；${row.placementDecision.nextManualStep}`,
    },
  ];
}

function ProductScopeAdGroupOperationalChecklistPanel({ row }: { row: ProductScopeAdGroupDiagnosisRow }) {
  const items = buildProductScopeAdGroupChecklistItems(row);

  return (
    <div className="productScopeAdGroupChecklist" aria-label="当前广告组运营检查清单">
      <div className="productScopeAdGroupChecklistHeader">
        <strong>运营检查清单</strong>
        <span>先看证据层，再看 AI 推理</span>
      </div>
      <ol>
        {items.map((item) => (
          <li key={item.key}>
            <span>{item.label}</span>
            <div>
              <b>{item.title}</b>
              <p>{item.purpose}</p>
              <strong>{item.judgement}</strong>
              <div className="productScopeAdGroupChecklistProof">
                <span>
                  <b>能证明</b>
                  <small>{item.proves}</small>
                </span>
                <span>
                  <b>不能证明</b>
                  <small>{item.doesNotProve}</small>
                </span>
              </div>
              <small>{item.nextStep}</small>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ProductScopeAdGroupReviewOrderPanel({ row }: { row: ProductScopeAdGroupDiagnosisRow }) {
  const items = buildProductScopeAdGroupChecklistItems(row);
  const reviewPath = items.map((item) => item.title).join(" → ");

  return (
    <div className="productScopeAdGroupReviewOrder" aria-label="当前广告组复核顺序">
      <div>
        <span>先按顺序复核</span>
        <strong>{reviewPath}</strong>
      </div>
      <p>{row.problemLocator.problemLocation}</p>
      <ol>
        {items.map((item) => (
          <li key={`${item.key}-review-order`}>
            <span>{item.label}</span>
            <b>{item.title}</b>
            <small>{item.nextStep}</small>
          </li>
        ))}
      </ol>
      <small>这只是人工复核路径，不证明搜索词或广告位已归因到单个广告 ASIN，也不执行任何广告动作。</small>
    </div>
  );
}

function ProductScopeAdGroupActionBridgeCard({
  row,
  priorityItem,
}: {
  row: ProductScopeAdGroupDiagnosisRow;
  priorityItem: ProductScopePriorityQueueItem | null;
}) {
  const items = buildProductScopeAdGroupChecklistItems(row);
  const reviewPath = items.map((item) => item.title).join(" → ");
  const scopeLabel = priorityItem?.label ?? "未绑定 Parent ASIN 入口";
  const scopeReadback = priorityItem ? `${scopeLabel} / ${priorityItem.priorityLabel}` : `${scopeLabel} / 当前广告组诊断`;
  const scopeBoundary =
    priorityItem?.boundary ?? "没有 Parent ASIN 分诊来源时，右侧人工动作只保存当前广告组留痕或复盘待办。";

  return (
    <section className="adGroupActionBridgeCard" aria-label="当前广告组人工动作承接">
      <div className="adGroupActionBridgeHeader">
        <strong>当前广告组人工动作承接</strong>
        <span>{row.statusLabel}</span>
      </div>
      <p>先按中间检查清单复核，再选择右侧人工动作；复盘待办会按同一组证据回读，这里只保存人工留痕或复盘待办。</p>
      <div className="adGroupActionBridgeScope" aria-label="人工动作前核对">
        <span>动作对象：{row.title} / {row.problemType}</span>
        <span>来源读回：{scopeReadback}</span>
        <span>允许动作：记录观察 / 标记已处理 / 加入复盘 / 忽略本次</span>
        <small>
          {scopeBoundary}
          右侧只核对能否留痕或加入复盘，不重复解释 Parent ASIN 排序理由，也不执行广告操作。
        </small>
      </div>
      <div className="adGroupActionBridgePreflightEvidence" aria-label="人工点击前证据读回">
        <span>
          <b>复核顺序</b>
          <small>{reviewPath}</small>
        </span>
        <span>
          <b>证据缺口</b>
          <small>{row.evidenceSynthesis.evidenceGap}</small>
        </span>
        <span>
          <b>动作边界</b>
          <small>{row.forbiddenActions.join(" / ")}；只能人工记录或加入复盘。</small>
        </span>
      </div>
      <ul className="adGroupActionBridgeList">
        {items.map((item) => (
          <li key={item.key}>
            <span>{item.title}</span>
            <b>{item.judgement}</b>
            <small>{item.nextStep}</small>
          </li>
        ))}
      </ul>
      <div className="adGroupActionBridgeReviewEvidence" aria-label="复盘回读证据链">
        <strong>复盘回读证据链</strong>
        <p>人工动作保存后，7/14 天复盘必须沿这四层证据回看，不能只看最终指标涨跌。</p>
        <ul>
          {items.map((item) => (
            <li key={`${item.key}-review-evidence`}>
              <span>{item.title}</span>
              <b>{item.purpose}</b>
              <small>能证明：{item.proves}</small>
              <small>不能证明：{item.doesNotProve}</small>
            </li>
          ))}
        </ul>
      </div>
      <small>若证据不足，优先记录观察或加入复盘；不能自动调价、暂停、否词或加词。</small>
    </section>
  );
}

function ProductScopeAdGroupReasoningDetails({ row }: { row: ProductScopeAdGroupDiagnosisRow }) {
  return (
    <details className="productScopeAdGroupReasoningDetails" aria-label="广告组推理细节">
      <summary>
        <span>AI 推理细节</span>
        <strong>{row.evidenceSynthesis.statusLabel}</strong>
      </summary>
      <div className="productScopeAdGroupOwnership" aria-label="广告组问题归属判定">
        <div>
          <strong>{row.ownershipDecision.title}</strong>
          <span>{row.ownershipDecision.statusLabel}</span>
        </div>
        <p>{row.ownershipDecision.businessQuestion}</p>
        <ul>
          <li>
            <b>当前判断</b>
            <span>{row.ownershipDecision.currentJudgement}</span>
          </li>
          <li>
            <b>归属结论</b>
            <span>{row.ownershipDecision.issueOwner}</span>
          </li>
          <li>
            <b>证据路径</b>
            <span>{row.ownershipDecision.evidencePath}</span>
          </li>
          <li>
            <b>不能证明</b>
            <span>{row.ownershipDecision.doesNotProve}</span>
          </li>
          <li>
            <b>人工下一步</b>
            <span>{row.ownershipDecision.nextManualStep}</span>
          </li>
        </ul>
      </div>
      <div className="productScopeAdGroupProblemLocator" aria-label="广告组问题落点">
        <strong>{row.problemLocator.title}</strong>
        <p>{row.problemLocator.businessQuestion}</p>
        <ul>
          <li>
            <b>当前判断</b>
            <span>{row.problemLocator.currentJudgement}</span>
          </li>
          <li>
            <b>问题落点</b>
            <span>{row.problemLocator.problemLocation}</span>
          </li>
          <li>
            <b>为何拆开看</b>
            <span>{row.problemLocator.splitReason}</span>
          </li>
          <li>
            <b>不能证明</b>
            <span>{row.problemLocator.doesNotProve}</span>
          </li>
          <li>
            <b>人工下一步</b>
            <span>{row.problemLocator.nextManualStep}</span>
          </li>
        </ul>
      </div>
      <div className={`productScopeAdGroupEvidenceSynthesis ${row.evidenceSynthesis.tone}`} aria-label="广告组证据合流判断">
        <div>
          <strong>{row.evidenceSynthesis.title}</strong>
          <span>{row.evidenceSynthesis.statusLabel}</span>
        </div>
        <p>{row.evidenceSynthesis.businessQuestion}</p>
        <ul>
          <li>
            <b>当前判断</b>
            <span>{row.evidenceSynthesis.currentJudgement}</span>
          </li>
          <li>
            <b>证据链</b>
            <span>{row.evidenceSynthesis.evidenceChain}</span>
          </li>
          <li>
            <b>能证明</b>
            <span>{row.evidenceSynthesis.proves}</span>
          </li>
          <li>
            <b>不能证明</b>
            <span>{row.evidenceSynthesis.doesNotProve}</span>
          </li>
          <li>
            <b>证据缺口</b>
            <span>{row.evidenceSynthesis.evidenceGap}</span>
          </li>
          <li>
            <b>人工下一步</b>
            <span>{row.evidenceSynthesis.nextManualStep}</span>
          </li>
        </ul>
      </div>
      <div className="productScopeAdGroupActionability" aria-label="广告组人工复核判断">
        <strong>{row.actionableReview.title}</strong>
        <span>{row.actionableReview.evidence}</span>
        <p>{row.actionableReview.decision}</p>
        <small>{row.actionableReview.manualGate}</small>
      </div>
      <p>{row.reason}</p>
      <small>{row.nextReviewFocus}</small>
      <small>{row.boundary}</small>
    </details>
  );
}

function ProductScopeAdGroupFocusPanel({ row }: { row: ProductScopeAdGroupDiagnosisRow }) {
  return (
    <section className={`productScopeAdGroupFocus diagnosisStep stepEvidence ${row.statusTone}`} aria-label="当前广告组复核路径">
      <div className="detailSectionHeader">
        <h3>当前广告组复核路径</h3>
        <span>{row.statusLabel}</span>
      </div>
      <div className="productScopeAdGroupDiagnosisHeader">
        <div>
          <span>{row.problemType}</span>
          <strong>{row.title}</strong>
        </div>
        <b>{row.statusLabel}</b>
      </div>
      <div className="productScopeAdGroupFocusDecision" aria-label="当前广告组三段复核判断">
        <span>
          <b>问题落点</b>
          <small>{row.problemLocator.problemLocation}</small>
        </span>
        <span>
          <b>证据缺口</b>
          <small>{row.evidenceSynthesis.evidenceGap}</small>
        </span>
        <span>
          <b>人工下一步</b>
          <small>{row.problemLocator.nextManualStep}</small>
        </span>
      </div>
      <ProductScopeAdGroupReviewOrderPanel row={row} />
      <div className="productScopeAdGroupDiagnosisMetrics" aria-label="当前广告组证据摘要">
        <span>{row.metrics}</span>
        <span>{row.trafficContext}</span>
      </div>
      <small>{row.trafficContextBoundary}</small>
      <ProductScopeAdGroupOperationalChecklistPanel row={row} />
      {row.advertisedProductPerformance.length > 0 && (
        <div className="productScopeAdGroupAdvertisedProducts" aria-label="广告组内投放商品表现">
          <strong>广告组内投放商品表现</strong>
          <ul>
            {row.advertisedProductPerformance.map((product) => (
              <li key={product.key}>
                <b>{product.asin}</b>
                <span>
                  {product.msku ? `${product.msku} / ` : ""}
                  {product.metrics}
                  {product.sampleBoundary ? `；${product.sampleBoundary}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ProductScopeTargetingEvidencePanel row={row} />
      {row.searchTermDiagnosis && <ProductScopeSearchTermDiagnosisPanel rowId={row.id} diagnosis={row.searchTermDiagnosis} />}
      <div className="productScopePlacementEvidenceDecision" aria-label="广告位证据判断">
        <strong>{row.placementDecision.title}</strong>
        <p>{row.placementDecision.businessQuestion}</p>
        <ul>
          <li>
            <b>当前判断</b>
            <span>{row.placementDecision.currentJudgement}</span>
          </li>
          <li>
            <b>证据层级</b>
            <span>{row.placementDecision.evidenceLevel}</span>
          </li>
          <li>
            <b>能证明</b>
            <span>{row.placementDecision.proves}</span>
          </li>
          <li>
            <b>不能证明</b>
            <span>{row.placementDecision.doesNotProve}</span>
          </li>
          <li>
            <b>证据缺口</b>
            <span>{row.placementDecision.evidenceGap}</span>
          </li>
          <li>
            <b>人工下一步</b>
            <span>{row.placementDecision.nextManualStep}</span>
          </li>
        </ul>
      </div>
      <ProductScopeAdGroupReasoningDetails row={row} />
      <div className="productScopeAdGroupDiagnosisForbidden" aria-label="禁止的自动广告动作">
        {row.forbiddenActions.map((action) => (
          <span key={`${row.id}-${action}`}>{action}</span>
        ))}
      </div>
    </section>
  );
}

function ProductScopeCandidateGapExplanationPanel({ explanation }: { explanation: ProductScopeCandidateGapExplanation }) {
  return (
    <section className="productScopeCandidateGapExplanation diagnosisStep stepEvidence" aria-label="广告 ASIN 候选缺口解释">
      <div className="detailSectionHeader">
        <h3>{explanation.title}</h3>
        <span>{explanation.admission}</span>
      </div>
      <p className="productScopeCandidateGapSummary">{explanation.summary}</p>
      <div className="productScopeCandidateGapReasons">
        {explanation.reasons.map((reason) => (
          <span key={reason}>{reason}</span>
        ))}
      </div>
      <div className="productScopeCandidateGapNextStep">
        <strong>下一步</strong>
        <p>{explanation.nextStep}</p>
      </div>
      <small>{explanation.boundary}</small>
    </section>
  );
}

function ProductScopeSearchTermDiagnosisPanel({
  rowId,
  diagnosis,
}: {
  rowId: string;
  diagnosis: ProductScopeAdGroupDiagnosisRow["searchTermDiagnosis"];
}) {
  if (!diagnosis) return null;
  const effectiveTerms = diagnosis.effectiveTerms.length
    ? diagnosis.effectiveTerms
    : [{ label: "暂无有效词样本", termTypeLabel: "缺口", metrics: "等待搜索词证据", targetingText: null }];
  const zeroOrderTerms = diagnosis.zeroOrderTerms.length
    ? diagnosis.zeroOrderTerms
    : [{ label: "暂无零单花费词样本", termTypeLabel: "缺口", metrics: "等待搜索词证据", targetingText: null }];

  return (
    <div className="productScopeSearchTermDiagnosis" aria-label="搜索词问题定位">
      <div className="productScopeSearchTermDiagnosisHeader">
        <strong>搜索词问题定位</strong>
        <span>{diagnosis.termSummary}</span>
      </div>
      <div className="productScopeSearchTermDecision" aria-label="搜索词业务判断">
        <strong>{diagnosis.decision.title}</strong>
        <p>{diagnosis.decision.businessQuestion}</p>
        <ul>
          <li>
            <b>当前判断</b>
            <span>{diagnosis.decision.currentJudgement}</span>
          </li>
          <li>
            <b>投放词证据</b>
            <span>{diagnosis.decision.targetingEvidence}</span>
          </li>
          <li>
            <b>能证明</b>
            <span>{diagnosis.decision.proves}</span>
          </li>
          <li>
            <b>不能证明</b>
            <span>{diagnosis.decision.doesNotProve}</span>
          </li>
          <li>
            <b>人工下一步</b>
            <span>{diagnosis.decision.nextManualStep}</span>
          </li>
        </ul>
      </div>
      <div className="productScopeSearchTermColumns">
        <div>
          <b>有效搜索词</b>
          {effectiveTerms.map((term, index) => (
            <span key={`${rowId}-effective-${index}-${term.label}`}>
              <strong>{term.label}</strong>
              <small>
                {term.termTypeLabel} / {term.metrics}
              </small>
              {term.targetingText && <small>投放词：{term.targetingText}</small>}
            </span>
          ))}
        </div>
        <div>
          <b>无订单花费词</b>
          {zeroOrderTerms.map((term, index) => (
            <span key={`${rowId}-zero-${index}-${term.label}`}>
              <strong>{term.label}</strong>
              <small>
                {term.termTypeLabel} / {term.metrics}
              </small>
              {term.targetingText && <small>投放词：{term.targetingText}</small>}
            </span>
          ))}
        </div>
      </div>
      <small>{diagnosis.termBoundary}</small>
    </div>
  );
}

function ProductScopeEvidenceMatrixPanel({ matrix }: { matrix: ProductScopeEvidenceMatrix }) {
  return (
    <section className="productScopeEvidenceMatrix diagnosisStep stepEvidence" aria-label="对象证据矩阵">
      <div className="detailSectionHeader">
        <h3>{matrix.title}</h3>
        <span>{matrix.rows.length} 个证据层级</span>
      </div>
      <p className="productScopeEvidenceMatrixSummary">{matrix.summary}</p>
      <div className="productScopeEvidenceMatrixRows">
        {matrix.rows.map((row) => (
          <article className={`productScopeEvidenceMatrixRow ${row.tone}`} key={row.layerId}>
            <span>{row.layerLabel}</span>
            <strong>{row.objectLabel}</strong>
            <b>{row.evidenceLabel}</b>
            <p>{row.value}</p>
            <small>{row.detail}</small>
            <small>来源：{row.source}</small>
          </article>
        ))}
      </div>
      <p className="productScopeEvidenceMatrixBoundary">{matrix.boundary}</p>
    </section>
  );
}

function NoActionableManualGatePanel({ gate }: { gate: NoActionableManualGate }) {
  return (
    <section className="noActionableManualGate" aria-label="无候选人工动作门禁">
      <div className="noActionableManualGateHeader">
        <div>
          <h3>{gate.title}</h3>
          <span>{gate.statusLabel}</span>
        </div>
        <Ban size={18} aria-hidden="true" />
      </div>
      <strong>{gate.reason}</strong>
      <p>{gate.nextStep}</p>
      <div className="noActionablePathList" aria-label="允许的观察和下钻路径">
        {gate.allowedPaths.map((path) => (
          <span key={path}>{path}</span>
        ))}
      </div>
      <div className="noActionableForbiddenEffects" aria-label="禁止的自动广告动作">
        {gate.forbiddenEffects.map((effect) => (
          <span key={effect}>{effect}</span>
        ))}
      </div>
      <small>{gate.boundary}</small>
    </section>
  );
}

function SignalDiagnosis({
  signal,
  triageBusinessEvidenceItems = [],
  diagnosisContractItems = [],
  reviewEvidenceSnapshot = [],
  reviewEvidenceSnapshotTitle = null,
  reviewEvidenceSnapshotSource = null,
  reviewEvidenceSnapshotBoundary = null,
}: {
  signal: AiSignal;
  triageBusinessEvidenceItems?: SignalTriageBusinessEvidenceItem[];
  diagnosisContractItems?: SignalTriageDiagnosisContractItem[];
  reviewEvidenceSnapshot?: Array<{ label: string; value: string; detail?: string | null; source?: string | null }>;
  reviewEvidenceSnapshotTitle?: string | null;
  reviewEvidenceSnapshotSource?: string | null;
  reviewEvidenceSnapshotBoundary?: string | null;
}) {
  const metrics = signal.evidence.metrics;
  const decisionBoundary = signalDecisionBoundary(signal);
  const triageRationale = buildSignalTriageRationale(signal);
  const triggerRationale = buildSignalTriggerRationale(signal);
  const evidenceSupport = buildSignalEvidenceSupport(signal);
  const impactScope = signalImpactScope(signal);
  const impactTags = signal.tags.join(" / ") || "等待真实快照补充";
  const diagnosticScope = buildSignalDiagnosticScope(signal);
  const objectContext = buildSignalObjectContext(signal, signal.evidence.primary_object);
  const [evidenceSourceFilter, setEvidenceSourceFilter] = useState("all");
  const [evidenceDrilldownKey, setEvidenceDrilldownKey] = useState<string | null>(null);
  const evidenceSourceOptions = useMemo(() => buildEvidenceSourceOptions(signal.evidence.facts), [signal.evidence.facts]);
  const selectedEvidenceSource = evidenceSourceOptions.some((option) => option.sourceType === evidenceSourceFilter)
    ? evidenceSourceFilter
    : "all";
  const evidenceRouteNodes = useMemo(() => buildEvidenceRouteNodes(signal.evidence.facts), [signal.evidence.facts]);
  const visibleEvidenceFacts = useMemo(
    () => filterEvidenceBySource(signal.evidence.facts, selectedEvidenceSource),
    [selectedEvidenceSource, signal.evidence.facts],
  );
  const evidenceDrilldownSections = useMemo(() => buildEvidenceDrilldownSections(signal.evidence.facts), [signal.evidence.facts]);
  const activeEvidenceDrilldownSection = useMemo(
    () => evidenceDrilldownSections.find((section) => section.key === evidenceDrilldownKey) ?? evidenceDrilldownSections[0] ?? null,
    [evidenceDrilldownKey, evidenceDrilldownSections],
  );
  const keyEvidenceFacts = useMemo(() => buildKeyEvidenceFacts(signal.evidence.facts, 3, signal), [signal]);
  const adProductComparisonRows = useMemo(
    () => buildAdProductComparisonRows(signal.object_type, signal.signal_category, signal.evidence.source_rows),
    [signal.object_type, signal.signal_category, signal.evidence.source_rows],
  );
  const triageDiagnosisPathItems = useMemo(
    () => signalTriageDiagnosisPathItems(triageBusinessEvidenceItems),
    [triageBusinessEvidenceItems],
  );
  const metricDecisionItems = useMemo(
    () => buildSignalMetricDecisionItems(metrics, diagnosisContractItems),
    [metrics, diagnosisContractItems],
  );
  const diagnosisEvidenceSummary = useMemo(
    () => buildSignalDiagnosisEvidenceSummary(signal, diagnosisContractItems),
    [diagnosisContractItems, signal],
  );
  const searchTermOpportunityReviewChain = useMemo(
    () => buildSearchTermOpportunityReviewChain(diagnosisContractItems, triageBusinessEvidenceItems),
    [diagnosisContractItems, triageBusinessEvidenceItems],
  );
  const searchTermAdContextRows = useMemo(() => buildSearchTermAdContextRows(signal), [signal]);

  useEffect(() => {
    setEvidenceSourceFilter("all");
  }, [signal.id]);

  useEffect(() => {
    if (evidenceDrilldownSections.length === 0) {
      if (evidenceDrilldownKey !== null) setEvidenceDrilldownKey(null);
      return;
    }
    if (!evidenceDrilldownSections.some((section) => section.key === evidenceDrilldownKey)) {
      setEvidenceDrilldownKey(evidenceDrilldownSections[0].key);
    }
  }, [evidenceDrilldownKey, evidenceDrilldownSections]);

  return (
    <>
      <div className="detailTitle diagnosisStep stepConclusion">
        <SignalPill signal={signal} />
        <h2>{signal.summary}</h2>
        <p>{signal.why}</p>
      </div>

      <section className="diagnosticScope" aria-label="诊断主视角">
        <div>
          <h3>诊断主视角</h3>
          <span>{diagnosticScope.label}</span>
        </div>
        <p>{diagnosticScope.boundary}</p>
      </section>

      {decisionBoundary && (
        <section className="decisionBoundary">
          <h3>判断边界</h3>
          <strong>{decisionBoundary}</strong>
          <p>这类信号先说明当前对象层级能判断什么、不能判断什么；广告动作仍必须人工确认。</p>
        </section>
      )}

      <section className="objectContext" aria-label="对象上下文">
        <div className="objectLine">
          <span>{objectTypeLabel[signal.object_type]}</span>
          <strong>{signal.evidence.primary_object.label}</strong>
        </div>
        <p>{objectContext.boundary}</p>
        {objectContext.reviewPath && (
          <div className="objectReviewPath" aria-label="对象复核路径">
            <span>{objectContext.reviewPath.label}</span>
            <b>{objectContext.reviewPath.value}</b>
            <p>{objectContext.reviewPath.detail}</p>
          </div>
        )}
        {objectContext.items.length > 0 && (
          <div className="objectContextGrid">
            {objectContext.items.map((item) => (
              <span key={`${item.label}-${item.value}`}>
                {item.label}：{item.value}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="signalMetaLine">
        <span>店铺：{signal.shop_name ?? signal.shop_id}</span>
        <span>站点：{signal.marketplace ?? "未知"}</span>
        <span>优先级：{signal.priority}</span>
        <span>置信度：{confidenceLabel[signal.confidence]}</span>
        <span>来源：{freshnessLabel[signal.freshness_status]}</span>
      </div>

      <div className="metricsRow metricDecisionRow" aria-label="关键指标判断目的">
        {metricDecisionItems.map((item) => (
          <MetricDecisionCell key={item.label} item={item} />
        ))}
      </div>

      <section className="detailSection diagnosisReason diagnosisStep stepReason" aria-label="原因">
        <div className="detailSectionHeader">
          <h3>原因</h3>
          <span>{evidenceSupport.sourceSummary}</span>
        </div>
        <p>{triggerRationale.triggerRule}</p>
        <p>{triggerRationale.objectRule}</p>
        <p>{evidenceSupport.confidenceReason}</p>
        {evidenceSupport.supportWarning && <p>{evidenceSupport.supportWarning}</p>}
      </section>

      {triageDiagnosisPathItems.length > 0 && <DiagnosisPathPanel items={triageDiagnosisPathItems} />}

      {diagnosisContractItems.length > 0 && (
        <DiagnosisContractPanel items={diagnosisContractItems} summary={diagnosisEvidenceSummary} />
      )}

      {searchTermOpportunityReviewChain && (
        <SearchTermOpportunityReviewChainPanel chain={searchTermOpportunityReviewChain} adContextRows={searchTermAdContextRows} />
      )}

      {reviewEvidenceSnapshot.length > 0 && (
        <section className="reviewEvidenceSnapshotPanel diagnosisStep stepEvidence" aria-label="复盘点击时证据快照">
          <div className="detailSectionHeader">
            <h3>{reviewEvidenceSnapshotTitle ?? "复盘证据快照"}</h3>
            <span>
              {reviewEvidenceSnapshot.length} 条 / {reviewEvidenceSnapshotSource ?? "来源待确认"}
            </span>
          </div>
          {reviewEvidenceSnapshotBoundary && <p>{reviewEvidenceSnapshotBoundary}</p>}
          <div className="reviewEvidenceSnapshotGrid">
            {reviewEvidenceSnapshot.map((item, index) => (
              <div key={`${item.label}-${item.value}-${index}`}>
                <span>{item.source ?? "点击时证据"}</span>
                <strong>
                  {evidenceFactDisplayLabel(item.label)}：{item.value}
                </strong>
                {item.detail && <p>{item.detail}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="evidenceWorkbench diagnosisStep stepEvidence" aria-label="证据链">
        <div className="detailSectionHeader">
          <h3>证据链</h3>
          <span>
            {evidenceRouteNodes.length} 个来源 / {signal.evidence.facts.length} 条证据
          </span>
        </div>
        <div className="evidenceWorkbenchSummary" aria-label="证据链摘要">
          <span>
            <b>来源覆盖</b>
            {evidenceSupport.sourceSummary}
          </span>
          <span>
            <b>触发证据</b>
            {triggerEvidenceCountText(keyEvidenceFacts.length)}
          </span>
          <span>
            <b>当前筛选</b>
            {visibleEvidenceFacts.length}/{signal.evidence.facts.length} 条
          </span>
        </div>
        {triageBusinessEvidenceItems.length > 0 && (
          <div className="triageBusinessEvidenceStrip" aria-label="推荐对象业务证据">
            {triageBusinessEvidenceItems.map((item) => (
              <span key={item.blockId}>
                <b>{item.label}</b>
                <strong>{item.value}</strong>
                {item.detail && <small>{item.detail}</small>}
              </span>
            ))}
          </div>
        )}

        {evidenceRouteNodes.length > 0 && (
          <div className="evidenceRoute" aria-label="AI 推理路径">
            <div className="evidenceRouteTrack">
              {evidenceRouteNodes.map((node, index) => (
                <div className={`evidenceRouteNode ${node.status === "待复核" ? "pending" : ""}`} key={node.sourceType}>
                  <span>{index + 1}</span>
                  <strong>{node.label}</strong>
                  <p>
                    {node.count} 条证据 / {node.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {keyEvidenceFacts.length > 0 && (
          <div className="keyEvidence">
            <div className="detailSectionHeader">
              <h3>触发证据</h3>
              <span>{triggerEvidenceCountText(keyEvidenceFacts.length)}</span>
            </div>
            <div className="keyEvidenceGrid">
              {keyEvidenceFacts.map((fact, index) => (
                <div key={`${fact.label}-${fact.value}-${index}`}>
                  <span>{fact.source_type ?? "未知来源"}</span>
                  <strong>
                    {evidenceFactDisplayLabel(fact.label)}：{fact.value}
                  </strong>
                  <p>{fact.explanation ?? fact.note ?? fact.time_range ?? "等待补充解释"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeEvidenceDrilldownSection && (
          <div className="evidenceDrilldown" aria-label="商品证据下钻">
            <div className="detailSectionHeader">
              <h3>商品下钻</h3>
              <span>{evidenceDrilldownSections.length} 类</span>
            </div>
            <div className="drilldownTabs" role="tablist" aria-label="商品证据下钻切换">
              {evidenceDrilldownSections.map((section) => (
                <button
                  type="button"
                  role="tab"
                  key={section.key}
                  aria-selected={section.key === activeEvidenceDrilldownSection.key}
                  className={section.key === activeEvidenceDrilldownSection.key ? "active" : ""}
                  onClick={() => setEvidenceDrilldownKey(section.key)}
                >
                  {section.label}
                  <span>{section.facts.length}</span>
                </button>
              ))}
            </div>
            <div className="drilldownPanel" role="tabpanel">
              <p className="drilldownDescription">{activeEvidenceDrilldownSection.description}</p>
              {activeEvidenceDrilldownSection.facts.map((fact, index) => (
                <div key={`${activeEvidenceDrilldownSection.key}-${fact.label}-${fact.value}-${index}`} className="drilldownFact">
                  <span>{fact.source_type ?? "未知来源"}</span>
                  <strong>
                    {evidenceFactDisplayLabel(fact.label)}：{fact.value}
                  </strong>
                  <p>{fact.explanation ?? fact.note ?? fact.time_range ?? "等待补充解释"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {adProductComparisonRows.length > 0 && (
          <div className="adProductComparison" aria-label="广告商品对比">
            <div className="detailSectionHeader">
              <h3>广告商品对比</h3>
              <span>{adProductComparisonRows.length} 个广告商品</span>
            </div>
            <div className="adProductComparisonGrid">
              {adProductComparisonRows.map((row) => (
                <div key={`${row.asin}-${row.msku}-${row.sourceRecordId}`} className="adProductComparisonRow">
                  <div className="adProductIdentity">
                    <span>广告商品</span>
                    <strong>{row.product}</strong>
                    <p>{row.msku || "来自当前 SP 广告商品快照"}</p>
                  </div>
                  <div className="adProductMetrics">
                    <MetricCell label="花费" value={formatMoney(row.spend)} />
                    <MetricCell label="订单" value={String(row.orders)} />
                    <MetricCell label="销售额" value={formatMoney(row.sales)} />
                    <MetricCell label="ACOS" value={formatPercent(row.acos)} />
                    <MetricCell label="CVR" value={formatPercent(row.cvr)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="evidenceLedger">
          <div className="detailSectionHeader">
            <h3>完整证据</h3>
            <span>
              {visibleEvidenceFacts.length}/{signal.evidence.facts.length} 条
            </span>
          </div>
          <div className="evidenceSourceTabs" aria-label="证据来源筛选">
            {evidenceSourceOptions.map((option) => (
              <button
                type="button"
                key={option.sourceType}
                className={option.sourceType === selectedEvidenceSource ? "active" : ""}
                onClick={() => setEvidenceSourceFilter(option.sourceType)}
              >
                {option.label}
                <span>{option.count}</span>
              </button>
            ))}
          </div>
          <div className="evidenceTimeline">
            {visibleEvidenceFacts.map((fact, index) => (
              <div key={`${fact.label}-${fact.value}-${index}`}>
                <span>
                  {fact.source_type ?? "未知来源"} / {fact.time_range ?? "周期未知"}
                </span>
                <strong>
                  {evidenceFactDisplayLabel(fact.label)}：{fact.value}
                </strong>
                <p>{fact.explanation ?? fact.note ?? evidenceFactDisplayLabel(fact.label)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="detailSection impactScope diagnosisStep stepImpact">
        <h3>影响范围</h3>
        <p>{impactScope}</p>
        <div className="impactScopeMeta">
          <span>{objectTypeLabel[signal.object_type]}</span>
          <span>{impactTags}</span>
        </div>
      </section>

      <section className="detailSection uncertaintySection diagnosisStep stepUncertainty">
        <h3>反证或不确定性</h3>
        <p>{signal.uncertainty}</p>
      </section>

      <details className="diagnosisRuleDetails">
        <summary>辅助口径</summary>
        <div className="diagnosisRuleDetailsBody">
          <section className="detailSection" aria-label="分诊口径">
            <div className="detailSectionHeader">
              <h3>分诊口径</h3>
              <span>{triageRationale.queueLabel}</span>
            </div>
            <p>{triageRationale.queueReason}</p>
            <p>{triageRationale.priorityReason}</p>
            <p>{triageRationale.statusReason}</p>
            <p>{triageRationale.reviewBoundary}</p>
            <p>{triageRationale.reviewRuleFeedback}</p>
          </section>

          <section className="detailSection" aria-label="触发口径">
            <div className="detailSectionHeader">
              <h3>触发口径</h3>
              <span>{signal.signal_category}</span>
            </div>
            <p>{triggerRationale.evidenceRule}</p>
            <p>{triggerRationale.confidenceBoundary}</p>
            <p>{triggerRationale.actionBoundary}</p>
          </section>

          <section className="detailSection" aria-label="证据支撑">
            <div className="detailSectionHeader">
              <h3>证据支撑</h3>
              <span>{evidenceSupport.sourceSummary}</span>
            </div>
            <p>{evidenceSupport.severityReason}</p>
          </section>
        </div>
      </details>
    </>
  );
}

function SignalPill({ signal }: { signal: AiSignal }) {
  const kind = signalQueueKind(signal);
  const Icon = kind === "opportunity_expansion" ? Sparkles : kind === "data_quality" ? FileWarning : kind === "review" ? ClipboardList : AlertTriangle;
  const tone = kind === "opportunity_expansion" ? "opportunity" : kind === "data_quality" ? "data_quality" : "anomaly";

  return (
    <span className={`signalPill ${tone}`}>
      <Icon size={14} />
      {signalQueueKindLabel(kind)}
    </span>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetricDecisionCell({ item }: { item: SignalMetricDecisionItem }) {
  return (
    <div className="metricDecisionCell">
      <span>{item.label}</span>
      <strong>{item.value}</strong>
      <small>服务判断：{item.purpose}</small>
      <small>能证明：{item.proves}</small>
      <small>不能证明：{item.doesNotProve}</small>
      <small>人工下一步：{item.nextManualStep}</small>
    </div>
  );
}

function ReviewRepairSampleItem({ item }: { item: string }) {
  const sections = buildReviewRepairSampleSections(item);
  return (
    <div className="reviewRepairSampleItem">
      <strong>{sections.primary}</strong>
      {sections.meta.length > 0 && (
        <div className="reviewRepairSampleMeta">
          {sections.meta.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </div>
      )}
      <ReviewRepairSampleSection title="证据缺口 / 预检" items={sections.evidence} />
      <ReviewRepairSampleSection title="作废计划" items={sections.voidPlan} />
      <ReviewRepairSampleSection title="授权与命令" items={sections.commands} code />
    </div>
  );
}

function ReviewRepairSampleSection({ title, items, code = false }: { title: string; items: string[]; code?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div className="reviewRepairSampleSection">
      <span>{title}</span>
      <div>
        {items.map((part) => (
          code ? <code key={part}>{part}</code> : <p key={part}>{part}</p>
        ))}
      </div>
    </div>
  );
}

function buildReviewRepairSampleSections(item: string) {
  const parts = item
    .split("；")
    .map((part) => part.trim())
    .filter(Boolean);
  const [primary = item, ...rest] = parts;
  const meta = rest.filter((part, index) => index < 2 || part.startsWith("动作 "));
  const details = rest.filter((part, index) => index >= 2 && !part.startsWith("动作 "));
  const commands = details.filter(isReviewRepairCommandText);
  const voidPlan = details.filter((part) => !isReviewRepairCommandText(part) && isReviewRepairVoidPlanText(part));
  const evidence = details.filter((part) => !isReviewRepairCommandText(part) && !isReviewRepairVoidPlanText(part));
  return { primary, meta, evidence, voidPlan, commands };
}

function isReviewRepairCommandText(part: string) {
  return (
    part.startsWith("授权码") ||
    part.startsWith("dry-run：") ||
    part.startsWith("execute ") ||
    part.startsWith("先 dry-run") ||
    part.startsWith("该动作")
  );
}

function isReviewRepairVoidPlanText(part: string) {
  return (
    part.startsWith("dry-run 可预检") ||
    part.startsWith("真实作废") ||
    part.startsWith("作废对象") ||
    part.startsWith("复盘窗口") ||
    part.startsWith("作废后") ||
    part.startsWith("重新留痕")
  );
}

function evidenceFactDisplayLabel(label: string) {
  if (label === "语义组" || label === "搜索意图分组" || label === "广告搜索词聚合上下文" || label === "Parent ASIN 搜索词表现聚合") {
    return "搜索词表现分组";
  }
  return label;
}

function EmptyState({ icon, title, description }: { icon: "loading" | "warning" | "empty"; title: string; description?: string }) {
  const Icon = icon === "warning" ? FileWarning : icon === "loading" ? Clock3 : ShieldCheck;
  return (
    <div className={`emptyState ${icon}`}>
      <Icon size={20} />
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}
