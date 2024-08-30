import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { maxLengthRule } from '@/shared/validation-rules';

const stats = defineField({
	title: 'Statistiken',
	name: 'stats',
	type: 'object',
	icon: RiLinksLine,
	fields: [
		{
			title: 'Beschriftung',
			name: 'title',
			type: 'string',
			validation: rule => [
				// minLengthRule(rule, 2, 'Die Beschriftung'),
				maxLengthRule(rule, 25, 'Die Beschriftung'),
			],
		},
		{
			title: 'Wert',
			name: 'value',
			type: 'string',
			// validation: rule => [requiredRule(rule, 'Der Wert')],
		},
	],
});

export default stats;
