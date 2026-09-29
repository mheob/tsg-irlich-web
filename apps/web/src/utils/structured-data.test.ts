import { describe, expect, it } from 'vitest';

import type * as structuredDataModule from '@/utils/structured-data';

import { loadWithEnv } from '../../test-utils/env';

type StructuredDataModule = typeof structuredDataModule;

const BASE_URL = 'https://www.tsg-irlich.de';

// The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires.
const ASSET_REF = 'image-abc123def456-800x600-jpg';

const ORGANIZATION = {
	contact: {
		email: 'info@tsg-irlich.de',
		phone: '+49 2631 76987',
		postalAddress: {
			city: 'Neuwied',
			houseNumber: '20',
			street: 'Gotenstraße',
			zipCode: '56567',
		},
	},
	socialFields: {
		facebook: 'https://facebook.example/tsg',
		instagram: 'https://instagram.example/tsg',
		whatsapp: 'https://wa.example/tsg',
		youtube: null,
	},
};

const ARTICLE = {
	_updatedAt: '2026-06-03T08:00:00Z',
	author: { firstName: 'Erika', jobTitle: 'Pressewartin', lastName: 'Mustermann' },
	excerpt: 'Ein Rückblick auf das Sommerfest.',
	featuredImage: {
		_type: 'image' as const,
		asset: { _ref: ASSET_REF, _type: 'reference' as const },
	},
	meta: null,
	publishedAt: '2026-06-01T18:00:00Z',
	title: 'Sommerfest 2026',
};

async function loadStructuredData(): Promise<StructuredDataModule> {
	return loadWithEnv<StructuredDataModule>('@/utils/structured-data', {
		NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
		NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
	});
}

describe('the site graph', () => {
	it('describes the club with its address and contact details', async () => {
		const { getSiteGraph } = await loadStructuredData();

		expect(getSiteGraph(BASE_URL, ORGANIZATION)['@graph'][0]).toStrictEqual({
			'@id': 'https://www.tsg-irlich.de/#organization',
			'@type': 'SportsOrganization',
			address: {
				'@type': 'PostalAddress',
				addressCountry: 'DE',
				addressLocality: 'Neuwied',
				postalCode: '56567',
				streetAddress: 'Gotenstraße 20',
			},
			email: 'info@tsg-irlich.de',
			logo: 'https://www.tsg-irlich.de/tsg-irlich-logo.png',
			name: 'TSG Irlich',
			sameAs: ['https://facebook.example/tsg', 'https://instagram.example/tsg'],
			telephone: '+49 2631 76987',
			url: 'https://www.tsg-irlich.de/',
		});
	});

	it('names the club as the publisher of the website', async () => {
		const { getSiteGraph } = await loadStructuredData();

		expect(getSiteGraph(BASE_URL, ORGANIZATION)['@graph'][1]).toStrictEqual({
			'@id': 'https://www.tsg-irlich.de/#website',
			'@type': 'WebSite',
			inLanguage: 'de-DE',
			name: 'TSG Irlich',
			publisher: { '@id': 'https://www.tsg-irlich.de/#organization' },
			url: 'https://www.tsg-irlich.de/',
		});
	});

	it('still describes the club without site settings', async () => {
		const { getSiteGraph } = await loadStructuredData();

		expect(getSiteGraph(BASE_URL, null)['@graph'][0]).toMatchObject({
			address: undefined,
			email: undefined,
			name: 'TSG Irlich',
			sameAs: [],
		});
	});
});

