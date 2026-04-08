// oxlint-disable no-magic-numbers

import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const visionField = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		defineField({
			description: 'Text, der auf dem Call to Action Button angezeigt wird.',
			name: 'cta',
			title: 'Button Text',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(5).error('Der "Button Text" muss mindestens 5 Zeichen lang sein'),
				Rule.max(25).warning('Der "Button Text" sollte nicht länger als 25 Zeichen sein'),
			],
		}),
	],
	group: 'vision',
	icon: RiLinksLine,
	name: 'visionSection',
	title: 'Vision',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Vision ist erforderlich')],
});
