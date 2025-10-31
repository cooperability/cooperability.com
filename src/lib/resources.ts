import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const RESOURCES_PATH = path.join(process.cwd(), 'src/resources')

export interface ResourceData {
  id: string
  date?: string
  title: string
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
