'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { cn, TSGLogo } from '@tsgi-web/shared';

import { Button } from '@/components/ui/button';
import type { MainNavigationQueryResult } from '@/types/sanity.types';

function getHref(slug: string) {
	return slug === 'home' ? '/' : `/${slug}`;
}

function isActivePage(pathname: string, slug: string) {
	return pathname === getHref(slug) || (pathname.startsWith(`/${slug}`) && slug !== 'home');
}

type NavItem = NonNullable<MainNavigationQueryResult>['mainNavigation'][number];

interface NavItemWithActive extends Omit<NavItem, 'slug'> {
	isActive: boolean;
	slug: string;
}

interface NavigationProps {
	navItems: NavItem[];
}

export function Navigation({ navItems }: Readonly<NavigationProps>) {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	const pathname = usePathname();

	const navItemsWithActive: NavItemWithActive[] = useMemo(
		() =>
			navItems
				.filter((item) => item.slug !== '#!')
				// oxlint-disable-next-line oxc/no-map-spread
				.map((item) => ({
					...item,
					isActive: isActivePage(pathname, item.slug),
					slug: getHref(item.slug),
				})),
		[navItems, pathname],
	);

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

					{/* Desktop Navigation */}
					<div className="hidden items-center space-x-3 lg:flex">
						{navItemsWithActive.map((item) => (
							<Link
								className={cn(
									'flex h-16 items-center px-3 py-2 font-bold text-primary uppercase transition-colors hover:bg-secondary/40',
									{ 'border-b-2 border-secondary': item.isActive },
								)}
								href={item.slug}
								key={item._key}
							>
								{item.title}
							</Link>
						))}
					</div>

					{/* Contact Button (Desktop) */}
					<div className="hidden lg:block">
						<Button
							className="uppercase"
							size={isScrolled ? 'sm' : 'default'}
							variant="secondary"
							asChild
						>
							<Link href="/kontakt">Kontakt aufnehmen</Link>
						</Button>
					</div>

					{/* Mobile Menu Button */}
					<div className="flex items-center gap-2 lg:hidden">
						<button
							aria-label="Toggle menu"
							className="my-2 inline-flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-gray-100"
							// oxlint-disable-next-line react_perf/jsx-no-new-function-as-prop
							onClick={() => {
								setIsMobileOpen(!isMobileOpen);
							}}
							type="button"
						>
							{isMobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
						</button>
					</div>
				</div>

				{/* Mobile Navigation */}
				<div
					className={cn(
						'space-y-2 overflow-hidden transition-all duration-300 ease-in-out lg:hidden',
						{
							'max-h-0 opacity-0': !isMobileOpen,
							'max-h-full pt-12 opacity-100': isMobileOpen,
						},
					)}
				>
					{navItemsWithActive.map((item) => (
						<Link
							className={cn(
								'block rounded-md px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-gray-100 dark:hover:bg-gray-900',
								{ 'bg-secondary/40': item.isActive },
							)}
							href={item.slug}
							key={item._key}
							// oxlint-disable-next-line react_perf/jsx-no-new-function-as-prop
							onClick={() => {
								setIsMobileOpen(false);
							}}
						>
							{item.title}
						</Link>
					))}

					<div className="px-3 py-6 sm:hidden">
						<Button
							className="uppercase"
							// oxlint-disable-next-line react_perf/jsx-no-new-function-as-prop
							onClick={() => {
								setIsMobileOpen(false);
							}}
							variant="secondary"
							asChild
							fullWidth
						>
							<Link href="/kontakt">Kontakt aufnehmen</Link>
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
}
