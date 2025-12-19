import { cn } from '@tsgi-web/shared';
import Image from 'next/image';
import type { ComponentProps } from 'react';

import { urlForImage } from '@/lib/sanity/utils';
import type { SponsorsQueryResult } from '@/types/sanity.types';

interface SponsorsProps extends ComponentProps<'section'> {
	sponsors: SponsorsQueryResult;
}

export function Sponsors({ className, sponsors, ...props }: Readonly<SponsorsProps>) {
	return (
		<section className={cn('mt-10', className)} {...props}>
			<h3 className="text-2xl font-bold">Partner</h3>

			<div className="text-primary mt-4 flex flex-col gap-10">
				{sponsors
					.filter(sponsor => sponsor.logo?.asset?._ref)
					.map(sponsor => (
						<Image
							alt={sponsor.name}
							height={98}
							key={sponsor._id}
							// eslint-disable-next-line ts/no-non-null-assertion
							src={urlForImage(sponsor.logo, 98, 325)!}
							width={325}
						/>
					))}
			</div>
		</section>
	);
}
