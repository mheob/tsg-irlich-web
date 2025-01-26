import { ChevronDownIcon } from '@radix-ui/react-icons';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { cn } from '@tsgi-web/shared';
import { cva } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';

const NavigationMenuViewport = ({
	className,
	...props
}: ComponentPropsWithRef<typeof NavigationMenuPrimitive.Viewport>) => (
	<div className={cn('absolute start-0 top-full flex justify-center')}>
		<NavigationMenuPrimitive.Viewport
			className={cn(
				'origin-top-center bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow-sm md:w-[var(--radix-navigation-menu-viewport-width)]',
				className,
			)}
			{...props}
		/>
	</div>
);
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

const NavigationMenu = ({
	children,
	className,
	...props
}: ComponentPropsWithRef<typeof NavigationMenuPrimitive.Root>) => (
	<NavigationMenuPrimitive.Root
		className={cn(
			// 'relative z-10 flex max-w-max flex-1 items-center justify-center',
			className,
			'relative mx-auto flex items-center justify-between gap-12',
		)}
		id="top"
		{...props}
	>
		{children}
		<NavigationMenuViewport />
	</NavigationMenuPrimitive.Root>
);
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = ({
	className,
	...props
}: ComponentPropsWithRef<typeof NavigationMenuPrimitive.List>) => (
	<NavigationMenuPrimitive.List
		className={cn(
			'group relative flex flex-1 list-none items-center justify-center space-x-1',
			className,
		)}
		{...props}
	/>
);
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navigationMenuTriggerStyle = cva(
	'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 data-active:bg-accent/50 data-[state=open]:bg-accent/50',
);

const NavigationMenuTrigger = ({
	children,
	className,
	...props
}: ComponentPropsWithRef<typeof NavigationMenuPrimitive.Trigger>) => (
	<NavigationMenuPrimitive.Trigger
		className={cn(navigationMenuTriggerStyle(), 'group', className)}
		{...props}
	>
		{children}{' '}
		<ChevronDownIcon
			aria-hidden="true"
			className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180"
		/>
	</NavigationMenuPrimitive.Trigger>
);
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = ({
	className,
	...props
}: ComponentPropsWithRef<typeof NavigationMenuPrimitive.Content>) => (
	<NavigationMenuPrimitive.Content
		className={cn(
			'data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 left-0 top-0 w-full md:absolute md:w-auto',
			className,
		)}
		{...props}
	/>
);
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuIndicator = ({
	className,
	...props
}: ComponentPropsWithRef<typeof NavigationMenuPrimitive.Indicator>) => (
	<NavigationMenuPrimitive.Indicator
		className={cn(
			'data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in z-1 top-full flex h-1.5 items-end justify-center overflow-hidden',
			className,
		)}
		{...props}
	>
		<div className="bg-border relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm shadow-md" />
	</NavigationMenuPrimitive.Indicator>
);
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;

export {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuIndicator,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
	NavigationMenuViewport,
};
