'use client'
import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, FlaskConical, House, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from '../styles/utils.module.css'
import ThemeSwitch from '../components/ThemeSwitch'
import { usePathname } from 'next/navigation'
import ActiveIcon from '../components/ActiveIcon'

const navLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Home', icon: House },
  { href: '/demos', label: 'Demos', icon: FlaskConical },
  { href: '/resources', label: 'Resources', icon: BookOpen },
]

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
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {/* Icon only below 34rem, where the words no longer fit beside the logo
          and theme switch. Hidden visually but not from screen readers, which
          still need the link's name. */}
      <span className="sr-only min-[34rem]:not-sr-only min-[34rem]:ml-1.5">
        <span className={styles.linkTextWrapper}>
          {children}
          <span
            className={cn(
              styles.animatedUnderline,
              isHovered && styles.animatedUnderlineHover
            )}
          />
        </span>
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
    <div>
      <div className={styles.Header}>
        <ActiveIcon
          href="/"
          imgSrc="/images/operamini.png"
          width={50}
          height={50}
          alt="Logo"
          external={false}
        />
        <nav className={styles.navbar} aria-label="Main navigation">
          <div className="flex flex-row space-between">
            <ul className="inline-flex h-9 items-center justify-center rounded-xl border p-1 text-muted-foreground">
              {navLinks.map(({ href, label, icon }) => (
                <li key={href} className="flex">
                  <NavLink href={href} icon={icon} current={ariaCurrent(href)}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <ThemeSwitch />
      </div>
      <div className={styles.horizLine} />
    </div>
  )
}

export default Header
