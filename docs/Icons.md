# Tech Stack Icons and SVG Configuration

The demos page marks each project with the technologies it uses. The icons are
SVG files in `public/icons/stack/`, one per theme, named
`<icon>-light.svg` and `<icon>-dark.svg`. They were downloaded from
[skillicons.dev](https://skillicons.dev) (MIT, notice in
`public/icons/stack/LICENSE`) on 2026-10-12. `ActiveIcon` picks the file for
the current theme through `next-themes`. Two icons have no skillicons entry,
shadcn/ui and Poetry, and use custom PNGs from `public/images/`.

## Adding an icon

1. Download both variants:
   `https://skillicons.dev/icons?i=<icon>&theme=light` and `&theme=dark`.
   Some icons, such as `ts`, have one variant and return the same file for
   both.
2. Save them as `public/icons/stack/<icon>-light.svg` and `-dark.svg`.
3. Add `<icon>` to `STACK_ICONS` in `src/components/ActiveIcon.tsx`. The
   `iconName` prop only accepts names on that list, so a missing entry is a
   type error.

`src/__tests__/components/active-icon.test.tsx` checks that every listed icon
has both files and that no file carries `<script>`, an event handler or a
`javascript:` URL.

## Why nothing remote goes through the image optimizer

`next.config.js` sets no `images.remotePatterns` and no `dangerouslyAllowSVG`.

Until 2026-10-12 the icons came from skillicons.dev at runtime, which needed a
remote pattern for `https://skillicons.dev/icons/**`. That pattern matched any
query string, so a visitor could request
`/_next/image?url=https%3A%2F%2Fskillicons.dev%2Ficons%3Fi%3D<anything>&w=64&q=75`
with endless distinct `i` values. Each one was a new source image for Vercel
Image Optimization, which spends quota outside any budget the site tracks.

Remote SVG also needed `dangerouslyAllowSVG`, because an SVG is a document that
can carry `<script>`. The old config paired it with an image CSP of
`script-src 'none'; sandbox` to stop that script running.

With local files, neither is needed. When `dangerouslyAllowSVG` is off,
`next/image` serves a `.svg` source as-is instead of sending it through the
optimizer (`get-img-props.js` in Next 16.4.0). The icons are same-origin
files, so the site-wide CSP keeps `img-src 'self'`.

## What it costs

A new technology on `/demos` needs its icon downloaded by hand, as above. The
icons no longer track upstream redesigns, which is the point: the files that
ship are the files reviewed here.
