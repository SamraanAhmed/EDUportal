import { createAdminClient } from '@/lib/supabase/admin'
import { StudentsClient } from './client'

export default async function StudentsPage() {
  const admin = createAdminClient()
  const { data: students } = await admin
    .from('profiles')
    .select('*, programs(name), batches(name)')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
  return (
    <div className="p-8">
      <StudentsClient students={students as any || []} />
    </div>
  )
}
