import type { MetadataRoute } from 'next';

import { client } from '@/lib/sanity/client';
import {
	sitemapGroupsQuery,
	sitemapNewsArticlesQuery,
	sitemapNewsCategoriesQuery,
} from '@/lib/sanity/queries/sitemap';
import type {
	SitemapGroupsQueryResult,
	SitemapNewsArticlesQueryResult,
	SitemapNewsCategoriesQueryResult,
} from '@/types/sanity.types';
import { groupSections } from '@/utils/groups';
import { getInternalHref } from '@/utils/links';
import { getBaseUrl } from '@/utils/url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = getBaseUrl();

	// Fetch dynamic content from Sanity
	const [newsArticles, newsCategories, groups] = await Promise.all([
		client.fetch<SitemapNewsArticlesQueryResult>(sitemapNewsArticlesQuery),
		client.fetch<SitemapNewsCategoriesQueryResult>(sitemapNewsCategoriesQuery),
		client.fetch<SitemapGroupsQueryResult>(sitemapGroupsQuery),
	]);

	// Static pages
	const staticPages: MetadataRoute.Sitemap = [
		{
			changeFrequency: 'weekly',
			priority: 1,
			url: baseUrl,
		},
		{
			changeFrequency: 'monthly',
			priority: 0.8,
			url: `${baseUrl}/angebot`,
		},
		{
			changeFrequency: 'weekly',
			priority: 0.8,
			url: `${baseUrl}/news`,
		},
		{
			changeFrequency: 'monthly',
			priority: 0.7,
			url: `${baseUrl}/verein`,
		},
		{
			changeFrequency: 'monthly',
			priority: 0.7,
			url: `${baseUrl}/kontakt`,
		},
		{
			changeFrequency: 'monthly',
			priority: 0.5,
			url: `${baseUrl}/kontakt/feedback`,
		},
		{
			changeFrequency: 'monthly',
			priority: 0.7,
			url: `${baseUrl}/mitgliedschaft`,
		},
		{
			changeFrequency: 'yearly',
			priority: 0.3,
			url: `${baseUrl}/datenschutz`,
		},
		{
			changeFrequency: 'yearly',
			priority: 0.3,
			url: `${baseUrl}/impressum`,
		},
		{
			changeFrequency: 'yearly',
			priority: 0.3,
			url: `${baseUrl}/barrierefreiheit`,
		},
	];

	// Group category pages (e.g., /angebot/fussball)
	const groupCategoryPages: MetadataRoute.Sitemap = groupSections.map((section) => ({
		changeFrequency: 'weekly',
		priority: 0.7,
		url: `${baseUrl}${section.slug}`,
	}));

	// Individual group pages (e.g., /angebot/fussball/herren-1)
	const groupPages: MetadataRoute.Sitemap = groups.flatMap((group) => {
		const href = getInternalHref(group);
		if (!href) {
			return [];
		}

		return [
			{
				changeFrequency: 'monthly' as const,
				lastModified: group.lastModified ? new Date(group.lastModified) : undefined,
				priority: 0.6,
				url: `${baseUrl}${href}`,
			},
		];
	});

	// News category pages (e.g., /news/vereinsleben)
	const newsCategoryPages: MetadataRoute.Sitemap = newsCategories
		.filter((category) => category.slug)
		.map((category) => ({
			changeFrequency: 'weekly' as const,
			lastModified: category.lastModified ? new Date(category.lastModified) : undefined,
			priority: 0.6,
			url: `${baseUrl}/news/${category.slug}`,
		}));

	// News article pages (e.g., /news/vereinsleben/artikel-slug)
	const newsArticlePages: MetadataRoute.Sitemap = newsArticles
		.filter((article) => article.slug && article.category)
		.map((article) => ({
			changeFrequency: 'monthly' as const,
			lastModified: article.lastModified ? new Date(article.lastModified) : undefined,
			priority: 0.5,
			url: `${baseUrl}/news/${article.category}/${article.slug}`,
		}));

	return [
		...staticPages,
		...groupCategoryPages,
		...groupPages,
		...newsCategoryPages,
		...newsArticlePages,
	];
}
