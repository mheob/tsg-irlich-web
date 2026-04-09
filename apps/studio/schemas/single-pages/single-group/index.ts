import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general } from '@/shared/field-groups';
import { defaultHeroFields } from '@/shared/fields/general';

import { contactPersons, trainings } from './_groups';
import { contactPersonsField } from './contact-persons';
import { trainingsField } from './training';

const singleGroupPage = defineType({
	fields: [
		// ?: the "slug" and `meta` comes from the news article itself; this page is rather the layout

		// General
		...defaultHeroFields,

		// Content
		defineField({
			fields: [contactPersonsField, trainingsField],
			group: 'content',
			groups: [contactPersons, trainings],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => Rule.required(),
		}),
	],
	groups: [general, content],
	icon: RiBookletLine,
	name: 'singleGroupPage',
	preview: {
		prepare: () => ({ title: 'Einzel-Gruppe' }),
	},
	title: 'Einzel-Gruppe',
	type: 'document',
});

export default singleGroupPage;
