import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EvaluationItemsClient, type FacultyBroadcastTaskItem } from './client'
import type { TaskType } from '@/lib/types'

export default async function EvaluationItemsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // 1. Fetch all courses assigned to this faculty member
  const { data: courses } = await admin
    .from('courses')
    .select('*, batches(name, programs(name, departments(name)))')
    .eq('faculty_id', user.id)
    .order('name', { ascending: true })

  const facultyCourses = courses ?? []
  const courseIds = facultyCourses.map((c) => c.id)

  // 2. Fetch all tasks created by this faculty or belonging to their courses
  let tasksQuery = admin
    .from('tasks')
    .select('*, courses(id, name, batches(name, programs(name)))')
    .order('created_at', { ascending: false })

  const { data: rawTasks } = await tasksQuery

  // Filter tasks that belong to this faculty or are part of their courses
  const filteredTasks = (rawTasks ?? []).filter((t: any) => {
    if (t.created_by === user.id) return true
    return courseIds.includes(t.course_id)
  })

  // Group tasks by group_id (fallback to task.id if group_id is null)
  const taskGroupMap = new Map<string, FacultyBroadcastTaskItem>()

  for (const t of filteredTasks) {
    const key = t.group_id || t.id
    const c = t.courses
    const batch = c?.batches
    const courseObj = c
      ? {
          id: c.id,
          name: c.name,
          batchName: batch?.name,
          programName: batch?.programs?.name,
        }
      : null

    if (!taskGroupMap.has(key)) {
      taskGroupMap.set(key, {
        groupId: key,
        title: t.title,
        type: t.type as TaskType,
        description: t.description,
        due_date: t.due_date,
        file_url: t.file_url,
        max_marks: t.max_marks,
        created_at: t.created_at,
        assignedCourseIds: [t.course_id],
        assignedCourses: courseObj ? [courseObj] : [],
      })
    } else {
      const existing = taskGroupMap.get(key)!
      if (!existing.assignedCourseIds.includes(t.course_id)) {
        existing.assignedCourseIds.push(t.course_id)
      }
      if (courseObj && !existing.assignedCourses.some((item) => item.id === courseObj.id)) {
        existing.assignedCourses.push(courseObj)
      }
    }
  }

  const broadcastTasks = Array.from(taskGroupMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <EvaluationItemsClient
      tasks={broadcastTasks}
      courses={facultyCourses as any}
    />
  )
}
