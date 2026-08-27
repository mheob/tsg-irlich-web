import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SingleGroupsPage, { generateMetadata } from '@/app/angebot/[group]/[singleGroup]/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import type { client } from '@/lib/sanity/client';
import {
	offerGroupsGroupPageContactPersonsQuery,
	offerGroupsGroupPageGroupsQuery,
	offerGroupsGroupPageQuery,
} from '@/lib/sanity/queries/pages/offer-groups-group';

import { findElement } from '../../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../../test-utils/sanity-client-mock';
import { Main } from './_sections/main';
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

interface SingleGroupResults {
	coaches?: unknown[];
	group?: unknown;
	page?: unknown;
}

function mockSanity({ coaches = [], group = GROUP, page = PAGE }: SingleGroupResults = {}): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string) => {
		if (query === offerGroupsGroupPageQuery) return page;
		if (query === offerGroupsGroupPageGroupsQuery) return group;
		if (query === offerGroupsGroupPageContactPersonsQuery) return coaches;
		throw new Error(`unexpected query: ${query}`);
	});
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

		it('is empty when the group carries no meta object', async () => {
			mockSanity({ group: { ...GROUP, meta: null } });

			await expect(generateMetadata(routeProps())).resolves.toStrictEqual({});
		});

		it('appends the club name to the group title', async () => {
			mockSanity();

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: 'Die erste Herrenmannschaft',
				title: 'Herren 1 — TSG Irlich',
			});
		});

		it('prefers the meta title over the group title', async () => {
			mockSanity({ group: { ...GROUP, meta: { metaTitle: 'Herren 1 · Fußball' } } });

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				title: 'Herren 1 · Fußball',
			});
		});

		it('has an empty title when neither a meta title nor a group title is set', async () => {
			mockSanity({ group: { ...GROUP, meta: {}, title: null } });

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({ title: '' });
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
