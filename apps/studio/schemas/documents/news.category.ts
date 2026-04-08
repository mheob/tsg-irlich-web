import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { general, meta } from '@/shared/field-groups';
import { slugField, titleField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const newsCategory = defineType({
	fields: [
		// General
		titleField,
		slugField,

		// Meta
		metaField,
	],
	groups: [general, meta],
	icon: RiBookletLine,
	name: 'news.category',
	preview: {
		prepare: ({ title }) => ({ title }),
		select: {
			publishedAt: 'publishedAt',
			title: 'title',
		},
	},
	title: 'News-Kategorie',
	type: 'document',
});

export default newsCategory;
