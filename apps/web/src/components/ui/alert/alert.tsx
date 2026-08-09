import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

import { alertVariants } from './variants';

function Alert({
	className,
	variant,
	...props
}: ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
	return (
		<div
			className={cn(alertVariants({ variant }), className)}
			data-slot="alert"
			role="alert"
			{...props}
		/>
	);
}

function AlertTitle({ className, ...props }: ComponentProps<'h5'>) {
	return (
		<h5
			className={cn(
				'col-start-2 line-clamp-1 min-h-4 text-xl leading-none font-medium tracking-tight md:text-3xl',
				className,
			)}
			data-slot="alert-title"
			{...props}
		>
			{props.children ?? 'MISSING TITLE'}
		</h5>
	);
}

function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			className={cn(
				'col-start-2 grid justify-items-start gap-1 text-lg md:text-2xl [&_p]:leading-relaxed',
				className,
			)}
			data-slot="alert-description"
			{...props}
		/>
	);
}

export { Alert, AlertTitle, AlertDescription };
