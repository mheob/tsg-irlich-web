import { createClient } from 'next-sanity';

import { apiVersion, dataset, projectId, studioUrl } from '@/lib/sanity/api';

const LAST_INDEX = -1;

export const client = createClient({
	apiVersion,
	dataset,
	projectId,
	stega: {
		filter: (props) => {
			if (props.sourcePath.at(LAST_INDEX) === 'title') {
				return true;
			}
			return props.filterDefault(props);
		},
		// Set logger to 'console' for more verbose logging
		logger: console,
		studioUrl,
	},
	// The pages are cached by Next.js and only refetched when the revalidation webhook fires, so the
	// API CDN saves next to nothing here. It does keep serving the old content for up to a minute
	// after a change, longer than the webhook's 3 s wait, and the render the webhook triggers would
	// cache that old content again. `sanityFetch` (`live.ts`) uses the CDN with `noStale` itself.
	useCdn: false,
});
