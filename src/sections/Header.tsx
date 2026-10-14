'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Backpack, FlaskConical, House, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_LINKS, type NavPath } from '../lib/nav'
import styles from '../styles/utils.module.css'
import ThemeSwitch from '../components/ThemeSwitch'
import { usePathname } from 'next/navigation'
import ActiveIcon from '../components/ActiveIcon'

const NAV_ICONS: Record<NavPath, LucideIcon> = {
  '/': House,
  '/demos': FlaskConical,
  '/stash': Backpack,
}

const NavLink = ({
  href,
  icon: Icon,
  current,
  children,
}: {
  href: string
  icon: LucideIcon
  current?: 'page' | 'true'
  children: React.ReactNode
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={href}
      aria-current={current}
      className={cn(
        'flex h-full w-full min-w-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-lg px-1 text-xs font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50 @min-[260px]:text-sm',
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
      {/* The underline runs under the icon and, when it is drawn, the name,
          so it shows on every link in the icon-only layouts too. The module's
          wrapper is inline-block, hence the important flex. */}
      <span className={cn(styles.linkTextWrapper, 'inline-flex! items-center')}>
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {/* Widths here are the selector's own, not the viewport's. With room for
            every name they all show. With room for one, only the current page
            keeps its name. Below that, icons alone. A name stays in the link as
            screen-reader text when it is not drawn. */}
        <span
          className={cn(
            'sr-only @min-[260px]:not-sr-only @min-[260px]:ml-1.5',
            current && '@min-[150px]:not-sr-only @min-[150px]:ml-1'
          )}
        >
          {children}
        </span>
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
  // `usePathname` is already query-free, unlike the pages router's `asPath`.
  const currentPath = usePathname() || '/'
  // `page` marks the route itself, `true` its section from a subpage.
  const ariaCurrent = (href: string) =>
    currentPath === href
      ? 'page'
      : currentPath.startsWith(`${href}/`)
        ? 'true'
        : undefined

  return (
    // Sticky, on the page's own background so content passes underneath. The
    // top padding and its matching negative margin leave the unscrolled layout
    // where it was. Below the game's z-50 shell, which covers the viewport.
    <div className="sticky top-0 z-40 -mt-2 bg-background pt-2 pb-px dark:bg-black">
      {/* Logo, selector and theme switch share one height, --hdr-h, which the
          .Header rule grows with the viewport. */}
      <div className={styles.Header}>
        <div className="flex-none [&_img]:size-[calc(var(--hdr-h)_+_5px)]">
          <ActiveIcon
            href="/"
            imgSrc="/images/operamini.png"
            width={50}
            height={50}
            alt="Logo"
            external={false}
          />
        </div>
        <nav
          className="min-w-0 max-w-[336px] flex-1"
          aria-label="Main navigation"
        >
          {/* Always the same size, whichever page is current. The outline and
              the other pages take the body's own text colour in each theme, as
              the rules below do: --foreground in light, gray-100 in dark. */}
          <ul className="@container flex h-(--hdr-h) w-full items-stretch rounded-xl border-2 border-foreground p-1 text-foreground dark:border-gray-100 dark:text-gray-100">
            {NAV_LINKS.map(({ href, label }) => {
              const current = ariaCurrent(href)
              return (
                <li
                  key={href}
                  className={cn(
                    'flex min-w-0 flex-[1_1_0] transition-[flex-grow] duration-200',
                    current &&
                      '@min-[150px]:flex-[2.1_1_0] @min-[260px]:flex-[1_1_0]'
                  )}
                >
                  <NavLink href={href} icon={NAV_ICONS[href]} current={current}>
                    {label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="flex-none w-[calc(var(--hdr-h)_*_2.5)]">
          <ThemeSwitch />
        </div>
      </div>
      <div className={styles.horizLine} />
    </div>
  )
}

export default Header
