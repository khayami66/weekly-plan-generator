'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { User, Subject, UserSubject, Schedule } from '@/types/common'

interface SettingsSummaryProps {
  user: User
}

export default function SettingsSummary({ user }: SettingsSummaryProps) {
  const [userSubjects, setUserSubjects] = useState<UserSubject[]>([])
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])

  const supabase = createClient()

  const handleEditSection = (section: 'basic' | 'subjects' | 'schedule') => {
    const stepMap = {
      basic: 1,
      subjects: 2,
      schedule: 4
    }
    window.location.href = `/settings/edit?step=${stepMap[section]}`
  }

  const handleViewSubjects = () => {
    window.location.href = '/settings/subjects'
  }

  useEffect(() => {
    const loadSettingsData = async () => {
      setLoading(true)
      try {
        // 全教科データの取得
        const { data: allSubjectsData } = await supabase
          .from('subjects')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (allSubjectsData) {
          // 委員会活動とクラブ活動、生活を追加
          const additionalSubjects = [
            { id: 'seikatsu', name: '生活', category: '主要教科' },
            { id: 'committee', name: '委員会活動', category: '特別活動' },
            { id: 'club', name: 'クラブ活動', category: '特別活動' }
          ]
          setAllSubjects([...allSubjectsData, ...additionalSubjects])
        }

        // ユーザー担当教科・教科書データの取得
        const { data: subjectsData } = await supabase
          .from('user_subjects')
          .select(`
            *,
            subjects(*),
            publishers(*)
          `)
          .eq('user_id', user.id)

        if (subjectsData) {
          setUserSubjects(subjectsData)
        }

        // 基本時間割データの取得
        const { data: scheduleData } = await supabase
          .from('schedules')
          .select(`
            id,
            name,
            is_default,
            daily_periods,
            schedule_details(
              day_of_week,
              period,
              subject_id,
              grade,
              class_number
            )
          `)
          .eq('user_id', user.id)
          .eq('is_default', true)
          .single()

        if (scheduleData) {
          setSchedule(scheduleData as Schedule)
        }
      } catch (error) {
        console.error('設定データの読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettingsData()
  }, [supabase, user.id])

  const daysOfWeek = ['月', '火', '水', '木', '金', '土']

  const getSubjectNameById = (subjectId: string) => {
    // 全教科から検索
    const subject = allSubjects.find(s => s.id === subjectId)
    if (subject) {
      // 短縮名を適用
      const shortNames: Record<string, string> = {
        '図画工作': '図工',
        '総合的な学習の時間': '総合',
        '特別活動': '特活',
        'クラブ活動': 'クラブ',
        '委員会活動': '委員会'
      }
      return shortNames[subject.name] || subject.name
    }

    // 特別活動の場合
    if (subjectId === 'committee') return '委員会'
    if (subjectId === 'club') return 'クラブ'
    if (subjectId === 'seikatsu') return '生活'

    return '不明'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">基本情報</h3>
            <p className="text-sm text-gray-600">役割と担当クラスの設定</p>
          </div>
          <button
            onClick={() => handleEditSection('basic')}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm"
          >
            編集
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">役割</p>
            <p className="text-gray-900">{user.role === 'homeroom' ? '学級担任' : '専科教員'}</p>
          </div>
          {user.role === 'homeroom' && (
            <div>
              <p className="text-sm font-medium text-gray-700">担当学級</p>
              <p className="text-gray-900">{user.grade}年{user.class_number}組</p>
            </div>
          )}
        </div>
      </div>

      {/* 教科・教科書設定 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">教科・教科書設定</h3>
            <p className="text-sm text-gray-600">担当教科と使用教科書の設定</p>
          </div>
          <button
            onClick={handleViewSubjects}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm"
          >
            確認
          </button>
        </div>

        {userSubjects.length > 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-700">
              <span className="font-medium">{userSubjects.length}教科</span>が設定済みです
            </p>
            <p className="text-sm text-gray-500 mt-1">
              詳細の確認や変更は「確認」ボタンからお進みください
            </p>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">教科・教科書が設定されていません</p>
        )}
      </div>

      {/* 基本時間割設定 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">基本時間割</h3>
            <p className="text-sm text-gray-600">週案作成で使用する基本時間割</p>
          </div>
          <button
            onClick={() => handleEditSection('schedule')}
            className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1 rounded text-sm"
          >
            編集
          </button>
        </div>

        {schedule ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-gray-50">時限</th>
                  {daysOfWeek.map(day => (
                    <th key={day} className="border border-gray-300 p-2 bg-gray-50">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6].map(period => (
                  <tr key={period}>
                    <td className="border border-gray-300 p-2 bg-gray-50 text-center font-medium">
                      {period}
                    </td>
                    {[1, 2, 3, 4, 5, 6].map(day => {
                      const cell = schedule.schedule_details.find(
                        detail => detail.day_of_week === day && detail.period === period
                      )
                      return (
                        <td key={`${day}-${period}`} className="border border-gray-300 p-2 text-center">
                          {cell ? (
                            <div>
                              <div className="font-medium">{getSubjectNameById(cell.subject_id)}</div>
                              {user.role === 'specialist' && cell.grade && cell.class_number && (
                                <div className="text-xs text-gray-500">
                                  {cell.grade}-{cell.class_number}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">基本時間割が設定されていません</p>
        )}
      </div>

      {/* 設定完了状況 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">設定完了状況</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              user.role ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span className="text-sm">基本情報</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              userSubjects.length > 0 ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span className="text-sm">教科・教科書</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              schedule ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span className="text-sm">基本時間割</span>
          </div>
        </div>
      </div>
    </div>
  )
}