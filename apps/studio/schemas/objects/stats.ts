// oxlint-disable no-magic-numbers

import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const stats = defineField({
	fields: [
		defineField({
			name: 'title',
			title: 'Beschriftung',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(2).error('Die Beschriftung muss mindestens 2 Zeichen lang sein'),
				Rule.max(25).warning('Die Beschriftung sollte nicht länger als 25 Zeichen sein'),
			],
		}),
		defineField({
			name: 'prefix',
			title: 'Präfix (optional, z.B. ">")',
			type: 'string',
		}),
		defineField({
			name: 'value',
			title: 'Wert',
			type: 'number',
			validation: (Rule) => [Rule.required().error('Der Wert ist erforderlich')],
		}),
		defineField({
			name: 'suffix',
			title: 'Suffix (optional, z.B. "+")',
			type: 'string',
		}),
	],
	icon: RiLinksLine,
	name: 'stats',
	title: 'Statistiken',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Die Statistik ist erforderlich')],
});

export default stats;
