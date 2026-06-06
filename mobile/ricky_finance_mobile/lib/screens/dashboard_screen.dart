import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import '../utils/formatters.dart';
import '../widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _api = ApiService();
  Stats? _stats;
  List<Record> _recentRecords = [];
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
      final statsData = await _api.getStats();
      final recordsData = await _api.getRecords();

      setState(() {
        _stats = Stats.fromJson(statsData);
        _recentRecords = recordsData.map<Record>((e) => Record.fromJson(e)).take(8).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('资产概览'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: AppColors.textMuted),
                      const SizedBox(height: 16),
                      Text(_error!, style: const TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _loadData, child: const Text('重试')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buildStatCards(),
                      const SizedBox(height: 24),
                      _buildTrendChart(),
                      const SizedBox(height: 24),
                      _buildTypeDistribution(),
                      const SizedBox(height: 24),
                      _buildRecentRecords(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildStatCards() {
    if (_stats == null) return const SizedBox.shrink();
    final stats = _stats!;

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        StatCard(
          title: '总资产',
          value: Formatters.formatMoney(stats.totalValue),
          icon: Icons.account_balance,
          color: AppColors.accent,
        ),
        StatCard(
          title: '资产记录',
          value: '${stats.totalRecords} 条',
          icon: Icons.receipt_long,
          color: AppColors.warning,
        ),
        StatCard(
          title: '家庭成员',
          value: '${stats.memberCount} 人',
          icon: Icons.people,
          color: const Color(0xFF3B82F6),
        ),
        StatCard(
          title: '本月新增',
          value: '${stats.monthlyNew} 条',
          icon: Icons.trending_up,
          color: AppColors.success,
        ),
      ],
    );
  }

  Widget _buildTrendChart() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('资产趋势', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: _stats != null && _stats!.typeDistribution.isNotEmpty
                ? BarChart(
                    BarChartData(
                      alignment: BarChartAlignment.spaceAround,
                      maxY: _stats!.typeDistribution
                          .map((e) => e.totalValue)
                          .reduce((a, b) => a > b ? a : b) * 1.2,
                      barGroups: _stats!.typeDistribution.map((type) {
                        return BarChartGroupData(
                          x: _stats!.typeDistribution.indexOf(type),
                          barRods: [
                            BarChartRodData(
                              toY: type.totalValue,
                              color: Color(int.parse(type.color.replaceFirst('#', '0xFF'))),
                              width: 20,
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                            ),
                          ],
                        );
                      }).toList(),
                      titlesData: FlTitlesData(
                        show: true,
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              final idx = value.toInt();
                              if (idx >= 0 && idx < _stats!.typeDistribution.length) {
                                return Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Text(
                                    _stats!.typeDistribution[idx].displayName,
                                    style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
                                  ),
                                );
                              }
                              return const SizedBox.shrink();
                            },
                          ),
                        ),
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 60,
                            getTitlesWidget: (value, meta) {
                              return Text(
                                Formatters.formatMoney(value),
                                style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                              );
                            },
                          ),
                        ),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        horizontalInterval: _stats!.typeDistribution.isNotEmpty
                            ? (_stats!.typeDistribution.map((e) => e.totalValue).reduce((a, b) => a > b ? a : b) * 1.2) / 4
                            : 100000,
                      ),
                      borderData: FlBorderData(show: false),
                    ),
                  )
                : const Center(child: Text('暂无数据', style: TextStyle(color: AppColors.textMuted))),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeDistribution() {
    if (_stats == null || _stats!.typeDistribution.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('资产配置', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: Row(
              children: [
                Expanded(
                  child: PieChart(
                    PieChartData(
                      sections: _stats!.typeDistribution.map((type) {
                        return PieChartSectionData(
                          color: Color(int.parse(type.color.replaceFirst('#', '0xFF'))),
                          value: type.totalValue,
                          title: '${((type.totalValue / _stats!.totalValue) * 100).toStringAsFixed(0)}%',
                          radius: 60,
                          titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                        );
                      }).toList(),
                      sectionsSpace: 2,
                      centerSpaceRadius: 30,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: _stats!.typeDistribution.map((type) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: Color(int.parse(type.color.replaceFirst('#', '0xFF'))),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            type.displayName,
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentRecords() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('最近记录', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          if (_recentRecords.isEmpty)
            const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('暂无记录', style: TextStyle(color: AppColors.textMuted))))
          else
            ..._recentRecords.map((record) => _buildRecordItem(record)),
        ],
      ),
    );
  }

  Widget _buildRecordItem(Record record) {
    final valueChange = record.previousValue != null ? record.value - record.previousValue! : 0.0;
    final isUp = valueChange > 0;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.getTypeColor(record.type).withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                (record.typeDisplay ?? record.type).substring(0, 1),
                style: TextStyle(
                  color: AppColors.getTypeColor(record.type),
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
                Text(record.name, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14)),
                Text(
                  '${record.memberName ?? ''}  ${Formatters.formatDate(record.date)}',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                Formatters.formatMoney(record.value),
                style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
              ),
              if (record.previousValue != null)
                Text(
                  '${isUp ? "+" : ""}${Formatters.formatMoney(valueChange)}',
                  style: TextStyle(
                    color: isUp ? AppColors.success : AppColors.danger,
                    fontSize: 11,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
