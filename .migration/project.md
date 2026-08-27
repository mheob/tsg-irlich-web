# project

2026-08-27 — Radix UI → Base UI, whole of `apps/web`, progressive (one commit per component) on
`refactor/migrate-radix-to-base-ui`.

**0 wrappers remain on Radix.** `grep -rn "radix" apps/web/src apps/web/test-utils` returns nothing,
and no `@radix-ui/*` package is installed.

## Strategy

`components.json` names the `new-york` style, which is a legacy unprefixed shadcn style with no
`base-new-york` counterpart. Retargeting the wrappers onto a `base-<style>` registry variant would
have restyled the app, so the golden-pair replay was not used: every wrapper was transformed in
place, keeping its own classes, and only the primitives underneath were rewired.

## Order

Bottom-up, so no component was migrated before what it depends on. `toggle` and `toggle-group`
landed together because they share `toggleVariants`; `button` also produced the new `ButtonLink`.

1. `button` (+ `button-link`) · 2. `label` · 3. `badge` · 4. `separator` · 5. `checkbox` ·
6. `toggle` + `toggle-group` · 7. `breadcrumb` · 8. `arrow-button-group` · 9. `form` ·
10. `scroll-area` · 11. `dialog` · 12. `lightbox` · 13. `select`

Each has its own report in this directory.

## Dependency swap

Removed: `@radix-ui/react-checkbox`, `-dialog`, `-label`, `-navigation-menu`, `-scroll-area`,
`-select`, `-separator`, `-slot`, `-toggle`, `-toggle-group` — ten packages, one of which
(`react-navigation-menu`) had no import anywhere and was simply dead.
Also removed `tailwindcss-animate` and its `@plugin` line in `src/app/globals.css`: its
`animate-in` / `fade-*` / `zoom-*` / `slide-in-from-*` utilities were used by exactly three files
(`dialog.tsx`, `lightbox.tsx`, `select.tsx`), all of which now express their transitions in Base UI's
`data-starting-style:` / `data-ending-style:` idiom.
Added: `@base-ui/react@^1.7.0`.

## App-code sweep

Twenty-one files outside `src/components/ui` changed. The break surface was wider than `asChild`:

- `asChild` → `render` at every composition site (hero, news, author, pricing-card, vision,
  navigation ×2, training-card, chronicle-card, vision.dialog, go-to-google-maps ×2, breadcrumb ×2).
- Six link-as-button sites moved to the new `ButtonLink`, because Base UI's `Button` enforces button
  semantics and must not render a link.
- `feedback-type.tsx` moved to the toggle group's array value model.
- `browse-field.tsx` and `operation-system-field.tsx` pass their options as `items`, without which
  the select's trigger shows the raw value instead of the label.
- `chronicle-card.tsx` and `vision.dialog.tsx` import `DialogPopup` instead of `DialogContent`.
- `go-to-google-maps.tsx` closes through the dialog's imperative handle so its Google Maps link stays
  a link.

Eight test files changed, each because the DOM or the timing genuinely changed, never to make a red
run green: `author.test.tsx`, `badge.test.tsx`, `arrow-button.test.tsx`, `contact-form.test.tsx`,
`feedback/form.test.tsx`, `lightbox.test.tsx`, the new `separator.test.tsx`, plus the
`getAnimations` stub in `test-utils/setup-dom.ts`.

## Defects found and fixed on the way

- **`ArrowButtonGroup`'s `asChild` never worked.** Radix's `Slot` slots onto its children, and the
  group always renders its own two arrows, so setting `asChild` threw. Base UI's separate `render`
  prop makes it work; it is now covered by a test and is out of `AGENTS.md`'s unreachable list.
- **The lightbox's arrow-key paging would have broken silently.** Base UI's `Dialog.Popup` stops the
  propagation of every composite key, so the `window` listener that paged the gallery never saw the
  arrow keys once the modal took focus. Paging moved onto the popup's own `onKeyDown`.
- **Four `react-perf` lint rules were switched off but never applied.** The `**/*.tsx` override in
  `oxlint.config.ts` set them to `'off'` while omitting `react-perf` from its `plugins` list, so the
  settings were ignored. Base UI's `render={<Element/>}` idiom made it visible by tripping
  `jsx-no-jsx-as-prop` at every call site.

## Client-boundary effect

`@base-ui/react`'s components carry `'use client'`, as Radix's did. Net change:

- **Added**: `Button` (`@radix-ui/react-slot` had no directive, `@base-ui/react/button` does) and
  `Separator`.
- **Removed**: `Label`, which is now a native `<label>`.
- **Unchanged**: dialog, select, scroll area, checkbox, toggle, toggle group — client on both sides.
- `useRender` is server-safe (it guards its only hook behind `typeof document !== 'undefined'`), so
  `Badge`, `BreadcrumbLink`, `ArrowButtonGroup`, `FormControl` and `ButtonLink` all stay server
  components.

## Coverage

Thresholds ratcheted in `apps/web/vitest.config.ts` from 90/90/82/80 to
91 statements / 91 lines / 83 functions / 81 branches. Measured after the migration:
**92.52 % statements · 84.11 % branches · 85.57 % functions · 92.64 % lines**
(baseline before the migration: 92.39 / 83.73 / 85.37 / 92.5). `AGENTS.md`'s threshold note was
updated to match.

## Final verification

Against the baseline recorded before any dependency changed — all four were green then and are green
now:

| Check | Baseline | After |
| --- | --- | --- |
| `pnpm run typecheck` | pass | pass |
| `pnpm run test` | 70 files / 630 cases | 71 files / 633 cases |
| `pnpm run test:coverage` | 92.39 / 83.73 / 85.37 / 92.5 | 92.52 / 84.11 / 85.57 / 92.64 |
| `pnpm run lint` | 0 errors | 0 errors, 0 warnings |
| `pnpm run build` | pass | pass |

## Flagged, not fixed

- **`components.json` moved to the `base-lyra` style.** `style` is a required field, so it could not
  simply be dropped — the CLI rejects the whole file without it. `base-lyra` makes `shadcn add`
  deliver Base UI components (`shadcn info` reports `base: base`) instead of Radix ones. It delivers
  that style's classes rather than this app's, so a fetched component stays a starting point to
  replay onto the existing wrapper, never a drop-in overwrite. Noted in the root `AGENTS.md`.
- **The single-choice feedback type is no longer a radio group.** Base UI's toggle group makes no
  role distinction between single and multiple selection. Rebuilding that field on
  `@base-ui/react/radio-group` would restore radio semantics; it is a redesign of the field, not a
  migration of it. See `.migration/toggle-group.md`.
- **Motion feel changed where the transitions were rewritten** (dialog, lightbox backdrop, select).
  The dialog no longer slides while it scales. Every component report carries a manual QA list; the
  select and the lightbox are the two that most need a real browser.
