import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';

const pricingCardFields = [
	...getDefaultPageFieldsWithGroup(),

	defineField({
		title: 'Preis',
		name: 'price',
		type: 'number',
	}),

	defineField({
		title: 'Titel Vorteile',
		name: 'benefitsTitle',
		type: 'string',
	}),

	defineField({
		title: 'Vorteile',
		name: 'benefits',
		type: 'array',
		of: [{ type: 'string' }],
	}),

	defineField({
		title: 'Button Text',
		name: 'cta',
		type: 'string',
	}),
];

export const pricingField = defineField({
	title: 'Preistabelle',
	name: 'pricingSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'pricing',
	fields: [
		...getDefaultPageFieldsWithGroup(),

		defineField({
			title: 'Preistabelle Jugendliche',
			name: 'pricingYouth',
			type: 'object',
			fields: pricingCardFields,
		}),

		defineField({
			title: 'Preistabelle Familie',
			name: 'pricingFamily',
			type: 'object',
			fields: pricingCardFields,
		}),

		defineField({
			title: 'Preistabelle Erwachsene',
			name: 'pricingAdult',
			type: 'object',
			fields: pricingCardFields,
		}),
	],
});
