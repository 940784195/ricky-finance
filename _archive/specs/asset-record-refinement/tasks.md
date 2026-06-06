# 资产记录功能优化 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 更新资产记录字段说明
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修改资产记录字段定义，调整status字段的说明
  - 移除待审核状态的相关描述
- **Acceptance Criteria Addressed**: [AC-2, AC-5]
- **Test Requirements**:
  - `human-judgement` TR-1.1: 需求文档中字段说明准确，无待审核状态描述
- **Notes**: 可能需要保留status字段用于兼容，但仅保留valid/invalid

## [ ] Task 2: 调整资产记录功能优先级
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 将批量导入、批量导出功能标记为可选/后续规划
  - 更新功能列表中的优先级说明
- **Acceptance Criteria Addressed**: [AC-1, AC-5]
- **Test Requirements**:
  - `human-judgement` TR-2.1: 功能描述中明确标记批量导入导出为可选功能
- **Notes**: 不删除功能说明，仅调整优先级和表述

## [ ] Task 3: 更新筛选和统计功能描述
- **Priority**: P1
- **Depends On**: [Task 1]
- **Description**: 
  - 移除状态筛选中的"待审核"选项
  - 更新统计卡片，移除"待审核记录数"
  - 调整记录表格，移除状态列的显示（或简化）
- **Acceptance Criteria Addressed**: [AC-2, AC-3, AC-5]
- **Test Requirements**:
  - `human-judgement` TR-3.1: 界面设计中无审核状态相关的UI元素
- **Notes**: 保留状态字段但简化为仅显示有效/无效

## [ ] Task 4: 细化资产记录页面设计
- **Priority**: P1
- **Depends On**: [Task 2, Task 3]
- **Description**: 
  - 更新和细化资产记录主页面的设计说明
  - 调整页面布局以反映移除审核状态
  - 更新快速操作按钮的说明
- **Acceptance Criteria Addressed**: [AC-3, AC-5]
- **Test Requirements**:
  - `human-judgement` TR-4.1: 页面设计文档完整，布局清晰，无审核状态相关元素

## [ ] Task 5: 设计新增/编辑资产记录弹窗
- **Priority**: P1
- **Depends On**: [Task 1]
- **Description**: 
  - 详细设计新增/编辑资产记录的弹窗界面
  - 包括字段布局、表单验证、交互说明
  - 提供ASCII布局图
- **Acceptance Criteria Addressed**: [AC-4, AC-5]
- **Test Requirements**:
  - `human-judgement` TR-5.1: 弹窗设计文档完整，有布局图和详细说明

## [ ] Task 6: 设计查看资产记录详情弹窗
- **Priority**: P2
- **Depends On**: [Task 5]
- **Description**: 
  - 详细设计查看资产记录详情的弹窗界面
  - 包括信息展示布局、操作按钮
  - 提供ASCII布局图
- **Acceptance Criteria Addressed**: [AC-4, AC-5]
- **Test Requirements**:
  - `human-judgement` TR-6.1: 详情弹窗设计文档完整，有布局图

## [ ] Task 7: 设计其他相关弹窗
- **Priority**: P2
- **Depends On**: [Task 5]
- **Description**: 
  - 设计删除确认弹窗（如有需要）
  - 设计资产类型管理相关弹窗
  - 提供ASCII布局图
- **Acceptance Criteria Addressed**: [AC-4, AC-5]
- **Test Requirements**:
  - `human-judgement` TR-7.1: 其他弹窗设计文档完整

## [ ] Task 8: 更新需求文档并验证
- **Priority**: P0
- **Depends On**: [Task 1, Task 2, Task 3, Task 4, Task 5, Task 6, Task 7]
- **Description**: 
  - 整合所有更新到需求文档03
  - 更新变更记录
  - 检查文档一致性
- **Acceptance Criteria Addressed**: [AC-5]
- **Test Requirements**:
  - `human-judgement` TR-8.1: 需求文档完整更新，所有调整都已体现
