'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Camera, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateUser } from '@/lib/actions/users'

const nameSchema = z.object({ name: z.string().min(2).max(100) })
const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Min 8 characters').max(72),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

interface SettingsFormProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
  hasPassword: boolean
  hasCustomImage: boolean
}

export function SettingsForm({ user, hasPassword, hasCustomImage }: SettingsFormProps) {
  const router = useRouter()
  const [currentImage, setCurrentImage] = useState(user.image ?? null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageResetting, setImageResetting] = useState(false)
  const [hasCustom, setHasCustom] = useState(hasCustomImage)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/profile-image', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Upload failed')
      } else {
        setCurrentImage(json.data.url)
        setHasCustom(true)
        toast.success('Profile image updated')
        router.refresh()
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setImageUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleImageReset() {
    setImageResetting(true)
    try {
      const res = await fetch('/api/profile-image', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Reset failed')
      } else {
        setCurrentImage(json.data.url)
        setHasCustom(false)
        toast.success('Profile image reset')
        router.refresh()
      }
    } catch {
      toast.error('Reset failed')
    } finally {
      setImageResetting(false)
    }
  }

  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user.name ?? '' },
  })

  const pwForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  })

  async function onNameSubmit(data: z.infer<typeof nameSchema>) {
    const formData = new FormData()
    formData.set('name', data.name)
    const result = await updateUser(formData)
    if (result.success) { toast.success('Name updated'); router.refresh() }
    else toast.error(result.error)
  }

  async function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
    const formData = new FormData()
    if (data.currentPassword) formData.set('currentPassword', data.currentPassword)
    formData.set('newPassword', data.newPassword)
    const result = await updateUser(formData)
    if (result.success) {
      toast.success('Password updated')
      pwForm.reset()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Image */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Profile Image</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Upload a photo or reset to your default.</p>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={currentImage ?? undefined} />
            <AvatarFallback className="text-lg">
              {user.name?.charAt(0)?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={imageUploading || imageResetting}
              onClick={() => fileInputRef.current?.click()}
            >
              {imageUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {imageUploading ? 'Uploading...' : 'Upload photo'}
            </Button>
            {hasCustom && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={imageUploading || imageResetting}
                onClick={handleImageReset}
              >
                {imageResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Profile */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Profile</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Update your display name.</p>
        </div>
        <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...nameForm.register('name')} />
            {nameForm.formState.errors.name && (
              <p className="text-xs text-destructive">{nameForm.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email ?? ''} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>
          <Button type="submit" size="sm" disabled={nameForm.formState.isSubmitting || !nameForm.formState.isDirty}>
            {nameForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Name'}
          </Button>
        </form>
      </div>

      <Separator />

      {/* Security */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Security</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasPassword ? 'Change your password.' : 'Set a password to enable email sign-in.'}
          </p>
        </div>
        <form onSubmit={pwForm.handleSubmit(onPasswordSubmit)} className="space-y-3 max-w-sm">
          {hasPassword && (
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" {...pwForm.register('currentPassword')} />
              {pwForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">{pwForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">{hasPassword ? 'New Password' : 'Password'}</Label>
            <Input id="newPassword" type="password" {...pwForm.register('newPassword')} />
            {pwForm.formState.errors.newPassword && (
              <p className="text-xs text-destructive">{pwForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" {...pwForm.register('confirmPassword')} />
            {pwForm.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">{pwForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" size="sm" disabled={pwForm.formState.isSubmitting}>
            {pwForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : hasPassword ? 'Change Password' : 'Set Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
