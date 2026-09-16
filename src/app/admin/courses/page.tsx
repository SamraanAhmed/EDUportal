import { createAdminClient } from '@/lib/supabase/admin'
import { CoursesClient } from './client'

export default async function CoursesPage() {
  const admin = createAdminClient()
  const [{ data: courses }, { data: batches }, { data: faculty }] = await Promise.all([
    admin.from('courses').select('*, batches(name, programs(name)), profiles(full_name)').order('name'),
    admin.from('batches').select('*, programs(name)').order('name'),
    admin.from('profiles').select('*').eq('role', 'faculty').order('full_name'),
  ])
  return (
    <div className="p-8">
      <CoursesClient courses={courses as any || []} batches={batches as any || []} faculty={faculty || []} />
    </div>
  )
}
