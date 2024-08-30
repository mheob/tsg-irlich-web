import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';

export const galleryField = defineField({
	title: 'Galerie',
	name: 'gallerySection',
	type: 'object',
	icon: RiLinksLine,
	group: 'gallery',
	fields: [
		...getDefaultPageFieldsWithGroup(),

		defineField({
			title: 'Bilder',
			name: 'images',
			type: 'array',
			of: [{ type: 'extendedImage' }],
			description: 'Diese gewählten Bilder werden in der gewünschten Reihenfolge angezeigt.',
			// validation: rule => [
			// 	exactLengthRule(rule, 3, 'Es sollten genau 3 Bilder ausgewählt werden.'),
			// ],
		}),
	],
});
