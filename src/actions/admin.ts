'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ─── DEPARTMENTS ────────────────────────────────────────────
export async function createDepartment(formData: FormData) {
  const admin = createAdminClient()
  const name = formData.get('name') as string
  const { error } = await admin.from('departments').insert({ name })
  if (error) return { error: error.message }
  revalidatePath('/admin/departments')
  return { success: true }
}

export async function updateDepartment(id: string, formData: FormData) {
  const admin = createAdminClient()
  const name = formData.get('name') as string
  const { error } = await admin.from('departments').update({ name }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/departments')
  return { success: true }
}

export async function deleteDepartment(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('departments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/departments')
  return { success: true }
}

// ─── PROGRAMS ───────────────────────────────────────────────
export async function createProgram(formData: FormData) {
  const admin = createAdminClient()
  const name = formData.get('name') as string
  const department_id = formData.get('department_id') as string
  const { error } = await admin.from('programs').insert({ name, department_id })
  if (error) return { error: error.message }
  revalidatePath('/admin/programs')
  return { success: true }
}

export async function updateProgram(id: string, formData: FormData) {
  const admin = createAdminClient()
  const name = formData.get('name') as string
  const department_id = formData.get('department_id') as string
  const { error } = await admin.from('programs').update({ name, department_id }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/programs')
  return { success: true }
}

export async function deleteProgram(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('programs').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/programs')
  return { success: true }
}

// ─── BATCHES ────────────────────────────────────────────────
export async function createBatch(formData: FormData) {
  const admin = createAdminClient()
  const name = formData.get('name') as string
  const program_id = formData.get('program_id') as string
  const { error } = await admin.from('batches').insert({ name, program_id })
  if (error) return { error: error.message }
  revalidatePath('/admin/batches')
  return { success: true }
}

export async function updateBatch(id: string, formData: FormData) {
  const admin = createAdminClient()
  const name = formData.get('name') as string
  const program_id = formData.get('program_id') as string
  const { error } = await admin.from('batches').update({ name, program_id }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/batches')
  return { success: true }
}

export async function deleteBatch(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('batches').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/batches')
  return { success: true }
}

// ─── COURSES ────────────────────────────────────────────────
export async function createCourse(formData: FormData) {
  const admin = createAdminClient()
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const batch_id = formData.get('batch_id') as string
  const faculty_id = formData.get('faculty_id') as string
  const resource_url = formData.get('resource_url') as string
  const { error } = await admin.from('courses').insert({
    name,
    description: description || null,
    batch_id,
    faculty_id: faculty_id || null,
    resource_url: resource_url || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
  return { success: true }
}

export async function updateCourse(id: string, formData: FormData) {
  const admin = createAdminClient()
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const batch_id = formData.get('batch_id') as string
  const faculty_id = formData.get('faculty_id') as string
  const resource_url = formData.get('resource_url') as string
  const { error } = await admin.from('courses').update({
    name,
    description: description || null,
    batch_id,
    faculty_id: faculty_id || null,
    resource_url: resource_url || null,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
  return { success: true }
}

export async function deleteCourse(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('courses').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
  return { success: true }
}

// ─── FACULTY ────────────────────────────────────────────────
export async function createFaculty(formData: FormData) {
  const admin = createAdminClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return { error: authError.message }

  const { error: profileError } = await admin.from('profiles').insert({
    id: authData.user!.id,
    full_name,
    email,
    phone: phone || null,
    role: 'faculty',
    status: 'approved',
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user!.id)
    return { error: profileError.message }
  }

  revalidatePath('/admin/faculty')
  return { success: true }
}

export async function deleteFaculty(id: string) {
  const admin = createAdminClient()
  const { error: pErr } = await admin.from('profiles').delete().eq('id', id)
  if (pErr) return { error: pErr.message }
  const { error: uErr } = await admin.auth.admin.deleteUser(id)
  if (uErr) return { error: uErr.message }
  revalidatePath('/admin/faculty')
  return { success: true }
}

// ─── STUDENTS ────────────────────────────────────────────────
export async function updateStudentStatus(id: string, status: 'approved' | 'pending') {
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/students')
  return { success: true }
}

export async function deleteStudent(id: string) {
  const admin = createAdminClient()
  const { error: pErr } = await admin.from('profiles').delete().eq('id', id)
  if (pErr) return { error: pErr.message }
  const { error: uErr } = await admin.auth.admin.deleteUser(id)
  if (uErr) return { error: uErr.message }
  revalidatePath('/admin/students')
  return { success: true }
}
