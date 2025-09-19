'use client'

import { useState } from 'react'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle } from 'docx'
import * as ExcelJS from 'exceljs'
import toast from 'react-hot-toast'
import { trackEvent } from '@/lib/analytics'

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

interface WeeklyPlanData {
  id: string
  week_start_date: string
  week_end_date: string
  details: WeeklyPlanDetail[]
}

interface WeeklyPlanDetail {
  day_of_week: number
  period: number
  subject_id?: string
  unit_id?: string
  grade?: number
  class_number?: number
  hours: number
  memo?: string
  subjects?: Subject
  textbook_units?: {
    unit_name: string
  }
}

interface WeeklyPlanExporterProps {
  user: User
  userSubjects: UserSubject[]
  weeklyPlan?: WeeklyPlanData
  selectedWeek: string
}

export default function WeeklyPlanExporter({
  user,
  userSubjects,
  weeklyPlan,
  selectedWeek
}: WeeklyPlanExporterProps) {
  const [isExporting, setIsExporting] = useState(false)

  const daysOfWeek = ['', '月', '火', '水', '木', '金', '土', '日']
  const periods = [1, 2, 3, 4, 5, 6]

  const getWeekDateRange = (weekStart: string) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 4) // Friday

    return {
      start: start.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
      end: end.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
      year: start.getFullYear(),
      startDate: start,
      endDate: end
    }
  }

  const getPlanData = () => {
    const planGrid: Record<string, { subject?: string; unit?: string; memo?: string }> = {}

    if (weeklyPlan?.details) {
      weeklyPlan.details.forEach(detail => {
        const key = `${detail.day_of_week}-${detail.period}`
        const subject = userSubjects.find(us => us.subject_id === detail.subject_id)

        planGrid[key] = {
          subject: subject?.subjects.name || '',
          unit: detail.textbook_units?.unit_name || '',
          memo: detail.memo || ''
        }
      })
    }

    return planGrid
  }

  const exportToWord = async () => {
    setIsExporting(true)
    try {
      const dateRange = getWeekDateRange(selectedWeek)
      const planData = getPlanData()

      // Create table rows
      const tableRows = [
        // Header row
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: '時間', alignment: AlignmentType.CENTER })],
              width: { size: 10, type: WidthType.PERCENTAGE }
            }),
            ...Array.from({length: 5}, (_, i) =>
              new TableCell({
                children: [new Paragraph({ text: daysOfWeek[i + 1], alignment: AlignmentType.CENTER })],
                width: { size: 18, type: WidthType.PERCENTAGE }
              })
            )
          ]
        }),
        // Period rows
        ...periods.map(period =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: period.toString(), alignment: AlignmentType.CENTER })]
              }),
              ...Array.from({length: 5}, (_, day) => {
                const dayNum = day + 1
                const key = `${dayNum}-${period}`
                const cellData = planData[key]

                const cellContent = []
                if (cellData?.subject) {
                  cellContent.push(new Paragraph({ text: cellData.subject, alignment: AlignmentType.CENTER }))
                  if (cellData.unit) {
                    cellContent.push(new Paragraph({ text: cellData.unit, alignment: AlignmentType.CENTER }))
                  }
                  if (cellData.memo) {
                    cellContent.push(new Paragraph({ text: `(${cellData.memo})`, alignment: AlignmentType.CENTER }))
                  }
                } else {
                  cellContent.push(new Paragraph({ text: '', alignment: AlignmentType.CENTER }))
                }

                return new TableCell({ children: cellContent })
              })
            ]
          })
        )
      ]

      // Create document
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                orientation: 'landscape'
              }
            }
          },
          children: [
            new Paragraph({
              children: [
                {
                  text: user.role === 'homeroom'
                    ? `${user.grade}年${user.class_number}組 - ${dateRange.start}～${dateRange.end}`
                    : `${user.email?.split('@')[0]} - ${dateRange.start}～${dateRange.end}`,
                  bold: true,
                  size: 24
                }
              ],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: '' }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 }
              }
            })
          ]
        }]
      })

      // Generate and download
      const buffer = await Packer.toBuffer(doc)
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `週案_${dateRange.start.replace('/', '')}-${dateRange.end.replace('/', '')}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      // Success notification
      toast.success('Wordファイルの出力が完了しました')
      trackEvent.weeklyPlanExportWord()

    } catch (error) {
      console.error('Word export error:', error)
      toast.error('Word形式での出力に失敗しました。')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      const dateRange = getWeekDateRange(selectedWeek)
      const planData = getPlanData()

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('週案')

      // Set page setup
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1
      }

      // Title
      const title = user.role === 'homeroom'
        ? `${user.grade}年${user.class_number}組 - ${dateRange.start}～${dateRange.end}`
        : `${user.email?.split('@')[0]} - ${dateRange.start}～${dateRange.end}`

      worksheet.mergeCells('A1:F1')
      worksheet.getCell('A1').value = title
      worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getCell('A1').font = { bold: true, size: 14 }
      worksheet.getRow(1).height = 30

      // Headers
      const headers = ['時間', '月', '火', '水', '木', '金']
      worksheet.addRow(headers)
      worksheet.getRow(2).eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.font = { bold: true }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6FA' }
        }
      })

      // Data rows
      periods.forEach((period) => {
        const row = [period.toString()]

        for (let day = 1; day <= 5; day++) {
          const key = `${day}-${period}`
          const cellData = planData[key]

          let cellText = ''
          if (cellData?.subject) {
            cellText = cellData.subject
            if (cellData.unit) {
              cellText += `\n${cellData.unit}`
            }
            if (cellData.memo) {
              cellText += `\n(${cellData.memo})`
            }
          }

          row.push(cellText)
        }

        const addedRow = worksheet.addRow(row)
        addedRow.height = 60

        addedRow.eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }

          if (colNumber === 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF0F0F0' }
            }
            cell.font = { bold: true }
          }
        })
      })

      // Set column widths
      worksheet.getColumn(1).width = 8
      for (let i = 2; i <= 6; i++) {
        worksheet.getColumn(i).width = 20
      }

      // Add borders to header
      worksheet.getRow(2).eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `週案_${dateRange.start.replace('/', '')}-${dateRange.end.replace('/', '')}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      // Success notification
      toast.success('Excelファイルの出力が完了しました')
      trackEvent.weeklyPlanExportExcel()

    } catch (error) {
      console.error('Excel export error:', error)
      toast.error('Excel形式での出力に失敗しました。')
    } finally {
      setIsExporting(false)
    }
  }

  const dateRange = getWeekDateRange(selectedWeek)

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium mb-4">週案出力</h3>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          対象週：{dateRange.start} ～ {dateRange.end}
        </p>
        {user.role === 'homeroom' && (
          <p className="text-sm text-gray-600">
            対象クラス：{user.grade}年{user.class_number}組
          </p>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={exportToWord}
          disabled={isExporting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{isExporting ? '出力中...' : 'Word形式で出力'}</span>
        </button>

        <button
          onClick={exportToExcel}
          disabled={isExporting}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{isExporting ? '出力中...' : 'Excel形式で出力'}</span>
        </button>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">出力について</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• A4サイズ、横向きで最適化されています</li>
          <li>• 管理職への提出や週案簿への貼付に使用できます</li>
          <li>• Wordファイルは編集可能、Excelファイルは計算やデータ処理に便利です</li>
        </ul>
      </div>
    </div>
  )
}