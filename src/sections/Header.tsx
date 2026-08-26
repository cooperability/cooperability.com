'use client'
import { useState } from 'react'
import { Bars3Icon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import styles from '../styles/utils.module.css'
import Sidebar from './Sidebar'
import ThemeSwitch from '../components/ThemeSwitch'
import { useResponsive } from '../hooks/useResponsive'
import { usePathname, useRouter } from 'next/navigation'
import ActiveIcon from '../components/ActiveIcon'

const resumeUrl =
  'https://drive.google.com/file/d/1-mHF7SH3ym9QI8jKBtpKKzvbJM8L1Ovc/view?usp=sharing'
const allLinksUrl = '/resources/linktree'
const privacyStatementUrl = '/resources/PrivacyStatement'
const accessibilityStatementUrl = '/resources/AccessibilityStatement'

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isMobile } = useResponsive()
  const { push } = useRouter()
  // `usePathname` is already query-free, unlike the pages router's `asPath`.
  const currentPath = usePathname() || '/'
  const currentTab =
    currentPath === '/'
      ? '/'
      : currentPath.startsWith('/demos')
        ? '/demos'
        : currentPath.startsWith('/resources')
          ? '/resources'
          : '/'

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
          <Tabs
            value={currentTab}
            onValueChange={(v: string) => push(v)}
            className="w-full"
          >
            <TabsList aria-label="Primary navigation">
              <TabsTrigger value="/" onClick={() => push('/')}>
                Home
              </TabsTrigger>
              <TabsTrigger value="/demos" onClick={() => push('/demos')}>
                Demos
              </TabsTrigger>
              <TabsTrigger
                value="/resources"
                onClick={() => push('/resources')}
              >
                Resources
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
        <ActiveIcon
          href="/"
          imgSrc="/images/operamini.png"
          width={50}
          height={50}
          alt="Logo"
          external={false}
        />
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
