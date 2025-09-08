import { cn } from '@tsgi-web/shared';
import type { ComponentProps } from 'react';

export function Card({ className, ...props }: ComponentProps<'article'>) {
	return (
		<article
			className={cn('bg-card text-card-foreground rounded-xl p-8 shadow-lg', className)}
			data-slot="card"
			{...props}
		/>
	);
}

export function CardHeader({ className, ...props }: ComponentProps<'header'>) {
	return (
		<header
			className={cn(
				'@container/card-header has-data-[slot=card-action]:grid-cols-[1fr_auto] grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5',
				className,
			)}
			data-slot="card-header"
			{...props}
		/>
	);
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
	return (
		<h3 className={className} data-slot="card-title" {...props}>
			{props.children}
		</h3>
	);
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
	return (
		<div
			className={cn('text-muted-foreground text-sm', className)}
			data-slot="card-description"
			{...props}
		/>
	);
}

export function CardAction({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
			data-slot="card-action"
			{...props}
		/>
	);
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
	return <div className={className} data-slot="card-content" {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
	return <div className={cn('flex items-center', className)} data-slot="card-footer" {...props} />;
}
