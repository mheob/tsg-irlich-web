import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { getHeroImageField, LANDSCAPE_HERO_DESCRIPTION } from '@/shared/fields/hero-image';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { getSinglePagePreview } from '@/utils/previews';

const newsOverviewPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('news'),

		// General
		...defaultHeroFields,
		getHeroImageField(
			`${LANDSCAPE_HERO_DESCRIPTION} Erscheint auch auf den Kategorieseiten der News.`,
		),

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
	preview: getSinglePagePreview('News Übersicht'),
	title: 'News Übersicht',
	type: 'document',
});

export default newsOverviewPage;
