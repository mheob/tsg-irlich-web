import { cn } from '@tsgi-web/shared';
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

import { ArrowButtonVariants } from './variants';

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
	size?: ComponentProps<'svg'>['className'];
}

interface ArrowElementProps
	extends ComponentPropsWithRef<'div'>, VariantProps<typeof ArrowButtonVariants>, ArrowProps {}

interface ArrowAnchorProps
	extends
		ComponentPropsWithRef<typeof Link>,
		VariantProps<typeof ArrowButtonVariants>,
		ArrowProps {}

interface ArrowButtonProps
	extends ComponentPropsWithRef<'button'>, VariantProps<typeof ArrowButtonVariants>, ArrowProps {
	buttonType?: 'button' | 'reset' | 'submit';
}

function Arrow({
	className = 'size-8 md:size-12',
	direction = 'right',
}: Readonly<{
	className: ArrowProps['size'];
	direction: ArrowProps['direction'];
}>) {
	switch (direction) {
		/* eslint-disable unicorn/switch-case-braces, prettier/prettier */
		case 'down': return <ArrowDown className={className} strokeWidth={2} />;
		case 'down-left': return <ArrowDownLeft className={className} strokeWidth={2} />;
		case 'down-right': return <ArrowDownRight className={className} strokeWidth={2} />;
		case 'left': return <ArrowLeft className={className} strokeWidth={2} />;
		case 'right': return <ArrowRight className={className} strokeWidth={2} />;
		case 'up': return <ArrowUp className={className} strokeWidth={2} />;
		case 'up-left': return <ArrowUpLeft className={className} strokeWidth={2} />;
		case 'up-right': return <ArrowUpRight className={className} strokeWidth={2} />;
		/* eslint-enable unicorn/switch-case-braces, prettier/prettier */
	}
}

export function ArrowButton({
	buttonType = 'button',
	className,
	direction,
	size,
	variant,
	...props
}: Readonly<ArrowButtonProps>) {
	return (
		<button className={ArrowButtonVariants({ className, variant })} type={buttonType} {...props}>
			<Arrow className={size} direction={direction} />
		</button>
	);
}

export function ArrowElement({ className, direction, size, variant, ...props }: ArrowElementProps) {
	return (
		<div
			className={cn(
				ArrowButtonVariants({ className, variant }),
				'hover:bg-secondary cursor-not-allowed data-[disabled=true]:opacity-70',
			)}
			{...props}
		>
			<Arrow className={size} direction={direction} />
		</div>
	);
}

export function ArrowLink({ className, direction, size, variant, ...props }: ArrowAnchorProps) {
	return (
		<Link className={ArrowButtonVariants({ className, variant })} {...props}>
			<Arrow className={size} direction={direction} />
		</Link>
	);
}
