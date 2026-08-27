import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import GroupsPage, { generateMetadata } from '@/app/angebot/[group]/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Stats } from '@/components/section/stats';
import type { client } from '@/lib/sanity/client';
import {
	offerGroupsPageContactPersonsQuery,
	offerGroupsPageGroupsQuery,
	offerGroupsPageQuery,
} from '@/lib/sanity/queries/pages/offer-groups';

import { findElement } from '../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../test-utils/sanity-client-mock';
import { Groups } from './_sections/groups';

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
	content: {
		contactPersonsSection: { title: 'Ansprechpartner' },
		groupsSection: { title: 'Unsere Gruppen' },
		stats: [{ label: 'Gruppen', value: 12 }],
	},
	metaDescription: undefined,
	subtitle: 'Alle Gruppen',
	title: 'Angebot',
};

interface GroupResults {
	contactPersons?: null | unknown[];
	groups?: unknown[];
	page?: unknown;
}

function mockSanity({ contactPersons = [], groups = [], page = PAGE }: GroupResults = {}): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string) => {
		if (query === offerGroupsPageQuery) return page;
		if (query === offerGroupsPageGroupsQuery) return groups;
		if (query === offerGroupsPageContactPersonsQuery) return contactPersons;
		throw new Error(`unexpected query: ${query}`);
	});
}

function routeProps(group = 'fussball'): PageProps<'/angebot/[group]'> {
	// `PageProps<'/angebot/[group]'>` types the params as a promise.
	return { params: Promise.resolve({ group }) } as unknown as PageProps<'/angebot/[group]'>;
}

/**
 * Reads the parameters a given query was called with.
 *
 * @param query - The query to look for among the recorded calls.
 * @returns The parameters of that call, or `undefined` when it never ran.
 */
function paramsOf(query: string): Record<string, unknown> | undefined {
	return mockedFetch.mock.calls.find(([called]) => called === query)?.[1];
}

describe('department page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		it('is empty when the document is missing', async () => {
			mockSanity({ page: null });

			await expect(generateMetadata(routeProps())).resolves.toStrictEqual({});
		});

		it('names the department in the title', async () => {
			mockSanity();

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				title: 'Fußball bei der TSG Irlich',
			});
		});

		it('falls back to a generic title for an unknown department', async () => {
			mockSanity();

			await expect(generateMetadata(routeProps('gibt-es-nicht'))).resolves.toMatchObject({
				title: 'Sport bei der TSG Irlich',
			});
		});

		it('takes the description from the document', async () => {
			mockSanity({ page: { ...PAGE, metaDescription: 'Alle Fußballgruppen' } });

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: 'Alle Fußballgruppen',
				openGraph: { description: 'Alle Fußballgruppen' },
			});
		});

		it('uses an empty description when the document has none', async () => {
			mockSanity();

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({ description: '' });
		});

		it('shows the department image as the open graph image', async () => {
			mockSanity();

			const metadata = await generateMetadata(routeProps());

			expect(metadata.openGraph?.images).toBeDefined();
		});
	});

	describe('rendering', () => {
		it('gives up for an unknown department', async () => {
			mockSanity();

			await expect(GroupsPage(routeProps('gibt-es-nicht'))).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('gives up when the document is missing', async () => {
			mockSanity({ page: null });

			await expect(GroupsPage(routeProps())).rejects.toThrow('NEXT_NOT_FOUND');
		});

		it('heads the page with the document title and the department', async () => {
			mockSanity();

			const hero = findElement(await GroupsPage(routeProps()), Hero);

			expect(hero?.props).toMatchObject({ subTitle: 'Alle Gruppen', title: 'Angebot Fußball' });
		});

		it('asks for the groups of the current department', async () => {
			mockSanity();

			await GroupsPage(routeProps('taekwondo'));

			expect(paramsOf(offerGroupsPageGroupsQuery)).toStrictEqual({
				groupType: 'group.taekwondo',
			});
		});

		it('asks for the soccer department contact on the soccer page', async () => {
			mockSanity();

			await GroupsPage(routeProps());

			expect(paramsOf(offerGroupsPageContactPersonsQuery)).toMatchObject({
				email: 'fussball@tsg-irlich.de',
			});
		});

		it('asks for the mass sport contact on every other department page', async () => {
			mockSanity();

			await GroupsPage(routeProps('tanzen'));

			expect(paramsOf(offerGroupsPageContactPersonsQuery)).toMatchObject({
				email: 'breitensport@tsg-irlich.de',
			});
		});

		it('hands the groups section the department and its groups', async () => {
			mockSanity({ groups: [{ _id: 'group-1', title: 'Herren 1' }] });

			const groups = findElement(await GroupsPage(routeProps()), Groups);

			expect(groups?.props).toMatchObject({
				currentDepartment: { _type: 'group.soccer' },
				groups: [{ _id: 'group-1' }],
				title: 'Unsere Gruppen',
			});
		});

		it('lists the contact persons the query returned', async () => {
			mockSanity({ contactPersons: [{ _id: 'person-1' }] });

			const persons = findElement(await GroupsPage(routeProps()), ContactPersons);

			expect(persons?.props.contactPersons).toMatchObject([{ _id: 'person-1' }]);
		});

		it('falls back to no contact persons when the query returned nothing', async () => {
			mockSanity({ contactPersons: null });

			const persons = findElement(await GroupsPage(routeProps()), ContactPersons);

			expect(persons?.props.contactPersons).toStrictEqual([]);
		});

		it('shows the statistics of the document', async () => {
			mockSanity();

			const stats = findElement(await GroupsPage(routeProps()), Stats);

			expect(stats?.props.stats).toMatchObject([{ label: 'Gruppen' }]);
		});
	});
});
