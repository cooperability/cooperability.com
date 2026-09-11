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

## Improvement Opportunities

Code-grounded findings from a pass over the current implementation, ranked by user-facing impact rather than by discovery order. Each names the file/line, who it affects, and roughly what the fix costs.

### 1. The unconditional sync effect destroys user input — and breaks two other things

`PromptComposer.tsx:156-158` re-syncs `editedPrompt` from `compiledPrompt` on every change to the compiled value, with no guard. Three distinct symptoms, one root cause:

- **Manual edits are silently discarded.** Hand-edit the textarea, then toggle any checkbox or radio: the edit is gone, with no warning and no undo.
- **"Clear" does not clear.** `clearAll` (`:94-102`) sets `editedPrompt` to `''`, but resetting the selections changes `compiledPrompt`, which immediately re-fires the effect and repopulates the box with the default general-audience sentence. The button's label misdescribes what it does.
- **The empty state is unreachable.** `compiledPrompt` is never empty — the audience branch always pushes a sentence (`:117-125`) — so the `editedPrompt.trim() ?` test at `:529` is effectively always true and the "No components selected" block (`:537-544`) renders for at most one frame on mount.

Impact: unrecoverable loss of typed content, the only such case in the component. Fix: a `dirty` flag so the effect only auto-syncs while the textarea is untouched, plus an explicit "regenerate from selections" action; then decide whether an all-defaults prompt should render as empty so the empty state becomes reachable again. ~30 lines, self-contained.

### 2. Category headers are unreadable in the default theme

`PromptComposer.tsx:36-37` computes `isLightMode = theme === 'light'`. `_app.tsx:20` mounts `<ThemeProvider enableSystem={true}>` with no `defaultTheme`, so `next-themes` reports `'system'` for every visitor who has not explicitly toggled — the majority — and `isLightMode` is `false` for all of them. `getCurrentCategoryColor` (`helpers.ts:81-88`, used at `:263`) therefore paints the accordion triggers from the _dark_ palette (`helpers.ts:33-52`, e.g. `#1e3a8a`) while the page itself is light and text inherits the near-black `--foreground` (`global.css:133`).

This is not "the wrong shade" — it is roughly **1.7:1 contrast** on the primary navigation labels, well under the 4.5:1 floor, and `categoryIcon` is separately pinned to `text-gray-900` (`constants.ts:23`). Affects every default-configuration visitor on a light OS. Fix: read `resolvedTheme` instead of `theme`, and guard the pre-mount render where `resolvedTheme` is still `undefined`. One line plus a mount guard.

### 3. The compiled-prompt textarea has no accessible name

`PromptComposer.tsx:530-535` renders the primary output control with `value`, `onChange`, `className`, and `placeholder` only — no `<Label htmlFor>`, no `aria-label`, no `aria-labelledby`. The `placeholder` is the sole textual hint and it never renders, because the textarea only mounts when `editedPrompt` is non-empty (see finding 1). A screen-reader user reaches an unlabelled multiline edit box.

This is a WCAG 4.1.2 failure on the component's main interactive element, and it is exactly the class of defect the repo's own `yarn access` (axe + Lighthouse) gate exists to catch. Fix: one `aria-label`, or wire the existing `CardTitle` up via `aria-labelledby`. One line.

### 4. The subtitle has no dark-mode variant — and the fixed version already exists, unused

`promptComposerStyles.subtitle` (`constants.ts:13`) is `text-gray-600` with no `dark:` variant, and it is what actually renders at `PromptComposer.tsx:235`. Meanwhile `tw.subtitle` (`constants.ts:99-100`) is the theme-aware version — `text-gray-600 dark:text-gray-400` — and is referenced nowhere. Same story for `tw.title` (`constants.ts:98`) versus the `text-gray-800` in `promptComposerStyles.title` (`constants.ts:12`), which is currently masked only because the JSX overrides it with `style={{ color: 'inherit' }}` at `:232`.

So part of what looks like dead code in finding 8 is really the _corrected_ styles that were never switched over. Fix: point the JSX at the `tw.*` keys and delete the superseded ones. Two lines.

### 5. Button feedback is visual-only, and clipboard failure is silent

`PromptComposer.tsx:83-102` swaps icon and label to "Copied!" / "Cleared!", but nothing announces the change to assistive tech — add an `aria-live="polite"` (or `role="status"`) region. Compounding it, `copyToClipboard` swallows failure into `console.error` (`:89-91`): on Safari, in an insecure context, or wherever the Clipboard API is unavailable, the user gets no signal at all and the button simply appears inert. Fix both together: one live region, one error branch.

### 6. Compiled-prompt panel is hardcoded dark

