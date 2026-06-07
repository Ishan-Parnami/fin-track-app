import Link from 'next/link'
import { TrendingUp, BarChart3, Tags, Shield } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export const revalidate = 3600

const features = [
  {
    icon: TrendingUp,
    title: 'Track Every Rupee',
    description: 'Log income and expenses with categories, dates, and descriptions. See exactly where your money goes.',
  },
  {
    icon: BarChart3,
    title: 'Visualise Your Spending',
    description: 'Interactive charts for weekly, monthly, and yearly views. Spot trends before they become problems.',
  },
  {
    icon: Tags,
    title: 'Smart Categories',
    description: 'Preset categories to get started instantly. Create custom ones to match how you actually spend.',
  },
  {
    icon: Shield,
    title: 'Your Data, Private',
    description: 'Sign in with Google or email. Your transactions are yours — never shared, never sold.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/50">
        <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            Fin<span className="text-primary">Track</span>
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8">
          <TrendingUp className="h-3.5 w-3.5" />
          Personal Finance, Simplified
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Your money,{' '}
          <span className="text-primary">finally</span>{' '}
          under control.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          Log transactions, visualise spending trends, and understand your savings rate -
          all in one clean dashboard. No spreadsheets. No subscription fees.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Tracking Free
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-lg border border-border bg-background px-8 py-3 text-base font-medium hover:bg-muted transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Dashboard preview card */}
        <div className="mt-20 mx-auto max-w-4xl rounded-2xl border border-border bg-card p-8 text-left shadow-sm">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Income', value: '₹68,500', color: 'text-emerald-500' },
              { label: 'Total Expenses', value: '₹29,200', color: 'text-amber-500' },
              { label: 'Net Balance', value: '₹39,300', color: 'text-primary' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-xl font-bold font-numeric ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="h-32 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground text-sm">
            📊 Interactive charts with weekly, monthly &amp; yearly views
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to stay on track</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 FinTrack. Built with Next.js</p>
          <p className="font-mono text-xs opacity-60">
            ISR revalidate: 3600s · ishan @dev
          </p>
        </div>
      </footer>
    </div>
  )
}
