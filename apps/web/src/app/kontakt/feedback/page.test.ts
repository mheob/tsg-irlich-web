import { describe, expect, it, vi } from 'vitest';

import FeedbackPage, { metadata } from '@/app/kontakt/feedback/page';
import { Hero } from '@/components/section/hero';
import { FeedbackForm } from '@/components/with-logic/feedback/form';

import { findElement } from '../../../../test-utils/react-tree';

// The feedback form pulls in the server actions, and `src/lib/resend.ts` reads its API key at
// import time. `vi.hoisted` runs before the imports are evaluated; `globalThis` because the
// `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.RESEND_API_KEY = 'test-resend-key';
});

describe('the feedback page', () => {
	it('carries the club-wide metadata', () => {
		expect(metadata.title).toBe('TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich');
		expect(metadata.description).toContain('TSG Irlich');
	});

	it('heads the page with the feedback titles', () => {
		const hero = findElement(FeedbackPage(), Hero);

		expect(hero?.props).toMatchObject({ subTitle: 'Feedback', title: 'Feedback abgeben' });
	});

	it('renders the feedback form', () => {
		expect(findElement(FeedbackPage(), FeedbackForm)).toBeDefined();
	});
});
