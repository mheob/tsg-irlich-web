'use client';

import { cn } from '@tsgi-web/shared';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import TSGLogo from '@/icons/logos/tsg-logo';
import type { MainNavigationQueryResult } from '@/types/sanity.types';

function getHref(slug: string) {
	return slug === 'home' ? '/' : `/${slug}`;
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
	const isActivePage = useCallback(
		(slug: string) => {
			const href = slug === 'home' ? '/' : `/${slug}`;
			return pathname === href || (pathname.startsWith(`/${slug}`) && slug !== 'home');
		},
		[pathname],
	);

	const navItemsWithActive: NavItemWithActive[] = useMemo(() => {
		return navItems.map(item => ({
			...item,
			isActive: isActivePage(item.slug),
			slug: getHref(item.slug),
		}));
	}, [navItems, isActivePage]);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<nav
			className={cn('fixed inset-x-0 top-0 z-50 bg-white/70 transition-all duration-300', {
				'bg-white': isMobileOpen,
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
						{navItemsWithActive.map(item => (
							<Link
								className={cn(
									'hover:bg-secondary/40 text-primary flex h-16 items-center px-3 py-2 font-bold uppercase transition-colors',
									{ 'border-secondary border-b-2': item.isActive },
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
							className="text-foreground inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-900"
							onClick={() => setIsMobileOpen(!isMobileOpen)}
							type="button"
						>
							{isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
					{navItemsWithActive.map(item => (
						<Link
							className={cn(
								'text-foreground block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-900',
								{ 'bg-secondary/40': item.isActive },
							)}
							href={item.slug}
							key={item._key}
							onClick={() => setIsMobileOpen(false)}
						>
							{item.title}
						</Link>
					))}

					<div className="px-3 py-6 sm:hidden">
						<Button
							className="uppercase"
							onClick={() => setIsMobileOpen(false)}
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
