import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';
import { getMaxLengthRule, getMinLengthRule } from '@/shared/validation-rules';

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
				getMinLengthRule(rule, 2, 'Es muss mindestens ein Bild ausgewählt werden.'),
				getMaxLengthRule(rule, 4, 'Es dürfen maximal vier Bilder ausgewählt werden.'),
			],
		}),
	],
});
