/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.cooperability.com',
  generateRobotsTxt: true, // Optional: Generates a robots.txt file
  // next-sitemap derives its URLs from build-manifest + prerender-manifest and
  // does not read app-build-manifest. `/` is `force-dynamic`, so it appears in
  // neither and has to be added by hand or it silently drops out of the index.
  additionalPaths: async (config) => [await config.transform(config, '/')],
  // force-static route handlers land in the prerender manifest, so these are
  // picked up as pages. Submitting llms-full.txt for indexing would publish
  // every resource body at a second URL, competing with /resources/*.
  exclude: ['/llms.txt', '/llms-full.txt'],
}
