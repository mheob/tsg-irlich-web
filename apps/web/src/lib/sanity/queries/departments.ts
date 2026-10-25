import { defineQuery } from 'next-sanity';

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
