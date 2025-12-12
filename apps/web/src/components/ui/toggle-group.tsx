'use client';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@tsgi-web/shared';
import type { VariantProps } from 'class-variance-authority';
import { type ComponentProps, createContext, use, useMemo } from 'react';

import { toggleVariants } from '@/components/ui/toggle';

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
	size: 'default',
	variant: 'default',
});

export function ToggleGroup({
	children,
	className,
	size,
	variant,
	...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>) {
	const memorizedValue = useMemo(() => ({ size, variant }), [size, variant]);

	return (
		<ToggleGroupPrimitive.Root
			className={cn('flex items-center justify-center gap-1', className)}
			{...props}
		>
			<ToggleGroupContext value={memorizedValue}>{children}</ToggleGroupContext>
		</ToggleGroupPrimitive.Root>
	);
}

export function ToggleGroupItem({
	children,
	className,
	size,
	variant,
	...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) {
	const context = use(ToggleGroupContext);

	return (
		<ToggleGroupPrimitive.Item
			className={cn(
				toggleVariants({
					size: context.size ?? size,
					variant: context.variant ?? variant,
				}),
				className,
			)}
			{...props}
		>
			{children}
		</ToggleGroupPrimitive.Item>
	);
}
