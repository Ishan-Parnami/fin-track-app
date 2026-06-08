'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TransactionForm, type TransactionFormValues } from './TransactionForm'
import { cloneTransaction } from '@/lib/actions/transactions'
import type { Category, TransactionWithCategory } from '@/types'

interface CloneTransactionDialogProps {
  transaction: TransactionWithCategory
  categories: Category[]
}

export function CloneTransactionDialog({ transaction, categories }: CloneTransactionDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSubmit(values: TransactionFormValues) {
    const result = await cloneTransaction(transaction.id, {
      date: values.date,
      amount: values.amount,
      description: values.description,
      categoryId: values.categoryId,
      type: values.type,
    })
    if (result.success) {
      toast.success('Transaction cloned')
      setOpen(false)
      router.push(`/dashboard/transactions/${result.newId}`)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Copy className="h-4 w-4" />
            Clone
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Transaction</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2 mb-2">
          Edit any details before saving the cloned transaction.
        </p>
        <TransactionForm
          categories={categories}
          defaultValues={{
            type: transaction.type,
            amount: parseFloat(transaction.amount),
            description: transaction.description ?? undefined,
            categoryId: transaction.categoryId ?? undefined,
            date: new Date().toISOString().split('T')[0],
          }}
          onSubmit={handleSubmit}
          submitLabel="Clone Transaction"
        />
      </DialogContent>
    </Dialog>
  )
}
