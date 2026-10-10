import { describe, expect, it } from 'vite-plus/test';

import newsArticle from '../documents/news.article';
import aboutUsPage from './about-us';
import accessibilityPage from './accessibility';
import contactPage from './contact';
import echoOverviewPage from './echo-overview';
import homePage from './home';
import imprintPage from './imprint';
import membershipPage from './membership';
import newsOverviewPage from './news-overview';
import offerPage from './offer';
import privacyPage from './privacy';

interface SinglePage {
	name: string;
	preview: { prepare: () => { title?: string }; select?: Record<string, string> };
}

/** Every single page an internal link can point to. */
const PAGES = [
	aboutUsPage,
	accessibilityPage,
	contactPage,
	echoOverviewPage,
	homePage,
	imprintPage,
	membershipPage,
	newsOverviewPage,
	offerPage,
	privacyPage,
] as unknown as SinglePage[];

describe('single pages in the studio search', () => {
	// WEB-369: the search weighs a field by its place in `preview.select`; without it the title of a
	// single page counted 1 against 10 for a news title, and "echo" never reached the TSG-Echo page.
	it.each(PAGES.map((page) => [page.name, page]))(
		'weighs the title of %s like a document title',
		(_name, page) => {
			expect(page.preview.select).toStrictEqual({ title: 'title' });
		},
	);

	it.each(PAGES.map((page) => [page.name, page]))(
		'keeps the fixed label of %s in lists',
		(_name, page) => {
			expect(page.preview.prepare().title).toMatch(/\S/u);
		},
	);

	// WEB-369: pages come before news. A page title counts 10 through `preview.select`, a news title
	// is set lower, so a page whose title matches always ranks above a news article whose title does.
	it('weighs a news title below a page title', () => {
		const title = (newsArticle.fields as unknown as { name: string; options?: unknown }[]).find(
			(field) => field.name === 'title',
		);

		expect(title?.options).toStrictEqual({ search: { weight: 5 } });
	});
});
