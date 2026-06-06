import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { SummaryStats } from '@/types'

interface SummaryCardsProps {
  stats: SummaryStats
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Income',
      value: formatCurrency(stats.totalIncome),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(stats.totalExpense),
      icon: TrendingDown,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Net Balance',
      value: formatCurrency(stats.netBalance),
      icon: Wallet,
      color: stats.netBalance >= 0 ? 'text-primary' : 'text-destructive',
      bg: stats.netBalance >= 0 ? 'bg-primary/10' : 'bg-destructive/10',
    },
    {
      label: 'Savings Rate',
      value: `${stats.savingsRate}%`,
      icon: PiggyBank,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold font-numeric ${card.color}`}>{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
