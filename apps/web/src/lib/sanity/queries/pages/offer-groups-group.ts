import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

/**
 * Query to get the groups page
 *
 * @returns The groups page
 */
export const offerGroupsGroupPageQuery = defineQuery(`*[_type == 'singleGroupPage'][0]`);

/**
 * Query to get all groups for a given group
 *
 * @param groupType - The type of group to get the groups for
 * @returns An array of groups
 */
export const offerGroupsGroupPageGroupsQuery = defineQuery(`
	*[_type == $groupType][] | order(sortOrder asc) {
		icon,
		image,
		overviewTitle,
		'slug': slug.current,
		title,
	}
`);

/**
 * Query to get the contact persons for a given group
 *
 * @param email - The email of the group
 * @returns An array of contact persons
 */
export const offerGroupsGroupPageContactPersonsQuery = defineQuery(`
	*[_type == 'person'][affiliations[0].role->email == $email] {
		${contactPersons}
	}
`);
