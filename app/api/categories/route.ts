import { asc, desc, eq, isNull, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth-guard'
import { ok, err } from '@/lib/api-response'
import { categorySchema } from '@/lib/validations'

export async function GET(_request: Request) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  // Global defaults (user_id IS NULL) + user's custom categories
  const items = await db.query.categories.findMany({
    where: or(isNull(categories.userId), eq(categories.userId, userId)),
    orderBy: [desc(categories.isDefault), asc(categories.createdAt)],
  })

  return ok(items)
}

export async function POST(request: Request) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  try {
    const body = await request.json()
    const parsed = categorySchema.safeParse(body)
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0].message, 400)
    }

    const [created] = await db
      .insert(categories)
      .values({ ...parsed.data, userId, isDefault: false })
      .returning()

    return ok(created, 201)
  } catch {
    return err('SERVER_ERROR', 'Something went wrong', 500)
  }
}
