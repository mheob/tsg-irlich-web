import type { Page } from '@playwright/test';

import { openFirstArticle, waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

/**
 * Reads every JSON-LD block of the page.
 *
 * `JSON.parse` throws on a block that does not parse, which fails the spec with the offending text.
 *
 * @param page - The page to read.
 * @returns The parsed blocks, in document order.
 */
async function readStructuredData(page: Page): Promise<Record<string, unknown>[]> {
	const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
	return blocks.map((block) => JSON.parse(block) as Record<string, unknown>);
}

/**
 * Collects the `@type` of every node, including the nodes of a `@graph`.
 *
 * @param blocks - The parsed JSON-LD blocks.
 * @returns The types.
 */
function typesOf(blocks: Record<string, unknown>[]): unknown[] {
	return blocks.flatMap((block) =>
		Array.isArray(block['@graph'])
			? (block['@graph'] as Record<string, unknown>[]).map((node) => node['@type'])
			: [block['@type']],
	);
}

test.describe('structured data', () => {
	test('describes the club and the website on the home page', async ({ page }) => {
		await page.goto('/');
		await waitForPage(page);

		expect(typesOf(await readStructuredData(page))).toStrictEqual([
			'SportsOrganization',
			'WebSite',
		]);
	});

	test('describes an article and the trail to it', async ({ page }) => {
		await openFirstArticle(page);

		const blocks = await readStructuredData(page);

		expect(typesOf(blocks)).toStrictEqual(
			expect.arrayContaining(['BreadcrumbList', 'NewsArticle', 'SportsOrganization', 'WebSite']),
		);
		expect(blocks.find((block) => block['@type'] === 'NewsArticle')).toMatchObject({
			datePublished: expect.any(String),
			headline: expect.any(String),
		});
	});
});
