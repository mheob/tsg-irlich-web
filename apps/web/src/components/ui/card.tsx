import { cn } from '@tsgi-web/shared';
import type { ComponentPropsWithRef } from 'react';

const Card = ({ children, className, ...props }: ComponentPropsWithRef<'article'>) => (
	<article
		className={cn('bg-card text-card-foreground rounded-xl p-8 shadow-lg', className)}
		{...props}
	>
		{children}
	</article>
);
Card.displayName = 'Card';

const CardHeader = ({ className, ...props }: ComponentPropsWithRef<'header'>) => (
	<header className={cn('flex flex-col space-y-1.5', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

const CardTitle = ({ children, className, ...props }: ComponentPropsWithRef<'h3'>) => (
	<h3 className={className} {...props}>
		{children}
	</h3>
);
CardTitle.displayName = 'CardTitle';

const CardDescription = ({ className, ...props }: ComponentPropsWithRef<'p'>) => (
	<p className={cn('text-muted-foreground text-sm', className)} {...props} />
);
CardDescription.displayName = 'CardDescription';

const CardContent = ({ className, ...props }: ComponentPropsWithRef<'div'>) => (
	<div className={className} {...props} />
);
CardContent.displayName = 'CardContent';

const CardFooter = ({ className, ...props }: ComponentPropsWithRef<'footer'>) => (
	<footer className={cn('flex items-center', className)} {...props} />
);
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
