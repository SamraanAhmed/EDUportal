import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('programs')
    .select('id, name, departments(name)')
    .order('name')
  return NextResponse.json(data || [])
}
