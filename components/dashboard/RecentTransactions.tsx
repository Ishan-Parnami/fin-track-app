import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { TransactionWithCategory } from '@/types'

interface RecentTransactionsProps {
  transactions: TransactionWithCategory[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</p>
    )
  }

  return (
    <div className="divide-y divide-border">
      {transactions.map((tx) => (
        <Link
          key={tx.id}
          href={`/dashboard/transactions/${tx.id}`}
          className="flex items-center gap-3 py-3 hover:bg-muted/50 px-2 rounded-lg transition-colors -mx-2"
        >
          <span className="text-xl shrink-0">{tx.category?.icon ?? '💰'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{tx.description ?? tx.category?.name ?? 'Transaction'}</p>
            <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-bold font-numeric ${tx.type === 'income' ? 'text-emerald-500' : 'text-amber-500'}`}>
              {tx.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
            </p>
            {tx.category && (
              <Badge variant="secondary" className="text-[10px] h-4 mt-0.5">
                {tx.category.name}
              </Badge>
            )}
          </div>
        </Link>
      ))}
      <div className="pt-3">
        <Link href="/dashboard/transactions" className="text-xs text-primary hover:underline">
          View all transactions →
        </Link>
      </div>
    </div>
  )
}
