import type { Metadata } from 'next';
import { Anton, Bebas_Neue, Inter } from 'next/font/google';

import Footer from '@/components/layout/footer';
import MainNav from '@/components/layout/main-nav';
import { SanityLive } from '@/lib/sanity/live';
import { cn } from '@/utils';

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
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
	title: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="de">
			<head>
				<link href="/favicon.svg" rel="icon" sizes="any" />
			</head>
			<body
				className={cn(
					`${anton.variable} ${bebasNeue.variable} ${inter.variable} antialiased`,
					'flex h-screen flex-col',
				)}
			>
				{/* The <SanityLive> component is responsible for making all sanityFetch calls in your application live, so should always be rendered. */}
				<SanityLive />
				{/* <SanityLive onError={handleError} /> */}

				<MainNav />

				<main className="grid flex-1">{children}</main>

				<Footer />
			</body>
		</html>
	);
}
