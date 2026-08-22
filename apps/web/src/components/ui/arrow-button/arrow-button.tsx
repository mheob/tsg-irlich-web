import type { VariantProps } from 'class-variance-authority';
import {
	ArrowDown,
	ArrowDownLeft,
	ArrowDownRight,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	ArrowUpLeft,
	ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps, ComponentPropsWithRef } from 'react';

import { cn } from '@tsgi-web/shared';

import { arrowButtonVariants } from './variants';

interface ArrowProps {
	direction?:
		| 'down'
		| 'down-left'
		| 'down-right'
		| 'left'
		| 'right'
		| 'up'
		| 'up-left'
		| 'up-right';
	size: ComponentProps<'svg'>['className'];
}

interface ArrowElementProps
	extends ComponentPropsWithRef<'div'>, VariantProps<typeof arrowButtonVariants>, ArrowProps {}

interface ArrowAnchorProps
	extends
		ComponentPropsWithRef<typeof Link>,
		VariantProps<typeof arrowButtonVariants>,
		ArrowProps {}

interface ArrowButtonProps
	extends ComponentPropsWithRef<'button'>, VariantProps<typeof arrowButtonVariants>, ArrowProps {}

function Arrow({
	className = 'size-8 md:size-12',
	direction = 'right',
}: Readonly<{
	className: ArrowProps['size'];
	direction: ArrowProps['direction'];
}>) {
	switch (direction) {
		/* oxlint-disable unicorn/switch-case-braces */
		case 'down':
			return <ArrowDown className={className} strokeWidth={2} />;
		case 'down-left':
			return <ArrowDownLeft className={className} strokeWidth={2} />;
		case 'down-right':
			return <ArrowDownRight className={className} strokeWidth={2} />;
		case 'left':
			return <ArrowLeft className={className} strokeWidth={2} />;
		case 'right':
			return <ArrowRight className={className} strokeWidth={2} />;
		case 'up':
			return <ArrowUp className={className} strokeWidth={2} />;
		case 'up-left':
			return <ArrowUpLeft className={className} strokeWidth={2} />;
		case 'up-right':
			return <ArrowUpRight className={className} strokeWidth={2} />;
		default:
			return null;
		/* oxlint-enable unicorn/switch-case-braces */
	}
}

function ArrowButton({
	className,
	direction,
	size,
	variant,
	...props
}: Readonly<ArrowButtonProps>) {
	return (
		<button className={arrowButtonVariants({ className, variant })} type="button" {...props}>
			<Arrow className={size} direction={direction} />
		</button>
	);
}

function ArrowElement({ className, direction, size, variant, ...props }: ArrowElementProps) {
	return (
		<div
			className={cn(
				arrowButtonVariants({ className, variant }),
				'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-70 data-[disabled=true]:hover:bg-secondary',
			)}
			{...props}
		>
			<Arrow className={size} direction={direction} />
		</div>
	);
}

function ArrowLink({ className, direction, size, variant, ...props }: ArrowAnchorProps) {
	return (
		<Link className={arrowButtonVariants({ className, variant })} {...props}>
			<Arrow className={size} direction={direction} />
		</Link>
	);
}

export { ArrowButton, ArrowElement, ArrowLink };
