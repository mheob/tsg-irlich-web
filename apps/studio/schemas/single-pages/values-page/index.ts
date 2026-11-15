import { RiCompass3Line, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { getHeroImageField, LANDSCAPE_HERO_DESCRIPTION } from '@/shared/fields/hero-image';
import { metaField } from '@/shared/fields/meta';
import { getSinglePagePreview } from '@/utils/previews';

import { about, join, values } from './_groups';
import { aboutSection, joinSection, valuesSection } from './sections';

/**
 * The values page `/verein/werte` („Unsere Werte“, WEB-150): the club's mission statement. It is
 * not part of the menu; the vision sections of the home and the club page link to it.
 */
const valuesPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('werte'),

		// General
		...defaultHeroFields,
		getHeroImageField(LANDSCAPE_HERO_DESCRIPTION),

		// Content
		defineField({
			fields: [aboutSection, valuesSection, joinSection],
			group: 'content',
			groups: [about, values, join],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Inhalte sind erforderlich')],
		}),

		// Meta
		metaField,
	],
	groups: [general, content, meta],
	icon: RiCompass3Line,
	name: 'valuesPage',
	preview: getSinglePagePreview('Unsere Werte'),
	title: 'Unsere Werte',
	type: 'document',
});

export default valuesPage;
