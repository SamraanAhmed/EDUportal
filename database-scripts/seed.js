// Seed script: creates super admin account + Supabase Storage buckets
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://tgncvsremdbdrgkodnit.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmN2c3JlbWRiZHJna29kbml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU2MzM3NiwiZXhwIjoyMTA1MTM5Mzc2fQ.FZwOUWKFTOt6x_ywLPMgoV-CvFoakngRy1b8qO7R1bk'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seed() {
  console.log('🌱 Seeding LMS Portal...\n')

  const email = 'admin@eduportal.com'
  const password = 'Admin@LMS2024'

  // ── 1. Find or create the auth user ─────────────────────────
  console.log('Setting up super admin...')
  let userId = null

  // Try to list existing users and find by email
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = users?.find(u => u.email === email)

  if (existing) {
    userId = existing.id
    console.log('  Auth user found:', userId)
  } else {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) { console.error('❌ Auth error:', authError.message); process.exit(1) }
    userId = authData.user.id
    console.log('  Auth user created:', userId)
  }

  // ── 2. Upsert the profile ────────────────────────────────────
  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    full_name: 'Super Admin',
    email,
    role: 'superadmin',
    status: 'approved',
  }, { onConflict: 'id' })

  if (profileError) {
    console.error('❌ Profile error:', profileError.message)
    process.exit(1)
  }
  console.log('✅ Super admin profile ready!')

  // ── 3. Create Storage Buckets ───────────────────────────────
  console.log('\nSetting up storage buckets...')
  for (const bucket of [{ name: 'task-files', public: true }, { name: 'submissions', public: true }]) {
    const { error } = await admin.storage.createBucket(bucket.name, { public: true, fileSizeLimit: 52428800 })
    if (error && !error.message.includes('already exists')) {
      console.error(`❌ Bucket error (${bucket.name}):`, error.message)
    } else {
      console.log(`✅ Bucket '${bucket.name}' ready`)
    }
  }

  console.log('\n✨ All done!')
  console.log('\n📋 Super Admin Login:')
  console.log(`   Email:    ${email}`)
  console.log(`   Password: ${password}`)
  console.log('\n⚠️  Change the password after first login!')
}

seed().catch(console.error)
