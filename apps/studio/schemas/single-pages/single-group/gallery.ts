import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';
import { maxLengthRule } from '@/shared/validation-rules';

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
			validation: rule => [
				// minLengthRule(rule, 2, 'Es müssen mindestens 2 Bilder ausgewählt werden.'),
				maxLengthRule(rule, 4, '', {
					message: 'Es dürfen maximal vier Bilder ausgewählt werden.',
					type: 'error',
				}),
			],
		}),
	],
});
