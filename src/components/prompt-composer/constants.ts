/**
 * Constants for Prompt Composer
 * Includes style definitions, component data, and category metadata
 */

import { PromptComponent } from './types'

// CSS Classes for Prompt Composer
export const promptComposerStyles = {
  // Base component styles
  container: 'container mx-auto p-1',
  title: 'text-2xl md:text-3xl font-bold mb-2 text-gray-800',
  subtitle: 'text-gray-600 mb-4 md:mb-6 text-sm md:text-base',
  mainLayout: 'flex flex-col md:flex-row gap-3 h-full',
  componentGroup: 'border rounded-lg py-3 gap-1',

  // Card styles
  cardHeader: 'mb-1',

  // Category button styles
  categoryButton:
    'flex items-center w-full text-inherit rounded-lg transition-colors duration-200 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
  categoryIcon: 'text-gray-900 mr-3 text-sm font-medium',
  categoryLabel: 'font-semibold',

  // Expanded container styles
  expandedContainer: 'mt-1',
  componentContainer: 'border rounded-lg overflow-hidden',
  componentsWrapper: 'relative pl-4',

  // Component item styles - Updated for single line layout
  componentWrapper: 'border-b last:border-b-0 ',
  componentItem:
    'flex flex-row items-center p-3 hover:bg-white hover:bg-opacity-50 cursor-pointer transition-colors duration-150 group w-full',
  componentCheckbox:
    'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 roundedflex-shrink-0',

  // Radio button styles (new)
  componentRadio:
    'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mr-3 flex-shrink-0',

  // Toggle switch styles (removed - now using styles from utils.module.css)

  componentTextContainer: 'flex flex-row items-center',
  componentTitle:
    'text-sm text-gray-800 group-hover:text-gray-900 font-bold mr-2',
  componentSubtitle: 'text-sm text-gray-600 font-normal',

  // Live Preview styles
  livePreviewHeader:
    'flex text-lg font-bold flex-row sm:flex-row sm:items-center justify-between',
  buttonContainer: 'flex flex-row items-center justify-between',
  clearButton:
    'px-2py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm md:text-base font-medium',
  copyButton:
    'px-2py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm md:text-base font-medium',

  // Preview styles - Updated for dark theme
  previewContainer: 'border rounded-lg min-h-64 md:min-h-20 p-2 bg-gray-800',
  previewContent: 'space-y-3',
  previewSection: 'p-4 rounded-lg border-l-4 space-y-3',
  previewCategoryHeader: 'text-xs font-semibold uppercase tracking-wider mb-2',
  previewComponentText: 'text-sm leading-relaxed',

  // Empty state styles - Updated for dark theme
  emptyState: 'text-center text-gray-400 mt-8 md:mt-12',
  emptyStateTitle: 'text-base md:text-lg',
  emptyStateSubtitle: 'text-sm text-gray-500 mt-2',

  // Cost analysis styles
  costContainer: 'mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200',
  costTitle: 'text-sm font-medium text-blue-800 mb-3',
  costTableWrapper: 'overflow-x-auto',
  costTable: 'w-full text-xs text-blue-700',
  costTableHeader: 'border-b border-blue-200',
  costTableHeaderCell: 'text-left py-1 px-2 font-medium',
  costTableHeaderCellRight: 'text-right py-1 px-2 font-medium',
  costTableCell: 'py-1 px-2',
  costTableCellRight: 'text-right py-1 px-2',

  // Analysis section styles
  statsCard: 'mb-4 border rounded-lg',
  analysisSection: 'pt-2 border-t border-blue-300',
  analysisContent: 'text-xs text-blue-600 space-y-1',
  analysisHighlight: 'ml-2 text-blue-500',

  // Research documentation styles
  researchDocumentation: 'm-1 border rounded-lg',
}

// PHASE 1: Centralized Tailwind Classes (alongside existing styles for gradual migration)
export const tw = {
  // Layout & containers
  mainContainer: 'container mx-auto p-4 md:p-6',
  flexLayout: 'flex flex-col lg:flex-row',

  // Typography
  title: 'text-2xl md:text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100',
  subtitle:
    'text-gray-600 dark:text-gray-400 mb-4 md:mb-6 text-sm md:text-base',

  // Interactive elements
  audienceToggle: 'flex items-center justify-center p-3',
  audienceLabelActive:
    'text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors',
  audienceLabelInactive:
    'text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors',

  // Component styling
  componentLabel: 'text-sm cursor-pointer flex flex-col items-start pl-2',
  componentLabelTitle: 'font-bold text-gray-800 dark:text-gray-200',
  componentLabelDescription: 'font-normal text-gray-600 dark:text-gray-400',

  // Layout helpers
  radioCheckboxContainer: 'p-3 flex',
  radioCheckboxItem: 'flex items-center mb-1 border-b',

  // Statistics
  statsGrid: 'grid grid-rows-3 gap-1 text-center font-bold',
  statsWord: 'text-md text-green-600 dark:text-green-400',
  statsComponent: 'text-md text-blue-600 dark:text-blue-400',
  statsCategory: 'text-md text-purple-600 dark:text-purple-400',
}

