import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface Reference {
  cite: string
  title: string
  venue: string
  url: string
}

const REFERENCES: Reference[] = [
  {
    cite: 'Zheng, M., Pei, J., Logeswaran, L., Lee, M., & Jurgens, D. (2024).',
    title:
      'When “A Helpful Assistant” Is Not Really Helpful: Personas in System Prompts Do Not Improve Performances of Large Language Models.',
    venue: 'Findings of EMNLP 2024.',
    url: 'https://arxiv.org/abs/2311.10054',
  },
  {
    cite: 'Basil, S., Shapiro, I., Shapiro, D., Mollick, E., Mollick, L., & Meincke, L. (2025).',
    title:
      'Prompting Science Report 4: Playing Pretend: Expert Personas Don’t Improve Factual Accuracy.',
    venue: 'Wharton Generative AI Labs.',
    url: 'https://arxiv.org/abs/2512.05858',
  },
  {
    cite: 'Meincke, L., Mollick, E., Mollick, L., & Shapiro, D. (2025).',
    title:
      'Prompting Science Report 2: The Decreasing Value of Chain of Thought in Prompting.',
    venue: 'Wharton Generative AI Labs.',
    url: 'https://arxiv.org/abs/2506.07142',
  },
  {
    cite: 'Anthropic. (2026).',
    title: 'Prompting best practices.',
    venue: 'Claude Platform documentation.',
    url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices',
  },
  {
    cite: 'Liu, N. F., Lin, K., Hewitt, J., Paranjape, A., Bevilacqua, M., Petroni, F., & Liang, P. (2024).',
    title: 'Lost in the Middle: How Language Models Use Long Contexts.',
    venue: 'Transactions of the ACL, 12, 157–173.',
    url: 'https://arxiv.org/abs/2307.03172',
  },
  {
    cite: 'Brown, T., Mann, B., Ryder, N., Subbiah, M., Kaplan, J. D., Dhariwal, P., … & Amodei, D. (2020).',
    title: 'Language models are few-shot learners.',
    venue: 'NeurIPS 33, 1877–1901.',
    url: 'https://arxiv.org/abs/2005.14165',
  },
  {
    cite: 'Min, S., Lyu, X., Holtzman, A., Artetxe, M., Lewis, M., Hajishirzi, H., & Zettlemoyer, L. (2022).',
    title:
      'Rethinking the role of demonstrations: What makes in-context learning work?',
    venue: 'EMNLP 2022, 11048–11064.',
    url: 'https://arxiv.org/abs/2202.12837',
  },
  {
    cite: 'Wei, J., Wang, X., Schuurmans, D., Bosma, M., Chi, E., Le, Q. V., … & Zhou, D. (2022).',
    title:
      'Chain-of-thought prompting elicits reasoning in large language models.',
    venue: 'NeurIPS 35, 24824–24837.',
    url: 'https://arxiv.org/abs/2201.11903',
  },
]

const heading = 'mb-2 font-semibold text-gray-900 dark:text-gray-100'

export default function ResearchNotes() {
  return (
    <Accordion type="single" collapsible className="w-full space-y-2">
      <AccordionItem value="research">
        <AccordionTrigger>🔬 Why v2 is built this way</AccordionTrigger>
        <AccordionContent className="space-y-4 leading-relaxed">
          <div>
            <h3 className={heading}>No personas</h3>
            <p>
              Version 1 opened with a persona picker: subject-matter expert,
              analyst, consultant. Controlled studies have since found that
              personas do not reliably improve accuracy. Across 162 roles and
              four model families, Zheng et al. found no gain on factual
              questions. Wharton’s 2025 report found matched expert personas had
              no significant effect on graduate-level benchmarks, and that
              mismatched or low-knowledge personas can hurt. A persona still
              shifts tone and vocabulary, which the audience setting now does
              directly, by describing the reader rather than the writer.
            </p>
          </div>
          <div>
            <h3 className={heading}>Context over costume</h3>
            <p>
              What does help is what version 1 had no slot for: the task itself,
              the reason behind it, the material to work from, and examples.
              Anthropic’s current guidance puts it as a golden rule: show your
              prompt to a colleague with no context, and if they would be
              confused, the model will be too. Reasons generalise better than
              rules, so the composer asks why before it asks for constraints.
            </p>
          </div>
          <div>
            <h3 className={heading}>Order and delimiters</h3>
            <p>
              The compiled prompt puts context and material first, each in its
              own XML tag so data cannot be mistaken for instructions, then
              examples, then the task, then how to answer. Models use the start
              and end of a long context better than its middle (Liu et al.), and
              Anthropic measured queries placed after long material at up to 30%
              better than queries placed before it.
            </p>
          </div>
          <div>
            <h3 className={heading}>Reasoning is now a model setting</h3>
            <p>
              Chain-of-thought prompting (Wei et al.) was a major result for
              models that did not reason on their own. Current reasoning models
              think before answering by default, and the Wharton team found
              explicit step-by-step instructions add little for them while
              costing time. So “think first” is one optional line, marked for
              non-reasoning models. The effort went into quality safeguards
              instead: grounding in the material, permission to say “I don’t
              know”, and a final self-check against the requirements.
            </p>
          </div>
          <div>
            <h3 className={heading}>Say what to do</h3>
            <p>
              Current models follow instructions closely, so emphatic capitals
              and long lists of prohibitions tend to over-steer them. The live
              check flags both, and every template in the catalog is phrased as
              an instruction to do something.
            </p>
          </div>
          <div>
            <h3 className={heading}>Two graders, one rubric</h3>
            <p>
              The live check is free and runs on every keystroke, but it can
              only see which boxes are filled. The AI review reads the prompt
              itself, on request, against the same six dimensions, and each
              review has a real per-call cost, which is why it waits for a
              click.
            </p>
          </div>
          <div className="border-t pt-4">
            <h3 className={heading}>References</h3>
            <ul className="space-y-2 text-xs">
              {REFERENCES.map((r) => (
                <li key={r.url}>
                  {r.cite} {r.title} <em>{r.venue}</em>{' '}
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                  >
                    {r.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="app-guide">
        <AccordionTrigger>
          📱 Install Prompt Composer as an app
        </AccordionTrigger>
        <AccordionContent className="leading-relaxed">
          <p>
            On iOS, open this page in Safari, tap Share, then{' '}
            <strong>Add to Home Screen</strong>. On Android, Chrome’s menu
            offers the same, though that path has not had QA yet.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
