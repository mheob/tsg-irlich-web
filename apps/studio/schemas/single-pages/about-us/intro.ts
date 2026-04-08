import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { removeGroupFromField, subTitleField, titleField } from '@/shared/fields/general';

export const introField = defineField({
	fields: [
		removeGroupFromField(titleField),
		removeGroupFromField(subTitleField),

		defineField({
			name: 'intro',
			title: 'Intro',
			type: 'blockContent',
			validation: (Rule) => [Rule.required().error('Intro ist erforderlich.')],
		}),

		defineField({
			description: 'Diese gewählten Bilder werden in der gewünschten Reihenfolge angezeigt.',
			name: 'images',
			of: [{ type: 'extendedImage' }],
			title: 'Bilder',
			type: 'array',
			validation: (Rule) => [
				Rule.required().length(3).error('Es müssen genau 3 Bilder ausgewählt werden.'),
			],
		}),
	],
	group: 'intro',
	icon: RiLinksLine,
	name: 'introSection',
	title: 'Intro',
	type: 'object',
});
