'use client';

import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Check } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

import { cn } from '@tsgi-web/shared';

export function Checkbox({ className, ...props }: ComponentPropsWithRef<typeof BaseCheckbox.Root>) {
	return (
		<BaseCheckbox.Root
			className={cn(
				'peer grid size-4 shrink-0 place-content-center rounded-sm border border-primary shadow focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-checked:bg-primary data-checked:text-primary-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50',
				className,
			)}
			{...props}
		>
			<BaseCheckbox.Indicator className={cn('grid place-content-center text-current')}>
				<Check className="size-4" />
			</BaseCheckbox.Indicator>
		</BaseCheckbox.Root>
	);
}
