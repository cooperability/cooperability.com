import Link from 'next/link'
import styles from '../styles/utils.module.css'
import ActiveIcon from '../components/ActiveIcon'
import { useResponsive } from '../hooks/useResponsive'

const Footer = () => {
  const { isMobile } = useResponsive()

  return (
    <footer>
      <section className={styles.headingMd}>
        <div className={styles.horizLine} />

        {/* Social Icons */}
        <div
          className={styles.socialIconRow}
          style={{ marginBottom: '0.25rem' }}
        >
          <ActiveIcon
            href="https://www.linkedin.com/in/cooper-reed/"
            imgSrc="/images/linkedin.png"
            variant="social"
          />
          <ActiveIcon
            href="https://github.com/cooperability"
            imgSrc="/images/github.png"
            variant="social"
          />
          <ActiveIcon
            href="https://bsky.app/profile/cooperability.com"
            imgSrc="/images/bluesky.png"
            variant="social"
          />
          <ActiveIcon
            href="https://cooperability.substack.com/"
            imgSrc="/images/substack.png"
            variant="social"
          />
          <ActiveIcon
            href="https://www.youtube.com/@cooperability"
            imgSrc="/images/youtube.png"
            variant="social"
          />
        </div>

        {/* Footer Links - Desktop only */}
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2rem',
              marginBottom: '1rem',
            }}
          >
            <a
              href="https://drive.google.com/file/d/1-mHF7SH3ym9QI8jKBtpKKzvbJM8L1Ovc/view?usp=sharing"
              style={{
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              Resume
            </a>
            <Link
              href="/resources/linktree"
              style={{
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              All Links
            </Link>
            <Link
              href="/resources/PrivacyStatement"
              style={{
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              Privacy
            </Link>
            <Link
              href="/resources/AccessibilityStatement"
              style={{
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              Accessibility
            </Link>
          </div>
        )}

        {/* Copyright */}
        <div
          className={styles.footerText}
          style={{
            textAlign: 'center',
            marginTop: isMobile ? '1rem' : '0',
          }}
        >
          Cooper Reed &copy; {new Date().getFullYear()}
        </div>
      </section>
    </footer>
  )
}

export default Footer
