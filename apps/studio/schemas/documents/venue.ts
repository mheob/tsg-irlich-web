import { RiMap2Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import extendedImage from '../objects/extended-image';

const venue = defineType({
	title: 'Sportstätte',
	name: 'venue',
	type: 'document',
	icon: RiMap2Line,
	fields: [
		defineField({
			title: 'Name',
			name: 'title',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(3).error('Der Name muss mindestens 3 Zeichen lang sein'),
				Rule.max(64).warning('Der Name sollte nicht länger als 64 Zeichen sein'),
			],
		}),

		defineField({
			title: 'Beschreibung',
			name: 'description',
			type: 'simpleBlockContent',
			description: 'Eine kurze Beschreibung der Sportstätte.',
			validation: (Rule) => [Rule.required().error('Die Beschreibung ist erforderlich')],
		}),

		defineField({
			title: 'Art',
			name: 'type',
			type: 'string',
			description: 'Art der Sportstätte.',
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
			validation: (Rule) => [Rule.required().error('Die "Art der Sportstätte" ist erforderlich')],
		}),

		defineField({
			...extendedImage,
			title: 'Image',
			name: 'mainImage',
		}),

		defineField({
			title: 'Standort',
			name: 'location',
			type: 'object',
			description: 'Die Adresse zur Sportstätte.',
			fields: [
				defineField({
					title: 'Name des Standortes',
					name: 'name',
					type: 'string',
					validation: (Rule) => [
						Rule.required().min(2).error('Der Name muss mindestens 2 Zeichen lang sein'),
						Rule.max(64).warning('Der Name sollte nicht länger als 64 Zeichen sein'),
					],
				}),

				defineField({
					title: 'Straße',
					name: 'street',
					type: 'string',
					validation: (Rule) => [
						Rule.required().min(2).error('Die Straße muss mindestens 2 Zeichen lang sein'),
						Rule.max(128).warning('Die Straße sollte nicht länger als 128 Zeichen sein'),
					],
				}),

				defineField({
					title: 'Hausnummer',
					name: 'houseNumber',
					type: 'string',
					validation: (Rule) => [
						Rule.required().min(1).error('Die Hausnummer muss mindestens 1 Zeichen lang sein'),
						Rule.max(8).warning('Die Hausnummer sollte nicht länger als 8 Zeichen sein'),
					],
				}),

				defineField({
					title: 'Postleitzahl',
					name: 'zipCode',
					type: 'string',
					validation: (Rule) => [
						Rule.regex(/^\d{5}$/).error('Die Postleitzahl muss aus genau 5 Zahlen bestehen'),
					],
				}),

				defineField({
					title: 'Stadt',
					name: 'city',
					type: 'string',
					validation: (Rule) => [
						Rule.required().min(3).error('Die Stadt muss mindestens 3 Zeichen lang sein'),
						Rule.max(64).warning('Die Stadt sollte nicht länger als 64 Zeichen sein'),
					],
				}),
			],
		}),
	],
});

export default venue;
