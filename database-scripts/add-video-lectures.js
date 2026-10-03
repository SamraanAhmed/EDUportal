// Migration: Add video_lectures table
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
-- ─── VIDEO LECTURES ──────────────────────────────────────────
create table if not exists video_lectures (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  youtube_url text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- RLS
alter table video_lectures enable row level security;

-- Drop existing policies if any (safe re-run)
do $$ begin
  drop policy if exists "auth_read_video_lectures" on video_lectures;
  drop policy if exists "auth_manage_video_lectures" on video_lectures;
exception when others then null;
end $$;

-- All authenticated users can read
create policy "auth_read_video_lectures"
  on video_lectures for select to authenticated using (true);

-- All authenticated users can insert/update/delete (role checked at app layer)
create policy "auth_manage_video_lectures"
  on video_lectures for all to authenticated using (true) with check (true);

-- Grants
grant all on video_lectures to anon, authenticated, service_role;
`;

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected! Running migration...');
    await client.query(sql);
    console.log('✅ video_lectures table created successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
