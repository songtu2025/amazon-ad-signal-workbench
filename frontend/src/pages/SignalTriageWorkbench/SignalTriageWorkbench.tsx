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
  ReviewRecord,
  ReviewTodo,
  SearchIntentSummary,
  SnapshotInspectionResult,
  SignalScanSummary,
  SignalTriageSummary,
  SignalType,
  SnapshotReadiness,
  SnapshotStatus,
  createSignalManualAction,
  createSignalReviewRecord,
  fetchManualActionPreflight,
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
  buildReviewRecordRequestPayload,
  buildRuleFeedbackCandidate,
  buildManualActionDisplayEvidenceSnapshot,
  buildManualActionEvidenceSnapshot,
  buildManualActionPostWritePreflightRequest,
  buildManualActionRequestPayload,
  buildSignalManualActionEvidenceSnapshot,
  mergeManualActionEvidenceSnapshots,
  canSaveReviewEffect,
  buildReviewRecordReadbackExpectation,
  buildReviewRecordReadbackTarget,
  filterReviewTodosByProductScope,
  manualActionBoundaryText,
  manualActionEvidenceReasonText,
  manualActionEvidenceSnapshotText,
  manualActionIntentText,
  manualActionPostWriteExpectationSummaryText,
  manualActionPostWritePreflightReadErrorText,
  manualActionPostWriteReadbackMessage,
  buildManualReviewClosureLedger,
  manualActionButtonGate,
  manualActionPostWriteContractItems,
  manualActionWriteGuardMessage,
  manualActionPreflightEvidenceRows,
  manualActionPreflightEvidenceSnapshotText,
  manualActionPreflightStatusText,
  manualActionReadbackCompactText,
  manualActionReadbackConsistencyText,
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
  selectManualActionsForSignal,
  selectNextReviewTodo,
  selectReviewTodosForSignal,
} from "./reviewUi";
import {
  buildAdProductComparisonRows,
  buildEvidenceDrilldownSections,
  buildEvidenceRouteNodes,
  buildEvidenceSourceOptions,
  buildKeyEvidenceFacts,
  buildProductScopeGroupOverview,
  buildProductScopeFirstScreenSummary,
  buildProductScopeAnalysisPath,
  buildProductScopeEntryGuidance,
  buildProductScopeOptionGroups,
  buildProductScopeAdmissionCard,
  buildProductScopeEvidenceMatrix,
  buildNoActionableManualGate,
  buildManualActionCandidateAdGroupBridge,
  buildProductScopeQueueHeader,
  buildProductScopeSelectionSummary,
  buildProductScopeCandidateGapExplanation,
  buildProductScopeSignalExplanation,
  buildBackendRecommendedManualActionCandidate,
  buildNextUnhandledManualActionCandidate,
  buildRecommendedManualActionCandidate,
  buildDiagnosisContextSummary,
  buildDiagnosisPathSummary,
  buildSearchIntentReviewCards,
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
  recommendedManualStatusText,
  recommendedManualActionCardCopy,
  recommendedEvidenceDrilldownText,
  nextUnhandledEvidenceDrilldownText,
  manualActionPreviewForSelectedSignal,
  manualActionTargetSummary,
  buildRuleFeedbackPrioritySummary,
  buildReviewReadinessGateSummary,
  resolveSignalSelectionId,
  signalTriageCompactItems,
  signalTriageBlockerTexts,
  signalTriageBusinessEvidenceItems,
  signalTriageDiagnosisPathItems,
  signalTriageDepthText,
  signalTriageLayerText,
  signalTriageReviewFeedbackText,
  signalTriageSummaryText,
  ProductScopeAdmissionCard,
  ProductScopeAdGroupDiagnosisRow,
  ProductScopeEvidenceMatrix,
  ProductScopeEvidenceRouteGuide,
  NoActionableManualGate,
  ProductScopeCandidateGapExplanation,
  DiagnosisContextSummary,
  DiagnosisPathSummary,
  SignalTriageBusinessEvidenceItem,
  SignalTriageDiagnosisPathItem,
  triggerEvidenceCountText,
  filterEvidenceBySource,
  filterSignalsBySearchIntent,
  filterSignalsByProductScope,
  mergeBackendTriageSignals,
  isActionableProductScope,
  preferredProductScopeId,
  productScopeOptionLabel,
  productScopeAdGroupDiagnosisRows,
  productScopeDrilldownEvidenceItems,
  buildProductScopeEvidenceRouteGuide,
  signalCategoryLabel,
  signalDecisionBoundary,
  signalImpactScope,
  signalQueueKind,
  signalScopedStateKey,
  signalStatusOverrideKey,
} from "./signalUi";

