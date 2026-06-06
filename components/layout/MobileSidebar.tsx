'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Menu, LayoutDashboard, ArrowLeftRight, Tags, Settings, LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/dashboard/categories', label: 'Categories', icon: Tags },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface MobileSidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
}

export function MobileSidebar({ user }: MobileSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email?.[0].toUpperCase() ?? 'U'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-60 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <span className="text-base font-bold tracking-tight text-sidebar-primary">
            Fin<span className="text-foreground">Track</span>
          </span>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {navItems.map((item) => {
            const active = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <Separator className="bg-sidebar-border" />
        <div className="p-3">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-sidebar-foreground truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }) }}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-destructive hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
