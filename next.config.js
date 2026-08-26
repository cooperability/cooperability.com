const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Intentionally left on. Linting is a dedicated CI job (.github/workflows/
    // ci.yml) that runs in parallel with everything else and reports its own
    // failure; making `next build` lint again would run ESLint twice per PR
    // and attribute lint failures to the build step. The README TODO asking
    // to "turn it back on" is satisfied by that job, not by this flag.
    ignoreDuringBuilds: true,
  },
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
  webpack(config) {
    return config
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
