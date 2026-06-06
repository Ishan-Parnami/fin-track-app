'use client'

import { useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import type { ChartPoint, CategorySummary, DashboardSummary } from '@/types'

const PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const

type Period = 'weekly' | 'monthly' | 'yearly'

interface ChartsSectionProps {
  month: string
  initialData: DashboardSummary
}

function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card shadow-md p-3 text-xs space-y-1">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-numeric font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function BarChartView({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CurrencyTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} name="Income" />
        <Bar dataKey="expense" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Expense" />
      </BarChart>
    </ResponsiveContainer>
  )
}

function AreaChartView({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CurrencyTooltip />} />
        <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="url(#balanceGrad)" strokeWidth={2} name="Balance" />
        <Area type="monotone" dataKey="expense" stroke="#f59e0b" fill="none" strokeWidth={1.5} strokeDasharray="4 2" name="Expense" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function PieChartView({ categories }: { categories: CategorySummary[] }) {
  const data = categories.slice(0, 8)
  if (data.length === 0) {
    return <p className="h-55 flex items-center justify-center text-sm text-muted-foreground">No expense data.</p>
  }
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {data.map((cat) => (
                <Cell key={cat.id} fill={cat.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(v as number)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5 text-xs w-28 shrink-0">
        {data.map((cat) => (
          <li key={cat.id} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
            <span className="text-muted-foreground truncate">{cat.name}</span>
            <span className="ml-auto font-medium font-numeric">{cat.percentage}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChartsSection({ month, initialData }: ChartsSectionProps) {
  const [period, setPeriod] = useState<Period>('monthly')
  const [data, setData] = useState<DashboardSummary>(initialData)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (newMonth: string, newPeriod: Period) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/summary?month=${newMonth}&period=${newPeriod}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  function handlePeriod(p: Period) {
    setPeriod(p)
    fetchData(month, p)
  }

  return (
    <div className="space-y-4">
      {/* Period toggle — shared across all charts */}
      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => handlePeriod(p.value)}
            disabled={loading}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-75 rounded-xl" />
          <Skeleton className="h-75 rounded-xl" />
          <Skeleton className="h-75 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium">Income vs Expense</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <BarChartView data={data.chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium">Balance Trend</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <AreaChartView data={data.chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium">Expense by Category</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <PieChartView categories={data.byCategory} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
