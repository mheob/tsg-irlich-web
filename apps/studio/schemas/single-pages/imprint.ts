// cSpell:words impressum
import { RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { addressField, emailField, phoneField } from '@/shared/fields/contact';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { getPhoneFieldRegexRule, getRequiredRole } from '@/shared/validation-rules';

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
			validation: rule => [getRequiredRole(rule, 'Registernummer')],
		}),
		defineField({
			title: 'Registergericht',
			name: 'registerCourt',
			type: 'string',
			group: 'content',
			validation: rule => [getRequiredRole(rule, 'Registergericht')],
		}),
		defineField({
			title: 'Vertreten durch',
			name: 'represented',
			type: 'string',
			group: 'content',
			validation: rule => [getRequiredRole(rule, '"Vertreten durch"')],
		}),
		defineField({
			...phoneField,
			group: 'content',
			validation: rule => [getRequiredRole(rule, 'Telefon'), getPhoneFieldRegexRule(rule)],
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
			validation: rule => [getRequiredRole(rule, '"Redaktionell verantwortlich')],
		}),
		defineField({
			title: 'Verbraucherstreitbeilegung / Universalschlichtungsstelle',
			name: 'arbitrationBoard',
			type: 'string',
			group: 'content',
			validation: rule => [
				getRequiredRole(rule, '"Verbraucherstreitbeilegung / Universalschlichtungsstelle"'),
			],
		}),
		defineField({
			title: 'Name Technischer Ansprechpartner',
			name: 'technicalQuestionsName',
			type: 'text',
			group: 'content',
			validation: rule => [getRequiredRole(rule, '"Name Technischer Ansprechpartner"')],
		}),
		defineField({
			title: 'E-Mail Technischer Ansprechpartner',
			name: 'technicalQuestionsEmail',
			type: 'email',
			group: 'content',
			validation: rule => [getRequiredRole(rule, '"E-Mail Technischer Ansprechpartner"')],
		}),
		defineField({
			title: 'Freundliche Unterstützung durch',
			name: 'support',
			type: 'simpleBlockContent',
			group: 'content',
			validation: rule => [getRequiredRole(rule, '"Freundliche Unterstützung durch"')],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Impressum' }),
	},
});

export default imprintPage;
