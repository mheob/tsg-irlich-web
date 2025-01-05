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
				Rule.required().min(2).error('Name muss mindestens 2 Zeichen lang sein'),
				Rule.max(64).warning('Name sollte nicht länger als 64 Zeichen sein'),
			],
		}),

		defineField({
			title: 'E-Mail',
			name: 'email',
			type: 'email',
			description: 'Die E-Mail-Adresse der Gruppe bzw. Mannschaft.',
			validation: Rule => [Rule.required().error('E-Mail ist erforderlich')],
		}),

		defineField({
			title: 'Beschreibung',
			name: 'description',
			type: 'simpleBlockContent',
			description: 'Eine Beschreibung der Gruppe / Mannschaft.',
			validation: Rule => [Rule.required().error('Beschreibung ist erforderlich')],
		}),

		defineField({
			title: 'Abteilung',
			name: 'department',
			type: 'string',
			description: 'Die Abteilung der Gruppe / Mannschaft.',
			options: {
				layout: 'dropdown',
				list: [
					{ title: 'Breitensport', value: 'massSports' },
					{ title: 'Fußball', value: 'soccer' },
					{ title: 'PR-Team', value: 'pr' },
					{ title: 'Vorstand', value: 'board' },
				],
			},
			validation: Rule => [Rule.required().error('Abteilung ist erforderlich')],
		}),

		// TODO: define a strategy for icons
		defineField({
			title: 'Icon',
			name: 'icon',
			type: 'string',
			description: (
				<>
					Wir nutzen die{' '}
					<a
						href="https://www.dosb.de/piktogramme/download"
						rel="noreferrer noopener"
						target="_blank"
					>
						Sportdeutschland-Piktogramme
					</a>
					.<br />
					Wird bspw. auf der Start- und Gruppen-Übersichts-Seite angezeigt.
				</>
			),
			options: {
				list: [
					{ title: 'Team Linie', value: 'RiTeamLine' },
					{ title: 'Layout Spalte Zeile', value: 'RiLayoutColumnLine' },
				],
			},
			validation: Rule => [Rule.required().error('Icon ist erforderlich')],
		}),

		defineField({
			title: 'Hintergrundbild',
			name: 'image',
			type: 'extendedImage',
			description:
				'Das Hintergrundbild wird z.B. auf der Gruppen-Übersicht angezeigt, wenn man über eine Gruppe hovered.',
			validation: Rule => [Rule.required().error('Bild ist erforderlich')],
		}),

		defineField({
			title: 'Bildergalerie',
			name: 'images',
			type: 'array',
			of: [{ type: 'extendedImage' }],
			description: 'Es können bis zu drei Bilder ausgewählt werden.',
			validation: Rule => [
				Rule.min(1).error('Es muss mindestens ein Bild ausgewählt werden.'),
				Rule.max(3).error('Es dürfen maximal drei Bilder ausgewählt werden.'),
			],
		}),

		defineField({
			title: 'Trainingszeiten und -orte',
			name: 'trainingTimes',
			type: 'array',
			of: [{ type: 'trainingTime' }],
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
