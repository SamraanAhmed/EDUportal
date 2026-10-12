import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, CheckCircle2, Clock, Star, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SubmitForm } from './_components/SubmitForm'
import { TASK_TYPE_CONFIG, type TaskType } from '@/lib/types'

function SubmissionFileOrLink({ url }: { url: string }) {
  const isUploadedFile = url.includes('/storage/v1/object/public/submissions/')
  const isDrive = /drive\.google\.com|docs\.google\.com/i.test(url)

  if (isUploadedFile) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 border border-gray-200 text-xs font-medium hover:bg-gray-200 transition-colors w-fit"
      >
        <Download className="h-3.5 w-3.5 text-gray-600" />
        <span>View / Download Uploaded File</span>
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors w-fit"
    >
      <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
      <span>{isDrive ? 'Open Google Drive Submission' : 'Open Submission Link'}</span>
    </a>
  )
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
    .maybeSingle()

  const isSubmitted = !!submission
  const isGraded = isSubmitted && submission.score !== null

  const config = TASK_TYPE_CONFIG[task.type as TaskType] ?? {
    label: task.type,
    defaultMarks: 10,
    color: 'bg-gray-100 text-gray-700',
  }
  const maxMarks = task.max_marks ?? config.defaultMarks

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
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 ${config.color}`}
            >
              {config.label}
            </span>
            <Badge variant="outline" className="font-semibold text-gray-700">
              Max: {maxMarks} Marks
            </Badge>
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
                  Reference File / Rubric
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
                  {submission.score} / {maxMarks} Marks
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
                    Your Submission
                  </p>
                  <SubmissionFileOrLink url={submission.file_url} />
                </div>
              )}
              <Separator />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Resubmit / Update Link
                </p>
                <SubmitForm
                  taskId={taskId}
                  courseId={courseId}
                  hasExistingSubmission={true}
                  existingUrl={submission.file_url}
                />
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
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Your Submission
                  </p>
                  <SubmissionFileOrLink url={submission.file_url} />
                </div>
              )}
              <Separator />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Resubmit / Update Link
                </p>
                <SubmitForm
                  taskId={taskId}
                  courseId={courseId}
                  hasExistingSubmission={true}
                  existingUrl={submission.file_url}
                />
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
