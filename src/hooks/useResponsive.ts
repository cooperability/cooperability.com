import { useState, useEffect } from 'react'

const MOBILE_WIDTH_THRESHOLD = 525

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkWindowSize = () => {
      setIsMobile(window.innerWidth <= MOBILE_WIDTH_THRESHOLD)
    }

    if (typeof window !== 'undefined') {
      checkWindowSize() // Initial check
      window.addEventListener('resize', checkWindowSize)
      return () => window.removeEventListener('resize', checkWindowSize)
    }
  }, [])

  return { isMobile }
}
