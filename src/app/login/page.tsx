import AuthButton from '@/components/AuthButton'

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🏫 週案くん
          </h1>
          <p className="text-gray-600">
            ログインが必要です
          </p>
        </div>
        
        <div className="mb-6">
          <AuthButton />
        </div>
        
        <p className="text-xs text-gray-500">
          Googleアカウントでログインしてください
        </p>
      </div>
    </div>
  )
}