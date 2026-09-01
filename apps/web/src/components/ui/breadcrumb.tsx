//
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { ChevronsRight, Ellipsis } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

function Breadcrumb({ ...props }: ComponentProps<'nav'>) {
	// Deliberate deviation from the Shadcn template, which ships `aria-label="breadcrumb"`: this is
	// the landmark's only accessible name and the site is German throughout. `shadcn add breadcrumb`
	// overwrites it back to the English string, so it has to be set again after a refetch.
	return <nav aria-label="Breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: ComponentProps<'ol'>) {
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

function BreadcrumbItem({ className, ...props }: ComponentProps<'li'>) {
	return (
		<li
			className={cn('inline-flex items-center gap-1.5', className)}
			data-slot="breadcrumb-item"
			{...props}
		/>
	);
}

function BreadcrumbLink({ className, render, ...props }: useRender.ComponentProps<'a'>) {
	return useRender({
		defaultTagName: 'a',
		props: mergeProps(
			{
				className: cn('underline transition-colors hover:text-secondary', className),
				'data-slot': 'breadcrumb-link',
			},
			props,
		),
		render,
	});
}

function BreadcrumbPage({ className, ...props }: ComponentProps<'span'>) {
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

function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<'li'>) {
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

function BreadcrumbEllipsis({ className, ...props }: ComponentProps<'span'>) {
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

export {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
	BreadcrumbEllipsis,
};
