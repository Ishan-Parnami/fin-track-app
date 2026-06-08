'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TransactionForm, type TransactionFormValues } from './TransactionForm'
import { addTransaction } from '@/lib/actions/transactions'
import type { Category } from '@/types'

interface AddTransactionDialogProps {
  categories: Category[]
}

export function AddTransactionDialog({ categories }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(values: TransactionFormValues) {
    const formData = new FormData()
    formData.set('type', values.type)
    formData.set('amount', values.amount.toString())
    formData.set('date', values.date)
    if (values.description) formData.set('description', values.description)
    if (values.categoryId) formData.set('categoryId', values.categoryId)

    const result = await addTransaction(formData)
    if (result.success) {
      toast.success('Transaction added')
      setOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>
        <TransactionForm categories={categories} onSubmit={handleSubmit} submitLabel="Add Transaction" />
      </DialogContent>
    </Dialog>
  )
}
