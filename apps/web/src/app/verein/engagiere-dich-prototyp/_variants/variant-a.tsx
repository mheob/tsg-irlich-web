// PROTOTYPE (WEB-190) — Variante A „Nah am Entwurf“: Philipps KI-Entwurf in unserem Design. Die
// Gründe als Raster neben dem Pitch, die Bereiche als Kacheln neben einem großen Bild, die offenen
// Aufgaben als Karten mit Bild, ein gelbes Band für eigene Ideen und der Vorstand in der bekannten
// Ansprechpartner-Sektion.

import { ArrowRight, Clock, Lightbulb } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@tsgi-web/shared';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { getPageHeroImage } from '@/utils/hero-image';

import {
	AREAS,
	CONTACT,
	HERO,
	IDEA,
	MAIL_SUBJECT,
	OPENINGS,
	OPENINGS_SECTION,
	REASONS,
	WAYS_SECTION,
	WHY,
} from '../_shared/content';
import { getMailHref } from '../_shared/data';
import type { VolunteerPageData } from '../_shared/data';

const AREA_IMAGE_KEY = '1-mannschaft';

export function VariantA({ board, heroImage, images }: Readonly<VolunteerPageData>) {
	const mailHref = getMailHref(board, MAIL_SUBJECT);
	const areaImage = images[AREA_IMAGE_KEY];

	return (
		<>
			<Hero
				image={getPageHeroImage(heroImage, HERO.title)}
				subTitle={HERO.subtitle}
				title={HERO.title}
			/>

			{/* Warum engagieren? — the pitch next to a grid of reasons */}
			<section className="bg-background-low-contrast">
				<div className="container py-10 md:py-28 lg:grid lg:grid-cols-[4fr_8fr] lg:items-center lg:gap-16">
					<div>
						<SectionHeader
							isCenteredOnDesktop={false}
							subTitle={WHY.subtitle}
							title={WHY.title}
							isCentered
						>
							{WHY.intro}
						</SectionHeader>
						<div className="mt-10 flex justify-center lg:justify-start">
							<ButtonLink href="#aktuell-gesucht" variant="secondary">
								Offene Aufgaben ansehen
							</ButtonLink>
						</div>
					</div>

					<ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-border shadow-lg sm:grid-cols-2 lg:mt-0 xl:grid-cols-3">
						{REASONS.map(({ icon: Icon, text, title }) => (
							<li
								className="group bg-background p-6 transition-colors hover:bg-primary hover:text-primary-foreground"
								key={title}
							>
								<Icon
									aria-hidden="true"
									className="size-12 text-primary transition-colors group-hover:text-secondary"
									strokeWidth={1}
								/>
								<h3 className="mt-4 font-serif text-2xl uppercase">{title}</h3>
								<p className="mt-2 text-sm md:text-base">{text}</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* So kannst du dich einbringen — a large picture next to four area tiles */}
			<section
				className="container py-10 md:py-28 lg:grid lg:grid-cols-[5fr_7fr] lg:items-stretch lg:gap-16"
				id="einbringen"
			>
				<div className="relative hidden overflow-hidden rounded-xl shadow-lg lg:block">
					{areaImage && (
						<Image
							alt={areaImage.alt}
							className="object-cover"
							sizes="40vw"
							src={areaImage.src}
							fill
						/>
					)}
				</div>

				<div>
					<SectionHeader
						isCenteredOnDesktop={false}
						subTitle={WAYS_SECTION.subtitle}
						title={WAYS_SECTION.title}
						isCentered
					>
						{WAYS_SECTION.intro}
					</SectionHeader>

					<ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
						{AREAS.map(({ icon: Icon, text, title }) => (
							<li key={title}>
								<a
									className={cn(
										'group flex h-full flex-col gap-3 rounded-xl bg-background p-6 shadow-lg',
										'transition-colors hover:bg-primary hover:text-primary-foreground',
									)}
									href="#aktuell-gesucht"
								>
									<span className="flex items-center justify-between">
										<span className="grid size-12 place-items-center rounded-2xl bg-primary-light/15 text-primary transition-colors group-hover:bg-white/15 group-hover:text-secondary">
											<Icon aria-hidden="true" className="size-7" strokeWidth={1.5} />
										</span>
										<ArrowRight
											aria-hidden="true"
											className="size-6 text-primary-light transition-transform group-hover:translate-x-1 group-hover:text-secondary"
										/>
									</span>
									<span className="font-serif text-2xl uppercase md:text-3xl">{title}</span>
									<span className="text-sm md:text-base">{text}</span>
								</a>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* Aktuell gesucht — open positions as picture cards */}
			<section className="bg-background-low-contrast" id="aktuell-gesucht">
				<div className="container py-10 md:py-28">
					<div className="flex flex-col items-center gap-8 lg:flex-row lg:items-end lg:justify-between">
						<SectionHeader
							isCenteredOnDesktop={false}
							subTitle={OPENINGS_SECTION.subtitle}
							title={OPENINGS_SECTION.title}
							isCentered
						>
							{OPENINGS_SECTION.intro}
						</SectionHeader>
						<ButtonLink className="shrink-0" href={mailHref} variant="secondary">
							Initiativ melden
						</ButtonLink>
					</div>

					<ul className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
						{OPENINGS.map(({ area, effort, imageKey, teaser, title }) => {
							const image = images[imageKey];
							return (
								<li key={title}>
									<article className="flex h-full flex-col overflow-hidden rounded-xl bg-background shadow-lg transition-transform hover:-translate-y-1">
										<div className="relative aspect-video bg-primary-light/15">
											{image && (
												<Image
													alt={image.alt}
													className="object-cover"
													sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
													src={image.src}
													fill
												/>
											)}
											<Badge className="absolute top-4 left-4 rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
												{area}
											</Badge>
										</div>
										<div className="flex flex-1 flex-col gap-3 p-6">
											<h3 className="font-serif text-2xl uppercase md:text-3xl">{title}</h3>
											<p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
												<Clock aria-hidden="true" className="size-4" />
												{effort}
											</p>
											<p className="flex-1 text-sm md:text-base">{teaser}</p>
											<a
												className="inline-flex items-center gap-2 font-bold text-primary hover:text-primary-light"
												href={getMailHref(board, `${MAIL_SUBJECT}: ${title}`)}
											>
												Interesse melden <ArrowRight aria-hidden="true" className="size-4" />
											</a>
										</div>
									</article>
								</li>
							);
						})}
					</ul>
				</div>
			</section>

			{/* Eigene Idee — the yellow band from the draft */}
			<section className="bg-secondary text-secondary-foreground">
				<div className="container flex flex-col items-center gap-6 py-10 text-center md:py-16 lg:flex-row lg:gap-12 lg:text-left">
					<Lightbulb aria-hidden="true" className="size-16 shrink-0" strokeWidth={1} />
					<div className="flex-1">
						<h2 className="font-serif text-3xl uppercase md:text-5xl">{IDEA.title}</h2>
						<p className="mt-3 max-w-4xl md:text-lg">{IDEA.text}</p>
					</div>
					<ButtonLink className="shrink-0" href={mailHref}>
						Kontakt aufnehmen
					</ButtonLink>
				</div>
			</section>

			{/* Ansprechpartner — the board in the regular contact persons section */}
			<ContactPersons
				contactPersons={board}
				intro={CONTACT.intro}
				subtitle={CONTACT.subtitle}
				title={CONTACT.title}
			/>

			<Newsletter />
		</>
	);
}
