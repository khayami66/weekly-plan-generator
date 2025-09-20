'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  role: 'homeroom' | 'specialist'
  grade?: number
  class_number?: number
}

interface Subject {
  id: string
  name: string
  category: string
}

interface UserSubject {
  id: string
  user_id: string
  subject_id: string
  grade: number
  class_number?: number
  publisher_id: string
  subjects: Subject
}

interface ScheduleCell {
  day: number // 1=月, 2=火, 3=水, 4=木, 5=金
  period: number
  subject_id?: string
  grade?: number
  class_number?: number
}

interface ScheduleSettingsProps {
  user: User
  userSubjects: UserSubject[]
  onSave: () => void
  onBack: () => void
}

export default function ScheduleSettings({ user, userSubjects, onSave, onBack }: ScheduleSettingsProps) {
  const [schedule, setSchedule] = useState<ScheduleCell[]>([])
  const [loading, setLoading] = useState(false)
  const [scheduleName, setScheduleName] = useState('基本時間割')
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [dailyPeriods, setDailyPeriods] = useState<Record<number, number>>({
    1: 6, // 月曜日
    2: 6, // 火曜日
    3: 6, // 水曜日
    4: 6, // 木曜日
    5: 6, // 金曜日
    6: 4  // 土曜日
  })
  const [isInitialized, setIsInitialized] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const daysOfWeek = useMemo(() => ['月', '火', '水', '木', '金', '土'], [])
  const maxPeriods = useMemo(() => Math.max(...Object.values(dailyPeriods)), [dailyPeriods])

  // 全教科データ + 特別活動を取得
  useEffect(() => {
    const loadAllSubjects = async () => {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (subjects) {
        // 委員会活動とクラブ活動、生活を追加
        const additionalSubjects = [
          { id: 'seikatsu', name: '生活', category: '主要教科' },
          { id: 'committee', name: '委員会活動', category: '特別活動' },
          { id: 'club', name: 'クラブ活動', category: '特別活動' }
        ]

        // カテゴリ順で並び替え（主要教科 → 専科教科 → その他）
        const allSubjectsData = [...subjects, ...additionalSubjects]
        const categoryOrder = ['主要教科', '専科教科', 'その他', '特別活動']

        const sortedSubjects = allSubjectsData.sort((a, b) => {
          const categoryA = categoryOrder.indexOf(a.category)
          const categoryB = categoryOrder.indexOf(b.category)

          if (categoryA !== categoryB) {
            return categoryA - categoryB
          }

          // 同じカテゴリ内では名前順
          return a.name.localeCompare(b.name, 'ja')
        })

        setAllSubjects(sortedSubjects)
      }
    }

    loadAllSubjects()
  }, [supabase])

  // 初期化と既存データ読み込みを統合
  useEffect(() => {
    const initializeSchedule = async () => {
      // まず既存データを確認
      try {
        const { data: existingSchedule } = await supabase
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

        if (existingSchedule?.schedule_details) {
          // 保存されているdaily_periodsを優先的に使用
          let savedPeriods: Record<number, number>

          if (existingSchedule.daily_periods) {
            // daily_periodsが保存されている場合はそれを使用
            savedPeriods = existingSchedule.daily_periods as Record<number, number>
            console.log('保存されたdailyPeriodsを復元:', savedPeriods)
          } else {
            // daily_periodsがない場合はschedule_detailsから計算
            savedPeriods = { 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 4 }
            existingSchedule.schedule_details.forEach((detail: any) => {
              const currentMax = savedPeriods[detail.day_of_week] || 0
              if (detail.period > currentMax) {
                savedPeriods[detail.day_of_week] = detail.period
              }
            })
            console.log('schedule_detailsから計算したdailyPeriods:', savedPeriods)
          }

          setDailyPeriods(savedPeriods)

          // 完全なスケジュールグリッドを作成
          const completeSchedule: ScheduleCell[] = []
          for (let day = 1; day <= 6; day++) {
            const periodsForDay = savedPeriods[day]
            for (let period = 1; period <= periodsForDay; period++) {
              const existingCell = existingSchedule.schedule_details.find(
                (detail: any) => detail.day_of_week === day && detail.period === period
              )

              completeSchedule.push({
                day,
                period,
                subject_id: existingCell?.subject_id,
                grade: existingCell?.grade || (user.role === 'homeroom' ? user.grade : undefined),
                class_number: existingCell?.class_number || (user.role === 'homeroom' ? user.class_number : undefined)
              })
            }
          }

          setSchedule(completeSchedule)
          setScheduleName(existingSchedule.name || '基本時間割')
          setIsInitialized(true)
          return
        }
      } catch (error) {
        console.log('既存の時間割データなし、新規作成します')
      }

      // 既存データがない場合は新規作成
      const defaultPeriods = { 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 4 }
      const initialSchedule: ScheduleCell[] = []
      for (let day = 1; day <= 6; day++) {
        const periodsForDay = defaultPeriods[day]
        for (let period = 1; period <= periodsForDay; period++) {
          initialSchedule.push({
            day,
            period,
            grade: user.role === 'homeroom' ? user.grade : undefined,
            class_number: user.role === 'homeroom' ? user.class_number : undefined
          })
        }
      }
      setSchedule(initialSchedule)
      setDailyPeriods(defaultPeriods)
      setIsInitialized(true)
    }

    initializeSchedule()
  }, [user, supabase]) // dailyPeriodsを依存関係から除外

  const updateCell = useCallback((day: number, period: number, updates: Partial<ScheduleCell>) => {
    setSchedule(prev => prev.map(cell =>
      cell.day === day && cell.period === period
        ? { ...cell, ...updates }
        : cell
    ))
  }, [])

  const getCellData = useCallback((day: number, period: number) => {
    return schedule.find(cell => cell.day === day && cell.period === period)
  }, [schedule])

  const getSubjectOptions = useMemo(() => {
    if (user.role === 'homeroom') {
      // 担任の場合は全教科を表示（時数管理のため）
      return allSubjects
    }
    // 専科の場合は担当教科のみ
    return userSubjects.map(us => us.subjects)
  }, [user.role, allSubjects, userSubjects])

  const getShortSubjectName = useCallback((name: string) => {
    const shortNames: Record<string, string> = {
      '図画工作': '図工',
      '総合的な学習の時間': '総合',
      '特別活動': '特活',
      'クラブ活動': 'クラブ',
      '委員会活動': '委員会'
    }
    return shortNames[name] || name
  }, [])

  const getSubjectNameById = useCallback((subjectId: string) => {
    // まず利用可能な教科から検索
    const subject = getSubjectOptions.find(s => s.id === subjectId)
    if (subject) {
      return getShortSubjectName(subject.name)
    }

    // 全教科から検索
    const allSubject = allSubjects.find(s => s.id === subjectId)
    if (allSubject) {
      return getShortSubjectName(allSubject.name)
    }

    // 特別活動の場合
    if (subjectId === 'committee') return '委員会'
    if (subjectId === 'club') return 'クラブ'
    if (subjectId === 'seikatsu') return '生活'

    return '不明'
  }, [getSubjectOptions, allSubjects, getShortSubjectName])

  const updateDailyPeriods = useCallback((day: number, periods: number) => {
    setDailyPeriods(prev => ({ ...prev, [day]: periods }))

    // スケジュールを更新（その日の時間数に合わせて調整）
    setSchedule(prev => {
      const newSchedule = [...prev]

      // 指定された日の古いセルを削除
      const filteredSchedule = newSchedule.filter(cell => cell.day !== day)

      // 新しい時間数でセルを追加
      for (let period = 1; period <= periods; period++) {
        const existingCell = prev.find(cell => cell.day === day && cell.period === period)
        filteredSchedule.push({
          day,
          period,
          subject_id: existingCell?.subject_id,
          grade: existingCell?.grade || (user.role === 'homeroom' ? user.grade : undefined),
          class_number: existingCell?.class_number || (user.role === 'homeroom' ? user.class_number : undefined)
        })
      }

      // 曜日と時限でソート
      return filteredSchedule.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day
        return a.period - b.period
      })
    })
  }, [user])

  const handleReset = useCallback(() => {
    if (confirm('時間割をリセットしますか？保存されていない変更は失われます。')) {
      // 空の時間割で初期化
      const resetSchedule: ScheduleCell[] = []
      for (let day = 1; day <= 6; day++) {
        const periodsForDay = dailyPeriods[day] || 6
        for (let period = 1; period <= periodsForDay; period++) {
          resetSchedule.push({
            day,
            period,
            grade: user.role === 'homeroom' ? user.grade : undefined,
            class_number: user.role === 'homeroom' ? user.class_number : undefined
          })
        }
      }
      setSchedule(resetSchedule)
      setScheduleName('基本時間割')
    }
  }, [dailyPeriods, user])

  const handleSave = useCallback(async () => {
    setLoading(true)
    console.log('保存開始 - dailyPeriods:', dailyPeriods)
    try {
      // 既存のデフォルト時間割があるかチェック
      const { data: existingSchedule } = await supabase
        .from('schedules')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      let scheduleId: string

      if (existingSchedule) {
        // 既存のスケジュールを更新
        const { data: updatedSchedule, error: updateError } = await supabase
          .from('schedules')
          .update({
            name: scheduleName,
            daily_periods: dailyPeriods
          })
          .eq('id', existingSchedule.id)
          .select()
          .single()

        if (updateError) throw updateError
        scheduleId = existingSchedule.id
      } else {
        // 新しいスケジュールを作成
        const { data: newSchedule, error: insertError } = await supabase
          .from('schedules')
          .insert({
            user_id: user.id,
            name: scheduleName,
            is_default: true,
            start_date: null,
            end_date: null,
            daily_periods: dailyPeriods
          })
          .select()
          .single()

        if (insertError) throw insertError
        scheduleId = newSchedule.id
      }

      // 既存の時間割詳細を削除
      await supabase
        .from('schedule_details')
        .delete()
        .eq('schedule_id', scheduleId)

      // 新しい時間割詳細を保存
      const scheduleDetails = schedule
        .filter(cell => cell.subject_id)
        .map(cell => ({
          schedule_id: scheduleId,
          day_of_week: cell.day,
          period: cell.period,
          subject_id: cell.subject_id,
          grade: cell.grade,
          class_number: cell.class_number
        }))

      if (scheduleDetails.length > 0) {
        const { error: detailsError } = await supabase
          .from('schedule_details')
          .insert(scheduleDetails)

        if (detailsError) throw detailsError
      }

      console.log('保存完了 - dailyPeriods保存済み:', dailyPeriods)
      toast.success('時間割を保存しました！')
      onSave()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('保存に失敗しました。')
    } finally {
      setLoading(false)
    }
  }, [schedule, scheduleName, dailyPeriods, supabase, user.id, onSave])


  // 初期化が完了するまでローディング表示
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">基本時間割の設定</h2>
            <p className="text-sm text-gray-600">
              {user.role === 'homeroom' ? `${user.grade}年${user.class_number}組` : '専科教員'}の基本時間割を設定します
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleReset}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded text-sm"
            >
              リセット
            </button>
            <input
              type="text"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
              placeholder="時間割名"
            />
          </div>
        </div>

        {/* 曜日別時間数設定 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-3">曜日別時間数設定</h3>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {daysOfWeek.map((dayName, index) => {
              const dayNumber = index + 1
              return (
                <div key={dayNumber} className="flex flex-col items-center">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {dayName}曜日
                  </label>
                  <select
                    value={dailyPeriods[dayNumber] || 6}
                    onChange={(e) => updateDailyPeriods(dayNumber, parseInt(e.target.value))}
                    className="w-full text-center border border-gray-300 rounded px-2 py-1"
                  >
                    <option value={0}>0時間</option>
                    <option value={1}>1時間</option>
                    <option value={2}>2時間</option>
                    <option value={3}>3時間</option>
                    <option value={4}>4時間</option>
                    <option value={5}>5時間</option>
                    <option value={6}>6時間</option>
                  </select>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* 時間割グリッド */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="overflow-hidden">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr>
                <th className="border border-gray-300 p-1 bg-gray-50 text-center w-12 text-xs">時限</th>
                {daysOfWeek.map((day, index) => {
                  const dayNumber = index + 1
                  const periodsForDay = dailyPeriods[dayNumber] || 0
                  return (
                    <th key={day} className="border border-gray-300 p-1 bg-gray-50 text-center text-xs" style={{ width: `${(100 - 8) / 6}%` }}>
                      {day}
                      <div className="text-xs text-gray-500">({periodsForDay}h)</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
            {Array.from({ length: maxPeriods }, (_, periodIndex) => {
              const period = periodIndex + 1
              return (
                <tr key={period}>
                  <td className="border border-gray-300 p-1 bg-gray-50 text-center font-medium text-xs">
                    {period}
                  </td>
                  {[1, 2, 3, 4, 5, 6].map(day => {
                    const periodsForDay = dailyPeriods[day] || 0
                    const isValidCell = period <= periodsForDay
                    const cellData = getCellData(day, period)

                    if (!isValidCell) {
                      return (
                        <td key={`${day}-${period}`} className="border border-gray-300 p-1 bg-gray-100">
                          <div className="text-center text-gray-400 text-xs">－</div>
                        </td>
                      )
                    }

                    return (
                      <td key={`${day}-${period}`} className="border border-gray-300 p-0.5">
                        <select
                          value={cellData?.subject_id || ''}
                          onChange={(e) => updateCell(day, period, {
                            subject_id: e.target.value || undefined
                          })}
                          className="w-full text-xs border-0 bg-transparent px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
                          style={{ fontSize: '10px' }}
                        >
                          <option value="">選択</option>
                          {['主要教科', '専科教科', 'その他', '特別活動'].map(category => {
                            const categorySubjects = getSubjectOptions.filter(s => s.category === category)
                            if (categorySubjects.length === 0) return null

                            return (
                              <optgroup key={category} label={`━━ ${category} ━━`}>
                                {categorySubjects.map(subject => (
                                  <option key={subject.id} value={subject.id}>
                                    {getShortSubjectName(subject.name)}
                                    {user.role === 'specialist' && subject.grade && subject.class_number && ` (${subject.grade}-${subject.class_number})`}
                                  </option>
                                ))}
                              </optgroup>
                            )
                          })}
                        </select>

                        {cellData?.subject_id && (
                          <div className="text-xs text-gray-600 text-center truncate" style={{ fontSize: '9px' }}>
                            {getSubjectNameById(cellData.subject_id)}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* 保存・戻るボタン */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
        >
          戻る
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded"
        >
          {loading ? '保存中...' : '時間割を保存'}
        </button>
      </div>
    </div>
  )
}