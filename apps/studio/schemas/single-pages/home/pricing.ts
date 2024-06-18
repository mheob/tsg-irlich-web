import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/general-fields';

const pricingField = defineField({
	title: 'Preistabelle',
	name: 'pricingSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'pricing',
	fields: [
		...getDefaultPageFieldsWithGroup(),

		defineField({
			title: 'Preistabelle Passiv',
			name: 'pricingPassive',
			type: 'object',
			fields: [
				...getDefaultPageFieldsWithGroup(),

				defineField({
					title: 'Preis',
					name: 'pricingPassivePrice',
					type: 'number',
				}),

				defineField({
					title: 'Titel Vorteile',
					name: 'pricingPassiveBenefitsTitle',
					type: 'string',
				}),

				defineField({
					title: 'Vorteile',
					name: 'pricingPassiveBenefits',
					type: 'text',
				}),

				defineField({
					title: 'Button Text',
					name: 'pricingPassiveCta',
					type: 'string',
				}),
			],
		}),
		defineField({
			title: 'Preistabelle Familie',
			name: 'pricingFamily',
			type: 'object',
			fields: [
				...getDefaultPageFieldsWithGroup(),

				defineField({
					title: 'Preis',
					name: 'pricingFamilyPrice',
					type: 'number',
				}),

				defineField({
					title: 'Titel Vorteile',
					name: 'pricingFamilyBenefitsTitle',
					type: 'string',
				}),

				defineField({
					title: 'Vorteile',
					name: 'pricingFamilyBenefits',
					type: 'text',
				}),

				defineField({
					title: 'Button Text',
					name: 'pricingFamilyCta',
					type: 'string',
				}),
			],
		}),
		defineField({
			title: 'Preistabelle Aktiv',
			name: 'pricingActive',
			type: 'object',
			fields: [
				...getDefaultPageFieldsWithGroup(),

				defineField({
					title: 'Preis',
					name: 'pricingActivePrice',
					type: 'number',
				}),

				defineField({
					title: 'Titel Vorteile',
					name: 'pricingActiveBenefitsTitle',
					type: 'string',
				}),

				defineField({
					title: 'Vorteile',
					name: 'pricingActiveBenefits',
					type: 'text',
				}),

				defineField({
					title: 'Button Text',
					name: 'pricingActiveCta',
					type: 'string',
				}),
			],
		}),
	],
});

export default pricingField;
