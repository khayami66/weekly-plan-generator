import { createServerClientComponent } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SetupWizard from '@/components/SetupWizardFixed'

interface PageProps {
  searchParams: Promise<{ step?: string }>
}

export default async function SettingsEdit({ searchParams }: PageProps) {
  const supabase = await createServerClientComponent()
  const resolvedSearchParams = await searchParams

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get current user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() as { data: { role: 'homeroom' | 'specialist'; grade?: number; class_number?: number } | null }

  if (!userData) {
    redirect('/settings')
  }

  // ステップ番号を取得（デフォルトは1）
  const step = parseInt(resolvedSearchParams.step || '1')

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                設定編集
              </h1>
              <p className="text-gray-600">
                {step === 1 && '基本情報の編集'}
                {step === 2 && '教科・教科書の編集'}
                {step === 3 && '教科書設定の編集'}
                {step === 4 && '基本時間割の編集'}
                {step === 5 && '設定確認'}
              </p>
            </div>
            <a
              href="/settings"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              設定画面に戻る
            </a>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <SetupWizard
            user={user}
            userData={userData}
            isEditMode={true}
            initialStep={step}
          />
        </div>
      </div>
    </div>
  )
}