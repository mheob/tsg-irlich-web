import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
	'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3',
	{
		defaultVariants: {
			size: 'lg',
			variant: 'default',
		},
		variants: {
			size: {
				lg: 'rounded-xl px-8 py-2 text-lg',
				sm: 'rounded-full px-4 py-1 text-sm',
			},
			variant: {
				default: 'bg-secondary/40 text-secondary-foreground/80 hover:bg-secondary/60',
				ghost:
					'bg-background-high-contrast/60 text-muted-foreground/80 shadow-sm hover:bg-background-high-contrast',
			},
		},
	},
);
