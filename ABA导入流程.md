# ABA导入流程

更新日期：2026-06-14

## 1. 目标

本文件定义 ABA 搜索词报表的第一阶段导入流程。

ABA 在本项目中只作为市场机会增强数据：

```text
积加 ERP 人工导出
→ 本地导入
→ 写入导入批次
→ 写入 ABA 搜索词快照
→ 与广告搜索词、关键词排名、产品语义匹配
→ 生成 ABA 机会信号
```

ABA 不走积加开放平台 API 自动同步。

ABA 不直接归属店铺。

## 2. 数据来源

当前已确认样本：

```text
D:\DataProject\coedx_project\Amazon广告分析-RBK004\src_data\ABA搜索词报表-Top30万搜索词.xlsx
```

样本事实：

| 项目 | 值 |
| --- | --- |
| 工作表 | 关键词搜索热度 |
| 数据量 | 300111 行 |
| 站点 | US |
| 周期 | 2026-05-10 到 2026-05-16 |
| 可用字段 | 关键词、搜索量排名、排名变化、前三 ASIN、前三 ASIN 点击份额、前三 ASIN 转化份额 |
| 不可用字段 | 搜索查询量当前为空，不能用于估算搜索量 |

## 3. 导入入口

第一阶段导入参数：

```text
source_file
marketplace_code
start_date
end_date
source_sheet
```

规则：

- `marketplace_code` 必填，例如 `US`。
- `start_date` / `end_date` 必填。
- `source_sheet` 默认使用 `关键词搜索热度`。
- 不要求选择店铺。
- 如果界面处于某个店铺筛选下，ABA 仍按站点导入，不写入 `shop_id`。

## 4. 导入批次

每次导入必须先写入 `import_batches`。

字段：

```text
source_type = ABA导出
source_file
file_hash
marketplace_id
shop_id = null
start_date
end_date
imported_at
row_count
status
error_message
```

规则：

- 同一个文件、同一站点、同一周期重复导入时，必须能识别重复。
- 重复导入可以覆盖同批周期数据，但必须保留新的导入批次。
- 导入失败时只记录批次失败，不写入半成品快照。

## 5. 字段映射

导入目标表：`aba_search_term_snapshots`。

| Excel 字段 | 目标字段 | 说明 |
| --- | --- | --- |
| 关键词 | `search_term` | 原始搜索词 |
| 关键词 | `normalized_query` | 标准化搜索词 |
| 搜索量排名 | `search_frequency_rank` | ABA 搜索频率排名 |
| 排名变化 | `rank_change_type` / `rank_change_value` | 上升、下降、新上榜等 |
| 点击排名第 1 商品 ASIN | `top1_asin` | 竞品或自身 ASIN |
| 点击排名第 1 商品标题 | `top1_title` | 商品标题 |
| 点击排名第 1 商品点击份额 | `top1_click_share` | 点击份额 |
| 点击排名第 1 商品转化份额 | `top1_conversion_share` | 转化份额 |
| 点击排名第 2 商品 ASIN | `top2_asin` | 同上 |
| 点击排名第 2 商品标题 | `top2_title` | 同上 |
| 点击排名第 2 商品点击份额 | `top2_click_share` | 同上 |
| 点击排名第 2 商品转化份额 | `top2_conversion_share` | 同上 |
| 点击排名第 3 商品 ASIN | `top3_asin` | 同上 |
| 点击排名第 3 商品标题 | `top3_title` | 同上 |
| 点击排名第 3 商品点击份额 | `top3_click_share` | 同上 |
| 点击排名第 3 商品转化份额 | `top3_conversion_share` | 同上 |
| 行号 | `source_row_number` | 便于回查原文件 |

不使用字段：

```text
搜索查询量
```

原因：当前样本该列为空，不能假装可用。

## 6. 标准化规则

`normalized_query` 第一阶段只做最小标准化：

```text
去除首尾空格
转小写
连续空格合并为一个空格
```

暂不做复杂分词、同义词、词干化。

后续语义聚合由 `search_term_semantic_groups` 或产品语义模块处理。

## 7. 校验规则

导入前必须校验：

- 文件存在。
- 文件格式为 `.xlsx`。
- 工作表存在。
- `marketplace_code` 存在。
- `start_date` 小于等于 `end_date`。
- 必要列存在：关键词、搜索量排名。
- 至少存在一组前三 ASIN 相关字段。

行级校验：

- `search_term` 为空的行跳过。
- `search_frequency_rank` 为空的行跳过。
- 点击份额、转化份额解析失败时写空，不中断整批导入。
- 同一站点、同一周期、同一 `normalized_query` 多行重复时，保留搜索频率排名最靠前的一行。

## 8. 入库规则

写入 `aba_search_term_snapshots` 时必须带：

```text
marketplace_id
marketplace_code
start_date
end_date
search_term
normalized_query
search_frequency_rank
rank_change_type
rank_change_value
top1_asin
top1_title
top1_click_share
top1_conversion_share
top2_asin
top2_title
top2_click_share
top2_conversion_share
top3_asin
top3_title
top3_click_share
top3_conversion_share
source_file
source_sheet
source_row_number
import_batch_id
```

唯一判断建议：

```text
marketplace_id + start_date + end_date + normalized_query
```

第一阶段本地 JSON 快照额外写入一个轻量索引：

```text
normalized/aba_search_term_top1000.json
```

规则：

- 索引只保留 `search_frequency_rank <= 1000` 的记录。
- `/api/signals` 只读取该索引参与 ABA 机会信号生成。
- 全量 `aba_search_term_snapshots.json` 只作为本地快照和回查数据，不在页面信号接口中默认加载。

## 9. 与 AI 信号的关系

ABA 导入后可以支撑：

```text
ABA 数据过期
ABA 热词未覆盖
ABA 热词有广告但份额弱
ABA 前三 ASIN 竞品强势
ABA 高热词与产品语义高度相关
ABA 热词自然排名弱
ABA 热词广告有点击但无转化
ABA 趋势上升词
自然排名弱但 ABA 热度高
```

证据来源统一标记为：

```text
source_type = ABA导出
source_table = aba_search_term_snapshots
```

## 10. 信号降级规则

以下情况必须降低 ABA 相关信号置信度：

- ABA 导入周期超过配置阈值。
- ABA 周期和广告搜索词周期不一致。
- ABA 周期和关键词排名周期不一致。
- 产品语义资料缺失。
- SP 关键词详情暂缓同步，不能高置信判断“关键词库未覆盖”。
- `搜索查询量` 为空，不能估算搜索量或市场容量。

## 11. 验收标准

第一阶段 ABA 导入完成后，必须能回答：

```text
这个 ABA 文件来自哪里？
导入的是哪个站点和周期？
导入了多少行？
哪些行被跳过？
某个搜索词来自原文件第几行？
某个 ABA 机会信号用了哪条 ABA 记录作为证据？
ABA 数据是否过期？
是否生成 Top1000 轻量索引？
```
