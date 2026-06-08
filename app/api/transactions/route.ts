import { and, desc, eq, gte, lte, count, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { transactions, categories } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth-guard'
import { ok, err } from '@/lib/api-response'
import { PAGINATION_MAX_LIMIT, PAGINATION_DEFAULT_LIMIT } from '@/lib/constants'
import { transactionSchema } from '@/lib/validations'

export async function GET(request: Request) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as 'income' | 'expense' | null
  const categoryId = searchParams.get('categoryId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') ?? String(PAGINATION_DEFAULT_LIMIT))))
  const offset = (page - 1) * limit

  const conditions = [eq(transactions.userId, userId)]
  if (type) conditions.push(eq(transactions.type, type))
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId))
  if (from) conditions.push(gte(transactions.date, new Date(from)))
  if (to) conditions.push(lte(transactions.date, new Date(to)))

  const where = and(...conditions)

  const [items, [{ total }]] = await Promise.all([
    db.query.transactions.findMany({
      where,
      with: { category: true },
      orderBy: [desc(transactions.date)],
      limit,
      offset,
    }),
    db.select({ total: count() }).from(transactions).where(where),
  ])

  return ok({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(request: Request) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  try {
    const body = await request.json()
    const parsed = transactionSchema.safeParse({
      ...body,
      amount: typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount,
    })
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0].message, 400)
    }

    const { type, amount, description, categoryId, date } = parsed.data

    // Validate category ownership if provided
    if (categoryId) {
      const cat = await db.query.categories.findFirst({
        where: and(
          eq(categories.id, categoryId),
          sql`(${categories.userId} = ${userId} OR ${categories.userId} IS NULL)`
        ),
      })
      if (!cat) return err('INVALID_CATEGORY', 'Category not found', 400)
    }

    const [created] = await db
      .insert(transactions)
      .values({
        userId,
        type,
        amount: amount.toString(),
        description,
        categoryId: categoryId ?? null,
        date: new Date(date),
      })
      .returning()

    return ok(created, 201)
  } catch {
    return err('SERVER_ERROR', 'Something went wrong', 500)
  }
}