`constants.ts:59` (`previewContainer`, `bg-gray-800`) and `PromptComposer.tsx:533` (`text-gray-200`) pin that panel dark regardless of theme. Unlike finding 2 the pairing is internally legible — light text on a dark ground — so this is a visual inconsistency with the rest of the theme-aware UI rather than a contrast failure. Worth fixing when finding 4 is done, in the same pass. (One caveat: `emptyStateSubtitle`'s `text-gray-500` on `bg-gray-800` is roughly 3:1, but that element is currently unreachable per finding 1 — fix it whenever the empty state is restored.)

### 7. No test coverage

There is no `*.test.tsx` anywhere under `src/components/prompt-composer/`. The behaviours worth pinning are specific rather than blanket-coverage: radio-group exclusivity in `toggleComponent` (`:57-65`), the section-ordering contract in the `compiledPrompt` `useMemo` (`:105-153`), and — once finding 1 is fixed — a regression test asserting a manual edit survives a selection change. Semantic queries (`getByRole('textbox')`) would also have caught finding 3 for free.

### 8. Documentation drift

Two provably-false statements were corrected in this pass: the Types section listed a `Viewport` interface that `types.ts` does not export, and Component Categories listed five Context Provision entries including a "Best Practices" item that has never existed in `COMPONENT_ARRAY` (`constants.ts:185-224` defines four). One claim is left standing as a known-false marker: "Theme Support: Full dark/light mode compatibility" under Key Features is contradicted by findings 2, 4, and 6 — delete or qualify it once those land. Worth a periodic pass reconciling this file against the actual exports.

### Minor / cosmetic

- **Dead style keys.** Unreferenced in `PromptComposer.tsx`: `componentItem`, `componentCheckbox`, `componentRadio`, `componentTextContainer`, `componentTitle`, `componentSubtitle` (`constants.ts:33-47`), `clearButton`, `copyButton` (`:53-56`), `previewContent`/`previewSection`/`previewCategoryHeader`/`previewComponentText` (`:60-63`), the whole `cost*` block (`:70-79`), `analysisSection`/`analysisContent`/`analysisHighlight` (`:83-85`), and `tw.mainContainer`/`tw.flexLayout` (`:94-95`). Three of them are malformed anyway — `'roundedflex-shrink-0'` (`:36`) and `'px-2py-2'` (`:54`, `:55`) are not real Tailwind classes, which is good evidence the block has not been touched in a while. Delete rather than wire up, excluding the `tw.*` keys covered by finding 4.
- **Stats count via a truthiness accident, not a bug.** `statistics` (`:216-226`) adds `+ 1` unconditionally and treats `audience` as always-selected because `audienceToggle` is a non-empty string in both states. The _numbers are right_ — the compiled prompt genuinely always contains one audience sentence — but the code states that invariant by accident. Replace the truthy check with an explicit constant or comment; do not "fix" the counts.
- **`inputType: 'toggle'` is unused.** `types.ts:19` allows it, but no `COMPONENT_ARRAY` entry uses it and the audience control is special-cased in JSX instead (`:304-337`). That special-casing is the underlying reason `getCategoryIndicator` (`:174-178`) and the stats above need audience branches at all. Either make audience data-driven or drop the union member.
- **Timers are not cleaned up.** The 1500ms `setTimeout`s at `:88` and `:101` are never cleared on unmount.

Two items from an earlier draft of this list — client-side persistence / shareable-URL state, and a token-budget estimate alongside the word count — were feature requests rather than defects and duplicated entries in the section below. See Future Enhancements.

## Future Enhancements

Potential areas for expansion based on emerging research:

1. Component combination suggestions based on effectiveness data
2. Save/load prompt templates — including `localStorage` persistence so selections survive a refresh, and encoding `selectedComponents` + `audienceToggle` into a shareable URL
3. Prompt effectiveness scoring
4. Export to various formats
5. Integration with LLM APIs for testing
6. A/B testing of prompt variations
7. Rough token-budget estimate next to the existing word count, to signal how the compiled prompt sits against typical context-window limits

## Performance Optimizations

### Dynamic Import & Code Splitting

The Prompt Composer is loaded using Next.js `dynamic()` import with SSR disabled to optimize initial page load. See `src/pages/demos/prompt-composer.tsx` for the implementation, which includes a loading skeleton to reduce server bundle size.

**Benefits**:

- **Reduced initial bundle size**: Component code only loads when navigating to `/demos/prompt-composer`
- **Improved FCP (First Contentful Paint)**: Other pages don't include this component's JavaScript
- **Better LCP (Largest Contentful Paint)**: Loading skeleton provides immediate visual feedback
- **Code splitting**: Next.js automatically creates a separate chunk for this component

**Performance Impact**:

- Initial page load: ~40KB JavaScript removed from main bundle
- Route-specific loading: Component loads only when needed (~200ms on fast connections)
- Server rendering: Disabled to reduce server-side processing time

### Bundle Size Optimization

**Removed Large Documentation Comments**:

- Moved 240+ lines of inline documentation to this README
- Reduces JavaScript parse time and bundle size
- Documentation remains accessible but doesn't impact runtime performance

**Component Architecture**:

- Uses `useMemo` for expensive prompt compilation calculations
- State updates are batched and optimized
- Theme detection uses `next-themes` for efficient re-renders

### Loading States

The dynamic import includes a loading skeleton that matches the component's layout:

- Shows placeholder structure while component loads
- Prevents layout shift (CLS) when component renders
- Provides visual feedback during code splitting

## Maintenance Notes

- Component data is centralized in `constants.ts` for easy updates
- Color schemes can be modified in `utils/helpers.ts`
- New component categories can be added by extending the `PromptComponent` interface and updating the constants
- The component follows React best practices with hooks and memoization for performance
- **Performance**: Uses dynamic imports to avoid impacting other pages' bundle size
