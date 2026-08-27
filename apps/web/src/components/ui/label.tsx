import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

export function Label({ className, ...props }: ComponentProps<'label'>) {
	return (
		<label
			className={cn(
				'flex items-center gap-2 text-lg select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-70 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 md:text-2xl',
				className,
			)}
			data-slot="label"
			{...props}
		/>
	);
}
