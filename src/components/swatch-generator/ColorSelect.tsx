'use client'

import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Option = { name: string; hex: string }

// A native <select> cannot show color inside its options on iOS or Firefox.
export default function ColorSelect({
  label,
  options,
  value,
  onChange,
  className,
}: {
  className?: string
  label: string
  options: readonly Option[]
  value: string
  onChange: (name: string) => void
}) {
  const id = useId()
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-[min(20rem,var(--radix-select-content-available-height))]">
          {options.map((o) => (
            <SelectItem key={o.name} value={o.name}>
              <span
                aria-hidden="true"
                data-testid="chip"
                className="size-6 shrink-0 rounded-full border border-foreground/50"
                style={{ background: o.hex }}
              />
              <span className="truncate">{o.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
