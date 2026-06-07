'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

const PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const

type Period = 'weekly' | 'monthly' | 'yearly'

export function PeriodToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const period = (searchParams.get('period') ?? 'monthly') as Period

  function handlePeriod(p: Period) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', p)
    // Clear week when switching away from weekly
    if (p !== 'weekly') params.delete('week')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 rounded-lg border border-border p-0.5">
      {PERIODS.map((p) => (
        <Button
          key={p.value}
          variant={period === p.value ? 'default' : 'ghost'}
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
