import { Slot } from '@radix-ui/react-slot';
import { cn } from '@tsgi-web/shared';
import type { LucideProps } from 'lucide-react';
import type { LinkProps as NextLinkProps } from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

import { ArrowButton, ArrowElement, ArrowLink } from './arrow-button';

interface BaseProps extends ComponentPropsWithoutRef<'div'> {
	asChild?: boolean;
	isDisabledNext?: boolean;
	isDisabledPrevious?: boolean;
	size?: LucideProps['className'];
}

interface ButtonProps {
	hrefNext?: never;
	hrefPrev?: never;
	scroll?: never;
	type?: 'button';
}

interface LinkProps {
	hrefNext: NextLinkProps['href'];
	hrefPrev: NextLinkProps['href'];
	scroll?: NextLinkProps['scroll'];
	type?: 'link';
}

type ArrowButtonGroupProps = BaseProps & (ButtonProps | LinkProps);

export default function ArrowButtonGroup({
	asChild = false,
	className,
	hrefNext,
	hrefPrev,
	isDisabledNext = false,
	isDisabledPrevious = false,
	scroll = false,
	size = 'size-8 md:size-12',
	type = 'button',
	...props
}: Readonly<ArrowButtonGroupProps>) {
	const Comp = asChild ? Slot : 'div';

	return (
		<Comp className={cn('flex items-center justify-center gap-4', className)} {...props}>
			{type === 'button' && (
				<>
					<ArrowButton
						aria-label="Zurück"
						direction="left"
						disabled={isDisabledPrevious}
						size={size}
						variant="ghost"
					/>
					<ArrowButton
						aria-label="Weiter"
						direction="right"
						disabled={isDisabledNext}
						size={size}
						variant="secondary"
					/>
				</>
			)}
			{type === 'link' && hrefPrev && hrefNext && (
				<>
					{isDisabledPrevious ? (
						<ArrowElement
							aria-disabled={isDisabledPrevious}
							aria-label="Zurück"
							direction="left"
							size={size}
							variant="ghost"
						/>
					) : (
						<ArrowLink
							aria-disabled={isDisabledPrevious}
							aria-label="Zurück"
							direction="left"
							href={hrefPrev}
							scroll={scroll}
							size={size}
							variant="ghost"
						/>
					)}
					{isDisabledNext ? (
						<ArrowElement
							aria-disabled={isDisabledNext}
							aria-label="Weiter"
							direction="right"
							size={size}
							variant="secondary"
						/>
					) : (
						<ArrowLink
							aria-disabled={isDisabledNext}
							aria-label="Weiter"
							direction="right"
							href={hrefNext}
							scroll={scroll}
							size={size}
							variant="secondary"
						/>
					)}
				</>
			)}
		</Comp>
	);
}
