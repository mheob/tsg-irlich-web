import { stegaEncodeSourceMap } from '@sanity/client/stega';
import { notFound, permanentRedirect } from 'next/navigation';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import DepartmentPage, { generateMetadata, generateStaticParams } from '@/app/angebot/[group]/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Stats } from '@/components/section/stats';
import { JsonLd } from '@/components/ui/json-ld';
import {
	departmentPageQuery,
	departmentRedirectQuery,
	departmentSlugsQuery,
} from '@/lib/sanity/queries/departments';
import { offerGroupsPageQuery } from '@/lib/sanity/queries/pages/offer-groups';
import { OFFER_FALLBACK_IMAGE } from '@/utils/fallback-image';

import { findElement, findElements, sectionTypes } from '../../../../test-utils/react-tree';
import { sanityFetchMock } from '../../../../test-utils/sanity-live-mock';
import { Faq } from './_sections/faq';
import { Groups } from './_sections/groups';
// `src/lib/sanity/api.ts` asserts the project variables at import time, and the page reaches it
// through `urlForImage`. `vi.hoisted` runs before the imports are evaluated; `globalThis` because
// the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

// `defineLive` reads `SANITY_API_READ_TOKEN` at import time and would open a live connection.
vi.mock(import('@/lib/sanity/live'), () => ({ sanityFetch: vi.fn() }));

// Both helpers end the render by throwing, like they do in Next.js.
vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
	permanentRedirect: vi.fn(() => {
		throw new Error('NEXT_REDIRECT');
	}),
}));

const mockedSanityFetch = sanityFetchMock();

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const HERO_ASSET = 'image-heroaaa111-800x600-jpg';
const CARD_ASSET = 'image-cardbbb222-800x600-jpg';
const OPEN_GRAPH_ASSET = 'image-ogccc333-800x600-jpg';

function sanityImage(alt: string, asset?: string): Record<string, unknown> {
	return {
		_type: 'extendedImage',
		alt,
		...(asset && { asset: { _ref: asset, _type: 'reference' } }),
	};
}

const STATS = [{ _key: 'teams', _type: 'stats', title: 'Teams', value: 11 }];

const PERSONS = [
	{ _id: 'person-2', firstName: 'Zoe' },
	{ _id: 'person-1', firstName: 'Anna' },
];

const GROUPS = [
	{ featuredImage: sanityImage('Herren', CARD_ASSET), slug: 'herren', title: 'Herren' },
	{ featuredImage: sanityImage('Damen', CARD_ASSET), slug: 'damen', title: 'Damen' },
];

/** A question of this department, which it is the first department of. */
const OWN_FAQ = {
	_id: 'faq-trial',
	answer: [],
	answerText: 'Ja, jederzeit.',
	isMarkedUp: true,
	question: 'Gibt es ein Probetraining?',
};

/** A question shared with another department, which comes first in it. */
const SHARED_FAQ = {
	_id: 'faq-fee',
	answer: [],
	answerText: 'Das steht auf der Seite Mitgliedschaft.',
	isMarkedUp: false,
	question: 'Was kostet die Mitgliedschaft?',
};

const DEPARTMENT = {
	_id: 'department-fussball',
	cardImage: sanityImage('Kachelbild Fußball', CARD_ASSET),
	contactPersons: PERSONS,
	faqs: [],
	groups: GROUPS,
	heroImage: sanityImage('Hero Fußball', HERO_ASSET),
	intro: 'Fußball in Irlich',
	meta: null,
	stats: STATS,
	title: 'Fußball',
};

const GROUPS_PAGE = {
	content: {
		contactPersonsSection: { subtitle: 'Wir helfen', title: 'Ansprechpartner' },
		faqSection: { subtitle: 'Gut zu wissen', title: 'Häufige Fragen' },
		groupsSection: {
			intro: 'Gemeinsames Intro',
			subtitle: 'Alle Gruppen',
			title: 'Unsere Gruppen',
		},
	},
	metaDescription: 'Gemeinsame Beschreibung',
	subtitle: 'Wir bieten dir',
	title: 'Bereich:',
};

interface SanityResults {
	department?: unknown;
	groupsPage?: unknown;
	redirect?: null | string;
	slugs?: string[];
}

