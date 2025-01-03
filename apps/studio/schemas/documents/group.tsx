import { RiTeamLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

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
			validation: Rule => [
				Rule.required().min(2).error('Der Name muss mindestens 2 Zeichen lang sein'),
				Rule.max(64).warning('Der Name sollte nicht länger als 64 Zeichen sein'),
			],
		}),

		defineField({
			title: 'E-Mail',
			name: 'email',
			type: 'email',
			description: 'Die E-Mail-Adresse der Gruppe bzw. Mannschaft.',
			validation: Rule => [Rule.required().error('Die E-Mail ist erforderlich')],
		}),

		defineField({
			title: 'Beschreibung',
			name: 'description',
			type: 'simpleBlockContent',
			description: 'Eine Beschreibung der Gruppe / Mannschaft.',
			validation: Rule => [Rule.required().error('Die Beschreibung ist erforderlich')],
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
			validation: Rule => [Rule.required().error('Das Icon ist erforderlich')],
		}),

		defineField({
			title: 'Bild',
			name: 'image',
			type: 'extendedImage',
			validation: Rule => [Rule.required().error('Das Bild ist erforderlich')],
		}),
	],
	validation: Rule => [Rule.required().error('Die Gruppe ist erforderlich')],
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
