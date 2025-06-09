import { Slot } from '@radix-ui/react-slot';
import { cn } from '@tsgi-web/shared';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { badgeVariants } from './variants';

export interface BadgeProps extends ComponentProps<'div'>, VariantProps<typeof badgeVariants> {}

export function Badge({
	asChild = false,
	className,
	variant,
	...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'span';
	return (
		<Comp className={cn(badgeVariants({ variant }), className)} data-slot="badge" {...props} />
	);
}
