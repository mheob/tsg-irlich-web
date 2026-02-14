import { cn } from '@tsgi-web/shared';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { VisualEditing } from 'next-sanity/visual-editing';
import { Anton, Bebas_Neue, Inter } from 'next/font/google';
import { draftMode } from 'next/headers';

import { DisableDraftMode } from '@/components/draft-mode/disable-draft-mode';
import Footer from '@/components/layout/footer';
import { Navigation } from '@/components/with-logic/navigation';
import { sanityFetch, SanityLive } from '@/lib/sanity/live';
import { mainNavigationQuery } from '@/lib/sanity/queries/main-navigation';
import { getBaseUrl } from '@/utils/url';

import './globals.css';

const anton = Anton({
	display: 'swap',
	subsets: ['latin'],
	variable: '--font-sans-serif',
	weight: ['400'],
});

const bebasNeue = Bebas_Neue({
	display: 'swap',
	subsets: ['latin'],
	variable: '--font-serif',
	weight: ['400'],
});

const inter = Inter({
	display: 'swap',
	subsets: ['latin'],
	variable: '--font-sans',
	weight: ['400', '700'],
});

export const metadata: Metadata = {
	alternates: { types: { 'application/rss+xml': '/feed.xml' } },
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
	metadataBase: new URL(getBaseUrl()),
	title: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { data: mainNavigationQueryResults } = await sanityFetch({
		query: mainNavigationQuery,
	});

	const navItems = mainNavigationQueryResults?.mainNavigation ?? [];

	if (navItems.length === 0) {
		console.warn('No navigation items loaded from Sanity');
	}

	const draft = await draftMode();
	const isDraftMode = draft.isEnabled;

	return (
		<html lang="de">
			<body
				className={cn(
					`${anton.variable} ${bebasNeue.variable} ${inter.variable} antialiased`,
					'flex h-screen flex-col',
				)}
			>
				<Navigation navItems={navItems} />
				<main className="grid flex-1">{children}</main>
				<Footer />
				<Analytics />
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
