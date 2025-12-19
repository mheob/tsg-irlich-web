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
		<section className={cn('border-b-4 py-10 md:border-0 md:py-40', className)} {...props}>
			<div
				className={cn(
					'text-primary mx-4 grid grid-cols-1 place-items-center gap-6',
					'md:grid-cols-2 md:gap-10',
					'xl:grid-cols-4',
				)}
			>
				{sponsors
					.filter(sponsor => sponsor.logo?.asset?._ref)
					.map(sponsor => (
						<Image
							alt={sponsor.name}
							className="rounded-xl"
							height={120}
							key={sponsor._id}
							// eslint-disable-next-line ts/no-non-null-assertion
							src={urlForImage(sponsor.logo, 120, 420)!}
							width={420}
						/>
					))}
			</div>
		</section>
	);
}
