import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { subTitleField, titleField } from '@/shared/general-fields';

const groupsField = defineField({
	title: 'Gruppen',
	name: 'groupsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'groups',
	fields: [
		defineField({
			...titleField,
			group: undefined,
		}),
		defineField({
			...subTitleField,
			group: undefined,
		}),

		defineField({
			title: 'Gruppen',
			name: 'groups',
			// TODO: use a reference to all the groups instead of an array
			type: 'array',
			// TODO: add icon List
			of: [/*{ type: 'icon' },*/ { type: 'string' }, { type: 'number' }],
			description: '',
		}),
	],
});

export default groupsField;
