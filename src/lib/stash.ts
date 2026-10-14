import fs from 'fs'
import path from 'path'
import { cache } from 'react'
import matter from 'gray-matter'
import { RESUME_URL } from './links'

const STASH_PATH = path.join(process.cwd(), 'src/stash')

// Content files only. `readdirSync` also hands back directories and strays like
// .DS_Store, and every one of them used to reach `readFileSync` below.
const CONTENT_FILE = /\.mdx?$/

export interface StashData {
  id: string
  date?: string
  title: string
  icon?: string
}

export interface StashFrontMatter {
  title: string
  date?: string
  description?: string
  icon?: string
  [key: string]: unknown
}

export interface StashEntry {
  content: string
  frontMatter: StashFrontMatter
}

function stashFileNames(): string[] {
  return fs
    .readdirSync(STASH_PATH)
    .filter((fileName) => CONTENT_FILE.test(fileName))
}

export function getAllStashData(): StashData[] {
  const allStashData = stashFileNames().map((fileName) => {
    const fullPath = path.join(STASH_PATH, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    // Use gray-matter to parse the post metadata section
    const { data } = matter(fileContents)

    // Remove ".mdx" or ".md" from file name to get id
    const id = fileName.replace(CONTENT_FILE, '')

    // Combine the data with the id
    return {
      id,
      ...(data as { date?: string; title: string; icon?: string }),
    }
  })

  //sorting will be handled in the component
  return allStashData
}

/**
 * `cache` dedupes the read between `generateMetadata` and the page component,
 * which App Router invokes separately for the same request.
 */
export const getStashBySlug = cache((slug: string): StashEntry | null => {
  // Resolve the slug back to a real file name rather than assuming `.mdx`. A
  // `.md` entry enumerated fine and then threw ENOENT here. Matching against
  // the enumerated names is also what keeps a raw param out of path.join, which
  // is the traversal guard.
  const fileName = stashFileNames().find(
    (name) => name.replace(CONTENT_FILE, '') === slug
  )

  if (!fileName) {
    return null
  }

  const fileContents = fs.readFileSync(path.join(STASH_PATH, fileName), 'utf8')
  const { content, data } = matter(fileContents)

  return {
    content: content.replaceAll('RESUME_URL', RESUME_URL),
    frontMatter: data as StashFrontMatter,
  }
})
