import { RiArticleLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, excerpt, general, meta } from '@/shared/field-groups';
import { contentField } from '@/shared/fields/content';
import { excerptField, featuredImageField } from '@/shared/fields/excerpt';
import { slugField, titleField } from '@/shared/fields/general';
import { authorField, metaField } from '@/shared/fields/meta';
import { formatDate } from '@/utils/time';

const newsArticle = defineType({
	title: 'News-Artikel',
	name: 'news.article',
	type: 'document',
	icon: RiArticleLine,
	groups: [general, meta, excerpt, content],
	fields: [
		// general
		defineField({
			title: 'Veröffentlicht am',
			name: 'publishedAt',
			type: 'datetime',
			initialValue: () => new Date().toISOString(),
			group: 'general',
			validation: (Rule) => Rule.required().error('Es muss ein Datum ausgewählt werden.'),
		}),

		titleField,
		slugField,

		defineField({
			title: 'News-Kategorien',
			name: 'categories',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'news.category' }] }],
			group: 'general',
			validation: (Rule) =>
				Rule.required().error('Es muss mindestens eine Kategorie ausgewählt werden.'),
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
	orderings: [
		{
			title: 'Veröffentlicht, neuste zuerst',
			name: 'publishedAtDesc',
			by: [{ field: 'publishedAt', direction: 'desc' }],
		},
		{
			title: 'Veröffentlicht, älteste zuerst',
			name: 'publishedAtAsc',
			by: [{ field: 'publishedAt', direction: 'asc' }],
		},
	],
	preview: {
		prepare: ({ media, title, publishedAt }) => ({
			media,
			title: `${formatDate(publishedAt)} - ${title}`,
		}),
		select: {
			media: 'featuredImage.asset',
			publishedAt: 'publishedAt',
			title: 'title',
		},
	},
});

export default newsArticle;
