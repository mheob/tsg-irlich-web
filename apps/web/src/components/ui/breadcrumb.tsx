import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@tsgi-web/shared';
import { ChevronsRight } from 'lucide-react';
import type { ComponentPropsWithoutRef, ComponentPropsWithRef, ReactNode } from 'react';

const Breadcrumb = ({ ...props }: ComponentPropsWithRef<'nav'> & { separator?: ReactNode }) => (
	<nav aria-label="breadcrumb" {...props} />
);
Breadcrumb.displayName = 'Breadcrumb';

const BreadcrumbList = ({ className, ...props }: ComponentPropsWithRef<'ol'>) => (
	<ol
		className={cn(
			'flex flex-wrap items-center gap-2 break-words text-sm font-bold md:text-lg',
			className,
		)}
		{...props}
	/>
);
BreadcrumbList.displayName = 'BreadcrumbList';

const BreadcrumbItem = ({ className, ...props }: ComponentPropsWithRef<'li'>) => (
	<li className={cn('inline-flex items-center gap-1.5', className)} {...props} />
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

function BreadcrumbLink({
	asChild,
	className,
	...props
}: ComponentPropsWithRef<'a'> & {
	asChild?: boolean;
}) {
	const Comp = asChild ? Slot : 'a';

	return (
		<Comp
			className={cn('hover:text-secondary underline transition-colors', className)}
			{...props}
		/>
	);
}
BreadcrumbLink.displayName = 'BreadcrumbLink';

const BreadcrumbPage = ({ className, ...props }: ComponentPropsWithRef<'span'>) => (
	<span // NOSONAR
		aria-current="page"
		aria-disabled="true"
		className={cn('font-normal', className)}
		role="link"
		{...props}
	/>
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

const BreadcrumbSeparator = ({ children, className, ...props }: ComponentPropsWithoutRef<'li'>) => (
	<li // NOSONAR
		aria-hidden="true"
		className={cn('[&>svg]:h-5 [&>svg]:w-5', className)}
		role="presentation"
		{...props}
	>
		{children ?? <ChevronsRight strokeWidth={2} />}
	</li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

const BreadcrumbEllipsis = ({ className, ...props }: ComponentPropsWithoutRef<'span'>) => (
	<span // NOSONAR
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
