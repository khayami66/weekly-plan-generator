import { createServerClientComponent } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SetupWizard from '@/components/SetupWizardFixed'

export default async function Dashboard() {
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
    .single()

  if (!userData) {
    // First time user - show setup wizard
    return <SetupWizard user={user} />
  }

  // Existing user - show dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                週案くん ダッシュボード
              </h1>
              <p className="text-gray-600">
                {userData.role === 'homeroom' ? '学級担任' : '専科教員'} - {user.email}
              </p>
            </div>
            <form action="/auth/logout" method="post">
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                ログアウト
              </button>
            </form>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">週案作成</h2>
            <p className="text-gray-600 mb-4">新しい週案を作成します</p>
            <a 
              href="/weekly-plan"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full text-center block"
            >
              週案を作成
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">時数管理</h2>
            <p className="text-gray-600 mb-4">進度と時数を確認します</p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full">
              時数を確認
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">設定</h2>
            <p className="text-gray-600 mb-4">教科書や時間割を設定します</p>
            <a
              href="/settings"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded w-full text-center block"
            >
              設定を変更
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}