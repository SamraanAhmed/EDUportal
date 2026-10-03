'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Video, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createVideoLecture, updateVideoLecture, deleteVideoLecture } from '@/actions/faculty'
import { toast } from 'sonner'
import type { VideoLecture } from '@/lib/types'

function YouTubeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

// ── Utility: extract YouTube embed URL ───────────────────────────
function getEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

// ── Add Video Dialog ─────────────────────────────────────────────
function AddVideoDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const url = formData.get('youtube_url') as string
    if (!getEmbedUrl(url)) {
      toast.error('Please enter a valid YouTube URL')
      return
    }
    startTransition(async () => {
      const result = await createVideoLecture(courseId, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Video lecture added')
        setOpen(false)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" /> Add Video Lecture
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Video Lecture</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Lecture Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Lecture 1 — Introduction to the Course"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="youtube_url">YouTube URL</Label>
            <Input
              id="youtube_url"
              name="youtube_url"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <p className="text-xs text-gray-400">
              Supports youtube.com/watch, youtu.be, and Shorts links.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Adding…' : 'Add Lecture'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Video Dialog ────────────────────────────────────────────
function EditVideoDialog({ video, courseId }: { video: VideoLecture; courseId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const url = formData.get('youtube_url') as string
    if (!getEmbedUrl(url)) {
      toast.error('Please enter a valid YouTube URL')
      return
    }
    startTransition(async () => {
      const result = await updateVideoLecture(video.id, courseId, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Video lecture updated')
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
          <DialogTitle>Edit Video Lecture</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`title-${video.id}`}>Lecture Title</Label>
            <Input
              id={`title-${video.id}`}
              name="title"
              defaultValue={video.title}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`url-${video.id}`}>YouTube URL</Label>
            <Input
              id={`url-${video.id}`}
              name="youtube_url"
              defaultValue={video.youtube_url}
              required
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

// ── Delete Button ────────────────────────────────────────────────
function DeleteVideoButton({ id, courseId }: { id: string; courseId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm('Delete this video lecture? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deleteVideoLecture(id, courseId)
      if (result?.error) toast.error(result.error)
      else toast.success('Video lecture deleted')
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

// ── Embedded Video Card ──────────────────────────────────────────
function VideoCard({
  video,
  index,
  courseId,
  showActions,
}: {
  video: VideoLecture
  index: number
  courseId: string
  showActions: boolean
}) {
  const embedUrl = getEmbedUrl(video.youtube_url)

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
            <YouTubeIcon className="h-4 w-4 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Lecture {index + 1}
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">{video.title}</p>
          </div>
        </div>
        {showActions && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <EditVideoDialog video={video} courseId={courseId} />
            <DeleteVideoButton id={video.id} courseId={courseId} />
          </div>
        )}
      </div>

      {/* Embedded Player */}
      {embedUrl ? (
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 bg-gray-50">
          <PlayCircle className="h-8 w-8 mb-2 text-gray-300" />
          <p className="text-sm">Invalid YouTube URL</p>
          <p className="text-xs mt-0.5 break-all px-4">{video.youtube_url}</p>
        </div>
      )}
    </div>
  )
}

// ── Main Panel ───────────────────────────────────────────────────
interface VideoLecturesPanelProps {
  videos: VideoLecture[]
  courseId: string
  showActions?: boolean
}

export function VideoLecturesPanel({
  videos,
  courseId,
  showActions = false,
}: VideoLecturesPanelProps) {
  return (
    <div>
      {showActions && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">
            {videos.length} video lecture{videos.length !== 1 ? 's' : ''}
          </h2>
          <AddVideoDialog courseId={courseId} />
        </div>
      )}

      {!showActions && videos.length > 0 && (
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          Video Lectures ({videos.length})
        </h2>
      )}

      {videos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
          <YouTubeIcon className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {showActions
              ? 'No video lectures yet. Add a YouTube link to get started.'
              : 'No video lectures have been uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {videos.map((video, i) => (
            <VideoCard
              key={video.id}
              video={video}
              index={i}
              courseId={courseId}
              showActions={showActions}
            />
          ))}
        </div>
      )}
    </div>
  )
}
