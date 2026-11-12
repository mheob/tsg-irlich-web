/**
 * The icons a card of the partner page can show: the studio offers them as a list, the web app
 * maps each value to its Lucide component. Values are the kebab-case names of lucide.dev/icons.
 */
const PARTNER_ICONS = [
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
] as const;

type PartnerIconName = (typeof PARTNER_ICONS)[number]['value'];

export { PARTNER_ICONS };
export type { PartnerIconName };
