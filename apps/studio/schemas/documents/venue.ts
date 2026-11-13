// oxlint-disable no-magic-numbers

import { RiMap2Line } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { postalAddressFields } from '@/shared/fields/postal-address';

import extendedImage from '../objects/extended-image';

/** One row of the opening hours of a clubhouse, such as „Dienstag bis Freitag · ab 17 Uhr“. */
const openingHoursRow = defineArrayMember({
	fields: [
		defineField({
			description: 'Zum Beispiel „Dienstag bis Freitag“.',
			name: 'days',
			title: 'Tage',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Die Tage sind erforderlich')],
		}),
		defineField({
			description: 'Zum Beispiel „ab 17 Uhr“.',
			name: 'time',
			title: 'Zeit',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Die Zeit ist erforderlich')],
		}),
	],
	name: 'venueOpeningHours',
	preview: { select: { subtitle: 'time', title: 'days' } },
	title: 'Zeitraum',
	type: 'object',
});

const venue = defineType({
	fields: [
		defineField({
			name: 'title',
			title: 'Name',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(3).error('Der Name muss mindestens 3 Zeichen lang sein'),
				Rule.max(64).warning('Der Name sollte nicht länger als 64 Zeichen sein'),
			],
		}),

		defineField({
			description: 'Eine kurze Beschreibung der Sportstätte. Erscheint auf der Sportstättenseite.',
			name: 'description',
			title: 'Beschreibung',
			type: 'simpleBlockContent',
			validation: (Rule) => [Rule.required().error('Die Beschreibung ist erforderlich')],
		}),

		defineField({
			description: 'Art der Sportstätte.',
			name: 'type',
			options: {
				list: [
					{ title: 'Sporthalle (1 Feld)', value: 'hall-1' },
					{ title: 'Sporthalle (2 Felder)', value: 'hall-2' },
					{ title: 'Sporthalle (3 Felder)', value: 'hall-3' },
					{ title: 'Aschenplatz', value: 'cinder' },
					{ title: 'Hybridrasenplatz', value: 'hybrid' },
					{ title: 'Kunstrasenplatz', value: 'artificial-turf' },
					{ title: 'Rasenplatz', value: 'grass' },
					{ title: 'Vereinsheim', value: 'clubhouse' },
				],
			},
			title: 'Art',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Die "Art der Sportstätte" ist erforderlich')],
		}),

		defineField({
			...extendedImage,
			name: 'mainImage',
			title: 'Image',
		}),

		defineField({
			description:
				'Was die Sportstätte bietet, ein kurzer Punkt je Zeile, etwa „Flutlicht für Training und Spiele“. Erscheint auf der Sportstättenseite, wenn die Sportstätte dort im Bereich „Heimat“ steht.',
			name: 'features',
			of: [
				defineArrayMember({
					type: 'string',
					validation: (Rule) => [
						Rule.max(48).warning('Ein Punkt sollte nicht länger als 48 Zeichen sein'),
					],
				}),
			],
			title: 'Ausstattung',
			type: 'array',
			validation: (Rule) => [
				Rule.unique().error('Jeden Punkt nur einmal nennen'),
				Rule.max(8).warning('Mehr als 8 Punkte werden schnell unübersichtlich'),
			],
		}),

		defineField({
			description: 'Wann das Vereinsheim geöffnet hat, eine Zeile je Zeitraum.',
			hidden: ({ document }) => document?.type !== 'clubhouse',
			name: 'openingHours',
			of: [openingHoursRow],
			title: 'Öffnungszeiten',
			type: 'array',
		}),

		defineField({
			description: 'Die Adresse zur Sportstätte.',
			fields: [
				defineField({
					name: 'name',
					title: 'Name des Standortes',
					type: 'string',
					validation: (Rule) => [
						Rule.required().min(2).error('Der Name muss mindestens 2 Zeichen lang sein'),
						Rule.max(64).warning('Der Name sollte nicht länger als 64 Zeichen sein'),
					],
				}),

				...postalAddressFields,
			],
			name: 'location',
			title: 'Standort',
			type: 'object',
		}),
	],
	icon: RiMap2Line,
	name: 'venue',
	title: 'Sportstätte',
	type: 'document',
});

export default venue;
