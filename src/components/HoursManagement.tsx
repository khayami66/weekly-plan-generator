'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

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

interface HoursData {
  subject_id: string
  subject_name: string
  grade: number
  annual_planned: number
  current_planned: number
  current_actual: number
  cumulative_planned: number
  cumulative_actual: number
  variance: number
  end_of_year_prediction: number
}

interface HoursManagementProps {
  user: User
  userSubjects: UserSubject[]
}

export default function HoursManagement({ user, userSubjects }: HoursManagementProps) {
  const [hoursData, setHoursData] = useState<HoursData[]>([])
  const [selectedGrade, setSelectedGrade] = useState<number>(user.grade || 5)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [academicYear, setAcademicYear] = useState(() => {
    const now = new Date()
    return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // 学年ごとの年間標準時数（文科省基準）
  const standardHours: Record<number, Record<string, number>> = {
    5: {
      '国語': 175,
      '算数': 175,
      '理科': 105,
      '社会': 100,
      '音楽': 60,
      '図画工作': 60,
      '家庭': 60,
      '体育': 90,
      '道徳': 35,
      '外国語': 70,
      '総合的な学習の時間': 70,
      '特別活動': 35
    },
    6: {
      '国語': 175,
      '算数': 175,
      '理科': 105,
      '社会': 105,
      '音楽': 50,
      '図画工作': 50,
      '家庭': 55,
      '体育': 90,
      '道徳': 35,
      '外国語': 70,
      '総合的な学習の時間': 70,
      '特別活動': 35
    }
  }

  useEffect(() => {
    loadHoursData()
  }, [selectedGrade, currentMonth, academicYear])

  const loadHoursData = async () => {
    setLoading(true)
    try {
      const relevantSubjects = user.role === 'homeroom'
        ? userSubjects.filter(us => us.grade === selectedGrade)
        : userSubjects.filter(us => us.grade === selectedGrade)

      const hoursPromises = relevantSubjects.map(async (userSubject) => {
        // 累積計画時数・実績時数を取得
        const { data: hoursRecords } = await supabase
          .from('hours_management')
          .select('*')
          .eq('user_id', user.id)
          .eq('subject_id', userSubject.subject_id)
          .eq('grade', selectedGrade)
          .eq('academic_year', academicYear)
          .order('month')

        // 実際の授業時数を週案から計算
        const { data: actualHours } = await supabase
          .from('weekly_plan_details')
          .select(`
            hours,
            weekly_plans!inner(week_start_date, user_id)
          `)
          .eq('subject_id', userSubject.subject_id)
          .eq('grade', selectedGrade)
          .eq('weekly_plans.user_id', user.id)
          .gte('weekly_plans.week_start_date', `${academicYear}-04-01`)
          .lte('weekly_plans.week_start_date', `${academicYear + 1}-03-31`)

        const currentMonthEndDate = new Date(academicYear, currentMonth, 0)
        const actualHoursFiltered = actualHours?.filter(record => {
          const weekDate = new Date(record.weekly_plans.week_start_date)
          return weekDate <= currentMonthEndDate
        })

        const totalActualHours = actualHoursFiltered?.reduce((sum, record) => sum + (record.hours || 0), 0) || 0

        // 年間標準時数
        const annualPlanned = standardHours[selectedGrade]?.[userSubject.subjects.name] || 0

        // 4月〜現在月までの計画時数（均等配分ベース）
        const monthsFromApril = currentMonth >= 4 ? currentMonth - 3 : currentMonth + 9
        const currentPlanned = Math.round((annualPlanned / 12) * monthsFromApril)

        // 累積実績
        const cumulativeActual = totalActualHours

        // 差分
        const variance = cumulativeActual - currentPlanned

        // 年度末予測（現在のペースで継続した場合）
        const averageHoursPerMonth = totalActualHours / Math.max(monthsFromApril, 1)
        const endOfYearPrediction = Math.round(averageHoursPerMonth * 12)

        return {
          subject_id: userSubject.subject_id,
          subject_name: userSubject.subjects.name,
          grade: selectedGrade,
          annual_planned: annualPlanned,
          current_planned: currentPlanned,
          current_actual: Math.round(totalActualHours),
          cumulative_planned: currentPlanned,
          cumulative_actual: cumulativeActual,
          variance: variance,
          end_of_year_prediction: endOfYearPrediction
        }
      })

      const results = await Promise.all(hoursPromises)
      setHoursData(results)
    } catch (error) {
      console.error('Hours data loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVarianceColor = (variance: number) => {
    if (variance >= 0) return 'text-green-600'
    if (variance >= -5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getVarianceIcon = (variance: number) => {
    if (variance >= 0) return '✅'
    if (variance >= -5) return '⚠️'
    return '❌'
  }

  const getPredictionAlert = (actual: number, predicted: number, planned: number) => {
    const shortage = planned - predicted
    if (shortage <= 0) return null

    const monthsRemaining = 12 - (currentMonth >= 4 ? currentMonth - 3 : currentMonth + 9)
    const additionalHoursNeeded = Math.ceil(shortage / Math.max(monthsRemaining, 1))

    return {
      shortage,
      additionalHoursNeeded,
      monthsRemaining
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* コントロール部分 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">時数管理・アラート</h2>
          <div className="flex items-center space-x-4">
            {user.role === 'specialist' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">対象学年</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  {[1, 2, 3, 4, 5, 6].map(grade => (
                    <option key={grade} value={grade}>{grade}年</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">基準月</label>
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* アラート表示 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">
          ⚠️ 時数管理アラート（4月〜{currentMonth}月累積）
        </h3>

        <div className="space-y-4">
          {hoursData.map((data) => {
            const alert = getPredictionAlert(data.current_actual, data.end_of_year_prediction, data.annual_planned)

            return (
              <div key={`${data.subject_id}-${data.grade}`} className="border-l-4 border-gray-200 pl-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{data.subject_name}：年間予定{data.annual_planned}時間</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div>├ 4-{currentMonth}月予定：{data.current_planned}時間</div>
                      <div className={`├ 4-${currentMonth}月実績：${data.current_actual}時間 (${data.variance >= 0 ? '+' : ''}${data.variance}時間) ${getVarianceColor(data.variance)}`}>
                        <span className={getVarianceColor(data.variance)}>
                          {getVarianceIcon(data.variance)}
                        </span>
                      </div>
                      <div>└ {currentMonth + 1}-3月で調整必要：{data.variance < 0 ? Math.abs(data.variance) : 0}時間</div>
                    </div>
                  </div>
                </div>

                {/* 年度末予測 */}
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <div className="text-sm">
                    <span className="font-medium">📊 年度末予測：</span>
                    現在のペースなら{data.end_of_year_prediction}時間
                    {data.end_of_year_prediction < data.annual_planned && (
                      <span className="text-red-600 ml-2">
                        ({data.annual_planned - data.end_of_year_prediction}時間不足)
                      </span>
                    )}
                  </div>

                  {alert && (
                    <div className="mt-2 text-sm text-blue-600">
                      <span className="font-medium">💡 調整案：</span>
                      月{alert.additionalHoursNeeded}時間増で{currentMonth + Math.ceil(alert.shortage / alert.additionalHoursNeeded)}月までに解消可能
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {hoursData.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>対象となる教科データがありません。</p>
            <p className="text-sm mt-2">基本設定で教科を追加してください。</p>
          </div>
        )}
      </div>

      {/* 時数管理テーブル */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">詳細時数管理</h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-left">教科</th>
                <th className="border border-gray-300 p-3 text-right">年間予定</th>
                <th className="border border-gray-300 p-3 text-right">累積予定</th>
                <th className="border border-gray-300 p-3 text-right">累積実績</th>
                <th className="border border-gray-300 p-3 text-right">差分</th>
                <th className="border border-gray-300 p-3 text-right">年度末予測</th>
                <th className="border border-gray-300 p-3 text-center">状況</th>
              </tr>
            </thead>
            <tbody>
              {hoursData.map((data) => (
                <tr key={`${data.subject_id}-${data.grade}`} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3 font-medium">{data.subject_name}</td>
                  <td className="border border-gray-300 p-3 text-right">{data.annual_planned}</td>
                  <td className="border border-gray-300 p-3 text-right">{data.cumulative_planned}</td>
                  <td className="border border-gray-300 p-3 text-right">{data.cumulative_actual}</td>
                  <td className={`border border-gray-300 p-3 text-right font-medium ${getVarianceColor(data.variance)}`}>
                    {data.variance >= 0 ? '+' : ''}{data.variance}
                  </td>
                  <td className="border border-gray-300 p-3 text-right">{data.end_of_year_prediction}</td>
                  <td className="border border-gray-300 p-3 text-center text-lg">
                    {getVarianceIcon(data.variance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}