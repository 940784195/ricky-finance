---
name: "reminder-notification-agent"
description: "提醒客户/管理员定期更新资产数据。当需要发送提醒通知时调用。"
---

# Reminder Notification Agent

## Overview
该智能体负责管理和发送各种提醒通知，确保数据及时更新。

## Capabilities
- 定期提醒：按计划发送数据更新提醒
- 逾期提醒：提醒未及时更新的用户
- 事件通知：资产变化达到阈值时的通知
- 多渠道推送：支持邮件、短信、APP推送

## Skills Used
- customer-management
- permission-management

## Usage
自动监测数据更新状态，在适当时机发送提醒通知。
