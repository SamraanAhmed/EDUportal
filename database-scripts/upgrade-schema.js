const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.tgncvsremdbdrgkodnit',
  password: 'SimpleLMS!!22',
  ssl: { rejectUnauthorized: false }
});

const upgradeSql = `
-- 1. Add max_marks to tasks
alter table tasks add column if not exists max_marks integer default 10 check (max_marks > 0);

-- 2. Relax or update tasks type check constraint
do $$ begin
  alter table tasks drop constraint if exists tasks_type_check;
exception when others then null;
end $$;

alter table tasks add constraint tasks_type_check 
  check (type in ('quiz_pre_mid', 'quiz_post_mid', 'assignment', 'workbook', 'activity', 'quiz'));

-- 3. Create viva_evaluations table
create table if not exists viva_evaluations (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  viva_score integer check (viva_score >= 0 and viva_score <= 40),
  feedback text,
  graded_by uuid references profiles(id),
  graded_at timestamptz default now(),
  unique(course_id, student_id)
);

-- 4. Enable RLS and set policies
alter table viva_evaluations enable row level security;

do $$ begin
  drop policy if exists "auth_read_viva" on viva_evaluations;
  drop policy if exists "auth_manage_viva" on viva_evaluations;
exception when others then null;
end $$;

create policy "auth_read_viva" on viva_evaluations for select to authenticated using (true);
create policy "auth_manage_viva" on viva_evaluations for all to authenticated using (true) with check (true);

-- 5. Grants
grant all on table viva_evaluations to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
`;

async function run() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Running evaluation schema upgrade...');
    await client.query(upgradeSql);
    console.log('✅ Database upgraded successfully for number distribution & viva evaluations!');
  } catch (err) {
    console.error('❌ Upgrade error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
