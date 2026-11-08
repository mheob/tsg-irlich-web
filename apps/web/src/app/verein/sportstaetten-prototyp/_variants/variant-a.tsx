// PROTOTYPE (WEB-149) — Variante A „Vertraut“: every section reuses a pattern a visitor already
// knows. The home ground as split rows like the intro of the club page, the counters, the other
// venues as image cards in the style of the group overview, and the regular contact persons section.

import { Clock, Sparkles } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import { ButtonLink } from '@/components/ui/button';
import { PortableText } from '@/components/ui/portable-text';
import { SectionHeader } from '@/components/ui/section-header';
import { getPageHeroImage } from '@/utils/hero-image';

import {
	ARTIFICIAL_TURF,
	CLUBHOUSE,
	CONTACT,
	HERO,
	HOME,
	MAIL_SUBJECT,
	OTHERS,
	RENT_SUBJECT,
	STADIUM_FEATURES,
} from '../_shared/content';
import { getBoardMailHref } from '../_shared/data';
import type { Venue, VenuePageData } from '../_shared/data';
import {
	FeatureList,
	VenueAddress,
	VenueGroups,
	VenueImage,
	VenueRouteButton,
	VenueWeekdays,
} from '../_shared/venue-parts';
import { getTypeLabel } from '../_shared/venue-utils';

import groupStyles from '@/app/angebot/[group]/_sections/groups.module.css';

const CARD_GROUP_LIMIT = 4;

function HomeRow({
	children,
	features,
	isReversed = false,
	typeLabel,
	venue,
}: Readonly<HomeRowProps>) {
	return (
		<article className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-16">
			<VenueImage
				className={cn('aspect-4/3 rounded-2xl shadow-lg', isReversed && 'lg:order-last')}
				sizes="(min-width: 64rem) 50vw, 100vw"
				venue={venue}
			/>

			<div className="mt-8 lg:mt-0">
				<p className="font-sans-serif font-bold text-primary-light uppercase">
					{getTypeLabel(venue, typeLabel)}
				</p>
				<h3 className="mt-1 font-serif text-4xl uppercase md:text-5xl">{venue.title}</h3>

				{venue.description && (
					<div className="mt-4 md:text-lg">
						<PortableText value={venue.description.slice(0, 1)} />
					</div>
				)}

				<div className="mt-6 grid gap-6 sm:grid-cols-2">
					<FeatureList features={features} />
					<div className="space-y-4">
						<VenueAddress venue={venue} />
						<VenueRouteButton variant="secondary" venue={venue} />
					</div>
				</div>

				{venue.groups.length > 0 && (
					<div className="mt-8">
						<p className="mb-3 font-bold">Hier trainieren</p>
						<VenueGroups venue={venue} />
					</div>
				)}

				{children}
			</div>
		</article>
	);
}

function VenueCard({ venue }: Readonly<{ venue: Venue }>) {
	return (
		<article className="flex flex-col overflow-hidden rounded-xl bg-card shadow-lg">
			<div className="relative aspect-video">
				<VenueImage
					className="absolute inset-0"
					sizes="(min-width: 80rem) 33vw, (min-width: 48rem) 50vw, 100vw"
					venue={venue}
				/>
				<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
				<div className="absolute inset-x-0 bottom-0 p-5">
					<span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground uppercase">
						{getTypeLabel(venue)}
					</span>
					<h4 className="mt-3 line-clamp-2 font-serif text-3xl text-primary-foreground uppercase">
						{venue.title}
					</h4>
				</div>
			</div>

			<div className="flex flex-1 flex-col gap-5 p-5">
				<VenueAddress venue={venue} />
				<VenueWeekdays venue={venue} />
				<VenueGroups limit={CARD_GROUP_LIMIT} venue={venue} />
				<div className="mt-auto">
					<VenueRouteButton variant="secondary" venue={venue} />
				</div>
			</div>
		</article>
	);
}

function VenueGrid({ title, venues }: Readonly<VenueGridProps>) {
	if (venues.length === 0) {
		return null;
	}

	return (
		<div className="mt-12 md:mt-20">
			<h3 className="font-serif text-3xl uppercase md:text-4xl">
				{title} <span className="text-primary-light">({venues.length})</span>
			</h3>
			<div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
				{venues.map((venue) => (
					<VenueCard key={venue._id} venue={venue} />
				))}
			</div>
		</div>
	);
}

