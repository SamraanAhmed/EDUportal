'use client'

import { useState } from 'react'
import { createBatch, updateBatch, deleteBatch } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Program { id: string; name: string; departments: { name: string } | null }
interface Batch { id: string; name: string; program_id: string; created_at: string; programs: { name: string } | null }

export function BatchesClient({ batches, programs }: { batches: Batch[], programs: Program[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Batch | null>(null)
  const [loading, setLoading] = useState(false)
  const [programId, setProgramId] = useState('')
  const [editProgramId, setEditProgramId] = useState('')

  async function handleCreate(formData: FormData) {
    formData.set('program_id', programId)
    setLoading(true)
    const result = await createBatch(formData)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Batch created!'); setCreateOpen(false); setProgramId('')
  }

  async function handleUpdate(formData: FormData) {
    if (!editItem) return
    formData.set('program_id', editProgramId)
    setLoading(true)
    const result = await updateBatch(editItem.id, formData)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Batch updated!'); setEditItem(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this batch? All courses in it will also be deleted.')) return
    const result = await deleteBatch(id)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Deleted!')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
          <p className="text-gray-500 text-sm">Manage student batches per program</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Batch</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Batch</TableHead><TableHead>Program</TableHead><TableHead className="w-24 text-right">Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-8">No batches yet.</TableCell></TableRow>}
            {batches.map(batch => (
              <TableRow key={batch.id}>
                <TableCell className="font-medium">{batch.name}</TableCell>
                <TableCell className="text-gray-500">{batch.programs?.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditItem(batch); setEditProgramId(batch.program_id) }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(batch.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Batch</DialogTitle></DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select onValueChange={(v: any) => setProgramId(v || '')}>
                <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} {p.departments ? `(${p.departments.name})` : ''}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Batch Name</Label>
              <Input id="name" name="name" placeholder="e.g. Fall 2023" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !programId}>{loading ? 'Creating...' : 'Create Batch'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Batch</DialogTitle></DialogHeader>
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select onValueChange={(v: any) => setEditProgramId(v || '')} defaultValue={editItem?.program_id}>
                <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Batch Name</Label>
              <Input id="edit-name" name="name" defaultValue={editItem?.name} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
