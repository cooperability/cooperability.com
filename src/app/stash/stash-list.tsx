'use client'

import DateDisplay from '../../components/date'
import StashIcon from '../../components/StashIcon'
import { useResponsive } from '../../hooks/useResponsive'
import type { StashData } from '../../lib/stash'
import styles from '../../styles/utils.module.css'

// Client-only because the row layout is driven by `useResponsive`, not CSS.
// The list data itself is computed on the server and passed in.
export default function StashList({ posts }: { posts: StashData[] }) {
  const { isMobile } = useResponsive()

  return (
    <ul className={styles.list}>
      {posts.map(({ id, date, title, icon }: StashData) => (
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
            href={`/stash/${id}`}
            style={
              !isMobile
                ? { marginRight: '1rem' }
                : { display: 'block', marginBottom: '0.25rem' }
            }
          >
            <StashIcon name={icon} />
            {title}
          </a>
          {date && (
            <div>
              <small className={styles.lightText}>
                Last updated <DateDisplay dateString={date} />
              </small>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
