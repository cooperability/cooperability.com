/**
 * Type definitions for Prompt Composer
 */

export interface PromptComponent {
  id: string
  category:
    | 'role'
    | 'audience'
    | 'context'
    | 'reasoning'
    | 'output'
    | 'constraints'
    | 'meta'
  label: string
  description: string
  template: string
  priority: number
  inputType: 'checkbox' | 'radio' | 'toggle'
  radioGroup?: string
}

export interface PromptComposerProps {
  className?: string
}

export interface Viewport {
  minReal: number
  maxReal: number
  minImag: number
  maxImag: number
}

