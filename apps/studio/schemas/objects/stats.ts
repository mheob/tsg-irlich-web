import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { maxLengthRule } from '@/shared/validation-rules';

const stats = defineField({
	title: 'Statistiken',
	name: 'stats',
	type: 'object',
	icon: RiLinksLine,
	fields: [
		defineField({
			title: 'Beschriftung',
			name: 'title',
			type: 'string',
			validation: rule => [
				// minLengthRule(rule, 2, 'Die Beschriftung'),
				maxLengthRule(rule, 25, 'Die Beschriftung'),
			],
		}),
		defineField({
			title: 'Wert',
			name: 'value',
			type: 'string',
			// validation: rule => [requiredRule(rule, 'Der Wert')],
		}),
		defineField({
			title: 'Suffix (optional, z.B. "+")',
			name: 'suffix',
			type: 'string',
		}),
	],
});

export default stats;
