import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

const pricingCardFields = [
	...getDefaultPageSectionFieldsWithGroup(),

	defineField({
		name: 'price',
		title: 'Preis',
		type: 'number',
		validation: (Rule) => [Rule.required().error('Preis ist erforderlich')],
	}),

	defineField({
		name: 'benefitsTitle',
		title: 'Titel Vorteile',
		type: 'string',
		validation: (Rule) => [Rule.required().error('Titel Vorteile ist erforderlich')],
	}),

	defineField({
		name: 'benefits',
		of: [{ type: 'string' }],
		title: 'Vorteile',
		type: 'array',
		validation: (Rule) => [Rule.required().error('Vorteile sind erforderlich')],
	}),

	defineField({
		name: 'cta',
		title: 'Button Text',
		type: 'string',
		validation: (Rule) => [Rule.required().error('Button Text ist erforderlich')],
	}),
];

export const pricingField = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		defineField({
			fields: pricingCardFields,
			name: 'pricingYouth',
			title: 'Preistabelle Jugendliche',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Preistabelle Jugendliche ist erforderlich')],
		}),

		defineField({
			fields: pricingCardFields,
			name: 'pricingFamily',
			title: 'Preistabelle Familie',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Preistabelle Familie ist erforderlich')],
		}),

		defineField({
			fields: pricingCardFields,
			name: 'pricingAdult',
			title: 'Preistabelle Erwachsene',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Preistabelle Erwachsene ist erforderlich')],
		}),
	],
	group: 'pricing',
	icon: RiLinksLine,
	name: 'pricingSection',
	title: 'Preistabelle',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Preistabelle ist erforderlich')],
});
