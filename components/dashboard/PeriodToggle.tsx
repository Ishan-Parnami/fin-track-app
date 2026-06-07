'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toYearMonth, startOfISOWeek, toISODate } from '@/lib/utils'
import type { Period } from '@/types'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

interface PeriodToggleProps {
  currentPeriod: Period
}

export function PeriodToggle({ currentPeriod }: PeriodToggleProps) {
  const router = useRouter()

  function handlePeriod(p: Period) {
    const params = new URLSearchParams()
    params.set('period', p)
    const now = new Date()
    if (p === 'weekly') {
      params.set('week', toISODate(startOfISOWeek(now)))
    } else if (p === 'monthly') {
      params.set('month', toYearMonth(now))
    } else {
      params.set('year', String(now.getFullYear()))
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 rounded-lg border border-border p-0.5">
      {PERIODS.map((p) => (
        <Button
          key={p.value}
          variant={currentPeriod === p.value ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => handlePeriod(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  )
}
