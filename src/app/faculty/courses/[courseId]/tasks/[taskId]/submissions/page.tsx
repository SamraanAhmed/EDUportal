import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GradeDialog } from './_components/GradeDialog'

const typeColors: Record<string, string> = {
  assignment: 'bg-blue-100 text-blue-700 border-blue-200',
  quiz: 'bg-green-100 text-green-700 border-green-200',
  activity: 'bg-purple-100 text-purple-700 border-purple-200',
}

export default async function SubmissionsPage({
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

  if (!task) redirect(`/faculty/courses/${courseId}`)

  // Fetch submissions with student profile
  const { data: submissions } = await admin
    .from('submissions')
    .select('*, profiles(full_name, email)')
    .eq('task_id', taskId)
    .order('submitted_at', { ascending: false })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/faculty/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Course
        </Link>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[task.type] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
            </span>
          </div>
          {task.due_date && (
            <p className="text-sm text-gray-500">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </p>
          )}
        </div>
        <p className="mt-3 text-sm font-medium text-gray-600">
          {submissions?.length ?? 0} submission{submissions?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Submissions Table */}
      {!submissions || submissions.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white py-14 text-center">
          <p className="text-sm text-gray-400">No submissions yet for this task.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Student Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Email</TableHead>
                <TableHead className="font-semibold text-gray-700">Submitted At</TableHead>
                <TableHead className="font-semibold text-gray-700">File</TableHead>
                <TableHead className="font-semibold text-gray-700">Score</TableHead>
                <TableHead className="font-semibold text-gray-700">Feedback</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => {
                const student = sub.profiles as { full_name: string; email: string } | null
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{student?.full_name ?? '—'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{student?.email ?? '—'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {sub.file_url ? (
                        <a
                          href={sub.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No file</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.score !== null ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold">
                          {sub.score}/100
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      {sub.feedback ? (
                        <span className="text-sm text-gray-600 line-clamp-2">{sub.feedback}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <GradeDialog
                        submissionId={sub.id}
                        courseId={courseId}
                        taskId={taskId}
                        existingScore={sub.score}
                        existingFeedback={sub.feedback}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
