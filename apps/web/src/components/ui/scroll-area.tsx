import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

function ScrollBar({
	className,
	orientation = 'vertical',
	...props
}: ComponentProps<typeof BaseScrollArea.Scrollbar>) {
	return (
		<BaseScrollArea.Scrollbar
			className={cn(
				'flex touch-none opacity-0 transition-opacity select-none data-hovering:pointer-events-auto data-hovering:opacity-100 data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-0',
				orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-px',
				orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-px',
				className,
			)}
			orientation={orientation}
			{...props}
		>
			<BaseScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
		</BaseScrollArea.Scrollbar>
	);
}

function ScrollArea({ children, className, ...props }: ComponentProps<typeof BaseScrollArea.Root>) {
	return (
		<BaseScrollArea.Root className={cn('relative overflow-hidden', className)} {...props}>
			<BaseScrollArea.Viewport className="size-full rounded-[inherit]">
				<BaseScrollArea.Content>{children}</BaseScrollArea.Content>
			</BaseScrollArea.Viewport>
			<ScrollBar />
			<BaseScrollArea.Corner />
		</BaseScrollArea.Root>
	);
}

export { ScrollArea, ScrollBar };
