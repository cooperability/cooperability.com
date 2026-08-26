'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import styles from '../styles/utils.module.css'
import { useHydrated } from '../hooks/useHydrated'

export interface ActiveIconProps {
  href: string
  imgSrc?: string
  iconName?: string
  alt?: string
  variant?: 'default' | 'social'
  size?: 'default' | 'small'
  width?: number
  height?: number
  external?: boolean
}

const ActiveIcon: React.FC<ActiveIconProps> = ({
  href,
  imgSrc,
  iconName,
  alt,
  variant = 'default',
  size = 'default',
  width,
  height,
  external = true,
}) => {
  const { systemTheme, theme } = useTheme()
  const hydrated = useHydrated()

  // Determine the current theme
  const currentTheme = theme === 'system' ? systemTheme : theme

  // Construct the image source URL
  let imageSource = imgSrc
  if (iconName) {
    // Light is the pre-hydration default, so server and client markup agree.
    const themeParam = hydrated && currentTheme === 'dark' ? 'dark' : 'light'
    imageSource = `https://skillicons.dev/icons?i=${iconName}&theme=${themeParam}`
  }

  // Determine alt text
  const descriptiveAltText = alt
    ? alt
    : iconName
      ? `${iconName} logo`
      : imageSource
        ? `Logo for ${imageSource.substring(imageSource.lastIndexOf('/') + 1).replace(/\.[^/.]+$/, '')}`
        : 'Logo'

  // Base class is always hoverImage
  let imageClassName = styles.hoverImage
  let imageWidth = 50
  let imageHeight = 50

  if (width && height) {
    imageWidth = width
    imageHeight = height
  } else if (size === 'small') {
    imageWidth = 25
    imageHeight = 25
    imageClassName = styles.inlineIcon
  }

  if (variant === 'social') {
    imageClassName = `${imageClassName} ${styles.socialsLink}`
  }

  const imageElement = (
    <Image
      src={imageSource || ''}
      alt={descriptiveAltText}
      className={imageClassName}
      width={imageWidth}
      height={imageHeight}
    />
  )

  // For internal links, use Next.js Link
  if (!external) {
    return <Link href={href}>{imageElement}</Link>
  }

  // For external links, use regular anchor with target="_blank"
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {imageElement}
    </a>
  )
}

export default ActiveIcon
