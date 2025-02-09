import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
	'inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
	{
		defaultVariants: {
			size: 'lg',
			variant: 'default',
		},
		variants: {
			size: {
				lg: 'text-lg px-8 py-2 rounded-xl',
				sm: 'text-sm px-4 py-1 rounded-full',
			},
			variant: {
				default: 'bg-secondary/40 text-secondary-foreground/80 hover:bg-secondary/60',
				ghost:
					'bg-background-high-contrast/60 text-muted-foreground/80 shadow hover:bg-background-high-contrast',
			},
		},
	},
);
