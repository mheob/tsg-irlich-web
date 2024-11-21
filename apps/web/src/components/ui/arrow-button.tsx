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
import {
	type AnchorHTMLAttributes,
	type ButtonHTMLAttributes,
	type ComponentProps,
	forwardRef,
	type HTMLAttributes,
} from 'react';

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
	extends HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof ArrowButtonVariants>,
		ArrowProps {}

export interface ArrowAnchorProps
	extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
		VariantProps<typeof ArrowButtonVariants>,
		ArrowProps {
	href: ComponentProps<typeof Link>['href'];
}

export interface ArrowButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement>,
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

const ArrowButton = forwardRef<HTMLButtonElement, ArrowButtonProps>(
	({ buttonType = 'button', className, direction, size, variant, ...props }, reference) => {
		return (
			<button
				className={ArrowButtonVariants({ className, variant })}
				ref={reference}
				type={buttonType}
				{...props}
			>
				<Arrow direction={direction} size={size} />
			</button>
		);
	},
);
ArrowButton.displayName = 'ArrowButton';

const ArrowElement = forwardRef<HTMLDivElement, ArrowElementProps>(
	({ className, direction, size, variant, ...props }, reference) => {
		return (
			<div className={ArrowButtonVariants({ className, variant })} ref={reference} {...props}>
				<Arrow direction={direction} size={size} />
			</div>
		);
	},
);
ArrowElement.displayName = 'ArrowElement';

const ArrowLink = forwardRef<HTMLAnchorElement, ArrowAnchorProps>(
	({ className, direction, href, size, variant, ...props }, reference) => {
		return (
			<Link
				className={ArrowButtonVariants({ className, variant })}
				href={href}
				ref={reference}
				{...props}
			>
				<Arrow direction={direction} size={size} />
			</Link>
		);
	},
);
ArrowLink.displayName = 'ArrowLink';

export { ArrowButton, ArrowElement, ArrowLink };
