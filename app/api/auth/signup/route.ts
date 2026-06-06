import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { signUpSchema } from '@/lib/validations'
import { ok, err } from '@/lib/api-response'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = signUpSchema.safeParse(body)
    if (!parsed.success) {
      return err('VALIDATION_ERROR', parsed.error.issues[0].message, 400)
    }

    const { name, email, password } = parsed.data

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    })
    if (existing) {
      return err('EMAIL_EXISTS', 'An account with this email already exists', 409)
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: hashedPassword })
      .returning({ id: users.id, name: users.name, email: users.email })

    return ok(newUser, 201)
  } catch {
    return err('SERVER_ERROR', 'Something went wrong', 500)
  }
}
