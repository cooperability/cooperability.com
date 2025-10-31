import { GetStaticProps, GetStaticPaths } from 'next'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import Layout from '../../components/layout'
import Head from 'next/head'
import Date from '../../components/date'
import utilStyles from '../../styles/utils.module.css'
import Link from 'next/link'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../../../components/ui/accordion'

interface MdxFrontMatterData {
  title: string
  date?: string
  description?: string
  contentHtml?: string
  [key: string]: unknown // Allow other fields safely
}

type Props = {
  source: MDXRemoteSerializeResult
  frontMatter: MdxFrontMatterData
}

const components = {
  Link,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
}

export default function PostPage({ source, frontMatter }: Props) {
  return (
    <Layout>
      <Head>
        <title>{`${frontMatter.title} | Cooper Reed | Co-Operability`}</title>
        {frontMatter.description && (
          <meta name="description" content={frontMatter.description} />
        )}
      </Head>
      <article>
        <h1 className={utilStyles.headingXl}>{frontMatter.title}</h1>
        {frontMatter.date && (
          <div className={utilStyles.lightText}>
            <Date dateString={frontMatter.date} />
          </div>
        )}
        {source ? (
          <MDXRemote {...source} components={components} />
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: frontMatter.contentHtml ?? '' }}
          />
        )}
      </article>
    </Layout>
  )
}

const POSTS_PATH = path.join(process.cwd(), 'src/resources')

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = fs
    .readdirSync(POSTS_PATH)
    .map((path) => path.replace(/\.mdx?$/, ''))
    .map((slug) => ({ params: { slug } }))

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.slug) {
    throw new Error('Slug is required')
  }
  const postFilePath = path.join(POSTS_PATH, `${params.slug}.mdx`)
  const source = fs.readFileSync(postFilePath)

  const { content, data } = matter(source)

  let mdxSource = null
  if (postFilePath.endsWith('.mdx')) {
    mdxSource = await serialize(content, {
      mdxOptions: {
        remarkPlugins: [],
        rehypePlugins: [],
      },
      scope: data,
    })
  }

  return {
    props: {
      source: mdxSource,
      frontMatter: data,
    },
  }
}
