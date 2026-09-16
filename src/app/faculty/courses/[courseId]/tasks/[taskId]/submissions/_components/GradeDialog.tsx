'use client'

import { useState, useTransition } from 'react'
import { gradeSubmission } from '@/actions/faculty'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface GradeDialogProps {
  submissionId: string
  courseId: string
  taskId: string
  existingScore?: number | null
  existingFeedback?: string | null
}

export function GradeDialog({
  submissionId,
  courseId,
  taskId,
  existingScore,
  existingFeedback,
}: GradeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isGraded = existingScore !== null && existingScore !== undefined

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await gradeSubmission(submissionId, courseId, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Submission graded successfully')
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant={isGraded ? 'outline' : 'default'} />
        }
      >
        {isGraded ? 'Re-grade' : 'Grade'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="score">Score (0–100)</Label>
            <Input
              id="score"
              name="score"
              type="number"
              min={0}
              max={100}
              defaultValue={existingScore ?? ''}
              required
              placeholder="e.g. 85"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback">Feedback (optional)</Label>
            <Textarea
              id="feedback"
              name="feedback"
              rows={3}
              defaultValue={existingFeedback ?? ''}
              placeholder="Write feedback for the student…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Grade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
