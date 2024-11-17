import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const ButtonVariants = cva('btn', {
	defaultVariants: {
		variant: 'default',
	},
	variants: {
		variant: {
			default: 'btn--primary',
			secondary: 'btn--secondary',
		},
	},
});

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof ButtonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ asChild = false, children, className, variant, ...props }, reference) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp className={ButtonVariants({ className, variant })} ref={reference} {...props}>
				<b>{children}</b>
			</Comp>
		);
	},
);
Button.displayName = 'Button';

export { Button };
