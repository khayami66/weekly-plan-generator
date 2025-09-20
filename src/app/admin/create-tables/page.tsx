'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function CreateTables() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const createTables = async () => {
    setLoading(true)
    setStatus('テーブルを作成中...')

    try {
      // Create schedules table
      const { error: schedulesError } = await supabase.rpc('create_schedules_table', {})

      if (schedulesError && !schedulesError.message.includes('already exists')) {
        console.error('Schedules table error:', schedulesError)
        setStatus(`Schedulesテーブルエラー: ${schedulesError.message}`)
        return
      }

      // Create schedule_details table
      const { error: detailsError } = await supabase.rpc('create_schedule_details_table', {})

      if (detailsError && !detailsError.message.includes('already exists')) {
        console.error('Schedule details table error:', detailsError)
        setStatus(`Schedule detailsテーブルエラー: ${detailsError.message}`)
        return
      }

      setStatus('テーブルが正常に作成されました！')
    } catch (error) {
      console.error('Table creation error:', error)
      setStatus(`エラー: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const createTablesDirectly = async () => {
    setLoading(true)
    setStatus('SQLで直接テーブルを作成中...')

    try {
      // First try to create schedules table with direct SQL
      const schedulesSQL = `
        CREATE TABLE IF NOT EXISTS schedules (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL DEFAULT '基本時間割',
          is_default BOOLEAN DEFAULT false,
          start_date DATE,
          end_date DATE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

        -- RLS Policies
        CREATE POLICY "Users can view their own schedules" ON schedules
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own schedules" ON schedules
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own schedules" ON schedules
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own schedules" ON schedules
          FOR DELETE USING (auth.uid() = user_id);
      `

      const scheduleDetailsSQL = `
        CREATE TABLE IF NOT EXISTS schedule_details (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
          day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
          period INTEGER NOT NULL CHECK (period >= 1),
          subject_id TEXT,
          grade INTEGER,
          class_number INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE schedule_details ENABLE ROW LEVEL SECURITY;

        -- RLS Policies
        CREATE POLICY "Users can view their own schedule details" ON schedule_details
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM schedules
              WHERE schedules.id = schedule_details.schedule_id
              AND schedules.user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can insert their own schedule details" ON schedule_details
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM schedules
              WHERE schedules.id = schedule_details.schedule_id
              AND schedules.user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can update their own schedule details" ON schedule_details
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM schedules
              WHERE schedules.id = schedule_details.schedule_id
              AND schedules.user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can delete their own schedule details" ON schedule_details
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM schedules
              WHERE schedules.id = schedule_details.schedule_id
              AND schedules.user_id = auth.uid()
            )
          );
      `

      const { error: sqlError1 } = await supabase.rpc('exec_sql', { sql: schedulesSQL })
      const { error: sqlError2 } = await supabase.rpc('exec_sql', { sql: scheduleDetailsSQL })

      if (sqlError1) {
        console.error('SQL Error 1:', sqlError1)
      }
      if (sqlError2) {
        console.error('SQL Error 2:', sqlError2)
      }

      if (!sqlError1 && !sqlError2) {
        setStatus('テーブルが正常に作成されました！')
      } else {
        setStatus('エラーが発生しました。コンソールを確認してください。')
      }

    } catch (error) {
      console.error('Direct SQL error:', error)
      setStatus(`SQLエラー: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">テーブル作成</h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-2">必要なテーブル</h2>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>schedules - 時間割の基本情報</li>
                <li>schedule_details - 時間割の詳細（各コマの情報）</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                onClick={createTables}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded"
              >
                {loading ? '作成中...' : 'RPC関数でテーブル作成'}
              </button>

              <button
                onClick={createTablesDirectly}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded"
              >
                {loading ? '作成中...' : 'SQL直接実行'}
              </button>
            </div>

            {status && (
              <div className="p-4 bg-gray-100 rounded">
                <p>{status}</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-medium text-yellow-800 mb-2">手動でのテーブル作成</h3>
              <p className="text-sm text-yellow-700 mb-2">
                上記のボタンが動作しない場合は、Supabaseの管理画面のSQL Editorで以下を実行してください：
              </p>
              <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`-- schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '基本時間割',
  is_default BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own schedules" ON schedules
  FOR ALL USING (auth.uid() = user_id);

-- schedule_details table
CREATE TABLE IF NOT EXISTS schedule_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  period INTEGER NOT NULL CHECK (period >= 1),
  subject_id TEXT,
  grade INTEGER,
  class_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE schedule_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own schedule details" ON schedule_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM schedules
      WHERE schedules.id = schedule_details.schedule_id
      AND schedules.user_id = auth.uid()
    )
  );`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}