import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';

export const chronicleField = defineField({
	title: 'Chronik',
	name: 'chronicleSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'chronicle',
	fields: [
		...getDefaultPageFieldsWithGroup(),

		defineField({
			title: 'Chronik',
			name: 'chronicle',
			type: 'array',
			of: [{ type: 'imageCard' }],
			description: 'Die Abschnitte der Chronik.',
		}),
	],
});
