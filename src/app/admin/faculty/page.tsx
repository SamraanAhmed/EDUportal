import { createAdminClient } from '@/lib/supabase/admin'
import { FacultyClient } from './client'

export default async function FacultyPage() {
  const admin = createAdminClient()
  const { data: faculty } = await admin.from('profiles').select('*').eq('role', 'faculty').order('full_name')
  return (
    <div className="p-8">
      <FacultyClient faculty={faculty || []} />
    </div>
  )
}
