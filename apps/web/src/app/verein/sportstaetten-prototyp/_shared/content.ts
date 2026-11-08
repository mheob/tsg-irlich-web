// PROTOTYPE (WEB-149) — throwaway copy for the venue page variants. Everything here is placeholder
// text: names, addresses, descriptions, images and the groups come from Sanity, the rest moves into
// new venue fields or a page singleton once a variant has won.

import { Bike, Bus, Car } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ArrivalOption {
	icon: LucideIcon;
	text: string;
	title: string;
}

export const HERO = {
	subtitle: 'Hier spielt die TSG',
	title: 'Sportstätten',
};

export const HOME = {
	intro:
		'Im Pappelstadion schlägt das Herz der TSG: Hier trainieren und spielen unsere Fußballteams, und gleich nebenan trifft sich der ganze Verein im Pappelstübchen.',
	subtitle: 'Unsere Heimat',
	title: 'Pappelstadion & Pappelstübchen',
};

export const STADIUM_FEATURES = [
	'Aschenplatz in Großfeldgröße',
	'Flutlicht für Training und Spiele',
	'Umkleiden und Duschen',
	'Zuschauerbereich am Spielfeldrand',
	'Vereinsheim direkt angrenzend',
];

export const CLUBHOUSE = {
	features: [
		'Treffpunkt nach Training und Spiel',
		'Saal für Feiern und Versammlungen',
		'Terrasse mit Blick auf den Platz',
		'Heimspiele live und gemeinsam',
	],
	hours: [
		{ days: 'Dienstag bis Freitag', time: 'ab 17 Uhr' },
		{ days: 'Samstag und Sonntag', time: 'zu den Heimspielen' },
	],
	rentText: 'Geburtstag, Jubiläum oder Mannschaftsfeier? Das Pappelstübchen kann gemietet werden.',
	typeLabel: 'Vereinsheim',
};

export const ARTIFICIAL_TURF = {
	text: 'Seit vielen Jahren kämpfen wir für einen Kunstrasenplatz im Pappelstadion. Er würde den Spielbetrieb wetterunabhängig machen und unseren Nachwuchs stärken.',
	title: 'Unser Traum: Kunstrasen',
};

export const OTHERS = {
	intro:
		'Nicht alle Gruppen passen ins Pappelstadion. Unsere Kurse, die Breitensportgruppen und viele Jugendteams trainieren in Hallen und auf Plätzen in Irlich und der Nachbarschaft.',
	subtitle: 'Alle weiteren Sportanlagen',
	title: 'Hier sind wir außerdem aktiv',
};

export const ARRIVAL = {
	intro: 'So kommst du am besten zum Pappelstadion in der Gotenstraße.',
	options: [
		{
			icon: Car,
			text: 'Parkplätze findest du direkt an der Gotenstraße und in den Seitenstraßen.',
			title: 'Mit dem Auto',
		},
		{
			icon: Bus,
			text: 'Die nächste Bushaltestelle liegt nur wenige Gehminuten entfernt.',
			title: 'Mit Bus und Bahn',
		},
		{
			icon: Bike,
			text: 'Fahrräder kannst du am Eingang zum Vereinsheim abstellen.',
			title: 'Mit dem Fahrrad',
		},
	] satisfies ArrivalOption[],
	subtitle: 'Anfahrt',
	title: 'So findest du uns',
};

export const CONTACT = {
	intro:
		'Fragen zu unseren Sportstätten, zur Nutzung oder eine Idee für den Platz? Der Vorstand ist gern für dich da.',
	subtitle: 'Ansprechpartner',
	title: 'Dein Draht zum Vorstand',
};

export const MAIL_SUBJECT = 'Frage zu den Sportstätten der TSG Irlich';
export const RENT_SUBJECT = 'Anfrage: Pappelstübchen mieten';
