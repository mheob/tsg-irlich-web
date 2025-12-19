import { defineQuery } from 'next-sanity';

/**
 * Query to get all sponsors sorted by name ascending
 *
 * @returns All sponsors
 */
export const sponsorsQuery = defineQuery(`
	*[_type== 'sponsors'][] {
		_id,
		name,
		logo,
		website,
	} | order(name asc)
`);
