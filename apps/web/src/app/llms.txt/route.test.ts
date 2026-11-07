import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { GET } from '@/app/llms.txt/route';
import type { client } from '@/lib/sanity/client';

import { clientFetchMock } from '../../../test-utils/sanity-client-mock';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: { fetch: vi.fn() } as unknown as typeof client,
}));

const mockedFetch = clientFetchMock();

const CONTENT = {
	aboutUs: 'Alles über den Verein.',
	contact: {
		email: 'info@tsg-irlich.de',
		phone: '+49 2631 76987',
		postalAddress: { city: 'Neuwied', houseNumber: '20', street: 'Gotenstraße', zipCode: '56567' },
	},
	departments: [
		{
			description: null,
			groups: [
				{
					_type: 'group',
					department: 'fussball',
					description: 'Kreisliga C.',
					slug: '1-mannschaft',
					title: '1. Mannschaft',
				},
				{
					_type: 'group',
					department: 'fussball',
					description: null,
					slug: 'bambinis',
					title: 'Bambinis',
				},
			],
			slug: 'fussball',
			title: 'Fußball',
		},
		{
			description: 'Hip-Hop\nund Showtanz für alle Altersklassen.',
			groups: [
				{
					_type: 'group',
					department: 'tanzen',
					description: 'Showtanz\nmit Akrobatik.',
					slug: 'funky-diamonds',
					title: 'Funky Diamonds',
				},
			],
			slug: 'tanzen',
			title: 'Tanzen',
		},
	],
	description: 'Dein Sportverein für Fußball, Turnen und Tanzen.',
	membership: 'Werde Teil der Gemeinschaft.',
};

async function llmsTxt(content: unknown = CONTENT): Promise<string> {
	mockedFetch.mockResolvedValue(content);
	const response = await GET();
	return response.text();
}

