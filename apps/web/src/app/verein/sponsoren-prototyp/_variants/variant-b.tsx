// PROTOTYPE (WEB-326) — Variante B „Erzählend“: split layouts instead of card grids. A call to action
// right under the hero, the reasons as a numbered list next to the club's numbers, the ways to help
// as an accordion, the partners as a catalog with name and website, and a compact contact block on
// the yellow band.

import { ArrowRight, ExternalLink as ExternalLinkIcon } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { ButtonLink } from '@/components/ui/button';
import { ContactButton } from '@/components/ui/contact-button';
import { ExternalLink } from '@/components/ui/external-link';
import { Portrait } from '@/components/ui/portrait';
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
import { getHostname, getMailHref } from '../_shared/data';
import type { SponsorPageData } from '../_shared/data';
import { SponsorLogo } from '../_shared/sponsor-logo';

import downloadStyles from '@/app/mitgliedschaft/_sections/downloads.module.css';
import contactStyles from '@/components/section/contact-persons.module.css';

const MAX_STATS = 4;

export function VariantB({
	contactPersons,
	heroImage,
	sponsors,
	stats,
}: Readonly<SponsorPageData>) {
	const mailHref = getMailHref(contactPersons, MAIL_SUBJECT);

	return (
		<>
			<Hero
				image={getPageHeroImage(heroImage, HERO.title)}
				subTitle={HERO.subtitle}
				title={HERO.title}
			/>

			{/* Call to action right below the hero */}
			<div className="bg-secondary">
				<div className="container flex flex-col items-center justify-between gap-4 py-6 text-center md:flex-row md:text-left">
					<p className="max-w-none font-sans-serif text-lg font-bold text-secondary-foreground uppercase md:text-2xl">
						Werde Teil der TSG-Familie – als Partner deines Vereins.
					</p>
					<ButtonLink href="#unterstuetzen">Jetzt Partner werden</ButtonLink>
				</div>
			</div>

			{/* Warum Sponsor werden? — numbers on the left, reasons as a numbered list on the right */}
			<section className="container py-10 md:py-28 lg:grid lg:grid-cols-[5fr_7fr] lg:gap-20">
				<div className="self-start lg:sticky lg:top-36">
					<SectionHeader
						isCenteredOnDesktop={false}
						subTitle={WHY.subtitle}
						title={WHY.title}
						isCentered
					>
						{WHY.intro}
					</SectionHeader>

					{stats.length > 0 && (
						<dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t pt-8">
							{stats.slice(0, MAX_STATS).map((stat) => (
								<div className="flex flex-col-reverse" key={stat._key}>
									<dt className="text-sm text-muted-foreground md:text-base">{stat.title}</dt>
									<dd className="font-serif text-5xl text-primary md:text-6xl">
										{stat.prefix}
										{stat.value.toLocaleString('de-DE')}
										{stat.suffix}
									</dd>
								</div>
							))}
						</dl>
					)}
				</div>

				<ol className="mt-12 lg:mt-0">
					{REASONS.map(({ icon: Icon, text, title }, index) => (
						<li className="flex gap-6 border-b py-8 first:pt-0 md:gap-10 md:py-12" key={title}>
							<span
								aria-hidden="true"
								className="font-serif text-6xl leading-none text-secondary-dark md:text-8xl"
							>
								{String(index + 1).padStart(2, '0')}
							</span>
							<div>
								<h3 className="flex items-center gap-3 text-2xl uppercase md:text-4xl">
									<Icon
										aria-hidden="true"
										className="size-7 text-primary-light md:size-9"
										strokeWidth={1.5}
									/>
									{title}
								</h3>
								<p className="mt-3 md:text-xl">{text}</p>
							</div>
						</li>
					))}
				</ol>
			</section>

			{/* So kannst du uns unterstützen — an accordion next to the pitch */}
			<section className="relative z-0 bg-background-low-contrast" id="unterstuetzen">
				<div className={downloadStyles.bg} />
				<div className={downloadStyles.bgBalls} />

				<div className="container py-10 md:py-28 lg:grid lg:grid-cols-2 lg:gap-20">
					<div className="self-start lg:sticky lg:top-36">
						<SectionHeader
							isCenteredOnDesktop={false}
							subTitle={WAYS_SECTION.subtitle}
							title={WAYS_SECTION.title}
							isCentered
						>
							{WAYS_SECTION.intro}
						</SectionHeader>
						<div className="mt-10 flex justify-center lg:justify-start">
							<ButtonLink href={mailHref} variant="secondary">
								Individuelles Paket anfragen
							</ButtonLink>
						</div>
					</div>

					<Accordion className="mt-12 lg:mt-0" defaultValue={[WAYS[0]?.title]} multiple={false}>
						{WAYS.map(({ benefits, icon: Icon, text, title }) => (
							<AccordionItem key={title} value={title}>
								<AccordionTrigger className="text-xl md:text-2xl">
									<span className="flex items-center gap-4">
										<span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-light/15 text-primary">
											<Icon aria-hidden="true" className="size-7" strokeWidth={1.5} />
										</span>
										<span className="font-serif text-2xl uppercase md:text-3xl">{title}</span>
									</span>
								</AccordionTrigger>
								<AccordionContent>
									<p className="md:text-lg">{text}</p>
									<ul className="mt-4 flex flex-wrap gap-2">
										{benefits.map((benefit) => (
											<li
												className="rounded-full bg-primary-light/10 px-3 py-1 text-sm font-semibold text-primary"
												key={benefit}
											>
												{benefit}
											</li>
										))}
									</ul>
									<a
										className="mt-6 inline-flex items-center gap-2 font-bold text-primary hover:text-primary-light"
										href={mailHref}
									>
										{title} anfragen <ArrowRight aria-hidden="true" className="size-4" />
									</a>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</section>

			{/* Unsere Partner und Sponsoren — a catalog with name and website on the blue band */}
			<section
				className={cn(contactStyles.bg, 'relative z-0 bg-primary text-primary-foreground')}
				id="partner"
			>
				<div className="container py-10 md:py-28">
					<SectionHeader
						descriptionClassName="text-primary-foreground"
						subTitle={PARTNERS.subtitle}
						title={PARTNERS.title}
						isCentered
						isCenteredOnDesktop
					>
						{PARTNERS.intro}
					</SectionHeader>

					<ul className="mt-10 grid grid-cols-2 gap-4 md:mt-16 md:gap-6 lg:grid-cols-4">
						{sponsors.map((sponsor) => {
							const hostname = getHostname(sponsor.website);
							return (
								<li key={sponsor._id}>
									<ExternalLink
										className="group flex h-full flex-col overflow-hidden rounded-xl bg-background text-foreground shadow-lg transition-transform hover:-translate-y-1"
										href={sponsor.website ?? undefined}
									>
										<span className="grid h-24 place-items-center p-4 md:h-36 md:p-6">
											<SponsorLogo sponsor={sponsor} />
										</span>
										<span className="flex items-center justify-between gap-2 border-t px-4 py-3 md:gap-4 md:px-6 md:py-4">
											<span className="min-w-0">
												<span className="block font-sans-serif font-bold md:text-lg">
													{sponsor.name}
												</span>
												{hostname && (
													<span className="block truncate text-xs text-muted-foreground md:text-sm">
														{hostname}
													</span>
												)}
											</span>
											<ExternalLinkIcon
												aria-hidden="true"
												className="size-5 shrink-0 text-primary-light transition-colors group-hover:text-primary"
											/>
										</span>
										<span className="sr-only">(öffnet in neuem Fenster)</span>
									</ExternalLink>
								</li>
							);
						})}
					</ul>
				</div>
			</section>

			{/* Ansprechpartner — compact list next to the pitch on the yellow band */}
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
							<ButtonLink href={mailHref}>E-Mail an das PR-Team</ButtonLink>
						</div>
					</div>

					<ul className="mt-12 flex flex-col gap-4 lg:mt-0">
						{contactPersons.map((person) => {
							const phone = person.phone ?? undefined;
							const showPhone =
								phone && (person.contactAs === 'phone' || person.contactAs === 'both');
							const showWhatsapp =
								phone && (person.contactAs === 'whatsapp' || person.contactAs === 'both');
							return (
								<li
									className="flex items-center gap-4 rounded-xl bg-background p-4 shadow-lg md:gap-6 md:p-6"
									key={person._id}
								>
									<Portrait
										className="size-16 border-4 border-primary text-2xl md:size-24 md:text-3xl"
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
