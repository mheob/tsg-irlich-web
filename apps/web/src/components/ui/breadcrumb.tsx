import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Slot } from '@radix-ui/react-slot';
import { ChevronsRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/utils/cn';

const Breadcrumb = React.forwardRef<
	HTMLElement,
	{
		separator?: React.ReactNode;
	} & React.ComponentPropsWithoutRef<'nav'>
>(({ ...props }, reference) => <nav aria-label="breadcrumb" ref={reference} {...props} />);
Breadcrumb.displayName = 'Breadcrumb';

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<'ol'>>(
	({ className, ...props }, reference) => (
		<ol
			className={cn('flex flex-wrap items-center gap-2 break-words text-lg font-bold', className)}
			ref={reference}
			{...props}
		/>
	),
);
BreadcrumbList.displayName = 'BreadcrumbList';

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
	({ className, ...props }, reference) => (
		<li className={cn('inline-flex items-center gap-1.5', className)} ref={reference} {...props} />
	),
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

const BreadcrumbLink = React.forwardRef<
	HTMLAnchorElement,
	{
		asChild?: boolean;
	} & React.ComponentPropsWithoutRef<'a'>
>(({ asChild, className, ...props }, reference) => {
	const Comp = asChild ? Slot : 'a';

	return (
		<Comp
			className={cn('hover:text-secondary underline transition-colors', className)}
			ref={reference}
			{...props}
		/>
	);
});
BreadcrumbLink.displayName = 'BreadcrumbLink';

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
	({ className, ...props }, reference) => (
		<span
			aria-current="page"
			aria-disabled="true"
			className={cn('font-normal', className)}
			ref={reference}
			role="link"
			{...props}
		/>
	),
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<'li'>) => (
	<li
		aria-hidden="true"
		className={cn('[&>svg]:h-5 [&>svg]:w-5', className)}
		role="presentation"
		{...props}
	>
		{children ?? <ChevronsRight strokeWidth={2} />}
	</li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
	<span
		aria-hidden="true"
		className={cn('flex h-9 w-9 items-center justify-center', className)}
		role="presentation"
		{...props}
	>
		<DotsHorizontalIcon className="h-4 w-4" />
		<span className="sr-only">More</span>
	</span>
);
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

export {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
};
