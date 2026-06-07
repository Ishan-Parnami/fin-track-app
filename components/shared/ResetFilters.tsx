'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

interface ResetFiltersProps {
  /** Params to preserve on reset (e.g. non-filter params). Defaults to none. */
  keep?: string[]
}

export function ResetFilters({ keep = [] }: ResetFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const hasFilters = [...searchParams.keys()].some((k) => !keep.includes(k))

  if (!hasFilters) return null

  function handleReset() {
    const params = new URLSearchParams()
    for (const k of keep) {
      const v = searchParams.get(k)
      if (v) params.set(k, v)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground" onClick={handleReset}>
      <RotateCcw className="h-3.5 w-3.5" />
      Reset
    </Button>
  )
}
