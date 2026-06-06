'use server'

import { and, count, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { categories, transactions } from '@/lib/db/schema'
import { categorySchema } from '@/lib/validations'

type ActionResult = { success: true } | { success: false; error: string }

async function getUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function addCategory(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  const raw = {
    name: formData.get('name'),
    type: formData.get('type'),
    color: formData.get('color'),
    icon: formData.get('icon') || '💰',
  }

  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  await db.insert(categories).values({ ...parsed.data, userId, isDefault: false })

  revalidatePath('/dashboard/categories')
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData): Promise<ActionResult> {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  const cat = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.userId, userId)),
  })
  if (!cat) return { success: false, error: 'Category not found' }
  if (cat.isDefault) return { success: false, error: 'Default categories cannot be edited' }

  const raw = {
    name: formData.get('name') || undefined,
    type: formData.get('type') || undefined,
    color: formData.get('color') || undefined,
    icon: formData.get('icon') || undefined,
  }

  const parsed = categorySchema.partial().safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  await db
    .update(categories)
    .set(parsed.data)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))

  revalidatePath('/dashboard/categories')
  return { success: true }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  const cat = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.userId, userId)),
  })
  if (!cat) return { success: false, error: 'Category not found' }
  if (cat.isDefault) return { success: false, error: 'Default categories cannot be deleted' }

  const [{ total }] = await db
    .select({ total: count() })
    .from(transactions)
    .where(eq(transactions.categoryId, id))

  if (total > 0) {
    return {
      success: false,
      error: `Cannot delete: ${total} transaction${total === 1 ? '' : 's'} use this category`,
    }
  }

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))

  revalidatePath('/dashboard/categories')
  return { success: true }
}
