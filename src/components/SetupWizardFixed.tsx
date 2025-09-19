'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { trackEvent } from '@/lib/analytics'

interface SetupWizardProps {
  user: User
  userData?: any
  isEditMode?: boolean
}

type Role = 'homeroom' | 'specialist'

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

export default function SetupWizard({ user, userData, isEditMode = false }: SetupWizardProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
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

  // Load subjects and publishers on mount
  useEffect(() => {
    const loadData = async () => {
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .order('name')

      const { data: publishersData } = await supabase
        .from('publishers')
        .select('*')
        .order('name')

      if (subjectsData) setSubjects(subjectsData)
      if (publishersData) setPublishers(publishersData)

      // Load existing data if in edit mode
      if (isEditMode && userData) {
        console.log('SetupWizard - Edit mode, loading userData:', userData)

        setFormData(prev => ({
          ...prev,
          role: userData.role,
          grade: userData.grade?.toString() || '',
          classNumber: userData.class_number?.toString() || ''
        }))

        // Load user subjects and textbooks
        const { data: userSubjects, error: userSubjectsError } = await supabase
          .from('user_subjects')
          .select('subject_id, grade, class_number, publisher_id')
          .eq('user_id', user.id)

        console.log('SetupWizard - User subjects:', userSubjects)
        console.log('SetupWizard - User subjects error:', userSubjectsError)

        if (userSubjects) {
          const subjectIds = userSubjects.map(us => us.subject_id)
          const grades = [...new Set(userSubjects.map(us => us.grade))]
          const textbooks: Record<string, string> = {}

          userSubjects.forEach(us => {
            textbooks[us.subject_id] = us.publisher_id
          })

          console.log('SetupWizard - Setting form data:', { subjectIds, grades, textbooks })

          setFormData(prev => ({
            ...prev,
            subjects: subjectIds,
            teachingGrades: grades,
            textbooks
          }))
        }
      } else {
        console.log('SetupWizard - Not in edit mode or no userData:', { isEditMode, userData })
      }
    }

    loadData()
  }, [supabase, isEditMode, userData, user.id])

  const grades = [1, 2, 3, 4, 5, 6]
  const availableSubjects = subjects.filter(s => 
    formData.role === 'specialist' 
      ? ['家庭', '音楽', '図画工作', '理科', '体育', '外国語'].includes(s.name)
      : true
  )

  const handleRoleSelect = (role: Role) => {
    setFormData({ ...formData, role, subjects: [] })
    setStep(2)
  }

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, subjectId]
      })
    } else {
      setFormData({
        ...formData,
        subjects: formData.subjects.filter(s => s !== subjectId)
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

  const handleTextbookChange = (subjectId: string, publisherId: string) => {
    setFormData({
      ...formData,
      textbooks: {
        ...formData.textbooks,
        [subjectId]: publisherId
      }
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (isEditMode) {
        // Update existing user data
        const { error: userError } = await supabase
          .from('users')
          .update({
            role: formData.role,
            grade: formData.role === 'homeroom' ? parseInt(formData.grade) : null,
            class_number: formData.role === 'homeroom' ? parseInt(formData.classNumber) : null
          })
          .eq('id', user.id)

        if (userError) throw userError

        // Delete existing user subjects before inserting new ones
        const { error: deleteError } = await supabase
          .from('user_subjects')
          .delete()
          .eq('user_id', user.id)

        if (deleteError) throw deleteError
      } else {
        // Insert new user data
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
      }

      // Insert user subjects and textbooks
      for (const subjectId of formData.subjects) {
        if (formData.role === 'homeroom') {
          const { error } = await supabase
            .from('user_subjects')
            .insert({
              user_id: user.id,
              subject_id: subjectId,
              grade: parseInt(formData.grade),
              class_number: parseInt(formData.classNumber),
              publisher_id: formData.textbooks[subjectId]
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
                  publisher_id: formData.textbooks[subjectId]
                })
              if (error) throw error
            }
          }
        }
      }

      // Success notification
      toast.success('設定が正常に保存されました！')

      // Track setup completion
      trackEvent.setupWizardComplete(formData.role)

      if (isEditMode) {
        // In edit mode, redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      } else {
        // In new setup mode, refresh to show dashboard
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      console.error('Setup error:', error)
      toast.error('設定の保存に失敗しました。もう一度お試しください。')
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">担当教科</label>
              <div className="grid grid-cols-2 gap-2">
                {availableSubjects.map(subject => (
                  <label key={subject.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject.id)}
                      onChange={(e) => handleSubjectChange(subject.id, e.target.checked)}
                      className="mr-2"
                    />
                    {subject.name}
                  </label>
                ))}
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
                disabled={!formData.grade || !formData.classNumber || formData.subjects.length === 0}
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
                {availableSubjects.map(subject => (
                  <label key={subject.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject.id)}
                      onChange={(e) => handleSubjectChange(subject.id, e.target.checked)}
                      className="mr-2"
                    />
                    {subject.name}
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
            
            {formData.subjects.map(subjectId => {
              const subject = subjects.find(s => s.id === subjectId)
              return (
                <div key={subjectId} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {subject?.name}
                  </label>
                  <select
                    value={formData.textbooks[subjectId] || ''}
                    onChange={(e) => handleTextbookChange(subjectId, e.target.value)}
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
              )
            })}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                戻る
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={formData.subjects.some(subjectId => !formData.textbooks[subjectId])}
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
              {formData.subjects.map(subjectId => {
                const subject = subjects.find(s => s.id === subjectId)
                const publisher = publishers.find(p => p.id === formData.textbooks[subjectId])
                return (
                  <p key={subjectId}>
                    {subject?.name}: {publisher?.name}
                  </p>
                )
              })}
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