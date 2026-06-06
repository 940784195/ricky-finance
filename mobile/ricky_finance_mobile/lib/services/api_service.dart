import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;
  Function? _onUnauthorized;

  void setOnUnauthorized(Function callback) {
    _onUnauthorized = callback;
  }

  Future<void> setToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString('auth_token', token);
    } else {
      await prefs.remove('auth_token');
    }
  }

  Future<String?> getStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<Map<String, String>> _headers() async {
    _token ??= await getStoredToken();
    return {
      'Content-Type': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };
  }

  Future<dynamic> get(String path, {Map<String, String>? queryParams}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: await _headers())
        .timeout(ApiConfig.timeout);
    return _handleResponse(response);
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final response = await http.post(uri, headers: await _headers(), body: jsonEncode(body))
        .timeout(ApiConfig.timeout);
    return _handleResponse(response);
  }

  Future<dynamic> put(String path, {Map<String, dynamic>? body}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final response = await http.put(uri, headers: await _headers(), body: jsonEncode(body))
        .timeout(ApiConfig.timeout);
    return _handleResponse(response);
  }

  Future<dynamic> delete(String path) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final response = await http.delete(uri, headers: await _headers())
        .timeout(ApiConfig.timeout);
    return _handleResponse(response);
  }

  dynamic _handleResponse(http.Response response) {
    final body = jsonDecode(response.body);
    if (response.statusCode == 401) {
      _onUnauthorized?.call();
      throw ApiException(body['message'] ?? '登录已过期', statusCode: 401);
    }
    if (response.statusCode >= 400) {
      throw ApiException(body['message'] ?? '请求失败', statusCode: response.statusCode);
    }
    return body;
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    final result = await post('/auth/login', body: {
      'username': username,
      'password': password,
    });
    return result;
  }

  Future<Map<String, dynamic>> getStats() async {
    final result = await get('/stats');
    return result['data'];
  }

  Future<List<dynamic>> getRecords({
    int? memberId,
    String? type,
    String? status,
    String? startDate,
    String? endDate,
    String? keyword,
  }) async {
    final params = <String, String>{};
    if (memberId != null) params['memberId'] = memberId.toString();
    if (type != null) params['type'] = type;
    if (status != null) params['status'] = status;
    if (startDate != null) params['startDate'] = startDate;
    if (endDate != null) params['endDate'] = endDate;
    if (keyword != null) params['keyword'] = keyword;
    final result = await get('/records', queryParams: params.isNotEmpty ? params : null);
    return result['data'];
  }

  Future<List<String>> getAssetNames({String? keyword}) async {
    final params = keyword != null ? {'keyword': keyword} : null;
    final result = await get('/records/asset-names', queryParams: params);
    return List<String>.from(result['data']);
  }

  Future<Map<String, dynamic>> createRecord(Map<String, dynamic> data) async {
    final result = await post('/records', body: data);
    return result['data'];
  }

  Future<Map<String, dynamic>> updateRecord(int id, Map<String, dynamic> data) async {
    final result = await put('/records/$id', body: data);
    return result['data'];
  }

  Future<void> deleteRecord(int id) async {
    await delete('/records/$id');
  }

  Future<List<dynamic>> getMembers() async {
    final result = await get('/members');
    return result['data'];
  }

  Future<Map<String, dynamic>> createMember(Map<String, dynamic> data) async {
    final result = await post('/members', body: data);
    return result['data'];
  }

  Future<Map<String, dynamic>> updateMember(int id, Map<String, dynamic> data) async {
    final result = await put('/members/$id', body: data);
    return result['data'];
  }

  Future<void> deleteMember(int id) async {
    await delete('/members/$id');
  }

  Future<List<dynamic>> getAssetTypes() async {
    final result = await get('/asset-types');
    return result['data'];
  }

  Future<Map<String, dynamic>> createAssetType(Map<String, dynamic> data) async {
    final result = await post('/asset-types', body: data);
    return result['data'];
  }

  Future<void> restoreDefaultAssetTypes() async {
    await post('/asset-types/restore-default');
  }

  Future<Map<String, dynamic>> updateAssetType(int id, Map<String, dynamic> data) async {
    final result = await put('/asset-types/$id', body: data);
    return result['data'];
  }

  Future<void> deleteAssetType(int id) async {
    await delete('/asset-types/$id');
  }
}
