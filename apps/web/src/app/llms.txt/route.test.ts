import { afterEach, describe, expect, it, vi } from 'vitest';

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
	description: 'Dein Sportverein für Fußball, Turnen und Tanzen.',
	groups: [
		{
			_type: 'group.soccer',
			description: 'Kreisliga C.',
			slug: '1-mannschaft',
			title: '1. Mannschaft',
		},
		{
			_type: 'group.dance',
			description: 'Showtanz\nmit Akrobatik.',
			slug: 'funky-diamonds',
			title: 'Funky Diamonds',
		},
		{ _type: 'group.soccer', description: null, slug: 'bambinis', title: 'Bambinis' },
	],
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

	it('still lists the departments and pages without any content from Sanity', async () => {
		const text = await llmsTxt({
			aboutUs: null,
			contact: null,
			description: null,
			groups: [],
			membership: null,
		});

		expect(text).not.toContain('>');
		expect(text).not.toContain('Anschrift');
		expect(text).toContain('## Weitere Sportarten');
		expect(text).toContain('- [Über den Verein](http://localhost:3000/verein)\n');
		expect(text).not.toMatch(/\n{3}/u);
	});
});
