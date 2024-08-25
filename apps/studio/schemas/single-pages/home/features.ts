import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';

export const featuresField = defineField({
	title: 'Merkmale',
	name: 'featureSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'features',
	fields: [
		...getDefaultPageFieldsWithGroup(),

		defineField({
			title: 'Merkmale',
			name: 'features',
			type: 'array',
			// TODO: add icon name (string) from https://... (see: /apps/studio/schemas/documents/group.tsx:63)
			of: [/*{ type: 'icon' },*/ { type: 'string' }, { type: 'number' }],
			description: "Merkmale (USP's), die auf der Homepage angezeigt werden.",
		}),
	],
});
