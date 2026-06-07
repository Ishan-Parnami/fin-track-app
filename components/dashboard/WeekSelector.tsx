'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { startOfISOWeek, toISODate } from '@/lib/utils'

function getLast5Weeks(): { value: string; label: string }[] {
  const weeks: { value: string; label: string }[] = []
  const now = new Date()
  const thisMon = startOfISOWeek(now)

  for (let i = 0; i < 5; i++) {
    const start = new Date(thisMon)
    start.setDate(thisMon.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    const value = toISODate(start)
    const label = `${start.toLocaleString('default', { month: 'short', day: 'numeric' })} – ${end.toLocaleString('default', { month: 'short', day: 'numeric', year: i > 0 && start.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })}`
    weeks.push({ value, label })
  }
  return weeks
}

interface WeekSelectorProps {
  currentWeek: string
}

export function WeekSelector({ currentWeek }: WeekSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const weeks = getLast5Weeks()

  const selectedWeek = currentWeek || weeks[0]?.value || ''

  function handleChange(week: string | null) {
    if (!week) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('week', week)
    params.delete('month')
    params.delete('year')
    router.push(`?${params.toString()}`)
  }

  return (
    <Select value={selectedWeek} onValueChange={handleChange}>
      <SelectTrigger className="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {weeks.map((w) => (
          <SelectItem key={w.value} value={w.value}>
            {w.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
