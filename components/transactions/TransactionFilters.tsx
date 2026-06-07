'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { Category } from '@/types'

interface TransactionFiltersProps {
  categories: Category[]
}

function pad(n: number) {
  return String(n).padStart(2, '0')
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
    const value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    months.push({ value, label })
  }

  // Derive selected month from from/to params (month select doesn't set a 'month' param directly)
  const fromParam = searchParams.get('from')
  const selectedMonth = fromParam ? fromParam.slice(0, 7) : 'all'

  const selectedType = searchParams.get('type') ?? 'all'
  const selectedCategoryId = searchParams.get('categoryId') ?? 'all'

  const filteredCategories = selectedType === 'income' || selectedType === 'expense'
    ? categories.filter((c) => c.type === selectedType)
    : categories
  const selectedLimit = searchParams.get('limit') ?? '10'

  const selectedTypeLabel = selectedType === 'income' ? 'Income' : selectedType === 'expense' ? 'Expense' : 'All Types'
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const selectedMonthLabel = months.find((m) => m.value === selectedMonth)?.label ?? 'All Months'
  const selectedLimitLabel = `${selectedLimit} / page`

  return (
    <div className="flex flex-wrap gap-2">
      {/* Type */}
      <Select
        value={selectedType}
        onValueChange={(v) => {
          const params = new URLSearchParams(searchParams.toString())
          const val = v ?? 'all'
          if (val === 'all') params.delete('type'); else params.set('type', val)
          params.delete('categoryId')
          params.delete('page')
          router.push(`?${params.toString()}`)
        }}
      >
        <SelectTrigger className="w-32 h-8 text-xs">
          <span>{selectedTypeLabel}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>

      {/* Category */}
      <Select
        value={selectedCategoryId}
        onValueChange={(v) => update('categoryId', v ?? 'all')}
      >
        <SelectTrigger className="w-40 h-8 text-xs">
          {selectedCategory ? (
            <span>{selectedCategory.icon} {selectedCategory.name}</span>
          ) : (
            <span>All Categories</span>
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {filteredCategories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.icon} {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month */}
      <Select
        value={selectedMonth}
        onValueChange={(v) => {
          const params = new URLSearchParams(searchParams.toString())
          if (!v || v === 'all') {
            params.delete('from')
            params.delete('to')
          } else {
            const [year, mon] = v.split('-').map(Number)
            // Build dates without UTC conversion to avoid off-by-one
            const from = `${year}-${pad(mon)}-01`
            const lastDay = new Date(year, mon, 0).getDate()
            const to = `${year}-${pad(mon)}-${pad(lastDay)}`
            params.set('from', from)
            params.set('to', to)
          }
          params.delete('page')
          router.push(`?${params.toString()}`)
        }}
      >
        <SelectTrigger className="w-44 h-8 text-xs">
          <span>{selectedMonthLabel}</span>
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
        value={selectedLimit}
        onValueChange={(v) => update('limit', v ?? '10')}
      >
        <SelectTrigger className="w-24 h-8 text-xs">
          <span>{selectedLimitLabel}</span>
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
