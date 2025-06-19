import { defineQuery } from 'next-sanity';

export const groupsQuery = defineQuery(`
	*[_type == 'group.soccer'
		|| _type == 'group.children-gymnastics'
		|| _type == 'group.courses'
		|| _type == 'group.taekwondo'
		|| _type == 'group.dance'
		|| _type == 'group.other-sports'
	] {
		_id,
		title,
		icon,
	}
`);
