import Link from 'next/link'
import ActiveIcon from '../components/ActiveIcon'
import { useResponsive } from '../hooks/useResponsive'
import styles from '../styles/utils.module.css'

const Footer = () => {
  const { isMobile } = useResponsive()

  return (
    <footer className="text-lg leading-normal">
      <section className="space-y-2">
        <div className={styles.horizLine} />

        {/* Desktop Layout: Side-by-side social icons + vertical links column */}
        {!isMobile ? (
          <div className="flex flex-col gap-1">
            {/* Social Icons Row */}
            <div className="flex flex-row flex-wrap justify-between">
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

            {/* Footer Links Column */}
            <nav
              className="flex justify-center items-center gap-8"
              aria-label="Footer navigation"
            >
              <a
                href="https://drive.google.com/file/d/1-mHF7SH3ym9QI8jKBtpKKzvbJM8L1Ovc/view?usp=sharing"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                target="_blank"
                rel="noopener noreferrer"
              >
                Resume
              </a>
              <Link
                href="/resources/linktree"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Linktree
              </Link>
              <Link
                href="/resources/PrivacyStatement"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Privacy
              </Link>
              <Link
                href="/resources/AccessibilityStatement"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Accessibility
              </Link>
            </nav>
          </div>
        ) : (
          /* Mobile Layout: Only centered social icons */
          <div className="flex justify-center">
            <div className="flex flex-row flex-wrap justify-center gap-4">
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
          </div>
        )}

        {/* Copyright - Always visible */}
        <div className="flex justify-center text-center">
          Cooper Reed &copy; {new Date().getFullYear()}
        </div>
      </section>
    </footer>
  )
}

export default Footer
