import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, isNull, or } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import * as schema from './schema'

// ─── helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Returns a Date at a random time on the given calendar day */
function randomTimeOnDate(year: number, month: number, day: number): Date {
  const h = randomInt(6, 23)
  const m = randomInt(0, 59)
  return new Date(year, month, day, h, m, 0)
}

// ─── seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })

  // 1. Upsert demo user
  console.log('Creating demo user...')
  const email = 'karan@aujla.com'
  const passwordHash = await bcrypt.hash('kar@nAuj1a', 12)

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) })
  let userId: string

  if (existing) {
    userId = existing.id
    await db.update(schema.users).set({ password: passwordHash }).where(eq(schema.users.id, userId))
    console.log('Demo user already exists — password reset.')
  } else {
    const [newUser] = await db
      .insert(schema.users)
      .values({ name: 'Karan Aujla', email, password: passwordHash })
      .returning({ id: schema.users.id })
    userId = newUser.id
    console.log('Demo user created.')
  }

  // 2. Load global categories
  const allCategories = await db.query.categories.findMany({
    where: or(isNull(schema.categories.userId), eq(schema.categories.userId, userId)),
  })

  const incomeCategories = allCategories.filter((c) => c.type === 'income')
  const expenseCategories = allCategories.filter((c) => c.type === 'expense')

  if (incomeCategories.length === 0 || expenseCategories.length === 0) {
    console.error('No global categories found. Run `npm run db:seed` first.')
    process.exit(1)
  }

  // 3. Wipe existing transactions for this user (clean slate)
  console.log('Clearing existing transactions for demo user...')
  await db.delete(schema.transactions).where(eq(schema.transactions.userId, userId))

  // 4. Generate 18 months of transactions (6 months back → today → 12 months back)
  // Range: Jan 2025 – June 2026
  console.log('Generating transactions...')

  const txRows: (typeof schema.transactions.$inferInsert)[] = []

  const START_YEAR = 2025
  const START_MONTH = 0   // January (0-indexed)
  const END_YEAR = 2026
  const END_MONTH = 5     // June (0-indexed)

  // Salary categories for consistent monthly income
  const salaryCat = incomeCategories.find((c) => c.name === 'Salary') ?? incomeCategories[0]
  const freelanceCat = incomeCategories.find((c) => c.name === 'Freelance') ?? incomeCategories[0]
  const otherIncomeCat = incomeCategories.find((c) => c.name === 'Other Income') ?? incomeCategories[0]

  const foodCat = expenseCategories.find((c) => c.name === 'Food') ?? expenseCategories[0]
  const transportCat = expenseCategories.find((c) => c.name === 'Transport') ?? expenseCategories[0]
  const rentCat = expenseCategories.find((c) => c.name === 'Rent') ?? expenseCategories[0]
  const entCat = expenseCategories.find((c) => c.name === 'Entertainment') ?? expenseCategories[0]
  const shoppingCat = expenseCategories.find((c) => c.name === 'Shopping') ?? expenseCategories[0]
  const healthCat = expenseCategories.find((c) => c.name === 'Health') ?? expenseCategories[0]
  const utilitiesCat = expenseCategories.find((c) => c.name === 'Utilities') ?? expenseCategories[0]

  function add(
    date: Date,
    type: 'income' | 'expense',
    amount: number,
    categoryId: string,
    description?: string,
  ) {
    txRows.push({
      userId,
      type,
      amount: amount.toFixed(2),
      categoryId,
      description: description ?? null,
      date,
    })
  }

  let y = START_YEAR
  let mo = START_MONTH

  while (y < END_YEAR || (y === END_YEAR && mo <= END_MONTH)) {
    const daysInMonth = new Date(y, mo + 1, 0).getDate()

    // ── Fixed monthly income ─────────────────────────────────────────────────
    add(randomTimeOnDate(y, mo, 1), 'income', randomBetween(85000, 95000), salaryCat.id, 'Monthly salary')

    // ── Freelance (some months) ──────────────────────────────────────────────
    if (Math.random() > 0.35) {
      const freqCount = randomInt(1, 3)
      for (let f = 0; f < freqCount; f++) {
        add(
          randomTimeOnDate(y, mo, randomInt(5, 28)),
          'income',
          randomBetween(8000, 35000),
          freelanceCat.id,
          pick(['Client project', 'Design work', 'Consulting', 'Web development', 'Logo design']),
        )
      }
    }

    // ── Other income (occasional) ────────────────────────────────────────────
    if (Math.random() > 0.6) {
      add(
        randomTimeOnDate(y, mo, randomInt(1, 28)),
        'income',
        randomBetween(1000, 12000),
        otherIncomeCat.id,
        pick(['Dividend', 'Cashback', 'Gift', 'Referral bonus', 'Interest']),
      )
    }

    // ── Rent (1st of month) ──────────────────────────────────────────────────
    add(randomTimeOnDate(y, mo, randomInt(1, 5)), 'expense', randomBetween(22000, 26000), rentCat.id, 'Monthly rent')

    // ── Food (daily-ish, 18–25 entries per month) ────────────────────────────
    const foodCount = randomInt(18, 25)
    const usedFoodDays = new Set<number>()
    for (let i = 0; i < foodCount; i++) {
      let day: number
      do { day = randomInt(1, daysInMonth) } while (usedFoodDays.has(day))
      usedFoodDays.add(day)
      add(
        randomTimeOnDate(y, mo, day),
        'expense',
        randomBetween(80, 1200),
        foodCat.id,
        pick(['Swiggy order', 'Groceries', 'Restaurant', 'Café', 'Zomato', 'Dine out', 'Snacks', 'Lunch']),
      )
    }

    // ── Transport (weekly-ish, 8–14 per month) ───────────────────────────────
    const transCount = randomInt(8, 14)
    for (let i = 0; i < transCount; i++) {
      add(
        randomTimeOnDate(y, mo, randomInt(1, daysInMonth)),
        'expense',
        randomBetween(50, 1800),
        transportCat.id,
        pick(['Uber', 'Ola', 'Metro card recharge', 'Petrol', 'Auto', 'Bus pass', 'Rapido']),
      )
    }

    // ── Utilities (1–2 per month) ────────────────────────────────────────────
    add(
      randomTimeOnDate(y, mo, randomInt(5, 15)),
      'expense',
      randomBetween(800, 2200),
      utilitiesCat.id,
      pick(['Electricity bill', 'Water bill', 'Gas bill', 'Internet']),
    )
    if (Math.random() > 0.4) {
      add(
        randomTimeOnDate(y, mo, randomInt(10, 25)),
        'expense',
        randomBetween(400, 1500),
        utilitiesCat.id,
        pick(['Phone recharge', 'DTH subscription', 'Internet bill', 'OTT subscriptions']),
      )
    }

    // ── Entertainment (2–5 per month) ────────────────────────────────────────
    const entCount = randomInt(2, 5)
    for (let i = 0; i < entCount; i++) {
      add(
        randomTimeOnDate(y, mo, randomInt(1, daysInMonth)),
        'expense',
        randomBetween(200, 3500),
        entCat.id,
        pick(['Movie tickets', 'Concert', 'Netflix', 'Spotify', 'Gaming', 'Event tickets', 'Book', 'YouTube Premium']),
      )
    }

    // ── Shopping (2–6 per month) ─────────────────────────────────────────────
    const shopCount = randomInt(2, 6)
    for (let i = 0; i < shopCount; i++) {
      add(
        randomTimeOnDate(y, mo, randomInt(1, daysInMonth)),
        'expense',
        randomBetween(500, 8000),
        shoppingCat.id,
        pick(['Amazon order', 'Clothes', 'Footwear', 'Flipkart', 'Electronics', 'Home decor', 'Accessories']),
      )
    }

    // ── Health (0–2 per month) ────────────────────────────────────────────────
    if (Math.random() > 0.4) {
      add(
        randomTimeOnDate(y, mo, randomInt(1, daysInMonth)),
        'expense',
        randomBetween(200, 4000),
        healthCat.id,
        pick(['Pharmacy', 'Doctor visit', 'Lab test', 'Gym membership', 'Medicines']),
      )
    }

    // Advance month
    mo++
    if (mo > 11) { mo = 0; y++ }
  }

  // 5. Insert all transactions in batches of 100
  console.log(`Inserting ${txRows.length} transactions...`)
  const BATCH = 100
  for (let i = 0; i < txRows.length; i += BATCH) {
    await db.insert(schema.transactions).values(txRows.slice(i, i + BATCH))
  }

  console.log(`Done. Created ${txRows.length} transactions for ${email}.`)
  process.exit(0)
}

seed().catch((e) => { console.error(e); process.exit(1) })
