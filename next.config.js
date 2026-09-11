const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// next-themes and Next's own bootstrap both inject inline <script>, and
// Tailwind injects inline <style>, so locking these down properly needs a
// per-request nonce — which in turn forces dynamic rendering on every route.
// Until that trade is worth making, the policy ships in Report-Only: it
// surfaces violations in the browser console on preview deployments without
// being able to break production. Promote it to `Content-Security-Policy`
// once a preview run is clean.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Remote images are proxied through /_next/image, so they are same-origin
  // by the time the browser sees them.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://vitals.vercel-insights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // frame-ancestors above supersedes this for modern browsers; kept for old ones.
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  // No `preload`: that ships the apex to browser preload lists and is
  // impractical to reverse. Add it deliberately, not as a side effect.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'skillicons.dev',
        port: '',
        pathname: '/icons/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async redirects() {
    return [
      {
        source: '/skills',
        destination: '/demos',
        permanent: true,
      },
      {
        source: '/prompts',
        destination: '/resources',
        permanent: true,
      },
      // Redirect old demo paths to new /demos/ structure
      {
        source: '/prompt-composer',
        destination: '/demos/prompt-composer',
        permanent: true,
      },
      {
        source: '/mandelbrot-explorer',
        destination: '/demos/mandelbrot-explorer',
        permanent: true,
      },
      {
        source: '/opioid-converter',
        destination: '/demos/opioid-converter',
        permanent: true,
      },
    ]
  },
}

const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

module.exports = withBundleAnalyzer(
  withMDX({
    ...nextConfig,
    pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  })
)
