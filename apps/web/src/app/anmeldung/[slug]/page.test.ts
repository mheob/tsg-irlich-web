import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import RegistrationPage, {
	generateMetadata,
	generateStaticParams,
} from '@/app/anmeldung/[slug]/page';
import { Hero } from '@/components/section/hero';
import { RegistrationForm } from '@/components/with-logic/registration-form/registration-form';
import { getRegisteredCount } from '@/lib/forms/registered-count';
import { formPageQuery } from '@/lib/sanity/queries/forms';

import { DORFTURNIER_FIELDS, blockText } from '../../../../test-utils/form-fields';
import { itFollowsTheMetadataContract } from '../../../../test-utils/page-contract';
import { PAGE_HERO_IMAGE } from '../../../../test-utils/page-images';
import { findElement } from '../../../../test-utils/react-tree';
import { sanityFetchMock } from '../../../../test-utils/sanity-live-mock';
import { encodeLikeDraftMode } from '../../../../test-utils/stega';
import { RegistrationInfo } from './_sections/registration-info';
import { RegistrationPanel } from './_sections/registration-panel';
// `src/lib/sanity/api.ts` asserts the project variables at import time, and the page reaches it
// through `urlForImage`. `vi.hoisted` runs before the imports are evaluated; `globalThis` because
// the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

// `defineLive` reads `SANITY_API_READ_TOKEN` at import time and would open a live connection.
vi.mock(import('@/lib/sanity/live'), () => ({ sanityFetch: vi.fn() }));

vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

vi.mock(import('next/headers'), () => ({ draftMode: vi.fn() }));

// The count reads Sanity with the write client, which needs a token.
vi.mock(import('@/lib/forms/registered-count'), () => ({ getRegisteredCount: vi.fn() }));

// The form is a client component whose action reaches the write client; only the props the panel
// hands it matter here.
vi.mock(import('@/components/with-logic/registration-form/registration-form'), () => ({
	RegistrationForm: vi.fn(),
}));

const mockedSanityFetch = sanityFetchMock();
const mockedDraftMode = vi.mocked(draftMode);
const mockedRegisteredCount = vi.mocked(getRegisteredCount);

/** Noon in Irlich, a month before the registration of the form below ends. */
const NOW = '2027-04-01T10:00:00Z';

const FORM = {
	_id: 'form-dorfturnier',
	afterEndText: null,
	beforeStartText: null,
	capacity: 8,
	eventDate: '2027-05-14T11:00:00Z',
	fields: DORFTURNIER_FIELDS,
	formType: 'registration',
	heroImage: PAGE_HERO_IMAGE,
	intro: blockText('Anmeldung zum Dorfturnier.'),
	location: 'Pappelstadion',
	meta: null,
	registrationEnd: '2027-04-30T21:59:00Z',
	registrationStart: null,
	showRemaining: true,
	successText: null,
	title: 'Dorfturnier 2027',
	waitlistNotice: null,
	waitlistSuccessText: null,
};

function routeProps(slug = 'dorfturnier-2027'): PageProps<'/anmeldung/[slug]'> {
	// `PageProps<'/anmeldung/[slug]'>` types the params as a promise.
	return { params: Promise.resolve({ slug }) } as unknown as PageProps<'/anmeldung/[slug]'>;
}

async function renderPage(
	form: null | Record<string, unknown> = {},
	registeredCount = 0,
): Promise<ReactNode> {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedSanityFetch.mockImplementation(async ({ query }) => {
		if (query === formPageQuery) return { data: form && { ...FORM, ...form } };
		throw new Error(`unexpected query: ${query}`);
	});
	mockedRegisteredCount.mockResolvedValue(registeredCount);

	return RegistrationPage(routeProps());
}

/**
 * Renders what the page hands to its panel, the way React would once it gets there.
 *
 * @param page - The rendered page.
 * @returns What the panel renders.
 */
function panelOf(page: ReactNode): ReactNode {
	const panel = findElement(page, RegistrationPanel);
	if (!panel) {
		throw new Error('the page has no panel');
	}
	return RegistrationPanel(panel.props);
}

/**
 * Collects the text of a rendered tree.
 *
 * @param node - The tree.
 * @returns Every string in it, joined.
 */
function textOf(node: ReactNode): string {
	if (typeof node === 'string' || typeof node === 'number') {
		return String(node);
	}
	if (Array.isArray(node)) {
		return node.map((child: ReactNode) => textOf(child)).join('');
	}
	if (isValidElement<{ children?: ReactNode }>(node)) {
		return textOf(node.props.children);
	}
	return '';
}

function mockDraftMode(isEnabled: boolean): void {
	// The real return value also carries `enable`/`disable`; the page only reads `isEnabled`.
	mockedDraftMode.mockResolvedValue({ isEnabled } as unknown as Awaited<
		ReturnType<typeof draftMode>
	>);
}

