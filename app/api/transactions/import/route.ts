import { and, sql } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import { z } from 'zod'
import { db } from '@/lib/db'
import { transactions, categories } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth-guard'
import { ok, err } from '@/lib/api-response'
import { transactionSchema } from '@/lib/validations'

type ParsedTransaction = z.infer<typeof transactionSchema>

interface RowError {
  row: number
  errors: string[]
}

export async function POST(request: Request) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return err('VALIDATION_ERROR', 'No file provided', 400)

  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(file.type) && !['csv', 'xlsx', 'xls'].includes(ext ?? '')) {
    return err('VALIDATION_ERROR', 'Only CSV and Excel files are accepted', 400)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (rows.length === 0) return err('VALIDATION_ERROR', 'File is empty', 400)
  if (rows.length > 500) return err('VALIDATION_ERROR', 'Maximum 500 rows per import', 400)

  const rowErrors: RowError[] = []
  const validRows: ParsedTransaction[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed + header row

    const rawAmount = row['amount']
    const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : Number(rawAmount)

    // Normalize date: xlsx may parse as Date object or string
    let dateStr = ''
    const rawDate = row['date']
    if (rawDate instanceof Date) {
      dateStr = rawDate.toISOString().split('T')[0]
    } else if (typeof rawDate === 'string') {
      dateStr = rawDate.trim()
    } else if (typeof rawDate === 'number') {
      // Excel serial date number
      const d = XLSX.SSF.parse_date_code(rawDate)
      dateStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
    }

    const parsed = transactionSchema.safeParse({
      type: row['type'],
      amount,
      date: dateStr,
      categoryId: row['category_id'] || undefined,
      description: row['description'] || undefined,
    })

    if (!parsed.success) {
      rowErrors.push({ row: rowNum, errors: parsed.error.issues.map((i) => i.message) })
    } else {
      validRows.push(parsed.data)
    }
  }

  if (rowErrors.length > 0) {
    return Response.json({ success: false, rowErrors }, { status: 400 })
  }

  // Validate all category IDs in one query
  const categoryIds = [...new Set(validRows.map((r) => r.categoryId).filter(Boolean))] as string[]
  if (categoryIds.length > 0) {
    const validCats = await db.query.categories.findMany({
      where: and(
        sql`${categories.id} = ANY(ARRAY[${sql.join(categoryIds.map((id) => sql`${id}::uuid`), sql`, `)}])`,
        sql`(${categories.userId} = ${userId} OR ${categories.userId} IS NULL)`
      ),
      columns: { id: true },
    })
    const validCatIds = new Set(validCats.map((c) => c.id))
    const invalidCatRows: RowError[] = []
    validRows.forEach((row, idx) => {
      if (row.categoryId && !validCatIds.has(row.categoryId)) {
        invalidCatRows.push({ row: idx + 2, errors: [`Category ID "${row.categoryId}" not found`] })
      }
    })
    if (invalidCatRows.length > 0) {
      return Response.json({ success: false, rowErrors: invalidCatRows }, { status: 400 })
    }
  }

  // Bulk insert
  await db.insert(transactions).values(
    validRows.map((r) => ({
      userId,
      type: r.type,
      amount: r.amount.toString(),
      description: r.description,
      categoryId: r.categoryId ?? null,
      date: new Date(r.date),
    }))
  )

  return ok({ imported: validRows.length })
}
