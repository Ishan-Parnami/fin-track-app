import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/shared/SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { name: true, email: true, image: true, password: true, cloudinaryPublicId: true },
  })
  if (!user) redirect('/auth/login')

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences.</p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            user={{ name: user.name, email: user.email, image: user.image }}
            hasPassword={!!user.password}
            hasCustomImage={!!user.cloudinaryPublicId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
