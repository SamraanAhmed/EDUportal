'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  redirect('/')
}

export async function register(formData: FormData) {
  const admin = createAdminClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const program_id = formData.get('program_id') as string
  const batch_id = formData.get('batch_id') as string

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return { error: authError.message }

  // Create profile
  const { error: profileError } = await admin.from('profiles').insert({
    id: authData.user!.id,
    full_name,
    email,
    phone: phone || null,
    role: 'student',
    status: 'pending',
    program_id: program_id || null,
    batch_id: batch_id || null,
  })

  if (profileError) {
    // Rollback auth user
    await admin.auth.admin.deleteUser(authData.user!.id)
    return { error: profileError.message }
  }

  // Auto sign in after registration
  const supabase = await createClient()
  await supabase.auth.signInWithPassword({ email, password })

  redirect('/student')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
