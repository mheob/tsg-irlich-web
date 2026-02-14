import { Slot } from '@radix-ui/react-slot';
import { cn } from '@tsgi-web/shared';
import { ChevronsRight, Ellipsis } from 'lucide-react';
import type { ComponentProps } from 'react';

export function Breadcrumb({ ...props }: ComponentProps<'nav'>) {
	return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

export function BreadcrumbList({ className, ...props }: ComponentProps<'ol'>) {
	return (
		<ol
			className={cn(
				'flex flex-wrap items-center gap-2 text-sm font-bold wrap-break-word md:text-lg',
				className,
			)}
			data-slot="breadcrumb-list"
			{...props}
		/>
	);
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<'li'>) {
	return (
		<li
			className={cn('inline-flex items-center gap-1.5', className)}
			data-slot="breadcrumb-item"
			{...props}
		/>
	);
}

export function BreadcrumbLink({
	asChild,
	className,
	...props
}: ComponentProps<'a'> & {
	asChild?: boolean;
}) {
	const Comp = asChild ? Slot : 'a';

	return (
		<Comp
			className={cn('hover:text-secondary underline transition-colors', className)}
			data-slot="breadcrumb-link"
			{...props}
		/>
	);
}

export function BreadcrumbPage({ className, ...props }: ComponentProps<'span'>) {
	return (
		<span // NOSONAR
			aria-current="page"
			aria-disabled="true"
			className={cn('font-normal', className)}
			data-slot="breadcrumb-page"
			role="presentation"
			{...props}
		/>
	);
}

export function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<'li'>) {
	return (
		<li // NOSONAR
			aria-hidden="true"
			className={cn('[&>svg]:size-5', className)}
			data-slot="breadcrumb-separator"
			role="presentation"
			{...props}
		>
			{children ?? <ChevronsRight strokeWidth={2} />}
		</li>
	);
}

export function BreadcrumbEllipsis({ className, ...props }: ComponentProps<'span'>) {
	return (
		<span // NOSONAR
			aria-hidden="true"
			className={cn('flex size-9 items-center justify-center', className)}
			data-slot="breadcrumb-ellipsis"
			role="presentation"
			{...props}
		>
			<Ellipsis className="size-4" />
			<span className="sr-only">Mehr</span>
		</span>
	);
}
