import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getMaxLengthRule, getMinLengthRule, getRequiredRule } from '@/shared/validation-rules';

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
				getMinLengthRule(rule, 2, 'Beschriftung'),
				getMaxLengthRule(rule, 25, 'Beschriftung'),
			],
		},
		{
			title: 'Wert',
			name: 'value',
			type: 'string',
			validation: rule => [getRequiredRule(rule, 'Wert')],
		},
	],
});

export default stats;
