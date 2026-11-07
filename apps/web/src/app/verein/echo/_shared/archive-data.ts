import { client } from '@/lib/sanity/client';
import { aboutUsHeroImageQuery } from '@/lib/sanity/queries/pages/about-us';
import {
	echoContactPersonsQuery,
	echoIssuesQuery,
	echoIssuesTotalQuery,
	echoOverviewPageQuery,
} from '@/lib/sanity/queries/pages/echo';
import type {
	AboutUsHeroImageQueryResult,
	EchoContactPersonsQueryResult,
	EchoIssuesQueryResult,
	EchoIssuesTotalQueryResult,
	EchoOverviewPageQueryResult,
} from '@/types/sanity.types';

/**
 * How long the archive keeps what it read from Sanity, in seconds. The revalidation webhook expires
 * it earlier: the paths of the archive, and every fetch through the type it reads as its tag.
 */
const REVALIDATE_SECONDS = 3600;

/**
 * The cache options of a fetch, tagged with the document types its query reads. The webhook expires
 * the tag of the type of every document it is called for.
 *
 * @param tags - The document types the query reads.
 * @returns The options for `client.fetch`.
 */
function cacheFor(...tags: string[]): { next: { revalidate: number; tags: string[] } } {
	return { next: { revalidate: REVALIDATE_SECONDS, tags } };
}

/**
 * Reads the archive's own document: its texts and meta.
 *
 * @returns The document, or `null` without one.
 */
async function getArchivePage(): Promise<EchoOverviewPageQueryResult> {
	return client.fetch<EchoOverviewPageQueryResult>(
		echoOverviewPageQuery,
		{},
		cacheFor('echoOverview'),
	);
}

/**
 * Reads the hero image of the about page, which the archive shows.
 *
 * @returns The image, or `null` without one.
 */
async function getArchiveHeroImage(): Promise<AboutUsHeroImageQueryResult> {
	return client.fetch<AboutUsHeroImageQueryResult>(aboutUsHeroImageQuery, {}, cacheFor('aboutUs'));
}

/**
 * Counts the finished issues.
 *
 * @returns Their number.
 */
async function getIssuesTotal(): Promise<EchoIssuesTotalQueryResult> {
	return client.fetch<EchoIssuesTotalQueryResult>(echoIssuesTotalQuery, {}, cacheFor('echo.issue'));
}

/**
 * Reads a slice of the finished issues, newest first.
 *
 * @param start - The index of the first issue.
 * @param end - The index after the last issue.
 * @returns The issues.
 */
async function getIssues(start: number, end: number): Promise<EchoIssuesQueryResult> {
	return client.fetch<EchoIssuesQueryResult>(
		echoIssuesQuery,
		{ end, start },
		cacheFor('echo.issue'),
	);
}

/**
 * Reads the contact persons of the news overview, which the archive shows as well.
 *
 * @returns The section with the persons, their names and roles.
 */
async function getArchiveContactPersons(): Promise<EchoContactPersonsQueryResult> {
	return client.fetch<EchoContactPersonsQueryResult>(
		echoContactPersonsQuery,
		{},
		cacheFor('newsOverview', 'person'),
	);
}

export { getArchiveContactPersons, getArchiveHeroImage, getArchivePage, getIssues, getIssuesTotal };
