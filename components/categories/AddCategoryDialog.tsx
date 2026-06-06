'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ColorPicker } from './ColorPicker'
import { addCategory } from '@/lib/actions/categories'
import { categorySchema } from '@/lib/validations'

type FormValues = z.infer<typeof categorySchema>

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { color: '#6366f1', icon: '💰', type: 'expense', name: '' },
  })

  async function onSubmit(data: FormValues) {
    const formData = new FormData()
    formData.set('name', data.name)
    formData.set('type', data.type)
    formData.set('color', data.color)
    formData.set('icon', data.icon)
    const result = await addCategory(formData)
    if (result.success) {
      toast.success('Category created')
      setOpen(false)
      reset()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Gym" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="icon">Emoji Icon</Label>
            <Input id="icon" placeholder="💰" maxLength={10} {...register('icon')} />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <ColorPicker value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Category'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
