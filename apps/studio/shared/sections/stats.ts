import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getMaxLengthRule, getMinLengthRule } from '@/shared/validation-rules';

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
				getMinLengthRule(rule, 3, 'Statistiken'),
				getMaxLengthRule(rule, 4, 'Statistiken'),
			],
		}),
	],
});