// The queries run inside one `Promise.all`, so keying on the query keeps the fixtures independent
// of the order they resolve in.
function mockSanity({
	department = DEPARTMENT,
	groupsPage = GROUPS_PAGE,
	redirect = null,
	slugs = [],
}: SanityResults = {}): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedSanityFetch.mockImplementation(async ({ query }) => {
		if (query === departmentPageQuery) return { data: department };
		if (query === offerGroupsPageQuery) return { data: groupsPage };
		if (query === departmentRedirectQuery) return { data: redirect };
		if (query === departmentSlugsQuery) return { data: slugs };
		throw new Error(`unexpected query: ${query}`);
	});
}

/**
 * Encodes a text the way `sanityFetch` does in draft mode: the text followed by invisible characters
 * that point the presentation tool at its source.
 *
 * @param text - The visible text.
 * @returns The text followed by its stega encoding.
 */
function encodeLikeDraftMode(text: string): string {
	const { value } = stegaEncodeSourceMap(
		{ value: text },
		{
			documents: [{ _id: 'faq-trial', _type: 'faq' }],
			mappings: {
				"$['value']": { source: { document: 0, path: 0, type: 'documentValue' }, type: 'value' },
			},
			paths: ["$['value']"],
		},
		{ enabled: true, studioUrl: 'https://studio.test' },
	);

	return value;
}

/**
 * Finds the `FAQPage` among the JSON-LD blocks the page renders itself.
 *
 * @param page - The rendered page.
 * @returns The data of the `FAQPage` block, if there is one.
 */
function faqPageOf(page: ReactNode): Record<string, unknown> | undefined {
	return findElements(page, JsonLd)
		.map((element) => element.props.data as unknown as Record<string, unknown>)
		.find((data) => data['@type'] === 'FAQPage');
}

function routeProps(group = 'fussball'): PageProps<'/angebot/[group]'> {
	// `PageProps<'/angebot/[group]'>` types the params as a promise.
	return { params: Promise.resolve({ group }) } as unknown as PageProps<'/angebot/[group]'>;
}

/**
 * Lists the queries the page sent to Sanity so far.
 *
 * @returns The queries, in the order they were sent.
 */
function queriesSent(): string[] {
	return mockedSanityFetch.mock.calls.map(([{ query }]) => query);
}

async function renderPage(
	department: Record<string, unknown> = {},
	group = 'fussball',
): Promise<ReactNode> {
	mockSanity({ department: { ...DEPARTMENT, ...department } });
	return DepartmentPage(routeProps(group));
}

