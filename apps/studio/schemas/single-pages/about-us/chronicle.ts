import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const chronicleField = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		defineField({
			description: 'Die Abschnitte der Chronik.',
			name: 'chronicleCategories',
			of: [{ type: 'imageCard' }],
			title: 'Chronik',
			type: 'array',
			validation: (Rule) => [
				Rule.required().length(3).error('Es müssen genau 3 Abschnitte gewählt werden'),
			],
		}),
	],
	group: 'chronicle',
	icon: RiLinksLine,
	name: 'chronicleSection',
	title: 'Chronik',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Die Chronik ist erforderlich')],
});
