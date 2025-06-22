import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const galleryField = defineField({
	title: 'Galerie',
	name: 'gallerySection',
	type: 'object',
	icon: RiLinksLine,
	group: 'gallery',
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		defineField({
			title: 'Bilder',
			name: 'images',
			type: 'array',
			of: [{ type: 'extendedImage' }],
			description: 'Diese gewählten Bilder werden in der gewünschten Reihenfolge angezeigt.',
			validation: Rule => [
				Rule.required().length(3).error('Es sollten genau 3 Bilder ausgewählt werden.'),
			],
		}),
	],
});
