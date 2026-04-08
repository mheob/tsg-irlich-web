import Image from 'next/image';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

import { urlForImage } from '@/lib/sanity/utils';
import type { SponsorsQueryResult } from '@/types/sanity.types';

const IMAGE_SIZE = { height: 98, width: 325 };

interface SponsorsProps extends ComponentProps<'section'> {
	sponsors: SponsorsQueryResult;
}

export function Sponsors({ className, sponsors, ...props }: Readonly<SponsorsProps>) {
	return (
		<section className={cn('mt-10', className)} {...props}>
			<h3 className="text-2xl font-bold">Partner</h3>

			<div className="mt-4 flex flex-col gap-10 text-primary">
				{sponsors
					.filter((sponsor) => sponsor.logo?.asset?._ref)
					.map((sponsor) => {
						const imageSrc = urlForImage(sponsor.logo, IMAGE_SIZE.height, IMAGE_SIZE.width);
						if (!imageSrc) {
							return null;
						}
						return (
							<Image
								alt={sponsor.name}
								height={IMAGE_SIZE.height}
								key={sponsor._id}
								src={imageSrc}
								width={IMAGE_SIZE.width}
							/>
						);
					})}
			</div>
		</section>
	);
}
