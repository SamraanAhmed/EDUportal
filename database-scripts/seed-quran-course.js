const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tgncvsremdbdrgkodnit.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmN2c3JlbWRiZHJna29kbml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU2MzM3NiwiZXhwIjoyMTA1MTM5Mzc2fQ.FZwOUWKFTOt6x_ywLPMgoV-CvFoakngRy1b8qO7R1bk';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('📖 Starting Quran Course Seeding...\n');

  // 1. Department: Department of Law
  console.log('1. Setting up Department...');
  let { data: dept } = await admin.from('departments').select('*').eq('name', 'Department of Law').maybeSingle();
  if (!dept) {
    const { data: newDept, error } = await admin.from('departments').insert({ name: 'Department of Law' }).select().single();
    if (error) throw error;
    dept = newDept;
    console.log('   ✅ Created Department:', dept.name);
  } else {
    console.log('   ℹ️ Department already exists:', dept.name);
  }

  // 2. Program: LLB
  console.log('2. Setting up Program...');
  let { data: prog } = await admin.from('programs').select('*').eq('name', 'LLB').eq('department_id', dept.id).maybeSingle();
  if (!prog) {
    const { data: newProg, error } = await admin.from('programs').insert({ name: 'LLB', department_id: dept.id }).select().single();
    if (error) throw error;
    prog = newProg;
    console.log('   ✅ Created Program:', prog.name);
  } else {
    console.log('   ℹ️ Program already exists:', prog.name);
  }

  // 3. Batch: Spring 2026
  console.log('3. Setting up Batch...');
  let { data: batch } = await admin.from('batches').select('*').eq('name', 'Spring 2026').eq('program_id', prog.id).maybeSingle();
  if (!batch) {
    const { data: newBatch, error } = await admin.from('batches').insert({ name: 'Spring 2026', program_id: prog.id }).select().single();
    if (error) throw error;
    batch = newBatch;
    console.log('   ✅ Created Batch:', batch.name);
  } else {
    console.log('   ℹ️ Batch already exists:', batch.name);
  }

  // 4. Teacher Account: Zahoor Ahmed
  console.log('4. Setting up Faculty Account for Zahoor Ahmed...');
  const teacherEmail = 'zahoor.ahmed@dms.iiui.edu.pk';
  const teacherPassword = 'Zahoor@LMS2026';
  const teacherPhone = '03135291256';
  const teacherName = 'Zahoor Ahmed';

  let teacherId = null;
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = users?.find((u) => u.email === teacherEmail);

  if (existingUser) {
    teacherId = existingUser.id;
    console.log('   ℹ️ Auth user already exists:', teacherId);
    await admin.auth.admin.updateUserById(teacherId, { password: teacherPassword });
  } else {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: teacherEmail,
      password: teacherPassword,
      email_confirm: true,
    });
    if (authError) throw authError;
    teacherId = authData.user.id;
    console.log('   ✅ Created Auth user:', teacherId);
  }

  // Profile upsert
  const { error: profileError } = await admin.from('profiles').upsert({
    id: teacherId,
    full_name: teacherName,
    email: teacherEmail,
    phone: teacherPhone,
    role: 'faculty',
    status: 'approved',
  }, { onConflict: 'id' });
  if (profileError) throw profileError;
  console.log('   ✅ Faculty profile verified & approved!');

  // 5. Course: Understanding of the Holy Quran
  console.log('5. Setting up Course...');
  const courseName = 'Understanding of the Holy Quran (LLB-6106)';
  const courseDescription = 'Course Code: LLB-6106 / AI.6606 / RA.6108. Credit Hours: 1(0+1). Textbook: معلم القرآن جلد اول (Volume 1) by Ubaidurrahman Bashir. Instructor: Zahoor Ahmed (Office: Room C Block 3rd Floor). Consultation: Mon 2:00-4:00 PM, Thu 10:30 AM-12:30 PM.';

  let { data: course } = await admin.from('courses').select('*').eq('name', courseName).eq('batch_id', batch.id).maybeSingle();
  if (!course) {
    const { data: newCourse, error: courseError } = await admin.from('courses').insert({
      name: courseName,
      description: courseDescription,
      batch_id: batch.id,
      faculty_id: teacherId,
    }).select().single();
    if (courseError) throw courseError;
    course = newCourse;
    console.log('   ✅ Created Course:', course.name);
  } else {
    // Update faculty and description
    await admin.from('courses').update({
      description: courseDescription,
      faculty_id: teacherId,
    }).eq('id', course.id);
    console.log('   ℹ️ Course already exists, updated instructor assignment:', course.name);
  }

  // 6. Upload attachments to Supabase Storage
  console.log('6. Uploading Course Materials & Task Files to Storage...');
  const publicDir = path.join(__dirname, '..', 'public');
  const materialsDir = path.join(publicDir, 'understanding of holy quran 1 16 week lasson quiz assaingmnt ppts');

  async function uploadFileToStorage(localPath, remotePath) {
    if (!fs.existsSync(localPath)) return null;
    const fileBuffer = fs.readFileSync(localPath);
    const { data, error } = await admin.storage.from('task-files').upload(remotePath, fileBuffer, {
      upsert: true,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    if (error) {
      console.warn('   ⚠️ Storage upload note:', error.message);
    }
    const { data: urlData } = admin.storage.from('task-files').getPublicUrl(remotePath);
    return urlData.publicUrl;
  }

  const quiz1Url = await uploadFileToStorage(
    path.join(materialsDir, 'Quiz_01.docx'),
    `${course.id}/Quiz_01.docx`
  );
  const quiz2Url = await uploadFileToStorage(
    path.join(materialsDir, 'Quiz_02.docx'),
    `${course.id}/Quiz_02.docx`
  );
  const assign1Url = await uploadFileToStorage(
    path.join(materialsDir, 'Assignment_01.docx'),
    `${course.id}/Assignment_01.docx`
  );
  const outlineUrl = await uploadFileToStorage(
    path.join(publicDir, 'Course_Outline_Understanding_Quran.docx'),
    `${course.id}/Course_Outline_Understanding_Quran.docx`
  );

  console.log('   ✅ Files uploaded to task-files bucket!');

  // 7. Seed the 5 Evaluation Tasks
  console.log('7. Creating Evaluation Tasks matching the 60/40 Number Distribution...');
  const tasksToSeed = [
    {
      title: 'Quiz 1 (Before Mid) - Units 1 & 2',
      type: 'quiz_pre_mid',
      max_marks: 5,
      description: 'Covers Quranic vocabulary and fundamental grammatical rules from Units 1 & 2. Please download the attached quiz paper and review before the session.',
      file_url: quiz1Url,
      due_date: '2026-04-15',
    },
    {
      title: 'Quiz 2 (After Mid) - Grammatical Rules & Pronouns',
      type: 'quiz_post_mid',
      max_marks: 5,
      description: 'Covers demonstration pronouns (هٰذَا، ذٰلِكَ، هٰذِهِ، تِلْكَ) and possessive lam (لامِ ملکیت).',
      file_url: quiz2Url,
      due_date: '2026-05-20',
    },
    {
      title: 'Assignment 1 - Translation & Grammatical Analysis',
      type: 'assignment',
      max_marks: 10,
      description: 'Word-for-word and fluent translation of designated Quranic passages, highlighting target grammatical rules as discussed in class.',
      file_url: assign1Url,
      due_date: '2026-05-01',
    },
    {
      title: 'Workbook Fill-up - معلم القرآن جلد اول',
      type: 'workbook',
      max_marks: 30,
      description: 'Completion of all unit exercises and vocabulary fill-ups from chapters 1 through 18 in textbook معلم القرآن جلد اول (Volume 1). Students must submit their completed workbook for evaluation.',
      file_url: outlineUrl,
      due_date: '2026-06-05',
    },
    {
      title: 'Class Activity, Translation Drills & Attendance',
      type: 'activity',
      max_marks: 10,
      description: 'Weekly in-class identification of Quranic words, short phrase translation from Arabic to Urdu and Urdu to Arabic, and active classroom attendance.',
      file_url: null,
      due_date: '2026-06-10',
    },
  ];

  for (const t of tasksToSeed) {
    const { data: existingTask } = await admin
      .from('tasks')
      .select('id')
      .eq('course_id', course.id)
      .eq('title', t.title)
      .maybeSingle();

    if (!existingTask) {
      await admin.from('tasks').insert({
        course_id: course.id,
        title: t.title,
        type: t.type,
        max_marks: t.max_marks,
        description: t.description,
        file_url: t.file_url,
        due_date: t.due_date,
        created_by: teacherId,
      });
      console.log(`   ✅ Created Task: ${t.title} [${t.max_marks} Marks]`);
    } else {
      console.log(`   ℹ️ Task already exists: ${t.title}`);
    }
  }

  console.log('\n🎉 Successfully seeded Course, Faculty, and Number Distribution Tasks!');
  console.log('\n📋 Faculty Login Credentials:');
  console.log(`   Email:    ${teacherEmail}`);
  console.log(`   Password: ${teacherPassword}`);
  console.log(`   Course:   ${courseName}`);
  console.log(`   Batch:    ${batch.name} (${prog.name})`);
}

main().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
