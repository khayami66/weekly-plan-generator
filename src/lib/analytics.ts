import { track } from '@vercel/analytics'

// カスタムイベント追跡のためのヘルパー関数
export const trackEvent = {
  // 認証関連
  login: () => track('user_login'),
  logout: () => track('user_logout'),
  signupComplete: () => track('user_signup_complete'),

  // 週案作成関連
  weeklyPlanGenerate: () => track('weekly_plan_generate'),
  weeklyPlanExportWord: () => track('weekly_plan_export_word'),
  weeklyPlanExportExcel: () => track('weekly_plan_export_excel'),
  weeklyPlanSave: () => track('weekly_plan_save'),

  // 設定関連
  setupWizardComplete: (role: 'homeroom' | 'specialist') =>
    track('setup_wizard_complete', { role }),
  textbookSelect: (publisher: string, subject: string) =>
    track('textbook_select', { publisher, subject }),

  // 時数管理関連
  hoursAlert: (subject: string, shortage: number) =>
    track('hours_alert', { subject, shortage }),

  // エラー追跡
  error: (errorType: string, component: string) =>
    track('error_occurred', { errorType, component }),

  // パフォーマンス関連
  pageLoad: (page: string, loadTime: number) =>
    track('page_load_time', { page, loadTime }),
}

// ページビュー追跡
export const trackPageView = (page: string) => {
  track('page_view', { page })
}

// エラー境界で使用するエラー追跡
export const trackError = (error: Error, errorInfo: any) => {
  track('react_error', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack
  })
}