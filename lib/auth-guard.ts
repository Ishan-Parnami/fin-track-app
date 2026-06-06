import { auth } from '@/lib/auth'
import { err } from '@/lib/api-response'

export async function requireAuth(): Promise<{ userId: string } | Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return err('UNAUTHORIZED', 'Authentication required', 401)
  }
  return { userId: session.user.id }
}
