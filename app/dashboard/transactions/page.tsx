import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { and, desc, eq, gte, isNull, lte, or, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions, categories } from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { AddTransactionDialog } from '@/components/transactions/AddTransactionDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ResetFilters } from '@/components/shared/ResetFilters'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { TransactionWithCategory } from '@/types'

export const dynamic = 'force-dynamic'

interface TransactionsPageProps {
  searchParams: Promise<{
    type?: string
    categoryId?: string
    from?: string
    to?: string
    page?: string
    limit?: string
  }>
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  const userId = session.user.id

  const params = await searchParams
  const type = params.type as 'income' | 'expense' | undefined
  const categoryId = params.categoryId
  const from = params.from
  const to = params.to
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const limit = Math.min(50, parseInt(params.limit ?? '10'))
  const offset = (page - 1) * limit

  const conditions = [eq(transactions.userId, userId)]
  if (type === 'income' || type === 'expense') conditions.push(eq(transactions.type, type))
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId))
  if (from) conditions.push(gte(transactions.date, new Date(`${from}T00:00:00`)))
  if (to) conditions.push(lte(transactions.date, new Date(`${to}T23:59:59`)))
  const where = and(...conditions)

  const [rawItems, [{ total }], userCategories] = await Promise.all([
    db
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
      .where(where)
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(transactions).where(where),
    db.query.categories.findMany({
      where: or(isNull(categories.userId), eq(categories.userId, userId)),
    }),
  ])

  const items: TransactionWithCategory[] = rawItems.map((r) => ({
    ...r,
    category: r.category?.id ? r.category : null,
  }))

  const totalPages = Math.ceil(total / limit)

  function pageLink(p: number) {
    const sp = new URLSearchParams()
    if (type) sp.set('type', type)
    if (categoryId) sp.set('categoryId', categoryId)
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    if (limit !== 10) sp.set('limit', limit.toString())
    sp.set('page', p.toString())
    return `?${sp.toString()}`
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">All Transactions</h2>
        <AddTransactionDialog categories={userCategories} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Suspense fallback={<Skeleton className="h-8 w-full" />}>
          <TransactionFilters categories={userCategories} />
        </Suspense>
        <Suspense fallback={null}>
          <ResetFilters />
        </Suspense>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {total} transaction{total !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No transactions found"
              description="Try adjusting your filters, or add your first transaction."
            />
          ) : (
            <TransactionTable transactions={items} categories={userCategories} />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                {page > 1 && (
                  <Link
                    href={pageLink(page - 1)}
                    className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={pageLink(page + 1)}
                    className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
