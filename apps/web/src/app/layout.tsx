import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { VisualEditing } from 'next-sanity/visual-editing';
import localFont from 'next/font/local';
import { draftMode } from 'next/headers';

import { EMPTY_ARRAY, cn } from '@tsgi-web/shared';

import Footer from '@/components/layout/footer';
import { JsonLd } from '@/components/ui/json-ld';
import { DisableDraftMode } from '@/components/with-logic/disable-draft-mode';
import { Navigation } from '@/components/with-logic/navigation/navigation';
import { client } from '@/lib/sanity/client';
import { SanityLive } from '@/lib/sanity/live';
import { mainNavigationQuery } from '@/lib/sanity/queries/main-navigation';
import { organizationQuery } from '@/lib/sanity/queries/shared/organization';
import type {
	MainNavigationQueryResult,
	OrganizationQueryResult,
} from '@/types/sanity.types.generated';
import { FEED_ALTERNATES, SITE_NAME, SITE_OPEN_GRAPH } from '@/utils/metadata';
import { getSiteGraph } from '@/utils/structured-data';
import { getBaseUrl } from '@/utils/url';

// oxlint-disable-next-line import/no-unassigned-import
import './globals.css';
// oxlint-disable-next-line import/no-unassigned-import
import './_assets/fonts/latin-ext.css';

/*
 * The fonts live in the repository rather than coming through `next/font/google`, whose build-time
 * fetch fails whenever Google answers with `/l/font?kit=…` URLs (vercel/next.js#99114). The faces
 * mirror Google's CSS: one variable file per weight, and the `latin` range, repeated because
 * `next/font` only takes literals. The `latin-ext` faces in `_assets/fonts/latin-ext.css` join
 * these families by the names `next/font/local` derives from the variable names below, so renaming
 * a variable means renaming it there too. See "Fonts" in `apps/web/AGENTS.md`.
 */

const oswald = localFont({
	declarations: [
		{
			prop: 'unicode-range',
			value:
				'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
		},
	],
	display: 'swap',
	src: [
		{ path: './_assets/fonts/oswald/latin.woff2', style: 'normal', weight: '400' },
		{ path: './_assets/fonts/oswald/latin.woff2', style: 'normal', weight: '700' },
	],
	variable: '--font-sans-serif',
});

const bebasNeue = localFont({
	declarations: [
		{
			prop: 'unicode-range',
			value:
				'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
		},
	],
	display: 'swap',
	src: [{ path: './_assets/fonts/bebas-neue/latin.woff2', style: 'normal', weight: '400' }],
	variable: '--font-serif',
});

const inter = localFont({
	declarations: [
		{
			prop: 'unicode-range',
			value:
				'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
		},
	],
	display: 'swap',
	src: [
		{ path: './_assets/fonts/inter/latin.woff2', style: 'normal', weight: '400' },
		{ path: './_assets/fonts/inter/latin.woff2', style: 'normal', weight: '700' },
	],
	variable: '--font-sans',
});

// oxlint-disable-next-line no-magic-numbers
const NAVIGATION_REVALIDATE_SECONDS = 60 * 60 * 12;
/** The revalidation webhook tags its run with the document type; both layout fetches read it. */
const SITE_SETTINGS_TAG = 'site-settings';

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

	const [mainNavigationQueryResults, organization] = await Promise.all([
		client
			.fetch<MainNavigationQueryResult>(
				mainNavigationQuery,
				{},
				{ next: { revalidate: NAVIGATION_REVALIDATE_SECONDS, tags: [SITE_SETTINGS_TAG] } },
			)
			.catch(() => null),
		// Missing structured data must not take the page down with it.
		client
			.fetch<OrganizationQueryResult>(
				organizationQuery,
				{},
				{ next: { tags: [SITE_SETTINGS_TAG] } },
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
			<body
				className={cn(
					`${oswald.variable} ${bebasNeue.variable} ${inter.variable} antialiased`,
					'flex h-screen flex-col',
				)}
			>
				<Navigation navItems={navItems} />
				<main className="grid flex-1">{children}</main>
				<Footer />
				<JsonLd data={getSiteGraph(getBaseUrl(), organization)} />
				<Analytics />
				<SpeedInsights />
				<SanityLive />
				{isDraftMode && (
					<>
						<VisualEditing />
						<DisableDraftMode />
					</>
				)}
			</body>
		</html>
	);
}
