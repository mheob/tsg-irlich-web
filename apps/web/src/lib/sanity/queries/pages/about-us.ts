import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

/**
 * Query to get the about us page
 *
 * @returns The about us page
 */
export const aboutUsPageQuery = defineQuery(`
	*[_type == 'aboutUs'][0] {
		...,
		content {
			...,
			contactPersonsSection {
				...,
				contactPersons[]-> {
					${contactPersons}
				}
			}
		}
	}
`);
