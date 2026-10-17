'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Option = { name: string; hex: string }

function Chip({ hex }: { hex: string }) {
  return (
    <span
      aria-hidden="true"
      data-testid="chip"
      className="size-7 shrink-0 rounded-full border border-foreground/50"
      style={{ background: hex }}
    />
  )
}

// A native <select> cannot show color inside its options on iOS or Firefox,
// so this follows the WAI-ARIA select-only combobox pattern: focus stays on
// the button and aria-activedescendant tracks the highlighted option.
export default function ColorSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly Option[]
  value: string
  onChange: (name: string) => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const selected = options.findIndex((o) => o.name === value)
  const last = options.length - 1

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  useEffect(() => {
    if (open)
      list.current?.children[active]?.scrollIntoView?.({ block: 'nearest' })
  }, [open, active])

  const show = (i: number) => {
    setActive(i)
    setOpen(true)
  }
  const choose = (i: number) => {
    onChange(options[i].name)
    setOpen(false)
  }
  // Next option after the highlighted one whose name starts with the key.
  const match = (key: string) => {
    const from = open ? active : selected
    for (let step = 1; step <= options.length; step++) {
      const i = (from + step) % options.length
      if (options[i].name.toLowerCase().startsWith(key.toLowerCase())) return i
    }
    return -1
  }

  function onKeyDown(e: KeyboardEvent) {
    const typed = e.key.length === 1 && e.key !== ' ' ? match(e.key) : -1
    const moves: Record<string, number> = {
      ArrowDown: open ? Math.min(active + 1, last) : selected,
      ArrowUp: open ? Math.max(active - 1, 0) : selected,
      Home: 0,
      End: last,
    }
    if (e.key in moves) {
      e.preventDefault()
      show(moves[e.key])
    } else if (typed >= 0) {
      show(typed)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open) choose(active)
      else show(selected)
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'Tab' && open) {
      choose(active)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${id}-button`}>{label}</Label>
      <div ref={root} className="relative">
        <button
          id={`${id}-button`}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open ? `${id}-${active}` : undefined}
          onClick={() => (open ? setOpen(false) : show(selected))}
          onKeyDown={onKeyDown}
          className="flex w-full items-center gap-3 rounded-md border border-foreground/50 bg-background px-3 py-2 text-left"
        >
          <Chip hex={options[selected].hex} />
          <span className="flex-1 truncate">{value}</span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </button>
        {open && (
          <ul
            id={`${id}-list`}
            ref={list}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            className="absolute top-full z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-foreground/50 bg-background p-1 shadow-lg"
          >
            {options.map((o, i) => (
              <li
                key={o.name}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === selected}
                // Keeps focus on the combobox when an option is pressed.
                onPointerDown={(e) => e.preventDefault()}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(i)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded px-2 py-1.5',
                  i === active && 'bg-foreground/15'
                )}
              >
                <Chip hex={o.hex} />
                <span className="flex-1">{o.name}</span>
                {i === selected && (
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
