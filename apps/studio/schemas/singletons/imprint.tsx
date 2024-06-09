// cSpell:words impressum

import { RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { general, meta } from '@/shared/field-groups';
import { metaField } from '@/shared/meta-fields';

const imprint = defineType({
	title: 'Impressum',
	name: 'imprint',
	type: 'document',
	icon: RiSettings5Line,
	groups: [general, meta, { name: 'content', title: 'Inhalt' }],
	fields: [
		// (hidden)
		defineField({
			title: 'Slug',
			name: 'slug',
			type: 'slug',
			readOnly: true,
			initialValue: { current: 'impressum' },
			hidden: true,
		}),

		// meta
		metaField,

		// content
		defineField({
			title: 'Anschrift',
			name: 'address',
			type: 'text',
			group: 'content',
		}),
		defineField({
			title: 'Registernummer',
			name: 'registerNo',
			type: 'string',
			group: 'content',
		}),
		defineField({
			title: 'Registergericht',
			name: 'registerCourt',
			type: 'string',
			group: 'content',
		}),
		defineField({
			title: 'Vertreten durch',
			name: 'represented',
			type: 'string',
			group: 'content',
		}),
		defineField({
			title: 'Telefonnummer',
			name: 'phone',
			type: 'url',
			group: 'content',
		}),
		defineField({
			title: 'E-Mail',
			name: 'email',
			type: 'email',
			group: 'content',
		}),
		defineField({
			title: 'Redaktionell verantwortlich',
			name: 'responsible',
			type: 'text',
			group: 'content',
		}),
		defineField({
			title: 'Verbraucherstreitbeilegung / Universalschlichtungsstelle',
			name: 'arbitrationBoard',
			type: 'string',
			group: 'content',
		}),
		defineField({
			title: 'Name Technischer Ansprechpartner',
			name: 'technicalQuestionsName',
			type: 'text',
			group: 'content',
		}),
		defineField({
			title: 'E-Mail Technischer Ansprechpartner',
			name: 'technicalQuestionsEmail',
			type: 'email',
			group: 'content',
		}),
		defineField({
			title: 'Freundliche Unterstützung durch',
			name: 'support',
			type: 'simpleBlockContent',
			group: 'content',
		}),
	],
	preview: {
		prepare: () => ({ title: 'Impressum' }),
	},
});

export default imprint;
