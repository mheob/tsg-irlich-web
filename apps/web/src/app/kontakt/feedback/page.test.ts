import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import FeedbackPage, { generateMetadata } from '@/app/kontakt/feedback/page';
import { Hero } from '@/components/section/hero';
import { FeedbackForm } from '@/components/with-logic/feedback/form';
import type { client } from '@/lib/sanity/client';
import { contactHeroImageQuery } from '@/lib/sanity/queries/pages/contact';

import { PAGE_HERO_IMAGE } from '../../../../test-utils/page-images';
import { findElement } from '../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../test-utils/sanity-client-mock';

// The feedback form pulls in the server actions, and `src/lib/resend.ts` reads its API key at
// import time. `vi.hoisted` runs before the imports are evaluated; `globalThis` because the
// `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.RESEND_API_KEY = 'test-resend-key';
});

// The page reads the hero image of the contact page, and the image URLs are built through the
// Sanity client, which reads its configuration at import time.
vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
		fetch: vi.fn(),
	} as unknown as typeof client,
}));

const mockedFetch = clientFetchMock();

/**
 * Answers the hero image query of the contact page.
 *
 * @param heroImage - What the contact page carries.
 */
function mockHeroImage(heroImage: unknown = PAGE_HERO_IMAGE): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string) => {
		if (query === contactHeroImageQuery) return heroImage;
		throw new Error(`unexpected query: ${query}`);
	});
}

describe('the feedback page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	it('names the page and points its canonical URL at it', async () => {
		mockHeroImage();

		const metadata = await generateMetadata();

		expect(metadata.title).toBe('Feedback zur Website');
		expect(metadata.description).toContain('Feedback');
		expect(metadata.alternates?.canonical).toBe('/kontakt/feedback');
	});

	it('shares the hero image of the contact page as preview image', async () => {
		mockHeroImage();

		const metadata = await generateMetadata();
		const openGraphImage = metadata.openGraph?.images as undefined | { url?: string };

		expect(openGraphImage?.url).toContain('heroimg111');
	});

	it('heads the page with the feedback titles', async () => {
		mockHeroImage();

		const hero = findElement(await FeedbackPage(), Hero);

		expect(hero?.props).toMatchObject({ subTitle: 'Feedback', title: 'Feedback abgeben' });
	});

	it('shows the hero image of the contact page', async () => {
		mockHeroImage();

		const hero = findElement(await FeedbackPage(), Hero);

		expect(hero?.props.image?.alt).toBe('Hero der Seite');
		expect(hero?.props.image?.src).toContain('heroimg111');
	});

	it('shows no hero image when the contact page has none', async () => {
		mockHeroImage(null);

		const hero = findElement(await FeedbackPage(), Hero);

		expect(hero?.props.image).toBeUndefined();
	});

	it('renders the feedback form', async () => {
		mockHeroImage();

		expect(findElement(await FeedbackPage(), FeedbackForm)).toBeDefined();
	});
});
