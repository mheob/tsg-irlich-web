import { Slot } from '@radix-ui/react-slot';
import { cn } from '@tsgi-web/shared';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';

const ButtonVariants = cva('btn', {
	defaultVariants: {
		variant: 'primary',
	},
	variants: {
		variant: {
			ghost: 'btn--ghost',
			primary: 'btn--primary',
			secondary: 'btn--secondary',
		},
	},
});

export interface ButtonProps
	extends ComponentPropsWithRef<'button'>,
		VariantProps<typeof ButtonVariants> {
	asChild?: boolean;
	fullWidth?: boolean;
}

function Button({
	asChild = false,
	children,
	className,
	fullWidth = false,
	ref,
	variant,
	...props
}: Readonly<ButtonProps>) {
	const Comp = asChild ? Slot : 'button';

	return (
		<Comp
			className={cn(ButtonVariants({ className, variant }), { 'btn--width-full': fullWidth })}
			ref={ref}
			{...props}
		>
			<span>{children}</span>
		</Comp>
	);
}

export { Button };
