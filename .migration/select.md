# select

2026-08-27 — transformation engine. Migrated to `@base-ui/react/select`. The deepest change of the
set: the anatomy, the CSS custom properties, the highlight styling and the way the trigger shows a
label all moved.

## Changed

- `src/components/ui/select.tsx` — `@radix-ui/react-select` replaced by `@base-ui/react/select`.
  Anatomy changes:
  - `Content` split into `Portal` → `Positioner` → `Popup` → `List`. The wrapper keeps exporting a
    single `SelectContent` that assembles all four, so no call site had to learn the new nesting.
  - `Viewport` is gone; its scrolling role belongs to `List`.
  - `ScrollUpButton`/`ScrollDownButton` → `ScrollUpArrow`/`ScrollDownArrow`. The exported names
    `SelectScrollUpButton`/`SelectScrollDownButton` are unchanged.
  - `Label` → `GroupLabel` (the exported `SelectLabel` is unchanged).
  - `Icon asChild` wrapping the chevron became `Icon` with the chevron as its child.
- **CSS custom properties remapped**: `--radix-select-content-available-height` → `--available-height`
  (now on the `List`, which is the scrolling element), `--radix-select-content-transform-origin` →
  `--transform-origin`, `--radix-select-trigger-width` → `--anchor-width`. The two separate floors
  the old code had (`min-w-32` on the content and `min-w-(--radix-select-trigger-width)` on the
  viewport) collapse into `min-w-[max(8rem,var(--anchor-width))]` on the popup.
  `h-(--radix-select-trigger-height)` had no purpose outside Radix's popper mode and is gone.
- **`position="popper"` dropped**, as agreed. Base UI positions through `Positioner`; the prop and
  the `data-[side=…]:translate-*` block that went with it are gone, replaced by
  `sideOffset={4}`.
- **`alignItemWithTrigger={false}`** on the positioner. Base UI defaults it to `true`, which makes
  the popup overlap the trigger like a native select. `false` keeps the popup below the trigger,
  which is what `position="popper"` did.
- **Highlight styling**: `focus:bg-accent focus:text-accent-foreground` on an item became
  `data-highlighted:…`. Radix moved DOM focus to the active item; Base UI keeps focus on the trigger
  and marks the active item with `data-highlighted`, so the `focus:` variants would never match.
- **Disabled styling**: `data-disabled:` variants were added to the trigger next to the existing
  `disabled:` ones, since Base UI's trigger is not a native `<button>` in every mode.
- **Transitions rewritten**: the `data-[state=open]:animate-in`, `fade-*`, `zoom-*` and
  `slide-in-from-*` classes became `transition-[opacity,scale]` with `data-starting-style:` and
  `data-ending-style:`.
- `SelectWithLabel` now passes `items={selectItems}` to the root — see the behavior note below. Its
  `selectItems` prop types `value` as `string` rather than borrowing Base UI's `any`, which keeps
  the map over it inside the type-aware lint rules.
- `src/components/with-logic/feedback/browse-field.tsx:36` and
  `src/components/with-logic/feedback/operation-system-field.tsx:36` — both now pass their existing
  options array as `items` to `<Select>`, for the same reason.

Leftover scan clean: `grep -rn "radix" src/ test-utils/` returns nothing across the whole app.

## Left alone

- `src/components/section/contact-form.tsx:180` uses `SelectWithLabel`, whose signature is
  unchanged. Untouched.
- `SelectGroup`, `SelectSeparator` and `SelectScrollUpButton`/`SelectScrollDownButton` have no call
  sites today; they were migrated but not exercised.

## Behavior changes

- **The trigger needs `items` to show a label.** Radix's `SelectValue` rendered the selected
  `SelectItem`'s children. Base UI's `Select.Value` renders the raw value unless the root is given an
  `items` map, in which case it renders that item's label. Without it, choosing "Firefox" would have
  shown `firefox` in the trigger. All three places that render a select now pass `items`; any new
  select must do the same.
- **Item highlighting is not DOM focus.** Keyboard navigation moves `data-highlighted` rather than
  focus. Behaviourally the same for a user, but anything selecting on `:focus` inside the popup
  would stop matching.
- **`onValueChange` signature** gained a second `eventDetails` argument, and the value type is
  `Value | Value[] | null` rather than `string`. Both call-site shapes forward it to
  react-hook-form, which ignores the extra argument.
- **The popup's scroll container moved** from the viewport to `List`, so `--available-height` caps
  the list rather than the whole popup; the scroll arrows now sit outside the scrolling area, which
  is what they are for.

## Verify by hand

The feedback form's own test opens both selects and picks an option, so the basic open/select/commit
path is covered automatically. What needs eyes:

1. Feedback form: open "Browser" — the popup opens **below** the trigger, not over it, and is at
   least as wide as the trigger.
2. Pick "Firefox": the trigger shows **"Firefox"**, not `firefox`. This is the failure mode that
   `items` prevents, and it is the first thing to check.
3. Keyboard: focus the trigger, press `Enter`/`Space`/`ArrowDown` to open, move with the arrows, type
   a few letters to jump by prefix, `Enter` to pick, `Escape` to dismiss. The highlighted row must be
   visibly highlighted while moving.
4. Open a select near the bottom of the viewport: it flips above the trigger rather than overflowing.
5. Contact form with a receiver select ("Wähle eine Empfängergruppe"): picking a group fills both the
   e-mail and the label, and the placeholder styling (muted text) shows before a choice is made.
6. Submit with no selection: the invalid styling and the error message still appear on the trigger.
7. Scroll arrows: shrink the window until the option list overflows and confirm the up/down arrows
   appear and scroll the list.
