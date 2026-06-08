'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TransactionForm, type TransactionFormValues } from './TransactionForm'
import { updateTransaction } from '@/lib/actions/transactions'
import type { Category, TransactionWithCategory } from '@/types'

interface EditTransactionSectionProps {
  transaction: TransactionWithCategory
  categories: Category[]
}

export function EditTransactionSection({ transaction, categories }: EditTransactionSectionProps) {
  const router = useRouter()

  async function handleSubmit(values: TransactionFormValues) {
    const formData = new FormData()
    formData.set('type', values.type)
    formData.set('amount', values.amount.toString())
    formData.set('date', values.date)
    if (values.description) formData.set('description', values.description)
    if (values.categoryId) formData.set('categoryId', values.categoryId)
    const result = await updateTransaction(transaction.id, formData)
    if (result.success) {
      toast.success('Transaction updated')
      router.push('/dashboard/transactions')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <TransactionForm
      categories={categories}
      defaultValues={{
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        description: transaction.description ?? undefined,
        categoryId: transaction.categoryId ?? undefined,
        date: new Date(transaction.date).toISOString().split('T')[0],
      }}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      requireDirty
      onCancel={() => router.push('/dashboard/transactions')}
    />
  )
}
