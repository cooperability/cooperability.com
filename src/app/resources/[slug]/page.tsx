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
import { getAllResourcesData, getResourceBySlug } from '../../../lib/resources'
import utilStyles from '../../../styles/utils.module.css'

// The pages-router equivalent was `fallback: false`. Without this, App Router
// would render unknown slugs on demand and a missing file would 500 rather
// than 404.
export const dynamicParams = false

// Opt-in per resource with `structured: true` in the front matter. Tailwind's
// reset strips heading size, list bullets and paragraph spacing, so a page
// with sections reads as one block without these. The linktree relies on the
// reset's tight paragraphs, so it stays opted out.
const structuredComponents = {
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="mt-8 mb-2 text-2xl font-bold" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="mt-5 mb-1 text-xl font-semibold" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="my-3" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="my-3 list-disc space-y-2 pl-6" {...props} />
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
  return getAllResourcesData().map(({ id }) => ({ slug: id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const resource = getResourceBySlug(slug)
  if (!resource) return {}

  return {
    title: resource.frontMatter.title,
    description: resource.frontMatter.description,
    // Not inferred from `title` — without this the share card would show the
    // root layout's site title instead of the resource's.
    openGraph: {
      title: `${resource.frontMatter.title} | Cooper Reed | Co-Operability`,
      description: resource.frontMatter.description,
    },
  }
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const resource = getResourceBySlug(slug)
  if (!resource) notFound()

  const { content, frontMatter } = resource

  return (
    <article>
      <h1 className={utilStyles.headingXl}>{frontMatter.title}</h1>
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
