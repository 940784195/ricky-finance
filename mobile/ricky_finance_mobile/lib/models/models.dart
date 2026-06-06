class User {
  final int id;
  final String username;
  final String role;
  final int? memberId;
  final int? familyId;
  final String? name;
  final String? shortName;

  User({
    required this.id,
    required this.username,
    required this.role,
    this.memberId,
    this.familyId,
    this.name,
    this.shortName,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      username: json['username'] ?? '',
      role: json['role'] ?? 'member',
      memberId: json['memberId'] != null
          ? (json['memberId'] is int ? json['memberId'] : int.parse(json['memberId'].toString()))
          : null,
      familyId: json['familyId'] != null
          ? (json['familyId'] is int ? json['familyId'] : int.parse(json['familyId'].toString()))
          : null,
      name: json['name'],
      shortName: json['shortName'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'role': role,
        'memberId': memberId,
        'familyId': familyId,
        'name': name,
        'shortName': shortName,
      };
}

class Member {
  final int id;
  final int familyId;
  final String name;
  final String? shortName;
  final String role;
  final String? createdAt;
  final int? recordCount;
  final double? totalAssets;

  Member({
    required this.id,
    required this.familyId,
    required this.name,
    this.shortName,
    required this.role,
    this.createdAt,
    this.recordCount,
    this.totalAssets,
  });

  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      id: _parseInt(json['id']),
      familyId: _parseInt(json['family_id'] ?? json['familyId']),
      name: json['name'] ?? '',
      shortName: json['short_name'] ?? json['shortName'],
      role: json['role'] ?? 'member',
      createdAt: json['created_at'] ?? json['createdAt'],
      recordCount: json['record_count'] != null ? _parseInt(json['record_count']) : null,
      totalAssets: json['total_assets'] != null ? _parseDouble(json['total_assets']) : null,
    );
  }

  static int _parseInt(dynamic v) => v is int ? v : int.parse(v.toString());
  static double _parseDouble(dynamic v) => v is double ? v : double.parse(v.toString());
}

class AssetType {
  final int id;
  final String typeValue;
  final String displayName;
  final String color;
  final int isCustom;
  final int? familyId;
  final int? usageCount;

  AssetType({
    required this.id,
    required this.typeValue,
    required this.displayName,
    required this.color,
    required this.isCustom,
    this.familyId,
    this.usageCount,
  });

  factory AssetType.fromJson(Map<String, dynamic> json) {
    return AssetType(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      typeValue: json['type_value'] ?? json['typeValue'] ?? '',
      displayName: json['display_name'] ?? json['displayName'] ?? '',
      color: json['color'] ?? '#6B7280',
      isCustom: json['is_custom'] is int ? json['is_custom'] : int.parse(json['is_custom'].toString()),
      familyId: json['family_id'] != null
          ? (json['family_id'] is int ? json['family_id'] : int.parse(json['family_id'].toString()))
          : null,
      usageCount: json['usage_count'] != null
          ? (json['usage_count'] is int ? json['usage_count'] : int.parse(json['usage_count'].toString()))
          : null,
    );
  }
}

class Record {
  final int id;
  final int memberId;
  final int familyId;
  final String type;
  final String name;
  final double value;
  final double? previousValue;
  final String date;
  final String status;
  final String? note;
  final String? memberName;
  final String? typeDisplay;
  final String? typeColor;
  final String? createdAt;

  Record({
    required this.id,
    required this.memberId,
    required this.familyId,
    required this.type,
    required this.name,
    required this.value,
    this.previousValue,
    required this.date,
    required this.status,
    this.note,
    this.memberName,
    this.typeDisplay,
    this.typeColor,
    this.createdAt,
  });

  factory Record.fromJson(Map<String, dynamic> json) {
    return Record(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      memberId: json['member_id'] is int ? json['member_id'] : int.parse(json['member_id'].toString()),
      familyId: json['family_id'] is int ? json['family_id'] : int.parse(json['family_id'].toString()),
      type: json['type'] ?? '',
      name: json['name'] ?? '',
      value: json['value'] is double ? json['value'] : double.parse(json['value'].toString()),
      previousValue: json['previous_value'] != null
          ? (json['previous_value'] is double ? json['previous_value'] : double.parse(json['previous_value'].toString()))
          : null,
      date: json['date'] ?? '',
      status: json['status'] ?? 'valid',
      note: json['note'],
      memberName: json['member_name'],
      typeDisplay: json['type_display'],
      typeColor: json['type_color'],
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() => {
        'type': type,
        'name': name,
        'value': value,
        'date': date,
        'note': note ?? '',
        'memberId': memberId,
      };
}

class Stats {
  final double totalValue;
  final int totalRecords;
  final int memberCount;
  final int activeMembers;
  final int monthlyNew;
  final int pendingCount;
  final List<TypeDistribution> typeDistribution;

  Stats({
    required this.totalValue,
    required this.totalRecords,
    required this.memberCount,
    required this.activeMembers,
    required this.monthlyNew,
    required this.pendingCount,
    required this.typeDistribution,
  });

  factory Stats.fromJson(Map<String, dynamic> json) {
    return Stats(
      totalValue: _parseDouble(json['totalValue']),
      totalRecords: _parseInt(json['totalRecords']),
      memberCount: _parseInt(json['memberCount']),
      activeMembers: _parseInt(json['activeMembers']),
      monthlyNew: _parseInt(json['monthlyNew']),
      pendingCount: _parseInt(json['pendingCount']),
      typeDistribution: (json['typeDistribution'] as List? ?? [])
          .map((e) => TypeDistribution.fromJson(e))
          .toList(),
    );
  }

  static int _parseInt(dynamic v) => v is int ? v : int.parse(v.toString());
  static double _parseDouble(dynamic v) => v is double ? v : double.parse(v.toString());
}

class TypeDistribution {
  final String type;
  final String displayName;
  final String color;
  final int recordCount;
  final double totalValue;

  TypeDistribution({
    required this.type,
    required this.displayName,
    required this.color,
    required this.recordCount,
    required this.totalValue,
  });

  factory TypeDistribution.fromJson(Map<String, dynamic> json) {
    return TypeDistribution(
      type: json['type'] ?? '',
      displayName: json['display_name'] ?? json['type'] ?? '',
      color: json['color'] ?? '#6B7280',
      recordCount: json['record_count'] is int ? json['record_count'] : int.parse(json['record_count'].toString()),
      totalValue: json['total_value'] is double ? json['total_value'] : double.parse(json['total_value'].toString()),
    );
  }
}
