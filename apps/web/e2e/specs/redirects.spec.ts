import { expect, test } from '../support/test';

// WEB-420: the addresses of the old WordPress site. The whole table is covered by the unit test of
// `src/lib/redirects/legacy-redirects.ts`; this spec proves the running server applies it, and only
// reads the headers of each hop, like the redirects in `news.spec.ts`.
test.describe('legacy redirects', () => {
	test('sends an old address with its trailing slash on in two permanent hops', async ({
		page,
	}) => {
		const first = await page.request.get('/aktuelle-saison/1-mannschaft/', { maxRedirects: 0 });

		expect(first.status()).toBe(308);
		expect(first.headers().location).toBe('/aktuelle-saison/1-mannschaft');

		const second = await page.request.get('/aktuelle-saison/1-mannschaft', { maxRedirects: 0 });

		expect(second.status()).toBe(308);
		expect(second.headers().location).toBe('/angebot/fussball/1-mannschaft');
	});

	for (const [address, target] of [
		['/feed', '/feed.xml'],
		['/verein/vorstand', '/verein'],
		['/veranstaltungen', '/news/veranstaltungen'],
		['/derbysieg', '/news'],
	] as const) {
		test(`sends ${address} to ${target}`, async ({ page }) => {
			const response = await page.request.get(address, { maxRedirects: 0 });

			expect(response.status()).toBe(308);
			expect(response.headers().location).toBe(target);
		});
	}

	test('leaves an unknown address at the root with a 404', async ({ page }) => {
		const response = await page.request.get('/gibt-es-nicht', { maxRedirects: 0 });

		expect(response.status()).toBe(404);
	});
});
