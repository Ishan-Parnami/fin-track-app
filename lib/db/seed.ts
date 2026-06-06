import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const DEFAULT_CATEGORIES = [
  { name: 'Salary',        type: 'income'  as const, color: '#10b981', icon: '💼', isDefault: true },
  { name: 'Freelance',     type: 'income'  as const, color: '#6366f1', icon: '💻', isDefault: true },
  { name: 'Other Income',  type: 'income'  as const, color: '#f59e0b', icon: '💰', isDefault: true },
  { name: 'Food',          type: 'expense' as const, color: '#f97316', icon: '🍜', isDefault: true },
  { name: 'Transport',     type: 'expense' as const, color: '#3b82f6', icon: '🚌', isDefault: true },
  { name: 'Rent',          type: 'expense' as const, color: '#8b5cf6', icon: '🏠', isDefault: true },
  { name: 'Entertainment', type: 'expense' as const, color: '#ec4899', icon: '🎬', isDefault: true },
  { name: 'Shopping',      type: 'expense' as const, color: '#14b8a6', icon: '🛍️', isDefault: true },
  { name: 'Health',        type: 'expense' as const, color: '#ef4444', icon: '⚕️', isDefault: true },
  { name: 'Utilities',     type: 'expense' as const, color: '#64748b', icon: '💡', isDefault: true },
]

async function seed() {
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })

  console.log('Seeding global default categories...')
  await db
    .insert(schema.categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: null })))
    .onConflictDoNothing()
  console.log('Done.')
  process.exit(0)
}

seed().catch((e) => { console.error(e); process.exit(1) })
