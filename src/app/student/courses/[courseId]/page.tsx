import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, FileText, Calendar, CheckCircle2, Clock, Award, BookCheck, BookOpen, Download, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TASK_TYPE_CONFIG, type TaskType, type VivaEvaluation } from '@/lib/types'

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

  // Fetch viva evaluation for this student
  const { data: viva } = await admin
    .from('viva_evaluations')
    .select('*')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .maybeSingle()

  const faculty = course.profiles as { full_name: string } | null

  // Calculate internal breakdown
  let q1Earned = 0, hasQ1 = false
  let q2Earned = 0, hasQ2 = false
  let assignEarned = 0, hasAssign = false
  let workbookEarned = 0, hasWorkbook = false
  let activityEarned = 0, hasActivity = false

  for (const t of tasks ?? []) {
    const sub = submissionMap.get(t.id)
    if (sub && sub.score !== null && sub.score !== undefined) {
      if (t.type === 'quiz_pre_mid' || t.type === 'quiz') {
        q1Earned += sub.score
        hasQ1 = true
      } else if (t.type === 'quiz_post_mid') {
        q2Earned += sub.score
        hasQ2 = true
      } else if (t.type === 'assignment') {
        assignEarned += sub.score
        hasAssign = true
      } else if (t.type === 'workbook') {
        workbookEarned += sub.score
        hasWorkbook = true
      } else if (t.type === 'activity') {
        activityEarned += sub.score
        hasActivity = true
      }
    }
  }

  const internalEarned = q1Earned + q2Earned + assignEarned + workbookEarned + activityEarned
  const hasAnyInternal = hasQ1 || hasQ2 || hasAssign || hasWorkbook || hasActivity
  const vivaEarned = viva?.viva_score ?? 0
  const hasViva = viva?.viva_score !== null && viva?.viva_score !== undefined
  const totalEarned = (hasAnyInternal ? internalEarned : 0) + (hasViva ? vivaEarned : 0)
  const isEvaluated = hasAnyInternal || hasViva

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
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
              <span className="text-sm text-gray-500">Instructor: {faculty.full_name}</span>
            </div>
          )}
          {course.description && (
            <p className="text-sm text-gray-500 mt-2">{course.description}</p>
          )}
        </div>
      </div>

      {/* ── Highlighted Course Books / Drive Link Button ── */}
      {course.resource_url && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-5 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.005]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Course Books & Reading Material
                  </h3>
                  <span className="rounded-full bg-yellow-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-gray-900 shadow-sm animate-pulse">
                    Download
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Access and download textbook volumes (معلم القرآن), notes, and reference files from Google Drive
                </p>
              </div>
            </div>
            <a
              href={course.resource_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-md transition-all hover:bg-yellow-300 hover:text-gray-900 hover:shadow-lg flex-shrink-0"
            >
              <Download className="h-4 w-4 text-emerald-700" />
              <span>Open Google Drive Books</span>
              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            </a>
          </div>
        </div>
      )}

      {/* ── Evaluation & Mark Distribution Summary ── */}
      <Card className="border-indigo-100 shadow-sm bg-gradient-to-br from-white to-indigo-50/30 overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg">Number Distribution & Progress</CardTitle>
            </div>
            <Badge className="bg-indigo-600 text-white font-bold px-3 py-1">
              {isEvaluated ? `${totalEarned} / 100 Marks` : 'Pending Evaluation'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Internal Breakdown (60) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">Internal Assessment</span>
                <span className="text-sm font-bold text-blue-700">
                  {hasAnyInternal ? `${internalEarned} / 60` : '— / 60'}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">• Quiz 1 (Before Mid)</span>
                  <span className="font-semibold text-gray-800">{hasQ1 ? `${q1Earned} / 5` : '— / 5'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">• Quiz 2 (After Mid)</span>
                  <span className="font-semibold text-gray-800">{hasQ2 ? `${q2Earned} / 5` : '— / 5'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">• Assignment</span>
                  <span className="font-semibold text-gray-800">{hasAssign ? `${assignEarned} / 10` : '— / 10'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">• Workbook Fill-up</span>
                  <span className="font-bold text-amber-800">{hasWorkbook ? `${workbookEarned} / 30` : '— / 30'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">• Class Activity / Attendance</span>
                  <span className="font-semibold text-gray-800">{hasActivity ? `${activityEarned} / 10` : '— / 10'}</span>
                </div>
              </div>
            </div>

            {/* Viva Breakdown (40) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">Viva Examination</span>
                <span className="text-sm font-bold text-emerald-700">
                  {hasViva ? `${vivaEarned} / 40` : '— / 40'}
                </span>
              </div>
              <div className="bg-emerald-50/50 rounded-lg p-3 text-xs border border-emerald-100 space-y-2">
                <p className="text-gray-600">
                  Oral examination covering course topics, workbook completion, and project concepts.
                </p>
                {hasViva ? (
                  <div className="pt-2 border-t border-emerald-100">
                    <span className="font-semibold text-emerald-900">Remarks:</span>
                    <p className="text-gray-700 mt-0.5 italic">{viva?.feedback || 'Satisfactory oral defense.'}</p>
                  </div>
                ) : (
                  <p className="text-emerald-700 font-medium pt-1">
                    Scheduled by faculty during final exam / viva week.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          Course Evaluation Tasks ({tasks?.length ?? 0})
        </h2>

        {!tasks || tasks.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
            <FileText className="h-8 w-8 text-gray-300 mx-auto" />
            <p className="mt-3 text-sm text-gray-400">No tasks have been published yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const submission = submissionMap.get(task.id)
              const isSubmitted = !!submission
              const isGraded = isSubmitted && submission.score !== null
              const config = TASK_TYPE_CONFIG[task.type as TaskType] ?? {
                label: task.type,
                defaultMarks: 10,
                color: 'bg-gray-100 text-gray-700',
              }
              const maxMarks = task.max_marks ?? config.defaultMarks

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
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 ${config.color}`}
                          >
                            {config.label}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                              <span className="text-xs font-medium px-2 py-0.2 rounded bg-gray-100 text-gray-600">
                                {maxMarks} Marks
                              </span>
                            </div>
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
                              <Badge className="bg-green-100 text-green-700 border-green-200 font-bold">
                                {submission.score} / {maxMarks}
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
    </div>
  )
}
