import { and, desc, eq, gte, lte, sql, sum } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, transactions } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth-guard'
import { ok, err } from '@/lib/api-response'
import type { CategorySummary, ChartPoint, DashboardSummary, TransactionWithCategory } from '@/types'

function parseMonth(month: string): { from: Date; to: Date } {
  const [year, mon] = month.split('-').map(Number)
  const from = new Date(year, mon - 1, 1)
  const to = new Date(year, mon, 0, 23, 59, 59, 999)
  return { from, to }
}

function safeParse(val: string | null): number {
  return parseFloat(val ?? '0') || 0
}

export async function GET(request: Request) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
  const period = (searchParams.get('period') ?? 'monthly') as 'weekly' | 'monthly' | 'yearly'

  if (!/^\d{4}-\d{2}$/.test(monthParam)) {
    return err('INVALID_MONTH', 'Month must be in YYYY-MM format', 400)
  }

  const { from, to } = parseMonth(monthParam)
  const userWhere = eq(transactions.userId, userId)

  // --- Summary stats for selected month ---
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

  // --- Category breakdown (expenses for selected month) ---
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
      and(userWhere, eq(transactions.type, 'expense'), gte(transactions.date, from), lte(transactions.date, to))
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

  if (period === 'weekly') {
    // Aggregate by day within selected month
    const rows = await db
      .select({
        day: sql<string>`TO_CHAR(${transactions.date}, 'DD')`,
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(and(userWhere, gte(transactions.date, from), lte(transactions.date, to)))
      .groupBy(sql`TO_CHAR(${transactions.date}, 'DD')`, transactions.type)

    const dayMap: Record<string, { income: number; expense: number }> = {}
    for (const r of rows) {
      const d = r.day
      if (!dayMap[d]) dayMap[d] = { income: 0, expense: 0 }
      dayMap[d][r.type] += safeParse(r.total)
    }
    chartData = Object.entries(dayMap)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([day, v]) => ({
        label: `Day ${parseInt(day)}`,
        income: v.income,
        expense: v.expense,
        balance: v.income - v.expense,
      }))
  } else if (period === 'monthly') {
    // Last 12 months
    const twelveMonthsAgo = new Date(from)
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)

    const rows = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(and(userWhere, gte(transactions.date, twelveMonthsAgo), lte(transactions.date, to)))
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
  } else {
    // yearly — by year
    const rows = await db
      .select({
        year: sql<string>`TO_CHAR(${transactions.date}, 'YYYY')`,
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .groupBy(sql`TO_CHAR(${transactions.date}, 'YYYY')`, transactions.type)

    const yearMap: Record<string, { income: number; expense: number }> = {}
    for (const r of rows) {
      if (!yearMap[r.year]) yearMap[r.year] = { income: 0, expense: 0 }
      yearMap[r.year][r.type] += safeParse(r.total)
    }
    chartData = Object.entries(yearMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, v]) => ({ label: year, income: v.income, expense: v.expense, balance: v.income - v.expense }))
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
    .limit(5)

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

  return ok(data)
}
