'use server'

import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { updateUserSchema } from '@/lib/validations'

type ActionResult = { success: true } | { success: false; error: string }

export async function updateUser(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }
  const userId = session.user.id

  const raw = {
    name: formData.get('name') || undefined,
    currentPassword: formData.get('currentPassword') || undefined,
    newPassword: formData.get('newPassword') || undefined,
  }

  const parsed = updateUserSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { name, currentPassword, newPassword } = parsed.data
  const updates: Partial<{ name: string; password: string }> = {}

  if (name) updates.name = name

  if (newPassword) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { password: true },
    })
    if (!user?.password) {
      return { success: false, error: 'No password set. Use Google sign-in or set a password first.' }
    }
    const valid = await bcrypt.compare(currentPassword!, user.password)
    if (!valid) return { success: false, error: 'Current password is incorrect' }
    updates.password = await bcrypt.hash(newPassword, 12)
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No changes provided' }
  }

  await db.update(users).set(updates).where(eq(users.id, userId))
  revalidatePath('/dashboard/settings')
  return { success: true }
}
