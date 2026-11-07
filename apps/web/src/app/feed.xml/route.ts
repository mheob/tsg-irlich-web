import { client } from '@/lib/sanity/client';
import { rssNewsArticlesQuery } from '@/lib/sanity/queries/rss';
import { urlForSharedImage } from '@/lib/sanity/utils';
import type { RssNewsArticlesQueryResult } from '@/types/sanity.types';
import { getBaseUrl } from '@/utils/url';

type RssArticle = RssNewsArticlesQueryResult[number];

const RSS_RESPONSE_HEADERS = {
	'Cache-Control': 'public, max-age=3600, s-maxage=3600',
	'Content-Type': 'application/xml; charset=utf-8',
};

/** The size of an item's preview image, the 16:9 shape feed readers show above the text. */
const ITEM_IMAGE = { height: 675, width: 1200 } as const;

/**
 * Names the author of an article in `dc:creator`. RSS's own `<author>` element wants an email
 * address, which the feed must not publish (WEB-424).
 *
 * @param article - The article.
 * @returns The element, or an empty string without an author name.
 */
function buildCreator(article: RssArticle): string {
	const name = [article.author.firstName, article.author.lastName].filter(Boolean).join(' ');
	return name ? `<dc:creator><![CDATA[${name}]]></dc:creator>` : '';
}

/**
 * Attaches the preview image of an article as Media RSS. An `<enclosure>` would need the file size
 * in bytes, which only a request to the CDN could tell.
 *
 * @param article - The article.
 * @returns The element, or an empty string without an image.
 */
function buildImage(article: RssArticle): string {
	const url = urlForSharedImage(article.featuredImage, ITEM_IMAGE.height, ITEM_IMAGE.width);
	if (!url) {
		return '';
	}

	return `<media:content url="${url.replaceAll('&', '&amp;')}" medium="image" type="image/jpeg" width="${ITEM_IMAGE.width}" height="${ITEM_IMAGE.height}"/>`;
}

function buildRssItem(article: RssArticle, baseUrl: string): string {
	const articleUrl = `${baseUrl}/news/${article.category}/${article.slug}`;
	const pubDate = new Date(article.publishedAt).toUTCString();
	const category = article.categoryTitle
		? `<category><![CDATA[${article.categoryTitle}]]></category>`
		: '';

	return `
	<item>
		<title><![CDATA[${article.title}]]></title>
		<link>${articleUrl}</link>
		<guid isPermaLink="true">${articleUrl}</guid>
		<description><![CDATA[${article.excerpt}]]></description>
		<pubDate>${pubDate}</pubDate>
		${buildCreator(article)}
		${category}
		${buildImage(article)}
	</item>`;
}

function buildRssFeed(rssItems: string, baseUrl: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
	<channel>
		<title>TSG Irlich — News</title>
		<link>${baseUrl}/news</link>
		<description>Aktuelle Neuigkeiten der TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich</description>
		<language>de-DE</language>
		<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
		<atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
		<image>
			<url>${baseUrl}/icon-512.png</url>
			<title>TSG Irlich — News</title>
			<link>${baseUrl}/news</link>
		</image>
		${rssItems}
	</channel>
</rss>`;
}

export async function GET(): Promise<Response> {
	const baseUrl = getBaseUrl();
	const articles = await client.fetch<RssNewsArticlesQueryResult>(rssNewsArticlesQuery);

	const rssItems = articles
		.filter((article) => article.slug && article.category)
		.map((article) => buildRssItem(article, baseUrl))
		.join('');

	return new Response(buildRssFeed(rssItems, baseUrl), { headers: RSS_RESPONSE_HEADERS });
}
