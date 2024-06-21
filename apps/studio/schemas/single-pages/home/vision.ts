import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';
import { getMaxLengthRule, getMinLengthRule } from '@/shared/validation-rules';

export const visionField = defineField({
	title: 'Vision',
	name: 'visionSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'vision',
	fields: [
		...getDefaultPageFieldsWithGroup(),

		defineField({
			title: 'Button Text',
			name: 'cta',
			type: 'string',
			description: 'Text, der auf dem Call to Action Button angezeigt wird.',
			validation: rule => [
				getMinLengthRule(rule, 5, '"Button Text"'),
				getMaxLengthRule(rule, 25, '"Button Text"'),
			],
		}),
	],
});
