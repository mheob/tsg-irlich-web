import * as React from 'react';

import { cn } from '@/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ children, className, ...props }, reference) => (
		<article
			className={cn('bg-card text-card-foreground rounded-xl p-8 shadow-lg', className)}
			ref={reference}
			{...props}
		>
			{children}
		</article>
	),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, reference) => (
		<header className={cn('flex flex-col space-y-1.5', className)} ref={reference} {...props} />
	),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ children, className, ...props }, reference) => (
		<h3 className={className} ref={reference} {...props}>
			{children}
		</h3>
	),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, reference) => (
		<p className={cn('text-muted-foreground text-sm', className)} ref={reference} {...props} />
	),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, reference) => <div className={className} ref={reference} {...props} />,
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, reference) => (
		<footer className={cn('flex items-center', className)} ref={reference} {...props} />
	),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
