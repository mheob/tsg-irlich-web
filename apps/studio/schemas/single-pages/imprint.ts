// cSpell:words impressum
import { RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { addressField, emailField } from '@/shared/fields/contact';
import { defaultHeroFields, getHiddenSlugField, introField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const imprintPage = defineType({
	title: 'Impressum',
	name: 'imprint',
	type: 'document',
	icon: RiSettings5Line,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('impressum'),

		// general
		...defaultHeroFields,

		// meta
		metaField,

		// content
		defineField({
			...introField,
			type: 'simpleBlockContent',
			group: 'content',
		}),
		defineField({
			...addressField,
			type: 'simpleBlockContent',
			group: 'content',
		}),
		defineField({
			title: 'Registergericht',
			name: 'registerCourt',
			type: 'string',
			group: 'content',
			validation: (Rule) => [Rule.required().error('Registergericht ist erforderlich')],
		}),
		defineField({
			title: 'Registernummer',
			name: 'registerNo',
			type: 'string',
			group: 'content',
			validation: (Rule) => [Rule.required().error('Registernummer ist erforderlich')],
		}),
		defineField({
			title: 'Vertreten durch',
			name: 'represented',
			type: 'simpleBlockContent',
			group: 'content',
			validation: (Rule) => [Rule.required().error('Feld "Vertreten durch" ist erforderlich')],
		}),
		defineField({
			...emailField,
			group: 'content',
		}),
		defineField({
			title: 'Kontaktformular',
			name: 'contactForm',
			type: 'internalLink',
			group: 'content',
			validation: (Rule) => [Rule.required().error('Link zum Kontaktformular ist erforderlich')],
		}),
		defineField({
			title: 'Redaktionell verantwortlich',
			name: 'responsible',
			type: 'string',
			group: 'content',
			validation: (Rule) => [Rule.required().error('Redaktionell verantwortlich ist erforderlich')],
		}),
		defineField({
			title: 'Verbraucherstreitbeilegung/Universalschlichtungsstelle',
			name: 'consumerDisputeResolution',
			type: 'string',
			group: 'content',
			validation: (Rule) => [
				Rule.required().error(
					'Verbraucherstreitbeilegung/Universalschlichtungsstelle ist erforderlich',
				),
			],
		}),
		defineField({
			title: 'Name Technischer Ansprechpartner',
			name: 'technicalQuestionsName',
			type: 'string',
			group: 'content',
			validation: (Rule) => [
				Rule.required().error('Name Technischer Ansprechpartner ist erforderlich'),
			],
		}),
		defineField({
			title: 'E-Mail Technischer Ansprechpartner',
			name: 'technicalQuestionsEmail',
			type: 'email',
			group: 'content',
			validation: (Rule) => [
				Rule.required().error('E-Mail Technischer Ansprechpartner ist erforderlich'),
			],
		}),
		defineField({
			title: 'Freundliche Unterstützung durch',
			name: 'support',
			type: 'simpleBlockContent',
			group: 'content',
			validation: (Rule) => [
				Rule.required().error('Freundliche Unterstützung durch ist erforderlich'),
			],
		}),
		defineField({
			title: 'Bildnachweise',
			name: 'credits',
			type: 'simpleBlockContent',
			group: 'content',
			validation: (Rule) => [Rule.required().error('Bildnachweis ist erforderlich')],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Impressum' }),
	},
});

export default imprintPage;
