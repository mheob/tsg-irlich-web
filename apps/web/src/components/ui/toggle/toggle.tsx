'use client';

import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

import { toggleVariants } from './variants';

export function Toggle({
	className,
	size,
	variant,
	...props
}: ComponentProps<typeof BaseToggle> & VariantProps<typeof toggleVariants>) {
	return (
		<BaseToggle
			className={cn(toggleVariants({ className, size, variant }))}
			data-slot="toggle"
			{...props}
		/>
	);
}
