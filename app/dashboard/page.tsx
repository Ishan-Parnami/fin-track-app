import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { and, desc, eq, gte, lte, or, isNull, sum } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions, categories } from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { WeekSelector } from '@/components/dashboard/WeekSelector'
import { YearSelector } from '@/components/dashboard/YearSelector'
import { PeriodToggle } from '@/components/dashboard/PeriodToggle'
import { ResetFilters } from '@/components/shared/ResetFilters'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { ChartsSection } from '@/components/dashboard/ChartsSection'
import { AddTransactionDialog } from '@/components/transactions/AddTransactionDialog'
import { getDateRange, toYearMonth, startOfISOWeek, toISODate } from '@/lib/utils'
import type { DashboardSummary, CategorySummary, ChartPoint, TransactionWithCategory, Period } from '@/types'

export const dynamic = 'force-dynamic'

function safeParse(val: string | null): number {
  return parseFloat(val ?? '0') || 0
}

async function getDashboardData(userId: string, period: Period, week?: string, month?: string, year?: string): Promise<DashboardSummary> {
  const { statsFrom: from, statsTo: to } = getDateRange({ period, week, month, year })
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

  const chartData: ChartPoint[] = []

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
  searchParams: Promise<{ month?: string; period?: string; week?: string; year?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const { month: monthParam, period: periodParam, week: weekParam, year: yearParam } = await searchParams
  const period: Period = (periodParam === 'weekly' || periodParam === 'yearly') ? periodParam : 'monthly'
  const now = new Date()
  const month = monthParam ?? toYearMonth(now)
  const week = weekParam ?? toISODate(startOfISOWeek(now))
  const year = yearParam ?? String(now.getFullYear())

  const [summaryData, userCategories] = await Promise.all([
    getDashboardData(session.user.id, period, weekParam, monthParam, yearParam),
    getUserCategories(session.user.id),
  ])

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Suspense fallback={<Skeleton className="h-8 w-28" />}>
            <PeriodToggle currentPeriod={period} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-9 w-44" />}>
            {period === 'weekly' ? (
              <WeekSelector currentWeek={week} />
            ) : period === 'yearly' ? (
              <YearSelector currentYear={year} />
            ) : (
              <MonthSelector currentMonth={month} />
            )}
          </Suspense>
          <Suspense fallback={null}>
            <ResetFilters />
          </Suspense>
        </div>
        <AddTransactionDialog categories={userCategories} />
      </div>

      {/* Summary cards */}
      <SummaryCards stats={summaryData} />

      {/* Charts */}
      <ChartsSection initialData={summaryData} />

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
            <RecentTransactions transactions={summaryData.recentTransactions} month={month} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
