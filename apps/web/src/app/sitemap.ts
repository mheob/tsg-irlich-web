import type { MetadataRoute } from 'next';

import { client } from '@/lib/sanity/client';
import {
	sitemapDepartmentsQuery,
	sitemapEchoIssuesQuery,
	sitemapFormsQuery,
	sitemapGroupsQuery,
	sitemapNewsArticlesQuery,
	sitemapNewsCategoriesQuery,
} from '@/lib/sanity/queries/sitemap';
import type {
	SitemapDepartmentsQueryResult,
	SitemapEchoIssuesQueryResult,
	SitemapFormsQueryResult,
	SitemapGroupsQueryResult,
	SitemapNewsArticlesQueryResult,
	SitemapNewsCategoriesQueryResult,
} from '@/types/sanity.types';
import {
	ECHO_OVERVIEW_PATH,
	getEchoIssuePath,
	getInternalHref,
	PARTNER_PAGE_PATH,
	VOLUNTEER_PAGE_PATH,
} from '@/utils/links';
import { getBaseUrl } from '@/utils/url';

/**
 * Without a revalidate interval Next.js prerenders the sitemap as a static file at build time, and it
 * kept the state of the last deployment (WEB-403). With it the route is regenerated at most an hour
 * after a change. That hour is what bounds it: on Vercel the webhook's `revalidatePath` and
 * `revalidateTag` do not reach the sitemap's cache entry, as two probes on staging showed, while
 * they do refresh the pages at once. A literal, since Next.js reads it statically.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = getBaseUrl();

	// Each query carries the types it reads as tags, which the revalidation webhook expires for the
	// changed document's type. They keep the hourly regeneration from rendering cached data that is
	// older than the change (WEB-403).
	const [newsArticles, newsCategories, departments, groups, echoIssues, forms] = await Promise.all([
		client.fetch<SitemapNewsArticlesQueryResult>(
			sitemapNewsArticlesQuery,
			{},
			{ next: { tags: ['news.article', 'news.category'] } },
		),
		client.fetch<SitemapNewsCategoriesQueryResult>(
			sitemapNewsCategoriesQuery,
			{},
			{ next: { tags: ['news.category'] } },
		),
		client.fetch<SitemapDepartmentsQueryResult>(
			sitemapDepartmentsQuery,
			{},
			{ next: { tags: ['department'] } },
		),
		client.fetch<SitemapGroupsQueryResult>(
			sitemapGroupsQuery,
			{},
			{ next: { tags: ['group', 'department'] } },
		),
		client.fetch<SitemapEchoIssuesQueryResult>(
			sitemapEchoIssuesQuery,
			{},
			{ next: { tags: ['echo.issue'] } },
		),
		client.fetch<SitemapFormsQueryResult>(sitemapFormsQuery, {}, { next: { tags: ['form'] } }),
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
			priority: 0.6,
			url: `${baseUrl}${PARTNER_PAGE_PATH}`,
		},
		{
			changeFrequency: 'monthly',
			priority: 0.6,
			url: `${baseUrl}${VOLUNTEER_PAGE_PATH}`,
		},
		{
			changeFrequency: 'monthly',
			priority: 0.6,
			url: `${baseUrl}${ECHO_OVERVIEW_PATH}`,
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

	// Department pages (e.g., /angebot/fussball)
	const departmentPages: MetadataRoute.Sitemap = departments.flatMap((department) => {
		const href = getInternalHref({ _type: 'department', slug: department.slug });
		if (!href) {
			return [];
		}

		return [
			{
				changeFrequency: 'weekly' as const,
				lastModified: new Date(department.lastModified),
				priority: 0.7,
				url: `${baseUrl}${href}`,
			},
		];
	});

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

	// TSG-Echo issues (e.g., /verein/echo/tsg-echo-2025)
	const echoIssuePages: MetadataRoute.Sitemap = echoIssues.map((echoIssue) => ({
		changeFrequency: 'yearly' as const,
		lastModified: new Date(echoIssue.lastModified),
		priority: 0.4,
		url: `${baseUrl}${getEchoIssuePath(echoIssue.slug)}`,
	}));

	// Registration pages (e.g., /anmeldung/dorfturnier-2027)
	const formPages: MetadataRoute.Sitemap = forms.flatMap((form) => {
		const href = getInternalHref({ _type: 'form', slug: form.slug });
		if (!href) {
			return [];
		}

		return [
			{
				changeFrequency: 'weekly' as const,
				lastModified: new Date(form.lastModified),
				priority: 0.5,
				url: `${baseUrl}${href}`,
			},
		];
	});

	return [
		...staticPages,
		...departmentPages,
		...groupPages,
		...newsCategoryPages,
		...newsArticlePages,
		...echoIssuePages,
		...formPages,
	];
}
