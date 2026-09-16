import { createAdminClient } from '@/lib/supabase/admin'
import { DepartmentsClient } from './client'

export default async function DepartmentsPage() {
  const admin = createAdminClient()
  const { data: departments } = await admin.from('departments').select('*').order('name')
  return (
    <div className="p-8">
      <DepartmentsClient departments={departments || []} />
    </div>
  )
}
