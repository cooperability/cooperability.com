# Prompt Composer v2

Builds a prompt from the components current evidence says matter, checks it as
you type for free, and on request asks Claude to review it and draft a rewrite.

The route behind the review, and its budget, off switch and threat model, is
documented in [docs/AI-Review.md](../../../docs/AI-Review.md).

## Files

```
prompt-composer/
├── PromptComposer.tsx     Orchestrator: state, persistence, layout
├── catalog.ts             Sections, free-text fields, options (pure data; the server imports it)
├── compile.ts             State → prompt text, in evidence-backed order
├── lint.ts                The live check: six-dimension rubric + anti-pattern warnings
├── review.ts              Validates model output into a render-safe view; overall score
├── partial-json.ts        Reads the review's JSON while it is still streaming
├── useCritique.ts         Availability probe, streaming POST, cancel, session cache
├── ComponentSelector.tsx  The accordion of sections
├── CompiledPrompt.tsx     Editable output, copy/clear/discard, stats
├── LiveCheck.tsx          Renders lint results with one-click fixes
├── AiReview.tsx           Renders the streamed review
├── ResearchNotes.tsx      The "why" appendix and references
└── labels.ts              Shared dimension names
```

Shared with the server: `src/lib/ai/review-schema.ts` (the review's JSON schema,
its dimensions, and the 8,000-character prompt limit).

## What changed from v1, and why

**Personas are gone.** v1 opened with a mutually exclusive persona picker
("Subject Matter Expert", "Critical Analyst", …). Controlled studies find
personas do not reliably improve accuracy:

- Zheng et al. tested 162 roles across four model families and found no gain on
  factual questions (EMNLP Findings 2024).
- Wharton's Prompting Science Report 4 found matched expert personas had no
  significant effect on GPQA and MMLU-Pro, while mismatched and low-knowledge
  personas could hurt (2025).

What a persona legitimately did, set tone and depth, is now done by describing
the **reader** (the audience radio) instead of the **writer**.

**The prompt now has content slots.** v1 composed only generic boilerplate; it
had nowhere to put the task. v2's free-text fields (Task, Background and
purpose, Input material, Examples, Requirements) are where the value is, per
Anthropic's current guidance: be explicit, explain why, delimit data, show
examples.

**Reasoning is a model setting now.** Chain-of-thought instructions mattered
for models that did not reason on their own. Wharton's Prompting Science Report
2 found they add little on reasoning models and cost time. "Think first" is one
optional line, labelled for non-reasoning models. The weight moved to quality
safeguards: grounding in the input, permission to say "I don't know", flagged
confidence, and a final self-check.

### Sections

| Section             | Kind                          | Contents                                                                                        |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Task                | field                         | The instruction                                                                                 |
| Context & audience  | field + radio                 | Background and purpose; reader: general, practitioner, expert, or "let the model decide"        |
| Input material      | field                         | Wrapped in `<input>`                                                                            |
| Examples            | field                         | Split on `---` lines, each in `<example>` inside `<examples>`                                   |
| Output              | field + 2 radios + checkboxes | Requirements; format; length; answer first, next steps, plain language                          |
| Reasoning & quality | checkboxes                    | Ground in input, permission to not know, flag confidence, think first, alternatives, self-check |
| Interaction         | checkboxes                    | Clarify then answer, suggest prompt fixes                                                       |

Every radio group has "Let the model decide", because leaving format or length
open is often the right call, and v1 had no way back to unset.

### Compile order

Context, then `<input>`, then `<examples>`, then the task, then requirements and
output options as a bullet list, then quality, then interaction. Material goes
first and the query last: Anthropic measured up to 30% better responses that
way on long inputs, and models use the start and end of a context better than
its middle (Liu et al., TACL 2024). An untouched composer compiles to the empty
string, so nothing boilerplate is ever copied by accident.

## Two graders, one rubric

Both score the same six dimensions: task, context, input, examples, output,
quality.

**Live check** (`lint.ts`): free, instant, runs on every keystroke. It sees the
composer's structure, so it can tell that the task names "the attached report"
but Input is empty, and offer a one-click fix that opens and focuses the field.
It also reads the final text for patterns current guidance says to drop:
personas, emphatic capitals, piles of prohibitions, scripted step-by-step
reasoning.

**AI review** (`useCritique.ts`, `AiReview.tsx`): on demand, metered. It reads
the prompt itself and streams back a scorecard, a top fix, up to three
suggested components (one click adds them), and a rewrite (one click uses it).
Other behaviour:

- It shows the score change since the previous review.
- A repeat review of identical text is served from a session cache at no cost.
- It flags when the prompt has changed since the review.
- It says plainly when review is off or over budget, instead of failing.

The review arrives as structured JSON streamed over NDJSON. `partial-json.ts`
parses each prefix so the scorecard fills in live, and `review.ts` treats the
result as untrusted: only known keys and types survive, scores are clamped, and
suggestions are limited to catalog ids.

## State

- `fields` and `selected` drive `compilePrompt`.
- Hand edits to the compiled prompt live in `override`. While set, they win,
  and component changes recompile underneath without touching them. "Discard
  edits" returns to the compiled text.
- Everything persists to `localStorage` under `prompt-composer:v2`, and loading
  ignores anything malformed. Clear wipes it.

## v1 findings, resolved

The improvement list this file used to carry, and how each item closed:

1. **Hand edits destroyed on toggle; Clear didn't clear; empty state
   unreachable.** Closed by the `override` model and the empty default.
2. **Category headers unreadable in the default theme.** Closed: colour is a
   left accent stripe that needs no theme branching. The accordion handles
   light and dark itself.
3. **Unlabelled textarea.** Every field is labelled, the compiled prompt via
   `aria-labelledby`.
4. **Subtitle without dark variant.** The header uses themed classes.
5. **Visual-only feedback; silent clipboard failure.** A `role="status"` region
   announces copy and clear, and copy failure shows an alert.
6. **Hard-coded dark preview.** Fields and preview follow the theme.
7. **No tests.** Covered now:
   - `src/__tests__/components/prompt-composer-logic.test.ts`: catalog,
     compile, lint, partial JSON, review validation.
   - `src/__tests__/components/prompt-composer.test.tsx`: the component,
     including hand-edit survival, persistence, fixes and the streamed review.
8. **Documentation drift.** This file was rewritten against the code.

Also closed: the dead style keys and malformed classes went with `constants.ts`,
`inputType: 'toggle'` went with `types.ts`, and both timers are cleared on
unmount.

## Performance

The route page loads the composer with `next/dynamic` and `ssr: false`
(`src/app/demos/prompt-composer/prompt-composer-client.tsx`), so none of it
ships to other pages. The AI review adds no client dependency: streaming,
parsing and validation are plain TypeScript.
