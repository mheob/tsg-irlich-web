import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MembershipPage, { generateMetadata } from '@/app/mitgliedschaft/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Pricing } from '@/components/section/pricing';
import type { client } from '@/lib/sanity/client';

import { itFollowsTheMetadataContract } from '../../../test-utils/page-contract';
import { findElement } from '../../../test-utils/react-tree';
import { clientFetchMock } from '../../../test-utils/sanity-client-mock';
import { Downloads } from './_sections/downloads';
import { Intro } from './_sections/intro';

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
		membership: {
			contactPersonsSection: { contactPersons: [], title: 'Ansprechpartner' },
			downloadsSection: { title: 'Formulare' },
			intro: 'Mitglied werden ist einfach.',
			meta,
			subtitle: 'Werde Teil der TSG',
			title: 'Mitgliedschaft',
		},
		pricingSection: { title: 'Beiträge' },
	};
}

describe('membership page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: buildPage,
			fetchMock: mockedFetch,
			generateMetadata,
			// Both parts of the page come from one query, so an absent membership document still
			// resolves to an object — only its `membership` property is missing.
			missingDocument: { membership: null, pricingSection: null },
			title: 'Mitgliedschaft',
		});
	});

	describe('rendering', () => {
		it.each([
			['membership document', { membership: null, pricingSection: { title: 'Beiträge' } }],
			['pricing section', { ...buildPage(), pricingSection: null }],
		])('gives up without the %s', async (_name, document) => {
			mockedFetch.mockResolvedValue(document);

			await expect(MembershipPage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('heads the page with the title and subtitle of the membership document', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const hero = findElement(await MembershipPage(), Hero);

			expect(hero?.props).toMatchObject({
				subTitle: 'Werde Teil der TSG',
				title: 'Mitgliedschaft',
			});
		});

		it('hands every section the slice of the document it renders', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const page = await MembershipPage();

			expect(findElement(page, Intro)?.props.text).toBe('Mitglied werden ist einfach.');
			expect(findElement(page, Pricing)?.props).toMatchObject({ title: 'Beiträge' });
			expect(findElement(page, Downloads)?.props).toMatchObject({ title: 'Formulare' });
			expect(findElement(page, ContactPersons)?.props).toMatchObject({
				title: 'Ansprechpartner',
			});
			expect(findElement(page, Newsletter)).toBeDefined();
		});
	});
});
