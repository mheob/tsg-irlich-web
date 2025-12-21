import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { general, meta } from '@/shared/field-groups';
import { slugField, titleField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const newsCategory = defineType({
	title: 'News-Kategorie',
	name: 'news.category',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta],
	fields: [
		// general
		titleField,
		slugField,

		// meta
		metaField,
	],
	preview: {
		prepare: ({ title }) => ({ title }),
		select: {
			publishedAt: 'publishedAt',
			title: 'title',
		},
	},
});

export default newsCategory;
