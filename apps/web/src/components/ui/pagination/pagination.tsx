import { ArrowLeft, ArrowRight, Ellipsis } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

import { arrowButtonVariants } from '../arrow-button/variants';

// The structure follows shadcn's pagination. Its `PaginationLink` renders through Base UI's
// `Button`, which puts `role="button"` on the anchor — every page would be announced as a button.
// The links here are plain `next/link` anchors in the round `i-btn` look, so the navigation also
// stays a server component.

// 32 px on a phone, so the arrows and seven slots fit 343 px; 48 px from `md` up.
const SLOT_CLASS_NAME = 'flex size-8 items-center justify-center md:size-12';
const ICON_CLASS_NAME = 'size-5 md:size-7';

function Pagination({ className, ...props }: Readonly<ComponentProps<'nav'>>) {
	return (
		<nav
			aria-label="Seiten"
			className={cn('flex w-full justify-center', className)}
			data-slot="pagination"
			{...props}
		/>
	);
}

function PaginationContent({ className, ...props }: Readonly<ComponentProps<'ul'>>) {
	return (
		<ul
			className={cn('flex items-center gap-1 md:gap-4', className)}
			data-slot="pagination-content"
			{...props}
		/>
	);
}

function PaginationItem(props: Readonly<ComponentProps<'li'>>) {
	return <li data-slot="pagination-item" {...props} />;
}

function PaginationLink({ className, isActive = false, ...props }: Readonly<PaginationLinkProps>) {
	return (
		<Link
			aria-current={isActive ? 'page' : undefined}
			className={arrowButtonVariants({
				className: cn(SLOT_CLASS_NAME, 'text-sm font-semibold md:text-lg', className),
				variant: isActive ? 'secondary' : 'ghost',
			})}
			data-active={isActive}
			data-slot="pagination-link"
			{...props}
		/>
	);
}

const DIRECTIONS = {
	next: { Icon: ArrowRight, label: 'Nächste Seite' },
	previous: { Icon: ArrowLeft, label: 'Vorherige Seite' },
} as const;

function PaginationDirection({
	className,
	direction,
	href,
	...props
}: Readonly<PaginationDirectionProps & { direction: keyof typeof DIRECTIONS }>) {
	const { Icon, label } = DIRECTIONS[direction];
	const icon = <Icon aria-hidden className={ICON_CLASS_NAME} strokeWidth={2} />;

	if (href === undefined) {
		return (
			// Without a target the arrow only holds its place, faded, so the bar keeps its width.
			// Assistive technology skips it: the current page already says where the list stands.
			<span
				aria-hidden
				className={arrowButtonVariants({
					className: cn(SLOT_CLASS_NAME, 'cursor-not-allowed opacity-70', className),
					variant: 'ghost',
				})}
				data-slot="pagination-link"
			>
				{icon}
			</span>
		);
	}

	return (
		<Link
			aria-label={label}
			className={arrowButtonVariants({
				className: cn(SLOT_CLASS_NAME, className),
				variant: 'ghost',
			})}
			data-slot="pagination-link"
			href={href}
			{...props}
		>
			{icon}
		</Link>
	);
}

/**
 * The link to the previous page.
 *
 * @param props - The link's props; without `href` the direction is disabled, as on the first page.
 * @returns The link, or a disabled stand-in.
 */
function PaginationPrevious(props: Readonly<PaginationDirectionProps>) {
	return <PaginationDirection direction="previous" {...props} />;
}

/**
 * The link to the next page.
 *
 * @param props - The link's props; without `href` the direction is disabled, as on the last page.
 * @returns The link, or a disabled stand-in.
 */
function PaginationNext(props: Readonly<PaginationDirectionProps>) {
	return <PaginationDirection direction="next" {...props} />;
}

/**
 * Stands in for skipped pages. Its item belongs hidden from assistive technology: it carries no link.
 *
 * @param props - The span's props.
 * @param props.className - Classes for the slot.
 * @returns The ellipsis.
 */
function PaginationEllipsis({ className, ...props }: Readonly<ComponentProps<'span'>>) {
	return (
		<span className={cn(SLOT_CLASS_NAME, className)} data-slot="pagination-ellipsis" {...props}>
			<Ellipsis aria-hidden className={ICON_CLASS_NAME} strokeWidth={2} />
		</span>
	);
}

interface PaginationLinkProps extends ComponentProps<typeof Link> {
	isActive?: boolean;
}

interface PaginationDirectionProps extends Omit<ComponentProps<typeof Link>, 'children' | 'href'> {
	href?: ComponentProps<typeof Link>['href'];
}

export {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
};
