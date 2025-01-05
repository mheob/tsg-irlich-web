import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

export const statsField = defineField({
	title: 'Statistiken',
	name: 'statsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'stats',
	fields: [
		defineField({
			title: 'Statistiken',
			name: 'stats',
			type: 'array',
			of: [{ type: 'stats' }],
			description: '',
			validation: Rule => [
				Rule.required().min(3).error('Mindestens 3 Statistiken müssen vorhanden sein'),
				Rule.max(4).error('Maximal 4 Statistiken dürfen gesetzt werden'),
			],
		}),
	],
	validation: Rule => [Rule.required().error('Statistiken sind erforderlich')],
});
