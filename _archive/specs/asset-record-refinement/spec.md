# 资产记录功能优化 - Product Requirement Document

## Overview
- **Summary**: 优化资产记录管理功能，包括调整批量导入/导出的优先级、移除审核流程、细化界面设计特别是二级弹窗的设计
- **Purpose**: 简化用户操作流程，优化界面交互体验
- **Target Users**: 户主、家庭成员、系统管理员

## Goals
- 将批量导入、批量导出功能标记为可选项（降低优先级）
- 移除资产记录的审核流程和状态显示
- 细化页面设计，特别是二级弹窗的界面设计
- 更新相关需求文档

## Non-Goals (Out of Scope)
- 不重新实现批量导入导出功能（仅调整优先级和说明）
- 不添加新的核心功能
- 不重构现有代码架构

## Background & Context
- 基于需求文档03：资产记录与类型管理
- 当前功能包含审核流程，用户反馈不需要
- 批量导入导出是高级功能，可降低优先级

## Functional Requirements
- **FR-1**: 调整批量导入、批量导出功能的优先级为可选
- **FR-2**: 移除资产记录的审核流程，去除status字段的待审核状态
- **FR-3**: 细化资产记录页面的设计
- **FR-4**: 设计并细化二级弹窗（新增/编辑记录、查看详情等）的界面
- **FR-5**: 更新相关需求文档

## Non-Functional Requirements
- **NFR-1**: 界面响应时间 < 2秒
- **NFR-2**: 所有修改要保持与现有界面风格一致

## Constraints
- **Technical**: 使用现有的前端（HTML/CSS/JS）和后端（Node.js/Express）技术栈
- **Business**: 保持与现有系统架构和功能的兼容性
- **Dependencies**: 依赖现有的数据库结构和API接口

## Assumptions
- 用户了解资产记录的基本流程
- 现有代码库可以支持这些调整
- 无需重大数据库变更，只需部分字段调整

## Acceptance Criteria

### AC-1: 批量功能优先级调整
- **Given**: 用户查看需求文档和功能说明
- **When**: 查看批量导入/导出功能描述
- **Then**: 明确看到该功能标记为"可选/后续规划"，优先级降低
- **Verification**: `human-judgment`

### AC-2: 审核流程移除
- **Given**: 用户查看资产记录功能
- **When**: 新增或查看资产记录
- **Then**: 无需审核流程，界面无"待审核"状态显示
- **Verification**: `programmatic` + `human-judgment`

### AC-3: 页面设计细化
- **Given**: 用户访问资产记录页面
- **When**: 浏览和使用页面
- **Then**: 界面设计清晰、符合规范，无审核状态相关UI
- **Verification**: `human-judgment`

### AC-4: 弹窗设计详细化
- **Given**: 用户进行新增/编辑/查看详情等操作
- **When**: 打开二级弹窗
- **Then**: 弹窗布局清晰、字段完整、交互友好，有详细设计说明
- **Verification**: `human-judgment`

### AC-5: 需求文档更新
- **Given**: 查阅需求文档03
- **When**: 查看更新后的需求
- **Then**: 文档准确反映所有调整和设计细节
- **Verification**: `human-judgment`

## Open Questions
- [ ] 是否需要保留status字段仅用于历史数据兼容？
- [ ] 批量导入导出功能后续是否需要再考虑？
