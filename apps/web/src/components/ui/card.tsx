import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

function Card({ className, ...props }: ComponentProps<'article'>) {
	return (
		<article
			className={cn('rounded-xl bg-card p-8 text-card-foreground shadow-lg', className)}
			data-slot="card"
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: ComponentProps<'header'>) {
	return (
		<header
			className={cn(
				'@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto]',
				className,
			)}
			data-slot="card-header"
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
	return (
		<h3 className={className} data-slot="card-title" {...props}>
			{props.children}
		</h3>
	);
}

function CardDescription({ className, ...props }: ComponentProps<'p'>) {
	return (
		<div
			className={cn('text-sm text-muted-foreground', className)}
			data-slot="card-description"
			{...props}
		/>
	);
}

function CardAction({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
			data-slot="card-action"
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
	return <div className={className} data-slot="card-content" {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<'div'>) {
	return <div className={cn('flex items-center', className)} data-slot="card-footer" {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter };
