// cSpell:words impressum
import { RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { addressField, emailField } from '@/shared/fields/contact';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
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
		...defaultPageFields,

		// meta
		metaField,

		// content
		defineField({
			...addressField,
			group: 'content',
		}),
		defineField({
			title: 'Registergericht',
			name: 'registerCourt',
			type: 'string',
			group: 'content',
			// validation: rule => [requiredRule(rule, 'Das Registergericht')],
		}),
		defineField({
			title: 'Registernummer',
			name: 'registerNo',
			type: 'string',
			group: 'content',
			// validation: rule => [requiredRule(rule, 'Die Registernummer')],
		}),
		defineField({
			title: 'Vertreten durch',
			name: 'represented',
			type: 'text',
			group: 'content',
			// validation: rule => [requiredRule(rule, 'Das Feld "Vertreten durch"')],
		}),
		defineField({
			...emailField,
			group: 'content',
		}),
		defineField({
			title: 'Kontaktformular',
			name: 'contactForm',
			type: 'string',
			group: 'content',
			// validation: rule => [requiredRule(rule, 'Telefon')],
		}),
		defineField({
			title: 'Redaktionell verantwortlich',
			name: 'responsible',
			type: 'string',
			group: 'content',
			// validation: rule => [requiredRule(rule, 'Das Feld "Redaktionell verantwortlich')],
		}),
		defineField({
			title: 'Name Technischer Ansprechpartner',
			name: 'technicalQuestionsName',
			type: 'string',
			group: 'content',
			// validation: rule => [requiredRule(rule, 'Das Feld "Name Technischer Ansprechpartner"')],
		}),
		defineField({
			title: 'E-Mail Technischer Ansprechpartner',
			name: 'technicalQuestionsEmail',
			type: 'email',
			group: 'content',
			// validation: rule => [requiredRule(rule, 'Das Feld "E-Mail Technischer Ansprechpartner"')],
		}),
		defineField({
			title: 'Social Media',
			name: 'socialMedia',
			type: 'text',
			group: 'content',
			// validation: rule => [requiredRule(rule, 'Das Feld "Social Media"')],
		}),
		defineField({
			title: 'Freundliche Unterstützung durch',
			name: 'support',
			type: 'simpleBlockContent',
			group: 'content',
			// validation: rule => [requiredRule(rule, 'Das Feld "Freundliche Unterstützung durch"')],
		}),
		defineField({
			title: 'Bildnachweise',
			name: 'credits',
			type: 'text',
			group: 'content',
			// validation: rule => [requiredRule(rule, 'Das Feld "Freundliche Unterstützung durch"')],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Impressum' }),
	},
});

export default imprintPage;
