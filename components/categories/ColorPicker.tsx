'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#f97316', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444', '#64748b',
  '#84cc16', '#06b6d4',
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [custom, setCustom] = useState(
    PRESET_COLORS.includes(value) ? '' : value
  )

  function handleCustom(v: string) {
    setCustom(v)
    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
              value === c ? 'border-foreground scale-110' : 'border-transparent'
            )}
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full border border-border shrink-0" style={{ background: value }} />
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Custom hex</Label>
          <Input
            value={custom}
            onChange={(e) => handleCustom(e.target.value)}
            placeholder="#000000"
            className="h-7 text-xs font-mono"
          />
        </div>
      </div>
    </div>
  )
}
