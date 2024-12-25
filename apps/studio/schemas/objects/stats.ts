import { defineField } from '@sanity-typed/types';
import { RiLinksLine } from 'react-icons/ri';

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
			validation: Rule => [
				Rule.required().error('Die Beschriftung ist erforderlich.'),
				Rule.min(2).warning('Die Beschriftung sollte mindestens 2 Zeichen lang sein.'),
			],
		}),
		defineField({
			title: 'Wert',
			name: 'value',
			type: 'string',
			validation: Rule => [Rule.required().error('Der Wert ist erforderlich.')],
		}),
		defineField({
			title: 'Suffix (optional, z.B. "+")',
			name: 'suffix',
			type: 'string',
		}),
	],
	validation: Rule => [Rule.required().error('Der Suffix ist erforderlich.')],
});

export default stats;
