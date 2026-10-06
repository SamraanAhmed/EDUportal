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

  const groupId = crypto.randomUUID()
  const { error } = await admin.from('tasks').insert({
    group_id: groupId,
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
  revalidatePath('/faculty/tasks')
  return { success: true }
}

export async function createBroadcastTask(formData: FormData) {
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
  const course_ids = formData.getAll('course_ids') as string[]

  if (!title?.trim()) return { error: 'Task title is required' }
  if (!course_ids || course_ids.length === 0) {
    return { error: 'Please select at least one course to assign this evaluation item to' }
  }

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
      .upload(`broadcast/${fileName}`, file)

    if (uploadError) return { error: uploadError.message }

    const { data: urlData } = admin.storage
      .from('task-files')
      .getPublicUrl(uploadData.path)

    file_url = urlData.publicUrl
  }

  const groupId = crypto.randomUUID()
  const taskRows = course_ids.map((cId) => ({
    group_id: groupId,
    title: title.trim(),
    type,
    description: description || null,
    course_id: cId,
    due_date: due_date || null,
    file_url,
    max_marks: isNaN(max_marks) ? defaultMarks : max_marks,
    created_by: user.id,
  }))

  const { error } = await admin.from('tasks').insert(taskRows)
  if (error) return { error: error.message }

  revalidatePath('/faculty/tasks')
  revalidatePath('/faculty', 'layout')
  revalidatePath('/student', 'layout')
  return { success: true }
}

export async function updateBroadcastTask(groupId: string, formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const due_date = formData.get('due_date') as string
  const rawMarks = formData.get('max_marks') as string
  const course_ids = formData.getAll('course_ids') as string[]

  if (!title?.trim()) return { error: 'Task title is required' }
  if (!course_ids || course_ids.length === 0) {
    return { error: 'Please select at least one course' }
  }

  let defaultMarks = 10
  if (type === 'workbook') defaultMarks = 30
  else if (type === 'quiz_pre_mid' || type === 'quiz_post_mid' || type === 'quiz') defaultMarks = 5
  else if (type === 'assignment' || type === 'activity') defaultMarks = 10

  const max_marks = rawMarks ? parseInt(rawMarks, 10) : defaultMarks

  // 1. Update existing tasks for this group
  const updatePayload: Record<string, any> = {
    title: title.trim(),
    type,
    description: description || null,
    due_date: due_date || null,
    max_marks: isNaN(max_marks) ? defaultMarks : max_marks,
  }

  await admin.from('tasks').update(updatePayload).eq('group_id', groupId)

  // 2. Sync course assignments
  const { data: existingTasks } = await admin
    .from('tasks')
    .select('id, course_id, file_url')
    .eq('group_id', groupId)

  const existingCourseIds = (existingTasks ?? []).map((t) => t.course_id)
  const existingFileUrl = existingTasks?.[0]?.file_url ?? null

  // Remove tasks for unselected courses
  const coursesToRemove = existingCourseIds.filter((id) => !course_ids.includes(id))
  if (coursesToRemove.length > 0) {
    await admin
      .from('tasks')
      .delete()
      .eq('group_id', groupId)
      .in('course_id', coursesToRemove)
  }

  // Add tasks for newly selected courses
  const coursesToAdd = course_ids.filter((id) => !existingCourseIds.includes(id))
  if (coursesToAdd.length > 0) {
    const newRows = coursesToAdd.map((cId) => ({
      group_id: groupId,
      title: title.trim(),
      type,
      description: description || null,
      course_id: cId,
      due_date: due_date || null,
      file_url: existingFileUrl,
      max_marks: isNaN(max_marks) ? defaultMarks : max_marks,
      created_by: user.id,
    }))
    await admin.from('tasks').insert(newRows)
  }

  revalidatePath('/faculty/tasks')
  revalidatePath('/faculty', 'layout')
  revalidatePath('/student', 'layout')
  return { success: true }
}

