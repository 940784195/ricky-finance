import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import '../widgets/empty_view.dart';
import '../widgets/error_view.dart';
import '../widgets/loading_view.dart';

class AssetTypesScreen extends StatefulWidget {
  const AssetTypesScreen({super.key});

  @override
  State<AssetTypesScreen> createState() => _AssetTypesScreenState();
}

class _AssetTypesScreenState extends State<AssetTypesScreen> {
  final ApiService _api = ApiService();
  List<AssetType> _types = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = await _api.getAssetTypes();
      setState(() {
        _types = data.map((e) => AssetType.fromJson(e)).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteType(AssetType type) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardBg,
        title: const Text('确认删除'),
        content: Text(
          '确定要删除资产类型「${type.displayName}」吗？\n关联的资产记录将转为"其他"类型。',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _api.deleteAssetType(type.id);
        _loadData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('资产类型已删除')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('删除失败: $e')),
          );
        }
      }
    }
  }

  Future<void> _restoreDefaults() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardBg,
        title: const Text('恢复默认'),
        content: const Text('确定要恢复默认资产类型吗？\n所有自定义类型将被删除。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('恢复'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _api.restoreDefaultAssetTypes();
        _loadData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('已恢复默认资产类型')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('恢复失败: $e')),
          );
        }
      }
    }
  }

  void _showTypeForm({AssetType? type}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _AssetTypeFormScreen(type: type),
      ),
    ).then((_) => _loadData());
  }

  Color _parseColor(String hex) {
    try {
      return Color(int.parse(hex.replaceFirst('#', '0xFF')));
    } catch (_) {
      return const Color(0xFF6B7280);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isHead = auth.isHead;

    return Scaffold(
      appBar: AppBar(
        title: const Text('资产类型'),
        actions: [
          if (isHead)
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: () => _showTypeForm(),
              tooltip: '添加类型',
            ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: isHead
          ? FloatingActionButton(
              onPressed: () => _showTypeForm(),
              backgroundColor: AppColors.accent,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const LoadingView(message: '加载资产类型...');
    if (_error != null) {
      return ErrorView(message: _error!, onRetry: _loadData);
    }
    if (_types.isEmpty) {
      return const EmptyView(
        message: '暂无资产类型',
        icon: Icons.category_outlined,
      );
    }

    final auth = context.read<AuthProvider>();
    final isHead = auth.isHead;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ..._types.map((type) => _buildTypeCard(type, isHead)),
          if (isHead) ...[
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: _restoreDefaults,
              icon: const Icon(Icons.restore, color: AppColors.warning),
              label: const Text(
                '恢复默认资产类型',
                style: TextStyle(color: AppColors.warning),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.warning),
                minimumSize: const Size(double.infinity, 48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypeCard(AssetType type, bool isHead) {
    final color = _parseColor(type.color);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.category,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      type.displayName,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (type.isCustom == 1) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.accent.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          '自定义',
                          style: TextStyle(
                            color: AppColors.accent,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  type.typeValue,
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (type.usageCount != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.bgPrimary,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '${type.usageCount} 条',
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 12,
                ),
              ),
            ),
          if (isHead && type.isCustom == 1) ...[
            const SizedBox(width: 8),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, color: AppColors.textMuted),
              color: AppColors.cardBg,
              onSelected: (value) {
                if (value == 'edit') {
                  _showTypeForm(type: type);
                } else if (value == 'delete') {
                  _deleteType(type);
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit, size: 18, color: AppColors.accent),
                      SizedBox(width: 8),
                      Text('编辑'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, size: 18, color: AppColors.danger),
                      SizedBox(width: 8),
                      Text('删除'),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _AssetTypeFormScreen extends StatefulWidget {
  final AssetType? type;

  const _AssetTypeFormScreen({this.type});

  @override
  State<_AssetTypeFormScreen> createState() => _AssetTypeFormScreenState();
}

class _AssetTypeFormScreenState extends State<_AssetTypeFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _api = ApiService();
  final _typeValueController = TextEditingController();
  final _displayNameController = TextEditingController();
  String _color = '#8B5CF6';
  bool _isLoading = false;

  bool get isEditing => widget.type != null;

  static const _colorOptions = [
    {'label': '紫色', 'value': '#8B5CF6'},
    {'label': '蓝色', 'value': '#3B82F6'},
    {'label': '绿色', 'value': '#10B981'},
    {'label': '黄色', 'value': '#F59E0B'},
    {'label': '红色', 'value': '#EF4444'},
    {'label': '粉色', 'value': '#EC4899'},
    {'label': '青色', 'value': '#06B6D4'},
    {'label': '灰色', 'value': '#6B7280'},
  ];

  @override
  void initState() {
    super.initState();
    if (isEditing) {
      _typeValueController.text = widget.type!.typeValue;
      _displayNameController.text = widget.type!.displayName;
      _color = widget.type!.color;
    }
  }

  @override
  void dispose() {
    _typeValueController.dispose();
    _displayNameController.dispose();
    super.dispose();
  }

  Color _parseColor(String hex) {
    try {
      return Color(int.parse(hex.replaceFirst('#', '0xFF')));
    } catch (_) {
      return AppColors.accent;
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final data = {
        'typeValue': _typeValueController.text.trim(),
        'displayName': _displayNameController.text.trim(),
        'color': _color,
      };

      if (isEditing) {
        await _api.updateAssetType(widget.type!.id, data);
      } else {
        await _api.createAssetType(data);
      }

      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('操作失败: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? '编辑资产类型' : '添加资产类型'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _typeValueController,
                decoration: const InputDecoration(
                  labelText: '类型标识',
                  hintText: '如: crypto, insurance',
                  prefixIcon: Icon(Icons.code),
                ),
                enabled: !isEditing,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? '请输入类型标识' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _displayNameController,
                decoration: const InputDecoration(
                  labelText: '显示名称',
                  hintText: '如: 加密货币, 保险',
                  prefixIcon: Icon(Icons.label),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? '请输入显示名称' : null,
              ),
              const SizedBox(height: 16),
              InputDecorator(
                decoration: const InputDecoration(
                  labelText: '颜色',
                  prefixIcon: Icon(Icons.palette),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: _colorOptions.map((option) {
                        final color = _parseColor(option['value']!);
                        final isSelected = _color == option['value'];
                        return GestureDetector(
                          onTap: () => setState(() => _color = option['value']!),
                          child: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                              border: isSelected
                                  ? Border.all(
                                      color: AppColors.textPrimary,
                                      width: 3,
                                    )
                                  : null,
                              boxShadow: isSelected
                                  ? [
                                      BoxShadow(
                                        color: color.withOpacity(0.4),
                                        blurRadius: 8,
                                        spreadRadius: 1,
                                      ),
                                    ]
                                  : null,
                            ),
                            child: isSelected
                                ? const Icon(Icons.check,
                                    color: Colors.white, size: 18)
                                : null,
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(isEditing ? '保存修改' : '添加类型'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
