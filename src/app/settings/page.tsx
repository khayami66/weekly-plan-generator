import { createServerClientComponent } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SetupWizard from '@/components/SetupWizardFixed'
import SettingsSummary from '@/components/SettingsSummary'

export default async function Settings() {
  const supabase = await createServerClientComponent()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get current user data
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  console.log('Settings page - User ID:', user.id)
  console.log('Settings page - User data:', userData)
  console.log('Settings page - User data error:', userDataError)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                設定変更
              </h1>
              <p className="text-gray-600">
                教科書や時間割の設定を変更できます
              </p>
            </div>
            <a
              href="/dashboard"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              ダッシュボードに戻る
            </a>
          </div>
        </header>

        {userData ? (
          <SettingsSummary
            user={{
              id: user.id,
              email: user.email!,
              role: userData.role,
              grade: userData.grade,
              class_number: userData.class_number
            }}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                まだ設定が保存されていません。<br />
                初期設定を行ってください。
              </p>
              <SetupWizard user={user} userData={undefined} isEditMode={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}