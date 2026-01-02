import { cva } from 'class-variance-authority';

export const alertVariants = cva(
	'relative w-full rounded-lg border px-6 py-3 text-sm flex flex-row items-center [&_svg]:size-6 [&_svg]:mr-3 [&_p]:text-inherit',
	{
		defaultVariants: {
			variant: 'default',
		},
		variants: {
			variant: {
				default: 'bg-background text-foreground',
				destructive:
					'text-destructive-foreground border-destructive-foreground bg-destructive dark:border-destructive-foreground [&_svg]:text-destructive-foreground',
				success:
					'text-success-foreground border-success-foreground bg-success dark:border-success-foreground [&_svg]:text-success-foreground',
			},
		},
	},
);
