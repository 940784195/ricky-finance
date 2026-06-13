import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final success = await auth.login(
      _usernameController.text.trim(),
      _passwordController.text,
    );

    if (!success && mounted) {
      // 显示详细的错误提示对话框
      _showErrorDialog(auth.error ?? '登录失败');
    }
  }

  void _showErrorDialog(String error) {
    String title = '登录失败';
    String message = error;
    String icon = '❌';
    
    // 根据错误类型设置不同的图标和标题
    if (error.contains('用户名或密码错误')) {
      title = '认证失败';
      icon = '🔐';
      message = '用户名或密码错误，请检查后重试。\n\n提示：默认用户：\n- admin / admin123\n- head / head123\n- member / member123';
    } else if (error.contains('用户不存在')) {
      title = '用户不存在';
      icon = '👤';
      message = '您输入的用户名不存在，请检查用户名。\n\n系统现有用户：admin, head, member, head2';
    } else if (error.contains('网络连接失败') || error.contains('无法连接到服务器')) {
      title = '网络连接失败';
      icon = '📶';
      message = '无法连接到服务器，请检查：\n1. 后端服务是否已启动\n2. 网络连接是否正常\n3. 防火墙设置';
    } else if (error.contains('连接超时')) {
      title = '连接超时';
      icon = '⏰';
      message = '服务器响应超时，请检查：\n1. 网络连接是否稳定\n2. 服务器是否正常运行\n3. 稍后重试';
    } else if (error.contains('服务器内部错误')) {
      title = '服务器错误';
      icon = '⚙️';
      message = '服务器遇到问题，请稍后重试。\n\n如果问题持续存在，请联系管理员。';
    } else if (error.contains('服务暂时不可用')) {
      title = '服务不可用';
      icon = '🚧';
      message = '服务暂时维护中，请稍后重试。';
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Text(icon),
            const SizedBox(width: 8),
            Text(title),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1A1A2E), Color(0xFF0F0F1A)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppColors.accent.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(
                        Icons.account_balance_wallet,
                        size: 40,
                        color: AppColors.accent,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      '资产管家',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '家庭资产管理系统',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 48),
                    TextFormField(
                      controller: _usernameController,
                      decoration: const InputDecoration(
                        hintText: '用户名',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? '请输入用户名' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        hintText: '密码',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off : Icons.visibility,
                          ),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                      validator: (v) => v == null || v.isEmpty ? '请输入密码' : null,
                      onFieldSubmitted: (_) => _handleLogin(),
                    ),
                    const SizedBox(height: 32),
                    Consumer<AuthProvider>(
                      builder: (context, auth, _) {
                        return ElevatedButton(
                          onPressed: auth.isLoading ? null : _handleLogin,
                          child: auth.isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('登 录', style: TextStyle(fontSize: 16)),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
