// oxlint-disable no-magic-numbers

import { RiMap2Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import extendedImage from '../objects/extended-image';

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
			description: 'Eine kurze Beschreibung der Sportstätte.',
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

				defineField({
					name: 'street',
					title: 'Straße',
					type: 'string',
					validation: (Rule) => [
						Rule.required().min(2).error('Die Straße muss mindestens 2 Zeichen lang sein'),
						Rule.max(128).warning('Die Straße sollte nicht länger als 128 Zeichen sein'),
					],
				}),

				defineField({
					name: 'houseNumber',
					title: 'Hausnummer',
					type: 'string',
					validation: (Rule) => [
						Rule.required().min(1).error('Die Hausnummer muss mindestens 1 Zeichen lang sein'),
						Rule.max(8).warning('Die Hausnummer sollte nicht länger als 8 Zeichen sein'),
					],
				}),

				defineField({
					name: 'zipCode',
					title: 'Postleitzahl',
					type: 'string',
					validation: (Rule) => [
						Rule.regex(/^\d{5}$/).error('Die Postleitzahl muss aus genau 5 Zahlen bestehen'),
					],
				}),

				defineField({
					name: 'city',
					title: 'Stadt',
					type: 'string',
					validation: (Rule) => [
						Rule.required().min(3).error('Die Stadt muss mindestens 3 Zeichen lang sein'),
						Rule.max(64).warning('Die Stadt sollte nicht länger als 64 Zeichen sein'),
					],
				}),
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
