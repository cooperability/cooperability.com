import { getAllResourcesData, getResourceBySlug } from './resources'

// Format: https://llmstxt.org
const SITE = 'https://www.cooperability.com'

// src/app/demos/page.tsx lists these as JSX with no data source to import, so
// src/__tests__/lib/llms.test.ts checks each entry against its page instead.
export const DEMOS = [
  {
    path: '/demos/prompt-composer',
    title: 'Prompt Composer',
    description:
      'A visual prompt building tool that demonstrates the modular nature of effective prompts for AI interactions.',
  },
  {
    path: '/demos/mandelbrot-explorer',
    title: 'Mandelbrot Explorer',
    description:
      'Interactive visualization of the Mandelbrot set fractal using the iterative equation z(n+1) = z(n)^2 + c',
  },
  {
    path: '/demos/opioid-converter',
    title: 'Opioid Converter',
    description:
      'Medical opioid dosage converter and morphine equivalence calculator',
  },
]

function sortedResources() {
  return getAllResourcesData().sort((a, b) => a.id.localeCompare(b.id))
}

// No current title or body needs these, but content is added by hand and a
// stray bracket or tag would otherwise break every entry after it.
const linkText = (text: string) => text.replace(/[\\[\]]/g, '\\$&')
const attribute = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
const blockBody = (text: string) =>
  text.replace(/<\/resource>/gi, '&lt;/resource>')

export function buildLlmsTxt(): string {
  const demos = DEMOS.map(
    (demo) =>
      `- [${linkText(demo.title)}](${SITE}${demo.path}): ${demo.description}`
  )
  const resources = sortedResources().map(
    (resource) =>
      `- [${linkText(resource.title)}](${SITE}/resources/${resource.id})`
  )

  return [
    '# Co-Operability',
    '',
    '> Portfolio of Cooper Reed, a full stack engineer: interactive demos and written resources.',
    '',
    `Full text of every resource: ${SITE}/llms-full.txt`,
    '',
    '## Demos',
    '',
    ...demos,
    '',
    '## Resources',
    '',
    ...resources,
    '',
  ].join('\n')
}

export function buildLlmsFullTxt(): string {
  // Resource bodies use every heading level themselves, so a heading cannot
  // mark where one resource ends. An explicit wrapper can.
  const sections = sortedResources().map((resource) => {
    const body = blockBody(getResourceBySlug(resource.id)?.content.trim() ?? '')
    return `<resource title="${attribute(resource.title)}" source="${SITE}/resources/${resource.id}">\n${body}\n</resource>\n`
  })

  return ['# Co-Operability: full resource text', '', ...sections].join('\n')
}
