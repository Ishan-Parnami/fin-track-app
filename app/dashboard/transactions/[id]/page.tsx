import { redirect, notFound } from 'next/navigation'
import { and, eq, isNull, or } from 'drizzle-orm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions, categories } from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CloneTransactionDialog } from '@/components/transactions/CloneTransactionDialog'
import { EditTransactionSection } from '@/components/transactions/EditTransactionSection'
import { DeleteTransactionButton } from '@/components/transactions/DeleteTransactionButton'
import { formatCurrency, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  const userId = session.user.id

  const { id } = await params
  const tx = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
    with: { category: true },
  })
  if (!tx) notFound()

  const userCategories = await db.query.categories.findMany({
    where: or(isNull(categories.userId), eq(categories.userId, userId)),
  })

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/transactions"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold">Transaction Details</h2>
      </div>

      {/* Detail card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tx.category?.icon ?? '💰'}</span>
              <div>
                <CardTitle className="text-base">{tx.description ?? tx.category?.name ?? 'Transaction'}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.date)}</p>
              </div>
            </div>
            <p className={`text-2xl font-bold font-numeric ${tx.type === 'income' ? 'text-emerald-500' : 'text-amber-500'}`}>
              {tx.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <Badge variant={tx.type === 'income' ? 'default' : 'secondary'} className="capitalize">
              {tx.type}
            </Badge>
          </div>
          {tx.category && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Category</span>
              <Badge
                variant="outline"
                style={{ borderColor: tx.category.color, color: tx.category.color }}
              >
                {tx.category.icon} {tx.category.name}
              </Badge>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Created</span>
            <span className="text-xs">{formatDate(tx.createdAt)}</span>
          </div>
          {tx.updatedAt.getTime() !== tx.createdAt.getTime() && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Updated</span>
              <span className="text-xs">{formatDate(tx.updatedAt)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <CloneTransactionDialog transaction={tx} categories={userCategories} />
        <DeleteTransactionButton id={tx.id} />
      </div>

      {/* Edit section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Edit Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <EditTransactionSection transaction={tx} categories={userCategories} />
        </CardContent>
      </Card>
    </div>
  )
}
