import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Award, BookOpen, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TasksPanel } from './_components/TasksPanel'
import { GradebookPanel } from './_components/GradebookPanel'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Fetch course with batch + program info
  const { data: course } = await admin
    .from('courses')
    .select('*, batches(name, programs(name))')
    .eq('id', courseId)
    .single()

  if (!course) redirect('/faculty')

  // Fetch tasks
  const { data: tasks } = await admin
    .from('tasks')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  const taskIds = tasks && tasks.length > 0 ? tasks.map((t) => t.id) : []

  // Fetch submissions for all tasks in this course
  let submissions: any[] = []
  if (taskIds.length > 0) {
    const { data: subs } = await admin
      .from('submissions')
      .select('*, tasks(type, max_marks)')
      .in('task_id', taskIds)
    submissions = subs ?? []
  }

  // Fetch viva evaluations
  const { data: vivaEvaluations } = await admin
    .from('viva_evaluations')
    .select('*')
    .eq('course_id', courseId)

  // Fetch students in the same batch
  const { data: students } = await admin
    .from('profiles')
    .select('*')
    .eq('batch_id', course.batch_id)
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  const batch = course.batches as { name: string; programs: { name: string } | null } | null
  const programName = batch?.programs?.name ?? '—'
  const batchName = batch?.name ?? '—'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/faculty"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{batchName}</Badge>
            <Badge variant="outline">{programName}</Badge>
          </div>
          {course.description && (
            <p className="text-sm text-gray-500 mt-1">{course.description}</p>
          )}
          {course.resource_url && (
            <a
              href={course.resource_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors w-fit mt-2"
            >
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span>Course Books & Material (Google Drive)</span>
              <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gradebook">
        <TabsList className="mb-6">
          <TabsTrigger value="gradebook" className="gap-1.5 font-semibold">
            <Award className="h-3.5 w-3.5 text-indigo-600" />
            Gradebook & Viva (100)
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Evaluation Items ({tasks?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Students ({students?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Gradebook Tab */}
        <TabsContent value="gradebook">
          <GradebookPanel
            courseId={courseId}
            students={students ?? []}
            tasks={tasks ?? []}
            submissions={submissions}
            vivaEvaluations={vivaEvaluations ?? []}
          />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <TasksPanel tasks={tasks ?? []} courseId={courseId} />
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          {!students || students.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white py-12 text-center">
              <p className="text-sm text-gray-400">No students enrolled in this batch yet.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell className="text-gray-500">{student.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={student.status === 'approved' ? 'default' : 'secondary'}
                          className={
                            student.status === 'approved'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }
                        >
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
