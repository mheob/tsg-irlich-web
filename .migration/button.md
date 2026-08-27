# button

2026-08-27 — transformation engine (legacy `new-york` style has no `base-new-york` counterpart, so
the existing classes were kept and only the primitives were rewired). Migrated; the wrapper now
renders the real `@base-ui/react/button` primitive and links no longer go through it.

## Changed

- `apps/web/package.json` — added `@base-ui/react@^1.7.0`. The `@radix-ui/*` dependencies stay until
  the last wrapper is migrated.
- `src/components/ui/button/button.tsx` — `@radix-ui/react-slot` replaced by
  `@base-ui/react/button`. The `asChild` boolean became Base UI's `render` prop, which is inherited
  from `ComponentProps<typeof BaseButton>` instead of being declared by hand. The `<span>` wrapper,
  `data-slot="button"`, `buttonVariants` and `fullWidth` are unchanged, so `.btn > :first-child` in
  `src/app/globals.css:127` still targets the same node.
- `src/components/ui/button/button-link.tsx` — new. Base UI's Button docs state that links must not
  be rendered through a Button's `render` prop, because the component enforces button semantics
  (`role="button"`, button key handling) and a link would be announced as a button. `ButtonLink`
  therefore styles the anchor itself with the same `buttonVariants`, via `useRender` with
  `defaultTagName: 'a'`. `useRender` guards its only hook behind `typeof document !== 'undefined'`
  (`internals/useRenderElement.js`), so the component stays a server component.
- `src/components/ui/button/index.ts` — exports `ButtonLink`.
- Six link call sites moved from `<Button asChild><Link/></Button>` to
  `<ButtonLink render={<Link/>}>`: `src/app/_home/hero.tsx:28`, `src/app/_home/news.tsx:38`,
  `src/app/news/[category]/[slug]/_sections/author.tsx:45` (renders a `ContactLink`),
  `src/components/ui/pricing-card.tsx:78`, `src/components/section/vision.tsx:94`,
  `src/components/with-logic/navigation.tsx:105` and `:159`.
- `src/components/ui/training-card.tsx:93` — the one non-link `asChild` site. It renders a `<span>`
  as a dialog trigger, so it became `render={<span />}` plus `nativeButton={false}`, which is the
  signal Base UI needs to apply `role="button"` and key handling to a non-button element.
- `src/app/news/[category]/[slug]/_sections/author.test.tsx:60` — the case used
  `getByText('Autor anschreiben')` and then read `href` off that node. The DOM nesting changed (see
  below), so the text node is now the inner `<span>` rather than the anchor. It queries by role and
  accessible name instead, which is what `AGENTS.md` asks for anyway.
- `oxlint.config.ts:22` — the `**/*.tsx` override already set all four `react-perf/*` rules to
  `'off'`, but its `plugins` list omitted `react-perf`, so those four lines were ignored and the
  rules kept warning. Added `'react-perf'` to the list. Without it, Base UI's `render={<Element/>}`
  idiom raises `react-perf(jsx-no-jsx-as-prop)` at every call site of every migrated component.

Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/button/*` returns nothing.

## Left alone

- `src/components/section/go-to-google-maps.tsx:39` hand-rolls the styled-anchor pattern with
  `<ExternalLink className={buttonVariants()}>`. It is wrapped in a Radix `DialogClose asChild`, so
  it is folded into `ButtonLink` in the dialog step rather than half-migrated here.
- The pre-existing `// oxlint-disable-next-line react_perf/jsx-no-new-function-as-prop` comments are
  now redundant after the config fix, but removing them is unrelated cleanup.

## Behavior changes

- **DOM nesting of link buttons inverted.** `<Button asChild><Link/></Button>` rendered
  `<span class="btn" data-slot="button"><a>…</a></span>`, because Radix's `Slot` merged the button
  props onto the `<span>` the wrapper puts around its children, leaving the anchor inside.
  `ButtonLink` renders `<a class="btn" data-slot="button"><span>…</span></a>`. The pill styling is
  unchanged — `.btn > :first-child` matches the inner node in both shapes — but the styled and
  interactive element is now the same node, and the anchor is no longer nested inside a element
  carrying the button styling.
- **`data-slot` value.** Link buttons report `data-slot="button-link"`, not `data-slot="button"`.
  Nothing selects on it today.
- **Default `type` on `<Button>`.** Base UI's Button renders `type="button"` by default, whereas the
  previous plain `<button>` inherited the HTML default of `type="submit"`. Every submit button in
  the app already passes `type="submit"` explicitly, and the one `<Button>` without a `type`
  (`src/components/section/contact-form.tsx:117`) is rendered outside the `<form>`, so no call site
  changes behavior. New buttons inside a form must now set `type="submit"` themselves.
- **Client boundary added.** `@base-ui/react/button` carries `'use client'`; `@radix-ui/react-slot`
  does not. Every page that renders a `<Button>` now has a client component boundary there and ships
  the Base UI button runtime. `ButtonLink` does not — it stays server-rendered — which removes that
  cost from the six link call sites, and `Label` will remove another one.

## Verify by hand

1. Home page: the "Kontakt aufnehmen" hero link and "Alle Neuigkeiten ansehen" still look like
   pills, at both breakpoints — the padding comes from `.btn > :first-child`.
2. Tab to those links: focus ring on the anchor, `Enter` navigates, and the browser status bar shows
   the target URL on hover (it is a real link, not a `role="button"` anchor).
3. Navigation bar: the desktop contact button shrinks on scroll (`size` switches to `sm`), and the
   mobile one closes the menu on click and spans the full width.
4. News article: "Autor anschreiben" reveals the mail address only after hover/focus, then opens the
   mail client.
5. Training card: "Route auf Google Maps berechnen" still opens the Google Maps dialog, by mouse and
   by keyboard (`Enter` and `Space` — it is a `<span>` with `role="button"`).
6. Contact form: submitting still works, and the "Erneute Anfrage stellen" button after a successful
   send resets the form.
