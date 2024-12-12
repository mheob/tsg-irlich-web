'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';
import TSGLogo from '@/icons/logos/tsg-logo';

import DesktopNav from './desktop';
import { MobileNav } from './mobile';

// TODO: get navigation items from sanity
const navigationItems = [
	{ _id: 'home', href: '/', title: 'Home' },
	{ _id: 'about', href: '/about', title: 'About' },
	{ _id: 'contact', href: '/contact', title: 'Contact' },
];

export default function MainNav() {
	const isMobile = useMediaQuery('(max-width: 48rem)');

	return (
		<header>
			<div className="container z-10 mx-auto flex min-h-24 items-center justify-between gap-4 md:min-h-40">
				<Link aria-label="Logo der TSG Irlich 1882 e. V." href="/">
					<TSGLogo className="h-16 drop-shadow-xl md:h-28" />
				</Link>
				<div className="flex items-center gap-4 md:flex-row-reverse">
					<Button className="uppercase" variant="secondary" asChild>
						<Link href="/kontakt">Kontakt aufnehmen</Link>
					</Button>
					{isMobile ? (
						<MobileNav navigationItems={navigationItems} />
					) : (
						<DesktopNav navigationItems={navigationItems} />
					)}
				</div>
			</div>
		</header>
	);
}
