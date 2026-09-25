'use client'

import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  FIELDS,
  OPTIONS,
  SECTIONS,
  type ComposerState,
  type FieldId,
  type SectionId,
} from './catalog'

// A stripe, not a fill: it reads in both themes without branching on one.
export const SECTION_ACCENT: Record<SectionId, string> = {
  task: '#3b82f6',
  context: '#ec4899',
  input: '#22c55e',
  examples: '#f59e0b',
  output: '#f97316',
  quality: '#a855f7',
  interaction: '#06b6d4',
}

const GROUP_LABELS: Record<string, string> = {
  audience: 'Who will read it',
  format: 'Format',
  length: 'Length',
}

export const textareaClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

interface Props {
  state: ComposerState
  open: string[]
  onOpenChange: (open: string[]) => void
  onField: (id: FieldId, value: string) => void
  onToggle: (id: string) => void
  onGroup: (group: string, id: string | null) => void
  fieldRefs: React.RefObject<Partial<Record<FieldId, HTMLTextAreaElement>>>
}

function filledCount({ fields, selected }: ComposerState, section: SectionId) {
  return (
    FIELDS.filter((f) => f.section === section && fields[f.id].trim()).length +
    OPTIONS.filter((o) => o.section === section && selected.has(o.id)).length
  )
}

export default function ComponentSelector({
  state,
  open,
  onOpenChange,
  onField,
  onToggle,
  onGroup,
  fieldRefs,
}: Props) {
  return (
    <Accordion
      type="multiple"
      value={open}
      onValueChange={onOpenChange}
      className="w-full space-y-2"
    >
      {SECTIONS.map((section) => {
        const fields = FIELDS.filter((f) => f.section === section.id)
        const options = OPTIONS.filter((o) => o.section === section.id)
        const groups = [
          ...new Set(options.flatMap((o) => (o.group ? [o.group] : []))),
        ]
        const loose = options.filter((o) => !o.group)
        const count = filledCount(state, section.id)

        return (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="border-l-4"
            style={{ borderLeftColor: SECTION_ACCENT[section.id] }}
          >
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="flex w-full items-center justify-between pr-2">
                <span className="flex items-center gap-2 text-base font-semibold">
                  <span aria-hidden="true">{section.icon}</span>
                  {section.label}
                </span>
                {count > 0 && (
                  <span className="text-xs font-semibold tabular-nums">
                    {count}
                    <span className="sr-only"> set</span>
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <p className="text-muted-foreground">{section.blurb}</p>

              {fields.map((field) => {
                const hintId = `pc-${field.id}-hint`
                return (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={`pc-${field.id}`} className="font-semibold">
                      {field.label}
                    </Label>
                    <textarea
                      id={`pc-${field.id}`}
                      ref={(el) => {
                        if (el) fieldRefs.current[field.id] = el
                      }}
                      rows={field.rows}
                      value={state.fields[field.id]}
                      placeholder={field.placeholder}
                      aria-describedby={hintId}
                      onChange={(e) => onField(field.id, e.target.value)}
                      className={textareaClass}
                    />
                    <p id={hintId} className="text-muted-foreground text-xs">
                      {field.hint}
                    </p>
                  </div>
                )
              })}

              {groups.map((group) => {
                const members = options.filter((o) => o.group === group)
                const current =
                  members.find((o) => state.selected.has(o.id))?.id ?? 'none'
                const labelId = `pc-group-${group}`
                return (
                  <fieldset key={group} className="space-y-2">
                    <legend id={labelId} className="mb-2 text-sm font-semibold">
                      {GROUP_LABELS[group] ?? group}
                    </legend>
                    <RadioGroup
                      aria-labelledby={labelId}
                      value={current}
                      onValueChange={(value) =>
                        onGroup(group, value === 'none' ? null : value)
                      }
                      className="gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="none" id={`pc-${group}-none`} />
                        <Label htmlFor={`pc-${group}-none`}>
                          Let the model decide
                        </Label>
                      </div>
                      {members.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center gap-2"
                        >
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex-wrap">
                            <span className="font-semibold">
                              {option.label}
                            </span>
                            <span className="text-muted-foreground font-normal">
                              {option.description}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </fieldset>
                )
              })}

              {loose.length > 0 && (
                <div className="space-y-2">
                  {loose.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Checkbox
                        id={option.id}
                        checked={state.selected.has(option.id)}
                        onCheckedChange={() => onToggle(option.id)}
                      />
                      <Label htmlFor={option.id} className="flex-wrap">
                        <span className="font-semibold">{option.label}</span>
                        <span className="text-muted-foreground font-normal">
                          {option.description}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
