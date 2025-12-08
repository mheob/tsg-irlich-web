import { Slot } from '@radix-ui/react-slot';
import { cn } from '@tsgi-web/shared';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { buttonVariants } from './variants';

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	fullWidth?: boolean;
}

export function Button({
	asChild = false,
	children,
	className,
	fullWidth = false,
	size,
	variant,
	...props
}: Readonly<ButtonProps>) {
	const Comp = asChild ? Slot : 'button';

	return (
		<Comp
			className={cn(buttonVariants({ className, size, variant }), { 'btn--width-full': fullWidth })}
			data-slot="button"
			{...props}
		>
			<span>{children}</span>
		</Comp>
	);
}
