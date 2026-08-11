import { Body, Container, Head, Html, Preview, Section, Tailwind, Text } from 'react-email';

import { CtaBand } from '../components/newsletter/cta-band';
import { LeadStory } from '../components/newsletter/lead-story';
import { NewsGrid } from '../components/newsletter/news-grid';
import { NewsletterFooter } from '../components/newsletter/newsletter-footer';
import { NewsletterHeader } from '../components/newsletter/newsletter-header';
import { SponsorCard } from '../components/newsletter/sponsor-card';
import { UpcomingEvents } from '../components/newsletter/upcoming-events';
import { CrHtml, TemplateModeProvider } from '../lib/cleverreach-tags';
import { tailwindConfig } from '../tailwind-config';

const SALUTATION = 'Hallo TSG-Familie!';

const BASE_URL = 'https://www.tsg-irlich.de';

/**
 * Stacks the two column news grid on narrow screens. Written by hand because
 * react-email inlines Tailwind's responsive variants without their media query,
 * which would apply the mobile styles to every client.
 */
const responsiveStyles = `
@media only screen and (max-width: 620px) {
	.email-container { width: 100% !important; }
	.stack { display: block !important; width: 100% !important; }
	.stack-gap { padding-top: 32px !important; }
	.gutter { display: none !important; }
	img { max-width: 100% !important; height: auto !important; }
}
`;

function placeholderImage(size: string, text: string) {
	return `https://placehold.co/${size}/332c61/ffd404/png?text=${text}`;
}

const defaultCta = {
	buttonLabel: 'Mitglied werden',
	href: `${BASE_URL}/mitgliedschaft`,
	text: 'Viele Abteilungen, ein Verein. Finde dein Angebot und werde Teil der TSG Irlich.',
	title: 'Werde Teil der TSG',
};

// The template ships a single event; the CleverReach editor duplicates it as needed.
const defaultEvents = [
	{
		day: '12',
		meta: 'Pappelstadion · 14:00 Uhr',
		month: 'Aug',
		title: 'Sommerfest der TSG',
		weekday: 'Mi',
	},
];

const defaultLeadStory = {
	href: `${BASE_URL}/news`,
	imageUrl: placeholderImage('600x315', 'Titelstory'),
	kicker: 'Titelstory',
	teaser:
		'Nach einer starken Saison steigt unsere erste Mannschaft auf. Wir blicken zurück auf die entscheidenden Wochen, sprechen mit dem Trainerteam und schauen voraus auf die neue Liga.',
	title: 'Aufstieg perfekt gemacht',
};

// One row of two cards is the duplicatable news element, so the template ships exactly that.
const defaultNews = [
	{
		category: 'Fußball',
		href: `${BASE_URL}/news`,
		imageUrl: placeholderImage('256x144', 'News+1'),
		teaser: 'Die neue Trainingsrunde startet nach den Ferien mit erweiterten Zeiten.',
		title: 'Neue Trainingszeiten ab August',
	},
	{
		category: 'Handball',
		href: `${BASE_URL}/news`,
		imageUrl: placeholderImage('256x144', 'News+2'),
		teaser: 'Unsere Damenmannschaft verstärkt sich für die kommende Spielzeit.',
		title: 'Zwei Neuzugänge für die Damen',
	},
];

const defaultSocials = [
	{ href: 'https://www.instagram.com', label: 'Instagram' },
	{ href: 'https://www.facebook.com', label: 'Facebook' },
	{ href: 'https://www.youtube.com', label: 'YouTube' },
];

const defaultSponsor = {
	href: `${BASE_URL}/sponsoren`,
	logoUrl: placeholderImage('160x60', 'Sponsor'),
	name: 'Musterfirma GmbH',
	text: 'Die Musterfirma GmbH unterstützt unsere Jugendabteilung seit 2019 und macht damit Training und Ausrüstung für viele Kinder möglich.',
};

interface NewsletterEmailProps {
	baseUrl?: string;
	cta?: typeof defaultCta;
	events?: typeof defaultEvents;
	intro?: string;
	/** Adds the CleverReach editor markup. Use `renderNewsletterTemplate` instead of setting it by hand. */
	isTemplate?: boolean;
	issueLabel?: string;
	leadStory?: typeof defaultLeadStory;
	news?: typeof defaultNews;
	previewText?: string;
	socials?: typeof defaultSocials;
	sponsor?: typeof defaultSponsor;
}

export function NewsletterEmail({
	baseUrl = BASE_URL,
	cta = defaultCta,
	events = defaultEvents,
	intro = 'Hier kommen die wichtigsten Neuigkeiten aus dem Verein, die nächsten Termine und ein Blick auf das, was uns in den kommenden Wochen erwartet.',
	isTemplate = false,
	issueLabel = 'Newsletter · Juli 2026',
	leadStory = defaultLeadStory,
	news = defaultNews,
	previewText = 'Aufstieg perfekt gemacht, alle Termine und die News aus den Abteilungen.',
	socials = defaultSocials,
	sponsor = defaultSponsor,
}: Readonly<NewsletterEmailProps>) {
	return (
		<TemplateModeProvider isTemplate={isTemplate}>
			<Html dir="ltr" lang="de">
				{/* `Tailwind` has to wrap `Head` so it can inject the responsive styles there. */}
				<Tailwind config={tailwindConfig}>
					<Head>
						<meta content="light" name="color-scheme" />
						<meta content="light" name="supported-color-schemes" />
						<style>{responsiveStyles}</style>
					</Head>

					<Preview>{previewText}</Preview>

					<Body className="m-0 bg-background-low-contrast p-0 font-sans">
						<Container className="email-container mx-auto my-[24px] w-[600px] max-w-full overflow-hidden rounded-[8px] bg-background p-0">
							<NewsletterHeader baseUrl={baseUrl} issueLabel={issueLabel} />

							<Section className="px-[32px] pt-[32px]">
								<CrHtml>
									<Text className="m-0 font-sans text-[15px] leading-[24px] text-foreground">
										{SALUTATION}
									</Text>
								</CrHtml>
								<CrHtml>
									<Text className="m-0 mt-[12px] font-sans text-[15px] leading-[24px] text-muted-foreground">
										{intro}
									</Text>
								</CrHtml>
							</Section>

							<Section className="pt-[32px]">
								<LeadStory leadStory={leadStory} />
							</Section>

							<UpcomingEvents events={events} />

							<NewsGrid news={news} />

							<SponsorCard sponsor={sponsor} />

							<CtaBand cta={cta} />

							<NewsletterFooter baseUrl={baseUrl} socials={socials} />
						</Container>
					</Body>
				</Tailwind>
			</Html>
		</TemplateModeProvider>
	);
}

export default NewsletterEmail;
