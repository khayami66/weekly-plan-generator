import { createServerClientComponent } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SimpleWeeklyPlan from '@/components/SimpleWeeklyPlan'

export default async function WeeklyPlanPage() {
  const supabase = await createServerClientComponent()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Check if user has completed setup
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() as { data: { role: 'homeroom' | 'specialist'; grade?: number; class_number?: number } | null }

  if (!userData) {
    redirect('/dashboard')
  }

  // Get user's subjects and textbooks
  const { data: userSubjects } = await supabase
    .from('user_subjects')
    .select(`
      *,
      subjects(*),
      publishers(*)
    `)
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                週案作成
              </h1>
              <p className="text-gray-600">
                {userData.role === 'homeroom' ? `${userData.grade}年${userData.class_number}組` : '専科教員'} - {user.email}
              </p>
            </div>
            <div className="space-x-4">
              <a 
                href="/dashboard"
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                ダッシュボード
              </a>
            </div>
          </div>
        </header>

        <SimpleWeeklyPlan
          user={{
            id: user.id,
            email: user.email!,
            role: userData.role,
            grade: userData.grade,
            class_number: userData.class_number
          }}
          userSubjects={userSubjects || []}
        />
      </div>
    </div>
  )
}