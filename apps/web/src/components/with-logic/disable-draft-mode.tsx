'use client';

import { useIsPresentationTool } from 'next-sanity/hooks';

/**
 * Renders a link that leaves the draft mode again.
 *
 * Inside the Sanity Presentation tool the studio itself controls the draft
 * mode, so the link is only rendered when the preview is opened directly in a
 * browser tab.
 *
 * @returns The link, or `null` while the preview runs inside the studio.
 */
export function DisableDraftMode() {
	const isPresentationTool = useIsPresentationTool();

	if (isPresentationTool !== false) {
		return null;
	}

	return (
		// oxlint-disable-next-line nextjs/no-html-link-for-pages -- this is a route handler, not a page
		<a
			className="fixed right-4 bottom-4 z-50 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg"
			href="/api/draft-mode/disable"
		>
			Vorschau beenden
		</a>
	);
}
