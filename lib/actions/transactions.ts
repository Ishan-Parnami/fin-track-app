'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { transactionSchema } from '@/lib/validations'

type ActionResult = { success: true } | { success: false; error: string }

async function getUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function addTransaction(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  const raw = {
    type: formData.get('type'),
    amount: parseFloat(formData.get('amount') as string),
    description: formData.get('description') || undefined,
    categoryId: formData.get('categoryId') || undefined,
    date: formData.get('date'),
  }

  const parsed = transactionSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { type, amount, description, categoryId, date } = parsed.data
  await db.insert(transactions).values({
    userId,
    type,
    amount: amount.toString(),
    description,
    categoryId: categoryId ?? null,
    date: new Date(date),
  })

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function updateTransaction(id: string, formData: FormData): Promise<ActionResult> {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  const existing = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
  })
  if (!existing) return { success: false, error: 'Transaction not found' }

  const rawAmount = formData.get('amount')
  const raw = {
    type: formData.get('type') || undefined,
    amount: rawAmount ? parseFloat(rawAmount as string) : undefined,
    description: formData.get('description') || undefined,
    categoryId: formData.get('categoryId') || undefined,
    date: formData.get('date') || undefined,
  }

  const parsed = transactionSchema.partial().safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { amount, date, ...rest } = parsed.data
  await db
    .update(transactions)
    .set({
      ...rest,
      ...(amount !== undefined ? { amount: amount.toString() } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  const existing = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
  })
  if (!existing) return { success: false, error: 'Transaction not found' }

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function cloneTransaction(
  id: string,
  overrides: {
    date: string
    amount?: number
    description?: string
    categoryId?: string
    type?: 'income' | 'expense'
  }
): Promise<{ success: true; newId: string } | { success: false; error: string }> {
  const userId = await getUserId()
  if (!userId) return { success: false, error: 'Not authenticated' }

  const original = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
  })
  if (!original) return { success: false, error: 'Transaction not found' }

  const [cloned] = await db
    .insert(transactions)
    .values({
      userId,
      type: overrides.type ?? original.type,
      amount: overrides.amount !== undefined ? overrides.amount.toString() : original.amount,
      description: overrides.description !== undefined ? overrides.description : original.description,
      categoryId: overrides.categoryId !== undefined ? overrides.categoryId : original.categoryId,
      date: new Date(overrides.date),
    })
    .returning({ id: transactions.id })

  revalidatePath('/dashboard', 'layout')
  return { success: true, newId: cloned.id }
}
