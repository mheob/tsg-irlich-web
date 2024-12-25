import { defineField, defineType } from '@sanity-typed/types';
import { RiSettings5Line } from 'react-icons/ri';

import { contact, general, meta } from '@/shared/field-groups';
import { addressField, emailField, phoneField } from '@/shared/fields/contact';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const privacyPage = defineType({
	title: 'Datenschutzerklärung',
	name: 'privacy',
	type: 'document',
	icon: RiSettings5Line,
	groups: [general, meta, contact, { name: 'content', title: 'Erklärung' }],
	fields: [
		// (hidden)
		getHiddenSlugField('datenschutz'),

		// general
		...defaultPageFields,

		// meta
		metaField,

		// contact
		defineField({
			title: 'Einleitungstext',
			name: 'introText',
			type: 'simpleBlockContent',
			group: 'contact',
			validation: Rule => Rule.required().error('Der Einleitungstext ist ein Pflichtfeld'),
		}),
		addressField,
		phoneField,
		emailField,

		// content
		defineField({
			title: 'Datenschutzerklärung',
			name: 'content',
			type: 'blockContent',
			group: 'content',
			validation: Rule => Rule.required().error('Die Datenschutzerklärung ist ein Pflichtfeld'),
		}),
	],
	preview: {
		prepare: () => ({ title: 'Datenschutzerklärung' }),
	},
});

export default privacyPage;
