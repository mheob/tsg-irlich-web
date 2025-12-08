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

const baseUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: 'http://localhost:3000';

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
	const mainNavigationQueryResults = await client.fetch(
		mainNavigationQuery,
		{},
		{ next: { revalidate: 60 * 60 * 12 /* 12 hours */ } },
	);

	return (
		<html lang="de">
			<body
				className={cn(
					`${anton.variable} ${bebasNeue.variable} ${inter.variable} antialiased`,
					'flex h-screen flex-col',
				)}
			>
				<Navigation navItems={mainNavigationQueryResults?.mainNavigation ?? []} />
				<main className="grid flex-1">{children}</main>
				<Footer />
				<Analytics />
			</body>
		</html>
	);
}
