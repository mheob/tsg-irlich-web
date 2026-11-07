// PROTOTYPE (WEB-326) — throwaway copy for the sponsor page variants. Nothing here is final text;
// once a variant wins, the texts move into a Sanity singleton and this file goes away.

import {
	Fence,
	Gift,
	Globe,
	Handshake,
	HeartHandshake,
	MapPin,
	Shirt,
	TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Reason {
	icon: LucideIcon;
	text: string;
	title: string;
}

export interface Way {
	benefits: string[];
	icon: LucideIcon;
	text: string;
	title: string;
}

export const HERO = {
	subtitle: 'Gemeinsam stark',
	title: 'Sponsoren & Partner',
};

export const WHY = {
	intro:
		'Mit deinem Engagement unterstützt du nicht nur einen Verein. Du förderst Sport, Gemeinschaft und die Zukunft von Kindern und Jugendlichen in Irlich und Neuwied.',
	subtitle: 'Warum Sponsor bei der TSG werden?',
	title: 'Mehr als nur ein Logo',
};

export const REASONS: Reason[] = [
	{
		icon: MapPin,
		text: 'Dein Unternehmen ist dort präsent, wo sich Irlich trifft: am Spielfeldrand, auf den Trikots und bei unseren Festen.',
		title: 'Regionale Sichtbarkeit',
	},
	{
		icon: TrendingUp,
		text: 'Über 100.000 Aufrufe im Monat auf Social Media, dazu Website und Newsletter. Das erreicht mehr Menschen als eine Bande allein.',
		title: 'Reichweite online',
	},
	{
		icon: HeartHandshake,
		text: 'Dein Beitrag fließt direkt in Training, Material und Nachwuchsarbeit. So zeigst du Verantwortung für die Region.',
		title: 'Positives Image',
	},
	{
		icon: Handshake,
		text: 'Wir setzen auf Verlässlichkeit statt Einmal-Aktionen und finden gemeinsam das Paket, das zu dir passt.',
		title: 'Langfristige Partnerschaft',
	},
];

export const WAYS_SECTION = {
	intro:
		'Ob kleiner Betrieb oder großes Unternehmen: Jede Unterstützung hilft. Gemeinsam finden wir die Form, die zu dir passt.',
	subtitle: 'So kannst du uns unterstützen',
	title: 'Viele Wege, ein Ziel',
};

export const WAYS: Way[] = [
	{
		benefits: [
			'Logo auf einem Trikotsatz',
			'Mannschaftsfoto für deine Kanäle',
			'Nennung auf der Website',
		],
		icon: Shirt,
		text: 'Dein Logo auf den Trikots einer Mannschaft, sichtbar bei jedem Spiel und jedem Turnier.',
		title: 'Trikotwerbung',
	},
	{
		benefits: [
			'Bande in bester Sichtlage',
			'Präsenz bei jedem Heimspiel',
			'Nennung auf der Website',
		],
		icon: Fence,
		text: 'Eine Werbebande an unserem Sportplatz, bei jedem Heimspiel und jedem Training im Blick.',
		title: 'Bandenwerbung',
	},
	{
		benefits: [
			'Logo mit Link auf dieser Seite',
			'Erwähnung im Newsletter',
			'Beitrag auf Social Media',
		],
		icon: Globe,
		text: 'Dein Logo mit Link auf unserer Website und im Newsletter, das ganze Jahr über.',
		title: 'Online-Partner',
	},
	{
		benefits: [
			'Bälle und Trainingsmaterial',
			'Ausrüstung für Teams und Kurse',
			'Verpflegung bei Festen',
		],
		icon: Gift,
		text: 'Material, Ausrüstung oder Verpflegung für unsere Veranstaltungen. Jede Hilfe zählt.',
		title: 'Sachspenden',
	},
];

export const PARTNERS = {
	intro: 'Danke an alle Unternehmen, die unsere Vereinsarbeit möglich machen.',
	subtitle: 'Unsere Partner und Sponsoren',
	title: 'Stark an unserer Seite',
};

export const CONTACT = {
	intro:
		'Fragen zum Sponsoring oder eine eigene Idee? Unser PR-Team meldet sich persönlich bei dir.',
	subtitle: 'Ansprechpartner',
	title: 'Dein Draht zum PR-Team',
};

export const MAIL_SUBJECT = 'Sponsoring bei der TSG Irlich';
