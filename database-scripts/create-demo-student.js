const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tgncvsremdbdrgkodnit.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmN2c3JlbWRiZHJna29kbml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU2MzM3NiwiZXhwIjoyMTA1MTM5Mzc2fQ.FZwOUWKFTOt6x_ywLPMgoV-CvFoakngRy1b8qO7R1bk';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🎓 Creating Demo Student Account...\n');

  // 1. Fetch the LLB Program and Spring 2026 Batch
  const { data: prog } = await admin.from('programs').select('id, name').eq('name', 'LLB').single();
  if (!prog) throw new Error('LLB program not found');

  const { data: batch } = await admin.from('batches').select('id, name').eq('name', 'Spring 2026').eq('program_id', prog.id).single();
  if (!batch) throw new Error('Spring 2026 batch not found');

  const studentEmail = 'student@eduportal.com';
  const studentPassword = 'Student@LMS2026';
  const studentName = 'Ali Khan (Demo Student)';
  const studentPhone = '+92 300 9876543';

  let studentId = null;
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = users?.find((u) => u.email === studentEmail);

  if (existingUser) {
    studentId = existingUser.id;
    console.log('   ℹ️ User already exists, resetting password and profile...');
    await admin.auth.admin.updateUserById(studentId, { password: studentPassword });
  } else {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: studentEmail,
      password: studentPassword,
      email_confirm: true,
    });
    if (authError) throw authError;
    studentId = authData.user.id;
    console.log('   ✅ Created Auth User:', studentId);
  }

  // 2. Upsert profile with LLB and Spring 2026 batch
  const { error: profileError } = await admin.from('profiles').upsert({
    id: studentId,
    full_name: studentName,
    email: studentEmail,
    phone: studentPhone,
    role: 'student',
    status: 'approved',
    program_id: prog.id,
    batch_id: batch.id,
  }, { onConflict: 'id' });

  if (profileError) throw profileError;
  console.log('   ✅ Student profile linked to LLB Program & Spring 2026 Batch!');

  console.log('\n🎉 Demo Student Account Ready!');
  console.log('====================================');
  console.log(`Email:    ${studentEmail}`);
  console.log(`Password: ${studentPassword}`);
  console.log(`Program:  ${prog.name}`);
  console.log(`Batch:    ${batch.name}`);
  console.log('====================================');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
