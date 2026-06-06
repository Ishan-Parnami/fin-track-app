import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { and, desc, eq, gte, lte, or, isNull, sql, sum } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions, categories } from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { ChartsSection } from '@/components/dashboard/ChartsSection'
import { AddTransactionDialog } from '@/components/transactions/AddTransactionDialog'
import { currentMonthParam, getMonthRange } from '@/lib/utils'
import type { DashboardSummary, CategorySummary, ChartPoint, TransactionWithCategory } from '@/types'

export const dynamic = 'force-dynamic'

function safeParse(val: string | null): number {
  return parseFloat(val ?? '0') || 0
}

async function getDashboardData(userId: string, month: string): Promise<DashboardSummary> {
  const { from, to } = getMonthRange(month)
  const userWhere = eq(transactions.userId, userId)

  const [incomeRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(userWhere, eq(transactions.type, 'income'), gte(transactions.date, from), lte(transactions.date, to)))

  const [expenseRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(userWhere, eq(transactions.type, 'expense'), gte(transactions.date, from), lte(transactions.date, to)))

  const totalIncome = safeParse(incomeRow.total)
  const totalExpense = safeParse(expenseRow.total)
  const netBalance = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0

  const catRows = await db
    .select({
      categoryId: transactions.categoryId,
      total: sum(transactions.amount),
      name: categories.name,
      color: categories.color,
      icon: categories.icon,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(userWhere, eq(transactions.type, 'expense'), gte(transactions.date, from), lte(transactions.date, to)))
    .groupBy(transactions.categoryId, categories.name, categories.color, categories.icon)

  const byCategory: CategorySummary[] = catRows
    .map((r) => ({
      id: r.categoryId ?? 'uncategorized',
      name: r.name ?? 'Uncategorized',
      color: r.color ?? '#6366f1',
      icon: r.icon ?? '💰',
      total: safeParse(r.total),
      percentage: totalExpense > 0 ? Math.round((safeParse(r.total) / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // Monthly chart data (last 12 months default)
  const twelveMonthsAgo = new Date(from)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
  const chartRows = await db
    .select({
      month: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
      type: transactions.type,
      total: sum(transactions.amount),
    })
    .from(transactions)
    .where(and(userWhere, gte(transactions.date, twelveMonthsAgo), lte(transactions.date, to)))
    .groupBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`, transactions.type)

  const monthMap: Record<string, { income: number; expense: number }> = {}
  for (const r of chartRows) {
    if (!monthMap[r.month]) monthMap[r.month] = { income: 0, expense: 0 }
    monthMap[r.month][r.type] += safeParse(r.total)
  }
  const chartData: ChartPoint[] = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => {
      const [y, mo] = m.split('-')
      const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString('default', { month: 'short', year: '2-digit' })
      return { label, income: v.income, expense: v.expense, balance: v.income - v.expense }
    })

  const recentRows = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      type: transactions.type,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
      categoryId: transactions.categoryId,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      category: {
        id: categories.id,
        userId: categories.userId,
        name: categories.name,
        type: categories.type,
        color: categories.color,
        icon: categories.icon,
        isDefault: categories.isDefault,
        createdAt: categories.createdAt,
      },
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date))
    .limit(5)

  const recentTransactions: TransactionWithCategory[] = recentRows.map((r) => ({
    ...r,
    category: r.category?.id ? r.category : null,
  }))

  return { totalIncome, totalExpense, netBalance, savingsRate, byCategory, chartData, recentTransactions }
}

async function getUserCategories(userId: string) {
  return db.query.categories.findMany({
    where: or(isNull(categories.userId), eq(categories.userId, userId)),
  })
}

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const { month: monthParam } = await searchParams
  const month = monthParam ?? currentMonthParam()

  const [summaryData, userCategories] = await Promise.all([
    getDashboardData(session.user.id, month),
    getUserCategories(session.user.id),
  ])

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Suspense fallback={<Skeleton className="h-9 w-44" />}>
          <MonthSelector currentMonth={month} />
        </Suspense>
        <AddTransactionDialog categories={userCategories} />
      </div>

      {/* Summary cards */}
      <SummaryCards stats={summaryData} />

      {/* Charts */}
      <ChartsSection month={month} initialData={summaryData} />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown categories={summaryData.byCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={summaryData.recentTransactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
