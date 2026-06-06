'use client'

import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { MobileSidebar } from './MobileSidebar'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/categories': 'Categories',
  '/dashboard/settings': 'Settings',
}

interface HeaderProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const title = Object.entries(PAGE_TITLES)
    .reverse()
    .find(([key]) => pathname.startsWith(key))?.[1] ?? 'FinTrack'

  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-4 gap-4">
      <MobileSidebar user={user} />
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
