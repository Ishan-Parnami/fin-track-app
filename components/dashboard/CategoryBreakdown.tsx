import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import type { CategorySummary } from '@/types'

interface CategoryBreakdownProps {
  categories: CategorySummary[]
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  const top5 = categories.slice(0, 5)

  if (top5.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No expense data for this time period.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {top5.map((cat) => (
        <div key={cat.id} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span>{cat.icon}</span>
              <span className="font-medium">{cat.name}</span>
            </span>
            <span className="text-muted-foreground font-numeric text-xs">
              {formatCurrency(cat.total)} · {cat.percentage}%
            </span>
          </div>
          <Progress
            value={cat.percentage}
            className="h-1.5"
            style={{ '--progress-color': cat.color } as React.CSSProperties}
          />
        </div>
      ))}
      {categories.length > 5 && (
        <Link href="/dashboard/categories" className="text-xs text-primary hover:underline block pt-1">
          View all categories →
        </Link>
      )}
    </div>
  )
}
