'use client';

import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from '@tsgi-web/shared';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { toggleVariants } from './variants';

export function Toggle({
	className,
	size,
	variant,
	...props
}: ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
	return (
		<TogglePrimitive.Root
			className={cn(toggleVariants({ className, size, variant }))}
			data-slot="toggle"
			{...props}
		/>
	);
}
