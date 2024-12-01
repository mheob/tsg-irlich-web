import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/utils/cn';

const ButtonVariants = cva('btn', {
	defaultVariants: {
		variant: 'primary',
	},
	variants: {
		variant: {
			primary: 'btn--primary',
			secondary: 'btn--secondary',
		},
	},
});

export interface ButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof ButtonVariants> {
	asChild?: boolean;
	fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ asChild = false, children, className, fullWidth = false, variant, ...props }, reference) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp
				className={cn(ButtonVariants({ className, variant }), { 'btn--width-full': fullWidth })}
				ref={reference}
				{...props}
			>
				<span>{children}</span>
			</Comp>
		);
	},
);
Button.displayName = 'Button';

export { Button };
