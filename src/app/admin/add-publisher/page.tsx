'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function AddPublisher() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const addNoTextbookPublisher = async () => {
    setLoading(true)
    try {
      // Check if "教科書なし" publisher already exists
      const { data: existing } = await supabase
        .from('publishers')
        .select('*')
        .eq('code', 'none')
        .single()

      if (existing) {
        setStatus('「教科書なし」出版社は既に存在します')
        return
      }

      // Insert "教科書なし" publisher
      const { data, error } = await supabase
        .from('publishers')
        .insert({
          name: '教科書なし',
          code: 'none'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setStatus('「教科書なし」出版社を追加しました')
    } catch (error) {
      console.error('エラー:', error)
      setStatus(`エラー: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">出版社管理</h1>

          <div className="space-y-4">
            <button
              onClick={addNoTextbookPublisher}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded"
            >
              {loading ? '追加中...' : '「教科書なし」出版社を追加'}
            </button>

            {status && (
              <div className="p-4 bg-gray-100 rounded">
                <p>{status}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}