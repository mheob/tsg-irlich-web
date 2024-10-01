import { RiTeamLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { maxLengthRule } from '@/shared/validation-rules';

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
				// minLengthRule(rule, 2, 'Der Name'),
				maxLengthRule(rule, 64, 'Der Name'),
			],
		}),

		defineField({
			title: 'E-Mail',
			name: 'email',
			type: 'email',
			description: 'Die E-Mail-Adresse der Rolle. Sie muss NUR bei Vorstandsämtern gesetzt werden!',
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
