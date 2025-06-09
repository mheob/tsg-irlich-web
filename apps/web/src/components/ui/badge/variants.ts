import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
	'inline-flex items-center justify-center font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
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
