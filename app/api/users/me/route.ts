import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth-guard'
import { ok, err } from '@/lib/api-response'
import { updateUserSchema } from '@/lib/validations'

export async function GET(_request: Request) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, name: true, email: true, image: true, createdAt: true },
  })
  if (!user) return err('NOT_FOUND', 'User not found', 404)
  return ok(user)
}

export async function PATCH(request: Request) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  try {
    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0].message, 400)
    }

    const { name, currentPassword, newPassword } = parsed.data
    const updates: Partial<{ name: string; password: string }> = {}

    if (name) updates.name = name

    if (newPassword) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { password: true },
      })
      if (!user?.password) {
        return err('NO_PASSWORD', 'Set a password first via account settings', 400)
      }
      const valid = await bcrypt.compare(currentPassword!, user.password)
      if (!valid) return err('WRONG_PASSWORD', 'Current password is incorrect', 400)
      updates.password = await bcrypt.hash(newPassword, 12)
    }

    if (Object.keys(updates).length === 0) {
      return err('NO_CHANGES', 'No changes provided', 400)
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning({ id: users.id, name: users.name, email: users.email, image: users.image })

    return ok(updated)
  } catch {
    return err('SERVER_ERROR', 'Something went wrong', 500)
  }
}
