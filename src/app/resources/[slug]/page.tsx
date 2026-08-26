import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
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
          <DateDisplay dateString={frontMatter.date} />
        </div>
      )}
      <MDXRemote
        source={content}
        components={components}
        options={{ mdxOptions: { remarkPlugins: [], rehypePlugins: [] } }}
      />
    </article>
  )
}
