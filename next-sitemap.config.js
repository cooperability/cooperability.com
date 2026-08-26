/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.cooperability.com',
  generateRobotsTxt: true, // Optional: Generates a robots.txt file
  // next-sitemap derives its URLs from build-manifest + prerender-manifest and
  // does not read app-build-manifest. `/` is `force-dynamic`, so it appears in
  // neither and has to be added by hand or it silently drops out of the index.
  additionalPaths: async (config) => [await config.transform(config, '/')],
}
