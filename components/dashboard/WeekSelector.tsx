'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function getWeeksInMonth(month: string) {
  const [year, mon] = month.split('-').map(Number)
  const weeks: { value: string; label: string }[] = []
  const firstDay = new Date(year, mon - 1, 1)
  const lastDay = new Date(year, mon, 0)

  let weekStart = new Date(firstDay)
  let weekNum = 1
  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime())

    const value = `${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}-${pad(weekStart.getDate())}`
    const label = `Week ${weekNum}: ${weekStart.toLocaleString('default', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleString('default', { month: 'short', day: 'numeric' })}`
    weeks.push({ value, label })

    weekStart = new Date(weekStart)
    weekStart.setDate(weekStart.getDate() + 7)
    weekNum++
  }
  return weeks
}

interface WeekSelectorProps {
  month: string
  currentWeek: string
}

export function WeekSelector({ month, currentWeek }: WeekSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const weeks = getWeeksInMonth(month)

  // Default to first week if none selected
  const selectedWeek = currentWeek || weeks[0]?.value || ''

  function handleChange(week: string | null) {
    if (!week) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('week', week)
    router.push(`?${params.toString()}`)
  }

  return (
    <Select value={selectedWeek} onValueChange={handleChange}>
      <SelectTrigger className="w-56">
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
