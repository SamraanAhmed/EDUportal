'use client'

import { useState, useTransition } from 'react'
import { submitTask } from '@/actions/student'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'

interface SubmitFormProps {
  taskId: string
  courseId: string
  hasExistingSubmission: boolean
}

export function SubmitForm({ taskId, courseId, hasExistingSubmission }: SubmitFormProps) {
  const [isPending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string>('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await submitTask(taskId, courseId, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(hasExistingSubmission ? 'Resubmitted successfully' : 'Submitted successfully')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="file">
          {hasExistingSubmission ? 'Replace File (optional)' : 'Upload File'}
        </Label>
        <Input
          id="file"
          name="file"
          type="file"
          required={!hasExistingSubmission}
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
        />
        {fileName && (
          <p className="text-xs text-gray-500">Selected: {fileName}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="gap-1.5">
        <Upload className="h-4 w-4" />
        {isPending
          ? 'Submitting…'
          : hasExistingSubmission
          ? 'Resubmit'
          : 'Submit Task'}
      </Button>
    </form>
  )
}