describe('llms.txt', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	it('is served as plain text that clients may cache for an hour', async () => {
		mockedFetch.mockResolvedValue(CONTENT);

		const response = await GET();

		expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
		expect(response.headers.get('cache-control')).toBe('public, max-age=3600, s-maxage=3600');
	});

	it('names the club and quotes its description', async () => {
		const text = await llmsTxt();

		expect(
			text.startsWith('# TSG Irlich\n\n> Dein Sportverein für Fußball, Turnen und Tanzen.\n'),
		).toBe(true);
	});

	it('gives the contact details', async () => {
		const text = await llmsTxt();

		expect(text).toContain('Anschrift: Gotenstraße 20, 56567 Neuwied');
		expect(text).toContain('E-Mail: info@tsg-irlich.de');
		expect(text).toContain('Telefon: +49 2631 76987');
	});

	it('lists the departments in the order Sanity returns them, each with its groups', async () => {
		const text = await llmsTxt();

		const headings = text.split('\n').filter((line) => line.startsWith('## '));

		expect(headings).toStrictEqual(['## Fußball', '## Tanzen', '## Verein', '## Optional']);
	});

	it('lists every group under its department, with its description on one line', async () => {
		const text = await llmsTxt();

		expect(text).toContain(
			[
				'## Fußball',
				'',
				'- [Alle Gruppen: Fußball](http://localhost:3000/angebot/fussball)',
				'- [1. Mannschaft](http://localhost:3000/angebot/fussball/1-mannschaft): Kreisliga C.',
				'- [Bambinis](http://localhost:3000/angebot/fussball/bambinis)',
			].join('\n'),
		);
		expect(text).toContain(
			'- [Funky Diamonds](http://localhost:3000/angebot/tanzen/funky-diamonds): Showtanz mit Akrobatik.',
		);
	});

	it('describes the overview link of a department with its meta description on one line', async () => {
		const text = await llmsTxt();

		expect(text).toContain(
			'- [Alle Gruppen: Tanzen](http://localhost:3000/angebot/tanzen): Hip-Hop und Showtanz für alle Altersklassen.',
		);
	});

	it('leaves the overview link of a department without a meta description bare', async () => {
		const text = await llmsTxt();

		expect(text).toContain('- [Alle Gruppen: Fußball](http://localhost:3000/angebot/fussball)\n');
	});

	it('links the club pages and the machine-readable indexes', async () => {
		const text = await llmsTxt();

		expect(text).toContain(
			'- [Über den Verein](http://localhost:3000/verein): Alles über den Verein.',
		);
		expect(text).toContain(
			'- [Mitgliedschaft](http://localhost:3000/mitgliedschaft): Werde Teil der Gemeinschaft.',
		);
		expect(text).toContain('## Optional\n\n- [RSS-Feed](http://localhost:3000/feed.xml)');
		expect(text).toContain('- [Sitemap](http://localhost:3000/sitemap.xml)');
	});

	it('names the founding year and the registered name of the club', async () => {
		const text = await llmsTxt();

		expect(text).toContain('Gegründet: 1882\nVereinsname: TSG Irlich 1882 e.V.\nAnschrift:');
	});

	it('lists the training times below their group', async () => {
		const text = await llmsTxt({
			...CONTENT,
			departments: [
				{
					description: null,
					groups: [
						{
							_type: 'group',
							department: 'fussball',
							description: 'Kreisliga C.',
							slug: '1-mannschaft',
							title: '1. Mannschaft',
							trainingTimes: [
								{
									endTime: '21:00',
									season: 'yearly',
									startTime: '19:30',
									venue: 'Pappelstadion',
									weekday: 'wednesday',
								},
								{
									endTime: '20:00',
									season: 'winter',
									startTime: '18:30',
									venue: 'Sporthalle Irlich',
									weekday: 'friday',
								},
							],
						},
					],
					slug: 'fussball',
					title: 'Fußball',
				},
			],
		});

		expect(text).toContain(
			[
				'- [1. Mannschaft](http://localhost:3000/angebot/fussball/1-mannschaft): Kreisliga C.',
				'  - Training: Mittwoch 19:30–21:00 Uhr (Pappelstadion, Ganzjährig)',
				'  - Training: Freitag 18:30–20:00 Uhr (Sporthalle Irlich, Winter)',
			].join('\n'),
		);
	});

	it('lists the membership fees after the departments', async () => {
		const text = await llmsTxt({
			...CONTENT,
			prices: {
				pricingAdult: { price: 10, subtitle: 'ab 18 Jahre', title: 'Erwachsene' },
				pricingFamily: { price: 15, subtitle: 'für Familien', title: 'Familientarif' },
				pricingYouth: { price: 7.5, subtitle: 'bis 17 Jahre', title: 'Jugend' },
			},
		});

		expect(text).toContain(
			[
				'## Mitgliedsbeiträge',
				'',
				'- Jugend (bis 17 Jahre): 7,5 € monatlich',
				'- Erwachsene (ab 18 Jahre): 10 € monatlich',
				'- Familientarif (für Familien): 15 € monatlich',
				'',
				'## Verein',
			].join('\n'),
		);
	});

	it('skips a group without the slug of its department', async () => {
		const text = await llmsTxt({
			...CONTENT,
			departments: [
				{
					...CONTENT.departments[0],
					groups: [
						{
							_type: 'group',
							department: null,
							description: null,
							slug: 'verwaist',
							title: 'Verwaist',
						},
						...CONTENT.departments[0].groups,
					],
				},
			],
		});

		expect(text).not.toContain('Verwaist');
		expect(text).toContain('[1. Mannschaft](http://localhost:3000/angebot/fussball/1-mannschaft)');
	});

	it('skips a department without a slug together with its groups', async () => {
		const text = await llmsTxt({
			...CONTENT,
			departments: [{ ...CONTENT.departments[0], slug: null }],
		});

		expect(text).not.toContain('## Fußball');
		expect(text).not.toContain('1. Mannschaft');
	});

	it('lists a department without groups by its overview alone', async () => {
		const text = await llmsTxt({
			...CONTENT,
			departments: [{ description: null, groups: [], slug: 'kurse', title: 'Kurse' }],
		});

		expect(text).toContain(
			'## Kurse\n\n- [Alle Gruppen: Kurse](http://localhost:3000/angebot/kurse)\n\n## Verein',
		);
	});

	it('still lists the club pages without any content from Sanity', async () => {
		const text = await llmsTxt({
			aboutUs: null,
			contact: null,
			departments: [],
			description: null,
			membership: null,
			prices: null,
		});

		expect(text).not.toContain('>');
		expect(text).not.toContain('Anschrift');
		expect(
			text.startsWith(
				'# TSG Irlich\n\nGegründet: 1882\nVereinsname: TSG Irlich 1882 e.V.\n\n## Verein\n',
			),
		).toBe(true);
		expect(text).toContain('- [Über den Verein](http://localhost:3000/verein)\n');
		expect(text).not.toMatch(/\n{3}/u);
	});
});
