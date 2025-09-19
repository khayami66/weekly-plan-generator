import { createServerClientComponent } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DebugPage() {
  const supabase = await createServerClientComponent()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get user data from database
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user subjects
  const { data: userSubjects, error: userSubjectsError } = await supabase
    .from('user_subjects')
    .select('*')
    .eq('user_id', user.id)

  // Get all subjects and publishers for reference
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('name')

  const { data: publishers } = await supabase
    .from('publishers')
    .select('*')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">デバッグ情報</h1>
          <a href="/dashboard" className="text-blue-600 hover:underline">
            ← ダッシュボードに戻る
          </a>
        </header>

        <div className="space-y-6">
          {/* User Auth Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">認証ユーザー情報</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({
                id: user.id,
                email: user.email,
                created_at: user.created_at
              }, null, 2)}
            </pre>
          </div>

          {/* User Database Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">データベース内ユーザー情報</h2>
            {userDataError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <strong>エラー:</strong> {userDataError.message}
              </div>
            )}
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>

          {/* User Subjects */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">ユーザー教科設定</h2>
            {userSubjectsError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <strong>エラー:</strong> {userSubjectsError.message}
              </div>
            )}
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(userSubjects, null, 2)}
            </pre>
          </div>

          {/* Available Subjects */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">利用可能な教科</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(subjects, null, 2)}
            </pre>
          </div>

          {/* Available Publishers */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">利用可能な出版社</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(publishers, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}