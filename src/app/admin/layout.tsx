import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/actions/auth'
import Link from 'next/link'
import { BookOpen, Building2, GraduationCap, Layers, BookMarked, Users, UserCog, LogOut, LayoutDashboard } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/departments', label: 'Departments', icon: Building2 },
  { href: '/admin/programs', label: 'Programs', icon: GraduationCap },
  { href: '/admin/batches', label: 'Batches', icon: Layers },
  { href: '/admin/courses', label: 'Courses', icon: BookMarked },
  { href: '/admin/faculty', label: 'Faculty', icon: UserCog },
  { href: '/admin/students', label: 'Students', icon: Users },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile || profile.role !== 'superadmin') redirect('/')

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">EduPortal</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-3 px-3">{profile.full_name}</p>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-red-400 transition-colors text-sm w-full"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
