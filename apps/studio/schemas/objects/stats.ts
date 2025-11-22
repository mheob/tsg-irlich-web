import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

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
				Rule.required().min(2).error('Die Beschriftung muss mindestens 2 Zeichen lang sein'),
				Rule.max(25).warning('Die Beschriftung sollte nicht länger als 25 Zeichen sein'),
			],
		}),
		defineField({
			title: 'Präfix (optional, z.B. ">")',
			name: 'prefix',
			type: 'string',
		}),
		defineField({
			title: 'Wert',
			name: 'value',
			type: 'number',
			validation: Rule => [Rule.required().error('Der Wert ist erforderlich')],
		}),
		defineField({
			title: 'Suffix (optional, z.B. "+")',
			name: 'suffix',
			type: 'string',
		}),
	],
	validation: Rule => [Rule.required().error('Die Statistik ist erforderlich')],
});

export default stats;
