'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function getYearOptions() {
  const currentYear = new Date().getFullYear()
  const options: { value: string; label: string }[] = []
  for (let y = currentYear; y >= currentYear - 4; y--) {
    options.push({ value: String(y), label: String(y) })
  }
  return options
}

interface YearSelectorProps {
  currentYear: string
}

export function YearSelector({ currentYear }: YearSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const options = getYearOptions()

  const selectedYear = currentYear || String(new Date().getFullYear())

  function handleChange(value: string | null) {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', value)
    params.delete('month')
    params.delete('week')
    router.push(`?${params.toString()}`)
  }

  return (
    <Select value={selectedYear} onValueChange={handleChange}>
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
