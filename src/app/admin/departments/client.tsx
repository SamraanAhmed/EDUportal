'use client'

import { useState } from 'react'
import { createDepartment, updateDepartment, deleteDepartment } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Department } from '@/lib/types'

export function DepartmentsClient({ departments }: { departments: Department[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Department | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate(formData: FormData) {
    setLoading(true)
    const result = await createDepartment(formData)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Department created!')
    setCreateOpen(false)
  }

  async function handleUpdate(formData: FormData) {
    if (!editItem) return
    setLoading(true)
    const result = await updateDepartment(editItem.id, formData)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Department updated!')
    setEditItem(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this department? All programs and batches inside will also be deleted.')) return
    const result = await deleteDepartment(id)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Deleted!')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 text-sm">Manage academic departments</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Department
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-8">No departments yet. Add one above.</TableCell></TableRow>
            )}
            {departments.map(dept => (
              <TableRow key={dept.id}>
                <TableCell className="font-medium">{dept.name}</TableCell>
                <TableCell className="text-gray-500 text-sm">{new Date(dept.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditItem(dept)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(dept.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Department</DialogTitle></DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input id="name" name="name" placeholder="e.g. Department of Computer Science" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Department'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Department</DialogTitle></DialogHeader>
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Department Name</Label>
              <Input id="edit-name" name="name" defaultValue={editItem?.name} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
