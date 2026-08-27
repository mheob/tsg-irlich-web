# separator

2026-08-27 — transformation engine. Migrated to `@base-ui/react/separator`; the `decorative` prop is
gone.

## Changed

- `src/components/ui/separator.tsx` — `@radix-ui/react-separator` replaced by
  `@base-ui/react/separator`. The class list, `data-slot="separator"` and the `orientation` default
  are unchanged; Base UI emits the same `data-orientation` attribute, so the
  `data-[orientation=…]` variants keep matching. The `decorative` prop and its `= true` default were
  removed — Base UI has no equivalent (see below). The `// oxlint-disable import/no-namespace`
  header is gone with the namespace import.

Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/separator.tsx` returns nothing.

## Left alone

- `SelectSeparator` in `src/components/ui/select.tsx:146` and `BreadcrumbSeparator` in
  `src/components/ui/breadcrumb.tsx:67` are unrelated: the first is a Select part, the second a plain
  `<li>`. They belong to the select and breadcrumb steps.

## Behavior changes

- **The separator is now exposed to screen readers.** Radix's `decorative` prop, which the wrapper
  defaulted to `true`, made the element `role="none"` — purely presentational and skipped by
  assistive technology. Base UI's Separator has no such prop and always renders
  `role="separator"` with `aria-orientation`. The only call site
  (`src/app/news/[category]/[slug]/page.tsx:206`) uses it as a thematic break between portable-text
  blocks, where being announced is defensible, but it is a change and is not patched over.
- **Client boundary added.** `@base-ui/react/separator` carries `'use client'`;
  `@radix-ui/react-separator` does not. The news article route now has a client component boundary
  at each separator block.

## Verify by hand

1. Open a news article that contains a separator block: the rule still spans the full width with the
   same `my-10` spacing.
2. With a screen reader, the rule is now announced as a separator where it previously was silent.
