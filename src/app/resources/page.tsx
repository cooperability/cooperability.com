import type { Metadata } from 'next'
import { getAllResourcesData, ResourceData } from '../../lib/resources'
import styles from '../../styles/utils.module.css'
import ResourcesList from './resources-list'

export const metadata: Metadata = {
  title: 'Resources',
  description: "Cooper Reed's (Co-Operability) published resources.",
  openGraph: { title: 'Resources | Cooper Reed | Co-Operability' },
}

const statementSlugsToExclude = [
  'PrivacyStatement',
  'AccessibilityStatement',
  'PriorInventions',
]

export default function Resources() {
  const displayedPosts = getAllResourcesData()
    .filter((post) => !statementSlugsToExclude.includes(post.id))
    .sort((a: ResourceData, b: ResourceData) => {
      // Posts without dates go to the end
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      // Sort by date descending (newest first)
      if (a.date < b.date) {
        return 1
      } else {
        return -1
      }
    })

  return (
    <>
      <h1 className="visually-hidden">Resources</h1>
      <section className={`${styles.headingMd} ${styles.padding1px}`}>
        <ResourcesList posts={displayedPosts} />
      </section>
    </>
  )
}
