import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

import { contactPersons } from './_groups';
import { contactPersonsField } from './contact-persons';

const singleGroupPage = defineType({
	title: 'Einzel-Gruppe',
	name: 'singleGroupPage',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// ?: the "slug" and `meta` comes from the news article itself; this page is rather the layout

		// general
		...defaultHeroFields,

		// meta
		metaField,

		// content
		defineField({
			title: 'Inhalte',
			name: 'content',
			type: 'object',
			icon: RiLinksLine,
			group: 'content',
			groups: [contactPersons],
			fields: [contactPersonsField],
			validation: Rule => Rule.required(),
		}),
	],
	preview: {
		prepare: () => ({ title: 'Einzel-Gruppe' }),
	},
});

export default singleGroupPage;
