import { defineQuery } from 'next-sanity';

import { featuredImage, meta } from '@/lib/sanity/queries';

import { newsArticle } from '../shared/news';

/** The current and former address of a group, as the redirect candidates project it. */
const groupRedirectTarget = /* groq */ `{
	"departmentSlug": department->slug.current,
	"slug": slug.current,
}`;

/**
 * Filters a group that can be a redirect target: it has a department with a slug, and only its
 * published version counts, so a redirect never points at an address nobody has published yet.
 */
const publishedGroupWithDepartment = /* groq */ `
	_type == 'group' &&
	defined(department->slug.current) &&
	!(_id in path('drafts.**'))
`;

/** Filters the published department whose current or former slug is `$department`. */
const departmentOfUrl = /* groq */ `
	_type == 'department' &&
	(slug.current == $department || $department in previousSlugs) &&
	!(_id in path('drafts.**'))
`;

/**
 * Query to get the page document every group page shares
 *
 * @returns The single group page
 */
const offerGroupsGroupPageQuery = defineQuery(`*[_type == 'singleGroupPage'][0]`);

/**
 * Query to get a group by the slug of its department and its own slug
 *
 * @param department - The current slug of the department the group belongs to
 * @param slug - The current slug of the group
 * @returns The group, or `null` when no group has that address today
 */
const groupPageQuery = defineQuery(`
	*[
		_type == 'group' &&
		slug.current == $slug &&
		defined(department->slug.current) &&
		department->slug.current == $department
	][0] {
		_id,
		description,
		${featuredImage},
		images,
		"isTeamSport": department->isTeamSport,
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
 * Query to get the contact persons of a group
 *
 * @param groupId - The ID of the group the persons are affiliated with as a team
 * @returns The persons, ordered by last name
 */
const groupContactPersonsQuery = defineQuery(`
	*[
		_type == 'person' &&
		defined(affiliations[team._ref == $groupId][0])
	]|order(lastName asc) {
		_id,
		firstName,
		lastName,
		phone,
		image,
		contactAs,
		"email": affiliations[team._ref == $groupId][0].team->email,
		"role":  affiliations[team._ref == $groupId][0].role->title,
		"team":  affiliations[team._ref == $groupId][0].team->title,
		"taskDescription": affiliations[team._ref == $groupId][0].taskDescription,
	}
`);

/**
 * Query to get the news category of a group together with its latest articles
 *
 * @param groupId - The ID of the group
 * @returns The category with up to three of its newest articles, or `null` when none is set
 */
const groupNewsQuery = defineQuery(`
	*[_id == $groupId][0].newsCategory-> {
		_type,
		title,
		"slug": slug.current,
		"articles": *[_type == 'news.article' && references(^._id)] | order(publishedAt desc) [0..2] {
			${newsArticle}
		}
	}
`);

/**
 * Query to find where a group that used to have an address lives today
 *
 * Each candidate covers one way a group address goes out of date, and the most recently changed
 * group wins within a candidate:
 *
 * - `inDepartment`: only the department changed its slug, so the group still has `$slug`.
 * - `byPreviousPath`: the group changed its slug or its department, which recorded the address.
 * - `byDepartmentHistory`: both changed, so the group recorded the address under another slug of
 *   the department than the one in the URL. Every slug that department ever had is tried.
 *
 * @param department - The department segment of the URL
 * @param slug - The group segment of the URL
 * @returns The current department slug and group slug of each candidate, or `null` per candidate
 */
const groupRedirectQuery = defineQuery(`{
	"inDepartment": *[
		${publishedGroupWithDepartment} &&
		slug.current == $slug &&
		$department in department->previousSlugs
	] | order(_updatedAt desc) [0] ${groupRedirectTarget},
	"byPreviousPath": *[
		${publishedGroupWithDepartment} &&
		($department + "/" + $slug) in previousPaths
	] | order(_updatedAt desc) [0] ${groupRedirectTarget},
	"byDepartmentHistory": *[
		${publishedGroupWithDepartment} &&
		count(previousPaths[
			@ == string::split(@, "/")[0] + "/" + $slug &&
			string::split(@, "/")[0] in (
				*[${departmentOfUrl}].slug.current + *[${departmentOfUrl}].previousSlugs[]
			)
		]) > 0
	] | order(_updatedAt desc) [0] ${groupRedirectTarget},
}`);

/**
 * Query to get the address of every group that has a page, for `generateStaticParams`
 *
 * @returns The department slug and group slug of each group
 */
const groupStaticParamsQuery = defineQuery(`
	*[_type == 'group' && defined(slug.current) && defined(department->slug.current)] {
		"group": department->slug.current,
		"singleGroup": slug.current
	}
`);

export {
	groupContactPersonsQuery,
	groupNewsQuery,
	groupPageQuery,
	groupRedirectQuery,
	groupStaticParamsQuery,
	offerGroupsGroupPageQuery,
};