describe('department page', () => {
	afterEach(() => {
		mockedSanityFetch.mockReset();
		vi.mocked(notFound).mockClear();
		vi.mocked(permanentRedirect).mockClear();
	});

	describe('static params', () => {
		it('pre-renders every department by its slug', async () => {
			mockSanity({ slugs: ['fussball', 'tanzen'] });

			await expect(generateStaticParams()).resolves.toStrictEqual([
				{ group: 'fussball' },
				{ group: 'tanzen' },
			]);
		});

		it('reads the published slugs without stega encoding', async () => {
			mockSanity();

			await generateStaticParams();

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				perspective: 'published',
				query: departmentSlugsQuery,
				stega: false,
			});
		});
	});

	describe('metadata', () => {
		it('is empty when the department does not exist', async () => {
			mockSanity({ department: null });

			await expect(generateMetadata(routeProps('gibt-es-nicht'))).resolves.toStrictEqual({});
		});

		it('is empty when the shared page is missing', async () => {
			mockSanity({ groupsPage: null });

			await expect(generateMetadata(routeProps())).resolves.toStrictEqual({});
		});

		it('names the department in the title', async () => {
			mockSanity();

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				openGraph: { title: 'Fußball bei der TSG Irlich' },
				title: { absolute: 'Fußball bei der TSG Irlich' },
			});
		});

		it('prefers the meta title of the department', async () => {
			mockSanity({ department: { ...DEPARTMENT, meta: { metaTitle: 'Fußball in Irlich' } } });

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				title: { absolute: 'Fußball in Irlich' },
			});
		});

		it('points its canonical URL at the department page', async () => {
			mockSanity();

			const metadata = await generateMetadata(routeProps());

			expect(metadata.alternates?.canonical).toBe('/angebot/fussball');
		});

		it('takes the description from the shared page', async () => {
			mockSanity();

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: 'Gemeinsame Beschreibung',
				openGraph: { description: 'Gemeinsame Beschreibung' },
			});
		});

		it('prefers the meta description of the department', async () => {
			mockSanity({
				department: { ...DEPARTMENT, meta: { metaDescription: 'Alles rund um den Fußball' } },
			});

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: 'Alles rund um den Fußball',
			});
		});

		it('shows the card image as the open graph image', async () => {
			mockSanity();

			const metadata = await generateMetadata(routeProps());

			expect(metadata.openGraph?.images).toMatchObject({
				alt: 'Kachelbild Fußball',
				height: 630,
				width: 1200,
			});
		});

		it('prefers the open graph image from the meta fields', async () => {
			mockSanity({
				department: {
					...DEPARTMENT,
					meta: {
						openGraphImage: {
							_type: 'image',
							alt: 'Open Graph Bild',
							asset: { _ref: OPEN_GRAPH_ASSET, _type: 'reference' },
						},
					},
				},
			});

			const metadata = await generateMetadata(routeProps());

			expect(metadata.openGraph?.images).toMatchObject({ alt: 'Open Graph Bild' });
		});

		it('asks Sanity for strings without stega encoding', async () => {
			mockSanity();

			await generateMetadata(routeProps());

			expect(
				mockedSanityFetch.mock.calls.map(([options]) => [options.query, options.stega]),
			).toStrictEqual([
				[departmentPageQuery, false],
				[offerGroupsPageQuery, false],
			]);
		});

		it('looks the department up by the slug of the URL', async () => {
			mockSanity();

			await generateMetadata(routeProps('tanzen'));

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { slug: 'tanzen' },
				query: departmentPageQuery,
				stega: false,
			});
		});
	});

	describe('hero', () => {
		it('heads the page with the shared title and the department', async () => {
			const hero = findElement(await renderPage(), Hero);

			expect(hero?.props).toMatchObject({ subTitle: 'Wir bieten dir', title: 'Bereich: Fußball' });
		});

		it('shows the hero image of the department', async () => {
			const image = findElement(await renderPage(), Hero)?.props.image;

			expect(image?.alt).toBe('Hero Fußball');
			expect(image?.src).toContain('heroaaa111');
		});

		it('crops the image to the full width of the hero', async () => {
			const image = findElement(await renderPage(), Hero)?.props.image;

			expect(image?.src).toContain('w=1920');
			expect(image?.src).toContain('h=600');
		});

		it('falls back to the card image when the department has no hero image', async () => {
			const image = findElement(await renderPage({ heroImage: null }), Hero)?.props.image;

			expect(image?.alt).toBe('Kachelbild Fußball');
			expect(image?.src).toContain('cardbbb222');
		});

		it('falls back to the card image when the hero image has no asset', async () => {
			const hero = findElement(await renderPage({ heroImage: sanityImage('Leer') }), Hero);

			expect(hero?.props.image?.alt).toBe('Kachelbild Fußball');
			expect(hero?.props.image?.src).toContain('cardbbb222');
		});

		it('falls back to the offer image when neither image has an asset', async () => {
			const hero = findElement(
				await renderPage({ cardImage: sanityImage('Leer'), heroImage: sanityImage('Auch leer') }),
				Hero,
			);

			expect(hero?.props.image).toStrictEqual(OFFER_FALLBACK_IMAGE);
		});

		it('describes the image with the department title when it has no alt text', async () => {
			const hero = findElement(await renderPage({ heroImage: sanityImage('', HERO_ASSET) }), Hero);

			expect(hero?.props.image).toMatchObject({ alt: 'Fußball' });
		});
	});

	describe('groups section', () => {
		it('hands the section the department and its groups', async () => {
			const groups = findElement(await renderPage(), Groups);

			expect(groups?.props).toMatchObject({
				departmentSlug: 'fussball',
				departmentTitle: 'Fußball',
				groups: [{ slug: 'herren' }, { slug: 'damen' }],
				subtitle: 'Alle Gruppen',
				title: 'Unsere Gruppen',
			});
		});

		it('shows the intro of the department', async () => {
			const groups = findElement(await renderPage(), Groups);

			expect(groups?.props.intro).toBe('Fußball in Irlich');
		});

		it('shows the shared intro when the department has none', async () => {
			const groups = findElement(await renderPage({ intro: null }), Groups);

			expect(groups?.props.intro).toBe('Gemeinsames Intro');
		});
	});

	describe('statistics', () => {
		it('shows the statistics of the department', async () => {
			const stats = findElement(await renderPage(), Stats);

			expect(stats?.props.stats).toStrictEqual(STATS);
		});

		it.each([
			['none', null],
			['an empty list', []],
		])('renders no statistics band for %s', async (_description, stats) => {
			expect(findElement(await renderPage({ stats }), Stats)).toBeUndefined();
		});
	});

	describe('faq', () => {
		it('shows the FAQ between the statistics and the contact persons', async () => {
			const page = await renderPage({ faqs: [OWN_FAQ] });
			const types = sectionTypes(page as ReactElement<{ children?: ReactNode }>);

			expect(types.indexOf(Faq)).toBe(types.indexOf(Stats) + 1);
			expect(types.indexOf(ContactPersons)).toBe(types.indexOf(Faq) + 1);
		});

		it('hands the section the department, its FAQ and the shared heading', async () => {
			const faq = findElement(await renderPage({ faqs: [OWN_FAQ, SHARED_FAQ] }), Faq);

			expect(faq?.props).toMatchObject({
				departmentTitle: 'Fußball',
				faqs: [OWN_FAQ, SHARED_FAQ],
				subtitle: 'Gut zu wissen',
				title: 'Häufige Fragen',
			});
		});

		it('marks up only the questions whose first department this is', async () => {
			const faqPage = faqPageOf(await renderPage({ faqs: [OWN_FAQ, SHARED_FAQ] }));

			expect(faqPage).toMatchObject({
				mainEntity: [{ name: 'Gibt es ein Probetraining?' }],
				url: 'http://localhost:3000/angebot/fussball',
			});
			expect(faqPage?.mainEntity).toHaveLength(1);
		});

		it('shows a shared question without a FAQPage when it belongs to another department first', async () => {
			const page = await renderPage({ faqs: [SHARED_FAQ] });

			expect(findElement(page, Faq)).toBeDefined();
			expect(faqPageOf(page)).toBeUndefined();
		});

		it.each([
			['none', null],
			['an empty list', []],
		])('renders neither the section nor a FAQPage for %s', async (_description, faqs) => {
			const page = await renderPage({ faqs });

			expect(findElement(page, Faq)).toBeUndefined();
			expect(faqPageOf(page)).toBeUndefined();
		});

		it('keeps stega characters out of the FAQPage', async () => {
			const question = encodeLikeDraftMode('Gibt es ein Probetraining?');
			const page = await renderPage({ faqs: [{ ...OWN_FAQ, question }] });

			expect(faqPageOf(page)).toMatchObject({
				mainEntity: [{ name: 'Gibt es ein Probetraining?' }],
			});
			// The section keeps the encoding, which carries the click-to-edit overlay.
			expect(findElement(page, Faq)?.props.faqs[0]?.question).toBe(question);
		});
	});

	describe('contact persons', () => {
		it('lists the persons in the order of the department', async () => {
			const persons = findElement(await renderPage(), ContactPersons);

			expect(persons?.props).toMatchObject({
				contactPersons: [{ _id: 'person-2' }, { _id: 'person-1' }],
				title: 'Ansprechpartner',
			});
		});

		it.each([
			['none', null],
			['an empty list', []],
		])('renders no contact block for %s', async (_description, contactPersons) => {
			expect(findElement(await renderPage({ contactPersons }), ContactPersons)).toBeUndefined();
		});
	});

	describe('unknown slug', () => {
		it('redirects permanently from a former slug to the current one', async () => {
			mockSanity({ department: null, redirect: 'tanzen' });

			await expect(DepartmentPage(routeProps('alt-tanzen'))).rejects.toThrow('NEXT_REDIRECT');
			expect(vi.mocked(permanentRedirect)).toHaveBeenCalledWith('/angebot/tanzen');
			expect(vi.mocked(notFound)).not.toHaveBeenCalled();
		});

		it('looks the former slug up without stega encoding', async () => {
			mockSanity({ department: null, redirect: 'tanzen' });

			await expect(DepartmentPage(routeProps('alt-tanzen'))).rejects.toThrow();

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { slug: 'alt-tanzen' },
				query: departmentRedirectQuery,
				stega: false,
			});
		});

		it('answers a slug no department ever had with 404', async () => {
			mockSanity({ department: null });

			await expect(DepartmentPage(routeProps('gibt-es-nicht'))).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
			expect(vi.mocked(permanentRedirect)).not.toHaveBeenCalled();
		});

		// Review focus 3: the current owner of a slug wins over the department that used to have it.
		it('never looks up a redirect for a slug a department uses today', async () => {
			await renderPage({}, 'fussball');

			expect(queriesSent()).not.toContain(departmentRedirectQuery);
			expect(vi.mocked(permanentRedirect)).not.toHaveBeenCalled();
		});
	});

	it('gives up when the shared page is missing', async () => {
		mockSanity({ groupsPage: null });

		await expect(DepartmentPage(routeProps())).rejects.toThrow('NEXT_NOT_FOUND');
	});
});
