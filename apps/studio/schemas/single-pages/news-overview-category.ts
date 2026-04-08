import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general } from '@/shared/field-groups';
import { defaultHeroFields } from '@/shared/fields/general';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';

const newsOverviewCategory = defineType({
	fields: [
		// ?: the "slug" comes from the news category itself; this page is rather the layout

		// General
		...defaultHeroFields,

		// Content
		defineField({
			fields: [contactPersonsSectionField],
			group: 'content',
			groups: [{ name: 'contactPersons', title: 'Ansprechpartner' }],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Inhalte sind erforderlich')],
		}),
	],
	groups: [general, content],
	icon: RiBookletLine,
	name: 'newsOverviewCategory',
	preview: {
		prepare: () => ({ title: 'News Übersicht für Kategorie' }),
	},
	title: 'News Übersicht für Kategorie',
	type: 'document',
});

export default newsOverviewCategory;
