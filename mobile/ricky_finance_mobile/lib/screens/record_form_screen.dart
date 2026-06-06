import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import '../utils/formatters.dart';

class RecordFormScreen extends StatefulWidget {
  final Record? record;
  const RecordFormScreen({super.key, this.record});

  @override
  State<RecordFormScreen> createState() => _RecordFormScreenState();
}

class _RecordFormScreenState extends State<RecordFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _api = ApiService();

  String? _selectedType;
  final _nameController = TextEditingController();
  final _valueController = TextEditingController();
  final _noteController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  int? _selectedMemberId;
  List<Member> _members = [];
  List<String> _assetNameSuggestions = [];
  bool _isLoading = false;

  bool get isEditing => widget.record != null;

  @override
  void initState() {
    super.initState();
    _loadMembers();
    if (isEditing) {
      final r = widget.record!;
      _selectedType = r.type;
      _nameController.text = r.name;
      _valueController.text = r.value.toString();
      _noteController.text = r.note ?? '';
      _selectedDate = DateTime.tryParse(r.date) ?? DateTime.now();
      _selectedMemberId = r.memberId;
    }
  }

  Future<void> _loadMembers() async {
    try {
      final data = await _api.getMembers();
      setState(() => _members = data.map<Member>((e) => Member.fromJson(e)).toList());
    } catch (_) {}
  }

  Future<void> _searchAssetNames(String keyword) async {
    if (keyword.isEmpty) return;
    try {
      final names = await _api.getAssetNames(keyword: keyword);
      setState(() => _assetNameSuggestions = names);
    } catch (_) {}
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final data = {
      'type': _selectedType,
      'name': _nameController.text.trim(),
      'value': double.parse(_valueController.text),
      'date': '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
      'note': _noteController.text.trim(),
      if (_selectedMemberId != null) 'memberId': _selectedMemberId,
    };

    try {
      if (isEditing) {
        await _api.updateRecord(widget.record!.id, data);
      } else {
        await _api.createRecord(data);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('保存失败: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _valueController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? '编辑记录' : '添加记录'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('资产类型', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedType,
                decoration: const InputDecoration(hintText: '选择资产类型'),
                items: const [
                  DropdownMenuItem(value: 'stock', child: Text('📈 股票')),
                  DropdownMenuItem(value: 'fund', child: Text('💰 基金')),
                  DropdownMenuItem(value: 'bond', child: Text('📋 债券')),
                  DropdownMenuItem(value: 'realestate', child: Text('🏠 房地产')),
                  DropdownMenuItem(value: 'cash', child: Text('💵 现金')),
                  DropdownMenuItem(value: 'other', child: Text('📦 其他')),
                ],
                onChanged: (v) => setState(() => _selectedType = v),
                validator: (v) => v == null ? '请选择资产类型' : null,
              ),
              const SizedBox(height: 20),
              const Text('资产名称', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
              const SizedBox(height: 8),
              Autocomplete<String>(
                optionsBuilder: (textEditingValue) {
                  if (textEditingValue.text.isEmpty) return const Iterable<String>.empty();
                  return _assetNameSuggestions.where((name) =>
                      name.toLowerCase().contains(textEditingValue.text.toLowerCase()));
                },
                onSelected: (value) => _nameController.text = value,
                fieldViewBuilder: (context, controller, focusNode, onSubmitted) {
                  _nameController.addListener(() {
                    if (_nameController.text.length >= 1) {
                      _searchAssetNames(_nameController.text);
                    }
                  });
                  return TextFormField(
                    controller: _nameController,
                    focusNode: focusNode,
                    decoration: const InputDecoration(hintText: '输入资产名称'),
                    validator: (v) => v == null || v.trim().isEmpty ? '请输入资产名称' : null,
                  );
                },
              ),
              const SizedBox(height: 20),
              const Text('价值', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _valueController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(hintText: '输入资产价值', prefixText: '¥ '),
                validator: (v) {
                  if (v == null || v.isEmpty) return '请输入资产价值';
                  final val = double.tryParse(v);
                  if (val == null || val < 0) return '请输入有效的金额';
                  return null;
                },
              ),
              const SizedBox(height: 20),
              const Text('日期', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
              const SizedBox(height: 8),
              InkWell(
                onTap: _pickDate,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: AppColors.bgPrimary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    Formatters.formatDate('${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}'),
                    style: const TextStyle(color: AppColors.textPrimary),
                  ),
                ),
              ),
              if (_members.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Text('成员', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                const SizedBox(height: 8),
                DropdownButtonFormField<int?>(
                  value: _selectedMemberId,
                  decoration: const InputDecoration(hintText: '选择成员'),
                  items: _members.map((m) => DropdownMenuItem(value: m.id, child: Text(m.name))).toList(),
                  onChanged: (v) => setState(() => _selectedMemberId = v),
                ),
              ],
              const SizedBox(height: 20),
              const Text('备注', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _noteController,
                maxLines: 3,
                decoration: const InputDecoration(hintText: '添加备注（可选）'),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  child: _isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(isEditing ? '保存修改' : '添加记录', style: const TextStyle(fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
