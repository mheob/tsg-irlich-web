'use client';

import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import type { VariantProps } from 'class-variance-authority';
import { createContext, use, useMemo } from 'react';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

import { Toggle } from '@/components/ui/toggle';
import type { toggleVariants } from '@/components/ui/toggle';

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
	size: 'default',
	variant: 'default',
});

function ToggleGroup({
	children,
	className,
	size,
	variant,
	...props
}: ComponentProps<typeof BaseToggleGroup> & VariantProps<typeof toggleVariants>) {
	const memorizedValue = useMemo(() => ({ size, variant }), [size, variant]);

	return (
		<BaseToggleGroup className={cn('flex items-center justify-center gap-1', className)} {...props}>
			<ToggleGroupContext value={memorizedValue}>{children}</ToggleGroupContext>
		</BaseToggleGroup>
	);
}

function ToggleGroupItem({ children, className, size, variant, ...props }: ToggleGroupItemProps) {
	const context = use(ToggleGroupContext);

	return (
		<Toggle
			className={className}
			size={context?.size ?? size}
			variant={context?.variant ?? variant}
			{...props}
		>
			{children}
		</Toggle>
	);
}

type ToggleGroupItemProps = ComponentProps<typeof Toggle>;

export { ToggleGroup, ToggleGroupItem };
