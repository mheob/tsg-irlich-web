import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

/**
 * Query to get the contact page
 *
 * The receivers keep only their key and name: the page hands them to the contact form, a client
 * component, so an address here would be published in the HTML (WEB-410). The server action reads
 * the address with {@link contactReceiversQuery}.
 *
 * @returns The contact page
 */
export const contactPageQuery = defineQuery(`
	*[_type == 'contact'][0] {
		...,
		content {
			...,
			receiver[] { _key, name },
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
 * Query to get the receivers of the contact form with their addresses, for the server action only
 *
 * @returns The receivers of the contact page, `null` while the page does not exist
 */
export const contactReceiversQuery = defineQuery(
	`*[_type == 'contact'][0].content.receiver[] { _key, email, name }`,
);

/**
 * Query to get the hero image of the contact page, which the feedback page shows as well
 *
 * @returns The hero image of the contact page
 */
export const contactHeroImageQuery = defineQuery(`*[_type == 'contact'][0].heroImage`);
