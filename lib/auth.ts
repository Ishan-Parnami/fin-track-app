import NextAuth from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema'
import { signInSchema } from '@/lib/validations'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.query.users.findFirst({
          where: eq(users.email, parsed.data.email),
        })
        if (!user || !user.password) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) token.id = user.id
      // Capture providerImage once on first OAuth login
      if (account && account.provider !== 'credentials' && profile?.picture) {
        const providerImg = profile.picture as string
        await db
          .update(users)
          .set({ providerImage: providerImg })
          .where(eq(users.id, user!.id as string))
      }
      // Always sync name and image from DB so session reflects latest values
      if (token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
          columns: { name: true, image: true },
        })
        if (dbUser) {
          token.name = dbUser.name
          token.picture = dbUser.image
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      if (token.name) session.user.name = token.name
      if (token.picture !== undefined) session.user.image = token.picture as string | null
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
})
