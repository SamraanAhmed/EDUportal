// Migration: Add group_id column to tasks table for multi-course broadcasting
const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.tgncvsremdbdrgkodnit',
  password: 'SimpleLMS!!22',
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Add group_id column to tasks table if not exists
alter table tasks add column if not exists group_id uuid default uuid_generate_v4();

-- Set group_id = id for any existing tasks that don't have it
update tasks set group_id = id where group_id is null;

-- Add index on group_id for fast lookups
create index if not exists idx_tasks_group_id on tasks(group_id);
`;

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected! Running migration for tasks group_id...');
    await client.query(sql);
    console.log('✅ group_id added to tasks table successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
