# checkbox

2026-08-27 — transformation engine. Migrated to `@base-ui/react/checkbox`; the state data attributes and the element the label points at both changed.

## Changed

- `src/components/ui/checkbox.tsx` — `@radix-ui/react-checkbox` replaced by `@base-ui/react/checkbox`. `Root` and `Indicator` keep the same names and nesting. Class changes: `data-[state=checked]:bg-primary` / `data-[state=checked]:text-primary-foreground` became `data-checked:…`, since Base UI reports state as a bare `data-checked` attribute rather than `data-state="checked"`. `data-disabled:cursor-not-allowed data-disabled:opacity-50` were added next to the existing `disabled:` variants — Base UI's root is not a native `<button>`, so the `:disabled` pseudo-class no longer matches it and only the data attribute does. The `// oxlint-disable import/no-namespace` header is gone with the namespace import.
- `src/components/section/contact-form.test.tsx:114` — the case asserted `aria-checked="false"` on the element returned by `getByLabelText('Datenschutzbestimmungen')`. That element is now the hidden native input, which reports state through `checked`, not `aria-checked`. The assertion reads `.checked` instead, and carries a comment explaining why.

Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/checkbox.tsx` returns nothing.

## Left alone

- Both call sites (`src/components/with-logic/form/privacy-field.tsx:22` and `src/components/with-logic/feedback/privacy-field.tsx:22`) pass `checked`, `onCheckedChange`, `onBlur`, `ref` and `className`, all of which Base UI accepts under the same names. They are unchanged.

## Behavior changes

- **The label now points at a native input.** Radix's root was a `<button role="checkbox">` carrying the `id` that `FormControl` assigns, so `<label htmlFor>` resolved to that button. Base UI's root renders a styled element plus a hidden native `<input type="checkbox">` beside it, and documents `id` as "the id of the input element" — so the label now resolves to the real input. Clicking the label still toggles the box, and the control is now a genuine form control rather than an ARIA one.
- **`onCheckedChange` signature.** Radix called it with `boolean | 'indeterminate'`; Base UI calls it with `(checked: boolean, eventDetails)`. Both call sites forward it straight to react-hook-form's `field.onChange`, which ignores the extra argument, and the schema only ever accepts a boolean.
- **State attributes.** `data-state="checked" | "unchecked"` became `data-checked` / `data-unchecked` (plus `data-indeterminate`). Only this component's own classes read them.

## Verify by hand

1. Contact form and feedback form: click the privacy checkbox — it ticks once, not twice. Then click the _text_ beside it (the surrounding `<label>` in `privacy-field.tsx`) — it must also toggle exactly once. This is the interaction most at risk: the visual box and the hidden input both sit inside that label.
2. Keyboard: tab to the checkbox, press `Space` — it toggles, and the focus ring is visible.
3. Submit the form without ticking it: the validation message still appears and the box shows its invalid styling.
4. Submit successfully, then press "Erneute Anfrage stellen": the box is cleared.
