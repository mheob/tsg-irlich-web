import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';

const newsOverviewPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('news'),

		// General
		...defaultHeroFields,

		// Meta
		metaField,

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
	groups: [general, meta, content],
	icon: RiBookletLine,
	name: 'newsOverview',
	preview: {
		prepare: () => ({ title: 'News Übersicht' }),
	},
	title: 'News Übersicht',
	type: 'document',
});

export default newsOverviewPage;
