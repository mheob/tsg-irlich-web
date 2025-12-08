import { cva } from 'class-variance-authority';

export const buttonVariants = cva('btn', {
	defaultVariants: {
		size: 'default',
		variant: 'primary',
	},
	variants: {
		size: {
			default: '',
			sm: 'btn--sm',
		},
		variant: {
			ghost: 'btn--ghost',
			link: 'btn--link',
			primary: 'btn--primary',
			secondary: 'btn--secondary',
			unstyled: 'btn--unstyled',
		},
	},
});
