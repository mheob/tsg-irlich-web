import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/utils/cn';

import styles from './section-header.module.css';

interface SectionHeaderProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
	descriptionClassName?: string;
	isCentered?: boolean;
	isCenteredOnDesktop?: boolean;
	level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
	subTitle?: string;
	title?: ReactNode | string;
}

export default function SectionHeader({
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
				isCenteredOnDesktop ? 'md:text-center' : 'md:text-start',
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
