import process from 'node:process';

import { cn } from '@tsgi-web/shared';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Anton, Bebas_Neue, Inter } from 'next/font/google';

import Footer from '@/components/layout/footer';
import { Navigation } from '@/components/with-logic/navigation';
import { client } from '@/lib/sanity/client';
import { mainNavigationQuery } from '@/lib/sanity/queries/main-navigation';

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

const NAVIGATION_REVALIDATE_SECONDS = 60 * 60 * 12; /* 12 hours */

let baseUrl = 'http://localhost:3000';
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
	baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
} else if (process.env.NODE_ENV === 'production') {
	baseUrl = 'https://next.tsg-irlich.de';
}

export const metadata: Metadata = {
	/* eslint-disable perfectionist/sort-objects */
	metadataBase: new URL(baseUrl),
	title: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
	/* eslint-enable perfectionist/sort-objects */
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const mainNavigationQueryResults = await client
		.fetch(mainNavigationQuery, {}, { next: { revalidate: NAVIGATION_REVALIDATE_SECONDS } })
		.catch(() => null);

	const navItems = mainNavigationQueryResults?.mainNavigation ?? [];

	if (navItems.length === 0) {
		console.warn('No navigation items loaded from Sanity');
	}

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
			</body>
		</html>
	);
}
