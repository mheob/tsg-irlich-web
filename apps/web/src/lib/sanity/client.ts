import { createClient } from 'next-sanity';

import { apiVersion, dataset, projectId, studioUrl } from '@/lib/sanity/api';

export const client = createClient({
	apiVersion,
	dataset,
	projectId,
	stega: {
		filter: (props) => {
			if (props.sourcePath.at(-1) === 'title') return true;
			return props.filterDefault(props);
		},
		// Set logger to 'console' for more verbose logging
		logger: console,
		studioUrl,
	},
	useCdn: true,
});
