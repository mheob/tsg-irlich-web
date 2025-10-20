import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@tsgi-web/shared';
import type { ComponentProps } from 'react';

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			className={cn(
				'flex items-center gap-2 text-lg select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-70 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 md:text-2xl',
				className,
			)}
			data-slot="label"
			{...props}
		/>
	);
}
