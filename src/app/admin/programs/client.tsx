'use client'

import { useState } from 'react'
import { createProgram, updateProgram, deleteProgram } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Department } from '@/lib/types'

interface Program { id: string; name: string; department_id: string; created_at: string; departments: { name: string } | null }

export function ProgramsClient({ programs, departments }: { programs: Program[], departments: Department[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Program | null>(null)
  const [loading, setLoading] = useState(false)
  const [deptId, setDeptId] = useState('')
  const [editDeptId, setEditDeptId] = useState('')

  async function handleCreate(formData: FormData) {
    formData.set('department_id', deptId)
    setLoading(true)
    const result = await createProgram(formData)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Program created!')
    setCreateOpen(false); setDeptId('')
  }

  async function handleUpdate(formData: FormData) {
    if (!editItem) return
    formData.set('department_id', editDeptId)
    setLoading(true)
    const result = await updateProgram(editItem.id, formData)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Program updated!'); setEditItem(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this program? All batches and courses will also be deleted.')) return
    const result = await deleteProgram(id)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Deleted!')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-500 text-sm">Manage degree programs</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Program</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead><TableHead>Department</TableHead><TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-8">No programs yet.</TableCell></TableRow>}
            {programs.map(prog => (
              <TableRow key={prog.id}>
                <TableCell className="font-medium">{prog.name}</TableCell>
                <TableCell className="text-gray-500">{prog.departments?.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditItem(prog); setEditDeptId(prog.department_id) }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(prog.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Program</DialogTitle></DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select onValueChange={(v: any) => setDeptId(v || '')}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Program Name</Label>
              <Input id="name" name="name" placeholder="e.g. BS Computer Science" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !deptId}>{loading ? 'Creating...' : 'Create Program'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Program</DialogTitle></DialogHeader>
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select onValueChange={(v: any) => setEditDeptId(v || '')} defaultValue={editItem?.department_id}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Program Name</Label>
              <Input id="edit-name" name="name" defaultValue={editItem?.name} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
