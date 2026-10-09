'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Bars3Icon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from '../styles/utils.module.css'
import Sidebar from './Sidebar'
import ThemeSwitch from '../components/ThemeSwitch'
import { useResponsive } from '../hooks/useResponsive'
import { usePathname } from 'next/navigation'
import ActiveIcon from '../components/ActiveIcon'

const resumeUrl =
  'https://drive.google.com/file/d/1-mHF7SH3ym9QI8jKBtpKKzvbJM8L1Ovc/view?usp=sharing'
const allLinksUrl = '/resources/linktree'
const privacyStatementUrl = '/resources/PrivacyStatement'
const accessibilityStatementUrl = '/resources/AccessibilityStatement'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/demos', label: 'Demos' },
  { href: '/resources', label: 'Resources' },
]

const NavLink = ({
  href,
  current,
  children,
}: {
  href: string
  current?: 'page' | 'true'
  children: React.ReactNode
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={href}
      aria-current={current}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50',
        // Opts out of the global blue link color and hover underline, which
        // would double the animated underline below.
        'text-inherit no-underline',
        // Inverted colors: white bg in dark mode, dark bg in light mode
        current
          ? 'bg-black text-white shadow-xs dark:bg-white dark:text-black'
          : 'hover:bg-accent/50 hover:text-accent-foreground'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={styles.linkTextWrapper}>
        {children}
        <span
          className={cn(
            styles.animatedUnderline,
            isHovered && styles.animatedUnderlineHover
          )}
        />
      </span>
    </Link>
  )
}

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isMobile } = useResponsive()
  // `usePathname` is already query-free, unlike the pages router's `asPath`.
  const currentPath = usePathname() || '/'
  // `page` marks the route itself, `true` its section from a subpage.
  const ariaCurrent = (href: string) =>
    currentPath === href
      ? 'page'
      : currentPath.startsWith(`${href}/`)
        ? 'true'
        : undefined

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
          <ul className="inline-flex h-9 items-center justify-center rounded-xl border p-1 text-muted-foreground">
            {navLinks.map(({ href, label }) => (
              <li key={href} className="flex">
                <NavLink href={href} current={ariaCurrent(href)}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
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
