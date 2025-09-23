const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
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
