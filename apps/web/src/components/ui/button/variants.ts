import { cva } from 'class-variance-authority';

export const buttonVariants = cva('btn', {
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
