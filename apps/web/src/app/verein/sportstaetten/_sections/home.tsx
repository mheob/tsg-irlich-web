import { Clock, Sparkles } from 'lucide-react';

import { SectionHeader } from '@/components/ui/section-header';
import { getMailHref } from '@/utils/mail';

import type { FallbackImage, HomeSection, Inquiry, Venue } from '../_shared/types';
import { HomeVenue } from './home-venue';

/**
 * „Unsere Heimat“: the two venues the club calls home, the first one with its picture on the left
 * and the turf box below it, the second one mirrored. A venue with opening hours shows them.
 *
 * @param props - The section, its inquiry and the fallback image.
 * @param props.fallbackImage - The image of the site settings.
 * @param props.inquiry - Where the link of the turf box sends its mail.
 * @param props.section - The texts and the home venues from the studio.
 * @returns The section, or nothing while no home venue resolves.
 */
function Home({ fallbackImage, inquiry, section }: Readonly<HomeProps>) {
	const venues = section.venues.filter((venue): venue is Venue => venue !== null);

	if (venues.length === 0) {
		return null;
	}

	const { turfBox } = section;
	const hasTurfBox = Boolean(turfBox?.title ?? turfBox?.text);

	return (
		<section className="container py-10 md:py-28">
			<SectionHeader
				subTitle={section.subtitle}
				title={section.title}
				isCentered
				isCenteredOnDesktop
			>
				{section.intro}
			</SectionHeader>

			<div className="mt-12 space-y-16 md:mt-24 md:space-y-28">
				{venues.map((venue, index) => (
					<HomeVenue
						fallbackImage={fallbackImage}
						isReversed={index % 2 === 1}
						key={venue._id}
						venue={venue}
					>
						{index === 0 && hasTurfBox && turfBox && (
							<aside className="mt-8 flex gap-4 rounded-2xl bg-primary p-6 text-primary-foreground">
								<Sparkles aria-hidden="true" className="size-8 shrink-0 text-secondary" />
								<div>
									{turfBox.title && (
										<p className="font-serif text-2xl text-primary-foreground uppercase">
											{turfBox.title}
										</p>
									)}
									{/* The global `p` colour does not inherit, so the text needs its own on the blue box. */}
									{turfBox.text && <p className="mt-2 text-primary-foreground">{turfBox.text}</p>}
									{turfBox.linkText && (
										<a
											className="mt-4 inline-block font-bold text-secondary underline-offset-4 hover:underline"
											href={getMailHref(inquiry)}
										>
											{turfBox.linkText}
										</a>
									)}
								</div>
							</aside>
						)}

						{venue.openingHours && venue.openingHours.length > 0 && (
							<div className="mt-8 rounded-2xl border p-6">
								<p className="flex items-center gap-2 font-bold">
									<Clock aria-hidden="true" className="size-5 text-primary-light" />
									Öffnungszeiten
								</p>
								<dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
									{venue.openingHours.map((row) => (
										<div className="contents" key={row._key}>
											<dt className="text-muted-foreground">{row.days}</dt>
											<dd>{row.time}</dd>
										</div>
									))}
								</dl>
							</div>
						)}
					</HomeVenue>
				))}
			</div>
		</section>
	);
}

interface HomeProps {
	fallbackImage?: FallbackImage;
	inquiry: Inquiry;
	/** A reference that no longer resolves comes back as `null`, which TypeGen does not express. */
	section: Omit<HomeSection, 'venues'> & { venues: readonly (null | Venue)[] };
}

export { Home };
