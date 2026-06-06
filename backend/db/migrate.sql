-- ============================================
-- Ricky Finance - PostgreSQL 迁移脚本
-- 从 SQLite 迁移至 PostgreSQL (Supabase)
-- ============================================

-- 家庭表
CREATE TABLE IF NOT EXISTS families (
    id SERIAL PRIMARY KEY,
    family_name TEXT NOT NULL,
    head_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 成员表
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_name TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('head', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 添加 families.head_id 外键（依赖 members 表）
ALTER TABLE families
    ADD CONSTRAINT fk_families_head
    FOREIGN KEY (head_id) REFERENCES members(id) ON DELETE SET NULL;

-- 资产类型表
CREATE TABLE IF NOT EXISTS asset_types (
    id SERIAL PRIMARY KEY,
    type_value TEXT NOT NULL,
    display_name TEXT NOT NULL,
    color TEXT NOT NULL,
    is_custom INTEGER DEFAULT 0,
    family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(type_value, family_id)
);

-- 资产记录表
CREATE TABLE IF NOT EXISTS records (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    value REAL NOT NULL CHECK(value >= 0),
    previous_value REAL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'valid' CHECK(status IN ('valid', 'pending', 'archived')),
    note TEXT,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK(sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete')),
    local_updated_at TIMESTAMPTZ,
    server_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'head', 'member')),
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_records_member_family ON records(member_id, family_id);
CREATE INDEX IF NOT EXISTS idx_records_type_date ON records(type, date DESC);
CREATE INDEX IF NOT EXISTS idx_records_name_date ON records(name, date DESC);
CREATE INDEX IF NOT EXISTS idx_records_family_date ON records(family_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_records_sync_status ON records(sync_status);
CREATE INDEX IF NOT EXISTS idx_members_family_role ON members(family_id, role);
CREATE INDEX IF NOT EXISTS idx_asset_types_family ON asset_types(family_id, type_value);
