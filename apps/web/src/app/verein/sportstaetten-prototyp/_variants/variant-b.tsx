// PROTOTYPE (WEB-149) — Variante B „Steckbrief“: close to Philipp's draft. A yellow jump bar under
// the hero, the home ground as rows of image, text and a fact box, the other venues as a compact
// list with their training days, the way to the stadium on the blue band and the board on the
// yellow band.

import { ArrowDown, Clock, Sparkles } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { ButtonLink } from '@/components/ui/button';
import { ContactButton } from '@/components/ui/contact-button';
import { PortableText } from '@/components/ui/portable-text';
import { Portrait } from '@/components/ui/portrait';
import { SectionHeader } from '@/components/ui/section-header';
import { getPageHeroImage } from '@/utils/hero-image';

import {
	ARRIVAL,
	ARTIFICIAL_TURF,
	CLUBHOUSE,
	CONTACT,
	HERO,
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

import contactStyles from '@/components/section/contact-persons.module.css';

const LIST_GROUP_LIMIT = 6;

const JUMP_LINKS = [
	{ href: '#pappelstadion', label: 'Pappelstadion' },
	{ href: '#pappelstuebchen', label: 'Pappelstübchen' },
	{ href: '#hallen', label: 'Hallen' },
	{ href: '#plaetze', label: 'Plätze' },
	{ href: '#anfahrt', label: 'Anfahrt' },
];

function FactRow({
	box,
	boxTitle,
	children,
	eyebrow,
	features,
	id,
	typeLabel,
	venue,
}: Readonly<FactRowProps>) {
	return (
		<article
			className="scroll-mt-28 py-10 md:py-16 lg:grid lg:grid-cols-[5fr_6fr_3fr] lg:gap-10"
			id={id}
		>
			<VenueImage
				className="aspect-4/3 rounded-2xl shadow-lg lg:self-start"
				sizes="(min-width: 64rem) 36vw, 100vw"
				venue={venue}
			/>

			<div className="mt-8 lg:mt-0">
				<p className="font-serif text-xl text-secondary-dark uppercase">{eyebrow}</p>
				<h2 className="font-serif text-4xl uppercase md:text-5xl">{venue.title}</h2>
				<p className="mt-1 text-sm font-semibold text-muted-foreground">
					{getTypeLabel(venue, typeLabel)}
				</p>

				{venue.description && (
					<div className="mt-4">
						<PortableText value={venue.description.slice(0, 1)} />
					</div>
				)}

				<div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 border-t pt-6">
					<VenueAddress venue={venue} />
					<VenueRouteButton variant="ghost" venue={venue} />
				</div>

				{venue.groups.length > 0 && (
					<div className="mt-6">
						<p className="mb-3 text-sm font-bold uppercase">Hier trainieren</p>
						<VenueGroups venue={venue} />
					</div>
				)}

				{children}
			</div>

			<aside className="mt-8 self-start rounded-2xl bg-background-low-contrast p-6 lg:mt-0">
				<p className="font-sans-serif font-bold uppercase">{boxTitle}</p>
				<FeatureList className="mt-4 text-sm" features={features} />
				{box}
			</aside>
		</article>
	);
}

function VenueListItem({ venue }: Readonly<{ venue: Venue }>) {
	return (
		<li className="grid gap-5 rounded-xl bg-card p-4 shadow-lg sm:grid-cols-[12rem_1fr] md:p-5 lg:grid-cols-[14rem_1fr_auto] lg:items-center lg:gap-8">
			<VenueImage
				className="aspect-video rounded-lg sm:aspect-4/3"
				sizes="(min-width: 64rem) 14rem, (min-width: 40rem) 12rem, 100vw"
				venue={venue}
			/>

			<div className="min-w-0">
				<div className="flex flex-wrap items-baseline gap-x-3">
					<h4 className="font-serif text-2xl uppercase md:text-3xl">{venue.title}</h4>
					<span className="text-sm font-semibold text-primary-light">{getTypeLabel(venue)}</span>
				</div>
				<div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
					<VenueAddress className="text-sm" venue={venue} />
					<VenueWeekdays venue={venue} />
				</div>
				<VenueGroups className="mt-4" limit={LIST_GROUP_LIMIT} venue={venue} />
			</div>

			<div className="sm:col-span-2 lg:col-span-1">
				<VenueRouteButton variant="ghost" venue={venue} />
			</div>
		</li>
	);
}

function VenueList({ id, title, venues }: Readonly<VenueListProps>) {
	if (venues.length === 0) {
		return null;
	}

	return (
		<div className="mt-12 scroll-mt-28 md:mt-20" id={id}>
			<h3 className="font-serif text-3xl uppercase md:text-4xl">
				{title} <span className="text-primary-light">({venues.length})</span>
			</h3>
			<ul className="mt-6 flex flex-col gap-4">
				{venues.map((venue) => (
					<VenueListItem key={venue._id} venue={venue} />
				))}
			</ul>
		</div>
	);
}

function VariantB({ boardMembers, clubhouse, fields, halls, stadium }: Readonly<VenuePageData>) {
	const mailHref = getBoardMailHref(boardMembers, MAIL_SUBJECT);
	const rentHref = getBoardMailHref(boardMembers, RENT_SUBJECT);

	return (
		<>
			<Hero
				image={getPageHeroImage(stadium?.mainImage, HERO.title)}
				subTitle={HERO.subtitle}
				title={HERO.title}
			/>

			{/* Jump bar right below the hero */}
			<nav aria-label="Sportstätten auf dieser Seite" className="bg-secondary">
				<ul className="container flex flex-wrap justify-center gap-2 py-4 md:gap-4 md:py-5">
					{JUMP_LINKS.map(({ href, label }) => (
						<li key={href}>
							<a
								className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-sans-serif font-bold text-secondary-foreground uppercase transition-colors hover:bg-primary hover:text-primary-foreground md:text-lg"
								href={href}
							>
								<ArrowDown aria-hidden="true" className="size-4" />
								{label}
							</a>
						</li>
					))}
				</ul>
			</nav>

			{/* Unsere Heimat — image, text and a fact box per venue, like the draft */}
			<section className="container divide-y py-6 md:py-16">
				{stadium && (
					<FactRow
						boxTitle="Das bietet unser Stadion"
						eyebrow="Unsere Hauptanlage"
						features={STADIUM_FEATURES}
						id="pappelstadion"
						venue={stadium}
					>
						<aside className="mt-6 flex gap-4 rounded-2xl bg-primary p-5 text-primary-foreground">
							<Sparkles aria-hidden="true" className="size-7 shrink-0 text-secondary" />
							<div>
								<p className="font-serif text-xl text-primary-foreground uppercase md:text-2xl">
									{ARTIFICIAL_TURF.title}
								</p>
								<p className="mt-1 text-sm text-primary-foreground md:text-base">
									{ARTIFICIAL_TURF.text}
								</p>
								<a
									className="mt-3 inline-block text-sm font-bold text-secondary underline-offset-4 hover:underline md:text-base"
									href={mailHref}
								>
									Sprich uns an, wenn du helfen willst
								</a>
							</div>
						</aside>
					</FactRow>
				)}

				{clubhouse && (
					<FactRow
						boxTitle="Das bietet unser Vereinsheim"
						eyebrow="Unser Vereinsheim"
						features={CLUBHOUSE.features}
						id="pappelstuebchen"
						typeLabel={CLUBHOUSE.typeLabel}
						venue={clubhouse}
						box={
							<div className="mt-6 border-t pt-5">
								<p className="flex items-center gap-2 font-bold">
									<Clock aria-hidden="true" className="size-5 text-primary-light" />
									Öffnungszeiten
								</p>
								<dl className="mt-2 space-y-1 text-sm">
									{CLUBHOUSE.hours.map(({ days, time }) => (
										<div key={days}>
											<dt className="text-muted-foreground">{days}</dt>
											<dd className="font-semibold">{time}</dd>
										</div>
									))}
								</dl>
							</div>
						}
					>
						<div className="mt-6 flex flex-col items-start gap-4 rounded-2xl bg-secondary/40 p-5 sm:flex-row sm:items-center sm:justify-between">
							<p className="font-semibold text-secondary-foreground">{CLUBHOUSE.rentText}</p>
							<ButtonLink className="shrink-0" href={rentHref} size="sm">
								Anfragen
							</ButtonLink>
						</div>
					</FactRow>
				)}
			</section>

			{/* Alle weiteren Sportanlagen — a compact list with training days */}
			<section className="relative z-0 bg-background-low-contrast">
				<div className="container py-10 md:py-28">
					<SectionHeader
						subTitle={OTHERS.subtitle}
						title={OTHERS.title}
						isCentered
						isCenteredOnDesktop
					>
						{OTHERS.intro}
					</SectionHeader>

					<VenueList id="hallen" title="Hallen" venues={halls} />
					<VenueList id="plaetze" title="Plätze" venues={fields} />
				</div>
			</section>

			{/* Anfahrt — the way to the stadium on the blue band */}
			<section
				className={cn(contactStyles.bg, 'relative z-0 bg-primary text-primary-foreground')}
				id="anfahrt"
			>
				<div className="container py-10 md:py-28 lg:grid lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-20">
					<div>
						<SectionHeader
							descriptionClassName="text-primary-foreground"
							isCenteredOnDesktop={false}
							subTitle={ARRIVAL.subtitle}
							title={ARRIVAL.title}
							isCentered
						>
							{ARRIVAL.intro}
						</SectionHeader>
						{stadium && (
							<div className="mt-8 flex flex-col items-center gap-4 lg:items-start">
								<VenueAddress className="text-lg" venue={stadium} />
								<VenueRouteButton
									label="Route zum Pappelstadion"
									variant="secondary"
									venue={stadium}
								/>
							</div>
						)}
					</div>

					<ul className="mt-12 grid gap-4 sm:grid-cols-3 lg:mt-0">
						{ARRIVAL.options.map(({ icon: Icon, text, title }) => (
							<li className="rounded-xl bg-background p-6 text-foreground shadow-lg" key={title}>
								<Icon aria-hidden="true" className="size-10 text-primary" strokeWidth={1.5} />
								<h3 className="mt-4 font-serif text-2xl uppercase">{title}</h3>
								<p className="mt-2">{text}</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* Ansprechpartner — the board, compact on the yellow band */}
			<section className="bg-secondary text-secondary-foreground">
				<div className="container py-10 md:py-28 lg:grid lg:grid-cols-2 lg:items-center lg:gap-20">
					<div>
						<SectionHeader
							descriptionClassName="text-secondary-foreground"
							isCenteredOnDesktop={false}
							subTitle={CONTACT.subtitle}
							title={CONTACT.title}
							isCentered
						>
							{CONTACT.intro}
						</SectionHeader>
						<div className="mt-10 flex justify-center lg:justify-start">
							<ButtonLink href={mailHref}>E-Mail an den Vorstand</ButtonLink>
						</div>
					</div>

					<ul className="mt-12 flex flex-col gap-4 lg:mt-0">
						{boardMembers.map((person) => {
							const phone = person.phone ?? undefined;
							const showPhone =
								phone && (person.contactAs === 'phone' || person.contactAs === 'both');
							const showWhatsapp =
								phone && (person.contactAs === 'whatsapp' || person.contactAs === 'both');
							return (
								<li
									className="flex items-center gap-4 rounded-xl bg-background p-4 shadow-lg md:gap-6 md:p-5"
									key={person._id}
								>
									<Portrait
										className="size-16 border-4 border-primary text-2xl md:size-20 md:text-3xl"
										firstName={person.firstName}
										image={person.image}
										lastName={person.lastName}
										sourceSize={96}
									/>
									<div className="flex-1">
										<h3 className="font-serif text-2xl md:text-3xl">
											{person.firstName} {person.lastName}
										</h3>
										<p className="text-sm md:text-base">{person.role}</p>
									</div>
									<div className="flex gap-4">
										{person.email && <ContactButton email={person.email} />}
										{showPhone && <ContactButton phone={phone} />}
										{showWhatsapp && <ContactButton whatsapp={phone} />}
									</div>
								</li>
							);
						})}
					</ul>
				</div>
			</section>

			<Newsletter />
		</>
	);
}

interface FactRowProps {
	box?: React.ReactNode;
	boxTitle: string;
	children?: React.ReactNode;
	eyebrow: string;
	features: string[];
	id: string;
	typeLabel?: string;
	venue: Venue;
}

interface VenueListProps {
	id: string;
	title: string;
	venues: Venue[];
}

export { VariantB };
