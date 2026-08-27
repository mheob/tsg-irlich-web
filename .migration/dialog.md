# dialog

2026-08-27 — transformation engine. Migrated to `@base-ui/react/dialog`. Parts renamed, exports renamed to match, and the enter/exit animation rewritten in Base UI's idiom.

## Changed

- `src/components/ui/dialog.tsx` — `@radix-ui/react-dialog` replaced by `@base-ui/react/dialog`. Part renames: `Overlay` → `Backdrop`, `Content` → `Popup`. `Root`, `Trigger`, `Portal`, `Close`, `Title` and `Description` keep their names. The wrapper's public exports follow the primitive: `DialogOverlay` → `DialogBackdrop`, `DialogContent` → `DialogPopup`. The hand-written `ref?: RefObject<ComponentRef<…>>` intersections are gone — `ComponentProps` carries `ref` under React 19. `DialogHeader` and `DialogFooter` are plain divs and are untouched. A `DialogActions` type re-export was added for the imperative close handle (see `go-to-google-maps.tsx` below). The `// oxlint-disable import/no-namespace` header is gone with the namespace import.
- **Transitions rewritten.** `tailwindcss-animate`'s `data-[state=open]:animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-top-[48%]`, `slide-in-from-left-1/2` and their `-out` counterparts were replaced by Base UI's model: `transition-opacity` on the backdrop and `transition-[opacity,scale]` on the popup, both driven by `data-starting-style:` and `data-ending-style:`. The popup keeps its `duration-200`; the backdrop, which had no explicit duration and therefore ran at `tailwindcss-animate`'s 150 ms default, was given the same `duration-200` so both halves of the transition match. Centring moved from `top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]` to the equivalent `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`, which is the same computed position but does not fight the animated `scale`.
- `src/app/verein/_sections/chronicle-card.tsx:50` — `DialogTrigger asChild` became `render={<Button variant="link" />}`, `DialogContent` became `DialogPopup`, and `DialogDescription asChild` wrapping a `<div>` became `render={<div />}` with the portable text as its children.
- `src/components/section/vision.dialog.tsx:22` — the same three changes.
- `src/components/section/go-to-google-maps.tsx` — `DialogContent` became `DialogPopup`, the "Hier bleiben" `DialogClose asChild` became `render={<Button variant="ghost" />}`, and the hand-rolled `<ExternalLink className={buttonVariants()}>` (deferred here from the button step) became a `ButtonLink`. That link can no longer be a `DialogClose`: Base UI's `Close` enforces button semantics on whatever it renders as, which would announce the Google Maps link as a button. It closes the dialog through `Dialog.Root`'s `actionsRef` handle instead.

Leftover scan clean: `grep -n "radix"` over `dialog.tsx` and all three consumers returns nothing.

## Left alone

- `src/components/ui/lightbox.tsx` still imports `@radix-ui/react-dialog` directly rather than through this wrapper. It is the next step and has its own report.

## Behavior changes

- **Export names.** Anything importing `DialogOverlay` or `DialogContent` now imports `DialogBackdrop` / `DialogPopup`. All three consumers were updated; there are no others.
- **Enter/exit animation.** Radix's shadcn preset also slid the popup up from 48% and in from the left half while scaling; the new animation fades and scales from 95% without the slide. Exit animations are now correct in a way they were not before: Base UI keeps the popup mounted for the `data-ending-style` transition, whereas `animate-out` under Radix could be cut short by the unmount.
- **The Google Maps link closes the dialog through a handle, not through `DialogClose`.** The visible behaviour is the same — the dialog closes and the link opens in a new tab — but the anchor keeps link semantics instead of gaining `role="button"`.
- **`onOpenChange` signature.** Base UI calls it with `(open, eventDetails)`. No consumer passes one today.

## Verify by hand

1. "Verein" page, chronicle card: "Mehr erfahren »" opens the dialog centred, with a backdrop; the text scrolls inside it.
2. Close it three ways — the X button, `Escape`, and a click on the backdrop — and watch the closing animation actually play instead of the dialog vanishing.
3. Focus returns to the "Mehr erfahren »" trigger after closing, and `Tab` stays trapped inside the dialog while it is open.
4. Vision section on the "Verein" page: the same checks on the long-vision dialog.
5. Training card: "Route auf Google Maps berechnen" opens the Google Maps warning. "Hier bleiben" closes it. "Google Maps öffnen" opens Maps in a new tab **and** closes the dialog behind it — this is the path that changed most, so check it in a real browser.
6. Page scroll is locked while any dialog is open and restored afterwards.
