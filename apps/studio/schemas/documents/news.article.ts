import { RiArticleLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, excerpt, general, meta } from '@/shared/field-groups';
import { contentField } from '@/shared/fields/content';
import { excerptField, featuredImageField } from '@/shared/fields/excerpt';
import { slugField, titleField } from '@/shared/fields/general';
import { authorField, metaField } from '@/shared/fields/meta';

const newsArticle = defineType({
	title: 'News-Artikel',
	name: 'news.article',
	type: 'document',
	icon: RiArticleLine,
	groups: [general, meta, excerpt, content],
	fields: [
		// general
		titleField,
		slugField,

		defineField({
			title: 'News-Kategorien',
			name: 'categories',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'news.category' }] }],
			group: 'general',
		}),

		// meta
		authorField,
		metaField,

		// excerpt
		featuredImageField,
		excerptField,

		// content
		defineField({
			...contentField,
			of: [
				{ type: 'blockContent' },
				{ type: 'blockquote' },
				{ type: 'grid' },
				{ type: 'mainImage' },
				{ type: 'spacer' },
			],
		}),
	],
	preview: {
		prepare: ({ title }) => ({ title }),
		select: {
			publishedAt: 'publishedAt',
			title: 'title',
		},
	},
});

export default newsArticle;
