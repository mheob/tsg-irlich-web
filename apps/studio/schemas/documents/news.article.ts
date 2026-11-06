import { RiArticleLine } from 'react-icons/ri';
import type { PreviewValue } from 'sanity';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { content, excerpt, general, meta } from '@/shared/field-groups';
import { contentField } from '@/shared/fields/content';
import { excerptField, featuredImageField } from '@/shared/fields/excerpt';
import { slugField, titleField } from '@/shared/fields/general';
import { authorField, metaField } from '@/shared/fields/meta';
import { formatDate } from '@/utils/time';

/**
 * Below the 10 a page title gets through `preview.select`, so pages rank above news in the studio
 * search, also when picking the target of a link (WEB-369).
 */
const TITLE_SEARCH_WEIGHT = 5;

/** More than a handful of files under an article buries the ones that matter (WEB-277). */
const MAX_DOWNLOADS = 5;

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

		defineField({ ...titleField, options: { search: { weight: TITLE_SEARCH_WEIGHT } } }),
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
				{ type: 'gallery' },
				{ type: 'grid' },
				{ type: 'mainImage' },
				{ type: 'spacer' },
			],
		}),

		defineField({
			description:
				'PDF-Dateien, die unter dem Artikel zum Herunterladen angeboten werden, z. B. eine Einladung oder ein Flyer. Wichtige Inhalte wie eine Tagesordnung gehören trotzdem in den Text: Suchmaschinen und die Suche der Website lesen keine Dokumente.',
			group: 'content',
			name: 'downloads',
			of: [defineArrayMember({ type: 'documentDownload' })],
			title: 'Downloads',
			type: 'array',
			validation: (Rule) =>
				Rule.max(MAX_DOWNLOADS).error(`Maximal ${MAX_DOWNLOADS} Downloads dürfen gesetzt werden`),
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
