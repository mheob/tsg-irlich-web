import { defineQuery } from 'next-sanity';

import { featuredImage } from '@/lib/sanity/queries';

/**
 * Query to get the groups page
 *
 * @returns The groups page
 */
export const offerGroupsGroupPageQuery = defineQuery(`*[_type == 'singleGroupPage'][0]`);

/**
 * Query to get a single group document by type and slug
 *
 * @param groupType - The type of the group (e.g., 'group.taekwondo')
 * @param slug - The slug of the group to fetch
 * @returns A single group document
 */
export const offerGroupsGroupPageGroupsQuery = defineQuery(`
	*[_type == $groupType && slug.current == $slug][0] {
		description,
		${featuredImage},
		images,
		title,
		training {
			trainingDescription,
			trainingTimes[] {
				...,
				venue->
			}
		}
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
		_id,
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
