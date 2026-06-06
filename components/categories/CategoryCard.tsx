'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ColorPicker } from './ColorPicker'
import { updateCategory, deleteCategory } from '@/lib/actions/categories'
import { categorySchema } from '@/lib/validations'
import type { Category } from '@/types'

const editSchema = categorySchema.partial().omit({ type: true })
type EditValues = z.infer<typeof editSchema>

interface CategoryCardProps {
  category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
  const [editing, setEditing] = useState(false)
  const [color, setColor] = useState(category.color)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: category.name, color: category.color, icon: category.icon },
  })

  async function onSave(data: EditValues) {
    const formData = new FormData()
    if (data.name) formData.set('name', data.name)
    if (data.color) formData.set('color', data.color)
    if (data.icon) formData.set('icon', data.icon)
    const result = await updateCategory(category.id, formData)
    if (result.success) {
      toast.success('Category updated')
      setEditing(false)
    } else {
      toast.error(result.error)
    }
  }

  async function handleDelete() {
    const result = await deleteCategory(category.id)
    if (result.success) {
      toast.success('Category deleted')
    } else {
      toast.error(result.error)
    }
  }

  if (editing) {
    return (
      <Card className="border-primary/30">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit(onSave)} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Name</Label>
                <Input className="h-7 text-sm" {...register('name')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Icon</Label>
                <Input className="h-7 w-16 text-sm text-center" maxLength={10} {...register('icon')} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <ColorPicker value={color} onChange={(c) => { setColor(c); setValue('color', c) }} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="h-7 gap-1" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Save
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setEditing(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ background: `${category.color}20` }}
        >
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{category.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-2 w-2 rounded-full" style={{ background: category.color }} />
            <span className="text-xs text-muted-foreground capitalize">{category.type}</span>
          </div>
        </div>
        {category.isDefault ? (
          <Badge variant="secondary" className="text-xs">Default</Badge>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              }
              title="Delete Category"
              description={`Delete "${category.name}"? This only works if no transactions use it.`}
              confirmLabel="Delete"
              destructive
              onConfirm={handleDelete}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
