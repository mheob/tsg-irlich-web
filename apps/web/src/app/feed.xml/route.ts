import { client } from '@/lib/sanity/client';
import { rssNewsArticlesQuery } from '@/lib/sanity/queries/rss';
import type { RssNewsArticlesQueryResult } from '@/types/sanity.types';
import { getBaseUrl } from '@/utils/url';

type RssArticle = RssNewsArticlesQueryResult[number];

const RSS_RESPONSE_HEADERS = {
	'Cache-Control': 'public, max-age=3600, s-maxage=3600',
	'Content-Type': 'application/xml; charset=utf-8',
};

function buildAuthor(article: RssArticle): string {
	const email = article.author?.email ?? 'info@tsg-irlich.de';
	const name = article.author
		? `${article.author.firstName} ${article.author.lastName}`
		: 'TSG Irlich';

	return `${email} (${name})`;
}

function buildRssItem(article: RssArticle, baseUrl: string): string {
	const articleUrl = `${baseUrl}/news/${article.category}/${article.slug}`;
	const author = buildAuthor(article);
	const pubDate = new Date(article.publishedAt).toUTCString();
	const category = article.categoryTitle
		? `<category><![CDATA[${article.categoryTitle}]]></category>`
		: '';

	return `
	<item>
		<title><![CDATA[${article.title}]]></title>
		<link>${articleUrl}</link>
		<guid isPermaLink="true">${articleUrl}</guid>
		<description><![CDATA[${article.excerpt ?? ''}]]></description>
		<pubDate>${pubDate}</pubDate>
		<author>${author}</author>
		${category}
	</item>`;
}

function buildRssFeed(rssItems: string, baseUrl: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
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

	const rssItems = (articles ?? [])
		.filter((article) => article.slug && article.category)
		.map((article) => buildRssItem(article, baseUrl))
		.join('');

	return new Response(buildRssFeed(rssItems, baseUrl), { headers: RSS_RESPONSE_HEADERS });
}
