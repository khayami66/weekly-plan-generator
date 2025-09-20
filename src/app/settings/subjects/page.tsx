import { createServerClientComponent } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SubjectsView from '@/components/SubjectsView'

export default async function SubjectsPage() {
  const supabase = await createServerClientComponent()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get current user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/settings')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                教科・教科書設定
              </h1>
              <p className="text-gray-600">
                担当教科と使用教科書の確認・変更ができます
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

        <SubjectsView
          user={{
            id: user.id,
            email: user.email!,
            role: userData.role,
            grade: userData.grade,
            class_number: userData.class_number
          }}
        />
      </div>
    </div>
  )
}