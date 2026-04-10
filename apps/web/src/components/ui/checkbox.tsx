// oxlint-disable import/no-namespace

'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

import { cn } from '@tsgi-web/shared';

export function Checkbox({
	className,
	...props
}: ComponentPropsWithRef<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			className={cn(
				'peer grid size-4 shrink-0 place-content-center rounded-sm border border-primary shadow focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator className={cn('grid place-content-center text-current')}>
				<Check className="size-4" />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}
