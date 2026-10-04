'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Video, CheckSquare, Square, PlayCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createVideoLecture, updateVideoLecture, deleteVideoLecture } from '@/actions/faculty'
import { toast } from 'sonner'
import type { Course } from '@/lib/types'

export interface FacultyLectureItem {
  id: string
  title: string
  youtube_url: string
  created_at: string
  assignedCourseIds: string[]
  assignedCourses: {
    id: string
    name: string
    batchName?: string
    programName?: string
  }[]
}

interface LiveLecturesClientProps {
  lectures: FacultyLectureItem[]
  courses: (Course & {
    batches?: {
      name: string
      programs?: { name: string }
    }
  })[]
}

// ── Utility: extract YouTube embed URL ───────────────────────────
function getEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function YouTubeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

// ── Modal: Add or Edit Lecture ────────────────────────────────────
function LectureFormDialog({
  lecture,
  courses,
  trigger,
}: {
  lecture?: FacultyLectureItem
  courses: LiveLecturesClientProps['courses']
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEditing = !!lecture

  const [title, setTitle] = useState(lecture?.title ?? '')
  const [url, setUrl] = useState(lecture?.youtube_url ?? '')
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    lecture ? lecture.assignedCourseIds : courses.map((c) => c.id) // Default all courses selected for new lecture
  )

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
      toast.error('Please enter a lecture title')
      return
    }

    if (!getEmbedUrl(url)) {
      toast.error('Please enter a valid YouTube URL (youtube.com, youtu.be, or shorts)')
      return
    }

    if (selectedCourseIds.length === 0) {
      toast.error('Please select at least one course to assign this video lecture to')
      return
    }

    const formData = new FormData()
    formData.set('title', title)
    formData.set('youtube_url', url)
    selectedCourseIds.forEach((cId) => formData.append('course_ids', cId))

    startTransition(async () => {
      const res = isEditing
        ? await updateVideoLecture(lecture.id, formData)
        : await createVideoLecture(formData)

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(isEditing ? 'Lecture updated successfully' : 'Live lecture added and broadcasted!')
        setOpen(false)
        if (!isEditing) {
          setTitle('')
          setUrl('')
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
            <Video className="h-5 w-5 text-red-600" />
            {isEditing ? 'Edit Live Lecture' : 'Add Live Lecture & Assign Courses'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="lecture-title">Lecture Title</Label>
            <Input
              id="lecture-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 1 — Lesson 01: Quranic Grammatical Rules"
              required
            />
          </div>

          {/* YouTube Link */}
          <div className="space-y-1.5">
            <Label htmlFor="lecture-url">YouTube Video URL</Label>
            <Input
              id="lecture-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              required
            />
            <p className="text-xs text-gray-500">
              Supports standard YouTube links, Shorts, and youtu.be URLs.
            </p>
          </div>

          {/* Multi-Course Assignment Checklist */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold text-gray-800">
                  Assign to Courses ({selectedCourseIds.length} of {courses.length} selected)
                </Label>
                <p className="text-xs text-gray-500">
                  Select which classes and programs can view this embedded video lecture.
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
                        ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-medium'
                        : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by parent div
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white gap-1.5">
              {isPending ? 'Saving…' : isEditing ? 'Update Lecture' : 'Publish & Broadcast'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Button ────────────────────────────────────────────────
function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this lecture? It will be removed from all assigned courses.')) {
      return
    }
    startTransition(async () => {
      const res = await deleteVideoLecture(id)
      if (res?.error) toast.error(res.error)
      else toast.success('Lecture deleted successfully')
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
export function LiveLecturesClient({ lectures, courses }: LiveLecturesClientProps) {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 shadow-sm">
              <Video className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Live Lectures</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Embed YouTube video lectures once and broadcast them across multiple courses simultaneously.
          </p>
        </div>

        <LectureFormDialog
          courses={courses}
          trigger={
            <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Add Live Lecture
            </Button>
          }
        />
      </div>

      {/* Lectures Grid */}
      {lectures.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-3">
            <YouTubeIcon className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">No live lectures added yet</h3>
          <p className="mt-1 text-sm text-gray-400 max-w-sm">
            Add a YouTube link, set a title, and select which classes should see the video.
          </p>
          <div className="mt-5">
            <LectureFormDialog
              courses={courses}
              trigger={
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1.5">
                  <Plus className="h-4 w-4" /> Add Your First Lecture
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lectures.map((lecture, index) => {
            const embedUrl = getEmbedUrl(lecture.youtube_url)
            const isAllCourses = lecture.assignedCourseIds.length >= courses.length && courses.length > 0

            return (
              <div
                key={lecture.id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-100 bg-gray-50/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
                      <YouTubeIcon className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide">
                          Lecture {index + 1}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(lecture.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 truncate" title={lecture.title}>
                        {lecture.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <LectureFormDialog
                      lecture={lecture}
                      courses={courses}
                      trigger={
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-600 hover:text-gray-900">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <DeleteButton id={lecture.id} />
                  </div>
                </div>

                {/* Embedded Video Player */}
                {embedUrl ? (
                  <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={lecture.title}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 bg-gray-50">
                    <PlayCircle className="h-8 w-8 mb-2 text-gray-300" />
                    <p className="text-sm">Invalid video link</p>
                    <p className="text-xs break-all px-4 mt-0.5">{lecture.youtube_url}</p>
                  </div>
                )}

                {/* Card Footer: Assigned Courses */}
                <div className="p-4 bg-white border-t border-gray-100 mt-auto">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="font-semibold text-gray-700">Broadcasted To:</span>
                    <span className="text-[11px]">
                      {lecture.assignedCourseIds.length} course{lecture.assignedCourseIds.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {isAllCourses ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold text-[11px]">
                        ✓ All Assigned Courses ({courses.length})
                      </Badge>
                    ) : (
                      lecture.assignedCourses.map((c) => (
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
