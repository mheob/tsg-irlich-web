// cSpell:words impressum
import { defineField, defineType } from '@sanity-typed/types';
import { RiSettings5Line } from 'react-icons/ri';

import { phoneFieldRegex } from '@/constants/regex';
import { content, general, meta } from '@/shared/field-groups';
import { addressField, emailField, phoneField } from '@/shared/fields/contact';
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
			title: 'Registernummer',
			name: 'registerNo',
			type: 'string',
			group: 'content',
			validation: Rule => Rule.required().error('Die Registernummer ist ein Pflichtfeld'),
		}),
		defineField({
			title: 'Registergericht',
			name: 'registerCourt',
			type: 'string',
			group: 'content',
			validation: Rule => Rule.required().error('Das Registergericht ist ein Pflichtfeld'),
		}),
		defineField({
			title: 'Vertreten durch',
			name: 'represented',
			type: 'string',
			group: 'content',
			validation: Rule => Rule.required().error('Das Feld "Vertreten durch" ist ein Pflichtfeld'),
		}),
		defineField({
			...phoneField,
			group: 'content',
			validation: Rule =>
				Rule.regex(phoneFieldRegex).warning(
					'Die Telefonnummer sollte in der Form +49 123 456789 geschrieben werden.',
				),
		}),
		defineField({
			...emailField,
			group: 'content',
		}),
		defineField({
			title: 'Redaktionell verantwortlich',
			name: 'responsible',
			type: 'text',
			group: 'content',
			validation: Rule =>
				Rule.required().error('Das Feld "Redaktionell verantwortlich" ist ein Pflichtfeld'),
		}),
		defineField({
			title: 'Verbraucherstreitbeilegung / Universalschlichtungsstelle',
			name: 'arbitrationBoard',
			type: 'string',
			group: 'content',
			validation: Rule =>
				Rule.required().error(
					'Das Feld "Verbraucherstreitbeilegung / Universalschlichtungsstelle" ist ein Pflichtfeld',
				),
		}),
		defineField({
			title: 'Name Technischer Ansprechpartner',
			name: 'technicalQuestionsName',
			type: 'text',
			group: 'content',
			validation: Rule =>
				Rule.required().error('Das Feld "Name Technischer Ansprechpartner" ist ein Pflichtfeld'),
		}),
		defineField({
			title: 'E-Mail Technischer Ansprechpartner',
			name: 'technicalQuestionsEmail',
			type: 'email',
			group: 'content',
			validation: Rule =>
				Rule.required().error('Das Feld "E-Mail Technischer Ansprechpartner" ist ein Pflichtfeld'),
		}),
		defineField({
			title: 'Freundliche Unterstützung durch',
			name: 'support',
			type: 'simpleBlockContent',
			group: 'content',
			validation: Rule =>
				Rule.required().error('Das Feld "Freundliche Unterstützung durch" ist ein Pflichtfeld'),
		}),
	],
	preview: {
		prepare: () => ({ title: 'Impressum' }),
	},
});

export default imprintPage;
