'use client'

import { useState, useTransition } from 'react'
import { submitTask } from '@/actions/student'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link2 } from 'lucide-react'

interface SubmitFormProps {
  taskId: string
  courseId: string
  hasExistingSubmission: boolean
  existingUrl?: string | null
}

export function SubmitForm({
  taskId,
  courseId,
  hasExistingSubmission,
  existingUrl,
}: SubmitFormProps) {
  const [isPending, startTransition] = useTransition()
  // Only pre-fill if it's a web/drive link, not an internal storage path
  const initialUrl =
    existingUrl && !existingUrl.includes('/storage/v1/object/public/submissions/')
      ? existingUrl
      : ''
  const [url, setUrl] = useState<string>(initialUrl)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!url.trim()) {
      toast.error('Please enter a Google Drive link')
      return
    }

    const formData = new FormData()
    formData.set('submission_url', url.trim())

    startTransition(async () => {
      const result = await submitTask(taskId, courseId, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(
          hasExistingSubmission
            ? 'Submission link updated successfully'
            : 'Submitted successfully'
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="submission_url" className="text-sm font-semibold text-gray-800">
          {hasExistingSubmission
            ? 'Update Google Drive / Document Link'
            : 'Google Drive / Document Link'}
        </Label>
        <div className="relative">
          <Input
            id="submission_url"
            name="submission_url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/... or document link"
            required={!hasExistingSubmission}
            className="pr-10"
          />
          <Link2 className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-3 text-xs text-blue-900 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            💡 Google Drive Sharing Instructions:
          </p>
          <p className="text-blue-800 leading-relaxed">
            1. Upload your file to Google Drive.<br />
            2. Right-click the file → <strong>Share</strong> → change General access to <strong>&quot;Anyone with the link can view&quot;</strong>.<br />
            3. Paste the shareable link above.
          </p>
        </div>
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Link2 className="h-4 w-4" />
        {isPending
          ? 'Submitting…'
          : hasExistingSubmission
          ? 'Update Submission Link'
          : 'Submit Link'}
      </Button>
    </form>
  )
}
