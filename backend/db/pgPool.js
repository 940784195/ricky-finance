const path = require('path');
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', '..', envFile) });

const { Pool } = require('pg');

const isLocal = (process.env.SUPABASE_DB_HOST || 'localhost') === 'localhost';

const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST || 'localhost',
  port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

pool.on('error', (err) => {
  console.error('[PG Pool] 意外的连接池错误:', err.message);
});

async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    console.warn(`[PG] 慢查询 (${duration}ms): ${text.substring(0, 80)}...`);
  }
  return result;
}

async function getClient() {
  return pool.connect();
}

async function closePool() {
  await pool.end();
}

module.exports = { pool, query, getClient, closePool };
