import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const visionField = defineField({
	title: 'Vision',
	name: 'visionSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'vision',
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		defineField({
			title: 'Button Text',
			name: 'cta',
			type: 'string',
			description: 'Text, der auf dem Call to Action Button angezeigt wird.',
			validation: Rule => [
				Rule.required().min(5).error('Der "Button Text" muss mindestens 5 Zeichen lang sein'),
				Rule.max(25).warning('Der "Button Text" sollte nicht länger als 25 Zeichen sein'),
			],
		}),
	],
	validation: Rule => [Rule.required().error('Vision ist erforderlich')],
});
