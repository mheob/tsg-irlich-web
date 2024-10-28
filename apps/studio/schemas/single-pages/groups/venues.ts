import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';

export const venuesField = defineField({
	title: 'Gruppen',
	name: 'venuesSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'venues',
	fields: [
		...getDefaultPageFieldsWithGroup(),

		defineField({
			title: 'Sportstätten',
			name: 'venues',
			type: 'array',
			of: [{ type: 'reference', to: { type: 'venue' } }],
			description: 'Diese gewählten Sportstätten werden in der gewünschten Reihenfolge angezeigt.',
		}),
	],
});
