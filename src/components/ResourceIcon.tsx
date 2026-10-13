import { Link, NotepadText, Wrench, type LucideIcon } from 'lucide-react'
import InlineIcon from './InlineIcon'

// A resource names its icon in front matter (`icon: wrench`). The names are
// strings because front matter cannot hold a component, so this is the one
// place they resolve.
export const RESOURCE_ICONS: Record<string, LucideIcon> = {
  link: Link,
  notepad: NotepadText,
  wrench: Wrench,
}

export default function ResourceIcon({ name }: { name?: string }) {
  const icon = name ? RESOURCE_ICONS[name] : undefined
  return icon ? <InlineIcon icon={icon} /> : null
}
