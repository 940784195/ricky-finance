import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color bgPrimary = Color(0xFF0F0F1A);
  static const Color cardBg = Color(0xFF1A1A2E);
  static const Color accent = Color(0xFF8B5CF6);
  static const Color accentLight = Color(0xFFA78BFA);
  static const Color textPrimary = Color(0xFFF1F5F9);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
  static const Color border = Color(0xFF2D2D3F);

  static const Map<String, Color> typeColors = {
    'stock': Color(0xFFF59E0B),
    'fund': Color(0xFF3B82F6),
    'bond': Color(0xFF10B981),
    'realestate': Color(0xFFEC4899),
    'cash': Color(0xFF6366F1),
    'other': Color(0xFF6B7280),
  };

  static Color getTypeColor(String type) {
    return typeColors[type] ?? const Color(0xFF6B7280);
  }
}

class ApiConfig {
  ApiConfig._();

  static const String baseUrl = 'http://10.0.2.2:3000/api';

  static const Duration timeout = Duration(seconds: 15);
}
