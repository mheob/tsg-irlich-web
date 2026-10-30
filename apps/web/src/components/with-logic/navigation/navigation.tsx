'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { cn, TSGLogo } from '@tsgi-web/shared';

import { ButtonLink } from '@/components/ui/button';
import { SearchButton } from '@/components/with-logic/search/search-button';
import type { MainNavigationQueryResult } from '@/types/sanity.types';

import { DesktopNavigation } from './desktop-navigation';
import { MobileNavigation } from './mobile-navigation';
import { getNavigationEntries } from './navigation-entries';

/** Ties the mobile menu toggle's `aria-controls` to the menu container it opens. */
const MOBILE_MENU_ID = 'mobile-navigation';

const CONTACT_HREF = '/kontakt';

// The panel reaches the browser in its own chunk, on the first press of a lupe.
const SearchPanel = lazy(async () => {
	const { SearchPanel: component } = await import('@/components/with-logic/search/search-panel');
	return { default: component };
});

type NavItem = NonNullable<MainNavigationQueryResult>['mainNavigation'][number];

function Navigation({ navItems, searchPlaceholder }: Readonly<NavigationProps>) {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [hasOpenedSearch, setHasOpenedSearch] = useState(false);

	const toggleRef = useRef<HTMLButtonElement>(null);
	const desktopSearchRef = useRef<HTMLButtonElement>(null);
	const mobileSearchRef = useRef<HTMLButtonElement>(null);
	// Where the focus goes when the search closes: the lupe that opened it, or the menu toggle when
	// the menu is what closed it.
	const searchFinalFocusRef = useRef<HTMLElement | null>(null);
	const pathname = usePathname();

	// A new page closes the search. Adjusted while rendering, so the old page's panel never paints
	// over the new one.
	const [searchPathname, setSearchPathname] = useState(pathname);
	if (searchPathname !== pathname) {
		setSearchPathname(pathname);
		setIsSearchOpen(false);
	}

	const entries = useMemo(() => getNavigationEntries(navItems, pathname), [navItems, pathname]);

	const closeMobileMenu = () => {
		setIsMobileOpen(false);
	};

	const openSearch = (lupe: HTMLButtonElement | null) => {
		searchFinalFocusRef.current = lupe;
		setIsMobileOpen(false);
		setHasOpenedSearch(true);
		setIsSearchOpen(true);
	};

	const toggleMobileMenu = () => {
		if (isSearchOpen) {
			searchFinalFocusRef.current = toggleRef.current;
			setIsSearchOpen(false);
		}

		setIsMobileOpen(!isMobileOpen);
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
				'bg-background': isMobileOpen || isSearchOpen,
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

					{/* Lupe and Contact Button (Desktop). The contact button is compact between lg and xl,
					    where the bar is tight; its wrappers carry the visibility because `btn` sets its own
					    `display`. */}
					<div className="hidden items-center gap-3 lg:flex">
						<SearchButton
							onOpen={() => {
								openSearch(desktopSearchRef.current);
							}}
							ref={desktopSearchRef}
						/>
						<div className="xl:hidden">
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
					</div>

					{/* Lupe and Mobile Menu Button */}
					<div className="flex items-center gap-2 lg:hidden">
						<SearchButton
							className="my-2"
							onOpen={() => {
								openSearch(mobileSearchRef.current);
							}}
							ref={mobileSearchRef}
						/>
						<button
							aria-controls={MOBILE_MENU_ID}
							aria-expanded={isMobileOpen}
							aria-label="Menü"
							className="my-2 inline-flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-muted/40"
							onClick={toggleMobileMenu}
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

			{/* Not before the first press of a lupe: until then no code of the panel is loaded. The
			    dialog is portalled to the end of `<body>`, outside this landmark. */}
			{hasOpenedSearch && (
				<Suspense fallback={null}>
					<SearchPanel
						finalFocus={searchFinalFocusRef}
						isBarCompact={isScrolled}
						onOpenChange={setIsSearchOpen}
						open={isSearchOpen}
						placeholder={searchPlaceholder}
					/>
				</Suspense>
			)}
		</nav>
	);
}

interface NavigationProps {
	navItems: NavItem[];
	/** The placeholder of the search page, for the input of the panel. */
	searchPlaceholder?: null | string;
}

export { Navigation };
