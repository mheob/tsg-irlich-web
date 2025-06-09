import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@tsgi-web/shared';
import type { ComponentProps } from 'react';

export function Separator({
	className,
	decorative = true,
	orientation = 'horizontal',
	...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) {
	return (
		<SeparatorPrimitive.Root
			className={cn(
				'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px',
				className,
			)}
			data-slot="separator"
			decorative={decorative}
			orientation={orientation}
			{...props}
		/>
	);
}
