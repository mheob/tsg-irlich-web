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
	type LucideProps,
} from 'lucide-react';
import Link from 'next/link';
import type { ComponentPropsWithRef } from 'react';

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
	size?: LucideProps['className'];
}

export interface ArrowElementProps
	extends ComponentPropsWithRef<'div'>,
		VariantProps<typeof ArrowButtonVariants>,
		ArrowProps {}

export interface ArrowAnchorProps
	extends ComponentPropsWithRef<typeof Link>,
		VariantProps<typeof ArrowButtonVariants>,
		ArrowProps {}

export interface ArrowButtonProps
	extends ComponentPropsWithRef<'button'>,
		VariantProps<typeof ArrowButtonVariants>,
		ArrowProps {
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

export const ArrowButton = ({
	buttonType = 'button',
	className,
	direction,
	size,
	variant,
	...props
}: ArrowButtonProps) => (
	<button className={ArrowButtonVariants({ className, variant })} type={buttonType} {...props}>
		<Arrow className={size} direction={direction} />
	</button>
);
ArrowButton.displayName = 'ArrowButton';

export const ArrowElement = ({
	className,
	direction,
	size,
	variant,
	...props
}: ArrowElementProps) => (
	<div className={ArrowButtonVariants({ className, variant })} {...props}>
		<Arrow className={size} direction={direction} />
	</div>
);
ArrowElement.displayName = 'ArrowElement';

export const ArrowLink = ({ className, direction, size, variant, ...props }: ArrowAnchorProps) => (
	<Link className={ArrowButtonVariants({ className, variant })} {...props}>
		<Arrow className={size} direction={direction} />
	</Link>
);
ArrowLink.displayName = 'ArrowLink';
