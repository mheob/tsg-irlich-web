import { cva } from 'class-variance-authority';

export const alertVariants = cva(
	'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[--spacing(8)_1fr] has-[>svg]:gap-x-4 [&>svg]:size-8 [&>svg]:text-current',
	{
		defaultVariants: {
			variant: 'default',
		},
		variants: {
			variant: {
				default: 'bg-background text-foreground',
				destructive:
					'border-destructive-foreground bg-destructive text-destructive-foreground dark:border-destructive-foreground [&_p]:text-current [&_svg]:text-current',
				success:
					'border-success-foreground bg-success text-success-foreground dark:border-success-foreground [&_p]:text-current [&_svg]:text-current',
			},
		},
	},
);
