import DateDisplay from '../../components/date'
import StashIcon from '../../components/StashIcon'
import type { StashData } from '../../lib/stash'
import styles from '../../styles/utils.module.css'

// At 525px and below each title stacks above its date.
export default function StashList({ posts }: { posts: StashData[] }) {
  return (
    <ul className={styles.list}>
      {posts.map(({ id, date, title, icon }: StashData) => (
        <li
          key={id}
          className={`${styles.listItem} min-[526px]:flex min-[526px]:flex-wrap min-[526px]:items-center min-[526px]:justify-between`}
        >
          <a
            href={`/stash/${id}`}
            className="mb-1 block min-[526px]:mr-4 min-[526px]:mb-0"
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
