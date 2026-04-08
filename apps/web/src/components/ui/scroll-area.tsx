// oxlint-disable import/no-namespace

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import type { ComponentPropsWithoutRef, ComponentRef, RefObject } from 'react';

import { cn } from '@tsgi-web/shared';

function ScrollBar({
	className,
	orientation = 'vertical',
	ref,
	...props
}: ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & {
	ref?: RefObject<ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> | null>;
}) {
	return (
		<ScrollAreaPrimitive.ScrollAreaScrollbar
			className={cn(
				'flex touch-none transition-colors select-none',
				orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-px',
				orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-px',
				className,
			)}
			orientation={orientation}
			ref={ref}
			{...props}
		>
			<ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
		</ScrollAreaPrimitive.ScrollAreaScrollbar>
	);
}

function ScrollArea({
	children,
	className,
	ref,
	...props
}: ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
	ref?: RefObject<ComponentRef<typeof ScrollAreaPrimitive.Root> | null>;
}) {
	return (
		<ScrollAreaPrimitive.Root
			className={cn('relative overflow-hidden', className)}
			ref={ref}
			{...props}
		>
			<ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit]">
				{children}
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar />
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	);
}

export { ScrollArea, ScrollBar };
