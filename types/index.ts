import type { Category, Transaction, User } from '@/lib/db/schema'

export type TransactionWithCategory = Transaction & {
  category: Category | null
}

export type SummaryStats = {
  totalIncome: number
  totalExpense: number
  netBalance: number
  savingsRate: number
}

export type ChartPoint = {
  label: string
  income: number
  expense: number
  balance: number
}

export type CategorySummary = {
  id: string
  name: string
  color: string
  icon: string
  total: number
  percentage: number
}

export type DashboardSummary = SummaryStats & {
  byCategory: CategorySummary[]
  chartData: ChartPoint[]
  recentTransactions: TransactionWithCategory[]
}

export type Period = 'weekly' | 'monthly' | 'yearly'

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export { User, Category, Transaction }
