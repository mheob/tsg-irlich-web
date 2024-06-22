import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';
import { getLengthRule } from '@/shared/validation-rules';

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
			name: 'venues',
			type: 'array',
			of: [{ type: 'extendedImage' }],
			description: 'Diese gewählten Bilder werden in der gewünschten Reihenfolge angezeigt.',
			validation: rule => [getLengthRule(rule, 3, 'Es müssen genau 3 Bilder ausgewählt werden.')],
		}),
	],
});
