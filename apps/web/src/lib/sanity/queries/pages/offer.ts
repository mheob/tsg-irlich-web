import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

/**
 * Query to get the offer page
 *
 * @returns The offer page
 */
export const offerPageQuery = defineQuery(`
*[_type == 'departmentsPage'][0] {
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
