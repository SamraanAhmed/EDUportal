'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitTask(taskId: string, courseId: string, formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check for link submission first
  const linkInput = (
    formData.get('submission_url') ||
    formData.get('link') ||
    formData.get('url')
  ) as string | null

  const file = formData.get('file') as File | null

  let file_url: string | null = null

  if (linkInput && linkInput.trim().length > 0) {
    let cleanUrl = linkInput.trim()
    // Prepend https:// if protocol is omitted
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`
    }
    try {
      new URL(cleanUrl)
    } catch {
      return { error: 'Please enter a valid URL (e.g. https://drive.google.com/...)' }
    }
    file_url = cleanUrl
  } else if (file && file.size > 0) {
    // Backward compatibility for file uploads if provided
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await admin.storage
      .from('submissions')
      .upload(`${taskId}/${user.id}/${fileName}`, file)

    if (uploadError) return { error: uploadError.message }

    const { data: urlData } = admin.storage
      .from('submissions')
      .getPublicUrl(uploadData.path)

    file_url = urlData.publicUrl
  }

  if (!file_url) {
    return { error: 'Please provide a valid Google Drive or submission link' }
  }

  // Upsert submission
  const { error } = await admin.from('submissions').upsert({
    task_id: taskId,
    student_id: user.id,
    file_url,
    submitted_at: new Date().toISOString(),
  }, { onConflict: 'task_id,student_id' })

  if (error) return { error: error.message }
  revalidatePath(`/student/courses/${courseId}`)
  revalidatePath(`/student/courses/${courseId}/tasks/${taskId}`)
  revalidatePath(`/faculty/courses/${courseId}/tasks/${taskId}/submissions`)
  return { success: true }
}
