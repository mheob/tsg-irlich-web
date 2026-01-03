import { cva } from 'class-variance-authority';

export const alertVariants = cva(
	'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*8)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-4 gap-y-0.5 items-start [&>svg]:size-8 [&>svg]:text-current',
	{
		defaultVariants: {
			variant: 'default',
		},
		variants: {
			variant: {
				default: 'bg-background text-foreground',
				destructive:
					'text-destructive-foreground border-destructive-foreground bg-destructive dark:border-destructive-foreground [&_svg]:text-current [&_p]:text-current',
				success:
					'text-success-foreground border-success-foreground bg-success dark:border-success-foreground [&_svg]:text-current [&_p]:text-current',
			},
		},
	},
);