export async function deleteBroadcastTask(groupId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('tasks').delete().eq('group_id', groupId)
  if (error) return { error: error.message }

  revalidatePath('/faculty/tasks')
  revalidatePath('/faculty', 'layout')
  revalidatePath('/student', 'layout')
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

// ─── VIDEO LECTURES ──────────────────────────────────────────
export async function createVideoLecture(
  arg1: FormData | string,
  arg2?: FormData | string
) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  let formData: FormData
  let optionalCourseId: string | undefined

  if (arg1 instanceof FormData) {
    formData = arg1
    optionalCourseId = typeof arg2 === 'string' ? arg2 : undefined
  } else {
    optionalCourseId = arg1
    formData = arg2 as FormData
  }

  const title = formData.get('title') as string
  const youtube_url = formData.get('youtube_url') as string
  
  // Collect course IDs: from multiple formData entries or fallback param
  let selectedCourseIds = formData.getAll('course_ids') as string[]
  if (selectedCourseIds.length === 0 && optionalCourseId) {
    selectedCourseIds = [optionalCourseId]
  }

  if (!title?.trim() || !youtube_url?.trim()) {
    return { error: 'Title and YouTube URL are required' }
  }

  if (selectedCourseIds.length === 0) {
    return { error: 'Please select at least one course to assign this video to' }
  }

  // Insert lecture
  const { data: lecture, error: lectureError } = await admin
    .from('video_lectures')
    .insert({
      title: title.trim(),
      youtube_url: youtube_url.trim(),
      course_id: selectedCourseIds[0] || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (lectureError) return { error: lectureError.message }

  // Insert links to selected courses
  const links = selectedCourseIds.map((cId) => ({
    video_lecture_id: lecture.id,
    course_id: cId,
  }))

  const { error: linkError } = await admin
    .from('video_lecture_courses')
    .upsert(links, { onConflict: 'video_lecture_id,course_id' })

  if (linkError) return { error: linkError.message }

  revalidatePath('/faculty/lectures')
  revalidatePath('/faculty', 'layout')
  revalidatePath('/student', 'layout')
  return { success: true }
}

export async function updateVideoLecture(
  id: string,
  arg2: FormData | string,
  arg3?: FormData | string
) {
  const admin = createAdminClient()

  let formData: FormData
  let optionalCourseId: string | undefined

  if (arg2 instanceof FormData) {
    formData = arg2
    optionalCourseId = typeof arg3 === 'string' ? arg3 : undefined
  } else {
    optionalCourseId = arg2
    formData = arg3 as FormData
  }

  const title = formData.get('title') as string
  const youtube_url = formData.get('youtube_url') as string
  let selectedCourseIds = formData.getAll('course_ids') as string[]
  if (selectedCourseIds.length === 0 && optionalCourseId) {
    selectedCourseIds = [optionalCourseId]
  }

  if (!title?.trim() || !youtube_url?.trim()) {
    return { error: 'Title and YouTube URL are required' }
  }

  const { error: updateError } = await admin
    .from('video_lectures')
    .update({
      title: title.trim(),
      youtube_url: youtube_url.trim(),
    })
    .eq('id', id)

  if (updateError) return { error: updateError.message }

  // If course selection was provided, sync video_lecture_courses
  if (selectedCourseIds.length > 0) {
    await admin.from('video_lecture_courses').delete().eq('video_lecture_id', id)
    const links = selectedCourseIds.map((cId) => ({
      video_lecture_id: id,
      course_id: cId,
    }))
    const { error: linkError } = await admin
      .from('video_lecture_courses')
      .upsert(links, { onConflict: 'video_lecture_id,course_id' })
    if (linkError) return { error: linkError.message }
  }

  revalidatePath('/faculty/lectures')
  revalidatePath('/faculty', 'layout')
  revalidatePath('/student', 'layout')
  return { success: true }
}

export async function deleteVideoLecture(id: string, courseId?: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('video_lectures').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/faculty/lectures')
  revalidatePath('/faculty', 'layout')
  revalidatePath('/student', 'layout')
  return { success: true }
}
