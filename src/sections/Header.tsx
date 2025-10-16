'use client'
import { useState } from 'react'
import { Bars3Icon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import styles from '../styles/utils.module.css'
import Sidebar from './Sidebar'
import ActiveLink from '../components/activeLink'
import ThemeSwitch from '../components/ThemeSwitch'
import { useResponsive } from '../hooks/useResponsive'
import Image from 'next/image'
import Link from 'next/link'

const resumeUrl =
  'https://drive.google.com/file/d/1-mHF7SH3ym9QI8jKBtpKKzvbJM8L1Ovc/view?usp=sharing'
const allLinksUrl = '/resources/linktree'
const privacyStatementUrl = '/resources/PrivacyStatement'
const accessibilityStatementUrl = '/resources/AccessibilityStatement'

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isMobile } = useResponsive()

  const navigator = () => {
    if (isMobile) {
      return (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Open menu"
          className="border"
        >
          <Bars3Icon className="h-6 w-6" />
        </Button>
      )
    } else {
      return (
        <div className="flex flex-row space-between">
          <ActiveLink
            className={styles.navLink}
            href="/"
            activeClassName={styles.boldLink}
          >
            | Home |
          </ActiveLink>
          <ActiveLink
            className={styles.navLink}
            href="/demos"
            activeClassName={styles.boldLink}
          >
            | Demos |
          </ActiveLink>
          <ActiveLink
            className={styles.navLink}
            href="/resources"
            activeClassName={styles.boldLink}
          >
            | Resources |
          </ActiveLink>
        </div>
      )
    }
  }

  const renderThemeChanger = () => {
    return <ThemeSwitch />
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div suppressHydrationWarning>
      <div className={styles.Header} suppressHydrationWarning>
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          resumeUrl={isMobile ? resumeUrl : undefined}
          allLinksUrl={isMobile ? allLinksUrl : undefined}
          privacyStatementUrl={isMobile ? privacyStatementUrl : undefined}
          accessibilityStatementUrl={
            isMobile ? accessibilityStatementUrl : undefined
          }
        />
        <Link href="/">
          <Image
            src="/images/operamini.png"
            alt="Logo"
            height={50}
            width={50}
          />
        </Link>
        {isMobile ? (
          <>
            <div className="flex flex-row gap-3">
              {renderThemeChanger()}
              <nav
                className={styles.navbar}
                aria-label="Main navigation"
                suppressHydrationWarning
              >
                {navigator()}
              </nav>
            </div>
          </>
        ) : (
          <>
            <nav
              className={styles.navbar}
              aria-label="Main navigation"
              suppressHydrationWarning
            >
              {navigator()}
            </nav>
            {renderThemeChanger()}
          </>
        )}
      </div>
      <div className={styles.horizLine} />
    </div>
  )
}

export default Header
