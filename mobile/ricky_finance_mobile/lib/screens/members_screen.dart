import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import '../utils/formatters.dart';
import '../widgets/empty_view.dart';
import '../widgets/error_view.dart';
import '../widgets/loading_view.dart';

class MembersScreen extends StatefulWidget {
  const MembersScreen({super.key});

  @override
  State<MembersScreen> createState() => _MembersScreenState();
}

class _MembersScreenState extends State<MembersScreen> {
  final ApiService _api = ApiService();
  List<Member> _members = [];
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
      final data = await _api.getMembers();
      setState(() {
        _members = data.map((e) => Member.fromJson(e)).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteMember(Member member) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardBg,
        title: const Text('确认删除'),
        content: Text('确定要删除成员「${member.name}」吗？\n该成员的所有资产记录也将被删除。'),
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
        await _api.deleteMember(member.id);
        _loadData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('成员已删除')),
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

  void _showMemberForm({Member? member}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _MemberFormScreen(member: member),
      ),
    ).then((_) => _loadData());
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isHead = auth.isHead;

    return Scaffold(
      appBar: AppBar(
        title: const Text('家庭成员'),
        actions: [
          if (isHead)
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: () => _showMemberForm(),
              tooltip: '添加成员',
            ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: isHead
          ? FloatingActionButton(
              onPressed: () => _showMemberForm(),
              backgroundColor: AppColors.accent,
              child: const Icon(Icons.person_add),
            )
          : null,
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const LoadingView(message: '加载成员列表...');
    if (_error != null) {
      return ErrorView(message: _error!, onRetry: _loadData);
    }
    if (_members.isEmpty) {
      return const EmptyView(
        message: '暂无家庭成员',
        icon: Icons.people_outline,
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _members.length,
        itemBuilder: (context, index) => _buildMemberCard(_members[index]),
      ),
    );
  }

  Widget _buildMemberCard(Member member) {
    final auth = context.read<AuthProvider>();
    final isHead = auth.isHead;
    final isCurrentUser = auth.user?.memberId == member.id;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12),
        border: isCurrentUser
            ? Border.all(color: AppColors.accent.withOpacity(0.5))
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.accent.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(22),
                ),
                child: Center(
                  child: Text(
                    member.shortName ?? member.name[0],
                    style: const TextStyle(
                      color: AppColors.accent,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
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
                          member.name,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (isCurrentUser) ...[
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
                              '我',
                              style: TextStyle(
                                color: AppColors.accent,
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: member.role == 'head'
                            ? AppColors.warning.withOpacity(0.15)
                            : AppColors.success.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        Formatters.getRoleLabel(member.role),
                        style: TextStyle(
                          color: member.role == 'head'
                              ? AppColors.warning
                              : AppColors.success,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (isHead && !isCurrentUser)
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert, color: AppColors.textMuted),
                  color: AppColors.cardBg,
                  onSelected: (value) {
                    if (value == 'edit') {
                      _showMemberForm(member: member);
                    } else if (value == 'delete') {
                      _deleteMember(member);
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
          ),
          if (member.recordCount != null || member.totalAssets != null) ...[
            const SizedBox(height: 12),
            const Divider(color: AppColors.border),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildStatItem(
                  Icons.receipt_long,
                  '${member.recordCount ?? 0} 条记录',
                ),
                const SizedBox(width: 24),
                _buildStatItem(
                  Icons.account_balance_wallet,
                  Formatters.formatMoney(member.totalAssets ?? 0),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
      ],
    );
  }
}

class _MemberFormScreen extends StatefulWidget {
  final Member? member;

  const _MemberFormScreen({this.member});

  @override
  State<_MemberFormScreen> createState() => _MemberFormScreenState();
}

class _MemberFormScreenState extends State<_MemberFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _api = ApiService();
  final _nameController = TextEditingController();
  final _shortNameController = TextEditingController();
  String _role = 'member';
  bool _isLoading = false;

  bool get isEditing => widget.member != null;

  @override
  void initState() {
    super.initState();
    if (isEditing) {
      _nameController.text = widget.member!.name;
      _shortNameController.text = widget.member!.shortName ?? '';
      _role = widget.member!.role;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _shortNameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final data = {
        'name': _nameController.text.trim(),
        'shortName': _shortNameController.text.trim().isEmpty
            ? _nameController.text.trim()[0]
            : _shortNameController.text.trim(),
        'role': _role,
      };

      if (isEditing) {
        await _api.updateMember(widget.member!.id, data);
      } else {
        await _api.createMember(data);
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
        title: Text(isEditing ? '编辑成员' : '添加成员'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: '姓名',
                  hintText: '请输入成员姓名',
                  prefixIcon: Icon(Icons.person),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? '请输入成员姓名' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _shortNameController,
                decoration: const InputDecoration(
                  labelText: '简称',
                  hintText: '默认取姓名首字',
                  prefixIcon: Icon(Icons.short_text),
                ),
              ),
              const SizedBox(height: 16),
              InputDecorator(
                decoration: const InputDecoration(
                  labelText: '角色',
                  prefixIcon: Icon(Icons.badge),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _role,
                    isDense: true,
                    isExpanded: true,
                    dropdownColor: AppColors.cardBg,
                    onChanged: (v) {
                      if (v != null) setState(() => _role = v);
                    },
                    items: const [
                      DropdownMenuItem(
                        value: 'member',
                        child: Text('成员'),
                      ),
                      DropdownMenuItem(
                        value: 'head',
                        child: Text('户主'),
                      ),
                    ],
                  ),
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
                    : Text(isEditing ? '保存修改' : '添加成员'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
