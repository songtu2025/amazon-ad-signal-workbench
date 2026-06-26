declare function require(name: string): any;
declare const process: { cwd(): string };

const { readFileSync } = require("fs");
const { join } = require("path");

function assertIncludes(actual: string, expected: string) {
  if (!actual.includes(expected)) {
    throw new Error(`期望 SignalTriageWorkbench.tsx 包含 ${expected}`);
  }
}

function assertNotIncludes(actual: string, expected: string) {
  if (actual.includes(expected)) {
    throw new Error(`期望 SignalTriageWorkbench.tsx 不包含 ${expected}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const workbenchSource = readFileSync(
  join(process.cwd(), "src", "pages", "SignalTriageWorkbench", "SignalTriageWorkbench.tsx"),
  "utf8",
);
const apiSource = readFileSync(join(process.cwd(), "src", "api.ts"), "utf8");
const apiPathsSource = readFileSync(join(process.cwd(), "src", "apiPaths.ts"), "utf8");
const signalUiSource = readFileSync(join(process.cwd(), "src", "pages", "SignalTriageWorkbench", "signalUi.ts"), "utf8");
const reviewUiSource = readFileSync(join(process.cwd(), "src", "pages", "SignalTriageWorkbench", "reviewUi.ts"), "utf8");
const stylesSource = readFileSync(join(process.cwd(), "src", "styles.css"), "utf8");

assertIncludes(apiPathsSource, "export function productScopePath(marketId?: number | null)");
assertIncludes(apiPathsSource, 'return marketScopedPath("/api/product-scope", marketId);');
assertIncludes(apiSource, "fetchProductScope(marketId?: number | null)");
assertIncludes(apiSource, "productScopePath(marketId)");
assertIncludes(workbenchSource, "fetchProductScope(selectedMarketId)");
assertIncludes(workbenchSource, "buildProductScopeEvidenceMatrix");
assertIncludes(workbenchSource, "buildProductScopeDiagnosisBrief");
assertIncludes(workbenchSource, "productScopeAdGroupDiagnosisRows");
assertIncludes(workbenchSource, "buildNoActionableManualGate");
assertIncludes(workbenchSource, "buildProductScopeCandidateGapExplanation");
assertIncludes(workbenchSource, "ProductScopeEvidenceMatrix");
assertIncludes(workbenchSource, "ProductScopeAdGroupDiagnosisRow");
assertIncludes(workbenchSource, "NoActionableManualGate");
assertIncludes(workbenchSource, "const productScopeEvidenceMatrix = useMemo");
assertIncludes(workbenchSource, "const productScopeEvidenceRouteGuide = useMemo");
assertIncludes(workbenchSource, "const productScopeAdGroupDiagnosis = useMemo");
assertIncludes(workbenchSource, "const [selectedAdGroupDiagnosisId, setSelectedAdGroupDiagnosisId] = useState<string | null>(null);");
assertIncludes(workbenchSource, "const selectedAdGroupDiagnosis = useMemo");
assertIncludes(workbenchSource, "const productScopeDiagnosisBrief = useMemo");
assertIncludes(workbenchSource, "const activeProductScopePriorityItem = useMemo");
assertIncludes(workbenchSource, "const recommendedSearchTermForCurrentScope = useMemo");
assertIncludes(workbenchSource, "setSelectedProductScopeId((current) =>");
assertIncludes(workbenchSource, "current && hasProductScopeId(current, nextProductScopeOptions) ? current : nextActiveProductScopeId");
assertIncludes(workbenchSource, "const recommendedAdGroupNamesForCurrentScope = useMemo");
assertIncludes(workbenchSource, "const recommendedAdGroupDiagnosisForCurrentScope = useMemo");
assertIncludes(workbenchSource, "const selectedAdGroupRecommendedContext = useMemo");
assertIncludes(workbenchSource, "const productScopeAdGroupDiagnosisForCurrentFocus = useMemo");
assertIncludes(workbenchSource, "const productScopeRequestSeq = useRef(0);");
assertIncludes(workbenchSource, "if (productScopeRequestSeq.current !== requestSeq) return;");
assertIncludes(workbenchSource, "function clearProductScopeTransientState()");
assertIncludes(workbenchSource, "setSelectedId(null);");
assertIncludes(workbenchSource, "setSelectedAdGroupDiagnosisId(null);");
assertIncludes(workbenchSource, "setSignalTriageSummary(null);");
assertIncludes(workbenchSource, "setManualActionPreflightsByAction({});");
assertIncludes(workbenchSource, "function handleSelectProductScope(scopeId: string");
assertIncludes(workbenchSource, "productScopeRequestSeq.current += 1;");
assertIncludes(workbenchSource, "onChange={(event) => handleSelectProductScope(event.target.value)}");
assertIncludes(workbenchSource, "handleSelectProductScope(scopeId, { resetFilter: true });");
assertIncludes(workbenchSource, "const noActionableManualGate = useMemo");
assertIncludes(workbenchSource, "const productScopeCandidateGapExplanation = useMemo");
assertIncludes(workbenchSource, "function recommendedSearchTermCarryEvidence");
assertIncludes(workbenchSource, "ProductScopeSingleScreenCommandCard");
assertIncludes(workbenchSource, "summary={productScopeFirstScreenSummary}");
assertIncludes(workbenchSource, "adGroupRecommendedContext={selectedAdGroupRecommendedContext}");
assertIncludes(workbenchSource, "recommendedCandidate={signalTriageSummary?.recommended_candidate ?? null}");
assertIncludes(workbenchSource, "recommendedDrilldown={signalTriageSummary?.recommended_evidence_drilldown ?? null}");
assertIncludes(workbenchSource, "matrix={productScopeEvidenceMatrix}");
assertIncludes(workbenchSource, "rows={productScopeAdGroupDiagnosis}");
assertIncludes(workbenchSource, "selectedId={selectedAdGroupDiagnosis?.id ?? null}");
assertIncludes(workbenchSource, "onSelect={setSelectedAdGroupDiagnosisId}");
assertIncludes(workbenchSource, "ProductScopePriorityEntryBridgePanel item={activeProductScopePriorityItem} adGroup={selectedAdGroupDiagnosis}");
assertIncludes(workbenchSource, "ProductScopeAdGroupFocusPanel row={selectedAdGroupDiagnosis}");
assertIncludes(workbenchSource, "ProductScopeDiagnosisBriefPanel brief={productScopeDiagnosisBrief}");
assertIncludes(workbenchSource, '<details className="productScopeDiagnosisFrameworkEvidence"');
assertIncludes(workbenchSource, 'className="productScopeDiagnosisFrameworkEvidence"');
assertIncludes(workbenchSource, 'className="productScopeDiagnosisFrameworkNext"');
assertIncludes(workbenchSource, "<summary>证明边界</summary>");
assertIncludes(workbenchSource, 'aria-label={`${section.title} 证明边界`}');
assertIncludes(workbenchSource, "{section.proves}");
assertIncludes(workbenchSource, "{section.doesNotProve}");
assertIncludes(workbenchSource, "function ProductScopePriorityEntryBridgePanel");
assertIncludes(workbenchSource, "function ProductScopeSingleScreenCommandCard");
assertIncludes(workbenchSource, "function ProductScopeDiagnosisBriefPanel");
assertIncludes(workbenchSource, "function ProductScopeEvidenceMatrixPanel");
assertIncludes(workbenchSource, "function ProductScopeAdGroupDiagnosisPanel");
assertIncludes(workbenchSource, "function ProductScopeAdGroupFocusPanel");
assertIncludes(workbenchSource, "function ProductScopeAdGroupAdvertisedProductsPanel");
assertIncludes(workbenchSource, "function ProductScopeTargetingEvidencePanel");
assertIncludes(workbenchSource, "function buildProductScopeTargetingEvidenceRows");
assertIncludes(workbenchSource, "function ProductScopeAdGroupEvidenceSwitcherPanel");
assertIncludes(workbenchSource, "function ProductScopeAdGroupReviewOrderPanel");
assertIncludes(workbenchSource, "function ProductScopeAdGroupOperationalChecklistPanel");
assertIncludes(workbenchSource, "function buildProductScopeAdGroupChecklistItems");
assertIncludes(workbenchSource, "function ProductScopeAdGroupActionBridgeCard");
assertIncludes(workbenchSource, "function ProductScopeAdGroupReasoningDetails");
assertIncludes(workbenchSource, 'aria-label="广告组内投放商品表现"');
assertIncludes(workbenchSource, 'aria-label="投放商品业务判断"');
assertIncludes(workbenchSource, "业务问题：当前广告组下哪些广告 ASIN 承接了花费、点击、订单和销售");
assertIncludes(workbenchSource, "row.ownershipDecision.currentJudgement");
assertIncludes(workbenchSource, "row.ownershipDecision.doesNotProve");
assertIncludes(workbenchSource, "row.ownershipDecision.nextManualStep");
assertIncludes(workbenchSource, 'aria-label="投放词证据完整审计材料"');
assertIncludes(workbenchSource, '<details className="productScopeTargetingEvidence" aria-label="投放词证据完整审计材料">');
assertIncludes(workbenchSource, "展开投放词证据明细");
assertIncludes(workbenchSource, "默认层已在搜索词业务判断和证据切换器中给出投放词判断");
assertIncludes(workbenchSource, 'aria-label="当前广告组复核顺序"');
assertIncludes(workbenchSource, 'aria-label="当前广告组优先查看证据层"');
assertIncludes(workbenchSource, 'aria-label="当前广告组完整运营检查清单"');
assertIncludes(workbenchSource, '<details className="productScopeAdGroupChecklist" aria-label="当前广告组完整运营检查清单">');
assertIncludes(workbenchSource, "默认层已经先给三段判断、四要素摘要、证据切换和复核顺序");
assertIncludes(workbenchSource, 'aria-label="当前广告组证据上下文"');
assertIncludes(workbenchSource, 'aria-label="广告组推理细节"');
assertIncludes(workbenchSource, 'aria-label="当前广告组复核路径"');
assertIncludes(workbenchSource, 'aria-label="当前广告组三段复核判断"');
assertIncludes(workbenchSource, 'aria-label="当前广告组证据摘要"');
assertIncludes(workbenchSource, "问题落点");
assertIncludes(workbenchSource, "row.problemLocator.problemLocation");
assertIncludes(workbenchSource, 'aria-label="当前 Parent ASIN 进入理由"');
assertIncludes(workbenchSource, "当前 Parent ASIN 证据路径承接");
assertIncludes(workbenchSource, "首页摘要已回答先看谁");
assertIncludes(workbenchSource, "本区只承接证据路径，避免重复排序解释");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 单屏作战卡"');
assertIncludes(workbenchSource, "先判断，不先读报表");
assertIncludes(workbenchSource, "进入广告证据下钻");
assertIncludes(workbenchSource, "这张卡只做单屏分诊，不写入人工动作，也不执行广告操作。");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 单屏诊断路径"');
assertIncludes(workbenchSource, "const singleScreenPathItems = [");
assertIncludes(workbenchSource, "recommendedSearchTermLabel(signalTriageSummary?.recommended_candidate)");
assertIncludes(workbenchSource, "recommendedSearchTermLabel(recommendedCandidate)");
assertIncludes(workbenchSource, "recommendedAdGroupNames(signalTriageSummary?.recommended_evidence_drilldown)");
assertIncludes(workbenchSource, "recommendedAdGroupDiagnosis(productScopeAdGroupDiagnosis, recommendedAdGroupNamesForCurrentScope)");
assertIncludes(workbenchSource, "recommendedAdGroupDiagnosisForCurrentScope ??");
assertIncludes(workbenchSource, "prioritizeAdGroupDiagnosisRows(productScopeAdGroupDiagnosis, selectedAdGroupDiagnosis)");
assertIncludes(workbenchSource, "buildManualActionCandidateAdGroupBridge(selectedBackendManualActionPreview, productScopeAdGroupDiagnosisForCurrentFocus)");
assertIncludes(workbenchSource, "const productScopeRecommendedAdGroupEvidence = useMemo");
assertIncludes(workbenchSource, "searchTermLabel: recommendedSearchTermForCurrentScope");
assertIncludes(workbenchSource, "adGroupNames: recommendedAdGroupNamesForCurrentScope");
assertIncludes(workbenchSource, "productScopeRecommendedAdGroupEvidence");
assertIncludes(workbenchSource, "后端推荐候选：${recommendedSearchTermForCurrentScope}");
assertIncludes(workbenchSource, "后端推荐候选：${recommendedSearchTerm}");
assertIncludes(workbenchSource, "推荐 SearchTerm ${searchTerm} 的承接广告组");
assertIncludes(workbenchSource, "搜索词聚合只做 Parent ASIN 视角参考");
assertIncludes(workbenchSource, 'aria-label="推荐搜索词承接证据"');
assertIncludes(workbenchSource, "这里只说明承接范围，不证明单个 ASIN 归因");
assertIncludes(workbenchSource, "先人工核对投放词，不自动加词、调价或否词");
assertIncludes(workbenchSource, "placement_context_gap");
assertIncludes(workbenchSource, "detail: placementText");
assertIncludes(workbenchSource, "businessQuestionItems");
assertIncludes(workbenchSource, "是否值得复核");
assertIncludes(workbenchSource, "从哪里下钻");
assertIncludes(workbenchSource, "能否落到 ASIN");
assertIncludes(workbenchSource, "广告位能否判断");
assertIncludes(workbenchSource, "当前不能判断广告位影响。");
assertIncludes(workbenchSource, "recommendedCarryEvidence.businessQuestionItems.map");
assertIncludes(workbenchSource, "不能判断广告位影响");
assertIncludes(workbenchSource, "ad_placement_daily_metrics");
assertIncludes(workbenchSource, "singleScreenPathItems.map");
assertIncludes(workbenchSource, "1. 经营入口");
assertIncludes(workbenchSource, "2. 广告组定位");
assertIncludes(workbenchSource, "3. 搜索词证据");
assertIncludes(workbenchSource, "4. 人工动作 / 复盘");
assertIncludes(workbenchSource, "右侧只允许记录观察、标记已处理、加入复盘或忽略本次");
assertNotIncludes(workbenchSource, "从左侧优先处理清单进入此诊断范围");
assertNotIncludes(workbenchSource, "先确认为什么看，再沿 Parent ASIN、广告 ASIN、广告组、投放词、搜索词和广告位下钻");
assertNotIncludes(workbenchSource, "productScopeDiagnosisBriefSections");
assertNotIncludes(workbenchSource, "productScopeDiagnosisBriefSection ${section.tone}");
assertIncludes(workbenchSource, "首页摘要读回");
assertIncludes(workbenchSource, "Parent ASIN 经营盘 → 有广告数据的广告 ASIN → 广告组 → 投放商品 / 投放词 / 搜索词 / 广告位");
assertIncludes(workbenchSource, "广告证据");
assertIncludes(workbenchSource, "默认聚焦广告组");
assertIncludes(workbenchSource, 'aria-label="单屏搜索词复核顺序"');
assertIncludes(workbenchSource, "searchIntentSummary.priorityPathItems.map");
assertIncludes(workbenchSource, "聚焦原因");
assertIncludes(workbenchSource, "进入右侧前核对");
assertIncludes(workbenchSource, "暂无可聚焦广告组；先补齐广告组、投放商品、投放词、搜索词和广告位证据。");
assertIncludes(workbenchSource, "下方“广告组问题定位”可切换当前广告组焦点");
assertIncludes(workbenchSource, "本区只解释进入理由，不写入人工动作，也不执行任何广告操作");
assertIncludes(workbenchSource, "ProductScopeTargetingEvidencePanel row={row}");
assertIncludes(workbenchSource, "ProductScopeAdGroupAdvertisedProductsPanel row={row}");
assertIncludes(workbenchSource, "ProductScopeAdGroupDataSummaryPanel row={row}");
assertIncludes(workbenchSource, "ProductScopeAdGroupReviewOrderPanel row={row}");
assertIncludes(workbenchSource, "ProductScopeAdGroupOperationalChecklistPanel row={row}");
assertIncludes(workbenchSource, "diagnosisBrief={productScopeDiagnosisBrief}");
assertIncludes(workbenchSource, "diagnosisBrief: ProductScopeDiagnosisBrief | null;");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 单屏证明边界读回"');
assertIncludes(workbenchSource, "diagnosisBrief.decisionGuide.primaryDecision");
assertIncludes(workbenchSource, "diagnosisBrief?.sections.filter");
assertIncludes(workbenchSource, "业务问题：{section.businessQuestion}");
assertIncludes(workbenchSource, "能证明：{section.proves}");
assertIncludes(workbenchSource, "不能证明：{section.doesNotProve}");
assertIncludes(workbenchSource, "人工下一步：{section.nextManualStep}");
assertIncludes(workbenchSource, "ProductScopeAdGroupReasoningDetails row={row}");
assertIncludes(workbenchSource, "展开完整运营检查清单");
assertIncludes(workbenchSource, "四层证据 / 证明边界 / 人工下一步");
assertIncludes(workbenchSource, 'aria-label="广告组下具体数据四要素摘要"');
assertIncludes(workbenchSource, "先回答四个问题，再展开投放商品、投放词、搜索词和广告位明细。");
assertIncludes(workbenchSource, "purpose: string;");
assertIncludes(workbenchSource, "proves: string;");
assertIncludes(workbenchSource, "doesNotProve: string;");
assertIncludes(workbenchSource, "item.purpose");
assertIncludes(workbenchSource, "item.proves");
assertIncludes(workbenchSource, "item.doesNotProve");
assertIncludes(workbenchSource, 'className="productScopeAdGroupChecklistProof"');
assertIncludes(workbenchSource, "<b>能证明</b>");
assertIncludes(workbenchSource, "<b>不能证明</b>");
assertIncludes(workbenchSource, "确认当前广告组实际投放哪些广告 ASIN");
assertIncludes(workbenchSource, "确认搜索词表现来自哪些 keyword_text / target_id");
assertIncludes(workbenchSource, "判断用户真实搜索词在当前广告组里是扩量机会、花费浪费还是继续观察");
assertIncludes(workbenchSource, "确认当前问题是否可能和 Top of Search");
assertIncludes(workbenchSource, 'const reviewPath = items.map((item) => item.title).join(" → ")');
assertIncludes(workbenchSource, "function buildProductScopeAdGroupReviewPriority");
assertIncludes(workbenchSource, "本次优先证据层");
assertIncludes(workbenchSource, "problemLocationText.includes(\"搜索词\")");
assertIncludes(workbenchSource, "problemLocationText.includes(\"广告位\")");
assertIncludes(workbenchSource, "本次优先证据层不能替代四层完整复核");
assertIncludes(workbenchSource, "先按顺序复核");
assertIncludes(workbenchSource, 'className="productScopeAdGroupReviewOrderDetails"');
assertIncludes(workbenchSource, "展开四层复核步骤");
assertIncludes(workbenchSource, "这只是人工复核路径，不证明搜索词或广告位已归因到单个广告 ASIN");
assertIncludes(workbenchSource, "先按中间检查清单复核广告组上下文");
assertIncludes(workbenchSource, "真实人工动作对象以下方双轨分流和后端预检读回为准");
assertIncludes(workbenchSource, 'aria-label="广告组证据带入核对"');
assertIncludes(workbenchSource, "<strong>广告组证据带入</strong>");
assertIncludes(workbenchSource, "const priority = buildProductScopeAdGroupReviewPriority(row, items);");
assertIncludes(workbenchSource, "const defaultEvidenceItem = items.find((item) => priority.focusLayer.includes(item.title)) ?? items[0];");
assertIncludes(workbenchSource, "这里只说明当前广告组会作为哪类证据带入");
assertIncludes(workbenchSource, "真实写入对象看人工确认双轨和预检");
assertIncludes(workbenchSource, "<b>留痕证据</b>");
assertIncludes(workbenchSource, "<b>复盘窗口</b>");
assertIncludes(workbenchSource, "7/14 天复盘沿保存时 evidence_snapshot 回看");
assertIncludes(workbenchSource, "不能替代中间诊断，也不执行广告动作");
assertNotIncludes(workbenchSource, "{defaultEvidenceItem.purpose}");
assertNotIncludes(workbenchSource, "{defaultEvidenceItem.judgement}");
assertNotIncludes(workbenchSource, "{defaultEvidenceItem.proves}");
assertNotIncludes(workbenchSource, "{defaultEvidenceItem.doesNotProve}");
assertIncludes(workbenchSource, "{defaultEvidenceItem.nextStep}");
assertIncludes(workbenchSource, "<strong>Parent ASIN 来源读回</strong>");
assertIncludes(workbenchSource, "<summary>");
assertIncludes(workbenchSource, 'className="adGroupActionBridgePreflightEvidence"');
assertIncludes(workbenchSource, 'aria-label="人工点击前证据读回"');
assertIncludes(workbenchSource, "<b>默认复核层</b>");
assertIncludes(workbenchSource, "<b>证据缺口</b>");
assertIncludes(workbenchSource, "<b>动作边界</b>");
assertIncludes(workbenchSource, "row.evidenceSynthesis.evidenceGap");
assertIncludes(workbenchSource, "row.forbiddenActions.join(\" / \")");
assertIncludes(workbenchSource, "只能人工记录或加入复盘");
assertIncludes(workbenchSource, 'className="adGroupActionBridgeFullEvidence"');
assertIncludes(workbenchSource, 'aria-label="人工点击前完整证据层"');
assertIncludes(workbenchSource, "展开四层完整证据");
assertIncludes(workbenchSource, 'className="adGroupActionBridgeReviewEvidence"');
assertIncludes(workbenchSource, 'aria-label="复盘回读证据链"');
assertIncludes(workbenchSource, "人工动作保存后，7/14 天复盘必须沿这四层证据回看");
assertIncludes(workbenchSource, "不能只看最终指标涨跌");
assertIncludes(workbenchSource, "能证明：{item.proves}");
assertIncludes(workbenchSource, "不能证明：{item.doesNotProve}");
assertIncludes(workbenchSource, 'aria-label="人工动作前核对"');
assertIncludes(workbenchSource, "广告组上下文：");
assertIncludes(workbenchSource, "来源读回：");
assertIncludes(workbenchSource, "允许动作：记录观察 / 标记已处理 / 加入复盘 / 忽略本次");
assertIncludes(workbenchSource, "广告组只说明承接场景，不能替代真实人工动作对象；右侧不执行广告操作。");
assertNotIncludes(workbenchSource, "动作对象：{row.title}");
assertNotIncludes(workbenchSource, 'aria-label="当前广告组人工动作承接"');
assertNotIncludes(workbenchSource, 'aria-label="Parent ASIN 分诊路径承接"');
assertNotIncludes(workbenchSource, "这里把 Parent ASIN 分诊理由带到人工动作前核对，不执行广告操作。");
assertIncludes(workbenchSource, "未绑定 Parent ASIN 入口");
assertIncludes(workbenchSource, "没有 Parent ASIN 分诊来源时，右侧人工动作只保存当前广告组留痕或复盘待办。");
assertIncludes(workbenchSource, "不能自动调价、暂停、否词或加词");
assertIncludes(workbenchSource, "投放词证据来自搜索词表现行的 keyword_text / target_id");
assertIncludes(workbenchSource, "SP 关键词详情和商品定向详情第一阶段仍属暂缓同步");
assertIncludes(workbenchSource, "aria-pressed={isSelected}");
assertIncludes(workbenchSource, "onClick={() => onSelect(row.id)}");
assertIncludes(workbenchSource, "row.advertisedProductPerformance");
assertIncludes(workbenchSource, "function ProductScopeEvidenceRouteGuidePanel");
assertIncludes(workbenchSource, "function ProductScopeCandidateGapExplanationPanel");
assertIncludes(workbenchSource, "function NoActionableManualGatePanel");
assertIncludes(workbenchSource, "effective-${index}-${term.label}");
assertIncludes(workbenchSource, "zero-${index}-${term.label}");
assertIncludes(workbenchSource, 'aria-label="对象证据矩阵"');
assertIncludes(workbenchSource, 'aria-label="广告证据链导览"');
assertIncludes(workbenchSource, 'aria-label="广告证据链层级摘要"');
assertIncludes(workbenchSource, "guide.layerSummary.map");
assertIncludes(workbenchSource, "productScopeEvidenceRouteLayerSummaryItem");
assertIncludes(workbenchSource, 'aria-label="广告路径可落地判断"');
assertIncludes(workbenchSource, "guide.summary");
assertIncludes(workbenchSource, "guide.decision.currentJudgement");
assertIncludes(workbenchSource, "guide.decision.doesNotProve");
assertIncludes(workbenchSource, "guide.decision.nextManualStep");
assertIncludes(signalUiSource, "buildProductScopeEvidenceRouteDecision");
assertIncludes(signalUiSource, "buildProductScopeEvidenceRouteLayerSummary");
assertIncludes(signalUiSource, "直接证据");
assertIncludes(signalUiSource, "上下文证据");
assertIncludes(signalUiSource, "AI 准入");
assertIncludes(signalUiSource, "复盘路径");
assertIncludes(signalUiSource, "未投放子 ASIN 不进入广告动作对象");
assertIncludes(signalUiSource, "广告组、投放词、搜索词和广告位只解释流量来源与归因边界");
assertIncludes(signalUiSource, "先有人工动作和 ReviewTodo");
assertIncludes(signalUiSource, "buildProductScopeDiagnosisBrief");
assertIncludes(signalUiSource, "Parent ASIN 运营诊断路径");
assertIncludes(signalUiSource, "筛选器与口径锁定");
assertIncludes(signalUiSource, "避免后续把广告组、搜索词、广告位或 ABA 当成 Parent ASIN 商品口径");
assertIncludes(signalUiSource, "Parent ASIN 销售表现入口");
assertIncludes(signalUiSource, "是否值得进入广告诊断");
assertIncludes(signalUiSource, "不把全部销售子 ASIN 当广告对象");
assertIncludes(signalUiSource, "不把未投放变体拉进广告分析");
assertIncludes(signalUiSource, "AI 人工动作判断");
assertIncludes(signalUiSource, "最后由 AI 汇总");
assertIncludes(signalUiSource, "在筛选口径、销售入口、广告组排序和广告组下具体数据都读完后");
assertIncludes(signalUiSource, "广告组优先排序");
assertIncludes(signalUiSource, "ProductScopeRecommendedAdGroupEvidence");
assertIncludes(signalUiSource, "只作为搜索词证据下钻入口，不代表广告组本身异常");
assertIncludes(signalUiSource, "不能证明广告组本身异常，也不能证明搜索词表现已经自动归因到单个广告 ASIN");
assertIncludes(signalUiSource, "广告组下具体数据");
assertIncludes(signalUiSource, "先确认问题落点、证据缺口和人工下一步");
assertNotIncludes(signalUiSource, 'title: "AI 诊断摘要"');
assertNotIncludes(signalUiSource, 'title: "AI 广告诊断摘要"');
assertIncludes(signalUiSource, "不是把筛选器、销售、广告组、明细和 AI 分析纵向堆叠成长报表");
assertIncludes(signalUiSource, "只输出可人工确认的下一步");
assertIncludes(signalUiSource, "哪些广告对象真的有广告数据");
assertIncludes(signalUiSource, "先看经营入口，再看广告 ASIN、广告组、投放词/搜索词/广告位");
assertIncludes(signalUiSource, "AI 信号诊断、人工确认和 7/14 天复盘");
assertIncludes(signalUiSource, "AI 准入 -> 人工确认 -> 7/14 天复盘");
assertIncludes(signalUiSource, "未完成人工留痕和 ready 复盘前，不能保存 ReviewRecord");
assertIncludes(signalUiSource, 'layerId: "ai_signal"');
assertIncludes(signalUiSource, 'layerId: "manual_confirmation"');
assertIncludes(signalUiSource, 'layerId: "review"');
assertIncludes(signalUiSource, "复盘门槛：先有人工留痕和 7d / 14d ReviewTodo");

const diagnosisBriefScopeIndex = signalUiSource.indexOf('title: "筛选器与口径锁定"');
const diagnosisBriefSalesIndex = signalUiSource.indexOf('title: "Parent ASIN 销售表现入口"');
const diagnosisBriefAdGroupIndex = signalUiSource.indexOf('title: "广告组优先排序"');
const diagnosisBriefAdGroupDetailIndex = signalUiSource.indexOf('title: "广告组下具体数据"');
const diagnosisBriefAiIndex = signalUiSource.indexOf('title: "AI 人工动作判断"');
assert(
  diagnosisBriefScopeIndex < diagnosisBriefSalesIndex &&
    diagnosisBriefSalesIndex < diagnosisBriefAdGroupIndex &&
    diagnosisBriefAdGroupIndex < diagnosisBriefAdGroupDetailIndex &&
    diagnosisBriefAdGroupDetailIndex < diagnosisBriefAiIndex,
  "Parent ASIN 运营诊断路径必须先锁定筛选口径，再看销售入口、广告组排序和具体数据，最后由 AI 汇总成人工动作判断",
);

const diagnosisPanelIndex = workbenchSource.indexOf('<section className="diagnosisPanel">');
const productScopeSingleScreenRenderIndex = workbenchSource.indexOf("<ProductScopeSingleScreenCommandCard");
const productScopeBusinessPreviewIndex = workbenchSource.indexOf('className="productScopeBusinessPreview"');
const productScopePriorityEntryBridgeRenderIndex = workbenchSource.indexOf(
  "<ProductScopePriorityEntryBridgePanel item={activeProductScopePriorityItem} adGroup={selectedAdGroupDiagnosis} />",
);
const diagnosisBriefRenderIndex = workbenchSource.indexOf(
  "{productScopeDiagnosisBrief && <ProductScopeDiagnosisBriefPanel brief={productScopeDiagnosisBrief} />}",
);
const routeGuideRenderIndex = workbenchSource.indexOf(
  "{productScopeEvidenceRouteGuide && <ProductScopeEvidenceRouteGuidePanel guide={productScopeEvidenceRouteGuide} />}",
);
const adGroupDiagnosisRenderIndex = workbenchSource.indexOf("<ProductScopeAdGroupDiagnosisPanel");
const selectedAdGroupFocusRenderIndex = workbenchSource.indexOf(
  "{selectedAdGroupDiagnosis && <ProductScopeAdGroupFocusPanel row={selectedAdGroupDiagnosis} />}",
);
const adGroupChecklistIndex = workbenchSource.indexOf("<ProductScopeAdGroupOperationalChecklistPanel row={row} />");
const adGroupDataSummaryIndex = workbenchSource.indexOf("<ProductScopeAdGroupDataSummaryPanel row={row} />");
const adGroupEvidenceSwitcherIndex = workbenchSource.indexOf("<ProductScopeAdGroupEvidenceSwitcherPanel row={row} />");
const adGroupReviewOrderIndex = workbenchSource.indexOf("<ProductScopeAdGroupReviewOrderPanel row={row} />");
const advertisedProductsInFocusIndex = workbenchSource.indexOf("<ProductScopeAdGroupAdvertisedProductsPanel row={row} />");
const targetingEvidenceInFocusIndex = workbenchSource.indexOf("<ProductScopeTargetingEvidencePanel row={row} />");
const searchTermDiagnosisPanelIndex = workbenchSource.indexOf(
  "{row.searchTermDiagnosis && <ProductScopeSearchTermDiagnosisPanel rowId={row.id} diagnosis={row.searchTermDiagnosis} />}",
);
const placementDecisionIndex = workbenchSource.indexOf('aria-label="广告位证据判断"');
const adGroupReasoningDetailsIndex = workbenchSource.indexOf("<ProductScopeAdGroupReasoningDetails row={row} />");
const focusMetricsIndex = workbenchSource.indexOf(
  'className="productScopeAdGroupDiagnosisMetrics"',
  workbenchSource.indexOf("function ProductScopeAdGroupFocusPanel"),
);
const selectedSignalBranchIndex = workbenchSource.indexOf("{selectedSignal ? (");
const actionPanelIndex = workbenchSource.indexOf('<aside className="actionPanel">');
const manualActionTargetSwitchRenderIndex = workbenchSource.indexOf(
  'aria-label="人工动作目标切换提示"',
  actionPanelIndex,
);
const manualActionRouteSplitRenderIndex = workbenchSource.indexOf(
  'aria-label="人工确认双轨分流"',
  actionPanelIndex,
);
const adGroupActionBridgeRenderIndex = workbenchSource.indexOf(
  "<ProductScopeAdGroupActionBridgeCard",
);
const adGroupActionBridgeFunctionIndex = workbenchSource.indexOf("function ProductScopeAdGroupActionBridgeCard");
const adGroupActionBridgeDefaultEvidenceIndex = workbenchSource.indexOf(
  'aria-label="广告组证据带入核对"',
  adGroupActionBridgeFunctionIndex,
);
const adGroupActionBridgeFullEvidenceIndex = workbenchSource.indexOf(
  'aria-label="人工点击前完整证据层"',
  adGroupActionBridgeFunctionIndex,
);
const adGroupActionBridgeReviewEvidenceIndex = workbenchSource.indexOf(
  'aria-label="复盘回读证据链"',
  adGroupActionBridgeFunctionIndex,
);
const actionDecisionCardIndex = workbenchSource.indexOf('className="actionDecisionCard"');
const actionReviewCommandIndex = workbenchSource.indexOf('aria-label="右侧人工处理承接中间诊断"');
const actionBoundaryBarIndex = workbenchSource.indexOf('aria-label="建议处理边界"');
const selectedSignalScopeContextRenderIndex = workbenchSource.indexOf(
  "<SelectedSignalScopeContextStrip context={selectedSignalScopeContext} />",
);
const searchIntentFocusContextRenderIndex = workbenchSource.indexOf(
  "<SearchIntentFocusContextStrip context={selectedSearchIntentFocusContext} />",
);
const searchIntentTermReasonRenderIndex = workbenchSource.indexOf(
  "<SearchIntentSelectedTermReasonPanel summary={selectedSearchIntentTermReasonSummary} />",
);
const signalDiagnosisRenderIndex = workbenchSource.indexOf("<SignalDiagnosis");
const manualActionSectionIndex = workbenchSource.indexOf('<section className="manualActions" aria-label="人工处理">');
const searchIntentManualActionReadbackIndex = workbenchSource.indexOf(
  "<SearchIntentManualActionReadbackCard summary={selectedSearchIntentManualActionReadback} />",
);
const searchIntentManualActionPreflightConsistencyIndex = workbenchSource.indexOf(
  "<SearchIntentManualActionPreflightConsistencyCard summary={selectedSearchIntentManualActionPreflightConsistency} />",
);
const productScopeManualActionTargetAlignmentIndex = workbenchSource.indexOf(
  "<ProductScopeManualActionTargetAlignmentCard summary={selectedManualActionTargetAlignment} />",
);
const manualActionDiagnosisPathSummaryIndex = workbenchSource.indexOf('aria-label="人工按钮前诊断路径核对"');
const manualActionKeyEvidenceCheckIndex = workbenchSource.indexOf('aria-label="点击前关键证据核对"');
const manualActionButtonCommandSummaryIndex = workbenchSource.indexOf('aria-label="人工确认前四问"');
const manualActionPreflightDetailsIndex = workbenchSource.indexOf('aria-label="人工按钮前完整预检证据"');
const manualActionPreflightEvidenceGapIndex = workbenchSource.indexOf('aria-label="优先查看的边界与证据缺口"');
const manualActionPostWriteContractIndex = workbenchSource.indexOf('aria-label="点击后验收合同"');
const manualActionChoiceRecommendationIndex = workbenchSource.indexOf('aria-label="本次建议人工动作"');
const manualActionChoiceGuideIndex = workbenchSource.indexOf('className="manualActionChoiceGuide"');
const manualActionGridIndex = workbenchSource.indexOf('<div className="manualActionGrid" aria-label="人工动作按钮">');
const manualActionPostWriteSummaryIndex = workbenchSource.indexOf('aria-label="人工动作写后默认摘要"');
const manualActionPostWriteKeyEvidenceIndex = workbenchSource.indexOf('aria-label="写后关键证据快照"');
const manualActionPostWriteDetailsIndex = workbenchSource.indexOf('aria-label="人工动作写后完整审计材料"');
const manualActionReadbackPathIndex = workbenchSource.indexOf('aria-label="点击后读回路径"');
const reviewFlowTodoIndex = workbenchSource.indexOf('className="sideSection reviewFlowItem reviewFlowTodo"');
const reviewFlowDecisionSummaryIndex = workbenchSource.indexOf('aria-label="复盘回看四问"');
const reviewTodoPathReadbackPreviewIndex = workbenchSource.indexOf('aria-label="复盘待办诊断路径读回"');
const reviewRecordSaveDecisionPreviewIndex = workbenchSource.indexOf('aria-label="复盘保存业务判断"');
const reviewFlowStatusDetailsIndex = workbenchSource.indexOf('aria-label="复盘完整状态账本"');
const reviewTodoDecisionReadbackIndex = workbenchSource.indexOf('aria-label="复盘待办业务判断读回"');
const reviewRecordSavePathIndex = workbenchSource.indexOf('aria-label="复盘保存顺序核对"');
const reviewTodoEvidenceReadbackIndex = workbenchSource.indexOf('aria-label="复盘待办证据回读核对"');
const reviewEffectWindowLedgerIndex = workbenchSource.indexOf('aria-label="复盘效果窗口口径"');
const reviewRecordSaveGateIndex = workbenchSource.indexOf('aria-label="复盘保存门槛"');
const reviewMetricTableIndex = workbenchSource.indexOf('aria-label="复盘指标对比"');
const reviewRecordPreflightChecklistIndex = workbenchSource.indexOf('aria-label="复盘保存前检查清单"');
const saveReviewRecordButtonIndex = workbenchSource.indexOf('<button className="secondaryButton" onClick={handleSaveReviewRecord}');
const ruleImprovementSectionIndex = workbenchSource.indexOf('aria-label="规则改进门槛"');
const ruleFeedbackDecisionSummaryIndex = workbenchSource.indexOf('aria-label="规则反馈默认摘要"');
const ruleFeedbackDetailsIndex = workbenchSource.indexOf('aria-label="规则反馈完整审计材料"');
const ruleFeedbackSourcePreviewIndex = workbenchSource.indexOf('aria-label="规则反馈样本来源读回"');
const ruleFeedbackCandidateIndex = workbenchSource.indexOf('aria-label="规则反馈候选"');
const ruleFeedbackPrioritySummaryIndex = workbenchSource.indexOf('aria-label="规则反馈候选汇总"');
assert(productScopeSingleScreenRenderIndex >= 0, "Parent ASIN 单屏作战卡必须默认渲染");
assert(
  productScopeSingleScreenRenderIndex < productScopeBusinessPreviewIndex,
  "Parent ASIN 单屏作战卡必须先于折叠详情，避免用户先读长报表",
);
assert(diagnosisPanelIndex >= 0, "诊断区必须存在");
assert(productScopePriorityEntryBridgeRenderIndex > diagnosisPanelIndex, "Parent ASIN 进入理由必须渲染在诊断区内");
assert(
  productScopePriorityEntryBridgeRenderIndex < diagnosisBriefRenderIndex,
  "Parent ASIN 进入理由必须先于运营诊断路径，先解释为什么进入再展开纵向链路",
);
assert(
  productScopePriorityEntryBridgeRenderIndex < selectedAdGroupFocusRenderIndex,
  "Parent ASIN 进入理由必须先于当前广告组复核路径，先说明默认聚焦广告组再展示复核对象",
);
assert(diagnosisBriefRenderIndex > diagnosisPanelIndex, "Parent ASIN 运营诊断路径必须渲染在诊断区内");
assert(diagnosisBriefRenderIndex < adGroupDiagnosisRenderIndex, "Parent ASIN 运营诊断路径必须先于广告组优先级列表");
assert(diagnosisBriefRenderIndex < selectedSignalBranchIndex, "Parent ASIN 运营诊断路径不能被单条信号选中状态挡住");
assert(adGroupDiagnosisRenderIndex > diagnosisPanelIndex, "广告组问题定位必须渲染在诊断区内");
assert(adGroupDiagnosisRenderIndex < selectedAdGroupFocusRenderIndex, "广告组问题定位必须先于当前广告组复核路径");
assert(selectedAdGroupFocusRenderIndex > diagnosisPanelIndex, "当前广告组复核路径必须渲染在诊断区内");
assert(selectedAdGroupFocusRenderIndex < routeGuideRenderIndex, "当前广告组复核路径必须先于广告证据链导览");
const adGroupFocusDecisionIndex = workbenchSource.indexOf(
  'aria-label="当前广告组三段复核判断"',
  workbenchSource.indexOf("function ProductScopeAdGroupFocusPanel"),
);
const adGroupReviewOrderFunctionIndex = workbenchSource.indexOf("function ProductScopeAdGroupReviewOrderPanel");
const adGroupReviewPriorityIndex = workbenchSource.indexOf('aria-label="当前广告组优先查看证据层"', adGroupReviewOrderFunctionIndex);
const adGroupReviewPathIndex = workbenchSource.indexOf("先按顺序复核", adGroupReviewOrderFunctionIndex);
const adGroupReviewDetailsIndex = workbenchSource.indexOf(
  'className="productScopeAdGroupReviewOrderDetails"',
  adGroupReviewOrderFunctionIndex,
);
assert(adGroupFocusDecisionIndex < adGroupReviewOrderIndex, "当前广告组复核路径必须先给问题落点、证据缺口和人工下一步");
assert(adGroupFocusDecisionIndex < adGroupDataSummaryIndex, "当前广告组复核路径必须先给三段复核判断，再给广告组下具体数据摘要");
assert(adGroupDataSummaryIndex < adGroupReviewOrderIndex, "广告组下具体数据摘要必须先于复核顺序，避免用户直接进入明细清单");
assert(adGroupDataSummaryIndex < adGroupEvidenceSwitcherIndex, "广告组下具体数据摘要必须先于证据切换器");
assert(adGroupEvidenceSwitcherIndex < adGroupReviewOrderIndex, "证据切换器必须先于完整复核顺序，先切换再读长清单");
assert(adGroupEvidenceSwitcherIndex < adGroupChecklistIndex, "证据切换器必须先于完整运营检查清单，避免默认展开四层明细");
assert(adGroupDataSummaryIndex < focusMetricsIndex, "广告组下具体数据摘要必须先于广告组证据摘要");
assert(adGroupDataSummaryIndex < adGroupChecklistIndex, "广告组下具体数据摘要必须先于完整运营检查清单");
assert(adGroupReviewPriorityIndex > adGroupReviewOrderFunctionIndex, "当前广告组复核顺序内必须有本次优先证据层");
assert(adGroupReviewPriorityIndex < adGroupReviewPathIndex, "当前广告组复核顺序内必须先给本次优先证据层，再给四层完整路径");
assert(adGroupReviewPathIndex < adGroupReviewDetailsIndex, "当前广告组复核顺序默认层必须先给路径，再把四层步骤放进展开审计");
assert(adGroupReviewOrderIndex < focusMetricsIndex, "当前广告组复核路径必须先给复核顺序，再展示广告组证据摘要");
assert(adGroupReviewOrderIndex < adGroupChecklistIndex, "当前广告组复核路径必须先给复核顺序，再把完整运营检查清单作为折叠审计材料");
assert(adGroupChecklistIndex < advertisedProductsInFocusIndex, "完整运营检查清单必须先于广告组证据明细，便于需要时审计回看");
assert(advertisedProductsInFocusIndex < targetingEvidenceInFocusIndex, "投放词证据必须放在广告组内投放商品之后");
assert(targetingEvidenceInFocusIndex < searchTermDiagnosisPanelIndex, "投放词证据必须先于搜索词问题定位");
assert(searchTermDiagnosisPanelIndex < placementDecisionIndex, "搜索词问题定位必须先于广告位证据判断");
assert(placementDecisionIndex < adGroupReasoningDetailsIndex, "AI 推理细节必须放在广告位证据之后");
assert(routeGuideRenderIndex > diagnosisPanelIndex, "广告证据链导览必须渲染在诊断区内");
assert(routeGuideRenderIndex < selectedSignalBranchIndex, "广告证据链导览不能被单条信号选中状态挡住");
assert(adGroupDiagnosisRenderIndex < selectedSignalBranchIndex, "广告组问题定位不能被单条信号选中状态挡住");
assert(actionPanelIndex >= 0, "右侧建议处理区必须存在");
assert(manualActionTargetSwitchRenderIndex > actionPanelIndex, "人工动作目标切换必须渲染在右侧建议处理默认层");
assert(manualActionRouteSplitRenderIndex > manualActionTargetSwitchRenderIndex, "人工确认双轨必须紧跟目标切换读回");
assert(manualActionRouteSplitRenderIndex < adGroupActionBridgeRenderIndex, "人工确认双轨必须先于广告组上下文，避免把广告组误读成当前可写对象");
assert(adGroupActionBridgeRenderIndex > actionPanelIndex, "当前广告组证据上下文必须渲染在右侧建议处理区内");
assert(adGroupActionBridgeRenderIndex < actionDecisionCardIndex, "当前广告组证据上下文必须先于建议动作摘要");
assert(actionReviewCommandIndex > actionDecisionCardIndex, "右侧人工处理承接必须渲染在建议动作摘要内");
assert(actionReviewCommandIndex < actionBoundaryBarIndex, "右侧建议处理必须先承接中间诊断的人工下一步，再展示通用动作边界");
assert(adGroupActionBridgeDefaultEvidenceIndex > adGroupActionBridgeFunctionIndex, "右侧广告组上下文必须先给证据带入核对");
assert(adGroupActionBridgeDefaultEvidenceIndex < adGroupActionBridgeFullEvidenceIndex, "证据带入核对必须先于完整四层证据");
assert(adGroupActionBridgeFullEvidenceIndex < adGroupActionBridgeReviewEvidenceIndex, "完整四层证据必须先于复盘回读证据链");
assertIncludes(workbenchSource, "actionReviewCommand");
assertIncludes(workbenchSource, "selectedSearchTermOpportunityReviewChain.currentJudgement");
assertIncludes(workbenchSource, "selectedSearchTermOpportunityReviewChain.nextManualStep");
assertIncludes(workbenchSource, "selectedSearchTermOpportunityReviewChain.evidenceGap");
assertIncludes(workbenchSource, "selectedSearchTermOpportunityReviewChain.actionBoundary");
assertIncludes(stylesSource, ".actionReviewCommand");
assertIncludes(workbenchSource, "buildSelectedSignalScopeContext");
assertIncludes(workbenchSource, "selectedSignalScopeContext");
assertIncludes(workbenchSource, "buildSearchIntentFocusContext");
assertIncludes(workbenchSource, "selectedSearchIntentFocusContext");
assertIncludes(workbenchSource, "buildSearchIntentSelectedTermReasonSummary");
assertIncludes(workbenchSource, "selectedSearchIntentTermReasonSummary");
assertIncludes(workbenchSource, "activeSearchIntentReviewCard");
assertIncludes(workbenchSource, "function evidenceFactDisplayLabel");
assertIncludes(workbenchSource, 'label === "Parent ASIN 搜索词表现聚合"');
assertIncludes(workbenchSource, 'return "搜索词表现分组";');
assertIncludes(workbenchSource, "function SelectedSignalScopeContextStrip");
assertIncludes(workbenchSource, "function SearchIntentFocusContextStrip");
assertIncludes(workbenchSource, "function SearchIntentSelectedTermReasonPanel");
assertIncludes(workbenchSource, 'aria-label="选中信号与当前诊断入口关系"');
assertIncludes(workbenchSource, 'aria-label="广告搜索词表现复核与当前信号关系"');
assertIncludes(workbenchSource, 'aria-label="具体 SearchTerm 复核理由"');
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 运营诊断路径"');
assertIncludes(workbenchSource, 'aria-label="运营诊断路径顺序"');
assertIncludes(workbenchSource, 'aria-label="当前 Parent ASIN 进入理由"');
assertIncludes(workbenchSource, 'aria-label="允许的人工动作"');
assertIncludes(stylesSource, ".productScopePriorityEntryBridge");
assertIncludes(stylesSource, "order: 1;");
assertIncludes(stylesSource, ".productScopePriorityDecisionSummary");
assertIncludes(stylesSource, ".productScopePriorityDecisionHeader");
assertIncludes(stylesSource, ".productScopeDiagnosisBrief");
assertIncludes(stylesSource, ".productScopeDiagnosisBriefPath");
assertIncludes(stylesSource, ".productScopeDiagnosisFrameworkEvidence");
assertIncludes(stylesSource, ".productScopeDiagnosisFrameworkEvidence summary");
assertIncludes(stylesSource, ".productScopeDiagnosisFrameworkEvidence b");
assertIncludes(stylesSource, ".productScopeDiagnosisFrameworkNext");
assertIncludes(stylesSource, ".productScopeTargetingEvidence");
assertIncludes(stylesSource, ".productScopeTargetingEvidenceHeader");
assertIncludes(stylesSource, ".productScopeAdGroupAdvertisedProductsDecision");
assertIncludes(stylesSource, ".productScopeTargetingEvidence[open]");
assertIncludes(stylesSource, ".productScopeTargetingEvidence summary");
assertIncludes(stylesSource, ".productScopeAdGroupFocusDecision");
assertIncludes(stylesSource, ".productScopeAdGroupDataSummary");
assertIncludes(stylesSource, ".productScopeAdGroupDataSummaryItems");
assertIncludes(stylesSource, ".productScopeAdGroupEvidenceSwitcher");
assertIncludes(stylesSource, ".productScopeAdGroupEvidenceTabs");
assertIncludes(stylesSource, ".productScopeAdGroupEvidenceTab.active");
assertIncludes(stylesSource, ".productScopeAdGroupEvidenceActiveGrid");
assertIncludes(stylesSource, ".productScopeAdGroupChecklist");
assertIncludes(stylesSource, ".productScopeAdGroupChecklistProof");
assertIncludes(stylesSource, ".productScopeAdGroupChecklistProof span");
assertIncludes(stylesSource, ".adGroupActionBridgeReviewEvidence");
assertIncludes(stylesSource, ".adGroupActionBridgeReviewEvidence ul");
assertIncludes(stylesSource, ".adGroupActionBridgeDefaultEvidence");
assertIncludes(stylesSource, ".adGroupActionBridgeDefaultEvidence ul");
assertIncludes(stylesSource, ".adGroupActionBridgeFullEvidence");
assertIncludes(stylesSource, ".adGroupActionBridgeFullEvidence summary");
assertIncludes(stylesSource, ".adGroupActionBridgeParentProof");
assertIncludes(stylesSource, ".adGroupActionBridgeParentProof summary");
assertIncludes(stylesSource, ".adGroupActionBridgeParentProof ul");
assertIncludes(stylesSource, ".adGroupActionBridgePreflightEvidence");
assertIncludes(stylesSource, ".adGroupActionBridgeCard");
assertIncludes(stylesSource, ".adGroupActionBridgeScope");
assertIncludes(stylesSource, ".adGroupActionBridgeList");
assertIncludes(stylesSource, ".productScopeAdGroupReasoningDetails");
assertIncludes(workbenchSource, 'aria-label="SearchTerm 复核执行路径"');
assertIncludes(signalUiSource, "buildSelectedSignalScopeContext");
assertIncludes(signalUiSource, "buildSearchIntentFocusContext");
assertIncludes(signalUiSource, "buildSearchIntentSelectedTermReasonSummary");
assertIncludes(signalUiSource, "当前诊断入口仍是");
assertIncludes(signalUiSource, "选中信号只决定中间证据和右侧人工确认对象");
assertIncludes(signalUiSource, "不能自动归因");
assertIncludes(signalUiSource, "从当前 Parent ASIN 视角聚合广告中实际产生表现的用户搜索词");
assertIncludes(signalUiSource, "Parent ASIN 广告搜索词表现复核「${focusLabel}」只是从 Parent ASIN 视角聚合广告搜索词表现的分析视角");
assertIncludes(signalUiSource, "Parent ASIN 广告搜索词表现复核用于聚合同类广告搜索词表现");
assertIncludes(signalUiSource, "经营诊断入口");
assertIncludes(signalUiSource, "搜索词表现分组");
assertIncludes(signalUiSource, "当前诊断对象");
assertIncludes(signalUiSource, "运营判断");
assertIncludes(signalUiSource, "优先 SearchTerm");
assertIncludes(signalUiSource, "Parent ASIN 聚合视角");
assertIncludes(signalUiSource, "优先打开理由");
assertIncludes(signalUiSource, "当前中间诊断");
assertIncludes(signalUiSource, "executionSteps");
assertIncludes(signalUiSource, "1. 锁定入口");
assertIncludes(signalUiSource, "2. 锁定 SearchTerm");
assertIncludes(signalUiSource, "3. 核对广告承接");
assertIncludes(signalUiSource, "4. 选择人工动作");
assertIncludes(signalUiSource, "这块只解释为什么从当前 Parent ASIN 的广告搜索词表现聚合进入具体 SearchTerm");
assertIncludes(signalUiSource, "不能自动加词、否词、调价或暂停广告");
assertIncludes(workbenchSource, "context.pathItems.map");
assertIncludes(workbenchSource, "Parent ASIN 广告搜索词表现复核");
assertIncludes(workbenchSource, "搜索词表现分组");
assertIncludes(workbenchSource, "summary.rows.map");
assertIncludes(workbenchSource, "summary.executionSteps.map");
assertIncludes(workbenchSource, "searchIntentTermReason");
assertIncludes(workbenchSource, "searchIntentExecutionPath");
assertIncludes(workbenchSource, 'aria-label="人工动作选择依据"');
assertIncludes(workbenchSource, 'aria-label="本次建议人工动作"');
assertIncludes(workbenchSource, "manualActionChoiceRecommendation({");
assertIncludes(workbenchSource, "diagnosisEvidence: selectedDiagnosisEvidenceSummary");
assertIncludes(workbenchSource, "selectedManualActionChoiceRecommendation.evidenceLink");
assertIncludes(workbenchSource, "selectedManualActionChoiceRecommendation.evidenceBoundary");
assertIncludes(workbenchSource, "selectedManualActionChoiceGates");
assertIncludes(workbenchSource, "manualActionChoiceGuides.map");
assertIncludes(workbenchSource, "guideGate.disabled ? guideGate.compactReason");
assertIncludes(workbenchSource, "guideGate.reason ?? guide.boundary");
assertIncludes(reviewUiSource, "manualActionChoiceEvidenceLink");
assertIncludes(reviewUiSource, "证据回链：");
assertIncludes(reviewUiSource, "边界回链：");
assertIncludes(stylesSource, ".manualActionChoiceRecommendation");
assertNotIncludes(workbenchSource, "<b>聚合标签</b>");
assertIncludes(signalUiSource, "以后端预检确认的 SearchTerm 稳定对象为准");
assertNotIncludes(signalUiSource, "右侧人工动作也必须落到这条 SearchTerm 的稳定对象");
assert(selectedSignalScopeContextRenderIndex > selectedSignalBranchIndex, "选中信号入口关系必须渲染在信号详情分支内");
assert(selectedSignalScopeContextRenderIndex < signalDiagnosisRenderIndex, "选中信号入口关系必须先于信号详情展示");
assert(searchIntentFocusContextRenderIndex > selectedSignalScopeContextRenderIndex, "广告搜索词聚合承接必须跟在入口关系之后");
assert(searchIntentFocusContextRenderIndex < signalDiagnosisRenderIndex, "广告搜索词聚合承接必须先于信号详情展示");
assert(searchIntentTermReasonRenderIndex > searchIntentFocusContextRenderIndex, "具体 SearchTerm 复核理由必须跟在聚合承接之后");
assert(searchIntentTermReasonRenderIndex < signalDiagnosisRenderIndex, "具体 SearchTerm 复核理由必须先于信号详情展示");
assert(searchIntentManualActionReadbackIndex > manualActionSectionIndex, "搜索词人工留痕对象读回必须渲染在人工确认区内");
assert(searchIntentManualActionReadbackIndex < manualActionGridIndex, "搜索词人工留痕对象读回必须先于人工动作按钮");
assert(
  searchIntentManualActionPreflightConsistencyIndex > searchIntentManualActionReadbackIndex,
  "搜索词后端预检一致性核对必须跟在人工留痕对象读回之后",
);
assert(
  searchIntentManualActionPreflightConsistencyIndex < manualActionGridIndex,
  "搜索词后端预检一致性核对必须先于人工动作按钮",
);
assert(productScopeManualActionTargetAlignmentIndex > manualActionSectionIndex, "人工动作对象链路读回必须渲染在人工确认区内");
assert(productScopeManualActionTargetAlignmentIndex < manualActionGridIndex, "人工动作对象链路读回必须先于人工动作按钮");
assert(manualActionDiagnosisPathSummaryIndex > manualActionSectionIndex, "人工按钮前诊断路径核对必须渲染在人工确认区内");
assert(
  manualActionDiagnosisPathSummaryIndex < manualActionKeyEvidenceCheckIndex,
  "人工按钮前必须先读回诊断路径，再核对关键证据。",
);
assert(manualActionDiagnosisPathSummaryIndex < manualActionGridIndex, "人工按钮前诊断路径核对必须先于人工动作按钮");
assert(manualActionKeyEvidenceCheckIndex > manualActionSectionIndex, "点击前关键证据核对必须渲染在人工确认区内");
assert(
  manualActionKeyEvidenceCheckIndex < manualActionButtonCommandSummaryIndex,
  "人工确认前四问之前必须先核对同一份关键证据，避免用户点击前重新拼证据。",
);
assert(manualActionKeyEvidenceCheckIndex < manualActionGridIndex, "点击前关键证据核对必须先于人工动作按钮");
assert(manualActionButtonCommandSummaryIndex > manualActionSectionIndex, "人工确认前四问必须渲染在人工确认区内");
assert(
  manualActionButtonCommandSummaryIndex < manualActionPreflightDetailsIndex,
  "人工确认默认层必须先回答业务判断，再展开完整预检证据。",
);
assert(manualActionButtonCommandSummaryIndex < manualActionGridIndex, "人工确认前四问必须先于人工动作按钮");
assert(manualActionPreflightDetailsIndex < manualActionGridIndex, "完整预检证据必须保留在按钮前的折叠审计区");
assert(
  manualActionPreflightDetailsIndex < manualActionPreflightEvidenceGapIndex &&
    manualActionPreflightEvidenceGapIndex < manualActionGridIndex,
  "优先边界和证据缺口必须进入完整预检折叠区，避免默认铺成长证据。",
);
assert(
  manualActionPreflightDetailsIndex < manualActionPostWriteContractIndex &&
    manualActionPostWriteContractIndex < manualActionGridIndex,
  "点击后验收合同必须进入完整预检折叠区，按钮前默认层只保留执行摘要。",
);
assert(manualActionChoiceRecommendationIndex > manualActionSectionIndex, "本次建议人工动作必须渲染在人工确认区内");
assert(manualActionChoiceRecommendationIndex < manualActionChoiceGuideIndex, "本次建议人工动作必须先于四个动作选择依据展示");
assert(manualActionChoiceRecommendationIndex < manualActionGridIndex, "本次建议人工动作必须先于人工动作按钮展示");
assert(manualActionChoiceGuideIndex > manualActionSectionIndex, "人工动作选择依据必须渲染在人工确认区内");
assert(manualActionChoiceGuideIndex < manualActionGridIndex, "人工动作选择依据必须先于人工动作按钮展示");
assert(manualActionPostWriteSummaryIndex > manualActionGridIndex, "人工动作写后摘要必须跟在按钮之后，服务点击后读回");
assert(
  manualActionPostWriteSummaryIndex < manualActionPostWriteKeyEvidenceIndex,
  "人工动作写后默认层必须先回答写入结果，再读回写后关键证据。",
);
assert(
  manualActionPostWriteKeyEvidenceIndex < manualActionPostWriteDetailsIndex,
  "写后关键证据快照必须先于完整审计材料，避免用户写后重新拼证据。",
);
assert(
  manualActionPostWriteDetailsIndex < manualActionReadbackPathIndex &&
    manualActionReadbackPathIndex < reviewFlowTodoIndex,
  "点击后读回路径必须保留在完整审计材料折叠区，避免默认铺开三层账本。",
);
assert(reviewFlowTodoIndex >= 0, "复盘待办区必须存在");
assert(reviewTodoDecisionReadbackIndex > reviewFlowTodoIndex, "复盘待办必须先读回当时业务判断");
assert(reviewRecordSavePathIndex > reviewTodoDecisionReadbackIndex, "复盘保存顺序必须紧跟业务判断读回");
assert(reviewRecordSavePathIndex < reviewTodoEvidenceReadbackIndex, "保存顺序核对必须先于完整证据门禁");
assert(reviewRecordSavePathIndex < reviewEffectWindowLedgerIndex, "保存顺序核对必须先于处理前后指标窗口详情");
assert(reviewRecordSavePathIndex < reviewRecordSaveGateIndex, "保存顺序核对必须先于保存门槛");
assert(reviewFlowDecisionSummaryIndex >= 0, "复盘状态必须先展示复盘回看四问");
assert(reviewTodoPathReadbackPreviewIndex > reviewFlowDecisionSummaryIndex, "复盘回看四问必须读回复盘待办诊断路径");
assert(reviewTodoPathReadbackPreviewIndex < reviewFlowStatusDetailsIndex, "复盘待办诊断路径读回必须先于完整状态账本");
assert(reviewRecordSaveDecisionPreviewIndex > reviewTodoPathReadbackPreviewIndex, "复盘默认摘要必须在诊断路径后展示保存业务判断");
assert(reviewRecordSaveDecisionPreviewIndex < reviewFlowStatusDetailsIndex, "复盘保存业务判断必须先于完整状态账本");
assert(reviewFlowDecisionSummaryIndex < reviewFlowStatusDetailsIndex, "复盘回看四问必须先于完整状态账本");
assert(reviewFlowDecisionSummaryIndex < reviewFlowTodoIndex, "复盘回看四问必须先于复盘待办明细");
assert(reviewFlowStatusDetailsIndex < reviewFlowTodoIndex, "复盘待办明细必须保留在完整状态账本里");
assert(reviewEffectWindowLedgerIndex < reviewRecordSaveGateIndex, "处理前后指标窗口必须先于保存门槛");
assert(reviewRecordSaveGateIndex < reviewMetricTableIndex, "保存门槛必须先于指标明细表");
assert(reviewMetricTableIndex < reviewRecordPreflightChecklistIndex, "指标明细表必须先于保存前检查清单");
assert(reviewRecordPreflightChecklistIndex < saveReviewRecordButtonIndex, "保存按钮必须在保存前检查清单之后");
assert(ruleImprovementSectionIndex >= 0, "规则改进门槛区必须存在");
assert(ruleFeedbackDecisionSummaryIndex > ruleImprovementSectionIndex, "规则反馈默认摘要必须渲染在规则改进区内");
assert(ruleFeedbackSourcePreviewIndex > ruleFeedbackDecisionSummaryIndex, "规则反馈默认摘要必须读回样本来源");
assert(ruleFeedbackSourcePreviewIndex < ruleFeedbackDetailsIndex, "规则反馈样本来源读回必须先于完整审计材料");
assert(ruleFeedbackDecisionSummaryIndex < ruleFeedbackDetailsIndex, "规则反馈必须先给默认业务判断，再展开完整审计材料");
assert(ruleFeedbackDetailsIndex < ruleFeedbackCandidateIndex, "规则反馈候选必须保留在完整审计材料折叠区");
assert(ruleFeedbackDetailsIndex < ruleFeedbackPrioritySummaryIndex, "规则反馈样本池必须保留在完整审计材料折叠区");

assertIncludes(workbenchSource, 'aria-label="Parent ASIN 经营诊断路径"');
assertIncludes(workbenchSource, 'aria-label="诊断入口路径说明"');
assertNotIncludes(workbenchSource, 'aria-label="经营商品优先入口说明"');
assertIncludes(workbenchSource, "productScopePathPreview");
assertIncludes(workbenchSource, "buildProductScopeFirstScreenSummary");
assertIncludes(workbenchSource, "productScopeBusinessPreview");
assertIncludes(workbenchSource, '<details className="productScopeBusinessPreview" aria-label="Parent ASIN 首屏经营摘要">');
assertIncludes(workbenchSource, 'className="productScopeBusinessPreviewSummary"');
assertIncludes(workbenchSource, 'className="productScopeBusinessPreviewBody"');
assertNotIncludes(workbenchSource, '<div className="productScopeBusinessPreview" aria-label="Parent ASIN 首屏经营摘要">');
assertIncludes(stylesSource, ".productScopeBusinessPreviewSummary");
assertIncludes(stylesSource, ".productScopeBusinessPreviewBody");
assertIncludes(stylesSource, 'content: "展开证据"');
assertIncludes(workbenchSource, "useRef");
assertIncludes(workbenchSource, "workbenchGridRef");
assertIncludes(workbenchSource, "adGroupPriorityGateRef");
assertIncludes(workbenchSource, "isEvidenceDrilldownFocused");
assertIncludes(workbenchSource, "setIsEvidenceDrilldownFocused");
assertIncludes(workbenchSource, "handleOpenProductScopeEvidenceDrilldown");
assertIncludes(workbenchSource, "const target = adGroupPriorityGateRef.current ?? workbenchGridRef.current");
assertIncludes(workbenchSource, "priorityGateRef={adGroupPriorityGateRef}");
assertIncludes(workbenchSource, "ref={priorityGateRef} tabIndex={-1} aria-label=\"广告组优先判断\"");
assertIncludes(workbenchSource, "已定位默认广告组证据");
assertIncludes(workbenchSource, "先看 ${selectedAdGroupDiagnosis.title} 的广告组优先判断");
assertIncludes(workbenchSource, "function handleSelectSearchIntent");
assertIncludes(workbenchSource, "function handleSelectQueueFilter");
assertIncludes(workbenchSource, "buildSearchTermAdContextRows(signal)");
assertIncludes(workbenchSource, "row.reviewPriority");
assertIncludes(workbenchSource, "row.reviewReason");
assertIncludes(workbenchSource, "selectedSearchIntentScopeId");
assertIncludes(workbenchSource, "activeSearchIntentLabel");
assertIncludes(workbenchSource, "function clearSearchIntentFocus");
assertIncludes(workbenchSource, "setSelectedSearchIntentScopeId(null);");
assertIncludes(workbenchSource, "resolveSearchIntentFocusSelection(");
assertIncludes(workbenchSource, "resolveProductScopePrioritySelectionId(");
assertIncludes(workbenchSource, "activeProductScopeId,");
assertNotIncludes(workbenchSource, "setSelectedProductScopeId(nextActiveProductScopeId);");
assertIncludes(workbenchSource, "setSelectedSearchIntentLabel(nextFocus.intentLabel)");
assertIncludes(workbenchSource, "setSelectedSearchIntentScopeId(nextFocus.scopeId)");
assertIncludes(workbenchSource, "if (selectedSearchIntentScopeId === activeProductScopeId) return;");
assertIncludes(workbenchSource, "buildSearchIntentEntryLockSummary");
assertIncludes(workbenchSource, "buildSearchIntentReviewDecisionSummary");
assertIncludes(workbenchSource, "searchIntentEntryLockSummary");
assertIncludes(workbenchSource, "searchIntentReviewDecisionSummary");
assertIncludes(workbenchSource, 'aria-label="广告搜索词复核作战条"');
assertIncludes(workbenchSource, "summary.businessQuestion");
assertIncludes(workbenchSource, "summary.topDecisionReason");
assertIncludes(workbenchSource, "summary.manualReviewPath");
assertIncludes(workbenchSource, "summary.proofBoundary");
assertIncludes(workbenchSource, "<span>经营诊断入口</span>");
assertIncludes(workbenchSource, 'aria-label="经营诊断入口筛选器"');
assertIncludes(workbenchSource, "value={activeProductScopeId}");
assertIncludes(workbenchSource, "onChange={(event) => handleSelectProductScope(event.target.value)}");
assertNotIncludes(workbenchSource, "onChange={(event) => setSelectedProductScopeId(event.target.value)}");
assertIncludes(workbenchSource, "filterSignalsBySearchIntent(displayProductScopedSignals, activeSearchIntentLabel)");
assertIncludes(workbenchSource, "绑定诊断入口：{selectedProductScopeOption?.label ?? activeProductScopeId}");
assertIncludes(workbenchSource, 'aria-label="广告搜索词表现复核入口锁定"');
assertIncludes(workbenchSource, "searchIntentEntryLock");
assertIncludes(signalUiSource, "诊断入口锁定核对");
assertIncludes(signalUiSource, "不把 Parent ASIN 广告搜索词表现复核写回 ProductScope");
assertIncludes(signalUiSource, "不会切换经营诊断入口");
assertNotIncludes(workbenchSource, "filterSignalsBySearchIntent(normalizedSignals, intentLabel)");
assertNotIncludes(workbenchSource, 'setFilter("opportunity_expansion");');
assertNotIncludes(workbenchSource, "setSelectedProductScopeId(intentLabel)");
assertNotIncludes(workbenchSource, "setSelectedProductScopeId(card.intentLabel)");
assertNotIncludes(workbenchSource, "value={activeSearchIntentLabel}");
assertNotIncludes(workbenchSource, "value={selectedSearchIntentLabel}");
assertNotIncludes(workbenchSource, "onChange={(event) => setSelectedSearchIntentLabel(event.target.value)}");
assertIncludes(workbenchSource, "fetchSearchIntents(selectedMarketId, nextActiveProductScopeId)");
assertIncludes(workbenchSource, "fetchSearchIntents(selectedMarketId, activeProductScopeId)");
assertNotIncludes(workbenchSource, "fetchSearchIntents()");
assertIncludes(workbenchSource, "Parent ASIN 广告搜索词表现复核");
assertIncludes(workbenchSource, "从当前 Parent ASIN 视角，聚合广告中实际产生表现的用户搜索词，帮助分析 SearchTerm 表现");
assertIncludes(workbenchSource, 'aria-label="广告搜索词表现复核数据口径"');
assertIncludes(workbenchSource, "searchIntentPanelContext.purpose");
assertIncludes(workbenchSource, "searchIntentPanelContext.dataGrain");
assertIncludes(workbenchSource, "searchIntentPanelContext.interactionBoundary");
assertIncludes(workbenchSource, "searchIntentPanelContext.proves");
assertIncludes(workbenchSource, "searchIntentPanelContext.doesNotProve");
assertIncludes(workbenchSource, "searchIntentPanelContext.nextManualStep");
assertIncludes(workbenchSource, "searchIntentPanelContext.signalMetricBoundary");
assertIncludes(workbenchSource, "searchIntentPanelContext.boundary");
assertIncludes(workbenchSource, "SearchIntentReviewDecisionSummaryPanel");
assertIncludes(workbenchSource, 'aria-label="广告搜索词表现复核判断摘要"');
assertIncludes(workbenchSource, 'aria-label="有效词、浪费词和证据缺口分布"');
assertIncludes(workbenchSource, 'aria-label="搜索词复核优先顺序"');
assertIncludes(workbenchSource, "summary.priorityPathItems.map");
assertIncludes(workbenchSource, 'aria-label="搜索词复核下一步"');
assertIncludes(workbenchSource, "<b>点击后</b>");
assertIncludes(workbenchSource, 'aria-label="广告搜索词表现复核空态"');
assertIncludes(workbenchSource, "暂无搜索词表现聚合");
assertIncludes(workbenchSource, "诊断入口保持不变，这里只是从 Parent ASIN 视角聚合广告用户搜索词表现，并筛出同类 SearchTerm 信号；不做商品归因");
assertIncludes(workbenchSource, "card.purpose");
assertIncludes(workbenchSource, "card.primarySearchTerm");
assertIncludes(workbenchSource, "card.primarySearchTermReason");
assertIncludes(workbenchSource, 'aria-label="广告搜索词表现运营判断"');
assertIncludes(workbenchSource, 'aria-label="搜索词复核闭环状态"');
assertIncludes(workbenchSource, "card.reviewStatus.label");
assertIncludes(workbenchSource, "card.reviewStatus.reason");
assertIncludes(workbenchSource, "下一步：{card.reviewStatus.nextStep}");
assertIncludes(workbenchSource, 'className="searchIntentReviewCardPrimary"');
assertIncludes(workbenchSource, 'className="searchIntentReviewCardSnapshot"');
assertIncludes(workbenchSource, 'aria-label="搜索词复核默认摘要"');
assertIncludes(workbenchSource, '<details className="searchIntentReviewCardEvidence">');
assertIncludes(workbenchSource, "<summary>展开证据与边界</summary>");
assertIncludes(workbenchSource, 'className="searchIntentReviewCardEvidenceBody"');
assertIncludes(workbenchSource, "card.operationDecisionLabel");
assertIncludes(workbenchSource, "card.operationDecisionReason");
assertIncludes(workbenchSource, "card.operationDecisionTone");
assertIncludes(workbenchSource, "card.intentLabel === activeSearchIntentLabel");
assertIncludes(workbenchSource, "buildSearchIntentFocusContext(activeSearchIntentLabel, selectedSignal, selectedProductScopeOption, activeSearchIntentReviewCard)");
assertIncludes(workbenchSource, "业务问题：{card.businessQuestion}");
assertIncludes(workbenchSource, "card.currentJudgement");
assertIncludes(workbenchSource, "card.metricPurpose");
assertIncludes(workbenchSource, 'aria-label="广告搜索词表现指标目的"');
assertIncludes(workbenchSource, "card.metricPurposeItems.map");
assertIncludes(workbenchSource, "card.adContext");
assertIncludes(workbenchSource, "card.evidenceGap");
assertIncludes(workbenchSource, "闭环状态：{card.reviewStatus.label}");
assertIncludes(workbenchSource, "card.signalMetricBoundary");
assertIncludes(workbenchSource, "与具体信号关系");
assertIncludes(workbenchSource, "优先打开");
assertIncludes(workbenchSource, "card.boundary");
assertIncludes(workbenchSource, "当前 Parent ASIN 广告搜索词表现复核：{activeSearchIntentLabel}");
assertIncludes(workbenchSource, "广告搜索词表现复核不切换经营商品或广告组");
assertIncludes(workbenchSource, "当前 Parent ASIN 广告搜索词表现复核暂无对应 AI 信号");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 广告搜索词表现复核"');
assertNotIncludes(workbenchSource, "语义组复核");
assertNotIncludes(workbenchSource, "searchIntentReviewCards.length > 0 && (");
assertNotIncludes(workbenchSource, 'aria-label="搜索词语义聚焦"');
assertNotIncludes(workbenchSource, "聚焦语义组");
assertNotIncludes(workbenchSource, "搜索词机会二级筛选");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 广告搜索词表现复核背景核对"');
assertIncludes(workbenchSource, 'aria-label="搜索词人工留痕对象读回"');
assertIncludes(workbenchSource, "buildProductScopeManualActionTargetAlignment");
assertIncludes(workbenchSource, "selectedManualActionTargetAlignment");
assertIncludes(workbenchSource, "ProductScopeManualActionTargetAlignmentCard");
assertIncludes(workbenchSource, 'aria-label="人工动作对象链路读回"');
assertIncludes(signalUiSource, "buildProductScopeManualActionTargetAlignment");
assertIncludes(signalUiSource, "人工动作对象链路一致");
assertIncludes(signalUiSource, "当前优先入口、选中信号和后端预检对象");
assertIncludes(signalUiSource, "不能把一个 Parent ASIN 下看到的证据保存到另一条 SearchTerm");
assertIncludes(stylesSource, ".manualActionTargetAlignment");
assertIncludes(stylesSource, ".manualActionTargetAlignment.blocked");
assertIncludes(workbenchSource, "buildSearchIntentManualActionReadbackSummary");
assertIncludes(workbenchSource, "buildSearchIntentManualActionPreflightConsistencySummary");
assertIncludes(workbenchSource, "selectedSearchIntentManualActionReadback");
assertIncludes(workbenchSource, "selectedSearchIntentManualActionPreflightConsistency");
assertIncludes(workbenchSource, "SearchIntentManualActionReadbackCard");
assertIncludes(workbenchSource, "SearchIntentManualActionPreflightConsistencyCard");
assertIncludes(workbenchSource, "searchIntentManualActionReadback");
assertIncludes(workbenchSource, "searchIntentManualActionPreflightConsistency");
assertIncludes(reviewUiSource, "buildSearchIntentManualActionReadbackSummary");
assertIncludes(reviewUiSource, "buildSearchIntentManualActionPreflightConsistencySummary");
assertIncludes(reviewUiSource, "人工留痕对象读回");
assertIncludes(reviewUiSource, "后端预检一致性核对");
assertIncludes(reviewUiSource, "入口上下文");
assertIncludes(reviewUiSource, "复盘对象");
assertIncludes(reviewUiSource, "当时判断");
assertIncludes(reviewUiSource, "保存后用途");
assertIncludes(reviewUiSource, "SearchTerm / 广告组 / 投放词 / 广告位复核链一致");
assertIncludes(reviewUiSource, "广告组合流判断");
assertIncludes(reviewUiSource, "同组投放商品表现");
assertIncludes(reviewUiSource, "逐投放上下文");
assertIncludes(reviewUiSource, "投放词证据");
assertIncludes(reviewUiSource, "缺少 SearchTerm、广告组、同组投放商品、逐投放上下文、投放词、广告位或补证边界");
assertIncludes(reviewUiSource, "不能自动加词、否词、调价、暂停广告");
assertIncludes(workbenchSource, 'aria-label="逐投放上下文复核"');
assertIncludes(workbenchSource, "同一个 SearchTerm 可能跨广告活动、广告组和投放词出现");
assertIncludes(workbenchSource, "实际写入以后端 preflight evidence_snapshot_preview 为准");
assertIncludes(workbenchSource, "复核上下文不是人工动作对象");
assertNotIncludes(workbenchSource, "当前语义组留痕");
const searchIntentReviewPanelIndex = workbenchSource.indexOf('aria-label="Parent ASIN 广告搜索词表现复核"');
const searchIntentReviewDecisionSummaryIndex = workbenchSource.indexOf("<SearchIntentReviewDecisionSummaryPanel summary={searchIntentReviewDecisionSummary} />");
const searchIntentReviewCommandIndex = workbenchSource.indexOf('aria-label="广告搜索词复核作战条"');
const searchIntentReviewDistributionIndex = workbenchSource.indexOf('aria-label="有效词、浪费词和证据缺口分布"');
const searchIntentReviewListIndex = workbenchSource.indexOf('className="searchIntentReviewList"');
const searchIntentReviewStatusIndex = workbenchSource.indexOf('aria-label="搜索词复核闭环状态"');
const searchIntentReviewCardSnapshotIndex = workbenchSource.indexOf('aria-label="搜索词复核默认摘要"');
const searchIntentReviewCardEvidenceIndex = workbenchSource.indexOf('<details className="searchIntentReviewCardEvidence">');
const searchIntentMetricPurposeListIndex = workbenchSource.indexOf('aria-label="广告搜索词表现指标目的"');
const queueTabsIndex = workbenchSource.indexOf('aria-label="队列筛选"');
const signalRowsIndex = workbenchSource.indexOf('className="signalRows"');
assert(searchIntentReviewPanelIndex > queueTabsIndex, "搜索词表现复核必须跟在队列筛选之后");
assert(searchIntentReviewPanelIndex < signalRowsIndex, "搜索词表现复核必须贴近信号队列，而不是作为独立主入口");
assert(searchIntentReviewDecisionSummaryIndex > searchIntentReviewPanelIndex, "搜索词表现复核必须先给判断摘要");
assert(searchIntentReviewCommandIndex > searchIntentReviewDecisionSummaryIndex, "搜索词表现复核判断摘要必须先给作战条");
assert(searchIntentReviewCommandIndex < searchIntentReviewDistributionIndex, "搜索词表现复核作战条必须先于分布数字");
assert(searchIntentReviewDecisionSummaryIndex < searchIntentReviewListIndex, "搜索词表现复核判断摘要必须先于卡片列表");
assert(searchIntentReviewStatusIndex > searchIntentReviewListIndex, "搜索词复核卡片必须默认展示闭环状态");
assert(searchIntentReviewStatusIndex < searchIntentReviewCardSnapshotIndex, "闭环状态必须先于默认指标摘要，避免用户先读裸指标");
assert(searchIntentReviewCardSnapshotIndex > searchIntentReviewListIndex, "搜索词复核卡片必须默认先给短摘要");
assert(searchIntentReviewCardSnapshotIndex < searchIntentReviewCardEvidenceIndex, "搜索词复核默认摘要必须先于展开证据");
assert(searchIntentReviewCardEvidenceIndex < searchIntentMetricPurposeListIndex, "指标目的必须收进展开证据，而不是默认铺满卡片");
const selectSearchIntentFunctionStart = workbenchSource.indexOf("function handleSelectSearchIntent");
const selectSearchIntentFunctionEnd = workbenchSource.indexOf("function handleOpenProductScopeEvidenceDrilldown", selectSearchIntentFunctionStart);
const selectSearchIntentFunctionSource = workbenchSource.slice(selectSearchIntentFunctionStart, selectSearchIntentFunctionEnd);
assertIncludes(selectSearchIntentFunctionSource, "setSelectedSearchIntentLabel(nextFocus.intentLabel)");
assertIncludes(selectSearchIntentFunctionSource, "setSelectedSearchIntentScopeId(nextFocus.scopeId)");
assertIncludes(selectSearchIntentFunctionSource, "setSelectedId(nextFocus.signalId)");
assertNotIncludes(selectSearchIntentFunctionSource, "setSelectedProductScopeId");
assertNotIncludes(workbenchSource, "setSelectedProductScopeId(allScope.scope_id)");
assertIncludes(workbenchSource, "function handleLocateSignalInCurrentScope");
assertIncludes(workbenchSource, "当前诊断入口下没有命中这条复盘待办对应信号");
assertIncludes(workbenchSource, "当前诊断入口下没有命中推荐候选信号");
assertIncludes(workbenchSource, "当前诊断入口下没有命中下一个候选信号");
assertIncludes(workbenchSource, "productScopePriorityQueueItems");
assertIncludes(workbenchSource, "const productScopePriorityDecisionSummary = useMemo");
assertIncludes(workbenchSource, "buildProductScopePriorityDecisionSummary(productScopePriorityQueueItems)");
assertIncludes(workbenchSource, "resolveProductScopePrioritySelectionId(");
assertNotIncludes(workbenchSource, "const nextActiveProductScopeId = resolveProductScopeSelectionId(selectedProductScopeId, nextProductScopeOptions);");
assertIncludes(workbenchSource, "ProductScopePriorityDecisionSummaryPanel");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 首页分诊摘要"');
assertIncludes(workbenchSource, "今日先看什么");
assertIncludes(workbenchSource, "decisionShortcuts");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 扫一眼决策卡"');
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 本轮默认动作"');
assertIncludes(workbenchSource, "本轮默认动作");
assertIncludes(workbenchSource, "只打开 {summary.topLabel}");
assertIncludes(workbenchSource, "{summary.nextManualStep}");
assertIncludes(workbenchSource, "{summary.readingStrategy}");
assertIncludes(workbenchSource, "先看谁");
assertIncludes(workbenchSource, "打开后看哪层");
assertIncludes(workbenchSource, "不要逐个打开所有 Parent ASIN 报表");
assertIncludes(workbenchSource, "readingStrategy");
assertNotIncludes(workbenchSource, "阅读策略：{summary.readingStrategy}");
assertIncludes(workbenchSource, "不逐个打开完整报表");
assertIncludes(workbenchSource, "buildProductScopePriorityDecisionBuckets(items)");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 分诊桶"');
assertIncludes(workbenchSource, "productScopePriorityDecisionBucket");
assertIncludes(workbenchSource, "ProductScopePriorityBucketFilter");
assertIncludes(workbenchSource, "productScopePriorityBucketFilter");
assertIncludes(workbenchSource, "filterProductScopePriorityQueueItems");
assertIncludes(workbenchSource, "productScopePriorityBucketMatches");
assertIncludes(workbenchSource, "productScopePriorityBucketFilterText");
assertIncludes(workbenchSource, "buildProductScopePriorityAdGroupEvidencePreview");
assertIncludes(workbenchSource, "onBucketFilterChange");
assertIncludes(workbenchSource, 'aria-pressed={activeBucketFilter === bucket.id}');
assertIncludes(workbenchSource, 'aria-label={`只看${bucket.label} Parent ASIN`}');
assertIncludes(workbenchSource, "visibleProductScopePriorityQueueItems.map");
assertIncludes(workbenchSource, "productScopePriorityEvidencePreview");
assertIncludes(workbenchSource, "当前默认下钻");
assertIncludes(workbenchSource, "打开后读取");
assertIncludes(workbenchSource, "未打开前不跨 Parent ASIN 套用当前广告组结论");
assertIncludes(workbenchSource, "function productScopePriorityQueueAriaLabel");
assertIncludes(workbenchSource, "aria-label={productScopePriorityQueueAriaLabel(item)}");
assertIncludes(workbenchSource, "productScopePriorityQueueDigest");
const productScopePriorityQueueRenderSource = workbenchSource.slice(
  workbenchSource.indexOf('className="productScopePriorityQueueRows"'),
  workbenchSource.indexOf("{diagnosisPathSummary && <QueueDiagnosisPathPanel", workbenchSource.indexOf('className="productScopePriorityQueueRows"')),
);
assertIncludes(workbenchSource, "当前只看：${bucket.label}");
assertIncludes(workbenchSource, "当前分诊桶暂无 Parent ASIN");
assertIncludes(workbenchSource, "待处理规模：${items.length} 个 Parent ASIN");
assertIncludes(workbenchSource, "本摘要只做首页分诊排序，不替代销售表现、广告 ASIN、广告组、投放词、搜索词和广告位证据");
assertIncludes(workbenchSource, "打开今日优先 Parent ASIN");
assertIncludes(workbenchSource, "handleSelectProductScopePriority");
assertIncludes(workbenchSource, 'aria-label="今日 Parent ASIN 优先处理清单"');
assertIncludes(workbenchSource, "今日 Parent ASIN 优先处理清单");
assertIncludes(workbenchSource, "先排序，再下钻");
assertIncludes(workbenchSource, "避免 10 个 Parent ASIN 像看 10 张报纸");
assertIncludes(workbenchSource, "productScopePriorityWorkflowStatus");
assertIncludes(workbenchSource, "productScopePriorityActionCue");
assertIncludes(workbenchSource, "{item.actionCue}");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 行先读结论"');
assertIncludes(workbenchSource, "productScopePriorityQueueFirstRead");
assertIncludes(workbenchSource, "只看这一句");
assertIncludes(workbenchSource, "点击后再读广告组 / 搜索词 / 广告位证据");
assertIncludes(workbenchSource, "{item.workflowStatus.label}");
assertIncludes(workbenchSource, "{item.workflowStatus.reason}");
assertIncludes(workbenchSource, "{item.workflowStatus.nextStep}");
assertIncludes(workbenchSource, "{item.nextManualStep}");
assertNotIncludes(productScopePriorityQueueRenderSource, "排序依据：{item.rankReason}");
assertNotIncludes(productScopePriorityQueueRenderSource, "<small>{item.decisionBadge}</small>");
assertNotIncludes(productScopePriorityQueueRenderSource, "<small>{item.boundary}</small>");
assertIncludes(workbenchSource, "handleSelectProductScopePriority(item.scopeId)");
const productScopePriorityQueueFirstReadIndex = productScopePriorityQueueRenderSource.indexOf(
  'className="productScopePriorityQueueFirstRead"',
);
const productScopePriorityWorkflowStatusIndex = productScopePriorityQueueRenderSource.indexOf(
  "productScopePriorityWorkflowStatus",
);
const productScopePriorityQueueDigestIndex = productScopePriorityQueueRenderSource.indexOf(
  'className="productScopePriorityQueueDigest"',
);
assert(productScopePriorityQueueFirstReadIndex > 0, "每条 Parent ASIN 行必须先给可读结论");
assert(
  productScopePriorityQueueFirstReadIndex < productScopePriorityWorkflowStatusIndex,
  "Parent ASIN 行内必须先读结论，再读状态原因",
);
assert(
  productScopePriorityQueueFirstReadIndex < productScopePriorityQueueDigestIndex,
  "Parent ASIN 行内必须先读一句结论，再读判断和证据摘要",
);
const productScopePriorityDecisionSummaryRenderIndex = workbenchSource.indexOf(
  "<ProductScopePriorityDecisionSummaryPanel",
);
const productScopePriorityPrimaryCommandIndex = workbenchSource.indexOf('aria-label="Parent ASIN 本轮默认动作"');
const productScopePriorityShortcutIndex = workbenchSource.indexOf('aria-label="Parent ASIN 扫一眼决策卡"');
const productScopePriorityBucketIndex = workbenchSource.indexOf('aria-label="Parent ASIN 分诊桶"');
const productScopePriorityQueueIndex = workbenchSource.indexOf('className="productScopePriorityQueue"');
assert(productScopePriorityDecisionSummaryRenderIndex > 0, "左侧必须有 Parent ASIN 首页分诊摘要");
assert(
  productScopePriorityPrimaryCommandIndex > productScopePriorityDecisionSummaryRenderIndex &&
    productScopePriorityPrimaryCommandIndex < productScopePriorityShortcutIndex,
  "Parent ASIN 首页分诊摘要必须先给本轮默认动作，再给扫一眼决策卡。",
);
assert(
  productScopePriorityShortcutIndex > productScopePriorityDecisionSummaryRenderIndex &&
    productScopePriorityShortcutIndex < productScopePriorityBucketIndex,
  "Parent ASIN 首页分诊摘要必须先给扫一眼决策卡，再展示分诊桶，避免用户先读列表。",
);
assert(
  productScopePriorityDecisionSummaryRenderIndex < productScopePriorityQueueIndex,
  "Parent ASIN 首页分诊摘要必须先于优先处理清单，先给结论再给列表",
);
assert(productScopePriorityQueueIndex > 0, "左侧必须有 Parent ASIN 今日优先处理清单");
assert(productScopePriorityQueueIndex < signalRowsIndex, "Parent ASIN 优先处理清单必须在信号行之前，先帮用户排序再展开信号");
assertIncludes(signalUiSource, "buildProductScopePriorityQueueItems");
assertIncludes(signalUiSource, "buildProductScopePriorityDecisionBuckets");
assertIncludes(signalUiSource, "复盘优先");
assertIncludes(signalUiSource, "人工确认");
assertIncludes(signalUiSource, "保持观察");
assertIncludes(signalUiSource, "暂不展开");
assertIncludes(signalUiSource, "只做人工留痕和复盘排程，不自动调价、暂停、加词或否词");
assertIncludes(signalUiSource, "没有广告证据的 Parent ASIN 只能作为经营背景");
assertIncludes(signalUiSource, "buildSearchIntentReviewDecisionSummary");
assertIncludes(signalUiSource, "有效词扩量");
assertIncludes(signalUiSource, "浪费词止损");
assertIncludes(signalUiSource, "证据缺口观察");
assertIncludes(signalUiSource, "当前 Parent ASIN 下的广告用户搜索词，今天应先做扩量复核、止损复核，还是只观察补证");
assertIncludes(signalUiSource, "打开具体 SearchTerm 信号 -> 核对广告组、投放词、广告 ASIN 和广告位证据");
assertIncludes(signalUiSource, "不覆盖自然搜索、未投放子 ASIN 或单个 ASIN 归因");
assertIncludes(signalUiSource, "本摘要只做搜索词复核排序");
assertIncludes(signalUiSource, "rankReason: productScopePriorityRankReason");
assertIncludes(signalUiSource, "decisionBadge: productScopePriorityDecisionBadge");
assertIncludes(signalUiSource, "workflowStatus: productScopePriorityWorkflowStatus");
assertIncludes(signalUiSource, "actionCue: productScopePriorityActionCue");
assertIncludes(signalUiSource, "function productScopePriorityActionCue");
assertIncludes(signalUiSource, "function productScopePriorityTriageActionCue");
assertIncludes(signalUiSource, 'return "先扩量"');
assertIncludes(signalUiSource, '"先确认"');
assertIncludes(signalUiSource, 'return "暂不展开"');
assertIncludes(signalUiSource, 'label: "待人工确认"');
assertIncludes(signalUiSource, 'label: "等待复盘"');
assertIncludes(signalUiSource, 'label: "到期复盘"');
assertIncludes(signalUiSource, 'label: "仅观察"');
assertIncludes(signalUiSource, 'label: "证据缺口"');
assertIncludes(signalUiSource, "人工动作：右侧人工确认 / 复盘状态：未排程");
assertIncludes(signalUiSource, "复盘到期优先于普通信号");
assertIncludes(signalUiSource, "高优先级信号优先");
assertIncludes(signalUiSource, "无广告证据排在后面");
assertIncludes(signalUiSource, "这只是 Parent ASIN 今日分诊入口");
assertIncludes(signalUiSource, "未投放子 ASIN 不进入广告动作对象");
assertIncludes(signalUiSource, "当前没有明确待处理信号，保持观察，不需要像报表一样展开阅读。");
assertIncludes(stylesSource, ".productScopePriorityDecisionBuckets");
assertIncludes(stylesSource, ".productScopePriorityDecisionBucket.review");
assertIncludes(stylesSource, ".productScopePriorityDecisionBucket.urgent");
assertIncludes(stylesSource, ".productScopePriorityDecisionBucket.all");
assertIncludes(stylesSource, ".productScopePriorityDecisionBucket.active");
assertIncludes(stylesSource, ".productScopePriorityDecisionBucket:disabled");
assertIncludes(stylesSource, ".productScopePriorityPrimaryCommand");
assertIncludes(stylesSource, ".productScopePriorityDecisionShortcuts");
assertIncludes(stylesSource, "repeat(auto-fit, minmax(min(170px, 100%), 1fr))");
assertIncludes(stylesSource, ".productScopePriorityQueueEmpty");
assertIncludes(stylesSource, ".productScopePriorityQueueFirstRead");
assertIncludes(stylesSource, ".productScopePriorityQueueDigest");
assertIncludes(stylesSource, "-webkit-line-clamp: 2");
assertIncludes(stylesSource, ".productScopePriorityWorkflowStatus");
assertIncludes(stylesSource, ".productScopePriorityActionCue");
assertIncludes(stylesSource, ".productScopePriorityActionCue.urgent");
assertIncludes(stylesSource, ".productScopePriorityWorkflowStatus.urgent");
assertIncludes(stylesSource, ".productScopePriorityWorkflowStatus.review");
assertIncludes(stylesSource, ".productScopePriorityWorkflowStatus.watch");
assertIncludes(stylesSource, ".productScopePriorityWorkflowStatus.quiet");
assertIncludes(stylesSource, ".productScopePriorityEvidencePreview");
assertIncludes(stylesSource, ".productScopePriorityEvidencePreview.ready");
assertIncludes(stylesSource, ".productScopePriorityEvidencePreview.pending");
assertIncludes(stylesSource, ".productScopeEvidenceRouteLayerSummary");
assertIncludes(stylesSource, ".productScopeEvidenceRouteLayerSummaryItem.ready");
assertIncludes(stylesSource, ".productScopeEvidenceRouteLayerSummaryItem.blocked");
assertIncludes(stylesSource, ".searchIntentReviewCardPrimary");
assertIncludes(stylesSource, ".searchIntentReviewStatus");
assertIncludes(stylesSource, ".searchIntentReviewStatus.scale");
assertIncludes(stylesSource, ".searchIntentReviewStatus.waste");
assertIncludes(stylesSource, ".searchIntentReviewStatus.observe");
assertIncludes(stylesSource, ".searchIntentReviewCardSnapshot");
assertIncludes(stylesSource, ".searchIntentReviewCardEvidence");
assertIncludes(stylesSource, ".searchIntentReviewCardEvidenceBody");
assertIncludes(stylesSource, ".productScopeEvidenceRouteLayerSummaryItem.context");
assertNotIncludes(workbenchSource, 'setSelectedProductScopeId("all")');
assertIncludes(workbenchSource, "handleSelectProductScope(reviewTodoScopeHint.actionScopeId)");
assertNotIncludes(workbenchSource, "setSelectedProductScopeId(reviewTodoScopeHint.actionScopeId)");
assertIncludes(workbenchSource, "productScopeBusinessPreviewActions");
assertIncludes(workbenchSource, "workbenchGrid focusedFromFirstScreen");
assertIncludes(stylesSource, "grid-template-columns: minmax(300px, 0.78fr) minmax(500px, 1.44fr) minmax(300px, 0.78fr);");
assertIncludes(stylesSource, ".searchIntentReviewDecisionSummary");
assertIncludes(stylesSource, ".searchIntentReviewDecisionCommand");
assertIncludes(stylesSource, ".searchIntentReviewDecisionDistribution");
assertIncludes(stylesSource, ".searchIntentReviewPriorityPath");
assertIncludes(stylesSource, ".searchIntentReviewDecisionNext");
assertIncludes(stylesSource, "@media (max-width: 1180px)");
assertNotIncludes(stylesSource, "@media (max-width: 1320px)");
assertIncludes(workbenchSource, 'aria-label="广告证据下钻状态"');
assertIncludes(workbenchSource, "已进入广告诊断工作台");
assertIncludes(workbenchSource, "已定位默认广告组证据");
assertIncludes(workbenchSource, "先看 ${selectedAdGroupDiagnosis.title} 的广告组优先判断");
assertIncludes(workbenchSource, "当前没有可聚焦广告组");
assertIncludes(workbenchSource, 'aria-label="首屏证据下钻入口"');
assertIncludes(workbenchSource, 'aria-label="广告诊断工作台"');
assertIncludes(workbenchSource, "查看广告组、搜索词和广告位证据");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 首屏经营摘要"');
assertIncludes(workbenchSource, 'aria-label="首屏广告 ASIN 对比"');
assertIncludes(workbenchSource, "广告 ASIN（有投放证据）");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 经营背景与广告证据概览"');
assertIncludes(workbenchSource, 'aria-label="广告 ASIN 投放证据对比"');
assertIncludes(workbenchSource, 'aria-label="广告 ASIN 覆盖准入判断"');
assertIncludes(workbenchSource, 'aria-label="商品组广告覆盖准入判断"');
assertIncludes(workbenchSource, "adCoverageDecision.statusLabel");
assertIncludes(workbenchSource, "adCoverageDecision.nextManualStep");
assertIncludes(workbenchSource, "下钻判断");
assertIncludes(workbenchSource, "row.decision.statusLabel");
assertIncludes(workbenchSource, "row.decision.reason");
assertIncludes(workbenchSource, "row.decision.nextFocus");
assertIncludes(signalUiSource, "ProductGroupAdAsinDecision");
assertIncludes(signalUiSource, "SearchIntentMetricPurposeItem");
assertIncludes(signalUiSource, "扩量判断");
assertIncludes(signalUiSource, "止损判断");
assertIncludes(signalUiSource, "观察门槛");
assertIncludes(signalUiSource, "searchIntentDecisionPriority");
assertIncludes(signalUiSource, "compareSearchIntentReviewPriority");
assertIncludes(signalUiSource, "ProductScopeAdCoverageDecision");
assertIncludes(signalUiSource, "buildProductScopeAdCoverageDecision");
assertIncludes(signalUiSource, "未投放子 ASIN 只作为经营背景或覆盖缺口");
assertIncludes(signalUiSource, "不能把搜索词、广告位或 ABA 自动归因到该 ASIN");
assertIncludes(workbenchSource, 'aria-label="首屏诊断路径"');
assertIncludes(workbenchSource, 'aria-label="MVP 落地门禁"');
assertIncludes(workbenchSource, 'aria-label="诊断 MVP 状态判定"');
assertIncludes(workbenchSource, "productScopeFirstScreenSummary.mvpStatus");
assertIncludes(workbenchSource, 'aria-label="广告 ASIN 范围同步提示"');
assertIncludes(workbenchSource, "productScopeSelectionSummary.scopeSyncNotice");
assertIncludes(workbenchSource, 'aria-label="广告 ASIN 候选缺口解释"');
assertIncludes(workbenchSource, "productScopeCandidateGapExplanation");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 决策导览"');
assertIncludes(workbenchSource, "brief.decisionGuide.primaryDecision");
assertIncludes(workbenchSource, "brief.decisionGuide.readPath");
assertIncludes(workbenchSource, "brief.decisionGuide.expandFocus");
assertIncludes(workbenchSource, "brief.decisionGuide.notToDo");
assertIncludes(workbenchSource, '<details className="productScopeDiagnosisFrameworkDetails" aria-label="Parent ASIN 完整诊断框架">');
assertIncludes(workbenchSource, "<summary>展开完整五段诊断框架</summary>");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 单屏诊断框架"');
assertIncludes(workbenchSource, "单屏诊断框架");
assertIncludes(workbenchSource, "按运营阅读顺序压缩判断，不把销售、广告组、明细和 AI 分析堆成长报表；默认折叠，需要审计时再展开。");
assertIncludes(workbenchSource, "section.businessQuestion");
assertIncludes(workbenchSource, "section.currentJudgement");
assertIncludes(workbenchSource, "人工下一步：{section.nextManualStep}");
assertIncludes(signalUiSource, "ProductScopeDecisionGuide");
assertIncludes(signalUiSource, "不逐个读完整报表");
assertIncludes(signalUiSource, "投放商品 -> 投放词 -> 搜索词 -> 广告位");
assertIncludes(stylesSource, ".productScopeDecisionGuide");
assertIncludes(stylesSource, ".productScopeDiagnosisFrameworkDetails");
assertIncludes(stylesSource, ".productScopeDiagnosisFrameworkDetails[open] > summary");
assertIncludes(stylesSource, ".productScopeDiagnosisFramework");
assertIncludes(stylesSource, ".productScopeDiagnosisFrameworkItems");
assertIncludes(stylesSource, ".productScopeDiagnosisFrameworkItem");
assertIncludes(workbenchSource, "productScopeBusinessPreviewPath");
assertIncludes(workbenchSource, "productScopeBusinessPreviewPathSummary");
assertIncludes(workbenchSource, "productScopeFirstScreenSummary.pathSummary");
assertIncludes(workbenchSource, "productScopeFirstScreenSummary.pathSteps");
assertIncludes(workbenchSource, "productScopeFirstScreenSummary.landingGates");
assertIncludes(signalUiSource, "Parent ASIN 经营销售入口 -> 广告 ASIN -> 广告组");
assertIncludes(signalUiSource, "投放商品 / 投放词 / 搜索词 / 广告位");
assertIncludes(signalUiSource, "投放商品来自广告组内 advertised_products 证据");
assertIncludes(signalUiSource, "AI 信号诊断 -> 人工确认 -> 7/14 天复盘");
assertIncludes(signalUiSource, "广告组是投放容器，不是产品");
assertIncludes(signalUiSource, "只允许记录观察、标记已处理、加入复盘、忽略本次");
assertIncludes(workbenchSource, 'scope_id: "loading_product_scope"');
assertIncludes(workbenchSource, "正在读取诊断入口");
assertIncludes(workbenchSource, "disabled={productScope === null || loading}");
assertIncludes(workbenchSource, 'aria-label="广告组问题定位"');
assertIncludes(workbenchSource, 'const priorityRow = rows[0]');
assertIncludes(workbenchSource, 'aria-label="广告组优先判断"');
assertIncludes(workbenchSource, 'aria-label="优先广告组三段判断"');
assertIncludes(workbenchSource, 'aria-label="优先广告组闭环状态"');
assertIncludes(workbenchSource, 'ariaLabel="优先广告组广告位证据状态"');
assertIncludes(workbenchSource, 'aria-label="广告组闭环状态"');
assertIncludes(workbenchSource, 'ariaLabel="广告组广告位证据状态"');
assertIncludes(workbenchSource, 'aria-label="当前广告组闭环状态"');
assertIncludes(workbenchSource, 'ariaLabel="当前广告组广告位证据状态"');
assertIncludes(workbenchSource, "row.diagnosisStatus.label");
assertIncludes(workbenchSource, "row.diagnosisStatus.reason");
assertIncludes(workbenchSource, "row.diagnosisStatus.nextStep");
assertIncludes(workbenchSource, "decision.status.label");
assertIncludes(workbenchSource, "decision.status.reason");
assertIncludes(workbenchSource, "decision.status.nextStep");
assertIncludes(workbenchSource, "<span>优先广告组</span>");
assertIncludes(workbenchSource, "<b>问题类型</b>");
assertIncludes(workbenchSource, "<b>证据强度</b>");
assertIncludes(workbenchSource, "<b>为什么先看</b>");
assertIncludes(workbenchSource, "priorityRow.evidenceSynthesis.proves");
assertIncludes(workbenchSource, "priorityRow.evidenceSynthesis.doesNotProve");
assertIncludes(workbenchSource, "priorityRow.problemLocator.nextManualStep");
assertIncludes(workbenchSource, "priorityRow.evidenceSynthesis.evidenceGap");
assertIncludes(workbenchSource, 'className="productScopeAdGroupDiagnosisDecision"');
assertIncludes(workbenchSource, 'aria-label="广告组业务判断"');
assertIncludes(workbenchSource, "<b>人工下一步</b>");
assertIncludes(workbenchSource, "row.evidenceSynthesis.statusLabel");
assertIncludes(workbenchSource, "row.evidenceSynthesis.evidenceGap");
assertIncludes(workbenchSource, 'aria-label="广告组证据摘要"');
assertIncludes(workbenchSource, 'aria-label="广告组问题归属判定"');
assertIncludes(workbenchSource, "row.ownershipDecision.statusLabel");
assertIncludes(workbenchSource, "row.ownershipDecision.issueOwner");
assertIncludes(workbenchSource, "row.ownershipDecision.evidencePath");
assertIncludes(workbenchSource, "row.ownershipDecision.nextManualStep");
assertIncludes(signalUiSource, "ProductScopeAdGroupOwnershipDecision");
assertIncludes(signalUiSource, "productScopeAdGroupOwnershipDecision");
assertIncludes(signalUiSource, "ProductScopeAdGroupDiagnosisStatus");
assertIncludes(signalUiSource, "productScopeAdGroupDiagnosisStatus");
assertIncludes(signalUiSource, '"待人工复核"');
assertIncludes(signalUiSource, '"只读复核"');
assertIncludes(signalUiSource, 'label: "证据缺口"');
assertIncludes(signalUiSource, 'label: "广告位缺口"');
assertIncludes(signalUiSource, 'label: "容器边界"');
assertIncludes(signalUiSource, "问题先归属到广告组容器和搜索词上下文");
assertIncludes(workbenchSource, 'aria-label="广告组问题落点"');
assertIncludes(workbenchSource, "row.problemLocator.problemLocation");
assertIncludes(workbenchSource, "row.problemLocator.splitReason");
assertIncludes(workbenchSource, "row.problemLocator.doesNotProve");
assertIncludes(workbenchSource, "row.problemLocator.nextManualStep");
assertIncludes(workbenchSource, "row.evidenceSynthesis.proves");
assertIncludes(workbenchSource, "row.evidenceSynthesis.doesNotProve");
assertIncludes(workbenchSource, "priority.nextStep");
assertIncludes(workbenchSource, "priority.boundary");
assertIncludes(signalUiSource, "ProductScopeAdGroupProblemLocator");
assertIncludes(signalUiSource, "不能证明应自动拆广告组");
const adGroupDiagnosisMetricsIndex = workbenchSource.indexOf('className="productScopeAdGroupDiagnosisMetrics"');
const adGroupDiagnosisDecisionIndex = workbenchSource.indexOf('aria-label="广告组业务判断"');
const adGroupTrafficBoundaryIndex = workbenchSource.indexOf("{row.trafficContextBoundary}");
const adGroupEvidenceSummaryIndex = workbenchSource.indexOf('aria-label="广告组证据摘要"');
const adGroupPriorityGateIndex = workbenchSource.indexOf('aria-label="广告组优先判断"');
const adGroupPriorityWorkflowStatusIndex = workbenchSource.indexOf('aria-label="优先广告组闭环状态"');
const adGroupPriorityPlacementStatusIndex = workbenchSource.indexOf('ariaLabel="优先广告组广告位证据状态"');
const adGroupPriorityTriageIndex = workbenchSource.indexOf('aria-label="优先广告组三段判断"');
const adGroupRowsIndex = workbenchSource.indexOf('className="productScopeAdGroupDiagnosisRows"');
const productScopeDecisionGuideIndex = workbenchSource.indexOf('aria-label="Parent ASIN 决策导览"');
const productScopeVerdictIndex = workbenchSource.indexOf('aria-label="Parent ASIN 体检结论"');
const productScopeFrameworkDetailsIndex = workbenchSource.indexOf('aria-label="Parent ASIN 完整诊断框架"');
const productScopeFrameworkIndex = workbenchSource.indexOf('aria-label="Parent ASIN 单屏诊断框架"');
const diagnosisBriefPathIndex = workbenchSource.indexOf('aria-label="运营诊断路径顺序"');
const diagnosisBriefBusinessQuestionIndex = workbenchSource.indexOf("{section.businessQuestion}", productScopeFrameworkIndex);
const diagnosisBriefCurrentJudgementIndex = workbenchSource.indexOf("{section.currentJudgement}", productScopeFrameworkIndex);
const diagnosisBriefNextStepIndex = workbenchSource.indexOf("productScopeDiagnosisFrameworkNext", productScopeFrameworkIndex);
const diagnosisBriefEvidenceDisclosureIndex = workbenchSource.indexOf("<summary>证明边界</summary>", productScopeFrameworkIndex);
assert(
  productScopeDecisionGuideIndex > 0 && productScopeDecisionGuideIndex < diagnosisBriefPathIndex,
  "Parent ASIN 决策导览必须先于四段路径，先告诉用户是否展开、展开哪里和不能做什么。",
);
assert(
  productScopeVerdictIndex > productScopeDecisionGuideIndex && productScopeVerdictIndex < diagnosisBriefPathIndex,
  "Parent ASIN 体检结论必须位于决策导览和四段路径之间，先压缩结论再进入明细路径。",
);
assert(
  diagnosisBriefPathIndex > productScopeVerdictIndex && diagnosisBriefPathIndex < productScopeFrameworkDetailsIndex,
  "Parent ASIN 默认层必须先展示路径顺序，再把完整框架放进折叠区，避免用户先读五段长说明。",
);
assert(
  productScopeFrameworkDetailsIndex > diagnosisBriefPathIndex && productScopeFrameworkDetailsIndex < productScopeFrameworkIndex,
  "Parent ASIN 完整诊断框架必须作为折叠审计材料存在，不能默认铺开五段判断。",
);
assert(
  diagnosisBriefBusinessQuestionIndex > 0 && diagnosisBriefBusinessQuestionIndex < diagnosisBriefCurrentJudgementIndex,
  "Parent ASIN 完整诊断框架展开后必须先展示业务问题，再展示当前判断，避免重新变成指标报表。",
);
assert(
  diagnosisBriefCurrentJudgementIndex < diagnosisBriefNextStepIndex &&
    diagnosisBriefNextStepIndex < diagnosisBriefEvidenceDisclosureIndex,
  "Parent ASIN 完整诊断框架展开后必须先给当前判断和人工下一步，再把证明边界收进可展开区。",
);
assertIncludes(workbenchSource, "brief.verdictItems.map");
assertIncludes(stylesSource, ".productScopeDiagnosisVerdict");
assertIncludes(stylesSource, ".productScopeDiagnosisVerdictItem");
assert(
  adGroupDiagnosisDecisionIndex < adGroupEvidenceSummaryIndex &&
    adGroupDiagnosisDecisionIndex < adGroupDiagnosisMetricsIndex &&
    adGroupDiagnosisMetricsIndex < adGroupTrafficBoundaryIndex,
  "广告组列表行必须先给问题/证据/下一步，再给指标证据摘要和上下文边界，避免用户从裸指标里自己推理。",
);
assert(
  adGroupPriorityGateIndex < adGroupRowsIndex,
  "广告组数据区必须先给优先判断，再展示可点击广告组列表，避免用户从多行报表里自己找重点。",
);
assert(
  adGroupPriorityGateIndex < adGroupPriorityWorkflowStatusIndex &&
    adGroupPriorityWorkflowStatusIndex < adGroupPriorityPlacementStatusIndex &&
    adGroupPriorityPlacementStatusIndex < adGroupPriorityTriageIndex &&
    adGroupPriorityTriageIndex < adGroupRowsIndex,
  "广告组优先判断必须先给闭环状态和广告位证据状态，再给三段判断：问题类型、证据强度、人工下一步。",
);
assertIncludes(stylesSource, ".productScopeAdGroupPriorityTriage");
assertIncludes(stylesSource, ".productScopeAdGroupWorkflowStatus");
assertIncludes(stylesSource, ".productScopeAdGroupWorkflowStatus.risk");
assertIncludes(stylesSource, ".productScopeAdGroupWorkflowStatus.gap");
assertIncludes(stylesSource, ".productScopeAdGroupWorkflowStatus.observe");
assertIncludes(stylesSource, ".productScopeAdGroupWorkflowStatus.healthy");
assertIncludes(stylesSource, ".productScopePlacementEvidenceStatus");
assertIncludes(stylesSource, ".productScopePlacementEvidenceStatus.healthy");
assertIncludes(stylesSource, ".productScopePlacementEvidenceStatus.observe");
assertIncludes(stylesSource, ".productScopePlacementEvidenceStatus.gap");
assertIncludes(workbenchSource, 'aria-label="广告组证据合流判断"');
assertIncludes(workbenchSource, "row.evidenceSynthesis.statusLabel");
assertIncludes(workbenchSource, "row.evidenceSynthesis.evidenceChain");
assertIncludes(workbenchSource, "row.evidenceSynthesis.evidenceGap");
assertIncludes(signalUiSource, "ProductScopeAdGroupEvidenceSynthesis");
assertIncludes(signalUiSource, "广告商品、投放词、搜索词和广告位证据是否指向同一个可人工复核的问题");
assertIncludes(signalUiSource, "证据合流：搜索词分化优先");
assertIncludes(workbenchSource, 'aria-label="广告组人工复核判断"');
assertIncludes(workbenchSource, 'aria-label="搜索词问题定位"');
assertIncludes(workbenchSource, 'aria-label="搜索词业务判断"');
assertIncludes(workbenchSource, 'aria-label="广告搜索词表现复核链"');
assertIncludes(workbenchSource, 'aria-label="广告搜索词复核分层判断"');
assertIncludes(workbenchSource, "chain.reviewLayers.map");
assertIncludes(workbenchSource, "layer.purpose");
assertIncludes(workbenchSource, "layer.proves");
assertIncludes(workbenchSource, "layer.doesNotProve");
assertIncludes(workbenchSource, "layer.nextManualStep");
assertIncludes(workbenchSource, "buildSearchTermOpportunityReviewChain");
assertIncludes(workbenchSource, "SearchTermOpportunityReviewChainPanel");
assertIncludes(workbenchSource, "<b>复核路径</b>");
assertIncludes(workbenchSource, "<b>Parent ASIN 入口</b>");
assertIncludes(workbenchSource, "<b>广告 ASIN 承接</b>");
assertIncludes(workbenchSource, "<b>广告组合流判断</b>");
assertIncludes(workbenchSource, "<b>同组投放商品表现</b>");
assertIncludes(workbenchSource, "<b>广告位边界</b>");
assertIncludes(workbenchSource, "chain.reviewPath");
assertIncludes(workbenchSource, "chain.parentScopeContext");
assertIncludes(workbenchSource, "chain.adAsinCoverage");
assertIncludes(workbenchSource, "chain.adGroupSynthesis");
assertIncludes(workbenchSource, "chain.adGroupProductPerformance");
assertIncludes(workbenchSource, "chain.placementBoundary");
assertIncludes(workbenchSource, "chain.marketContext");
assertIncludes(workbenchSource, "chain.actionBoundary");
assert(
  workbenchSource.indexOf("chain.reviewPath") < workbenchSource.indexOf("chain.parentScopeContext") &&
    workbenchSource.indexOf("chain.parentScopeContext") < workbenchSource.indexOf("chain.adAsinCoverage") &&
    workbenchSource.indexOf("chain.adAsinCoverage") < workbenchSource.indexOf("chain.adGroupSynthesis") &&
    workbenchSource.indexOf("chain.adGroupSynthesis") < workbenchSource.indexOf("chain.adGroupProductPerformance") &&
    workbenchSource.indexOf("chain.adGroupProductPerformance") < workbenchSource.indexOf("chain.targetingEvidence") &&
    workbenchSource.indexOf("chain.targetingEvidence") < workbenchSource.indexOf("chain.placementBoundary") &&
    workbenchSource.indexOf("chain.placementBoundary") < workbenchSource.indexOf("chain.marketContext"),
  "广告搜索词表现复核链必须先展示复核路径，再按 Parent ASIN -> 广告 ASIN -> 广告组合流判断 -> 同组投放商品表现 -> 投放词证据 -> 广告位边界 -> ABA 背景 的顺序展示。",
);
assertIncludes(workbenchSource, "diagnosis.decision.businessQuestion");
assertIncludes(workbenchSource, "diagnosis.decision.targetingEvidence");
assertIncludes(workbenchSource, "diagnosis.decision.proves");
assertIncludes(workbenchSource, "diagnosis.decision.doesNotProve");
assertIncludes(workbenchSource, "diagnosis.decision.nextManualStep");
assertIncludes(signalUiSource, "ProductScopeSearchTermDecision");
assertIncludes(signalUiSource, "SearchTermOpportunityReviewChain");
assertIncludes(signalUiSource, "SearchTermOpportunityReviewLayer");
assertIncludes(signalUiSource, "判断同一个 SearchTerm 处在哪些广告组容器和多商品结构里");
assertIncludes(signalUiSource, "比较同广告组内投放商品的花费、点击、订单、销售额、ACOS 和 CVR");
assertIncludes(signalUiSource, "确认当前广告位证据停留在搜索词直连、广告组级、广告活动级还是缺失");
assertIncludes(signalUiSource, "不能把 ABA 当作店铺数据");
assertIncludes(signalUiSource, "站点 + 周期 + 标准化搜索词");
assertIncludes(signalUiSource, "不能证明应自动加词");
assertIncludes(workbenchSource, 'aria-label="广告位证据判断"');
assertIncludes(workbenchSource, 'ariaLabel="广告位证据闭环状态"');
assertIncludes(workbenchSource, "decision.status.tone");
assertIncludes(workbenchSource, "row.placementDecision.evidenceLevel");
assertIncludes(workbenchSource, "row.placementDecision.doesNotProve");
assertIncludes(workbenchSource, "row.placementDecision.evidenceGap");
assertIncludes(workbenchSource, "row.placementDecision.nextManualStep");
assertIncludes(signalUiSource, "ProductScopePlacementEvidenceDecision");
assertIncludes(signalUiSource, "只有广告活动级广告位背景");
assertIncludes(signalUiSource, "不能把广告位影响自动归因到单个搜索词或广告 ASIN");
assertIncludes(workbenchSource, 'aria-label="人工候选与广告组关系"');
assertIncludes(workbenchSource, 'aria-label="人工动作目标切换提示"');
assertIncludes(workbenchSource, "manualActionQueueTargetSwitchSummary");
assertIncludes(workbenchSource, "manualActionTargetSwitch");
assertIncludes(workbenchSource, 'aria-label="人工确认双轨分流"');
assertIncludes(workbenchSource, "manualActionReviewRouteSplitSummary");
assertIncludes(workbenchSource, "manualActionRouteSplit");
assertIncludes(workbenchSource, 'aria-label="人工动作待授权写入状态"');
assertIncludes(workbenchSource, "manualActionAuthorizationReadinessSummary");
assertIncludes(workbenchSource, "manualActionAuthorizationReadiness");
assertIncludes(workbenchSource, 'aria-label="人工点击前广告组合流复核"');
assertIncludes(workbenchSource, "selectedManualActionAdGroupBridge.synthesisStatus");
assertIncludes(workbenchSource, "selectedManualActionAdGroupBridge.synthesisEvidenceChain");
assertIncludes(workbenchSource, "selectedManualActionAdGroupBridge.synthesisBoundary");
assertIncludes(workbenchSource, "selectedManualActionAdGroupBridge.synthesisGap");
assertIncludes(workbenchSource, "selectedManualActionAdGroupBridge.searchTermBoundary");
assertIncludes(workbenchSource, "selectedManualActionAdGroupBridge.placementBoundary");
assertIncludes(workbenchSource, "selectedManualActionAdGroupBridge.manualNextStep");
assertIncludes(signalUiSource, "沿用中间广告组合流判断");
assertIncludes(signalUiSource, "synthesis.statusLabel");
assertIncludes(signalUiSource, "synthesis.evidenceChain");
assertIncludes(signalUiSource, "searchTermDecision?.nextManualStep");
assertIncludes(signalUiSource, "topGroup.placementDecision.nextManualStep");
assertIncludes(signalUiSource, "右侧按钮只保存人工留痕或复盘待办");
assertIncludes(workbenchSource, "buildManualReviewClosureLedger");
assertIncludes(workbenchSource, "buildManualReviewEvidencePathReadback");
assertIncludes(workbenchSource, "buildReviewReadinessGateSummary");
assertIncludes(workbenchSource, "buildReviewEvidenceRepairSummary");
assertIncludes(workbenchSource, "selectedManualReviewClosureLedger");
assertIncludes(workbenchSource, "selectedManualReviewEvidencePathReadback");
assertIncludes(workbenchSource, "reviewReadinessGateSummary");
assertIncludes(workbenchSource, "reviewEvidenceRepairSummary");
assertIncludes(workbenchSource, "queueBusinessFilters");
assertIncludes(workbenchSource, "机会扩量");
assertIncludes(workbenchSource, "花费浪费");
assertIncludes(workbenchSource, "投放结构");
assertIncludes(workbenchSource, "数据质量");
assertIncludes(workbenchSource, "复盘");
assertIncludes(workbenchSource, 'aria-label="全局复盘可验证性"');
assertIncludes(workbenchSource, "reviewReadinessGateSummary");
assertIncludes(workbenchSource, "reviewEvidenceRepairAriaLabel");
assertIncludes(workbenchSource, "历史待办治理：仍被复盘证据门禁阻断");
assertIncludes(workbenchSource, "reviewReadinessGateSummary reviewEvidenceRepairSummary");
assertIncludes(workbenchSource, "aria-label={reviewEvidenceRepairAriaLabel}");
assertIncludes(workbenchSource, 'aria-label="历史待办 dry-run 核对清单"');
assertIncludes(workbenchSource, "reviewEvidenceRepairSummary.voidPlanItems");
assertIncludes(workbenchSource, "reviewRepairDryRunChecklist");
assertIncludes(workbenchSource, "<dt>计划状态</dt>");
assertIncludes(workbenchSource, "item.statusText");
assertIncludes(workbenchSource, "<dt>作废后</dt>");
assertIncludes(workbenchSource, "item.afterVoidText");
assertIncludes(workbenchSource, "<dt>重新留痕</dt>");
assertIncludes(workbenchSource, "item.recreateText");
assertIncludes(workbenchSource, "item.dryRunCommand");
assertIncludes(workbenchSource, "ReviewRepairSampleItem");
assertIncludes(workbenchSource, "buildReviewRepairSampleSections");
assertIncludes(workbenchSource, 'aria-label="历史待办治理样本"');
assertIncludes(workbenchSource, "reviewRepairSampleList");
assertIncludes(workbenchSource, "reviewRepairSampleSection");
assertIncludes(workbenchSource, "<ReviewRepairSampleItem item={item} />");
assertIncludes(workbenchSource, 'aria-label="历史待办治理下一步"');
assertIncludes(stylesSource, ".productScopeSingleScreenCommandCard");
assertIncludes(stylesSource, ".productScopeSingleScreenPath");
assertIncludes(stylesSource, ".productScopeSingleScreenGrid");
assertIncludes(stylesSource, ".productScopeSingleScreenSearchIntentPath");
const reviewGateRenderIndex = workbenchSource.indexOf('aria-label="全局复盘可验证性"');
const reviewEvidenceRepairRenderIndex = workbenchSource.indexOf("aria-label={reviewEvidenceRepairAriaLabel}");
assert(
  reviewGateRenderIndex >= 0 &&
    reviewEvidenceRepairRenderIndex >= 0 &&
    reviewGateRenderIndex < reviewEvidenceRepairRenderIndex,
  "右侧复盘状态必须先展示复盘证据门禁，再展示历史待办治理，避免把 ready_no_legacy_gap 误读成可保存 ReviewRecord。",
);
assertIncludes(workbenchSource, "fetchReviewEvidenceRepair");
assertNotIncludes(workbenchSource, "/review-todos/void");
assertIncludes(workbenchSource, 'aria-label="复盘读回身份门禁"');
assertIncludes(workbenchSource, "reviewReadinessGateSummary.identityAudit");
assertIncludes(workbenchSource, 'aria-label="复盘下一步路径"');
assertIncludes(workbenchSource, "reviewReadinessNextSteps");
assertIncludes(workbenchSource, "snapshotActionBoundaryText");
assertIncludes(workbenchSource, "shouldPauseSnapshotPullForReview");
assertIncludes(workbenchSource, "snapshotActionBoundary");
assertIncludes(workbenchSource, 'aria-label="快照复盘门禁"');
assertIncludes(workbenchSource, 'aria-label="人工留痕证据路径读回"');
assertIncludes(workbenchSource, 'aria-label="人工确认复盘闭环三层"');
const manualReviewEvidencePathIndex = workbenchSource.indexOf('aria-label="人工留痕证据路径读回"');
const manualReviewClosureLedgerIndex = workbenchSource.indexOf('aria-label="人工确认复盘闭环三层"');
assert(
  manualReviewEvidencePathIndex >= 0 &&
    manualReviewClosureLedgerIndex >= 0 &&
    manualReviewEvidencePathIndex < manualReviewClosureLedgerIndex,
  "右侧必须先展示同一证据路径读回，再展示三层状态账本，避免用户只看到技术状态。",
);
assertIncludes(workbenchSource, "manualReviewClosureLedger");
assertIncludes(workbenchSource, "selectedReviewReadbackDecisionItems");
assertIncludes(workbenchSource, 'aria-label="复盘回看四问"');
assertIncludes(workbenchSource, "复盘回看四问");
assertIncludes(workbenchSource, "selectedReviewTodoPathReadbackPreview");
assertIncludes(workbenchSource, 'aria-label="复盘待办诊断路径读回"');
assertIncludes(workbenchSource, "到期复盘先沿 Parent ASIN、广告组、搜索词证据回看");
assertIncludes(workbenchSource, "这是 ReviewTodo 继承的点击时证据快照，不是当前实时广告事实");
assertIncludes(workbenchSource, "selectedReviewRecordSaveDecisionPreview");
assertIncludes(workbenchSource, 'aria-label="复盘保存业务判断"');
assertIncludes(workbenchSource, "能不能保存");
assertIncludes(workbenchSource, "保存依据");
assertIncludes(workbenchSource, "下一步人工动作");
assertIncludes(workbenchSource, "ReviewRecord 只保存人工复盘结论");
assertIncludes(workbenchSource, "1. 当时确认什么");
assertIncludes(workbenchSource, "2. 当时证据证明什么");
assertIncludes(workbenchSource, "3. 当时证据不能证明什么");
assertIncludes(workbenchSource, "4. 现在复盘做什么");
assertIncludes(workbenchSource, '<details className="reviewFlowStatusDetails" aria-label="复盘完整状态账本">');
assertIncludes(workbenchSource, "展开复盘门禁、待办证据和保存细节");
assertIncludes(workbenchSource, "selectedRuleFeedbackDecisionItems");
assertIncludes(workbenchSource, 'aria-label="规则反馈默认摘要"');
assertIncludes(workbenchSource, "规则反馈先看这四件事");
assertIncludes(workbenchSource, "selectedRuleFeedbackSourcePreview");
assertIncludes(workbenchSource, 'aria-label="规则反馈样本来源读回"');
assertIncludes(workbenchSource, "样本来源");
assertIncludes(workbenchSource, "复核优先级");
assertIncludes(workbenchSource, "规则反馈样本只帮助人工复核解释、证据和阈值");
assertIncludes(workbenchSource, "有没有复盘结论");
assertIncludes(workbenchSource, "能不能反馈规则");
assertIncludes(workbenchSource, "feedbackBasisLabel");
assertIncludes(workbenchSource, "pendingSourceCount");
assertIncludes(workbenchSource, "defaultPendingSource");
assertIncludes(workbenchSource, "条待复盘来源");
assertIncludes(workbenchSource, "反馈依据是什么");
assertIncludes(workbenchSource, "待复盘来源");
assertIncludes(workbenchSource, "下一步人工动作");
assertIncludes(workbenchSource, '<details className="ruleFeedbackDetails" aria-label="规则反馈完整审计材料">');
assertIncludes(workbenchSource, "展开规则改进门槛、候选组和样本细节");
assertIncludes(stylesSource, ".reviewFlowDecisionSummary");
assertIncludes(stylesSource, ".reviewTodoPathReadbackPreview");
assertIncludes(stylesSource, ".reviewTodoPathReadbackPreview.ready");
assertIncludes(stylesSource, ".reviewTodoPathReadbackPreview.blocked");
assertIncludes(stylesSource, ".reviewRecordSaveDecisionPreview");
assertIncludes(stylesSource, ".reviewRecordSaveDecisionPreview.ready");
assertIncludes(stylesSource, ".reviewRecordSaveDecisionPreview.blocked");
assertIncludes(stylesSource, ".reviewFlowStatusDetails");
assertIncludes(stylesSource, ".reviewFlowStatusDetails[open] > summary");
assertIncludes(stylesSource, ".ruleFeedbackDecisionSummary");
assertIncludes(stylesSource, ".ruleFeedbackSourcePreview");
assertIncludes(stylesSource, ".ruleFeedbackSourcePreview.ready");
assertIncludes(stylesSource, ".ruleFeedbackSourcePreview.blocked");
assertIncludes(stylesSource, ".ruleFeedbackDetails");
assertIncludes(stylesSource, ".ruleFeedbackDetails[open] > summary");
assertIncludes(stylesSource, ".manualReviewEvidencePathReadback");
assertIncludes(stylesSource, ".manualReviewEvidencePathReadback.ready");
assertIncludes(stylesSource, ".manualReviewEvidencePathReadback.saved");
assertIncludes(stylesSource, ".manualReviewEvidencePathReadback.blocked");
assertIncludes(workbenchSource, '有效搜索词');
assertIncludes(workbenchSource, '无订单花费词');
assertIncludes(workbenchSource, 'aria-label="无候选人工动作门禁"');
assertIncludes(workbenchSource, 'aria-label="人工确认证据依据"');
assertIncludes(workbenchSource, "buildManualConfirmationEvidenceItems");
assertIncludes(workbenchSource, "selectedSearchTermOpportunityReviewChain");
assertIncludes(workbenchSource, "activeSearchIntentReviewCard,");
assertIncludes(signalUiSource, "label: \"搜索词表现判断\"");
assertIncludes(signalUiSource, "只用于人工复核优先级");
assertIncludes(signalUiSource, "不自动执行广告动作");
assertIncludes(workbenchSource, 'aria-label="对象复核路径"');
assertIncludes(signalUiSource, "buildSignalObjectReviewPath");
assertIncludes(signalUiSource, "Parent ASIN 销售盘 -> 当前广告 ASIN");
assertIncludes(signalUiSource, "Parent ASIN 销售盘 -> 广告 ASIN 覆盖 -> 当前广告组容器");
assertIncludes(signalUiSource, "不能自动拆广告组");
assertIncludes(signalUiSource, "当前经营入口 -> 广告活动 / 广告组 -> 广告位表现");
assertIncludes(workbenchSource, 'aria-label="人工确认证据写入核对"');
assertIncludes(workbenchSource, "manualConfirmationEvidenceReadinessSummary");
assertIncludes(workbenchSource, "selectedManualActionFullPreflightEvidenceRows");
assertIncludes(workbenchSource, "manualConfirmationEvidenceReadiness");
assertIncludes(signalUiSource, "逐投放上下文");
assertIncludes(signalUiSource, "广告组、投放词、广告 ASIN 和搜索词表现顺序复核");
assertIncludes(signalUiSource, "后端 evidence_snapshot");
assertIncludes(signalUiSource, '"search_term_metric_summary"');
assertIncludes(signalUiSource, '"search_term_context"');
assertIncludes(signalUiSource, '"ad_group_product_performance"');
assertIncludes(workbenchSource, 'aria-label="诊断到人工留痕证据同步"');
assertIncludes(workbenchSource, "manualConfirmationDiagnosisBridgeSummary");
assertIncludes(workbenchSource, "selectedDiagnosisEvidenceSummary");
assertIncludes(workbenchSource, "selectedManualConfirmationDiagnosisBridge");
assertIncludes(workbenchSource, "manualConfirmationDiagnosisBridge");
assertIncludes(workbenchSource, "buildManualActionDecisionFactItems");
assertIncludes(workbenchSource, "selectedManualActionDecisionFactItems");
assertIncludes(workbenchSource, "selectedManualActionDecisionFactItems.map");
assertIncludes(signalUiSource, "ManualActionDecisionFactItem");
assertIncludes(signalUiSource, "业务问题：");
assertIncludes(signalUiSource, "当前判断：");
assertIncludes(signalUiSource, "证据摘要：");
assertIncludes(signalUiSource, "不能证明：");
assertIncludes(signalUiSource, "证据缺口：");
assertNotIncludes(workbenchSource, "{selectedSignal.risk}");
assertNotIncludes(workbenchSource, "{selectedSignal.uncertainty}");
assertIncludes(workbenchSource, "nextUnhandledDiagnosisContractItems");
assertIncludes(workbenchSource, "selectedSignal.id === signalTriageSummary?.next_unhandled_candidate?.signal_id");
assertNotIncludes(workbenchSource, "selectedSignal.id === signalTriageSummary?.recommended_candidate?.signal_id ? recommendedDiagnosisContractItems : []");
assertIncludes(workbenchSource, "buildSignalDiagnosisEvidenceSummary");
assertIncludes(workbenchSource, "diagnosisEvidenceSummary");
assertIncludes(workbenchSource, 'aria-label="业务判断与指标目的"');
assertIncludes(workbenchSource, "业务判断与指标目的");
assertIncludes(workbenchSource, "默认只给运营决策摘要");
assertIncludes(workbenchSource, "查看能证明 / 不能证明 / 强度依据");
assertIncludes(workbenchSource, 'aria-label="证据强度和判断边界摘要"');
assertIncludes(workbenchSource, "诊断对象");
assertIncludes(workbenchSource, "objectReadback");
assertIncludes(workbenchSource, "强度依据");
assertIncludes(workbenchSource, "能证明");
assertIncludes(workbenchSource, "不能证明");
assertIncludes(workbenchSource, "人工下一步");
assertIncludes(workbenchSource, "compactEvidenceDetails");
assertIncludes(workbenchSource, 'className="detailSection diagnosisReason diagnosisStep stepReason"');
assertIncludes(workbenchSource, 'className="metricDecisionPanel diagnosisStep stepEvidence"');
assertIncludes(workbenchSource, 'aria-label="关键指标判断目的"');
assertIncludes(workbenchSource, "只服务上方业务判断");
assertIncludes(workbenchSource, "这些指标只用于判断证据强度、对象边界和人工复核优先级，不能直接推出自动广告动作。");
assertIncludes(workbenchSource, "指标目的：");
assertIncludes(workbenchSource, "当前判断：");
assertIncludes(workbenchSource, 'aria-label="关键证据先读"');
assertIncludes(workbenchSource, "先读哪几条");
assertIncludes(workbenchSource, "默认先看下方触发证据；完整证据只用于回查来源、对象边界和复盘审计。");
assertIncludes(workbenchSource, "等待诊断合同补充证明边界");
assertIncludes(workbenchSource, "不能直接推出自动广告动作。");
assertIncludes(stylesSource, ".keyEvidenceDecisionSummary");
assertIncludes(stylesSource, ".keyEvidenceDecisionSummary small");
assertIncludes(workbenchSource, "searchTermReviewDecisionSummary");
assertIncludes(workbenchSource, 'aria-label="广告搜索词复核优先判断"');
assertIncludes(workbenchSource, '<details className="searchTermReviewLayer"');
assertIncludes(workbenchSource, '<details className="searchTermReviewEvidenceDetails"');
assertIncludes(workbenchSource, "展开完整证据、证明边界和复核路径");
assertIncludes(workbenchSource, "buildSearchTermAdContextReviewSummary(adContextRows)");
assertIncludes(workbenchSource, 'aria-label="逐投放上下文优先摘要"');
assertIncludes(workbenchSource, "adContextReviewSummary.whyFirst");
assertIncludes(workbenchSource, "adContextReviewSummary.proves");
assertIncludes(workbenchSource, "adContextReviewSummary.doesNotProve");
assertIncludes(workbenchSource, "adContextReviewSummary.nextManualStep");
assertIncludes(workbenchSource, '<details className="searchTermAdContextRows"');
assertIncludes(workbenchSource, "展开逐投放上下文表现行");
assertIncludes(workbenchSource, "row.proves");
assertIncludes(workbenchSource, "row.doesNotProve");
assertIncludes(workbenchSource, "row.nextManualStep");
assertIncludes(stylesSource, ".searchTermReviewDecisionSummary");
assertIncludes(stylesSource, ".searchTermReviewEvidenceDetails");
assertIncludes(stylesSource, ".searchTermAdContextReviewSummary");
assertIncludes(stylesSource, ".searchTermAdContextRows[open] summary");
const searchTermDecisionIndex = workbenchSource.indexOf("searchTermReviewDecisionSummary");
const searchTermEvidenceDetailsIndex = workbenchSource.indexOf("searchTermReviewEvidenceDetails");
const searchTermAdContextSummaryIndex = workbenchSource.indexOf('aria-label="逐投放上下文优先摘要"');
const searchTermAdContextRowsIndex = workbenchSource.indexOf('<details className="searchTermAdContextRows"');
assert(
  searchTermDecisionIndex >= 0 && searchTermDecisionIndex < searchTermEvidenceDetailsIndex,
  "广告搜索词复核链必须先展示优先判断，再展开完整证据。",
);
assert(
  searchTermAdContextSummaryIndex > searchTermEvidenceDetailsIndex && searchTermAdContextSummaryIndex < searchTermAdContextRowsIndex,
  "逐投放上下文必须先给优先摘要，再展开完整表现行。",
);
const diagnosisContractRenderIndex = workbenchSource.indexOf("<DiagnosisContractPanel");
const diagnosisReasonIndex = workbenchSource.indexOf('className="detailSection diagnosisReason diagnosisStep stepReason"');
const metricDecisionPanelIndex = workbenchSource.indexOf('className="metricDecisionPanel diagnosisStep stepEvidence"');
const keyEvidenceDecisionSummaryIndex = workbenchSource.indexOf('aria-label="关键证据先读"');
const keyEvidenceIndex = workbenchSource.indexOf('className="keyEvidence"');
assert(
  diagnosisContractRenderIndex >= 0 &&
    diagnosisContractRenderIndex < diagnosisReasonIndex &&
    diagnosisReasonIndex < metricDecisionPanelIndex,
  "中间诊断必须先展示业务判断与原因，再展示关键指标，避免先堆指标。",
);
assert(
  keyEvidenceDecisionSummaryIndex >= 0 && keyEvidenceDecisionSummaryIndex < keyEvidenceIndex,
  "证据链必须先展示关键证据读法，再展示触发证据明细。",
);
assertIncludes(stylesSource, ".metricDecisionPanel");
assertIncludes(stylesSource, ".metricDecisionPanel > p");
assertIncludes(workbenchSource, 'aria-label="人工留痕动作"');
assertIncludes(workbenchSource, "只保存人工留痕和复盘待办，不执行广告动作");
assertIncludes(workbenchSource, "selectedManualActionButtonCommandItems");
assertIncludes(workbenchSource, "selectedManualActionKeyEvidenceFacts");
assertIncludes(workbenchSource, "buildKeyEvidenceFacts(selectedSignal.evidence.facts, 3, selectedSignal)");
assertIncludes(workbenchSource, "selectedManualActionDiagnosisPathItems");
assertIncludes(workbenchSource, 'aria-label="人工按钮前诊断路径核对"');
assertIncludes(workbenchSource, "按钮前先沿同一条诊断路径核对");
assertIncludes(workbenchSource, "不跳过证据");
assertIncludes(workbenchSource, "1. 经营入口");
assertIncludes(workbenchSource, "2. 广告组定位");
assertIncludes(workbenchSource, "3. 搜索词证据");
assertIncludes(workbenchSource, "4. 按钮前核对");
assertIncludes(workbenchSource, 'aria-label="点击前关键证据核对"');
assertIncludes(workbenchSource, "点击前关键证据核对");
assertIncludes(workbenchSource, "复用中间诊断证据");
assertIncludes(workbenchSource, "selectedManualActionKeyEvidenceFacts.map");
assertIncludes(workbenchSource, "selectedDiagnosisEvidenceSummary?.proves");
assertIncludes(workbenchSource, "selectedDiagnosisEvidenceSummary?.doesNotProve");
assertIncludes(workbenchSource, "selectedDiagnosisEvidenceSummary?.nextManualStep");
assertIncludes(workbenchSource, 'aria-label="人工确认前四问"');
assertIncludes(workbenchSource, "人工确认前四问");
assertIncludes(workbenchSource, "先判断再点击");
assertIncludes(workbenchSource, "1. 当前在确认什么");
assertIncludes(workbenchSource, "2. 证据能证明什么");
assertIncludes(workbenchSource, "3. 证据不能证明什么");
assertIncludes(workbenchSource, "4. 现在人工做什么");
assertIncludes(workbenchSource, 'aria-label="复盘回看四问"');
assertIncludes(workbenchSource, "复盘回看四问");
assertIncludes(workbenchSource, "沿点击时证据判断");
assertIncludes(workbenchSource, "1. 当时确认什么");
assertIncludes(workbenchSource, "2. 当时证据证明什么");
assertIncludes(workbenchSource, "3. 当时证据不能证明什么");
assertIncludes(workbenchSource, "4. 现在复盘做什么");
assertIncludes(workbenchSource, "selectedDiagnosisEvidenceSummary?.businessQuestion");
assertIncludes(workbenchSource, "selectedDiagnosisEvidenceSummary?.proves");
assertIncludes(workbenchSource, "selectedDiagnosisEvidenceSummary?.doesNotProve");
assertIncludes(workbenchSource, "selectedDiagnosisEvidenceSummary?.nextManualStep");
assertIncludes(workbenchSource, '<details className="manualActionPreflightDetails" aria-label="人工按钮前完整预检证据">');
assertIncludes(workbenchSource, "展开完整预检、证据快照和写后合同");
assertIncludes(workbenchSource, "selectedManualActionPostWriteDecisionItems");
assertIncludes(workbenchSource, "selectedManualActionPostWriteKeyEvidenceItems");
assertIncludes(workbenchSource, "nextReviewTodo?.evidence_snapshot?.length");
assertIncludes(workbenchSource, "latestManualAction?.evidence_snapshot");
assertIncludes(workbenchSource, 'aria-label="人工动作写后默认摘要"');
assertIncludes(workbenchSource, "写后先看这四件事");
assertIncludes(workbenchSource, "写入了吗");
assertIncludes(workbenchSource, "证据留了吗");
assertIncludes(workbenchSource, "复盘待办生成了吗");
assertIncludes(workbenchSource, 'aria-label="写后关键证据快照"');
assertIncludes(workbenchSource, "写后关键证据快照");
assertIncludes(workbenchSource, "来自 evidence_snapshot");
assertIncludes(workbenchSource, "只回看人工点击时保存的证据，不用当前实时页面重新生成判断，也不触发自动广告动作。");
assertIncludes(workbenchSource, '<details className="manualActionPostWriteDetails" aria-label="人工动作写后完整审计材料">');
assertIncludes(workbenchSource, "展开点击后读回路径和证据账本");
assertIncludes(stylesSource, ".manualActionButtonCommandSummary");
assertIncludes(stylesSource, ".manualActionKeyEvidenceCheck");
assertIncludes(stylesSource, ".manualActionKeyEvidenceBoundary");
assertIncludes(stylesSource, ".manualActionDiagnosisPathSummary");
assertIncludes(stylesSource, ".manualActionPreflightDetails");
assertIncludes(stylesSource, ".manualActionPreflightDetails[open] > summary");
assertIncludes(stylesSource, ".manualActionPostWriteSummary");
assertIncludes(stylesSource, ".manualActionPostWriteKeyEvidence");
assertIncludes(stylesSource, ".manualActionPostWriteDetails");
assertIncludes(stylesSource, ".manualActionPostWriteDetails[open] > summary");
assertIncludes(workbenchSource, "manualActionEmptyStateText(manualActionPreflight)");
assertIncludes(workbenchSource, "reviewTodoEmptyStateText(latestManualAction)");
assertIncludes(workbenchSource, "buildManualActionPathSteps");
assertIncludes(workbenchSource, "buildManualActionReadbackPathItems");
assertIncludes(workbenchSource, "buildManualActionIdentityGateItems");
assertIncludes(workbenchSource, "manualActionPreflightsByAction");
assertIncludes(workbenchSource, "manualActionPreflightErrorsByAction");
assertIncludes(workbenchSource, "manualActionPreviewActionType");
assertIncludes(workbenchSource, "selectedManualActionPreviewActionType");
assertIncludes(workbenchSource, "selectedManualActionPreviewPreflight");
assertIncludes(workbenchSource, "function handleLocateReviewSignal");
assertIncludes(workbenchSource, 'aria-label={`定位复盘待办 ${reviewTodoQueueSummary.nextLabel}`}');
assertIncludes(workbenchSource, "handleLocateReviewSignal(reviewTodoQueueSummary.next?.signal_id)");
assertIncludes(workbenchSource, "handleLocateReviewSignal(row.signalId)");
assertIncludes(workbenchSource, "const selectedReviewEvidenceSnapshot = useMemo");
assertIncludes(workbenchSource, "reviewEvidenceSnapshot={selectedReviewEvidenceSnapshot?.items ?? []}");
assertIncludes(workbenchSource, 'aria-label="复盘点击时证据快照"');
assertIncludes(workbenchSource, 'title: "复盘点击时证据快照"');
assertIncludes(workbenchSource, "不是当前实时广告事实，也不是效果结论");
assertIncludes(workbenchSource, "来自 ReviewTodo 继承的人工点击时证据快照");
assertIncludes(workbenchSource, "buildReviewTodoEvidenceReadbackSummary");
assertIncludes(workbenchSource, "buildReviewTodoDecisionReadbackSummary");
assertIncludes(workbenchSource, "selectedReviewTodoDecisionReadback");
assertIncludes(workbenchSource, 'aria-label="复盘待办业务判断读回"');
assertIncludes(workbenchSource, "selectedReviewTodoEvidenceReadback");
assertIncludes(workbenchSource, 'aria-label="复盘待办证据回读核对"');
assertIncludes(workbenchSource, "reviewTodoEvidenceReadback");
assertIncludes(reviewUiSource, "原始诊断路径");
assertIncludes(reviewUiSource, "默认展开焦点");
assertIncludes(reviewUiSource, "逐投放复核顺序");
assertIncludes(reviewUiSource, "复核证据层");
assertIncludes(reviewUiSource, "从哪个 Parent ASIN / 广告对象展开、默认看哪个广告组、逐投放复核顺序");
assertIncludes(reviewUiSource, "缺少 Parent ASIN / 广告 ASIN / 广告组路径");
assertIncludes(reviewUiSource, "缺少广告组合流判断");
assertIncludes(reviewUiSource, "缺少逐投放上下文");
assertIncludes(reviewUiSource, "不能知道当时先看哪个广告组");
assertIncludes(reviewUiSource, "不能把广告组或搜索词表现直接归因到单个 ASIN");
assertIncludes(reviewUiSource, "投放词与广告位边界");
assertIncludes(reviewUiSource, "不能把未投放子 ASIN 拉入复盘");
assertIncludes(workbenchSource, "signalTriageSummary?.recommended_diagnosis_contract");
assertIncludes(workbenchSource, "signalTriageSummary?.next_unhandled_diagnosis_contract");
assertNotIncludes(workbenchSource, "const diagnosisContractSignalId");
assertIncludes(workbenchSource, "const fetchPreflightForAction = async (actionType: ManualActionType)");
assertIncludes(workbenchSource, "const recommendedResult = await fetchPreflightForAction(recommendedActionType)");
assertIncludes(workbenchSource, "setManualActionPreflight(recommendedResult.preflight)");
assertIncludes(workbenchSource, "manualActionOrder.filter((actionType) => actionType !== recommendedActionType)");
assertIncludes(workbenchSource, "manualActionPreflightForAction(actionType");
assertIncludes(workbenchSource, "manualActionPreflightErrorForAction(");
assertIncludes(workbenchSource, "manualActionButtonExpectationText(actionType");
assertIncludes(workbenchSource, "actionGate.compactReason ?? actionExpectationText");
assertIncludes(workbenchSource, "当前预览动作");
assertIncludes(workbenchSource, "当前 SearchTerm 已有人工留痕");
assertIncludes(workbenchSource, "当前信号没有后端可写预检对象");
assertIncludes(workbenchSource, "manualActionDisplayLabel(selectedBackendManualActionPreview.actionType)");
assertIncludes(workbenchSource, "function ManualActionPreviewStrip");
assertIncludes(workbenchSource, "人工动作：{manualActionDisplayLabel(preview.actionType)}");
assertIncludes(workbenchSource, "复盘对象：{manualActionPreviewObjectLabel(preview)}");
assertIncludes(workbenchSource, "对象身份：{manualActionPreviewObjectTypeLabel(preview)}");
assertIncludes(workbenchSource, "复盘窗口：{manualActionReviewWindowLabel(preview.reviewWindows)}");
assertIncludes(workbenchSource, "preview={recommendedManualActionCandidate.manualActionPreview}");
assertIncludes(workbenchSource, "preview={nextUnhandledManualActionCandidate.manualActionPreview}");
assertNotIncludes(workbenchSource, "<span>{recommendedManualActionCandidate.manualActionPreview.actionType}</span>");
assertNotIncludes(workbenchSource, "<span>{nextUnhandledManualActionCandidate.manualActionPreview.actionType}</span>");
assertNotIncludes(workbenchSource, "对象ID：{recommendedManualActionCandidate.manualActionPreview.objectId}");
assertNotIncludes(workbenchSource, "对象ID：{nextUnhandledManualActionCandidate.manualActionPreview.objectId}");
assertNotIncludes(workbenchSource, "窗口：{recommendedManualActionCandidate.manualActionPreview.reviewWindows.join");
assertNotIncludes(workbenchSource, "窗口：{nextUnhandledManualActionCandidate.manualActionPreview.reviewWindows.join");
assertIncludes(workbenchSource, "/ 不执行广告动作");
assertIncludes(workbenchSource, "setManualActionPreviewActionType(actionType)");
assertIncludes(workbenchSource, "onFocus={() => setManualActionPreviewActionType(actionType)}");
assertIncludes(workbenchSource, "onMouseEnter={() => setManualActionPreviewActionType(actionType)}");
assertIncludes(workbenchSource, "manualActionPreflightEvidenceRows(selectedManualActionPreviewPreflight)");
assertIncludes(workbenchSource, 'aria-label="优先查看的边界与证据缺口"');
assertIncludes(workbenchSource, "先看边界与缺口");
assertIncludes(reviewUiSource, '"搜索词边界"');
assertIncludes(reviewUiSource, '"广告位边界"');
assertIncludes(reviewUiSource, '"广告位证据缺口"');
assertIncludes(workbenchSource, "manualActionPostWriteContractItems(selectedManualActionPreviewPreflight)");
assertIncludes(workbenchSource, 'aria-label="人工处理路径"');
assertIncludes(workbenchSource, 'aria-label="点击后读回路径"');
assertIncludes(workbenchSource, 'aria-label="人工动作对象身份门禁"');
assertIncludes(workbenchSource, "buildReviewRecordSaveGateSummary");
assertIncludes(workbenchSource, "buildReviewRecordSavePathSummary");
assertIncludes(workbenchSource, "buildReviewEffectWindowLedger");
assertIncludes(workbenchSource, "selectedReviewEffectWindowLedger");
assertIncludes(workbenchSource, "selectedReviewRecordSavePath");
assertIncludes(workbenchSource, "hasReviewRecordReadbackMatch");
assertIncludes(workbenchSource, "selectedReviewRecordSaveGate.canSave");
assertIncludes(workbenchSource, 'aria-label="复盘效果窗口口径"');
assertIncludes(workbenchSource, "reviewEffectWindowLedger");
assertIncludes(workbenchSource, 'aria-label="复盘保存顺序核对"');
assertIncludes(workbenchSource, "reviewRecordSavePath");
assertIncludes(workbenchSource, 'aria-label="复盘保存门槛"');
assertNotIncludes(workbenchSource, "<p>暂无人工处理记录</p>");
