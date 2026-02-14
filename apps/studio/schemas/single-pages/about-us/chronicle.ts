import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const chronicleField = defineField({
	title: 'Chronik',
	name: 'chronicleSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'chronicle',
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		defineField({
			title: 'Chronik',
			name: 'chronicleCategories',
			type: 'array',
			of: [{ type: 'imageCard' }],
			description: 'Die Abschnitte der Chronik.',
			validation: (Rule) => [
				Rule.required().length(3).error('Es müssen genau 3 Abschnitte gewählt werden'),
			],
		}),
	],
	validation: (Rule) => [Rule.required().error('Die Chronik ist erforderlich')],
});
