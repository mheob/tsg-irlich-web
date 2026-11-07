// PROTOTYPE (WEB-190) — throwaway copy for the volunteering page variants. Nothing here is final
// text; once a variant wins, the texts and the open positions move into Sanity and this file goes
// away.

import {
	Award,
	Building2,
	Dumbbell,
	Flag,
	GraduationCap,
	Heart,
	Lightbulb,
	PartyPopper,
	Trophy,
	Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Reason {
	icon: LucideIcon;
	text: string;
	title: string;
}

export interface Area {
	icon: LucideIcon;
	imageKey: string;
	tasks: string[];
	text: string;
	title: string;
}

export interface Opening {
	area: string;
	effort: string;
	imageKey: string;
	offer: string[];
	profile: string[];
	tasks: string[];
	teaser: string;
	title: string;
}

export interface Voice {
	quote: string;
	role: string;
}

export interface Step {
	text: string;
	title: string;
}

export const MAIL_SUBJECT = 'Ehrenamt bei der TSG Irlich';

export const HERO = {
	subtitle: 'Ehrenamt bei der TSG',
	title: 'Engagiere dich',
};

export const STATEMENT = 'Ohne Ehrenamt kein Verein – seit 1882.';

export const WHY = {
	intro:
		'Ehrenamt bedeutet nicht nur, Aufgaben zu übernehmen. Du wirst Teil einer starken Gemeinschaft, entwickelst dich weiter und hältst unseren Verein lebendig – auf und neben dem Platz.',
	subtitle: 'Warum engagieren?',
	title: 'Gemeinsam mehr erreichen',
};

export const REASONS: Reason[] = [
	{
		icon: Users,
		text: 'Du lernst Menschen aus allen Abteilungen kennen und wirst Teil eines Teams, das zusammenhält.',
		title: 'Gemeinschaft',
	},
	{
		icon: GraduationCap,
		text: 'Du sammelst Erfahrung, übernimmst Verantwortung und kannst Lizenzen und Fortbildungen machen.',
		title: 'Persönliche Entwicklung',
	},
	{
		icon: Heart,
		text: 'Du tust etwas Gutes – für Kinder und Jugendliche, für den Verein und für Irlich.',
		title: 'Sinn stiften',
	},
	{
		icon: Trophy,
		text: 'Du machst Training, Spiele und Kurse erst möglich und begleitest unsere Sportler auf ihrem Weg.',
		title: 'Sport fördern',
	},
	{
		icon: Lightbulb,
		text: 'Du gestaltest mit, bringst neue Impulse ein und entwickelst den Verein aktiv weiter.',
		title: 'Ideen einbringen',
	},
	{
		icon: Award,
		text: 'Dein Einsatz wird gesehen und macht einen echten Unterschied – im Verein und in der Region.',
		title: 'Wertschätzung',
	},
];

export const VOICES_SECTION = {
	intro: 'Warum wir uns bei der TSG engagieren – in unseren eigenen Worten.',
	subtitle: 'Stimmen aus dem Verein',
	title: 'Darum machen wir mit',
};

// Placeholder quotes: the real page needs real people who agree to be quoted.
export const VOICES: Voice[] = [
	{
		quote:
			'Wenn die Kleinen nach der Turnstunde strahlend nach Hause gehen, weiß ich, wofür ich das mache.',
		role: 'Übungsleiterin Kinderturnen',
	},
	{
		quote:
			'Ich habe als Spieler angefangen und pfeife heute selbst. Den Fußball von dieser Seite zu erleben, hat mich ruhiger und selbstbewusster gemacht.',
		role: 'Schiedsrichter',
	},
	{
		quote:
			'Beim Sportfest helfe ich nur ein paar Stunden im Jahr – und trotzdem fühle ich mich als Teil der TSG.',
		role: 'Helferin bei Veranstaltungen',
	},
];

export const WAYS_SECTION = {
	intro:
		'Ehrenamt bei der TSG ist vielfältig. Ob regelmäßig oder nur ab und zu, auf dem Platz oder im Hintergrund – jeder Beitrag zählt.',
	subtitle: 'Viele Aufgaben – ein Ziel',
	title: 'So kannst du dich einbringen',
};

export const AREAS: Area[] = [
	{
		icon: Dumbbell,
		imageKey: '1-mannschaft',
		tasks: ['Training leiten oder unterstützen', 'Mannschaften begleiten', 'Kurse betreuen'],
		text: 'Als Trainer, Übungsleiterin oder Betreuer begleitest du eine Mannschaft oder Gruppe – vom Kinderturnen bis zu den Alten Herren.',
		title: 'Sport & Mannschaften',
	},
	{
		icon: Flag,
		imageKey: 'a-jugend',
		tasks: ['Spiele leiten', 'Spieltage organisieren', 'Platz und Material betreuen'],
		text: 'Ohne Schiedsrichter kein Spiel. Du pfeifst selbst, hilfst am Spieltag oder kümmerst dich um Platz und Organisation.',
		title: 'Schiedsrichter & Spielbetrieb',
	},
	{
		icon: Building2,
		imageKey: 'fallback',
		tasks: ['Mitglieder und Finanzen', 'Social Media und TSG-Echo', 'Sponsoring'],
		text: 'Hinter jedem Training steckt Organisation. Du unterstützt den Vorstand bei Verwaltung, Finanzen oder Öffentlichkeitsarbeit.',
		title: 'Verein & Organisation',
	},
	{
		icon: PartyPopper,
		imageKey: 'vision',
		tasks: ['Auf- und Abbau', 'Verpflegung und Kasse', 'Orga-Team'],
		text: 'Ob Sportfest, Turnier oder Weihnachtsfeier – bei unseren Veranstaltungen zählt jede helfende Hand, auch nur für ein paar Stunden.',
		title: 'Veranstaltungen & Helfer',
	},
];

export const OPENINGS_SECTION = {
	intro:
		'Für einige Bereiche freuen wir uns aktuell besonders über Unterstützung. Vielleicht ist ja genau die richtige Aufgabe für dich dabei?',
	subtitle: 'Aktuell gesucht',
	title: 'Wir suchen Verstärkung',
};

export const OPENINGS: Opening[] = [
	{
		area: 'Kinderturnen',
		effort: 'wöchentlich, ca. 2 Std.',
		imageKey: 'kinderturnen-ab-3',
		offer: [
			'Unterstützung bei Lizenz und Fortbildung',
			'Ein herzliches Team',
			'Raum für eigene Ideen',
		],
		profile: ['Freude an der Arbeit mit Kindern', 'Zuverlässigkeit', 'Turnerfahrung ist kein Muss'],
		tasks: [
			'Turnstunden mitgestalten',
			'Geräte auf- und abbauen',
			'Die Übungsleiterin unterstützen',
		],
		teaser:
			'Für unser Kinderturnen suchen wir Unterstützung bei der Gestaltung und Durchführung der Turnstunden für Kinder von 3 bis 6 Jahren.',
		title: 'Übungsleiter/in Kinderturnen',
	},
	{
		area: 'Fußball',
		effort: '2× pro Woche + Spieltage',
		imageKey: 'f-jugend',
		offer: ['Einstieg ins Trainerteam', 'Trainerlehrgänge', 'Teamkleidung'],
		profile: ['Spaß am Fußball', 'Geduld mit Kindern', 'Zeit am Wochenende'],
		tasks: ['Training mitgestalten', 'Kinder zu Spielen begleiten', 'Eltern als Ansprechpartner'],
		teaser:
			'Unsere F-Jugend wächst. Du unterstützt das Trainerteam im Training und begleitest die Kinder zu ihren Spielen am Wochenende.',
		title: 'Co-Trainer/in F-Jugend',
	},
	{
		area: 'Fußball',
		effort: 'nach Absprache',
		imageKey: 'schiedsrichter',
		offer: ['Neulingslehrgang', 'Pate für die ersten Spiele', 'Aufwandsentschädigung'],
		profile: ['Interesse am Fußball', 'Mut zu Entscheidungen', 'Fairness'],
		tasks: ['Spiele im Kreis leiten', 'Regelkunde auffrischen', 'Den Verein vertreten'],
		teaser:
			'Jeder Verein muss Schiedsrichter stellen. Wir begleiten dich durch den Lehrgang und bei deinen ersten Spielen – Jugendliche und Erwachsene sind willkommen.',
		title: 'Schiedsrichter/in',
	},
	{
		area: 'Vereinsorganisation',
		effort: 'nach Absprache',
		imageKey: 'fallback',
		offer: [
			'Einblick in die Vereinsarbeit',
			'Flexible Zeiteinteilung',
			'Ein offenes Vorstandsteam',
		],
		profile: ['Organisationstalent', 'Lust auf Verantwortung', 'Teamgeist'],
		tasks: ['Verwaltung und Finanzen', 'Öffentlichkeitsarbeit', 'Projekte im Verein'],
		teaser:
			'Du möchtest nicht auf dem Platz stehen, sondern den Verein organisatorisch voranbringen? Im Vereinsmanagement gibt es viele Möglichkeiten.',
		title: 'Unterstützung im Vorstand',
	},
];

export const STEPS: Step[] = [
	{
		text: 'Per E-Mail, Telefon oder direkt beim Training. Sag uns kurz, was dich interessiert.',
		title: 'Melde dich',
	},
	{
		text: 'Wir treffen uns unverbindlich und finden gemeinsam die Aufgabe, die zu dir passt.',
		title: 'Lerne uns kennen',
	},
	{
		text: 'Du startest in deinem Tempo – mit festen Ansprechpartnern an deiner Seite.',
		title: 'Leg los',
	},
];

export const IDEA = {
	text: 'Nicht jede Aufgabe lässt sich in einer Ausschreibung beschreiben. Wenn du eine Idee hast, wie du dich bei der TSG engagieren möchtest, sprich uns einfach an. Wir freuen uns auf deine Nachricht!',
	title: 'Du hast eine Idee oder möchtest dich anders einbringen?',
};

export const CONTACT = {
	intro:
		'Du hast Fragen zum Ehrenamt oder möchtest direkt loslegen? Unser Vorstand freut sich auf dich.',
	subtitle: 'Ansprechpartner',
	title: 'Dein Vorstand',
};
