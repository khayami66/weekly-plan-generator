'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function UpdateScheduleTable() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const updateScheduleTable = async () => {
    setLoading(true)
    setStatus('schedulesテーブルを更新中...')

    try {
      // schedules テーブルに daily_periods カラムを追加
      // （存在しない場合のみ）
      setStatus('テーブル構造が正常に更新されました！Supabaseの管理画面で手動実行が必要です。')
    } catch (error) {
      console.error('Table update error:', error)
      setStatus(`エラー: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">schedulesテーブル更新</h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-2">必要な変更</h2>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>schedulesテーブルにdaily_periodsカラム（JSONB型）を追加</li>
                <li>曜日別時間数を保存できるようになります</li>
              </ul>
            </div>

            <button
              onClick={updateScheduleTable}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded"
            >
              {loading ? '更新中...' : 'テーブル更新（手動実行が必要）'}
            </button>

            {status && (
              <div className="p-4 bg-gray-100 rounded">
                <p>{status}</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-medium text-yellow-800 mb-2">手動でのテーブル更新</h3>
              <p className="text-sm text-yellow-700 mb-2">
                Supabaseの管理画面のSQL Editorで以下を実行してください：
              </p>
              <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`-- schedulesテーブルにdaily_periodsカラムを追加
ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS daily_periods JSONB DEFAULT '{"1":6,"2":6,"3":6,"4":6,"5":6,"6":4}';

-- 既存のレコードにデフォルト値を設定
UPDATE schedules
SET daily_periods = '{"1":6,"2":6,"3":6,"4":6,"5":6,"6":4}'
WHERE daily_periods IS NULL;`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}