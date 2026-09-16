// Just grants
const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.tgncvsremdbdrgkodnit',
  password: 'SimpleLMS!!22',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query(`
    grant usage on schema public to anon, authenticated, service_role;
    grant all on all tables in schema public to anon, authenticated, service_role;
    grant all on all sequences in schema public to anon, authenticated, service_role;
    grant all on all functions in schema public to anon, authenticated, service_role;
  `);
  console.log('✅ Grants applied!');
  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
