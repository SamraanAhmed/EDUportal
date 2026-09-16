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
  maxMarks?: number
  existingScore?: number | null
  existingFeedback?: string | null
}

export function GradeDialog({
  submissionId,
  courseId,
  taskId,
  maxMarks = 10,
  existingScore,
  existingFeedback,
}: GradeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isGraded = existingScore !== null && existingScore !== undefined

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const scoreVal = parseInt(formData.get('score') as string, 10)

    if (scoreVal < 0 || scoreVal > maxMarks) {
      toast.error(`Score must be between 0 and ${maxMarks}`)
      return
    }

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
          <DialogTitle>Grade Submission (Max: {maxMarks} Marks)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="score">Score (0–{maxMarks})</Label>
            <Input
              id="score"
              name="score"
              type="number"
              min={0}
              max={maxMarks}
              defaultValue={existingScore ?? ''}
              required
              placeholder={`e.g. ${Math.round(maxMarks * 0.8)}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback">Feedback (optional)</Label>
            <Textarea
              id="feedback"
              name="feedback"
              rows={3}
              placeholder="Good effort! Focus on..."
              defaultValue={existingFeedback ?? ''}
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
