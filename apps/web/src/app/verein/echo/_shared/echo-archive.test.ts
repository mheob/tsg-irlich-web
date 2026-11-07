import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { PortableText } from '@/components/ui/portable-text';
import type { client } from '@/lib/sanity/client';
import { aboutUsHeroImageQuery } from '@/lib/sanity/queries/pages/about-us';
import {
	echoContactPersonsQuery,
	echoIssuesQuery,
	echoIssuesTotalQuery,
	echoOverviewPageQuery,
} from '@/lib/sanity/queries/pages/echo';
import type { EchoContactPersonsQueryResult } from '@/types/sanity.types';

import { META_OPEN_GRAPH_IMAGE, PAGE_HERO_IMAGE } from '../../../../../test-utils/page-images';
import { findElement, findElements, sectionTypes } from '../../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../../test-utils/sanity-client-mock';
import { IssueGrid } from '../_sections/issue-grid';
import { LatestIssue } from '../_sections/latest-issue';
import { EchoArchive } from './echo-archive';
import { getEchoArchiveMetadata } from './echo-archive-metadata';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
		fetch: vi.fn(),
	} as unknown as typeof client,
}));

vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

const mockedFetch = clientFetchMock();

const PAGE = {
	intro: null,
	meta: null,
	subtitle: 'Vereinsgeschichte zum Durchblättern',
	title: 'TSG-Echo',
};

const CONTACT_PERSONS: NonNullable<EchoContactPersonsQueryResult> = {
	contactPersons: [],
	intro: 'Fragen zum TSG-Echo?',
	subtitle: 'Ansprechpartner',
	title: 'Wir sind für dich da',
};

/**
 * An issue of the given year, as far as the archive reads it.
 *
 * @param year - The year it appeared in.
 * @returns The issue.
 */
function issue(year: number): ArchiveIssue {
	return {
		_id: `echo-${year}`,
		releaseDate: `${year}-04-01`,
		slug: `tsg-echo-${year}`,
		title: `TSG ECHO ${year}`,
	};
}

interface ArchiveIssue {
	_id: string;
	releaseDate: string;
	slug: string;
	title: string;
}

interface Archive {
	contactPersons?: EchoContactPersonsQueryResult;
	heroImage?: unknown;
	issues?: ArchiveIssue[];
	page?: typeof PAGE | null;
}

/**
 * Answers the page, the total and every slice of the newest-first list from one array.
 *
 * @param archive - What the dataset holds.
 * @param archive.contactPersons - The contact persons section of the news overview.
 * @param archive.heroImage - The hero image of the about page.
 * @param archive.issues - The finished issues, newest first.
 * @param archive.page - The archive's own document.
 */
function mockArchive({
	contactPersons = CONTACT_PERSONS,
	heroImage = PAGE_HERO_IMAGE,
	issues = [],
	page = PAGE,
}: Archive): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
		if (query === echoOverviewPageQuery) return page;
		if (query === aboutUsHeroImageQuery) return heroImage;
		if (query === echoContactPersonsQuery) return contactPersons;
		if (query === echoIssuesTotalQuery) return issues.length;
		if (query === echoIssuesQuery) return issues.slice(Number(params?.start), Number(params?.end));
		throw new Error(`unexpected query: ${query}`);
	});
}

const YEARS = Array.from({ length: 20 }, (_, index) => 2025 - index);

/**
 * The cache options the archive fetches with: an hour, tagged with the types the query reads.
 *
 * @param tags - The document types.
 * @returns The options of `client.fetch`.
 */
function cachedAs(...tags: string[]): unknown {
	return { next: { revalidate: 3600, tags } };
}

