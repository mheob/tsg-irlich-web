import { stegaClean } from 'next-sanity';
import Image from 'next/image';
import type { ImageProps } from 'next/image';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@tsgi-web/shared';

import type { BreadcrumbNames } from '@/utils/breadcrumb';
import { getBaseUrl } from '@/utils/url';

import { SectionHeader } from '../ui/section-header';
import Breadcrumb from '../with-logic/breadcrumb';

interface HeroProps extends ComponentPropsWithoutRef<'section'> {
	/**
	 * The titles the breadcrumb names the page and the pages above it by. The page is named after the
	 * hero's `title` unless `page` is given, which a page whose hero title is a generic one (a group,
	 * an article) passes along with the parents a slug cannot spell (a department, a category).
	 */
	breadcrumb?: BreadcrumbNames;
	image?: { alt: ImageProps['alt']; objectPosition?: string; src: ImageProps['src'] };
	/**
	 * Whether the title is the page's `h1`, which it is by default. A page whose content carries the
	 * `h1` itself (a group, an article) turns it off, and the title keeps its look as plain text.
	 */
	isTitleHeading?: boolean;
	subTitle?: string;
	title: string;
}

export function Hero({
	breadcrumb,
	children,
	image,
	isTitleHeading = true,
	subTitle,
	title,
	...props
}: Readonly<HeroProps>) {
	const breadcrumbNames: BreadcrumbNames = { page: title, ...breadcrumb };

	return (
		<section
			className={cn(
				'relative h-90 md:h-150',
				'bg-linear-to-r from-primary/70 to-primary/30 text-white',
			)}
			{...props}
		>
			{/* The hero opens every page that has one and is its largest contentful paint, so the
			    browser fetches it at once and ahead of everything else instead of lazily. */}
			{image?.alt && image.src && (
				<Image
					alt={image.alt}
					className="absolute inset-0 -z-10 object-cover"
					fetchPriority="high"
					loading="eager"
					src={image.src}
					style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
					fill
				/>
			)}

			<div className="flex h-full flex-col items-center justify-center pt-40">
				<SectionHeader
					level={isTitleHeading ? 'h1' : 'div'}
					subTitle={subTitle}
					title={title}
					isCentered
					isCenteredOnDesktop
				>
					{children}
				</SectionHeader>

				{/* The structured data gets the titles cleaned of the stega encoding draft mode adds. The
				    visible trail keeps it, and with it the click-to-edit overlays. */}
				<Breadcrumb
					baseUrl={getBaseUrl()}
					names={breadcrumbNames}
					schemaNames={stegaClean(breadcrumbNames)}
				/>
			</div>
		</section>
	);
}
