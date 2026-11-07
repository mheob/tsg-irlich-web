// oxlint-disable import/max-dependencies -- the root layout wires the fonts, the chrome every page
// shares (skip link, navigation, footer) and the site-wide scripts.
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { VisualEditing } from 'next-sanity/visual-editing';
import { draftMode } from 'next/headers';

import { EMPTY_ARRAY, cn } from '@tsgi-web/shared';

import Footer from '@/components/layout/footer';
import { JsonLd } from '@/components/ui/json-ld';
import { SkipLink } from '@/components/ui/skip-link';
import { DisableDraftModeLazy } from '@/components/with-logic/disable-draft-mode-lazy';
import { Navigation } from '@/components/with-logic/navigation/navigation';
import { client } from '@/lib/sanity/client';
import { SanityLive } from '@/lib/sanity/live';
import {
	getOrganization,
	SITE_SETTINGS_REVALIDATE_SECONDS,
	SITE_SETTINGS_TAG,
} from '@/lib/sanity/organization';
import { mainNavigationQuery } from '@/lib/sanity/queries/main-navigation';
import { searchPlaceholderQuery } from '@/lib/sanity/queries/search';
import type {
	MainNavigationQueryResult,
	SearchPlaceholderQueryResult,
} from '@/types/sanity.types.generated';
import { FEED_ALTERNATES, SITE_NAME, SITE_OPEN_GRAPH } from '@/utils/metadata';
import { getSiteGraph } from '@/utils/structured-data';
import { getBaseUrl } from '@/utils/url';

import { fontVariables } from './_assets/fonts/fonts';

// oxlint-disable-next-line import/no-unassigned-import
import './globals.css';

/** The type of the search page, whose placeholder the panel of the navigation shows. */
const SEARCH_PAGE_TAG = 'searchPage';

/** The id of `<main>`, which the skip link leads to. */
const MAIN_CONTENT_ID = 'main';

export const metadata: Metadata = {
	alternates: { types: FEED_ALTERNATES },
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
	metadataBase: new URL(getBaseUrl()),
	openGraph: SITE_OPEN_GRAPH,
	title: {
		default: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
		template: `%s | ${SITE_NAME}`,
	},
	// Next.js fills in the title, description and image from each page's open graph fields.
	twitter: { card: 'summary_large_image' },
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { isEnabled: isDraftMode } = await draftMode();

	const [mainNavigationQueryResults, organization, searchPlaceholder] = await Promise.all([
		client
			.fetch<MainNavigationQueryResult>(
				mainNavigationQuery,
				{},
				{ next: { revalidate: SITE_SETTINGS_REVALIDATE_SECONDS, tags: [SITE_SETTINGS_TAG] } },
			)
			.catch(() => null),
		// Missing structured data must not take the page down with it. The footer reads the same data.
		getOrganization().catch(() => null),
		// Without it the panel falls back to its own placeholder. Published only, like every fetch of
		// the search, also while draft mode is on.
		client
			.fetch<SearchPlaceholderQueryResult>(
				searchPlaceholderQuery,
				{},
				{
					next: { revalidate: SITE_SETTINGS_REVALIDATE_SECONDS, tags: [SEARCH_PAGE_TAG] },
					perspective: 'published',
				},
			)
			.catch(() => null),
	]);

	const navItems = mainNavigationQueryResults?.mainNavigation ?? EMPTY_ARRAY;

	if (navItems.length === 0) {
		console.warn('No navigation items loaded from Sanity');
	}

	// No `data-scroll-behavior="smooth"` on `<html>` on purpose: that attribute makes the router
	// force `scroll-behavior: auto` for the duration of a navigation, which would kill the very
	// smooth scroll to the top we want. Next.js warns about its absence in development.
	return (
		<html lang="de">
			<body className={cn(`${fontVariables} antialiased`, 'flex h-screen flex-col')}>
				<SkipLink targetId={MAIN_CONTENT_ID} />
				<Navigation navItems={navItems} searchPlaceholder={searchPlaceholder} />
				{/* Focusable for the skip link only, so it takes no outline: the focus is not meant to
				    stay on it, the next Tab moves on to the first control of the page. */}
				<main className="grid flex-1 outline-none" id={MAIN_CONTENT_ID} tabIndex={-1}>
					{children}
				</main>
				<Footer />
				<JsonLd data={getSiteGraph(getBaseUrl(), organization)} />
				<Analytics />
				<SpeedInsights />
				<SanityLive />
				{isDraftMode && (
					<>
						<VisualEditing />
						<DisableDraftModeLazy />
					</>
				)}
			</body>
		</html>
	);
}
