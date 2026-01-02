// cSpell:words maxage

import { client } from '@/lib/sanity/client';
import { rssNewsArticlesQuery } from '@/lib/sanity/queries/rss';
import { getBaseUrl } from '@/utils/url';

export async function GET(): Promise<Response> {
	const baseUrl = getBaseUrl();
	const articles = await client.fetch(rssNewsArticlesQuery);

	const rssItems = (articles ?? [])
		.filter(article => article.slug && article.category)
		.map(article => {
			const articleUrl = `${baseUrl}/news/${article.category}/${article.slug}`;
			const authorName = article.author
				? `${article.author.firstName} ${article.author.lastName}`
				: 'TSG Irlich';
			const pubDate = article.publishedAt
				? new Date(article.publishedAt).toUTCString()
				: new Date(article._updatedAt).toUTCString();

			return `
		<item>
			<title><![CDATA[${article.title}]]></title>
			<link>${articleUrl}</link>
			<guid isPermaLink="true">${articleUrl}</guid>
			<description><![CDATA[${article.excerpt ?? ''}]]></description>
			<pubDate>${pubDate}</pubDate>
			<author>${authorName}</author>
			${article.categoryTitle ? `<category>${article.categoryTitle}</category>` : ''}
		</item>`;
		})
		.join('');

	const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
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

	return new Response(rssFeed, {
		headers: {
			'Cache-Control': 'public, max-age=3600, s-maxage=3600',
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
}
