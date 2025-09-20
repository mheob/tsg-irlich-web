import { defineQuery } from 'next-sanity';

/**
 * Query to get the imprint page
 *
 * @returns The privacy page with all fields
 */
export const imprintPageQuery = defineQuery(`
	*[_type == 'imprint'][0] {
		...,
		"contactForm": contactForm {
			title,
			"slug": link->slug.current
		}
	}
`);
