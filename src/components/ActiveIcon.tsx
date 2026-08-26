import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import styles from '../styles/utils.module.css'

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Deliberate SSR hydration guard: the server cannot know the theme or the
    // viewport, so the first client render must match the server output and only
    // then flip to the real value. Setting state here is the point, not an
    // oversight -- which is why the rule is silenced at this one call site
    // rather than downgraded globally.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Determine the current theme
  const currentTheme = theme === 'system' ? systemTheme : theme

  // Construct the image source URL
  let imageSource = imgSrc
  if (iconName && mounted) {
    // Use skillicons.dev with theme support
    const themeParam = currentTheme === 'dark' ? 'dark' : 'light'
    imageSource = `https://skillicons.dev/icons?i=${iconName}&theme=${themeParam}`
  } else if (iconName && !mounted) {
    // During SSR/initial render, use light theme as default
    imageSource = `https://skillicons.dev/icons?i=${iconName}&theme=light`
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
