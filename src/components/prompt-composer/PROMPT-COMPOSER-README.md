# Prompt Composer

## Overview

A research-driven visual prompt building tool that demonstrates evidence-based modular prompting. This tool reflects current LLM reasoning research and prompt engineering best practices, making the invisible architecture of effective prompts visible while serving as a practical utility for systematic prompt composition.

## File Structure

```
prompt-composer/
├── PromptComposer.tsx       # Main component file
├── types.ts                 # TypeScript interfaces
├── constants.ts             # Component data, styles, and metadata
├── utils/
│   └── helpers.ts          # Color and text utility functions
└── PROMPT-COMPOSER-README.md # This file
```

## Architecture

### Types (`types.ts`)

Defines the core interfaces used throughout the component:

- `PromptComponent`: Structure for individual prompt components
- `PromptComposerProps`: Props for the main component
- `Viewport`: (Legacy - can be removed)

### Constants (`constants.ts`)

Contains all the static data and configuration:

- `promptComposerStyles`: CSS class name mappings for styling
- `tw`: Tailwind utility class collections
- `COMPONENT_ARRAY`: Array of all prompt components with their metadata
- `categoryLabels`: Human-readable category names
- `categoryIcons`: Emoji icons for each category

### Utilities (`utils/helpers.ts`)

Helper functions for component logic:

- Color functions: `getLightCategoryColor`, `getDarkCategoryColor`, `getCategoryBorderColor`, `getCurrentCategoryColor`
- Text utilities: `countWords`

### Main Component (`PromptComposer.tsx`)

The primary React component that orchestrates the prompt building interface.

## Design Philosophy

### Research Foundation

The component is built on several key research findings:

1. **Task Decomposition Principle**: Breaking complex problems into simpler sub-tasks improves LLM performance
2. **Chain-of-Thought Effectiveness**: Step-by-step reasoning improves accuracy on complex tasks
3. **Few-Shot Prompting Benefits**: Examples improve performance across diverse tasks
4. **Role-Based Prompting Impact**: Specific role assignment can improve task performance
5. **Structured Format Importance**: Clear formatting enhances LLM comprehension

### UI/UX Component Selection

- **Radio buttons**: For mutually exclusive choices (role specification, reasoning strategy)
  - Research shows conflicting instructions can reduce LLM performance
- **Checkboxes**: For combinable elements (context types, output formats, constraints)
  - Research supports layered context provision for improved comprehension
- **Toggle switches**: For binary states (technical/general audience)
  - Follows established UX patterns for immediate conceptual opposition

## Component Categories

### 1. Role Specification (Radio Buttons - Mutually Exclusive)
- Subject Matter Expert
- Patient Educator
- Critical Analyst
- Strategic Consultant
- Research Specialist

### 2. Audience Targeting (Toggle Switch - Binary)
- General vs. Technical audience

### 3. Context Provision (Checkboxes - Combinable)
- Example-Based Context
- Domain Background
- Constraint Awareness
- Stakeholder Perspectives
- Best Practices

### 4. Reasoning Strategy (Radio Buttons - Single Approach)
- Chain-of-Thought
- Problem Decomposition
- Comparative Analysis
- First Principles

### 5. Output Instructions (Checkboxes - Combinable)
- Structured Format
- Probabilistic Assessment
- Actionable Steps
- Evidence-Based
- Visual Elements
- Executive Summary

### 6. Constraint Specifications (Checkboxes - Multiple Constraints)
- Concise Response
- Word Count Limit
- Accessibility Focus
- Neutral Tone

### 7. Meta-Prompt Enhancements (Checkboxes - Self-Improvement)
- Clarify > Assume
- Self-Improvement
- Confidence Assessment
- Alternative Approaches
- Response Validation

## Key Features

1. **Modular Prompt Construction**: Users can select from research-backed prompt components
2. **Live Preview**: Real-time compilation of selected components
3. **Editable Output**: Users can manually edit the compiled prompt
4. **Statistics**: Word count, component count, and category count tracking
5. **Theme Support**: Full dark/light mode compatibility
6. **Research Documentation**: Built-in explanation of design decisions and references

## Usage

```tsx
import PromptComposer from '@/components/prompt-composer/PromptComposer'

function MyPage() {
  return <PromptComposer className="my-custom-class" />
}
```

## Dependencies

- `react`: Core React library
- `next-themes`: Theme management
- `lucide-react`: Icon library
- `@/components/ui/*`: shadcn/ui components (Card, Button, Accordion, Switch, Checkbox, RadioGroup, Label)

## Research References

See the "Research-Backed Design Documentation" accordion in the component for full academic references supporting the design decisions.

## Future Enhancements

Potential areas for expansion based on emerging research:

1. Component combination suggestions based on effectiveness data
2. Save/load prompt templates
3. Prompt effectiveness scoring
4. Export to various formats
5. Integration with LLM APIs for testing
6. A/B testing of prompt variations

## Maintenance Notes

- Component data is centralized in `constants.ts` for easy updates
- Color schemes can be modified in `utils/helpers.ts`
- New component categories can be added by extending the `PromptComponent` interface and updating the constants
- The component follows React best practices with hooks and memoization for performance

