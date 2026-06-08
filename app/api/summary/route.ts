import { and, desc, eq, gte, lte, sql, sum } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, transactions } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth-guard'
import { ok } from '@/lib/api-response'
import { getDateRange } from '@/lib/utils'
import { RECENT_TRANSACTIONS_COUNT, SUMMARY_CACHE_SECONDS } from '@/lib/constants'
import type { CategorySummary, ChartPoint, DashboardSummary, TransactionWithCategory } from '@/types'

function safeParse(val: string | null): number {
  return parseFloat(val ?? '0') || 0
}

export async function GET(request: Request) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  const { searchParams } = new URL(request.url)
  const period = (searchParams.get('period') ?? 'monthly') as 'weekly' | 'monthly' | 'yearly'
  const weekParam = searchParams.get('week') ?? undefined
  const monthParam = searchParams.get('month') ?? undefined
  const yearParam = searchParams.get('year') ?? undefined

  const { statsFrom, statsTo, chartFrom, chartTo, groupBy } = getDateRange({
    period,
    week: weekParam,
    month: monthParam,
    year: yearParam,
  })

  const userWhere = eq(transactions.userId, userId)

  // --- Summary stats (exact selected period) ---
  const [incomeRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(userWhere, eq(transactions.type, 'income'), gte(transactions.date, statsFrom), lte(transactions.date, statsTo)))

  const [expenseRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(userWhere, eq(transactions.type, 'expense'), gte(transactions.date, statsFrom), lte(transactions.date, statsTo)))

  const totalIncome = safeParse(incomeRow.total)
  const totalExpense = safeParse(expenseRow.total)
  const netBalance = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0

  // --- Category breakdown (exact selected period) ---
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
    .where(
      and(userWhere, eq(transactions.type, 'expense'), gte(transactions.date, statsFrom), lte(transactions.date, statsTo))
    )
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

  // --- Period-aware chart data ---
  let chartData: ChartPoint[] = []

  if (groupBy === 'day') {
    const rows = await db
      .select({
        day: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM-DD')`,
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(and(userWhere, gte(transactions.date, chartFrom), lte(transactions.date, chartTo)))
      .groupBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM-DD')`, transactions.type)

    const dayMap: Record<string, { income: number; expense: number }> = {}
    for (const r of rows) {
      if (!dayMap[r.day]) dayMap[r.day] = { income: 0, expense: 0 }
      dayMap[r.day][r.type] += safeParse(r.total)
    }
    chartData = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => {
        const d = new Date(`${day}T00:00:00`)
        const label = d.toLocaleString('default', { weekday: 'short', month: 'short', day: 'numeric' })
        return { label, income: v.income, expense: v.expense, balance: v.income - v.expense }
      })
  } else if (groupBy === 'week') {
    // Monthly period: group by week-of-month (1–5)
    const rows = await db
      .select({
        week: sql<string>`TO_CHAR(${transactions.date}, 'W')`,
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(and(userWhere, gte(transactions.date, chartFrom), lte(transactions.date, chartTo)))
      .groupBy(sql`TO_CHAR(${transactions.date}, 'W')`, transactions.type)

    const weekMap: Record<string, { income: number; expense: number }> = {}
    for (const r of rows) {
      if (!weekMap[r.week]) weekMap[r.week] = { income: 0, expense: 0 }
      weekMap[r.week][r.type] += safeParse(r.total)
    }
    chartData = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([w, v]) => ({ label: `Week ${w}`, income: v.income, expense: v.expense, balance: v.income - v.expense }))
  } else {
    // Yearly: group by month (Jan–Dec of selected year), cross-year comparison uses all time
    const rows = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(and(userWhere, gte(transactions.date, chartFrom), lte(transactions.date, chartTo)))
      .groupBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`, transactions.type)

    const monthMap: Record<string, { income: number; expense: number }> = {}
    for (const r of rows) {
      if (!monthMap[r.month]) monthMap[r.month] = { income: 0, expense: 0 }
      monthMap[r.month][r.type] += safeParse(r.total)
    }
    chartData = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => {
        const [y, m] = month.split('-')
        const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'short', year: '2-digit' })
        return { label, income: v.income, expense: v.expense, balance: v.income - v.expense }
      })
  }

  // --- Recent 5 transactions (all time) ---
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
    .where(userWhere)
    .orderBy(desc(transactions.date))
    .limit(RECENT_TRANSACTIONS_COUNT)

  const recentTransactions: TransactionWithCategory[] = recentRows.map((r) => ({
    ...r,
    category: r.category?.id ? r.category : null,
  }))

  const data: DashboardSummary = {
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
    byCategory,
    chartData,
    recentTransactions,
  }

  const response = ok(data)
  response.headers.set('Cache-Control', `private, max-age=${SUMMARY_CACHE_SECONDS}`)
  return response
}
