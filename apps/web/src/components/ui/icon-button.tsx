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
import * as React from 'react';

const IconButtonVariants = cva('i-btn', {
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

interface IconProps {
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

export interface IconElementProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof IconButtonVariants>,
		IconProps {}

export interface IconAnchorProps
	extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
		VariantProps<typeof IconButtonVariants>,
		IconProps {
	href: React.ComponentProps<typeof Link>['href'];
}

export interface IconButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof IconButtonVariants>,
		IconProps {
	buttonType?: 'button' | 'reset' | 'submit';
}

function Icon({
	direction = 'right',
	size = '48',
}: {
	direction: IconProps['direction'];
	size: IconProps['size'];
}) {
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

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
	({ buttonType = 'button', className, direction, size, variant, ...props }, reference) => {
		return (
			<button
				className={IconButtonVariants({ className, variant })}
				ref={reference}
				type={buttonType}
				{...props}
			>
				<Icon direction={direction} size={size} />
			</button>
		);
	},
);
IconButton.displayName = 'IconButton';

const IconElement = React.forwardRef<HTMLDivElement, IconElementProps>(
	({ className, direction, size, variant, ...props }, reference) => {
		return (
			<div className={IconButtonVariants({ className, variant })} ref={reference} {...props}>
				<Icon direction={direction} size={size} />
			</div>
		);
	},
);
IconElement.displayName = 'IconElement';

const IconLink = React.forwardRef<HTMLAnchorElement, IconAnchorProps>(
	({ className, direction, href, size, variant, ...props }, reference) => {
		return (
			<Link
				className={IconButtonVariants({ className, variant })}
				href={href}
				ref={reference}
				{...props}
			>
				<Icon direction={direction} size={size} />
			</Link>
		);
	},
);
IconLink.displayName = 'IconLink';

export { IconButton, IconElement, IconLink };
