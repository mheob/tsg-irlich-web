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
			fields: [
				defineField({
					description:
						'Steht unter der Überschrift, solange eine Kategorie noch keine Beiträge hat. Darunter verlinkt ein Button auf alle News.',
					group: 'emptyCategory',
					name: 'emptyCategoryNotice',
					rows: 3,
					title: 'Hinweis ohne Beiträge',
					type: 'text',
					validation: (Rule) => [Rule.required().error('Der Hinweis ist erforderlich')],
				}),
				contactPersonsSectionField,
			],
			group: 'content',
			groups: [
				{ name: 'emptyCategory', title: 'Keine Beiträge' },
				{ name: 'contactPersons', title: 'Ansprechpartner' },
			],
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
