import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, GraduationCap, Layers, BookMarked, UserCog, Users } from 'lucide-react'

export default async function AdminDashboard() {
  const admin = createAdminClient()

  const [
    { count: deptCount },
    { count: programCount },
    { count: batchCount },
    { count: courseCount },
    { count: facultyCount },
    { count: studentCount },
    { count: pendingCount },
  ] = await Promise.all([
    admin.from('departments').select('*', { count: 'exact', head: true }),
    admin.from('programs').select('*', { count: 'exact', head: true }),
    admin.from('batches').select('*', { count: 'exact', head: true }),
    admin.from('courses').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'faculty'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'pending'),
  ])

  const stats = [
    { label: 'Departments', value: deptCount ?? 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Programs', value: programCount ?? 0, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Batches', value: batchCount ?? 0, icon: Layers, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Courses', value: courseCount ?? 0, icon: BookMarked, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Faculty', value: facultyCount ?? 0, icon: UserCog, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Students', value: studentCount ?? 0, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, Super Admin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`${bg} p-3 rounded-xl`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(pendingCount ?? 0) > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <p className="text-yellow-800 font-medium">
                {pendingCount} student{(pendingCount ?? 0) > 1 ? 's' : ''} pending approval
              </p>
              <a href="/admin/students" className="text-yellow-700 underline text-sm ml-auto">
                Review →
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
