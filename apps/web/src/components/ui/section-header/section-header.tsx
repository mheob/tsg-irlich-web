import { cn } from '@tsgi-web/shared';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import styles from './section-header.module.css';

interface SectionHeaderProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
	descriptionClassName?: string;
	isCentered?: boolean;
	isCenteredOnDesktop?: boolean;
	level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
	subTitle?: string;
	title?: ReactNode | string;
}

export function SectionHeader({
	children,
	className,
	descriptionClassName,
	isCentered,
	isCenteredOnDesktop,
	level = 'h2',
	subTitle,
	title = 'DER TITEL FEHLT',
}: Readonly<SectionHeaderProps>) {
	const HeadingTag = level;

	return (
		<header
			className={cn(
				isCentered ? 'text-center' : '',
				isCenteredOnDesktop
					? 'md:text-center [&_p]:md:mx-auto'
					: 'md:text-start [&_p]:md:text-start',
				'[&_p]:max-w-7xl [&_p]:md:mt-6 md:[&_p]:text-xl',
				className,
			)}
		>
			{subTitle && (
				<div
					className={cn(
						isCentered ? 'mx-auto' : '',
						isCenteredOnDesktop ? 'md:mx-auto' : 'md:mx-0',
						styles.subTitle,
						'subTitle',
					)}
				>
					{subTitle}
				</div>
			)}

			<HeadingTag className={styles.title}>{title}</HeadingTag>

			{typeof children === 'string' && !children.startsWith('<') ? (
				<p
					className={cn(
						isCentered ? 'mx-auto' : 'md:pr-16',
						isCenteredOnDesktop ? 'md:mx-auto' : 'md:mx-0',
						'mt-6 max-w-3xl md:text-xl',
						descriptionClassName,
					)}
				>
					{children}
				</p>
			) : (
				children
			)}
		</header>
	);
}
