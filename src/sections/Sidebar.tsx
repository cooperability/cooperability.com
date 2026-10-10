'use client'

import React, { useState } from 'react'
import styles from '../styles/utils.module.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useResolvedTheme } from '../hooks/useResolvedTheme'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  isOpen: boolean
  toggleSidebar: () => void
  allLinksUrl?: string
}

interface SidebarLinkProps {
  href: string
  children: React.ReactNode
  isActive: boolean
  onClick?: () => void
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  href,
  children,
  isActive,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  const content = (
    <div
      className={`${styles.sidebarLinkWrapper} ${isActive ? styles.sidebarLinkActive : ''}`}
      style={
        isActive
          ? ({
              '--sidebar-active-bg': 'var(--inverse-bg)',
              '--sidebar-active-text': 'var(--inverse-text)',
            } as React.CSSProperties)
          : {}
      }
    >
      {children}
      {/* Vertical slider appears on hover (only when not active) */}
      {isHovered && !isActive && (
        <div
          className={`${styles.verticalSlider} ${styles.verticalSliderHover}`}
        />
      )}
    </div>
  )

  const commonProps = {
    className: styles.navLink,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onClick: handleClick,
    style: {
      textDecoration: 'none',
      width: '100%',
      display: 'block',
    },
  }

  return (
    <Link href={href} {...commonProps}>
      {content}
    </Link>
  )
}

const Sidebar = ({ isOpen, toggleSidebar, allLinksUrl }: SidebarProps) => {
  const isDark = useResolvedTheme() === 'dark'
  const pathname = usePathname() || '/'

  const sidebarThemeClass = isDark ? styles.sidebarDark : styles.sidebarLight

  // Helper to check if a route is active
  const isRouteActive = (href: string) => {
    // For root, require exact match
    if (href === '/') {
      return pathname === href
    }
    // For /resources parent page, only match exactly (not sub-pages)
    if (href === '/resources') {
      return pathname === '/resources'
    }
    // For all other paths (like /resources/linktree), use startsWith
    return pathname.startsWith(href)
  }

  // Set inverse color CSS variables based on theme
  const inverseColors = isDark
    ? { '--inverse-bg': '#ffffff', '--inverse-text': '#000000' }
    : { '--inverse-bg': '#000000', '--inverse-text': '#ffffff' }

  return (
    <div
      className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${sidebarThemeClass}`}
      style={inverseColors as React.CSSProperties}
    >
      {isOpen && (
        <Button
          onClick={toggleSidebar}
          aria-label="Close menu"
          className="absolute top-4 right-3 border rounded-md p-1 bg-transparent"
        >
          <XMarkIcon className="h-5 w-5" />
        </Button>
      )}

      <nav className={styles.sidebarNav} aria-label="Sidebar navigation">
        <SidebarLink
          href="/"
          isActive={isRouteActive('/')}
          onClick={toggleSidebar}
        >
          | Home |
        </SidebarLink>
        <SidebarLink
          href="/demos"
          isActive={isRouteActive('/demos')}
          onClick={toggleSidebar}
        >
          | Demos |
        </SidebarLink>
        <SidebarLink
          href="/resources"
          isActive={isRouteActive('/resources')}
          onClick={toggleSidebar}
        >
          | Resources |
        </SidebarLink>

        <div className={styles.horizLine} />

        {allLinksUrl && (
          <SidebarLink
            href={allLinksUrl}
            isActive={isRouteActive(allLinksUrl)}
            onClick={toggleSidebar}
          >
            <span aria-hidden="true">🔗 </span>Linktree
          </SidebarLink>
        )}
      </nav>
    </div>
  )
}

export default Sidebar
