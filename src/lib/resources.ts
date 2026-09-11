import fs from 'fs'
import path from 'path'
import { cache } from 'react'
import matter from 'gray-matter'

const RESOURCES_PATH = path.join(process.cwd(), 'src/resources')

// Content files only. `readdirSync` also hands back directories and strays like
// .DS_Store, and every one of them used to reach `readFileSync` below.
const CONTENT_FILE = /\.mdx?$/

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

function resourceFileNames(): string[] {
  return fs
    .readdirSync(RESOURCES_PATH)
    .filter((fileName) => CONTENT_FILE.test(fileName))
}

export function getAllResourcesData(): ResourceData[] {
  const allResourcesData = resourceFileNames().map((fileName) => {
    const fullPath = path.join(RESOURCES_PATH, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    // Use gray-matter to parse the post metadata section
    const { data } = matter(fileContents)

    // Remove ".mdx" or ".md" from file name to get id
    const id = fileName.replace(CONTENT_FILE, '')

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
  // Resolve the slug back to a real file name rather than assuming `.mdx`. A
  // `.md` resource enumerated fine and then threw ENOENT here. Matching against
  // the enumerated names is also what keeps a raw param out of path.join, which
  // is the traversal guard.
  const fileName = resourceFileNames().find(
    (name) => name.replace(CONTENT_FILE, '') === slug
  )

  if (!fileName) {
    return null
  }

  const fileContents = fs.readFileSync(
    path.join(RESOURCES_PATH, fileName),
    'utf8'
  )
  const { content, data } = matter(fileContents)

  return { content, frontMatter: data as ResourceFrontMatter }
})
