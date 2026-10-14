import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Takes the place of an emoji in a line of text: sized from the font, and
// hidden from screen readers because the words beside it already name it.
export default function InlineIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon
  className?: string
}) {
  return (
    <Icon
      aria-hidden="true"
      className={cn(
        'mr-[0.3em] inline-block size-[1em] align-[-0.125em]',
        className
      )}
    />
  )
}
