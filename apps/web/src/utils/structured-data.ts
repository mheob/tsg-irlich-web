import type { Graph, NewsArticle, WithContext } from 'schema-dts';

import { urlForImage } from '@/lib/sanity/utils';
import type { AnyImage } from '@/types/image.types';

import { SITE_NAME } from './metadata';
import { getLastModified } from './time';

/**
 * The aspect ratios search engines pick an article image from, each 1200 px wide. Google asks for
 * 16:9, 4:3 and 1:1, so a result can show the image in whichever shape it has room for.
 */
const ARTICLE_IMAGE_SIZES = [
	{ height: 675, width: 1200 },
	{ height: 900, width: 1200 },
	{ height: 1200, width: 1200 },
];

const LANGUAGE = 'de-DE';

interface PostalAddress {
	city?: string | null;
	houseNumber?: string | null;
	street?: string | null;
	zipCode?: string | null;
}

interface Organization {
	contact?: {
		email?: string | null;
		phone?: string | null;
		postalAddress?: PostalAddress | null;
	} | null;
	socialFields?: {
		facebook?: string | null;
		instagram?: string | null;
		youtube?: string | null;
	} | null;
}

interface Article {
	_updatedAt: string;
	author?: { firstName?: string | null; jobTitle?: string | null; lastName?: string | null } | null;
	excerpt?: string | null;
	featuredImage?: AnyImage | null;
	meta?: { metaDescription?: string | null } | null;
	publishedAt: string;
	title?: string | null;
}

/**
 * The node ID of the club. The layout describes the club once, and every other node refers to it
 * through this ID instead of repeating it.
 *
 * @param baseUrl - The site's base URL.
 * @returns The ID.
 */
function getOrganizationId(baseUrl: string): string {
	return `${baseUrl}/#organization`;
}

/**
 * Describes the club and the website, for the root layout.
 *
 * @param baseUrl - The site's base URL.
 * @param organization - The contact details and social profiles from the site settings.
 * @returns The graph with the `SportsOrganization` and the `WebSite` node.
 */
function getSiteGraph(baseUrl: string, organization?: Organization | null): Graph {
	const address = organization?.contact?.postalAddress;
	const social = organization?.socialFields;

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@id': getOrganizationId(baseUrl),
				'@type': 'SportsOrganization',
				address: address
					? {
							'@type': 'PostalAddress',
							addressCountry: 'DE',
							addressLocality: address.city ?? undefined,
							postalCode: address.zipCode ?? undefined,
							streetAddress: [address.street, address.houseNumber].filter(Boolean).join(' '),
						}
					: undefined,
				email: organization?.contact?.email ?? undefined,
				logo: `${baseUrl}/tsg-irlich-logo.png`,
				name: SITE_NAME,
				// Profiles only: the WhatsApp link opens a chat and does not stand for the club.
				sameAs: [social?.facebook, social?.instagram, social?.youtube].filter(
					(url): url is string => Boolean(url),
				),
				telephone: organization?.contact?.phone ?? undefined,
				url: `${baseUrl}/`,
			},
			{
				'@id': `${baseUrl}/#website`,
				'@type': 'WebSite',
				inLanguage: LANGUAGE,
				name: SITE_NAME,
				publisher: { '@id': getOrganizationId(baseUrl) },
				url: `${baseUrl}/`,
			},
		],
	};
}

/**
 * Describes a news article.
 *
 * @param baseUrl - The site's base URL.
 * @param path - The article's canonical path.
 * @param article - The article.
 * @returns The `NewsArticle` node.
 */
function getNewsArticleSchema(
	baseUrl: string,
	path: string,
	article: Article,
): WithContext<NewsArticle> {
	const authorName = [article.author?.firstName, article.author?.lastName]
		.filter(Boolean)
		.join(' ');
	const images = ARTICLE_IMAGE_SIZES.map(({ height, width }) =>
		urlForImage(article.featuredImage ?? undefined, height, width),
	).filter((url): url is string => Boolean(url));

	return {
		'@context': 'https://schema.org',
		'@type': 'NewsArticle',
		author: authorName
			? { '@type': 'Person', jobTitle: article.author?.jobTitle ?? undefined, name: authorName }
			: undefined,
		dateModified: getLastModified(article.publishedAt, article._updatedAt),
		datePublished: article.publishedAt,
		description: article.meta?.metaDescription ?? article.excerpt ?? undefined,
		headline: article.title ?? undefined,
		image: images.length > 0 ? images : undefined,
		inLanguage: LANGUAGE,
		mainEntityOfPage: `${baseUrl}${path}`,
		// The layout describes the club in full. Type and name are repeated so the node still reads
		// on its own to a consumer that does not join nodes across script elements by their ID.
		publisher: {
			'@id': getOrganizationId(baseUrl),
			'@type': 'SportsOrganization',
			name: SITE_NAME,
		},
	};
}

export { getNewsArticleSchema, getSiteGraph };
