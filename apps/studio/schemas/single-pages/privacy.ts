import { RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { addressField, emailField, phoneField } from '@/shared/contact-fields';
import { contact, general, meta } from '@/shared/field-groups';
import { defaultPageFields, getHiddenSlugField } from '@/shared/general-fields';
import { metaField } from '@/shared/meta-fields';
import { getRequiredRole } from '@/shared/validation-rules';

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
			validation: rule => [getRequiredRole(rule, 'Einleitungstext')],
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
			validation: rule => [getRequiredRole(rule, 'Datenschutzerklärung')],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Datenschutzerklärung' }),
	},
});

export default privacyPage;
