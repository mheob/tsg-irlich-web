# lightbox

2026-08-27 — transformation engine. Migrated to `@base-ui/react/dialog`. The paging keys had to move off `window`, which was a real defect the migration exposed rather than a test detail.

## Changed

- `src/components/ui/lightbox.tsx` — `@radix-ui/react-dialog` replaced by `@base-ui/react/dialog`, used directly rather than through `ui/dialog.tsx`, since the lightbox needs a bare full-screen popup rather than the wrapper's centred one. Part renames: `Overlay` → `Backdrop`, `Content` → `Popup`. `Root`, `Portal`, `Title` and `Close` keep their names. The `// oxlint-disable import/no-namespace` header is gone with the namespace import.
- **Backdrop transition rewritten.** `data-[state=open]:animate-in data-[state=open]:fade-in-0` and the `-out` counterparts became `transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0`.
- **Arrow-key paging moved from `window` onto the popup.** Base UI's `Dialog.Popup` attaches an `onKeyDown` that calls `event.stopPropagation()` for every composite key — the arrow keys included (`dialog/popup/DialogPopup.mjs:72`). The `useEffect` that registered a `keydown` listener on `globalThis` therefore stopped receiving them the moment focus moved inside the dialog, which is always, since the dialog is modal. Paging is now a `useCallback` passed to `Dialog.Popup`'s `onKeyDown`, which also removes the global listener and its `isOpen` guard.
- `src/components/ui/lightbox.test.tsx` — two cases needed to account for timing that Radix did not have:
  - the arrow-key case waits for focus to be inside the dialog before pressing a key, because the keys are now handled on the popup and the modal pulls focus in after mount rather than with it;
  - the escape case wraps its assertion in `waitFor`, because Base UI keeps the popup mounted until the closing transition finishes.

Leftover scan clean: `grep -n "radix" src/components/ui/lightbox.tsx` returns nothing.

## Left alone

- Everything `motion/react` does — the `layoutId` morph between thumbnail and full-screen image, the slide between images, the drag-to-page gesture and the `useReducedMotion` branches — is untouched. Only the dialog primitive underneath it changed.
- `gallery.tsx` and the `LightboxTrigger`/`LightboxGallery` API are unchanged, so no consumer moved.

## Behavior changes

- **Arrow keys are scoped to the dialog now.** Previously the listener sat on `window` and paged whenever the lightbox was open, regardless of where the event came from. It now only fires for keys that reach the popup. Since the dialog is modal and traps focus, that is the same set of events in practice — but it is a narrower scope, and it is the only shape that works at all under Base UI.
- **Closing is asynchronous.** The popup stays in the DOM for the duration of the backdrop's closing transition instead of unmounting immediately.

## Verify by hand

1. Open a gallery image: the thumbnail morphs into the full-screen image and the backdrop fades in.
2. Press `ArrowRight` and `ArrowLeft` repeatedly — **this is the interaction that broke and was fixed, so check it first.** Paging must work immediately after opening, without clicking inside the dialog first, and must wrap around at both ends.
3. Page with the on-screen chevrons and by dragging the image sideways on a touch device.
4. Press `Escape`: the image morphs back into its thumbnail and the backdrop fades out — the closing animation should play rather than the dialog vanishing.
5. Close with the X button, and confirm focus returns to the thumbnail that opened the lightbox.
6. With "reduce motion" enabled in the OS, the morph and slide are suppressed but paging still works.
7. The counter ("2 / 3") and the caption still follow the visible image.
