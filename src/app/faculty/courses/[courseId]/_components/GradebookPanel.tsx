'use client'

import { useState, useTransition } from 'react'
import { Award, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { gradeViva } from '@/actions/faculty'
import { toast } from 'sonner'
import type { Profile, Task, Submission, VivaEvaluation } from '@/lib/types'

interface GradebookPanelProps {
  courseId: string
  students: Profile[]
  tasks: Task[]
  submissions: (Submission & { tasks?: { type: string; max_marks: number } })[]
  vivaEvaluations: VivaEvaluation[]
}

// ── Viva Grade Dialog ─────────────────────────────────────────────
function VivaDialog({
  courseId,
  studentId,
  studentName,
  existingViva,
}: {
  courseId: string
  studentId: string
  studentName: string
  existingViva?: VivaEvaluation
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const scoreVal = parseInt(formData.get('viva_score') as string, 10)

    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 40) {
      toast.error('Viva marks must be between 0 and 40')
      return
    }

    startTransition(async () => {
      const result = await gradeViva(courseId, studentId, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Viva evaluated for ${studentName}`)
        setOpen(false)
      }
    })
  }

  const hasViva = existingViva?.viva_score !== null && existingViva?.viva_score !== undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant={hasViva ? 'outline' : 'default'} className="gap-1 text-xs" />}>
        <Edit3 className="h-3.5 w-3.5" />
        {hasViva ? `Viva: ${existingViva.viva_score}/40` : 'Grade Viva'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Viva Examination — {studentName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="viva_score">Viva Marks (0 – 40)</Label>
            <Input
              id="viva_score"
              name="viva_score"
              type="number"
              min={0}
              max={40}
              defaultValue={existingViva?.viva_score ?? ''}
              required
              placeholder="e.g. 35"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback">Examiner Remarks (optional)</Label>
            <Textarea
              id="feedback"
              name="feedback"
              rows={3}
              placeholder="Questions asked, subject understanding, presentation..."
              defaultValue={existingViva?.feedback ?? ''}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Viva Marks'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Gradebook Panel ──────────────────────────────────────────
export function GradebookPanel({
  courseId,
  students,
  tasks,
  submissions,
  vivaEvaluations,
}: GradebookPanelProps) {
  const [search, setSearch] = useState('')

  // Helper to get score for a student in a specific category
  const getCategoryScore = (studentId: string, category: string) => {
    // Find all tasks of this category
    const categoryTasks = tasks.filter((t) => {
      if (category === 'quiz_pre_mid') return t.type === 'quiz_pre_mid' || t.type === 'quiz'
      return t.type === category
    })
    if (categoryTasks.length === 0) return null

    let totalEarned = 0
    let hasGraded = false

    for (const t of categoryTasks) {
      const sub = submissions.find((s) => s.student_id === studentId && s.task_id === t.id)
      if (sub && sub.score !== null && sub.score !== undefined) {
        totalEarned += sub.score
        hasGraded = true
      }
    }

    return hasGraded ? totalEarned : null
  }

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Overview Cards: Breakdown Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-900">Internal Evaluation</span>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">60 Marks</Badge>
          </div>
          <ul className="text-xs text-gray-600 mt-3 space-y-1.5">
            <li className="flex justify-between">
              <span>• Quiz 1 (Pre-Mid)</span>
              <span className="font-semibold text-gray-800">5 Marks</span>
            </li>
            <li className="flex justify-between">
              <span>• Quiz 2 (Post-Mid)</span>
              <span className="font-semibold text-gray-800">5 Marks</span>
            </li>
            <li className="flex justify-between">
              <span>• Assignment</span>
              <span className="font-semibold text-gray-800">10 Marks</span>
            </li>
            <li className="flex justify-between">
              <span>• Workbook Fill-up</span>
              <span className="font-semibold text-gray-800">30 Marks</span>
            </li>
            <li className="flex justify-between">
              <span>• Activity / Attendance</span>
              <span className="font-semibold text-gray-800">10 Marks</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-900">Viva Examination</span>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">40 Marks</Badge>
          </div>
          <p className="text-xs text-gray-600 mt-3 leading-relaxed">
            Oral defense and question/answer session evaluated by the course instructor / faculty panel.
          </p>
          <div className="mt-4 pt-3 border-t border-emerald-50 flex items-center justify-between text-xs text-emerald-800 font-medium">
            <span>Evaluated Students:</span>
            <span>{vivaEvaluations.filter((v) => v.viva_score !== null).length} / {students.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-indigo-900">Total Course Weight</span>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">100 Marks</Badge>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Sum of Internal (60) + Viva (40).
          </p>
          <div className="mt-4 pt-3 border-t border-indigo-50 flex items-center gap-2 text-xs text-indigo-700">
            <Award className="h-4 w-4" /> Passing criteria typically requires ≥ 50%
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-72">
          <Input
            placeholder="Search student by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white"
          />
        </div>
        <p className="text-sm text-gray-500 font-medium">
          Showing {filteredStudents.length} of {students.length} enrolled students
        </p>
      </div>

      {/* Gradebook Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 text-xs">
              <TableHead className="font-bold text-gray-700 w-48">Student</TableHead>
              <TableHead className="font-bold text-gray-700 text-center">Quiz 1 (5)</TableHead>
              <TableHead className="font-bold text-gray-700 text-center">Quiz 2 (5)</TableHead>
              <TableHead className="font-bold text-gray-700 text-center">Assign. (10)</TableHead>
              <TableHead className="font-bold text-gray-700 text-center">Workbook (30)</TableHead>
              <TableHead className="font-bold text-gray-700 text-center">Activity (10)</TableHead>
              <TableHead className="font-bold text-blue-800 text-center bg-blue-50/50">Internal (60)</TableHead>
              <TableHead className="font-bold text-emerald-800 text-center bg-emerald-50/50">Viva (40)</TableHead>
              <TableHead className="font-bold text-indigo-900 text-center bg-indigo-50/50">Total (100)</TableHead>
              <TableHead className="font-bold text-gray-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-gray-400">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => {
                const q1 = getCategoryScore(student.id, 'quiz_pre_mid')
                const q2 = getCategoryScore(student.id, 'quiz_post_mid')
                const assign = getCategoryScore(student.id, 'assignment')
                const workbook = getCategoryScore(student.id, 'workbook')
                const activity = getCategoryScore(student.id, 'activity')

                // Calculate internal sum
                const internalScore = (q1 ?? 0) + (q2 ?? 0) + (assign ?? 0) + (workbook ?? 0) + (activity ?? 0)
                const hasAnyInternal = q1 !== null || q2 !== null || assign !== null || workbook !== null || activity !== null

                const viva = vivaEvaluations.find((v) => v.student_id === student.id)
                const vivaScore = viva?.viva_score ?? null

                const totalScore = (hasAnyInternal ? internalScore : 0) + (vivaScore ?? 0)
                const isEvaluated = hasAnyInternal || vivaScore !== null

                return (
                  <TableRow key={student.id} className="hover:bg-gray-50/50 text-xs">
                    <TableCell>
                      <div className="font-semibold text-gray-900">{student.full_name}</div>
                      <div className="text-[11px] text-gray-400">{student.email}</div>
                    </TableCell>

                    {/* Quiz 1 */}
                    <TableCell className="text-center font-medium">
                      {q1 !== null ? <span className="text-emerald-700">{q1}</span> : <span className="text-gray-300">—</span>}
                    </TableCell>

                    {/* Quiz 2 */}
                    <TableCell className="text-center font-medium">
                      {q2 !== null ? <span className="text-emerald-700">{q2}</span> : <span className="text-gray-300">—</span>}
                    </TableCell>

                    {/* Assignment */}
                    <TableCell className="text-center font-medium">
                      {assign !== null ? <span className="text-blue-700">{assign}</span> : <span className="text-gray-300">—</span>}
                    </TableCell>

                    {/* Workbook */}
                    <TableCell className="text-center font-medium">
                      {workbook !== null ? <span className="text-amber-700 font-bold">{workbook}</span> : <span className="text-gray-300">—</span>}
                    </TableCell>

                    {/* Activity */}
                    <TableCell className="text-center font-medium">
                      {activity !== null ? <span className="text-purple-700">{activity}</span> : <span className="text-gray-300">—</span>}
                    </TableCell>

                    {/* Internal Total (60) */}
                    <TableCell className="text-center font-bold bg-blue-50/40">
                      {hasAnyInternal ? (
                        <span className="text-blue-800">{internalScore} / 60</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>

                    {/* Viva Total (40) */}
                    <TableCell className="text-center font-bold bg-emerald-50/40">
                      {vivaScore !== null ? (
                        <span className="text-emerald-800">{vivaScore} / 40</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>

                    {/* Grand Total (100) */}
                    <TableCell className="text-center font-bold bg-indigo-50/40">
                      {isEvaluated ? (
                        <span className={`px-2 py-0.5 rounded text-xs ${totalScore >= 50 ? 'bg-indigo-100 text-indigo-900' : 'bg-red-100 text-red-800'}`}>
                          {totalScore} / 100
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <VivaDialog
                        courseId={courseId}
                        studentId={student.id}
                        studentName={student.full_name}
                        existingViva={viva}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
