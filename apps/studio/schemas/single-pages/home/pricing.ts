import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

const pricingCardFields = [
	...getDefaultPageSectionFieldsWithGroup(),

	defineField({
		title: 'Preis',
		name: 'price',
		type: 'number',
		validation: (Rule) => [Rule.required().error('Preis ist erforderlich')],
	}),

	defineField({
		title: 'Titel Vorteile',
		name: 'benefitsTitle',
		type: 'string',
		validation: (Rule) => [Rule.required().error('Titel Vorteile ist erforderlich')],
	}),

	defineField({
		title: 'Vorteile',
		name: 'benefits',
		type: 'array',
		of: [{ type: 'string' }],
		validation: (Rule) => [Rule.required().error('Vorteile sind erforderlich')],
	}),

	defineField({
		title: 'Button Text',
		name: 'cta',
		type: 'string',
		validation: (Rule) => [Rule.required().error('Button Text ist erforderlich')],
	}),
];

export const pricingField = defineField({
	title: 'Preistabelle',
	name: 'pricingSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'pricing',
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		defineField({
			title: 'Preistabelle Jugendliche',
			name: 'pricingYouth',
			type: 'object',
			fields: pricingCardFields,
			validation: (Rule) => [Rule.required().error('Preistabelle Jugendliche ist erforderlich')],
		}),

		defineField({
			title: 'Preistabelle Familie',
			name: 'pricingFamily',
			type: 'object',
			fields: pricingCardFields,
			validation: (Rule) => [Rule.required().error('Preistabelle Familie ist erforderlich')],
		}),

		defineField({
			title: 'Preistabelle Erwachsene',
			name: 'pricingAdult',
			type: 'object',
			fields: pricingCardFields,
			validation: (Rule) => [Rule.required().error('Preistabelle Erwachsene ist erforderlich')],
		}),
	],
	validation: (Rule) => [Rule.required().error('Preistabelle ist erforderlich')],
});
