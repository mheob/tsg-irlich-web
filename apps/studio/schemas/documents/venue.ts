import { RiMap2Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { maxLengthRule } from '@/shared/validation-rules';

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
			validation: rule => [
				// minLengthRule(rule, 3, 'Der Name'),
				maxLengthRule(rule, 64, 'Der Name'),
			],
		}),

		defineField({
			title: 'Beschreibung',
			name: 'description',
			type: 'simpleBlockContent',
			description: 'Eine kurze Beschreibung der Sportstätte.',
			// validation: rule => [requiredRule(rule, 'Die Beschreibung')],
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
			// validation: rule => [requiredRule(rule, 'Die Art')],
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
					validation: rule => [
						// minLengthRule(rule, 2, 'Der Name'),
						maxLengthRule(rule, 64, 'Der Name'),
					],
				}),

				defineField({
					title: 'Straße',
					name: 'street',
					type: 'string',
					validation: rule => [
						// minLengthRule(rule, 2, 'Die Straße'),
						maxLengthRule(rule, 128, 'Die Straße'),
					],
				}),

				defineField({
					title: 'Hausnummer',
					name: 'houseNumber',
					type: 'string',
					validation: rule => [
						// minLengthRule(rule, 1, 'Die Hausnummer'),
						maxLengthRule(rule, 8, 'Die Hausnummer'),
					],
				}),

				defineField({
					title: 'Postleitzahl',
					name: 'zipCode',
					type: 'string',
					// validation: rule => [
					// 	exactLengthRule(rule, 5, 'Die Postleitzahl muss genau 5 Zeichen lang sein.', {
					// 		type: 'error',
					// 	}),
					// ],
				}),

				defineField({
					title: 'Stadt',
					name: 'city',
					type: 'string',
					validation: rule => [
						// minLengthRule(rule, 3, 'Die Stadt'),
						maxLengthRule(rule, 64, 'Die Stadt'),
					],
				}),
			],
		}),
	],
});

export default venue;
