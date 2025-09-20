// 時数調整ユーティリティ
import type { WeeklyPlanCell } from '@/types/common'

interface SubjectHours {
  subject_id: string
  current_hours: number
  target_hours: number
  variance: number
  priority: number
}

interface AdjustmentRule {
  name: string
  condition: (cell: WeeklyPlanCell, weekData: WeeklyPlanCell[]) => boolean
  adjustment: (cell: WeeklyPlanCell) => number
  priority: number
  description: string
}

/**
 * 自動時数調整のルール定義
 */
export const adjustmentRules: AdjustmentRule[] = [
  {
    name: 'event_day_adjustment',
    condition: (cell, weekData) => {
      // 行事日の検出（memo フィールドに「行事」「運動会」「発表会」などが含まれる）
      const eventKeywords = ['行事', '運動会', '発表会', '式', '参観', '避難訓練', '会議']
      return eventKeywords.some(keyword => cell.memo?.includes(keyword))
    },
    adjustment: (cell) => {
      // 行事日は1/2時間に調整
      return 0.5
    },
    priority: 1,
    description: '行事日の時数調整'
  },
  {
    name: 'short_period_adjustment',
    condition: (cell, weekData) => {
      // 短縮授業日の検出
      return cell.memo?.includes('短縮') || false
    },
    adjustment: (cell) => {
      // 短縮授業は2/3時間に調整
      return 0.67
    },
    priority: 2,
    description: '短縮授業日の時数調整'
  },
  {
    name: 'weekly_balance_adjustment',
    condition: (cell, weekData) => {
      // 週の教科バランス調整（特定教科の偏り防止）
      const sameDaySubjects = weekData.filter(c => c.day === cell.day && c.subject_id === cell.subject_id)
      return sameDaySubjects.length > 2 // 同日に3時間以上同じ教科
    },
    adjustment: (cell) => {
      // 教科の偏りがある場合は時数を微調整
      return 0.83 // 5/6時間
    },
    priority: 3,
    description: '教科バランス調整'
  }
]

/**
 * 週案全体の自動時数調整
 */
export function adjustWeeklyPlanHours(
  weeklyPlan: WeeklyPlanCell[],
  subjectHoursData?: SubjectHours[]
): WeeklyPlanCell[] {
  const adjustedPlan = [...weeklyPlan]

  // ルール適用の優先順位に従って調整
  const sortedRules = adjustmentRules.sort((a, b) => a.priority - b.priority)

  for (const rule of sortedRules) {
    for (let i = 0; i < adjustedPlan.length; i++) {
      const cell = adjustedPlan[i]

      if (rule.condition(cell, adjustedPlan)) {
        const newHours = rule.adjustment(cell)
        adjustedPlan[i] = {
          ...cell,
          hours: newHours,
          memo: cell.memo ? `${cell.memo} (${rule.description})` : rule.description
        }
      }
    }
  }

  // 教科別時数バランス調整
  if (subjectHoursData) {
    adjustSubjectBalance(adjustedPlan, subjectHoursData)
  }

  return adjustedPlan
}

/**
 * 教科別時数バランス調整
 */
function adjustSubjectBalance(
  weeklyPlan: WeeklyPlanCell[],
  subjectHoursData: SubjectHours[]
): void {
  for (const subjectData of subjectHoursData) {
    if (subjectData.variance < -2) { // 2時間以上不足
      // 該当教科の時数を増やす
      increaseSubjectHours(weeklyPlan, subjectData.subject_id, Math.abs(subjectData.variance))
    } else if (subjectData.variance > 2) { // 2時間以上過多
      // 該当教科の時数を減らす
      decreaseSubjectHours(weeklyPlan, subjectData.subject_id, subjectData.variance)
    }
  }
}

/**
 * 特定教科の時数を増やす
 */
