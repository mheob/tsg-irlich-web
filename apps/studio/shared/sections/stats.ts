import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

export const statsField = defineField({
	title: 'Statistiken',
	name: 'stats',
	type: 'array',
	icon: RiLinksLine,
	group: 'stats',
	of: [{ type: 'stats' }],
	validation: (Rule) => [
		Rule.required().min(3).error('Mindestens 3 Statistiken müssen vorhanden sein'),
		Rule.max(4).error('Maximal 4 Statistiken dürfen gesetzt werden'),
	],
});
