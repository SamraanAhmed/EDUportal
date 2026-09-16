'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitTask(taskId: string, courseId: string, formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File

  let file_url: string | null = null

  if (file && file.size > 0) {
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

  // Upsert submission
  const { error } = await admin.from('submissions').upsert({
    task_id: taskId,
    student_id: user.id,
    file_url,
    submitted_at: new Date().toISOString(),
  }, { onConflict: 'task_id,student_id' })

  if (error) return { error: error.message }
  revalidatePath(`/student/courses/${courseId}`)
  return { success: true }
}
