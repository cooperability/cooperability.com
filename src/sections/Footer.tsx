'use client'

import Link from 'next/link'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import ActiveIcon from '../components/ActiveIcon'
import styles from '../styles/utils.module.css'

const Footer = () => {
  return (
    <footer className="text-lg leading-normal">
      <section className="space-y-2">
        <div className={styles.horizLine} />

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
          {/* Square, unlike the round socials, to set it apart: it opens
              everything else, including Resume, Privacy and Accessibility. */}
          <Button
            asChild
            variant="outline"
            className="size-[50px] text-foreground"
          >
            <Link href="/resources/linktree" aria-label="More links">
              <EllipsisHorizontalIcon className="size-7" />
            </Link>
          </Button>
        </div>

        {/* Copyright - Always visible */}
        <div className="flex justify-center text-center">
          Cooper Reed &copy; {new Date().getFullYear()}
        </div>
      </section>
    </footer>
  )
}

export default Footer
