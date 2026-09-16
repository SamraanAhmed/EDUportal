'use client'

import { useState } from 'react'
import { createCourse, updateCourse, deleteCourse } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Batch { id: string; name: string; program_id: string; programs: { name: string } | null }
interface Faculty { id: string; full_name: string }
interface Course {
  id: string; name: string; description: string | null; batch_id: string; faculty_id: string | null; created_at: string
  batches: { name: string; programs: { name: string } | null } | null
  profiles: { full_name: string } | null
}

export function CoursesClient({ courses, batches, faculty }: { courses: Course[], batches: Batch[], faculty: Faculty[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Course | null>(null)
  const [loading, setLoading] = useState(false)
  const [batchId, setBatchId] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [editBatchId, setEditBatchId] = useState('')
  const [editFacultyId, setEditFacultyId] = useState('')

  async function handleCreate(formData: FormData) {
    formData.set('batch_id', batchId)
    formData.set('faculty_id', facultyId === 'none' ? '' : facultyId)
    setLoading(true)
    const result = await createCourse(formData)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Course created!'); setCreateOpen(false); setBatchId(''); setFacultyId('')
  }

  async function handleUpdate(formData: FormData) {
    if (!editItem) return
    formData.set('batch_id', editBatchId)
    formData.set('faculty_id', editFacultyId === 'none' ? '' : editFacultyId)
    setLoading(true)
    const result = await updateCourse(editItem.id, formData)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Course updated!'); setEditItem(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this course? All tasks and submissions will also be deleted.')) return
    const result = await deleteCourse(id)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Deleted!')
  }

  function CourseFormFields({ batchVal, facultyVal, onBatchChange, onFacultyChange, defaults }: {
    batchVal: string; facultyVal: string
    onBatchChange: (v: string) => void; onFacultyChange: (v: string) => void
    defaults?: Partial<Course>
  }) {
    return (
      <>
        <div className="space-y-2">
          <Label>Batch</Label>
          <Select onValueChange={(v) => onBatchChange(v ?? '')} defaultValue={batchVal}>
            <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
            <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name} — {b.programs?.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Course Name</Label>
          <Input id="name" name="name" placeholder="e.g. Introduction to Programming" defaultValue={defaults?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="Course description..." defaultValue={defaults?.description ?? ''} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Assign Faculty</Label>
          <Select onValueChange={(v) => onFacultyChange(v ?? '')} defaultValue={facultyVal || 'none'}>
            <SelectTrigger><SelectValue placeholder="Select faculty (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— No Faculty —</SelectItem>
              {faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-500 text-sm">Manage courses and faculty assignments</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Course</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Course</TableHead><TableHead>Batch</TableHead><TableHead>Faculty</TableHead><TableHead className="w-24 text-right">Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-8">No courses yet.</TableCell></TableRow>}
            {courses.map(course => (
              <TableRow key={course.id}>
                <TableCell>
                  <div className="font-medium">{course.name}</div>
                  {course.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{course.description}</div>}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{course.batches?.name}</div>
                  <div className="text-xs text-gray-400">{course.batches?.programs?.name}</div>
                </TableCell>
                <TableCell>
                  {course.profiles ? <Badge variant="secondary">{course.profiles.full_name}</Badge> : <span className="text-gray-400 text-sm">Unassigned</span>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditItem(course); setEditBatchId(course.batch_id); setEditFacultyId(course.faculty_id ?? 'none') }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(course.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Course</DialogTitle></DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <CourseFormFields batchVal={batchId} facultyVal={facultyId} onBatchChange={setBatchId} onFacultyChange={setFacultyId} />
            <Button type="submit" className="w-full" disabled={loading || !batchId}>{loading ? 'Creating...' : 'Create Course'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Course</DialogTitle></DialogHeader>
          {editItem && (
            <form action={handleUpdate} className="space-y-4">
              <CourseFormFields batchVal={editBatchId} facultyVal={editFacultyId} onBatchChange={setEditBatchId} onFacultyChange={setEditFacultyId} defaults={editItem} />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
