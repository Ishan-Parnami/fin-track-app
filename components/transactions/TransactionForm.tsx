'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { Category } from '@/types'

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().uuid('Category is required'),
  description: z.string().max(500).optional(),
  date: z.string().min(1, 'Date is required'),
})

export type TransactionFormValues = z.infer<typeof formSchema>

interface TransactionFormProps {
  categories: Category[]
  defaultValues?: Partial<TransactionFormValues>
  onSubmit: (values: TransactionFormValues) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  loading?: boolean
  requireDirty?: boolean
}

export function TransactionForm({ categories, defaultValues, onSubmit, onCancel, submitLabel = 'Save', loading, requireDirty = false }: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  })

  const type = watch('type')
  const categoryId = watch('categoryId')
  const filteredCategories = categories.filter((c) => c.type === type)
  const selectedCategory = filteredCategories.find((c) => c.id === categoryId)
  const submitting = isSubmitting || loading

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type toggle */}
      <div className="space-y-1.5">
        <Label>Type</Label>
        <div className="flex rounded-lg border border-input overflow-hidden">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setValue('type', t); setValue('categoryId', '') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
                type === t
                  ? t === 'income' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  : 'bg-background hover:bg-muted text-muted-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          className="font-numeric"
          {...register('amount', { valueAsNumber: true })}
        />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" {...register('date')} />
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select
          key={type}
          value={categoryId ?? null}
          onValueChange={(v) => setValue('categoryId', v ?? '')}
        >
          <SelectTrigger>
            {selectedCategory ? (
              <span className="flex items-center gap-1.5">
                <span>{selectedCategory.icon}</span>
                <span>{selectedCategory.name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Select category</span>
            )}
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" placeholder="What was this for?" {...register('description')} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={submitting || (requireDirty && !isDirty)}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onCancel() }}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
