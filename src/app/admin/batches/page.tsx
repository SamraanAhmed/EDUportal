import { createAdminClient } from '@/lib/supabase/admin'
import { BatchesClient } from './client'

export default async function BatchesPage() {
  const admin = createAdminClient()
  const [{ data: batches }, { data: programs }] = await Promise.all([
    admin.from('batches').select('*, programs(name, departments(name))').order('name'),
    admin.from('programs').select('*, departments(name)').order('name'),
  ])
  return (
    <div className="p-8">
      <BatchesClient batches={batches || []} programs={programs || []} />
    </div>
  )
}
