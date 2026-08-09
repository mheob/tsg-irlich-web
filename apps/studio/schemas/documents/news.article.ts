import { RiArticleLine } from 'react-icons/ri';
import type { PreviewValue } from 'sanity';
import { defineField, defineType } from 'sanity';

import { content, excerpt, general, meta } from '@/shared/field-groups';
import { contentField } from '@/shared/fields/content';
import { excerptField, featuredImageField } from '@/shared/fields/excerpt';
import { slugField, titleField } from '@/shared/fields/general';
import { authorField, metaField } from '@/shared/fields/meta';
import { formatDate } from '@/utils/time';

const newsArticle = defineType({
	fields: [
		// General
		defineField({
			group: 'general',
			initialValue: () => new Date().toISOString(),
			name: 'publishedAt',
			title: 'Veröffentlicht am',
			type: 'datetime',
			validation: (Rule) => Rule.required().error('Es muss ein Datum ausgewählt werden.'),
		}),

		titleField,
		slugField,

		defineField({
			group: 'general',
			name: 'categories',
			of: [{ to: [{ type: 'news.category' }], type: 'reference' }],
			title: 'News-Kategorien',
			type: 'array',
			validation: (Rule) =>
				Rule.required().error('Es muss mindestens eine Kategorie ausgewählt werden.'),
		}),

		// Meta
		authorField,
		metaField,

		// Excerpt
		featuredImageField,
		excerptField,

		// Content
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
	groups: [general, meta, excerpt, content],
	icon: RiArticleLine,
	name: 'news.article',
	orderings: [
		{
			by: [{ direction: 'desc', field: 'publishedAt' }],
			name: 'publishedAtDesc',
			title: 'Veröffentlicht, neuste zuerst',
		},
		{
			by: [{ direction: 'asc', field: 'publishedAt' }],
			name: 'publishedAtAsc',
			title: 'Veröffentlicht, älteste zuerst',
		},
	],
	preview: {
		prepare: ({
			media,
			title,
			publishedAt,
		}: {
			media?: PreviewValue['media'];
			title?: string;
			publishedAt?: string;
		}) => ({
			media,
			title: publishedAt ? `${formatDate(publishedAt)} - ${title}` : title,
		}),
		select: {
			media: 'featuredImage.asset',
			publishedAt: 'publishedAt',
			title: 'title',
		},
	},
	title: 'News-Artikel',
	type: 'document',
});

export default newsArticle;
