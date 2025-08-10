import { defineQuery } from 'next-sanity';

import { featuredImage } from '@/lib/sanity/queries';

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
 * @param slug - The slug of the group to get the groups for
 * @returns An array of groups
 */
export const offerGroupsGroupPageGroupsQuery = defineQuery(`
	*[_type == $groupType && slug.current == $slug][0] {
		description,
		${featuredImage},
		images,
		title,
	}
`);

/**
 * Query to get the contact persons for a given group
 *
 * @param slug - The team / group slug
 * @returns An array of contact persons
 */
export const offerGroupsGroupPageContactPersonsQuery = defineQuery(`
	*[
		_type == 'person' &&
		defined(affiliations[team->slug.current == $slug][0])
	]|order(lastName asc) {
		firstName,
		lastName,
		phone,
		image,
		contactAs,
		"email": affiliations[team->slug.current == $slug][0].team->email,
		"role":  affiliations[team->slug.current == $slug][0].role->title,
		"team":  affiliations[team->slug.current == $slug][0].team->title,
		"taskDescription": affiliations[team->slug.current == $slug][0].taskDescription,
	}
`);
