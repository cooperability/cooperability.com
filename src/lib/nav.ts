// The top-level pages, in the order the page selector shows them and a swipe
// walks them. Their icons live in the Header, keyed by href.
export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/demos', label: 'Demos' },
  { href: '/stash', label: 'Stash' },
] as const

export type NavPath = (typeof NAV_LINKS)[number]['href']
