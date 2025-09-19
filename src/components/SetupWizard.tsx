'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface SetupWizardProps {
  user: User
}

type Role = 'homeroom' | 'specialist'

export default function SetupWizard({ user }: SetupWizardProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    role: '' as Role,
    grade: '',
    classNumber: '',
    subjects: [] as string[],
    teachingGrades: [] as number[],
    classCountPerGrade: {} as Record<number, number>,
    textbooks: {} as Record<string, string>
  })

  const supabase = createClient()

  const grades = [1, 2, 3, 4, 5, 6]
  const subjects = ['家庭', '音楽', '図画工作', '理科', '体育', '外国語']
  const publishers = [
    { id: 'tokyo', name: '東京書籍' },
    { id: 'mitsumura', name: '光村図書出版' },
    { id: 'kyoiku', name: '教育出版' },
    { id: 'dainippon', name: '大日本図書' },
    { id: 'bunkyou', name: '日本文教出版' }
  ]

  const handleRoleSelect = (role: Role) => {
    setFormData({ ...formData, role })
    setStep(2)
  }

  const handleSubjectChange = (subject: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, subject]
      })
    } else {
      setFormData({
        ...formData,
        subjects: formData.subjects.filter(s => s !== subject)
      })
    }
  }

  const handleGradeChange = (grade: number, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        teachingGrades: [...formData.teachingGrades, grade]
      })
    } else {
      setFormData({
        ...formData,
        teachingGrades: formData.teachingGrades.filter(g => g !== grade),
        classCountPerGrade: {
          ...formData.classCountPerGrade,
          [grade]: undefined
        } as Record<number, number>
      })
    }
  }

  const handleClassCountChange = (grade: number, count: number) => {
    setFormData({
      ...formData,
      classCountPerGrade: {
        ...formData.classCountPerGrade,
        [grade]: count
      }
    })
  }

  const handleTextbookChange = (subject: string, publisher: string) => {
    setFormData({
      ...formData,
      textbooks: {
        ...formData.textbooks,
        [subject]: publisher
      }
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Insert user data
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          role: formData.role,
          grade: formData.role === 'homeroom' ? parseInt(formData.grade) : null,
          class_number: formData.role === 'homeroom' ? parseInt(formData.classNumber) : null
        })

      if (userError) throw userError

      // Get subjects and publishers data
      const { data: subjectsData } = await supabase.from('subjects').select('id, name')
      const { data: publishersData } = await supabase.from('publishers').select('id, code')

      const subjectMap = Object.fromEntries(subjectsData?.map(s => [s.name, s.id]) || [])
      const publisherMap = Object.fromEntries(publishersData?.map(p => [p.code, p.id]) || [])

      // Insert user subjects and textbooks
      for (const subject of formData.subjects) {
        const subjectId = subjectMap[subject]
        const publisherId = publisherMap[formData.textbooks[subject]]

        if (!subjectId || !publisherId) {
          throw new Error(`Subject or publisher not found: ${subject}, ${formData.textbooks[subject]}`)
        }

        if (formData.role === 'homeroom') {
          const { error } = await supabase
            .from('user_subjects')
            .insert({
              user_id: user.id,
              subject_id: subjectId,
              grade: parseInt(formData.grade),
              class_number: parseInt(formData.classNumber),
              publisher_id: publisherId
            })
          if (error) throw error
        } else {
          // Specialist teacher
          for (const grade of formData.teachingGrades) {
            for (let classNum = 1; classNum <= formData.classCountPerGrade[grade]; classNum++) {
              const { error } = await supabase
                .from('user_subjects')
                .insert({
                  user_id: user.id,
                  subject_id: subjectId,
                  grade,
                  class_number: classNum,
                  publisher_id: publisherId
                })
              if (error) throw error
            }
          }
        }
      }

      // Refresh the page to show dashboard
      window.location.reload()
    } catch (error) {
      console.error('Setup error:', error)
      alert('設定の保存に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            初期設定
          </h1>
          <p className="text-gray-600">
            ステップ {step} / 4
          </p>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">あなたの役割を選択してください</h2>
            <div className="space-y-4">
              <button
                onClick={() => handleRoleSelect('homeroom')}
                className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <h3 className="text-lg font-medium">担任</h3>
                <p className="text-gray-600">学級担任として複数教科を指導</p>
              </button>
              <button
                onClick={() => handleRoleSelect('specialist')}
                className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <h3 className="text-lg font-medium">専科</h3>
                <p className="text-gray-600">音楽・図工・家庭科・理科などの専科教員</p>
              </button>
            </div>
          </div>
        )}

        {step === 2 && formData.role === 'homeroom' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">担当学級を選択してください</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">学年</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">選択してください</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}年</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">組</label>
                <select
                  value={formData.classNumber}
                  onChange={(e) => setFormData({ ...formData, classNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">選択してください</option>
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}組</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                戻る
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.grade || !formData.classNumber}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {step === 2 && formData.role === 'specialist' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">担当教科と学年を選択してください</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">担当教科</label>
              <div className="grid grid-cols-2 gap-2">
                {subjects.map(subject => (
                  <label key={subject} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject)}
                      onChange={(e) => handleSubjectChange(subject, e.target.checked)}
                      className="mr-2"
                    />
                    {subject}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">担当学年</label>
              <div className="grid grid-cols-3 gap-2">
                {grades.map(grade => (
                  <label key={grade} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.teachingGrades.includes(grade)}
                      onChange={(e) => handleGradeChange(grade, e.target.checked)}
                      className="mr-2"
                    />
                    {grade}年
                  </label>
                ))}
              </div>
            </div>

            {formData.teachingGrades.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">各学年のクラス数</label>
                {formData.teachingGrades.map(grade => (
                  <div key={grade} className="flex items-center mb-2">
                    <span className="w-16">{grade}年:</span>
                    <select
                      value={formData.classCountPerGrade[grade] || ''}
                      onChange={(e) => handleClassCountChange(grade, parseInt(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">選択</option>
                      {[1, 2, 3, 4, 5, 6].map(count => (
                        <option key={count} value={count}>{count}クラス</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                戻る
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={formData.subjects.length === 0 || formData.teachingGrades.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">使用教科書を選択してください</h2>
            
            {formData.subjects.map(subject => (
              <div key={subject} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{subject}</label>
                <select
                  value={formData.textbooks[subject] || ''}
                  onChange={(e) => handleTextbookChange(subject, e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">選択してください</option>
                  {publishers.map(publisher => (
                    <option key={publisher.id} value={publisher.id}>
                      {publisher.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                戻る
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={formData.subjects.some(subject => !formData.textbooks[subject])}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">設定内容を確認してください</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">役割</h3>
              <p>{formData.role === 'homeroom' ? '学級担任' : '専科教員'}</p>
              
              {formData.role === 'homeroom' && (
                <>
                  <h3 className="font-medium mb-2 mt-4">担当学級</h3>
                  <p>{formData.grade}年{formData.classNumber}組</p>
                </>
              )}
              
              {formData.role === 'specialist' && (
                <>
                  <h3 className="font-medium mb-2 mt-4">担当学年・クラス数</h3>
                  {formData.teachingGrades.map(grade => (
                    <p key={grade}>{grade}年: {formData.classCountPerGrade[grade]}クラス</p>
                  ))}
                </>
              )}
              
              <h3 className="font-medium mb-2 mt-4">担当教科・教科書</h3>
              {formData.subjects.map(subject => (
                <p key={subject}>
                  {subject}: {publishers.find(p => p.id === formData.textbooks[subject])?.name}
                </p>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                戻る
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-6 py-2 rounded"
              >
                {loading ? '保存中...' : '設定を保存'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}