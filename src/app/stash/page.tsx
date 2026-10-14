import type { Metadata } from 'next'
import { getAllStashData, StashData } from '../../lib/stash'
import styles from '../../styles/utils.module.css'
import StashList from './stash-list'

export const metadata: Metadata = {
  title: 'Stash',
  description:
    "Cooper Reed's (Co-Operability) stash of published work, recommendations and links.",
  openGraph: { title: 'Stash | Cooper Reed | Co-Operability' },
}

const statementSlugsToExclude = [
  'PrivacyStatement',
  'AccessibilityStatement',
  'PriorInventions',
]

export default function Stash() {
  const displayedPosts = getAllStashData()
    .filter((post) => !statementSlugsToExclude.includes(post.id))
    .sort((a: StashData, b: StashData) => {
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
      <h1 className="visually-hidden">Stash</h1>
      <section className={`${styles.headingMd} ${styles.padding1px}`}>
        <StashList posts={displayedPosts} />
      </section>
    </>
  )
}
