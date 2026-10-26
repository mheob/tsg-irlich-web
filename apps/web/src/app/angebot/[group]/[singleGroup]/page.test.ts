import { stegaEncodeSourceMap } from '@sanity/client/stega';
import { notFound, permanentRedirect } from 'next/navigation';
import { Children, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import SingleGroupsPage, {
	generateMetadata,
	generateStaticParams,
} from '@/app/angebot/[group]/[singleGroup]/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { JsonLd } from '@/components/ui/json-ld';
import {
	groupContactPersonsQuery,
	groupNewsQuery,
	groupPageQuery,
	groupRedirectQuery,
	groupStaticParamsQuery,
	offerGroupsGroupPageQuery,
} from '@/lib/sanity/queries/pages/offer-groups-group';
import { siteImagesQuery } from '@/lib/sanity/queries/shared/site-images';

import { findElement } from '../../../../../test-utils/react-tree';
import { sanityFetchMock } from '../../../../../test-utils/sanity-live-mock';
import { SITE_IMAGES } from '../../../../../test-utils/site-images';
import { Main } from './_sections/main';
import { News } from './_sections/news';
import { Training } from './_sections/training';

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
const ASSET_REF = 'image-abc123def456-800x600-jpg';
const HERO_ASSET_REF = 'image-hero987fed654-800x600-jpg';

const PAGE = {
	content: {
		contactPersonsSection: { title: 'Trainer' },
		trainingSection: { title: 'Trainingszeiten' },
	},
	subtitle: 'Eine Gruppe der TSG',
	title: 'Gruppe',
};

const GROUP = {
	_id: 'group-herren-1',
	description: { text: [{ _key: 'description', _type: 'block' }] },
	featuredImage: { alt: 'Die Mannschaft', asset: { _ref: ASSET_REF, _type: 'reference' } },
	images: [],
	isTeamSport: true,
	meta: { metaDescription: 'Die erste Herrenmannschaft', metaTitle: undefined },
	title: 'Herren 1',
	training: {
		trainingDescription: { text: [{ _key: 'training', _type: 'block' }] },
		trainingTimes: [{ _key: 'monday', season: 'yearly', weekday: 'monday' }],
	},
};

const NEWS = {
	_type: 'news.category',
	articles: [{ _id: 'news-1' }],
	slug: 'senioren',
	title: 'Senioren',
};

const NO_REDIRECT = { byDepartmentHistory: null, byPreviousPath: null, inDepartment: null };

interface SingleGroupResults {
	coaches?: unknown[];
	group?: unknown;
	news?: unknown;
	page?: unknown;
	redirect?: unknown;
	staticParams?: unknown[];
}

// The queries partly run inside one `Promise.all`, so keying on the query keeps the fixtures
// independent of the order they resolve in.
function mockSanity({
	coaches = [],
	group = GROUP,
	news = NEWS,
	page = PAGE,
	redirect = NO_REDIRECT,
	staticParams = [],
}: SingleGroupResults = {}): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedSanityFetch.mockImplementation(async ({ query }) => {
		if (query === offerGroupsGroupPageQuery) return { data: page };
		if (query === groupPageQuery) return { data: group };
		if (query === groupContactPersonsQuery) return { data: coaches };
		if (query === groupNewsQuery) return { data: news };
		if (query === groupRedirectQuery) return { data: redirect };
		if (query === groupStaticParamsQuery) return { data: staticParams };
		if (query === siteImagesQuery) return { data: SITE_IMAGES };
		throw new Error(`unexpected query: ${query}`);
	});
}

/**
 * Encodes a string the way `sanityFetch` does in draft mode, with invisible characters that point
 * the click-to-edit overlay at the field.
 *
 * @param text - The visible text.
 * @returns The text followed by its stega encoding.
 */
