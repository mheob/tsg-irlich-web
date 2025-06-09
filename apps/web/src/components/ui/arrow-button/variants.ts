import { cva } from 'class-variance-authority';

export const ArrowButtonVariants = cva('i-btn', {
	defaultVariants: {
		variant: 'primary',
	},
	variants: {
		variant: {
			ghost: 'i-btn--ghost',
			primary: 'i-btn--primary',
			secondary: 'i-btn--secondary',
		},
	},
});
