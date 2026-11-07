'use client';

import dynamic from 'next/dynamic';

/**
 * The link out of the draft mode, loaded in the browser only and only where it is rendered.
 *
 * `DisableDraftMode` asks `useIsPresentationTool`, which brings the whole Visual Editing runtime of
 * `@sanity/visual-editing` along. Imported statically by the root layout, that runtime landed in the
 * JavaScript every page shares, although the layout renders the link only while draft mode is on
 * (WEB-412). Behind `next/dynamic` it is a chunk of its own that only an editor's browser fetches.
 * `ssr: false` because the hook cannot know on the server whether the studio frames the page, so
 * the link renders nothing there anyway. `<VisualEditing />` from `next-sanity` loads the same way.
 */
const DisableDraftModeLazy = dynamic(
	async () => {
		const { DisableDraftMode } = await import('./disable-draft-mode');
		return DisableDraftMode;
	},
	{ ssr: false },
);

export { DisableDraftModeLazy };
