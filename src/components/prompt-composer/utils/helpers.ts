/**
 * Utility functions for Prompt Composer
 * Includes color helpers and text processing utilities
 */

/**
 * Get light theme color for a category
 */
export const getLightCategoryColor = (category: string): string => {
  switch (category) {
    case 'role':
      return '#dbeafe' // light blue
    case 'audience':
      return '#fce7f3' // light pink
    case 'context':
      return '#dcfce7' // light green
    case 'reasoning':
      return '#fef3c7' // light yellow
    case 'output':
      return '#fed7aa' // light orange
    case 'constraints':
      return '#e9d5ff' // light purple
    case 'meta':
      return '#f0f9ff' // light cyan
    default:
      return '#f5f5f5'
  }
}

/**
 * Get dark theme color for a category
 */
export const getDarkCategoryColor = (category: string): string => {
  switch (category) {
    case 'role':
      return '#1e3a8a' // dark blue
    case 'audience':
      return '#831843' // dark pink
    case 'context':
      return '#166534' // dark green
    case 'reasoning':
      return '#92400e' // dark amber
    case 'output':
      return '#9a3412' // dark orange
    case 'constraints':
      return '#6b21a8' // dark purple
    case 'meta':
      return '#164e63' // dark cyan
    default:
      return '#374151'
  }
}

/**
 * Get border color for a category
 */
export const getCategoryBorderColor = (category: string): string => {
  switch (category) {
    case 'role':
      return '#3b82f6' // blue-500
    case 'audience':
      return '#ec4899' // pink-500
    case 'context':
      return '#22c55e' // green-500
    case 'reasoning':
      return '#f59e0b' // amber-500
    case 'output':
      return '#f97316' // orange-500
    case 'constraints':
      return '#a855f7' // purple-500
    case 'meta':
      return '#06b6d4' // cyan-500
    default:
      return '#9ca3af'
  }
}

/**
 * Get current category color based on theme
 */
export const getCurrentCategoryColor = (
  category: string,
  isLightMode: boolean
): string => {
  return isLightMode
    ? getLightCategoryColor(category)
    : getDarkCategoryColor(category)
}

/**
 * Count words in a text string
 */
export const countWords = (text: string): number => {
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).length
}
