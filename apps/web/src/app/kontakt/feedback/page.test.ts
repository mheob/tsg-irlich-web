import { describe, expect, it, vi } from 'vitest';

import FeedbackPage, { metadata } from '@/app/kontakt/feedback/page';
import { Hero } from '@/components/section/hero';
import { FeedbackForm } from '@/components/with-logic/feedback/form';
import type { client } from '@/lib/sanity/client';

import { findElement } from '../../../../test-utils/react-tree';

// The feedback form pulls in the server actions, and `src/lib/resend.ts` reads its API key at
// import time. `vi.hoisted` runs before the imports are evaluated; `globalThis` because the
// `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.RESEND_API_KEY = 'test-resend-key';
});

// The page reads nothing from Sanity, but the shared metadata helper builds image URLs through the
// Sanity client, which reads its configuration at import time.
vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
	} as unknown as typeof client,
}));

describe('the feedback page', () => {
	it('names the page and points its canonical URL at it', () => {
		expect(metadata.title).toBe('Feedback zur Website');
		expect(metadata.description).toContain('Feedback');
		expect(metadata.alternates?.canonical).toBe('/kontakt/feedback');
	});

	it('heads the page with the feedback titles', () => {
		const hero = findElement(FeedbackPage(), Hero);

		expect(hero?.props).toMatchObject({ subTitle: 'Feedback', title: 'Feedback abgeben' });
	});

	it('renders the feedback form', () => {
		expect(findElement(FeedbackPage(), FeedbackForm)).toBeDefined();
	});
});
