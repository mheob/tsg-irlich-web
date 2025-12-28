import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general } from '@/shared/field-groups';
import { defaultHeroFields } from '@/shared/fields/general';

import { contactPersons, trainings } from './_groups';
import { contactPersonsField } from './contact-persons';
import { trainingsField } from './training';

const singleGroupPage = defineType({
	title: 'Einzel-Gruppe',
	name: 'singleGroupPage',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, content],
	fields: [
		// ?: the "slug" and `meta` comes from the news article itself; this page is rather the layout

		// general
		...defaultHeroFields,

		// content
		defineField({
			title: 'Inhalte',
			name: 'content',
			type: 'object',
			icon: RiLinksLine,
			group: 'content',
			groups: [contactPersons, trainings],
			fields: [contactPersonsField, trainingsField],
			validation: Rule => Rule.required(),
		}),
	],
	preview: {
		prepare: () => ({ title: 'Einzel-Gruppe' }),
	},
});

export default singleGroupPage;
