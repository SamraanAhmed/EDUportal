// Migration: Add video_lecture_courses junction table and make course_id nullable
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
-- Make course_id nullable in video_lectures
alter table video_lectures alter column course_id drop not null;

-- Create many-to-many junction table
create table if not exists video_lecture_courses (
  video_lecture_id uuid not null references video_lectures(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (video_lecture_id, course_id)
);

-- Copy any existing video-course links
insert into video_lecture_courses (video_lecture_id, course_id)
select id, course_id from video_lectures
where course_id is not null
on conflict do nothing;

-- RLS
alter table video_lecture_courses enable row level security;

do $$ begin
  drop policy if exists "auth_read_video_lecture_courses" on video_lecture_courses;
  drop policy if exists "auth_manage_video_lecture_courses" on video_lecture_courses;
exception when others then null;
end $$;

create policy "auth_read_video_lecture_courses"
  on video_lecture_courses for select to authenticated using (true);

create policy "auth_manage_video_lecture_courses"
  on video_lecture_courses for all to authenticated using (true) with check (true);

grant all on video_lecture_courses to anon, authenticated, service_role;
`;

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected! Running migration for video_lecture_courses...');
    await client.query(sql);
    console.log('✅ video_lecture_courses table created and RLS configured successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
