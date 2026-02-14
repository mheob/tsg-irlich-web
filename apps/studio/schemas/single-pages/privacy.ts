import { RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { contact, general, meta } from '@/shared/field-groups';
import { addressField, emailField, phoneField } from '@/shared/fields/contact';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
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
		...defaultHeroFields,

		// meta
		metaField,

		// contact
		defineField({
			title: 'Einleitungstext',
			name: 'introText',
			type: 'blockContent',
			group: 'contact',
			validation: (Rule) => [Rule.required().error('Einleitungstext ist erforderlich')],
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
			validation: (Rule) => [Rule.required().error('Datenschutzerklärung ist erforderlich')],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Datenschutzerklärung' }),
	},
});

export default privacyPage;
