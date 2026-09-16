export type Role = 'superadmin' | 'faculty' | 'student'
export type Status = 'pending' | 'approved'
export type TaskType = 'assignment' | 'quiz' | 'activity'

export interface Department {
  id: string
  name: string
  created_at: string
}

export interface Program {
  id: string
  name: string
  department_id: string
  created_at: string
  departments?: Department
}

export interface Batch {
  id: string
  name: string
  program_id: string
  created_at: string
  programs?: Program
}

export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: Role
  status: Status
  program_id: string | null
  batch_id: string | null
  created_at: string
  programs?: Program
  batches?: Batch
}

export interface Course {
  id: string
  name: string
  description: string | null
  batch_id: string
  faculty_id: string | null
  created_at: string
  batches?: Batch
  profiles?: Profile
}

export interface Task {
  id: string
  title: string
  type: TaskType
  description: string | null
  course_id: string
  due_date: string | null
  file_url: string | null
  created_by: string | null
  created_at: string
  courses?: Course
}

export interface Submission {
  id: string
  task_id: string
  student_id: string
  file_url: string | null
  submitted_at: string
  score: number | null
  feedback: string | null
  graded_at: string | null
  graded_by: string | null
  tasks?: Task
  profiles?: Profile
}
