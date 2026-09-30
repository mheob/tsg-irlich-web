'use client';

import { useState } from 'react';

import { cn } from '@tsgi-web/shared';

import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

import { NavigationAnchor } from './navigation-anchor';
import type { NavigationEntry, NavigationGroupEntry, NavigationLink } from './navigation-entries';

/** Shared by the bar's links and triggers, so a group looks like any other item until it opens. */
const TOP_LEVEL_CLASS_NAME =
	'flex h-16 items-center px-3 py-2 font-bold text-primary uppercase transition-colors hover:bg-secondary/40';

function DesktopLink({ link, onFocus }: Readonly<DesktopLinkProps>) {
	return (
		<NavigationMenuItem>
			<NavigationMenuLink
				active={link.isActive}
				className={cn(TOP_LEVEL_CLASS_NAME, 'data-active:border-b-2 data-active:border-secondary')}
				onFocus={onFocus}
				render={<NavigationAnchor link={link} />}
			/>
		</NavigationMenuItem>
	);
}

function DesktopGroup({ group }: Readonly<DesktopGroupProps>) {
	return (
		<NavigationMenuItem value={group.key}>
			<NavigationMenuTrigger
				className={cn(TOP_LEVEL_CLASS_NAME, 'data-popup-open:bg-secondary/40', {
					'border-b-2 border-secondary': group.isActive,
				})}
			>
				{group.title}
			</NavigationMenuTrigger>
			<NavigationMenuContent>
				<ul className="flex min-w-56 flex-col">
					{group.links.map((link) => (
						<li key={link.key}>
							<NavigationMenuLink
								active={link.isActive}
								className="flex items-center gap-1 rounded-sm px-3 py-2 text-foreground hover:bg-muted/40 data-active:bg-secondary/40"
								closeOnClick
								render={<NavigationAnchor link={link} />}
							/>
						</li>
					))}
				</ul>
			</NavigationMenuContent>
		</NavigationMenuItem>
	);
}

// The bar from the `lg` breakpoint on. Plain entries are links; an entry with children opens a panel
// with "Übersicht" and the children, by hover, click or keyboard.
function DesktopNavigation({ entries }: Readonly<DesktopNavigationProps>) {
	// The open group is held here because Base UI only closes a panel on a focus that leaves the whole
	// menu: tabbing from its last link on to the next plain item would otherwise leave it open.
	const [openGroup, setOpenGroup] = useState<string | null>(null);

	const closeOpenGroup = () => {
		setOpenGroup(null);
	};

	return (
		// Base UI renders the root as `<nav>`, and the shell already is the navigation landmark.
		<NavigationMenu
			className="hidden lg:flex"
			onValueChange={(value: string | null) => {
				setOpenGroup(value);
			}}
			render={<div />}
			value={openGroup}
		>
			<NavigationMenuList className="space-x-3">
				{entries.map((entry) =>
					entry.kind === 'group' ? (
						<DesktopGroup group={entry} key={entry.key} />
					) : (
						<DesktopLink key={entry.link.key} link={entry.link} onFocus={closeOpenGroup} />
					),
				)}
			</NavigationMenuList>
		</NavigationMenu>
	);
}

interface DesktopNavigationProps {
	entries: readonly NavigationEntry[];
}

interface DesktopLinkProps {
	link: NavigationLink;
	onFocus: () => void;
}

interface DesktopGroupProps {
	group: NavigationGroupEntry;
}

export { DesktopNavigation };
