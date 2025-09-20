// 共通型定義ファイル
// 複数のコンポーネントで使用される型を統一管理

export interface User {
  id: string
  email: string
  role: 'homeroom' | 'specialist'
  grade?: number
  class_number?: number
}

export interface Subject {
  id: string
  name: string
  category: string
}

export interface Publisher {
  id: string
  name: string
  code: string
}

export interface UserSubject {
  id: string
  user_id: string
  subject_id: string
  grade: number
  class_number?: number
  publisher_id: string
  subjects: Subject
  publishers: Publisher
}

export interface TextbookUnit {
  id: string
  unit_name: string
  category: string
  suggested_hours: number
  suggested_period: string
  unit_order: number
}

export interface WeeklyPlanCell {
  day: number
  period: number
  subject_id?: string
  unit_id?: string
  grade?: number
  class_number?: number
  hours: number
  memo?: string
}

export interface Schedule {
  id: string
  name: string
  is_default: boolean
  daily_periods?: Record<string, number>
  schedule_details: ScheduleDetail[]
}

export interface ScheduleDetail {
  day_of_week: number
  period: number
  subject_id: string
  grade?: number
  class_number?: number
  subjects: Subject
}

// 設定関連の型
export interface SettingsFormData {
  role: 'homeroom' | 'specialist'
  grade?: number
  class_number?: number
}

export interface SubjectSelection {
  subject_id: string
  publisher_id: string
  grade: number
  class_number?: number
}