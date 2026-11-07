// PROTOTYPE (WEB-190) — Variante B „Persönlich“: inspired by the examples Philipp liked (ATSV for
// the personal touch, TuS Griesheim for postings that open). A statement band under the hero, the
// reasons as an icon row followed by voices from the club, the areas as alternating picture rows,
// the open positions as a job board whose entries open with tasks, profile and offer, and the board
// as compact portrait cards on the yellow band.

import { CircleCheck, Clock, Plus, Quote } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@tsgi-web/shared';

import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { ContactButton } from '@/components/ui/contact-button';
import { Portrait } from '@/components/ui/portrait';
import { SectionHeader } from '@/components/ui/section-header';
import { getPageHeroImage } from '@/utils/hero-image';

import {
	AREAS,
	CONTACT,
	HERO,
	MAIL_SUBJECT,
	OPENINGS,
	OPENINGS_SECTION,
	REASONS,
	STATEMENT,
	STEPS,
	VOICES,
	VOICES_SECTION,
	WAYS_SECTION,
	WHY,
} from '../_shared/content';
import { getMailHref } from '../_shared/data';
import type { VolunteerPageData } from '../_shared/data';

import downloadStyles from '@/app/mitgliedschaft/_sections/downloads.module.css';
import contactStyles from '@/components/section/contact-persons.module.css';

const PORTRAIT_SIZE = 128;

// Badge ignores its `size` variant (it never passes it to `badgeVariants`), so the small look is
// spelled out here.
const BADGE_CLASS_NAME = 'rounded-full px-3 py-1 text-sm';

function toNumber(index: number): string {
	return String(index + 1).padStart(2, '0');
}

function DetailList({ heading, items }: Readonly<{ heading: string; items: readonly string[] }>) {
	return (
		<div>
			<h4 className="font-sans-serif font-bold uppercase">{heading}</h4>
			<ul className="mt-2 space-y-2">
				{items.map((item) => (
					<li className="flex items-start gap-2 text-sm md:text-base" key={item}>
						<CircleCheck aria-hidden="true" className="mt-0.5 size-5 min-w-5 text-primary-light" />
						{item}
					</li>
				))}
			</ul>
		</div>
	);
}

