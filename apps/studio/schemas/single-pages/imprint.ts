import { RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { addressField, emailField } from '@/shared/fields/contact';
import { defaultHeroFields, getHiddenSlugField, introField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const imprintPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('impressum'),

		// General
		...defaultHeroFields,

		// Meta
		metaField,

		// Content
		defineField({
			...introField,
			group: 'content',
			type: 'simpleBlockContent',
		}),
		defineField({
			...addressField,
			group: 'content',
			type: 'simpleBlockContent',
		}),
		defineField({
			group: 'content',
			name: 'registerCourt',
			title: 'Registergericht',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Registergericht ist erforderlich')],
		}),
		defineField({
			group: 'content',
			name: 'registerNo',
			title: 'Registernummer',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Registernummer ist erforderlich')],
		}),
		defineField({
			group: 'content',
			name: 'represented',
			title: 'Vertreten durch',
			type: 'simpleBlockContent',
			validation: (Rule) => [Rule.required().error('Feld "Vertreten durch" ist erforderlich')],
		}),
		defineField({
			...emailField,
			group: 'content',
		}),
		defineField({
			group: 'content',
			name: 'contactForm',
			title: 'Kontaktformular',
			type: 'internalLink',
			validation: (Rule) => [Rule.required().error('Link zum Kontaktformular ist erforderlich')],
		}),
		defineField({
			group: 'content',
			name: 'responsible',
			title: 'Redaktionell verantwortlich',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Redaktionell verantwortlich ist erforderlich')],
		}),
		defineField({
			group: 'content',
			name: 'consumerDisputeResolution',
			title: 'Verbraucherstreitbeilegung/Universalschlichtungsstelle',
			type: 'string',
			validation: (Rule) => [
				Rule.required().error(
					'Verbraucherstreitbeilegung/Universalschlichtungsstelle ist erforderlich',
				),
			],
		}),
		defineField({
			group: 'content',
			name: 'technicalQuestionsName',
			title: 'Name Technischer Ansprechpartner',
			type: 'string',
			validation: (Rule) => [
				Rule.required().error('Name Technischer Ansprechpartner ist erforderlich'),
			],
		}),
		defineField({
			group: 'content',
			name: 'technicalQuestionsEmail',
			title: 'E-Mail Technischer Ansprechpartner',
			type: 'email',
			validation: (Rule) => [
				Rule.required().error('E-Mail Technischer Ansprechpartner ist erforderlich'),
			],
		}),
		defineField({
			group: 'content',
			name: 'support',
			title: 'Freundliche Unterstützung durch',
			type: 'simpleBlockContent',
			validation: (Rule) => [
				Rule.required().error('Freundliche Unterstützung durch ist erforderlich'),
			],
		}),
		defineField({
			group: 'content',
			name: 'credits',
			title: 'Bildnachweise',
			type: 'simpleBlockContent',
			validation: (Rule) => [Rule.required().error('Bildnachweis ist erforderlich')],
		}),
	],
	groups: [general, meta, content],
	icon: RiSettings5Line,
	name: 'imprint',
	preview: {
		prepare: () => ({ title: 'Impressum' }),
	},
	title: 'Impressum',
	type: 'document',
});

export default imprintPage;
