import { defineQuery } from 'next-sanity';

export const groupsQuery = defineQuery(`
	*[_type in [
		'group.soccer',
		'group.children-gymnastics',
		'group.courses',
		'group.taekwondo',
		'group.dance',
		'group.other-sports',
	]] {
		_id,
		title,
		icon,
	}
`);
