import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OfferPage, { generateMetadata } from '@/app/angebot/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import type { client } from '@/lib/sanity/client';

import { itFollowsTheMetadataContract } from '../../../test-utils/page-contract';
import { findElement } from '../../../test-utils/react-tree';
import { clientFetchMock } from '../../../test-utils/sanity-client-mock';
import { Groups } from './_sections/groups';

vi.mock(import('@/lib/sanity/client'), () => ({
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
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
			title: 'Angebot',
		});
	});

	describe('rendering', () => {
		it('gives up when the document is missing', async () => {
			mockedFetch.mockResolvedValue(null);

			await expect(OfferPage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('heads the page with its title and subtitle', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const hero = findElement(await OfferPage(), Hero);

			expect(hero?.props).toMatchObject({ subTitle: 'Sport für alle', title: 'Angebot' });
		});

		it('hands every section the slice of the document it renders', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const page = await OfferPage();

			expect(findElement(page, Groups)?.props).toMatchObject({ title: 'Unsere Abteilungen' });
			expect(findElement(page, Stats)?.props.stats).toMatchObject([{ label: 'Abteilungen' }]);
			expect(findElement(page, ContactPersons)?.props).toMatchObject({
				title: 'Ansprechpartner',
			});
		});

		it('closes with the newsletter sign-up', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			expect(findElement(await OfferPage(), Newsletter)).toBeDefined();
		});

		it('leaves the stats section without a background', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const stats = findElement(await OfferPage(), Stats);

			expect(stats?.props.withBackground).toBeUndefined();
		});
	});
});
