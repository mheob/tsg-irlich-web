'use client';

import { cn } from '@tsgi-web/shared';
import type { ComponentProps } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

export function Drawer({ ...props }: ComponentProps<typeof DrawerPrimitive.Root>) {
	return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

export function DrawerTrigger({ ...props }: ComponentProps<typeof DrawerPrimitive.Trigger>) {
	return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

export function DrawerPortal({
	...props
}: Readonly<ComponentProps<typeof DrawerPrimitive.Portal>>) {
	return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

export function DrawerClose({ ...props }: ComponentProps<typeof DrawerPrimitive.Close>) {
	return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

export function DrawerOverlay({
	className,
	...props
}: ComponentProps<typeof DrawerPrimitive.Overlay>) {
	return (
		<DrawerPrimitive.Overlay
			className={cn(
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
				className,
			)}
			data-slot="drawer-overlay"
			{...props}
		/>
	);
}

export function DrawerContent({
	children,
	className,
	...props
}: ComponentProps<typeof DrawerPrimitive.Content>) {
	return (
		<DrawerPortal data-slot="drawer-portal">
			<DrawerOverlay />
			<DrawerPrimitive.Content
				className={cn(
					'group/drawer-content bg-background fixed z-50 flex h-auto flex-col',
					'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b',
					'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t',
					'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm',
					'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm',
					className,
				)}
				data-slot="drawer-content"
				{...props}
			>
				<div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
				{children}
			</DrawerPrimitive.Content>
		</DrawerPortal>
	);
}

export function DrawerHeader({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			className={cn(
				'flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left',
				className,
			)}
			data-slot="drawer-header"
			{...props}
		/>
	);
}

export function DrawerFooter({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			className={cn('mt-auto flex flex-col gap-2 p-4', className)}
			data-slot="drawer-footer"
			{...props}
		/>
	);
}

export function DrawerTitle({ className, ...props }: ComponentProps<typeof DrawerPrimitive.Title>) {
	return (
		<DrawerPrimitive.Title
			className={cn('text-foreground font-semibold', className)}
			data-slot="drawer-title"
			{...props}
		/>
	);
}

export function DrawerDescription({
	className,
	...props
}: ComponentProps<typeof DrawerPrimitive.Description>) {
	return (
		<DrawerPrimitive.Description
			className={cn('text-muted-foreground text-sm', className)}
			data-slot="drawer-description"
			{...props}
		/>
	);
}
