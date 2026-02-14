'use client';

import { usePathname } from 'next/navigation';

/**
 * A floating button to disable draft mode when in preview mode.
 *
 * This component is only rendered when draft mode is enabled.
 * Clicking the button will call the /api/draft-mode/disable endpoint
 * and redirect back to the current page.
 */
export function DisableDraftMode() {
	const pathname = usePathname();

	return (
		<a
			className="fixed right-4 bottom-4 z-50 rounded-full bg-black px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-gray-800"
			href={`/api/draft-mode/disable?redirect=${pathname}`}
		>
			Vorschau beenden
		</a>
	);
}
