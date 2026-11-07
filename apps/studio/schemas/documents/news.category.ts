import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { general, meta } from '@/shared/field-groups';
import { formattedSlugField, titleField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { previousSlugsField } from '@/shared/fields/slug-history';
import { getFieldWithGroup } from '@/utils/fields';

const newsCategory = defineType({
	fields: [
		// General
		titleField,
		formattedSlugField,
		getFieldWithGroup(previousSlugsField, 'general'),

		// Meta
		metaField,
	],
	groups: [general, meta],
	icon: RiBookletLine,
	name: 'news.category',
	preview: {
		prepare: ({ title }: { title?: string }) => ({ title }),
		select: {
			publishedAt: 'publishedAt',
			title: 'title',
		},
	},
	title: 'News-Kategorie',
	type: 'document',
});

export default newsCategory;
