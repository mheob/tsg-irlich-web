import { RiArticleLine } from 'react-icons/ri';
import type { PreviewValue, ValidationError } from 'sanity';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { content, excerpt, general, meta } from '@/shared/field-groups';
import { contentField } from '@/shared/fields/content';
import { excerptField, featuredImageField } from '@/shared/fields/excerpt';
import { formattedSlugField, titleField } from '@/shared/fields/general';
import { authorField, metaField } from '@/shared/fields/meta';
import { previousArticleSlugsField } from '@/shared/fields/slug-history';
import { getFieldWithGroup } from '@/utils/fields';
import { getSkippedHeadings } from '@/utils/heading-order';
import { formatDate } from '@/utils/time';

/**
 * Below the 10 a page title gets through `preview.select`, so pages rank above news in the studio
 * search, also when picking the target of a link (WEB-369).
 */
const TITLE_SEARCH_WEIGHT = 5;

/** More than a handful of files under an article buries the ones that matter (WEB-277). */
const MAX_DOWNLOADS = 5;

/**
 * Marks every subheading of the body that skips a level: an H3 with no H2 above it, right below the
 * `h1` of the headline (WEB-301). A warning, not an error, so an article can still be published.
 *
 * @param body - The `body` of the article.
 * @returns `true`, or one marker on each such heading, relative to `body`.
 */
function validateArticleHeadings(body: unknown): true | ValidationError[] {
	const skipped = getSkippedHeadings(body);
	if (skipped.length === 0) {
		return true;
	}

	return skipped.map(({ blockKey, sectionKey }) => ({
		message:
			'Diese H3 steht ohne H2 darüber. Nimm H2 für Zwischenüberschriften und H3 nur für Unterpunkte unter einer H2.',
		path: [{ _key: sectionKey }, 'text', { _key: blockKey }],
	}));
}

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
		formattedSlugField,
		getFieldWithGroup(previousArticleSlugsField, 'general'),

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
			description:
				'Abschnitte mit Inhalt hinzufügen, bearbeiten und neu anordnen. Zwischenüberschriften im Text sind H2, H3 nur für Unterpunkte unter einer H2: Die Überschrift des Artikels ist schon die oberste Ebene.',
			of: [
				{ type: 'blockContent' },
				{ type: 'blockquote' },
				{ type: 'gallery' },
				{ type: 'grid' },
				{ type: 'mainImage' },
				{ type: 'spacer' },
			],
			validation: (Rule) => Rule.custom((body) => validateArticleHeadings(body)).warning(),
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
	groups: [general, content, excerpt, meta],
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

export { validateArticleHeadings };
export default newsArticle;
