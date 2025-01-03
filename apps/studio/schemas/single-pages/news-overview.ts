import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';

const newsOverviewPage = defineType({
	title: 'News Übersicht',
	name: 'newsOverview',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('news'),

		// general
		...defaultPageFields,

		// meta
		metaField,

		// content
		defineField({
			title: 'Inhalte',
			name: 'content',
			type: 'object',
			icon: RiLinksLine,
			group: 'content',
			groups: [{ title: 'Ansprechpartner', name: 'contactPersons' }],
			fields: [contactPersonsSectionField],
			validation: Rule => [Rule.required().error('Inhalte sind erforderlich')],
		}),
	],
	preview: {
		prepare: () => ({ title: 'News Übersicht' }),
	},
});

export default newsOverviewPage;
