import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { maxLengthRule } from '@/shared/validation-rules';

export const statsField = defineField({
	title: 'Statistiken',
	name: 'statsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'stats',
	fields: [
		defineField({
			title: 'Statistiken',
			name: 'groups',
			type: 'array',
			of: [{ type: 'stats' }],
			description: '',
			validation: rule => [
				// minLengthRule(rule, 3, 'Die Statistiken'),
				maxLengthRule(rule, 4, 'Die Statistiken'),
			],
		}),
	],
});
