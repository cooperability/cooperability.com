'use client'

import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'

import { cn } from '@/lib/utils'

// shadcn's version imports its variants from a separate `toggle` component,
// which would add @radix-ui/react-toggle as a third dependency.
// Also styles radio items drawn as a segmented control, hence `checked`.
const toggleItemClass =
  'inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-foreground/50 bg-background px-2.5 text-sm font-medium whitespace-nowrap transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'

function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn('flex w-full flex-wrap gap-1.5', className)}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleItemClass, className)}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem, toggleItemClass }
