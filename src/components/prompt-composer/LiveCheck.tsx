'use client'

import React from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleDot,
  MinusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OPTIONS_BY_ID } from './catalog'
import type { CheckStatus, Fix, LintResult } from './lint'
import { DIMENSION_LABELS } from './labels'

const STATUS: Record<
  CheckStatus,
  { icon: React.ElementType; label: string; className: string }
> = {
  good: {
    icon: CheckCircle2,
    label: 'Good',
    className: 'text-green-600 dark:text-green-400',
  },
  weak: {
    icon: CircleDot,
    label: 'Could be stronger',
    className: 'text-amber-600 dark:text-amber-400',
  },
  missing: {
    icon: Circle,
    label: 'Missing',
    className: 'text-red-600 dark:text-red-400',
  },
  na: {
    icon: MinusCircle,
    label: 'Not needed',
    className: 'text-gray-600 dark:text-gray-400',
  },
}

function fixLabel(fix: Fix): string {
  if (fix.kind === 'field') return 'Edit'
  return `Add “${OPTIONS_BY_ID.get(fix.id)?.label ?? fix.id}”`
}

export default function LiveCheck({
  result,
  onFix,
}: {
  result: LintResult
  onFix: (fix: Fix) => void
}) {
  return (
    <section aria-labelledby="pc-live-check" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 id="pc-live-check" className="text-lg font-bold">
          Live check
        </h2>
        <span className="text-sm tabular-nums">
          {result.score === null ? (
            <span className="text-gray-600 dark:text-gray-400">
              Start writing
            </span>
          ) : (
            <>
              <span className="font-bold">{result.score}</span>
              <span className="text-gray-600 dark:text-gray-400">/100</span>
            </>
          )}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-xs">
        Free and instant, from rules on the composer. The AI review below reads
        the prompt itself.
      </p>

      <ul className="space-y-2">
        {result.checks.map((check) => {
          const { icon: Icon, label, className } = STATUS[check.status]
          return (
            <li
              key={check.dimension}
              className="flex items-start gap-2 text-sm"
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${className}`}
                aria-hidden="true"
              />
              <span className="flex-1">
                <span className="font-semibold">
                  {DIMENSION_LABELS[check.dimension]}
                </span>
                <span className="sr-only"> ({label})</span>: {check.message}
              </span>
              {check.fix && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={() => onFix(check.fix!)}
                  aria-label={`${fixLabel(check.fix)} for ${DIMENSION_LABELS[check.dimension]}`}
                >
                  {fixLabel(check.fix)}
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      {result.warnings.length > 0 && (
        <ul className="space-y-2 border-t pt-3">
          {result.warnings.map((w) => (
            <li key={w.id} className="flex items-start gap-2 text-sm">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              <span>{w.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
