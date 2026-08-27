import { Separator as BaseSeparator } from '@base-ui/react/separator';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

export function Separator({
	className,
	orientation = 'horizontal',
	...props
}: ComponentProps<typeof BaseSeparator>) {
	return (
		<BaseSeparator
			className={cn(
				`shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px`,
				className,
			)}
			data-slot="separator"
			orientation={orientation}
			{...props}
		/>
	);
}
