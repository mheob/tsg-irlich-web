import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import type { client } from '@/lib/sanity/client';

import { itFollowsTheMetadataContract } from '../../../../test-utils/page-contract';
import { PAGE_HERO_IMAGE } from '../../../../test-utils/page-images';
import { findElement } from '../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../test-utils/sanity-client-mock';
import { Partners } from './_sections/partners';
import { Reasons } from './_sections/reasons';
import { Ways } from './_sections/ways';
import PartnerPage, { generateMetadata } from './page';

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

const PERSON = { _id: 'person-1', firstName: 'Max', lastName: 'Muster' };
const INQUIRY = { email: 'partner@tsg-irlich.de', subject: 'Sponsoring bei der TSG Irlich' };

function buildPage(
	meta?: Record<string, unknown>,
	contactPersons: unknown[] = [],
): Record<string, unknown> {
	return {
		partnerPage: {
			content: {
				contactPersonsSection: { contactPersons, subtitle: 'Kontakt', title: 'Ansprechpartner' },
				partnersSection: { subtitle: 'Danke', title: 'Unsere Partner' },
				waysSection: { subtitle: 'Mitmachen', title: 'So kannst du uns unterstützen' },
				whySection: { subtitle: 'Warum', title: 'Warum Partner werden' },
			},
			inquiry: INQUIRY,
			meta,
			subtitle: 'Gemeinsam stark',
			title: 'Sponsoren & Partner',
		},
		sponsors: [{ _id: 'sponsor-1', name: 'Muster GmbH', website: null }],
	};
}

describe('partner page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: (meta) => buildPage(meta),
			buildWithHeroImage: (heroImage, meta) => {
				const document = buildPage(meta) as { partnerPage: Record<string, unknown> };
				return { ...document, partnerPage: { ...document.partnerPage, heroImage } };
			},
			fetchMock: mockedFetch,
			generateMetadata,
			missingDocument: { partnerPage: null, sponsors: [] },
			path: '/verein/partner',
			title: 'Sponsoren & Partner',
		});
	});

	describe('meta description fallback', () => {
		it('describes the page with the intro of the first section', async () => {
			const document = buildPage() as { partnerPage: { content: Record<string, unknown> } };
			mockedFetch.mockResolvedValue({
				...document,
				partnerPage: {
					...document.partnerPage,
					content: {
						...document.partnerPage.content,
						whySection: { intro: 'Warum du Partner wirst', title: 'Warum' },
					},
				},
			});

			await expect(generateMetadata()).resolves.toMatchObject({
				description: 'Warum du Partner wirst',
			});
		});
	});

	describe('rendering', () => {
		it('answers 404 without a published page', async () => {
			mockedFetch.mockResolvedValue({ partnerPage: null, sponsors: [] });

			await expect(PartnerPage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('shows the hero image, title and subtitle of the page', async () => {
			const document = buildPage() as { partnerPage: Record<string, unknown> };
			mockedFetch.mockResolvedValue({
				...document,
				partnerPage: { ...document.partnerPage, heroImage: PAGE_HERO_IMAGE },
			});

			const hero = findElement(await PartnerPage(), Hero);

			expect(hero?.props.image?.alt).toBe('Hero der Seite');
			expect(hero?.props.image?.src).toContain('heroimg111');
			expect(hero?.props).toMatchObject({
				subTitle: 'Gemeinsam stark',
				title: 'Sponsoren & Partner',
			});
		});

		it('renders the sections in the order of variant A', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const page = (await PartnerPage()) as { props: { children: { type: unknown }[] } };

			expect(page.props.children.map((child) => child.type)).toStrictEqual([
				Hero,
				Reasons,
				Ways,
				Partners,
				ContactPersons,
				Newsletter,
			]);
		});

		it('leaves out a section the editors have not filled', async () => {
			const document = buildPage() as { partnerPage: { content: Record<string, unknown> } };
			mockedFetch.mockResolvedValue({
				...document,
				partnerPage: {
					...document.partnerPage,
					content: { contactPersonsSection: document.partnerPage.content.contactPersonsSection },
				},
			});

			const page = await PartnerPage();

			expect(findElement(page, Reasons)).toBeUndefined();
			expect(findElement(page, Ways)).toBeUndefined();
			expect(findElement(page, Partners)).toBeUndefined();
			expect(findElement(page, ContactPersons)).toBeDefined();
		});

		it('hands the inquiry and the sponsors to the sections that link to it', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const page = await PartnerPage();

			expect(findElement(page, Ways)?.props.inquiry).toStrictEqual(INQUIRY);
			expect(findElement(page, Partners)?.props.inquiry).toStrictEqual(INQUIRY);
			expect(findElement(page, Partners)?.props.sponsors).toHaveLength(1);
		});

		it('drops a contact person that no longer resolves', async () => {
			mockedFetch.mockResolvedValue(buildPage(undefined, [PERSON, null]));

			const persons = findElement(await PartnerPage(), ContactPersons);

			expect(persons?.props.contactPersons).toStrictEqual([PERSON]);
		});
	});
});
