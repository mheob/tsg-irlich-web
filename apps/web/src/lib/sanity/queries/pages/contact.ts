import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

/**
 * Query to get the contact page
 *
 * @returns The contact page
 */
export const contactPageQuery = defineQuery(`
	*[_type == 'contact'][0] {
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
