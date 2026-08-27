import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '@tsgi-web/shared';

import { buttonVariants } from './variants';

// Anchor that looks like a `Button`.
//
// Base UI's `Button` enforces button semantics, so a link must not be rendered through its `render`
// prop — it would be announced as a button and lose its link behaviour. This component styles the
// anchor itself instead, which is what Base UI recommends, and stays a server component.
export function ButtonLink({
	children,
	className,
	fullWidth = false,
	render,
	size,
	variant,
	...props
}: Readonly<ButtonLinkProps>) {
	const variantClassName = buttonVariants({ className, size, variant });

	return useRender({
		defaultTagName: 'a',
		props: mergeProps(
			{
				children: <span>{children}</span>,
				className: cn(variantClassName, { 'btn--width-full': fullWidth }),
				'data-slot': 'button-link',
			},
			props,
		),
		render,
	});
}

export interface ButtonLinkProps
	extends useRender.ComponentProps<'a'>, VariantProps<typeof buttonVariants> {
	fullWidth?: boolean;
}
