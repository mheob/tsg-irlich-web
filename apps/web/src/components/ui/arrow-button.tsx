import { cva, type VariantProps } from 'class-variance-authority';
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

const ArrowButtonVariants = cva('i-btn', {
	defaultVariants: {
		variant: 'primary',
	},
	variants: {
		variant: {
			ghost: 'i-btn--ghost',
			primary: 'i-btn--primary',
			secondary: 'i-btn--secondary',
		},
	},
});

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
	size?: LucideProps['size'];
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
	direction = 'right',
	size = '48',
}: Readonly<{
	direction: ArrowProps['direction'];
	size: ArrowProps['size'];
}>) {
	switch (direction) {
		/* eslint-disable unicorn/switch-case-braces, prettier/prettier */
		case 'down': return <ArrowDown size={size} strokeWidth={2} />;
		case 'down-left': return <ArrowDownLeft size={size} strokeWidth={2} />;
		case 'down-right': return <ArrowDownRight size={size} strokeWidth={2} />;
		case 'left': return <ArrowLeft size={size} strokeWidth={2} />;
		case 'right': return <ArrowRight size={size} strokeWidth={2} />;
		case 'up': return <ArrowUp size={size} strokeWidth={2} />;
		case 'up-left': return <ArrowUpLeft size={size} strokeWidth={2} />;
		case 'up-right': return <ArrowUpRight size={size} strokeWidth={2} />;
		/* eslint-enable unicorn/switch-case-braces, prettier/prettier */
	}
}

const ArrowButton = ({
	buttonType = 'button',
	className,
	direction,
	size,
	variant,
	...props
}: ArrowButtonProps) => (
	<button className={ArrowButtonVariants({ className, variant })} type={buttonType} {...props}>
		<Arrow direction={direction} size={size} />
	</button>
);
ArrowButton.displayName = 'ArrowButton';

const ArrowElement = ({ className, direction, size, variant, ...props }: ArrowElementProps) => (
	<div className={ArrowButtonVariants({ className, variant })} {...props}>
		<Arrow direction={direction} size={size} />
	</div>
);
ArrowElement.displayName = 'ArrowElement';

const ArrowLink = ({ className, direction, size, variant, ...props }: ArrowAnchorProps) => (
	<Link className={ArrowButtonVariants({ className, variant })} {...props}>
		<Arrow direction={direction} size={size} />
	</Link>
);
ArrowLink.displayName = 'ArrowLink';

export { ArrowButton, ArrowElement, ArrowLink };
