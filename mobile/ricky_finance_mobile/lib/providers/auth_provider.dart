import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../models/models.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  User? _user;
  bool _isLoading = true;
  String? _error;

  User? get user => _user;
  bool get isLoggedIn => _user != null;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAdmin => _user?.role == 'admin';
  bool get isHead => _user?.role == 'head';

  AuthProvider() {
    _tryAutoLogin();
  }

  Future<void> _tryAutoLogin() async {
    _isLoading = true;
    notifyListeners();

    final token = await _api.getStoredToken();
    if (token != null) {
      await _api.setToken(token);
      final prefs = await _api.getStoredToken();
      if (prefs != null) {
        try {
          final stats = await _api.getStats();
          if (stats != null) {
            _isLoading = false;
            notifyListeners();
            return;
          }
        } catch (_) {}
      }
      await _api.setToken(null);
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _api.login(username, password);
      await _api.setToken(result['token']);

      _user = User.fromJson(result['user']);
      _api.setOnUnauthorized(_handleUnauthorized);

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      // 根据状态码提供更具体的错误信息
      if (e.statusCode == 401) {
        _error = '用户名或密码错误，请检查后重试';
      } else if (e.statusCode == 404) {
        _error = '用户不存在，请检查用户名';
      } else if (e.statusCode == 500) {
        _error = '服务器内部错误，请稍后重试';
      } else if (e.statusCode == 503) {
        _error = '服务暂时不可用，请稍后重试';
      } else {
        _error = e.message;
      }
      
      _isLoading = false;
      notifyListeners();
      return false;
    } on http.ClientException {
      _error = '网络连接失败，请检查网络设置';
      _isLoading = false;
      notifyListeners();
      return false;
    } on SocketException {
      _error = '无法连接到服务器，请检查网络连接';
      _isLoading = false;
      notifyListeners();
      return false;
    } on TimeoutException {
      _error = '连接超时，请检查网络或稍后重试';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = '登录失败，请稍后重试';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _api.setToken(null);
    _user = null;
    notifyListeners();
  }

  void _handleUnauthorized() {
    logout();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
