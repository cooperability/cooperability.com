import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import DateDisplay from '../../../components/date'
import StashIcon from '../../../components/StashIcon'
import { getAllStashData, getStashBySlug } from '../../../lib/stash'
import utilStyles from '../../../styles/utils.module.css'

// The pages-router equivalent was `fallback: false`. Without this, App Router
// would render unknown slugs on demand and a missing file would 500 rather
// than 404.
export const dynamicParams = false

// Opt-in per entry with `structured: true` in the front matter. Tailwind's
// reset strips heading size, list bullets and paragraph spacing, so a page
// with sections reads as one block without these. The linktree relies on the
// reset's tight paragraphs, so it stays opted out.
//
// Headings inside an accordion step down to the dropdown's text-sm scale, or
// a prompt's `##` would outsize the trigger it sits under.
const structuredComponents = {
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1
      className="mt-6 mb-2 border-b pb-1 text-lg font-bold first:mt-0"
      {...props}
    />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2
      className="mt-8 mb-2 text-2xl font-bold in-data-[slot=accordion-content]:mt-5 in-data-[slot=accordion-content]:text-base in-data-[slot=accordion-content]:font-semibold"
      {...props}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3
      className="mt-5 mb-1 text-xl font-semibold in-data-[slot=accordion-content]:mt-4 in-data-[slot=accordion-content]:text-sm"
      {...props}
    />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="my-3 first:mt-0 last:mb-0" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul
      className="my-3 list-disc space-y-2 pl-6 marker:text-gray-500 first:mt-0 last:mb-0 in-[li]:my-2 in-[li]:list-[circle]"
      {...props}
    />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol
      className="my-3 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-gray-500 first:mt-0 last:mb-0 in-[li]:my-2"
      {...props}
    />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className="pl-1" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code
      className="rounded bg-gray-100 px-1 py-0.5 text-[0.9em] dark:bg-gray-800"
      {...props}
    />
  ),
  // An example outline keeps its long lines unwrapped, so it scrolls instead
  // of being clipped by the accordion's overflow-hidden. A scroll region has
  // to be focusable to be scrollable from the keyboard.
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <pre
      role="region"
      aria-label="Example"
      tabIndex={0}
      className="my-3 overflow-x-auto rounded-md bg-gray-100 p-3 leading-snug first:mt-0 last:mb-0 dark:bg-gray-800 [&_code]:p-0"
      {...props}
    />
  ),
}

// MDX has no module scope of its own, so anything the content references has
// to be handed in explicitly. RSC has no Context, so MDXProvider is out.
const components = {
  Link,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
}

export function generateStaticParams() {
  return getAllStashData().map(({ id }) => ({ slug: id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = getStashBySlug(slug)
  if (!entry) return {}

  return {
    title: entry.frontMatter.title,
    description: entry.frontMatter.description,
    // Not inferred from `title` — without this the share card would show the
    // root layout's site title instead of the entry's.
    openGraph: {
      title: `${entry.frontMatter.title} | Cooper Reed | Co-Operability`,
      description: entry.frontMatter.description,
    },
  }
}

export default async function StashEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getStashBySlug(slug)
  if (!entry) notFound()

  const { content, frontMatter } = entry

  return (
    <article>
      <h1 className={utilStyles.headingXl}>
        <StashIcon name={frontMatter.icon} />
        {frontMatter.title}
      </h1>
      {frontMatter.date && (
        <div className={utilStyles.lightText}>
          Last updated <DateDisplay dateString={frontMatter.date} />
        </div>
      )}
      <MDXRemote
        source={content}
        components={
          frontMatter.structured
            ? { ...components, ...structuredComponents }
            : components
        }
        options={{ mdxOptions: { remarkPlugins: [], rehypePlugins: [] } }}
      />
    </article>
  )
}
