const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

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
