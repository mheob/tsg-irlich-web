/**
 * The icons an editor can choose for a card on a single page (the partner page, the volunteer
 * page): the studio offers them as a list, the web app maps each value to its Lucide component.
 * Values are the kebab-case names of lucide.dev/icons. A value is stored in the documents, so an
 * entry may be added but never renamed or removed while a page still uses it.
 */
const PAGE_ICONS = [
	{ title: 'Ort', value: 'map-pin' },
	{ title: 'Reichweite', value: 'trending-up' },
	{ title: 'Engagement', value: 'heart-handshake' },
	{ title: 'Partnerschaft', value: 'handshake' },
	{ title: 'Trikot', value: 'shirt' },
	{ title: 'Bande', value: 'fence' },
	{ title: 'Website', value: 'globe' },
	{ title: 'Geschenk', value: 'gift' },
	{ title: 'Pokal', value: 'trophy' },
	{ title: 'Megafon', value: 'megaphone' },
	{ title: 'Gruppe', value: 'users' },
	{ title: 'Herz', value: 'heart' },
	{ title: 'Stern', value: 'star' },
	{ title: 'Doktorhut', value: 'graduation-cap' },
	{ title: 'Glühbirne', value: 'lightbulb' },
	{ title: 'Auszeichnung', value: 'award' },
	{ title: 'Hantel', value: 'dumbbell' },
	{ title: 'Flagge', value: 'flag' },
	{ title: 'Gebäude', value: 'building-2' },
	{ title: 'Party', value: 'party-popper' },
] as const;

type PageIconName = (typeof PAGE_ICONS)[number]['value'];

export { PAGE_ICONS };
export type { PageIconName };
