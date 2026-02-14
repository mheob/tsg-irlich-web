import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general } from '@/shared/field-groups';
import { defaultHeroFields } from '@/shared/fields/general';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';

const newsOverviewCategory = defineType({
	title: 'News Übersicht für Kategorie',
	name: 'newsOverviewCategory',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, content],
	fields: [
		// ?: the "slug" comes from the news category itself; this page is rather the layout

		// general
		...defaultHeroFields,

		// content
		defineField({
			title: 'Inhalte',
			name: 'content',
			type: 'object',
			icon: RiLinksLine,
			group: 'content',
			groups: [{ title: 'Ansprechpartner', name: 'contactPersons' }],
			fields: [contactPersonsSectionField],
			validation: (Rule) => [Rule.required().error('Inhalte sind erforderlich')],
		}),
	],
	preview: {
		prepare: () => ({ title: 'News Übersicht für Kategorie' }),
	},
});

export default newsOverviewCategory;
