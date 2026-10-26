import { describe, expect, it } from 'vite-plus/test';

import { LANDSCAPE_HERO_DESCRIPTION } from '@/shared/fields/hero-image';

import aboutUsPage from './about-us';
import accessibilityPage from './accessibility';
import contactPage from './contact';
import homePage from './home';
import imprintPage from './imprint';
import membershipPage from './membership';
import newsOverviewPage from './news-overview';
import offerPage from './offer';
import privacyPage from './privacy';

interface PageField {
	description?: string;
	name: string;
}

interface PageSchema {
	fields: readonly unknown[];
	name: string;
}

const HOME_HERO_DESCRIPTION =
	'Freigestelltes Bild mit transparentem Hintergrund (PNG oder WebP) im Hochformat. Es steht unten bündig neben dem Seitentitel.';

const LANDSCAPE_PAGES: readonly [string, PageSchema, string][] = [
	['departmentsPage', offerPage, LANDSCAPE_HERO_DESCRIPTION],
	[
		'aboutUs',
		aboutUsPage,
		`${LANDSCAPE_HERO_DESCRIPTION} Erscheint auch auf den Seiten des TSG-Echos.`,
	],
	['membership', membershipPage, LANDSCAPE_HERO_DESCRIPTION],
	['contact', contactPage, `${LANDSCAPE_HERO_DESCRIPTION} Erscheint auch auf der Feedback-Seite.`],
	[
		'newsOverview',
		newsOverviewPage,
		`${LANDSCAPE_HERO_DESCRIPTION} Erscheint auch auf den Kategorieseiten der News.`,
	],
	['imprint', imprintPage, LANDSCAPE_HERO_DESCRIPTION],
	['privacy', privacyPage, LANDSCAPE_HERO_DESCRIPTION],
	['accessibility', accessibilityPage, LANDSCAPE_HERO_DESCRIPTION],
];

function fieldsOf(page: PageSchema): PageField[] {
	return page.fields as PageField[];
}

function heroImageOf(page: PageSchema): PageField | undefined {
	return fieldsOf(page).find((field) => field.name === 'heroImage');
}

function indexOf(page: PageSchema, name: string): number {
	return fieldsOf(page).findIndex((field) => field.name === name);
}

describe('hero image of the single pages', () => {
	it.each(LANDSCAPE_PAGES)('%s carries it directly after its subtitle', (_type, page) => {
		expect(indexOf(page, 'heroImage')).toBe(indexOf(page, 'subtitle') + 1);
	});

	it.each(LANDSCAPE_PAGES)(
		'%s describes a landscape banner and where else it appears',
		(type, page, description) => {
			expect(page.name).toBe(type);
			expect(heroImageOf(page)?.description).toBe(description);
		},
	);

	it('home carries it directly after its intro', () => {
		expect(indexOf(homePage, 'heroImage')).toBe(indexOf(homePage, 'intro') + 1);
	});

	it('home asks for a cut-out in portrait format', () => {
		expect(heroImageOf(homePage)?.description).toBe(HOME_HERO_DESCRIPTION);
	});
});
