**Findings**

无 P0 / P1 阻塞。

- [Fixed] 商品边界展开明细存在信息遮挡和移动端横向溢出。
  Location: `frontend/src/styles.css`
  Evidence: Browser DOM 在 1440x900 和 1280x900 下检测到 `productGroupRelationMap` 内长 Parent ASIN 文本与其他关系项重叠；390x844 下 `productScopePathSteps` 和 `productGroupAsinTable` 横向溢出。
  Fix: 展开明细文本单独允许换行；商品组关系摘要改为自适应分组；移动端路径标签换行；移动端广告 ASIN 表格改为纵向信息卡。

**Implementation Checklist**

- 实现目标：`http://127.0.0.1:5174/`
- 桌面展开截图：`C:\Users\11010\AppData\Local\Temp\amazon-ai-workbench-overlap-fix-desktop-open.png`
- 移动端展开截图：`C:\Users\11010\AppData\Local\Temp\amazon-ai-workbench-overlap-fix-mobile-open.png`
- 移动端广告 ASIN 表格截图：`C:\Users\11010\AppData\Local\Temp\amazon-ai-workbench-overlap-fix-mobile-table.png`
- 视口：桌面 1440x900、1280x900；移动端 390x844。

**Browser QA**

- 修复前：`productGroupRelationMap` 的 `scrollWidth` 达到 1489px，长 Parent ASIN 文本覆盖其他关系项。
- 修复后：1440x900、1280x900、390x844 的 visible overflow 均为 0。
- 修复后：1440x900、1280x900、390x844 的文本 overlap 均为 0。
- 移动端广告 ASIN 对比从横向表格变成纵向信息卡，保留广告 ASIN、花费、订单、销售额、ACOS、策略。
- 控制台 error / warn 为 0。

**Patches Made**

- `productGroupRelationItem` 内的长文本覆盖为可换行，避免继承顶部短标签 `white-space: nowrap`。
- `productGroupRelationMap` 从固定 4 列改成 `auto-fit` 自适应分组。
- 移动端 `productScopePathSteps` 从横向滚动改为换行。
- 移动端 `productGroupAsinTable` 以 CSS 转为纵向信息卡。
- 未修改后端接口、数据模型、真实快照脚本、ABA 导入链路或自动广告动作能力。

**Verification**

- `npm run build`：通过。
- `git diff --check -- frontend/src/styles.css`：通过。

final result: passed
