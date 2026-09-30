'use client';

import { NavigationMenu as NavigationMenuPrimitive } from '@base-ui/react/navigation-menu';
import { ChevronDown } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

/** Gap in pixels between a trigger and the popup below it. */
const POPUP_OFFSET = 8;

function NavigationMenuPositioner({
	align = 'start',
	className,
	side = 'bottom',
	sideOffset = POPUP_OFFSET,
	...props
}: NavigationMenuPrimitive.Positioner.Props) {
	return (
		<NavigationMenuPrimitive.Portal>
			<NavigationMenuPrimitive.Positioner
				align={align}
				className={cn(
					'isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-300 data-instant:transition-none',
					className,
				)}
				side={side}
				sideOffset={sideOffset}
				{...props}
			>
				<NavigationMenuPrimitive.Popup className="relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 transition-[opacity,transform,width,height,scale] duration-300 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
					<NavigationMenuPrimitive.Viewport className="relative size-full overflow-hidden" />
				</NavigationMenuPrimitive.Popup>
			</NavigationMenuPrimitive.Positioner>
		</NavigationMenuPrimitive.Portal>
	);
}

function NavigationMenu({ align = 'start', children, className, ...props }: NavigationMenuProps) {
	return (
		<NavigationMenuPrimitive.Root
			className={cn('relative flex items-center', className)}
			data-slot="navigation-menu"
			{...props}
		>
			{children}
			<NavigationMenuPositioner align={align} />
		</NavigationMenuPrimitive.Root>
	);
}

function NavigationMenuList({ className, ...props }: NavigationMenuPrimitive.List.Props) {
	return (
		<NavigationMenuPrimitive.List
			className={cn('flex list-none items-center', className)}
			data-slot="navigation-menu-list"
			{...props}
		/>
	);
}

function NavigationMenuItem({ className, ...props }: NavigationMenuPrimitive.Item.Props) {
	return (
		<NavigationMenuPrimitive.Item
			className={cn('relative', className)}
			data-slot="navigation-menu-item"
			{...props}
		/>
	);
}

function NavigationMenuTrigger({
	children,
	className,
	...props
}: NavigationMenuPrimitive.Trigger.Props) {
	return (
		<NavigationMenuPrimitive.Trigger
			className={cn(
				'group/navigation-menu-trigger inline-flex cursor-pointer items-center gap-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
				className,
			)}
			data-slot="navigation-menu-trigger"
			{...props}
		>
			{children}
			<ChevronDown
				aria-hidden="true"
				className="size-4 transition-transform duration-300 group-data-popup-open/navigation-menu-trigger:rotate-180"
			/>
		</NavigationMenuPrimitive.Trigger>
	);
}

function NavigationMenuContent({ className, ...props }: NavigationMenuPrimitive.Content.Props) {
	return (
		<NavigationMenuPrimitive.Content
			className={cn(
				'p-2 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0',
				className,
			)}
			data-slot="navigation-menu-content"
			{...props}
		/>
	);
}

function NavigationMenuLink({ className, ...props }: NavigationMenuPrimitive.Link.Props) {
	return (
		<NavigationMenuPrimitive.Link
			className={cn(
				'transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
				className,
			)}
			data-slot="navigation-menu-link"
			{...props}
		/>
	);
}

type NavigationMenuProps = NavigationMenuPrimitive.Root.Props &
	Pick<NavigationMenuPrimitive.Positioner.Props, 'align'>;

export {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
};
