import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Anton, Bebas_Neue, Inter } from 'next/font/google';

import { EMPTY_ARRAY, cn } from '@tsgi-web/shared';

import Footer from '@/components/layout/footer';
import { Navigation } from '@/components/with-logic/navigation';
import { client } from '@/lib/sanity/client';
import { mainNavigationQuery } from '@/lib/sanity/queries/main-navigation';
import type { MainNavigationQueryResult } from '@/types/sanity.types.generated';
import { getBaseUrl } from '@/utils/url';

// oxlint-disable-next-line import/no-unassigned-import
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

// oxlint-disable-next-line no-magic-numbers
const NAVIGATION_REVALIDATE_SECONDS = 60 * 60 * 12;

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
	const mainNavigationQueryResults = await client
		.fetch<MainNavigationQueryResult>(
			mainNavigationQuery,
			{},
			{ next: { revalidate: NAVIGATION_REVALIDATE_SECONDS } },
		)
		.catch(() => null);

	const navItems = mainNavigationQueryResults?.mainNavigation ?? EMPTY_ARRAY;

	if (navItems.length === 0) {
		console.warn('No navigation items loaded from Sanity');
	}

	return (
		<html lang="de" data-scroll-behavior="smooth">
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
			</body>
		</html>
	);
}
