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
import { Areas } from './_sections/areas';
import { Positions } from './_sections/positions';
import { Reasons } from './_sections/reasons';
import { Voices } from './_sections/voices';
import VolunteerPage, { generateMetadata } from './page';

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
const TESTIMONIAL = { _id: 'testimonial-1', firstName: 'Erika', lastName: 'Muster', quote: 'Q' };
const POSITION = { _id: 'position-1', area: 'Fußball', teaser: 'T', title: 'Schiedsrichter/in' };
const INQUIRY = { email: 'info@tsg-irlich.de', subject: 'Ehrenamt bei der TSG Irlich' };

interface PageOptions {
	contactPersons?: unknown[];
	meta?: Record<string, unknown>;
	positions?: unknown[];
	testimonials?: unknown[];
}

function buildPage({
	contactPersons = [],
	meta,
	positions = [POSITION],
	testimonials = [TESTIMONIAL],
}: PageOptions = {}): Record<string, unknown> {
	return {
		positions,
		volunteerPage: {
			content: {
				areasSection: { subtitle: 'Viele Aufgaben', title: 'So kannst du dich einbringen' },
				contactPersonsSection: { contactPersons, subtitle: 'Kontakt', title: 'Dein Vorstand' },
				positionsSection: { cta: 'Jetzt melden', subtitle: 'Aktuell', title: 'Wir suchen' },
				voicesSection: { subtitle: 'Stimmen', testimonials, title: 'Darum machen wir mit' },
				whySection: { subtitle: 'Warum', title: 'Gemeinsam mehr erreichen' },
			},
			inquiry: INQUIRY,
			meta,
			subtitle: 'Ehrenamt bei der TSG',
			title: 'Ehrenamt',
		},
	};
}

describe('volunteer page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: (meta) => buildPage({ meta }),
			buildWithHeroImage: (heroImage, meta) => {
				const document = buildPage({ meta }) as { volunteerPage: Record<string, unknown> };
				return { ...document, volunteerPage: { ...document.volunteerPage, heroImage } };
			},
			fetchMock: mockedFetch,
			generateMetadata,
			missingDocument: { positions: [], volunteerPage: null },
			path: '/verein/ehrenamt',
			title: 'Ehrenamt',
		});
	});

	describe('meta description fallback', () => {
		it('describes the page with the intro of the first section', async () => {
			const document = buildPage() as { volunteerPage: { content: Record<string, unknown> } };
			mockedFetch.mockResolvedValue({
				...document,
				volunteerPage: {
					...document.volunteerPage,
					content: {
						...document.volunteerPage.content,
						whySection: { intro: 'Ehrenamt bedeutet mehr.', title: 'Warum' },
					},
				},
			});

			await expect(generateMetadata()).resolves.toMatchObject({
				description: 'Ehrenamt bedeutet mehr.',
			});
		});
	});

	describe('rendering', () => {
		it('answers 404 without a published page', async () => {
			mockedFetch.mockResolvedValue({ positions: [], volunteerPage: null });

			await expect(VolunteerPage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('shows the hero image, title and subtitle of the page', async () => {
			const document = buildPage() as { volunteerPage: Record<string, unknown> };
			mockedFetch.mockResolvedValue({
				...document,
				volunteerPage: { ...document.volunteerPage, heroImage: PAGE_HERO_IMAGE },
			});

			const hero = findElement(await VolunteerPage(), Hero);

			expect(hero?.props.image?.src).toContain('heroimg111');
			expect(hero?.props).toMatchObject({ subTitle: 'Ehrenamt bei der TSG', title: 'Ehrenamt' });
		});

		it('renders the sections in the order of the spec', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const page = (await VolunteerPage()) as { props: { children: { type: unknown }[] } };

			expect(page.props.children.map((child) => child.type)).toStrictEqual([
				Hero,
				Reasons,
				Voices,
				Areas,
				Positions,
				ContactPersons,
				Newsletter,
			]);
		});

		it('leaves out a section the editors have not filled', async () => {
			const document = buildPage() as { volunteerPage: { content: Record<string, unknown> } };
			mockedFetch.mockResolvedValue({
				...document,
				volunteerPage: {
					...document.volunteerPage,
					content: {
						contactPersonsSection: document.volunteerPage.content.contactPersonsSection,
					},
				},
			});

			const page = await VolunteerPage();

			expect(findElement(page, Reasons)).toBeUndefined();
			expect(findElement(page, Voices)).toBeUndefined();
			expect(findElement(page, Areas)).toBeUndefined();
			expect(findElement(page, Positions)).toBeUndefined();
			expect(findElement(page, ContactPersons)).toBeDefined();
		});

		it('hands the inquiry and the positions to the open positions', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const positions = findElement(await VolunteerPage(), Positions);

			expect(positions?.props.inquiry).toStrictEqual(INQUIRY);
			expect(positions?.props.positions).toStrictEqual([POSITION]);
		});

		it('tells the reasons whether there are positions', async () => {
			mockedFetch.mockResolvedValue(buildPage());
			expect(findElement(await VolunteerPage(), Reasons)?.props.hasPositions).toBe(true);

			mockedFetch.mockResolvedValue(buildPage({ positions: [] }));
			expect(findElement(await VolunteerPage(), Reasons)?.props.hasPositions).toBe(false);
		});

		it('drops a contact person and a testimonial that no longer resolve', async () => {
			mockedFetch.mockResolvedValue(
				buildPage({ contactPersons: [PERSON, null], testimonials: [null, TESTIMONIAL] }),
			);

			const page = await VolunteerPage();

			expect(findElement(page, ContactPersons)?.props.contactPersons).toStrictEqual([PERSON]);
			expect(findElement(page, Voices)?.props.testimonials).toStrictEqual([TESTIMONIAL]);
		});

		it('hands the voices no testimonial when none is set', async () => {
			mockedFetch.mockResolvedValue(buildPage({ testimonials: null as never }));

			expect(findElement(await VolunteerPage(), Voices)?.props.testimonials).toStrictEqual([]);
		});
	});
});
