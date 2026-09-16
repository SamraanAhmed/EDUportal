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
import type { Task, TaskType } from '@/lib/types'
import Link from 'next/link'

interface TasksPanelProps {
  tasks: Task[]
  courseId: string
}

const typeColors: Record<string, string> = {
  assignment: 'bg-blue-100 text-blue-700 border-blue-200',
  quiz: 'bg-green-100 text-green-700 border-green-200',
  activity: 'bg-purple-100 text-purple-700 border-purple-200',
}

function TaskTypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[type] ?? 'bg-gray-100 text-gray-700'}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  )
}

// ── Add Task Dialog ──────────────────────────────────────────────
function AddTaskDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [taskType, setTaskType] = useState<TaskType>('assignment')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('type', taskType)
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
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Task title" required />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={taskType}
              onValueChange={(v) => { if (v) setTaskType(v as TaskType) }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Task description (optional)" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="file">Attachment (optional)</Label>
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('type', taskType)
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
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={taskType}
              onValueChange={(v) => { if (v) setTaskType(v as TaskType) }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
              </SelectContent>
            </Select>
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
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </h2>
        <AddTaskDialog courseId={courseId} />
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-400">No tasks yet. Add your first task to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <TaskTypeBadge type={task.type} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  {task.due_date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                <Link href={`/faculty/courses/${courseId}/tasks/${task.id}/submissions`}>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500 hover:text-blue-700">
                    <Eye className="h-3.5 w-3.5" />
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
