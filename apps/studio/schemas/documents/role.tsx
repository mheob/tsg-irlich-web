// oxlint-disable no-magic-numbers

import { RiTeamLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

const role = defineType({
	fields: [
		defineField({
			description:
				'Die Rolle oder Funktion der Person (z.B. Vorstand Finanzen oder Übungsleiterin).',
			name: 'title',
			title: 'Name',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(2).error('Der Name muss mindestens 2 Zeichen lang sein'),
				Rule.max(64).warning('Der Name sollte nicht länger als 64 Zeichen sein'),
			],
		}),

		defineField({
			description: 'Die E-Mail-Adresse der Rolle. Sie muss NUR bei Vorstandsämtern gesetzt werden!',
			name: 'email',
			title: 'E-Mail',
			type: 'email',
		}),
	],
	icon: RiTeamLine,
	name: 'role',
	orderings: [
		{
			by: [{ direction: 'asc', field: 'title' }],
			name: 'titleAsc',
			title: 'nach Name - aufsteigend',
		},

		{
			by: [{ direction: 'desc', field: 'title' }],
			name: 'titleDesc',
			title: 'nach Name - absteigend',
		},
	],
	title: 'Rolle / Funktion',
	type: 'document',
});

export default role;
