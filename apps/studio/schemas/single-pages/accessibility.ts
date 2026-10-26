import { RiWheelchairLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { getHeroImageField, LANDSCAPE_HERO_DESCRIPTION } from '@/shared/fields/hero-image';
import { metaField } from '@/shared/fields/meta';
import { getSinglePagePreview } from '@/utils/previews';

const accessibilityPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('barrierefreiheit'),

		// General
		...defaultHeroFields,
		getHeroImageField(LANDSCAPE_HERO_DESCRIPTION),

		// Meta
		metaField,

		// Content
		defineField({
			group: 'content',
			name: 'content',
			title: 'Barrierefreiheit',
			type: 'blockContent',
			validation: (Rule) => [Rule.required().error('Barrierefreiheit ist erforderlich')],
		}),
	],
	groups: [general, meta, { name: 'content', title: 'Barrierefreiheit' }],
	icon: RiWheelchairLine,
	name: 'accessibility',
	preview: getSinglePagePreview('Barrierefreiheit'),
	title: 'Barrierefreiheit',
	type: 'document',
});

export default accessibilityPage;
