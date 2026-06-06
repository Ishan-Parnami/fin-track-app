'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { deleteTransaction } from '@/lib/actions/transactions'

interface DeleteTransactionButtonProps {
  id: string
}

export function DeleteTransactionButton({ id }: DeleteTransactionButtonProps) {
  const router = useRouter()

  async function handleDelete() {
    const result = await deleteTransaction(id)
    if (result.success) {
      toast.success('Transaction deleted')
      router.push('/dashboard/transactions')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="destructive" size="sm" className="gap-1.5">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      }
      title="Delete Transaction"
      description="This action cannot be undone."
      confirmLabel="Delete"
      destructive
      onConfirm={handleDelete}
    />
  )
}
