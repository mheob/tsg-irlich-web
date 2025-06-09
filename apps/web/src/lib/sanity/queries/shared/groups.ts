import { defineQuery } from 'next-sanity';

export const groupsQuery = defineQuery(`
	*[_type == 'group'][] {
		_id,
		title,
		icon,
	}
`);