describe('the tsg-echo archive', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	it('gives up without its page document', async () => {
		mockArchive({ page: null });

		await expect(EchoArchive({ currentPage: 1 })).rejects.toThrow('NEXT_NOT_FOUND');
	});

	it('heads the page with its title and subtitle', async () => {
		mockArchive({});

		const hero = findElement(await EchoArchive({ currentPage: 1 }), Hero);

		expect(hero?.props).toMatchObject({
			subTitle: 'Vereinsgeschichte zum Durchblättern',
			title: 'TSG-Echo',
		});
	});

	it('renders the blocks of its intro', async () => {
		const blocks = [
			{
				_key: 'intro1',
				_type: 'block',
				children: [{ _key: 'intro1s', _type: 'span', marks: [], text: 'Das TSG ECHO …' }],
				markDefs: [],
				style: 'normal',
			},
		];
		mockArchive({
			page: {
				...PAGE,
				intro: { _type: 'simpleBlockContent', text: blocks },
			} as unknown as typeof PAGE,
		});

		const intro = findElement(await EchoArchive({ currentPage: 1 }), PortableText);

		expect(intro?.props.value).toStrictEqual(blocks);
	});

	it('leaves the intro out when it holds no text', async () => {
		mockArchive({
			page: { ...PAGE, intro: { _type: 'simpleBlockContent' } } as unknown as typeof PAGE,
		});

		const page = await EchoArchive({ currentPage: 1 });

		expect(findElement(page, PortableText)).toBeUndefined();
	});

	it('shows the hero image of the about page', async () => {
		mockArchive({});

		const hero = findElement(await EchoArchive({ currentPage: 1 }), Hero);

		expect(hero?.props.image?.alt).toBe('Hero der Seite');
		expect(hero?.props.image?.src).toContain('heroimg111');
	});

	it('shares the hero image of the about page as preview image', async () => {
		mockArchive({});

		const metadata = await getEchoArchiveMetadata(1);
		const openGraphImage = metadata.openGraph?.images as undefined | { url?: string };

		expect(openGraphImage?.url).toContain('heroimg111');
	});

	it('prefers the open graph image of the archive over the hero image', async () => {
		mockArchive({
			page: { ...PAGE, meta: { openGraphImage: META_OPEN_GRAPH_IMAGE } } as unknown as typeof PAGE,
		});

		const metadata = await getEchoArchiveMetadata(1);
		const openGraphImage = metadata.openGraph?.images as undefined | { url?: string };

		expect(openGraphImage?.url).toContain('ogimg222');
	});

	it('shows the newest issue as the wide card', async () => {
		mockArchive({ issues: YEARS.map((year) => issue(year)) });

		const latest = findElement(await EchoArchive({ currentPage: 1 }), LatestIssue);

		expect(latest?.props.issue).toMatchObject({ title: 'TSG ECHO 2025' });
	});

	it('lists twelve further issues on the first page', async () => {
		mockArchive({ issues: YEARS.map((year) => issue(year)) });

		const grid = findElement(await EchoArchive({ currentPage: 1 }), IssueGrid);

		expect(grid?.props.issues.map((entry) => entry.title)).toStrictEqual(
			YEARS.slice(1, 13).map((year) => `TSG ECHO ${year}`),
		);
		expect(grid?.props).toMatchObject({
			currentPage: 1,
			perPage: 12,
			startIndex: 1,
			totalIssues: 20,
		});
	});

	it('continues with the remaining issues on the second page', async () => {
		mockArchive({ issues: YEARS.map((year) => issue(year)) });

		const grid = findElement(await EchoArchive({ currentPage: 2 }), IssueGrid);

		expect(grid?.props.issues).toHaveLength(7);
		expect(grid?.props).toMatchObject({ currentPage: 2, totalIssues: 20 });
	});

	it('answers a page past the end with 404', async () => {
		mockArchive({ issues: YEARS.map((year) => issue(year)) });

		await expect(EchoArchive({ currentPage: 3 })).rejects.toThrow('NEXT_NOT_FOUND');
		expect(vi.mocked(notFound)).toHaveBeenCalledWith();
	});

	// Review focus 1: production until the archive import.
	it('stays a page without any finished issue', async () => {
		mockArchive({ issues: [] });

		const page = await EchoArchive({ currentPage: 1 });

		expect(findElement(page, LatestIssue)).toBeUndefined();
		expect(findElement(page, IssueGrid)).toBeUndefined();
		const paragraphs = findElements<ComponentProps<'p'>>(page, 'p');
		expect(
			paragraphs.some((element) => element.props.children === 'Noch keine Ausgaben online.'),
		).toBe(true);
		expect(findElements(page, Link).map((element) => element.props.href)).not.toContain('/kontakt');
	});

	it('tells readers how to have themselves removed from an issue', async () => {
		mockArchive({ issues: YEARS.map((year) => issue(year)) });

		const page = await EchoArchive({ currentPage: 1 });

		expect(findElements(page, Link).map((element) => element.props.href)).toContain('/kontakt');
	});

	it('shows no grid when the newest issue is the only one', async () => {
		mockArchive({ issues: [issue(2025)] });

		const page = await EchoArchive({ currentPage: 1 });

		expect(findElement(page, IssueGrid)).toBeUndefined();
	});

	it('shows the contact persons of the news overview right before the newsletter', async () => {
		mockArchive({});

		const page = await EchoArchive({ currentPage: 1 });

		expect(findElement(page, ContactPersons)?.props).toMatchObject(CONTACT_PERSONS);
		expect(sectionTypes(page).slice(-2)).toStrictEqual([ContactPersons, Newsletter]);
	});

	it('leaves the contact persons out when the news overview has none', async () => {
		mockArchive({ contactPersons: null });

		const page = await EchoArchive({ currentPage: 1 });

		expect(findElement(page, ContactPersons)).toBeUndefined();
		expect(findElement(page, Newsletter)).toBeDefined();
	});

	// WEB-415: without cache options every request asked Sanity again. The tags are the types the
	// revalidation webhook expires; the hour catches what it does not.
	it('caches every fetch for an hour under the types its query reads', async () => {
		mockArchive({ issues: [issue(2025), issue(2024)] });

		await EchoArchive({ currentPage: 1 });

		const optionsByQuery = new Map(mockedFetch.mock.calls.map((call) => [call[0], call[2]]));

		expect(mockedFetch).toHaveBeenCalledTimes(6);
		expect(Object.fromEntries(optionsByQuery)).toStrictEqual({
			[aboutUsHeroImageQuery]: cachedAs('aboutUs'),
			[echoContactPersonsQuery]: cachedAs('newsOverview', 'person'),
			[echoIssuesQuery]: cachedAs('echo.issue'),
			[echoIssuesTotalQuery]: cachedAs('echo.issue'),
			[echoOverviewPageQuery]: cachedAs('echoOverview'),
		});
	});

	describe('metadata', () => {
		it('reads its documents with the same cache options as the page', async () => {
			mockArchive({});

			await getEchoArchiveMetadata(1);

			expect(mockedFetch.mock.calls.map((call) => call[2])).toStrictEqual([
				cachedAs('echoOverview'),
				cachedAs('aboutUs'),
			]);
		});

		it('is empty without its page document', async () => {
			mockArchive({ page: null });

			await expect(getEchoArchiveMetadata(1)).resolves.toStrictEqual({});
		});

		it('points every page of the archive at itself', async () => {
			mockArchive({});

			const metadata = await getEchoArchiveMetadata(2);

			expect(metadata.alternates?.canonical).toBe('/verein/echo?seite=2');
		});
	});
});
