'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { adjustWeeklyPlanHours, generateAdjustmentSuggestions, calculateWeeklyHoursSummary } from '@/utils/scheduleAdjustment'
import toast from 'react-hot-toast'
import type { User, UserSubject, TextbookUnit, WeeklyPlanCell } from '@/types/common'

interface WeeklyPlanGeneratorProps {
  user: User
  userSubjects: UserSubject[]
}

export default function WeeklyPlanGenerator({ user, userSubjects }: WeeklyPlanGeneratorProps) {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    return monday.toISOString().split('T')[0]
  })
  
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanCell[]>([])
  const [availableUnits, setAvailableUnits] = useState<Record<string, TextbookUnit[]>>({})
  const [loading, setLoading] = useState(false)
  const [, setTimeAdjustment] = useState<{
    day: number
    period: number
    fraction: number
  } | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const daysOfWeek = ['月', '火', '水', '木', '金']
  const periods = [1, 2, 3, 4, 5, 6]

  // Load textbook units for user's subjects
  useEffect(() => {
    const loadUnits = async () => {
      const unitsData: Record<string, TextbookUnit[]> = {}
      
      for (const userSubject of userSubjects) {
        const { data: units } = await supabase
          .from('textbook_units')
          .select('*')
          .eq('subject_id', userSubject.subject_id)
          .eq('publisher_id', userSubject.publisher_id)
          .eq('grade', userSubject.grade)
          .order('unit_order')

        if (units) {
          const key = `${userSubject.subject_id}_${userSubject.grade}_${userSubject.class_number || 0}`
          unitsData[key] = units
        }
      }
      
      setAvailableUnits(unitsData)
    }

    loadUnits()
  }, [userSubjects, supabase])

  // Initialize empty weekly plan
  useEffect(() => {
    const initializePlan = () => {
      const plan: WeeklyPlanCell[] = []
      
      if (user.role === 'homeroom') {
        // Generate for single class
        for (let day = 1; day <= 5; day++) {
          for (let period = 1; period <= 6; period++) {
            plan.push({
              day,
              period,
              grade: user.grade,
              class_number: user.class_number,
              hours: 1.0
            })
          }
        }
      } else {
        // Generate for specialist (multiple classes)
        for (let day = 1; day <= 5; day++) {
          for (let period = 1; period <= 6; period++) {
            plan.push({
              day,
              period,
              hours: 1.0
            })
          }
        }
      }
      
      setWeeklyPlan(plan)
    }

    initializePlan()
  }, [user])

  const getWeekDateRange = useCallback((weekStart: string) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 4) // Friday

    return {
      start: start.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
      end: end.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    }
  }, [])

  const updateCell = useCallback((day: number, period: number, updates: Partial<WeeklyPlanCell>) => {
    setWeeklyPlan(prev => prev.map(cell =>
      cell.day === day && cell.period === period
        ? { ...cell, ...updates }
        : cell
    ))
  }, [])

  const getCellData = useCallback((day: number, period: number) => {
    return weeklyPlan.find(cell => cell.day === day && cell.period === period)
  }, [weeklyPlan])

  const getSubjectOptions = useMemo(() => {
    if (user.role === 'homeroom') {
      return userSubjects.filter(us => us.grade === user.grade)
    }
    return userSubjects
  }, [user.role, user.grade, userSubjects])

  const getUnitOptions = useCallback((subjectId: string, grade: number, classNumber?: number) => {
    const key = `${subjectId}_${grade}_${classNumber || 0}`
    return availableUnits[key] || []
  }, [availableUnits])

  const handleTimeAdjustment = useCallback((day: number, period: number, fraction: number) => {
    const subjectHours = 1 - fraction

    updateCell(day, period, { hours: subjectHours })
    setTimeAdjustment(null)
  }, [updateCell, setTimeAdjustment])

  const handleAutoAdjustment = useCallback(async () => {
    setLoading(true)
    try {
      // 自動時数調整を実行
      const adjustedPlan = adjustWeeklyPlanHours(weeklyPlan)
      setWeeklyPlan(adjustedPlan)

      // 調整結果のサマリーを取得
      const summary = calculateWeeklyHoursSummary(adjustedPlan)
      const suggestions = generateAdjustmentSuggestions(adjustedPlan, [])

      // 結果を通知
      toast.success(`時数調整完了！${summary.adjustedCells}コマを調整しました。`)

      if (suggestions.length > 0) {
        console.log('調整推奨事項:', suggestions)
      }
    } catch (error) {
      console.error('時数調整エラー:', error)
      toast.error('時数調整に失敗しました。')
    } finally {
      setLoading(false)
    }
  }, [weeklyPlan])

  const generateAutoSuggestion = async () => {
    setLoading(true)
    try {
      // Simple auto-suggestion logic
      const suggestions = [...weeklyPlan]
      
      if (user.role === 'homeroom') {
        // Basic pattern for homeroom teacher
        const subjectRotation = userSubjects.filter(us => us.grade === user.grade)
        let subjectIndex = 0
        
        suggestions.forEach((cell, index) => {
          if (cell.day <= 5 && cell.period <= 4) { // Main periods only
            const subject = subjectRotation[subjectIndex % subjectRotation.length]
            suggestions[index] = {
              ...cell,
              subject_id: subject.subject_id,
              grade: user.grade,
              class_number: user.class_number
            }
            subjectIndex++
          }
        })
      }
      
      setWeeklyPlan(suggestions)
    } catch (error) {
      console.error('Auto-suggestion error:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveWeeklyPlan = async () => {
    setLoading(true)
    try {
      const weekStart = new Date(selectedWeek)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 4)

      // Create weekly plan record
      const { data: planData, error: planError } = await supabase
        .from('weekly_plans')
        .insert({
          user_id: user.id,
          academic_year: new Date().getFullYear(),
          week_start_date: weekStart.toISOString().split('T')[0],
          week_end_date: weekEnd.toISOString().split('T')[0],
          status: 'draft'
        })
        .select()
        .single()

      if (planError) throw planError

      // Save plan details
      for (const cell of weeklyPlan) {
        if (cell.subject_id) {
          const { error: detailError } = await supabase
            .from('weekly_plan_details')
            .insert({
              weekly_plan_id: planData.id,
              day_of_week: cell.day,
              period: cell.period,
              subject_id: cell.subject_id,
              unit_id: cell.unit_id,
              grade: cell.grade,
              class_number: cell.class_number,
              hours: cell.hours,
              memo: cell.memo
            })

          if (detailError) throw detailError
        }
      }

      alert('週案が保存されました！')
    } catch (error) {
      console.error('Save error:', error)
      alert('保存に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const dateRange = useMemo(() => getWeekDateRange(selectedWeek), [getWeekDateRange, selectedWeek])

  return (
    <div className="space-y-6">
      {/* Week Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">週選択</h2>
            <p className="text-sm text-gray-600">
              {dateRange.start} ～ {dateRange.end}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
            <button
              onClick={generateAutoSuggestion}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded"
            >
              {loading ? '生成中...' : '自動生成'}
            </button>
            <button
              onClick={handleAutoAdjustment}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white px-4 py-2 rounded"
            >
              {loading ? '調整中...' : '時数調整'}
            </button>
            <button
              onClick={saveWeeklyPlan}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Plan Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 bg-gray-50">時間</th>
                {daysOfWeek.map(day => (
                  <th key={day} className="border border-gray-300 p-2 bg-gray-50 min-w-[200px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period}>
                  <td className="border border-gray-300 p-2 bg-gray-50 text-center font-medium">
                    {period}
                  </td>
                  {[1, 2, 3, 4, 5].map(day => {
                    const cellData = getCellData(day, period)
                    const selectedSubject = userSubjects.find(us => us.subject_id === cellData?.subject_id)
                    const units = selectedSubject ? getUnitOptions(
                      selectedSubject.subject_id,
                      selectedSubject.grade,
                      selectedSubject.class_number
                    ) : []

                    return (
                      <td key={`${day}-${period}`} className="border border-gray-300 p-2">
                        <div className="space-y-2">
                          {/* Subject Selection */}
                          <select
                            value={cellData?.subject_id || ''}
                            onChange={(e) => updateCell(day, period, { 
                              subject_id: e.target.value || undefined,
                              unit_id: undefined // Reset unit when subject changes
                            })}
                            className="w-full text-xs border border-gray-200 rounded px-1 py-1"
                          >
                            <option value="">選択</option>
                            {getSubjectOptions().map(userSubject => (
                              <option key={userSubject.id} value={userSubject.subject_id}>
                                {userSubject.subjects.name}
                                {user.role === 'specialist' && ` (${userSubject.grade}-${userSubject.class_number})`}
                              </option>
                            ))}
                          </select>

                          {/* Unit Selection */}
                          {cellData?.subject_id && (
                            <select
                              value={cellData?.unit_id || ''}
                              onChange={(e) => updateCell(day, period, { unit_id: e.target.value || undefined })}
                              className="w-full text-xs border border-gray-200 rounded px-1 py-1"
                            >
                              <option value="">単元選択</option>
                              {units.map(unit => (
                                <option key={unit.id} value={unit.id}>
                                  {unit.unit_name}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Time Adjustment */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              {cellData?.hours || 1}時間
                            </span>
                            {cellData?.hours !== 1 && (
                              <button
                                onClick={() => updateCell(day, period, { hours: 1 })}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                リセット
                              </button>
                            )}
                          </div>

                          {/* Time Adjustment Buttons */}
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleTimeAdjustment(day, period, 1/3)}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 px-1 py-0.5 rounded"
                            >
                              1/3
                            </button>
                            <button
                              onClick={() => handleTimeAdjustment(day, period, 1/2)}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 px-1 py-0.5 rounded"
                            >
                              1/2
                            </button>
                            <button
                              onClick={() => handleTimeAdjustment(day, period, 2/3)}
                              className="text-xs bg-yellow-100 hover:bg-yellow-200 px-1 py-0.5 rounded"
                            >
                              2/3
                            </button>
                          </div>

                          {/* Memo */}
                          <textarea
                            placeholder="備考"
                            value={cellData?.memo || ''}
                            onChange={(e) => updateCell(day, period, { memo: e.target.value })}
                            className="w-full text-xs border border-gray-200 rounded px-1 py-1"
                            rows={2}
                          />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}