export function VariantB({ board, heroImage, images }: Readonly<VolunteerPageData>) {
	const mailHref = getMailHref(board, MAIL_SUBJECT);

	return (
		<>
			<Hero
				image={getPageHeroImage(heroImage, HERO.title)}
				subTitle={HERO.subtitle}
				title={HERO.title}
			/>

			{/* Statement band right below the hero */}
			<div className="bg-secondary">
				<div className="container flex flex-col items-center justify-between gap-6 py-8 text-center md:flex-row md:text-left">
					<p className="max-w-none font-serif text-3xl text-secondary-foreground uppercase md:text-5xl">
						{STATEMENT}
					</p>
					<div className="flex shrink-0 flex-wrap justify-center gap-4">
						<ButtonLink href="#aktuell-gesucht">Offene Aufgaben</ButtonLink>
						<ButtonLink href={mailHref} variant="ghost">
							Einfach melden
						</ButtonLink>
					</div>
				</div>
			</div>

			{/* Warum engagieren? — the reasons as a row of round icons */}
			<section className="container py-10 md:py-28">
				<SectionHeader subTitle={WHY.subtitle} title={WHY.title} isCentered isCenteredOnDesktop>
					{WHY.intro}
				</SectionHeader>

				<ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:mt-20 md:grid-cols-3 xl:grid-cols-6">
					{REASONS.map(({ icon: Icon, text, title }) => (
						<li className="flex flex-col items-center text-center" key={title}>
							<span className="grid size-20 place-items-center rounded-full bg-primary text-secondary shadow-lg md:size-24">
								<Icon aria-hidden="true" className="size-10 md:size-12" strokeWidth={1.25} />
							</span>
							<h3 className="mt-5 font-serif text-xl uppercase md:text-2xl">{title}</h3>
							<p className="mt-2 text-sm md:text-base">{text}</p>
						</li>
					))}
				</ul>
			</section>

			{/* Stimmen aus dem Verein — the personal part on the blue band */}
			<section className={cn(contactStyles.bg, 'relative z-0 bg-primary text-primary-foreground')}>
				<div className="container py-10 md:py-28">
					<SectionHeader
						descriptionClassName="text-primary-foreground"
						subTitle={VOICES_SECTION.subtitle}
						title={VOICES_SECTION.title}
						isCentered
						isCenteredOnDesktop
					>
						{VOICES_SECTION.intro}
					</SectionHeader>

					<ul className="mt-12 grid grid-cols-1 gap-6 md:mt-20 md:grid-cols-3 md:gap-8">
						{VOICES.map(({ quote, role }, index) => (
							<li
								className={cn(
									'relative flex flex-col justify-between gap-6 rounded-xl bg-background p-8 text-foreground shadow-lg',
									index === 1 && 'md:-translate-y-6',
								)}
								key={role}
							>
								<Quote aria-hidden="true" className="size-10 text-secondary-dark" strokeWidth={1} />
								<blockquote className="flex-1 text-lg md:text-xl">„{quote}“</blockquote>
								<footer className="flex items-center gap-4 border-t pt-4">
									<span className="grid size-12 place-items-center rounded-full border-2 border-primary font-serif text-xl text-primary">
										?
									</span>
									<span>
										<span className="block font-serif text-xl">Name folgt</span>
										<span className="block text-sm text-muted-foreground">{role}</span>
									</span>
								</footer>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* So kannst du dich einbringen — alternating picture rows */}
			<section className="container py-10 md:py-28" id="einbringen">
				<SectionHeader
					subTitle={WAYS_SECTION.subtitle}
					title={WAYS_SECTION.title}
					isCentered
					isCenteredOnDesktop
				>
					{WAYS_SECTION.intro}
				</SectionHeader>

				<div className="mt-12 flex flex-col gap-12 md:mt-20 md:gap-20">
					{AREAS.map(({ icon: Icon, imageKey, tasks, text, title }, index) => {
						const image = images[imageKey];
						return (
							<article
								className="grid items-center gap-6 md:grid-cols-2 md:gap-12 lg:gap-20"
								key={title}
							>
								<div
									className={cn(
										'relative aspect-4/3 overflow-hidden rounded-xl bg-primary-light/15 shadow-lg',
										index % 2 === 1 && 'md:order-last',
									)}
								>
									{image && (
										<Image
											alt={image.alt}
											className="object-cover"
											sizes="(max-width: 768px) 100vw, 50vw"
											src={image.src}
											fill
										/>
									)}
									<span className="absolute top-4 left-4 grid size-14 place-items-center rounded-2xl bg-primary text-secondary shadow-lg">
										<Icon aria-hidden="true" className="size-8" strokeWidth={1.5} />
									</span>
								</div>
								<div>
									<span
										aria-hidden="true"
										className="font-serif text-6xl leading-none text-secondary-dark md:text-8xl"
									>
										{toNumber(index)}
									</span>
									<h3 className="mt-2 font-serif text-3xl uppercase md:text-5xl">{title}</h3>
									<p className="mt-4 md:text-xl">{text}</p>
									<ul className="mt-6 flex flex-wrap gap-2">
										{tasks.map((task) => (
											<li
												className="rounded-full bg-primary-light/10 px-3 py-1 text-sm font-semibold text-primary"
												key={task}
											>
												{task}
											</li>
										))}
									</ul>
								</div>
							</article>
						);
					})}
				</div>
			</section>

			{/* Aktuell gesucht — a job board whose postings open, next to the three steps */}
			<section className="relative z-0 bg-background-low-contrast" id="aktuell-gesucht">
				<div className={downloadStyles.bg} />
				<div className={downloadStyles.bgBalls} />

				<div className="container py-10 md:py-28 lg:grid lg:grid-cols-[4fr_8fr] lg:gap-16">
					<div className="self-start lg:sticky lg:top-36">
						<SectionHeader
							isCenteredOnDesktop={false}
							subTitle={OPENINGS_SECTION.subtitle}
							title={OPENINGS_SECTION.title}
							isCentered
						>
							{OPENINGS_SECTION.intro}
						</SectionHeader>

						<ol className="mt-10 flex flex-col gap-6 border-t pt-8">
							{STEPS.map(({ text, title }, index) => (
								<li className="flex gap-4" key={title}>
									<span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-serif text-xl text-primary-foreground">
										{index + 1}
									</span>
									<span>
										<span className="block font-serif text-xl uppercase">{title}</span>
										<span className="block text-sm md:text-base">{text}</span>
									</span>
								</li>
							))}
						</ol>
					</div>

					<div className="mt-12 flex flex-col gap-4 lg:mt-0">
						<Accordion defaultValue={[OPENINGS[0]?.title]} multiple={false}>
							{OPENINGS.map(({ area, effort, offer, profile, tasks, teaser, title }) => (
								<AccordionItem key={title} value={title}>
									<AccordionTrigger>
										<span className="flex flex-col gap-2 text-left md:flex-row md:items-center md:gap-6">
											<span className="font-serif text-2xl uppercase md:text-3xl">{title}</span>
											<span className="flex flex-wrap gap-2">
												<Badge className={BADGE_CLASS_NAME}>{area}</Badge>
												<Badge className={BADGE_CLASS_NAME} variant="ghost">
													<Clock aria-hidden="true" />
													{effort}
												</Badge>
											</span>
										</span>
									</AccordionTrigger>
									<AccordionContent>
										<p className="md:text-lg">{teaser}</p>
										<div className="mt-6 grid gap-6 md:grid-cols-3">
											{(
												[
													['Deine Aufgaben', tasks],
													['Das bringst du mit', profile],
													['Das bieten wir', offer],
												] as const
											).map(([heading, items]) => (
												<DetailList heading={heading} items={items} key={heading} />
											))}
										</div>
										<div className="mt-8">
											<ButtonLink href={getMailHref(board, `${MAIL_SUBJECT}: ${title}`)} size="sm">
												Jetzt melden
											</ButtonLink>
										</div>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>

						<a
							className={cn(
								'flex items-center gap-4 rounded-xl border-2 border-dashed border-primary/30 p-6 text-primary',
								'transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground',
							)}
							href={mailHref}
						>
							<Plus aria-hidden="true" className="size-8 shrink-0" />
							<span>
								<span className="block font-serif text-2xl uppercase">Nichts Passendes dabei?</span>
								<span className="block text-sm md:text-base">
									Erzähl uns, was du dir vorstellen kannst – wir finden etwas für dich.
								</span>
							</span>
						</a>
					</div>
				</div>
			</section>

			{/* Ansprechpartner — the board as portrait cards on the yellow band */}
			<section className="bg-secondary text-secondary-foreground">
				<div className="container py-10 md:py-28">
					<SectionHeader
						descriptionClassName="text-secondary-foreground"
						subTitle={CONTACT.subtitle}
						title={CONTACT.title}
						isCentered
						isCenteredOnDesktop
					>
						{CONTACT.intro}
					</SectionHeader>

					<ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:mt-20 xl:grid-cols-4">
						{board.map((person) => {
							const phone = person.phone ?? undefined;
							const showPhone =
								phone && (person.contactAs === 'phone' || person.contactAs === 'both');
							const showWhatsapp =
								phone && (person.contactAs === 'whatsapp' || person.contactAs === 'both');
							return (
								<li
									className="flex flex-col items-center gap-4 rounded-xl bg-background p-6 text-center text-foreground shadow-lg"
									key={person._id}
								>
									<Portrait
										className="size-32 border-4 border-primary text-4xl"
										firstName={person.firstName}
										image={person.image}
										lastName={person.lastName}
										sizes={`${PORTRAIT_SIZE}px`}
										sourceSize={PORTRAIT_SIZE}
									/>
									<div>
										<h3 className="font-serif text-2xl md:text-3xl">
											{person.firstName} {person.lastName}
										</h3>
										<p className="text-sm text-muted-foreground md:text-base">{person.role}</p>
									</div>
									<p className="line-clamp-4 flex-1 text-sm">{person.taskDescription}</p>
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
