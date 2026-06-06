import 'package:drift/drift.dart';

class Members extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get familyId => integer().named('family_id')();
  TextColumn get name => text()();
  TextColumn get shortName => text().named('short_name').nullable()();
  TextColumn get role => text().withDefault(const Constant('member'))();
  DateTimeColumn get createdAt => dateTime().named('created_at').withDefault(currentDateAndTime)();
}

class AssetTypes extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get typeValue => text().named('type_value')();
  TextColumn get displayName => text().named('display_name')();
  TextColumn get color => text().withDefault(const Constant('#6B7280'))();
  IntColumn get isCustom => integer().named('is_custom').withDefault(const Constant(0))();
  IntColumn get familyId => integer().named('family_id').nullable()();
}

class Records extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get memberId => integer().named('member_id')();
  IntColumn get familyId => integer().named('family_id')();
  TextColumn get type => text()();
  TextColumn get name => text()();
  RealColumn get value => real()();
  RealColumn get previousValue => real().named('previous_value').nullable()();
  TextColumn get date => text()();
  TextColumn get status => text().withDefault(const Constant('valid'))();
  TextColumn get note => text().nullable()();
  TextColumn get syncStatus => text().named('sync_status').withDefault(const Constant('synced'))();
  DateTimeColumn get localUpdatedAt => dateTime().named('local_updated_at').withDefault(currentDateAndTime)();
  DateTimeColumn get serverUpdatedAt => dateTime().named('server_updated_at').nullable()();
  DateTimeColumn get createdAt => dateTime().named('created_at').withDefault(currentDateAndTime)();
}

class Users extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get username => text()();
  TextColumn get passwordHash => text().named('password_hash')();
  TextColumn get role => text().withDefault(const Constant('member'))();
  IntColumn get memberId => integer().named('member_id').nullable()();
  IntColumn get familyId => integer().named('family_id').nullable()();
}

class Families extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get familyName => text().named('family_name')();
  IntColumn get headId => integer().named('head_id').nullable()();
  DateTimeColumn get createdAt => dateTime().named('created_at').withDefault(currentDateAndTime)();
}
