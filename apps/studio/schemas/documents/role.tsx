import { RiTeamLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { getMaxLengthRule, getMinLengthRule } from '@/shared/validation-rules';

const role = defineType({
	title: 'Rolle / Funktion',
	name: 'role',
	type: 'document',
	icon: RiTeamLine,
	fields: [
		defineField({
			title: 'Name',
			name: 'title',
			type: 'string',
			description:
				'Die Rolle oder Funktion der Person (z.B. Vorstand Finanzen oder Übungsleiterin).',
			validation: rule => [
				getMinLengthRule(rule, 2, 'Bitte einen Namen eingeben.'),
				getMaxLengthRule(rule, 64, 'Der Name darf maximal 64 Zeichen lang sein.'),
			],
		}),
	],
	orderings: [
		{
			title: 'nach Name - aufsteigend',
			name: 'titleAsc',
			by: [{ field: 'title', direction: 'asc' }],
		},
		{
			title: 'nach Name - absteigend',
			name: 'titleDesc',
			by: [{ field: 'title', direction: 'desc' }],
		},
	],
});

export default role;
