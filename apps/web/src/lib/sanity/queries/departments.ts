import { defineQuery } from 'next-sanity';

import { contactPersons, meta } from '@/lib/sanity/queries';

/**
 * Query to get every department that can be linked, in the order the offer shows them
 *
 * A department without a slug has no page, so it is left out here and cannot become a card.
 *
 * @returns The fields of the department cards on the home page and the offer page
 */
export const departmentCardsQuery = defineQuery(`
	*[_type == 'department' && defined(slug.current)] | order(sortOrder asc) {
		_id,
		cardImage,
		icon,
		"slug": slug.current,
		title,
	}
`);

/**
 * Query to get a department page by its current slug
 *
 * The groups are the ones that point at the department, and a group without a slug has no page to
 * link to. The contact persons keep the order the editors chose in the department document.
 *
 * @param slug - The slug of the department
 * @returns The department with its groups and contact persons, or `null` when no department has
 * that slug
 */
export const departmentPageQuery = defineQuery(`
	*[_type == 'department' && slug.current == $slug][0] {
		_id,
		title,
		intro,
		cardImage,
		heroImage,
		${meta},
		stats,
		"groups": *[_type == 'group' && department._ref == ^._id && defined(slug.current)] | order(sortOrder asc) {
			featuredImage,
			icon,
			overviewTitle,
			"slug": slug.current,
			title,
		},
		"contactPersons": contactPersons[]-> {
			${contactPersons}
		},
	}
`);

/**
 * Query to find the current slug of a department that used to have another one
 *
 * The perspective decides which versions are candidates: visitors read the published one, so a
 * redirect never points at a slug nobody has published yet. The id filter only matters where a draft
 * shows up under its own id, as in the `raw` perspective. Two departments may list the same former
 * slug, so the most recently updated one wins and the id breaks a tie, which makes every request
 * answer the same.
 *
 * @param slug - The slug that no department uses any more
 * @returns The current slug of the department that used to have it, or `null` when none did
 */
export const departmentRedirectQuery = defineQuery(`
	*[_type == 'department' && $slug in previousSlugs && !(_id in path('drafts.**'))] | order(_updatedAt desc, _id asc)[0].slug.current
`);

/**
 * Query to get the slug of every department that has a page, for `generateStaticParams`
 *
 * @returns The slugs of the departments
 */
export const departmentSlugsQuery = defineQuery(`
	*[_type == 'department' && defined(slug.current)].slug.current
`);
