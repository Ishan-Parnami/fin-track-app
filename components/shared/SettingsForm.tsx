'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { updateUser } from '@/lib/actions/users'

const nameSchema = z.object({ name: z.string().min(2).max(100) })
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters').max(72),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

interface SettingsFormProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
  hasPassword: boolean
}

export function SettingsForm({ user, hasPassword }: SettingsFormProps) {
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
    if (result.success) toast.success('Name updated')
    else toast.error(result.error)
  }

  async function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
    const formData = new FormData()
    formData.set('currentPassword', data.currentPassword)
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
          <Button type="submit" size="sm" disabled={nameForm.formState.isSubmitting}>
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
