import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'tables.dart';

part 'database.g.dart';

@DriftDatabase(tables: [Members, AssetTypes, Records, Users, Families])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  static QueryExecutor _openConnection() {
    return driftDatabase(name: 'ricky_finance.db');
  }

  Future<List<Member>> getAllMembers() => select(members).get();

  Future<Member?> getMemberById(int id) {
    return (select(members)..where((t) => t.id.equals(id))).getSingleOrNull();
  }

  Future<List<Member>> getMembersByFamily(int familyId) {
    return (select(members)..where((t) => t.familyId.equals(familyId))).get();
  }

  Future<int> insertMember(MembersCompanion entry) {
    return into(members).insert(entry);
  }

  Future<bool> updateMember(int id, MembersCompanion entry) {
    return (update(members)..where((t) => t.id.equals(id))).write(entry);
  }

  Future<int> deleteMember(int id) {
    return (delete(members)..where((t) => t.id.equals(id))).go();
  }

  Future<List<AssetType>> getAllAssetTypes() => select(assetTypes).get();

  Future<List<AssetType>> getAssetTypesByFamily(int? familyId) {
    final q = select(assetTypes);
    if (familyId != null) {
      q.where((t) => t.familyId.equals(familyId).or(t.familyId.isNull()));
    }
    return q.get();
  }

  Future<int> insertAssetType(AssetTypesCompanion entry) {
    return into(assetTypes).insert(entry);
  }

  Future<bool> updateAssetType(int id, AssetTypesCompanion entry) {
    return (update(assetTypes)..where((t) => t.id.equals(id))).write(entry);
  }

  Future<int> deleteAssetType(int id) {
    return (delete(assetTypes)..where((t) => t.id.equals(id))).go();
  }

  Future<int> deleteCustomAssetTypes(int familyId) {
    return (delete(assetTypes)
          ..where((t) => t.familyId.equals(familyId) & t.isCustom.equals(1)))
        .go();
  }

  Future<List<Record>> getAllRecords() => select(records).get();

  Future<List<Record>> getRecordsByFamily(int familyId) {
    return (select(records)..where((t) => t.familyId.equals(familyId)))
        .get();
  }

  Future<List<Record>> getRecordsByMember(int memberId) {
    return (select(records)..where((t) => t.memberId.equals(memberId)))
        .get();
  }

  Future<int> insertRecord(RecordsCompanion entry) {
    return into(records).insert(entry);
  }

  Future<bool> updateRecord(int id, RecordsCompanion entry) {
    return (update(records)..where((t) => t.id.equals(id))).write(entry);
  }

  Future<int> deleteRecord(int id) {
    return (delete(records)..where((t) => t.id.equals(id))).go();
  }

  Future<List<Record>> getPendingSyncRecords() {
    return (select(records)..where((t) => t.syncStatus.equals('synced').not()))
        .get();
  }

  Future<User?> getUserByUsername(String username) {
    return (select(users)..where((t) => t.username.equals(username)))
        .getSingleOrNull();
  }

  Future<int> insertUser(UsersCompanion entry) {
    return into(users).insert(entry);
  }

  Future<void> clearAll() async {
    await delete(records).go();
    await delete(assetTypes).go();
    await delete(members).go();
    await delete(users).go();
    await delete(families).go();
  }
}