describe('the news article', () => {
	it('describes the article with its dates, author and canonical URL', async () => {
		const { getNewsArticleSchema } = await loadStructuredData();

		expect(getNewsArticleSchema(BASE_URL, '/news/fussball/sommerfest', ARTICLE)).toMatchObject({
			'@context': 'https://schema.org',
			'@type': 'NewsArticle',
			author: { '@type': 'Person', jobTitle: 'Pressewartin', name: 'Erika Mustermann' },
			dateModified: '2026-06-03T08:00:00Z',
			datePublished: '2026-06-01T18:00:00Z',
			description: 'Ein Rückblick auf das Sommerfest.',
			headline: 'Sommerfest 2026',
			inLanguage: 'de-DE',
			mainEntityOfPage: 'https://www.tsg-irlich.de/news/fussball/sommerfest',
			publisher: { '@id': 'https://www.tsg-irlich.de/#organization', name: 'TSG Irlich' },
		});
	});

	it('offers the image in the three shapes search results use', async () => {
		const { getNewsArticleSchema } = await loadStructuredData();

		const { image } = getNewsArticleSchema(BASE_URL, '/news/fussball/sommerfest', ARTICLE);

		expect(image).toHaveLength(3);
		expect(image).toStrictEqual([
			expect.stringContaining('w=1200&h=675'),
			expect.stringContaining('w=1200&h=900'),
			expect.stringContaining('w=1200&h=1200'),
		]);
	});

	it('prefers the meta description over the excerpt', async () => {
		const { getNewsArticleSchema } = await loadStructuredData();

		expect(
			getNewsArticleSchema(BASE_URL, '/news/fussball/sommerfest', {
				...ARTICLE,
				meta: { metaDescription: 'Kurzfassung' },
			}),
		).toMatchObject({ description: 'Kurzfassung' });
	});

	it('leaves author and image out when the article has neither', async () => {
		const { getNewsArticleSchema } = await loadStructuredData();

		expect(
			getNewsArticleSchema(BASE_URL, '/news/fussball/sommerfest', {
				...ARTICLE,
				author: null,
				featuredImage: null,
			}),
		).toMatchObject({ author: undefined, image: undefined });
	});
});

describe('a group of the club', () => {
	const VENUE = {
		_id: 'venue-pappelstadion',
		location: {
			city: 'Neuwied',
			houseNumber: '20',
			name: 'Pappelstadion Neuwied/Irlich',
			street: 'Gotenstraße',
			zipCode: '56567',
		},
		title: 'Pappelstadion',
	};

	const GROUP = {
		featuredImage: ARTICLE.featuredImage,
		meta: { metaDescription: 'Der perfekte Einstieg in den Fußball.' },
		title: 'F-Jugend',
		training: {
			trainingTimes: [
				{ venue: VENUE },
				{ venue: VENUE },
				{ venue: { _id: 'venue-halle', title: 'Turnhalle' } },
			],
		},
	};

	it('describes a soccer group as a team of the club', async () => {
		const { getGroupSchema } = await loadStructuredData();

		expect(
			getGroupSchema({
				baseUrl: BASE_URL,
				group: GROUP,
				isTeam: true,
				path: '/angebot/fussball/f-jugend',
			}),
		).toMatchObject({
			'@context': 'https://schema.org',
			'@type': 'SportsTeam',
			description: 'Der perfekte Einstieg in den Fußball.',
			name: 'F-Jugend',
			parentOrganization: { '@id': 'https://www.tsg-irlich.de/#organization', name: 'TSG Irlich' },
			url: 'https://www.tsg-irlich.de/angebot/fussball/f-jugend',
		});
	});

	it('describes every other group as an organization of the club', async () => {
		const { getGroupSchema } = await loadStructuredData();

		expect(
			getGroupSchema({
				baseUrl: BASE_URL,
				group: GROUP,
				isTeam: false,
				path: '/angebot/kurse/yoga',
			}),
		).toMatchObject({ '@type': 'SportsOrganization' });
	});

	it('lists each venue it trains at once, with its address', async () => {
		const { getGroupSchema } = await loadStructuredData();

		const { location } = getGroupSchema({
			baseUrl: BASE_URL,
			group: GROUP,
			isTeam: true,
			path: '/angebot/fussball/f-jugend',
		});

		expect(location).toStrictEqual([
			{
				'@type': 'SportsActivityLocation',
				address: {
					'@type': 'PostalAddress',
					addressCountry: 'DE',
					addressLocality: 'Neuwied',
					postalCode: '56567',
					streetAddress: 'Gotenstraße 20',
				},
				name: 'Pappelstadion Neuwied/Irlich',
			},
			{ '@type': 'SportsActivityLocation', address: undefined, name: 'Turnhalle' },
		]);
	});

	it('leaves location and image out for a group without training times or image', async () => {
		const { getGroupSchema } = await loadStructuredData();

		expect(
			getGroupSchema({
				baseUrl: BASE_URL,
				group: { featuredImage: null, meta: null, title: 'Vorstand', training: null },
				isTeam: false,
				path: '/angebot/weitere-sportarten/vorstand',
			}),
		).toMatchObject({ description: undefined, image: undefined, location: undefined });
	});
});
