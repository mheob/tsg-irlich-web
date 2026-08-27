import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ContactPage, { generateMetadata } from '@/app/kontakt/page';
import { ContactForm } from '@/components/section/contact-form';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import type { client } from '@/lib/sanity/client';

import { itFollowsTheMetadataContract } from '../../../test-utils/page-contract';
import { findElement } from '../../../test-utils/react-tree';
import { clientFetchMock } from '../../../test-utils/sanity-client-mock';
// The contact form pulls in the server action, which pulls in `src/lib/resend.ts` — and that
// reads its API key at import time. `vi.hoisted` runs before the imports are evaluated, which a
// plain `vi.stubEnv` at the file's top level would not.
vi.hoisted(() => {
	// `globalThis` rather than the `node:process` import: that binding is itself only initialized
	// after the hoisted block runs.
	globalThis.process.env.RESEND_API_KEY = 'test-resend-key';
});

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
			receiver: 'vorstand@tsg-irlich.de',
		},
		meta,
		subtitle: 'So erreichst du uns',
		title: 'Kontakt',
	};
}

describe('contact page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: buildPage,
			fetchMock: mockedFetch,
			generateMetadata,
			title: 'Kontakt',
		});
	});

	describe('rendering', () => {
		it('gives up when the document is missing', async () => {
			mockedFetch.mockResolvedValue(null);

			await expect(ContactPage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('heads the page with its title and subtitle', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const hero = findElement(await ContactPage(), Hero);

			expect(hero?.props).toMatchObject({ subTitle: 'So erreichst du uns', title: 'Kontakt' });
		});

		it('addresses the form at the receiver the document names', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const form = findElement(await ContactPage(), ContactForm);

			expect(form?.props.receiver).toBe('vorstand@tsg-irlich.de');
		});

		it('lists the contact persons and the newsletter sign-up', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const page = await ContactPage();

			expect(findElement(page, ContactPersons)?.props).toMatchObject({
				title: 'Ansprechpartner',
			});
			expect(findElement(page, Newsletter)).toBeDefined();
		});
	});
});
