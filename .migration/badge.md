# badge

2026-08-27 — transformation engine. Migrated; the `asChild` boolean became Base UI's `render` prop, implemented with `useRender`.

## Changed

- `src/components/ui/badge/badge.tsx` — `@radix-ui/react-slot` replaced by `useRender` from `@base-ui/react/use-render`, with `defaultTagName: 'span'`. The `asChild` boolean and the `Comp = asChild ? Slot : 'span'` switch are gone; `render` replaces both. `badgeVariants`, `data-slot="badge"` and the class merge are unchanged. `useRender` guards its only hook behind `typeof document !== 'undefined'`, so the component stays a server component. The dead `export interface BadgeProps extends ComponentProps<'div'>` that the file carried (declared, exported, never used by the component, and typed as a `div` while the component rendered a `span`) is now the component's real prop type, built on `useRender.ComponentProps<'span'>`.
- `src/components/ui/badge/badge.test.tsx` — the `asChild` case became a `render` case. It asserts the same thing: that the badge renders as the given anchor, with its `href` intact.

Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/badge/*` returns nothing.

## Left alone

- Nothing. `Badge` has no consumers outside its own folder — its only call sites are in its test.

## Behavior changes

- None. Radix's `Slot` and Base UI's `useRender` both clone the given element and merge props onto it; the merge direction is the same (the passed element's own props win over the component's).

## Verify by hand

- Nothing renders a `Badge` in the app today, so there is no page to check. The component's own test covers both shapes.
