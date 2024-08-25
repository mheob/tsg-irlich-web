import { RiMap2Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import {
	getExactLengthRule,
	getMaxLengthRule,
	getMinLengthRule,
	getRequiredRule,
} from '@/shared/validation-rules';

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
				getMinLengthRule(rule, 2, 'Bitte einen Namen eingeben.'),
				getMaxLengthRule(rule, 64, 'Der Name darf maximal 64 Zeichen lang sein.'),
			],
		}),

		defineField({
			title: 'Beschreibung',
			name: 'description',
			type: 'simpleBlockContent',
			description: 'Eine kurze Beschreibung der Sportstätte.',
			validation: rule => [getRequiredRule(rule, '"Beschreibung"')],
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
			validation: rule => [getRequiredRule(rule, '"Art"')],
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
						getMinLengthRule(rule, 2, 'Bitte einen Name des Standortes eingeben.'),
						getMaxLengthRule(rule, 64, 'Der Name darf maximal 64 Zeichen lang sein.'),
					],
				}),

				defineField({
					title: 'Straße',
					name: 'street',
					type: 'string',
					validation: rule => [
						getMinLengthRule(rule, 2, 'Bitte den Straßennamen eingeben.'),
						getMaxLengthRule(rule, 128, 'Die Straße darf maximal 128 Zeichen lang sein.'),
					],
				}),

				defineField({
					title: 'Hausnummer',
					name: 'houseNumber',
					type: 'string',
					validation: rule => [
						getMinLengthRule(rule, 1, 'Bitte die Hausnummer eingeben.'),
						getMaxLengthRule(rule, 8, 'Die Hausnummer darf maximal 16 Zeichen lang sein.'),
					],
				}),

				defineField({
					title: 'Postleitzahl',
					name: 'zipCode',
					type: 'string',
					validation: rule => [
						getExactLengthRule(rule, 5, 'Die Postleitzahl muss genau 5 Zeichen lang sein.'),
					],
				}),

				defineField({
					title: 'Stadt',
					name: 'city',
					type: 'string',
					validation: rule => [
						getMinLengthRule(rule, 2, 'Bitte den Stadtname eingeben.'),
						getMaxLengthRule(rule, 64, 'Die Stadt darf maximal 64 Zeichen lang sein.'),
					],
				}),
			],
		}),
	],
});

export default venue;
