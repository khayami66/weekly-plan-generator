'use client'

import { useState, useEffect, useMemo } from 'react'
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

interface SubjectsViewProps {
  user: User
}

export default function SubjectsView({ user }: SubjectsViewProps) {
  const [userSubjects, setUserSubjects] = useState<UserSubject[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const loadUserSubjects = async () => {
      setLoading(true)
      try {
        const { data: subjectsData } = await supabase
          .from('user_subjects')
          .select(`
            *,
            subjects(*),
            publishers(*)
          `)
          .eq('user_id', user.id)
          .order('subjects(category)', { ascending: true })
          .order('subjects(name)', { ascending: true })

        if (subjectsData) {
          setUserSubjects(subjectsData)
        }
      } catch (error) {
        console.error('教科データの読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserSubjects()
  }, [supabase, user.id])

  const handleEditSubjects = () => {
    window.location.href = '/settings/edit?step=2'
  }

  const groupedSubjects = useMemo(() => {
    const groups: Record<string, UserSubject[]> = {}
    userSubjects.forEach(userSubject => {
      const category = userSubject.subjects.category
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(userSubject)
    })
    return groups
  }, [userSubjects])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 教科・教科書一覧 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-800">教科・教科書一覧</h2>
          <button
            onClick={handleEditSubjects}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            設定を変更
          </button>
        </div>

        {userSubjects.length > 0 ? (
          <div className="space-y-6">
            {['主要教科', '専科教科', 'その他'].map(category => {
              const categorySubjects = groupedSubjects[category]
              if (!categorySubjects || categorySubjects.length === 0) return null

              return (
                <div key={category}>
                  <h3 className="text-lg font-medium text-gray-700 mb-3 border-b border-gray-200 pb-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorySubjects.map((userSubject) => (
                      <div key={userSubject.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{userSubject.subjects.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${
                            userSubject.subjects.category === '主要教科'
                              ? 'bg-blue-100 text-blue-800'
                              : userSubject.subjects.category === '専科教科'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userSubject.subjects.category}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div>
                            <span className="text-xs text-gray-500">教科書:</span>
                            <p className="text-sm text-gray-700">{userSubject.publishers.name}</p>
                          </div>

                          {user.role === 'specialist' && (
                            <div>
                              <span className="text-xs text-gray-500">担当:</span>
                              <p className="text-sm text-gray-700">
                                {userSubject.grade}年{userSubject.class_number}組
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">教科・教科書が設定されていません</p>
            <button
              onClick={handleEditSubjects}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              初期設定を開始
            </button>
          </div>
        )}
      </div>

      {/* 操作ガイド */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 操作ガイド</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 教科や教科書を変更したい場合は「設定を変更」ボタンをクリック</li>
          <li>• 設定完了後は週案作成で教科書の単元を選択できます</li>
          <li>• 専科教員の場合は複数学年・学級の設定が可能です</li>
        </ul>
      </div>
    </div>
  )
}