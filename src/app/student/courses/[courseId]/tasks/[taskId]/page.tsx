import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, CheckCircle2, Clock, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SubmitForm } from './_components/SubmitForm'

const typeColors: Record<string, string> = {
  assignment: 'bg-blue-100 text-blue-700 border-blue-200',
  quiz: 'bg-green-100 text-green-700 border-green-200',
  activity: 'bg-purple-100 text-purple-700 border-purple-200',
}

export default async function StudentTaskPage({
  params,
}: {
  params: Promise<{ courseId: string; taskId: string }>
}) {
  const { courseId, taskId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Fetch task
  const { data: task } = await admin
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task) redirect(`/student/courses/${courseId}`)

  // Fetch student's submission for this task
  const { data: submission } = await admin
    .from('submissions')
    .select('*')
    .eq('task_id', taskId)
    .eq('student_id', user.id)
    .single()

  const isSubmitted = !!submission
  const isGraded = isSubmitted && submission.score !== null

  return (
    <div className="p-8 max-w-3xl">
      {/* Back link */}
      <Link
        href={`/student/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>

      {/* Task Details */}
      <Card className="shadow-sm mb-6 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3 flex-wrap">
            <CardTitle className="text-xl font-bold text-gray-900 leading-snug flex-1">
              {task.title}
            </CardTitle>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium flex-shrink-0 ${typeColors[task.type] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
            </span>
          </div>
          {task.due_date && (
            <p className="text-sm text-gray-500">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <p className="text-sm text-gray-700 leading-relaxed">{task.description}</p>
          )}
          {task.file_url && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Attachment
                </p>
                <a
                  href={task.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <Download className="h-4 w-4" /> Download Task File
                </a>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Submission Section */}
      <Card className="shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">Your Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {isGraded ? (
            <>
              {/* Graded State */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">Graded</span>
                <Badge className="bg-green-100 text-green-700 border-green-200 font-bold text-sm ml-1">
                  {submission.score}/100
                </Badge>
              </div>
              {submission.feedback && (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Instructor Feedback
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{submission.feedback}</p>
                </div>
              )}
              {submission.file_url && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Your File
                  </p>
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" /> View Submitted File
                  </a>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Resubmit
                </p>
                <SubmitForm taskId={taskId} courseId={courseId} hasExistingSubmission={true} />
              </div>
            </>
          ) : isSubmitted ? (
            <>
              {/* Submitted but not graded */}
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700">
                  Submitted — awaiting grading
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Submitted on {new Date(submission.submitted_at).toLocaleString()}
              </p>
              {submission.file_url && (
                <a
                  href={submission.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> View Submitted File
                </a>
              )}
              <Separator />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Resubmit
                </p>
                <SubmitForm taskId={taskId} courseId={courseId} hasExistingSubmission={true} />
              </div>
            </>
          ) : (
            <>
              {/* Not submitted */}
              <p className="text-sm text-gray-500">You haven&apos;t submitted this task yet.</p>
              <SubmitForm taskId={taskId} courseId={courseId} hasExistingSubmission={false} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
