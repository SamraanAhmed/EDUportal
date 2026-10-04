import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LiveLecturesClient, type FacultyLectureItem } from './client'

export default async function LiveLecturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Fetch all courses assigned to this faculty member
  const { data: courses } = await admin
    .from('courses')
    .select('*, batches(name, programs(name, departments(name)))')
    .eq('faculty_id', user.id)
    .order('name', { ascending: true })

  const facultyCourses = courses ?? []
  const courseIds = facultyCourses.map((c) => c.id)

  // Fetch all video lectures created by this faculty or linked to their courses
  const { data: rawLectures } = await admin
    .from('video_lectures')
    .select(`
      id,
      title,
      youtube_url,
      created_at,
      created_by,
      video_lecture_courses(
        course_id,
        courses(id, name, batches(name, programs(name)))
      )
    `)
    .order('created_at', { ascending: true })

  // Filter lectures that belong to this faculty or are linked to any of their courses
  const filteredLectures = (rawLectures ?? []).filter((l: any) => {
    if (l.created_by === user.id) return true
    const linkedCourses = l.video_lecture_courses ?? []
    return linkedCourses.some((item: any) => courseIds.includes(item.course_id))
  })

  // Format into FacultyLectureItem
  const lectures: FacultyLectureItem[] = filteredLectures.map((l: any) => {
    const links = l.video_lecture_courses ?? []
    const assignedCourses = links
      .filter((item: any) => item.courses)
      .map((item: any) => {
        const c = item.courses
        const batch = c?.batches
        return {
          id: c.id,
          name: c.name,
          batchName: batch?.name,
          programName: batch?.programs?.name,
        }
      })

    const assignedCourseIds = links.map((item: any) => item.course_id)

    return {
      id: l.id,
      title: l.title,
      youtube_url: l.youtube_url,
      created_at: l.created_at,
      assignedCourseIds,
      assignedCourses,
    }
  })

  return <LiveLecturesClient lectures={lectures} courses={facultyCourses as any} />
}
