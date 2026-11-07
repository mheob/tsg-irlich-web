import Image from 'next/image';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

import { SponsorLink } from '@/components/ui/sponsor-link';
import { urlForImage } from '@/lib/sanity/utils';
import type { SponsorsQueryResult } from '@/types/sanity.types';

const LOGO_SIZE = { height: 120, width: 420 } as const;

interface SponsorsProps extends ComponentProps<'section'> {
	sponsors: SponsorsQueryResult;
}

export function Sponsors({ className, sponsors, ...props }: Readonly<SponsorsProps>) {
	return (
		<section className={cn('border-b-4 py-10 md:border-0 md:py-40', className)} {...props}>
			<div
				className={cn(
					'mx-4 grid grid-cols-1 place-items-center gap-6 text-primary',
					'md:grid-cols-2 md:gap-10',
					'xl:grid-cols-4',
				)}
			>
				{sponsors
					.filter((sponsor) => sponsor.logo?.asset?._ref)
					.map((sponsor) => {
						const sponsorLogoSrc = urlForImage(sponsor.logo, LOGO_SIZE.height, LOGO_SIZE.width);
						if (!sponsorLogoSrc) {
							return null;
						}
						return (
							<SponsorLink key={sponsor._id} website={sponsor.website}>
								<Image
									alt={sponsor.name}
									className="block rounded-xl"
									height={120}
									src={sponsorLogoSrc}
									width={420}
								/>
							</SponsorLink>
						);
					})}
			</div>
		</section>
	);
}
