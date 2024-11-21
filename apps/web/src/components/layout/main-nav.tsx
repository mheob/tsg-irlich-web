import Link from 'next/link';
import * as React from 'react';

import TSGLogo from '@/icons/logos/tsg-logo';
import { cn } from '@/utils';

import { Button } from '../ui/button';
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from '../ui/navigation-menu';

type ListItemProps = React.ComponentProps<typeof Link>;

function ListItem({ children, className, title, ...props }: ListItemProps) {
	return (
		<li>
			<NavigationMenuLink asChild>
				<Link
					className={cn(
						'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
						className,
					)}
					{...props}
				>
					<div className="text-sm font-medium leading-none">{title}</div>
					<p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
				</Link>
			</NavigationMenuLink>
		</li>
	);
}

ListItem.displayName = 'ListItem';

const components: { description: string; href: string; title: string }[] = [
	{
		description:
			'A modal dialog that interrupts the user with important content and expects a response.',
		href: '/docs/primitives/alert-dialog',
		title: 'Alert Dialog',
	},
	{
		description: 'For sighted users to preview content available behind a link.',
		href: '/docs/primitives/hover-card',
		title: 'Hover Card',
	},
	{
		description:
			'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
		href: '/docs/primitives/progress',
		title: 'Progress',
	},
	{
		description: 'Visually or semantically separates content.',
		href: '/docs/primitives/scroll-area',
		title: 'Scroll-area',
	},
	{
		description:
			'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
		href: '/docs/primitives/tabs',
		title: 'Tabs',
	},
	{
		description:
			'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
		href: '/docs/primitives/tooltip',
		title: 'Tooltip',
	},
];

export default function MainNav() {
	return (
		<div className="container z-10 mx-auto flex min-h-40 items-center justify-between gap-12">
			<Link aria-label="Logo der TSG Irlich 1882 e. V." href="/">
				<TSGLogo className="h-28 drop-shadow-xl" />
			</Link>

			<NavigationMenu>
				<NavigationMenuList>
					<NavigationMenuItem>
						<Link href="/" legacyBehavior passHref>
							<NavigationMenuLink className={navigationMenuTriggerStyle()}>Home</NavigationMenuLink>
						</Link>
					</NavigationMenuItem>

					<NavigationMenuItem>
						<NavigationMenuTrigger>Verein</NavigationMenuTrigger>

						<NavigationMenuContent>
							<ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
								<li className="row-span-3">
									<NavigationMenuLink asChild>
										<Link
											className="from-muted/50 to-muted flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none focus:shadow-md"
											href="/"
										>
											<div className="mb-2 mt-4 text-lg font-medium">shadcn/ui</div>
											<p className="text-muted-foreground text-sm leading-tight">
												Beautifully designed components built with Radix UI and Tailwind CSS.
											</p>
										</Link>
									</NavigationMenuLink>
								</li>

								<ListItem href="/docs" title="Introduction">
									Re-usable components built using Radix UI and Tailwind CSS.
								</ListItem>

								<ListItem href="/docs/installation" title="Installation">
									How to install dependencies and structure your app.
								</ListItem>

								<ListItem href="/docs/primitives/typography" title="Typography">
									Styles for headings, paragraphs, lists...etc
								</ListItem>
							</ul>
						</NavigationMenuContent>
					</NavigationMenuItem>

					<NavigationMenuItem>
						<NavigationMenuTrigger>Gruppen</NavigationMenuTrigger>

						<NavigationMenuContent>
							<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
								{components.map(component => (
									<ListItem href={component.href} key={component.title} title={component.title}>
										{component.description}
									</ListItem>
								))}
							</ul>
						</NavigationMenuContent>
					</NavigationMenuItem>

					<NavigationMenuItem>
						<Link href="#!" legacyBehavior passHref>
							<NavigationMenuLink className={navigationMenuTriggerStyle()}>
								Aktuelles
							</NavigationMenuLink>
						</Link>
					</NavigationMenuItem>

					<NavigationMenuItem>
						<Link href="#!" legacyBehavior passHref>
							<NavigationMenuLink className={navigationMenuTriggerStyle()}>
								Mitgliedschaft
							</NavigationMenuLink>
						</Link>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>

			<Button className="uppercase" variant="secondary" asChild>
				<Link href="/kontakt">Kontakt aufnehmen</Link>
			</Button>
		</div>
	);
}
