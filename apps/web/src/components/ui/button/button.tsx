import { Button as BaseButton } from '@base-ui/react/button';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

import { buttonVariants } from './variants';

export function Button({
	children,
	className,
	fullWidth = false,
	size,
	variant,
	...props
}: Readonly<ButtonProps>) {
	return (
		<BaseButton
			className={cn(buttonVariants({ className, size, variant }), { 'btn--width-full': fullWidth })}
			data-slot="button"
			{...props}
		>
			<span>{children}</span>
		</BaseButton>
	);
}

export interface ButtonProps
	extends ComponentProps<typeof BaseButton>, VariantProps<typeof buttonVariants> {
	fullWidth?: boolean;
}
