import { ExternalLink as ExternalLinkIcon } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { ExternalLink } from '@/components/ui/external-link';

import { getHostname } from '../_shared/hostname';
import { SponsorLogo } from '../_shared/sponsor-logo';
import type { Sponsor } from '../_shared/types';

const TILE_CLASS_NAME =
	'group flex h-full flex-col overflow-hidden rounded-xl bg-card text-card-foreground shadow-lg';
const LOGO_CLASS_NAME =
	'opacity-70 grayscale transition group-hover:opacity-100 group-hover:grayscale-0';

// One partner of the club: the logo grey until hover, the name and, with a website, its host.
function SponsorTile({ sponsor }: Readonly<SponsorTileProps>) {
	const hostname = getHostname(sponsor.website);

	if (!sponsor.website) {
		return (
			<div className={TILE_CLASS_NAME}>
				<span className="grid h-24 place-items-center p-4 md:h-36 md:p-6">
					<SponsorLogo className={LOGO_CLASS_NAME} sponsor={sponsor} />
				</span>
				<span className="border-t px-4 py-3 md:px-6 md:py-4">
					<span className="block font-sans-serif font-bold md:text-lg">{sponsor.name}</span>
				</span>
			</div>
		);
	}

	return (
		<ExternalLink
			className={cn(
				TILE_CLASS_NAME,
				'transition-transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
			)}
			href={sponsor.website}
			rel="sponsored"
		>
			<span className="grid h-24 place-items-center p-4 md:h-36 md:p-6">
				<SponsorLogo
					className={cn(
						LOGO_CLASS_NAME,
						'group-focus-visible:opacity-100 group-focus-visible:grayscale-0',
					)}
					sponsor={sponsor}
				/>
			</span>
			<span className="flex items-center justify-between gap-2 border-t px-4 py-3 md:gap-4 md:px-6 md:py-4">
				<span className="min-w-0">
					<span className="block font-sans-serif font-bold md:text-lg">{sponsor.name}</span>
					{hostname ? (
						<span className="block truncate text-xs text-muted-foreground md:text-sm">
							{hostname}
						</span>
					) : null}
				</span>
				<ExternalLinkIcon
					aria-hidden="true"
					className="size-5 shrink-0 text-primary-light transition-colors group-hover:text-primary"
				/>
			</span>
			<span className="sr-only">(öffnet in neuem Fenster)</span>
		</ExternalLink>
	);
}

interface SponsorTileProps {
	sponsor: Sponsor;
}

export { SponsorTile };
