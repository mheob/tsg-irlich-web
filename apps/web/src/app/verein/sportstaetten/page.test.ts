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
import { Home } from './_sections/home';
import { Others } from './_sections/others';
import VenuePage, { generateMetadata } from './page';

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
const INQUIRY = {
	email: 'info@tsg-irlich.de',
	subject: 'Frage zu den Sportstätten der TSG Irlich',
};

const STADIUM = { _id: 'stadium', groups: [], title: 'Pappelstadion', type: 'cinder' };
const CLUBHOUSE = {
	_id: 'clubhouse',
	groups: [],
	title: 'Vereinsheim Pappelstübchen',
	type: 'clubhouse',
};
const HALL = { _id: 'hall', groups: [], title: 'Mehrzweckhalle Irlich', type: 'hall-1' };
const FIELD = { _id: 'field', groups: [], title: 'Sportplatz Hüllenberg', type: 'grass' };

interface PageOptions {
	contactPersons?: unknown[];
	homeVenues?: unknown[];
	meta?: Record<string, unknown>;
	venues?: unknown[];
}

function buildPage({
	contactPersons = [],
	homeVenues = [STADIUM, CLUBHOUSE],
	meta,
	venues = [STADIUM, CLUBHOUSE, HALL, FIELD],
}: PageOptions = {}): Record<string, unknown> {
	return {
		fallbackImage: null,
		venuePage: {
			content: {
				contactPersonsSection: { contactPersons, subtitle: 'Kontakt', title: 'Dein Vorstand' },
				homeSection: {
					subtitle: 'Unsere Heimat',
					title: 'Pappelstadion & Pappelstübchen',
					venues: homeVenues,
				},
				othersSection: { subtitle: 'Alle weiteren', title: 'Hier sind wir außerdem aktiv' },
			},
			inquiry: INQUIRY,
			meta,
			subtitle: 'Hier spielt die TSG',
			title: 'Sportstätten',
		},
		venues,
	};
}

describe('venue page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: (meta) => buildPage({ meta }),
			buildWithHeroImage: (heroImage, meta) => {
				const document = buildPage({ meta }) as { venuePage: Record<string, unknown> };
				return { ...document, venuePage: { ...document.venuePage, heroImage } };
			},
			fetchMock: mockedFetch,
			generateMetadata,
			missingDocument: { fallbackImage: null, venuePage: null, venues: [] },
			path: '/verein/sportstaetten',
			title: 'Sportstätten',
		});
	});

	describe('meta description fallback', () => {
		it('describes the page with the intro of the home section', async () => {
			const document = buildPage() as { venuePage: { content: Record<string, unknown> } };
			mockedFetch.mockResolvedValue({
				...document,
				venuePage: {
					...document.venuePage,
					content: {
						...document.venuePage.content,
						homeSection: { intro: 'Hier schlägt das Herz der TSG.', title: 'Heimat' },
					},
				},
			});

			await expect(generateMetadata()).resolves.toMatchObject({
				description: 'Hier schlägt das Herz der TSG.',
			});
		});
	});

	describe('rendering', () => {
		it('answers 404 without a published page', async () => {
			mockedFetch.mockResolvedValue({ fallbackImage: null, venuePage: null, venues: [] });

			await expect(VenuePage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('shows the hero image, title and subtitle of the page', async () => {
			const document = buildPage() as { venuePage: Record<string, unknown> };
			mockedFetch.mockResolvedValue({
				...document,
				venuePage: { ...document.venuePage, heroImage: PAGE_HERO_IMAGE },
			});

			const hero = findElement(await VenuePage(), Hero);

			expect(hero?.props.image?.src).toContain('heroimg111');
			expect(hero?.props).toMatchObject({
				subTitle: 'Hier spielt die TSG',
				title: 'Sportstätten',
			});
		});

		it('renders the sections in the order of the spec', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const page = (await VenuePage()) as { props: { children: { type: unknown }[] } };

			expect(page.props.children.map((child) => child.type)).toStrictEqual([
				Hero,
				Home,
				Others,
				ContactPersons,
				Newsletter,
			]);
		});

		it('leaves out a section the editors have not filled', async () => {
			const document = buildPage() as { venuePage: { content: Record<string, unknown> } };
			mockedFetch.mockResolvedValue({
				...document,
				venuePage: {
					...document.venuePage,
					content: { contactPersonsSection: document.venuePage.content.contactPersonsSection },
				},
			});

			const page = await VenuePage();

			expect(findElement(page, Home)).toBeUndefined();
			expect(findElement(page, Others)).toBeUndefined();
			expect(findElement(page, ContactPersons)).toBeDefined();
		});

		it('shows every venue that is not a home venue as a hall or a field', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const others = findElement(await VenuePage(), Others);

			expect(others?.props.halls).toStrictEqual([HALL]);
			expect(others?.props.fields).toStrictEqual([FIELD]);
		});

		// A clubhouse belongs into the home section; nowhere else does the page have a place for it.
		it('shows no clubhouse among the other venues when its reference is gone', async () => {
			mockedFetch.mockResolvedValue(buildPage({ homeVenues: [STADIUM, null] }));

			const others = findElement(await VenuePage(), Others);

			expect(others?.props.fields).toStrictEqual([FIELD]);
			expect(others?.props.halls).toStrictEqual([HALL]);
		});

		it('hands the inquiry to the home section', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			expect(findElement(await VenuePage(), Home)?.props.inquiry).toStrictEqual(INQUIRY);
		});

		it('drops a contact person that no longer resolves', async () => {
			mockedFetch.mockResolvedValue(buildPage({ contactPersons: [PERSON, null] }));

			expect(findElement(await VenuePage(), ContactPersons)?.props.contactPersons).toStrictEqual([
				PERSON,
			]);
		});
	});
});
