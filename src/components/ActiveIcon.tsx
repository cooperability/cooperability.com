import Image from 'next/image'
import Link from 'next/link'
import styles from '../styles/utils.module.css'

export interface ActiveIconProps {
  href: string
  imgSrc: string
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
  alt,
  variant = 'default',
  size = 'default',
  width,
  height,
  external = true,
}) => {
  // Determine alt text
  const descriptiveAltText = alt
    ? alt
    : `Logo for ${imgSrc.substring(imgSrc.lastIndexOf('/') + 1).replace(/\.[^/.]+$/, '')}`

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
      src={imgSrc}
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
