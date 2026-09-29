import { defineQuery } from 'next-sanity';

import { featuredImage, meta } from '@/lib/sanity/queries';

import { newsArticle } from '../shared/news';

/**
 * Query to get the groups page
 *
 * @returns The groups page
 */
const offerGroupsGroupPageQuery = defineQuery(`*[_type == 'singleGroupPage'][0]`);

/**
 * Query to get a single group document by type and slug
 *
 * @param groupType - The type of the group (e.g., 'group.taekwondo')
 * @param slug - The slug of the group to fetch
 * @returns A single group document
 */
const offerGroupsGroupPageGroupsQuery = defineQuery(`
	*[_type == $groupType && slug.current == $slug][0] {
		description,
		${featuredImage},
		images,
		${meta},
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
const offerGroupsGroupPageContactPersonsQuery = defineQuery(`
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

/**
 * Query to get the news category of a group together with its latest articles
 *
 * @param groupType - The type of the group (e.g., 'group.taekwondo')
 * @param slug - The slug of the group
 * @returns The category with up to three of its newest articles, or `null` when none is set
 */
const offerGroupsGroupPageNewsQuery = defineQuery(`
	*[_type == $groupType && slug.current == $slug][0].newsCategory-> {
		_type,
		title,
		"slug": slug.current,
		"articles": *[_type == 'news.article' && references(^._id)] | order(publishedAt desc) [0..2] {
			${newsArticle}
		}
	}
`);

export {
	offerGroupsGroupPageQuery,
	offerGroupsGroupPageGroupsQuery,
	offerGroupsGroupPageContactPersonsQuery,
	offerGroupsGroupPageNewsQuery,
};
