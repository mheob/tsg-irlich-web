# toggle-group

2026-08-27 — transformation engine. Migrated to `@base-ui/react/toggle-group`, in the same commit as `toggle` because they share `toggleVariants`. The value model and the ARIA roles both changed.

## Changed

- `src/components/ui/toggle-group.tsx` — `@radix-ui/react-toggle-group` replaced by `@base-ui/react/toggle-group`. Base UI's toggle group is a single component rather than a `Root`/`Item` pair: its items are plain `Toggle`s. `ToggleGroupItem` therefore renders the app's own `Toggle` wrapper instead of re-applying `toggleVariants` itself, which also removes the duplicated class merge. The size/variant context and the `flex items-center justify-center gap-1` class on the group are unchanged.
- `src/components/with-logic/feedback/feedback-type.tsx:42` — the only call site. Radix's `type="single"` with a string `value` became Base UI's array model: `value={[field.value]}` and `onValueChange={([value]) => …}`. `type="single"` is gone (Base UI uses `multiple`, which defaults to `false`), and the redundant `defaultValue="bug"` was dropped — the field is controlled by react-hook-form, whose own default supplies the initial value. The guard that ignores an empty selection is unchanged, so clicking the pressed item still cannot clear the field.
- `src/components/with-logic/feedback/form.test.tsx:59,68,78,79` — three cases queried `getByRole('radio', …)` and one asserted `aria-checked`. They now query `getByRole('button', …)` and assert `aria-pressed`, with a comment naming the reason.

Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/toggle-group.tsx` returns nothing.

## Left alone

- Nothing else renders a toggle group.

## Behavior changes

- **The single-choice group is no longer a radio group.** Radix's `type="single"` rendered `role="radiogroup"` with `role="radio"` items and `aria-checked`. Base UI's toggle group makes no role distinction between single and multiple selection: the items stay toggle buttons reporting `aria-pressed`. "Art des Feedbacks" is therefore announced as three toggle buttons rather than as one radio group with three options. This was raised and accepted rather than patched over; the alternative is rebuilding the field on `@base-ui/react/radio-group`, which is a redesign of the field rather than a migration of it.
- **Keyboard navigation.** Radix's radio group moved between options with the arrow keys and treated the group as a single tab stop. Base UI's toggle group also handles arrow keys (`loopFocus` defaults to `true`), but as a toolbar-style group of buttons rather than radio semantics.
- **`onValueChange` payload.** A `string` became a `string[]`, and it carries a second `eventDetails` argument.

## Verify by hand

1. Feedback form: "Fehlermeldung" is pressed on load, and the browser / operating system / device fields are visible.
2. Click "Verbesserungsvorschlag": those three fields disappear, and only one item is pressed at a time.
3. Click the already-pressed item: it stays pressed — the field cannot be cleared.
4. Tab into the group and use the arrow keys: focus moves between the three items and wraps around.
5. Submit the form and confirm the created Linear issue carries the chosen type.
