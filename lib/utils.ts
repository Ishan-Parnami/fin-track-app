import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CURRENCY } from '@/lib/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = CURRENCY): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}


/** Formats a Date to YYYY-MM using local time (no UTC conversion). */
export function toYearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function currentMonthParam(): string {
  return toYearMonth(new Date())
}

/** Returns Monday of the ISO week containing `d`, at 00:00:00 local time. */
export function startOfISOWeek(d: Date): Date {
  const result = new Date(d)
  result.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  result.setHours(0, 0, 0, 0)
  return result
}

export function padTwo(n: number): string {
  return String(n).padStart(2, '0')
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`
}

export type PeriodParams = {
  period: 'weekly' | 'monthly' | 'yearly'
  week?: string  // YYYY-MM-DD (Monday of the week)
  month?: string // YYYY-MM
  year?: string  // YYYY
}

export type DateRange = {
  statsFrom: Date
  statsTo: Date
  chartFrom: Date
  chartTo: Date
  groupBy: 'day' | 'week' | 'month'
}

export function getDateRange(params: PeriodParams): DateRange {
  const now = new Date()

  if (params.period === 'weekly') {
    const weekStart = params.week
      ? new Date(`${params.week}T00:00:00`)
      : startOfISOWeek(now)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    return { statsFrom: weekStart, statsTo: weekEnd, chartFrom: weekStart, chartTo: weekEnd, groupBy: 'day' }
  }

  if (params.period === 'monthly') {
    const [y, m] = params.month
      ? params.month.split('-').map(Number)
      : [now.getFullYear(), now.getMonth() + 1]
    const from = new Date(y, m - 1, 1)
    const to = new Date(y, m, 0, 23, 59, 59, 999)
    return { statsFrom: from, statsTo: to, chartFrom: from, chartTo: to, groupBy: 'week' }
  }

  // yearly
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const from = new Date(year, 0, 1)
  const to = new Date(year, 11, 31, 23, 59, 59, 999)
  return { statsFrom: from, statsTo: to, chartFrom: new Date(0), chartTo: to, groupBy: 'month' }
}
