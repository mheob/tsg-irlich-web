import { defineQuery } from 'next-sanity';

/**
 * Query to get the club's contact details and social profiles from the site settings
 *
 * @returns The contact details and social profiles, read by the footer and the structured data
 */
export const organizationQuery = defineQuery(`
	*[_type == 'site-settings'][0] {
		contact { email, phone, postalAddress },
		socialFields,
	}
`);
