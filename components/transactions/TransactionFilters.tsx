'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Category } from '@/types'

interface TransactionFiltersProps {
  categories: Category[]
}

export function TransactionFilters({ categories }: TransactionFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  const months: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    months.push({ value, label })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Type */}
      <Select
        defaultValue={searchParams.get('type') ?? 'all'}
        onValueChange={(v) => update('type', v ?? 'all')}
      >
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>

      {/* Category */}
      <Select
        defaultValue={searchParams.get('categoryId') ?? 'all'}
        onValueChange={(v) => update('categoryId', v ?? 'all')}
      >
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.icon} {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month */}
      <Select
        defaultValue={searchParams.get('month') ?? 'all'}
        onValueChange={(v) => {
          if (!v || v === 'all') {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('from')
            params.delete('to')
            params.delete('page')
            router.push(`?${params.toString()}`)
          } else {
            const [year, mon] = v.split('-').map(Number)
            const from = new Date(year, mon - 1, 1).toISOString().split('T')[0]
            const to = new Date(year, mon, 0).toISOString().split('T')[0]
            const params = new URLSearchParams(searchParams.toString())
            params.set('from', from)
            params.set('to', to)
            params.delete('page')
            router.push(`?${params.toString()}`)
          }
        }}
      >
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Per page */}
      <Select
        defaultValue={searchParams.get('limit') ?? '10'}
        onValueChange={(v) => update('limit', v ?? '10')}
      >
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 / page</SelectItem>
          <SelectItem value="20">20 / page</SelectItem>
          <SelectItem value="50">50 / page</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
