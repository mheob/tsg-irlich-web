import { notFound } from 'next/navigation';
import type { ComponentProps, ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import OfferPage, { generateMetadata } from '@/app/angebot/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import { GroupCard } from '@/components/ui/group-card';
import type { client } from '@/lib/sanity/client';
import { departmentCardsQuery } from '@/lib/sanity/queries/departments';
import { offerPageQuery } from '@/lib/sanity/queries/pages/offer';

import { itFollowsTheMetadataContract } from '../../../test-utils/page-contract';
import { findElement, findElements } from '../../../test-utils/react-tree';
import { clientFetchMock } from '../../../test-utils/sanity-client-mock';
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

function buildPage(meta?: Record<string, unknown>): Record<string, unknown> {
	return {
		content: {
			contactPersonsSection: { contactPersons: [], title: 'Ansprechpartner' },
			departmentsSection: { title: 'Unsere Abteilungen' },
			stats: [{ label: 'Abteilungen', value: 6 }],
		},
		meta,
		subtitle: 'Sport für alle',
		title: 'Angebot',
	};
}

interface OfferResults {
	departments?: unknown[];
	page?: unknown;
}

// The two queries run inside one `Promise.all`, so keying on the query keeps the fixtures
// independent of the order they resolve in.
function mockSanity({ departments = [], page = buildPage() }: OfferResults = {}): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string) => {
		if (query === offerPageQuery) return page;
		if (query === departmentCardsQuery) return departments;
		throw new Error(`unexpected query: ${query}`);
	});
}

function department(slug: string | null, title: string): Record<string, unknown> {
	return {
		_id: `department-${title}`,
		cardImage: { _type: 'extendedImage', alt: title },
		icon: 'Fussball',
		slug,
		title,
	};
}

/**
 * Lists the cards the departments section of the offer page renders.
 *
 * The section is a plain function component, so calling it yields its element tree without a DOM,
 * like the page itself.
 *
 * @returns The cards, in the order they appear on the page.
 */
async function renderedCards(): Promise<ReactElement<ComponentProps<typeof GroupCard>>[]> {
	const groups = findElement(await OfferPage(), Groups);
	if (!groups) {
		throw new Error('Expected the page to render the departments section');
	}
	return findElements(Groups(groups.props), GroupCard);
}

describe('offer page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: buildPage,
			fetchMock: mockedFetch,
			generateMetadata,
			path: '/angebot',
			title: 'Angebot',
		});
	});

	describe('rendering', () => {
		it('gives up when the document is missing', async () => {
			mockSanity({ page: null });

			await expect(OfferPage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('heads the page with its title and subtitle', async () => {
			mockSanity();

			const hero = findElement(await OfferPage(), Hero);

			expect(hero?.props).toMatchObject({ subTitle: 'Sport für alle', title: 'Angebot' });
		});

		it('hands every section the slice of the document it renders', async () => {
			mockSanity();

			const page = await OfferPage();

			expect(findElement(page, Groups)?.props).toMatchObject({ title: 'Unsere Abteilungen' });
			expect(findElement(page, Stats)?.props.stats).toMatchObject([{ label: 'Abteilungen' }]);
			expect(findElement(page, ContactPersons)?.props).toMatchObject({
				title: 'Ansprechpartner',
			});
		});

		it('renders one card per department, in query order', async () => {
			mockSanity({
				departments: [department('tanzen', 'Tanzen'), department('fussball', 'Fußball')],
			});

			const cards = await renderedCards();

			expect(cards.map(({ props }) => [props.title, props.href])).toStrictEqual([
				['Tanzen', '/angebot/tanzen'],
				['Fußball', '/angebot/fussball'],
			]);
		});

		it('gives each card the icon and card image of its department', async () => {
			mockSanity({ departments: [department('fussball', 'Fußball')] });

			const cards = await renderedCards();

			expect(cards[0]?.props).toMatchObject({
				icon: 'Fussball',
				image: { _type: 'extendedImage', alt: 'Fußball' },
			});
		});

		it('renders no card for a department without a slug', async () => {
			mockSanity({
				departments: [department(null, 'Ohne Adresse'), department('fussball', 'Fußball')],
			});

			const cards = await renderedCards();

			expect(cards.map(({ props }) => props.title)).toStrictEqual(['Fußball']);
		});

		it('closes with the newsletter sign-up', async () => {
			mockSanity();

			expect(findElement(await OfferPage(), Newsletter)).toBeDefined();
		});

		it('leaves the stats section without a background', async () => {
			mockSanity();

			const stats = findElement(await OfferPage(), Stats);

			expect(stats?.props.withBackground).toBeUndefined();
		});
	});
});
