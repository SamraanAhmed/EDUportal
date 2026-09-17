const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tgncvsremdbdrgkodnit.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmN2c3JlbWRiZHJna29kbml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU2MzM3NiwiZXhwIjoyMTA1MTM5Mzc2fQ.FZwOUWKFTOt6x_ywLPMgoV-CvFoakngRy1b8qO7R1bk';

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.tgncvsremdbdrgkodnit',
  password: 'SimpleLMS!!22',
  ssl: { rejectUnauthorized: false }
});

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const driveLink = 'https://drive.google.com/drive/folders/1QSRQ8E1Ss_UN1mhupBSEhwYN5xCKYeGV?usp=sharing';

async function run() {
  console.log('Adding resource_url to courses table...');
  await client.connect();
  await client.query(`
    alter table courses add column if not exists resource_url text;
  `);
  await client.end();
  console.log('✅ Column added to courses table!');

  console.log('Setting Drive link for Understanding of the Holy Quran...');
  const { error } = await admin
    .from('courses')
    .update({ resource_url: driveLink })
    .ilike('name', '%Understanding of the Holy Quran%');

  if (error) throw error;
  console.log('✅ Drive link successfully linked to the Quran course!');
}

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