// Prompt components with research-backed categorization
export const COMPONENT_ARRAY: PromptComponent[] = [
  // Role Specification - Radio buttons (mutually exclusive)
  {
    id: 'role-expert',
    category: 'role',
    label: 'Subject Matter Expert',
    description: 'Deep domain expertise and authority',
    template:
      'You are a recognized expert with deep knowledge and practical experience in this field.',
    priority: 1,
    inputType: 'radio',
    radioGroup: 'persona',
  },
  {
    id: 'role-teacher',
    category: 'role',
    label: 'Patient Educator',
    description: 'Teaching and clear explanation focus',
    template:
      'You are a skilled educator who explains complex concepts clearly and adapts to different learning levels.',
    priority: 1,
    inputType: 'radio',
    radioGroup: 'persona',
  },
  {
    id: 'role-analyst',
    category: 'role',
    label: 'Critical Analyst',
    description: 'Systematic analysis and evaluation',
    template:
      'You are a critical analyst who examines information systematically and provides well-reasoned insights.',
    priority: 1,
    inputType: 'radio',
    radioGroup: 'persona',
  },
  {
    id: 'role-consultant',
    category: 'role',
    label: 'Strategic Consultant',
    description: 'Problem-solving and strategic thinking',
    template:
      'You are a strategic consultant who identifies problems, evaluates options, and recommends optimal solutions.',
    priority: 1,
    inputType: 'radio',
    radioGroup: 'persona',
  },
  {
    id: 'role-researcher',
    category: 'role',
    label: 'Research Specialist',
    description: 'Evidence-based investigation and analysis',
    template:
      'You are a research specialist who conducts thorough investigations and presents evidence-based findings.',
    priority: 1,
    inputType: 'radio',
    radioGroup: 'persona',
  },

  // Context Provision - Checkboxes (combinable)
  {
    id: 'context-examples',
    category: 'context',
    label: 'Example-Based Context',
    description: 'Include relevant examples and analogies',
    template:
      'Provide concrete examples and analogies to illustrate key concepts and make them more understandable.',
    priority: 3,
    inputType: 'checkbox',
  },
  {
    id: 'context-background',
    category: 'context',
    label: 'Domain Background',
    description: 'Consider broader domain knowledge',
    template:
      'Consider the domain context, industry standards, and established best practices when analyzing the provided information.',
    priority: 3,
    inputType: 'checkbox',
  },
  {
    id: 'context-constraints',
    category: 'context',
    label: 'Constraint Awareness',
    description: 'Acknowledge real-world limitations',
    template:
      'Be aware of practical constraints, resource limitations, and real-world considerations that might affect implementation.',
    priority: 3,
    inputType: 'checkbox',
  },
  {
    id: 'context-stakeholders',
    category: 'context',
    label: 'Stakeholder Perspectives',
    description: 'Consider multiple viewpoints',
    template:
      'Consider the perspectives and needs of different stakeholders who might be affected by or involved in the topic.',
    priority: 3,
    inputType: 'checkbox',
  },

  // Reasoning Strategy - Radio buttons (single approach)
  {
    id: 'reasoning-cot',
    category: 'reasoning',
    label: 'Chain-of-Thought',
    description: 'Step-by-step logical reasoning',
    template:
      'Think through this step-by-step, showing your reasoning process clearly at each stage.',
    priority: 4,
    inputType: 'radio',
    radioGroup: 'reasoning',
  },
  {
    id: 'reasoning-decomp',
    category: 'reasoning',
    label: 'Problem Decomposition',
    description: 'Break complex problems into parts',
    template:
      'Break this complex problem down into smaller, manageable components and solve each systematically.',
    priority: 4,
    inputType: 'radio',
    radioGroup: 'reasoning',
  },
  {
    id: 'reasoning-comparison',
    category: 'reasoning',
    label: 'Comparative Analysis',
    description: 'Evaluate multiple options or approaches',
    template:
      'Compare different approaches or options, weighing their pros and cons before making recommendations.',
    priority: 4,
    inputType: 'radio',
    radioGroup: 'reasoning',
  },
  {
    id: 'reasoning-first-principles',
    category: 'reasoning',
    label: 'First Principles',
    description: 'Reason from fundamental assumptions',
    template:
      'Approach this from first principles, starting with fundamental assumptions and building up logically.',
    priority: 4,
    inputType: 'radio',
    radioGroup: 'reasoning',
  },

  // Output Instructions - Checkboxes (combinable formats)
  {
    id: 'output-structured',
    category: 'output',
    label: 'Structured Format',
    description: 'Use clear headers and sections',
    template:
      'Organize your response with clear headers, subheadings, and logical sections for easy navigation.',
    priority: 5,
    inputType: 'checkbox',
  },
  {
    id: 'output-probabilistic',
    category: 'output',
    label: 'Probabilistic Assessment',
    description: 'Probabilistic assessment of different outcomes',
    template:
      'Provide a probabilistic assessment of different outcomes, including the likelihood of each outcome.',
    priority: 5,
    inputType: 'checkbox',
  },
  {
    id: 'output-actionable',
    category: 'output',
    label: 'Actionable Steps',
    description: 'Include specific next steps',
    template:
      'Provide specific, actionable steps or recommendations that can be implemented directly.',
    priority: 5,
    inputType: 'checkbox',
  },
  {
    id: 'output-evidence',
    category: 'output',
    label: 'Evidence-Based',
    description: 'Support claims with evidence',
    template:
      'Support key points with evidence, citations, or logical reasoning to strengthen credibility.',
    priority: 5,
    inputType: 'checkbox',
  },
  {
    id: 'output-visual',
    category: 'output',
    label: 'Visual Elements',
    description: 'Use formatting for clarity',
    template:
      'Use bullet points, numbered lists, tables, or other visual formatting to enhance readability.',
    priority: 5,
    inputType: 'checkbox',
  },
  {
    id: 'output-summary',
    category: 'output',
    label: 'Executive Summary',
    description: 'Include key takeaways',
    template:
      'Begin or end with a concise summary of the most important points and key takeaways.',
    priority: 5,
    inputType: 'checkbox',
  },

  // Constraint Specifications - Checkboxes (multiple constraints)
  {
    id: 'constraint-concise',
    category: 'constraints',
    label: 'Concise Response',
    description: 'Keep response brief and focused',
    template:
      'Keep your response concise and focused on the essential points, avoiding unnecessary elaboration.',
    priority: 6,
    inputType: 'checkbox',
  },
  {
    id: 'constraint-word-limit',
    category: 'constraints',
    label: 'Word Count Limit',
    description: 'Approximately 300-500 words',
    template:
      'Limit your response to approximately 300-500 words while maintaining clarity and completeness.',
    priority: 6,
    inputType: 'checkbox',
  },
  {
    id: 'constraint-accessible',
    category: 'constraints',
    label: 'Accessibility Focus',
    description: 'Ensure content is accessible',
    template:
      'Ensure your response is accessible to diverse audiences, avoiding jargon and explaining technical terms.',
    priority: 6,
    inputType: 'checkbox',
  },
  {
    id: 'constraint-neutral',
    category: 'constraints',
    label: 'Neutral Tone',
    description: 'Maintain objective perspective',
    template:
      'Maintain a neutral, objective tone and present balanced perspectives on controversial topics.',
    priority: 6,
    inputType: 'checkbox',
  },

  // Meta-Prompt Enhancements - Checkboxes (self-improvement)
  {
    id: 'meta-online-tools',
    category: 'meta',
    label: 'Clarify > Assume',
    description: 'Clarify unspecified instructions',
    template:
      'Ask any clarifying questions you need rather than assuming behavior where no specific instruction exists.',
    priority: 7,
    inputType: 'checkbox',
  },
  {
    id: 'meta-improvement',
    category: 'meta',
    label: 'Self-Improvement',
    description: 'Suggest prompt enhancements',
    template:
      'After providing your response, suggest how this prompt could be improved for better clarity or more specific results.',
    priority: 7,
    inputType: 'checkbox',
  },
  {
    id: 'meta-confidence',
    category: 'meta',
    label: 'Confidence Assessment',
    description: 'Indicate certainty levels',
    template:
      'Indicate your confidence level in key recommendations and acknowledge areas of uncertainty.',
    priority: 7,
    inputType: 'checkbox',
  },
  {
    id: 'meta-alternatives',
    category: 'meta',
    label: 'Alternative Approaches',
    description: 'Suggest different methods',
    template:
      'Suggest alternative approaches or methods that could be used to address the same problem.',
    priority: 7,
    inputType: 'checkbox',
  },
  {
    id: 'meta-validation',
    category: 'meta',
    label: 'Response Validation',
    description: 'Self-check for accuracy',
    template:
      'Review your response for accuracy, completeness, and logical consistency before finalizing.',
    priority: 7,
    inputType: 'checkbox',
  },
]

export const categoryLabels = {
  role: 'Role',
  audience: 'Audience',
  context: 'Context',
  reasoning: 'Reasoning',
  output: 'Output',
  constraints: 'Constraints',
  meta: 'Meta-Prompts',
}

export const categoryIcons = {
  role: '👤',
  audience: '🎯',
  context: '📋',
  reasoning: '🧠',
  output: '📄',
  constraints: '⚡',
  meta: '🔄',
}
