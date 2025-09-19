'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export default function AuthTest() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(`Login error: ${error.message}`)
        console.error('Login error:', error)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Unexpected error: ${errorMsg}`)
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(`Logout error: ${error.message}`)
        console.error('Logout error:', error)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Unexpected error: ${errorMsg}`)
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        setError(`Database connection error: ${error.message}`)
      } else {
        setError(null)
        alert('✅ Supabase connection successful!')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Database connection failed: ${errorMsg}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🔐 Google OAuth認証テスト
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>エラー:</strong> {error}
          </div>
        )}

        <div className="space-y-6">
          {/* 認証状態表示 */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">認証状態</h2>
            {user ? (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">✅ ログイン済み</p>
                <div className="text-sm text-gray-600">
                  <p><strong>ユーザーID:</strong> {user.id}</p>
                  <p><strong>メール:</strong> {user.email}</p>
                  <p><strong>プロバイダー:</strong> {user.app_metadata.provider}</p>
                  <p><strong>最終ログイン:</strong> {new Date(user.last_sign_in_at!).toLocaleString('ja-JP')}</p>
                </div>
              </div>
            ) : (
              <p className="text-red-600 font-medium">❌ 未ログイン</p>
            )}
          </div>

          {/* ボタンエリア */}
          <div className="space-y-4">
            {!user ? (
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'ログイン中...' : 'Googleでログイン'}
              </button>
            ) : (
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'ログアウト中...' : 'ログアウト'}
              </button>
            )}

            <button
              onClick={testSupabaseConnection}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              🔌 Supabase接続テスト
            </button>
          </div>

          {/* テスト結果表示 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">テスト手順</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>「Supabase接続テスト」ボタンでデータベース接続を確認</li>
              <li>「Googleでログイン」ボタンでOAuth認証をテスト</li>
              <li>認証完了後、ユーザー情報が正しく表示されることを確認</li>
              <li>「ログアウト」ボタンで正常にログアウトできることを確認</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}