import Date from '../components/date'
import Layout from '../components/layout'
import { GetStaticProps } from 'next'
import Head from 'next/head'
import { useResponsive } from '../hooks/useResponsive'
import styles from '../styles/utils.module.css'
import { getAllResourcesData, ResourceData } from '../lib/resources'

interface ResourcesProps {
  allPostsData: ResourceData[]
}

export default function Resources({ allPostsData }: ResourcesProps) {
  const statementSlugsToExclude = ['PrivacyStatement', 'AccessibilityStatement']

  const displayedPosts = allPostsData
    .filter((post) => !statementSlugsToExclude.includes(post.id))
    .sort((a, b) => {
      if (a.date < b.date) {
        return 1
      } else {
        return -1
      }
    })

  const { isMobile } = useResponsive()

  return (
    <Layout>
      <Head>
        <title>Resources | Cooper Reed | Co-Operability</title>
        <meta
          name="description"
          content="Cooper Reed's (Co-Operability) published resources."
        />
      </Head>
      <h1 className="visually-hidden">Resources</h1>
      <section className={`${styles.headingMd} ${styles.padding1px}`}>
        <ul className={styles.list}>
          {displayedPosts.map(({ id, date, title }: ResourceData) => (
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
              <div style={isMobile ? {} : {}}>
                <small className={styles.lightText}>
                  <Date dateString={date} />
                </small>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const allPostsData = getAllResourcesData()

  return {
    props: {
      allPostsData,
    },
  }
}
