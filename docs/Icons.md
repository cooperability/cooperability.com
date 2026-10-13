# Tech Stack Icons and SVG Configuration

The demos page marks each project with the technologies it uses.
[skillicons.dev](https://skillicons.dev) serves those icons, sourced from
[simple-icons.org](https://simpleicons.org), and swaps light and dark variants
through `next-themes`. Two icons have no upstream entry, shadcn/ui and Poetry,
and fall back to custom PNGs.

## Why this needs a security configuration

Serving SVG from a third party means the browser will execute whatever is
inside it. An SVG is a document, not an image: it can carry `<script>`, and a
compromised or hostile host would be running that script on this origin. Next
refuses external SVG by default for exactly this reason, so allowing it has to
be paid for explicitly.

`next.config.js`:

```javascript
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
```

Four things are doing work there:

- `dangerouslyAllowSVG` opens the door. On its own it is the whole
  vulnerability, which is what the name is warning about.
- `script-src 'none'` closes it again. Scripts inside a fetched SVG do not run,
  which removes the XSS path.
- `sandbox` strips the remaining SVG capabilities, including plugins and
  same-origin access.
- `remotePatterns` limits the door to one host and one path prefix. An
  attacker would need to control `skillicons.dev/icons/*` itself.

This is the configuration Vercel documents for the same problem, under
[NEXTJS_SAFE_SVG_IMAGES](https://vercel.com/docs/conformance/rules/NEXTJS_SAFE_SVG_IMAGES).

Because these images are proxied through `/_next/image`, they reach the browser
as same-origin, which is why the site-wide CSP in the same file can keep
`img-src 'self'`.

## What it buys, and what it costs

The icons adapt to the theme without a second asset set, they are colour-graded
consistently because one service renders them all, and they scale cleanly.

Against that: the site now depends on a third party being up and honest, the
SVG allowlist above exists solely to make that safe, and any technology
skillicons does not cover needs a hand-made fallback.

## Interface icons

Everything that is not a technology logo comes from
[lucide-react](https://lucide.dev), the family shadcn/ui already uses. Emoji
are not used in rendered source: they come from the viewer's system font, so
they differ on every device and ignore the theme.
`src/__tests__/lib/no-emoji.test.ts` fails on one.

- **Beside text**, use `InlineIcon`. It sizes from the font and hides the icon
  from screen readers, since the words next to it already name it.
- **Alone**, give the icon `role="img"` and an `aria-label`, as the platform
  marks on `/demos` do. The nav links instead keep their words in an `sr-only`
  span, so the link has a name when only the icon shows.
- **In a shadcn accordion trigger**, wrap the icon in a span. The trigger
  rotates every direct `svg` child when it opens.
- **A resource** names its icon in front matter (`icon: wrench`), resolved in
  `RESOURCE_ICONS`. Front matter cannot hold a component.
- **Prompt Composer sections** map to icons in `ComponentSelector`, because
  `catalog.ts` is pure data that the server also imports.

`@heroicons/react` still draws the theme switch, the footer's link button and
the quote refresh. Moving those over would make the chrome one family.
