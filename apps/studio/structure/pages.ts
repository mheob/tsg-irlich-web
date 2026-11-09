import type { ComponentType } from 'react';
import { RiArticleLine, RiCommunityLine, RiFootballLine, RiGovernmentLine } from 'react-icons/ri';

/** The schema types of the single pages. Each one is a single document whose id is its type. */
type SinglePageType =
	| 'aboutUs'
	| 'accessibility'
	| 'contact'
	| 'departmentsPage'
	| 'echoOverview'
	| 'groupsPage'
	| 'home'
	| 'imprint'
	| 'membership'
	| 'news-article-page'
	| 'newsOverview'
	| 'newsOverviewCategory'
	| 'privacy'
	| 'searchPage'
	| 'singleGroupPage';

/** The desk groups of `structure/index.ts` that a section lists below its pages. */
type SectionContent = 'departments' | 'echo' | 'faq' | 'groups' | 'news';

/** Where a single page sits on the website, as the editors see it above the form. */
interface SinglePageInfo {
	/** For a page every page of one kind shares: what an edit changes, and where one is edited. */
	readonly note?: string;
	/** The page this one sits under on the website. */
	readonly parent?: SinglePageType;
	/** The address on the website. A part in brackets stands for every page of that kind. */
	readonly path: string;
}

/** An area of the website: its main page, the pages below it, and the documents they show. */
interface PageSection {
	readonly content: readonly SectionContent[];
	readonly icon: ComponentType;
	readonly id: string;
	/** The page at the address of the area, listed first. Without one, no divider precedes `pages`. */
	readonly mainPage?: SinglePageType;
	readonly pages: readonly SinglePageType[];
	readonly title: string;
}

type PageLayoutEntry = PageSection | SinglePageType;

const SINGLE_PAGES: Readonly<Record<SinglePageType, SinglePageInfo>> = {
	aboutUs: { path: '/verein' },
	accessibility: { path: '/barrierefreiheit' },
	contact: { path: '/kontakt' },
	departmentsPage: { path: '/angebot' },
	echoOverview: { parent: 'aboutUs', path: '/verein/echo' },
	groupsPage: {
		note: 'Was du hier änderst, gilt für jede Abteilungsseite. Die Texte einer einzelnen Abteilung bearbeitest du unter Angebot → Abteilungen.',
		path: '/angebot/[abteilung]',
	},
	home: { path: '/' },
	imprint: { path: '/impressum' },
	membership: { path: '/mitgliedschaft' },
	'news-article-page': {
		note: 'Was du hier änderst, gilt für jede Artikelseite. Einen einzelnen Artikel bearbeitest du unter News → News-Artikel.',
		path: '/news/[kategorie]/[artikel]',
	},
	newsOverview: { path: '/news' },
	newsOverviewCategory: {
		note: 'Was du hier änderst, gilt für jede Kategorieseite. Eine einzelne Kategorie bearbeitest du unter News → News-Kategorie.',
		path: '/news/[kategorie]',
	},
	privacy: { path: '/datenschutz' },
	searchPage: { path: '/suche' },
	singleGroupPage: {
		note: 'Was du hier änderst, gilt für jede Gruppenseite. Eine einzelne Gruppe bearbeitest du unter Angebot → Gruppen.',
		path: '/angebot/[abteilung]/[gruppe]',
	},
};

/**
 * The upper block of the desk, in the order of the website: a single page stands on its own, a
 * section opens its main page, the pages below it and the documents they show. A new page needs an
 * entry here and in `SINGLE_PAGES`; `structure/pages.test.ts` fails until it has both.
 */
const PAGE_LAYOUT: readonly PageLayoutEntry[] = [
	'home',
	{
		content: ['echo'],
		icon: RiCommunityLine,
		id: 'club',
		mainPage: 'aboutUs',
		pages: ['echoOverview'],
		title: 'Verein',
	},
	{
		content: ['news'],
		icon: RiArticleLine,
		id: 'news',
		mainPage: 'newsOverview',
		pages: ['newsOverviewCategory', 'news-article-page'],
		title: 'News',
	},
	{
		content: ['departments', 'groups', 'faq'],
		icon: RiFootballLine,
		id: 'offer',
		mainPage: 'departmentsPage',
		pages: ['groupsPage', 'singleGroupPage'],
		title: 'Angebot',
	},
	'membership',
	'contact',
	'searchPage',
	{
		content: [],
		icon: RiGovernmentLine,
		id: 'legal',
		pages: ['imprint', 'privacy', 'accessibility'],
		title: 'Rechtliches',
	},
];

/**
 * Checks whether a schema type is a single page.
 *
 * @param type - The name of a schema type.
 * @returns `true` if `SINGLE_PAGES` knows the type.
 */
function isSinglePageType(type: string): type is SinglePageType {
	return Object.hasOwn(SINGLE_PAGES, type);
}

/**
 * Looks up where a single page sits on the website.
 *
 * @param type - The name of a schema type.
 * @returns The page's place, or `undefined` if the type is no single page.
 */
function findSinglePage(type: string): SinglePageInfo | undefined {
	return isSinglePageType(type) ? SINGLE_PAGES[type] : undefined;
}

/**
 * Lists every single page the layout places, in the order of the desk.
 *
 * @returns The schema types of the placed pages.
 */
function getPlacedPages(): SinglePageType[] {
	return PAGE_LAYOUT.flatMap((entry) => {
		if (typeof entry === 'string') {
			return [entry];
		}
		return entry.mainPage ? [entry.mainPage, ...entry.pages] : [...entry.pages];
	});
}

export { PAGE_LAYOUT, SINGLE_PAGES, findSinglePage, getPlacedPages };
export type { PageLayoutEntry, PageSection, SectionContent, SinglePageInfo, SinglePageType };
