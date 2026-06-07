import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class Formatters {
  Formatters._();

  static final _currencyFormat = NumberFormat.currency(
    locale: 'zh_CN',
    symbol: '¥',
    decimalDigits: 2,
  );

  static final _compactFormat = NumberFormat.compact(locale: 'zh_CN');

  static String formatMoney(num value) {
    if (value >= 10000) {
      return '¥${_compactFormat.format(value)}';
    }
    return _currencyFormat.format(value);
  }

  static String formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('yyyy-MM-dd').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  static String formatDateTime(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('yyyy-MM-dd HH:mm').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  static String getRoleLabel(String role) {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'head':
        return '户主';
      case 'member':
        return '成员';
      default:
        return role;
    }
  }

  static String getStatusLabel(String status) {
    switch (status) {
      case 'valid':
        return '有效';
      case 'pending':
        return '待处理';
      case 'archived':
        return '已归档';
      default:
        return status;
    }
  }

  static Color getStatusColor(String status) {
    switch (status) {
      case 'valid':
        return const Color(0xFF10B981);
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'archived':
        return const Color(0xFF6B7280);
      default:
        return const Color(0xFF6B7280);
    }
  }
}
