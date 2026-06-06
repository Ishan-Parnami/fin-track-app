import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'INR'): string {
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

export function getMonthRange(month: string): { from: Date; to: Date } {
  const [year, mon] = month.split('-').map(Number)
  const from = new Date(year, mon - 1, 1)
  const to = new Date(year, mon, 0, 23, 59, 59, 999)
  return { from, to }
}

export function currentMonthParam(): string {
  return new Date().toISOString().slice(0, 7)
}
