import { defineArrayMember, defineField, defineType } from '@sanity-typed/types';
import { RiBookletLine, RiLinksLine } from 'react-icons/ri';

import { content, general, meta } from '@/shared/field-groups';
import {
	defaultPageFields,
	getDefaultPageFieldsWithGroup,
	getHiddenSlugField,
	subTitleField,
	titleField,
} from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { statsField } from '@/shared/sections/stats';
import { visionField } from '@/shared/sections/vision';

const pricingCardFields = [
	...defaultPageFields,

	defineField({
		title: 'Preis',
		name: 'price',
		type: 'number',
		validation: Rule => Rule.required().error('Preis ist erforderlich'),
	}),

	defineField({
		title: 'Titel Vorteile',
		name: 'benefitsTitle',
		type: 'string',
		validation: Rule => Rule.required().error('Titel Vorteile ist erforderlich'),
	}),

	defineField({
		title: 'Vorteile',
		name: 'benefits',
		type: 'array',
		of: [defineArrayMember({ type: 'string' })],
		validation: Rule => Rule.required().error('Vorteile sind erforderlich'),
	}),

	defineField({
		title: 'Button Text',
		name: 'cta',
		type: 'string',
		validation: Rule => Rule.required().error('Button Text ist erforderlich'),
	}),
];

const homePage = defineType({
	title: 'Home',
	name: 'home',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('home'),

		// general
		...defaultPageFields,

		// meta
		metaField,

		// content
		defineField({
			title: 'Merkmale',
			name: 'featureSection',
			type: 'object',
			icon: RiLinksLine,
			group: 'features',
			fields: [
				...getDefaultPageFieldsWithGroup(),

				defineField({
					title: 'Merkmale',
					name: 'features',
					type: 'array',
					// TODO: add icon name (string) from https://... (see: /apps/studio/schemas/documents/group.tsx:63)
					of: [
						defineArrayMember({
							title: 'Merkmal',
							name: 'feature',
							type: 'object',
							fields: [
								defineField({
									title: 'Title',
									name: 'title',
									type: 'string',
									description: 'Der Titel des Merkmals.',
									validation: Rule => [
										Rule.required().min(10).error('Der Titel muss mindestens 10 Zeichen lang sein'),
										Rule.max(65).warning('Der Titel sollte höchstens 65 Zeichen lang sein'),
									],
								}),

								defineField({
									title: 'Intro',
									name: 'intro',
									type: 'string',
									description: 'Die Beschreibung des Merkmals.',
									validation: Rule => [
										Rule.required()
											.min(10)
											.error('Die Beschreibung muss mindestens 10 Zeichen lang sein'),
										Rule.max(120).warning(
											'Die Beschreibung sollte höchstens 120 Zeichen lang sein',
										),
									],
								}),

								defineField({
									title: 'Icon',
									name: 'icon',
									type: 'string',
									description: (
										<>
											Name des Icons aus{' '}
											<a href="https://lucide.dev/icons/" rel="noreferrer noopener" target="_blank">
												lucide.dev/icons
											</a>
											.<br />
											In <kbd>CamelCase</kbd> geschrieben (z.B. <kbd>one-icon</kbd> --&gt;{' '}
											<kbd>OneIcon</kbd>).
										</>
									),
									validation: Rule => Rule.required().error('Das Icon ist erforderlich'),
								}),
							],
						}),
					],
					description: "Merkmale (USP's), die auf der Homepage angezeigt werden.",
					validation: Rule =>
						Rule.required()
							.min(4)
							.max(6)
							.error('Es müssen mindestens 4 und höchstens 6 Merkmale gewählt werden'),
				}),
			],
			validation: Rule => Rule.required().error('Merkmale sind erforderlich'),
		}),

		visionField,

		defineField({
			title: 'Gruppen',
			name: 'groupsSection',
			type: 'object',
			icon: RiLinksLine,
			group: 'groups',
			fields: [
				defineField({ ...titleField, group: undefined }),
				defineField({ ...subTitleField, group: undefined }),
			],
			validation: Rule => Rule.required().error('Gruppen sind erforderlich'),
		}),

		statsField,

		defineField({
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
					validation: Rule => Rule.required().error('Preistabelle Jugendliche ist erforderlich'),
				}),

				defineField({
					title: 'Preistabelle Familie',
					name: 'pricingFamily',
					type: 'object',
					fields: pricingCardFields,
					validation: Rule => Rule.required().error('Preistabelle Familie ist erforderlich'),
				}),

				defineField({
					title: 'Preistabelle Erwachsene',
					name: 'pricingAdult',
					type: 'object',
					fields: pricingCardFields,
					validation: Rule => Rule.required().error('Preistabelle Erwachsene ist erforderlich'),
				}),
			],
			validation: Rule => Rule.required().error('Preistabelle ist erforderlich'),
		}),

		defineField({
			title: 'Zeugnis / Referenz',
			name: 'testimonialSection',
			type: 'object',
			icon: RiLinksLine,
			group: 'testimonial',
			fields: [
				defineField({ ...titleField, group: undefined }),
				defineField({ ...subTitleField, group: undefined }),

				defineField({
					title: 'Zeugnis / Referenz',
					name: 'testimonials',
					type: 'array',
					of: [defineArrayMember({ type: 'reference', to: [{ type: 'testimonial' }] })],
					validation: Rule =>
						Rule.min(4)
							.error('Mindestens 4 "Zeugnis / Referenz" müssen vorhanden sein')
							.max(8)
							.error('Maximal 8 "Zeugnis / Referenz" dürfen gesetzt werden'),
				}),
			],
			validation: Rule => Rule.required().error('Zeugnis / Referenz ist erforderlich'),
		}),

		contactPersonsSectionField,

		defineField({
			title: 'News',
			name: 'newsSection',
			type: 'object',
			icon: RiLinksLine,
			group: 'news',
			fields: [...getDefaultPageFieldsWithGroup()],
			validation: Rule => Rule.required().error('News sind erforderlich'),
		}),
	],
	preview: {
		prepare: () => ({ title: 'Home' }),
	},
});

export default homePage;