function VariantA({ boardMembers, clubhouse, fields, halls, stadium }: Readonly<VenuePageData>) {
	const mailHref = getBoardMailHref(boardMembers, MAIL_SUBJECT);
	const rentHref = getBoardMailHref(boardMembers, RENT_SUBJECT);
	const sportVenues = [stadium, ...halls, ...fields].filter(Boolean);
	const groupCount = new Set(sportVenues.flatMap((venue) => venue?.groups.map((g) => g._id))).size;

	return (
		<>
			<Hero
				image={getPageHeroImage(stadium?.mainImage, HERO.title)}
				subTitle={HERO.subtitle}
				title={HERO.title}
			/>

			{/* Unsere Heimat — split rows like the intro of the club page */}
			<section className="container py-10 md:py-28">
				<SectionHeader subTitle={HOME.subtitle} title={HOME.title} isCentered isCenteredOnDesktop>
					{HOME.intro}
				</SectionHeader>

				<div className="mt-12 space-y-16 md:mt-24 md:space-y-28">
					{stadium && (
						<HomeRow features={STADIUM_FEATURES} venue={stadium}>
							<aside className="mt-8 flex gap-4 rounded-2xl bg-primary p-6 text-primary-foreground">
								<Sparkles aria-hidden="true" className="size-8 shrink-0 text-secondary" />
								<div>
									<p className="font-serif text-2xl text-primary-foreground uppercase">
										{ARTIFICIAL_TURF.title}
									</p>
									<p className="mt-2 text-primary-foreground">{ARTIFICIAL_TURF.text}</p>
									<a
										className="mt-4 inline-block font-bold text-secondary underline-offset-4 hover:underline"
										href={mailHref}
									>
										Sprich uns an, wenn du helfen willst
									</a>
								</div>
							</aside>
						</HomeRow>
					)}

					{clubhouse && (
						<HomeRow
							features={CLUBHOUSE.features}
							typeLabel={CLUBHOUSE.typeLabel}
							venue={clubhouse}
							isReversed
						>
							<div className="mt-8 rounded-2xl border p-6">
								<p className="flex items-center gap-2 font-bold">
									<Clock aria-hidden="true" className="size-5 text-primary-light" />
									Öffnungszeiten
								</p>
								<dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
									{CLUBHOUSE.hours.map(({ days, time }) => (
										<div className="contents" key={days}>
											<dt className="text-muted-foreground">{days}</dt>
											<dd>{time}</dd>
										</div>
									))}
								</dl>
								<p className="mt-6">{CLUBHOUSE.rentText}</p>
								<ButtonLink className="mt-4" href={rentHref} size="sm">
									Pappelstübchen mieten
								</ButtonLink>
							</div>
						</HomeRow>
					)}
				</div>
			</section>

			{/* Die Zahlen — the counters of the home and club page */}
			<Stats
				stats={[
					{ _type: 'stats', title: 'Sportstätten', value: sportVenues.length },
					{ _type: 'stats', title: 'Hallen', value: halls.length },
					{ _type: 'stats', title: 'Plätze', value: fields.length + (stadium ? 1 : 0) },
					{ _type: 'stats', title: 'Gruppen trainieren hier', value: groupCount },
				]}
				withBackground
			/>

			{/* Alle weiteren Sportanlagen — image cards in the style of the group overview */}
			<section className={cn(groupStyles.bg, 'relative z-0')}>
				<div className="container py-10 md:py-28">
					<SectionHeader
						subTitle={OTHERS.subtitle}
						title={OTHERS.title}
						isCentered
						isCenteredOnDesktop
					>
						{OTHERS.intro}
					</SectionHeader>

					<VenueGrid title="Hallen" venues={halls} />
					<VenueGrid title="Plätze" venues={fields} />
				</div>
			</section>

			{/* Ansprechpartner — the regular contact persons section with the board */}
			<ContactPersons
				contactPersons={boardMembers}
				intro={CONTACT.intro}
				subtitle={CONTACT.subtitle}
				title={CONTACT.title}
			/>

			<Newsletter />
		</>
	);
}

interface HomeRowProps {
	children?: React.ReactNode;
	features: string[];
	isReversed?: boolean;
	typeLabel?: string;
	venue: Venue;
}

interface VenueGridProps {
	title: string;
	venues: Venue[];
}

export { VariantA };
