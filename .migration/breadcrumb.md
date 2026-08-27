# breadcrumb

2026-08-27 — transformation engine. Migrated; `BreadcrumbLink`'s `asChild` boolean became Base UI's
`render` prop.

## Changed

- `src/components/ui/breadcrumb.tsx` — `@radix-ui/react-slot` replaced by `useRender` from
  `@base-ui/react/use-render` in `BreadcrumbLink`, with `defaultTagName: 'a'`. The `asChild` boolean
  and the `Comp = asChild ? Slot : 'a'` switch are gone. Classes, `data-slot="breadcrumb-link"` and
  the prop spread are unchanged, and the component stays a server component.
- `src/components/with-logic/breadcrumb.tsx:52,60` — both call sites moved from
  `<BreadcrumbLink asChild><Link/></BreadcrumbLink>` to `<BreadcrumbLink render={<Link/>}>`.

Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/breadcrumb.tsx` returns
nothing.

## Left alone

- `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbPage`, `BreadcrumbSeparator` and
  `BreadcrumbEllipsis` never used Radix — they are plain `nav`, `ol`, `li` and `span` elements.
  Untouched.

## Behavior changes

- None. The rendered DOM is identical: both `Slot` and `useRender` clone the passed `<Link>` and
  merge the wrapper's class and `data-slot` onto it, with the passed element's own props winning.

## Verify by hand

1. Open a nested route (for example a news article): the breadcrumb still shows `Home / … /` and the
   current page.
2. Each crumb before the last is an underlined link that navigates, and hovering turns it to the
   secondary colour.
3. The last crumb is not a link.
