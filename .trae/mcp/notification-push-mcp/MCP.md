---
name: "notification-push-mcp"
description: "集成邮件/短信/APP推送服务。当需要发送通知时调用。"
---

# Notification Push MCP

## Overview
该MCP提供多渠道消息推送功能。

## Capabilities
- 邮件推送：SMTP邮件发送
- 短信推送：集成短信网关
- APP推送：iOS/Android推送通知
- 消息队列：异步消息处理

## Supported Services
- 邮件：SendGrid, SMTP
- 短信：Twilio, 阿里云短信
- 推送：Firebase, APNs

## Usage
为提醒通知智能体提供消息推送能力。
