# arrow-button-group

2026-08-27 — transformation engine. Migrated; the `asChild` boolean became Base UI's `render` prop,
which also made a branch testable that was previously unreachable.

## Changed

- `src/components/ui/arrow-button/arrow-button-group.tsx` — `@radix-ui/react-slot` replaced by
  `useRender` from `@base-ui/react/use-render`, with `defaultTagName: 'div'`. The two arrows moved
  into an `arrows` fragment that is passed as `children` through `mergeProps`, so they win over any
  `children` a caller might spread in — the same precedence JSX children had over a spread
  `children` prop before. `BaseProps` now extends `Omit<useRender.ComponentProps<'div'>, 'children'>`
  rather than `ComponentPropsWithoutRef<'div'>`, which states in the type what the component already
  did: it renders its own two arrows and accepts no children.
- `src/components/ui/arrow-button/arrow-button.test.tsx:133` — the comment explaining why `asChild`
  could not be covered was replaced by an actual test of `render`, asserting the group renders as
  the given `<nav>` and still contains both arrow buttons.
- `AGENTS.md:168` — the coverage note listed `ArrowButtonGroup`'s `asChild` as one of the places the
  harness cannot reach. It is reachable now, so it is out of the list.

Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/arrow-button/*` returns
nothing.

## Left alone

- `arrow-button.tsx` (`ArrowButton`, `ArrowElement`, `ArrowLink`) never used Radix. Untouched.
- The `apps/web` coverage thresholds are not raised here. They are a single ratchet step in the
  final cleanup commit, once every component has landed and the numbers have settled.

## Behavior changes

- **`asChild` was unusable; `render` works.** Radix's `Slot` slots onto its children, and this group
  always renders two arrows as its children, so `Slot` threw "Slot failed to slot onto its children"
  whenever `asChild` was set. Base UI takes the replacement element through a separate `render`
  prop, leaving `children` free, so the group can now render as any element while keeping both
  arrows. That is a fixed defect, not a regression.

## Verify by hand

1. News list pagination: the back and forward arrows still sit centred with their gap, and disabled
   arrows are dimmed and non-clickable.
2. On an article, the previous/next arrows are links and navigate without scrolling to top
   (`scroll={false}`).
