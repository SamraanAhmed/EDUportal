import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, LogOut, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logout } from '@/actions/auth'

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'faculty') redirect('/')

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed inset-y-0 left-0 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-700">
          <BookOpen className="h-6 w-6 text-blue-400" />
          <span className="text-xl font-bold tracking-tight">EduPortal</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link
            href="/faculty"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-sm font-medium">My Courses</span>
          </Link>
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-gray-700">
          <div className="px-3 py-2 text-xs text-gray-500 truncate">{profile.full_name}</div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  )
}
