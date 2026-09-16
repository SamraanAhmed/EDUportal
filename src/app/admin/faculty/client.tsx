'use client'

import { useState } from 'react'
import { createFaculty, deleteFaculty } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, UserCog } from 'lucide-react'

interface Faculty { id: string; full_name: string; email: string; phone: string | null }

export function FacultyClient({ faculty }: { faculty: Faculty[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCreate(formData: FormData) {
    setLoading(true)
    const result = await createFaculty(formData)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Faculty account created! Share credentials with them.')
    setCreateOpen(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from faculty? This will also unassign them from courses.`)) return
    const result = await deleteFaculty(id)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Faculty removed!')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
          <p className="text-gray-500 text-sm">Manage faculty accounts</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Faculty</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead className="w-16 text-right">Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {faculty.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">No faculty yet. Add one above.</TableCell></TableRow>}
            {faculty.map(f => (
              <TableRow key={f.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-1.5 rounded-full"><UserCog className="h-4 w-4 text-indigo-600" /></div>
                    <span className="font-medium">{f.full_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-500">{f.email}</TableCell>
                <TableCell className="text-gray-500">{f.phone || '—'}</TableCell>
                <TableCell><Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(f.id, f.full_name)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Faculty Account</DialogTitle></DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="full_name">Full Name</Label><Input id="full_name" name="full_name" placeholder="Dr. Ahmed Khan" required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="faculty@university.edu" required /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" placeholder="+92 300 1234567" /></div>
            <div className="space-y-2"><Label htmlFor="password">Temporary Password</Label><Input id="password" name="password" type="password" placeholder="Min 6 characters" required minLength={6} /></div>
            <p className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">⚠️ Share these credentials with the faculty member.</p>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
