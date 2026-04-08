import { RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { contact, general, meta } from '@/shared/field-groups';
import { addressField, emailField, phoneField } from '@/shared/fields/contact';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const privacyPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('datenschutz'),

		// General
		...defaultHeroFields,

		// Meta
		metaField,

		// Contact
		defineField({
			group: 'contact',
			name: 'introText',
			title: 'Einleitungstext',
			type: 'blockContent',
			validation: (Rule) => [Rule.required().error('Einleitungstext ist erforderlich')],
		}),
		addressField,
		phoneField,
		emailField,

		// Content
		defineField({
			group: 'content',
			name: 'content',
			title: 'Datenschutzerklärung',
			type: 'blockContent',
			validation: (Rule) => [Rule.required().error('Datenschutzerklärung ist erforderlich')],
		}),
	],
	groups: [general, meta, contact, { name: 'content', title: 'Erklärung' }],
	icon: RiSettings5Line,
	name: 'privacy',
	preview: {
		prepare: () => ({ title: 'Datenschutzerklärung' }),
	},
	title: 'Datenschutzerklärung',
	type: 'document',
});

export default privacyPage;
