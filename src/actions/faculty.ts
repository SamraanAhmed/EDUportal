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

  const { error } = await admin.from('tasks').update({
    title,
    type,
    description: description || null,
    due_date: due_date || null,
  }).eq('id', taskId)

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

  const score = parseInt(formData.get('score') as string)
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
