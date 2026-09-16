import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function StudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Get student profile for batch_id
  const { data: profile } = await admin
    .from('profiles')
    .select('batch_id')
    .eq('id', user.id)
    .single()

  const batchId = profile?.batch_id

  const courses = batchId
    ? (await admin
        .from('courses')
        .select('*, profiles(full_name, email)')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false })
      ).data
    : []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="mt-1 text-sm text-gray-500">Browse your enrolled courses</p>
      </div>

      {!courses || courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <BookOpen className="h-10 w-10 text-gray-300" />
          <h3 className="mt-4 text-base font-semibold text-gray-700">No courses available</h3>
          <p className="mt-1 text-sm text-gray-400">
            Courses for your batch will appear here once they&apos;re created.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const faculty = course.profiles as { full_name: string } | null

            return (
              <Card key={course.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 leading-snug">
                    {course.name}
                  </CardTitle>
                  {faculty && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500">{faculty.full_name}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col flex-1 pt-0">
                  {course.description && (
                    <CardDescription className="text-sm text-gray-500 line-clamp-2 flex-1">
                      {course.description}
                    </CardDescription>
                  )}
                  <div className="mt-4">
                    <Link href={`/student/courses/${course.id}`}>
                      <Button size="sm" className="w-full gap-1">
                        Open Course <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
