import { defineQuery } from 'next-sanity';

import { blockContent } from '@/lib/sanity/queries';

/**
 * Query to get the accessibility page
 *
 * @returns The accessibility page with all fields
 */
export const accessibilityPageQuery = defineQuery(`
	*[_type == 'accessibility'][0] {
		...,
		content { ${blockContent} }
	}
`);
