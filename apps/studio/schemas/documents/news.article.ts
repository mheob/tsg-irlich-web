import { RiArticleLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { contentField } from '@/shared/content-fields';
import { excerptField, featuredImageField } from '@/shared/excerpt-fields';
import { content, excerpt, general, meta } from '@/shared/field-groups';
import { slugField, titleField } from '@/shared/general-fields';
import { authorField, metaField } from '@/shared/meta-fields';

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

		// meta
		authorField,
		metaField,

		// excerpt
		featuredImageField,
		excerptField,

		// content
		defineField({
			...contentField,
			of: [{ type: 'grid' }, { type: 'mainImage' }, { type: 'blockContent' }, { type: 'spacer' }],
		}),
	],
	initialValue: () => ({ publishedAt: new Date().toISOString() }),
	preview: {
		prepare: ({ title }) => ({ title }),
		select: {
			publishedAt: 'publishedAt',
			title: 'title',
		},
	},
});

export default newsArticle;
