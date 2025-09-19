'use client'

import { useState } from 'react'

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

interface Publisher {
  id: string
  name: string
  code: string
}

interface UserSubject {
  id: string
  user_id: string
  subject_id: string
  grade: number
  class_number?: number
  publisher_id: string
  subjects: Subject
  publishers: Publisher
}

interface SimpleWeeklyPlanProps {
  user: User
  userSubjects: UserSubject[]
}

export default function SimpleWeeklyPlan({ user, userSubjects }: SimpleWeeklyPlanProps) {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    return monday.toISOString().split('T')[0]
  })

  const daysOfWeek = ['月', '火', '水', '木', '金']
  const periods = [1, 2, 3, 4, 5, 6]

  const getWeekDateRange = (weekStart: string) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 4)
    
    return {
      start: start.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
      end: end.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    }
  }

  const dateRange = getWeekDateRange(selectedWeek)

  return (
    <div className="space-y-6">
      {/* Week Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">週案作成</h2>
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
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              自動生成
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              保存
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Plan Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">
          {user.role === 'homeroom' 
            ? `${user.grade}年${user.class_number}組 週案` 
            : '専科 週案'
          }
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 p-3 bg-gray-50">時間</th>
                {daysOfWeek.map(day => (
                  <th key={day} className="border border-gray-300 p-3 bg-gray-50 min-w-[150px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period}>
                  <td className="border border-gray-300 p-3 bg-gray-50 text-center font-medium">
                    {period}
                  </td>
                  {daysOfWeek.map((day, dayIndex) => (
                    <td key={`${dayIndex + 1}-${period}`} className="border border-gray-300 p-2">
                      <div className="space-y-2">
                        {/* Subject Selection */}
                        <select className="w-full text-sm border border-gray-200 rounded px-2 py-1">
                          <option value="">教科選択</option>
                          {userSubjects.map(userSubject => (
                            <option key={userSubject.id} value={userSubject.subject_id}>
                              {userSubject.subjects.name}
                              {user.role === 'specialist' && ` (${userSubject.grade}-${userSubject.class_number})`}
                            </option>
                          ))}
                        </select>

                        {/* Unit Input */}
                        <input 
                          type="text" 
                          placeholder="単元名"
                          className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                        />

                        {/* Time Display */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">1時間</span>
                          <div className="flex space-x-1">
                            <button className="text-xs bg-yellow-100 hover:bg-yellow-200 px-1 py-0.5 rounded">
                              時数調整
                            </button>
                          </div>
                        </div>

                        {/* Memo */}
                        <textarea
                          placeholder="備考"
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                          rows={2}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Subjects Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">担当教科・教科書</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userSubjects.map(userSubject => (
            <div key={userSubject.id} className="border border-gray-200 rounded p-3">
              <div className="font-medium">{userSubject.subjects.name}</div>
              <div className="text-sm text-gray-600">{userSubject.publishers.name}</div>
              <div className="text-sm text-gray-600">
                {userSubject.grade}年
                {userSubject.class_number && `${userSubject.class_number}組`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}