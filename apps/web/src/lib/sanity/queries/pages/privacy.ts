import { defineQuery } from 'next-sanity';

import { blockContent } from '@/lib/sanity/queries';

/**
 * Query to get the privacy page
 *
 * @returns The privacy page with all fields
 */
export const privacyPageQuery = defineQuery(`
	*[_type == 'privacy'][0] {
		...,
		introText { ${blockContent} },
		content { ${blockContent} }
	}
`);
