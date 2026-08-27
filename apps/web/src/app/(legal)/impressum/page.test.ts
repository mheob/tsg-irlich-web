import Link from 'next/link';
import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ImprintPage, { generateMetadata } from '@/app/(legal)/impressum/page';
import { PortableText } from '@/components/ui/portable-text';
import { ContactLink } from '@/components/with-logic/contact-link';
import type { client } from '@/lib/sanity/client';

import { itFollowsTheMetadataContract } from '../../../../test-utils/page-contract';
import { findElement, findElements } from '../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../test-utils/sanity-client-mock';

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

// The contact form is an `internalLink` object; `getInternalHref` turns the type and slug into the
// path, which for a single page is the slug itself.
const CONTACT_FORM_LINK = { _type: 'contact', slug: 'kontakt/feedback' };

function buildPage(
	meta?: Record<string, unknown>,
	link: unknown = CONTACT_FORM_LINK,
): Record<string, unknown> {
	return {
		address: { text: [{ _key: 'address', _type: 'block' }] },
		consumerDisputeResolution: 'Wir nehmen nicht teil.',
		contactForm: { link, title: 'Feedbackformular' },
		credits: { text: [{ _key: 'credits', _type: 'block' }] },
		email: 'info@tsg-irlich.de',
		meta,
		registerCourt: 'Amtsgericht Neuwied',
		registerNo: 'VR 1234',
		represented: { text: [{ _key: 'represented', _type: 'block' }] },
		responsible: 'Der Vorstand',
		subtitle: 'Angaben gemäß § 5 DDG',
		support: { text: [{ _key: 'support', _type: 'block' }] },
		technicalQuestionsEmail: 'technik@tsg-irlich.de',
		technicalQuestionsName: 'Technik-Team',
		title: 'Impressum',
	};
}

describe('imprint page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: buildPage,
			fetchMock: mockedFetch,
			generateMetadata,
			title: 'Impressum',
		});
	});

	describe('rendering', () => {
		it('gives up when the document is missing', async () => {
			mockedFetch.mockResolvedValue(null);

			await expect(ImprintPage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('renders address, board, support and credits as rich text', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const texts = findElements(await ImprintPage(), PortableText);

			expect(texts.map((text) => text.props.value)).toStrictEqual([
				[{ _key: 'address', _type: 'block' }],
				[{ _key: 'represented', _type: 'block' }],
				[{ _key: 'support', _type: 'block' }],
				[{ _key: 'credits', _type: 'block' }],
			]);
		});

		it('offers both email addresses as mailto links', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const links = findElements(await ImprintPage(), ContactLink);

			expect(links.map((link) => link.props.href)).toStrictEqual([
				'mailto:info@tsg-irlich.de',
				'mailto:technik@tsg-irlich.de',
			]);
		});

		it('links to the contact form the document points at', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const link = findElement(await ImprintPage(), Link);

			expect(link?.props).toMatchObject({
				children: 'Feedbackformular',
				href: '/kontakt/feedback',
			});
		});

		it('leaves the contact form as plain text when its link cannot be resolved', async () => {
			mockedFetch.mockResolvedValue(buildPage(undefined, { _type: 'contact', slug: null }));

			expect(findElement(await ImprintPage(), Link)).toBeUndefined();
		});
	});
});
