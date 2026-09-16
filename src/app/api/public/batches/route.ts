import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const program_id = searchParams.get('program_id')
  const admin = createAdminClient()
  let query = admin.from('batches').select('id, name, program_id').order('name')
  if (program_id) query = query.eq('program_id', program_id)
  const { data } = await query
  return NextResponse.json(data || [])
}
