'use client'

import { useState, useEffect } from 'react'
import { register } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

interface Program { id: string; name: string; departments: { name: string } | null }
interface Batch { id: string; name: string; program_id: string }

export default function RegisterPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [programId, setProgramId] = useState('')
  const [batchId, setBatchId] = useState('')

  useEffect(() => {
    fetch('/api/public/programs').then(r => r.json()).then(setPrograms)
  }, [])

  useEffect(() => {
    if (programId) {
      fetch(`/api/public/batches?program_id=${programId}`).then(r => r.json()).then(setBatches)
      setBatchId('')
    }
  }, [programId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('program_id', programId)
    fd.set('batch_id', batchId)
    const result = await register(fd)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Student Registration</CardTitle>
          <CardDescription>Create your student account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" placeholder="Muhammad Ali" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" placeholder="+92 300 1234567" />
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
              <Select onValueChange={(v: any) => setProgramId(v || '')} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.departments ? `(${p.departments.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select onValueChange={(v: any) => setBatchId(v || '')} disabled={!programId} required>
                <SelectTrigger>
                  <SelectValue placeholder={programId ? 'Select your batch' : 'Select program first'} />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Min 6 characters" required minLength={6} />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !programId || !batchId}>
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
