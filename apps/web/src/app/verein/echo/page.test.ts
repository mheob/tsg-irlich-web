import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import EchoOverviewPage, { generateMetadata } from '@/app/verein/echo/page';
import { Hero } from '@/components/section/hero';
import type { client } from '@/lib/sanity/client';
import {
	echoIssuesQuery,
	echoIssuesTotalQuery,
	echoOverviewPageQuery,
} from '@/lib/sanity/queries/pages/echo';

import { findElement, findElements } from '../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../test-utils/sanity-client-mock';
import { IssueGrid } from './_sections/issue-grid';
import { LatestIssue } from './_sections/latest-issue';

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
	issues?: ArchiveIssue[];
	page?: typeof PAGE | null;
}

/**
 * Answers the page, the total and every slice of the newest-first list from one array.
 *
 * @param archive - What the dataset holds.
 * @param archive.issues - The finished issues, newest first.
 * @param archive.page - The archive's own document.
 */
function mockArchive({ issues = [], page = PAGE }: Archive): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
		if (query === echoOverviewPageQuery) return page;
		if (query === echoIssuesTotalQuery) return issues.length;
		if (query === echoIssuesQuery) return issues.slice(Number(params?.start), Number(params?.end));
		throw new Error(`unexpected query: ${query}`);
	});
}

/**
 * The props Next.js hands the archive.
 *
 * @param seite - The `seite` search parameter.
 * @returns The page props.
 */
function props(seite?: string): PageProps<'/verein/echo'> {
	return {
		params: Promise.resolve({}),
		searchParams: Promise.resolve(seite ? { seite } : {}),
	};
}

const YEARS = Array.from({ length: 20 }, (_, index) => 2025 - index);

describe('the tsg-echo archive', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	it('gives up without its page document', async () => {
		mockArchive({ page: null });

		await expect(EchoOverviewPage(props())).rejects.toThrow('NEXT_NOT_FOUND');
	});

	it('heads the page with its title and subtitle', async () => {
		mockArchive({});

		const hero = findElement(await EchoOverviewPage(props()), Hero);

		expect(hero?.props).toMatchObject({
			subTitle: 'Vereinsgeschichte zum Durchblättern',
			title: 'TSG-Echo',
		});
	});

	it('shows the newest issue as the wide card', async () => {
		mockArchive({ issues: YEARS.map((year) => issue(year)) });

		const latest = findElement(await EchoOverviewPage(props()), LatestIssue);

		expect(latest?.props.issue).toMatchObject({ title: 'TSG ECHO 2025' });
	});

	it('lists twelve further issues on the first page', async () => {
		mockArchive({ issues: YEARS.map((year) => issue(year)) });

		const grid = findElement(await EchoOverviewPage(props()), IssueGrid);

		expect(grid?.props.issues.map((entry) => entry.title)).toStrictEqual(
			YEARS.slice(1, 13).map((year) => `TSG ECHO ${year}`),
		);
		expect(grid?.props.hasNextPage).toBe(true);
	});

	it('continues with the remaining issues on the second page', async () => {
		mockArchive({ issues: YEARS.map((year) => issue(year)) });

		const grid = findElement(await EchoOverviewPage(props('2')), IssueGrid);

		expect(grid?.props.issues).toHaveLength(7);
		expect(grid?.props).toMatchObject({ currentPage: 2, hasNextPage: false });
	});

	// Review focus 3.
	it.each(['0', '-1', 'zwei'])('treats ?seite=%s as the first page', async (seite) => {
		mockArchive({ issues: YEARS.map((year) => issue(year)) });

		const grid = findElement(await EchoOverviewPage(props(seite)), IssueGrid);

		expect(grid?.props.currentPage).toBe(1);
	});

	it('answers a page past the end with 404', async () => {
		mockArchive({ issues: YEARS.map((year) => issue(year)) });

		await expect(EchoOverviewPage(props('3'))).rejects.toThrow('NEXT_NOT_FOUND');
		expect(vi.mocked(notFound)).toHaveBeenCalledWith();
	});

	// Review focus 1: production until the archive import.
	it('stays a page without any finished issue', async () => {
		mockArchive({ issues: [] });

		const page = await EchoOverviewPage(props());

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

		const page = await EchoOverviewPage(props());

		expect(findElements(page, Link).map((element) => element.props.href)).toContain('/kontakt');
	});

	it('shows no grid when the newest issue is the only one', async () => {
		mockArchive({ issues: [issue(2025)] });

		const page = await EchoOverviewPage(props());

		expect(findElement(page, IssueGrid)).toBeUndefined();
	});

	describe('metadata', () => {
		it('is empty without its page document', async () => {
			mockArchive({ page: null });

			await expect(generateMetadata(props())).resolves.toStrictEqual({});
		});

		it('points every page of the archive at itself', async () => {
			mockArchive({});

			const metadata = await generateMetadata(props('2'));

			expect(metadata.alternates?.canonical).toBe('/verein/echo?seite=2');
		});
	});
});
