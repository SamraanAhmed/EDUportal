'use client'

import { useState } from 'react'
import { updateStudentStatus, deleteStudent } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Trash2, CheckCircle, Clock } from 'lucide-react'

interface Student {
  id: string; full_name: string; email: string; phone: string | null; status: string; created_at: string
  programs: { name: string } | null
  batches: { name: string } | null
}

export function StudentsClient({ students }: { students: Student[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleApprove(id: string) {
    setLoading(id)
    const result = await updateStudentStatus(id, 'approved')
    setLoading(null)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Student approved!')
  }

  async function handleSetPending(id: string) {
    setLoading(id)
    const result = await updateStudentStatus(id, 'pending')
    setLoading(null)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Status updated!')
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove student ${name}? This action cannot be undone.`)) return
    const result = await deleteStudent(id)
    if ('error' in result) { toast.error(result.error); return }
    toast.success('Student removed!')
  }

  const pending = students.filter(s => s.status === 'pending')
  const approved = students.filter(s => s.status === 'approved')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm">{students.length} total · {pending.length} pending</p>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2"><Clock className="h-4 w-4" />Pending Approval ({pending.length})</h2>
          <div className="bg-white rounded-xl shadow-sm border border-yellow-100">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Program</TableHead><TableHead>Batch</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {pending.map(s => (
                  <TableRow key={s.id} className="bg-yellow-50/50">
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell className="text-gray-500">{s.email}</TableCell>
                    <TableCell className="text-gray-500">{s.programs?.name || '—'}</TableCell>
                    <TableCell className="text-gray-500">{s.batches?.name || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(s.id)} disabled={loading === s.id}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(s.id, s.full_name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Approved Students ({approved.length})</h2>
        <div className="bg-white rounded-xl shadow-sm border">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Program</TableHead><TableHead>Batch</TableHead><TableHead>Status</TableHead><TableHead className="w-28 text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {approved.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">No approved students yet.</TableCell></TableRow>}
              {approved.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="text-gray-500">{s.email}</TableCell>
                  <TableCell className="text-gray-500">{s.programs?.name || '—'}</TableCell>
                  <TableCell className="text-gray-500">{s.batches?.name || '—'}</TableCell>
                  <TableCell><Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="text-yellow-600 text-xs" onClick={() => handleSetPending(s.id)}>Set Pending</Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(s.id, s.full_name)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
