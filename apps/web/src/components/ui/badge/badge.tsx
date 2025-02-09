import { cn } from '@tsgi-web/shared';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';

import { badgeVariants } from './variants';

export interface BadgeProps
	extends ComponentPropsWithRef<'div'>,
		VariantProps<typeof badgeVariants> {}

export function Badge({ className, size, variant, ...props }: BadgeProps) {
	return <div className={cn(badgeVariants({ size, variant }), className)} {...props} />;
}
