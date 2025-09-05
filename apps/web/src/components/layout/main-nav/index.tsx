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

	{ _id: 'angebot', href: '/angebot', title: 'Angebot' },
	{ _id: 'news', href: '/news', title: 'Aktuelles' },
];

export default function MainNav() {
	const isMobile = useMediaQuery('(max-width: 48rem)');

	return (
		<header className="bg-background/50 z-10 md:bg-transparent">
			<div className="container mx-auto flex min-h-24 items-center justify-between gap-4 md:min-h-40">
				<Link aria-label="Logo der TSG Irlich 1882 e. V." href="/">
					<TSGLogo className="h-16 drop-shadow-xl md:h-28" />
				</Link>

				{isMobile ? (
					<div className="flex items-center gap-4">
						<Button className="uppercase" variant="secondary" asChild>
							<Link href="/kontakt">Kontakt</Link>
						</Button>
						<MobileNav navigationItems={navigationItems} />
					</div>
				) : (
					<>
						<DesktopNav navigationItems={navigationItems} />
						<Button className="uppercase" variant="secondary" asChild>
							<Link href="/kontakt">Kontakt aufnehmen</Link>
						</Button>
					</>
				)}
			</div>
		</header>
	);
}