const objectTypeLabel: Record<string, string> = {
  ad_group: "广告组",
  sales_product: "销售商品",
  advertised_product: "广告商品",
  search_term: "搜索词",
  placement: "广告位",
  search_intent: "语义聚合",
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

type QueueFilter = "all" | "high" | SignalType | "data_quality" | "observing";

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
  const [searchIntents, setSearchIntents] = useState<SearchIntentSummary[]>([]);
  const [marketOptions, setMarketOptions] = useState<MarketOption[]>([]);
  const [productScope, setProductScope] = useState<ProductScopeSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const [savingManualAction, setSavingManualAction] = useState(false);
  const [savingReviewRecord, setSavingReviewRecord] = useState(false);
  const [manualActionMessage, setManualActionMessage] = useState<string | null>(null);
  const [reviewTodoMessage, setReviewTodoMessage] = useState<string | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<number>(defaultMarketId);
  const [selectedProductScopeId, setSelectedProductScopeId] = useState<string | null>(null);
  const [selectedSearchIntentLabel, setSelectedSearchIntentLabel] = useState<string | null>(null);
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
        nextSearchIntents,
        nextReviewTodos,
      ] = await Promise.all([
        fetchMarketOptions(),
        fetchProductScope(),
        fetchSignals(selectedMarketId),
        fetchSnapshotStatus(),
        fetchSnapshotReadiness(selectedMarketId),
        fetchSnapshotInspection(),
        fetchSignalScanSummary(selectedMarketId),
        fetchSearchIntents(),
        fetchReviewTodos(selectedMarketId),
      ]);
      const nextProductScopeOptions = nextProductScope.options;
      const nextActiveProductScopeId =
        selectedProductScopeId !== null && nextProductScopeOptions.some((option) => option.scope_id === selectedProductScopeId)
          ? selectedProductScopeId
          : preferredProductScopeId(nextProductScopeOptions);
      const nextProductScopedSignals = filterSignalsByProductScope(nextSignals, nextActiveProductScopeId, nextProductScopeOptions);
      const nextSignalTriageSummary = await fetchSignalTriageSummary(selectedMarketId, 5, nextActiveProductScopeId);
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
      setReviewTodos(nextReviewTodos);
      setSelectedId((current) => resolveSignalSelectionId(current, nextDisplayProductScopedSignals, nextSignalTriageSummary));
      if (nextMarketOptions.length > 0 && !nextMarketOptions.some((option) => option.market_id === selectedMarketId)) {
        setSelectedMarketId(nextMarketOptions[0].market_id);
      }
      if (selectedProductScopeId !== null && !nextProductScope.options.some((option) => option.scope_id === selectedProductScopeId)) {
        setSelectedProductScopeId(null);
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
          label: "正在读取经营商品入口",
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

  useEffect(() => {
    if (loading) return;
    void fetchSignalTriageSummary(selectedMarketId, 5, activeProductScopeId)
      .then((nextSignalTriageSummary) => {
        setSignalTriageSummary(nextSignalTriageSummary);
        const nextDisplayProductScopedSignals = mergeBackendTriageSignals(
          productScopedSignals,
          normalizedSignals,
          nextSignalTriageSummary,
        );
        setSelectedId((current) => resolveSignalSelectionId(current, nextDisplayProductScopedSignals, nextSignalTriageSummary));
      })
      .catch(() => setError("后端服务未连接"));
  }, [activeProductScopeId, loading, normalizedSignals, productScopedSignals, selectedMarketId]);
  const backendRecommendedManualActionCandidate = useMemo(
    () => buildBackendRecommendedManualActionCandidate(normalizedSignals, signalTriageSummary),
    [normalizedSignals, signalTriageSummary],
  );
  const nextUnhandledManualActionCandidate = useMemo(
    () => buildNextUnhandledManualActionCandidate(normalizedSignals, signalTriageSummary),
    [normalizedSignals, signalTriageSummary],
  );
  const recommendedManualStatus = useMemo(() => recommendedManualStatusText(signalTriageSummary), [signalTriageSummary]);
  const recommendedManualActionCopy = useMemo(() => recommendedManualActionCardCopy(signalTriageSummary), [signalTriageSummary]);
  const triageCompactItems = useMemo(() => signalTriageCompactItems(signalTriageSummary), [signalTriageSummary]);
  const recommendedTriageBusinessEvidenceItems = useMemo(() => signalTriageBusinessEvidenceItems(signalTriageSummary, "recommended"), [signalTriageSummary]);
  const nextUnhandledTriageBusinessEvidenceItems = useMemo(() => signalTriageBusinessEvidenceItems(signalTriageSummary, "next_unhandled"), [signalTriageSummary]);
  const productScopeDrilldownEvidence = useMemo(() => productScopeDrilldownEvidenceItems(signalTriageSummary), [signalTriageSummary]);
  const productScopeAdGroupDiagnosis = useMemo(() => productScopeAdGroupDiagnosisRows(signalTriageSummary), [signalTriageSummary]);
  const productScopeAdmissionCard = useMemo(() => buildProductScopeAdmissionCard(signalTriageSummary), [signalTriageSummary]);
  const noActionableManualGate = useMemo(() => buildNoActionableManualGate(signalTriageSummary), [signalTriageSummary]);
  const searchIntentReviewCards = useMemo(() => buildSearchIntentReviewCards(searchIntents), [searchIntents]);
  const triageReviewFeedbackText = useMemo(() => signalTriageReviewFeedbackText(signalTriageSummary), [signalTriageSummary]);
  const reviewReadinessGateSummary = useMemo(() => buildReviewReadinessGateSummary(signalTriageSummary), [signalTriageSummary]);
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

  const queueFilteredSignals = useMemo(() => {
    if (filter === "all") return displayProductScopedSignals;
    if (filter === "high") return displayProductScopedSignals.filter((signal) => signal.severity >= 4);
    if (filter === "observing") return displayProductScopedSignals.filter((signal) => signal.status === "observing");
    return displayProductScopedSignals.filter((signal) => signalQueueKind(signal) === filter);
  }, [displayProductScopedSignals, filter]);
  const filteredSignals = useMemo(
    () => filterSignalsBySearchIntent(queueFilteredSignals, selectedSearchIntentLabel),
    [queueFilteredSignals, selectedSearchIntentLabel],
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
  const selectedTriageBusinessEvidenceItems =
    selectedSignal?.id && selectedSignal.id === signalTriageSummary?.recommended_candidate?.signal_id
      ? recommendedTriageBusinessEvidenceItems
      : selectedSignal?.id && selectedSignal.id === signalTriageSummary?.next_unhandled_candidate?.signal_id
        ? nextUnhandledTriageBusinessEvidenceItems
        : [];
  const selectedBackendManualActionPreview = canRecommendManualActionInCurrentScope
    ? manualActionPreviewForSelectedSignal(selectedSignal?.id, signalTriageSummary, selectedSignal)
    : null;
  const selectedManualActionTargetSummary = useMemo(
    () => manualActionTargetSummary(selectedBackendManualActionPreview),
    [selectedBackendManualActionPreview],
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

  function handleSelectSearchIntent(intentLabel: string) {
    setSelectedSearchIntentLabel((current) => (current === intentLabel ? null : intentLabel));
    setFilter("opportunity");
    let nextSignals = filterSignalsBySearchIntent(displayProductScopedSignals, intentLabel);
    if (nextSignals.length === 0) {
      const allScope = productScopeOptions.find((option) => option.scope_id === "all");
      const allScopedSignals = filterSignalsBySearchIntent(normalizedSignals, intentLabel);
      if (allScope && allScopedSignals.length > 0) {
        setSelectedProductScopeId(allScope.scope_id);
        nextSignals = allScopedSignals;
      }
    }
    if (nextSignals.length > 0) {
      setSelectedId(nextSignals[0].id);
    }
  }

  function handleOpenProductScopeEvidenceDrilldown() {
    setSelectedSearchIntentLabel(null);
    setFilter("all");
    setIsEvidenceDrilldownFocused(true);
    window.requestAnimationFrame(() => {
      workbenchGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      workbenchGridRef.current?.focus();
    });
  }

  const nextReviewTodoReadback = reviewTargetReadbackText(nextReviewTodo);
  const hasReviewTodoForSelectedObject = selectedReviewTodos.length > 0;
  const nextReviewObjectLabel = nextReviewTodo?.object_label ?? nextReviewTodo?.object_id ?? "对象待补充";
  const selectedReviewEffect = selectedSignalStateKey ? reviewEffectsBySignal[selectedSignalStateKey] ?? null : null;
  const selectedReviewEffectReadback = reviewEffectTargetReadbackText(selectedReviewEffect);
  const selectedReviewEffectWindowText = reviewEffectWindowText(selectedReviewEffect);
  const nextReviewTodoEvidenceText = manualActionEvidenceSnapshotText(nextReviewTodo);
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
  const selectedManualActionReadbackConsistency = manualActionReadbackConsistencyText(
    latestManualAction,
    selectedReviewTodos,
    selectedReviewRecords,
    selectedReviewRecordReadbackExpectation,
  );
  const selectedManualActionReadbackCompact = manualActionReadbackCompactText(latestManualAction, selectedReviewTodos, selectedReviewRecords);
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
  const selectedManualActionPreflightText = manualActionPreflightError ?? manualActionPreflightStatusText(manualActionPreflight);
  const selectedManualActionPreflightEvidenceText = manualActionPreflightEvidenceSnapshotText(manualActionPreflight);
  const selectedManualActionPreflightEvidenceRows = useMemo(
    () => manualActionPreflightEvidenceRows(manualActionPreflight),
    [manualActionPreflight],
  );
  const selectedManualActionPostWriteContractItems = useMemo(
    () => manualActionPostWriteContractItems(manualActionPreflight),
    [manualActionPreflight],
  );
  const selectedManualActionPreflightTone =
    manualActionPreflightError || manualActionPreflight?.status === "blocked" ? "blocked" : manualActionPreflight ? "ready" : "loading";
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
      selectedSearchIntentLabel && filterSignalsBySearchIntent([selectedSignal], selectedSearchIntentLabel).length > 0
        ? selectedSearchIntentLabel
        : null;
    return buildSignalManualActionEvidenceSnapshot(selectedSignal, scopedIntentLabel);
  }, [selectedSearchIntentLabel, selectedSignal]);
  const selectedManualActionEvidenceSnapshot = useMemo(
    () => mergeManualActionEvidenceSnapshots(selectedSearchIntentManualActionEvidenceSnapshot, selectedBaseManualActionEvidenceSnapshot),
    [selectedBaseManualActionEvidenceSnapshot, selectedSearchIntentManualActionEvidenceSnapshot],
  );
  const selectedDisplayManualActionEvidenceSnapshot = useMemo(
    () =>
      buildManualActionDisplayEvidenceSnapshot({
        fallbackEvidenceSnapshot: selectedManualActionEvidenceSnapshot,
        preflight: manualActionPreflight,
      }),
    [manualActionPreflight, selectedManualActionEvidenceSnapshot],
  );
  const selectedManualActionEvidenceReason = useMemo(
    () => manualActionEvidenceReasonText(selectedDisplayManualActionEvidenceSnapshot),
    [selectedDisplayManualActionEvidenceSnapshot],
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
      return;
    }
    let cancelled = false;
    setManualActionPreflight(null);
    setManualActionPreflightError(null);
    void fetchManualActionPreflight({
      marketId: selectedSignal.market_id ?? selectedMarketId,
      top: 5,
      productScopeId: activeProductScopeId,
      expectedObjectId: selectedBackendManualActionPreview.objectId,
      expectedObjectType: selectedBackendManualActionPreview.objectType,
      actionType: selectedBackendManualActionPreview.actionType,
      expectWritten: false,
    })
      .then((preflight) => {
        if (!cancelled) setManualActionPreflight(preflight);
      })
      .catch(() => {
        if (!cancelled) setManualActionPreflightError("后端预检读取失败；未读取前不会自动写入人工动作。");
      });
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
    const actionGate = manualActionButtonGate(
      actionType,
      manualActionPreflight,
      manualActionPreflightError,
      hasReviewTodoForSelectedObject,
      {
        objectType: selectedBackendManualActionPreview?.objectType ?? null,
        objectId: selectedBackendManualActionPreview?.objectId ?? null,
      },
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
          preflight: manualActionPreflight,
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
      const [nextReviewTodos, nextSignalTriageSummary] = await Promise.all([
        fetchReviewTodos(actionMarketId),
        fetchSignalTriageSummary(actionMarketId, 5, activeProductScopeId),
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
      } catch {
        postWritePreflightError = manualActionPostWritePreflightReadErrorText;
      }
      setReviewTodos(nextReviewTodos);
      setSignalTriageSummary(nextSignalTriageSummary);
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
    if (!selectedSignal || !selectedReviewEffect || !canSaveReviewEffect(selectedReviewEffect)) return;
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
          <span>经营商品入口</span>
          <select
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
            <div className="productScopeBusinessPreview" aria-label="Parent ASIN 首屏经营摘要">
              <div className="productScopeBusinessPreviewHeader">
                <strong>{productScopeFirstScreenSummary.title}</strong>
                <span>{productScopeFirstScreenSummary.summary}</span>
              </div>
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
              <div className="productScopeBusinessPreviewFacts">
                {productScopeFirstScreenSummary.factItems.map((item) => (
                  <div className={`productScopeBusinessPreviewFact ${item.tone}`} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
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
              <div className="productScopeBusinessPreviewPath" aria-label="首屏诊断路径">
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
                        <th>广告 ASIN</th>
                        <th>花费</th>
                        <th>订单</th>
                        <th>销售额</th>
                        <th>ACOS</th>
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
              <div className="productScopeEntryGuidance" aria-label="经营商品优先入口说明">
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
                <div className="productGroupOverview" aria-label="商品组概览">
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
                  {productScopeGroupOverview.adAsinRows.length > 0 && (
                    <div className="productGroupAsinTableWrap" aria-label="广告 ASIN 对比">
                      <table className="productGroupAsinTable">
                        <thead>
                          <tr>
                            <th>广告 ASIN</th>
                            <th>花费</th>
                            <th>订单</th>
                            <th>销售额</th>
                            <th>ACOS</th>
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
                  onClick={() => {
                    setFilter("all");
                    if (!displayProductScopedSignals.some((signal) => signal.id === recommendedManualActionCandidate.signal.id)) {
                      setSelectedProductScopeId("all");
                    }
                    setSelectedId(recommendedManualActionCandidate.signal.id);
                  }}
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
                  onClick={() => {
                    setFilter("all");
                    if (!displayProductScopedSignals.some((signal) => signal.id === nextUnhandledManualActionCandidate.signal.id)) {
                      setSelectedProductScopeId("all");
                    }
                    setSelectedId(nextUnhandledManualActionCandidate.signal.id);
                  }}
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
                <span className="reviewTodoQueueNext">
                  下一项：{reviewTodoQueueSummary.nextLabel}
                  {reviewTodoQueueSummary.nextDueDate ? ` / 到期 ${reviewTodoQueueSummary.nextDueDate}` : ""}
                </span>
              )}
              {reviewTodoScopeHint && (
                <button
                  className="reviewTodoQueueGlobalHint"
                  type="button"
                  onClick={() => setSelectedProductScopeId(reviewTodoScopeHint.actionScopeId)}
                  aria-label="切到全量排查查看全局复盘待办"
                  title={reviewTodoScopeHint.actionLabel}
                >
                  {reviewTodoScopeHint.text}
                </button>
              )}
            </div>
          </div>

          {searchIntentReviewCards.length > 0 && (
            <section className="searchIntentReviewPanel" aria-label="搜索词语义组复核">
              <div className="searchIntentReviewHeader">
                <strong>语义组复核</strong>
                <span>先看同类搜索词，再处理具体机会</span>
              </div>
              {selectedSearchIntentLabel && (
                <div className="searchIntentActiveFilter" aria-label="当前语义组筛选">
                  <span>已筛选：{selectedSearchIntentLabel}</span>
                  <button type="button" onClick={() => setSelectedSearchIntentLabel(null)}>
                    清除
                  </button>
                </div>
              )}
              <div className="searchIntentReviewList">
                {searchIntentReviewCards.map((card) => (
                  <button
                    type="button"
                    className={`searchIntentReviewCard ${selectedSearchIntentLabel === card.intentLabel ? "active" : ""}`}
                    key={card.title}
                    onClick={() => handleSelectSearchIntent(card.intentLabel)}
                    aria-pressed={selectedSearchIntentLabel === card.intentLabel}
                    aria-label={`筛选语义组 ${card.title} 的搜索词机会`}
                  >
                    <div>
                      <strong>{card.title}</strong>
                      <span>{card.sourceLabel}</span>
                    </div>
                    <p>{card.summary}</p>
                    <small>{card.insight}</small>
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
            </section>
          )}

          <div className="queueTabs" aria-label="队列筛选">
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
              全部
            </button>
            <button className={filter === "high" ? "active" : ""} onClick={() => setFilter("high")}>
              高优先级
            </button>
            <button className={filter === "anomaly" ? "active" : ""} onClick={() => setFilter("anomaly")}>
              异常
            </button>
            <button className={filter === "opportunity" ? "active" : ""} onClick={() => setFilter("opportunity")}>
              机会
            </button>
            <button className={filter === "data_quality" ? "active" : ""} onClick={() => setFilter("data_quality")}>
              数据质量
            </button>
            <button className={filter === "observing" ? "active" : ""} onClick={() => setFilter("observing")}>
              观察中
            </button>
          </div>

          {loading && <EmptyState icon="loading" title="正在读取信号" />}
          {error && <EmptyState icon="warning" title={error} />}
          {!loading && !error && filteredSignals.length === 0 && (
            <EmptyState
              icon="empty"
              title={selectedSearchIntentLabel ? "当前语义组暂无对应搜索词机会" : productScopeSignalExplanation?.title ?? "暂无真实快照信号"}
              description={
                selectedSearchIntentLabel
                  ? "该筛选只联动 search_term_opportunity；如果需要看全部信号，请清除语义组筛选。"
                  : productScopeSignalExplanation?.description
                    ? productScopeSignalExplanation.description
                  : "旧样例已移除，后续信号只从真实快照或明确标记的测试 fixture 生成。"
              }
            />
          )}
          {!loading && !error && filteredSignals.length === 0 && !selectedSearchIntentLabel && productScopeSignalExplanation && (
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
                      onClick={() => {
                        if (!row.signalId) return;
                        setFilter("all");
                        setSelectedId(row.signalId);
                      }}
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
          {productScopeEvidenceRouteGuide && <ProductScopeEvidenceRouteGuidePanel guide={productScopeEvidenceRouteGuide} />}
          {productScopeAdGroupDiagnosis.length > 0 && <ProductScopeAdGroupDiagnosisPanel rows={productScopeAdGroupDiagnosis} />}
          {productScopeCandidateGapExplanation && (
            <ProductScopeCandidateGapExplanationPanel explanation={productScopeCandidateGapExplanation} />
          )}
          {selectedSignal ? (
            <SignalDiagnosis signal={selectedSignal} triageBusinessEvidenceItems={selectedTriageBusinessEvidenceItems} />
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
                    <small>{selectedManualActionAdGroupBridge.boundary}</small>
                  </div>
                )}
                <div className="actionFactList">
                  {selectedManualActionEvidenceReason && (
                    <span>
                      <b>处理依据</b>
                      {selectedManualActionEvidenceReason}
                    </span>
                  )}
                  <span>
                    <b>风险</b>
                    {selectedSignal.risk}
                  </span>
                  <span>
                    <b>不确定性</b>
                    {selectedSignal.uncertainty}
                  </span>
                  {selectedBackendManualActionPreview ? (
                    <span>
                      <b>预检</b>
                      {selectedBackendManualActionPreview.actionType} / 复盘对象：
                      {objectTypeLabel[selectedBackendManualActionPreview.objectType] ?? selectedBackendManualActionPreview.objectType} / 对象ID：
                      {selectedBackendManualActionPreview.objectId} / 窗口：
                      {selectedBackendManualActionPreview.reviewWindows.join(" / ")}
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
                {selectedSearchIntentManualActionEvidenceSnapshot.length > 0 && (
                  <div className="manualActionContextSnapshot" aria-label="当前语义组留痕上下文">
                    <strong>当前语义组留痕</strong>
                    <ul>
                      {selectedSearchIntentManualActionEvidenceSnapshot.map((item) => (
                        <li key={`${item.label}-${item.value}`}>
                          <span>{item.label}</span>
                          <b>{item.value}</b>
                        </li>
                      ))}
                    </ul>
                    <p>随人工动作写入证据快照，只用于 7/14 天复盘回看。</p>
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
                  <p>{selectedManualActionPreflightText}</p>
                  {selectedManualActionPreflightEvidenceText ? (
                    <p className="manualActionPreflightEvidence">{selectedManualActionPreflightEvidenceText}</p>
                  ) : null}
                </div>
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
                    {manualActionPreflight?.evidence_snapshot_preview?.boundary && (
                      <p className="manualActionEvidencePreviewBoundary">{manualActionPreflight.evidence_snapshot_preview.boundary}</p>
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
                <div className="manualActionGrid">
                  {manualActionOrder.map((actionType) => {
                    const Icon = manualActionIcon[actionType];
                    const actionGate = manualActionButtonGate(
                      actionType,
                      manualActionPreflight,
                      manualActionPreflightError,
                      hasReviewTodoForSelectedObject,
                      {
                        objectType: selectedBackendManualActionPreview?.objectType ?? null,
                        objectId: selectedBackendManualActionPreview?.objectId ?? null,
                      },
                    );
                    const isDuplicateReviewAction = actionType === "add_to_review" && hasReviewTodoForSelectedObject;
                    const actionLabel = isDuplicateReviewAction ? "等待复盘窗口" : manualActionLabel[actionType];
                    const actionIntent = actionGate.reason ?? manualActionIntentText(actionType);
                    const compactIntent = actionGate.compactReason ?? manualActionCompactIntent[actionType];
                    return (
                      <button
                        key={actionType}
                        className={`manualActionButton${actionType === "add_to_review" ? " primaryManualAction" : ""}`}
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
                    <p>暂无人工处理记录</p>
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
                      {selectedReviewEffectReadback && <span>{selectedReviewEffectReadback}</span>}
                      {selectedReviewEffectWindowText && <span>{selectedReviewEffectWindowText}</span>}
                      {selectedReviewEffect?.status === "ready" && <span>{reviewEffectSummaryText(selectedReviewEffect)}</span>}
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
                      {canSaveReviewEffect(selectedReviewEffect) && (
                        <button className="secondaryButton" onClick={handleSaveReviewRecord} disabled={savingReviewRecord}>
                          保存复盘记录
                        </button>
                      )}
                    </>
                  ) : (
                    <p>{reviewCheckpointText(null, null)}</p>
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

function ProductScopeEvidenceRouteGuidePanel({ guide }: { guide: ProductScopeEvidenceRouteGuide }) {
  return (
    <section className="productScopeEvidenceRouteGuide diagnosisStep stepEvidence" aria-label="广告证据链导览">
      <div className="detailSectionHeader">
        <h3>{guide.title}</h3>
        <span>{guide.steps.length} 层证据</span>
      </div>
      <p className="productScopeEvidenceRouteGuideSummary">{guide.summary}</p>
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

function ProductScopeAdGroupDiagnosisPanel({ rows }: { rows: ProductScopeAdGroupDiagnosisRow[] }) {
  return (
    <section className="productScopeAdGroupDiagnosis diagnosisStep stepEvidence" aria-label="广告组问题定位">
      <div className="detailSectionHeader">
        <h3>广告组问题定位</h3>
        <span>{rows.length} 个广告组</span>
      </div>
      <div className="productScopeAdGroupDiagnosisRows">
        {rows.map((row) => (
          <article className={`productScopeAdGroupDiagnosisRow ${row.statusTone}`} key={row.id}>
            <div className="productScopeAdGroupDiagnosisHeader">
              <div>
                <span>{row.problemType}</span>
                <strong>{row.title}</strong>
              </div>
              <b>{row.statusLabel}</b>
            </div>
            <div className="productScopeAdGroupDiagnosisMetrics">
              <span>{row.metrics}</span>
              <span>{row.trafficContext}</span>
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
            {row.searchTermDiagnosis && <ProductScopeSearchTermDiagnosisPanel rowId={row.id} diagnosis={row.searchTermDiagnosis} />}
            <div className="productScopeAdGroupDiagnosisForbidden" aria-label="禁止的自动广告动作">
              {row.forbiddenActions.map((action) => (
                <span key={`${row.id}-${action}`}>{action}</span>
              ))}
            </div>
          </article>
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
    : [{ label: "暂无有效词样本", termTypeLabel: "缺口", metrics: "等待搜索词证据" }];
  const zeroOrderTerms = diagnosis.zeroOrderTerms.length
    ? diagnosis.zeroOrderTerms
    : [{ label: "暂无零单花费词样本", termTypeLabel: "缺口", metrics: "等待搜索词证据" }];

  return (
    <div className="productScopeSearchTermDiagnosis" aria-label="搜索词问题定位">
      <div className="productScopeSearchTermDiagnosisHeader">
        <strong>搜索词问题定位</strong>
        <span>{diagnosis.termSummary}</span>
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
}: {
  signal: AiSignal;
  triageBusinessEvidenceItems?: SignalTriageBusinessEvidenceItem[];
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

      <div className="metricsRow">
        <MetricCell label="花费" value={formatMoney(metrics.cost)} />
        <MetricCell label="订单" value={String(metrics.orders)} />
        <MetricCell label="销售额" value={formatMoney(metrics.sales)} />
        <MetricCell label="ACOS" value={formatPercent(metrics.acos)} />
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
                    {fact.label}：{fact.value}
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
                    {fact.label}：{fact.value}
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
                  {fact.label}：{fact.value}
                </strong>
                <p>{fact.explanation ?? fact.note ?? fact.label}</p>
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
  const Icon = kind === "opportunity" ? Sparkles : kind === "data_quality" ? FileWarning : AlertTriangle;

  return (
    <span className={`signalPill ${kind}`}>
      <Icon size={14} />
      {signalCategoryLabel(signal)}
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
