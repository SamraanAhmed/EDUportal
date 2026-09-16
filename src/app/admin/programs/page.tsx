import { createAdminClient } from '@/lib/supabase/admin'
import { ProgramsClient } from './client'

export default async function ProgramsPage() {
  const admin = createAdminClient()
  const [{ data: programs }, { data: departments }] = await Promise.all([
    admin.from('programs').select('*, departments(name)').order('name'),
    admin.from('departments').select('*').order('name'),
  ])
  return (
    <div className="p-8">
      <ProgramsClient programs={programs || []} departments={departments || []} />
    </div>
  )
}
