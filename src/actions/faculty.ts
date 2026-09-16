'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ─── TASKS ──────────────────────────────────────────────────
export async function createTask(courseId: string, formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const due_date = formData.get('due_date') as string
  const file = formData.get('file') as File
  const rawMarks = formData.get('max_marks') as string

  // Default max marks by category if not explicitly given
  let defaultMarks = 10
  if (type === 'workbook') defaultMarks = 30
  else if (type === 'quiz_pre_mid' || type === 'quiz_post_mid' || type === 'quiz') defaultMarks = 5
  else if (type === 'assignment' || type === 'activity') defaultMarks = 10

  const max_marks = rawMarks ? parseInt(rawMarks, 10) : defaultMarks

  let file_url: string | null = null

  if (file && file.size > 0) {
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await admin.storage
      .from('task-files')
      .upload(`${courseId}/${fileName}`, file)

    if (uploadError) return { error: uploadError.message }

    const { data: urlData } = admin.storage
      .from('task-files')
      .getPublicUrl(uploadData.path)

    file_url = urlData.publicUrl
  }

  const { error } = await admin.from('tasks').insert({
    title,
    type,
    description: description || null,
    course_id: courseId,
    due_date: due_date || null,
    file_url,
    max_marks: isNaN(max_marks) ? defaultMarks : max_marks,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath(`/faculty/courses/${courseId}`)
  return { success: true }
}

export async function updateTask(taskId: string, courseId: string, formData: FormData) {
  const admin = createAdminClient()

  const title = formData.get('title') as string
  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const due_date = formData.get('due_date') as string
  const rawMarks = formData.get('max_marks') as string

  const updatePayload: Record<string, any> = {
    title,
    type,
    description: description || null,
    due_date: due_date || null,
  }

  if (rawMarks) {
    const marks = parseInt(rawMarks, 10)
    if (!isNaN(marks) && marks > 0) {
      updatePayload.max_marks = marks
    }
  }

  const { error } = await admin.from('tasks').update(updatePayload).eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath(`/faculty/courses/${courseId}`)
  return { success: true }
}

export async function deleteTask(taskId: string, courseId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('tasks').delete().eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath(`/faculty/courses/${courseId}`)
  return { success: true }
}

// ─── SUBMISSIONS (grading) ───────────────────────────────────
export async function gradeSubmission(
  submissionId: string,
  courseId: string,
  formData: FormData
) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const score = parseInt(formData.get('score') as string, 10)
  const feedback = formData.get('feedback') as string

  const { error } = await admin.from('submissions').update({
    score,
    feedback: feedback || null,
    graded_at: new Date().toISOString(),
    graded_by: user.id,
  }).eq('id', submissionId)

  if (error) return { error: error.message }
  revalidatePath(`/faculty/courses/${courseId}`)
  return { success: true }
}

// ─── VIVA EVALUATIONS (Max 40 marks) ──────────────────────────
export async function gradeViva(courseId: string, studentId: string, formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const scoreStr = formData.get('viva_score') as string
  const feedback = formData.get('feedback') as string
  const viva_score = parseInt(scoreStr, 10)

  if (isNaN(viva_score) || viva_score < 0 || viva_score > 40) {
    return { error: 'Viva score must be between 0 and 40' }
  }

  const { error } = await admin.from('viva_evaluations').upsert({
    course_id: courseId,
    student_id: studentId,
    viva_score,
    feedback: feedback || null,
    graded_by: user.id,
    graded_at: new Date().toISOString(),
  }, { onConflict: 'course_id,student_id' })

  if (error) return { error: error.message }
  revalidatePath(`/faculty/courses/${courseId}`)
  return { success: true }
}
