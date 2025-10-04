import process from 'node:process';

import { cn } from '@tsgi-web/shared';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Anton, Bebas_Neue, Inter } from 'next/font/google';

import Footer from '@/components/layout/footer';
import MainNav from '@/components/layout/main-nav';

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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="de">
			<body
				className={cn(
					`${anton.variable} ${bebasNeue.variable} ${inter.variable} antialiased`,
					'flex h-screen flex-col',
				)}
			>
				<MainNav />
				<main className="grid flex-1">{children}</main>
				<Footer />
				<SpeedInsights />
			</body>
		</html>
	);
}
