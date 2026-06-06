import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  if (pathname.startsWith('/auth') && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (pathname === '/' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
})

export const config = {
  matcher: ['/', '/dashboard/:path*', '/auth/:path*'],
}
