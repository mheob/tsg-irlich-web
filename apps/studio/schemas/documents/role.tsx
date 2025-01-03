import { RiTeamLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

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
			validation: Rule => [
				Rule.required().min(2).error('Der Name muss mindestens 2 Zeichen lang sein'),
				Rule.max(64).warning('Der Name sollte nicht länger als 64 Zeichen sein'),
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
