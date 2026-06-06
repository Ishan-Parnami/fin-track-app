import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth-guard'
import { ok, err } from '@/lib/api-response'
import { transactionSchema } from '@/lib/validations'

async function getOwnedTransaction(id: string, userId: string) {
  return db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
    with: { category: true },
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  const { id } = await params
  const transaction = await getOwnedTransaction(id, userId)
  if (!transaction) return err('NOT_FOUND', 'Transaction not found', 404)
  return ok(transaction)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  const { id } = await params
  const existing = await getOwnedTransaction(id, userId)
  if (!existing) return err('NOT_FOUND', 'Transaction not found', 404)

  try {
    const body = await request.json()
    const parsed = transactionSchema.partial().safeParse({
      ...body,
      amount: body.amount !== undefined
        ? (typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount)
        : undefined,
    })
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0].message, 400)
    }

    const { amount, date, ...rest } = parsed.data
    const [updated] = await db
      .update(transactions)
      .set({
        ...rest,
        ...(amount !== undefined ? { amount: amount.toString() } : {}),
        ...(date !== undefined ? { date: new Date(date) } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
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
  const existing = await getOwnedTransaction(id, userId)
  if (!existing) return err('NOT_FOUND', 'Transaction not found', 404)

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))

  return ok({ deleted: true })
}
