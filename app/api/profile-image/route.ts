import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth-guard'
import { ok, err } from '@/lib/api-response'
import { deleteCloudinaryImage, uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: Request) {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return err('VALIDATION_ERROR', 'No file provided', 400)

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return err('VALIDATION_ERROR', 'Only JPEG, PNG, WEBP, and GIF images are allowed', 400)
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { cloudinaryPublicId: true },
  })

  const buffer = Buffer.from(await file.arrayBuffer())
  const { url, publicId } = await uploadToCloudinary(buffer, `user_${userId}`)

  // Delete old Cloudinary image if it existed
  if (user?.cloudinaryPublicId) {
    await deleteCloudinaryImage(user.cloudinaryPublicId).catch(() => {})
  }

  await db
    .update(users)
    .set({ image: url, cloudinaryPublicId: publicId })
    .where(eq(users.id, userId))

  return ok({ url })
}

export async function DELETE() {
  const guard = await requireAuth()
  if (guard instanceof Response) return guard
  const { userId } = guard

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { cloudinaryPublicId: true, providerImage: true },
  })

  if (user?.cloudinaryPublicId) {
    await deleteCloudinaryImage(user.cloudinaryPublicId).catch(() => {})
  }

  await db
    .update(users)
    .set({ image: user?.providerImage ?? null, cloudinaryPublicId: null })
    .where(eq(users.id, userId))

  return ok({ url: user?.providerImage ?? null })
}
