import { RiTeamLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { getMaxLengthRule, getMinLengthRule, getRequiredRule } from '@/shared/validation-rules';

const group = defineType({
	title: 'Gruppe / Mannschaft',
	name: 'group',
	type: 'document',
	icon: RiTeamLine,
	fields: [
		defineField({
			title: 'Name',
			name: 'title',
			type: 'string',
			validation: rule => [
				getMinLengthRule(rule, 2, 'Bitte einen Namen eingeben.'),
				getMaxLengthRule(rule, 64, 'Der Name darf maximal 64 Zeichen lang sein.'),
			],
		}),

		defineField({
			title: 'Ist eine Sportgruppe',
			name: 'isSportGroup',
			type: 'boolean',
			description: 'Wenn "Ja", wird die Gruppe bei den Sportgruppen angezeigt.',
			initialValue: true,
		}),

		defineField({
			title: 'Icon',
			name: 'icon',
			type: 'string',
			description: (
				<>
					Name des Icons aus{' '}
					<a
						href="https://react-icons.github.io/react-icons"
						rel="noreferrer noopener"
						target="_blank"
					>
						react-icons.github.io/react-icons
					</a>
					.<br />
					Wird bspw. auf der Startseite angezeigt.
				</>
			),
			options: {
				list: [
					{ title: 'Team Linie', value: 'RiTeamLine' },
					{ title: 'Layout Spalte Zeile', value: 'RiLayoutColumnLine' },
				],
			},
			validation: rule => [getRequiredRule(rule, '"Icon"')],
		}),

		defineField({
			title: 'Bild',
			name: 'image',
			type: 'extendedImage',
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

export default group;
