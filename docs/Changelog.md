# Changelog

What changed on the live site, newest first. Each entry is dated and links
the pull request that made it. Changes only a developer sees belong in the
pull request, not here.

## 2026-10-14: Stash list holds its layout on phones ([#368](https://github.com/cooperability/cooperability.com/pull/368))

- On a phone, `/stash` used to arrive with each title and date laid out as a
  desktop row, then restack once JavaScript loaded. CSS now picks the layout,
  so the page arrives in its final shape: title above date at 525px wide and
  below, one row above that.

## 2026-10-13: Stash, and a new header ([#359](https://github.com/cooperability/cooperability.com/pull/359))

### Renamed: Resources is now Stash

- `/resources` and every `/resources/<page>` redirect permanently (308) to
  `/stash` and `/stash/<page>`. The older `/prompts` redirect now lands on
  `/stash` in one hop.
- Links outside this repo keep working through the redirect. Update the ones
  you control, such as profile bios and QR codes, because search results lag.
- The content folder is `src/stash` and the loader is `src/lib/stash.ts`.
- `llms.txt` lists a `## Stash` section, and `llms-full.txt` wraps each entry
  in `<entry>` where it used `<resource>`.

### Header

- The page selector shows an icon per page: a house for Home, a flask for
  Demos and a backpack for Stash. The hamburger button and the sidebar are
  gone from the layout.
- On a phone the selector shows the current page's name beside its icon and
  the other two pages as icons. All three names show once the selector is
  about 275px wide. Below about 165px the filled icon alone marks the page.
- The logo, selector and theme switch share one height and one centre line.
  They grow together from 36px to 45px tall between 360px and 560px wide, and
  the selector keeps the same size on every page.
- The header stays at the top of the viewport on scroll.
- On a touch screen, a swipe left or right on Home, Demos or Stash moves to
  the next or previous page. Swipes that start at a screen edge, in a field,
  on a canvas or in a sideways-scrolling block are left alone, and so are the
  pages under Demos and Stash.
- The selector's outline follows the theme's text colour, like the rules under
  the header. The pages inside it stay muted.
- The animated hover underline on the page links is gone. Its styles stay in
  the stylesheet, marked dormant, for reuse.

### Elsewhere

- Every emoji in the rendered site is now a lucide-react icon. A test fails if
  one comes back.
- The footer's More links button is link blue, outline included.
- Personnel Portal is marked with a clapperboard.
- The gap between each project and its stack icons on Demos is tighter.
