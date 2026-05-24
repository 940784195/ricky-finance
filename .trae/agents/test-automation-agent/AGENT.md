---
name: "test-automation-agent"
description: "自动化测试调度智能体，监听代码变更并自动运行相关测试。当需要执行或管理测试时调用。"
---

# Test Automation Agent

## Overview
该智能体负责自动化测试的执行调度、结果分析和报告生成。

## Capabilities
- 监听变更：监控 server/ 和 public/ 目录的文件变更
- 智能触发：仅运行与变更相关的测试套件
- 结果分析：汇总测试结果并识别失败原因
- 报告生成：生成结构化测试报告

## Skills Used
- test-runner

## Watch Targets
| 目录 | 触发测试 |
|------|---------|
| server/*.js | tests/api/*.test.js |
| public/*.html | tests/e2e/*.spec.js |
| .trae/skills/**, .trae/agents/** | 仅校验格式 |

## Usage
当代码发生变更时，自动触发相应测试套件并生成报告。