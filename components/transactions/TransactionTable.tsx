'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TransactionForm, type TransactionFormValues } from './TransactionForm'
import { deleteTransaction, updateTransaction } from '@/lib/actions/transactions'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Category, TransactionWithCategory } from '@/types'

interface TransactionTableProps {
  transactions: TransactionWithCategory[]
  categories: Category[]
}

export function TransactionTable({ transactions, categories }: TransactionTableProps) {
  const router = useRouter()
  const [editTx, setEditTx] = useState<TransactionWithCategory | null>(null)

  async function handleDelete(id: string) {
    const result = await deleteTransaction(id)
    if (result.success) {
      toast.success('Transaction deleted')
    } else {
      toast.error(result.error)
    }
  }

  async function handleEdit(values: TransactionFormValues) {
    if (!editTx) return
    const formData = new FormData()
    formData.set('type', values.type)
    formData.set('amount', values.amount.toString())
    formData.set('date', values.date)
    if (values.description) formData.set('description', values.description)
    if (values.categoryId) formData.set('categoryId', values.categoryId)
    const result = await updateTransaction(editTx.id, formData)
    if (result.success) {
      toast.success('Transaction updated')
      setEditTx(null)
    } else {
      toast.error(result.error)
    }
  }

  if (transactions.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No transactions found.</p>
  }

  return (
    <>
      <div className="divide-y divide-border">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-3 py-3 px-2 hover:bg-muted/40 rounded-lg -mx-2 group cursor-pointer transition-colors"
            onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
          >
            <span className="text-xl shrink-0">{tx.category?.icon ?? '💰'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tx.description ?? tx.category?.name ?? 'Transaction'}</p>
              <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
            </div>
            <Badge
              variant="secondary"
              className="text-xs hidden sm:flex"
              style={{ backgroundColor: `${tx.category?.color}20`, color: tx.category?.color }}
            >
              {tx.category?.name ?? 'Uncategorized'}
            </Badge>
            <p className={`text-sm font-bold font-numeric shrink-0 ${tx.type === 'income' ? 'text-emerald-500' : 'text-amber-500'}`}>
              {tx.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
            </p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditTx(tx)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                }
                title="Delete Transaction"
                description="This action cannot be undone."
                confirmLabel="Delete"
                destructive
                onConfirm={() => handleDelete(tx.id)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTx} onOpenChange={(o) => !o && setEditTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editTx && (
            <TransactionForm
              categories={categories}
              defaultValues={{
                type: editTx.type,
                amount: parseFloat(editTx.amount),
                description: editTx.description ?? undefined,
                categoryId: editTx.categoryId ?? undefined,
                date: new Date(editTx.date).toISOString().split('T')[0],
              }}
              onSubmit={handleEdit}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
