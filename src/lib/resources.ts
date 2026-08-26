import fs from 'fs'
import path from 'path'
import { cache } from 'react'
import matter from 'gray-matter'

const RESOURCES_PATH = path.join(process.cwd(), 'src/resources')

export interface ResourceData {
  id: string
  date?: string
  title: string
}

export interface ResourceFrontMatter {
  title: string
  date?: string
  description?: string
  [key: string]: unknown
}

export interface Resource {
  content: string
  frontMatter: ResourceFrontMatter
}

export function getAllResourcesData(): ResourceData[] {
  const fileNames = fs.readdirSync(RESOURCES_PATH)

  const allResourcesData = fileNames.map((fileName) => {
    const fullPath = path.join(RESOURCES_PATH, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    // Use gray-matter to parse the post metadata section
    const { data } = matter(fileContents)

    // Remove ".mdx" or ".md" from file name to get id
    const id = fileName.replace(/\.mdx?$/, '')

    // Combine the data with the id
    return {
      id,
      ...(data as { date?: string; title: string }),
    }
  })

  //sorting will be handled in the component
  return allResourcesData
}

/**
 * `cache` dedupes the read between `generateMetadata` and the page component,
 * which App Router invokes separately for the same request.
 */
export const getResourceBySlug = cache((slug: string): Resource | null => {
  // Only ever read a slug we already enumerated. A raw param reaching
  // path.join would otherwise be a traversal surface.
  if (!getAllResourcesData().some((resource) => resource.id === slug)) {
    return null
  }

  const fileContents = fs.readFileSync(
    path.join(RESOURCES_PATH, `${slug}.mdx`),
    'utf8'
  )
  const { content, data } = matter(fileContents)

  return { content, frontMatter: data as ResourceFrontMatter }
})
