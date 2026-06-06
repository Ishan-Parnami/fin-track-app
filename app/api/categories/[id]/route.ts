import { and, count, eq, isNull, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, transactions } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth-guard'
import { ok, err } from '@/lib/api-response'
import { categorySchema } from '@/lib/validations'

async function getAccessibleCategory(id: string, userId: string) {
  return db.query.categories.findFirst({
    where: and(
      eq(categories.id, id),
      or(isNull(categories.userId), eq(categories.userId, userId))
    ),
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  const { id } = await params
  const cat = await getAccessibleCategory(id, userId)
  if (!cat) return err('NOT_FOUND', 'Category not found', 404)
  if (cat.isDefault) return err('FORBIDDEN', 'Default categories cannot be edited', 403)
  // User can only edit their own custom categories
  if (cat.userId !== userId) return err('FORBIDDEN', 'Cannot edit this category', 403)

  try {
    const body = await request.json()
    const parsed = categorySchema.partial().safeParse(body)
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0].message, 400)
    }

    const [updated] = await db
      .update(categories)
      .set(parsed.data)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning()

    return ok(updated)
  } catch {
    return err('SERVER_ERROR', 'Something went wrong', 500)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  const { id } = await params
  const cat = await getAccessibleCategory(id, userId)
  if (!cat) return err('NOT_FOUND', 'Category not found', 404)
  if (cat.isDefault) return err('FORBIDDEN', 'Default categories cannot be deleted', 403)
  if (cat.userId !== userId) return err('FORBIDDEN', 'Cannot delete this category', 403)

  const [{ total }] = await db
    .select({ total: count() })
    .from(transactions)
    .where(eq(transactions.categoryId, id))

  if (total > 0) {
    return err(
      'CATEGORY_IN_USE',
      `Cannot delete category with ${total} transaction${total === 1 ? '' : 's'}. Reassign or delete them first.`,
      400
    )
  }

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))

  return ok({ deleted: true })
}