function increaseSubjectHours(
  weeklyPlan: WeeklyPlanCell[],
  subjectId: string,
  increaseAmount: number
): void {
  const targetCells = weeklyPlan.filter(cell =>
    cell.subject_id === subjectId && cell.hours < 1
  )

  let remaining = increaseAmount
  for (const cell of targetCells) {
    if (remaining <= 0) break

    const increase = Math.min(remaining, 1 - cell.hours)
    cell.hours += increase
    remaining -= increase

    if (!cell.memo) cell.memo = ''
    cell.memo += ' (時数調整+)'
  }
}

/**
 * 特定教科の時数を減らす
 */
function decreaseSubjectHours(
  weeklyPlan: WeeklyPlanCell[],
  subjectId: string,
  decreaseAmount: number
): void {
  const targetCells = weeklyPlan.filter(cell =>
    cell.subject_id === subjectId && cell.hours > 0.5
  )

  let remaining = decreaseAmount
  for (const cell of targetCells) {
    if (remaining <= 0) break

    const decrease = Math.min(remaining, cell.hours - 0.5)
    cell.hours -= decrease
    remaining -= decrease

    if (!cell.memo) cell.memo = ''
    cell.memo += ' (時数調整-)'
  }
}

/**
 * 行事日の自動検出
 */
export function detectEventDays(weeklyPlan: WeeklyPlanCell[]): WeeklyPlanCell[] {
  const eventPatterns = [
    /運動会|体育祭/i,
    /発表会|学習発表会/i,
    /参観|授業参観/i,
    /式|入学式|卒業式|始業式|終業式/i,
    /避難訓練/i,
    /会議|職員会議/i,
    /研修|校内研修/i
  ]

  return weeklyPlan.map(cell => {
    if (cell.memo) {
      const isEventDay = eventPatterns.some(pattern => pattern.test(cell.memo!))
      if (isEventDay && cell.hours === 1) {
        return {
          ...cell,
          hours: 0.5,
          memo: `${cell.memo} (行事日調整)`
        }
      }
    }
    return cell
  })
}

/**
 * 週間時数サマリーの計算
 */
export function calculateWeeklyHoursSummary(weeklyPlan: WeeklyPlanCell[]): {
  totalHours: number
  subjectHours: Record<string, number>
  adjustedCells: number
} {
  let totalHours = 0
  const subjectHours: Record<string, number> = {}
  let adjustedCells = 0

  for (const cell of weeklyPlan) {
    totalHours += cell.hours

    if (cell.subject_id) {
      subjectHours[cell.subject_id] = (subjectHours[cell.subject_id] || 0) + cell.hours
    }

    if (cell.hours !== 1) {
      adjustedCells++
    }
  }

  return {
    totalHours,
    subjectHours,
    adjustedCells
  }
}

/**
 * 時数調整の推奨案を生成
 */
export function generateAdjustmentSuggestions(
  weeklyPlan: WeeklyPlanCell[],
  subjectHoursData: SubjectHours[]
): string[] {
  const suggestions: string[] = []
  const summary = calculateWeeklyHoursSummary(weeklyPlan)

  // 総時数チェック
  if (summary.totalHours > 30) {
    suggestions.push(`総時数が${summary.totalHours}時間で標準を超えています。調整を検討してください。`)
  } else if (summary.totalHours < 25) {
    suggestions.push(`総時数が${summary.totalHours}時間で不足しています。時数を増やしてください。`)
  }

  // 教科別バランスチェック
  for (const subjectData of subjectHoursData) {
    if (subjectData.variance < -2) {
      suggestions.push(`${subjectData.subject_id}が${Math.abs(subjectData.variance)}時間不足しています。`)
    } else if (subjectData.variance > 2) {
      suggestions.push(`${subjectData.subject_id}が${subjectData.variance}時間過多です。`)
    }
  }

  // 調整済みセル数の報告
  if (summary.adjustedCells > 0) {
    suggestions.push(`${summary.adjustedCells}コマで時数調整が適用されています。`)
  }

  return suggestions
}