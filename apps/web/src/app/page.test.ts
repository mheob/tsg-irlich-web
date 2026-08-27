// oxlint-disable import/max-dependencies -- the home page composes a dozen sections, and the
// test imports each one to assert what it was handed

import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import HomePage, { generateMetadata } from '@/app/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Pricing } from '@/components/section/pricing';
import { Stats } from '@/components/section/stats';
import { Vision } from '@/components/section/vision';
import type { client } from '@/lib/sanity/client';
import { homePageQuery, homePageTestimonialsQuery } from '@/lib/sanity/queries/pages/home';
import { newsArticlesQuery } from '@/lib/sanity/queries/shared/news';
import { socialMediaQuery } from '@/lib/sanity/queries/shared/social-media';
import { sponsorsQuery } from '@/lib/sanity/queries/shared/sponsors';

import { itFollowsTheMetadataContract } from '../../test-utils/page-contract';
import { findElement } from '../../test-utils/react-tree';
import { clientFetchMock } from '../../test-utils/sanity-client-mock';
import { Features } from './_home/features';
import { Groups } from './_home/groups';
import { Hero } from './_home/hero';
import { News } from './_home/news';
import { Sponsors } from './_home/sponsors';
import { Testimonials } from './_home/testimonials';
// The contact form pulls in the server action, which reads the Resend API key at import time.
// `vi.hoisted` runs before the imports are evaluated; `globalThis` because the `node:process`
// binding is itself only initialized afterwards.
vi.hoisted(() => {
	globalThis.process.env.RESEND_API_KEY = 'test-resend-key';
});

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

function testimonial(key: string): Record<string, unknown> {
	return { _key: key, name: key, quote: `Zitat ${key}` };
}

function buildPage(meta?: Record<string, unknown>): Record<string, unknown> {
	return {
		_type: 'home',
		content: {
			contactPersonsSection: { title: 'Ansprechpartner' },
			featureSection: { title: 'Was uns ausmacht' },
			groupsSection: { title: 'Unsere Abteilungen' },
			newsSection: { title: 'Neuigkeiten' },
			pricingSection: { title: 'Beiträge' },
			stats: [{ label: 'Mitglieder', value: 1200 }],
			testimonialSection: { title: 'Stimmen' },
			visionSection: { title: 'Vision' },
		},
		intro: 'Willkommen bei der TSG',
		meta,
		subtitle: 'Turn- und Sportgemeinde',
		title: 'TSG Irlich',
	};
}

interface HomeResults {
	news?: unknown[];
	page?: unknown;
	socialMedia?: unknown;
	sponsors?: unknown[];
	testimonials?: unknown[];
}

// The five queries run inside one `Promise.all`, so keying on the query keeps the fixtures
// independent of the order they resolve in.
function mockSanity({
	news = [],
	page = buildPage(),
	socialMedia = { instagram: 'https://instagram.example' },
	sponsors = [],
	testimonials = [],
}: HomeResults = {}): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string) => {
		if (query === homePageQuery) return page;
		if (query === homePageTestimonialsQuery) return testimonials;
		if (query === newsArticlesQuery) return news;
		if (query === socialMediaQuery) return socialMedia;
		if (query === sponsorsQuery) return sponsors;
		throw new Error(`unexpected query: ${query}`);
	});
}

/**
 * Reads the testimonials the page handed to its testimonial section.
 *
 * Kept out of the test bodies because the fallback for a missing section would be a conditional,
 * which `vitest/no-conditional-in-test` flags.
 *
 * @param page - The rendered page tree.
 * @returns The testimonials the section received.
 */
function shownTestimonials(page: ReactNode): unknown[] {
	const section = findElement(page, Testimonials);
	if (!section) {
		throw new Error('Expected the page to render a testimonial section');
	}
	// The section's prop type is the query result, which is nullable; the page only ever hands it
	// an array.
	return section.props.testimonials as unknown[];
}

describe('home page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: buildPage,
			fetchMock: mockedFetch,
			generateMetadata,
			title: 'TSG Irlich',
		});
	});

	describe('rendering', () => {
		it('gives up when the document is missing', async () => {
			mockSanity({ page: null });

			await expect(HomePage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('heads the page with the intro, title and social media links', async () => {
			mockSanity();

			const hero = findElement(await HomePage(), Hero);

			expect(hero?.props).toMatchObject({
				intro: 'Willkommen bei der TSG',
				socialMedia: { instagram: 'https://instagram.example' },
				subtitle: 'Turn- und Sportgemeinde',
				title: 'TSG Irlich',
			});
		});

		it('hands every section the slice of the document it renders', async () => {
			mockSanity();

			const page = await HomePage();

			expect(findElement(page, Features)?.props).toMatchObject({ title: 'Was uns ausmacht' });
			expect(findElement(page, Groups)?.props).toMatchObject({ title: 'Unsere Abteilungen' });
			expect(findElement(page, Stats)?.props.stats).toMatchObject([{ label: 'Mitglieder' }]);
			expect(findElement(page, Pricing)?.props).toMatchObject({ title: 'Beiträge' });
			expect(findElement(page, ContactPersons)?.props).toMatchObject({ title: 'Ansprechpartner' });
		});

		it('tells the vision section which document it belongs to', async () => {
			mockSanity();

			expect(findElement(await HomePage(), Vision)?.props).toMatchObject({
				_type: 'home',
				title: 'Vision',
			});
		});

		it('passes the news articles to the news section', async () => {
			mockSanity({ news: [{ _id: 'article-1', title: 'Sommerfest' }] });

			const news = findElement(await HomePage(), News);

			expect(news?.props).toMatchObject({
				articles: [{ _id: 'article-1' }],
				title: 'Neuigkeiten',
			});
		});

		it('shows three of the testimonials once there are at least three', async () => {
			const available = ['a', 'b', 'c', 'd'].map((key) => testimonial(key));
			mockSanity({ testimonials: available });

			const page = await HomePage();
			const shown = shownTestimonials(page);

			expect(shown).toHaveLength(3);
			expect(available).toStrictEqual(expect.arrayContaining(shown));
		});

		it('shows no testimonials while there are fewer than three', async () => {
			mockSanity({ testimonials: [testimonial('a'), testimonial('b')] });

			const page = await HomePage();

			expect(shownTestimonials(page)).toStrictEqual([]);
		});

		it('shows the sponsors section only when there are sponsors', async () => {
			mockSanity({ sponsors: [{ _id: 'sponsor-1', name: 'Sponsor' }] });

			expect(findElement(await HomePage(), Sponsors)?.props.sponsors).toMatchObject([
				{ _id: 'sponsor-1' },
			]);
		});

		it('leaves the sponsors section out without sponsors', async () => {
			mockSanity();

			expect(findElement(await HomePage(), Sponsors)).toBeUndefined();
		});
	});
});
