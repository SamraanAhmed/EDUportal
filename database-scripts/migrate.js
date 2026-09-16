// Database migration script for LMS Portal
const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.tgncvsremdbdrgkodnit',
  password: 'SimpleLMS!!22',
  ssl: { rejectUnauthorized: false }
});

const schema = `
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── DEPARTMENTS ────────────────────────────────────────────
create table if not exists departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);

-- ─── PROGRAMS ───────────────────────────────────────────────
create table if not exists programs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  department_id uuid not null references departments(id) on delete cascade,
  created_at timestamptz default now(),
  unique(name, department_id)
);

-- ─── BATCHES (program-specific) ─────────────────────────────
create table if not exists batches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  program_id uuid not null references programs(id) on delete cascade,
  created_at timestamptz default now(),
  unique(name, program_id)
);

-- ─── PROFILES (extends auth.users) ──────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role text not null check (role in ('superadmin', 'faculty', 'student')),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  program_id uuid references programs(id),
  batch_id uuid references batches(id),
  created_at timestamptz default now()
);

-- ─── COURSES ────────────────────────────────────────────────
create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  batch_id uuid not null references batches(id) on delete cascade,
  faculty_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ─── TASKS ──────────────────────────────────────────────────
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  type text not null check (type in ('assignment', 'quiz', 'activity')),
  description text,
  course_id uuid not null references courses(id) on delete cascade,
  due_date timestamptz,
  file_url text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ─── SUBMISSIONS ─────────────────────────────────────────────
create table if not exists submissions (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  student_id uuid not null references profiles(id),
  file_url text,
  submitted_at timestamptz default now(),
  score integer check (score >= 0 and score <= 100),
  feedback text,
  graded_at timestamptz,
  graded_by uuid references profiles(id),
  unique(task_id, student_id)
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
alter table departments enable row level security;
alter table programs enable row level security;
alter table batches enable row level security;
alter table profiles enable row level security;
alter table courses enable row level security;
alter table tasks enable row level security;
alter table submissions enable row level security;

-- Drop existing policies if any (safe re-run)
do $$ begin
  drop policy if exists "auth_read_departments" on departments;
  drop policy if exists "auth_read_programs" on programs;
  drop policy if exists "auth_read_batches" on batches;
  drop policy if exists "auth_read_courses" on courses;
  drop policy if exists "auth_read_tasks" on tasks;
  drop policy if exists "auth_read_profiles" on profiles;
  drop policy if exists "auth_read_submissions" on submissions;
  drop policy if exists "own_profile_insert" on profiles;
  drop policy if exists "own_profile_update" on profiles;
  drop policy if exists "student_submission_insert" on submissions;
  drop policy if exists "student_submission_update" on submissions;
exception when others then null;
end $$;

-- Read policies (all authenticated users)
create policy "auth_read_departments" on departments for select to authenticated using (true);
create policy "auth_read_programs" on programs for select to authenticated using (true);
create policy "auth_read_batches" on batches for select to authenticated using (true);
create policy "auth_read_courses" on courses for select to authenticated using (true);
create policy "auth_read_tasks" on tasks for select to authenticated using (true);
create policy "auth_read_profiles" on profiles for select to authenticated using (true);
create policy "auth_read_submissions" on submissions for select to authenticated using (true);

-- Profiles: own insert/update
create policy "own_profile_insert" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "own_profile_update" on profiles for update to authenticated using (auth.uid() = id);

-- Submissions: students manage own
create policy "student_submission_insert" on submissions for insert to authenticated with check (auth.uid() = student_id);
create policy "student_submission_update" on submissions for update to authenticated using (auth.uid() = student_id);

-- Tasks: faculty manage (all authenticated for now, role checked in app layer)
create policy "auth_manage_tasks" on tasks for all to authenticated using (true) with check (true);

-- ─── GRANTS ──────────────────────────────────────────────────
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
`;

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected! Running migrations...');
    await client.query(schema);
    console.log('✅ Schema created successfully!');
    console.log('Tables created: departments, programs, batches, profiles, courses, tasks, submissions');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
