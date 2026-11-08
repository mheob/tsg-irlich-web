import { defineField } from 'sanity';

import { DOSB_ICONS } from '@tsgi-web/shared';

import { CLUB_ICON_NAMES } from '@/utils/preview-icon';

/**
 * The optional icon of a news category: a DOSB pictogram for a sport, or a club icon for news that
 * no sport fits. The studio shows it in every list of categories.
 */
const newsCategoryIconField = defineField({
	description:
		'Optional. Zeigt die Kategorie im Studio mit einem Bild, damit sie in der Liste schneller zu finden ist. Für eine Sportart ein Sportdeutschland-Piktogramm, sonst eines der Vereins-Icons (Gesamtverein, Historie, Presse, Soziales, Veranstaltungen).',
	group: 'general',
	name: 'icon',
	options: {
		list: [...DOSB_ICONS, ...CLUB_ICON_NAMES].map((icon) => ({ title: icon, value: icon })),
	},
	title: 'Icon',
	type: 'string',
});

export { newsCategoryIconField };
