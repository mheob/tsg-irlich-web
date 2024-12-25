import { defineField, defineType } from '@sanity-typed/types';
import { RiMap2Line } from 'react-icons/ri';

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
			validation: Rule => [
				Rule.required().min(3).error('Der Name muss mindestens 3 Zeichen lang sein.'),
				Rule.max(64).warning('Der Name sollte maximal 64 Zeichen lang sein.'),
			],
		}),

		defineField({
			title: 'Beschreibung',
			name: 'description',
			type: 'simpleBlockContent',
			description: 'Eine kurze Beschreibung der Sportstätte.',
			validation: Rule => Rule.required().error('Die Beschreibung ist erforderlich.'),
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
			validation: Rule => Rule.required().error('Die "Art der Sportstätte" ist erforderlich.'),
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
					validation: Rule => [
						Rule.required()
							.min(3)
							.error('Der Name des Standortes muss mindestens 3 Zeichen lang sein.'),
						Rule.max(64).warning('Der Name des Standortes sollte maximal 64 Zeichen lang sein.'),
					],
				}),

				defineField({
					title: 'Straße',
					name: 'street',
					type: 'string',
					validation: Rule => [
						Rule.required().min(3).error('Die Straße muss mindestens 3 Zeichen lang sein.'),
						Rule.max(64).warning('Die Straße sollte maximal 64 Zeichen lang sein.'),
					],
				}),

				defineField({
					title: 'Hausnummer',
					name: 'houseNumber',
					type: 'string',
					validation: Rule => [
						Rule.required().min(1).error('Die Hausnummer muss mindestens 1 Zeichen lang sein.'),
						Rule.max(8).warning('Die Hausnummer sollte maximal 8 Zeichen lang sein.'),
					],
				}),

				defineField({
					title: 'Postleitzahl',
					name: 'zipCode',
					type: 'string',
					validation: Rule =>
						Rule.length(5).error('Die Postleitzahl muss genau 5 Zeichen lang sein.'),
				}),

				defineField({
					title: 'Stadt',
					name: 'city',
					type: 'string',
					validation: Rule => [
						Rule.required().min(3).error('Die Stadt muss mindestens 3 Zeichen lang sein.'),
						Rule.max(64).warning('Die Stadt sollte maximal 64 Zeichen lang sein.'),
					],
				}),
			],
		}),
	],
});

export default venue;
