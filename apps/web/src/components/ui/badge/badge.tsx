import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '@tsgi-web/shared';

import { badgeVariants } from './variants';

export function Badge({ className, render, variant, ...props }: Readonly<BadgeProps>) {
	const variantClassName = badgeVariants({ variant });

	return useRender({
		defaultTagName: 'span',
		props: mergeProps({ className: cn(variantClassName, className), 'data-slot': 'badge' }, props),
		render,
	});
}

export interface BadgeProps
	extends useRender.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {}
