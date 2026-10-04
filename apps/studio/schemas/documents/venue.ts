// oxlint-disable no-magic-numbers

import { RiMap2Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { postalAddressFields } from '@/shared/fields/postal-address';

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
