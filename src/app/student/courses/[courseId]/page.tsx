import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, FileText, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const typeColors: Record<string, string> = {
  assignment: 'bg-blue-100 text-blue-700 border-blue-200',
  quiz: 'bg-green-100 text-green-700 border-green-200',
  activity: 'bg-purple-100 text-purple-700 border-purple-200',
}

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Fetch course
  const { data: course } = await admin
    .from('courses')
    .select('*, profiles(full_name, email)')
    .eq('id', courseId)
    .single()

  if (!course) redirect('/student')

  // Fetch tasks
  const { data: tasks } = await admin
    .from('tasks')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  // Fetch student's submissions for tasks in this course
  const taskIds = (tasks ?? []).map((t) => t.id)
  const { data: submissions } = taskIds.length
    ? await admin
        .from('submissions')
        .select('*')
        .eq('student_id', user.id)
        .in('task_id', taskIds)
    : { data: [] }

  const submissionMap = new Map(
    (submissions ?? []).map((s) => [s.task_id, s])
  )

  const faculty = course.profiles as { full_name: string } | null

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
          {faculty && (
            <div className="flex items-center gap-1.5 mt-1">
              <GraduationCap className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">{faculty.full_name}</span>
            </div>
          )}
          {course.description && (
            <p className="text-sm text-gray-500 mt-2">{course.description}</p>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-700">
          Tasks ({tasks?.length ?? 0})
        </h2>
      </div>

      {!tasks || tasks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
          <FileText className="h-8 w-8 text-gray-300 mx-auto" />
          <p className="mt-3 text-sm text-gray-400">No tasks have been added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const submission = submissionMap.get(task.id)
            const isSubmitted = !!submission
            const isGraded = isSubmitted && submission.score !== null

            return (
              <Link
                key={task.id}
                href={`/student/courses/${courseId}/tasks/${task.id}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 bg-white">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium flex-shrink-0 ${typeColors[task.type] ?? 'bg-gray-100 text-gray-700'}`}
                        >
                          {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                          {task.due_date && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                Due {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isGraded ? (
                          <>
                            <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold">
                              {submission.score}/100
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Graded
                            </Badge>
                          </>
                        ) : isSubmitted ? (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            <Clock className="h-3 w-3 mr-1" /> Submitted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400">
                            Not Submitted
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
