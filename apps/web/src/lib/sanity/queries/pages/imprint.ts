import { defineQuery } from 'next-sanity';

import { internalLinkTarget } from '@/lib/sanity/queries';

/**
 * Query to get the imprint page
 *
 * @returns The privacy page with all fields
 */
export const imprintPageQuery = defineQuery(`
	*[_type == 'imprint'][0] {
		...,
		"contactForm": contactForm {
			"title": link->title,
			"link": link-> { ${internalLinkTarget} }
		}
	}
`);
