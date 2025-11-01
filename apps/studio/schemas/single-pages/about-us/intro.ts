import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { removeGroupFromField, subTitleField, titleField } from '@/shared/fields/general';

export const introField = defineField({
	title: 'Intro',
	name: 'introSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'intro',
	fields: [
		removeGroupFromField(titleField),
		removeGroupFromField(subTitleField),

		defineField({
			title: 'Intro',
			name: 'intro',
			type: 'blockContent',
			validation: Rule => [Rule.required().error('Intro ist erforderlich.')],
		}),

		defineField({
			title: 'Bilder',
			name: 'images',
			type: 'array',
			of: [{ type: 'extendedImage' }],
			description: 'Diese gewählten Bilder werden in der gewünschten Reihenfolge angezeigt.',
			validation: Rule => [
				Rule.required().length(3).error('Es müssen genau 3 Bilder ausgewählt werden.'),
			],
		}),
	],
});
