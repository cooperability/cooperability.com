import { buildLlmsTxt } from '@/src/lib/llms'

// Rendered once at build from the same MDX the site serves, so it cannot drift.
export const dynamic = 'force-static'

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // These restate content that already has canonical pages. Indexed,
      // they would compete with those pages as duplicates.
      'X-Robots-Tag': 'noindex',
    },
  })
}
