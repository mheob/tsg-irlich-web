// PROTOTYPE (WEB-326) — Variante A „Vertraut“: every section reuses a pattern a visitor already
// knows from the home, club and membership pages (feature cards, pricing-like cards on the blue
// band, logo grid, the regular contact persons section).

import { CircleCheck, Plus } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from '@/components/ui/external-link';
import { SectionHeader } from '@/components/ui/section-header';
import { getPageHeroImage } from '@/utils/hero-image';

import {
	CONTACT,
	HERO,
	MAIL_SUBJECT,
	PARTNERS,
	REASONS,
	WAYS,
	WAYS_SECTION,
	WHY,
} from '../_shared/content';
import { getMailHref } from '../_shared/data';
import type { SponsorPageData } from '../_shared/data';
import { SponsorLogo } from '../_shared/sponsor-logo';

import pricingStyles from '@/components/section/pricing.module.css';

export function VariantA({ contactPersons, heroImage, sponsors }: Readonly<SponsorPageData>) {
	const mailHref = getMailHref(contactPersons, MAIL_SUBJECT);

	return (
		<>
			<Hero
				image={getPageHeroImage(heroImage, HERO.title)}
				subTitle={HERO.subtitle}
				title={HERO.title}
			/>

			{/* Warum Sponsor werden? — the feature cards of the home page */}
			<section className="bg-background-low-contrast">
				<div className="container mx-auto py-10 md:py-28">
					<SectionHeader subTitle={WHY.subtitle} title={WHY.title} isCentered isCenteredOnDesktop>
						{WHY.intro}
					</SectionHeader>

					<div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
						{REASONS.map(({ icon: Icon, text, title }) => (
							<Card
								className="transition-colors hover:bg-primary hover:text-primary-foreground"
								key={title}
							>
								<Icon aria-hidden="true" size={60} strokeWidth={1} />
								<CardHeader>
									<CardTitle className="mt-4 text-xl uppercase md:text-2xl">{title}</CardTitle>
								</CardHeader>
								<CardContent className="mt-2 md:text-lg">{text}</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* So kannst du uns unterstützen — the pricing cards on the blue band */}
			<section className={cn(pricingStyles.bg, 'relative z-0 bg-primary text-white')}>
				<div className="container py-10 md:py-28">
					<SectionHeader
						descriptionClassName="text-primary-foreground"
						subTitle={WAYS_SECTION.subtitle}
						title={WAYS_SECTION.title}
						isCentered
						isCenteredOnDesktop
					>
						{WAYS_SECTION.intro}
					</SectionHeader>

					<div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-20 xl:grid-cols-4">
						{WAYS.map(({ benefits, icon: Icon, text, title }) => (
							<article
								className={cn(
									'flex flex-col justify-between rounded-xl bg-background p-8 text-black shadow-lg',
									'transition-all duration-300 hover:bg-background-high-contrast lg:hover:-translate-y-4',
								)}
								key={title}
							>
								<div>
									<header className="flex flex-col items-start gap-4">
										<div className="rounded-2xl bg-primary-light/15 p-4 text-primary">
											<Icon aria-hidden="true" size={40} strokeWidth={1} />
										</div>
										<h3 className="font-serif text-3xl uppercase md:text-4xl">{title}</h3>
									</header>
									<p className="mt-6 md:text-lg">{text}</p>
									<ul className="mt-6 space-y-2">
										{benefits.map((benefit) => (
											<li className="flex items-start gap-2" key={benefit}>
												<CircleCheck
													aria-hidden="true"
													className="mt-0.5 size-5 min-w-6 text-primary-light"
												/>
												{benefit}
											</li>
										))}
									</ul>
								</div>

								<footer className="mt-8">
									<ButtonLink fullWidth href={mailHref}>
										Anfragen
									</ButtonLink>
								</footer>
							</article>
						))}
					</div>

					<div className="mt-16 flex flex-col items-center gap-6 text-center">
						<p className="text-lg text-primary-foreground md:text-xl">
							Du hast eine eigene Idee? Wir schnüren gern ein individuelles Paket.
						</p>
						<ButtonLink href={mailHref} variant="secondary">
							Jetzt Kontakt aufnehmen
						</ButtonLink>
					</div>
				</div>
			</section>

			{/* Unsere Partner und Sponsoren — a calm logo wall, grey until hovered */}
			<section className="container mx-auto py-10 md:py-28" id="partner">
				<SectionHeader
					subTitle={PARTNERS.subtitle}
					title={PARTNERS.title}
					isCentered
					isCenteredOnDesktop
				>
					{PARTNERS.intro}
				</SectionHeader>

				<ul className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8 xl:grid-cols-5">
					{sponsors.map((sponsor) => (
						<li key={sponsor._id}>
							<ExternalLink
								className={cn(
									'group grid aspect-7/4 place-items-center rounded-xl bg-card p-5 shadow-lg md:p-7',
									'transition-shadow hover:shadow-xl',
								)}
								href={sponsor.website ?? undefined}
							>
								<SponsorLogo
									className="opacity-70 grayscale transition group-hover:opacity-100 group-hover:grayscale-0"
									sponsor={sponsor}
								/>
								<span className="sr-only">{sponsor.name} (öffnet in neuem Fenster)</span>
							</ExternalLink>
						</li>
					))}
					<li>
						<a
							className={cn(
								'flex aspect-7/4 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 p-6 text-center text-primary',
								'transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground',
							)}
							href={mailHref}
						>
							<Plus aria-hidden="true" className="size-8" />
							<span className="font-serif text-2xl uppercase">Dein Logo hier?</span>
						</a>
					</li>
				</ul>
			</section>

			{/* Ansprechpartner — the regular contact persons section */}
			<ContactPersons
				contactPersons={contactPersons}
				intro={CONTACT.intro}
				subtitle={CONTACT.subtitle}
				title={CONTACT.title}
			/>

			<Newsletter />
		</>
	);
}
