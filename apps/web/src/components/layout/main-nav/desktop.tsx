/* cspell:words mitgliedschaft */
import { cn } from '@tsgi-web/shared';
import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from '../../ui/navigation-menu';

type ListItemProps = ComponentPropsWithoutRef<typeof Link>;

function ListItem({ children, className, title, ...props }: Readonly<ListItemProps>) {
	return (
		<li>
			<NavigationMenuLink asChild>
				<Link
					className={cn(
						'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-hidden block select-none space-y-1 rounded-md p-3 leading-none no-underline transition-colors',
						className,
					)}
					{...props}
				>
					<>
						<div className="text-sm font-medium leading-none">{title}</div>
						<p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
					</>
				</Link>
			</NavigationMenuLink>
		</li>
	);
}

// const components: { description: string; href: string; title: string }[] = [
// 	{
// 		description:
// 			'A modal dialog that interrupts the user with important content and expects a response.',
// 		href: '/docs/primitives/alert-dialog',
// 		title: 'Alert Dialog',
// 	},
// 	{
// 		description: 'For sighted users to preview content available behind a link.',
// 		href: '/docs/primitives/hover-card',
// 		title: 'Hover Card',
// 	},
// 	{
// 		description:
// 			'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
// 		href: '/docs/primitives/progress',
// 		title: 'Progress',
// 	},
// 	{
// 		description: 'Visually or semantically separates content.',
// 		href: '/docs/primitives/scroll-area',
// 		title: 'Scroll-area',
// 	},
// 	{
// 		description:
// 			'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
// 		href: '/docs/primitives/tabs',
// 		title: 'Tabs',
// 	},
// 	{
// 		description:
// 			'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
// 		href: '/docs/primitives/tooltip',
// 		title: 'Tooltip',
// 	},
// ];

interface DesktopNavProps {
	navigationItems: { _id: string; href: string; title: string }[];
}

export default function DesktopNav({ navigationItems }: Readonly<DesktopNavProps>) {
	return (
		<div className="hidden md:block">
			{/* TODO: remove this after debugging */}
			<div className="hidden">{JSON.stringify(navigationItems)}</div>

			<NavigationMenu className="z-10">
				<NavigationMenuList>
					<NavigationMenuItem>
						<NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
							<Link href="/">Home</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>

					<NavigationMenuItem>
						<NavigationMenuTrigger>Verein</NavigationMenuTrigger>

						<NavigationMenuContent>
							<ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
								<li className="row-span-3">
									<NavigationMenuLink asChild>
										<Link
											className="from-muted/50 to-muted bg-linear-to-b outline-hidden flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline focus:shadow-md"
											href="/"
										>
											<>
												<div className="mb-2 mt-4 text-lg font-medium">shadcn/ui</div>
												<p className="text-muted-foreground text-sm leading-tight">
													Beautifully designed components built with Radix UI and Tailwind CSS.
												</p>
											</>
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

					{/* <NavigationMenuItem>
						<NavigationMenuTrigger>Gruppen</NavigationMenuTrigger>

						<NavigationMenuContent>
							<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
								{components.map(component => (
									<ListItem href={component.href} key={component.href} title={component.title}>
										{component.description}
									</ListItem>
								))}
							</ul>
						</NavigationMenuContent>
					</NavigationMenuItem> */}

					<NavigationMenuItem>
						<NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
							<Link href="/angebot">Angebot</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>

					<NavigationMenuItem>
						<NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
							<Link href="/news">Aktuelles</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>

					<NavigationMenuItem>
						<NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
							<Link href="/mitgliedschaft">Mitgliedschaft</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
		</div>
	);
}
