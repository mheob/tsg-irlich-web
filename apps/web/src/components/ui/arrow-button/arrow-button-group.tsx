import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { LinkProps as NextLinkProps } from 'next/link';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

import { ArrowButton, ArrowElement, ArrowLink } from './arrow-button';

// The group always renders its own two arrows, so it never accepts children of its own.
interface BaseProps extends Omit<useRender.ComponentProps<'div'>, 'children'> {
	isDisabledNext?: boolean;
	isDisabledPrevious?: boolean;
	size?: ComponentProps<typeof ArrowButton>['size'];
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

export function ArrowButtonGroup({
	className,
	hrefNext,
	hrefPrev,
	isDisabledNext = false,
	isDisabledPrevious = false,
	render,
	scroll = false,
	size = 'size-8 md:size-12',
	type = 'button',
	...props
}: Readonly<ArrowButtonGroupProps>) {
	const arrows = (
		<>
			{type === 'button' && (
				<>
					<ArrowButton
						aria-label="Zurück"
						data-disabled={isDisabledPrevious}
						direction="left"
						disabled={isDisabledPrevious}
						size={size}
						variant="ghost"
					/>
					<ArrowButton
						aria-label="Weiter"
						data-disabled={isDisabledNext}
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
							data-disabled={isDisabledPrevious}
							direction="left"
							size={size}
							variant="ghost"
						/>
					) : (
						<ArrowLink
							aria-disabled={isDisabledPrevious}
							aria-label="Zurück"
							data-disabled={isDisabledPrevious}
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
							data-disabled={isDisabledNext}
							direction="right"
							size={size}
							variant="secondary"
						/>
					) : (
						<ArrowLink
							aria-disabled={isDisabledNext}
							aria-label="Weiter"
							data-disabled={isDisabledNext}
							direction="right"
							href={hrefNext}
							scroll={scroll}
							size={size}
							variant="secondary"
						/>
					)}
				</>
			)}
		</>
	);

	return useRender({
		defaultTagName: 'div',
		props: mergeProps(
			{ className: cn('flex items-center justify-center gap-4', className) },
			props,
			{ children: arrows },
		),
		render,
	});
}
