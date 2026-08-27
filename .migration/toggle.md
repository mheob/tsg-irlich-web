# toggle

2026-08-27 — transformation engine. Migrated to `@base-ui/react/toggle`, together with `toggle-group` because both share `toggleVariants`.

## Changed

- `src/components/ui/toggle/toggle.tsx` — `@radix-ui/react-toggle` replaced by `@base-ui/react/toggle`. `pressed`, `onPressedChange` and `disabled` keep their names, and the component still renders a native `<button>`, so the `disabled:` variants keep matching. The `// oxlint-disable import/no-namespace` header is gone with the namespace import.
- `src/components/ui/toggle/variants.ts:4` — `data-[state=on]:bg-primary` / `data-[state=on]:text-primary-foreground` became `data-pressed:…`. Base UI reports the pressed state as a bare `data-pressed` attribute rather than `data-state="on"`. This file is shared with `ToggleGroupItem`, which is why both components had to move in the same commit.

Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/toggle/*` returns nothing.

## Left alone

- Nothing. `Toggle` is exported but has no call site of its own — it is only used through `ToggleGroupItem`.

## Behavior changes

- **State attribute.** `data-state="on" | "off"` became `data-pressed` (present or absent). Only `toggleVariants` reads it.

## Verify by hand

- See `.migration/toggle-group.md` — the feedback form's type selector is the only place a toggle is rendered.
