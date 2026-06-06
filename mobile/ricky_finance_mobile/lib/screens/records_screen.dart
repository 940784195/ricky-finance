import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import '../utils/formatters.dart';
import 'record_form_screen.dart';

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key});

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  final ApiService _api = ApiService();
  List<Record> _records = [];
  List<Member> _members = [];
  bool _isLoading = true;
  String? _error;

  int? _filterMemberId;
  String? _filterType;
  String? _filterStatus;
  String? _keyword;

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
      final recordsData = await _api.getRecords(
        memberId: _filterMemberId,
        type: _filterType,
        status: _filterStatus,
        keyword: _keyword,
      );
      final membersData = await _api.getMembers();

      setState(() {
        _records = recordsData.map<Record>((e) => Record.fromJson(e)).toList();
        _members = membersData.map<Member>((e) => Member.fromJson(e)).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteRecord(Record record) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除"${record.name}"吗？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('删除', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _api.deleteRecord(record.id);
        _loadData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('记录已删除'), backgroundColor: AppColors.success),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('删除失败: $e'), backgroundColor: AppColors.danger),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('资产记录'),
        actions: [
          IconButton(icon: const Icon(Icons.filter_list), onPressed: _showFilterSheet),
          IconButton(icon: const Icon(Icons.search), onPressed: _showSearch),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const RecordFormScreen()),
          );
          if (result == true) _loadData();
        },
        backgroundColor: AppColors.accent,
        child: const Icon(Icons.add),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, style: const TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _loadData, child: const Text('重试')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: _records.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 120),
                            Center(child: Icon(Icons.inbox, size: 64, color: AppColors.textMuted)),
                            SizedBox(height: 16),
                            Center(child: Text('暂无记录', style: TextStyle(color: AppColors.textMuted, fontSize: 16))),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _records.length,
                          itemBuilder: (context, index) => _buildRecordCard(_records[index]),
                        ),
                ),
    );
  }

  Widget _buildRecordCard(Record record) {
    return Dismissible(
      key: Key('record_${record.id}'),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async {
        await _deleteRecord(record);
        return false;
      },
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: AppColors.danger,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      child: Card(
        margin: const EdgeInsets.only(bottom: 10),
        child: InkWell(
          onTap: () async {
            final result = await Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => RecordFormScreen(record: record)),
            );
            if (result == true) _loadData();
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: AppColors.getTypeColor(record.type).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      (record.typeDisplay ?? record.type).substring(0, 1),
                      style: TextStyle(
                        color: AppColors.getTypeColor(record.type),
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
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
                          Text(record.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Formatters.getStatusColor(record.status).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              Formatters.getStatusLabel(record.status),
                              style: TextStyle(fontSize: 10, color: Formatters.getStatusColor(record.status)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${record.memberName ?? ''}  ${Formatters.formatDate(record.date)}',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Text(
                  Formatters.formatMoney(record.value),
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('筛选条件', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<int?>(
                    value: _filterMemberId,
                    decoration: const InputDecoration(hintText: '选择成员'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('全部成员')),
                      ..._members.map((m) => DropdownMenuItem(value: m.id, child: Text(m.name))),
                    ],
                    onChanged: (v) => setSheetState(() => _filterMemberId = v),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String?>(
                    value: _filterType,
                    decoration: const InputDecoration(hintText: '资产类型'),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('全部类型')),
                      DropdownMenuItem(value: 'stock', child: Text('股票')),
                      DropdownMenuItem(value: 'fund', child: Text('基金')),
                      DropdownMenuItem(value: 'bond', child: Text('债券')),
                      DropdownMenuItem(value: 'realestate', child: Text('房地产')),
                      DropdownMenuItem(value: 'cash', child: Text('现金')),
                      DropdownMenuItem(value: 'other', child: Text('其他')),
                    ],
                    onChanged: (v) => setSheetState(() => _filterType = v),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String?>(
                    value: _filterStatus,
                    decoration: const InputDecoration(hintText: '状态'),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('全部状态')),
                      DropdownMenuItem(value: 'valid', child: Text('有效')),
                      DropdownMenuItem(value: 'pending', child: Text('待处理')),
                      DropdownMenuItem(value: 'archived', child: Text('已归档')),
                    ],
                    onChanged: (v) => setSheetState(() => _filterStatus = v),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _loadData();
                      },
                      child: const Text('应用筛选'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        setSheetState(() {
                          _filterMemberId = null;
                          _filterType = null;
                          _filterStatus = null;
                        });
                        Navigator.pop(ctx);
                        _loadData();
                      },
                      child: const Text('清除筛选'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showSearch() {
    showDialog(
      context: context,
      builder: (ctx) {
        final controller = TextEditingController(text: _keyword);
        return AlertDialog(
          title: const Text('搜索资产'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(hintText: '输入资产名称关键词'),
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('取消'),
            ),
            TextButton(
              onPressed: () {
                _keyword = controller.text.isEmpty ? null : controller.text;
                Navigator.pop(ctx);
                _loadData();
              },
              child: const Text('搜索'),
            ),
          ],
        );
      },
    );
  }
}
