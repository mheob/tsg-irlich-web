// PROTOTYPE (WEB-326) — the logo of a sponsor, uncropped and contained in the box the caller sizes.

import Image from 'next/image';

import { cn } from '@tsgi-web/shared';

import { urlForImageMax } from '@/lib/sanity/utils';

import type { Sponsor } from './data';

const LOGO_SOURCE_WIDTH = 640;

interface SponsorLogoProps {
	className?: string;
	sponsor: Sponsor;
}

export function SponsorLogo({ className, sponsor }: Readonly<SponsorLogoProps>) {
	const src = urlForImageMax(sponsor.logo, LOGO_SOURCE_WIDTH);

	if (!src) {
		return (
			<span className={cn('font-serif text-3xl text-primary uppercase', className)}>
				{sponsor.name}
			</span>
		);
	}

	return (
		<span className={cn('relative block size-full', className)}>
			<Image alt="" className="object-contain" sizes="320px" src={src} fill />
		</span>
	);
}
