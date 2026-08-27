# scroll-area

2026-08-27 — transformation engine. Migrated to `@base-ui/react/scroll-area`; the anatomy gained a `Content` part and the scrollbar's show/hide moved from the library into CSS.

## Changed

- `src/components/ui/scroll-area.tsx` — `@radix-ui/react-scroll-area` replaced by `@base-ui/react/scroll-area`. Part renames: `ScrollAreaScrollbar` → `Scrollbar`, `ScrollAreaThumb` → `Thumb`; `Root`, `Viewport` and `Corner` keep their names. Base UI's anatomy puts a `Content` element inside the `Viewport`, so the children are wrapped in `ScrollArea.Content`. The hand-written `ref?: RefObject<ComponentRef<…>>` intersections are gone — `ComponentProps` already carries `ref` under React 19. The `// oxlint-disable import/no-namespace` header is gone with the namespace import.
- The scrollbar's visibility is now expressed in classes, following Base UI's own Tailwind example: `opacity-0 transition-opacity` plus `data-hovering:` and `data-scrolling:` variants (with matching `pointer-events-*`, so an invisible scrollbar does not swallow clicks). Radix drove this from its `type` prop, which Base UI does not have. The layout classes (`h-full w-2.5`, the transparent border, `p-px`, and the horizontal counterparts) and the thumb are unchanged.
- `test-utils/setup-dom.ts:88` — added `Element.prototype.getAnimations = () => []`. Base UI's viewport calls `getAnimations()` from a timeout after mount; jsdom does not implement it, which surfaced as an uncaught `TypeError` that failed the run (exit code 1) even though every case passed. The comment above the existing pointer-capture and `scrollIntoView` stubs was updated to name Base UI rather than Radix.

Leftover scan clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/scroll-area.tsx` returns nothing.

## Left alone

- Both call sites (`src/app/verein/_sections/chronicle-card.tsx:55` and `src/components/section/vision.dialog.tsx:27`) pass only `className`, which Base UI's `Root` accepts under the same name. Unchanged.

## Behavior changes

- **Scrollbar visibility.** Radix's `Root` defaulted to `type="hover"`, which mounted the scrollbar on hover and unmounted it after a delay. Base UI keeps the scrollbar mounted whenever the viewport overflows and leaves the appearance to CSS; the classes above reproduce hover and scroll visibility, but the fade timing is the CSS transition rather than Radix's internal delay.
- **A wrapper element was added.** `ScrollArea.Content` sits between the viewport and the children. Nothing selects on that structure today, but a descendant selector written against the old nesting would need updating.

## Verify by hand

1. "Verein" page, chronicle card: open a chronicle entry — the text scrolls inside the card, capped at `max-h-[calc(100vh-200px)]`, and the content is not clipped or collapsed to zero height.
2. Hover the scroll area: the scrollbar fades in; move away and it fades out.
3. Drag the thumb, and scroll with the wheel and with the keyboard — all three move the content.
4. Same checks in the vision dialog, where the scroll area sits inside a dialog.
5. Resize the window so the content no longer overflows: no scrollbar and no stray click target along the edge.
