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

/**
 * Query to get the hero image of the contact page, which the feedback page shows as well
 *
 * @returns The hero image of the contact page
 */
export const contactHeroImageQuery = defineQuery(`*[_type == 'contact'][0].heroImage`);
