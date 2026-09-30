'use client';

import { ChevronDown } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { NavigationAnchor } from './navigation-anchor';
import type { NavigationEntry, NavigationGroupEntry, NavigationLink } from './navigation-entries';

/** Shared by links and group triggers, so a group reads like a link until it expands. */
const ITEM_CLASS_NAME =
	'flex w-full items-center gap-1 rounded-md px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/40';

function MobileLink({ link, onNavigate }: Readonly<MobileLinkProps>) {
	return (
		<NavigationAnchor
			aria-current={link.isActive ? 'page' : undefined}
			className={cn(ITEM_CLASS_NAME, { 'bg-secondary/40': link.isActive })}
			link={link}
			onClick={onNavigate}
		/>
	);
}

function MobileGroup({ group, onNavigate }: Readonly<MobileGroupProps>) {
	return (
		<Collapsible defaultOpen={group.isActive}>
			<CollapsibleTrigger className={cn(ITEM_CLASS_NAME, 'group/mobile-group justify-between')}>
				{group.title}
				<ChevronDown
					aria-hidden="true"
					className="size-5 transition-transform group-data-panel-open/mobile-group:rotate-180"
				/>
			</CollapsibleTrigger>
			<CollapsibleContent keepMounted>
				<ul className="mt-2 space-y-2 pl-6">
					{group.links.map((link) => (
						<li key={link.key}>
							<MobileLink link={link} onNavigate={onNavigate} />
						</li>
					))}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	);
}

// The entries of the mobile menu. A group expands in place; its panel stays in the markup so the
// pages behind it are part of the server-rendered HTML.
function MobileNavigation({ entries, onNavigate }: Readonly<MobileNavigationProps>) {
	return (
		<ul className="space-y-2">
			{entries.map((entry) =>
				entry.kind === 'group' ? (
					<li key={entry.key}>
						<MobileGroup group={entry} onNavigate={onNavigate} />
					</li>
				) : (
					<li key={entry.link.key}>
						<MobileLink link={entry.link} onNavigate={onNavigate} />
					</li>
				),
			)}
		</ul>
	);
}

interface MobileNavigationProps {
	entries: readonly NavigationEntry[];
	onNavigate: () => void;
}

interface MobileLinkProps {
	link: NavigationLink;
	onNavigate: () => void;
}

interface MobileGroupProps {
	group: NavigationGroupEntry;
	onNavigate: () => void;
}

export { MobileNavigation };
