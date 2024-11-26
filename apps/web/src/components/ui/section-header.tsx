import type { HTMLAttributes } from 'react';

import { cn } from '@/utils';

import styles from './section-header.module.css';

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
	descriptionClassName?: string;
	isCentered?: boolean;
	level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
	subTitle?: string;
	title?: string;
}

export default function SectionHeader({
	children,
	descriptionClassName,
	isCentered,
	level = 'h2',
	subTitle,
	title = 'DER TITEL FEHLT',
}: Readonly<SectionHeaderProps>) {
	const HeadingTag = level;

	return (
		<header className={cn(isCentered ? 'text-center' : '')}>
			{subTitle && (
				<div className={cn(isCentered ? 'mx-auto' : '', styles.subTitle, 'subTitle')}>
					{subTitle}
				</div>
			)}

			<HeadingTag className={styles.title}>{title}</HeadingTag>

			{typeof children === 'string' && !children.startsWith('<') ? (
				<p
					className={`${isCentered ? 'mx-auto' : 'pr-16'} mt-6 max-w-3xl text-xl ${descriptionClassName}`}
				>
					{children}
				</p>
			) : (
				children
			)}
		</header>
	);
}
