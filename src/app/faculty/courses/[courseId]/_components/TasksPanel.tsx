'use client'

import { useState, useTransition } from 'react'
import { Trash2, Pencil, Eye, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createTask, updateTask, deleteTask } from '@/actions/faculty'
import { toast } from 'sonner'
import { TASK_TYPE_CONFIG, type Task, type TaskType } from '@/lib/types'
import Link from 'next/link'

interface TasksPanelProps {
  tasks: Task[]
  courseId: string
}

function TaskTypeBadge({ type }: { type: TaskType }) {
  const config = TASK_TYPE_CONFIG[type] ?? {
    label: type,
    defaultMarks: 10,
    color: 'bg-gray-100 text-gray-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  )
}

// ── Add Task Dialog ──────────────────────────────────────────────
function AddTaskDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [taskType, setTaskType] = useState<TaskType>('assignment')
  const [maxMarks, setMaxMarks] = useState<number>(10)

  const handleTypeChange = (v: TaskType) => {
    setTaskType(v)
    const defMarks = TASK_TYPE_CONFIG[v]?.defaultMarks ?? 10
    setMaxMarks(defMarks)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('type', taskType)
    formData.set('max_marks', String(maxMarks))

    startTransition(async () => {
      const result = await createTask(courseId, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Task created successfully')
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" /> Add Task
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Course Task / Evaluation Component</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. Lab Workbook Chapter 1-5" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Component Category</Label>
              <Select
                value={taskType}
                onValueChange={(v) => { if (v) handleTypeChange(v as TaskType) }}
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
              <Label htmlFor="max_marks">Max Marks</Label>
              <Input
                id="max_marks"
                name="max_marks"
                type="number"
                min={1}
                max={100}
                value={maxMarks}
                onChange={(e) => setMaxMarks(parseInt(e.target.value, 10) || 0)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description / Guidelines</Label>
            <Textarea id="description" name="description" placeholder="Instructions, criteria, or submission guidelines..." rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file">Attachment / Rubric (optional)</Label>
            <Input id="file" name="file" type="file" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Task Dialog ──────────────────────────────────────────────
function EditTaskDialog({ task, courseId }: { task: Task; courseId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [taskType, setTaskType] = useState<TaskType>(task.type)
  const [maxMarks, setMaxMarks] = useState<number>(task.max_marks ?? 10)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('type', taskType)
    formData.set('max_marks', String(maxMarks))

    startTransition(async () => {
      const result = await updateTask(task.id, courseId, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Task updated successfully')
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" variant="ghost" className="h-7 w-7" />}>
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`title-${task.id}`}>Title</Label>
            <Input id={`title-${task.id}`} name="title" defaultValue={task.title} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Component Category</Label>
              <Select
                value={taskType}
                onValueChange={(v) => { if (v) setTaskType(v as TaskType) }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz_pre_mid">Quiz 1 (Before Mid)</SelectItem>
                  <SelectItem value="quiz_post_mid">Quiz 2 (After Mid)</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="workbook">Workbook Fill-up</SelectItem>
                  <SelectItem value="activity">Class Activity / Attendance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`marks-${task.id}`}>Max Marks</Label>
              <Input
                id={`marks-${task.id}`}
                name="max_marks"
                type="number"
                min={1}
                max={100}
                value={maxMarks}
                onChange={(e) => setMaxMarks(parseInt(e.target.value, 10) || 0)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`desc-${task.id}`}>Description</Label>
            <Textarea id={`desc-${task.id}`} name="description" defaultValue={task.description ?? ''} rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`due-${task.id}`}>Due Date</Label>
            <Input
              id={`due-${task.id}`}
              name="due_date"
              type="date"
              defaultValue={task.due_date ? task.due_date.split('T')[0] : ''}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Task Button ──────────────────────────────────────────
function DeleteTaskButton({ taskId, courseId }: { taskId: string; courseId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this task? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deleteTask(taskId, courseId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Task deleted')
      }
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

// ── Main TasksPanel ──────────────────────────────────────────────
export function TasksPanel({ tasks, courseId }: TasksPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-700">
          {tasks.length} evaluation item{tasks.length !== 1 ? 's' : ''}
        </h2>
        <AddTaskDialog courseId={courseId} />
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-400">No tasks created yet. Add quizzes, assignments, or workbook fill-up to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <TaskTypeBadge type={task.type} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {task.max_marks ?? 10} Marks
                    </span>
                  </div>
                  {task.due_date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                <Link href={`/faculty/courses/${courseId}/tasks/${task.id}/submissions`}>
                  <Button size="sm" variant="ghost" className="gap-1 text-blue-600 hover:text-blue-800">
                    <Eye className="h-3.5 w-3.5" /> Submissions
                  </Button>
                </Link>
                <EditTaskDialog task={task} courseId={courseId} />
                <DeleteTaskButton taskId={task.id} courseId={courseId} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
