# separator

2026-08-27 — transformation engine. Migrated to `@base-ui/react/separator`. `decorative` was first
dropped with the primitive and then reimplemented in the wrapper, so the prop and its behaviour
survive the migration.

## Changed

- `src/components/ui/separator.tsx` — `@radix-ui/react-separator` replaced by
  `@base-ui/react/separator`. The class list, `data-slot="separator"` and the `orientation` default
  are unchanged; Base UI emits the same `data-orientation` attribute, so the
  `data-[orientation=…]` variants keep matching. The `// oxlint-disable import/no-namespace` header
  is gone with the namespace import.
- `decorative` is kept, with its `= true` default. Base UI's `Separator` has no such prop and always
  renders `role="separator"` with `aria-orientation`, but it puts both in its *internal* prop set and
  merges external props over them (`separator/Separator.mjs`), so the wrapper passes
  `role={decorative ? 'none' : 'separator'}` and `aria-orientation={decorative ? undefined : orientation}`
  to restore the distinction. The shadcn registry's own `base-lyra` separator drops the prop instead;
  this app keeps it.
- `src/components/ui/separator.test.tsx` — new. The file had no test and scored 0%. Two cases: the
  default is hidden from assistive technology (`role="none"`, no `aria-orientation`), and
  `decorative={false}` is announced as a separator carrying its orientation.

Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/separator.tsx` returns nothing.

## Left alone

- `SelectSeparator` in `src/components/ui/select.tsx:146` and `BreadcrumbSeparator` in
  `src/components/ui/breadcrumb.tsx:67` are unrelated: the first is a Select part, the second a plain
  `<li>`. They belong to the select and breadcrumb steps.

## Behavior changes

- **None for assistive technology.** `decorative` behaves as it did under Radix: the default stays
  `role="none"`, so the separator on the news article route
  (`src/app/news/[category]/[slug]/page.tsx:206`) is still skipped by screen readers.
- **Client boundary added.** `@base-ui/react/separator` carries `'use client'`;
  `@radix-ui/react-separator` does not. The news article route now has a client component boundary
  at each separator block.

## Verify by hand

1. Open a news article that contains a separator block: the rule still spans the full width with the
   same `my-10` spacing.
2. With a screen reader, the rule stays silent (it is decorative by default); a
   `<Separator decorative={false} />` is announced as a separator with its orientation.
