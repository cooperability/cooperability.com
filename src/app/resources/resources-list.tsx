'use client'

import DateDisplay from '../../components/date'
import { useResponsive } from '../../hooks/useResponsive'
import type { ResourceData } from '../../lib/resources'
import styles from '../../styles/utils.module.css'

// Client-only because the row layout is driven by `useResponsive`, not CSS.
// The list data itself is computed on the server and passed in.
export default function ResourcesList({ posts }: { posts: ResourceData[] }) {
  const { isMobile } = useResponsive()

  return (
    <ul className={styles.list}>
      {posts.map(({ id, date, title }: ResourceData) => (
        <li
          key={id}
          className={styles.listItem}
          style={
            !isMobile
              ? {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }
              : {}
          }
        >
          <a
            href={`/resources/${id}`}
            style={
              !isMobile
                ? { marginRight: '1rem' }
                : { display: 'block', marginBottom: '0.25rem' }
            }
          >
            {title}
          </a>
          {date && (
            <div>
              <small className={styles.lightText}>
                <DateDisplay dateString={date} />
              </small>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
