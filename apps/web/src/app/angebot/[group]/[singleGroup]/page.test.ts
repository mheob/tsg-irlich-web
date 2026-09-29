import { notFound } from 'next/navigation';
import { Children, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SingleGroupsPage, { generateMetadata } from '@/app/angebot/[group]/[singleGroup]/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { JsonLd } from '@/components/ui/json-ld';
import type { client } from '@/lib/sanity/client';
import {
	offerGroupsGroupPageContactPersonsQuery,
	offerGroupsGroupPageGroupsQuery,
	offerGroupsGroupPageNewsQuery,
	offerGroupsGroupPageQuery,
} from '@/lib/sanity/queries/pages/offer-groups-group';

import { findElement } from '../../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../../test-utils/sanity-client-mock';
import { Main } from './_sections/main';
import { News } from './_sections/news';
import { Training } from './_sections/training';

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

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const ASSET_REF = 'image-abc123def456-800x600-jpg';

const PAGE = {
	content: {
		contactPersonsSection: { title: 'Trainer' },
		trainingSection: { title: 'Trainingszeiten' },
	},
	subtitle: 'Eine Gruppe der TSG',
	title: 'Gruppe',
};

const GROUP = {
	description: { text: [{ _key: 'description', _type: 'block' }] },
	featuredImage: { alt: 'Die Mannschaft', asset: { _ref: ASSET_REF, _type: 'reference' } },
	images: [],
	meta: { metaDescription: 'Die erste Herrenmannschaft', metaTitle: undefined },
	title: 'Herren 1',
	training: [{ _key: 'monday', day: 'Montag' }],
};

const NEWS = {
	_type: 'news.category',
	articles: [{ _id: 'news-1' }],
	slug: 'senioren',
	title: 'Senioren',
};

interface SingleGroupResults {
	coaches?: unknown[];
	group?: unknown;
	news?: unknown;
	page?: unknown;
}

function mockSanity({
	coaches = [],
	group = GROUP,
	news = NEWS,
	page = PAGE,
}: SingleGroupResults = {}): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string) => {
		if (query === offerGroupsGroupPageQuery) return page;
		if (query === offerGroupsGroupPageGroupsQuery) return group;
		if (query === offerGroupsGroupPageContactPersonsQuery) return coaches;
		if (query === offerGroupsGroupPageNewsQuery) return news;
		throw new Error(`unexpected query: ${query}`);
	});
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
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		it('is empty for an unknown department', async () => {
			mockSanity();

			await expect(generateMetadata(routeProps('gibt-es-nicht'))).resolves.toStrictEqual({});
		});

		it('is empty when the group does not exist', async () => {
			mockSanity({ group: null });

			await expect(generateMetadata(routeProps())).resolves.toStrictEqual({});
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

		it('looks the group up by department type and slug', async () => {
			mockSanity();

			await generateMetadata(routeProps('taekwondo', 'anfaenger'));

			expect(mockedFetch).toHaveBeenCalledWith(offerGroupsGroupPageGroupsQuery, {
				groupType: 'group.taekwondo',
				slug: 'anfaenger',
			});
		});
	});

	describe('rendering', () => {
		it.each<[string, string, SingleGroupResults]>([
			['an unknown department', 'gibt-es-nicht', {}],
			['a missing page document', 'fussball', { page: null }],
			['a missing group', 'fussball', { group: null }],
		])('gives up on %s', async (_name, department, results) => {
			mockSanity(results);

			await expect(SingleGroupsPage(routeProps(department))).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('heads the page with the featured image and the shared titles', async () => {
			mockSanity();

			const hero = findElement(await SingleGroupsPage(routeProps()), Hero);

			expect(hero?.props).toMatchObject({
				image: { alt: 'Die Mannschaft' },
				subTitle: 'Eine Gruppe der TSG',
				title: 'Gruppe',
			});
		});

		it('describes a soccer group as a team of the club under its canonical URL', async () => {
			mockSanity();

			const jsonLd = findElement(await SingleGroupsPage(routeProps()), JsonLd);

			expect(jsonLd?.props.data).toMatchObject({
				'@type': 'SportsTeam',
				name: 'Herren 1',
				url: 'http://localhost:3000/angebot/fussball/herren-1',
			});
		});

		it('describes a group of any other department as an organization of the club', async () => {
			mockSanity();

			const jsonLd = findElement(await SingleGroupsPage(routeProps('kurse', 'yoga')), JsonLd);

			expect(jsonLd?.props.data).toMatchObject({ '@type': 'SportsOrganization' });
		});

		it('leaves the hero without an image when the featured image has no alt text', async () => {
			mockSanity({ group: { ...GROUP, featuredImage: { asset: { _ref: ASSET_REF } } } });

			const hero = findElement(await SingleGroupsPage(routeProps()), Hero);

			expect(hero?.props.image).toBeUndefined();
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

			expect(training?.props).toMatchObject({
				title: 'Trainingszeiten',
				training: [{ _key: 'monday' }],
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

		it('looks the news up by department type and group slug', async () => {
			mockSanity();

			await SingleGroupsPage(routeProps('taekwondo', 'anfaenger'));

			expect(mockedFetch).toHaveBeenCalledWith(offerGroupsGroupPageNewsQuery, {
				groupType: 'group.taekwondo',
				slug: 'anfaenger',
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
	});
});