function encodeLikeDraftMode(text: string): string {
	const { value } = stegaEncodeSourceMap(
		{ value: text },
		{
			documents: [{ _id: 'group-herren-1', _type: 'group' }],
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
 * Lists the page's top-level sections in the order they render.
 *
 * @param page - The awaited return value of the page component, a fragment of sections.
 * @returns The component type of every section.
 */
function sectionOrder(page: ReactNode): unknown[] {
	const { children } = (page as ReactElement<{ children: ReactNode }>).props;
	return Children.toArray(children)
		.filter((child) => isValidElement(child))
		.map((child) => child.type);
}

/**
 * Lists the queries the page sent to Sanity so far.
 *
 * @returns The queries, in the order they were sent.
 */
function queriesSent(): string[] {
	return mockedSanityFetch.mock.calls.map(([{ query }]) => query);
}

function routeProps(
	group = 'fussball',
	singleGroup = 'herren-1',
): PageProps<'/angebot/[group]/[singleGroup]'> {
	// `PageProps<'/angebot/[group]/[singleGroup]'>` types the params as a promise.
	return {
		params: Promise.resolve({ group, singleGroup }),
	} as unknown as PageProps<'/angebot/[group]/[singleGroup]'>;
}

describe('single group page', () => {
	afterEach(() => {
		mockedSanityFetch.mockReset();
		vi.mocked(notFound).mockClear();
		vi.mocked(permanentRedirect).mockClear();
	});

	describe('static params', () => {
		it('pre-renders every group below its department', async () => {
			mockSanity({
				staticParams: [
					{ group: 'fussball', singleGroup: 'herren-1' },
					{ group: 'kurse', singleGroup: 'yoga' },
				],
			});

			await expect(generateStaticParams()).resolves.toStrictEqual([
				{ group: 'fussball', singleGroup: 'herren-1' },
				{ group: 'kurse', singleGroup: 'yoga' },
			]);
		});

		it('reads the published groups without stega encoding', async () => {
			mockSanity();

			await generateStaticParams();

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				perspective: 'published',
				query: groupStaticParamsQuery,
				stega: false,
			});
		});
	});

	describe('metadata', () => {
		it('is empty when the group does not exist', async () => {
			mockSanity({ group: null });

			await expect(generateMetadata(routeProps('gibt-es-nicht'))).resolves.toStrictEqual({});
		});

		it('falls back to the group title when the group carries no meta object', async () => {
			mockSanity({ group: { ...GROUP, meta: null } });

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: '',
				title: 'Herren 1',
			});
		});

		it('leaves the club name to the title template', async () => {
			mockSanity();

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: 'Die erste Herrenmannschaft',
				title: 'Herren 1',
			});
		});

		it('points its canonical URL at the group page', async () => {
			mockSanity();

			const metadata = await generateMetadata(routeProps());

			expect(metadata.alternates?.canonical).toBe('/angebot/fussball/herren-1');
		});

		it('prefers the meta title over the group title', async () => {
			mockSanity({ group: { ...GROUP, meta: { metaTitle: 'Herren 1 · Fußball' } } });

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				title: 'Herren 1 · Fußball',
			});
		});

		it('keeps the layout title when neither a meta title nor a group title is set', async () => {
			mockSanity({ group: { ...GROUP, meta: {}, title: null } });

			const metadata = await generateMetadata(routeProps());

			expect(metadata.title).toBeUndefined();
		});

		it('falls back to the featured image for the open graph image', async () => {
			mockSanity();

			const metadata = await generateMetadata(routeProps());

			expect(metadata.openGraph?.images).toMatchObject({ alt: 'Die Mannschaft' });
		});

		it('has no open graph image when the group carries none', async () => {
			mockSanity({ group: { ...GROUP, featuredImage: null } });

			const metadata = await generateMetadata(routeProps());

			expect(metadata.openGraph?.images).toStrictEqual([]);
		});

		it('looks the group up by department slug and group slug without stega encoding', async () => {
			mockSanity();

			await generateMetadata(routeProps('taekwondo', 'anfaenger'));

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { department: 'taekwondo', slug: 'anfaenger' },
				query: groupPageQuery,
				stega: false,
			});
		});

		it('never looks up a redirect', async () => {
			mockSanity({ group: null });

			await generateMetadata(routeProps('alt-tanzen', 'kids'));

			expect(queriesSent()).not.toContain(groupRedirectQuery);
		});
	});

	describe('rendering', () => {
		it('looks the group up by department slug and group slug', async () => {
			mockSanity();

			await SingleGroupsPage(routeProps('taekwondo', 'anfaenger'));

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { department: 'taekwondo', slug: 'anfaenger' },
				query: groupPageQuery,
			});
		});

		it('gives up on a missing page document', async () => {
			mockSanity({ page: null });

			await expect(SingleGroupsPage(routeProps())).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('heads the page with the card image and the shared titles', async () => {
			mockSanity();

			const hero = findElement(await SingleGroupsPage(routeProps()), Hero);

			expect(hero?.props).toMatchObject({
				image: { alt: 'Die Mannschaft' },
				subTitle: 'Eine Gruppe der TSG',
				title: 'Gruppe',
			});
		});

		it('describes a group of a team sport as a team of the club under its canonical URL', async () => {
			mockSanity();

			const jsonLd = findElement(await SingleGroupsPage(routeProps()), JsonLd);

			expect(jsonLd?.props.data).toMatchObject({
				'@type': 'SportsTeam',
				name: 'Herren 1',
				url: 'http://localhost:3000/angebot/fussball/herren-1',
			});
		});

		it.each([
			['is no team sport', false],
			['leaves the team sport open', null],
		])(
			'describes a group whose department %s as an organization of the club',
			async (_name, isTeamSport) => {
				mockSanity({ group: { ...GROUP, isTeamSport, title: 'Yoga' } });

				const jsonLd = findElement(await SingleGroupsPage(routeProps('kurse', 'yoga')), JsonLd);

				expect(jsonLd?.props.data).toMatchObject({
					'@type': 'SportsOrganization',
					url: 'http://localhost:3000/angebot/kurse/yoga',
				});
			},
		);

		it('crops the card image to the landscape format of the hero', async () => {
			mockSanity();

			const hero = findElement(await SingleGroupsPage(routeProps()), Hero);
			// The page hands the hero a Sanity URL, never a static import.
			const { searchParams } = new URL(hero?.props.image?.src as string);

			expect(searchParams.get('w')).toBe('1920');
			expect(searchParams.get('h')).toBe('600');
		});

		it('shows the hero image instead of the card image when the group has one', async () => {
			mockSanity({
				group: {
					...GROUP,
					heroImage: { alt: 'Das Training', asset: { _ref: HERO_ASSET_REF, _type: 'reference' } },
				},
			});

			const image = findElement(await SingleGroupsPage(routeProps()), Hero)?.props.image;

			expect(image?.alt).toBe('Das Training');
			expect(image?.src).toContain('hero987fed654');
		});

		it('falls back to the card image when the hero image has no file', async () => {
			mockSanity({ group: { ...GROUP, heroImage: { alt: 'Leer' } } });

			const image = findElement(await SingleGroupsPage(routeProps()), Hero)?.props.image;

			expect(image?.alt).toBe('Die Mannschaft');
		});

		it('names the image after the group when it has no alt text', async () => {
			mockSanity({ group: { ...GROUP, featuredImage: { asset: { _ref: ASSET_REF } } } });

			const hero = findElement(await SingleGroupsPage(routeProps()), Hero);

			expect(hero?.props.image?.alt).toBe('Herren 1');
		});

		it('shows the image of the site settings when neither image has a file', async () => {
			mockSanity({ group: { ...GROUP, featuredImage: { alt: 'Leer' }, heroImage: null } });

			const hero = findElement(await SingleGroupsPage(routeProps()), Hero);

			expect(hero?.props.image?.alt).toBe('Sporthalle');
			expect(hero?.props.image?.src).toContain('fallback999');
		});

		it('renders the group description and title', async () => {
			mockSanity();

			const main = findElement(await SingleGroupsPage(routeProps()), Main);

			expect(main?.props).toMatchObject({
				description: { text: [{ _key: 'description', _type: 'block' }] },
				title: 'Herren 1',
			});
		});

		it('falls back to an empty description and title', async () => {
			mockSanity({ group: { ...GROUP, description: null, images: null, title: null } });

			const main = findElement(await SingleGroupsPage(routeProps()), Main);

			expect(main?.props).toMatchObject({ description: { text: [] }, gallery: [], title: '' });
		});

		it('shows the training times of the group', async () => {
			mockSanity();

			const training = findElement(await SingleGroupsPage(routeProps()), Training);

			expect(training?.props).toStrictEqual({
				title: 'Trainingszeiten',
				training: {
					trainingDescription: { text: [{ _key: 'training', _type: 'block' }] },
					trainingTimes: [{ _key: 'monday', season: 'yearly', weekday: 'monday' }],
				},
			});
		});

		it('leaves the training section out for a group without training times', async () => {
			mockSanity({ group: { ...GROUP, training: null } });

			const page = await SingleGroupsPage(routeProps());

			expect(findElement(page, Training)).toBeUndefined();
		});

		it('shows the latest news of the category assigned to the group', async () => {
			mockSanity();

			const news = findElement(await SingleGroupsPage(routeProps()), News);

			expect(news?.props).toStrictEqual(NEWS);
		});

		it('looks the news up by the id of the group', async () => {
			mockSanity();

			await SingleGroupsPage(routeProps());

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { groupId: 'group-herren-1' },
				query: groupNewsQuery,
			});
		});

		it('places the news between the training times and the contact persons', async () => {
			mockSanity();

			const order = sectionOrder(await SingleGroupsPage(routeProps()));

			expect(order.indexOf(News)).toBe(order.indexOf(Training) + 1);
			expect(order.indexOf(ContactPersons)).toBe(order.indexOf(News) + 1);
		});

		it.each<[string, unknown]>([
			['no news category is assigned to the group', null],
			['the news category has no articles yet', { ...NEWS, articles: [] }],
		])('leaves the news section out when %s', async (_name, news) => {
			mockSanity({ news });

			const page = await SingleGroupsPage(routeProps());

			expect(findElement(page, News)).toBeUndefined();
		});

		it('lists the coaches of the group as contact persons', async () => {
			mockSanity({ coaches: [{ _id: 'coach-1' }] });

			const persons = findElement(await SingleGroupsPage(routeProps()), ContactPersons);

			expect(persons?.props).toMatchObject({
				contactPersons: [{ _id: 'coach-1' }],
				title: 'Trainer',
			});
		});

		it('looks the contact persons up by the id of the group', async () => {
			mockSanity();

			await SingleGroupsPage(routeProps());

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { groupId: 'group-herren-1' },
				query: groupContactPersonsQuery,
			});
		});
	});

	describe('draft mode', () => {
		it('keeps the stega encoding out of the structured data', async () => {
			mockSanity({ group: { ...GROUP, title: encodeLikeDraftMode('Herren 1') } });

			const jsonLd = findElement(await SingleGroupsPage(routeProps()), JsonLd);

			expect(jsonLd?.props.data).toMatchObject({ name: 'Herren 1' });
		});

		it('keeps the click-to-edit encoding on the rendered title', async () => {
			const title = encodeLikeDraftMode('Herren 1');
			mockSanity({ group: { ...GROUP, title } });

			const main = findElement(await SingleGroupsPage(routeProps()), Main);

			expect(main?.props.title).toBe(title);
		});

		it('hands the training cards seasons and weekdays they can look up', async () => {
			mockSanity({
				group: {
					...GROUP,
					training: {
						trainingTimes: [
							{
								_key: 'monday',
								season: encodeLikeDraftMode('yearly'),
								weekday: encodeLikeDraftMode('monday'),
							},
						],
					},
				},
			});

			const training = findElement(await SingleGroupsPage(routeProps()), Training);

			expect(training?.props.training?.trainingTimes).toStrictEqual([
				{ _key: 'monday', season: 'yearly', weekday: 'monday' },
			]);
		});

		it('hands the contact persons over without stega encoding', async () => {
			mockSanity({ coaches: [{ _id: 'coach-1', phone: encodeLikeDraftMode('02631 12345') }] });

			const persons = findElement(await SingleGroupsPage(routeProps()), ContactPersons);

			expect(persons?.props.contactPersons).toStrictEqual([
				{ _id: 'coach-1', phone: '02631 12345' },
			]);
		});
	});

	describe('unknown path', () => {
		it('redirects permanently from a former path to the current one', async () => {
			mockSanity({
				group: null,
				redirect: { ...NO_REDIRECT, inDepartment: { departmentSlug: 'tanzen', slug: 'kids' } },
			});

			await expect(SingleGroupsPage(routeProps('alt-tanzen', 'kids'))).rejects.toThrow(
				'NEXT_REDIRECT',
			);
			expect(vi.mocked(permanentRedirect)).toHaveBeenCalledWith('/angebot/tanzen/kids');
			expect(vi.mocked(notFound)).not.toHaveBeenCalled();
		});

		it('looks the former path up without stega encoding', async () => {
			mockSanity({ group: null });

			await expect(SingleGroupsPage(routeProps('alt-tanzen', 'kids'))).rejects.toThrow();

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { department: 'alt-tanzen', slug: 'kids' },
				query: groupRedirectQuery,
				stega: false,
			});
		});

		it('answers a path no group ever had with 404', async () => {
			mockSanity({ group: null });

			await expect(SingleGroupsPage(routeProps('gibt-es-nicht', 'kids'))).rejects.toThrow(
				'NEXT_NOT_FOUND',
			);
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
			expect(vi.mocked(permanentRedirect)).not.toHaveBeenCalled();
		});

		it('answers 404 when the redirect lookup finds nothing at all', async () => {
			mockSanity({ group: null, redirect: null });

			await expect(SingleGroupsPage(routeProps('gibt-es-nicht', 'kids'))).rejects.toThrow(
				'NEXT_NOT_FOUND',
			);
			expect(vi.mocked(permanentRedirect)).not.toHaveBeenCalled();
		});

		// Review focus 3: the group that has a path today wins over the group that used to have it.
		it('never looks up a redirect for a path a group uses today', async () => {
			mockSanity({
				redirect: { ...NO_REDIRECT, byPreviousPath: { departmentSlug: 'kurse', slug: 'yoga' } },
			});

			await SingleGroupsPage(routeProps());

			expect(queriesSent()).not.toContain(groupRedirectQuery);
			expect(vi.mocked(permanentRedirect)).not.toHaveBeenCalled();
		});
	});
});
