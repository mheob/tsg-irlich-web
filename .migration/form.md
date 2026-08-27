# form

2026-08-27 — transformation engine. Migrated; `FormControl` no longer uses Radix's `Slot`.

## Changed

- `src/components/with-logic/form/form.tsx` — `@radix-ui/react-slot` replaced by `useRender` from `@base-ui/react/use-render`. `FormControl` renders no element of its own: it passes its child as Base UI's `render` target, which is the same job `Slot` did. The props it hands down — `aria-describedby`, `aria-invalid`, `data-slot="form-control"` and `id` — are unchanged, and go through `mergeProps` so the wrapped control's own props still win, as they did with `Slot`. `FormControlProps` is a real interface now, typing `children` as a single `ReactElement` instead of borrowing `ComponentProps<typeof Slot>`. The `import type * as LabelPrimitive` was already removed in the label step.

Leftover scan clean: `grep -rn "radix" src/components/with-logic/form/` returns nothing.

## Left alone

- `FormField`, `FormItem`, `FormLabel`, `FormDescription` and `FormMessage` never used Radix. Untouched.
- All twelve `<FormControl>` call sites pass only children, so none of them changed.

## Behavior changes

- None. Both `Slot` and `useRender` clone the single child element and merge props onto it, with the child's own props taking precedence and event handlers composed.

## Verify by hand

1. Contact form: leave a required field empty and submit — the field gets `aria-invalid`, the error message appears below it and is referenced by `aria-describedby`.
2. Click each field's label: focus moves into that field, which proves the `id` still lands on the control rather than on a wrapper.
3. Feedback form: same checks, including on the toggle group and the select.
