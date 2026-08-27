# label

2026-08-27 — transformation engine. Migrated; Base UI has no Label counterpart, so the wrapper
renders a native `<label>`.

## Changed

- `src/components/ui/label.tsx` — `@radix-ui/react-label` replaced by a plain `<label>` element.
  The class list, `data-slot="label"` and the prop spread are unchanged; the prop type moved from
  `ComponentProps<typeof LabelPrimitive.Root>` to `ComponentProps<'label'>`, which is the same
  surface minus Radix's `asChild`. The `// oxlint-disable import/no-namespace` header is gone with
  the namespace import.
- `src/components/with-logic/form/form.tsx` — dropped the `import type * as LabelPrimitive` and its
  `oxlint-disable` header; `FormLabel` now types its props as `ComponentProps<typeof Label>`.
  `FormLabel` already passes `htmlFor={formItemId}`, so clicking the label still focuses its control.

Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/label.tsx` returns nothing.
`form.tsx` still imports `@radix-ui/react-slot` for `FormControl`; that is the form step.

## Left alone

- `src/components/with-logic/feedback/screenshots-field.tsx:23` renders `<Label>` without `htmlFor`
  and wraps its control instead. Implicit labelling works the same for a native `<label>`, so the
  call site is unchanged.

## Behavior changes

- **Double-click no longer selects the label text.** Radix's Label attached an `onMouseDown` handler
  that called `preventDefault()` on a double click, so dragging across a label never selected its
  text. A native `<label>` has no such handler. The wrapper's `select-none` class already suppresses
  selection, so the effect is not visible with the current styling — but a call site that overrides
  `select-none` would now be able to select the text.
- **Client boundary removed.** `@radix-ui/react-label` carries `'use client'`; the native element
  does not. Every server component that renders a `Label` outside a client subtree now stays fully
  server-rendered.

## Verify by hand

1. Contact form and feedback form: click a field's label — focus lands in the matching input, select
   or textarea.
2. Feedback form, screenshot field: the label wraps its control, so clicking the label text still
   opens the file picker.
3. A disabled field's label is still dimmed (`peer-disabled:opacity-70`).