describe('registration page', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date(NOW));
		mockDraftMode(false);
	});

	afterEach(() => {
		vi.useRealTimers();
		mockedSanityFetch.mockReset();
		mockedDraftMode.mockReset();
		mockedRegisteredCount.mockReset();
		vi.mocked(notFound).mockClear();
	});

	describe('static params', () => {
		it('prerenders nothing at build time', async () => {
			await expect(generateStaticParams()).resolves.toStrictEqual([]);
		});
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: (meta) => ({ data: { ...FORM, heroImage: null, meta } }),
			buildWithHeroImage: (heroImage, meta) => ({ data: { ...FORM, heroImage, meta } }),
			fetchMock: mockedSanityFetch,
			generateMetadata: async () => generateMetadata(routeProps()),
			missingDocument: { data: null },
			path: '/anmeldung/dorfturnier-2027',
			title: 'Dorfturnier 2027',
		});

		it('reads the form without stega characters', async () => {
			mockedSanityFetch.mockResolvedValue({ data: FORM });

			await generateMetadata(routeProps());

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { slug: 'dorfturnier-2027' },
				query: formPageQuery,
				stega: false,
			});
		});
	});

	describe('rendering', () => {
		it('calls notFound for a missing form', async () => {
			await expect(renderPage(null)).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('calls notFound for another form type', async () => {
			await expect(renderPage({ formType: 'survey' })).rejects.toThrow('NEXT_NOT_FOUND');
		});

		it('heads the page with the title of the form', async () => {
			const hero = findElement(await renderPage(), Hero);

			expect(hero?.props).toMatchObject({
				breadcrumb: { page: 'Dorfturnier 2027' },
				subTitle: 'Anmeldung',
				title: 'Dorfturnier 2027',
			});
			expect(hero?.props.image?.alt).toBe('Hero der Seite');
			expect(hero?.props.image?.src).toContain('heroimg111');
		});

		it('hands the info column what the form tells about the event', async () => {
			const info = findElement(await renderPage(), RegistrationInfo);

			expect(info?.props).toMatchObject({
				eventDate: '2027-05-14T11:00:00Z',
				location: 'Pappelstadion',
				notice: 'Noch 8 von 8 Plätzen frei',
				registrationEnd: '2027-04-30T21:59:00Z',
				title: 'Dorfturnier 2027',
			});
		});

		it('renders the form while open', async () => {
			const page = await renderPage({}, 5);

			const form = findElement(panelOf(page), RegistrationForm);

			expect(findElement(page, RegistrationPanel)?.props.state).toBe('open');
			expect(form?.props).toMatchObject({
				fields: DORFTURNIER_FIELDS,
				formId: 'form-dorfturnier',
				isPreview: false,
				isWaitlist: false,
			});
			expect(findElement(page, RegistrationInfo)?.props.notice).toBe('Noch 3 von 8 Plätzen frei');
		});

		it('renders the waitlist notice and the waitlist form at capacity', async () => {
			const page = await renderPage({}, 8);

			const form = findElement(panelOf(page), RegistrationForm);

			expect(findElement(page, RegistrationPanel)?.props.state).toBe('waitlist');
			expect(form?.props.isWaitlist).toBe(true);
			expect(findElement(page, RegistrationInfo)?.props.notice).toBe(
				'Alle Plätze sind vergeben. Neue Anmeldungen kommen auf die Warteliste.',
			);
		});

		it('renders the before-start text with the start date', async () => {
			const page = await renderPage({ registrationStart: '2027-04-10T08:00:00Z' });

			expect(findElement(page, RegistrationPanel)?.props.state).toBe('upcoming');
			expect(textOf(panelOf(page))).toBe(
				'Die Anmeldung ist ab Sa., 10.04.2027, 10:00 Uhr möglich.',
			);
			expect(findElement(panelOf(page), RegistrationForm)).toBeUndefined();
		});

		it('renders the after-end text', async () => {
			const page = await renderPage({ registrationEnd: '2027-03-31T21:59:00Z' });

			expect(findElement(page, RegistrationPanel)?.props.state).toBe('closed');
			expect(textOf(panelOf(page))).toBe('Die Anmeldung ist beendet.');
		});

		it('counts the registrations only when the form has a capacity', async () => {
			await renderPage({ capacity: null });

			expect(mockedRegisteredCount).not.toHaveBeenCalled();
		});

		it('counts the registrations of the form', async () => {
			await renderPage();

			expect(mockedRegisteredCount).toHaveBeenCalledWith('form-dorfturnier');
		});

		it('tells the form it is shown in a preview while draft mode is on', async () => {
			mockDraftMode(true);

			const form = findElement(panelOf(await renderPage()), RegistrationForm);

			expect(form?.props.isPreview).toBe(true);
		});

		it('reads dates without the stega characters draft mode adds', async () => {
			const page = await renderPage({
				eventDate: encodeLikeDraftMode('2027-05-14T11:00:00Z'),
				formType: encodeLikeDraftMode('registration'),
				registrationEnd: encodeLikeDraftMode('2027-04-30T21:59:00Z'),
				registrationStart: encodeLikeDraftMode('2027-03-01T08:00:00Z'),
			});

			expect(findElement(page, RegistrationPanel)?.props.state).toBe('open');
			expect(findElement(page, RegistrationInfo)?.props.eventDate).toBe('2027-05-14T11:00:00Z');
		});
	});
});
