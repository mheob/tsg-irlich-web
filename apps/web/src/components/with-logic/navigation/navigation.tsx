'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn, TSGLogo } from '@tsgi-web/shared';

import { ButtonLink } from '@/components/ui/button';
import type { MainNavigationQueryResult } from '@/types/sanity.types';

import { DesktopNavigation } from './desktop-navigation';
import { MobileNavigation } from './mobile-navigation';
import { getNavigationEntries } from './navigation-entries';

/** Ties the mobile menu toggle's `aria-controls` to the menu container it opens. */
const MOBILE_MENU_ID = 'mobile-navigation';

const CONTACT_HREF = '/kontakt';

type NavItem = NonNullable<MainNavigationQueryResult>['mainNavigation'][number];

function Navigation({ navItems }: Readonly<NavigationProps>) {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	const toggleRef = useRef<HTMLButtonElement>(null);
	const pathname = usePathname();

	const entries = useMemo(() => getNavigationEntries(navItems, pathname), [navItems, pathname]);

	const closeMobileMenu = () => {
		setIsMobileOpen(false);
	};

	// The menu is a disclosure, not a dialog, so it deliberately does not trap the focus (the ARIA
	// APG does not ask for one here and the page behind stays usable). What it does need is Escape
	// and a defined place for the focus to go: the collapsed container is `inert`, so a focus left
	// inside it would be dropped to `<body>`.
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!isMobileOpen || event.key !== 'Escape') return;

			setIsMobileOpen(false);
			toggleRef.current?.focus();
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isMobileOpen]);

	useEffect(() => {
		const handleScroll = () => {
			const SCROLL_PADDING = 10;
			setIsScrolled(window.scrollY > SCROLL_PADDING);
		};

		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return (
		<nav
			aria-label="Hauptnavigation"
			className={cn('fixed inset-x-0 top-0 z-50 bg-background/70 transition-all duration-300', {
				'bg-background': isMobileOpen,
				'shadow-sm backdrop-blur-md': isScrolled,
			})}
		>
			<div className="container mx-auto">
				<div
					className={cn('relative flex items-center justify-between lg:h-32', {
						'lg:h-16': isScrolled,
					})}
				>
					{/* Logo */}
					<div className="h-full w-40">
						<Link
							aria-label="Logo der TSG Irlich 1882 e. V."
							className="absolute top-2 left-0 block"
							href="/"
						>
							<TSGLogo
								className={cn('h-16 drop-shadow-xl transition-all duration-300 lg:h-28', {
									'lg:h-20': isScrolled,
								})}
							/>
						</Link>
					</div>

					<DesktopNavigation entries={entries} />

					{/* Contact Button (Desktop). Compact between lg and xl, where the bar is tight; the wrappers
					    carry the visibility because `btn` sets its own `display`. */}
					<div className="hidden lg:block xl:hidden">
						<ButtonLink
							className="uppercase"
							render={<Link href={CONTACT_HREF} />}
							size="sm"
							variant="secondary"
						>
							Kontakt
						</ButtonLink>
					</div>
					<div className="hidden xl:block">
						<ButtonLink
							className="uppercase"
							render={<Link href={CONTACT_HREF} />}
							size={isScrolled ? 'sm' : 'default'}
							variant="secondary"
						>
							Kontakt aufnehmen
						</ButtonLink>
					</div>

					{/* Mobile Menu Button */}
					<div className="flex items-center gap-2 lg:hidden">
						<button
							aria-controls={MOBILE_MENU_ID}
							aria-expanded={isMobileOpen}
							aria-label="Menü"
							className="my-2 inline-flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-muted/40"
							onClick={() => {
								setIsMobileOpen(!isMobileOpen);
							}}
							ref={toggleRef}
							type="button"
						>
							{isMobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
						</button>
					</div>
				</div>

				{/* Mobile Navigation */}
				<div
					className={cn('overflow-hidden transition-all duration-300 ease-in-out lg:hidden', {
						'max-h-0 opacity-0': !isMobileOpen,
						'max-h-full pt-12 opacity-100': isMobileOpen,
					})}
					id={MOBILE_MENU_ID}
					// The collapsed menu is only hidden visually so the transition has something to
					// animate, which leaves its links in the accessibility tree and in the tab order.
					// `inert` removes them from both for as long as the menu is closed.
					inert={!isMobileOpen}
				>
					<MobileNavigation entries={entries} onNavigate={closeMobileMenu} />

					<div className="px-3 py-6">
						<ButtonLink
							className="uppercase"
							fullWidth
							onClick={closeMobileMenu}
							render={<Link href={CONTACT_HREF} />}
							variant="secondary"
						>
							Kontakt aufnehmen
						</ButtonLink>
					</div>
				</div>
			</div>
		</nav>
	);
}

interface NavigationProps {
	navItems: NavItem[];
}

export { Navigation };
