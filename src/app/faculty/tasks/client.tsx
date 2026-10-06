'use client'

import { useState, useTransition } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  FileText,
  Download,
  CheckSquare,
  Square,
  ClipboardList,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  createBroadcastTask,
  updateBroadcastTask,
  deleteBroadcastTask,
} from '@/actions/faculty'
import { toast } from 'sonner'
import { TASK_TYPE_CONFIG, type TaskType, type Course } from '@/lib/types'

export interface FacultyBroadcastTaskItem {
  groupId: string
  title: string
  type: TaskType
  description: string | null
  due_date: string | null
  file_url: string | null
  max_marks: number
  created_at: string
  assignedCourseIds: string[]
  assignedCourses: {
    id: string
    name: string
    batchName?: string
    programName?: string
  }[]
}

interface EvaluationItemsClientProps {
  tasks: FacultyBroadcastTaskItem[]
  courses: (Course & {
    batches?: {
      name: string
      programs?: { name: string }
    }
  })[]
}

function TaskTypeBadge({ type }: { type: TaskType }) {
  const config = TASK_TYPE_CONFIG[type] ?? {
    label: type,
    defaultMarks: 10,
    color: 'bg-gray-100 text-gray-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.color}`}
    >
      {config.label}
    </span>
  )
}

// ── Modal: Add or Edit Evaluation Item ────────────────────────────
function TaskFormDialog({
  task,
  courses,
  trigger,
}: {
  task?: FacultyBroadcastTaskItem
  courses: EvaluationItemsClientProps['courses']
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEditing = !!task

  const [title, setTitle] = useState(task?.title ?? '')
  const [type, setType] = useState<TaskType>(task?.type ?? 'assignment')
  const [maxMarks, setMaxMarks] = useState<number>(
    task?.max_marks ?? TASK_TYPE_CONFIG['assignment'].defaultMarks
  )
  const [description, setDescription] = useState(task?.description ?? '')
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.split('T')[0] : ''
  )
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    task ? task.assignedCourseIds : courses.map((c) => c.id) // Default all courses selected for new item
  )

  const handleTypeChange = (newType: TaskType) => {
    setType(newType)
    if (!isEditing) {
      const def = TASK_TYPE_CONFIG[newType]?.defaultMarks ?? 10
      setMaxMarks(def)
    }
  }

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedCourseIds.length === courses.length) {
      setSelectedCourseIds([])
    } else {
      setSelectedCourseIds(courses.map((c) => c.id))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter a task title')
      return
    }

    if (selectedCourseIds.length === 0) {
      toast.error('Please select at least one course to assign this evaluation item to')
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set('title', title)
    formData.set('type', type)
    formData.set('max_marks', String(maxMarks))
    formData.set('description', description)
    formData.set('due_date', dueDate)
    selectedCourseIds.forEach((cId) => formData.append('course_ids', cId))

    startTransition(async () => {
      const res = isEditing
        ? await updateBroadcastTask(task.groupId, formData)
        : await createBroadcastTask(formData)

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(
          isEditing
            ? 'Evaluation item updated across assigned courses'
            : 'Evaluation item created and broadcasted to courses!'
        )
        setOpen(false)
        if (!isEditing) {
          setTitle('')
          setDescription('')
          setDueDate('')
          setSelectedCourseIds(courses.map((c) => c.id))
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as any} />
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            {isEditing
              ? 'Edit Evaluation Item'
              : 'Add Evaluation Item & Assign Courses'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quiz 1 (Before Mid) - Units 1 & 2"
              required
            />
          </div>

          {/* Category & Marks */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Component Category</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  if (v) handleTypeChange(v as TaskType)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz_pre_mid">Quiz 1 (Before Mid) [5m]</SelectItem>
                  <SelectItem value="quiz_post_mid">Quiz 2 (After Mid) [5m]</SelectItem>
                  <SelectItem value="assignment">Assignment [10m]</SelectItem>
                  <SelectItem value="workbook">Workbook Fill-up [30m]</SelectItem>
                  <SelectItem value="activity">Class Activity / Attendance [10m]</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-marks">Max Marks</Label>
              <Input
                id="task-marks"
                type="number"
                min={1}
                max={100}
                value={maxMarks}
                onChange={(e) => setMaxMarks(parseInt(e.target.value, 10) || 0)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description / Guidelines (optional)</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions, chapters covered, rubric details..."
              rows={3}
            />
          </div>

          {/* Due Date & Attachment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due Date (optional)</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {!isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="task-file">Attachment / Question Paper</Label>
                <Input id="task-file" name="file" type="file" />
              </div>
            )}
          </div>

          {/* Course Checklist */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold text-gray-800">
                  Assign to Courses ({selectedCourseIds.length} of {courses.length} selected)
                </Label>
                <p className="text-xs text-gray-500">
                  Broadcast this evaluation item to all selected student batches.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="text-xs h-7 gap-1"
              >
                {selectedCourseIds.length === courses.length ? (
                  <>
                    <Square className="h-3.5 w-3.5" /> Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3.5 w-3.5" /> Select All
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto rounded-lg border border-gray-200 p-2 bg-gray-50/50">
              {courses.map((course) => {
                const isChecked = selectedCourseIds.includes(course.id)
                const programName = course.batches?.programs?.name ?? 'General'
                const batchName = course.batches?.name ?? ''

                return (
                  <div
                    key={course.id}
                    onClick={() => toggleCourse(course.id)}
                    className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-colors border text-xs ${
                      isChecked
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-medium'
                        : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate">{course.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <Badge variant="outline" className="text-[10px] bg-white">
                        {programName}
                      </Badge>
                      {batchName && (
                        <Badge variant="secondary" className="text-[10px]">
                          {batchName}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isPending
                ? 'Saving…'
                : isEditing
                ? 'Update Item'
                : 'Publish & Assign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Button ────────────────────────────────────────────────
function DeleteButton({ groupId }: { groupId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (
      !confirm(
        'Are you sure you want to delete this evaluation item? It will be removed from all assigned courses.'
      )
    ) {
      return
    }
    startTransition(async () => {
      const res = await deleteBroadcastTask(groupId)
      if (res?.error) toast.error(res.error)
      else toast.success('Evaluation item deleted successfully')
    })
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}

// ── Main Client Page ─────────────────────────────────────────────
export function EvaluationItemsClient({
  tasks,
  courses,
}: EvaluationItemsClientProps) {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Evaluation Items
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Create quizzes, assignments, workbooks, and activities once and broadcast them across multiple courses.
          </p>
        </div>

        <TaskFormDialog
          courses={courses}
          trigger={
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Add Evaluation Item
            </Button>
          }
        />
      </div>

      {/* Evaluation Items List */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 mb-3">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">
            No evaluation items added yet
          </h3>
          <p className="mt-1 text-sm text-gray-400 max-w-sm">
            Create your first quiz, assignment, or workbook task and assign it to your classes simultaneously.
          </p>
          <div className="mt-5">
            <TaskFormDialog
              courses={courses}
              trigger={
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Your First Evaluation Item
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isAllCourses =
              task.assignedCourseIds.length >= courses.length && courses.length > 0

            return (
              <div
                key={task.groupId}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Left: Task Info */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <TaskTypeBadge type={task.type} />
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {task.max_marks} Marks
                    </span>
                    {task.due_date && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {task.file_url && (
                      <a
                        href={task.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Attachment</span>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </a>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-gray-900 leading-snug">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 max-w-3xl">
                      {task.description}
                    </p>
                  )}

                  {/* Broadcasted Courses Badges */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-xs font-semibold text-gray-600">
                      Broadcasted To:
                    </span>
                    {isAllCourses ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold text-[11px]">
                        ✓ All Assigned Courses ({courses.length})
                      </Badge>
                    ) : (
                      task.assignedCourses.map((c) => (
                        <Badge
                          key={c.id}
                          variant="secondary"
                          className="text-[11px] font-medium bg-blue-50 text-blue-800 border-blue-200"
                        >
                          {c.programName ? `${c.programName}` : c.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 self-end md:self-center">
                  <TaskFormDialog
                    task={task}
                    courses={courses}
                    trigger={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-600 hover:text-gray-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DeleteButton groupId={task.groupId} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
