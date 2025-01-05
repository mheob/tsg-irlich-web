import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { introField, subTitleField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';

const newsOverviewCategory = defineType({
	title: 'News Übersicht für Kategorie',
	name: 'newsOverviewCategory',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// ?: the "slug" comes from the news category itself; this page is rather the layout

		// general
		subTitleField,
		introField,

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
		prepare: () => ({ title: 'News Übersicht für Kategorie' }),
	},
});

export default newsOverviewCategory;
