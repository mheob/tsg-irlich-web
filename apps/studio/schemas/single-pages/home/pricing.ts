import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';
import { requiredRule } from '@/shared/validation-rules';

const pricingCardFields = [
	...getDefaultPageFieldsWithGroup(),

	defineField({
		title: 'Preis',
		name: 'price',
		type: 'number',
		validation: rule => [requiredRule(rule, 'Preis')],
	}),

	defineField({
		title: 'Titel Vorteile',
		name: 'benefitsTitle',
		type: 'string',
		validation: rule => [requiredRule(rule, 'Titel Vorteile')],
	}),

	defineField({
		title: 'Vorteile',
		name: 'benefits',
		type: 'array',
		of: [{ type: 'string' }],
		validation: rule => [requiredRule(rule, 'Vorteile')],
	}),

	defineField({
		title: 'Button Text',
		name: 'cta',
		type: 'string',
		validation: rule => [requiredRule(rule, 'Button Text')],
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
			validation: rule => [requiredRule(rule, 'Preistabelle Jugendliche')],
		}),

		defineField({
			title: 'Preistabelle Familie',
			name: 'pricingFamily',
			type: 'object',
			fields: pricingCardFields,
			validation: rule => [requiredRule(rule, 'Preistabelle Familie')],
		}),

		defineField({
			title: 'Preistabelle Erwachsene',
			name: 'pricingAdult',
			type: 'object',
			fields: pricingCardFields,
			validation: rule => [requiredRule(rule, 'Preistabelle Erwachsene')],
		}),
	],
	validation: rule => [requiredRule(rule, 'Preistabelle')],
});
