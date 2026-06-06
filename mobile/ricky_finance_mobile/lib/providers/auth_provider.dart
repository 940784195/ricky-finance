import 'package:flutter/material.dart';
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
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = '网络连接失败，请检查网络设置';
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
